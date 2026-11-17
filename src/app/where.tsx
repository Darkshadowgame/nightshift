import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { ActivityIndicator, Keyboard, ScrollView, TextInput, View } from 'react-native';
import { NavLaunch } from '../components/NavLaunch';
import { NightMap } from '../components/NightMap';
import { Card, InlineError, LinkText, ListRow, Row, Section, Tag, Txt, s as ui } from '../components/ui';
import { currentPosition, searchDestinations, SearchError } from '../lib/location';
import { useStore } from '../lib/store';
import type { LatLng } from '../lib/types';
import {
  clearRecent,
  distanceNote,
  rememberRecent,
  samePlace,
  savedPlaces,
  setSlot,
  SLOT_LABELS,
  whereQueries,
  type Destination,
  type SavedSlot,
} from '../lib/whereTo';
import { BRAND, C, RADIUS } from '../theme';

const DEBOUNCE_MS = 600;
const SLOTS: SavedSlot[] = ['home', 'work'];

/**
 * "Where to?": search any address, postcode or place (UK first, abroad too),
 * see it on the map, then Go here: Nightshift's own turn-by-turn, or the app
 * chosen with "Always use…". Recent places, Home and Work stay on this phone.
 * Only Apple's geocoder sees what's typed; nothing is logged.
 */
