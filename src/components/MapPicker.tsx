import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BAN_ZONES } from '../data/seed';
import { zonePins, zoneShapes } from '../lib/zones';
import { ZoneCard } from './ZoneCard';
import { banZoneAt } from '../lib/events';
import { currentPosition, geocoderAvailable, nameForPlace } from '../lib/location';
import {
  addPoint,
  canFinish,
  crosshairStop,
  formatLatLng,
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
import { useStore } from '../lib/store';
import type { LatLng, SpotKind } from '../lib/types';
import { BRAND, C, RADIUS, SPOT_COLOURS, STATE, SURFACE } from '../theme';
import type { MapPath, MapPin, MapRegion, NightMapHandle } from './mapTypes';
import { NightMap } from './NightMap';
import { Pin, type Glyph } from './Pin';
import { PlaceSearch } from './PlaceSearch';
import { Button, InlineError, Row, Txt } from './ui';

/** Ban zones drawn on the map: circles, and council outlines for borough-wide orders. */
const BAN_SHAPES = zoneShapes(BAN_ZONES, STATE.warning);
const BAN_PINS = zonePins(BAN_ZONES, STATE.warning);

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
  colour = BRAND,
  start,
  span = 0.3,
  initial = [],
  showKinds = [],
  snap = false,
  extraPins = [],
  extraPaths = [],
  zones = false,
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
  const zone = zones ? banZoneAt(onPlace?.at ?? region.centre, BAN_ZONES) : undefined;
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

  const label = onPlace ? onPlace.name : (address ?? (geocoderAvailable ? 'Finding the address…' : formatLatLng(region.centre)));

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
    .map((s) => ({ id: `k:${s.id}`, at: s.at, glyph: s.kind as Glyph, colour: C.fog, title: s.name, size: 24 }));
  const contextPaths: MapPath[] = near
    .filter((s) => s.kind === 'drive' && s.path && s.path.length > 1)
    .map((s) => ({ id: `k:${s.id}`, coords: s.path!, colour: `${SPOT_COLOURS.drive}55`, width: 3 }));
  const last = points[points.length - 1];
  const drawn: MapPin[] =
    mode === 'path'
      ? points.map((p, i) => {
          const end = i === 0 || i === points.length - 1;
          return { id: `p${i}`, at: p, glyph: 'drive', colour: end ? colour : C.fog, title: i === 0 ? 'Start' : `Checkpoint ${i + 1}`, size: end ? 30 : 20 };
        })
      : [];
  const drawnPaths: MapPath[] =
    mode === 'path'
      ? [
          ...(points.length > 1 ? [{ id: 'route', coords: points, colour }] : []),
          ...(drawnGap ? [{ id: 'gap', coords: [points[drawnGap.index], points[drawnGap.index + 1]], colour: STATE.danger, dashed: true }] : []),
          // Where the next checkpoint would join: red when it's too far.
          ...(last ? [{ id: 'next', coords: [last, region.centre], colour: gap?.tooFar ? STATE.danger : `${colour}99`, dashed: true, width: 2 }] : []),
        ]
      : [];

  return (
    <View style={{ flex: 1, backgroundColor: C.asphalt }}>
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
        <View style={[st.ring, { borderColor: onPlace ? STATE.success : colour }]} />
        <View style={[st.lineH, { backgroundColor: onPlace ? STATE.success : colour }]} />
        <View style={[st.lineV, { backgroundColor: onPlace ? STATE.success : colour }]} />
      </View>

      <View style={[st.top, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
        <Row style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
          <Txt v="h3" numberOfLines={1} style={{ flex: 1 }}>{title}</Txt>
          <Button label="Cancel" kind="secondary" size="sm" onPress={onCancel} />
        </Row>
        {hint ? <Txt v="caption">{hint}</Txt> : null}
        <PlaceSearch onPick={(h) => jump(h.at, Math.min(region.span, mode === 'path' ? 0.12 : 0.04))} />
      </View>

      <View style={[st.bottom, { paddingBottom: insets.bottom + 12 }]} pointerEvents="box-none">
        <Row style={{ justifyContent: 'flex-end' }}>
          <Pressable
            onPress={locate}
            disabled={locating}
            style={({ pressed }) => [st.locate, (pressed || locating) && { opacity: 0.7 }]}
            accessibilityRole="button"
            accessibilityLabel="Go to my location"
            hitSlop={6}
          >
            <Pin glyph="you" colour={located ? C.chalk : C.fog} size={26} />
          </Pressable>
        </Row>
        <View style={st.panel}>
          <Txt v="label" style={{ color: onPlace ? STATE.success : C.fog }}>{onPlace ? 'On a known place' : 'Under the crosshair'}</Txt>
          <Txt numberOfLines={1} accessibilityLiveRegion="polite">{label}</Txt>
          {zone ? (
            <Pressable onPress={() => setZoneOpen(zone.id)} accessibilityRole="button" hitSlop={6}>
              <Txt v="mono" style={{ color: STATE.warning }} numberOfLines={2}>INSIDE A CAR-MEET ORDER AREA ({zone.name.toUpperCase()}) · DETAILS ›</Txt>
            </Pressable>
          ) : null}
          {mode === 'path' ? (
            <>
              <Txt v="mono" style={{ color: colour }}>{pathSummary(points)}</Txt>
              {drawnGap ? (
                <Txt v="caption" style={{ color: STATE.danger }}>
                  Checkpoints {drawnGap.index + 1} and {drawnGap.index + 2} are {drawnGap.miles.toFixed(1)} mi apart (red line). Undo back
                  and add points in between.
                </Txt>
              ) : null}
              {gap?.tooFar ? (
                <Txt v="caption" style={{ color: STATE.danger }}>
                  The next checkpoint would be {gap.miles.toFixed(1)} mi from the last. Keep them within {MAX_POINT_GAP_MILES} mi so
                  the drive follows the road: move the map back along the road.
                </Txt>
              ) : null}
              {!drawnGap && !gap?.tooFar ? (
                <Txt v="caption">
                  {points.length === 0
                    ? 'Put the crosshair on the start of the road and add the first checkpoint.'
                    : `Follow the road: a checkpoint at least every ${MAX_POINT_GAP_MILES} mi. Tapping the map adds one too.`}
                </Txt>
              ) : null}
            </>
          ) : null}
          <InlineError message={note} />
          {mode === 'point' ? (
            <Button label={confirmLabel} onPress={() => take(region.centre)} />
          ) : (
            <>
              <Button label={points.length === 0 ? 'Add start' : 'Add checkpoint'} onPress={() => take(region.centre)} />
              <Row style={{ flexWrap: 'nowrap' }}>
                <Button label="Undo" kind="secondary" disabled={points.length === 0} onPress={() => setPoints(undoPoint)} style={{ flex: 1 }} />
                <Button
                  label="Done"
                  kind="secondary"
                  disabled={!canFinish(points, 'path')}
                  onPress={() => onDone(points.map((at) => ({ at })))}
                  style={{ flex: 1 }}
                  accessibilityHint={canFinish(points, 'path') ? undefined : 'Add at least a start and an end first'}
                />
              </Row>
            </>
          )}
        </View>
      </View>
      {openZone ? (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: SURFACE.scrim, justifyContent: 'center', padding: 16 }]}>
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
  ring: { position: 'absolute', width: 22, height: 22, borderRadius: 11, borderWidth: 2.5, backgroundColor: 'rgba(11,15,23,0.25)' },
  lineH: { position: 'absolute', width: CROSS, height: 2, opacity: 0.9 },
  lineV: { position: 'absolute', width: 2, height: CROSS, opacity: 0.9 },
  top: { position: 'absolute', left: 0, right: 0, top: 0, paddingHorizontal: 12, paddingBottom: 10, gap: 6, backgroundColor: SURFACE.glass },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 12, gap: 8 },
  locate: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: C.kerb, backgroundColor: SURFACE.glass, alignItems: 'center', justifyContent: 'center' },
  panel: { backgroundColor: SURFACE.glass, borderRadius: RADIUS.sheet, borderWidth: 1, borderColor: C.kerb, padding: 12, gap: 6 },
});
