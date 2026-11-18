/**
 * Crop maths for the photo crop editor (CropEditor.tsx). Pure, so it's tested.
 *
 * The editor works on the photo as it looks after rotation ("view" space), in
 * that image's own units: W x H is the rotated image's size. A crop box is
 * { x, y, w, h } in those units with a top-left origin. When the crop is
 * applied, the box is mapped back to the original (unrotated) image's pixels,
 * cropped there, then rotated (see sourceRect).
 */

export type Rotation = 0 | 90 | 180 | 270;

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type Handle = 'tl' | 'tr' | 'bl' | 'br';

/**
 * The garage card's photo shape (width / height). BuildHero is drawn at this
 * aspect on the garage, so a "Cover" crop fills it with nothing cut off.
 */
export const COVER_ASPECT = 1.9;

export type AspectKey = 'free' | '1:1' | '4:5' | '4:3' | '16:9' | 'cover';

export const ASPECTS: { key: AspectKey; label: string; ratio: number | null }[] = [
  { key: 'free', label: 'Free', ratio: null },
  // "Cover" alone was unclear (REVIEW-8): it's the garage card's wide shape.
  { key: 'cover', label: 'Garage card', ratio: COVER_ASPECT },
  { key: '1:1', label: '1:1', ratio: 1 },
  { key: '4:5', label: '4:5', ratio: 4 / 5 },
  { key: '4:3', label: '4:3', ratio: 4 / 3 },
  { key: '16:9', label: '16:9', ratio: 16 / 9 },
];

export function aspectRatio(key: AspectKey): number | null {
  return ASPECTS.find((a) => a.key === key)?.ratio ?? null;
}

/** The smallest side a crop box may have, as a share of the image's shorter side. */
export function minSide(W: number, H: number): number {
  return Math.max(1, Math.min(W, H) * 0.08);
}

/** The image's size after turning it clockwise by `rot`. */
export function rotatedSize(w: number, h: number, rot: Rotation): { w: number; h: number } {
  return rot === 90 || rot === 270 ? { w: h, h: w } : { w, h };
}

/** The next clockwise quarter turn. */
export function nextRotation(rot: Rotation): Rotation {
  return ((rot + 90) % 360) as Rotation;
}

