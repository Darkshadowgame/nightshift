import { awardRep, canVote, castVote, categoriesFor, hasLegend, results, votingCloses, winner, type Vote } from '../src/lib/awards';
import { DEFAULT_FILTER } from '../src/lib/invites';
import type { Build, NightEvent } from '../src/lib/types';

const START = new Date('2026-11-20T22:00:00Z');
const at = (h: number) => new Date(START.getTime() + h * 3_600_000);

const b = (id: string, ownerId: string, kind: 'car' | 'bike' = 'car', stockBhp = 300, weightKg = 1450): Build => ({
  id, ownerId, kind, make: 'X', model: 'Y', stockBhp, weightKg, mods: [], photos: [],
});

const builds: Build[] = [
  b('b1', 'u1'), b('b2', 'u2'), b('b3', 'u3'), b('k1', 'u4', 'bike', 197, 201), b('k2', 'u5', 'bike', 117, 190),
  b('far', 'stayedHome'),
];

const event: NightEvent = {
  id: 'e', type: 'meet', title: 'Meet', startsAt: START.toISOString(), endsAt: at(3).toISOString(),
  area: { lat: 0, lng: 0 }, areaName: '', stops: [{ id: 's', name: 'S', at: { lat: 0, lng: 0 } }], currentStop: 0,
  revealMinutesBefore: 60, hostIds: ['u1'], filter: DEFAULT_FILTER, going: ['u1', 'u2', 'u3', 'u4', 'u5', 'stayedHome'],
  checkIns: { u1: ['s'], u2: ['s'], u3: ['s'], u4: ['s'], u5: ['s'] },
};

describe('voting', () => {
  test('only people who checked in can vote, while voting is open', () => {
    expect(canVote(event, 'u1', at(1)).ok).toBe(true);
    expect(canVote(event, 'stayedHome', at(1)).ok).toBe(false);
    expect(canVote(event, 'u1', at(-1)).ok).toBe(false);
    expect(canVote(event, 'u1', at(3 + 25)).ok).toBe(false);
    expect(votingCloses(event).toISOString()).toBe(at(27).toISOString());
  });

  test("you can't vote for yourself or for someone who didn't turn up", () => {
    expect(() => castVote([], event, builds, 'u1', 'best-in-show', 'b1', at(1))).toThrow();
    expect(() => castVote([], event, builds, 'u1', 'best-in-show', 'far', at(1))).toThrow();
  });

  test('a car cannot win best bike', () => {
    expect(() => castVote([], event, builds, 'u1', 'best-bike', 'b2', at(1))).toThrow();
    expect(castVote([], event, builds, 'u1', 'best-bike', 'k1', at(1))).toHaveLength(1);
  });

  test('voting again in a category replaces your vote', () => {
    let v: Vote[] = castVote([], event, builds, 'u1', 'best-in-show', 'b2', at(1));
    v = castVote(v, event, builds, 'u1', 'best-in-show', 'b3', at(1.1));
    expect(v).toHaveLength(1);
    expect(v[0].buildId).toBe('b3');
  });

  test('categories depend on who turned up', () => {
    const cats = categoriesFor(event, builds);
    expect(cats).toEqual(expect.arrayContaining(['best-in-show', 'best-car', 'best-bike', 'stance', 'newcomer']));
    expect(cats.some((c) => c.startsWith('class-'))).toBe(false); // fewer than 12 people
  });
});

describe('results', () => {
  let votes: Vote[] = [];
  votes = castVote(votes, event, builds, 'u1', 'best-in-show', 'k1', at(1));
  votes = castVote(votes, event, builds, 'u2', 'best-in-show', 'k1', at(1.2));
  votes = castVote(votes, event, builds, 'u3', 'best-in-show', 'b2', at(1.3));
  votes = castVote(votes, event, builds, 'u5', 'best-in-show', 'b2', at(1.4));
  votes = castVote(votes, event, builds, 'u2', 'sound', 'b1', at(1.5));

  test('ties go to the build that got there first', () => {
    expect(winner(votes, event, 'best-in-show')).toEqual({ buildId: 'k1', votes: 2 });
  });

  test('a category needs enough votes', () => {
    expect(winner(votes, event, 'sound')).toBeNull();
  });

  test('no results until voting closes, then trophies, rep and the legend badge', () => {
    expect(results(votes, event, builds, at(5))).toEqual([]);
    const awards = results(votes, event, builds, at(28));
    expect(awards).toHaveLength(1);
    expect(awards[0]).toMatchObject({ category: 'best-in-show', ownerId: 'u4' });
    expect(awardRep(awards, 'u4')).toBe(500);
    expect(hasLegend(awards, 'u4', at(28))).toBe(true);
    expect(hasLegend(awards, 'u4', at(28 + 8 * 24))).toBe(false);
  });
});
