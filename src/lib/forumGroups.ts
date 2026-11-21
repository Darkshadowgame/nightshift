import { fold, slug, tidyModel, type Variant } from './vehicles';

/**
 * Forum groups, like Facebook groups for a make or a model ("SEAT", "SEAT Leon"). They come from the
 * vehicle list (src/data/vehicles), so there is no hand-made list. A key is the make's slug, or
 * "make:model" for a model. A make group includes its models' threads. Which groups you've joined is
 * kept on the phone (settings.forumGroups).
 */
export interface ForumGroup {
  key: string;
  label: string;
  /** Make groups only: how many models sit under it. */
  models?: number;
  make: string;
  kind: 'car' | 'bike' | 'both';
}

/** Every make and model in the list, once each. A make that has cars and bikes (BMW) is one group. */
export function buildGroups(list: Variant[]): ForumGroup[] {
  const makes = new Map<string, ForumGroup>();
  const models = new Map<string, ForumGroup>();
  const modelsOfMake = new Map<string, Set<string>>();
  for (const v of list) {
    const mk = slug(v.make);
    const md = slug(tidyModel(v.model));
    if (!mk || !md) continue;
    const m = makes.get(mk);
    if (!m) makes.set(mk, { key: mk, label: v.make, make: v.make, kind: v.kind });
    else if (m.kind !== v.kind) m.kind = 'both';
    const key = `${mk}:${md}`;
    if (!models.has(key)) models.set(key, { key, label: `${v.make} ${tidyModel(v.model)}`, make: v.make, kind: v.kind });
    else if (models.get(key)!.kind !== v.kind) models.get(key)!.kind = 'both';
    if (!modelsOfMake.has(mk)) modelsOfMake.set(mk, new Set());
    modelsOfMake.get(mk)!.add(md);
  }
  for (const [mk, g] of makes) g.models = modelsOfMake.get(mk)?.size ?? 0;
  return [...makes.values(), ...models.values()];
}

let cache: { list: Variant[]; groups: ForumGroup[]; byKey: Map<string, ForumGroup> } | null = null;

/** The groups for a vehicle list, kept for the next call with the same list. */
export function groupsFor(list: Variant[]): { groups: ForumGroup[]; byKey: Map<string, ForumGroup> } {
  if (!cache || cache.list !== list) {
    const groups = buildGroups(list);
    cache = { list, groups, byKey: new Map(groups.map((g) => [g.key, g])) };
  }
  return cache;
}

export function findGroup(list: Variant[], key: string | undefined | null): ForumGroup | undefined {
  return key ? groupsFor(list).byKey.get(key) : undefined;
}

/** The make group a key sits under: "seat:leon" -> "seat". */
export function makeKeyOf(key: string): string {
  return key.split(':')[0];
}

/** Is a thread tagged `tag` part of group `key`? A make group takes its models' threads too. */
export function inGroup(tag: string | undefined, key: string): boolean {
  if (!tag) return false;
  return tag === key || (!key.includes(':') && makeKeyOf(tag) === key);
}

/** Groups for the vehicles in a garage (variants), model first then make, once each, in garage order. */
export function suggestedGroups(list: Variant[], variants: Variant[], exclude: string[] = []): ForumGroup[] {
  const { byKey } = groupsFor(list);
  const out: ForumGroup[] = [];
  for (const v of variants) {
    for (const key of [`${slug(v.make)}:${slug(tidyModel(v.model))}`, slug(v.make)]) {
      const g = byKey.get(key);
      if (g && !exclude.includes(key) && !out.some((o) => o.key === key)) out.push(g);
    }
  }
  return out;
}

/** Search groups by name: every word must appear, makes before models, then A-Z. */
export function searchGroups(list: Variant[], query: string, limit = 30): ForumGroup[] {
  const words = fold(query).split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  return groupsFor(list)
    .groups.filter((g) => words.every((w) => fold(g.label).includes(w)))
    .sort((a, b) => Number(a.key.includes(':')) - Number(b.key.includes(':')) || a.label.localeCompare(b.label))
    .slice(0, limit);
}

/** The most-used makes first, for browsing with nothing typed. */
export function browseGroups(list: Variant[], exclude: string[] = [], limit = 12): ForumGroup[] {
  const counts = new Map<string, number>();
  for (const v of list) counts.set(slug(v.make), (counts.get(slug(v.make)) ?? 0) + 1);
  return groupsFor(list)
    .groups.filter((g) => !g.key.includes(':') && !exclude.includes(g.key))
    .sort((a, b) => (counts.get(b.key) ?? 0) - (counts.get(a.key) ?? 0) || a.label.localeCompare(b.label))
    .slice(0, limit);
}

/** What a group is, said once under its name: "Cars and bikes · 14 models" or "Car · Leon". */
export function groupKindLabel(g: ForumGroup): string {
  const kind = g.kind === 'both' ? 'Cars and bikes' : g.kind === 'car' ? 'Cars' : 'Bikes';
  return g.models ? `${kind} · ${g.models} ${g.models === 1 ? 'model' : 'models'}` : kind;
}

export function joinGroup(joined: string[] | undefined, key: string): string[] {
  const j = joined ?? [];
  return j.includes(key) ? j : [...j, key];
}

export function leaveGroup(joined: string[] | undefined, key: string): string[] {
  return (joined ?? []).filter((k) => k !== key);
}
