import { seed, seedStage } from '../src/data/seed';
import { buildMatches } from '../src/lib/invites';
import type { Build } from '../src/lib/types';

const now = new Date(2026, 10, 18, 20, 0);
const s = seed(now);

/** A brand-new demo user's stock hot hatch, as the vehicle picker makes it. */
const hatch = (model: string, stockBhp: number, weightKg: number): Build => ({
  id: `b-${model}`, ownerId: 'me', kind: 'car', make: 'Honda', model, year: 2018, stockBhp, weightKg, mods: [], photos: [], colour: '#ff4d4d',
});

describe('demo seed', () => {
  test('a stock hot hatch is invited to something this week', () => {
    const week = s.events.filter((e) => {
      const t = new Date(e.startsAt).getTime();
      return t > now.getTime() + 6 * 3_600_000 && t < now.getTime() + 7 * 86_400_000;
    });
    for (const car of [hatch('Civic Type R FK8', 316, 1380), hatch('Golf GTI Mk7', 227, 1375), hatch('i30 N', 271, 1429)]) {
      expect(week.filter((e) => buildMatches(car, e.filter)).map((e) => e.id)).toContain('ev-meet-tam');
    }
  });

  test('sample remaps show their stage, not Stock', () => {
    expect(seedStage([['engine', 'Stage 2 remap', 55]])).toBe('stage2');
    expect(seedStage([['engine', 'Stage 2+ remap']])).toBe('stage2plus');
    expect(seedStage([['engine', 'Stage 1 map', 30]])).toBe('stage1');
    expect(seedStage([['exhaust', 'Cat-back']])).toBeUndefined();
    const stage2 = s.builds.filter((b) => b.mods.some((m) => m.name === 'Stage 2 remap'));
    expect(stage2.length).toBeGreaterThan(0);
    for (const b of stage2) expect(b.tuneStage).toBe('stage2');
  });
});
