import { router, useLocalSearchParams } from 'expo-router';
import { areaRadius } from '../../lib/area';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { Linking, Platform, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pin, type Glyph } from '../../components/Pin';
import { LayersPanel } from '../../components/LayersPanel';
import { detentTops, MapSheet, type Detent } from '../../components/MapSheet';
import { MapWidgetSlot } from '../../components/MapWidgetSlot';
import Svg, { Path } from 'react-native-svg';
import { UNVETTED_PHOTO_SPOTS } from '../../data/photoVetting';
import { feel } from '../../lib/feel';
import { inViewOnly, nearestPoints, placesForView, regionKey } from '../../lib/mapPlaces';
import { NightMap } from '../../components/NightMap';
import type { MapCircle, MapPath, MapPin, MapPolygon, MapRegion, NightMapHandle } from '../../components/mapTypes';
import {
  Button,
  Card,
  DsText,
  EmptyState,
  IconButton,
  ListRow,
  Press,
  ScreenHeader,
  SearchField,
  Section,
  SegmentedControl,
  Sheet,
  SheetOption,
  metaLine,
  useToast,
} from '../../components/ds';
import { EventEntityCard, PlaceEntityCard, roleTag } from '../../components/TonightCards';
import { checkInWindowOpen, EVENT_LABELS } from '../../lib/events';
import { viewEvents, type EventView } from '../../lib/eventView';
import { windowFor } from '../../lib/discover';
import { describeFilter } from '../../lib/invites';
import { eventClock, mapHud, orderPins, unlocksIn } from '../../lib/hud';
import { fitRegion, formatMiles } from '../../lib/geo';
import { currentPosition } from '../../lib/location';
import type { LatLng, SpotKind } from '../../lib/types';
import { averageStars, visibleSpots } from '../../lib/spots';
import { driveTier } from '../../lib/rep';
import { cameraIndex } from '../../lib/cameraData';
import { CAMERA_CAVEAT, CAMERA_CREDIT, cameraPinSize, camerasForView, describeCamera, describeZone } from '../../lib/cameras';
import { ALL_VEHICLES, isSpectatorVenue, matchesVehicles, outlinesInView } from '../../lib/tracks';
import type { TrackVehicle } from '../../lib/laptimes';
import { useStore } from '../../lib/store';
import { useNow } from '../../lib/clock';
import { useShopIndex } from '../../lib/shopData';
import { describeCategories, shopPinSize, shopsForView, toggleCategory, type ShopFilter } from '../../lib/shops';
import { ALL_CATEGORIES, type ShopCategory } from '../../lib/shopCategories';
import { parseOpeningHours, openState } from '../../lib/openingHours';
import { demoPartners, partnerBadge } from '../../lib/partners';
import { DEMO_PARTNERS, PARTNERS } from '../../data/partners';
import { milesBetween } from '../../lib/geo';
import { rememberMapView } from '../../lib/lastView';
import { answerProblem, confirmations, KIND_INFO, reportAge, sourceCredit, type RoadReport, type RoadVote } from '../../lib/roadReports';
import { useRoadReports, useRoads } from '../../lib/roadStore';
import { usePostPins } from '../../lib/communityStore';
import { shortAgo } from '../../lib/format';
import { LOCATION, openPlaceLabel, PLACE_NAMES, roleLabel } from '../../lib/glossary';
import { clearJustOnboarded, justOnboarded } from '../../lib/firstRun';
import { ALL_LAYERS, DRIVE_ONLY_LAYERS, layerOn, toggleLayer as toggledLayer, type Layer } from '../../lib/mapLayers';
import { ART, C, COLOR, ELEVATION, EVENT_COLOURS, LAYER, PARTNER_COLOUR, POST_COLOUR, RADII, ROAD_COLOUR, SHOP_COLOUR, SPACING, SPOT_COLOURS } from '../../theme';


/** What the card at the bottom shows for the tapped pin. Cameras have nothing to open. */
interface Selection {
  title: string;
  glyph: Glyph;
  meta: string;
  body: string;
  colour: string;
  open?: () => void;
  cta?: string;
  /** Buttons on the card (road reports: Still there / Gone). */
  actions?: { label: string; onPress: () => void }[];
  /** A short line under the body, e.g. why you can't answer from here. */
  note?: string;
}

/** Count pins (places grouped when zoomed out): what each one is. */
const CLUSTER_NAMES: Record<SpotKind, string> = { drive: 'drives', photo: 'photo spots', track: 'tracks', venue: 'meet spots' };
/** Cameras with no recorded limit: dimmer than the rest, but still 4:1 on the dark map. */
const CAMERA_DIM = ART.cameraDim;

