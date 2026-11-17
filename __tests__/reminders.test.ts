import { classUp, classRank } from '../src/lib/classes';
import { newlyUnlocked } from '../src/lib/eventView';
import { checkIn, moveOn } from '../src/lib/events';
import { DEFAULT_FILTER } from '../src/lib/invites';
import {
  dedupeNotices,
  dueReminders,
  MAX_SCHEDULED,
  movedOnReminder,
  planReminders,
  remindersFor,
  stableNoticeKey,
  upcomingReminders,
} from '../src/lib/reminders';
import type { Crew, NightEvent } from '../src/lib/types';

const NOW = new Date('2026-11-20T18:00:00Z');
const mins = (m: number) => new Date(NOW.getTime() + m * 60_000);
const crews: Crew[] = [{ id: 'c1', name: 'Crew', tag: 'C', memberIds: ['crewmate', 'plain'], ownerId: 'crewmate', hostIds: [] }];

function meet(overrides: Partial<NightEvent> = {}): NightEvent {
  return {
    id: 'e1', type: 'meet', title: 'Late meet', startsAt: mins(240).toISOString(),
    area: { lat: 52.6, lng: -1.7 }, areaName: 'Tamworth',
    stops: [{ id: 's1', name: 'Secret car park', at: { lat: 52.6, lng: -1.7 } }],
    currentStop: 0, revealMinutesBefore: 120, hostIds: ['host'], crewId: 'c1',
    filter: DEFAULT_FILTER, going: ['me'], checkIns: {}, ...overrides,
  };
}

describe('which reminders an event needs', () => {
  test('going: one at the reveal and one 30 min before the start', () => {
    const r = remindersFor(meet(), 'me', crews);
    expect(r.map((x) => x.kind)).toEqual(['reveal', 'soon']);
    expect(r[0].at).toEqual(mins(120));
    expect(r[1].at).toEqual(mins(210));
    expect(r.every((x) => x.url === '/event/e1')).toBe(true);
  });

  test('never names the stop on the lock screen', () => {
    for (const r of remindersFor(meet(), 'me', crews)) {
      expect(r.title + r.body).not.toContain('Secret car park');
    }
  });

  test('hosts (including the crew owner) get them too, with host wording', () => {
    const r = remindersFor(meet({ going: [] }), 'crewmate', crews);
    expect(r).toHaveLength(2);
    expect(r[0].body).toMatch(/People going can now see/);
  });

  test('nothing if not going, or cancelled', () => {
    expect(remindersFor(meet({ going: [] }), 'me', crews)).toEqual([]);
    expect(remindersFor(meet({ cancelled: true }), 'me', crews)).toEqual([]);
  });

  test('public events and a reveal at check-in time only get the start reminder', () => {
    expect(remindersFor(meet({ type: 'show' }), 'me', crews).map((x) => x.kind)).toEqual(['soon']);
    expect(remindersFor(meet({ revealMinutesBefore: 30 }), 'me', crews).map((x) => x.kind)).toEqual(['soon']);
    expect(remindersFor(meet({ revealMinutesBefore: 0 }), 'me', crews).map((x) => x.kind)).toEqual(['soon']);
  });

  test('editing the time or title changes the schedule id, so it reschedules', () => {
    const [a] = remindersFor(meet(), 'me', crews);
    const [b] = remindersFor(meet({ startsAt: mins(300).toISOString() }), 'me', crews);
    const [c] = remindersFor(meet({ title: 'Renamed' }), 'me', crews);
    expect(new Set([a.scheduleId, b.scheduleId, c.scheduleId]).size).toBe(3);
    expect(remindersFor(meet(), 'me', crews)[0].scheduleId).toBe(a.scheduleId);
  });

  test('the list key is the event and kind only, so moving the time keeps it', () => {
    const [a, a2] = remindersFor(meet(), 'me', crews);
    const [b, b2] = remindersFor(meet({ startsAt: mins(300).toISOString() }), 'me', crews);
    expect(a.key).toBe('ns.e1.reveal');
    expect(b.key).toBe(a.key);
    expect(a2.key).toBe('ns.e1.soon');
    expect(b2.key).toBe(a2.key);
  });

  test('only future reminders are scheduled, soonest first', () => {
    const events = [meet({ id: 'late', startsAt: mins(600).toISOString() }), meet({ startsAt: mins(60).toISOString() })];
    const up = upcomingReminders(events, 'me', crews, NOW);
    // e1's reveal (at -60) has passed; its start reminder (+30) has not.
    expect(up.map((r) => `${r.eventId}:${r.kind}`)).toEqual(['e1:soon', 'late:reveal', 'late:soon']);
  });
});