export function fullBox(W: number, H: number): Box {
  return { x: 0, y: 0, w: W, h: H };
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Keep a box inside the image and no smaller than `min` on either side. */
export function clampBox(b: Box, W: number, H: number, min = minSide(W, H)): Box {
  const w = clamp(b.w, Math.min(min, W), W);
  const h = clamp(b.h, Math.min(min, H), H);
  return { x: clamp(b.x, 0, W - w), y: clamp(b.y, 0, H - h), w, h };
}

/** Slide a box by (dx, dy), stopping at the image edges. Its size never changes. */
export function moveBox(b: Box, dx: number, dy: number, W: number, H: number): Box {
  return { ...b, x: clamp(b.x + dx, 0, W - b.w), y: clamp(b.y + dy, 0, H - b.h) };
}

/**
 * The biggest box of the given shape that fits the image, centred on `around`'s
 * centre (or the image's) and pushed back inside if needed. Free gives the
 * box unchanged (or the whole image).
 */
export function fitAspect(W: number, H: number, ratio: number | null, around?: Box): Box {
  if (ratio == null) return around ? clampBox(around, W, H) : fullBox(W, H);
  let w = W;
  let h = W / ratio;
  if (h > H) {
    h = H;
    w = H * ratio;
  }
  const cx = around ? around.x + around.w / 2 : W / 2;
  const cy = around ? around.y + around.h / 2 : H / 2;
  return { x: clamp(cx - w / 2, 0, W - w), y: clamp(cy - h / 2, 0, H - h), w, h };
}

/**
 * Grow or shrink a box about its centre by `factor`, keeping its shape and
 * staying inside the image (for the screen reader's bigger / smaller actions).
 */
export function scaleBox(b: Box, factor: number, W: number, H: number, min = minSide(W, H)): Box {
  const ratio = b.w / b.h;
  let w = b.w * factor;
  const maxW = Math.min(W, H * ratio);
  w = clamp(w, Math.min(Math.max(min, min * ratio), maxW), maxW);
  const h = w / ratio;
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  return { x: clamp(cx - w / 2, 0, W - w), y: clamp(cy - h / 2, 0, H - h), w, h };
}

/**
 * Drag one corner of `start` by (dx, dy). The opposite corner stays put, the box
 * can't cross over itself or leave the image, and with a ratio it keeps that
 * shape (following whichever way the finger moved further).
 */
export function dragCorner(
  start: Box,
  handle: Handle,
  dx: number,
  dy: number,
  W: number,
  H: number,
  ratio: number | null,
  min = minSide(W, H),
): Box {
  const left = handle === 'tl' || handle === 'bl';
  const top = handle === 'tl' || handle === 'tr';
  // The fixed corner.
  const ax = left ? start.x + start.w : start.x;
  const ay = top ? start.y + start.h : start.y;
  // Room from the fixed corner to the image edge, in the direction the box grows.
  const roomW = left ? ax : W - ax;
  const roomH = top ? ay : H - ay;
  // The size the finger asks for.
  let w = start.w + (left ? -dx : dx);
  let h = start.h + (top ? -dy : dy);

  if (ratio == null) {
    w = clamp(w, Math.min(min, roomW), roomW);
    h = clamp(h, Math.min(min, roomH), roomH);
  } else {
    // Follow the bigger change, then fit the shape inside the room.
    w = Math.max(w, h * ratio);
    const maxW = Math.min(roomW, roomH * ratio);
    const minW = Math.min(Math.max(min, min * ratio), maxW);
    w = clamp(w, minW, maxW);
    h = w / ratio;
  }
  return { x: left ? ax - w : ax, y: top ? ay - h : ay, w, h };
}

/**
 * Where a box lands after the image turns a quarter clockwise. `H` is the
 * image's height before turning (a W x H image becomes H x W).
 */
export function rotateBoxClockwise(b: Box, H: number): Box {
  return { x: H - b.y - b.h, y: b.x, w: b.h, h: b.w };
}

/** Whether the box is (to within half a unit) the whole image, so there's nothing to crop. */
export function isWholeImage(b: Box, W: number, H: number): boolean {
  return b.x <= 0.5 && b.y <= 0.5 && b.x + b.w >= W - 0.5 && b.y + b.h >= H - 0.5;
}

/**
 * Map a crop box drawn on the rotated view (W x H) back onto the original
 * image's pixels (srcW x srcH, unrotated). Crop the original with this, then
 * rotate it clockwise by `rot`, and you get exactly what the box showed.
 * Rounded to whole pixels, inside the image, at least 1 x 1.
 */
export function sourceRect(
  b: Box,
  rot: Rotation,
  W: number,
  H: number,
  srcW: number,
  srcH: number,
): { originX: number; originY: number; width: number; height: number } {
  // Normalise to 0–1 on the rotated view.
  const u = b.x / W;
  const v = b.y / H;
  const uw = b.w / W;
  const vh = b.h / H;
  let n: Box;
  switch (rot) {
    case 90:
      n = { x: v, y: 1 - u - uw, w: vh, h: uw };
      break;
    case 180:
      n = { x: 1 - u - uw, y: 1 - v - vh, w: uw, h: vh };
      break;
    case 270:
      n = { x: 1 - v - vh, y: u, w: vh, h: uw };
      break;
    default:
      n = { x: u, y: v, w: uw, h: vh };
  }
  const x0 = clamp(Math.round(n.x * srcW), 0, srcW - 1);
  const y0 = clamp(Math.round(n.y * srcH), 0, srcH - 1);
  const x1 = clamp(Math.round((n.x + n.w) * srcW), x0 + 1, srcW);
  const y1 = clamp(Math.round((n.y + n.h) * srcH), y0 + 1, srcH);
  return { originX: x0, originY: y0, width: x1 - x0, height: y1 - y0 };
}

/** Move one item in a list one place left (-1) or right (+1). Out of range does nothing. */
export function moveItem<T>(list: T[], index: number, by: -1 | 1): T[] {
  const to = index + by;
  if (index < 0 || index >= list.length || to < 0 || to >= list.length) return list;
  const next = list.slice();
  [next[index], next[to]] = [next[to], next[index]];
  return next;
}

/** Put one item first (the build's cover photo). */
export function makeFirst<T>(list: T[], index: number): T[] {
  if (index <= 0 || index >= list.length) return list;
  return [list[index], ...list.slice(0, index), ...list.slice(index + 1)];
}
