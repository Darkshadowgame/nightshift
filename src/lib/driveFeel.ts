import { hasCompleted } from './spots';
import type { Spot } from './types';

/**
 * Drive "feels": what a drive is like to drive. People who have done a drive tag it. The tags
 * are kept on this phone; a drive also shows the feels its own description names ("twisty",
 * "views"), so there is something to filter by from the first day.
 */
export type Feel = 'twisty' | 'scenic' | 'smooth' | 'quiet';
export const FEELS: readonly Feel[] = ['twisty', 'scenic', 'smooth', 'quiet'];
export const FEEL_LABELS: Record<Feel, string> = { twisty: 'Twisty', scenic: 'Scenic', smooth: 'Smooth surface', quiet: 'Quiet' };

/** Spot id -> the feels you tagged it with. */
export type FeelTags = Record<string, Feel[]>;

const WORDS: Record<Feel, RegExp> = {
  twisty: /twist|bends?\b|hairpin|corners?\b|sweeping|switchback/i,
  scenic: /scenic|views?\b|valley|moor|lake|coast|hills?\b|panoram|reservoir|gorge|dale/i,
  smooth: /smooth|resurfac|fresh tarmac|well[- ]surfaced/i,
  quiet: /quiet|empty|little traffic|lightly used|single[- ]track|back road/i,
};

/** Feels a drive's own description names. */
export function describedFeels(spot: Pick<Spot, 'description' | 'name'>): Feel[] {
  const text = `${spot.name}. ${spot.description}`;
  return FEELS.filter((f) => WORDS[f].test(text));
}

export function savedFeelTags(raw: unknown): FeelTags {
  const out: FeelTags = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [id, v] of Object.entries(raw as Record<string, unknown>)) {
    if (Array.isArray(v)) {
      const feels = FEELS.filter((f) => v.includes(f));
      if (feels.length) out[id] = feels;
    }
  }
  return out;
}

/** Only people who have done the drive can tag it. */
export function canTagFeel(spot: Spot, me: string): boolean {
  return spot.kind === 'drive' && hasCompleted(spot, me) && spot.authorId !== me;
}

/** Tag or untag one feel (an empty set is dropped). */
export function toggleFeel(tags: FeelTags, spotId: string, feel: Feel): FeelTags {
  const cur = tags[spotId] ?? [];
  const next = cur.includes(feel) ? cur.filter((f) => f !== feel) : FEELS.filter((f) => f === feel || cur.includes(f));
  const out = { ...tags };
  if (next.length) out[spotId] = next;
  else delete out[spotId];
  return out;
}

/** Replace a drive's tags with exactly these (an empty set is dropped). */
export function setFeels(tags: FeelTags, spotId: string, feels: readonly Feel[]): FeelTags {
  const out = { ...tags };
  const next = FEELS.filter((f) => feels.includes(f));
  if (next.length) out[spotId] = next;
  else delete out[spotId];
  return out;
}

/** A drive's top feels: yours first, then what its description names. At most `max`. */
export function topFeels(spot: Spot, tags: FeelTags, max = 3): { feel: Feel; mine: boolean }[] {
  const mine = tags[spot.id] ?? [];
  const rest = describedFeels(spot).filter((f) => !mine.includes(f));
  return [...mine.map((feel) => ({ feel, mine: true })), ...rest.map((feel) => ({ feel, mine: false }))].slice(0, max);
}

/** Drives that have every chosen feel (none chosen: all). Non-drives pass through only with no filter. */
export function filterByFeel<T extends Spot>(spots: readonly T[], chosen: readonly Feel[], tags: FeelTags): T[] {
  if (!chosen.length) return [...spots];
  return spots.filter((s) => {
    if (s.kind !== 'drive') return false;
    const have = new Set(topFeels(s, tags, FEELS.length).map((x) => x.feel));
    return chosen.every((f) => have.has(f));
  });
}