/** The map key ("Key" button): what each pin means. Events are filled, places outlined. */
const KEY_ROWS: { glyph: Glyph; colour: string; label: string }[] = [
  { glyph: 'meet', colour: EVENT_COLOURS.meet, label: 'Meet, cruise or rolling meet' },
  { glyph: 'show', colour: EVENT_COLOURS.show, label: 'Show' },
  { glyph: 'trackday', colour: EVENT_COLOURS.trackday, label: 'Track day' },
  { glyph: 'locked', colour: EVENT_COLOURS.meet, label: `Event, ${LOCATION.hidden}` },
  { glyph: 'drive', colour: SPOT_COLOURS.drive, label: 'Drive' },
  { glyph: 'photo', colour: SPOT_COLOURS.photo, label: 'Photo spot' },
  { glyph: 'track', colour: SPOT_COLOURS.track, label: 'Track' },
  { glyph: 'venue', colour: SPOT_COLOURS.venue, label: `${PLACE_NAMES.venue.one} (café, museum)` },
  { glyph: 'shop', colour: SHOP_COLOUR, label: 'Shop (OpenStreetMap)' },
  { glyph: 'partner', colour: PARTNER_COLOUR, label: 'Partner (paid, always marked)' },
  { glyph: 'area', colour: C.chalk, label: 'A group of places (zoomed out): tap to zoom in' },
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

/**
 * Tonight (docs/SPEC.md): what's on near you tonight, on a map or as a list.
 * The header has the one search, the Map / List switch, the + (host an event,
 * suggest a place) and the bell. The map keeps the bottom sheet from
 * MAP-REDESIGN.md; the list shows your events, live now, tonight and this week.
 */
export default function TonightScreen() {
  const insets = useSafeAreaInsets();
  const store = useStore();
  const { events, me, crews, users, builds, spots, settings, setSettings } = store;
  const now = useNow();
  // Every layer is saved in settings, the core ones too (mapLayers.ts), so they come back as left.
  const layersKey = [settings.mapLayers, settings.cameras, settings.shops, settings.roadReports, settings.postsLayer];
  const layers = useMemo(
    // Speed cameras and road reports are for the drive view only (REVIEW-9 decision 13): never on Tonight.
    () => Object.fromEntries(ALL_LAYERS.map((k) => [k, !DRIVE_ONLY_LAYERS.includes(k) && layerOn(settings, k)])) as Record<Layer, boolean>,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    layersKey,
  );
  const shown = ALL_LAYERS.map((k) => (layers[k] ? 1 : 0)).join('');
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
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  /** "Show everything": where to move the map, and a counter so the same button works twice. */
  const [view, setView] = useState<{ centre: LatLng; span: number; key: number } | null>(null);
  const meUser = users.find((u) => u.id === me);
  /** Where the map is looking, for the layers that only show when zoomed in (cameras, circuit outlines). */
  const [region, setRegionNow] = useState<MapRegion>({ centre: meUser?.home ?? START, span: START_SPAN });
  // Pans and zooms settle a moment before the pins are worked out again, so a burst of region updates costs one pass.
  const regionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const setRegion = useCallback((r: MapRegion) => {
    rememberMapView(r.centre);
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
      if (!selectedRef.current) map.current?.animateTo(pos.at, 0.35);
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
  /** Community posts with a place (the Posts layer, off by default). */
  const postPins = usePostPins(region.centre, region.span, layers.posts);
  async function answerReport(r: RoadReport, vote: RoadVote) {
    feel.select();
    setRoadNote(null);
    try {
      await roads.answer(r.id, vote, here);
      feel.success();
      setRoadNote({ id: r.id, text: vote === 'still_there' ? 'Thanks. Marked as still there.' : 'Thanks. Marked as gone.' });
    } catch (e) {
      setRoadNote({ id: r.id, text: e instanceof Error ? e.message : "Couldn't send that." });
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
    const sel = selected?.startsWith('sp:') ? selected.slice(3) : null;
    // A place picked in search shows even when its layer is off.
    const shownPlaces = places.filter((s) => layers[s.kind] || (s.kind === 'venue' && venuesViaShops) || s.id === sel);
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
    for (const p of postPins) pins.push({ id: `post:${p.id}`, at: p.at, glyph: 'post', colour: POST_COLOUR, title: p.placeName ?? 'Post', size: 30 });
    for (const r of roadReports) {
      if (r.path) paths.push({ id: `rrp:${r.id}`, coords: r.path, colour: ROAD_COLOUR, width: 4 });
      pins.push({ id: `rr:${r.id}`, at: r.at, glyph: r.kind, colour: ROAD_COLOUR, title: KIND_INFO[r.kind].label, size: 30 });
    }
    if (layers.track) {
      for (const { id, outline } of outlinesInView(places, region.centre, region.span))
        paths.push({ id: `ol:${id}`, coords: outline.path, colour: SPOT_COLOURS.track, width: 3 });
    }
    if (layers.events) {
      // Only the events in (or near) the view: off-screen markers still cost a live view each on iPhone.
      const selEvent = selected?.startsWith('ev:') ? selected.slice(3) : null;
      const inView = inViewOnly(
        views,
        (v) => (v.shownStop >= 0 ? (v.event.type === 'cruise' ? v.event.stops.map((x) => x.at) : [v.event.stops[v.shownStop].at ?? v.event.area]) : [v.event.area]),
        snapped.centre,
        snapped.span,
        (v) => v.event.id === selEvent,
      );
      for (const v of inView) {
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
          const what = v.role === 'requested' ? `requested, ${LOCATION.hidden}` : LOCATION.hidden;
          pins.push({ id: `ev:${e.id}`, at: e.area, glyph: 'locked', colour, title: `${e.title} (${what})`, size: 34 });
        }
      }
    }
    for (const s of placeView.places) {
      const colour = s.status === 'pending' ? C.fog : SPOT_COLOURS[s.kind];
      pins.push({ id: `sp:${s.id}`, at: s.at, glyph: s.kind, colour, title: s.name, size: 32 });
    }
    for (const c of placeView.clusters)
      pins.push(
        c.mixed
          ? { id: c.id, at: c.at, glyph: 'area', colour: C.chalk, title: 'places', size: 36, count: c.count }
          : { id: c.id, at: c.at, glyph: c.kind, colour: SPOT_COLOURS[c.kind], title: CLUSTER_NAMES[c.kind], size: 32, count: c.count },
      );
    for (const s of placeView.lines) {
      const colour = s.status === 'pending' ? C.fog : SPOT_COLOURS[s.kind];
      paths.push({ id: `pa:${s.id}`, coords: s.path!, colour, dashed: s.status === 'pending' });
    }
    return { pins: orderPins(pins), paths, circles, polygons };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [views, shown, placeView, cams, region.span, shopView, roadReports, postPins, snapped.key, selected]);

  /** A count pin: zoom in on it. */
  function zoomCluster(id: string) {
    const c = placeView.clusters.find((x) => x.id === id);
    if (!c) return;
    feel.select();
    setView((x) => ({ centre: c.zoomCentre, span: c.zoomSpan, key: (x?.key ?? 0) + 1 }));
  }
  const zoomClusterRef = useRef(zoomCluster);
  zoomClusterRef.current = zoomCluster;

  const sel = selected ? describeSelection(selected) : null;

  function describeSelection(id: string): Selection | null {
    const kind = id.slice(0, id.indexOf(':'));
    const key = id.slice(id.indexOf(':') + 1);
    if (kind === 'cam' || kind === 'avg') {
      const pin = pins.find((p) => p.id === id);
      if (!pin) return null;
      const [what, ...rest] = pin.title.split(' · ');
      return { title: what, glyph: pin.glyph, meta: rest.join(' · '), body: `${CAMERA_CAVEAT}\n${CAMERA_CREDIT}.`, colour: LAYER.camera };
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
        glyph: r.kind,
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
                { label: 'Still there', onPress: () => answerReport(r, 'still_there') },
                { label: 'Gone', onPress: () => answerReport(r, 'gone') },
              ],
            }
          : {}),
      };
    }
    if (kind === 'post') {
      const p = postPins.find((x) => x.id === key);
      if (!p) return null;
      const who = users.find((u) => u.id === p.authorId);
      return {
        title: p.placeName ?? 'Post',
        glyph: 'post',
        meta: [who ? `@${who.handle}` : null, shortAgo(p.createdAt, now)].filter(Boolean).join(' · '),
        body: 'A Community post with a place.',
        colour: POST_COLOUR,
        open: () => router.push({ pathname: '/post/[id]', params: { id: p.id } }),
        cta: 'Open post',
      };
    }
    if (kind === 'shop') {
      const s = shopIdx?.find(key);
      if (!s) return null;
      const hours = parseOpeningHours(s.hours);
      return {
        title: s.name,
        glyph: s.categories[0] ?? 'shop',
        meta: [describeCategories(s.categories), hours ? openState(hours, now).label : null].filter(Boolean).join(' · '),
        body: `${s.brand ? `${s.brand}. ` : ''}Listing from OpenStreetMap, not a Nightshift partner.`,
        colour: SHOP_COLOUR,
        open: () => router.push({ pathname: '/shop/[id]', params: { id: s.id } }),
        cta: 'Open shop',
      };
    }
    if (kind === 'ptn') {
      const p = partners.find((x) => x.id === key);
      if (!p) return null;
      const hours = parseOpeningHours(p.hours);
      return {
        title: p.name,
        glyph: 'partner',
        meta: [partnerBadge(p), describeCategories(p.categories), hours ? openState(hours, now).label : null].filter(Boolean).join(' · '),
        body: [p.offer, p.demo ? 'Made-up business for the demo.' : null].filter(Boolean).join('\n') || (p.description ?? ''),
        colour: PARTNER_COLOUR,
        open: () => router.push({ pathname: '/shop/[id]', params: { id: `partner:${p.id}` } }),
        cta: 'Open partner',
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
            ? `${e.areaName} · ${LOCATION.hidden} · requested, waiting for a host`
            : `${e.areaName} · ${LOCATION.hidden}`;
      const clock = eventClock(v, now);
      return {
        title: e.title,
        glyph: v.shownStop >= 0 ? e.type : 'locked',
        meta: [EVENT_LABELS[e.type], roleLabel(v.role, e.filter), `${clock.label} ${clock.value}`, `${e.going.length} going`].filter(Boolean).join(' · '),
        body: `${place}\n${describeFilter(e.filter)}`,
        colour: EVENT_COLOURS[e.type],
        open: () => router.push({ pathname: '/event/[id]', params: { id: e.id } }),
        cta: 'Open event',
      };
    }
    const s = places.find((x) => x.id === key);
    if (!s) return null;
    const { average, count } = averageStars(s);
    const stars = count > 0 ? ` · ★ ${average.toFixed(1)}` : '';
    const status = s.status === 'pending' ? ' · waiting for approval' : '';
    return {
      title: s.name,
      glyph: s.kind,
      meta:
        (s.kind === 'drive' ? `${PLACE_NAMES.drive.one} · ${s.miles} mi · ${driveTier(s.miles).label} · +${driveTier(s.miles).rep} rep · untimed` : PLACE_NAMES[s.kind].one) +
        (s.region ? ` · ${s.region}` : '') + stars + status,
      body: s.description,
      colour: SPOT_COLOURS[s.kind],
      open: () => router.push({ pathname: '/spot/[id]', params: { id: s.id } }),
      cta: openPlaceLabel(s.kind).replace(/\s*›$/, ''),
    };
  }

  /** One short line under the bar: what to zoom in for, or the OpenStreetMap credit. */
  const openDataCredit = Array.from(new Set(roadReports.filter((r) => r.source !== 'user').map((r) => sourceCredit(r)).filter(Boolean))).join(' · ');
  const mapNote = (() => {
    const zoom = [cams?.tooWide && camerasAsked ? 'cameras' : null, shopView?.tooWide ? 'shops' : null].filter(Boolean);
    if (shopView?.loading) return { zoom: true, text: shopsFailed ? "Couldn't load shops" : 'Loading shops…' };
    if (zoom.length) return { zoom: true, text: `Zoom in to see ${zoom.join(' and ')}` };
    if (shopView && shopFilter.partnersOnly) return { zoom: false, text: `Partners only · ${shopView.partners.length} here` };
    const more = shopView?.more ? ' · nearest shops shown' : '';
    const closures = openDataCredit ? ` · closures: ${openDataCredit}` : '';
    return { zoom: false, text: `© OpenStreetMap${cams && !cams.tooWide ? ' · cameras may be incomplete' : ''}${more}${closures}` };
  })();
  const hud = useMemo(() => mapHud(views, now), [views, now]);
  /** Near me: what's near you that you can open (events and places on the shown layers), the nearest 60 to home. */
  function nearMe() {
    feel.tap();
    const from = here ?? meUser?.home ?? region.centre;
    const shownPlaces = places.filter((s) => layers[s.kind] || (s.kind === 'venue' && venuesViaShops)).map((s) => s.at);
    const evs = layers.events ? views.map((v) => (v.shownStop >= 0 ? v.event.stops[v.shownStop].at : v.event.area)).filter((p): p is LatLng => !!p) : [];
    const r = fitRegion(nearestPoints([...evs, ...shownPlaces], from, 60));
    if (r) setView((v) => ({ ...r, key: (v?.key ?? 0) + 1 }));
  }
  const toast = useToast();

  // ---------------------------------------------------------------------------
  // Map or list, and the first-run highlight.
  // ---------------------------------------------------------------------------
  const params = useLocalSearchParams<{ focus?: string; t?: string; view?: string }>();
  const [mode, setMode] = useState<'map' | 'list'>(params.view === 'list' ? 'list' : 'map');
  useEffect(() => {
    if (params.view === 'list' || params.view === 'map') setMode(params.view);
  }, [params.view, params.t]);
  const [plusOpen, setPlusOpen] = useState(false);
  /** Welcome's last step: "here's what's on, say you're going with the car you just added". Once. */
  const [intro, setIntroState] = useState(() => justOnboarded());
  const setIntro = (x: null) => {
    clearJustOnboarded();
    setIntroState(x);
  };
  const myBuilds = builds.filter((b) => b.ownerId === me);
  const introBuild = myBuilds.find((b) => b.id === intro?.buildId) ?? myBuilds[myBuilds.length - 1];
  /** The pick for a first-timer: a plain meet open for check-in now, else live now, else the soonest, that you can go to. */
  const pick = useMemo(() => {
    if (!intro) return null;
    const t = now.getTime();
    const open = views.filter((v) => (v.role === 'invited' || v.role === 'public' || v.role === 'going') && new Date(v.event.startsAt).getTime() < t + 24 * 3_600_000);
    const checkInNow = open.filter((v) => checkInWindowOpen(v.event, now));
    return (
      checkInNow.find((v) => v.event.type === 'meet') ??
      checkInNow[0] ??
      open.find((v) => v.phase === 'live') ??
      open.sort((a, b) => a.event.startsAt.localeCompare(b.event.startsAt))[0] ??
      null
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intro, views]);
  const [joining, setJoining] = useState(false);
  async function goWithMyCar(v: EventView) {
    setJoining(true);
    try {
      const res = await store.setGoing(v.event.id, true, introBuild?.id);
      setIntro(null);
      toast({
        message:
          res === 'requested'
            ? 'Asked the host. You’ll hear when they say yes.'
            : introBuild
              ? `You’re going in your ${introBuild.make} ${introBuild.model}. Check in when you get there.`
              : 'You’re going. Check in when you get there.',
      });
      router.push({ pathname: '/event/[id]', params: { id: v.event.id } });
    } catch (e) {
      toast({ message: e instanceof Error ? e.message : "Couldn't do that just now.", tone: 'danger' });
    } finally {
      setJoining(false);
    }
  }
  const openEvent = (id: string) => router.push({ pathname: '/event/[id]', params: { id } });

  // ---------------------------------------------------------------------------
  // The sheet (MAP-REDESIGN.md): Tonight near you, or the selected pin.
  // ---------------------------------------------------------------------------
  const [box, setBox] = useState({ w: screen.width, h: 0 });
  const [detent, setDetent] = useState<Detent>('peek');
  const [headerH, setHeaderH] = useState(120);
  const sheetY = useSharedValue(screen.height);
  const sheetTop = SPACING.sm;
  // Lowered, the sheet never takes more than about 40% of the screen, and never reaches the map's
  // buttons (REVIEW-10 decision 8). 176 is the button stack's height before it has been measured.
  const peekCap = Math.max(120, Math.round(Math.min(screen.height * 0.4, (box.h || screen.height) - 176 - SPACING.lg)));
  const tops = detentTops(box.h, Math.min(headerH, peekCap), sheetTop);
  // A location note: open the sheet so it's read.
  useEffect(() => {
    if (locNote) setDetent((d) => (d === 'peek' ? 'half' : d));
  }, [locNote]);

  /** Where an event or place is on the map (an event's shown stop, or its rough area). */
  const where = useCallback(
    (id: string): LatLng | null => {
      const key = id.slice(id.indexOf(':') + 1);
      if (id.startsWith('ev:')) {
        const v = views.find((x) => x.event.id === key);
        if (!v) return null;
        return v.shownStop >= 0 ? v.event.stops[v.shownStop].at ?? v.event.area : v.event.area;
      }
      if (id.startsWith('sp:')) return places.find((x) => x.id === key)?.at ?? null;
      return pins.find((p) => p.id === id)?.at ?? null;
    },
    [views, places, pins],
  );
  /**
   * Select something: its card opens in the sheet (lowered, hugging the card), and the map moves so
   * the pin sits in the top third, clear of the sheet. A pin tapped on the map only moves if the sheet would hide it.
   */
  function show(id: string, zoom = true, onlyIfHidden = false) {
    feel.select();
    setMode('map');
    setSelected(id);
    setDetent('peek');
    const at = where(id);
    if (!at) return;
    const fromTop = (region.centre.lat + region.span / 2 - at.lat) / region.span;
    if (onlyIfHidden && fromTop > 0.12 && fromTop < 0.5) return;
    const span = zoom ? Math.min(region.span, 0.35) : region.span;
    setView((x) => ({ centre: { lat: at.lat - span * 0.2, lng: at.lng }, span, key: (x?.key ?? 0) + 1 }));
  }
  const showRef = useRef(show);
  showRef.current = show;
  // Search and "Show on map" send people here with what they picked: `focus` is a pin id ("ev:…" or "sp:…").
  useEffect(() => {
    if (params.focus && ready) showRef.current(params.focus);
  }, [params.focus, params.t, ready]);

  const onSelectPin2 = useCallback((id: string) => {
    if (id.startsWith('cl:')) zoomClusterRef.current(id);
    else showRef.current(id, false, true);
  }, []);
  const close = useCallback(() => {
    setSelected(null);
    setDetent('peek');
  }, []);
  const onMapPress = useCallback(() => {
    if (selectedRef.current) close();
  }, [close]);

  /**
   * One set of events everywhere (REVIEW-9 decision 2): live now, tonight (to 5am), this week, then later.
   * The map shows the same events as pins; Search and the bell find the same ones.
   */
  const origin = here ?? meUser?.home ?? region.centre;
  /** Every distance on Tonight is from you (a GPS fix) or else from home, and says which. */
  const milesFrom = here ? ' from you' : ' from home';
  const lists = useMemo(() => {
    const tonightEnd = windowFor('tonight', now)!.to.getTime();
    const weekEnd = now.getTime() + 7 * 86_400_000;
    const start = (v: EventView) => new Date(v.event.startsAt).getTime();
    const upcoming = views.filter((v) => v.phase !== 'live').sort((a, b) => start(a) - start(b));
    return {
      live: hud.live,
      tonight: upcoming.filter((v) => start(v) < tonightEnd),
      week: upcoming.filter((v) => start(v) >= tonightEnd && start(v) <= weekEnd),
      later: upcoming.filter((v) => start(v) > weekEnd),
    };
  }, [views, now, hud.live]);
  /** The sheet's lead row is only ever something on today (REVIEW-9: "Today near you" over a track day 9 days away). */
  const todayLead = lists.live[0] ?? lists.tonight[0] ?? null;
  const tonightCount = lists.live.length + lists.tonight.length;
  const comingUp = lists.week.length + lists.later.length;
  const nearPlaces = useMemo(() => {
    const shownPlaces = places.filter((s) => s.status !== 'pending' && (layers[s.kind] || (s.kind === 'venue' && venuesViaShops)));
    return shownPlaces
      .map((s) => ({ s, miles: milesBetween(snapped.centre, s.at) }))
      .sort((a, b) => a.miles - b.miles)
      .slice(0, 3);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [places, shown, venuesViaShops, snapped.key]);
  const milesTo = (v: EventView) => {
    const at = v.shownStop >= 0 ? v.event.stops[v.shownStop].at ?? v.event.area : v.event.area;
    return milesBetween(origin, at);
  };
  const nothingOn = ready && !todayLead && comingUp === 0;
  /** No car or bike yet: meets open to anyone show; add one to see the invites that need a car. */
  const noCar = ready && myBuilds.length === 0;

  // The map's buttons and notes ride just above the sheet, up to half; they fade out as it opens fully.
  const [stackH, setStackH] = useState(176);
  const [noteH, setNoteH] = useState(30);
  const ride = (y: number, h: number) => {
    'worklet';
    const yy = Math.min(y, tops.peek);
    const lift = Math.max(SPACING.sm, yy - h - SPACING.md);
    const fade = Math.min(1, Math.max(0, (yy - (tops.full + 60)) / Math.max(1, tops.half - tops.full - 60)));
    return { transform: [{ translateY: lift }], opacity: fade };
  };
  const stackStyle = useAnimatedStyle(() => ride(sheetY.value, stackH));
  const noteStyle = useAnimatedStyle(() => ride(sheetY.value, noteH));
  const chromeLive = detent !== 'full';
  // Anything on besides Events lights the layers button.
  const moreOn = ALL_LAYERS.filter((k) => k !== 'events' && layers[k]).length;
  const [showLayers, setShowLayers] = useState(false);
  const showNote = (cams && (!cams.tooWide || camerasAsked)) || shopView || openDataCredit;

  /** The first-run card: tonight's pick and "I'm going" with the car you just added (or add one first). */
  const introLine = introBuild ? `Say you're going, with your ${introBuild.make} ${introBuild.model}. Then check in when you get there.` : 'Open to anyone. Say you’re going, then check in when you get there.';
  const introCard =
    intro && pick ? (
      <View style={st.intro} accessibilityLiveRegion="polite">
        <DsText v="eyebrow" tone="action" accessibilityRole="header">
          Start here
        </DsText>
        <DsText v="secondary">{introLine}</DsText>
        <EventEntityCard view={pick} now={now} miles={milesTo(pick)} milesFrom={milesFrom} onPress={() => openEvent(pick.event.id)} />
        <Button label="I'm going" size="lg" block busy={joining} haptic="success" onPress={() => goWithMyCar(pick)} />
        <Button label="Not now" tier="tertiary" size="sm" onPress={() => setIntro(null)} style={{ alignSelf: 'center' }} />
      </View>
    ) : null;
  /**
   * The same pick, compact, as the map sheet's lowered header (REVIEW-10 decision 8: on an SE the
   * full card took three quarters of the screen and covered the map buttons).
   */
  const introHeader =
    intro && pick ? (
      <View style={st.intro} accessibilityLiveRegion="polite">
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 32 }}>
          <DsText v="eyebrow" tone="action" accessibilityRole="header">
            Start here
          </DsText>
          <Button label="Not now" tier="tertiary" size="sm" onPress={() => setIntro(null)} />
        </View>
        <LeadRow lead={pick} now={now} miles={milesTo(pick)} onPress={() => openEvent(pick.event.id)} />
        <Button label="I'm going" block busy={joining} haptic="success" onPress={() => goWithMyCar(pick)} accessibilityHint={introLine} />
      </View>
    ) : null;

  const addCarCard = noCar ? (
    <Card>
      <DsText v="title">Add your car to see more</DsText>
      <DsText v="secondary">These are the meets open to anyone. Add your car or bike to see the ones invited by make, class or mods.</DsText>
      <Button label="Add a car or bike" tier="secondary" block onPress={() => router.push('/build/edit')} />
    </Card>
  ) : null;

  const pickSkip = introCard && pick ? [pick] : [];
  const listBody = (
    <ScrollView contentContainerStyle={st.list} keyboardShouldPersistTaps="handled">
      {introCard}
      {!todayLead && !nothingOn ? <EmptyState variant="inline" title="Nothing on near you tonight. Here's what's coming up." /> : null}
      <EventSection title="Live now" list={lists.live} skip={pickSkip} now={now} milesTo={milesTo} milesFrom={milesFrom} onOpen={openEvent} />
      <EventSection title={laterLabel(now)} list={lists.tonight} skip={pickSkip} now={now} milesTo={milesTo} milesFrom={milesFrom} onOpen={openEvent} />
      {addCarCard}
      <EventSection title="This week" list={lists.week} skip={pickSkip} now={now} milesTo={milesTo} milesFrom={milesFrom} onOpen={openEvent} />
      <EventSection title="Later" list={lists.later} skip={pickSkip} now={now} milesTo={milesTo} milesFrom={milesFrom} onOpen={openEvent} />
      {nothingOn ? <EmptyState variant="inline" title="Nothing on near you yet." action={{ label: 'Host one', onPress: () => router.push('/event/new') }} /> : null}
    </ScrollView>
  );

  return (
    <View style={{ flex: 1, backgroundColor: COLOR.surface.bg }}>
      {/* The header: title, + (host or suggest), the bell; then the one search and Map / List. */}
      <View style={[st.top, { paddingTop: insets.top }]}>
        <ScreenHeader title="Tonight" bell action={{ label: '+ New', accessibilityLabel: 'Host an event or suggest a place', onPress: () => setPlusOpen(true) }} />
        <View style={st.searchRow}>
          <View style={{ flex: 1 }}>
            <SearchField onOpen={() => router.push('/search')} placeholder="Search" accessibilityLabel="Search events, places, people and addresses" />
          </View>
          <View style={{ width: 132 }}>
            <SegmentedControl
              accessibilityLabel="Show as"
              value={mode}
              onChange={(m) => {
                setMode(m);
                if (m === 'list') close();
              }}
              options={[
                { key: 'map', label: 'Map' },
                { key: 'list', label: 'List' },
              ]}
            />
          </View>
        </View>
      </View>

      {mode === 'list' ? (
        listBody
      ) : (
        <View style={{ flex: 1, overflow: 'hidden' }} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
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
            onSelect={onSelectPin2}
            onPressMap={onMapPress}
            showsUser={located}
            compass={COMPASS}
          />

          {/* Left, above the sheet: what to zoom in for, or the OpenStreetMap credit. */}
          {showNote && box.h ? (
            <Animated.View style={[st.note, { maxWidth: box.w - SPACING.lg - BUTTON - SPACING.xl }, noteStyle]} pointerEvents="none" onLayout={(e) => setNoteH(e.nativeEvent.layout.height)}>
              {/* The credit uses the map credit's own face everywhere (NightMap's chip), not body text (REVIEW-7 inconsistency 11). */}
              <DsText v={mapNote.zoom ? 'caption' : 'meta'} tone={mapNote.zoom ? 'primary' : 'secondary'} numberOfLines={2}>
                {mapNote.text}
              </DsText>
            </Animated.View>
          ) : null}

          {/* Right, above the sheet: layers, locate me, near me. */}
          {box.h ? (
            <Animated.View style={[st.stack, stackStyle]} pointerEvents={chromeLive ? 'box-none' : 'none'} onLayout={(e) => setStackH(e.nativeEvent.layout.height)}>
              {/* Room for one small map widget (e.g. a speed readout). See MapWidgetSlot. */}
              <MapWidgetSlot />
              <View style={st.stackGroup}>
                <MapButton onPress={() => setShowLayers(true)} label={`Map layers and key${moreOn > 0 ? `, ${moreOn} extra on` : ''}`} lit={moreOn > 0}>
                  <LayersIcon colour={moreOn > 0 ? COLOR.text.primary : COLOR.text.secondary} />
                </MapButton>
                <View style={st.stackRule} />
                <MapButton onPress={() => locate(true, true)} label="Show where I am">
                  <Pin glyph="you" colour={located ? COLOR.text.primary : COLOR.text.secondary} size={26} />
                </MapButton>
                <View style={st.stackRule} />
                <MapButton onPress={nearMe} label="Near me: fit what's around you">
                  <NearIcon colour={COLOR.text.primary} />
                </MapButton>
              </View>
            </Animated.View>
          ) : null}

          {box.h ? (
            <MapSheet
              y={sheetY}
              height={box.h}
              top={sheetTop}
              peek={Math.min(headerH, peekCap)}
              detent={detent}
              onDetent={setDetent}
              label={sel ? sel.title : `${dayWord(now)} near you`}
              onHeaderLayout={setHeaderH}
              header={
                sel ? (
                  <View style={st.header}>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md }}>
                      <View aria-hidden>
                        <Pin glyph={sel.glyph} colour={sel.colour} size={36} />
                      </View>
                      <View style={{ flex: 1, gap: SPACING.xxs }}>
                        <DsText v="title" numberOfLines={2} accessibilityRole="header">
                          {sel.title}
                        </DsText>
                        <DsText v="meta" numberOfLines={2}>
                          {sel.meta}
                        </DsText>
                      </View>
                      <IconButton icon="close" label="Close" onPress={close} />
                    </View>
                    {sel.body ? (
                      <DsText v="secondary" numberOfLines={detent === 'peek' ? 3 : undefined}>
                        {sel.body}
                      </DsText>
                    ) : null}
                    {sel.note ? <DsText v="secondary" tone="primary">{sel.note}</DsText> : null}
                    {sel.actions ? (
                      <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                        {sel.actions.map((a) => (
                          <Button key={a.label} label={a.label} tier="secondary" onPress={a.onPress} style={{ flex: 1 }} block />
                        ))}
                      </View>
                    ) : null}
                    {sel.open ? <Button label={sel.cta ?? 'Open'} onPress={sel.open} block /> : null}
                  </View>
                ) : introHeader ? (
                  // First run: the pick and "I'm going" are the sheet's header, so they show lowered too.
                  <View style={st.header}>{introHeader}</View>
                ) : (
                  <View style={st.header}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 24 }}>
                      <DsText v="eyebrow" tone="action" accessibilityRole="header">
                        {`${dayWord(now)} near you`}
                      </DsText>
                      {/* REVIEW-10 decision 8: never "2 today" over a list of one. The rest are one tap up. */}
                      {todayLead && tonightCount > 1 ? (
                        <Button label={`${tonightCount - 1} more ${dayWord(now).toLowerCase()}`} tier="tertiary" size="sm" onPress={() => setDetent('half')} accessibilityLabel={`Show ${tonightCount - 1} more on ${dayWord(now).toLowerCase()}`} />
                      ) : null}
                    </View>
                    {todayLead ? (
                      <LeadRow lead={todayLead} now={now} miles={milesTo(todayLead)} onPress={() => show(`ev:${todayLead.event.id}`)} />
                    ) : ready ? (
                      <EmptyState
                        variant="inline"
                        title={`Nothing on near you ${dayWord(now).toLowerCase()}.`}
                        action={
                          comingUp > 0
                            ? { label: `See what's coming up (${comingUp})`, onPress: () => setMode('list') }
                            : { label: 'Host one', onPress: () => router.push('/event/new') }
                        }
                      />
                    ) : null}
                  </View>
                )
              }
            >
              {sel ? null : (
                <>
                  {locNote ? (
                    <View style={st.notice} accessibilityLiveRegion="polite">
                      <DsText v="secondary" tone="primary">{locNote}</DsText>
                      <View style={{ flexDirection: 'row', gap: SPACING.md }}>
                        {Platform.OS !== 'web' ? <Button label="Open Settings" tier="tertiary" size="sm" onPress={() => Linking.openSettings().catch(() => {})} /> : null}
                        <Button label="Dismiss" tier="tertiary" size="sm" onPress={() => setLocNote(null)} />
                      </View>
                    </View>
                  ) : null}
                  {/* The live meet shows once: as the lead (or the Start here pick), not again in the list (REVIEW-9). */}
                  <EventSection title="Live now" list={lists.live} skip={introCard && pick ? [pick] : todayLead ? [todayLead] : []} now={now} milesTo={milesTo} milesFrom={milesFrom} onOpen={(id) => show(`ev:${id}`)} />
                  <EventSection title={laterLabel(now)} list={lists.tonight} skip={introCard && pick ? [pick] : todayLead ? [todayLead] : []} now={now} milesTo={milesTo} milesFrom={milesFrom} onOpen={(id) => show(`ev:${id}`)} />
                  {addCarCard}
                  <EventSection
                    title="This week"
                    list={lists.week.slice(0, 6)}
                    skip={[]}
                    now={now}
                    milesTo={milesTo} milesFrom={milesFrom}
                    onOpen={(id) => show(`ev:${id}`)}
                    right={lists.week.length > 6 ? <Button label="All" tier="tertiary" size="sm" onPress={() => setMode('list')} accessibilityLabel="See every event as a list" /> : undefined}
                  />
                  <EventSection
                    title="Later"
                    list={lists.later.slice(0, 4)}
                    skip={[]}
                    now={now}
                    milesTo={milesTo} milesFrom={milesFrom}
                    onOpen={(id) => show(`ev:${id}`)}
                    right={lists.later.length > 4 ? <Button label="All" tier="tertiary" size="sm" onPress={() => setMode('list')} accessibilityLabel="See every event as a list" /> : undefined}
                  />
                  {nothingOn ? <DsText v="secondary">Nothing coming up near you. Host one for your mates with the + at the top.</DsText> : null}
                  {nearPlaces.length ? (
                    <Section title="Places on the map">
                      {nearPlaces.map(({ s }) => (
                        <PlaceEntityCard key={s.id} spot={s} miles={milesBetween(origin, s.at)} milesFrom={milesFrom} onPress={() => show(`sp:${s.id}`, false)} />
                      ))}
                    </Section>
                  ) : null}
                </>
              )}
            </MapSheet>
          ) : null}
        </View>
      )}

      {/* The one + : host an event, or suggest a place. */}
      <Sheet visible={plusOpen} title="New" onClose={() => setPlusOpen(false)}>
        <SheetOption
          label="Host an event"
          detail="A meet, cruise, rolling meet, show or track day. You choose who's invited."
          onPress={() => {
            setPlusOpen(false);
            router.push('/event/new');
          }}
        />
        <SheetOption
          label="Suggest a place"
          detail="A drive or photo spot. It's checked before it goes on the map."
          onPress={() => {
            setPlusOpen(false);
            router.push('/spot/new');
          }}
        />
        <SheetOption
          label="Sell or find a part"
          detail="A For sale and wanted listing on the forum. Posts only: no payments through Nightshift."
          onPress={() => {
            setPlusOpen(false);
            router.push({ pathname: '/forum/new', params: { board: 'for_sale' } });
          }}
        />
      </Sheet>

      <LayersPanel
        visible={showLayers}
        onClose={() => setShowLayers(false)}
        on={layers}
        onToggle={toggleLayer}
        hidden={hasVenues ? [] : ['venue']}
        trackKinds={trackKinds}
        onTrackKind={toggleKind}
        watchRacing={watchRacing}
        onWatchRacing={() => {
          feel.select();
          setSettings({ spectatorTracks: !watchRacing });
        }}
        shopCategories={shopFilter.categories}
        onShopCategory={toggleShopCategory}
        onAllShops={() => {
          feel.select();
          setSettings({ shopCategories: [...ALL_CATEGORIES] });
        }}
        partnersOnly={shopFilter.partnersOnly}
        onPartnersOnly={() => {
          feel.select();
          setSettings({ shopPartnersOnly: !shopFilter.partnersOnly });
        }}
        keyRows={KEY_ROWS}
      />
    </View>
  );
}

