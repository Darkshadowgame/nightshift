import { goldenHourState } from './sun';
import { textProblem } from './moderation';
import { clock, countdown } from './when';
import type { LatLng, Spot } from './types';

/**
 * Photo-spot extras (Level-up, places): example shots, the light badge, access notes, collections
 * and the shot of the week. Pure logic; the screens are in components/PlaceExtras.tsx and the
 * phone's own saves in extrasStore.ts.
 */

// ---------------------------------------------------------------------------
// 1. Example shots
// ---------------------------------------------------------------------------

export const MAX_SHOTS = 3;

export interface SpotShot {
  /** A stored photo name or a `sample:` ref. */
  ref: string;
  userId?: string;
  /** Day it was taken, YYYY-MM-DD. */
  on?: string;
}

/**
 * Up to three example framings of a spot, from photos taken there: the suggester's own photo
 * first (a photo spot always has one), then check-in photos, newest first. `extra` carries the
 * demo's sample shots. Each photo shows once.
 */
export function sampleShots(spot: Pick<Spot, 'photo' | 'completions' | 'authorId'>, extra: readonly SpotShot[] = [], max = MAX_SHOTS): SpotShot[] {
  const out: SpotShot[] = [];
  const seen = new Set<string>();
  const add = (s: SpotShot) => {
    if (out.length < max && !seen.has(s.ref)) {
      seen.add(s.ref);
      out.push(s);
    }
  };
  if (spot.photo) add({ ref: spot.photo, ...(spot.authorId ? { userId: spot.authorId } : {}) });
  const visits = spot.completions.flatMap((c) => (c.photo ? [{ ref: c.photo, userId: c.userId, on: c.on }] : []));
  visits.sort((a, b) => b.on.localeCompare(a.on)).forEach(add);
  [...extra].sort((a, b) => (b.on ?? '').localeCompare(a.on ?? '')).forEach(add);
  return out;
}

// ---------------------------------------------------------------------------
// 2. The light badge
// ---------------------------------------------------------------------------

/**
 * "Golden hour until 18:12", "Good light from 17:20 (in 40 min)" or "Good light from 17:20", or
 * null when neither is near. Times are the 4.10 words: the 24-hour clock, with a countdown only
 * under an hour. Worked out on the phone from the place's own position (sun.ts).
 */
export function lightBadge(now: Date, at: LatLng): { text: string; now: boolean } | null {
  const g = goldenHourState(now, at);
  if (!g) return null;
  if (g.state === 'now') return { text: `Golden hour until ${clock(g.end)}`, now: true };
  const c = countdown(g.start, now);
  return { text: `Good light from ${clock(g.start)}${c ? ` ${c}` : ''}`, now: false };
}

// ---------------------------------------------------------------------------
// 3. Access notes
// ---------------------------------------------------------------------------

export type Security = 'none' | 'patrols' | 'moves-on';
export type LowCars = 'ok' | 'scrapes';

export interface AccessNote {
  id: string;
  spotId: string;
  userId: string;
  /** The day it was written, YYYY-MM-DD. */
  on: string;
  /** The car park has a barrier or gate that shuts. */
  barrier?: boolean;
  /** When it shuts, "22:00". */
  closes?: string;
  security?: Security;
  lowCars?: LowCars;
  /** One short line of detail. */
  text?: string;
}

export const MAX_NOTE_TEXT = 120;
export const SECURITY_LABELS: Record<Security, string> = { none: 'No security seen', patrols: 'Security patrols', 'moves-on': 'Security moves people on' };
export const LOW_CARS_LABELS: Record<LowCars, string> = { ok: 'Fine for low cars', scrapes: 'Low cars may scrape' };

export interface AccessDraft {
  barrier: boolean;
  closes: string;
  security: Security | null;
  lowCars: LowCars | null;
  text: string;
}

export const EMPTY_ACCESS: AccessDraft = { barrier: false, closes: '', security: null, lowCars: null, text: '' };

const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** "2200", "22.00" or "9:30" to "22:00" / "09:30"; null when it isn't a time. */
export function normaliseClock(text: string): string | null {
  const t = text.trim().replace('.', ':');
  const m = /^(\d{1,2}):?(\d{2})$/.exec(t);
  if (!m) return null;
  const out = `${m[1].padStart(2, '0')}:${m[2]}`;
  return TIME.test(out) ? out : null;
}

