import { useRef, useState, type ComponentRef, type ReactNode } from 'react';
import { Image, Modal, Platform, ScrollView, View, type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { photoSource } from '../lib/photoSource';
import { ART, COLOR, RADII, SPACING } from '../theme';
import { DsText, FitImage, IconButton, Press } from './ds';

/** Which page a paging scroll view is on. */
function pageOf(e: NativeSyntheticEvent<NativeScrollEvent>, width: number): number {
  return width > 0 ? Math.round(e.nativeEvent.contentOffset.x / width) : 0;
}

/** "2/5" on a dark pill, bottom right (the top corners hold the credit ⓘ and status tags): which photo of how many. */
export function PhotoCount({ index, total }: { index: number; total: number }) {
  return (
    <View
      style={{ position: 'absolute', right: SPACING.sm, bottom: SPACING.sm, backgroundColor: COLOR.surface.glass, borderRadius: RADII.tag, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xxs }}
      pointerEvents="none"
      accessibilityLiveRegion="polite"
    >
      <DsText v="meta" style={{ color: COLOR.text.primary }} accessibilityLabel={`Photo ${index + 1} of ${total}`}>
        {`${index + 1}/${total}`}
      </DsText>
    </View>
  );
}

/**
 * Several photos you swipe through, one at a time at `aspect`, with "1/5" in the bottom corner.
 * Tapping a photo calls `onOpen(index)` (the full-screen viewer, or the post). On the web
 * preview there are ‹ › buttons too, since a mouse can't swipe.
 */
export function PhotoGallery({
  photos,
  aspect,
  onOpen,
  label,
  onBroken,
  overlay,
}: {
  photos: string[];
  aspect: number;
  onOpen?: (index: number) => void;
  /** Spoken for each photo: "Photo 2 of 5 in the post". */
  label: string;
  onBroken?: (ref: string) => void;
  /** Drawn over each photo (the credit ⓘ). */
  overlay?: (ref: string) => ReactNode;
}) {
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);
  const scroller = useRef<ComponentRef<typeof ScrollView>>(null);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  const go = (i: number) => {
    const to = Math.max(0, Math.min(photos.length - 1, i));
    scroller.current?.scrollTo({ x: to * width, animated: true });
    setIndex(to);
  };
  const one = (p: string, i: number) => {
    const picture = (
      <View style={{ width: width || '100%', aspectRatio: aspect, backgroundColor: COLOR.surface.media }}>
        <FitImage
          source={photoSource(p)}
          frameAspect={aspect}
          onError={onBroken ? () => onBroken(p) : undefined}
          accessibilityLabel={photos.length > 1 ? `Photo ${i + 1} of ${photos.length} ${label}` : `Photo ${label}`}
        />
        {overlay?.(p)}
      </View>
    );
    return onOpen ? (
      <Press key={p} onPress={() => onOpen(i)} feedback="card" label={photos.length > 1 ? `Open photo ${i + 1} of ${photos.length}` : 'Open the photo'}>
        {picture}
      </Press>
    ) : (
      <View key={p}>{picture}</View>
    );
  };
  if (photos.length === 0) return null;
  if (photos.length === 1) return <View onLayout={onLayout}>{one(photos[0], 0)}</View>;
  return (
    <View onLayout={onLayout} style={{ aspectRatio: aspect }}>
      {width > 0 ? (
        <ScrollView
          ref={scroller}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => setIndex(pageOf(e, width))}
          onScroll={Platform.OS === 'web' ? (e) => setIndex(pageOf(e, width)) : undefined}
          scrollEventThrottle={64}
          accessibilityRole="adjustable"
        >
          {photos.map(one)}
        </ScrollView>
      ) : null}
      <PhotoCount index={index} total={photos.length} />
      {Platform.OS === 'web' ? (
        <>
          {index > 0 ? <GalleryArrow side="left" onPress={() => go(index - 1)} /> : null}
          {index < photos.length - 1 ? <GalleryArrow side="right" onPress={() => go(index + 1)} /> : null}
        </>
      ) : null}
    </View>
  );
}

