import { statusLine, eventPrimary } from '../src/lib/eventAction';
import { canInvite, INVITE_CAP, INVITE_WORDS, inviteChoices, invitedToast, inviteProblem, newInvitees, withInvites } from '../src/lib/eventInvites';
import { DEFAULT_FILTER } from '../src/lib/invites';
import { eventShareUrl, eventSharePayload } from '../src/lib/share';
import type { NightEvent, User } from '../src/lib/types';

const start = new Date('2026-11-20T22:00:00Z');
const before = new Date(start.getTime() - 3 * 3_600_000);
const user = (id: string, name = id): User => ({ id, handle: `${id}_h`, name, region: 'Midlands', home: { lat: 52.6, lng: -1.7 } }) as User;
const users = ['me', 'host', 'mo', 'aimee', 'kez', 'far', 'blk'].map((id) => user(id, id.toUpperCase()));
const event: NightEvent = {
  id: 'e1', type: 'meet', title: 'Car park meet-up', startsAt: start.toISOString(), endsAt: new Date(start.getTime() + 3 * 3_600_000).toISOString(),
  area: { lat: 52.6, lng: -1.7 }, areaName: 'Tamworth',
  stops: [{ id: 's', name: 'Leisure park car park', at: { lat: 52.61, lng: -1.67 } }], currentStop: 0, revealMinutesBefore: 60,
  hostIds: ['host'], filter: { ...DEFAULT_FILTER, cars: false, bikes: true }, going: ['host', 'me', 'kez'], checkIns: {},
};
const connected = ['mo', 'aimee', 'kez', 'blk'];
const blocked = new Set(['blk']);

describe('who can invite', () => {
  it('hosts and people going, while it is on', () => {
    expect(canInvite(event, 'me', [], before)).toBe(true);
    expect(canInvite(event, 'host', [], before)).toBe(true);
    expect(canInvite(event, 'mo', [], before)).toBe(false);
  });
  it('not when the host turned it off, or it is over or cancelled', () => {
    expect(canInvite({ ...event, allowInvites: false }, 'me', [], before)).toBe(false);
    expect(canInvite({ ...event, cancelled: true }, 'me', [], before)).toBe(false);
    expect(canInvite(event, 'me', [], new Date(start.getTime() + 5 * 3_600_000))).toBe(false);
  });
});

describe('the sheet', () => {
  it('lists connections, never blocked people, with going and invited marked', () => {
    const invited = withInvites(event, 'me', ['mo']);
    const list = inviteChoices(invited, 'me', users, connected, blocked, []);
    expect(list.map((c) => c.user.id)).toEqual(['aimee', 'kez', 'mo']);
    expect(list.find((c) => c.user.id === 'kez')?.going).toBe(true);
    expect(list.find((c) => c.user.id === 'mo')?.sent).toBe(true);
  });
  it('searches by name or handle', () => {
    expect(inviteChoices(event, 'me', users, connected, blocked, [], '@aim').map((c) => c.user.id)).toEqual(['aimee']);
  });
});

describe('the server rules, on the phone', () => {
  const p = (ids: string[], e = event, who = 'me') => inviteProblem(e, who, ids, connected, blocked, [], before);
  it('connections only, never blocked, never yourself', () => {
    expect(p(['far'])).toBe(INVITE_WORDS.notConnected);
    expect(p(['blk'])).toBe(INVITE_WORDS.notConnected);
    expect(p(['me'])).toBe(INVITE_WORDS.notConnected);
    expect(p(['mo', 'far'])).toBe(INVITE_WORDS.notConnected);
    expect(p(['mo', 'aimee'])).toBeNull();
  });
  it('going first, the host setting, something picked', () => {
    expect(p(['aimee'], event, 'mo')).toBe(INVITE_WORDS.goFirst);
    expect(p(['aimee'], { ...event, allowInvites: false })).toBe(INVITE_WORDS.off);
    expect(p([])).toBe(INVITE_WORDS.none);
  });
  it(`at most ${INVITE_CAP} per event per person`, () => {
    const many = Array.from({ length: INVITE_CAP }, (_, i) => `f${i}`);
    const full = withInvites(event, 'me', many);
    expect(inviteProblem(full, 'me', ['mo'], [...connected, ...many], blocked, [], before)).toBe(INVITE_WORDS.cap);
    // Someone else's invites don't count against you.
    expect(inviteProblem(withInvites(event, 'host', many), 'me', ['mo'], connected, blocked, [], before)).toBeNull();
  });
  it('only new people count: not going, not invited by you already', () => {
    expect(newInvitees(withInvites(event, 'me', ['mo']), 'me', ['mo', 'aimee', 'kez'], [])).toEqual(['aimee']);
  });
  it('the first inviter is the one shown', () => {
    expect(withInvites(withInvites(event, 'host', ['mo']), 'me', ['mo']).invitedBy).toEqual({ mo: 'host' });
  });
});

describe('the invitee', () => {
  it('the invite rules leave them out: Ask to go, and who invited them', () => {
    const e = withInvites(event, 'aimee', ['mo']);
    const state = eventPrimary(e, 'mo', 'none', [], [], before);
    expect(state).toEqual({ kind: 'join', request: true });
    const line = statusLine(e, state, { me: 'mo', crews: [], builds: [], users, votes: [], now: before });
    expect(line.text).toBe('Open to bikes only. Ask a host to let you in.');
    expect(line.note).toBe('Invited by @aimee_h.');
  });
});

describe('words', () => {
  it('the toast', () => {
    expect(invitedToast(['mo.rs3'])).toBe('Invited @mo.rs3');
    expect(invitedToast(['mo.rs3', 'aimee.r1'])).toBe('Invited @mo.rs3 and @aimee.r1');
    expect(invitedToast(['a', 'b', 'c'])).toBe('Invited 3 people');
  });
  it('Share another way sends the event page link, never the meet point', () => {
    const p = eventSharePayload(event, 'Fri 22:00', 'https://example.test');
    expect(p.url).toBe(eventShareUrl('e1', 'https://example.test'));
    expect(`${p.text} ${p.url}`).not.toContain('Leisure park');
  });
});
