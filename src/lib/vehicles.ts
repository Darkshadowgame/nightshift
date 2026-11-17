import type { VehicleKind } from './types';

/**
 * Stock specs for the vehicle picker. The data lives in src/data/vehicles*.ts as
 * compact text (one variant per line); this file parses and searches it.
 */

/** t turbo petrol, d turbo diesel, n naturally aspirated, s supercharged, h hybrid. */
export type Aspiration = 't' | 'd' | 'n' | 's' | 'h';

/** Tuner figures for one variant: total bhp after each stage. */
export type StageFigures = Partial<Record<'stage1' | 'stage2' | 'stage2plus' | 'stage3' | 'stage4', number>>;

export interface Variant {
  id: string;
  kind: VehicleKind;
  make: string;
  /** Model family, e.g. "Golf R". */
  model: string;
  /** Generation or spec, e.g. "Mk7.5". May be empty. */
  gen: string;
  /** Engine label, e.g. "2.0 TSI". */
  engine: string;
  from: number;
  /** Last UK model year; undefined while still on sale. */
  to?: number;
  bhp: number;
  /** Kerb weight for cars, wet weight for bikes. */
  weightKg: number;
  /** True when only a dry weight was published and an allowance was added. */
  weightApprox?: boolean;
  torqueLbFt?: number;
  asp: Aspiration;
  stages?: StageFigures;
}

/** A common engine-swap donor that isn't a whole vehicle in the picker. */
export interface DonorEngine {
  id: string;
  kind: VehicleKind;
  make: string;
  /** Engine code, e.g. "K20A". */
  code: string;
  /** e.g. "2.0 i-VTEC (Civic Type R FN2)". */
  label: string;
  bhp: number;
  torqueLbFt?: number;
  asp: Aspiration;
}

/** PS (metric hp) to bhp. Used for every PS figure in the dataset. */
export const PS_TO_BHP = 0.986;
export const KW_TO_BHP = 1.341;
export const NM_TO_LBFT = 0.7376;
/** Added to a published dry weight to estimate wet weight (fuel, oil, coolant). */
export const DRY_TO_WET_KG = 20;

const ASPS = new Set<Aspiration>(['t', 'd', 'n', 's', 'h']);

/** "220p" (PS), "147k" (kW) or "326b" (bhp/hp) to whole bhp. */
export function toBhp(raw: string): number | undefined {
  const m = /^\s*([0-9]+(?:\.[0-9]+)?)\s*([pkb]?)\s*$/i.exec(raw);
  if (!m) return undefined;
  const n = Number(m[1]);
  const unit = m[2].toLowerCase();
  const bhp = unit === 'p' ? n * PS_TO_BHP : unit === 'k' ? n * KW_TO_BHP : n;
  return bhp > 0 ? Math.round(bhp) : undefined;
}

/** "350n" (Nm) or "258l" (lb-ft) to whole lb-ft. A bare number is lb-ft. */
export function toLbFt(raw: string): number | undefined {
  const m = /^\s*([0-9]+(?:\.[0-9]+)?)\s*([nl]?)\s*$/i.exec(raw);
  if (!m) return undefined;
  const n = Number(m[1]);
  const v = m[2].toLowerCase() === 'n' ? n * NM_TO_LBFT : n;
  return v > 0 ? Math.round(v) : undefined;
}

function toWeight(raw: string): { kg: number; approx: boolean } | undefined {
  const m = /^\s*([0-9]+(?:\.[0-9]+)?)\s*(d?)\s*$/i.exec(raw);
  if (!m) return undefined;
  const kg = Number(m[1]);
  if (!(kg > 0)) return undefined;
  return m[2] ? { kg: Math.round(kg + DRY_TO_WET_KG), approx: true } : { kg: Math.round(kg), approx: false };
}

