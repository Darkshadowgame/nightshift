import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, TextInput, View } from 'react-native';
import { searchPlaces, SearchError } from '../lib/location';
import { searchQuery, type PlaceHit } from '../lib/placeNames';
import { C } from '../theme';
import { Txt, s as ui } from './ui';

const DEBOUNCE_MS = 600;

/**
 * Search box for a postcode, town or place, using the phone's own geocoder.
 * Waits until typing stops, then lists up to five UK places; tapping one calls
 * `onPick` (e.g. to move the map there).
 */
export function PlaceSearch({ onPick, placeholder = 'Search a postcode, town or place' }: { onPick: (hit: PlaceHit) => void; placeholder?: string }) {
  const [text, setText] = useState('');
  const [hits, setHits] = useState<PlaceHit[]>([]);
  const [state, setState] = useState<'idle' | 'searching' | 'none' | 'error'>('idle');
  const [error, setError] = useState('');
  /** Only the latest search may update the list. */
  const seq = useRef(0);

  useEffect(() => {
    const mine = ++seq.current;
    if (!searchQuery(text)) {
      setHits([]);
      setState('idle');
      return;
    }
    const t = setTimeout(async () => {
      setState('searching');
      try {
        const found = await searchPlaces(text);
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

  function pick(h: PlaceHit) {
    seq.current++;
    setHits([]);
    setState('idle');
    setText(h.label);
    onPick(h);
  }

  return (
    <View style={{ gap: 6 }}>
      <View>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={placeholder}
          placeholderTextColor={C.fog}
          autoCorrect={false}
          returnKeyType="search"
          style={[ui.input, { paddingRight: 40 }]}
          accessibilityLabel="Search for a place"
        />
        {state === 'searching' ? <ActivityIndicator color={C.fog} style={{ position: 'absolute', right: 12, top: 0, bottom: 0 }} /> : null}
      </View>
      {state === 'none' ? <Txt v="muted">No UK places found. Try a postcode or a town name.</Txt> : null}
      {state === 'error' ? <Txt v="muted" style={{ color: C.alert }}>{error}</Txt> : null}
      {hits.map((h) => (
        <Pressable
          key={`${h.at.lat},${h.at.lng}`}
          onPress={() => pick(h)}
          accessibilityRole="button"
          accessibilityLabel={`Go to ${h.label}`}
          style={({ pressed }) => [
            { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 6, borderWidth: 1, borderColor: C.kerb, backgroundColor: C.tarmac },
            pressed && { opacity: 0.7 },
          ]}
        >
          <Txt numberOfLines={1}>{h.label}</Txt>
        </Pressable>
      ))}
    </View>
  );
}
