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
import { NavLaunch } from '../components/NavLaunch';
import { NightMap } from '../components/NightMap';
import { EventEntityCard, PlaceEntityCard, roleTag } from '../components/TonightCards';
import {
  ALL_TYPES,
  defaultFilters,
  describeFilters,
  hitNote,
  searchEvents,
  travelOf,
  TRAVEL_CHOICES,
  VEHICLE_LABELS,
  WHEN_LABELS,
  type SearchFilters,
  type Vehicles,
  type When,
} from '../lib/discover';
import { EVENT_LABELS } from '../lib/events';
import { viewEvent } from '../lib/eventView';
import { formatWhen, plural } from '../lib/format';
import { formatMiles, milesBetween } from '../lib/geo';
import { PLACE_NAMES } from '../lib/glossary';
import { currentPosition, liveSearchAvailable, resolveSuggestion, searchDestinations, SearchError, suggestDestinations, type PlaceSuggestion } from '../lib/location';
import { firstPage, PAGE } from '../lib/paging';
import { visibleSpots } from '../lib/spots';
import { useNow } from '../lib/clock';
import { useStore } from '../lib/store';
import type { EventType, LatLng, SpotKind } from '../lib/types';
import { clearRecent, distanceNote, rememberRecent, samePlace, savedPlaces, setSlot, SLOT_LABELS, whereQueries, type Destination, type SavedSlot } from '../lib/whereTo';
import { COLOR, EVENT_COLOURS, RADII, SPACING, SPOT_COLOURS } from '../theme';

type Tab = 'all' | 'events' | 'places' | 'people';
const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'events', label: 'Events' },
  { key: 'places', label: 'Places' },
  { key: 'people', label: 'People' },
];
const PLACE_KINDS: SpotKind[] = ['drive', 'photo', 'track', 'venue'];
const WHENS: When[] = ['any', 'tonight', 'week', 'weekend'];
const VEHICLES: Vehicles[] = ['any', 'cars', 'bikes'];
const SLOTS: SavedSlot[] = ['home', 'work'];
/** Wait for typing to stop: Apple's suggestions are quick, the geocoder slower. */
const DEBOUNCE_MS = liveSearchAvailable ? 300 : 600;

/** Lower case, no accents or punctuation, for matching what's typed. */
function norm(t: string): string {
  return t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9@ ]+/g, ' ').trim();
}
function matches(q: string, ...fields: (string | undefined)[]): boolean {
  const words = norm(q).split(/\s+/).filter(Boolean);
  const hay = norm(fields.filter(Boolean).join(' '));
  return words.every((w) => hay.includes(w.replace(/^@/, '')));
}

/** One address result: a place from the geocoder, or one of Apple's suggestions (resolved on tap). */
interface AddressHit {
  key: string;
  title: string;
  subtitle: string;
  dest?: Destination;
  suggestion?: PlaceSuggestion;
}

/**
 * Search: the one search in the app (it replaced Find and Where to?). One field
 * for events, places, people and addresses, with All / Events / Places / People.
 * Addresses are places too: they show under Places (and in All), and picking one
 * shows it here with Go here, no third screen. Apple's live suggestions (MapKit)
 * on builds that have them, the geocoder otherwise; only Apple sees what's typed.
 * With nothing typed: saved and recent places (All), events near you with their
 * filters (Events), the nearest places (Places). Results open their own page.
 * Locked events only ever show their rough area; the distance is to that area.
 */