/** What's wrong with an access note before it's saved, or null. At least one fact is needed. */
export function accessProblem(d: AccessDraft): string | null {
  const text = d.text.trim();
  if (d.closes.trim() && !normaliseClock(d.closes)) return 'Enter the closing time like 22:00.';
  if (d.closes.trim() && !d.barrier) return 'Tick that it has a barrier or gate to add a closing time.';
  if (!d.barrier && !d.security && !d.lowCars && !text) return 'Add at least one thing you know about getting in.';
  if (text.length > MAX_NOTE_TEXT) return `Keep it to ${MAX_NOTE_TEXT} characters.`;
  return text ? textProblem(text) : null;
}

/** Turn a checked draft into a note. Throws with the reason if it isn't ready. */
export function makeAccessNote(d: AccessDraft, ctx: { id: string; spotId: string; userId: string; on: string }): AccessNote {
  const problem = accessProblem(d);
  if (problem) throw new Error(problem);
  const closes = d.closes.trim() ? normaliseClock(d.closes) : null;
  const text = d.text.trim();
  return {
    id: ctx.id,
    spotId: ctx.spotId,
    userId: ctx.userId,
    on: ctx.on,
    ...(d.barrier ? { barrier: true } : {}),
    ...(closes ? { closes } : {}),
    ...(d.security ? { security: d.security } : {}),
    ...(d.lowCars ? { lowCars: d.lowCars } : {}),
    ...(text ? { text } : {}),
  };
}

/** The plain-words summary of one note: "Barrier shuts 22:00 · Security patrols · Fine for low cars". */
export function accessLine(n: AccessNote): string {
  return [
    n.barrier ? (n.closes ? `Barrier shuts ${n.closes}` : 'Has a barrier or gate') : null,
    n.security ? SECURITY_LABELS[n.security] : null,
    n.lowCars ? LOW_CARS_LABELS[n.lowCars] : null,
  ]
    .filter(Boolean)
    .join(' · ');
}

/** Notes for a spot, newest first; one per person (their latest). */
export function notesFor(notes: readonly AccessNote[], spotId: string): AccessNote[] {
  const latest = new Map<string, AccessNote>();
  for (const n of notes) {
    if (n.spotId !== spotId) continue;
    const mine = latest.get(n.userId);
    if (!mine || n.on >= mine.on) latest.set(n.userId, n);
  }
  return [...latest.values()].sort((a, b) => b.on.localeCompare(a.on));
}

/**
 * The headline across everyone's notes. A barrier counts when any note says so (the safest
 * reading) and the closing time is the earliest given; security is what most people said; one
 * person saying low cars scrape outweighs several saying it's fine.
 */
export function accessSummary(notes: readonly AccessNote[]): string | null {
  if (!notes.length) return null;
  const barrier = notes.some((n) => n.barrier);
  const closes = notes.flatMap((n) => (n.closes ? [n.closes] : [])).sort()[0];
  const counts = new Map<Security, number>();
  for (const n of notes) if (n.security) counts.set(n.security, (counts.get(n.security) ?? 0) + 1);
  const security = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const low: LowCars | undefined = notes.some((n) => n.lowCars === 'scrapes') ? 'scrapes' : notes.some((n) => n.lowCars === 'ok') ? 'ok' : undefined;
  return (
    [
      barrier ? (closes ? `Barrier shuts ${closes}` : 'Has a barrier or gate') : null,
      security ? SECURITY_LABELS[security] : null,
      low ? LOW_CARS_LABELS[low] : null,
    ]
      .filter(Boolean)
      .join(' · ') || null
  );
}

// ---------------------------------------------------------------------------
// 4. Collections
// ---------------------------------------------------------------------------

export interface CollectionDef {
  key: string;
  title: string;
  /** Matches a spot's name and description. */
  match: RegExp;
}

