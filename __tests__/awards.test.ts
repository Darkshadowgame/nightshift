import { awardRep, canVote, castVote, categoriesFor, hasLegend, previewResults, results, votingCloses, winner, type Vote } from '../src/lib/awards';
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

  test('three trophies only: best in show, best car, best bike (Redesign 2)', () => {
    expect(categoriesFor(event, builds)).toEqual(['best-in-show', 'best-car', 'best-bike']);
  });

  test('best car and best bike only when both turn up, the same rule for each', () => {
    const carsOnly = { ...event, checkIns: { u1: ['s'], u2: ['s'], u3: ['s'] } };
    const bikesOnly = { ...event, checkIns: { u4: ['s'], u5: ['s'] } };
    expect(categoriesFor(carsOnly, builds)).not.toContain('best-car');
    expect(categoriesFor(bikesOnly, builds)).not.toContain('best-bike');
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

describe('nominees (REVIEW-9 decision 8)', () => {
  const { nominees } = jest.requireActual('../src/lib/awards') as typeof import('../src/lib/awards');
  const list = ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((id) => ({ id }));
  test('each trophy shows a different few', () => {
    const first = nominees(list, 0).map((b) => b.id);
    const second = nominees(list, 1).map((b) => b.id);
    expect(first).toHaveLength(3);
    expect(first).not.toEqual(second);
  });
  test('short lists are shown whole, and your vote is always shown', () => {
    expect(nominees(list.slice(0, 2), 4)).toHaveLength(2);
    expect(nominees(list, 0, 3, 'g').map((b) => b.id)).toContain('g');
  });
});

describe('kind-aware trophies and the demo cap (REVIEW-10)', () => {
  const { categoriesFor, eligibleFor, DEMO_TROPHIES } = require('../src/lib/awards');
  const { seed } = require('../src/data/seed');
  const s = seed(new Date(2026, 10, 18, 20, 0));
  const meet = s.events.find((e: { id: string }) => e.id === 'ev-meet-now');
  it('Best stance is for cars only', () => {
    const stance = eligibleFor('stance', meet, s.builds);
    expect(stance.length).toBeGreaterThan(0);
    expect(stance.every((b: { kind: string }) => b.kind === 'car')).toBe(true);
    expect(eligibleFor('best-in-show', meet, s.builds).some((b: { kind: string }) => b.kind === 'bike')).toBe(true);
  });
  it('the demo meet asks for the three trophies, best in show first', () => {
    const cats = categoriesFor(meet, s.builds, DEMO_TROPHIES);
    expect(cats).toEqual(['best-in-show', 'best-car', 'best-bike']);
    expect(categoriesFor(meet, s.builds)).toEqual(cats);
  });
});

describe('previewResults (the demo trophy moment, Review 12 L4)', () => {
  test('your vote picks each winner, never your own build, before voting closes', () => {
    const v: Vote[] = [{ eventId: event.id, voterId: 'u1', category: 'best-in-show', buildId: 'b2', at: at(1).toISOString() }];
    const r = previewResults(v, event, builds, 'u1', at(1));
    expect(r.find((a) => a.category === 'best-in-show')?.buildId).toBe('b2');
    expect(r.every((a) => a.ownerId !== 'u1')).toBe(true);
    expect(results(v, event, builds, at(1))).toEqual([]);
  });
});
