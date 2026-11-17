import { QUICK_MODS } from '../src/data/catalog';
import { isRoadIllegal, MAX_REWARDED_MODS, rewardedMods } from '../src/lib/legality';
import { repLedger } from '../src/lib/rep';
import { addTypicalParts, offRoadParts, stageIncludes, TUNE_STAGES, typicalParts } from '../src/lib/tune';
import type { Mod } from '../src/lib/types';

const mod = (name: string, i = 0): Mod => ({ id: `m${i}-${name}`, category: 'engine', name });

describe('road-illegal mods', () => {
  test('decat, de-restrict, pops and bangs, anti-lag and straight-through are tagged; road parts are not', () => {
    for (const n of ['Decat / cat delete', 'De-cat link pipe', 'De-restricted', 'Pops and bangs map', 'Anti-lag', 'Straight-through (no cat)'])
      expect(isRoadIllegal(mod(n))).toBe(true);
    for (const n of ['decat pipe', 'Cat delete', 'crackle map', 'derestricted', 'pops & bangs', 'Downpipe / decat'])
      expect(isRoadIllegal(mod(n))).toBe(true);
    for (const n of ['ECU remap', 'Downpipe with sports cat', 'Launch control', 'Sports cat', 'Full system exhaust', 'Category C repair'])
      expect(isRoadIllegal(mod(n))).toBe(false);
  });

  test('"Add typical parts" never adds one, at any stage; they are offered as optional instead', () => {
    for (const kind of ['car', 'bike'] as const)
      for (const asp of ['t', 'd', 'n', undefined] as const)
        for (const st of TUNE_STAGES) {
          for (const p of typicalParts(kind, asp, st)) expect(p.roadLegal).toBeUndefined();
          for (const p of offRoadParts(kind, asp, st)) expect(p.roadLegal).toBe(false);
          expect(stageIncludes(kind, asp, st)).not.toMatch(/de-?cat|de-?restrict/i);
        }
    expect(offRoadParts('bike', undefined, 'stage2').map((p) => p.key)).toEqual(['decat-bike', 'derestrict']);
    const added = addTypicalParts([], typicalParts('bike', undefined, 'stage2'), () => 'x');
    expect(added.some(isRoadIllegal)).toBe(false);
    expect(QUICK_MODS.filter((m) => m.roadLegal === false).length).toBeGreaterThanOrEqual(6);
  });
});

describe('mod rep', () => {
  test('road-legal mods only, each kind once per build, at most 10', () => {
    expect(rewardedMods([mod('ECU remap'), mod('ECU remap', 1), mod('Decat / cat delete')]).map((m) => m.name)).toEqual(['ECU remap']);
    const many = Array.from({ length: 25 }, (_, i) => mod(`Part ${i}`, i));
    expect(rewardedMods(many)).toHaveLength(MAX_REWARDED_MODS);
  });

  test('the ledger counts rewarded mods, not every chip', () => {
    const mods = [mod('ECU remap'), mod('ECU remap', 1), mod('De-restricted'), mod('Pops and bangs map'), ...Array.from({ length: 20 }, (_, i) => mod(`Part ${i}`, i))];
    const ledger = repLedger('me', {
      events: [], votes: [], spots: [], awards: [], now: new Date(),
      builds: [{ id: 'b', ownerId: 'me', kind: 'car', make: 'M', model: 'M', stockBhp: 100, weightKg: 1000, mods, photos: [] }],
    } as never);
    expect(ledger.lines.find((l) => l.source === 'mods')!.count).toBe(MAX_REWARDED_MODS);
  });
});