export default function WhereTo() {
  const { settings, updatePlaces } = useStore();
  const places = savedPlaces(settings.places);
  // Find can hand over what was typed there (`q`).
  const { q } = useLocalSearchParams<{ q?: string }>();
  const [text, setText] = useState(typeof q === 'string' ? q : '');
  const [hits, setHits] = useState<Destination[]>([]);
  const [state, setState] = useState<'idle' | 'searching' | 'none' | 'error'>('idle');
  const [error, setError] = useState('');
  const [picked, setPicked] = useState<Destination | null>(null);
  const [here, setHere] = useState<LatLng | null>(null);
  const input = useRef<ComponentRef<typeof TextInput>>(null);
  /** Only the latest search may update the list. */
  const seq = useRef(0);

  useEffect(() => {
    let live = true;
    currentPosition(false).then((p) => live && p.ok && setHere(p.at));
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    const mine = ++seq.current;
    if (!whereQueries(text)) {
      setHits([]);
      setState('idle');
      return;
    }
    const t = setTimeout(async () => {
      setState('searching');
      try {
        const found = await searchDestinations(text);
        if (mine !== seq.current) return;
        setHits(found);
        setState(found.length ? 'idle' : 'none');
      } catch (e) {
        if (mine !== seq.current) return;
        setHits([]);
        setError(e instanceof SearchError ? e.message : "Couldn't search just now.");
        setState('error');
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [text]);

  function pick(d: Destination) {
    Keyboard.dismiss();
    setPicked(d);
    updatePlaces((p) => rememberRecent(p, d));
  }

  function edit(t: string) {
    setText(t);
    setPicked(null);
  }

  const searching = !!whereQueries(text);
  const slotOf = (d: Destination) => SLOTS.find((k) => places[k] && samePlace(places[k]!, d));
  const subtitle = (d: Destination) => [d.address, distanceNote(here, d.at)].filter(Boolean).join(' · ');

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 18, paddingBottom: 40 }} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
      <View>
        <TextInput
          ref={input}
          value={text}
          onChangeText={edit}
          placeholder="Address, postcode or place"
          placeholderTextColor={C.fog}
          autoFocus={!picked}
          autoCorrect={false}
          returnKeyType="search"
          clearButtonMode="while-editing"
          textContentType="fullStreetAddress"
          style={[ui.input, { paddingRight: 40 }]}
          accessibilityLabel="Where to? Search an address, postcode or place"
        />
        {state === 'searching' ? <ActivityIndicator color={C.fog} style={{ position: 'absolute', right: 34, top: 0, bottom: 0 }} /> : null}
      </View>

      {picked ? (
        <Picked
          place={picked}
          note={distanceNote(here, picked.at)}
          slot={slotOf(picked)}
          onSave={(slot) => updatePlaces((p) => setSlot(p, slot, picked))}
          onNewSearch={() => {
            setPicked(null);
            setText('');
            input.current?.focus();
          }}
        />
      ) : searching ? (
        <View style={{ gap: 8 }}>
          {state === 'none' ? <Txt v="muted">Nothing found. Try the full address, a postcode or a town.</Txt> : null}
          {state === 'error' ? <InlineError message={error} /> : null}
          {hits.map((d) => (
            <ListRow
              key={`${d.at.lat},${d.at.lng}`}
              glyph="destination"
              colour={BRAND}
              title={d.name}
              subtitle={subtitle(d)}
              onPress={() => pick(d)}
              accessibilityLabel={`${d.name}. ${subtitle(d)}`}
            />
          ))}
        </View>
      ) : (
        <>
          <Section title="Saved">
            {SLOTS.map((k) => {
              const d = places[k];
              return (
                <ListRow
                  key={k}
                  glyph="destination"
                  colour={d ? BRAND : C.fog}
                  title={SLOT_LABELS[k]}
                  subtitle={d ? [d.name, d.address].filter(Boolean).join(', ') : `Not set. Search for it, then Save as ${SLOT_LABELS[k]}.`}
                  onPress={d ? () => pick(d) : () => input.current?.focus()}
                  accessibilityLabel={d ? `${SLOT_LABELS[k]}: ${d.name}` : `${SLOT_LABELS[k]}, not set`}
                />
              );
            })}
          </Section>
          <Section
            title="Recent"
            right={places.recent.length ? <LinkText label="Clear" accessibilityLabel="Clear recent places" onPress={() => updatePlaces(clearRecent)} /> : undefined}
          >
            {places.recent.length === 0 ? (
              <Txt v="muted">Places you search for show here.</Txt>
            ) : (
              places.recent.map((d) => (
                <ListRow
                  key={`${d.at.lat},${d.at.lng}`}
                  glyph="destination"
                  colour={C.fog}
                  title={d.name}
                  subtitle={subtitle(d)}
                  onPress={() => pick(d)}
                  accessibilityLabel={`${d.name}. ${subtitle(d)}`}
                />
              ))
            )}
          </Section>
        </>
      )}
      <Txt v="caption">Search uses Apple Maps. What you search for, Home and Work stay on this phone.</Txt>
    </ScrollView>
  );
}

/** The chosen place on the map, with the one primary action: Go here. */
function Picked({
  place,
  note,
  slot,
  onSave,
  onNewSearch,
}: {
  place: Destination;
  note: string | null;
  slot: SavedSlot | undefined;
  onSave: (slot: SavedSlot) => void;
  onNewSearch: () => void;
}) {
  return (
    <Card style={{ gap: 12 }}>
      <View style={{ height: 220, borderRadius: RADIUS.card, overflow: 'hidden' }}>
        <NightMap
          key={`${place.at.lat},${place.at.lng}`}
          pins={[{ id: 'destination', at: place.at, glyph: 'destination', colour: BRAND, title: place.name, size: 40 }]}
          centre={place.at}
          span={0.02}
          showsUser
        />
      </View>
      <View style={{ gap: 2 }}>
        <Txt v="h2">{place.name}</Txt>
        {place.address ? <Txt v="muted">{place.address}</Txt> : null}
        {note ? <Txt v="caption">{note}</Txt> : null}
      </View>
      <NavLaunch
        target={{ kind: 'place', name: place.name, lat: place.at.lat, lng: place.at.lng }}
        to={place.at}
        label="Go here"
        kind="primary"
      />
      <Row gap={18}>
        {slot ? <Tag label={`Saved as ${SLOT_LABELS[slot]}`} tone="success" /> : null}
        {SLOTS.filter((k) => k !== slot).map((k) => (
          <LinkText key={k} label={`Save as ${SLOT_LABELS[k]}`} onPress={() => onSave(k)} />
        ))}
        <LinkText label="New search" colour={C.fog} onPress={onNewSearch} />
      </Row>
    </Card>
  );
}