function GalleryArrow({ side, onPress }: { side: 'left' | 'right'; onPress: () => void }) {
  return (
    <View style={{ position: 'absolute', top: '50%', marginTop: -20, [side]: SPACING.xs }}>
      <IconButton
        icon={side === 'left' ? 'back' : 'chevron'}
        label={side === 'left' ? 'Previous photo' : 'Next photo'}
        onPress={onPress}
        variant="glass"
      />
    </View>
  );
}

/** Full-screen photos: swipe between them, "2/5", ✕ to close. Pinch is the phone's own zoom on the web. */
export function PhotoViewer({ photos, start, onClose }: { photos: string[]; start: number | null; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [index, setIndex] = useState(0);
  const scroller = useRef<ComponentRef<typeof ScrollView>>(null);
  const open = start !== null && photos.length > 0;
  const go = (i: number) => {
    const to = Math.max(0, Math.min(photos.length - 1, i));
    scroller.current?.scrollTo({ x: to * size.w, animated: true });
    setIndex(to);
  };
  return (
    <Modal visible={open} animationType="fade" presentationStyle="fullScreen" onRequestClose={onClose} onShow={() => setIndex(start ?? 0)}>
      <View
        style={{ flex: 1, backgroundColor: ART.black }}
        onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
        accessibilityViewIsModal
      >
        {open && size.w > 0 ? (
          <ScrollView
            ref={scroller}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentOffset={{ x: (start ?? 0) * size.w, y: 0 }}
            onLayout={() => scroller.current?.scrollTo({ x: (start ?? 0) * size.w, animated: false })}
            onMomentumScrollEnd={(e) => setIndex(pageOf(e, size.w))}
            onScroll={Platform.OS === 'web' ? (e) => setIndex(pageOf(e, size.w)) : undefined}
            scrollEventThrottle={64}
          >
            {photos.map((p, i) => (
              <View key={p} style={{ width: size.w, height: size.h, justifyContent: 'center' }}>
                <Image source={photoSource(p)} resizeMode="contain" style={{ width: size.w, height: size.h }} accessibilityLabel={`Photo ${i + 1} of ${photos.length}`} />
              </View>
            ))}
          </ScrollView>
        ) : null}
        <View style={{ position: 'absolute', top: insets.top + SPACING.sm, left: SPACING.md, right: SPACING.md, flexDirection: 'row', alignItems: 'center' }}>
          <IconButton icon="close" label="Close the photos" onPress={onClose} variant="glass" />
          <View style={{ flex: 1 }} />
          {photos.length > 1 ? (
            <DsText v="bodyStrong" style={{ color: COLOR.text.primary }} accessibilityLiveRegion="polite">
              {`${index + 1}/${photos.length}`}
            </DsText>
          ) : null}
        </View>
        {Platform.OS === 'web' && photos.length > 1 ? (
          <>
            {index > 0 ? <GalleryArrow side="left" onPress={() => go(index - 1)} /> : null}
            {index < photos.length - 1 ? <GalleryArrow side="right" onPress={() => go(index + 1)} /> : null}
          </>
        ) : null}
      </View>
    </Modal>
  );
}

/** A row of small square photos (a comment's, a reply's); tap opens the viewer at that one. */
export function PhotoThumbs({ photos, size = 72, onOpen, label }: { photos: string[]; size?: number; onOpen: (index: number) => void; label: string }) {
  if (!photos.length) return null;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs }}>
      {photos.map((p, i) => (
        <Press key={p} onPress={() => onOpen(i)} feedback="card" label={`Open photo ${i + 1} of ${photos.length} ${label}`}>
          <FitImage fit="cover" source={photoSource(p)} frameAspect={1} style={{ width: size, height: size, borderRadius: RADII.control, backgroundColor: COLOR.surface.media }} />
        </Press>
      ))}
    </View>
  );
}
