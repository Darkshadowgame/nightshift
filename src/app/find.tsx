import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { EventCard } from '../components/EventCard';
import { Pin } from '../components/Pin';
import { Card, Chip, EmptyState, LinkText, ListRow, Notice, Row, Section, Segmented, Txt, s as ui } from '../components/ui';
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
import { plural } from '../lib/format';
import { formatMiles, fuzz, milesBetween } from '../lib/geo';
import { PLACE_NAMES } from '../lib/glossary';
import { visibleSpots } from '../lib/spots';
import { currentPosition } from '../lib/location';
import { useStore } from '../lib/store';
import { useNow } from '../lib/clock';
import type { LatLng } from '../lib/types';
import { BRAND, C, EVENT_COLOURS, SPOT_COLOURS } from '../theme';

const WHENS: When[] = ['any', 'tonight', 'week', 'weekend'];
const VEHICLES: Vehicles[] = ['any', 'cars', 'bikes'];
type Tab = 'all' | 'events' | 'places' | 'people';
const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'events', label: 'Events' },
  { key: 'places', label: 'Places' },
  { key: 'people', label: 'People' },
];

/** Lower case, no accents or punctuation, for matching what's typed. */
function norm(t: string): string {
  return t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9@ ]+/g, ' ').trim();
}
function matches(q: string, ...fields: (string | undefined)[]): boolean {
  const words = norm(q).split(/\s+/).filter(Boolean);
  const hay = norm(fields.filter(Boolean).join(' '));
  return words.every((w) => hay.includes(w.replace(/^@/, '')));
}
/** Back to the map, centred on what was picked, with it open in the sheet. */
function showOnMap(focus: string) {
  router.dismissTo({ pathname: '/', params: { focus, t: String(Date.now()) } });
}

/**
 * Find, the map's search (MAP-REDESIGN.md): one field for events, places,
 * people and addresses, with All / Events / Places / People tabs. Typed
 * results for events and places go back to the map and open there; people
 * open their profile; an address goes to Where to? (where.tsx). With nothing
 * typed: "Where to?" and every upcoming event you can see, nearest first.
 * Locked events only ever show their rough area; the distance is to that
 * area, never a stop.
 */
