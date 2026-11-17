import { answerRequest, dropOut, hasRequested, rsvp } from '../src/lib/events';
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
