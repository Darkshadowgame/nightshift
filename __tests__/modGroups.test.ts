import { buildMatches, DEFAULT_FILTER, rowsLeavingOut } from '../src/lib/invites';
import { rewardedMods } from '../src/lib/legality';
import { countedMods, modCount, modUnit, sharedGroupLabel } from '../src/lib/modGroups';
import type { Build, Mod } from '../src/lib/types';

const mod = (name: string, category: Mod['category'] = 'engine'): Mod => ({ id: name, category, name });
const build = (mods: Mod[]): Build => ({ id: 'b', ownerId: 'u', kind: 'car', make: 'Ford', model: 'Fiesta ST', stockBhp: 197, weightKg: 1262, mods, photos: [] });

describe('mods in the same group count once (REVIEW-10 #4)', () => {
  test('a Stage 1 tune and an ECU remap are one engine tune', () => {
    const mods = [mod('Stage 1 tune'), mod('ECU remap'), mod('Cold air intake', 'intake')];
    expect(modCount(mods)).toBe(2);
    expect(countedMods(mods).map((m) => m.name)).toEqual(['Stage 1 tune', 'Cold air intake']);
    expect(sharedGroupLabel(mods[1], mods)).toBe('Engine tune');
    expect(sharedGroupLabel(mods[2], mods)).toBeNull();
  });

  test('typed tunes, stage remaps and flashes join the tune group; case and spaces ignored', () => {
    for (const n of ['remap', 'Stage 2+ ECU remap', 'stage 3 map', 'ECU  flash', 'Custom dyno map', 'Pops and bangs map']) expect(modUnit(mod(n))).toBe('g:tune');
    expect(modUnit(mod('Forged internals'))).toBe('n:forged internals');
  });

  test('other groups: intake, exhaust system, turbo upgrade, lowering, wheels', () => {
    expect(modCount([mod('Induction kit', 'intake'), mod('Panel air filter', 'intake')])).toBe(1);
    expect(modCount([mod('Coilovers', 'suspension'), mod('Lowering springs', 'suspension'), mod('Anti-roll bars', 'suspension')])).toBe(2);
    expect(modCount([mod('Cat-back exhaust', 'exhaust'), mod('Downpipe with sports cat', 'exhaust')])).toBe(2);
    expect(modCount([mod('Wrap', 'body'), mod('wrap', 'body')])).toBe(1);
  });

  test('rep pays a group once', () => {
    expect(rewardedMods([mod('Stage 1 tune'), mod('ECU remap'), mod('Cold air intake', 'intake')])).toHaveLength(2);
    // An off-road part in the group doesn't use up the group's rep.
    expect(rewardedMods([mod('Pops and bangs map'), mod('ECU remap')]).map((m) => m.name)).toEqual(['ECU remap']);
  });

  test('invites: "minimum mods" counts groups once', () => {
    const b = build([mod('Stage 1 tune'), mod('ECU remap'), mod('Cold air intake', 'intake')]);
    const filter = { ...DEFAULT_FILTER, minMods: 3 };
    expect(buildMatches(b, filter)).toBe(false);
    expect(rowsLeavingOut(b, filter)).toEqual(['Minimum mods 3+ (it has 2)']);
    expect(buildMatches(build([...b.mods, mod('Coilovers', 'suspension')]), filter)).toBe(true);
  });
});
