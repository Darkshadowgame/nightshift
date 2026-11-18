import { router, useLocalSearchParams } from 'expo-router';
import { areaRadius } from '../../lib/area';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { Linking, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PulseRing } from '../../components/motion';
import { Pin, type Glyph } from '../../components/Pin';
import { LayersPanel } from '../../components/LayersPanel';
import { detentTops, MapSheet, type Detent } from '../../components/MapSheet';
import { MapWidgetSlot } from '../../components/MapWidgetSlot';
import Svg, { Path } from 'react-native-svg';
import { UNVETTED_PHOTO_SPOTS } from '../../data/photoVetting';
import { feel } from '../../lib/feel';
import { nearestPoints, placesForView, regionKey } from '../../lib/mapPlaces';
import { NightMap } from '../../components/NightMap';
import type { MapCircle, MapPath, MapPin, MapPolygon, MapRegion, NightMapHandle } from '../../components/mapTypes';
import { NoticeBell } from '../../components/NoticeBell';
import { Button, LinkText, ListRow, Notice, Row, Tag, Txt } from '../../components/ui';
import { EVENT_LABELS } from '../../lib/events';
import { viewEvents, type EventView } from '../../lib/eventView';
import { describeFilter } from '../../lib/invites';
import { plural } from '../../lib/format';
import { eventClock, mapHud, orderPins, unlocksIn } from '../../lib/hud';
import { fitRegion, formatMiles } from '../../lib/geo';
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
import { usePostPins } from '../../lib/communityStore';
import { shortAgo } from '../../lib/format';
import { openPlaceLabel, PLACE_NAMES, roleLabel, roleTone, UNLOCK } from '../../lib/glossary';
import { ALL_LAYERS, CORE_LAYERS, layerOn, toggleLayer as toggledLayer, type CoreLayer, type Layer } from '../../lib/mapLayers';
import { BRAND, C, EVENT_COLOURS, F, FONT_SCALE, LAYER, PARTNER_COLOUR, POST_COLOUR, RADIUS, ROAD_COLOUR, SHOP_COLOUR, SPOT_COLOURS, STATE, SURFACE, TYPE } from '../../theme';


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