export const COLLECTIONS: CollectionDef[] = [
  { key: 'multi-storeys', title: 'Multi-storeys', match: /multi-?\s?stor(e)?y|rooftop|roof deck/i },
  { key: 'coast', title: 'Coast and seafront', match: /seafront|esplanade|\bbeach|\bpier\b|promenade|\bmarina\b|\bquay\b|\bcoast/i },
  { key: 'tunnels-bridges', title: 'Bridges and tunnels', match: /\btunnel|\bbridge\b|viaduct|\bflyover/i },
  { key: 'retail-parks', title: 'Retail parks', match: /retail park|shopping (centre|park)|leisure park|trading estate/i },
  { key: 'cafes-pubs', title: 'Cafes and pubs', match: /\bcafe\b|café|\bcoffee\b|\bpub\b|moto cafe|bikers/i },
  { key: 'hills-passes', title: 'Hills and passes', match: /\bpass\b|\bdowns\b|\bhead\b|\bhill\b|\bpeak\b|\bmoor\b|\bcorner\b/i },
];

/** A set needs at least this many places to show. */
export const MIN_COLLECTION = 3;

export interface CollectionProgress {
  def: CollectionDef;
  spots: Spot[];
  done: number;
  total: number;
}

const inSet = (s: Spot, def: CollectionDef) => s.kind === 'photo' && s.status === 'approved' && def.match.test(`${s.name} ${s.description}`);

/** The collections one spot belongs to. */
export function collectionsOfSpot(spot: Spot): CollectionDef[] {
  return COLLECTIONS.filter((d) => inSet(spot, d));
}

/** Progress in one collection ("3 of 8 done"), from the places' own completions. */
export function collectionProgress(def: CollectionDef, spots: readonly Spot[], me: string): CollectionProgress | null {
  const members = spots.filter((s) => inSet(s, def)).sort((a, b) => a.name.localeCompare(b.name));
  if (members.length < MIN_COLLECTION) return null;
  return { def, spots: members, done: members.filter((s) => s.completions.some((c) => c.userId === me)).length, total: members.length };
}

/** Every collection a spot is in, with progress. */
export function spotCollections(spot: Spot, spots: readonly Spot[], me: string): CollectionProgress[] {
  return collectionsOfSpot(spot).flatMap((d) => collectionProgress(d, spots, me) ?? []);
}

/** "3 of 8 done". */
export function progressText(p: Pick<CollectionProgress, 'done' | 'total'>): string {
  return `${p.done} of ${p.total} done`;
}

// ---------------------------------------------------------------------------
// 5. Shot of the week
// ---------------------------------------------------------------------------

export const WEEK_MS = 7 * 86_400_000;

export interface ShotLike {
  /** The photo's ref. */
  ref: string;
  /** Who liked it (the demo's sample people, or you). */
  userId: string;
  /** ISO time. */
  at: string;
}

export interface FeaturedShot {
  ref: string;
  spotId: string;
  userId?: string;
  likes: number;
}

/**
 * One featured photo per region: the shot with the most likes in the last 7 days. Ties go to the
 * newer photo (then the ref, so it never flips). A photo with no likes this week is never featured.
 */
export function shotOfTheWeek(
  region: string | undefined,
  spots: readonly Spot[],
  extra: readonly (SpotShot & { spotId: string })[],
  likes: readonly ShotLike[],
  now: Date,
): FeaturedShot | null {
  if (!region) return null;
  const since = now.getTime() - WEEK_MS;
  const count = new Map<string, Set<string>>();
  for (const l of likes) {
    const t = Date.parse(l.at);
    if (t > since && t <= now.getTime()) count.set(l.ref, (count.get(l.ref) ?? new Set()).add(l.userId));
  }
  const candidates: (FeaturedShot & { on: string })[] = [];
  const seen = new Set<string>();
  for (const s of spots) {
    if (s.kind !== 'photo' || s.status !== 'approved' || s.region !== region) continue;
    const shots = [...sampleShots(s, [], 999), ...extra.filter((e) => e.spotId === s.id)];
    for (const sh of shots) {
      const n = count.get(sh.ref)?.size ?? 0;
      if (!n || seen.has(sh.ref)) continue;
      seen.add(sh.ref);
      candidates.push({ ref: sh.ref, spotId: s.id, ...(sh.userId ? { userId: sh.userId } : {}), likes: n, on: sh.on ?? '' });
    }
  }
  candidates.sort((a, b) => b.likes - a.likes || b.on.localeCompare(a.on) || a.ref.localeCompare(b.ref));
  const top = candidates[0];
  return top ? { ref: top.ref, spotId: top.spotId, userId: top.userId, likes: top.likes } : null;
}
