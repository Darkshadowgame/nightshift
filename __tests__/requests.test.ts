import { answerRequest, dropOut, hasRequested, rsvp } from '../src/lib/events';
import { canJoinDirectly, newlyUnlocked, roleOf, viewEvents } from '../src/lib/eventView';
import { DEFAULT_FILTER } from '../src/lib/invites';
import type { Crew, NightEvent } from '../src/lib/types';

const crews: Crew[] = [{ id: 'c', name: 'Crew', tag: 'C', memberIds: ['owner', 'member'], ownerId: 'owner', hostIds: [] }];
const event: NightEvent = {
  id: 'e', type: 'meet', title: 'Meet', startsAt: '2026-11-20T22:00:00Z', area: { lat: 52.6, lng: -1.7 }, areaName: 'Midlands',
  stops: [{ id: 's', name: 'Spot', at: { lat: 52.62, lng: -1.72 } }], currentStop: 0, revealMinutesBefore: 60,
  hostIds: ['host'], crewId: 'c', filter: DEFAULT_FILTER, going: ['host'], checkIns: {},
};

describe('requests to go', () => {
  test('invited people go straight in', () => {
    expect(rsvp(event, 'inv', true).going).toContain('inv');
  });

  test('anyone else only makes a request: never going until a host says yes', () => {
    const e = rsvp(event, 'stranger', false);
    expect(e.going).not.toContain('stranger');
    expect(hasRequested(e, 'stranger')).toBe(true);
    expect(rsvp(e, 'stranger', false).requests).toEqual(['stranger']); // asking twice doesn't duplicate
  });

  test('a host approves: they are going and the request goes', () => {
    const e = answerRequest(rsvp(event, 'stranger', false), 'host', crews, 'stranger', true);
    expect(e.going).toContain('stranger');
    expect(e.requests).toEqual([]);
  });

  test('a crew owner can answer; a plain crew member or the requester cannot', () => {
    const e = rsvp(event, 'stranger', false);
    expect(answerRequest(e, 'owner', crews, 'stranger', true).going).toContain('stranger');
    expect(() => answerRequest(e, 'member', crews, 'stranger', true)).toThrow(/Only hosts/);
    expect(() => answerRequest(e, 'stranger', crews, 'stranger', true)).toThrow(/Only hosts/);
  });

  test('declined people can not ask again', () => {
    const e = answerRequest(rsvp(event, 'stranger', false), 'host', crews, 'stranger', false);
    expect(e.going).not.toContain('stranger');
    expect(e.declined).toEqual(['stranger']);
    expect(() => rsvp(e, 'stranger', false)).toThrow(/said no/);
  });

  test('withdrawing a request or dropping out', () => {
    expect(dropOut(rsvp(event, 'stranger', false), 'stranger').requests).toEqual([]);
    expect(dropOut(event, 'host').going).toEqual([]);
  });
});

describe('finding your requests again', () => {
  const NOW = new Date('2026-11-20T18:00:00Z');
  // A bikes-only invite, so a car owner doesn't match it.
  const bikes: NightEvent = { ...event, filter: { ...DEFAULT_FILTER, cars: false } };
  const users = [{ id: 'stranger', handle: 'st', name: 'S', region: 'Midlands', home: { lat: 52.6, lng: -1.7 } }];
  const builds = [{ id: 'b', ownerId: 'stranger', kind: 'car' as const, make: 'M', model: 'M', stockBhp: 100, weightKg: 1000, mods: [], photos: [] }];

  test('a pending request shows as requested, and lists under your events', () => {
    expect(roleOf(bikes, 'stranger', crews, users, builds)).toBe('none');
    const asked = rsvp(bikes, 'stranger', false);
    expect(roleOf(asked, 'stranger', crews, users, builds)).toBe('requested');
    const views = viewEvents([asked], 'stranger', crews, users, builds, NOW);
    expect(views.map((v) => v.role)).toEqual(['requested']);
    expect(views[0].shownStop).toBe(-1); // still locked
    expect(canJoinDirectly('requested')).toBe(false);
  });

  test('a declined request shows as declined', () => {
    const no = answerRequest(rsvp(bikes, 'stranger', false), 'host', crews, 'stranger', false);
    expect(roleOf(no, 'stranger', crews, users, builds)).toBe('declined');
    expect(canJoinDirectly('declined')).toBe(false);
  });
});

describe('the unlocked moment', () => {
  const going: NightEvent = { ...event, going: ['host', 'me'], startsAt: '2026-11-20T22:00:00Z', endsAt: '2026-11-20T23:00:00Z' };
  test('plays for a revealed event, never for a finished or cancelled one', () => {
    expect(newlyUnlocked(going, 'me', crews, new Date('2026-11-20T21:30:00Z'), [])).toEqual(['s']);
    expect(newlyUnlocked(going, 'me', crews, new Date('2026-11-21T09:00:00Z'), [])).toEqual([]);
    expect(newlyUnlocked({ ...going, cancelled: true }, 'me', crews, new Date('2026-11-20T21:30:00Z'), [])).toEqual([]);
  });
});
