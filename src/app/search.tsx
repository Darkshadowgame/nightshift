import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, ScrollView, StyleSheet, View } from 'react-native';
import {
  Button,
  ChipGroup,
  ChoiceGroup,
  DsText,
  EmptyState,
  ErrorState,
  ListRow,
  LoadingState,
  SearchField,
  Section,
  SegmentedControl,
  Sheet,
  Tag,
  metaLine,
} from '../components/ds';
import { EventRow } from '../components/EventRow';
import { NavLaunch } from '../components/NavLaunch';
import { NightMap } from '../components/NightMap';
import { classOf } from '../lib/classes';
import { useNow } from '../lib/clock';
import { useCommunity } from '../lib/communityStore';
import { powerText } from '../lib/dyno';
import { idsIn } from '../lib/connections';
import { ALL_TYPES, defaultFilters, describeFilters, searchEvents, travelOf, TRAVEL_CHOICES, VEHICLE_LABELS, WHEN_LABELS, type SearchFilters, type SearchHit, type Vehicles, type When } from '../lib/discover';
import { EVENT_LABELS } from '../lib/events';
import { viewEvent } from '../lib/eventView';
import { distanceOrigin, distanceText, plural } from '../lib/format';
import { milesBetween } from '../lib/geo';
import { PLACE_NAMES } from '../lib/glossary';
import { currentPosition, geocoderAvailable, liveSearchAvailable, resolveSuggestion, searchDestinations, SearchError, suggestDestinations, type PlaceSuggestion } from '../lib/location';
import { firstPage, PAGE } from '../lib/paging';
import { BIKE_ONLY_LABEL, isBikeOnly, passesVehicleFilter, VEHICLE_CHIPS, vehicleFilter } from '../lib/photoVehicles';
import { visibleSpots } from '../lib/spots';
import { useStore } from '../lib/store';
import type { Build, EventType, LatLng, SpotKind, User, VehicleKind } from '../lib/types';
import { distanceNote, whereQueries, type Destination } from '../lib/whereTo';
import { COLOR, RADII, SPACING, SPOT_COLOURS } from '../theme';
import { TOWNS } from '../data/towns';

type Tab = 'all' | 'meets' | 'places' | 'people';
const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'meets', label: 'Meets' },
  { key: 'places', label: 'Places' },
  { key: 'people', label: 'People' },
];
const PLACE_KINDS: SpotKind[] = ['drive', 'photo', 'track', 'venue'];
const WHENS: When[] = ['any', 'tonight', 'week', 'weekend'];
const VEHICLES: Vehicles[] = ['any', 'cars', 'bikes'];
/** Wait for typing to stop: Apple's suggestions are quick, the geocoder slower. */
const DEBOUNCE_MS = liveSearchAvailable ? 300 : 600;
/** The one line when nothing matches (Redesign 2, 3.12; Review 15): what was typed, then one suggestion. */
const nothingFor = (q: string) => `Nothing for ‘${q.trim()}’`;
const TRY_INSTEAD = 'Try a town, or a car like ‘Golf’.';

/**
 * The bundled towns that match what's typed (whole words from the start of the name), so
 * "Birmingham" finds the city where the phone has no geocoder (Review 14 decision 6). Exact
 * matches first, then the nearest to `from`.
 */
function townHits(query: string, from: LatLng, limit = 5): Destination[] {
  const q = norm(query);
  if (q.length < 2) return [];
  return TOWNS.filter((t) => {
    const name = norm(t.name);
    return name.startsWith(q) || name.split(' ').some((w) => w.startsWith(q));
  })
    .sort((a, b) => Number(norm(b.name) === q) - Number(norm(a.name) === q) || milesBetween(from, a.at) - milesBetween(from, b.at))
    .slice(0, limit)
    .map((t) => ({ at: t.at, name: t.name, address: 'Town' }));
}

/** Lower case, no accents or punctuation, for matching what's typed. */
function norm(t: string): string {
  return t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9@ ]+/g, ' ').trim();
}
function matches(q: string, ...fields: (string | undefined)[]): boolean {
  const words = norm(q).split(/\s+/).filter(Boolean);
  const hay = norm(fields.filter(Boolean).join(' '));
  return words.every((w) => hay.includes(w.replace(/^@/, '')));
}
const buildText = (b: Build) => [b.make, b.model, b.nickname, b.year ? String(b.year) : undefined];

