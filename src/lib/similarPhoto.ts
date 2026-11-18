import { SAMPLE_PHOTOS } from '../data/samplePhotos';
import { SAMPLE_REF } from './photoSource';
import type { Build, VehicleKind } from './types';

/**
 * A stand-in photo for a demo build with no photo of its own (Redesign 2, 5.1 and L1): one of the
 * demo's licensed sample photos of the same model, or a close one (same make and kind). It's shown,
 * never saved on the build, and always labelled "similar" through the ⓘ credit. With no match the
 * build is drawn in its paint instead.
 */
type Match = { key: string; kind: VehicleKind; make: string; models: string[] };

const MATCHES: Match[] = [
  { key: 'b-jord-0', kind: 'car', make: 'ford', models: ['fiesta'] },
  { key: 'b-cal-0', kind: 'car', make: 'ford', models: ['focus'] },
  { key: 'b-kez-0', kind: 'car', make: 'honda', models: ['civic'] },
  { key: 'b-dan-0', kind: 'car', make: 'bmw', models: ['m4', '4 series'] },
  { key: 'b-sam-0', kind: 'car', make: 'bmw', models: ['m3', '3 series', 'e46'] },
  { key: 'b-priya-0', kind: 'car', make: 'bmw', models: ['m140', 'm135', '1 series', 'm2', 'm240'] },
  { key: 'b-mo-0', kind: 'car', make: 'audi', models: ['rs3', 's3', 'a3'] },
  { key: 'b-bex-0', kind: 'car', make: 'volkswagen', models: ['golf', 'polo', 'scirocco'] },
  { key: 'b-tay-0', kind: 'car', make: 'subaru', models: ['impreza', 'wrx', 'sti'] },
  { key: 'b-ash-0', kind: 'car', make: 'citroën', models: ['saxo', 'c2'] },
  { key: 'b-nina-0', kind: 'car', make: 'mazda', models: ['mx-5', 'mx5'] },
  { key: 'b-em-0', kind: 'car', make: 'hyundai', models: ['i30', 'i20', 'veloster'] },
  { key: 'b-tom-0', kind: 'car', make: 'toyota', models: ['yaris'] },
  { key: 'b-aimee-0', kind: 'bike', make: 'yamaha', models: ['r1'] },
  { key: 'b-raf-0', kind: 'bike', make: 'yamaha', models: ['r6', 'r7', 'r3'] },
  { key: 'b-deano-0', kind: 'bike', make: 'yamaha', models: ['mt-09', 'mt09', 'mt-07', 'mt07', 'mt-10', 'xsr'] },
  { key: 'b-liv-0', kind: 'bike', make: 'triumph', models: ['street triple', 'speed triple', 'trident'] },
  { key: 'b-sully-0', kind: 'bike', make: 'kawasaki', models: ['zx-10', 'zx10', 'zx-6', 'zx6'] },
  { key: 'b-lew-0', kind: 'bike', make: 'kawasaki', models: ['ninja 400', 'ninja 650', 'ninja', 'z400', 'z650'] },
  { key: 'b-gaz-0', kind: 'bike', make: 'suzuki', models: ['gsx-r', 'gsxr', 'gsx-s'] },
];

const ALIASES: Record<string, string> = { vw: 'volkswagen', citroen: 'citroën' };
const norm = (s: string) => s.trim().toLowerCase();
const makeKey = (m: string) => ALIASES[norm(m)] ?? norm(m);

/** The sample photo key for a make and model: the same model first, else the same make and kind. */
export function similarSampleKey(make: string, model: string, kind: VehicleKind): string | null {
  const mk = makeKey(make);
  const md = norm(model);
  const sameMake = MATCHES.filter((m) => m.kind === kind && m.make === mk && SAMPLE_PHOTOS[m.key]);
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