const STAGE_KEYS: Record<string, keyof StageFigures> = {
  '1': 'stage1', '2': 'stage2', '2p': 'stage2plus', '2+': 'stage2plus', '3': 'stage3', '4': 'stage4',
};

function toStages(raw: string | undefined): StageFigures | undefined {
  if (!raw || !raw.trim()) return undefined;
  const out: StageFigures = {};
  for (const part of raw.split(',')) {
    const [k, v] = part.split(':').map((x) => x.trim());
    const key = STAGE_KEYS[k?.toLowerCase() ?? ''];
    const bhp = v ? toBhp(v) : undefined;
    if (key && bhp) out[key] = bhp;
  }
  return Object.keys(out).length ? out : undefined;
}

export function slug(s: string): string {
  return fold(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** Lower case, accents off: "Škoda" -> "skoda". */
export function fold(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/**
 * Parse the dataset text. Lines: "# comment", "@Make", "=Model",
 * "gen|engine|years|power|weight|torque|asp[|stages]". Bad lines are skipped.
 * A line "@@ENGINES" ends the vehicle section (see parseEngines).
 */
export function parseVehicles(text: string, kind: VehicleKind): Variant[] {
  const out: Variant[] = [];
  const seen = new Set<string>();
  let make = '';
  let model = '';
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    if (line === '@@ENGINES') break;
    if (line.startsWith('@')) { make = line.slice(1).trim(); model = ''; continue; }
    if (line.startsWith('=')) { model = line.slice(1).trim(); continue; }
    if (!make || !model) continue;
    const f = line.split('|').map((x) => x.trim());
    if (f.length < 7) continue;
    const [gen, engine, years, power, weight, torque, asp, stages] = f;
    const ym = /^(\d{4})\s*-\s*(\d{4})?$/.exec(years) ?? /^(\d{4})$/.exec(years);
    const bhp = toBhp(power);
    const w = toWeight(weight);
    if (!ym || !bhp || !w || !ASPS.has(asp as Aspiration)) continue;
    const from = Number(ym[1]);
    const to = years.includes('-') ? (ym[2] ? Number(ym[2]) : undefined) : from;
    let id = `${kind}:${slug(make)}:${slug(model)}:${slug(gen)}:${slug(engine)}`;
    if (seen.has(id)) id = `${id}:${from}`;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push({
      id, kind, make, model, gen, engine, from, to, bhp,
      weightKg: w.kg, weightApprox: w.approx || undefined,
      torqueLbFt: torque ? toLbFt(torque) : undefined,
      asp: asp as Aspiration,
      stages: toStages(stages),
    });
  }
  return out;
}

/** Parse the "@@ENGINES" section: "make|code|label|power|torque|asp". */
export function parseEngines(text: string, kind: VehicleKind): DonorEngine[] {
  const at = text.indexOf('@@ENGINES');
  if (at < 0) return [];
  const out: DonorEngine[] = [];
  const seen = new Set<string>();
  for (const rawLine of text.slice(at + '@@ENGINES'.length).split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const f = line.split('|').map((x) => x.trim());
    if (f.length < 6) continue;
    const [make, code, label, power, torque, asp] = f;
    const bhp = toBhp(power);
    if (!make || !code || !bhp || !ASPS.has(asp as Aspiration)) continue;
    let id = `engine:${kind}:${slug(make)}:${slug(code)}`;
    if (seen.has(id)) id = `${id}:${slug(label)}`;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push({ id, kind, make, code, label, bhp, torqueLbFt: torque ? toLbFt(torque) : undefined, asp: asp as Aspiration });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

function words(s: string): string[] {
  return fold(s).replace(/[^a-z0-9.+]+/g, ' ').trim().split(/\s+/).filter(Boolean);
}

/**
 * How well `query` matches `text` (0 = no match). Every query word must be found;
 * "yzf r1", "mk 7" and "mk7" all work because a squashed copy (no spaces or
 * hyphens) is checked too. Word-start hits score higher.
 */
export function matchScore(text: string, query: string): number {
  const q = words(query);
  if (!q.length) return 1;
  const hay = words(text);
  const joined = ` ${hay.join(' ')}`;
  const squashed = hay.join('');
  const qSquashed = q.join('');
  let score = 0;
  for (const w of q) {
    if (hay.includes(w)) score += 3;
    else if (hay.some((h) => h.startsWith(w))) score += 2;
    else if (joined.includes(w) || squashed.includes(w)) score += 1;
    // Last chance: the whole query squashed ("mk 7" against "mk7").
    else return squashed.includes(qSquashed) ? q.length : 0;
  }
  return score;
}

function byScore<T>(items: T[], text: (t: T) => string, query: string, limit?: number): T[] {
  if (!query.trim()) return limit ? items.slice(0, limit) : items;
  const scored = items
    .map((item, i) => ({ item, i, s: matchScore(text(item), query) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .map((x) => x.item);
  return limit ? scored.slice(0, limit) : scored;
}

export function variantText(v: Variant): string {
  return `${v.make} ${v.model} ${v.gen} ${v.engine} ${v.from}`;
}

/** Makes in the data for this kind, A-Z, filtered by the query. */
export function makesFor(list: Variant[], kind: VehicleKind, query = ''): string[] {
  const makes = [...new Set(list.filter((v) => v.kind === kind).map((v) => v.make))].sort((a, b) => a.localeCompare(b));
  return byScore(makes, (m) => m, query);
}

/** Model families for a make, in dataset order (roughly by popularity), filtered by the query. */
export function modelsFor(list: Variant[], kind: VehicleKind, make: string, query = ''): string[] {
  const m = fold(make.trim());
  const models = [...new Set(list.filter((v) => v.kind === kind && fold(v.make) === m).map((v) => v.model))];
  return byScore(models, (x) => x, query);
}

/** Variants of one model, newest first. */
export function variantsFor(list: Variant[], kind: VehicleKind, make: string, model: string): Variant[] {
  const mk = fold(make.trim());
  const md = fold(model.trim());
  return list
    .filter((v) => v.kind === kind && fold(v.make) === mk && fold(v.model) === md)
    .sort((a, b) => b.from - a.from || b.bhp - a.bhp);
}

/** Free search across every variant of a kind ("golf r mk7", "r6 2017"). */
export function searchVariants(list: Variant[], kind: VehicleKind, query: string, limit = 30): Variant[] {
  if (!query.trim()) return [];
  return byScore(list.filter((v) => v.kind === kind), variantText, query, limit);
}

export function findVariant(list: Variant[], id: string | undefined): Variant | undefined {
  return id ? list.find((v) => v.id === id) : undefined;
}

export function yearsLabel(v: Pick<Variant, 'from' | 'to'>): string {
  if (v.to === v.from) return `${v.from}`;
  return v.to ? `${v.from}–${v.to}` : `${v.from}–on`;
}

/** The model as saved on a build: "Golf R Mk7.5". */
export function modelLabel(v: Pick<Variant, 'model' | 'gen'>): string {
  return `${v.model} ${v.gen}`.trim();
}

/** One line for pickers: "Mk7.5 · 2.0 TSI · 2017–2020 · 306 bhp". */
export function variantLine(v: Variant): string {
  return [v.gen, v.engine, yearsLabel(v), `${v.bhp} bhp`].filter(Boolean).join(' · ');
}

export interface SpecFill {
  make: string;
  model: string;
  /** Kept if it's inside the variant's years, else the first year. */
  year: number;
  stockBhp: number;
  weightKg: number;
  torqueLbFt?: number;
}

/** What picking a variant fills in. Everything stays editable afterwards. */
export function specFill(v: Variant, currentYear?: number): SpecFill {
  const last = v.to ?? 9999;
  const year = currentYear && currentYear >= v.from && currentYear <= last ? currentYear : v.from;
  return { make: v.make, model: modelLabel(v), year, stockBhp: v.bhp, weightKg: v.weightKg, torqueLbFt: v.torqueLbFt };
}

/**
 * Best guess at the variant behind a saved make and model (for builds saved
 * before the picker, or synced without the variant id). Only an exact
 * "Model Gen" match with one stock figure counts.
 */
export function guessVariant(list: Variant[], kind: VehicleKind, make: string, model: string, stockBhp?: number): Variant | undefined {
  const mk = fold(make.trim());
  const md = fold(model.trim());
  const hits = list.filter((v) => v.kind === kind && fold(v.make) === mk && fold(modelLabel(v)) === md);
  if (stockBhp) {
    const exact = hits.filter((v) => v.bhp === stockBhp);
    if (exact.length) return exact[0];
  }
  return hits.length === 1 ? hits[0] : undefined;
}

/** A donor for an engine swap: a dataset engine or any vehicle variant. */
export interface Donor {
  id: string;
  kind: VehicleKind;
  make: string;
  /** What the swap is called: engine code or "Model Gen". */
  name: string;
  detail: string;
  bhp: number;
  torqueLbFt?: number;
  asp: Aspiration;
  stages?: StageFigures;
}

export function donorFromEngine(e: DonorEngine): Donor {
  return { id: e.id, kind: e.kind, make: e.make, name: e.code, detail: e.label, bhp: e.bhp, torqueLbFt: e.torqueLbFt, asp: e.asp };
}

export function donorFromVariant(v: Variant): Donor {
  return {
    id: v.id, kind: v.kind, make: v.make, name: modelLabel(v), detail: `${v.engine} · ${yearsLabel(v)}`,
    bhp: v.bhp, torqueLbFt: v.torqueLbFt, asp: v.asp, stages: v.stages,
  };
}

/** Donor search: engines first, then whole vehicles; same kind as the chassis ranks first. */
export function searchDonors(engines: DonorEngine[], variants: Variant[], kind: VehicleKind, query: string, limit = 30): Donor[] {
  const all = [...engines.map(donorFromEngine), ...variants.map(donorFromVariant)];
  const sorted = [...all.filter((d) => d.kind === kind), ...all.filter((d) => d.kind !== kind)];
  if (!query.trim()) return sorted.filter((d) => d.id.startsWith('engine:')).slice(0, limit);
  return byScore(sorted, (d) => `${d.make} ${d.name} ${d.detail}`, query, limit);
}

/**
 * The model family the picker should show for a saved model: the variant's,
 * an exact family name, or the longest family the text starts with
 * ("Golf R Mk7.5" -> "Golf R"). Null for a free-typed model.
 */
export function familyFor(list: Variant[], kind: VehicleKind, make: string, model: string, variant?: Variant): string | null {
  if (variant) return variant.model;
  const md = fold(model.trim());
  if (!md) return null;
  const families = modelsFor(list, kind, make);
  const exact = families.find((f) => fold(f) === md);
  if (exact) return exact;
  const prefix = families.filter((f) => md.startsWith(`${fold(f)} `)).sort((a, b) => b.length - a.length);
  return prefix[0] ?? null;
}

/** The canonical spelling of a make in the data ("vw" stays as typed; "volkswagen" -> "Volkswagen"). */
export function canonicalMake(list: Variant[], kind: VehicleKind, make: string): string {
  const m = fold(make.trim());
  return list.find((v) => v.kind === kind && fold(v.make) === m)?.make ?? make;
}

/** Look a donor up by id: an engine from the engines list or a vehicle variant. */
export function findDonor(engines: DonorEngine[], variants: Variant[], id: string | undefined): Donor | undefined {
  if (!id) return undefined;
  const e = engines.find((x) => x.id === id);
  if (e) return donorFromEngine(e);
  const v = variants.find((x) => x.id === id);
  return v ? donorFromVariant(v) : undefined;
}