/** Map buttons: big enough for a thumb (48 pt). */
const BUTTON = 48;
/** Where the map's compass sits. One object for the module: a new one each render would re-render the memoised map. */
const COMPASS = { x: -2, y: SPACING.md };

function MapButton({ onPress, label, lit, children }: { onPress: () => void; label: string; lit?: boolean; children: ReactNode }) {
  return (
    <Press onPress={onPress} haptic="tap" label={label} style={[st.mapButton, lit && { backgroundColor: COLOR.surface.raised }]}>
      {children}
    </Press>
  );
}

/** A titled run of event cards, without the ones already shown elsewhere. Nothing at all when it's empty. */
/** The next-12-hours list says "Later today" in the daytime and "Tonight" from 5 pm (REVIEW-7 bug 9). */
function laterLabel(now: Date): string {
  const h = now.getHours();
  return h >= 5 && h < 17 ? 'Later today' : 'Tonight';
}

/** "Today" in the day, "Tonight" from 5 pm (REVIEW-8: "Tonight near you" over a 09:35 meet). The tab keeps its name. */
function dayWord(now: Date): string {
  const h = now.getHours();
  return h >= 5 && h < 17 ? 'Today' : 'Tonight';
}

function EventSection({
  title,
  list,
  skip,
  now,
  milesTo,
  milesFrom,
  onOpen,
  right,
}: {
  title: string;
  list: EventView[];
  skip: EventView[];
  now: Date;
  milesTo: (v: EventView) => number;
  milesFrom: string;
  onOpen: (eventId: string) => void;
  right?: ReactNode;
}) {
  const shown = list.filter((v) => !skip.some((x) => x.event.id === v.event.id));
  if (!shown.length) return null;
  return (
    <Section title={title} right={right}>
      {shown.map((v) => (
        <EventEntityCard key={v.event.id} view={v} now={now} miles={milesTo(v)} milesFrom={milesFrom} onPress={() => onOpen(v.event.id)} />
      ))}
    </Section>
  );
}

