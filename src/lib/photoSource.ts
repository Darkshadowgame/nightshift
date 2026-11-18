import type { ImageSourcePropType } from 'react-native';
import { SAMPLE_PHOTOS, type SamplePhoto } from '../data/samplePhotos';
import { photoUri } from './photos';

/**
 * Photos of the demo's sample builds, posts and photo spots are real, freely licensed photos from
 * Wikimedia Commons, bundled small (src/data/samplePhotos.ts). They're stored on a build or post as
 * `sample:<key>`, so a saved demo never holds a file path, and are credited wherever they show.
 */
export const SAMPLE_REF = 'sample:';

export function sampleRef(key: string): string | null {
  return SAMPLE_PHOTOS[key] ? `${SAMPLE_REF}${key}` : null;
}

/** The sample photo behind a ref (or a place id), if it is one. */
export function samplePhoto(refOrKey: string | undefined | null): SamplePhoto | undefined {
  if (!refOrKey) return undefined;
  return SAMPLE_PHOTOS[refOrKey.startsWith(SAMPLE_REF) ? refOrKey.slice(SAMPLE_REF.length) : refOrKey];
}

/** What an Image shows for a stored photo, a sample photo or a URL. */
export function photoSource(ref: string): ImageSourcePropType {
  const sample = ref.startsWith(SAMPLE_REF) ? samplePhoto(ref) : undefined;
  return sample ? (sample.image as ImageSourcePropType) : { uri: photoUri(ref) };
}

/** "Photo: Vauxford · CC BY-SA 4.0 · similar car: Golf GTI Mk7.5 · plate blurred". */
export function creditLine(p: SamplePhoto, kind: 'car' | 'bike' | 'place' = 'car'): string {
  const parts = [`Photo: ${p.author}`, p.licence];
  if (p.similar) parts.push(`${kind === 'place' ? 'nearby' : `similar ${kind}`}: ${p.similar}`);
  if (p.edited) parts.push(p.edited.charAt(0).toLowerCase() + p.edited.slice(1));
  return parts.join(' · ');
}
