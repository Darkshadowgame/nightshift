import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BAN_ZONES } from '../data/seed';
import { worstZone, zoneKind, zoneLine, zonePins, zoneShapes, zonesAt } from '../lib/zones';
import { ZoneCard } from './ZoneCard';
import { currentPosition, geocoderAvailable, nameForPlace } from '../lib/location';
import {
  addPoint,
  canFinish,
  crosshairStop,
  describePoint,
  gapTo,
  nearbyPlaces,
  pathSummary,
  snapPlace,
  undoPoint,
  type PickedStop,
  type PickMode,
  type PickPlace,
} from '../lib/picker';
import { longGap, MAX_POINT_GAP_MILES, visibleSpots } from '../lib/spots';
import { nearestRegion } from '../lib/profile';
import { useStore } from '../lib/store';
import type { LatLng, SpotKind } from '../lib/types';
import { COLOR, ELEVATION, HIT, line, outline, RADII, SPACING, SPOT_COLOURS } from '../theme';
import type { MapPath, MapPin, MapRegion, NightMapHandle } from './mapTypes';
import { NightMap } from './NightMap';
import { Pin, type Glyph } from './Pin';
import { PlaceSearch } from './PlaceSearch';
import { Button, DsText, ErrorState, Press } from './ds';

/** Ban zones drawn on the map: circles, and council outlines for borough-wide orders. */
const BAN_SHAPES = zoneShapes(BAN_ZONES, COLOR.state.warning);
const BAN_PINS = zonePins(BAN_ZONES, COLOR.state.warning);

/** Wait this long after the map stops moving before naming the crosshair (the geocoder dislikes bursts). */
const NAME_DELAY_MS = 500;

export interface MapPickerProps {
  visible: boolean;
  /** One place ("Set spot here") or a drive's checkpoints ("Add checkpoint", Undo, Done). */
  mode: PickMode;
  /** Header, e.g. "PLACE THE PHOTO SPOT". */
  title: string;
  /** One line under the header saying what to do. */
  hint?: string;
  /** The main button in point mode. */
  confirmLabel?: string;
  colour?: string;
  /** Where the map opens when nothing is placed yet. */
  start: LatLng;
  span?: number;
  /** What's already placed: the point, or the drive so far (it can be extended or undone). */
  initial?: LatLng[];
  /** Which known places to draw faintly for context: drives, photo spots, tracks, venues. None for a home area. */
  showKinds?: SpotKind[];
  /** Snap the crosshair onto a known place (and hand back its name) when it's on one. */
  snap?: boolean;
  /** Other things on the plan for context, e.g. the event's other stops and its route. */
  extraPins?: MapPin[];
  extraPaths?: MapPath[];
  /** Hosting: draw the car-meet order areas (ban zones) and say when the crosshair is in one. */
  zones?: boolean;
  /**
   * With nothing placed yet, move to where you are when it opens (only if location is already
   * allowed: it never asks). `refuse` skips a fix it wouldn't accept (a post near your home).
   */
  locateOnOpen?: boolean;
  refuse?: (at: LatLng) => boolean;
  /** Point mode: the place. Path mode: every checkpoint (no names). */
  onDone: (stops: PickedStop[]) => void;
  onCancel: () => void;
}

/**
 * Full-screen map for choosing a place: pan and zoom until the crosshair is on
 * it, then tap the big button. Tapping the map also works. Search and "my
 * location" jump the map; nearby places and ban zones are drawn faintly.
 */
