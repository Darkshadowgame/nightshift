import { router } from 'expo-router';
import { areaRadius } from '../../lib/area';
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentRef, type ReactNode } from 'react';
import { Linking, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PulseRing } from '../../components/motion';
import { Pin, type Glyph } from '../../components/Pin';
import { LayerBar } from '../../components/LayerBar';
import { MapWidgetSlot } from '../../components/MapWidgetSlot';
import Svg, { Path } from 'react-native-svg';
import { UNVETTED_PHOTO_SPOTS } from '../../data/photoVetting';
import { feel } from '../../lib/feel';
import { nearestPoints, placesForView, regionKey } from '../../lib/mapPlaces';
import { NightMap } from '../../components/NightMap';
import type { MapCircle, MapPath, MapPin, MapPolygon, MapRegion, NightMapHandle } from '../../components/mapTypes';
import { NoticeBell } from '../../components/NoticeBell';
import { Button, Card, LinkText, Row, Tag, Txt } from '../../components/ui';
import { EVENT_LABELS } from '../../lib/events';
import { viewEvents, type EventView } from '../../lib/eventView';
import { describeFilter } from '../../lib/invites';
import { plural } from '../../lib/format';
import { eventClock, mapHud, orderPins, unlocksIn } from '../../lib/hud';
import { fitRegion } from '../../lib/geo';
import { currentPosition } from '../../lib/location';
import type { LatLng, SpotKind } from '../../lib/types';
import { averageStars, visibleSpots } from '../../lib/spots';
import { driveTier } from '../../lib/rep';
import { cameraIndex } from '../../lib/cameraData';
import { CAMERA_CAVEAT, CAMERA_CREDIT, cameraPinSize, camerasForView, describeCamera, describeZone } from '../../lib/cameras';
import { ALL_VEHICLES, isSpectatorVenue, matchesVehicles, outlinesInView } from '../../lib/tracks';
import { VEHICLE_LABELS, type TrackVehicle } from '../../lib/laptimes';
import { useStore } from '../../lib/store';
import { useNow } from '../../lib/clock';
import { useShopIndex } from '../../lib/shopData';
import { describeCategories, SHOP_CREDIT, shopPinSize, shopsForView, toggleCategory, type ShopFilter } from '../../lib/shops';
import { ALL_CATEGORIES, CATEGORY_HINTS, CATEGORY_LABELS, MENU_ORDER, shopFilterNote, type ShopCategory } from '../../lib/shopCategories';
import { parseOpeningHours, openState } from '../../lib/openingHours';
import { demoPartners, partnerBadge } from '../../lib/partners';
import { DEMO_PARTNERS, PARTNERS } from '../../data/partners';
import { milesBetween } from '../../lib/geo';
import { answerProblem, confirmations, KIND_INFO, reportAge, sourceCredit, type RoadReport, type RoadVote } from '../../lib/roadReports';
import { useRoadReports, useRoads } from '../../lib/roadStore';
import { openPlaceLabel, PLACE_NAMES, roleLabel, roleTone, UNLOCK } from '../../lib/glossary';
import { layerOn, mapChrome, toggleLayer as toggledLayer, type Layer } from '../../lib/mapLayers';
import { BRAND, C, EVENT_COLOURS, F, FONT_SCALE, LAYER, PARTNER_COLOUR, RADIUS, ROAD_COLOUR, SHOP_COLOUR, SPOT_COLOURS, STATE, SURFACE, TYPE } from '../../theme';

/** The layer bar: the core layers only, in order (mapLayers.ts saves them). */
const LAYERS: { key: Layer; label: string; glyph: Glyph; colour: string }[] = [
  { key: 'events', label: 'Events', glyph: 'meet', colour: LAYER.event },
  { key: 'photo', label: 'Photos', glyph: 'photo', colour: LAYER.photo },
  { key: 'drive', label: PLACE_NAMES.drive.many, glyph: 'drive', colour: LAYER.drive },
  { key: 'track', label: PLACE_NAMES.track.many, glyph: 'track', colour: LAYER.track },
];
/**
 * The layers button (under locate-me) holds the rest: meet spots, and the
 * background layers kept in settings and off by default, Shops (with its kinds),
 * Speed cameras and Road reports. Ban zones aren't a map layer: they show where
 * you host. Road reports here never include police: those are only in the
 * driving view (roadReports.ts).
 */
const MORE_LAYERS: { key: Layer; label: string; glyph: Glyph; colour: string }[] = [
  { key: 'venue', label: PLACE_NAMES.venue.many, glyph: 'venue', colour: LAYER.venue },
  { key: 'shops', label: 'Shops', glyph: 'shop', colour: SHOP_COLOUR },
  { key: 'cameras', label: 'Speed cameras', glyph: 'camera', colour: LAYER.camera },
  { key: 'roads', label: 'Road reports', glyph: 'hazard', colour: ROAD_COLOUR },
];

/** What the card at the bottom shows for the tapped pin. Cameras have nothing to open. */
interface Selection {
  title: string;
  meta: string;
  body: string;
  colour: string;
  open?: () => void;
  cta?: string;
  /** Buttons on the card (road reports: Still there / Gone). */
  actions?: { label: string; onPress: () => void; colour: string }[];
  /** A short line under the body, e.g. why you can't answer from here. */
  note?: string;
}

/** Count pins (places grouped when zoomed out): what each one is. */
const CLUSTER_NAMES: Record<SpotKind, string> = { drive: 'drives', photo: 'photo spots', track: 'tracks', venue: 'meet spots' };
/** Cameras with no recorded limit: dimmer than the rest, but still 4:1 on the dark map. */
const CAMERA_DIM = '#c45a5a';

/** The map key ("Key" button): what each pin means. Events are filled, places outlined. */
const KEY_ROWS: { glyph: Glyph; colour: string; label: string }[] = [
  { glyph: 'meet', colour: EVENT_COLOURS.meet, label: 'Meet, cruise or rolling meet' },
  { glyph: 'show', colour: EVENT_COLOURS.show, label: 'Show' },
  { glyph: 'trackday', colour: EVENT_COLOURS.trackday, label: 'Track day' },
  { glyph: 'locked', colour: EVENT_COLOURS.meet, label: `Event, ${UNLOCK.locked}` },
  { glyph: 'drive', colour: SPOT_COLOURS.drive, label: 'Drive' },
  { glyph: 'photo', colour: SPOT_COLOURS.photo, label: 'Photo spot' },
  { glyph: 'track', colour: SPOT_COLOURS.track, label: 'Track' },
  { glyph: 'venue', colour: SPOT_COLOURS.venue, label: `${PLACE_NAMES.venue.one} (café, museum)` },
  { glyph: 'shop', colour: SHOP_COLOUR, label: 'Shop (OpenStreetMap)' },
  { glyph: 'partner', colour: PARTNER_COLOUR, label: 'Partner (paid, always marked)' },
  { glyph: 'camera', colour: LAYER.camera, label: 'Speed camera' },
  { glyph: 'hazard', colour: ROAD_COLOUR, label: 'Road report or closure' },
];

