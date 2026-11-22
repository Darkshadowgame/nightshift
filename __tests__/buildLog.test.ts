import {
  EMPTY_LOG, addWish, costTotal, demoFittedOn, hasTimeline, logOf, modKey, parsePounds, poundsText, removeWish, setModNote, specCard, specText, timeline, timelineText, whoFitted,
  type LogState,
} from '../src/lib/buildLog';
import type { Build, Mod } from '../src/lib/types';

const TODAY = new Date(2026, 10, 21);
const mod = (id: string, name: string, extra: Partial<Mod> = {}): Mod => ({ id, category: 'engine', name, ...extra });
const build = (id: string, owner: string, mods: Mod[], extra: Partial<Build> = {}): Build => ({
  id, ownerId: owner, kind: 'car', make: 'Ford', model: 'Fiesta ST', year: 2016, stockBhp: 197, weightKg: 1163, mods, photos: [], ...extra,
});
const empty: LogState = { builds: {}, hideCosts: false };

describe('mod notes', () => {
  test('a note is keyed by the mod name, whatever its case or spacing', () => {
    expect(modKey('  Cat-back   Exhaust ')).toBe('cat-back exhaust');
    const s = setModNote(empty, 'b1', 'Cat-back', { on: '2026-03-01' });
    expect(logOf(s, 'b1').mods['cat-back'].on).toBe('2026-03-01');
  });
  test('clearing the last field removes the note', () => {
    let s = setModNote(empty, 'b1', 'Coilovers', { cost: 450 });
    s = setModNote(s, 'b1', 'Coilovers', { cost: null });
    expect(logOf(s, 'b1').mods).toEqual({});
  });
  test('a patch keeps the other fields', () => {
    let s = setModNote(empty, 'b1', 'Coilovers', { cost: 450 });
    s = setModNote(s, 'b1', 'Coilovers', { before: 'a.jpg' });
    expect(logOf(s, 'b1').mods.coilovers).toEqual({ cost: 450, before: 'a.jpg' });
  });
  test('a cost is whole pounds and capped', () => {
    const s = setModNote(empty, 'b1', 'X', { cost: 12.6 });
    expect(logOf(s, 'b1').mods.x.cost).toBe(13);
  });
});

describe('timeline', () => {
  const mods = [mod('1', 'Coilovers'), mod('2', 'Wheels'), mod('3', 'Stage 1 tune')];
  test('dated mods come in date order, undated first', () => {
    let s = setModNote(empty, 'b', 'Coilovers', { on: '2026-05-01' });
    s = setModNote(s, 'b', 'Stage 1 tune', { on: '2026-02-01' });
    const t = timeline({ mods }, logOf(s, 'b'), TODAY);
    expect(t.map((e) => e.mod.name)).toEqual(['Wheels', 'Stage 1 tune', 'Coilovers']);
    expect(t[0].on).toBeUndefined();
  });
  test('before and after photos come along', () => {
    const s = setModNote(empty, 'b', 'Wheels', { before: 'x.jpg', after: 'y.jpg' });
    const e = timeline({ mods }, logOf(s, 'b'), TODAY).find((x) => x.mod.name === 'Wheels')!;
    expect([e.before, e.after]).toEqual(['x.jpg', 'y.jpg']);
  });
  test('two mods that count as one job show once', () => {
    const t = timeline({ mods: [mod('1', 'Stage 1 tune'), mod('2', 'ECU remap')] }, EMPTY_LOG, TODAY);
    expect(t).toHaveLength(1);
  });
  test('the sample builds have dates, a real build has none until the owner adds them', () => {
    const sample = [mod('b-dan-0-m0', 'A'), mod('b-dan-0-m1', 'B')];
    expect(timeline({ mods: sample }, EMPTY_LOG, TODAY).every((e) => e.on)).toBe(true);
    expect(demoFittedOn('3f2a-uuid', 2, TODAY)).toBeNull();
    const [a, b] = timeline({ mods: sample }, EMPTY_LOG, TODAY);
    expect(a.on! < b.on!).toBe(true);
  });
  test('a visitor only gets a timeline when there are dates; the owner always does', () => {
    const real = { mods: [mod('s1', 'Coilovers')] };
    expect(hasTimeline(real, EMPTY_LOG, TODAY, false)).toBe(false);
    expect(hasTimeline(real, EMPTY_LOG, TODAY, true)).toBe(true);
    expect(hasTimeline({ mods: [] }, EMPTY_LOG, TODAY, true)).toBe(false);
  });
  test('the shared text has the dates and names and no cost', () => {
    let s = setModNote(empty, 'b', 'Coilovers', { on: '2026-05-01', cost: 999 });
    const text = timelineText({ make: 'Ford', model: 'Fiesta ST', mods: [mod('1', 'Coilovers')] }, logOf(s, 'b'), TODAY);
    expect(text).toContain('Ford Fiesta ST');
    expect(text).toContain('Coilovers');
    expect(text).toContain('1 May');
    expect(text).not.toContain('999');
  });
});