/** One address result: a place from the geocoder, or one of Apple's suggestions (resolved on tap). */
interface AddressHit {
  key: string;
  title: string;
  subtitle: string;
  dest?: Destination;
  suggestion?: PlaceSuggestion;
}

/**
 * Search (Redesign 2, 3.12): find a meet, a place, a person or an address from one box, with
 * All / Meets / Places / People. Results are grouped in that order; addresses are place results
 * and open here with Go here. With nothing typed: meets near you (All, Meets), the nearest places
 * by kind (Places), your connections (People). People match on their handle and on their car
 * ("golf" finds the Golf GTI's owner). Apple's live suggestions (MapKit) on builds that have
 * them, the geocoder otherwise; only Apple sees what's typed. A meet whose location is hidden
 * only ever shows its area; the distance is "about" to that area.
 */
export default function SearchScreen() {
  const { events, me, crews, users, builds, markNearbySeen, remote, spots, settings, setSettings } = useStore();
  const community = useCommunity();
  const params = useLocalSearchParams<{ q?: string; tab?: string }>();
  const startTab: Tab = params.tab === 'addresses' ? 'places' : params.tab === 'events' ? 'meets' : TABS.some((t) => t.key === params.tab) ? (params.tab as Tab) : 'all';
  const [query, setQuery] = useState(typeof params.q === 'string' ? params.q : '');
  const [tab, setTab] = useState<Tab>(startTab);
  const typed = norm(query).length >= 2;
  const now = useNow();
  const meUser = users.find((u) => u.id === me)!;
  const travel = travelOf(meUser);
  const [filters, setFilters] = useState<SearchFilters>(() => defaultFilters(travel.miles));
  const [editing, setEditing] = useState(false);
  const [kinds, setKinds] = useState<SpotKind[]>([]);
  const [here, setHere] = useState<LatLng | null>(null);
  // Opening Search marks "new near you" as seen.
  useFocusEffect(useCallback(() => () => markNearbySeen(), [markNearbySeen]));
  useEffect(() => {
    let live = true;
    currentPosition(false).then((p) => live && p.ok && setHere(p.at));
    return () => {
      live = false;
    };
  }, []);
  const origin = meUser.home;

  // ---- Meets: the server's search when signed in, the same search on the phone otherwise. ----
  const localHits = useMemo(() => searchEvents(events, { me, crews, users, builds }, origin, filters, now), [events, me, crews, users, builds, origin, filters, now]);
  const [server, setServer] = useState<{ eventId: string; miles: number; canGo: boolean }[] | null>(null);
  useEffect(() => {
    if (!remote) return;
    let live = true;
    remote
      .searchEvents(filters, null)
      .then((rows) => live && setServer(rows))
      .catch(() => live && setServer(null));
    return () => {
      live = false;
    };
  }, [remote, filters]);
  const hits = useMemo(() => {
    if (!remote || !server) return localHits;
    const views = new Map(localHits.map((h) => [h.view.event.id, h.view]));
    const all = new Map(events.map((e) => [e.id, e]));
    return server.flatMap((r) => {
      const event = all.get(r.eventId);
      if (!event) return [];
      const view = views.get(r.eventId) ?? viewEvent(event, me, crews, users, builds, now);
      return [{ view, miles: r.miles, canGo: r.canGo }];
    });
  }, [remote, server, localHits, events, me, crews, users, builds, now]);
  const [shownHits, setShownHits] = useState(PAGE);
  const hitPage = firstPage(hits, shownHits);

  // ---- Places and people on the phone. ----
  const allPlaces = useMemo(
    () =>
      visibleSpots(spots, me)
        .filter((s) => s.status !== 'pending' || s.authorId === me)
        .map((s) => ({ s, miles: milesBetween(origin, s.at) }))
        .sort((a, b) => a.miles - b.miles),
    [spots, me, origin],
  );
  const carOf = useCallback((userId: string) => builds.find((b) => b.ownerId === userId), [builds]);
  const found = useMemo(() => {
    if (!typed) return { meets: [], places: [], people: [] };
    // People by their cars too (REVIEW-9 decision 10): "golf" finds the Golf GTI's owner. Every
    // matching build gets its own row with its owner, yours included (Review 15: "fiesta" finds
    // every Fiesta, sample people's and the one in your Garage).
    const visible = (u: User) => !community.blocked.has(u.id);
    const byCar = builds
      .filter((b) => matches(query, ...buildText(b)))
      .flatMap((b) => {
        const u = users.find((x) => x.id === b.ownerId);
        return u && visible(u) ? [{ u, car: b as Build | undefined }] : [];
      })
      // Yours first, then the rest by handle.
      .sort((a, b) => Number(b.u.id === me) - Number(a.u.id === me) || a.u.handle.localeCompare(b.u.handle));
    const owners = new Set(byCar.map((r) => r.u.id));
    return {
      meets: hits.filter((h) =>
        matches(query, h.view.event.title, h.view.event.areaName, EVENT_LABELS[h.view.event.type], h.view.shownStop >= 0 ? h.view.event.stops[h.view.shownStop].name : undefined),
      ),
      places: allPlaces.filter(({ s }) => matches(query, s.name, s.region, PLACE_NAMES[s.kind].one)),
      people: [
        ...byCar,
        ...users.filter((u) => u.id !== me && visible(u) && !owners.has(u.id) && matches(query, u.name, u.handle)).map((u) => ({ u, car: carOf(u.id) })),
      ],
    };
  }, [typed, query, hits, allPlaces, users, builds, me, community.blocked, carOf]);

  // ---- Addresses: Apple's live suggestions, or the geocoder. ----
  const [addresses, setAddresses] = useState<AddressHit[]>([]);
  const [addrState, setAddrState] = useState<'idle' | 'searching' | 'none' | 'error'>('idle');
  const [addrError, setAddrError] = useState('');
  const [opening, setOpening] = useState<string | null>(null);
  const [picked, setPicked] = useState<Destination | null>(null);
  const seq = useRef(0);
  const canAddress = geocoderAvailable || liveSearchAvailable;
  const wantsAddresses = (tab === 'all' || tab === 'places') && canAddress;
  // No geocoder here: the bundled towns stand in, shown as places with Go here.
  const towns = useMemo<AddressHit[]>(
    () =>
      canAddress || !(tab === 'all' || tab === 'places')
        ? []
        : townHits(query, origin).map((d) => ({ key: `town:${d.name}`, title: d.name, subtitle: metaLine(['Town', distanceText(milesBetween(origin, d.at), 'home')]), dest: d })),
    [canAddress, tab, query, origin],
  );
  useEffect(() => {
    const mine = ++seq.current;
    if (!wantsAddresses || !whereQueries(query)) {
      setAddresses([]);
      setAddrState('idle');
      return;
    }
    const t = setTimeout(async () => {
      setAddrState('searching');
      setAddrError('');
      try {
        const live = await suggestDestinations(query, here).catch(() => null);
        if (mine !== seq.current) return;
        let list: AddressHit[] = (live ?? []).map((x) => ({ key: x.id, title: x.title, subtitle: x.subtitle, suggestion: x }));
        if (list.length === 0) {
          const geo = await searchDestinations(query);
          if (mine !== seq.current) return;
          list = geo.map((d) => ({ key: `${d.at.lat},${d.at.lng}`, title: d.name, subtitle: [d.address, distanceNote(here, d.at)].filter(Boolean).join(' · '), dest: d }));
        }
        setAddresses(list);
        setAddrState(list.length ? 'idle' : 'none');
      } catch (e) {
        if (mine !== seq.current) return;
        setAddresses([]);
        setAddrError(e instanceof SearchError ? e.message : "Couldn't search addresses just now. Try again in a moment.");
        setAddrState('error');
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
    // `here` only biases the search: a fix arriving shouldn't search again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, wantsAddresses]);

  function pick(d: Destination) {
    Keyboard.dismiss();
    setPicked(d);
  }
  async function openAddress(h: AddressHit) {
    if (h.dest) return pick(h.dest);
    if (!h.suggestion || opening) return;
    setOpening(h.key);
    try {
      pick(await resolveSuggestion(h.suggestion));
    } catch (e) {
      setAddrError(e instanceof SearchError ? e.message : "Couldn't find that place. Try another result.");
      setAddrState('error');
    } finally {
      setOpening(null);
    }
  }

  const openEvent = (id: string) => router.push({ pathname: '/event/[id]', params: { id } });
  const openPlace = (id: string) => router.push({ pathname: '/spot/[id]', params: { id } });
  const openPerson = (id: string) => router.push({ pathname: '/user/[id]', params: { id } });
  const cap = (n: number) => (tab === 'all' ? n : 50);
  const set = (patch: Partial<SearchFilters>) => setFilters((f) => ({ ...f, ...patch }));
  const distances = Array.from(new Set<number>([...TRAVEL_CHOICES, travel.miles])).sort((a, b) => a - b);
  const changed = filters.maxMiles !== travel.miles || filters.types.length > 0 || filters.when !== 'any' || filters.canGoOnly || filters.vehicles !== 'any';
  // Photo spots' Cars / Bikes filter, shared with the map's Layers (saved choice, else from the garage).
  const photoFor = vehicleFilter(settings.photoVehicles, builds.filter((b) => b.ownerId === me));
  const setPhotoFor = (next: VehicleKind[]) => setSettings({ photoVehicles: next });
  const showsPhotos = !kinds.length || kinds.includes('photo');
  const shownPlaces = allPlaces.filter(({ s }) => (!kinds.length || kinds.includes(s.kind)) && passesVehicleFilter(s, photoFor));
  const connected = idsIn(community.connections, 'connected')
    .map((id) => users.find((u) => u.id === id))
    .filter((u): u is User => !!u && !community.blocked.has(u.id));

  // ---- Rows: an event, a place, a person look the same everywhere (K3). ----
  const meetRow = (h: SearchHit) => {
    const role = h.view.role;
    const mine = role === 'host' || role === 'going';
    // The one event row (K3): the same as Tonight's list and Me.
    return <EventRow key={h.view.event.id} view={h.view} now={now} origin={distanceOrigin(null, origin)} notOpen={!mine && !h.canGo} onPress={() => openEvent(h.view.event.id)} />;
  };
  const placeRow = ({ s, miles }: (typeof allPlaces)[number]) => (
    <ListRow
      key={s.id}
      leading={{ pin: s.kind, colour: SPOT_COLOURS[s.kind] }}
      title={s.name}
      subtitle={metaLine([PLACE_NAMES[s.kind].one, s.region])}
      meta={distanceText(miles, 'home')}
      trailing={s.authorId === me ? <Tag label="Yours" /> : isBikeOnly(s) ? <Tag label={BIKE_ONLY_LABEL} /> : undefined}
      onPress={() => openPlace(s.id)}
    />
  );
  const personRow = (u: User, car: Build | undefined) => (
    <ListRow
      key={car ? `${u.id}:${car.id}` : u.id}
      leading={{ avatar: { name: u.name, handle: u.handle } }}
      title={`@${u.handle}`}
      build={car ? { letter: classOf(car), name: `${car.make} ${car.model}`, power: powerText(car) } : undefined}
      subtitle={car ? undefined : u.name}
      trailing={u.id === me ? <Tag label="You" /> : undefined}
      // Your own build opens its page; anyone else opens their profile.
      onPress={() => (u.id === me && car ? router.push({ pathname: '/build/[id]', params: { id: car.id } }) : openPerson(u.id))}
    />
  );
  const suggestRow = (
    <ListRow
      key="suggest"
      leading={{ icon: 'plus' }}
      title="Know a great road or photo spot? Suggest it"
      onPress={() => router.push('/spot/new')}
    />
  );
  const addressRows = (
    <>
      {addrState === 'searching' && !addresses.length ? <LoadingState variant="inline" label="Searching addresses" /> : null}
      {addrState === 'error' ? <ErrorState title={addrError} /> : null}
      {[...towns, ...addresses].map((h) => (
        <ListRow
          key={h.key}
          leading={{ pin: 'destination', colour: COLOR.text.secondary }}
          title={h.title}
          subtitle={h.subtitle}
          trailing={opening === h.key ? <Tag label="Opening" /> : undefined}
          onPress={() => openAddress(h)}
          accessibilityHint="Shows it here, with Go here"
        />
      ))}
    </>
  );

  const nothing =
    typed &&
    addrState !== 'searching' &&
    !addresses.length &&
    !towns.length &&
    (tab === 'all' ? !found.meets.length && !found.places.length && !found.people.length : tab === 'meets' ? !found.meets.length : tab === 'places' ? !found.places.length : !found.people.length);

  return (
    <ScrollView contentContainerStyle={st.page} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
      <View style={{ gap: SPACING.md }}>
        <SearchField
          value={query}
          onChangeText={(t) => {
            setQuery(t);
            setPicked(null);
          }}
          placeholder="Meets, places, people"
          loading={addrState === 'searching'}
          autoFocus={!params.q}
          accessibilityLabel="Search meets, places, people or an address"
        />
        <SegmentedControl options={TABS} value={tab} onChange={setTab} accessibilityLabel="Search in" />
      </View>

      {picked ? (
        <Picked place={picked} note={distanceNote(here, picked.at)} onClear={() => setPicked(null)} />
      ) : typed ? (
        <>
          {nothing ? (
            <EmptyState
              variant="inline"
              icon="search"
              title={nothingFor(query)}
              body={tab === 'all' ? TRY_INSTEAD : undefined}
              action={tab === 'all' ? undefined : { label: 'Search everything', onPress: () => setTab('all') }}
            />
          ) : null}
          {(tab === 'all' || tab === 'meets') && found.meets.length ? (
            <Section title={plural(found.meets.length, 'meet')} right={tab === 'all' && found.meets.length > 4 ? <Button label="See all" tier="tertiary" size="sm" onPress={() => setTab('meets')} /> : undefined}>
              {found.meets.slice(0, cap(4)).map(meetRow)}
            </Section>
          ) : null}
          {(tab === 'all' || tab === 'places') && (found.places.length || addresses.length || towns.length || addrState === 'searching' || addrState === 'error') ? (
            <Section title="Places" right={tab === 'all' && found.places.length > 4 ? <Button label="See all" tier="tertiary" size="sm" onPress={() => setTab('places')} /> : undefined}>
              {found.places.slice(0, cap(4)).map(placeRow)}
              {addressRows}
            </Section>
          ) : null}
          {(tab === 'all' || tab === 'people') && found.people.length ? (
            <Section title={plural(new Set(found.people.map((p) => p.u.id)).size, 'person', 'people')}>{found.people.slice(0, cap(4)).map(({ u, car }) => personRow(u, car))}</Section>
          ) : null}
          {tab === 'places' ? suggestRow : null}
        </>
      ) : tab === 'places' ? (
        <>
          <ChipGroup label="Show" options={PLACE_KINDS.map((k) => ({ key: k, label: PLACE_NAMES[k].many }))} selected={kinds} onChange={setKinds} allLabel="Every kind of place" />
          {showsPhotos ? (
            <ChipGroup<VehicleKind> label={`${PLACE_NAMES.photo.many} for`} allLabel="Cars and bikes" options={VEHICLE_CHIPS} selected={photoFor} onChange={setPhotoFor} />
          ) : null}
          <Section title="Nearest to home">
            {shownPlaces.length === 0 ? <EmptyState variant="inline" title="No places like that near you yet." /> : shownPlaces.slice(0, 20).map(placeRow)}
          </Section>
          {suggestRow}
        </>
      ) : tab === 'people' ? (
        <Section title={connected.length ? `Your connections (${connected.length})` : 'Your connections'}>
          {connected.length ? (
            connected.map((u) => personRow(u, carOf(u.id)))
          ) : (
            <EmptyState
              variant="inline"
              title="Type a handle or a car to find someone."
              action={{ label: 'People near you', onPress: () => router.push({ pathname: '/community', params: { tab: 'people' } }) }}
            />
          )}
        </Section>
      ) : (
        <Section
          title="Meets near you"
          right={tab === 'meets' ? <Button label="Filters" tier="tertiary" size="sm" onPress={() => setEditing(true)} accessibilityLabel={`Filters: ${describeFilters(filters, false)}`} /> : undefined}
        >
          {hits.length === 0 ? (
            <EmptyState variant="inline" title="Nothing on near you. Try a wider distance." action={{ label: 'Filters', onPress: () => setEditing(true) }} />
          ) : (
            hitPage.items.slice(0, tab === 'all' ? 8 : undefined).map(meetRow)
          )}
          {tab === 'meets' && hitPage.more > 0 ? <Button label={`Show ${hitPage.more} more`} tier="tertiary" onPress={() => setShownHits((n) => n + PAGE)} /> : null}
          {tab === 'all' && hits.length > 8 ? <Button label="See all" tier="tertiary" size="sm" onPress={() => setTab('meets')} /> : null}
        </Section>
      )}

      <Sheet visible={editing} title="Filters" onClose={() => setEditing(false)}>
        <ChoiceGroup
          label="Within"
          value={filters.maxMiles === null ? 'any' : String(filters.maxMiles)}
          onChange={(k) => set({ maxMiles: k === 'any' ? null : Number(k) })}
          options={[...distances.map((m) => ({ key: String(m), label: `${m} mi` })), { key: 'any', label: 'Any distance' }]}
        />
        <ChoiceGroup label="When" value={filters.when} onChange={(w) => set({ when: w })} options={WHENS.map((w) => ({ key: w, label: WHEN_LABELS[w] }))} />
        <ChoiceGroup label="For" value={filters.vehicles} onChange={(v) => set({ vehicles: v })} options={VEHICLES.map((v) => ({ key: v, label: VEHICLE_LABELS[v] }))} />
        <ChipGroup<EventType> label="What" options={ALL_TYPES.map((t) => ({ key: t, label: EVENT_LABELS[t] }))} selected={filters.types} onChange={(types) => set({ types })} allLabel="Every kind" />
        <ChoiceGroup
          label="Show"
          value={filters.canGoOnly ? 'cango' : 'all'}
          onChange={(k) => set({ canGoOnly: k === 'cango' })}
          options={[
            { key: 'all', label: 'Everything' },
            { key: 'cango', label: 'Only ones open to my car' },
          ]}
        />
        {changed ? <Button label="Back to my usual search" tier="tertiary" onPress={() => setFilters(defaultFilters(travel.miles))} /> : null}
      </Sheet>
    </ScrollView>
  );
}

/** The chosen address on a small map, with the one primary action: Go here. */
function Picked({ place, note, onClear }: { place: Destination; note: string | null; onClear: () => void }) {
  return (
    <View style={st.picked}>
      <View style={st.pickedMap}>
        <NightMap
          key={`${place.at.lat},${place.at.lng}`}
          pins={[{ id: 'destination', at: place.at, glyph: 'destination', colour: COLOR.text.primary, title: place.name, size: 40 }]}
          centre={place.at}
          span={place.address === 'Town' ? 0.15 : 0.02}
          showsUser
        />
      </View>
      <View style={{ gap: SPACING.xxs }}>
        <DsText v="title">{place.name}</DsText>
        {place.address ? <DsText v="secondary">{place.address}</DsText> : null}
        {note ? <DsText v="meta">{note}</DsText> : null}
      </View>
      <NavLaunch target={{ kind: 'place', name: place.name, lat: place.at.lat, lng: place.at.lng }} to={place.at} label="Go here" kind="primary" />
      <Button label="Other results" tier="tertiary" size="sm" style={{ alignSelf: 'flex-start' }} onPress={onClear} />
    </View>
  );
}

const st = StyleSheet.create({
  page: { padding: SPACING.screen, gap: SPACING.section, paddingBottom: SPACING.xxxl },
  picked: { gap: SPACING.md, padding: SPACING.md, borderRadius: RADII.card, borderWidth: 1, borderColor: COLOR.surface.border, backgroundColor: COLOR.surface.card },
  pickedMap: { height: 220, borderRadius: RADII.card, overflow: 'hidden' },
});
