import { router } from 'expo-router';
import { areaRadius } from '../../lib/area';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PulseRing } from '../../components/motion';
import { Pin, type Glyph } from '../../components/Pin';
import { LayerBar } from '../../components/LayerBar';
import { UNVETTED_PHOTO_SPOTS } from '../../data/photoVetting';
import { feel } from '../../lib/feel';
import { BAN_ZONES } from '../../data/seed';
import { NightMap } from '../../components/NightMap';
import type { MapCircle, MapPath, MapPin, MapRegion, NightMapHandle } from '../../components/mapTypes';
import { NoticeBell } from '../../components/NoticeBell';
import { Row, Txt } from '../../components/ui';
import { EVENT_LABELS } from '../../lib/events';
import { viewEvents, type EventView } from '../../lib/eventView';
import { describeFilter } from '../../lib/invites';
import { plural } from '../../lib/format';
import { eventClock, mapHud, orderPins, unlocksIn } from '../../lib/hud';
import { fitRegion } from '../../lib/geo';
import { currentPosition } from '../../lib/location';
import type { LatLng } from '../../lib/types';
import { averageStars, visibleSpots } from '../../lib/spots';
import { driveTier } from '../../lib/rep';
import { cameraIndex } from '../../lib/cameraData';
import { CAMERA_CAVEAT, CAMERA_CREDIT, cameraPinSize, camerasForView, describeCamera, describeZone } from '../../lib/cameras';
import { ALL_VEHICLES, matchesVehicles, outlinesInView } from '../../lib/tracks';
import { VEHICLE_LABELS, type TrackVehicle } from '../../lib/laptimes';
import { useStore } from '../../lib/store';
import { useNow } from '../../lib/clock';
import { shopIndex } from '../../lib/shopData';
import { describeCategories, SHOP_CREDIT, shopPinSize, shopsForView, toggleCategory, type ShopFilter } from '../../lib/shops';
import { ALL_CATEGORIES, CATEGORY_HINTS, CATEGORY_LABELS, MENU_ORDER, shopFilterNote, type ShopCategory } from '../../lib/shopCategories';
import { parseOpeningHours, openState } from '../../lib/openingHours';
import { demoPartners, partnerBadge } from '../../lib/partners';
import { DEMO_PARTNERS, PARTNERS } from '../../data/partners';
import { milesBetween } from '../../lib/geo';
import { C, EVENT_COLOURS, F, PARTNER_COLOUR, SHOP_COLOUR, SPOT_COLOURS } from '../../theme';

type Layer = 'events' | 'photo' | 'drive' | 'track' | 'venue' | 'shops' | 'bans' | 'cameras';
/** The layer bar, in order. Add a layer here (and to `shown` below) to give it a pill. */
const LAYERS: { key: Layer; label: string; glyph: Glyph; colour: string }[] = [
  { key: 'events', label: 'Events', glyph: 'meet', colour: C.sodium },
  { key: 'photo', label: 'Photos', glyph: 'photo', colour: C.magenta },
  { key: 'drive', label: 'Drives', glyph: 'drive', colour: C.neon },
  { key: 'track', label: 'Tracks', glyph: 'track', colour: C.lime },
  { key: 'venue', label: 'Venues', glyph: 'venue', colour: C.sodium },
  // Kept in settings, with its filter (Shops ▾).
  { key: 'shops', label: 'Shops', glyph: 'shop', colour: SHOP_COLOUR },
  { key: 'bans', label: 'Bans', glyph: 'area', colour: C.alert },
  // Kept in settings (Me > Map), so it stays as you left it.
  { key: 'cameras', label: 'Cameras', glyph: 'camera', colour: C.alert },
];

/** What the card at the bottom shows for the tapped pin. Cameras have nothing to open. */
interface Selection {
  title: string;
  meta: string;
  body: string;
  colour: string;
  open?: () => void;
  cta?: string;
}

