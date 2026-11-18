import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, TextInput, View } from 'react-native';
import { ADDRESS_SEARCH_IN_APP, geocoderAvailable, searchPlaces, SearchError } from '../lib/location';
import { searchQuery, type PlaceHit } from '../lib/placeNames';
import { COLOR, RADII, SPACING } from '../theme';
import { DsText, ErrorState, INPUT, Press } from './ds';

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

  if (!geocoderAvailable) {
    // The web preview has no geocoder: say so plainly instead of a search box that can only fail.
    return <DsText v="caption">{ADDRESS_SEARCH_IN_APP} Here, move or tap the map.</DsText>;
  }

  function pick(h: PlaceHit) {
    seq.current++;
    setHits([]);
    setState('idle');
    setText(h.label);
    onPick(h);
  }

  return (
    <View style={{ gap: SPACING.xs }}>
      <View>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={placeholder}
          placeholderTextColor={COLOR.text.secondary}
          autoCorrect={false}
          returnKeyType="search"
          style={[INPUT, { paddingRight: SPACING.xxxl }]}
          accessibilityLabel="Search for a place"
        />
        {state === 'searching' ? <ActivityIndicator color={COLOR.text.secondary} style={{ position: 'absolute', right: SPACING.md, top: 0, bottom: 0 }} /> : null}
      </View>
      {state === 'none' ? <DsText v="secondary">No UK places found. Try a postcode or a town name.</DsText> : null}
      {state === 'error' ? <ErrorState title={error} /> : null}
      {hits.map((h) => (
        <Press
          key={`${h.at.lat},${h.at.lng}`}
          onPress={() => pick(h)}
          label={`Go to ${h.label}`}
          style={{ paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, minHeight: 44, justifyContent: 'center', borderRadius: RADII.control, borderWidth: 1, borderColor: COLOR.surface.border, backgroundColor: COLOR.surface.card }}
        >
          <DsText numberOfLines={1}>{h.label}</DsText>
        </Press>
      ))}
    </View>
  );
}
