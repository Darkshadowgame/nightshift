import { SAMPLE_PHOTOS } from '../data/samplePhotos';
import { SAMPLE_REF } from './photoSource';
import type { Build, VehicleKind } from './types';

/**
 * A stand-in photo for a demo build with no photo of its own (Redesign 2, 5.1 and L1): a licensed
 * photo of the same model, or a close one (same make and kind). It's shown, never saved on the
 * build, and always labelled "similar" through the ⓘ credit. With no match the build is drawn in
 * its paint instead, which is honest.
 *
 * REVIEW-12 #7: a stand-in must never be a photo another sample person's build or post uses, or
 * "your" car reads as theirs (the Fiesta ST Mk8 showed @jordST's Mk7). Every licensed car and bike
 * photo in samplePhotos.ts today is a sample person's own build, so this list is empty and every
 * build without a photo is drawn in its paint. Add a key here only for a photo nobody in the demo
 * owns (`__tests__/postPrivacy.test.ts` checks it).
 */
type Match = { key: string; kind: VehicleKind; make: string; models: string[] };

export const STAND_INS: Match[] = [];

const ALIASES: Record<string, string> = { vw: 'volkswagen', citroen: 'citroën' };
const norm = (s: string) => s.trim().toLowerCase();
const makeKey = (m: string) => ALIASES[norm(m)] ?? norm(m);

/** The sample photo key for a make and model: the same model first, else the same make and kind. */
export function similarSampleKey(make: string, model: string, kind: VehicleKind): string | null {
  const mk = makeKey(make);
  const md = norm(model);
  const sameMake = STAND_INS.filter((m) => m.kind === kind && m.make === mk && SAMPLE_PHOTOS[m.key]);
  const exact = sameMake.find((m) => m.models.some((x) => md.includes(x)));
  return (exact ?? sameMake[0])?.key ?? null;
}

/**
 * What a build shows as its picture: its own first photo; or, in the demo, a similar sample photo
 * (`similar` says so for the credit); or nothing (draw it in its paint).
 */
export function buildPicture(b: Pick<Build, 'photos' | 'make' | 'model' | 'kind'>, demo: boolean): { ref: string; similar: boolean } | null {
  if (b.photos[0]) return { ref: b.photos[0], similar: false };
  if (!demo) return null;
  const key = similarSampleKey(b.make, b.model, b.kind);
  return key ? { ref: `${SAMPLE_REF}${key}`, similar: true } : null;
}