export default function FindEvents() {
  const { events, me, crews, users, builds, nearby, markNearbySeen, remote, spots } = useStore();
  const params = useLocalSearchParams<{ focus?: string }>();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<Tab>('all');
  const typed = norm(query).length >= 2;
  const now = useNow();
  const meUser = users.find((u) => u.id === me)!;
  const travel = travelOf(meUser);
  const [filters, setFilters] = useState<SearchFilters>(() => defaultFilters(travel.miles));
  const [here, setHere] = useState<LatLng | null>(null);
  const [useHere, setUseHere] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locNote, setLocNote] = useState<string | null>(null);
  /** The filters fold into one summary line so the results are on the first screen (REVIEW-5 m16). */
  const [editing, setEditing] = useState(false);
  // NEW tags stay for this visit; leaving the screen marks them seen.
  const [fresh] = useState(() => new Set(nearby?.unseen ?? []));
  useFocusEffect(useCallback(() => () => markNearbySeen(), [markNearbySeen]));

  const origin = useHere && here ? here : meUser.home;
  const localHits = useMemo(
    () => searchEvents(events, { me, crews, users, builds }, origin, filters, now),
    [events, me, crews, users, builds, origin, filters, now],
  );
  // Signed in: the server searches (search_events(): distance from your home inside the database, or from
  // the point you send, snapped to ~1 km). Offline, or before it answers: the same search on what the phone has.
  const [server, setServer] = useState<{ eventId: string; miles: number; canGo: boolean }[] | null>(null);
  const fromKey = useHere && here ? `${here.lat},${here.lng}` : 'home';
  useEffect(() => {
    if (!remote) return;
    let live = true;
    remote
      .searchEvents(filters, useHere && here ? here : null)
      .then((rows) => live && setServer(rows))
      .catch(() => live && setServer(null));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remote, filters, fromKey]);
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
  const set = (patch: Partial<SearchFilters>) => setFilters((f) => ({ ...f, ...patch }));
  const distances = Array.from(new Set<number>([...TRAVEL_CHOICES, travel.miles])).sort((a, b) => a - b);

  async function fromHere() {
    setLocating(true);
    setLocNote(null);
    const pos = await currentPosition(true);
    setLocating(false);
    if (pos.ok) {
      // Rounded to about 1 km, the same as the server does with a point you send.
      setHere(fuzz(pos.at));
      setUseHere(true);
    } else {
      setUseHere(false);
      setLocNote(
        pos.reason === 'denied'
          ? 'Location is off for Nightshift, so this searches from your home area. Turn it on in Settings to search from where you are.'
          : "Couldn't find where you are just now, so this searches from your home area.",
      );
    }
  }

  const changed =
    filters.maxMiles !== travel.miles || filters.types.length > 0 || filters.when !== 'any' || filters.canGoOnly || filters.vehicles !== 'any' || useHere;

  // Typed search: events (title, area, kind), places (name, region, kind) and people (name, @handle).
  const found = useMemo(() => {
    if (!typed) return { events: [], places: [], people: [] };
    const eventHits = hits.filter((h) =>
      matches(query, h.view.event.title, h.view.event.areaName, EVENT_LABELS[h.view.event.type], h.view.shownStop >= 0 ? h.view.event.stops[h.view.shownStop].name : undefined),
    );
    const placeHits = visibleSpots(spots, me)
      .filter((s) => matches(query, s.name, s.region, PLACE_NAMES[s.kind].one))
      .map((s) => ({ s, miles: milesBetween(origin, s.at) }))
      .sort((a, b) => a.miles - b.miles);
    const people = users.filter((u) => u.id !== me && matches(query, u.name, u.handle));
    return { events: eventHits, places: placeHits, people };
  }, [typed, query, hits, spots, me, users, origin]);
  const cap = (n: number) => (tab === 'all' ? n : 50);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 18, paddingBottom: 40 }} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
      <View style={{ gap: 10 }}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Events, places, people or an address"
          placeholderTextColor={C.fog}
          autoFocus={params.focus === '1'}
          autoCorrect={false}
          returnKeyType="search"
          clearButtonMode="while-editing"
          style={[ui.input, { minHeight: 48 }]}
          accessibilityLabel="Search events, places, people or an address"
        />
        <Segmented options={TABS} value={tab} onChange={setTab} />
      </View>
      {typed ? (
        <>
          {(tab === 'all' || tab === 'events') ? (
            <Section title={plural(found.events.length, 'event')}>
              {found.events.length === 0 ? <Txt v="muted">No events match. Try Change the search below for wider filters.</Txt> : null}
              {found.events.slice(0, cap(4)).map((h) => (
                <ListRow
                  key={h.view.event.id}
                  glyph={h.view.shownStop >= 0 ? h.view.event.type : 'locked'}
                  colour={EVENT_COLOURS[h.view.event.type]}
                  title={h.view.event.title}
                  subtitle={[EVENT_LABELS[h.view.event.type], hitNote(h, useHere)].join(' · ')}
                  onPress={() => showOnMap(`ev:${h.view.event.id}`)}
                  accessibilityLabel={`${h.view.event.title}. ${hitNote(h, useHere)}. Show on the map`}
                />
              ))}
              {tab === 'all' && found.events.length > 4 ? <LinkText label={`All ${found.events.length} events ›`} onPress={() => setTab('events')} /> : null}
            </Section>
          ) : null}
          {(tab === 'all' || tab === 'places') ? (
            <Section title={plural(found.places.length, 'place')}>
              {found.places.length === 0 ? <Txt v="muted">No drives, photo spots, tracks or meet spots by that name.</Txt> : null}
              {found.places.slice(0, cap(4)).map(({ s, miles }) => (
                <ListRow
                  key={s.id}
                  glyph={s.kind}
                  colour={SPOT_COLOURS[s.kind]}
                  title={s.name}
                  subtitle={[PLACE_NAMES[s.kind].one, s.region, formatMiles(miles)].filter(Boolean).join(' · ')}
                  onPress={() => showOnMap(`sp:${s.id}`)}
                  accessibilityLabel={`${s.name}, ${PLACE_NAMES[s.kind].one}. Show on the map`}
                />
              ))}
              {tab === 'all' && found.places.length > 4 ? <LinkText label={`All ${found.places.length} places ›`} onPress={() => setTab('places')} /> : null}
            </Section>
          ) : null}
          {(tab === 'all' || tab === 'people') ? (
            <Section title={plural(found.people.length, 'person', 'people')}>
              {found.people.length === 0 ? <Txt v="muted">Nobody by that name or handle.</Txt> : null}
              {found.people.slice(0, cap(4)).map((u) => (
                <ListRow
                  key={u.id}
                  glyph="me"
                  colour={C.chalk}
                  title={u.name}
                  subtitle={`@${u.handle}`}
                  onPress={() => router.push({ pathname: '/user/[id]', params: { id: u.id } })}
                  accessibilityLabel={`${u.name}, @${u.handle}. Open profile`}
                />
              ))}
              {tab === 'all' && found.people.length > 4 ? <LinkText label={`All ${found.people.length} people ›`} onPress={() => setTab('people')} /> : null}
            </Section>
          ) : null}
          {tab === 'all' ? (
            <Section title="Address or place">
              <ListRow
                glyph="destination"
                colour={BRAND}
                title={`Search addresses for “${query.trim()}”`}
                subtitle="Where to? Any address, postcode or place, then drive there"
                onPress={() => router.push({ pathname: '/where', params: { q: query.trim() } })}
                accessibilityLabel={`Search addresses for ${query.trim()} in Where to`}
              />
            </Section>
          ) : null}
        </>
      ) : null}
      {typed || tab === 'people' || tab === 'places' ? (
        !typed ? (
          <Txt v="muted">{tab === 'people' ? 'Type a name or @handle.' : 'Type the name of a drive, photo spot, track or meet spot, or a region.'}</Txt>
        ) : null
      ) : (
      <>
      <Pressable
        onPress={() => router.push('/where')}
        accessibilityRole="button"
        accessibilityLabel="Where to? Search an address, postcode or place and drive there"
        style={({ pressed }) => [ui.input, { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48 }, pressed && { opacity: 0.8 }]}
      >
        <Pin glyph="destination" colour={BRAND} size={26} />
        <Txt v="muted" style={{ flex: 1 }} numberOfLines={1}>Where to? Address, postcode or place</Txt>
      </Pressable>
      {editing ? (
        <Card>
          <Row style={{ justifyContent: 'space-between' }}>
            <Txt v="label">Search</Txt>
            <LinkText label="Done" onPress={() => setEditing(false)} />
          </Row>
          <FilterRow label="From">
            <Chip label="Home area" on={!useHere} onPress={() => setUseHere(false)} />
            <Chip label={locating ? 'Finding you…' : 'Where I am'} on={useHere} onPress={fromHere} />
          </FilterRow>
          <FilterRow label="Within">
            {distances.map((m) => (
              <Chip key={m} label={`${m} mi`} on={filters.maxMiles === m} onPress={() => set({ maxMiles: m })} />
            ))}
            <Chip label="Any distance" on={filters.maxMiles === null} onPress={() => set({ maxMiles: null })} />
          </FilterRow>
          <FilterRow label="What">
            {ALL_TYPES.map((t) => (
              <Chip
                key={t}
                label={EVENT_LABELS[t]}
                on={filters.types.includes(t)}
                onPress={() => set({ types: filters.types.includes(t) ? filters.types.filter((x) => x !== t) : [...filters.types, t] })}
              />
            ))}
          </FilterRow>
          <FilterRow label="When">
            {WHENS.map((w) => (
              <Chip key={w} label={WHEN_LABELS[w]} on={filters.when === w} onPress={() => set({ when: w })} />
            ))}
          </FilterRow>
          <FilterRow label="Show">
            <Chip label="I can go" on={filters.canGoOnly} onPress={() => set({ canGoOnly: true })} />
            <Chip label="Everything" on={!filters.canGoOnly} onPress={() => set({ canGoOnly: false })} />
          </FilterRow>
          <FilterRow label="For">
            {VEHICLES.map((v) => (
              <Chip key={v} label={VEHICLE_LABELS[v]} on={filters.vehicles === v} onPress={() => set({ vehicles: v })} />
            ))}
          </FilterRow>
          {changed ? (
            <LinkText
              label="Back to my usual search ›"
              onPress={() => {
                setFilters(defaultFilters(travel.miles));
                setUseHere(false);
              }}
            />
          ) : null}
        </Card>
      ) : (
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Txt v="muted" style={{ flex: 1 }} accessibilityLabel={`Searching ${describeFilters(filters, useHere)}`}>
            {describeFilters(filters, useHere)}
          </Txt>
          <LinkText label="Change ›" accessibilityLabel="Change the search" onPress={() => setEditing(true)} />
        </Card>
      )}
      {locNote ? <Notice onDismiss={() => setLocNote(null)}>{locNote}</Notice> : null}

      <Section title={plural(hits.length, 'event')}>
        <Txt v="caption">
          Nearest first, from {useHere ? 'where you are (to about 1 km)' : 'your home area'}. Until a stop unlocks, an event
          shows its rough area, and the distance is to that area.
        </Txt>
        {hits.length === 0 ? (
          <EmptyState
            glyph="meet"
            title="Nothing matches"
            body="Try a wider distance, any time, or Everything. Or host your own."
            action={{ label: 'Change the search', onPress: () => setEditing(true) }}
            secondary={{ label: 'Host one', onPress: () => router.push('/event/new') }}
          />
        ) : (
          hits.map((h) => (
            <EventCard
              key={h.view.event.id}
              view={h.view}
              now={now}
              tag={fresh.has(h.view.event.id) ? 'New' : undefined}
              note={hitNote(h, useHere)}
            />
          ))
        )}
      </Section>
      </>
      )}
      <View style={{ height: 8 }} />
    </ScrollView>
  );
}

function FilterRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      <Txt v="label">{label}</Txt>
      <Row gap={6}>{children}</Row>
    </View>
  );
}
