import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Linking, Pressable, ScrollView, View } from 'react-native';
import type { CommonsPhoto } from '../lib/commons';
import { nearbyCommonsPhotos } from '../lib/commonsClient';
import type { LatLng } from '../lib/types';
import { C } from '../theme';
import { Section, Txt } from './ui';

type State = { step: 'loading' } | { step: 'done'; photos: CommonsPhoto[] } | { step: 'offline' };

/**
 * "Online photos": public photos of cars and bikes taken near a place, from
 * Wikimedia Commons (anything else is filtered out in commons.ts). The whole
 * section hides when there are none. Each shows its
 * author and licence and opens its Commons page when tapped. Fetched when the
 * screen opens (only the place's coordinates are sent) and kept for a week.
 */
export function CommonsStrip({ at, radiusM, placeName }: { at: LatLng; radiusM: number; placeName: string }) {
  const [state, setState] = useState<State>({ step: 'loading' });
  useEffect(() => {
    let live = true;
    setState({ step: 'loading' });
    nearbyCommonsPhotos(at, radiusM, placeName).then((r) => {
      if (!live) return;
      setState(r.status === 'ok' ? { step: 'done', photos: r.photos } : { step: 'offline' });
    });
    return () => {
      live = false;
    };
  }, [at.lat, at.lng, radiusM, placeName]);

  if (state.step === 'done' && state.photos.length === 0) return null;
  return (
    <Section title={state.step === 'done' ? `Online photos (${state.photos.length})` : 'Online photos'}>
      {state.step === 'loading' ? (
        <View style={{ height: 60, justifyContent: 'center' }}>
          <ActivityIndicator color={C.fog} />
        </View>
      ) : state.step === 'offline' ? (
        <Txt v="muted" style={{ fontSize: 13 }}>Couldn't load online photos just now. They'll show when you have a signal.</Txt>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
          {state.photos.map((p) => (
            <Pressable
              key={p.page}
              onPress={() => Linking.openURL(p.page).catch(() => {})}
              accessibilityRole="link"
              accessibilityLabel={`${p.title}. Photo by ${p.author}, ${p.licence}. Opens Wikimedia Commons`}
              style={({ pressed }) => [{ width: 168, gap: 4 }, pressed && { opacity: 0.8 }]}
            >
              <Image
                source={{ uri: p.thumb }}
                style={{ width: 168, height: 118, borderRadius: 6, borderWidth: 1, borderColor: C.kerb, backgroundColor: C.tarmac }}
                resizeMode="cover"
              />
              <Txt v="muted" style={{ fontSize: 11, lineHeight: 14 }} numberOfLines={2}>
                {p.author} · {p.licence}
              </Txt>
            </Pressable>
          ))}
        </ScrollView>
      )}
      <Txt v="muted" style={{ fontSize: 11 }}>From Wikimedia Commons, credited to each photographer. Tap one for its licence and the full picture.</Txt>
    </Section>
  );
}