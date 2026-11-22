import type { Crew } from './types';

/**
 * Crew emblems: a built-in set, no upload. An emblem is a shape and a paint swatch from the theme
 * (`COLOR.paint`, the same in light and dark), stored as one short key like "bolt-2".
 * The server checks the same pattern (set_crew_emblem).
 */
export const EMBLEM_SHAPES = ['shield', 'bolt', 'wheel', 'flag', 'star', 'chevron'] as const;
export type EmblemShape = (typeof EMBLEM_SHAPES)[number];

export const SHAPE_LABELS: Record<EmblemShape, string> = { shield: 'Shield', bolt: 'Bolt', wheel: 'Wheel', flag: 'Flag', star: 'Star', chevron: 'Chevron' };

/** How many paint swatches `COLOR.paint` has. */
export const EMBLEM_PAINTS = 8;

export const EMBLEM_RE = /^(shield|bolt|wheel|flag|star|chevron)-[0-7]$/;

export function isEmblem(key: string | undefined | null): key is string {
  return !!key && EMBLEM_RE.test(key);
}

/** Every pick: each shape in each paint. */
export const EMBLEMS: string[] = EMBLEM_SHAPES.flatMap((s) => Array.from({ length: EMBLEM_PAINTS }, (_, p) => `${s}-${p}`));

export function emblemParts(key: string): { shape: EmblemShape; paint: number } {
  const [shape, paint] = key.split('-');
  return { shape: shape as EmblemShape, paint: Number(paint) };
}

/** Light swatches (white, yellow, orange) get a dark mark, the rest a light one. Indexes into `COLOR.paint`. */
export function emblemMarkIsLight(paint: number): boolean {
  return ![0, 4, 7].includes(paint);
}

const PAINT_NAMES = ['white', 'black', 'red', 'blue', 'yellow', 'green', 'grey', 'orange'];

export function emblemLabel(key: string): string {
  const { shape, paint } = emblemParts(key);
  return `${SHAPE_LABELS[shape]}, ${PAINT_NAMES[paint] ?? 'plain'}`;
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** The emblem a crew shows: the one its owner picked, else a steady default from its id so none is blank. */
export function emblemOf(crew: Pick<Crew, 'id' | 'emblem'>): string {
  if (isEmblem(crew.emblem)) return crew.emblem;
  const h = hash(crew.id);
  return `${EMBLEM_SHAPES[h % EMBLEM_SHAPES.length]}-${(h >>> 3) % EMBLEM_PAINTS}`;
}

/** The owner picks the emblem. Throws with a readable reason. */
export function withEmblem(crews: Crew[], actorId: string, crewId: string, key: string): Crew[] {
  const crew = crews.find((c) => c.id === crewId);
  if (!crew) throw new Error('That crew no longer exists.');
  if (crew.ownerId !== actorId) throw new Error('Only the crew owner can change the emblem.');
  if (!isEmblem(key)) throw new Error('Pick one of the emblems on the list.');
  return crews.map((c) => (c.id === crewId ? { ...c, emblem: key } : c));
}