const START = { lat: 52.7, lng: -1.7 };
const START_SPAN = 1.4;

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const store = useStore();
  const { events, me, crews, users, builds, spots, nearby, settings, setSettings } = store;
  const now = useNow();
  const newNear = nearby?.unseen.length ?? 0;
  const [shown, setLayers] = useState<Record<Exclude<Layer, 'cameras' | 'shops'>, boolean>>({ events: true, photo: true, drive: true, track: true, venue: true, bans: false });
  const layers: Record<Layer, boolean> = { ...shown, cameras: settings.cameras, shops: !!settings.shops };
  function toggleLayer(key: Layer) {
    if (key === 'cameras') setSettings({ cameras: !settings.cameras });
    else if (key === 'shops') setSettings({ shops: !settings.shops });
    else setLayers((x) => ({ ...x, [key]: !x[key] }));
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
  const [region, setRegion] = useState<MapRegion>({ centre: meUser?.home ?? START, span: START_SPAN });
  /** Tracks: which vehicles to show circuits for (Cars, Bikes, Karts; any mix), kept in settings. */
  const trackKinds: TrackVehicle[] = settings.trackVehicles?.length ? settings.trackVehicles : ALL_VEHICLES;
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
        (s) => (s.kind !== 'track' || matchesVehicles(s, trackKinds)) && !(s.kind === 'photo' && UNVETTED_PHOTO_SPOTS.has(s.id)),
      ),
    [spots, me, trackKinds],
  );
  const hasVenues = places.some((x) => x.kind === 'venue');
  // Meet-friendly venues count as "Coffee & meet spots" on the Shops layer, so they show with it even with Venues off.
  const venuesViaShops = layers.shops && !shopFilter.partnersOnly && shopFilter.categories.includes('coffee');

  // Follow the person: ask for when-in-use location the first time, then centre on them.
  const map = useRef<NightMapHandle>(null);
  const [located, setLocated] = useState(false);
  const [locNote, setLocNote] = useState<string | null>(null);
  const { ready, locationNoticeSeen, markLocationNoticeSeen } = store;
  async function locate(ask: boolean, explicit: boolean) {
    const pos = await currentPosition(ask);
    if (pos.ok) {
      setLocated(true);
      setLocNote(null);
      map.current?.animateTo(pos.at, 0.35);
      return;
    }
    setLocated(false);
    // Say so once (or whenever the locate button is tapped), then quietly stay on the home area.
    if (explicit || !locationNoticeSeen) {
      setLocNote(
        pos.reason === 'denied'
          ? "Location is off for Nightshift, so the map shows your home area. Turn it on in Settings to see where you are and check in."
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

  const views = useMemo(
    () => viewEvents(events, me, crews, users, builds, now).filter((v) => v.phase !== 'over' && v.phase !== 'cancelled' && v.role !== 'declined'),
    [events, me, crews, users, builds, now],
  );

  const cams = useMemo(
    () => (layers.cameras ? camerasForView(cameraIndex(), region.centre, region.span) : null),
    [layers.cameras, region],
  );

  /** Partners: the production list (empty until the backend) and the labelled demo samples near home. */
  const partners = useMemo(() => [...PARTNERS, ...demoPartners(DEMO_PARTNERS, meUser?.home)], [meUser?.home]);
  const shopView = useMemo(() => {
    if (!layers.shops) return null;
    const v = shopsForView(shopIndex(), region.centre, region.span, shopFilter, partners);
    // A venue's own pin replaces the OpenStreetMap café under it.
    const venues = venuesViaShops || layers.venue ? places.filter((p) => p.kind === 'venue') : [];
    return { ...v, shops: v.shops.filter((s) => !(s.categories[0] === 'coffee' && venues.some((p) => milesBetween(p.at, s.at) < 0.12))) };
  }, [layers.shops, layers.venue, region, shopFilter, partners, venuesViaShops, places]);

  const { pins, paths, circles } = useMemo(() => {
    const pins: MapPin[] = [];
    const paths: MapPath[] = [];
    const circles: MapCircle[] = [];
    // Speed cameras first: they draw under everything else.
    if (cams) {
      for (const z of cams.zones) {
        paths.push({ id: `az:${z.id}`, coords: z.path, colour: C.alert, dashed: true, width: 1.5 });
        // An "average speed" camera at each end of the zone; the line between follows the road.
        const ends = [z.path[0], z.path[z.path.length - 1]];
        ends.forEach((at, i) =>
          pins.push({ id: `avg:${z.id}:${i}`, at, glyph: 'average', colour: C.alert, title: describeZone(z), size: cameraPinSize(region.span) + 3 }),
        );
      }
      for (const c of cams.cameras)
        pins.push({ id: `cam:${c.id}`, at: c.at, glyph: 'camera', colour: C.alert, title: describeCamera(c), size: cameraPinSize(region.span) });
    }
    if (shopView) {
      for (const s of shopView.shops) pins.push({ id: `shop:${s.id}`, at: s.at, glyph: s.categories[0] ?? 'shop', colour: SHOP_COLOUR, title: s.name, size: shopPinSize(region.span) });
      for (const p of shopView.partners) pins.push({ id: `ptn:${p.id}`, at: p.at, glyph: 'partner', colour: PARTNER_COLOUR, title: `${p.name} (${partnerBadge(p)})`, size: 30 });
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
          const what = v.role === 'requested' ? 'requested, location locked' : 'location locked';
          pins.push({ id: `ev:${e.id}`, at: e.area, glyph: 'locked', colour, title: `${e.title} (${what})`, size: 34 });
        }
      }
    }
    for (const s of places) {
      if (!layers[s.kind] && !(s.kind === 'venue' && venuesViaShops)) continue;
      const colour = s.status === 'pending' ? C.fog : SPOT_COLOURS[s.kind];
      pins.push({ id: `sp:${s.id}`, at: s.at, glyph: s.kind, colour, title: s.name, size: 32 });
      if (s.path) paths.push({ id: `pa:${s.id}`, coords: s.path, colour, dashed: s.status === 'pending' });
    }
    if (layers.bans) for (const z of BAN_ZONES) circles.push({ id: `bz:${z.id}`, centre: z.centre, radiusMiles: z.radiusMiles, colour: C.alert });
    return { pins: orderPins(pins), paths, circles };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [views, shown, places, cams, region, shopView, venuesViaShops]);

  const sel = selected ? describeSelection(selected) : null;

  function describeSelection(id: string): Selection | null {
    const kind = id.slice(0, id.indexOf(':'));
    const key = id.slice(id.indexOf(':') + 1);
    if (kind === 'cam' || kind === 'avg') {
      const pin = pins.find((p) => p.id === id);
      if (!pin) return null;
      const [what, ...rest] = pin.title.split(' · ');
      return { title: what, meta: rest.join(' · '), body: `${CAMERA_CAVEAT}\n${CAMERA_CREDIT}.`, colour: C.alert };
    }
    if (kind === 'shop') {
      const s = shopIndex().find(key);
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
            ? `${e.areaName} · location locked · you asked to go, waiting for a host`
            : `${e.areaName} · location locked`;
      const clock = eventClock(v, now);
      return {
        title: e.title,
        meta: `${EVENT_LABELS[e.type]} · ${clock.label} ${clock.value} · ${e.going.length} going`,
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
        (s.kind === 'drive' ? `Drive · ${s.miles} mi · ${driveTier(s.miles).label} · +${driveTier(s.miles).rep} rep · untimed` : s.kind === 'track' ? 'Track' : s.kind === 'venue' ? 'Venue' : 'Photo spot') +
        (s.region ? ` · ${s.region}` : '') + stars + status,
      body: s.description,
      colour: SPOT_COLOURS[s.kind],
      open: () => router.push({ pathname: '/spot/[id]', params: { id: s.id } }),
      cta: s.kind === 'drive' ? 'Open drive ›' : s.kind === 'photo' ? 'Open photo spot ›' : s.kind === 'venue' ? 'Open venue ›' : 'Open track ›',
    };
  }

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
  const lead = hud.live[0] ?? hud.next;
  const after = hud.live[0] ? hud.next : null;

  return (
    <View style={{ flex: 1, backgroundColor: C.asphalt }}>
      <NightMap
        ref={map}
        pins={pins}
        paths={paths}
        circles={circles}
        centre={view?.centre ?? meUser?.home ?? START}
        span={view?.span ?? START_SPAN}
        onRegion={setRegion}
        recentreKey={view?.key ?? 0}
        onSelect={setSelected}
        onPressMap={() => setSelected(null)}
        showsUser={located}
      />
      <View style={[st.hud, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
        <Row style={{ justifyContent: 'space-between' }}>
          <View style={st.brand}>
            <Txt v="h3" style={{ fontFamily: F.displayMedItalic }}>
              NIGHT<Txt v="h3" style={{ color: C.sodium, fontFamily: F.displayMedItalic }}>SHIFT</Txt>
            </Txt>
          </View>
          <Row gap={8} style={{ flexWrap: 'nowrap' }}>
            {liveCount > 0 ? (
              <Pressable
                onPress={focusLive}
                style={({ pressed }) => [st.live, pressed && { opacity: 0.8 }]}
                accessibilityRole="button"
                accessibilityLabel={`${plural(liveCount, 'event')} live now. Show on the map`}
                hitSlop={6}
              >
                <View style={st.liveDot} />
                <Txt v="label" style={{ color: '#00222c' }}>{liveCount} live now</Txt>
              </Pressable>
            ) : null}
            <NoticeBell boxed />
          </Row>
        </Row>
        <LayerBar
          onToggle={(key) => {
            setKindMenu(null);
            toggleLayer(key as Layer);
          }}
          layers={LAYERS.filter((l) => l.key !== 'venue' || hasVenues).map((l) => ({
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
              : l.key === 'shops'
                ? {
                    note: shopFilterNote(shopFilter.categories, shopFilter.partnersOnly),
                    menu: (anchor: { x: number; y: number }) => setKindMenu((m) => (m ? null : { which: 'shops', ...anchor })),
                  }
                : {}),
          }))}
          actions={[
            { key: 'find', label: newNear > 0 ? `Find events · ${newNear} new` : 'Find events', colour: C.lime, onPress: () => router.push('/find') },
            {
              key: 'fit',
              label: 'Show everything',
              colour: C.chalk,
              onPress: () => {
                // Everything you can open: cameras and shop listings are background, so they don't count.
                const r = fitRegion(pins.filter((p) => p.glyph !== 'camera' && p.glyph !== 'average' && !p.id.startsWith('shop:') && !p.id.startsWith('ptn:')).map((p) => p.at));
                if (r) setView((v) => ({ ...r, key: (v?.key ?? 0) + 1 }));
              },
            },
            { key: 'suggest', label: '+ Suggest a place', colour: C.chalk, onPress: () => router.push('/spot/new') },
          ]}
        />
        <Row style={{ justifyContent: 'space-between', flexWrap: 'nowrap', alignItems: 'flex-start' }}>
          {cams || shopView ? (
            <View style={st.credit} pointerEvents="none">
              {cams ? (
                <Txt v="mono" style={{ fontSize: 10, color: cams.tooWide ? C.chalk : C.fog }}>
                  {cams.tooWide ? 'ZOOM IN TO SEE SPEED CAMERAS' : `${CAMERA_CREDIT} · may be incomplete`}
                </Txt>
              ) : null}
              {shopView ? (
                <Txt v="mono" style={{ fontSize: 10, color: shopView.tooWide ? C.chalk : C.fog }}>
                  {shopView.tooWide
                    ? 'ZOOM IN TO SEE SHOPS'
                    : shopFilter.partnersOnly
                      ? `PARTNERS ONLY · ${shopView.partners.length} HERE`
                      : `${SHOP_CREDIT}${shopView.more ? ' · nearest shown, zoom in for more' : ''}`}
                </Txt>
              ) : null}
            </View>
          ) : <View />}
          <Pressable
            onPress={() => locate(true, true)}
            style={({ pressed }) => [st.locate, pressed && { opacity: 0.8 }]}
            accessibilityRole="button"
            accessibilityLabel="Show where I am"
            hitSlop={6}
          >
            <Pin glyph="you" colour={located ? C.neon : C.fog} size={26} />
          </Pressable>
        </Row>
        {locNote ? (
          <View style={st.note}>
            <Txt v="muted" style={{ color: C.chalk }}>{locNote}</Txt>
            <Row gap={14}>
              {Platform.OS !== 'web' ? (
                <Pressable onPress={() => Linking.openSettings().catch(() => {})} accessibilityRole="button" hitSlop={8}>
                  <Txt v="label" style={{ color: C.sodium }}>Open Settings</Txt>
                </Pressable>
              ) : null}
              <Pressable onPress={() => setLocNote(null)} accessibilityRole="button" hitSlop={8}>
                <Txt v="label">OK</Txt>
              </Pressable>
            </Row>
          </View>
        ) : null}
      </View>
      {sel ? (
        <Pressable style={[st.peek, { borderLeftColor: sel.colour }]} onPress={sel.open} disabled={!sel.open} accessibilityRole={sel.open ? 'button' : 'summary'}>
          <Row style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
            <Txt v="h3" style={{ flex: 1 }} numberOfLines={1}>{sel.title}</Txt>
            <Pressable onPress={() => setSelected(null)} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close">
              <Txt v="label">Close</Txt>
            </Pressable>
          </Row>
          <Txt v="mono" style={{ color: sel.colour }}>{sel.meta.toUpperCase()}</Txt>
          <Txt v="muted">{sel.body}</Txt>
          {sel.cta ? (
            <View style={[st.cta, { borderColor: sel.colour }]}>
              <Txt v="label" style={{ color: sel.colour }}>{sel.cta}</Txt>
            </View>
          ) : null}
        </Pressable>
      ) : lead ? (
        <NextUp lead={lead} after={after} tonight={hud.tonight} now={now} />
      ) : null}
      {kindMenu?.which === 'shops' ? (
        <>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setKindMenu(null)} accessibilityLabel="Close the menu" />
          <View style={[st.menu, { left: Math.max(8, Math.min(kindMenu.x, screen.width - 262)), top: kindMenu.y, width: 254 }]} accessibilityRole="menu">
            <Row style={{ justifyContent: 'space-between' }}>
              <Txt v="label" style={{ fontSize: 10 }}>Show shops</Txt>
              {shopFilter.categories.length < ALL_CATEGORIES.length ? (
                <Pressable
                  onPress={() => {
                    feel.select();
                    setSettings({ shopCategories: [...ALL_CATEGORIES] });
                  }}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Show all kinds of shop"
                >
                  <Txt v="label" style={{ fontSize: 10, color: SHOP_COLOUR }}>Show all</Txt>
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
                  style={({ pressed }) => [st.menuRow, { paddingVertical: 5 }, pressed && { opacity: 0.7 }]}
                >
                  <View style={[st.box, on && { backgroundColor: SHOP_COLOUR, borderColor: SHOP_COLOUR }]}>{on ? <Txt v="label" style={{ color: C.asphalt, fontSize: 11, lineHeight: 14 }}>✓</Txt> : null}</View>
                  <Pin glyph={c} colour={on ? SHOP_COLOUR : C.fog} size={18} />
                  <Txt style={{ color: on ? C.chalk : C.fog, fontSize: 14, flexShrink: 1 }} numberOfLines={1}>{CATEGORY_LABELS[c]}</Txt>
                </Pressable>
              );
            })}
            <View style={{ height: 1, backgroundColor: C.kerb, marginVertical: 4 }} />
            <Pressable
              onPress={() => {
                feel.select();
                setSettings({ shopPartnersOnly: !shopFilter.partnersOnly });
              }}
              accessibilityRole="switch"
              accessibilityState={{ checked: shopFilter.partnersOnly }}
              style={({ pressed }) => [st.menuRow, { paddingVertical: 5 }, pressed && { opacity: 0.7 }]}
            >
              <View style={[st.box, shopFilter.partnersOnly && { backgroundColor: PARTNER_COLOUR, borderColor: PARTNER_COLOUR }]}>
                {shopFilter.partnersOnly ? <Txt v="label" style={{ color: C.asphalt, fontSize: 11, lineHeight: 14 }}>✓</Txt> : null}
              </View>
              <Pin glyph="partner" colour={shopFilter.partnersOnly ? PARTNER_COLOUR : C.fog} size={18} />
              <Txt style={{ color: shopFilter.partnersOnly ? C.chalk : C.fog, fontSize: 14 }}>Partners only</Txt>
            </Pressable>
            <Txt v="muted" style={{ fontSize: 11, lineHeight: 14 }}>Partners pay to be highlighted and are always marked Partner. Other listings come from OpenStreetMap.</Txt>
          </View>
        </>
      ) : kindMenu ? (
        <>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setKindMenu(null)} accessibilityLabel="Close the menu" />
          <View style={[st.menu, { left: Math.max(8, Math.min(kindMenu.x, screen.width - 158)), top: kindMenu.y }]} accessibilityRole="menu">
            <Txt v="label" style={{ fontSize: 10 }}>Show tracks for</Txt>
            {ALL_VEHICLES.map((v) => {
              const on = trackKinds.includes(v);
              return (
                <Pressable
                  key={v}
                  onPress={() => toggleKind(v)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  style={({ pressed }) => [st.menuRow, pressed && { opacity: 0.7 }]}
                >
                  <View style={[st.box, on && { backgroundColor: C.lime, borderColor: C.lime }]}>{on ? <Txt v="label" style={{ color: C.asphalt, fontSize: 11, lineHeight: 14 }}>✓</Txt> : null}</View>
                  <Txt style={{ color: on ? C.chalk : C.fog }}>{VEHICLE_LABELS[v]}</Txt>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : null}
    </View>
  );
}

/** The bottom HUD card: what's on now, or the next thing you're part of, with a countdown. */
function NextUp({ lead, after, tonight, now }: { lead: EventView; after: EventView | null; tonight: number; now: Date }) {
  const e = lead.event;
  const colour = EVENT_COLOURS[e.type];
  const clock = eventClock(lead, now);
  const locked = unlocksIn(lead, now);
  const role = lead.role === 'host' ? 'You host' : lead.role === 'going' ? "You're going" : lead.role === 'requested' ? 'Asked to go' : lead.role === 'invited' ? 'Invited' : 'Open to all';
  const open = (id: string) => router.push({ pathname: '/event/[id]', params: { id } });
  return (
    <View style={[st.next, { borderLeftColor: clock.live ? C.neon : colour }]}>
      <Pressable
        onPress={() => open(e.id)}
        accessibilityRole="button"
        accessibilityLabel={`${clock.live ? 'Live now' : 'Next up'}: ${e.title}, ${clock.label} ${clock.value}. Open event`}
        style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 12 }, pressed && { opacity: 0.8 }]}
      >
        <PulseRing live={clock.live} colour={colour} size={38}>
          <Pin glyph={lead.shownStop >= 0 ? e.type : 'locked'} colour={colour} size={38} />
        </PulseRing>
        <View style={{ flex: 1, gap: 1 }}>
          <Txt v="eyebrow" style={{ color: clock.live ? C.neon : colour, fontSize: 11 }}>
            {clock.live ? 'Live now' : 'Next up'} · {EVENT_LABELS[e.type]}
          </Txt>
          <Txt v="h3" numberOfLines={1}>{e.title}</Txt>
          <Txt v="mono" numberOfLines={1}>
            {role.toUpperCase()} · {e.going.length} GOING{locked ? ` · UNLOCKS IN ${locked.toUpperCase()}` : ''}
          </Txt>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Txt v="label" style={{ fontSize: 10 }}>{clock.live ? 'Ends in' : 'Starts in'}</Txt>
          <Txt v="h2" style={{ color: clock.live ? C.neon : C.chalk, fontVariant: ['tabular-nums'], textTransform: 'none' }}>{clock.value}</Txt>
        </View>
      </Pressable>
      {after || tonight > 1 ? (
        <View style={st.nextFoot}>
          {after ? (
            <Pressable onPress={() => open(after.event.id)} accessibilityRole="button" hitSlop={6} style={{ flex: 1 }}>
              <Txt v="mono" numberOfLines={1}>
                THEN <Txt v="mono" style={{ color: C.chalk }}>{after.event.title.toUpperCase()}</Txt> · {eventClock(after, now).value.toUpperCase()}
              </Txt>
            </Pressable>
          ) : <View style={{ flex: 1 }} />}
          {tonight > 1 ? <Txt v="mono" style={{ color: C.sodium }}>{tonight} IN THE NEXT 12H</Txt> : null}
        </View>
      ) : null}
    </View>
  );
}

const st = StyleSheet.create({
  hud: { position: 'absolute', left: 0, right: 0, top: 0, paddingHorizontal: 14 },
  brand: { backgroundColor: 'rgba(11,15,23,0.88)', borderColor: C.kerb, borderWidth: 1, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6 },
  live: { backgroundColor: C.neon, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#00222c' },
  cta: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 4, paddingHorizontal: 10, paddingVertical: 5, marginTop: 2 },
  next: {
    position: 'absolute', left: 12, right: 12, bottom: 12, backgroundColor: 'rgba(19,26,38,0.96)', borderColor: C.kerb, borderWidth: 1,
    borderLeftWidth: 3, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, gap: 8,
  },
  nextFoot: { flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: 1, borderTopColor: C.kerb, paddingTop: 7 },
  locate: {
    backgroundColor: 'rgba(11,15,23,0.92)', borderColor: C.kerb, borderWidth: 1, borderRadius: 6, width: 44, height: 44,
    alignItems: 'center', justifyContent: 'center',
  },
  note: { backgroundColor: 'rgba(19,26,38,0.97)', borderColor: C.kerb, borderWidth: 1, borderRadius: 8, padding: 12, gap: 8, marginTop: 8 },
  menu: {
    position: 'absolute', backgroundColor: 'rgba(19,26,38,0.98)', borderColor: C.kerb, borderWidth: 1, borderRadius: 6,
    paddingHorizontal: 10, paddingVertical: 8, gap: 2, minWidth: 140,
  },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 },
  box: { width: 18, height: 18, borderRadius: 3, borderWidth: 1.5, borderColor: C.fog, alignItems: 'center', justifyContent: 'center' },
  credit: {
    backgroundColor: 'rgba(11,15,23,0.85)', borderColor: C.kerb, borderWidth: 1, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 3,
    flexShrink: 1, marginRight: 8, marginTop: 2,
  },
  peek: {
    position: 'absolute', left: 12, right: 12, bottom: 12, backgroundColor: 'rgba(19,26,38,0.97)', borderColor: C.kerb, borderWidth: 1,
    borderLeftWidth: 3, borderRadius: 8, padding: 14, gap: 6,
  },
});