/** "Near me": a frame round a dot (fit what's near you). */
function NearIcon({ colour }: { colour: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" fill="none" stroke={colour} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 9.5a2.5 2.5 0 1 0 0.01 0z" fill={colour} />
    </Svg>
  );
}

/** Find events: a magnifier. */
function FindIcon({ colour }: { colour: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path d="M10.5 4a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13zM15.5 15.5 20 20" fill="none" stroke={colour} strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  );
}

/** The layers button's icon: three stacked sheets, as in Apple Maps. */
function LayersIcon({ colour }: { colour: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path d="M12 3 21 8l-9 5-9-5z" fill="none" stroke={colour} strokeWidth={1.8} strokeLinejoin="round" />
      <Path d="M3 12.5l9 5 9-5M3 16.5l9 5 9-5" fill="none" stroke={colour} strokeWidth={1.8} strokeLinejoin="round" />
    </Svg>
  );
}

const START = { lat: 52.7, lng: -1.7 };
const START_SPAN = 1.4;

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const store = useStore();
  const { events, me, crews, users, builds, spots, nearby, settings, setSettings } = store;
  const now = useNow();
  const newNear = nearby?.unseen.length ?? 0;
  // Every layer is saved in settings, the core ones too (mapLayers.ts), so they come back as left.
  const layersKey = [settings.mapLayers, settings.cameras, settings.shops, settings.roadReports];
  const layers: Record<Layer, boolean> = useMemo(
    () => ({
      events: layerOn(settings, 'events'), photo: layerOn(settings, 'photo'), drive: layerOn(settings, 'drive'), track: layerOn(settings, 'track'),
      venue: layerOn(settings, 'venue'), shops: layerOn(settings, 'shops'), cameras: layerOn(settings, 'cameras'), roads: layerOn(settings, 'roads'),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    layersKey,
  );
  const shown = `${layers.events}${layers.photo}${layers.drive}${layers.track}${layers.venue}`;
  /** The camera layer's "zoom in" note only shows once the person has turned the layer on themselves. */
  const [camerasAsked, setCamerasAsked] = useState(false);
  function toggleLayer(key: Layer) {
    if (key === 'cameras') setCamerasAsked(!settings.cameras);
    setSettings(toggledLayer(settings, key));
  }
  /** Shops: which kinds to show and "partners only", kept in settings (Shops ▾ menu). */
  const savedCats = (settings.shopCategories ?? []).filter((c) => ALL_CATEGORIES.includes(c));
  const shopFilter: ShopFilter = useMemo(
    () => ({ categories: savedCats.length ? savedCats : [...ALL_CATEGORIES], partnersOnly: !!settings.shopPartnersOnly }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [savedCats.join(','), settings.shopPartnersOnly],
  );
  function toggleShopCategory(c: ShopCategory) {
    feel.select();
    setSettings({ shopCategories: toggleCategory(shopFilter.categories, c) });
  }
  const [selected, setSelected] = useState<string | null>(null);
  /** "Show everything": where to move the map, and a counter so the same button works twice. */
  const [view, setView] = useState<{ centre: LatLng; span: number; key: number } | null>(null);
  const meUser = users.find((u) => u.id === me);
  /** Where the map is looking, for the layers that only show when zoomed in (cameras, circuit outlines). */
  const [region, setRegionNow] = useState<MapRegion>({ centre: meUser?.home ?? START, span: START_SPAN });
  // Pans and zooms settle a moment before the pins are worked out again, so a burst of region updates costs one pass.
  const regionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const setRegion = useCallback((r: MapRegion) => {
    if (regionTimer.current) clearTimeout(regionTimer.current);
    regionTimer.current = setTimeout(() => setRegionNow(r), 120);
  }, []);
  useEffect(() => () => {
    if (regionTimer.current) clearTimeout(regionTimer.current);
  }, []);
  /** The region snapped to a coarse grid: small pans don't redraw the place pins. */
  const snapped = useMemo(() => regionKey(region.centre, region.span), [region]);
  /** Tracks: which vehicles to show circuits for (Cars, Bikes, Karts; any mix), kept in settings. */
  const trackKinds: TrackVehicle[] = settings.trackVehicles?.length ? settings.trackVehicles : ALL_VEHICLES;
  /** Tracks ▾ › Racing to watch: spectator venues (no track days), off by default. */
  const watchRacing = !!settings.spectatorTracks;
  function toggleKind(v: TrackVehicle) {
    const next = trackKinds.includes(v) ? trackKinds.filter((x) => x !== v) : ALL_VEHICLES.filter((x) => x === v || trackKinds.includes(x));
    if (!next.length) return;
    feel.select();
    setSettings({ trackVehicles: next });
  }
  /** The Tracks ▾ or Shops ▾ menu, anchored under the chip (window coordinates). */
  const [kindMenu, setKindMenu] = useState<{ which: 'track' | 'shops'; x: number; y: number } | null>(null);
  const screen = useWindowDimensions();
  const places = useMemo(
    () =>
      visibleSpots(spots, me).filter(
        // Photo spots are for car and bike photos: bundled ones without evidence stay off the map (photoVetting.ts).
        (s) =>
          (s.kind !== 'track' || (matchesVehicles(s, trackKinds) && (watchRacing || !isSpectatorVenue(s.id)))) &&
          !(s.kind === 'photo' && UNVETTED_PHOTO_SPOTS.has(s.id)),
      ),
    [spots, me, trackKinds, watchRacing],
  );
  const hasVenues = places.some((x) => x.kind === 'venue');
  // Meet spots also count as a kind of shop on the Shops layer, so they show with it even with Meet spots off.
  const venuesViaShops = layers.shops && !shopFilter.partnersOnly && shopFilter.categories.includes('coffee');

  // Follow the person: ask for when-in-use location the first time, then centre on them.
  const map = useRef<NightMapHandle>(null);
  const [located, setLocated] = useState(false);
  /** The last fix (answering "Still there?" needs you within a mile). Never stored. */
  const [here, setHere] = useState<LatLng | null>(null);
  const [locNote, setLocNote] = useState<string | null>(null);
  const { ready, locationNoticeSeen, markLocationNoticeSeen } = store;
  async function locate(ask: boolean, explicit: boolean) {
    const pos = await currentPosition(ask);
    if (pos.ok) {
      setLocated(true);
      setHere(pos.at);
      setLocNote(null);
      map.current?.animateTo(pos.at, 0.35);
      return;
    }
    setLocated(false);
    // Say so once (or whenever the locate button is tapped), then quietly stay on the home area.
    if (explicit || !locationNoticeSeen) {
      setLocNote(
        pos.reason === 'denied'
          ? "Location is off for Nightshift, so the map shows your home area. Turn it on in the iPhone Settings app to see where you are and check in."
          : "Couldn't find where you are just now, so the map shows your home area.",
      );
      if (!explicit) markLocationNoticeSeen();
    }
  }
  useEffect(() => {
    if (!ready) return;
    locate(true, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const allViews = useMemo(
    () => viewEvents(events, me, crews, users, builds, now).filter((v) => v.phase !== 'over' && v.phase !== 'cancelled' && v.role !== 'declined'),
    [events, me, crews, users, builds, now],
  );
  // The 30 s clock only matters to the pins when a phase, role or shown stop changes: keep the same views otherwise.
  const viewsSig = allViews.map((v) => `${v.event.id}:${v.phase}:${v.role}:${v.shownStop}`).join('|');
  const stableViews = useRef<{ sig: string; events: typeof events; views: EventView[] } | null>(null);
  if (!stableViews.current || stableViews.current.sig !== viewsSig || stableViews.current.events !== events) {
    stableViews.current = { sig: viewsSig, events, views: allViews };
  }
  const views = stableViews.current.views;

  const cams = useMemo(
    () => (layers.cameras ? camerasForView(cameraIndex(), region.centre, region.span) : null),
    [layers.cameras, region],
  );

  /**
   * Road reports for the view (the layer is off by default): drivers' reports and
   * open-data closures. 'map' never includes police, here or on the server.
   */
  const roads = useRoads();
  const { reports: roadReports } = useRoadReports({
    centre: region.centre,
    radiusMi: Math.min(50, Math.max(2, region.span * 69 * 0.75)),
    context: 'map',
    enabled: layers.roads,
  });
  const [roadNote, setRoadNote] = useState<{ id: string; text: string } | null>(null);
  async function answerReport(r: RoadReport, vote: RoadVote) {
    feel.select();
    setRoadNote(null);
    try {
      await roads.answer(r.id, vote, here);
      feel.success();
      setRoadNote({ id: r.id, text: vote === 'still_there' ? 'Thanks. Marked as still there.' : 'Thanks. Marked as gone.' });
    } catch (e) {
      setRoadNote({ id: r.id, text: e instanceof Error ? e.message : 'Could not send that.' });
    }
  }

  /** Partners: the production list (empty until the backend) and the labelled demo samples near home. */
  const partners = useMemo(() => [...PARTNERS, ...demoPartners(DEMO_PARTNERS, meUser?.home)], [meUser?.home]);
  // The shop dataset is an asset read the first time the layer is turned on (shopData.ts).
  const { index: shopIdx, failed: shopsFailed } = useShopIndex(layers.shops);
  const shopView = useMemo(() => {
    if (!layers.shops) return null;
    if (!shopIdx) return { shops: [], partners: [], tooWide: false, more: false, loading: true };
    const v = { ...shopsForView(shopIdx, region.centre, region.span, shopFilter, partners), loading: false };
    // A venue's own pin replaces the OpenStreetMap café under it.
    const venues = venuesViaShops || layers.venue ? places.filter((p) => p.kind === 'venue') : [];
    return { ...v, shops: v.shops.filter((s) => !(s.categories[0] === 'coffee' && venues.some((p) => milesBetween(p.at, s.at) < 0.12))) };
  }, [layers.shops, layers.venue, region, shopFilter, partners, venuesViaShops, places, shopIdx]);

  /** Places for the view: culled to the view, capped per kind, grouped into count pins when zoomed out (mapPlaces.ts). */
  const placeView = useMemo(() => {
    const shownPlaces = places.filter((s) => layers[s.kind] || (s.kind === 'venue' && venuesViaShops));
    const sel = selected?.startsWith('sp:') ? selected.slice(3) : null;
    return placesForView(shownPlaces, snapped.centre, snapped.span, sel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [places, shown, venuesViaShops, snapped.key, selected]);

  const { pins, paths, circles, polygons } = useMemo(() => {
    const pins: MapPin[] = [];
    const paths: MapPath[] = [];
    const circles: MapCircle[] = [];
    let polygons: MapPolygon[] = [];
    // Speed cameras first: they draw under everything else.
    if (cams) {
      for (const z of cams.zones) {
        paths.push({ id: `az:${z.id}`, coords: z.path, colour: LAYER.camera, dashed: true, width: 1.5 });
        // An "average speed" camera at each end of the zone; the line between follows the road.
        const ends = [z.path[0], z.path[z.path.length - 1]];
        ends.forEach((at, i) =>
          pins.push({ id: `avg:${z.id}:${i}`, at, glyph: 'average', colour: LAYER.camera, title: describeZone(z), size: cameraPinSize(region.span) + 3 }),
        );
      }
      // Cameras with no recorded limit say little: smaller and dimmer.
      for (const c of cams.cameras)
        pins.push({
          id: `cam:${c.id}`, at: c.at, glyph: 'camera', colour: c.mph ? LAYER.camera : CAMERA_DIM, title: describeCamera(c),
          size: cameraPinSize(region.span) - (c.mph ? 0 : 2),
        });
    }
    if (shopView) {
      for (const s of shopView.shops) pins.push({ id: `shop:${s.id}`, at: s.at, glyph: s.categories[0] ?? 'shop', colour: SHOP_COLOUR, title: s.name, size: shopPinSize(region.span) });
      for (const p of shopView.partners) pins.push({ id: `ptn:${p.id}`, at: p.at, glyph: 'partner', colour: PARTNER_COLOUR, title: `${p.name} (${partnerBadge(p)})`, size: 30, badge: 'P' });
    }
    for (const r of roadReports) {
      if (r.path) paths.push({ id: `rrp:${r.id}`, coords: r.path, colour: ROAD_COLOUR, width: 4 });
      pins.push({ id: `rr:${r.id}`, at: r.at, glyph: r.kind, colour: ROAD_COLOUR, title: KIND_INFO[r.kind].label, size: 30 });
    }
    if (layers.track) {
      for (const { id, outline } of outlinesInView(places, region.centre, region.span))
        paths.push({ id: `ol:${id}`, coords: outline.path, colour: SPOT_COLOURS.track, width: 3 });
    }
    if (layers.events) {
      for (const v of views) {
        const e = v.event;
        const colour = EVENT_COLOURS[e.type];
        if (v.shownStop >= 0) {
          const stop = e.stops[v.shownStop];
          if (stop.at) pins.push({ id: `ev:${e.id}`, at: stop.at, glyph: e.type, colour, title: e.title, size: 42, live: v.phase === 'live' });
          if (e.type === 'cruise') {
            const coords = e.stops.flatMap((s) => (s.at ? [s.at] : []));
            paths.push({ id: `rt:${e.id}`, coords, colour, dashed: true });
          }
        } else {
          circles.push({ id: `ar:${e.id}`, centre: e.area, radiusMiles: areaRadius(e), colour });
          const what = v.role === 'requested' ? `requested, ${UNLOCK.locked}` : UNLOCK.locked;
          pins.push({ id: `ev:${e.id}`, at: e.area, glyph: 'locked', colour, title: `${e.title} (${what})`, size: 34 });
        }
      }
    }
    for (const s of placeView.places) {
      const colour = s.status === 'pending' ? C.fog : SPOT_COLOURS[s.kind];
      pins.push({ id: `sp:${s.id}`, at: s.at, glyph: s.kind, colour, title: s.name, size: 32 });
    }
    for (const c of placeView.clusters)
      pins.push({ id: c.id, at: c.at, glyph: c.kind, colour: SPOT_COLOURS[c.kind], title: CLUSTER_NAMES[c.kind], size: 32, count: c.count });
    for (const s of placeView.lines) {
      const colour = s.status === 'pending' ? C.fog : SPOT_COLOURS[s.kind];
      paths.push({ id: `pa:${s.id}`, coords: s.path!, colour, dashed: s.status === 'pending' });
    }
    return { pins: orderPins(pins), paths, circles, polygons };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [views, shown, placeView, cams, region.span, shopView, roadReports]);

  /** A count pin: zoom in on it. */
  function zoomCluster(id: string) {
    const c = placeView.clusters.find((x) => x.id === id);
    if (!c) return;
    feel.select();
    setView((x) => ({ centre: c.at, span: c.zoomSpan, key: (x?.key ?? 0) + 1 }));
  }
  const onSelectPin = useCallback((id: string) => {
    if (id.startsWith('cl:')) zoomClusterRef.current(id);
    else setSelected(id);
  }, []);
  const zoomClusterRef = useRef(zoomCluster);
  zoomClusterRef.current = zoomCluster;
  const clearSelection = useCallback(() => setSelected(null), []);

  const sel = selected ? describeSelection(selected) : null;

  function describeSelection(id: string): Selection | null {
    const kind = id.slice(0, id.indexOf(':'));
    const key = id.slice(id.indexOf(':') + 1);
    if (kind === 'cam' || kind === 'avg') {
      const pin = pins.find((p) => p.id === id);
      if (!pin) return null;
      const [what, ...rest] = pin.title.split(' · ');
      return { title: what, meta: rest.join(' · '), body: `${CAMERA_CAVEAT}\n${CAMERA_CREDIT}.`, colour: LAYER.camera };
    }
    if (kind === 'rr') {
      const r = roadReports.find((x) => x.id === key);
      if (!r) return null;
      const info = KIND_INFO[r.kind];
      const sample = r.id.startsWith('demo-rr-');
      const problem = answerProblem(r, roads.skipGps ? r.at : here, now);
      const note =
        roadNote?.id === r.id
          ? roadNote.text
          : r.source !== 'user'
            ? undefined
            : r.mine
              ? 'Your report. Other drivers confirm or clear it.'
              : r.myVote
                ? `You said ${r.myVote === 'still_there' ? 'still there' : 'gone'}.`
                : problem ?? undefined;
      return {
        title: r.source === 'user' ? info.label : [info.label, r.road].filter(Boolean).join(' · '),
        meta: [r.source === 'user' ? `Reported ${reportAge(r.createdAt, now)}` : r.direction, confirmations(r)].filter(Boolean).join(' · '),
        body: [
          r.description,
          r.source === 'user' ? `Ends ${reportEnds(r.expiresAt, now)} unless drivers confirm it.` : `Until ${reportEnds(r.expiresAt, now)}.`,
          sample ? 'Sample report for the demo.' : null,
        ].filter(Boolean).join('\n'),
        colour: ROAD_COLOUR,
        ...(note ? { note } : {}),
        ...(r.source === 'user' && !problem && roadNote?.id !== r.id
          ? {
              actions: [
                { label: 'Still there', onPress: () => answerReport(r, 'still_there'), colour: STATE.success },
                { label: 'Gone', onPress: () => answerReport(r, 'gone'), colour: C.fog },
              ],
            }
          : {}),
      };
    }
    if (kind === 'shop') {
      const s = shopIdx?.find(key);
      if (!s) return null;
      const hours = parseOpeningHours(s.hours);
      return {
        title: s.name,
        meta: [describeCategories(s.categories), hours ? openState(hours, now).label : null].filter(Boolean).join(' · '),
        body: `${s.brand ? `${s.brand}. ` : ''}Listing from OpenStreetMap, not a Nightshift partner.`,
        colour: SHOP_COLOUR,
        open: () => router.push({ pathname: '/shop/[id]', params: { id: s.id } }),
        cta: 'Open shop ›',
      };
    }
    if (kind === 'ptn') {
      const p = partners.find((x) => x.id === key);
      if (!p) return null;
      const hours = parseOpeningHours(p.hours);
      return {
        title: p.name,
        meta: [partnerBadge(p), describeCategories(p.categories), hours ? openState(hours, now).label : null].filter(Boolean).join(' · '),
        body: [p.offer, p.demo ? 'Made-up business for the demo.' : null].filter(Boolean).join('\n') || (p.description ?? ''),
        colour: PARTNER_COLOUR,
        open: () => router.push({ pathname: '/shop/[id]', params: { id: `partner:${p.id}` } }),
        cta: 'Open partner ›',
      };
    }
    if (kind === 'ev') {
      const v = views.find((x) => x.event.id === key);
      if (!v) return null;
      const e = v.event;
      const place =
        v.shownStop >= 0
          ? e.stops[v.shownStop].name
          : v.role === 'requested'
            ? `${e.areaName} · ${UNLOCK.locked} · requested, waiting for a host`
            : `${e.areaName} · ${UNLOCK.locked}`;
      const clock = eventClock(v, now);
      return {
        title: e.title,
        meta: [EVENT_LABELS[e.type], roleLabel(v.role), `${clock.label} ${clock.value}`, `${e.going.length} going`].filter(Boolean).join(' · '),
        body: `${place}\n${describeFilter(e.filter)}`,
        colour: EVENT_COLOURS[e.type],
        open: () => router.push({ pathname: '/event/[id]', params: { id: e.id } }),
        cta: 'Open event ›',
      };
    }
    const s = places.find((x) => x.id === key);
    if (!s) return null;
    const { average, count } = averageStars(s);
    const stars = count > 0 ? ` · ★ ${average.toFixed(1)}` : '';
    const status = s.status === 'pending' ? ' · waiting for approval' : '';
    return {
      title: s.name,
      meta:
        (s.kind === 'drive' ? `${PLACE_NAMES.drive.one} · ${s.miles} mi · ${driveTier(s.miles).label} · +${driveTier(s.miles).rep} rep · untimed` : PLACE_NAMES[s.kind].one) +
        (s.region ? ` · ${s.region}` : '') + stars + status,
      body: s.description,
      colour: SPOT_COLOURS[s.kind],
      open: () => router.push({ pathname: '/spot/[id]', params: { id: s.id } }),
      cta: openPlaceLabel(s.kind),
    };
  }

  /** One short line under the bar: what to zoom in for, or the OpenStreetMap credit. */
  const openDataCredit = Array.from(new Set(roadReports.filter((r) => r.source !== 'user').map((r) => sourceCredit(r)).filter(Boolean))).join(' · ');
  const mapNote = (() => {
    const zoom = [cams?.tooWide && camerasAsked ? 'CAMERAS' : null, shopView?.tooWide ? 'SHOPS' : null].filter(Boolean);
    if (shopView?.loading) return { zoom: true, text: shopsFailed ? "COULDN'T LOAD SHOPS" : 'LOADING SHOPS…' };
    if (zoom.length) return { zoom: true, text: `ZOOM IN TO SEE ${zoom.join(' AND ')}` };
    if (shopView && shopFilter.partnersOnly) return { zoom: false, text: `PARTNERS ONLY · ${shopView.partners.length} HERE` };
    const more = shopView?.more ? ' · nearest shops shown' : '';
    const closures = openDataCredit ? ` · closures: ${openDataCredit}` : '';
    return { zoom: false, text: `© OpenStreetMap${cams && !cams.tooWide ? ' · cameras may be incomplete' : ''}${more}${closures}` };
  })();
  const [showKey, setShowKey] = useState(false);
  /** The layers button's menu, and where it opens (window y under the layers button). */
  const [showLayers, setShowLayers] = useState(false);
  const layersButton = useRef<ComponentRef<typeof View>>(null);
  const [menuTop, setMenuTop] = useState(insets.top + 160);
  function measureMenu(then: () => void) {
    if (!layersButton.current) return then();
    layersButton.current.measureInWindow((_x, y, _w, h) => {
      if (h) setMenuTop(y + h + 8);
      then();
    });
  }
  const moreOn = MORE_LAYERS.filter((l) => l.key !== 'venue' && layers[l.key]).length;

  // The top bar fits the screen at any text size: labelled pills, or icons only (mapLayers.ts).
  const chrome = mapChrome(screen.width, screen.fontScale, { labels: LAYERS.map((l) => l.label), withMenu: 1, live: views.some((v) => v.phase === 'live'), cap: FONT_SCALE.chrome });

  const hud = useMemo(() => mapHud(views, now), [views, now]);
  const liveCount = hud.live.length;
  /** Live pill: jump to the live event and open its card. */
  function focusLive() {
    const v = hud.live[0];
    if (!v) return;
    const at = v.shownStop >= 0 ? v.event.stops[v.shownStop].at : v.event.area;
    if (at) setView((x) => ({ centre: at, span: 0.3, key: (x?.key ?? 0) + 1 }));
    setSelected(`ev:${v.event.id}`);
  }
  /** Near me: what's near you that you can open (events and places on the shown layers), the nearest 60 to home. */
  function nearMe() {
    feel.tap();
    const from = meUser?.home ?? region.centre;
    const shownPlaces = places.filter((s) => layers[s.kind] || (s.kind === 'venue' && venuesViaShops)).map((s) => s.at);
    const evs = layers.events ? views.map((v) => (v.shownStop >= 0 ? v.event.stops[v.shownStop].at : v.event.area)).filter((p): p is LatLng => !!p) : [];
    const r = fitRegion(nearestPoints([...evs, ...shownPlaces], from, 60));
    if (r) setView((v) => ({ ...r, key: (v?.key ?? 0) + 1 }));
  }
  const lead = hud.live[0] ?? hud.next;
  const after = hud.live[0] ? hud.next : null;
  /** The one-time "how the map works" hint (REVIEW-5 M8), once the location note is out of the way. */
  const showHint = ready && !settings.mapHintSeen && !locNote;

  return (
    <View style={{ flex: 1, backgroundColor: C.asphalt }}>
      <NightMap
        ref={map}
        pins={pins}
        paths={paths}
        circles={circles}
        polygons={polygons}
        centre={view?.centre ?? meUser?.home ?? START}
        span={view?.span ?? START_SPAN}
        onRegion={setRegion}
        recentreKey={view?.key ?? 0}
        onSelect={onSelectPin}
        onPressMap={clearSelection}
        showsUser={located}
      />
      <View style={[st.hud, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
        <Row style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
          <View style={st.brand}>
            <Txt v="h3" scale="chrome" style={{ fontFamily: F.displayMedItalic }} numberOfLines={1}>
              NIGHT<Txt v="h3" scale="chrome" style={{ color: BRAND, fontFamily: F.displayMedItalic }}>SHIFT</Txt>
            </Txt>
          </View>
          <Row gap={8} style={{ flexWrap: 'nowrap', flexShrink: 1, justifyContent: 'flex-end' }}>
            {liveCount > 0 ? (
              <Pressable
                onPress={focusLive}
                style={({ pressed }) => [st.live, pressed && { opacity: 0.8 }]}
                accessibilityRole="button"
                accessibilityLabel={`${plural(liveCount, 'event')} live now. Show on the map`}
                hitSlop={6}
              >
                <View style={st.liveDot} />
                <Txt v="label" scale="chrome" style={{ color: C.asphalt, fontFamily: F.labelBold }} numberOfLines={1}>{liveCount} live</Txt>
              </Pressable>
            ) : null}
            <Pressable
              onPress={() => router.push('/find')}
              style={({ pressed }) => [st.mapButton, chrome.find === 'label' && st.findWide, pressed && { opacity: 0.8 }]}
              accessibilityRole="button"
              accessibilityLabel={newNear > 0 ? `Find events, ${newNear} new near you` : 'Find events'}
              hitSlop={4}
            >
              <FindIcon colour={C.chalk} />
              {chrome.find === 'label' ? <Txt v="label" scale="chrome" style={{ color: C.chalk, fontFamily: F.labelBold }}>Find</Txt> : null}
              {newNear > 0 ? (
                <View style={st.badge}>
                  <Text maxFontSizeMultiplier={FONT_SCALE.chrome} style={st.badgeText}>{newNear > 9 ? '9+' : newNear}</Text>
                </View>
              ) : null}
            </Pressable>
            <NoticeBell boxed />
          </Row>
        </Row>
        <LayerBar
          compact={chrome.pills === 'icons'}
          onToggle={(key) => {
            setKindMenu(null);
            toggleLayer(key as Layer);
          }}
          layers={LAYERS.map((l) => ({
            key: l.key,
            label: l.label,
            glyph: l.glyph,
            colour: l.colour,
            on: layers[l.key],
            ...(l.key === 'track'
              ? {
                  note: trackKinds.length === ALL_VEHICLES.length ? undefined : trackKinds.map((v) => VEHICLE_LABELS[v]).join(' · '),
                  menu: (anchor: { x: number; y: number }) => setKindMenu((m) => (m ? null : { which: 'track', ...anchor })),
                }
              : {}),
          }))}
        />
        <Row style={{ justifyContent: 'space-between', flexWrap: 'nowrap', alignItems: 'flex-start' }}>
          {(cams && (!cams.tooWide || camerasAsked)) || shopView || openDataCredit ? (
            <View style={st.credit} pointerEvents="none">
              <Txt v="micro" scale="chrome" style={{ color: mapNote.zoom ? C.chalk : C.fog }} numberOfLines={2}>{mapNote.text}</Txt>
            </View>
          ) : <View />}
          <View style={{ gap: 8 }}>
            <Pressable
              onPress={() => locate(true, true)}
              style={({ pressed }) => [st.mapButton, pressed && { opacity: 0.8 }]}
              accessibilityRole="button"
              accessibilityLabel="Show where I am"
              hitSlop={4}
            >
              <Pin glyph="you" colour={located ? C.chalk : C.fog} size={26} />
            </Pressable>
            <Pressable
              ref={layersButton}
              onPress={() => {
                setKindMenu(null);
                setShowKey(false);
                if (showLayers) setShowLayers(false);
                else measureMenu(() => setShowLayers(true));
              }}
              style={({ pressed }) => [st.mapButton, (showLayers || moreOn > 0) && { borderColor: SURFACE.borderStrong }, pressed && { opacity: 0.8 }]}
              accessibilityRole="button"
              accessibilityLabel={`Map layers and key: meet spots, shops, speed cameras and road reports${moreOn > 0 ? `, ${moreOn} on` : ''}`}
              accessibilityState={{ expanded: showLayers }}
              hitSlop={4}
            >
              <LayersIcon colour={showLayers || moreOn > 0 ? C.chalk : C.fog} />
            </Pressable>
            <Pressable
              onPress={nearMe}
              style={({ pressed }) => [st.mapButton, pressed && { opacity: 0.8 }]}
              accessibilityRole="button"
              accessibilityLabel="Near me: show what's near your home area"
              hitSlop={4}
            >
              <NearIcon colour={C.chalk} />
            </Pressable>
          </View>
        </Row>
        {locNote ? (
          <View style={st.note}>
            <Txt v="muted" style={{ color: C.chalk }}>{locNote}</Txt>
            <Row gap={18}>
              {Platform.OS !== 'web' ? <LinkText label="Open Settings" onPress={() => Linking.openSettings().catch(() => {})} /> : null}
              <LinkText label="OK" colour={C.fog} onPress={() => setLocNote(null)} />
            </Row>
          </View>
        ) : null}
        {showHint ? (
          <View style={st.note} accessibilityLiveRegion="polite">
            <Txt v="eyebrow">How the map works</Txt>
            <Txt v="muted" style={{ color: C.chalk }}>Filled pins are events. Outlined pins are places. Tap a pin to see it.</Txt>
            <Txt v="muted" style={{ color: C.chalk }}>The layers button (right) has more layers, Suggest a place and the map key. Long-press a pill with ▾ for its options.</Txt>
            <Row gap={18}>
              <LinkText label="Got it" onPress={() => setSettings({ mapHintSeen: true })} />
              <LinkText
                label="Show the key"
                colour={C.fog}
                onPress={() => {
                  setSettings({ mapHintSeen: true });
                  measureMenu(() => setShowKey(true));
                }}
              />
            </Row>
          </View>
        ) : null}
      </View>
      <View style={st.bottom} pointerEvents="box-none">
      {/* Bottom-right, above the card: room for a small map widget (e.g. a speed readout). See MapWidgetSlot. */}
      <MapWidgetSlot />
      {sel ? (
        <SelectionCard open={sel.open} colour={sel.colour}>
          <Row style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
            <Txt v="h3" style={{ flex: 1 }} numberOfLines={2}>{sel.title}</Txt>
            <Pressable onPress={() => setSelected(null)} hitSlop={14} accessibilityRole="button" accessibilityLabel="Close" style={{ minHeight: 32, justifyContent: 'center' }}>
              <Txt v="label" scale="chrome">Close</Txt>
            </Pressable>
          </Row>
          <Txt v="mono" scale="chrome" style={{ color: sel.colour }}>{sel.meta}</Txt>
          {sel.body ? <Txt v="muted">{sel.body}</Txt> : null}
          {sel.note ? <Txt v="muted" style={{ color: C.chalk }}>{sel.note}</Txt> : null}
          {sel.actions ? (
            <Row gap={10} style={{ flexWrap: 'nowrap', marginTop: 2 }}>
              {sel.actions.map((a) => (
                <Pressable
                  key={a.label}
                  onPress={a.onPress}
                  accessibilityRole="button"
                  style={({ pressed }) => [st.answer, { borderColor: a.colour }, pressed && { opacity: 0.8 }]}
                >
                  <Txt v="label" scale="chrome" style={{ color: a.colour, fontSize: TYPE.body }}>{a.label}</Txt>
                </Pressable>
              ))}
            </Row>
          ) : null}
          {sel.cta ? <Txt v="label" scale="chrome" style={{ color: BRAND, marginTop: 2 }}>{sel.cta}</Txt> : null}
        </SelectionCard>
      ) : lead ? (
        <NextUp lead={lead} after={after} tonight={hud.tonight} now={now} />
      ) : ready ? (
        <NothingOn />
      ) : null}
      </View>
      {showLayers ? (
        <>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowLayers(false)} accessibilityLabel="Close the layers menu" />
          <View style={[st.menu, st.key, { top: menuTop }]} accessibilityRole="menu">
            <Txt v="micro">More on the map</Txt>
            {MORE_LAYERS.filter((l) => l.key !== 'venue' || hasVenues).map((l) => {
              const on = layers[l.key];
              return (
                <View key={l.key} style={st.menuRow}>
                  <Pressable
                    onPress={() => {
                      feel.select();
                      toggleLayer(l.key);
                    }}
                    accessibilityRole="switch"
                    accessibilityState={{ checked: on }}
                    style={({ pressed }) => [st.menuHit, pressed && { opacity: 0.8 }]}
                  >
                    <View style={[st.box, on && { backgroundColor: l.colour, borderColor: l.colour }]}>
                      {on ? <Tick /> : null}
                    </View>
                    <Pin glyph={l.glyph} colour={on ? l.colour : C.fog} size={20} />
                    <View style={{ flexShrink: 1 }}>
                      <Txt v="muted" style={{ color: on ? C.chalk : C.fog }}>{l.label}</Txt>
                      {l.key === 'shops' && on && shopFilterNote(shopFilter.categories, shopFilter.partnersOnly) ? (
                        <Txt v="micro">{shopFilterNote(shopFilter.categories, shopFilter.partnersOnly)}</Txt>
                      ) : null}
                    </View>
                  </Pressable>
                  {l.key === 'shops' ? (
                    <Pressable
                      onPress={() => {
                        setShowLayers(false);
                        setKindMenu({ which: 'shops', x: screen.width - 262, y: menuTop });
                      }}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel="Which kinds of shop to show"
                      style={{ minHeight: 44, justifyContent: 'center', paddingLeft: 6 }}
                    >
                      <Txt v="label" scale="chrome" style={{ color: BRAND }}>Kinds ›</Txt>
                    </Pressable>
                  ) : null}
                </View>
              );
            })}
            <View style={st.rule} />
            <Pressable
              onPress={() => {
                setShowLayers(false);
                router.push('/spot/new');
              }}
              accessibilityRole="button"
              style={({ pressed }) => [st.menuRow, pressed && { opacity: 0.8 }]}
            >
              <Txt v="label" scale="chrome" style={{ color: BRAND }}>+ Suggest a place</Txt>
            </Pressable>
            <Pressable
              onPress={() => {
                setShowLayers(false);
                setShowKey(true);
              }}
              accessibilityRole="button"
              style={({ pressed }) => [st.menuRow, pressed && { opacity: 0.8 }]}
            >
              <Txt v="label" scale="chrome" style={{ color: C.chalk }}>Map key ›</Txt>
            </Pressable>
          </View>
        </>
      ) : null}
      {showKey ? (
        <>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowKey(false)} accessibilityLabel="Close the map key" />
          <View style={[st.menu, st.key, { top: menuTop }]} accessibilityRole="summary">
            <Row style={{ justifyContent: 'space-between' }}>
              <Txt v="micro">Map key</Txt>
              <Pressable onPress={() => setShowKey(false)} hitSlop={14} accessibilityRole="button" accessibilityLabel="Close">
                <Txt v="micro">Close</Txt>
              </Pressable>
            </Row>
            <Txt v="caption">Filled pins are events. Outlined pins are places. A number on a pin is a group: tap to zoom in.</Txt>
            {KEY_ROWS.map((r) => (
              <View key={r.label} style={[st.menuRow, { minHeight: 30 }]}>
                <Pin glyph={r.glyph} colour={r.colour} size={22} />
                <Txt v="caption" style={{ color: C.chalk, flexShrink: 1 }} numberOfLines={2}>{r.label}</Txt>
              </View>
            ))}
          </View>
        </>
      ) : null}
      {kindMenu?.which === 'shops' ? (
        <>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setKindMenu(null)} accessibilityLabel="Close the menu" />
          <View style={[st.menu, { left: Math.max(8, Math.min(kindMenu.x, screen.width - 262)), top: kindMenu.y, width: 254 }]} accessibilityRole="menu">
            <Row style={{ justifyContent: 'space-between' }}>
              <Txt v="micro">Show shops</Txt>
              {shopFilter.categories.length < ALL_CATEGORIES.length ? (
                <Pressable
                  onPress={() => {
                    feel.select();
                    setSettings({ shopCategories: [...ALL_CATEGORIES] });
                  }}
                  hitSlop={14}
                  accessibilityRole="button"
                  accessibilityLabel="Show all kinds of shop"
                >
                  <Txt v="micro" style={{ color: BRAND }}>Show all</Txt>
                </Pressable>
              ) : null}
            </Row>
            {MENU_ORDER.map((c) => {
              const on = shopFilter.categories.includes(c);
              return (
                <Pressable
                  key={c}
                  onPress={() => toggleShopCategory(c)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  accessibilityHint={CATEGORY_HINTS[c]}
                  style={({ pressed }) => [st.menuRow, pressed && { opacity: 0.8 }]}
                >
                  <View style={[st.box, on && { backgroundColor: SHOP_COLOUR, borderColor: SHOP_COLOUR }]}>{on ? <Tick /> : null}</View>
                  <Pin glyph={c} colour={on ? SHOP_COLOUR : C.fog} size={18} />
                  <Txt v="muted" style={{ color: on ? C.chalk : C.fog, flexShrink: 1 }} numberOfLines={1}>{CATEGORY_LABELS[c]}</Txt>
                </Pressable>
              );
            })}
            <View style={st.rule} />
            <Pressable
              onPress={() => {
                feel.select();
                setSettings({ shopPartnersOnly: !shopFilter.partnersOnly });
              }}
              accessibilityRole="switch"
              accessibilityState={{ checked: shopFilter.partnersOnly }}
              style={({ pressed }) => [st.menuRow, pressed && { opacity: 0.8 }]}
            >
              <View style={[st.box, shopFilter.partnersOnly && { backgroundColor: PARTNER_COLOUR, borderColor: PARTNER_COLOUR }]}>
                {shopFilter.partnersOnly ? <Tick /> : null}
              </View>
              <Pin glyph="partner" colour={shopFilter.partnersOnly ? PARTNER_COLOUR : C.fog} size={18} />
              <Txt v="muted" style={{ color: shopFilter.partnersOnly ? C.chalk : C.fog }}>Partners only</Txt>
            </Pressable>
            <Txt v="caption">Partners pay to be highlighted and are always marked Partner. Other listings come from OpenStreetMap.</Txt>
          </View>
        </>
      ) : kindMenu ? (
        <>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setKindMenu(null)} accessibilityLabel="Close the menu" />
          <View style={[st.menu, { left: Math.max(8, Math.min(kindMenu.x, screen.width - 178)), top: kindMenu.y, minWidth: 170 }]} accessibilityRole="menu">
            <Txt v="micro">Show tracks for</Txt>
            {[...ALL_VEHICLES.map((v) => ({ key: v as string, label: VEHICLE_LABELS[v], on: trackKinds.includes(v), toggle: () => toggleKind(v) })),
              // Speedway, oval stock cars, motocross and closed-road races: no track days, so off unless asked for.
              { key: 'watch', label: 'Racing to watch', on: watchRacing, toggle: () => { feel.select(); setSettings({ spectatorTracks: !watchRacing }); } },
            ].map((v) => {
              const on = v.on;
              return (
                <Pressable
                  key={v.key}
                  onPress={v.toggle}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  style={({ pressed }) => [st.menuRow, pressed && { opacity: 0.8 }]}
                >
                  <View style={[st.box, on && { backgroundColor: LAYER.track, borderColor: LAYER.track }]}>{on ? <Tick /> : null}</View>
                  <Txt style={{ color: on ? C.chalk : C.fog }}>{v.label}</Txt>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : null}
    </View>
  );
}

function Tick() {
  return <Txt v="micro" scale="chrome" style={{ color: C.asphalt, fontFamily: F.labelBold }}>✓</Txt>;
}

/** The card for the tapped pin: a button when it opens something, else a plain card (its own buttons stay live). */
function SelectionCard({ open, colour, children }: { open?: () => void; colour: string; children: ReactNode }) {
  if (!open) {
    return (
      <View style={[st.peek, { borderLeftColor: colour }]} accessibilityRole="summary">
        {children}
      </View>
    );
  }
  return (
    <Pressable style={({ pressed }) => [st.peek, { borderLeftColor: colour }, pressed && { opacity: 0.9 }]} onPress={open} accessibilityRole="button">
      {children}
    </Pressable>
  );
}

/** "at 22:40", or "tomorrow at 09:00" / "on Fri 21 Nov". */
function reportEnds(iso: string, now: Date): string {
  const d = new Date(iso);
  const hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  const day = (x: Date) => `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}`;
  if (day(d) === day(now)) return `at ${hm}`;
  const tomorrow = new Date(now.getTime() + 86_400_000);
  if (day(d) === day(tomorrow)) return `tomorrow at ${hm}`;
  return `on ${d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}`;
}

/** Nothing you're part of is coming up: say what to do instead (REVIEW-5 M8). */
function NothingOn() {
  return (
    <Card variant="glass" style={{ gap: 10 }}>
      <Txt v="h3">Nothing on near you tonight</Txt>
      <Txt v="muted">Find an event to go to, or host one for your mates.</Txt>
      <Row style={{ flexWrap: 'nowrap' }}>
        <Button label="Find events" size="sm" onPress={() => router.push('/find')} style={{ flex: 1 }} />
        <Button label="Host one" kind="secondary" size="sm" onPress={() => router.push('/event/new')} style={{ flex: 1 }} />
      </Row>
      <LinkText label="Suggest a place ›" onPress={() => router.push('/spot/new')} />
    </Card>
  );
}

/** The bottom HUD card: what's on now, or the next thing you're part of, with a countdown. */
function NextUp({ lead, after, tonight, now }: { lead: EventView; after: EventView | null; tonight: number; now: Date }) {
  const e = lead.event;
  const colour = EVENT_COLOURS[e.type];
  const clock = eventClock(lead, now);
  const locked = unlocksIn(lead, now);
  const role = roleLabel(lead.role);
  const open = (id: string) => router.push({ pathname: '/event/[id]', params: { id } });
  return (
    <View style={[st.next, { borderLeftColor: clock.live ? STATE.live : colour }]}>
      <Pressable
        onPress={() => open(e.id)}
        accessibilityRole="button"
        accessibilityLabel={`${clock.live ? 'Live now' : 'Next up'}: ${e.title}, ${role ? `${role}, ` : ''}${clock.label} ${clock.value}. Open event`}
        style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 12 }, pressed && { opacity: 0.8 }]}
      >
        <PulseRing live={clock.live} size={38}>
          <Pin glyph={lead.shownStop >= 0 ? e.type : 'locked'} colour={colour} size={38} />
        </PulseRing>
        <View style={{ flex: 1, gap: 1 }}>
          <Row gap={6} style={{ flexWrap: 'nowrap' }}>
            {clock.live ? <View style={[st.liveDot, { backgroundColor: STATE.liveDot }]} /> : null}
            <Txt v="eyebrow" scale="chrome" style={{ color: clock.live ? STATE.live : colour, flexShrink: 1 }} numberOfLines={1}>
              {clock.live ? 'Live now' : 'Next up'} · {EVENT_LABELS[e.type]}
            </Txt>
          </Row>
          <Txt v="h3" scale="chrome" numberOfLines={1}>{e.title}</Txt>
          <Row gap={6} style={{ flexWrap: 'nowrap' }}>
            {role ? <Tag label={role} tone={roleTone(lead.role)} /> : null}
            <Txt v="mono" scale="chrome" numberOfLines={1} style={{ flexShrink: 1 }}>
              {[`${e.going.length} going`, locked ? UNLOCK.in(locked) : null].filter(Boolean).join(' · ').toUpperCase()}
            </Txt>
          </Row>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Txt v="micro" scale="chrome">{clock.live ? 'Ends in' : 'Starts in'}</Txt>
          <Txt v="h2" scale="chrome" style={{ color: clock.live ? STATE.live : C.chalk, fontVariant: ['tabular-nums'], textTransform: 'none' }}>{clock.value}</Txt>
        </View>
      </Pressable>
      {after || tonight > 1 ? (
        <View style={st.nextFoot}>
          {after ? (
            <Pressable onPress={() => open(after.event.id)} accessibilityRole="button" hitSlop={10} style={{ flex: 1 }}>
              <Txt v="mono" scale="chrome" numberOfLines={1}>
                THEN <Txt v="mono" scale="chrome" style={{ color: C.chalk }}>{after.event.title.toUpperCase()}</Txt> · {eventClock(after, now).value.toUpperCase()}
              </Txt>
            </Pressable>
          ) : <View style={{ flex: 1 }} />}
          {tonight > 1 ? <Txt v="mono" scale="chrome" style={{ color: BRAND }}>{tonight} IN THE NEXT 12H</Txt> : null}
        </View>
      ) : null}
    </View>
  );
}

const st = StyleSheet.create({
  hud: { position: 'absolute', left: 0, right: 0, top: 0, paddingHorizontal: 14 },
  brand: { backgroundColor: SURFACE.glass, borderColor: C.kerb, borderWidth: 1, borderRadius: RADIUS.card, paddingHorizontal: 10, minHeight: 44, justifyContent: 'center', flexShrink: 0 },
  live: { backgroundColor: STATE.live, borderRadius: RADIUS.card, paddingHorizontal: 10, minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: STATE.liveDot },
  /** Every map button: a 44 pt rounded square on glass (REVIEW-5 m10). */
  mapButton: {
    backgroundColor: SURFACE.glass, borderColor: C.kerb, borderWidth: 1, borderRadius: RADIUS.card, minWidth: 44, height: 44,
    alignItems: 'center', justifyContent: 'center',
  },
  findWide: { flexDirection: 'row', gap: 6, paddingHorizontal: 10 },
  badge: {
    position: 'absolute', top: -5, right: -6, minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4,
    backgroundColor: BRAND, alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { fontFamily: F.labelBold, fontSize: TYPE.micro, color: C.ink },
  next: {
    backgroundColor: SURFACE.glassRaised, borderColor: C.kerb, borderWidth: 1,
    borderLeftWidth: 3, borderRadius: RADIUS.card, paddingHorizontal: 12, paddingVertical: 10, gap: 8,
  },
  nextFoot: { flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: 1, borderTopColor: C.kerb, paddingTop: 7 },
  note: { backgroundColor: SURFACE.glassRaised, borderColor: C.kerbHi, borderWidth: 1, borderRadius: RADIUS.card, padding: 12, gap: 8, marginTop: 8 },
  menu: {
    // Solid, not glass: a menu often opens over a card or note, and any alpha lets their text ghost through.
    position: 'absolute', backgroundColor: SURFACE.surface, borderColor: C.kerbHi, borderWidth: 1, borderRadius: RADIUS.card,
    paddingHorizontal: 12, paddingVertical: 8, gap: 0, minWidth: 140,
  },
  /** Menu rows are at least 44 pt tall (REVIEW-5 m19). */
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
  menuHit: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minHeight: 44 },
  rule: { height: 1, backgroundColor: C.kerb, marginVertical: 4 },
  /** The bottom of the map: the widget slot on the right, then the card. */
  bottom: { position: 'absolute', left: 12, right: 12, bottom: 12, gap: 8 },
  key: { right: 14, width: 260 },
  box: { width: 20, height: 20, borderRadius: 4, borderWidth: 1.5, borderColor: C.fog, alignItems: 'center', justifyContent: 'center' },
  credit: {
    backgroundColor: SURFACE.glass, borderColor: C.kerb, borderWidth: 1, borderRadius: RADIUS.tag, paddingHorizontal: 6, paddingVertical: 3,
    flexShrink: 1, marginRight: 8, marginTop: 2,
  },
  answer: { flex: 1, minHeight: 44, borderWidth: 1.5, borderRadius: RADIUS.card, alignItems: 'center', justifyContent: 'center' },
  peek: {
    backgroundColor: SURFACE.glassRaised, borderColor: C.kerb, borderWidth: 1,
    borderLeftWidth: 3, borderRadius: RADIUS.card, padding: 14, gap: 6,
  },
});
