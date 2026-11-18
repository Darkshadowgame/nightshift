import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { BringSheet, shortBuildName } from '../../components/BringPicker';
import {
  DsText,
  EmptyState,
  IconButton,
  ListRow,
  PhotoCard,
  Press,
  RowDivider,
  ScreenHeader,
  SearchField,
  Section,
  SegmentedControl,
  Sheet,
  Tag,
  TAB_BAR_HEIGHT,
  useToast,
} from '../../components/ds';
import { LayersPanel } from '../../components/LayersPanel';
import { detentTops, MapSheet, type Detent } from '../../components/MapSheet';
import { MapWidgetSlot } from '../../components/MapWidgetSlot';
import type { MapCircle, MapPath, MapPin, MapRegion, NightMapHandle } from '../../components/mapTypes';
import { FadeUp } from '../../components/motion';
import { NightMap } from '../../components/NightMap';
import { Pin } from '../../components/Pin';
import { PhotoCredit } from '../../components/PhotoCredit';
import { cardDistance, cardTime, EventEntityCard, EventRow, eventPhotoRef, notOpenLine, PlaceEntityCard, roleTag } from '../../components/TonightCards';
import { UNVETTED_PHOTO_SPOTS } from '../../data/photoVetting';
import { areaRadius } from '../../lib/area';
import { useNow } from '../../lib/clock';
import { usePostPins } from '../../lib/communityStore';
import { windowFor } from '../../lib/discover';
import { canJoinDirectly, viewEvents, type EventView } from '../../lib/eventView';
import { EVENT_LABELS } from '../../lib/events';
import { feel } from '../../lib/feel';
import { metaLine } from '../../components/ds';
import { distanceText } from '../../lib/format';
import { milesBetween } from '../../lib/geo';
import { aroundArea, DEMO_NIGHT, PLACE_NAMES } from '../../lib/glossary';
import { orderPins } from '../../lib/hud';
import { rememberMapView } from '../../lib/lastView';
import { currentPosition } from '../../lib/location';
import { layerOn, toggleLayer as toggledLayer, type Layer } from '../../lib/mapLayers';
import { inViewOnly, placesForView, regionKey } from '../../lib/mapPlaces';
import { photoSource, sampleRef } from '../../lib/photoSource';
import { visibleSpots } from '../../lib/spots';
import { useStore } from '../../lib/store';
import { isSpectatorVenue } from '../../lib/tracks';
import type { LatLng, SpotKind } from '../../lib/types';
import { COLOR, ELEVATION, EVENT_COLOURS, POST_COLOUR, RADII, SPACING, SPOT_COLOURS } from '../../theme';

/** The layers Tonight's map can add to the events (owner decision 7: Posts stays, off by default). */
const MAP_LAYERS: Layer[] = ['drive', 'photo', 'track', 'posts'];
const START = { lat: 52.7, lng: -1.7 };
const START_SPAN = 0.5;
/** Count pins (places grouped when zoomed out): what each one is. */
const CLUSTER_NAMES: Record<SpotKind, string> = { drive: 'drives', photo: 'photo spots', track: 'tracks', venue: 'meet spots' };
/** Map buttons: big enough for a thumb (48 pt). */
const BUTTON = 48;
/** One object for the module: a new one each render would re-render the memoised map. */
const COMPASS = { x: -2, y: SPACING.md };
/** The pick card's photo shape: wider than 16:9 so the peek stays about a third of the screen. */
const PEEK_ASPECT = 2.4;

/** The layers button's icon: three stacked sheets, as in Apple Maps. */
function LayersIcon({ colour }: { colour: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path d="M12 3 21 8l-9 5-9-5z" fill="none" stroke={colour} strokeWidth={1.8} strokeLinejoin="round" />
      <Path d="M3 12.5l9 5 9-5M3 16.5l9 5 9-5" fill="none" stroke={colour} strokeWidth={1.8} strokeLinejoin="round" />
    </Svg>
  );
}