export default function SearchScreen() {
  const { events, me, crews, users, builds, nearby, markNearbySeen, remote, spots, settings, updatePlaces } = useStore();
  const params = useLocalSearchParams<{ q?: string; tab?: string }>();
  const startTab: Tab = params.tab === 'addresses' ? 'places' : TABS.some((t) => t.key === params.tab) ? (params.tab as Tab) : 'all';
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
  // "New near you" tags stay for this visit; leaving the screen marks them seen.
  const [fresh] = useState(() => new Set(nearby?.unseen ?? []));
  useFocusEffect(useCallback(() => () => markNearbySeen(), [markNearbySeen]));
  useEffect(() => {
    let live = true;
    currentPosition(false).then((p) => live && p.ok && setHere(p.at));
    return () => {
      live = false;
    };
  }, []);
  const origin = meUser.home;

  // ---- Events: the server's search when signed in, the same search on the phone otherwise. ----
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
  const found = useMemo(() => {
    if (!typed) return { events: [], places: [], people: [] };
    return {
      events: hits.filter((h) =>
        matches(query, h.view.event.title, h.view.event.areaName, EVENT_LABELS[h.view.event.type], h.view.shownStop >= 0 ? h.view.event.stops[h.view.shownStop].name : undefined),
      ),
      places: allPlaces.filter(({ s }) => matches(query, s.name, s.region, PLACE_NAMES[s.kind].one)),
      people: users.filter((u) => u.id !== me && matches(query, u.name, u.handle)),
    };
  }, [typed, query, hits, allPlaces, users, me]);

  // ---- Addresses: Apple's live suggestions, or the geocoder. ----
  const saved = savedPlaces(settings.places);
  const [addresses, setAddresses] = useState<AddressHit[]>([]);
  const [addrState, setAddrState] = useState<'idle' | 'searching' | 'none' | 'error'>('idle');
  const [addrError, setAddrError] = useState('');
  const [opening, setOpening] = useState<string | null>(null);
  const [picked, setPicked] = useState<Destination | null>(null);
  const seq = useRef(0);
  const wantsAddresses = tab === 'all' || tab === 'places';
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
        setAddrError(e instanceof SearchError ? e.message : "Couldn't search addresses just now.");
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
    updatePlaces((p) => rememberRecent(p, d));
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
  const shownPlaces = allPlaces.filter(({ s }) => !kinds.length || kinds.includes(s.kind));

  // ---- Sections ----
  const eventRows = (list: typeof found.events, n: number) =>
    list.slice(0, n).map((h) => (
      <ListRow
        key={h.view.event.id}
        leading={{ pin: h.view.shownStop >= 0 ? h.view.event.type : 'locked', colour: EVENT_COLOURS[h.view.event.type] }}
        title={h.view.event.title}
        subtitle={metaLine([EVENT_LABELS[h.view.event.type], formatWhen(h.view.event.startsAt, now)])}
        meta={hitNote(h, false)}
        trailing={roleTag(h.view.role) ? <Tag label={roleTag(h.view.role)!.label} tone={roleTag(h.view.role)!.tone} /> : undefined}
        onPress={() => openEvent(h.view.event.id)}
      />
    ));
  const placeRows = (list: typeof allPlaces, n: number) =>
    list.slice(0, n).map(({ s, miles }) => (
      <ListRow
        key={s.id}
        leading={{ pin: s.kind, colour: SPOT_COLOURS[s.kind] }}
        title={s.name}
        subtitle={metaLine([PLACE_NAMES[s.kind].one, s.region])}
        meta={`${formatMiles(miles)} from home`}
        onPress={() => openPlace(s.id)}
      />
    ));
  const addressSection = (
    <Section title="Addresses" right={addrState === 'searching' ? <Tag label="Searching" /> : undefined}>
      {addrState === 'searching' && !addresses.length ? <LoadingState variant="inline" label="Searching addresses" /> : null}
      {addrState === 'none' ? <EmptyState variant="inline" title="No address found. Try the full address, a postcode or a town." /> : null}
      {addrState === 'error' ? <ErrorState title={addrError} /> : null}
      {addresses.map((h) => (
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
    </Section>
  );

  return (
    <ScrollView contentContainerStyle={st.page} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
      <View style={{ gap: SPACING.md }}>
        <SearchField
          value={query}
          onChangeText={(t) => {
            setQuery(t);
            setPicked(null);
          }}
          placeholder="Events, places, people or an address"
          loading={addrState === 'searching'}
          autoFocus={!params.q}
          accessibilityLabel="Search events, places, people or an address"
        />
        <SegmentedControl options={TABS} value={tab} onChange={setTab} accessibilityLabel="Search in" />
      </View>

      {picked ? (
        <Picked
          place={picked}
          note={distanceNote(here, picked.at)}
          slot={SLOTS.find((k) => saved[k] && samePlace(saved[k]!, picked))}
          onSave={(slot) => updatePlaces((p) => setSlot(p, slot, picked))}
          onBack={() => setPicked(null)}
        />
      ) : typed ? (
        <>
          {tab === 'all' || tab === 'events' ? (
            found.events.length ? (
              <Section title={plural(found.events.length, 'event')} right={tab === 'all' && found.events.length > 4 ? <Button label="All" tier="tertiary" size="sm" onPress={() => setTab('events')} /> : undefined}>
                {eventRows(found.events, cap(4))}
              </Section>
            ) : tab === 'events' ? (
              <EmptyState variant="inline" title="No upcoming events match, within your filters." action={{ label: 'Change filters', onPress: () => setEditing(true) }} />
            ) : null
          ) : null}
          {tab === 'all' || tab === 'places' ? (
            found.places.length ? (
              <Section title={plural(found.places.length, 'place')} right={tab === 'all' && found.places.length > 4 ? <Button label="All" tier="tertiary" size="sm" onPress={() => setTab('places')} /> : undefined}>
                {placeRows(found.places, cap(4))}
              </Section>
            ) : tab === 'places' ? (
              <EmptyState variant="inline" title="No drives, photo spots, tracks or meet spots by that name." />
            ) : null
          ) : null}
          {tab === 'all' || tab === 'people' ? (
            found.people.length ? (
              <Section title={plural(found.people.length, 'person', 'people')}>
                {found.people.slice(0, cap(4)).map((u) => (
                  <ListRow key={u.id} leading={{ avatar: { name: u.name, handle: u.handle } }} title={`@${u.handle}`} subtitle={u.name} onPress={() => openPerson(u.id)} />
                ))}
              </Section>
            ) : tab === 'people' ? (
              <EmptyState variant="inline" title="Nobody by that name or handle." />
            ) : null
          ) : null}
          {wantsAddresses ? addressSection : null}
        </>
      ) : tab === 'events' ? (
        <>
          <View style={st.filters}>
            <DsText v="secondary" style={{ flex: 1 }} accessibilityLabel={`Searching ${describeFilters(filters, false)}`}>
              {describeFilters(filters, false)}
            </DsText>
            <Button label="Filters" tier="tertiary" size="sm" onPress={() => setEditing(true)} accessibilityLabel="Change the filters" />
          </View>
          <Section title={plural(hits.length, 'event')}>
            {hits.length === 0 ? (
              <EmptyState variant="inline" title="Nothing matches. Try a wider distance or any time." action={{ label: 'Change filters', onPress: () => setEditing(true) }} />
            ) : (
              hitPage.items.map((h) => (
                <EventEntityCard
                  key={h.view.event.id}
                  view={h.view}
                  now={now}
                  miles={h.miles}
                  tag={fresh.has(h.view.event.id) && !roleTag(h.view.role) ? { label: 'New', tone: 'info' } : undefined}
                  onPress={() => openEvent(h.view.event.id)}
                />
              ))
            )}
            {hitPage.more > 0 ? <Button label={`Show ${hitPage.more} more`} tier="tertiary" onPress={() => setShownHits((n) => n + PAGE)} /> : null}
          </Section>
        </>
      ) : tab === 'places' ? (
        <>
          <ChipGroup label="Show" options={PLACE_KINDS.map((k) => ({ key: k, label: PLACE_NAMES[k].many }))} selected={kinds} onChange={setKinds} allLabel="Every kind of place" />
          <Section title="Nearest to home">
            {shownPlaces.slice(0, 20).map(({ s, miles }) => (
              <PlaceEntityCard key={s.id} spot={s} miles={miles} milesFrom=" from home" onPress={() => openPlace(s.id)} />
            ))}
            {shownPlaces.length === 0 ? <EmptyState variant="inline" title="No places like that near you yet." /> : null}
          </Section>
        </>
      ) : tab === 'people' ? (
        <EmptyState
          variant="inline"
          title="Type a name or @handle."
          action={{ label: 'People near you', onPress: () => router.push({ pathname: '/community', params: { tab: 'people' } }) }}
        />
      ) : (
        <>
          <Section title="Saved">
            {SLOTS.map((k) => {
              const d = saved[k];
              return (
                <ListRow
                  key={k}
                  leading={{ pin: 'destination', colour: d ? COLOR.text.primary : COLOR.text.secondary }}
                  title={SLOT_LABELS[k]}
                  subtitle={d ? [d.name, d.address].filter(Boolean).join(', ') : `Not set. Search for it, then save it as ${SLOT_LABELS[k]}.`}
                  onPress={d ? () => pick(d) : undefined}
                />
              );
            })}
          </Section>
          <Section title="Recent" right={saved.recent.length ? <Button label="Clear" tier="tertiary" size="sm" onPress={() => updatePlaces(clearRecent)} accessibilityLabel="Clear recent places" /> : undefined}>
            {saved.recent.length === 0 ? (
              <EmptyState variant="inline" title="Addresses you search for show here." />
            ) : (
              saved.recent.map((d) => (
                <ListRow
                  key={`${d.at.lat},${d.at.lng}`}
                  leading={{ pin: 'destination', colour: COLOR.text.secondary }}
                  title={d.name}
                  subtitle={[d.address, distanceNote(here, d.at)].filter(Boolean).join(' · ')}
                  onPress={() => pick(d)}
                />
              ))
            )}
          </Section>
        </>
      )}
      {wantsAddresses ? <DsText v="caption">Addresses use Apple Maps. Your recent places, Home and Work stay on this phone.</DsText> : null}

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
            { key: 'cango', label: 'Only ones I can go to' },
          ]}
        />
        {changed ? <Button label="Back to my usual search" tier="tertiary" onPress={() => setFilters(defaultFilters(travel.miles))} /> : null}
      </Sheet>
    </ScrollView>
  );
}

/** The chosen address on a small map, with the one primary action: Go here. */
function Picked({ place, note, slot, onSave, onBack }: { place: Destination; note: string | null; slot: SavedSlot | undefined; onSave: (slot: SavedSlot) => void; onBack: () => void }) {
  return (
    <View style={st.picked}>
      <View style={st.pickedMap}>
        <NightMap
          key={`${place.at.lat},${place.at.lng}`}
          pins={[{ id: 'destination', at: place.at, glyph: 'destination', colour: COLOR.text.primary, title: place.name, size: 40 }]}
          centre={place.at}
          span={0.02}
          showsUser
        />
      </View>
      <View style={{ gap: SPACING.xxs }}>
        <DsText v="titleLg">{place.name}</DsText>
        {place.address ? <DsText v="secondary">{place.address}</DsText> : null}
        {note ? <DsText v="meta">{note}</DsText> : null}
      </View>
      <NavLaunch target={{ kind: 'place', name: place.name, lat: place.at.lat, lng: place.at.lng }} to={place.at} label="Go here" kind="primary" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: SPACING.sm }}>
        {slot ? <Tag label={`Saved as ${SLOT_LABELS[slot]}`} tone="success" /> : null}
        {SLOTS.filter((k) => k !== slot).map((k) => (
          <Button key={k} label={`Save as ${SLOT_LABELS[k]}`} tier="tertiary" size="sm" onPress={() => onSave(k)} />
        ))}
        <Button label="Back to results" tier="tertiary" size="sm" onPress={onBack} />
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  page: { padding: SPACING.screen, gap: SPACING.section, paddingBottom: SPACING.xxxl },
  filters: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.md, borderRadius: RADII.card, borderWidth: 1, borderColor: COLOR.surface.border, backgroundColor: COLOR.surface.card },
  picked: { gap: SPACING.md, padding: SPACING.md, borderRadius: RADII.card, borderWidth: 1, borderColor: COLOR.surface.border, backgroundColor: COLOR.surface.card },
  pickedMap: { height: 220, borderRadius: RADII.card, overflow: 'hidden' },
});
