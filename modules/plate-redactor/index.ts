import { requireOptionalNativeModule } from 'expo';

/** Box in normalised 0–1 coordinates, top-left origin, on the upright photo. */
export interface PlateBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Native {
  detectPlates(uri: string): Promise<{ width: number; height: number; boxes: PlateBox[] }>;
  redact(uri: string, boxes: PlateBox[], style: 'pixelate' | 'fill', maxPixelSize: number): Promise<{ uri: string; width: number; height: number }>;
}

/** Null on web, in Expo Go, or in any build without the native module. */
const native = requireOptionalNativeModule<Native>('PlateRedactor');

export const plateRedactorAvailable = native != null;

export async function detectPlates(uri: string) {
  if (!native) return null;
  return native.detectPlates(uri);
}

export async function redact(uri: string, boxes: PlateBox[], style: 'pixelate' | 'fill' = 'pixelate', maxPixelSize = 2048) {
  if (!native) return null;
  return native.redact(uri, boxes, style, maxPixelSize);
}
