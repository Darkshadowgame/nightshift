import { useEffect, useState } from 'react';
import { Image, StyleSheet, View, type ImageSourcePropType, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import { COLOR } from '../../theme';
import { fitMode } from './logic';
import type { Photo } from './Marks';

/** How soft the backdrop copy is, and how dark: the photo on top always reads first. */
const BLUR = 28;
const DIM_OPACITY = 0.75;

/** Known photo shapes (width / height) by uri; null when the size couldn't be read. Small, oldest out first. */
const MAX_KNOWN = 300;
const known = new Map<string, number | null>();
function remember(key: string, aspect: number | null) {
  if (known.has(key)) known.delete(key);
  else if (known.size >= MAX_KNOWN) {
    const oldest = known.keys().next().value;
    if (oldest !== undefined) known.delete(oldest);
  }
  known.set(key, aspect);
}

const toSource = (p: Photo): ImageSourcePropType => (typeof p === 'string' ? { uri: p } : p);

/** The cache key for a source: its uri, or the bundled asset's number. */
function keyOf(s: ImageSourcePropType): string | null {
  const one = Array.isArray(s) ? s[0] : s;
  if (typeof one === 'number') return `asset:${one}`;
  return one && typeof one === 'object' && typeof one.uri === 'string' ? one.uri : null;
}

/** The shape we already know without loading: a bundled asset's size, a source that carries its size, or the cache. */
function aspectNow(s: ImageSourcePropType): number | null | undefined {
  const one = Array.isArray(s) ? s[0] : s;
  if (typeof one === 'number') {
    try {
      const a = Image.resolveAssetSource?.(one);
      if (a?.width && a?.height) return a.width / a.height;
    } catch {
      // Not resolvable here (web): learnt from the image's load event instead.
    }
  } else if (one && typeof one === 'object' && one.width && one.height) {
    return one.width / one.height;
  }
  const key = keyOf(s);
  return key ? known.get(key) : null;
}

/**
 * A photo that ships in the app: a `require` (a number on iPhone; on web Expo gives an object that
 * carries its own width and height). A user's photo is always a bare `{ uri }`.
 */
function isBundled(s: ImageSourcePropType): boolean {
  const one = Array.isArray(s) ? s[0] : s;
  return typeof one === 'number' || (!!one && typeof one === 'object' && typeof one.width === 'number' && typeof one.height === 'number');
}

/**
 * A photo's shape (width / height): read once per uri with `Image.getSize` and cached.
 * `undefined` while it's being read; `null` if it can't be. Also returns `learn`, for a size
 * the Image's own load event reports (bundled photos on web).
 */
export function usePhotoAspect(source: ImageSourcePropType): [number | null | undefined, (w?: number, h?: number) => void] {
  const key = keyOf(source);
  const [aspect, setAspect] = useState(() => aspectNow(source));
  useEffect(() => {
    const now = aspectNow(source);
    setAspect(now);
    const one = Array.isArray(source) ? source[0] : source;
    const uri = one && typeof one === 'object' ? one.uri : undefined;
    if (now !== undefined || !uri) return;
    let live = true;
    Image.getSize(
      uri,
      (w, h) => {
        const a = w > 0 && h > 0 ? w / h : null;
        remember(uri, a);
        if (live) setAspect(a);
      },
      () => {
        remember(uri, null);
        if (live) setAspect(null);
      },
    );
    return () => {
      live = false;
    };
    // The key stands for the source (a new object with the same uri is the same photo).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const learn = (w?: number, h?: number) => {
    const a = w && h && w > 0 && h > 0 ? w / h : null;
    if (key) remember(key, a);
    setAspect(a);
  };
  return [aspect, learn];
}

/**
 * A photo in a fixed frame that never loses its subject (owner decision, "my pictures look cut
 * off"). Frames keep their shapes (ASPECT: builds 4:3, events 16:9, posts 4:5) so layouts stay
 * even, and the photo is fitted by `fitMode`:
 * - close to the frame's shape (within 10%): `cover`, filling it;
 * - further off (a portrait phone photo in a 4:3 card, a wide one in a 4:5 post): the whole photo,
 *   `contain`, centred over a blurred, darkened copy of itself filling the frame (as iOS Photos and
 *   Instagram do), so there are no bare bars.
 *
 * Bundled photos (samples, stand-ins) always fill: they're picked to suit their frames. So does
 * any photo with `fit="cover"` (grid and strip tiles).
 * Fills its parent by default (absolute); `style` sizes it instead. Give `frameAspect` when the
 * frame's shape is known, else it's measured. Hidden for the moment its shape is being read, so it
 * never jumps from cropped to whole.
 */
export function FitImage({
  source,
  frameAspect,
  style,
  accessibilityLabel,
  onError,
  fit = 'auto',
}: {
  source: Photo;
  /**
   * `cover` for tiles in photo grids and strips (thumbnails, an event's Photos, a composer's row):
   * they always fill, so a user's photo never sits letterboxed among full-bleed tiles (Review 19,
   * owner decision). `auto` (the default) is for heroes and single-photo views: a photo far off the
   * frame's shape is shown whole over a blurred copy.
   */
  fit?: 'auto' | 'cover';
  frameAspect?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  onError?: () => void;
}) {
  const src = toSource(source);
  const [aspect, learn] = usePhotoAspect(src);
  const [measured, setMeasured] = useState<number | undefined>(undefined);
  const onLayout = frameAspect
    ? undefined
    : (e: LayoutChangeEvent) => {
        const { width, height } = e.nativeEvent.layout;
        if (width > 0 && height > 0) setMeasured(width / height);
      };
  // Bundled photos (the demo's samples and stand-ins) are chosen to fill their frames: always cover.
  const bundled = isBundled(src) || fit === 'cover';
  // Hidden until both shapes are known (the frame's is measured on first layout without `frameAspect`).
  const ready = bundled || (aspect !== undefined && (aspect === null || !!(frameAspect ?? measured)));
  const mode = ready && !bundled ? fitMode(aspect, frameAspect ?? measured) : 'cover';
  const a11y = accessibilityLabel ? { accessibilityLabel } : { 'aria-hidden': true as const };
  return (
    <View style={[style ?? StyleSheet.absoluteFill, { overflow: 'hidden' }]} onLayout={onLayout}>
      {mode === 'contain' ? (
        <>
          <Image source={src} style={StyleSheet.absoluteFill} resizeMode="cover" blurRadius={BLUR} aria-hidden accessibilityIgnoresInvertColors />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: COLOR.surface.scrim, opacity: DIM_OPACITY }]} />
        </>
      ) : null}
      <Image
        source={src}
        style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }, !ready && { opacity: 0 }]}
        resizeMode={mode}
        onLoad={(e) => {
          if (aspect !== undefined || bundled) return;
          const s = (e.nativeEvent as { source?: { width?: number; height?: number } } | undefined)?.source;
          learn(s?.width, s?.height);
        }}
        onError={() => {
          if (aspect === undefined && !bundled) learn();
          onError?.();
        }}
        accessibilityIgnoresInvertColors
        {...a11y}
      />
    </View>
  );
}
