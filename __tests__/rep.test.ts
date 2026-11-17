import { authorRep, routeScore, validRatings, ROUTE_APPROVED_REP } from '../src/lib/rep';

const people = (n: number, prefix = 'u') => Array.from({ length: n }, (_, i) => `${prefix}${i}`);

describe('route rep', () => {
  test('a new route earns the approval bonus only', () => {
    expect(authorRep({ authorId: 'a', completions: [], ratings: [] })).toBe(ROUTE_APPROVED_REP);
  });

  test('a popular, well-rated route earns far more than a poor one', () => {
    const good = people(100);
    const bad = people(10);
    const goodRep = authorRep({ authorId: 'a', completions: good, ratings: good.map((u) => ({ userId: u, stars: 5 })) });
    const badRep = authorRep({ authorId: 'b', completions: bad, ratings: bad.map((u) => ({ userId: u, stars: 2 })) });
    expect(goodRep).toBe(ROUTE_APPROVED_REP + 100 * 20);
    expect(badRep).toBeLessThan(ROUTE_APPROVED_REP + 20);
  });

  test('the author cannot rate or drive their own route for rep', () => {
    const r = { authorId: 'a', completions: ['a', 'a', 'a'], ratings: [{ userId: 'a', stars: 5 }] };
    expect(validRatings(r)).toHaveLength(0);
    expect(authorRep(r)).toBe(ROUTE_APPROVED_REP);
  });

  test('only people who completed the route can rate it', () => {
    const r = { authorId: 'a', completions: ['x'], ratings: [{ userId: 'x', stars: 4 }, { userId: 'never-drove', stars: 5 }] };
    expect(validRatings(r)).toEqual([{ userId: 'x', stars: 4 }]);
  });

  test('one rating per person, latest wins', () => {
    const r = { authorId: 'a', completions: ['x'], ratings: [{ userId: 'x', stars: 1 }, { userId: 'x', stars: 5 }] };
    expect(validRatings(r)).toEqual([{ userId: 'x', stars: 5 }]);
  });

  test('three mates giving 5 stars cannot max out the score', () => {
    const mates = people(3, 'm');
    expect(routeScore({ authorId: 'a', completions: mates, ratings: mates.map((u) => ({ userId: u, stars: 5 })) })).toBeLessThan(4);
  });

  test('photo spots use the same rules at half the rate', () => {
    const v = people(50);
    const ratings = v.map((u) => ({ userId: u, stars: 5 }));
    expect(authorRep({ kind: 'spot', authorId: 'a', completions: v, ratings })).toBe(ROUTE_APPROVED_REP + 50 * 10);
    expect(authorRep({ kind: 'route', authorId: 'a', completions: v, ratings })).toBe(ROUTE_APPROVED_REP + 50 * 20);
  });
});