describe('planning what to schedule', () => {
  const wanted = remindersFor(meet(), 'me', crews);

  test('adds what is missing and cancels what is no longer wanted', () => {
    const plan = planReminders(['ns.old.soon.x.y', wanted[0].scheduleId, 'someone-elses-id'], wanted);
    expect(plan.cancel).toEqual(['ns.old.soon.x.y']);
    expect(plan.schedule.map((r) => r.key)).toEqual([wanted[1].key]);
  });

  test('dropping out cancels everything', () => {
    const plan = planReminders(wanted.map((r) => r.scheduleId), []);
    expect(plan.cancel).toHaveLength(2);
    expect(plan.schedule).toHaveLength(0);
  });

  test('keeps under the iOS limit', () => {
    const many = Array.from({ length: 40 }, (_, i) => meet({ id: `e${i}` })).flatMap((e) => remindersFor(e, 'me', crews));
    expect(planReminders([], many).schedule).toHaveLength(MAX_SCHEDULED);
  });
});

describe('in-app list catches up on reminders', () => {
  test('due reminders appear once, and not when stale', () => {
    const e = meet({ startsAt: mins(60).toISOString() }); // reveal at -60, soon at +30
    const due = dueReminders([e], 'me', crews, NOW, new Set());
    expect(due.map((r) => r.kind)).toEqual(['reveal']);
    expect(dueReminders([e], 'me', crews, NOW, new Set([due[0].key]))).toEqual([]);
    expect(dueReminders([e], 'me', crews, mins(60 * 24), new Set())).toEqual([]);
  });

  test('the same reminder after the demo shifts its times is not added again', () => {
    const e = meet({ startsAt: mins(60).toISOString() });
    const [first] = dueReminders([e], 'me', crews, NOW, new Set());
    const shifted = meet({ startsAt: mins(75).toISOString() });
    expect(dueReminders([shifted], 'me', crews, mins(15), new Set([first.key]))).toEqual([]);
  });

  test('reminders from before the person joined are not news', () => {
    const e = meet({ startsAt: mins(60).toISOString() }); // reveal at -60
    expect(dueReminders([e], 'me', crews, NOW, new Set(), mins(-30))).toEqual([]);
    expect(dueReminders([e], 'me', crews, NOW, new Set(), mins(-90))).toHaveLength(1);
  });
});

describe('cleaning up older notice lists', () => {
  test('time-based keys become stable and repeats go, newest kept', () => {
    const list = [
      { id: 'a', key: 'ns.ev-rolling-host.soon.mwk0ubvv.1abc' },
      { id: 'b', key: 'ns.ev-rolling-host.soon.mwk0s2rj.1abc' },
      { id: 'c', key: 'ns.ev-x.moved.mwk0s2rj.zz' },
      { id: 'd', key: 'ns.ev-x.moved.mwk0aaaa.zz' },
      { id: 'e' },
      { id: 'f', key: 'ns.ev-rolling-host.soon' },
    ];
    const out = dedupeNotices(list);
    expect(out.map((n) => n.id)).toEqual(['a', 'c', 'd', 'e']);
    expect(out[0].key).toBe('ns.ev-rolling-host.soon');
    expect(stableNoticeKey('ns.ev-1.reveal.abc.def')).toBe('ns.ev-1.reveal');
  });
});

describe('moved on', () => {
  function rolling(): NightEvent {
    return meet({
      type: 'rolling', startsAt: mins(-30).toISOString(),
      stops: [
        { id: 's1', name: 'One', at: { lat: 52.6, lng: -1.7 } },
        { id: 's2', name: 'Hidden Two', at: { lat: 52.65, lng: -1.75 } },
      ],
    });
  }

  test('only people checked in at the stop being left are told, without the place', () => {
    const e = checkIn(rolling(), 0, 'me');
    const r = movedOnReminder(e, 'me', NOW);
    expect(r?.kind).toBe('moved');
    expect(r?.body).toContain('Stop 2');
    expect(r!.title + r!.body).not.toContain('Hidden Two');
    expect(movedOnReminder(rolling(), 'me', NOW)).toBeNull();
    expect(movedOnReminder(meet(), 'me', NOW)).toBeNull();
  });

  test('the next stop counts as newly unlocked once the meet moves on', () => {
    let e = checkIn(rolling(), 0, 'me');
    expect(newlyUnlocked(e, 'me', crews, NOW, [])).toEqual(['s1']);
    expect(newlyUnlocked(e, 'me', crews, NOW, ['s1'])).toEqual([]);
    e = moveOn(e, NOW);
    expect(newlyUnlocked(e, 'me', crews, NOW, ['s1'])).toEqual(['s2']);
    expect(newlyUnlocked(e, 'host', crews, NOW, [])).toEqual([]);
  });
});

describe('class-up', () => {
  test('only celebrates a rise', () => {
    expect(classRank('S')).toBeGreaterThan(classRank('A'));
    expect(classUp('C', 'B')).toEqual({ from: 'C', to: 'B' });
    expect(classUp('B', 'B')).toBeNull();
    expect(classUp('A', 'B')).toBeNull();
    expect(classUp(null, 'S')).toBeNull();
  });
});
