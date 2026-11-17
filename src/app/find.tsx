import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { EventCard } from '../components/EventCard';
import { Card, Chip, Row, Section, Txt } from '../components/ui';
import {
  ALL_TYPES,
  defaultFilters,
  describeDistance,
  searchEvents,
  travelOf,
  TRAVEL_CHOICES,
  WHEN_LABELS,
  type SearchFilters,
  type Vehicles,
  type When,
} from '../lib/discover';
import { EVENT_LABELS } from '../lib/events';
import { plural } from '../lib/format';
import { fuzz } from '../lib/geo';
import { currentPosition } from '../lib/location';
import { useStore } from '../lib/store';
import type { LatLng } from '../lib/types';
import { C, EVENT_COLOURS } from '../theme';

const WHENS: When[] = ['any', 'tonight', 'week', 'weekend'];
const VEHICLES: { key: Vehicles; label: string }[] = [
  { key: 'any', label: 'Cars + bikes' },
  { key: 'cars', label: 'Cars' },
  { key: 'bikes', label: 'Bikes' },
];

/**
 * Find events: every upcoming event you can see, nearest first. Locked events
 * only ever show their rough area; the distance is to that area, never a stop.
 */
export default function FindEvents() {
  const { events, me, crews, users, builds, now, nearby, markNearbySeen } = useStore();
  const meUser = users.find((u) => u.id === me)!;
  const travel = travelOf(meUser);
  const [filters, setFilters] = useState<SearchFilters>(() => defaultFilters(travel.miles));
  const [here, setHere] = useState<LatLng | null>(null);
  const [useHere, setUseHere] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locNote, setLocNote] = useState<string | null>(null);
  // NEW tags stay for this visit; leaving the screen marks them seen.
  const [fresh] = useState(() => new Set(nearby?.unseen ?? []));
  useFocusEffect(useCallback(() => () => markNearbySeen(), [markNearbySeen]));

  const origin = useHere && here ? here : meUser.home;
  const hits = useMemo(
    () => searchEvents(events, { me, crews, users, builds }, origin, filters, now),
    [events, me, crews, users, builds, origin, filters, now],
  );
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
      <Card>
        <FilterRow label="From">
          <Chip label="Home area" on={!useHere} onPress={() => setUseHere(false)} />
          <Chip label={locating ? 'Finding you…' : 'Where I am'} on={useHere} onPress={fromHere} />
        </FilterRow>
        {locNote ? <Txt v="muted" style={{ color: C.alert }}>{locNote}</Txt> : null}
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
              colour={EVENT_COLOURS[t]}
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
            <Chip key={v.key} label={v.label} on={filters.vehicles === v.key} onPress={() => set({ vehicles: v.key })} />
          ))}
        </FilterRow>
        {changed ? (
          <Pressable
            onPress={() => {
              setFilters(defaultFilters(travel.miles));
              setUseHere(false);
            }}
            accessibilityRole="button"
            hitSlop={8}
          >
            <Txt v="label" style={{ color: C.sodium }}>Back to my usual search</Txt>
          </Pressable>
        ) : null}
      </Card>

      <Section title={plural(hits.length, 'event')}>
        <Txt v="muted" style={{ fontSize: 12 }}>
          Nearest first, from {useHere ? 'where you are (to about 1 km)' : 'your home area'}. Locked events show their rough area
          until the reveal; distances are to that area.
        </Txt>
        {hits.length === 0 ? (
          <Card>
            <Txt v="muted">
              Nothing matches. Try a wider distance, any time, or Everything. To host your own, tap + Host on the Events tab.
            </Txt>
          </Card>
        ) : (
          hits.map((h) => (
            <EventCard
              key={h.view.event.id}
              view={h.view}
              now={now}
              tag={fresh.has(h.view.event.id) ? 'New' : undefined}
              note={`${describeDistance(h.miles)}${useHere ? ' away' : ' from home'} · ${
                h.canGo ? 'you can go' : h.view.role === 'requested' ? 'you asked to go' : h.view.role === 'declined' ? 'a host said no' : 'ask to go'
              }`}
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
