import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { EventCard } from '../components/EventCard';
import { Pin } from '../components/Pin';
import { Card, Chip, EmptyState, LinkText, Notice, Row, Section, Txt, s as ui } from '../components/ui';
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
import { fuzz } from '../lib/geo';
import { currentPosition } from '../lib/location';
import { useStore } from '../lib/store';
import { useNow } from '../lib/clock';
import type { LatLng } from '../lib/types';
import { BRAND } from '../theme';

const WHENS: When[] = ['any', 'tonight', 'week', 'weekend'];
const VEHICLES: Vehicles[] = ['any', 'cars', 'bikes'];

/**
 * Find: "Where to?" (any address or place, then turn by turn: where.tsx) at
 * the top, then events: every upcoming event you can see, nearest first. Locked events
 * only ever show their rough area; the distance is to that area, never a stop.
 */
export default function FindEvents() {
  const { events, me, crews, users, builds, nearby, markNearbySeen, remote } = useStore();
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

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 18, paddingBottom: 40 }}>
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