/** The sheet's peek: what's live now, or the next thing, in one row with its countdown. */
function LeadRow({ lead, now, miles, onPress }: { lead: EventView; now: Date; miles: number; onPress: () => void }) {
  const e = lead.event;
  const clock = eventClock(lead, now);
  const locked = unlocksIn(lead, now);
  const role = roleTag(lead.role, e.filter);
  return (
    <ListRow
      leading={{ pin: lead.shownStop >= 0 ? e.type : 'locked', colour: EVENT_COLOURS[e.type] }}
      title={e.title}
      subtitle={metaLine([clock.live ? 'Live now' : 'Next up', EVENT_LABELS[e.type], role?.label])}
      meta={metaLine([clock.live ? `Ends in ${clock.value}` : `Starts in ${clock.value}`, `${e.going.length} going`, locked ? LOCATION.showsIn(locked) : formatMiles(miles)])}
      onPress={onPress}
      accessibilityHint="Shows it on the map"
    />
  );
}

const st = StyleSheet.create({
  top: { zIndex: 2, paddingHorizontal: SPACING.screen, paddingBottom: SPACING.sm, gap: SPACING.xs, backgroundColor: COLOR.surface.bg, borderBottomWidth: 1, borderBottomColor: COLOR.surface.border },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  list: { padding: SPACING.screen, gap: SPACING.section, paddingBottom: SPACING.xxxl },
  stack: { position: 'absolute', right: SPACING.md, top: 0, gap: SPACING.sm, alignItems: 'flex-end' },
  stackGroup: [
    { backgroundColor: COLOR.surface.glassRaised, borderColor: COLOR.surface.raisedHi, borderWidth: 1, borderRadius: RADII.card, overflow: 'hidden' },
    ELEVATION.float,
  ] as never,
  stackRule: { height: 1, backgroundColor: COLOR.surface.border, marginHorizontal: SPACING.sm },
  mapButton: { width: BUTTON, height: BUTTON, alignItems: 'center', justifyContent: 'center' },
  note: {
    position: 'absolute', left: SPACING.md, top: 0,
    backgroundColor: COLOR.surface.glass, borderColor: COLOR.surface.border, borderWidth: 1, borderRadius: RADII.tag, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xxs,
  },
  header: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md, gap: SPACING.sm },
  notice: { backgroundColor: COLOR.surface.raised, borderColor: COLOR.surface.raisedHi, borderWidth: 1, borderRadius: RADII.card, padding: SPACING.md, gap: SPACING.xs },
  intro: { gap: SPACING.sm, paddingBottom: SPACING.sm },
});

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