/** Find (events, and Where to? for any address): a magnifier. */
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
  const layersKey = [settings.mapLayers, settings.cameras, settings.shops, settings.roadReports, settings.postsLayer];
  const layers = useMemo(
    () => Object.fromEntries(ALL_LAYERS.map((k) => [k, layerOn(settings, k)])) as Record<Layer, boolean>,
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
  }, [views, shown, placeView, cams, region.span, shopView, roadReports, postPins]);

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
                { label: 'Still there', onPress: () => answerReport(r, 'still_there'), colour: STATE.success },
                { label: 'Gone', onPress: () => answerReport(r, 'gone'), colour: C.fog },
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
            ? `${e.areaName} · ${UNLOCK.locked} · requested, waiting for a host`
            : `${e.areaName} · ${UNLOCK.locked}`;
      const clock = eventClock(v, now);
      return {
        title: e.title,
        glyph: v.shownStop >= 0 ? e.type : 'locked',
        meta: [EVENT_LABELS[e.type], roleLabel(v.role), `${clock.label} ${clock.value}`, `${e.going.length} going`].filter(Boolean).join(' · '),
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
    const zoom = [cams?.tooWide && camerasAsked ? 'CAMERAS' : null, shopView?.tooWide ? 'SHOPS' : null].filter(Boolean);
    if (shopView?.loading) return { zoom: true, text: shopsFailed ? "COULDN'T LOAD SHOPS" : 'LOADING SHOPS…' };
    if (zoom.length) return { zoom: true, text: `ZOOM IN TO SEE ${zoom.join(' AND ')}` };
    if (shopView && shopFilter.partnersOnly) return { zoom: false, text: `PARTNERS ONLY · ${shopView.partners.length} HERE` };
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
  const lead = hud.live[0] ?? hud.next;
  /** The one-time "how the map works" hint (REVIEW-5 M8), once the location note is out of the way. */
  const showHint = ready && !settings.mapHintSeen && !locNote;

  // ---------------------------------------------------------------------------
  // The sheet (MAP-REDESIGN.md): Tonight near you, or the selected pin.
  // ---------------------------------------------------------------------------
  const [box, setBox] = useState({ w: screen.width, h: 0 });
  const [detent, setDetent] = useState<Detent>('peek');
  const [headerH, setHeaderH] = useState(120);
  const sheetY = useSharedValue(screen.height);
  const sheetTop = insets.top + 8;
  const tops = detentTops(box.h, headerH, sheetTop);
  // The first visit, or a location note: open the sheet so the note is read.
  useEffect(() => {
    if (showHint || locNote) setDetent((d) => (d === 'peek' ? 'half' : d));
  }, [showHint, locNote]);

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
  // Search (Find) sends people back here with what they picked: `focus` is a pin id ("ev:…" or "sp:…").
  const params = useLocalSearchParams<{ focus?: string; t?: string }>();
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

  /** Tonight near you: live now, the rest of the next 12 hours, then the week. */
  const origin = here ?? meUser?.home ?? region.centre;
  const lists = useMemo(() => {
    const t = now.getTime();
    const start = (v: EventView) => new Date(v.event.startsAt).getTime();
    // The lead event is already in the sheet's header.
    const upcoming = views.filter((v) => v.phase !== 'live' && v !== lead).sort((a, b) => start(a) - start(b));
    return {
      live: hud.live.filter((v) => v !== lead),
      tonight: upcoming.filter((v) => start(v) <= t + 12 * 3_600_000),
      week: upcoming.filter((v) => start(v) > t + 12 * 3_600_000 && start(v) <= t + 7 * 86_400_000).slice(0, 6),
    };
  }, [views, now, lead, hud.live]);
  const nearPlaces = useMemo(() => {
    const shownPlaces = places.filter((s) => s.status !== 'pending' && (layers[s.kind] || (s.kind === 'venue' && venuesViaShops)));
    return shownPlaces
      .map((s) => ({ s, miles: milesBetween(snapped.centre, s.at) }))
      .sort((a, b) => a.miles - b.miles)
      .slice(0, 5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [places, shown, venuesViaShops, snapped.key]);
  const milesTo = (v: EventView) => {
    const at = v.shownStop >= 0 ? v.event.stops[v.shownStop].at ?? v.event.area : v.event.area;
    return formatMiles(milesBetween(origin, at));
  };
  const nothingOn = ready && !lead && lists.week.length === 0;

  // The map's buttons and notes ride just above the sheet, up to half; they fade out as it opens fully.
  const [stackH, setStackH] = useState(176);
  const [noteH, setNoteH] = useState(30);
  const pillBottom = insets.top + 8 + PILL + 8;
  const ride = (y: number, h: number) => {
    'worklet';
    const yy = Math.min(y, tops.peek);
    const lift = Math.max(pillBottom, yy - h - 12);
    const fade = Math.min(1, Math.max(0, (yy - (tops.full + 60)) / Math.max(1, tops.half - tops.full - 60)));
    return { transform: [{ translateY: lift }], opacity: fade };
  };
  const stackStyle = useAnimatedStyle(() => ride(sheetY.value, stackH));
  const noteStyle = useAnimatedStyle(() => ride(sheetY.value, noteH));
  const chromeLive = detent !== 'full';
  const moreOn = ALL_LAYERS.filter((k) => !CORE_LAYERS.includes(k as CoreLayer) && k !== 'venue' && layers[k]).length;
  const [showLayers, setShowLayers] = useState(false);
  const showNote = (cams && (!cams.tooWide || camerasAsked)) || shopView || openDataCredit;

  return (
    <View style={{ flex: 1, backgroundColor: C.asphalt }} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
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
        compass={{ x: -2, y: PILL + 12 }}
      />

      {/* Top: one search pill and the bell. */}
      <View style={[st.top, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
        <Pressable
          onPress={() => router.push({ pathname: '/find', params: { focus: '1' } })}
          style={({ pressed }) => [st.search, pressed && { opacity: 0.85 }]}
          accessibilityRole="search"
          accessibilityLabel={`Search: where to, events, places and people${newNear > 0 ? `. ${newNear} new events near you` : ''}`}
        >
          <FindIcon colour={C.chalk} />
          <View style={{ flex: 1 }}>
            <Txt v="body" scale="chrome" style={{ fontFamily: F.bodyBold }} numberOfLines={1}>Where to?</Txt>
            <Txt v="caption" scale="chrome" numberOfLines={1}>Events, places, people, addresses</Txt>
          </View>
          {newNear > 0 ? (
            <View style={st.newBadge}>
              <Text maxFontSizeMultiplier={FONT_SCALE.chrome} style={st.newBadgeText}>{newNear > 9 ? '9+' : newNear} new</Text>
            </View>
          ) : null}
        </Pressable>
        <NoticeBell boxed size={PILL} />
      </View>

      {/* Left, above the sheet: what to zoom in for, or the OpenStreetMap credit. */}
      {showNote && box.h ? (
        <Animated.View style={[st.note, { maxWidth: box.w - 16 - BUTTON - 24 }, noteStyle]} pointerEvents="none" onLayout={(e) => setNoteH(e.nativeEvent.layout.height)}>
          <Txt v="micro" scale="chrome" style={{ color: mapNote.zoom ? C.chalk : C.fog }} numberOfLines={2}>{mapNote.text}</Txt>
        </Animated.View>
      ) : null}

      {/* Right, above the sheet: layers, locate me, near me. */}
      {box.h ? (
        <Animated.View style={[st.stack, stackStyle]} pointerEvents={chromeLive ? 'box-none' : 'none'} onLayout={(e) => setStackH(e.nativeEvent.layout.height)}>
          {/* Room for one small map widget (e.g. a speed readout). See MapWidgetSlot. */}
          <MapWidgetSlot />
          <View style={st.stackGroup}>
            <MapButton
              onPress={() => setShowLayers(true)}
              label={`Map layers and key${moreOn > 0 ? `, ${moreOn} extra on` : ''}`}
              lit={moreOn > 0}
            >
              <LayersIcon colour={moreOn > 0 ? C.chalk : C.fog} />
            </MapButton>
            <View style={st.stackRule} />
            <MapButton onPress={() => locate(true, true)} label="Show where I am">
              <Pin glyph="you" colour={located ? C.chalk : C.fog} size={26} />
            </MapButton>
            <View style={st.stackRule} />
            <MapButton onPress={nearMe} label="Near me: fit what's around you">
              <NearIcon colour={C.chalk} />
            </MapButton>
          </View>
        </Animated.View>
      ) : null}

      {box.h ? (
        <MapSheet
          y={sheetY}
          height={box.h}
          top={sheetTop}
          peek={headerH}
          detent={detent}
          onDetent={setDetent}
          label={sel ? sel.title : 'Tonight near you'}
          onHeaderLayout={setHeaderH}
          header={
            sel ? (
              <View style={st.header}>
                <Row style={{ flexWrap: 'nowrap', alignItems: 'flex-start' }} gap={12}>
                  <Pin glyph={sel.glyph} colour={sel.colour} size={36} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Txt v="h3" numberOfLines={2} accessibilityRole="header">{sel.title}</Txt>
                    <Txt v="mono" scale="chrome" style={{ color: sel.colour }} numberOfLines={2}>{sel.meta}</Txt>
                  </View>
                  <Pressable onPress={close} hitSlop={8} accessibilityRole="button" accessibilityLabel="Close" style={st.closeBtn}>
                    <Txt v="h3" scale="chrome" style={{ color: C.fog }}>✕</Txt>
                  </Pressable>
                </Row>
                {sel.body ? <Txt v="muted" numberOfLines={detent === 'peek' ? 3 : undefined}>{sel.body}</Txt> : null}
                {sel.note ? <Txt v="muted" style={{ color: C.chalk }}>{sel.note}</Txt> : null}
                {sel.actions ? (
                  <Row gap={10} style={{ flexWrap: 'nowrap' }}>
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
                {sel.open ? <Button label={sel.cta ?? 'Open'} onPress={sel.open} /> : null}
              </View>
            ) : (
              <View style={st.header}>
                <Row style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
                  <Txt v="eyebrow" scale="chrome" accessibilityRole="header">Tonight near you</Txt>
                  {hud.tonight > 0 ? <Txt v="mono" scale="chrome" style={{ color: BRAND }}>{hud.tonight} IN THE NEXT 12H</Txt> : null}
                </Row>
                {lead ? (
                  <LeadRow lead={lead} now={now} miles={milesTo(lead)} onPress={() => show(`ev:${lead.event.id}`)} />
                ) : ready ? (
                  <Row style={{ flexWrap: 'nowrap', justifyContent: 'space-between', minHeight: 48 }}>
                    <Txt v="h3" style={{ flex: 1 }}>Nothing on near you tonight</Txt>
                    <LinkText label="Find events ›" onPress={() => router.push('/find')} />
                  </Row>
                ) : null}
              </View>
            )
          }
        >
          {sel ? null : (
            <>
              {locNote ? (
                <Notice onDismiss={() => setLocNote(null)} action={Platform.OS !== 'web' ? { label: 'Open Settings', onPress: () => Linking.openSettings().catch(() => {}) } : undefined}>
                  {locNote}
                </Notice>
              ) : null}
              {showHint ? (
                <View style={st.hint} accessibilityLiveRegion="polite">
                  <Txt v="eyebrow">How the map works</Txt>
                  <Txt v="muted" style={{ color: C.chalk }}>
                    Filled pins are events, outlined pins are places. Tap one to see it here. Search is at the top; the layers button (right) picks what the map shows.
                  </Txt>
                  <LinkText label="Got it" onPress={() => setSettings({ mapHintSeen: true })} />
                </View>
              ) : null}
              <Row gap={8} style={{ flexWrap: 'nowrap' }}>
                <Action label="Host an event" glyph="meet" onPress={() => router.push('/event/new')} />
                <Action label="Suggest a place" glyph="destination" onPress={() => router.push('/spot/new')} />
                <Action label="Find events" glyph="calendar" onPress={() => router.push('/find')} />
              </Row>
              {lists.live.length ? (
                <SheetSection title="Live now">
                  {lists.live.map((v) => (
                    <EventRow key={v.event.id} view={v} now={now} miles={milesTo(v)} onPress={() => show(`ev:${v.event.id}`)} />
                  ))}
                </SheetSection>
              ) : null}
              {lists.tonight.length ? (
                <SheetSection title="Tonight">
                  {lists.tonight.map((v) => (
                    <EventRow key={v.event.id} view={v} now={now} miles={milesTo(v)} onPress={() => show(`ev:${v.event.id}`)} />
                  ))}
                </SheetSection>
              ) : null}
              {lists.week.length ? (
                <SheetSection title="This week" right={<LinkText label="All events ›" onPress={() => router.push('/find')} />}>
                  {lists.week.map((v) => (
                    <EventRow key={v.event.id} view={v} now={now} miles={milesTo(v)} onPress={() => show(`ev:${v.event.id}`)} />
                  ))}
                </SheetSection>
              ) : null}
              {nothingOn ? (
                <Txt v="muted">Nothing coming up near you. Find an event further out, or host one for your mates.</Txt>
              ) : null}
              {nearPlaces.length ? (
                <SheetSection title="Places on the map">
                  {nearPlaces.map(({ s, miles }) => (
                    <ListRow
                      key={s.id}
                      glyph={s.kind}
                      colour={SPOT_COLOURS[s.kind]}
                      title={s.name}
                      subtitle={[PLACE_NAMES[s.kind].one, s.region, `${formatMiles(miles)} from the map's centre`].filter(Boolean).join(' · ')}
                      onPress={() => show(`sp:${s.id}`, false)}
                      accessibilityLabel={`${s.name}, ${PLACE_NAMES[s.kind].one}. Show on the map`}
                    />
                  ))}
                </SheetSection>
              ) : null}
            </>
          )}
        </MapSheet>
      ) : null}

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

/** Search pill and map buttons: big enough for a thumb (48 pt). */
const PILL = 52;
const BUTTON = 48;

function MapButton({ onPress, label, lit, children }: { onPress: () => void; label: string; lit?: boolean; children: ReactNode }) {
  return (
    <Pressable
      onPress={() => {
        feel.tap();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [st.mapButton, lit && { backgroundColor: C.kerb }, pressed && { opacity: 0.7 }]}
    >
      {children}
    </Pressable>
  );
}

/** One of the sheet's three actions: icon over a short label, a big target. */
function Action({ label, glyph, onPress }: { label: string; glyph: Glyph; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={({ pressed }) => [st.action, pressed && { opacity: 0.8 }]}>
      <Pin glyph={glyph} colour={BRAND} size={24} />
      <Txt v="label" scale="chrome" style={{ color: C.chalk, textAlign: 'center' }} numberOfLines={2}>{label}</Txt>
    </Pressable>
  );
}

function SheetSection({ title, right, children }: { title: string; right?: ReactNode; children: ReactNode }) {
  return (
    <View style={{ gap: 2 }}>
      <Row style={{ justifyContent: 'space-between', minHeight: 28 }}>
        <Txt v="micro" accessibilityRole="header">{title}</Txt>
        {right}
      </Row>
      {children}
    </View>
  );
}

/** An event in the sheet's lists: tap to see it on the map. */
function EventRow({ view: v, now, miles, onPress }: { view: EventView; now: Date; miles: string; onPress: () => void }) {
  const e = v.event;
  const clock = eventClock(v, now);
  const role = roleLabel(v.role);
  const locked = v.shownStop < 0;
  const sub = [EVENT_LABELS[e.type], `${clock.label} ${clock.value}`, `${e.going.length} going`, locked ? `${e.areaName} (rough area)` : miles].join(' · ');
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${e.title}. ${role ? `${role}. ` : ''}${sub}. Show on the map`}
      style={({ pressed }) => [st.row, pressed && { opacity: 0.8 }]}
    >
      <Pin glyph={locked ? 'locked' : e.type} colour={EVENT_COLOURS[e.type]} size={30} />
      <View style={{ flex: 1, gap: 2 }}>
        <Row gap={6} style={{ flexWrap: 'nowrap' }}>
          {clock.live ? <View style={st.liveDot} accessibilityLabel="Live now" /> : null}
          <Txt numberOfLines={1} style={{ flexShrink: 1 }}>{e.title}</Txt>
        </Row>
        <Txt v="caption" numberOfLines={2}>{sub}</Txt>
      </View>
      {role ? <Tag label={role} tone={roleTone(v.role)} /> : null}
    </Pressable>
  );
}

/** The sheet's peek: what's live now, or the next thing you're part of, with its countdown. */
function LeadRow({ lead, now, miles, onPress }: { lead: EventView; now: Date; miles: string; onPress: () => void }) {
  const e = lead.event;
  const colour = EVENT_COLOURS[e.type];
  const clock = eventClock(lead, now);
  const locked = unlocksIn(lead, now);
  const role = roleLabel(lead.role);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${clock.live ? 'Live now' : 'Next up'}: ${e.title}, ${role ? `${role}, ` : ''}${clock.label} ${clock.value}. Show on the map`}
      style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56 }, pressed && { opacity: 0.8 }]}
    >
      <PulseRing live={clock.live} size={38}>
        <Pin glyph={lead.shownStop >= 0 ? e.type : 'locked'} colour={colour} size={38} />
      </PulseRing>
      <View style={{ flex: 1, gap: 1 }}>
        <Row gap={6} style={{ flexWrap: 'nowrap' }}>
          {clock.live ? <View style={st.liveDot} /> : null}
          <Txt v="eyebrow" scale="chrome" style={{ color: clock.live ? STATE.live : colour, flexShrink: 1 }} numberOfLines={1}>
            {clock.live ? 'Live now' : 'Next up'} · {EVENT_LABELS[e.type]}
          </Txt>
        </Row>
        <Txt v="h3" scale="chrome" numberOfLines={1}>{e.title}</Txt>
        <Row gap={6} style={{ flexWrap: 'nowrap' }}>
          {role ? <Tag label={role} tone={roleTone(lead.role)} /> : null}
          <Txt v="mono" scale="chrome" numberOfLines={1} style={{ flexShrink: 1 }}>
            {[`${e.going.length} going`, locked ? UNLOCK.in(locked) : miles].filter(Boolean).join(' · ')}
          </Txt>
        </Row>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Txt v="micro" scale="chrome">{clock.live ? 'Ends in' : 'Starts in'}</Txt>
        <Txt v="h2" scale="chrome" style={{ color: clock.live ? STATE.live : C.chalk, fontVariant: ['tabular-nums'], textTransform: 'none' }}>{clock.value}</Txt>
      </View>
    </Pressable>
  );
}

const st = StyleSheet.create({
  top: { position: 'absolute', left: 0, right: 0, top: 0, paddingHorizontal: 12, flexDirection: 'row', gap: 8, alignItems: 'center' },
  search: {
    flex: 1, minHeight: PILL, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 6,
    backgroundColor: SURFACE.glassRaised, borderColor: C.kerbHi, borderWidth: 1, borderRadius: RADIUS.pill,
    shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 3 },
  },
  newBadge: { backgroundColor: BRAND, borderRadius: RADIUS.pill, paddingHorizontal: 8, paddingVertical: 3 },
  newBadgeText: { fontFamily: F.labelBold, fontSize: TYPE.micro, color: C.ink, letterSpacing: 0.6, textTransform: 'uppercase' },
  stack: { position: 'absolute', right: 12, top: 0, gap: 8, alignItems: 'flex-end' },
  stackGroup: {
    backgroundColor: SURFACE.glassRaised, borderColor: C.kerbHi, borderWidth: 1, borderRadius: RADIUS.sheet, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  stackRule: { height: 1, backgroundColor: C.kerb, marginHorizontal: 8 },
  mapButton: { width: BUTTON, height: BUTTON, alignItems: 'center', justifyContent: 'center' },
  note: {
    position: 'absolute', left: 12, top: 0,
    backgroundColor: SURFACE.glass, borderColor: C.kerb, borderWidth: 1, borderRadius: RADIUS.tag, paddingHorizontal: 6, paddingVertical: 3,
  },
  header: { paddingHorizontal: 16, paddingBottom: 14, gap: 8 },
  closeBtn: { width: 44, height: 44, marginTop: -6, marginRight: -8, alignItems: 'center', justifyContent: 'center' },
  hint: { backgroundColor: C.tarmac, borderColor: C.kerbHi, borderWidth: 1, borderRadius: RADIUS.card, padding: 12, gap: 8 },
  action: {
    flex: 1, minHeight: 64, alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 4, paddingVertical: 8,
    backgroundColor: C.tarmac, borderColor: C.kerbHi, borderWidth: 1, borderRadius: RADIUS.card,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, paddingVertical: 6 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: STATE.liveDot },
  answer: { flex: 1, minHeight: 48, borderWidth: 1.5, borderRadius: RADIUS.card, alignItems: 'center', justifyContent: 'center' },
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