/**
 * Tonight (Redesign 2, 3.3 and 3.4, template T2): what's on near you now and next, on a real map or
 * as a list. Header: TONIGHT, the DEMO NIGHT tag in the demo, "+" (host a meet) and the bell; then
 * the search pill and Map / List. The map shows events only (plus Drives, Photo spots, Tracks and
 * Posts from Layers, all off by default). The sheet's peek is one PhotoCard: the pick (live now,
 * else the next meet you can go to) with I'm going, the screen's one primary. A tapped pin takes
 * the card's place, with ✕. Drag up: the same sections as the list.
 */
export default function TonightScreen() {
  const insets = useSafeAreaInsets();
  const store = useStore();
  const { events, me, crews, users, builds, spots, settings, setSettings, ready } = store;
  const now = useNow();
  const toast = useToast();
  // Toasts sit above the sheet only while this tab is on screen.
  const [focused, setFocused] = useState(true);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );
  const screen = useWindowDimensions();
  const demo = store.backend === 'local';
  const meUser = users.find((u) => u.id === me);
  const myBuilds = builds.filter((b) => b.ownerId === me);

  // ---------------------------------------------------------------------------
  // Layers: events always, then whatever's switched on.
  // ---------------------------------------------------------------------------
  const layers = useMemo(
    () => Object.fromEntries(MAP_LAYERS.map((k) => [k, layerOn(settings, k)])) as Record<Layer, boolean>,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [settings.mapLayers, settings.postsLayer],
  );
  const [showLayers, setShowLayers] = useState(false);
  const layersOn = MAP_LAYERS.filter((k) => layers[k]).length;

  // ---------------------------------------------------------------------------
  // Where the map is looking.
  // ---------------------------------------------------------------------------
  const map = useRef<NightMapHandle>(null);
  const [view, setView] = useState<{ centre: LatLng; span: number; key: number } | null>(null);
  const [region, setRegionNow] = useState<MapRegion>({ centre: meUser?.home ?? START, span: START_SPAN });
  const regionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const setRegion = useCallback((r: MapRegion) => {
    rememberMapView(r.centre);
    if (regionTimer.current) clearTimeout(regionTimer.current);
    regionTimer.current = setTimeout(() => setRegionNow(r), 120);
  }, []);
  useEffect(() => () => {
    if (regionTimer.current) clearTimeout(regionTimer.current);
  }, []);
  const snapped = useMemo(() => regionKey(region.centre, region.span), [region]);

  const [located, setLocated] = useState(false);
  const [here, setHere] = useState<LatLng | null>(null);
  const [locNote, setLocNote] = useState<string | null>(null);
  async function locate(ask: boolean, explicit: boolean) {
    const pos = await currentPosition(ask);
    if (pos.ok) {
      setLocated(true);
      setHere(pos.at);
      setLocNote(null);
      if (explicit) map.current?.animateTo(pos.at, 0.35);
      return;
    }
    setLocated(false);
    // Only when asked: the map stays on your home area without a word otherwise.
    if (explicit) setLocNote(pos.reason === 'denied' ? 'Location is off for Nightshift. Turn it on in Settings to see where you are.' : "Couldn't find where you are just now.");
  }
  useEffect(() => {
    if (ready) locate(false, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);
  const origin = here ?? meUser?.home ?? region.centre;
  const fromHome = !here;

  // ---------------------------------------------------------------------------
  // Events: one set everywhere (live now, tonight to 5am, this week, later).
  // ---------------------------------------------------------------------------
  const allViews = useMemo(
    () => viewEvents(events, me, crews, users, builds, now).filter((v) => v.phase !== 'over' && v.phase !== 'cancelled' && v.role !== 'declined'),
    [events, me, crews, users, builds, now],
  );
  // The 30 s clock only matters to the pins when a phase, role or shown meet point changes.
  const viewsSig = allViews.map((v) => `${v.event.id}:${v.phase}:${v.role}:${v.shownStop}:${v.event.going.length}`).join('|');
  const stableViews = useRef<{ sig: string; events: typeof events; views: EventView[] } | null>(null);
  if (!stableViews.current || stableViews.current.sig !== viewsSig || stableViews.current.events !== events) {
    stableViews.current = { sig: viewsSig, events, views: allViews };
  }
  const views = stableViews.current.views;
  const pointOf = (v: EventView): LatLng => (v.shownStop >= 0 ? (v.event.stops[v.shownStop].at ?? v.event.area) : v.event.area);
  const milesTo = (v: EventView) => milesBetween(origin, pointOf(v));

  const lists = useMemo(() => {
    const tonightEnd = windowFor('tonight', now)!.to.getTime();
    const weekEnd = now.getTime() + 7 * 86_400_000;
    const start = (v: EventView) => new Date(v.event.startsAt).getTime();
    const upcoming = views.filter((v) => v.phase !== 'live');
    return {
      live: views.filter((v) => v.phase === 'live'),
      tonight: upcoming.filter((v) => start(v) < tonightEnd),
      week: upcoming.filter((v) => start(v) >= tonightEnd && start(v) <= weekEnd),
      later: upcoming.filter((v) => start(v) > weekEnd),
    };
  }, [views, now]);

  /** The pick: live now that you can go to, else the next meet you can go to. With no car, the same pick. */
  const pick = useMemo(() => {
    const open = (v: EventView) => canJoinDirectly(v.role);
    return lists.live.find(open) ?? lists.tonight.find(open) ?? lists.week.find(open) ?? lists.later.find(open) ?? views[0] ?? null;
  }, [lists, views]);

  // ---------------------------------------------------------------------------
  // Places and posts on the map (Layers).
  // ---------------------------------------------------------------------------
  const places = useMemo(
    () => visibleSpots(spots, me).filter((s) => s.kind !== 'venue' && !(s.kind === 'track' && isSpectatorVenue(s.id)) && !(s.kind === 'photo' && UNVETTED_PHOTO_SPOTS.has(s.id))),
    [spots, me],
  );
  const [selected, setSelected] = useState<string | null>(null);
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  const placeView = useMemo(() => {
    const sel = selected?.startsWith('sp:') ? selected.slice(3) : null;
    const shownPlaces = places.filter((s) => layers[s.kind as Layer] || s.id === sel);
    return placesForView(shownPlaces, snapped.centre, snapped.span, sel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [places, layers, snapped.key, selected]);
  const postPins = usePostPins(region.centre, region.span, layers.posts);

  const { pins, paths, circles } = useMemo(() => {
    const pins: MapPin[] = [];
    const paths: MapPath[] = [];
    const circles: MapCircle[] = [];
    for (const p of postPins) pins.push({ id: `post:${p.id}`, at: p.at, glyph: 'post', colour: POST_COLOUR, title: p.placeName ?? 'Post', size: 30 });
    for (const s of placeView.places) pins.push({ id: `sp:${s.id}`, at: s.at, glyph: s.kind, colour: s.status === 'pending' ? COLOR.text.secondary : SPOT_COLOURS[s.kind], title: s.name, size: 32 });
    for (const c of placeView.clusters)
      pins.push(
        c.mixed
          ? { id: c.id, at: c.at, glyph: 'area', colour: COLOR.text.primary, title: 'places', size: 36, count: c.count }
          : { id: c.id, at: c.at, glyph: c.kind, colour: SPOT_COLOURS[c.kind], title: CLUSTER_NAMES[c.kind], size: 32, count: c.count },
      );
    for (const s of placeView.lines) paths.push({ id: `pa:${s.id}`, coords: s.path!, colour: s.status === 'pending' ? COLOR.text.secondary : SPOT_COLOURS[s.kind], dashed: s.status === 'pending' });
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
        if (e.type === 'cruise') paths.push({ id: `rt:${e.id}`, coords: e.stops.flatMap((s) => (s.at ? [s.at] : [])), colour, dashed: true });
      } else {
        circles.push({ id: `ar:${e.id}`, centre: e.area, radiusMiles: areaRadius(e), colour });
        pins.push({ id: `ev:${e.id}`, at: e.area, glyph: 'locked', colour, title: `${e.title}, ${aroundArea(e.areaName)}`, size: 34, live: v.phase === 'live' });
      }
    }
    return { pins: orderPins(pins), paths, circles };
  }, [views, placeView, postPins, snapped.key, selected, snapped.centre, snapped.span]);

  function zoomCluster(id: string) {
    const c = placeView.clusters.find((x) => x.id === id);
    if (!c) return;
    feel.select();
    setView((x) => ({ centre: c.zoomCentre, span: c.zoomSpan, key: (x?.key ?? 0) + 1 }));
  }
  const zoomClusterRef = useRef(zoomCluster);
  zoomClusterRef.current = zoomCluster;

  // ---------------------------------------------------------------------------
  // Map or list; the sheet.
  // ---------------------------------------------------------------------------
  const params = useLocalSearchParams<{ focus?: string; t?: string; view?: string }>();
  const [mode, setMode] = useState<'map' | 'list'>(params.view === 'list' ? 'list' : 'map');
  useEffect(() => {
    if (params.view === 'list' || params.view === 'map') setMode(params.view);
  }, [params.view, params.t]);
  const [demoInfo, setDemoInfo] = useState(false);

  const [box, setBox] = useState({ w: screen.width, h: 0 });
  const [detent, setDetent] = useState<Detent>('peek');
  const [headerH, setHeaderH] = useState(260);
  const sheetY = useSharedValue(screen.height);
  const sheetTop = SPACING.sm;
  const peekCap = Math.max(160, Math.round(Math.min(screen.height * 0.45, (box.h || screen.height) - 2 * BUTTON - SPACING.xl)));
  const peek = Math.min(headerH, peekCap);
  const tops = detentTops(box.h, peek, sheetTop);

  /** Where an event or place is on the map. */
  const where = useCallback(
    (id: string): LatLng | null => {
      const key = id.slice(id.indexOf(':') + 1);
      if (id.startsWith('ev:')) {
        const v = views.find((x) => x.event.id === key);
        return v ? pointOf(v) : null;
      }
      if (id.startsWith('sp:')) return places.find((x) => x.id === key)?.at ?? null;
      return pins.find((p) => p.id === id)?.at ?? null;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [views, places, pins],
  );
  function show(id: string, zoom = true, onlyIfHidden = false) {
    feel.select();
    setMode('map');
    setSelected(id);
    setDetent('peek');
    const at = where(id);
    if (!at) return;
    const fromTop = (region.centre.lat + region.span / 2 - at.lat) / region.span;
    if (onlyIfHidden && fromTop > 0.12 && fromTop < 0.45) return;
    const span = zoom ? Math.min(region.span, 0.35) : region.span;
    setView((x) => ({ centre: { lat: at.lat - span * 0.2, lng: at.lng }, span, key: (x?.key ?? 0) + 1 }));
  }
  const showRef = useRef(show);
  showRef.current = show;
  useEffect(() => {
    if (params.focus && ready) showRef.current(params.focus);
  }, [params.focus, params.t, ready]);
  const onSelectPin = useCallback((id: string) => {
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

  // The map's buttons ride just above the sheet, up to half; they fade out as it opens fully.
  const [stackH, setStackH] = useState(2 * BUTTON + 1);
  const stackStyle = useAnimatedStyle(() => {
    const yy = Math.min(sheetY.value, tops.peek);
    const lift = Math.max(SPACING.sm, yy - stackH - SPACING.md);
    const fade = Math.min(1, Math.max(0, (yy - (tops.full + 60)) / Math.max(1, tops.half - tops.full - 60)));
    return { transform: [{ translateY: lift }], opacity: fade };
  });

  // ---------------------------------------------------------------------------
  // I'm going, from the card.
  // ---------------------------------------------------------------------------
  const [joining, setJoining] = useState<string | null>(null);
  const [bringFor, setBringFor] = useState<EventView | null>(null);
  async function go(v: EventView, buildId?: string, passenger = false) {
    setBringFor(null);
    setJoining(v.event.id);
    try {
      const res = await store.setGoing(v.event.id, true, buildId);
      const b = myBuilds.find((x) => x.id === buildId);
      toast({
        message: res === 'requested' ? 'Asked the host. You’ll hear when they say yes.' : b ? `You're going with your ${shortBuildName(b)}` : passenger ? "You're going as a passenger" : "You're going",
        action: res !== 'requested' && myBuilds.length > 0 ? { label: 'Change', onPress: () => setBringFor(v) } : undefined,
      });
    } catch (e) {
      setLocNote(e instanceof Error ? e.message : "Couldn't do that just now.");
    } finally {
      setJoining(null);
    }
  }
  function imGoing(v: EventView) {
    if (myBuilds.length === 1) return go(v, myBuilds[0].id);
    setBringFor(v);
  }
  const openEvent = (id: string) => router.push({ pathname: '/event/[id]', params: { id } });

  /** The card for an event in the sheet's top: the pick or a tapped pin. Going: Open. */
  function eventCard(v: EventView, closable: boolean) {
    const e = v.event;
    const going = v.role === 'going' || v.role === 'host';
    const ref = eventPhotoRef(e, builds);
    const canGo = canJoinDirectly(v.role) && !going;
    return (
      <PhotoCard
        kind="event"
        aspect={PEEK_ASPECT}
        photo={ref ? photoSource(ref) : null}
        titleOnPhoto
        eyebrow={EVENT_LABELS[e.type]}
        layerColour={EVENT_COLOURS[e.type]}
        live={v.phase === 'live'}
        title={e.title}
        tag={roleTag(v.role, e.filter) ?? null}
        meta={metaLine([cardTime(e, now), cardDistance(v, milesTo(v), fromHome), `${e.going.length} going`])}
        detail={notOpenLine(v)}
        onPress={() => openEvent(e.id)}
        overlay={
          closable ? (
            <View style={st.closeOnPhoto}>
              <IconButton icon="close" label="Close" variant="glass" onPress={close} />
            </View>
          ) : ref ? (
            <PhotoCredit photoRef={ref} overlay corner="topRight" />
          ) : undefined
        }
        action={
          canGo
            ? { label: "I'm going", tier: 'primary', haptic: 'success', busy: joining === e.id, onPress: () => imGoing(v) }
            : { label: 'Open', tier: 'secondary', onPress: () => openEvent(e.id) }
        }
      />
    );
  }

  function selectionCard(id: string): ReactNode {
    const key = id.slice(id.indexOf(':') + 1);
    if (id.startsWith('ev:')) {
      const v = views.find((x) => x.event.id === key);
      return v ? eventCard(v, true) : null;
    }
    if (id.startsWith('sp:')) {
      const s = places.find((x) => x.id === key);
      if (!s) return null;
      const ref = s.photo ?? sampleRef(s.id);
      return (
        <PhotoCard
          kind="place"
          aspect={PEEK_ASPECT}
          photo={ref ? photoSource(ref) : null}
          titleOnPhoto
          eyebrow={PLACE_NAMES[s.kind].one}
          layerColour={SPOT_COLOURS[s.kind]}
          title={s.name}
          meta={metaLine([s.kind === 'drive' && s.miles ? `${s.miles} mi drive` : null, s.region, distanceText(milesBetween(origin, s.at), fromHome ? 'home' : 'you')])}
          overlay={
            <View style={st.closeOnPhoto}>
              <IconButton icon="close" label="Close" variant="glass" onPress={close} />
            </View>
          }
          onPress={() => router.push({ pathname: '/spot/[id]', params: { id: s.id } })}
          action={{ label: 'Open', onPress: () => router.push({ pathname: '/spot/[id]', params: { id: s.id } }) }}
        />
      );
    }
    if (id.startsWith('post:')) {
      const p = postPins.find((x) => x.id === key);
      if (!p) return null;
      const who = users.find((u) => u.id === p.authorId);
      return (
        <PhotoCard
          kind="place"
          aspect={PEEK_ASPECT}
          photo={p.photo ? photoSource(p.photo) : null}
          titleOnPhoto
          eyebrow="Post"
          layerColour={POST_COLOUR}
          title={p.placeName ?? 'A post'}
          meta={who ? `@${who.handle}` : undefined}
          overlay={
            <View style={st.closeOnPhoto}>
              <IconButton icon="close" label="Close" variant="glass" onPress={close} />
            </View>
          }
          onPress={() => router.push({ pathname: '/post/[id]', params: { id: p.id } })}
          action={{ label: 'Open', onPress: () => router.push({ pathname: '/post/[id]', params: { id: p.id } }) }}
        />
      );
    }
    return null;
  }

  const selCard = selected ? selectionCard(selected) : null;
  const noCar = ready && myBuilds.length === 0;
  const nothingOn = ready && views.length === 0;

  // ---------------------------------------------------------------------------
  // The sections (the list, and the sheet drawn up).
  // ---------------------------------------------------------------------------
  const skip = mode === 'map' && !selCard && pick ? pick.event.id : null;
  function sections(onOpen: (v: EventView) => void) {
    const live = lists.live.filter((v) => v.event.id !== skip);
    const tonight = lists.tonight.filter((v) => v.event.id !== skip);
    const week = lists.week.filter((v) => v.event.id !== skip);
    const later = lists.later.filter((v) => v.event.id !== skip);
    let i = 0;
    return (
      <>
        {noCar ? (
          <ListRow leading={{ icon: 'plus' }} title="Add your car to see what you can join" chevron onPress={() => router.push('/build/edit')} />
        ) : null}
        {live.length ? (
          <Section title="Live now">
            {live.map((v) => (
              <FadeUp key={v.event.id} index={i++}>
                <EventEntityCard view={v} now={now} builds={builds} miles={milesTo(v)} milesFrom={fromHome ? ' from home' : ''} onPress={() => onOpen(v)} />
              </FadeUp>
            ))}
          </Section>
        ) : null}
        {tonight.length ? (
          <Section title="Tonight">
            {tonight.map((v) => (
              <FadeUp key={v.event.id} index={i++}>
                <EventEntityCard view={v} now={now} builds={builds} miles={milesTo(v)} milesFrom={fromHome ? ' from home' : ''} onPress={() => onOpen(v)} />
              </FadeUp>
            ))}
          </Section>
        ) : null}
        {week.length ? (
          <Section title="This week">
            <View>
              {week.map((v, n) => (
                <View key={v.event.id}>
                  {n > 0 ? <RowDivider inset /> : null}
                  <EventRow view={v} now={now} miles={milesTo(v)} milesFrom={fromHome ? ' from home' : ''} onPress={() => onOpen(v)} />
                </View>
              ))}
            </View>
          </Section>
        ) : null}
        {later.length ? (
          <Section title="Later" right={later.length > 5 && mode === 'map' ? <Tag label={`${later.length}`} /> : undefined}>
            <View>
              {later.slice(0, mode === 'list' ? later.length : 5).map((v, n) => (
                <View key={v.event.id}>
                  {n > 0 ? <RowDivider inset /> : null}
                  <EventRow view={v} now={now} miles={milesTo(v)} milesFrom={fromHome ? ' from home' : ''} onPress={() => onOpen(v)} />
                </View>
              ))}
            </View>
          </Section>
        ) : null}
        {nothingOn ? <EmptyState variant="inline" title="Nothing on near you yet." action={{ label: 'Host a meet', onPress: () => router.push('/event/new') }} /> : null}
      </>
    );
  }

  const listBody = (
    <ScrollView contentContainerStyle={st.list} keyboardShouldPersistTaps="handled">
      {sections((v) => openEvent(v.event.id))}
    </ScrollView>
  );

  const sheetHeader = (
    <View style={st.header}>
      {selCard ?? (pick ? eventCard(pick, false) : ready ? <EmptyState variant="inline" title="Nothing on near you tonight." action={{ label: 'Host a meet', onPress: () => router.push('/event/new') }} /> : null)}
    </View>
  );

  // Toasts sit just above the sheet's peek (or the tab bar in the list), never over I'm going.
  const anchorHeight = focused && mode === 'map' && box.h ? peek + TAB_BAR_HEIGHT + insets.bottom : null;

  return (
    <View style={{ flex: 1, backgroundColor: COLOR.surface.bg }}>
      <View style={[st.top, { paddingTop: insets.top }]}>
        <ScreenHeader title="Tonight"
          tag={
            demo ? (
              <Press onPress={() => setDemoInfo(true)} label={`${DEMO_NIGHT.tag}: what this means`} role="button" style={{ minHeight: 44, justifyContent: 'center' }}>
                <Tag label={DEMO_NIGHT.tag} tone="info" />
              </Press>
            ) : undefined
          }
          add={{ label: 'Host a meet', onPress: () => router.push('/event/new') }}
          bell
        />
        <View style={st.searchRow}>
          <View style={{ flex: 1 }}>
            <SearchField onOpen={() => router.push('/search')} placeholder="Search meets, places…" accessibilityLabel="Search meets, places, people and addresses" />
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
            polygons={[]}
            centre={view?.centre ?? meUser?.home ?? START}
            span={view?.span ?? START_SPAN}
            onRegion={setRegion}
            recentreKey={view?.key ?? 0}
            onSelect={onSelectPin}
            onPressMap={onMapPress}
            showsUser={located}
            compass={COMPASS}
          />

          {box.h ? (
            <Animated.View style={[st.stack, stackStyle]} pointerEvents={detent !== 'full' ? 'box-none' : 'none'} onLayout={(e) => setStackH(e.nativeEvent.layout.height)}>
              <MapWidgetSlot />
              <View style={st.stackGroup}>
                <Press onPress={() => setShowLayers(true)} haptic="tap" label={`Map layers${layersOn ? `, ${layersOn} on` : ''}`} style={[st.mapButton, layersOn > 0 && { backgroundColor: COLOR.surface.raised }]}>
                  <LayersIcon colour={layersOn > 0 ? COLOR.text.primary : COLOR.text.secondary} />
                </Press>
                <View style={st.stackRule} />
                <Press onPress={() => locate(true, true)} haptic="tap" label="Show where I am" style={st.mapButton}>
                  <Pin glyph="you" colour={located ? COLOR.text.primary : COLOR.text.secondary} size={26} />
                </Press>
              </View>
            </Animated.View>
          ) : null}

          {box.h ? (
            <MapSheet
              y={sheetY}
              height={box.h}
              top={sheetTop}
              peek={peek}
              detent={detent}
              onDetent={setDetent}
              label="Tonight near you"
              onHeaderLayout={setHeaderH}
              header={sheetHeader}
              toastAnchor={anchorHeight}
            >
              {locNote ? (
                <View style={{ gap: SPACING.xs }} accessibilityLiveRegion="polite">
                  <DsText v="secondary">{locNote}</DsText>
                </View>
              ) : null}
              {selCard ? null : sections((v) => show(`ev:${v.event.id}`))}
            </MapSheet>
          ) : null}
        </View>
      )}

      <LayersPanel visible={showLayers} onClose={() => setShowLayers(false)} on={layers} onToggle={(k) => setSettings(toggledLayer(settings, k))} />

      <BringSheet
        visible={!!bringFor}
        builds={myBuilds}
        picked={undefined}
        fits={() => true}
        onPick={(id) => bringFor && go(bringFor, id)}
        onAddCar={() => {
          setBringFor(null);
          router.push('/build/edit');
        }}
        onPassenger={() => bringFor && go(bringFor, undefined, true)}
        onClose={() => setBringFor(null)}
      />

      <Sheet visible={demoInfo} title={DEMO_NIGHT.title} onClose={() => setDemoInfo(false)}>
        <DsText v="body">{DEMO_NIGHT.body}</DsText>
      </Sheet>
    </View>
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
  header: { paddingHorizontal: SPACING.screen, paddingBottom: SPACING.md },
  closeOnPhoto: { position: 'absolute', top: SPACING.xs, right: SPACING.xs },
});
