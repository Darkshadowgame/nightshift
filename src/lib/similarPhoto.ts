import { SAMPLE_PHOTOS } from '../data/samplePhotos';
import { STAND_IN_PHOTOS } from '../data/standInPhotos';
import { SAMPLE_REF } from './photoSource';
import type { Build, VehicleKind } from './types';

/**
 * A stand-in photo for a demo build with no photo of its own (Redesign 2, 5.1 and L1; REVIEW-13 #2):
 * a licensed Commons photo of the same model, else the same model's other generation, else a car
 * (or bike) of the same make. It's shown, never saved on the build, and the ⓘ credit says what it
 * is ("the same model, not your car" or "a similar car: …"). With nothing from the make the build
 * is drawn in its paint instead, which is honest.
 *
 * REVIEW-12 #7: a stand-in is never a photo another sample person's build or post uses, or "your"
 * car reads as theirs. The pool (standInPhotos.ts) is only photos nobody in the demo owns
 * (`__tests__/postPrivacy.test.ts` checks it).
 */
export type StandInEntry = {
  /** The photo's key in SAMPLE_PHOTOS. */
  key: string;
  kind: VehicleKind;
  /** Lower case, as normalised by `makeKey`. */
  make: string;
  /** The model family as the vehicle list names it ("Fiesta ST", "YZF-R6"), lower case. */
  model: string;
  /** The generation(s) the photo shows, as words in the saved model ("mk8", "e92", "fk2"). */
  gens?: string[];
  /** For bikes whose generations are years: the model years the photo's generation covers. */
  years?: [number, number];
};

/** How close a stand-in is: the same model and generation, another generation, or the same make. */
export type StandInMatch = 'model' | 'generation' | 'make';

export const STAND_INS: StandInEntry[] = STAND_IN_PHOTOS.flatMap((p) => p.fits.map((f) => ({ key: p.key, kind: p.kind, ...f })));

const ALIASES: Record<string, string> = { vw: 'volkswagen', citroen: 'citroën', 'mercedes-amg': 'mercedes', 'mercedes-benz': 'mercedes' };
const norm = (s: string) => s.trim().toLowerCase().replace(/[^\p{L}\p{N}.\-+ ]+/gu, ' ').replace(/\s+/g, ' ');
export const makeKey = (m: string) => ALIASES[norm(m)] ?? norm(m);

/** "golf r mk7" starts with the family "golf r" (as a whole word), not with "golf". */
const startsWithWord = (s: string, prefix: string) => s === prefix || s.startsWith(`${prefix} `);
const hasWord = (s: string, w: string) => ` ${s} `.includes(` ${w} `);

/** The stand-in for a make and model: the same model and generation, else another generation, else the same make and kind. */
export function similarSample(make: string, model: string, kind: VehicleKind, year?: number | null): { key: string; match: StandInMatch } | null {
  const mk = makeKey(make);
  const md = norm(model);
  const sameMake = STAND_INS.filter((m) => m.kind === kind && m.make === mk && SAMPLE_PHOTOS[m.key]);
  if (!sameMake.length) return null;
  // The longest family that the saved model starts with: "Golf GTI" over "Golf".
  const fams = sameMake.filter((m) => startsWithWord(md, m.model));
  const best = Math.max(0, ...fams.map((m) => m.model.length));
  const sameModel = fams.filter((m) => m.model.length === best);
  if (sameModel.length) {
    const rest = md.slice(best).trim();
    const exact = sameModel.find((m) => {
      if (m.gens?.length) return m.gens.some((g) => hasWord(rest, g));
      if (m.years && year) return year >= m.years[0] && year <= m.years[1];
      return !m.years;
    });
    return exact ? { key: exact.key, match: 'model' } : { key: sameModel[0].key, match: 'generation' };
  }
  return { key: sameMake[0].key, match: 'make' };
}

/** Kept for callers that only want the key. */
export function similarSampleKey(make: string, model: string, kind: VehicleKind, year?: number | null): string | null {
  return similarSample(make, model, kind, year)?.key ?? null;
}

export type BuildPicture = { ref: string; standIn: StandInMatch | null };

/**
 * What a build shows as its picture: its own first photo; or, in the demo, a stand-in photo
 * (`standIn` says how close, for the credit); or nothing (draw it in its paint).
 */
export function buildPicture(b: Pick<Build, 'photos' | 'make' | 'model' | 'kind'> & { year?: number | null }, demo: boolean): BuildPicture | null {
  if (b.photos[0]) return { ref: b.photos[0], standIn: null };
  if (!demo) return null;
  const s = similarSample(b.make, b.model, b.kind, b.year);
  return s ? { ref: `${SAMPLE_REF}${s.key}`, standIn: s.match } : null;
}