describe('cost', () => {
  test('parses what people type', () => {
    expect(parsePounds('£1,250')).toBe(1250);
    expect(parsePounds(' 80 ')).toBe(80);
    expect(parsePounds('')).toBeNull();
    expect(parsePounds('0')).toBeNull();
    expect(parsePounds('12.50')).toBeNull();
    expect(parsePounds('abc')).toBeNull();
    expect(parsePounds('99999999')).toBeNull();
  });
  test('says pounds', () => {
    expect(poundsText(1250)).toBe('£1,250');
  });
  test('totals only what is on the build, each part once', () => {
    let s = setModNote(empty, 'b', 'Coilovers', { cost: 450 });
    s = setModNote(s, 'b', 'Wheels', { cost: 800 });
    s = setModNote(s, 'b', 'Old part that was taken off', { cost: 300 });
    const r = costTotal([mod('1', 'Coilovers'), mod('2', 'wheels'), mod('3', 'Spoiler')], logOf(s, 'b'));
    expect(r).toEqual({ total: 1250, priced: 2 });
  });
});

describe('wishlist', () => {
  const w = (id: string, name: string) => ({ id, name, category: 'engine' as const });
  test('adds once and removes', () => {
    let s = addWish(empty, 'b', w('1', 'Intercooler'));
    s = addWish(s, 'b', w('2', ' intercooler '));
    expect(logOf(s, 'b').wishes).toHaveLength(1);
    s = removeWish(s, 'b', '1');
    expect(logOf(s, 'b').wishes).toHaveLength(0);
  });
  test('a wish is not a fitted mod', () => {
    const s = addWish(empty, 'b', w('1', 'Intercooler'));
    expect(timeline({ mods: [] }, logOf(s, 'b'), TODAY)).toHaveLength(0);
  });
  test('who has fitted it: other people, same part or same job, strongest first, not me', () => {
    const mine = build('mine', 'me', [mod('a', 'Intercooler')]);
    const x = build('x', 'u1', [mod('b', 'Intercooler')], { stockBhp: 200 });
    const y = build('y', 'u2', [mod('c', 'Intercooler')], { stockBhp: 300 });
    const z = build('z', 'u3', [mod('d', 'Coilovers')]);
    expect(whoFitted('intercooler', [mine, x, y, z], 'me').map((b) => b.id)).toEqual(['y', 'x']);
    const t = build('t', 'u4', [mod('e', 'ECU remap')]);
    expect(whoFitted('Stage 1 tune', [t, z], 'me').map((b) => b.id)).toEqual(['t']);
  });
});

describe('spec card', () => {
  test('key mods: biggest gain first, at most five, the rest counted', () => {
    const mods = ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((n, i) => mod(n, `Part ${n}`, { bhpGain: i === 6 ? 40 : undefined }));
    const c = specCard(build('1', 'me', mods));
    expect(c.keyMods).toHaveLength(5);
    expect(c.keyMods[0]).toBe('Part g');
    expect(c.more).toBe(2);
  });
  test('has the make, model and power, and nothing like a plate', () => {
    const c = specCard(build('1', 'me', [mod('a', 'Coilovers', { category: 'suspension' })], { nickname: 'Fizz' }));
    expect(c.title).toBe('Ford Fiesta ST');
    expect(c.sub).toBe('Fizz · 2016 · Car');
    expect(specText(c)).toContain('Ford Fiesta ST, 197 bhp');
    expect(Object.keys(c).join()).not.toMatch(/plate|reg/i);
  });
});