export function MapPicker(props: MapPickerProps) {
  return (
    <Modal visible={props.visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={props.onCancel}>
      <SafeAreaProvider>{props.visible ? <PickerBody {...props} /> : null}</SafeAreaProvider>
    </Modal>
  );
}

function PickerBody({
  mode,
  title,
  hint,
  confirmLabel = 'Set spot here',
  colour = COLOR.action.primary,
  start,
  span = 0.3,
  initial = [],
  showKinds = [],
  snap = false,
  extraPins = [],
  extraPaths = [],
  zones = false,
  locateOnOpen = false,
  refuse,
  onDone,
  onCancel,
}: MapPickerProps) {
  const insets = useSafeAreaInsets();
  const { spots, me } = useStore();
  const map = useRef<NightMapHandle>(null);
  const [points, setPoints] = useState<LatLng[]>(initial);
  // Open on what's placed: the point itself, or the end of the drive so far (where the next checkpoint goes).
  const opensAt = initial[initial.length - 1] ?? start;
  const [region, setRegion] = useState<MapRegion>({ centre: opensAt, span });
  const [address, setAddress] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [located, setLocated] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const kinds = showKinds.join(',');
  const known = useMemo(
    () => visibleSpots(spots, me).filter((s) => showKinds.includes(s.kind)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [spots, me, kinds],
  );
  const near = useMemo(() => nearbyPlaces(known, region.centre, region.span), [known, region]);
  const snapTo: PickPlace[] = useMemo(() => (snap ? near.filter((s) => s.kind !== 'drive') : []), [snap, near]);
  const onPlace = snapPlace(region.centre, snapTo, region.span);
  const zone = zones ? worstZone(zonesAt(onPlace?.at ?? region.centre, BAN_ZONES)) : undefined;
  // Opened on home (nothing placed, map not moved) inside a court injunction: say so before anything is set.
  const openedInBan = !!zone && zoneKind(zone) === 'injunction' && points.length === 0 && region.centre.lat === opensAt.lat && region.centre.lng === opensAt.lng;
  /** The zone whose info card is open (tap a zone pin or the line under the crosshair). */
  const [zoneOpen, setZoneOpen] = useState<string | null>(null);
  const openZone = zoneOpen ? BAN_ZONES.find((z) => z.id === zoneOpen) : undefined;
  const gap = mode === 'path' ? gapTo(points, region.centre) : null;
  const drawnGap = mode === 'path' ? longGap(points) : null;

  // Name the place under the crosshair once the map settles. Only the latest lookup may update the label.
  const seq = useRef(0);
  useEffect(() => {
    const mine = ++seq.current;
    setAddress(null);
    if (onPlace || !geocoderAvailable) return;
    const t = setTimeout(() => {
      nameForPlace(region.centre).then((name) => {
        if (mine === seq.current) setAddress(name);
      });
    }, NAME_DELAY_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [region.centre.lat, region.centre.lng, onPlace?.id]);

  // Never raw coordinates: the geocoder's name, else the nearest known place or the region (REVIEW-7 problem 4).
  const allKnown = useMemo(() => visibleSpots(spots, me), [spots, me]);
  const fallbackName = useMemo(
    () => describePoint(region.centre, nearbyPlaces(allKnown, region.centre, Math.max(region.span, 0.1)), nearestRegion(region.centre)),
    [allKnown, region],
  );
  const label = onPlace ? onPlace.name : (address ?? (geocoderAvailable ? 'Finding the address…' : fallbackName));

  // Open where you are (never asking for permission here), unless something is already placed.
  useEffect(() => {
    if (!locateOnOpen || initial.length) return;
    let live = true;
    currentPosition(false).then((pos) => {
      if (!live || !pos.ok || refuse?.(pos.at)) return;
      setLocated(true);
      map.current?.animateTo(pos.at, Math.min(span, 0.05));
    });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function jump(at: LatLng, sp = region.span) {
    map.current?.animateTo(at, sp);
  }

  async function locate() {
    setLocating(true);
    setNote(null);
    const pos = await currentPosition(true);
    setLocating(false);
    if (pos.ok) {
      setLocated(true);
      jump(pos.at, Math.min(region.span, 0.05));
    } else {
      setNote(
        pos.reason === 'denied'
          ? 'Location is off for Nightshift. Search or move the map instead, or turn it on in Settings.'
          : "Couldn't find where you are just now. Search or move the map instead.",
      );
    }
  }

  /** The crosshair (or a tapped point) as the next point. Point mode hands it straight back. */
  function take(at: LatLng) {
    setNote(null);
    if (mode === 'point') {
      onDone([crosshairStop(at, snapTo, map.current?.region().span ?? region.span)]);
      return;
    }
    setPoints((p) => addPoint(p, at, 'path'));
  }

  function tapMap(at: LatLng) {
    if (!Number.isFinite(at.lat) || !Number.isFinite(at.lng)) return;
    // A drive: the tap is a checkpoint. One place: the tap moves the crosshair there, to check before setting it.
    if (mode === 'path') take(at);
    else jump(at);
  }

  const contextPins: MapPin[] = near
    .filter((s) => s.kind !== 'drive')
    .map((s) => ({ id: `k:${s.id}`, at: s.at, glyph: s.kind as Glyph, colour: COLOR.text.secondary, title: s.name, size: 24 }));
  const contextPaths: MapPath[] = near
    .filter((s) => s.kind === 'drive' && s.path && s.path.length > 1)
    .map((s) => ({ id: `k:${s.id}`, coords: s.path!, colour: line(SPOT_COLOURS.drive), width: 3 }));
  const last = points[points.length - 1];
  const drawn: MapPin[] =
    mode === 'path'
      ? points.map((p, i) => {
          const end = i === 0 || i === points.length - 1;
          return { id: `p${i}`, at: p, glyph: 'drive', colour: end ? colour : COLOR.text.secondary, title: i === 0 ? 'Start' : `Checkpoint ${i + 1}`, size: end ? 30 : 20 };
        })
      : [];
  const drawnPaths: MapPath[] =
    mode === 'path'
      ? [
          ...(points.length > 1 ? [{ id: 'route', coords: points, colour }] : []),
          ...(drawnGap ? [{ id: 'gap', coords: [points[drawnGap.index], points[drawnGap.index + 1]], colour: COLOR.state.danger, dashed: true }] : []),
          // Where the next checkpoint would join: red when it's too far.
          ...(last ? [{ id: 'next', coords: [last, region.centre], colour: gap?.tooFar ? COLOR.state.danger : outline(colour), dashed: true, width: 2 }] : []),
        ]
      : [];

  // The header sits above the map, never over it, so the map's own credit (top left on a tall
  // web map) is always in view (REVIEW-11 problem 20); the crosshair is the map's centre.
  return (
    <View style={{ flex: 1, backgroundColor: COLOR.surface.bg }}>
      <View style={[st.top, { paddingTop: insets.top + SPACING.sm }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
          <DsText v="heading" accessibilityRole="header" numberOfLines={1} style={{ flex: 1 }}>
            {title}
          </DsText>
          <Button label="Cancel" tier="tertiary" size="sm" onPress={onCancel} />
        </View>
        {hint ? <DsText v="caption">{hint}</DsText> : null}
        <PlaceSearch onPick={(h) => jump(h.at, Math.min(region.span, mode === 'path' ? 0.12 : 0.04))} />
      </View>
      <View style={{ flex: 1 }}>
      <NightMap
        ref={map}
        pins={[...(zones ? BAN_PINS : []), ...contextPins, ...extraPins, ...drawn]}
        paths={[...contextPaths, ...extraPaths, ...drawnPaths]}
        circles={zones ? BAN_SHAPES.circles : undefined}
        polygons={zones ? BAN_SHAPES.polygons : undefined}
        centre={opensAt}
        span={span}
        onRegion={setRegion}
        onPressMap={tapMap}
        onSelect={(id) => {
          if (id.startsWith('zone:')) {
            setZoneOpen(id.slice(5));
            return;
          }
          const k = near.find((s) => `k:${s.id}` === id);
          if (k) jump(k.at);
        }}
        picked={mode === 'point' ? initial[0] : undefined}
        showsUser={located}
      />

      {/* The crosshair sits on the map's centre: whatever is under it is what gets picked. */}
      <View pointerEvents="none" style={st.crossWrap}>
        <View style={[st.ring, { borderColor: onPlace ? COLOR.state.success : colour }]} />
        <View style={[st.lineH, { backgroundColor: onPlace ? COLOR.state.success : colour }]} />
        <View style={[st.lineV, { backgroundColor: onPlace ? COLOR.state.success : colour }]} />
      </View>

      <View style={[st.bottom, { paddingBottom: insets.bottom + SPACING.md }]} pointerEvents="box-none">
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
          <Press onPress={locate} disabled={locating} haptic="tap" label="Go to my location" hitSlop={6} style={st.locate}>
            <Pin glyph="you" colour={located ? COLOR.text.primary : COLOR.text.secondary} size={26} />
          </Press>
        </View>
        <View style={st.panel}>
          <DsText v="label" style={onPlace ? { color: COLOR.state.success } : undefined}>
            {onPlace ? 'On a known place' : 'Under the crosshair'}
          </DsText>
          <DsText numberOfLines={1} accessibilityLiveRegion="polite">
            {label}
          </DsText>
          {zone ? (
            <Press onPress={() => setZoneOpen(zone.id)} label={`${zoneLine(zone)}. Details`} hitSlop={6}>
              <DsText v="meta" tone={zoneKind(zone) === 'injunction' ? 'danger' : 'warning'} numberOfLines={2}>
                {`${zoneLine(zone)} · Details ›`}
              </DsText>
            </Press>
          ) : null}
          {openedInBan ? (
            <DsText v="caption">The map opened on your home area, which is inside it. Move the map out of the outline to pick somewhere else.</DsText>
          ) : null}
          {mode === 'path' ? (
            <>
              <DsText v="meta" style={{ color: colour }}>
                {pathSummary(points)}
              </DsText>
              {drawnGap ? (
                <DsText v="caption" tone="danger">
                  Checkpoints {drawnGap.index + 1} and {drawnGap.index + 2} are {drawnGap.miles.toFixed(1)} mi apart (red line). Undo back
                  and add points in between.
                </DsText>
              ) : null}
              {gap?.tooFar ? (
                <DsText v="caption" tone="danger">
                  The next checkpoint would be {gap.miles.toFixed(1)} mi from the last. Keep them within {MAX_POINT_GAP_MILES} mi so
                  the drive follows the road: move the map back along the road.
                </DsText>
              ) : null}
              {!drawnGap && !gap?.tooFar ? (
                <DsText v="caption">
                  {points.length === 0
                    ? 'Put the crosshair on the start of the road and add the first checkpoint.'
                    : `Follow the road: a checkpoint at least every ${MAX_POINT_GAP_MILES} mi. Tapping the map adds one too.`}
                </DsText>
              ) : null}
            </>
          ) : null}
          {note ? <ErrorState title={note} /> : null}
          {mode === 'point' ? (
            <Button label={confirmLabel} block onPress={() => take(region.centre)} />
          ) : (
            <>
              <Button label={points.length === 0 ? 'Add start' : 'Add checkpoint'} block onPress={() => take(region.centre)} />
              <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                <Button label="Undo" tier="secondary" block disabled={points.length === 0} onPress={() => setPoints(undoPoint)} style={{ flex: 1 }} />
                <Button
                  label="Done"
                  tier="secondary"
                  block
                  disabled={!canFinish(points, 'path')}
                  hint="Add a start and an end first"
                  onPress={() => onDone(points.map((at) => ({ at })))}
                  style={{ flex: 1 }}
                />
              </View>
            </>
          )}
        </View>
      </View>
      </View>
      {openZone ? (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: COLOR.surface.scrim, justifyContent: 'center', padding: SPACING.screen }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setZoneOpen(null)} accessibilityLabel="Close" />
          <ZoneCard zone={openZone} onClose={() => setZoneOpen(null)} />
        </View>
      ) : null}
    </View>
  );
}

const CROSS = 44;
const st = StyleSheet.create({
  crossWrap: { position: 'absolute', left: '50%', top: '50%', width: CROSS, height: CROSS, marginLeft: -CROSS / 2, marginTop: -CROSS / 2, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: 22, height: 22, borderRadius: RADII.pill, borderWidth: 2.5, backgroundColor: COLOR.surface.glass },
  lineH: { position: 'absolute', width: CROSS, height: 2, opacity: 0.9 },
  lineV: { position: 'absolute', width: 2, height: CROSS, opacity: 0.9 },
  top: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm, gap: SPACING.xs, backgroundColor: COLOR.surface.bg, borderBottomWidth: 1, borderBottomColor: COLOR.surface.border },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: SPACING.md, gap: SPACING.sm },
  locate: { width: HIT, height: HIT, borderRadius: RADII.control, borderWidth: 1, borderColor: COLOR.surface.border, backgroundColor: COLOR.surface.glass, alignItems: 'center', justifyContent: 'center', ...ELEVATION.float },
  panel: { backgroundColor: COLOR.surface.glassRaised, borderRadius: RADII.card, borderWidth: 1, borderColor: COLOR.surface.border, padding: SPACING.md, gap: SPACING.xs, ...ELEVATION.float },
});
