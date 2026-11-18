import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { BuildChooser, ComposerPhotos, Field, INPUT } from '../../components/ComposerParts';
import { Button, DsText, ErrorState, SegmentedControl } from '../../components/ds';
import { SELLING_HINT, sellingHint } from '../../lib/moderation';
import { MapPicker } from '../../components/MapPicker';
import { useCommunity } from '../../lib/communityStore';
import { locationProblem, POST_LIMITS, postProblem, VISIBILITY, type PostVisibility } from '../../lib/posts';
import { useStore } from '../../lib/store';
import type { LatLng } from '../../lib/types';
import { COLOR, POST_COLOUR, RADII, SPACING } from '../../theme';

/** New post: words, photos (plate-blurred), an optional place on the map, who sees it, and a linked build. */
export default function NewPost() {
  const { users, me, builds } = useStore();
  const community = useCommunity();
  const home = users.find((u) => u.id === me)?.home ?? null;
  const mine = builds.filter((b) => b.ownerId === me);
  const [body, setBody] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [at, setAt] = useState<LatLng | null>(null);
  const [placeName, setPlaceName] = useState('');
  const [visibility, setVisibility] = useState<PostVisibility>('public');
  const [buildId, setBuildId] = useState<string | undefined>(mine.length === 1 ? mine[0].id : undefined);
  const [picking, setPicking] = useState(false);
  const [placeError, setPlaceError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError(null);
    const draft = { body, photos, at, placeName, visibility, buildId };
    const p = postProblem(draft, home);
    if (p) return setError(p);
    setBusy(true);
    try {
      const id = await community.run((s) => s.createPost(draft));
      router.replace({ pathname: '/post/[id]', params: { id } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't post that.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: SPACING.screen, gap: SPACING.section, paddingBottom: SPACING.xxxl }} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive" automaticallyAdjustKeyboardInsets>
      <Field label="Post">
        <TextInput
          value={body}
          onChangeText={setBody}
          placeholder="What's happening with the build?"
          placeholderTextColor={COLOR.text.secondary}
          multiline
          maxLength={POST_LIMITS.body}
          accessibilityLabel="Post text"
          style={[INPUT, { minHeight: 120, textAlignVertical: 'top' }]}
        />
      </Field>

      <Field label="Photos">
        <ComposerPhotos photos={photos} onChange={setPhotos} onError={setError} />
      </Field>

      <Field label="Place (optional)" hint={at ? 'It shows on the map\'s Posts layer for 30 days.' : 'Posts with a place show on the map. Never your home: places within about 1 km of your home area can\'t be shared.'}>
        {at ? (
          <View style={{ gap: SPACING.sm, padding: SPACING.md, borderRadius: RADII.card, borderWidth: 1, borderColor: COLOR.surface.border, backgroundColor: COLOR.surface.card }}>
            <TextInput
              value={placeName}
              onChangeText={setPlaceName}
              placeholder="Name it, e.g. Old airfield car park"
              placeholderTextColor={COLOR.text.secondary}
              maxLength={POST_LIMITS.placeName}
              accessibilityLabel="Name of the place"
              style={INPUT}
            />
            <View style={{ flexDirection: 'row', gap: SPACING.md }}>
              <Button label="Move it" tier="tertiary" size="sm" onPress={() => setPicking(true)} />
              <Button label="Remove the place" tier="tertiary" size="sm" onPress={() => setAt(null)} />
            </View>
          </View>
        ) : (
          <Button label="Add a place" tier="secondary" block onPress={() => setPicking(true)} />
        )}
        {placeError ? <ErrorState title={placeError} /> : null}
      </Field>

      <Field label="Who sees it" hint={`${VISIBILITY[visibility].hint}.`}>
        <SegmentedControl<PostVisibility>
          value={visibility}
          onChange={setVisibility}
          accessibilityLabel="Who sees it"
          options={[
            { key: 'public', label: VISIBILITY.public.label },
            { key: 'connections', label: VISIBILITY.connections.label },
          ]}
        />
      </Field>

      <BuildChooser builds={mine} value={buildId} onChange={setBuildId} />

      <View style={{ gap: SPACING.sm }}>
        <Button label="Post" size="lg" block haptic="success" onPress={submit} busy={busy} disabled={!body.trim() && !photos.length} hint="Write something or add a photo first" />
        {error ? <ErrorState title={error} /> : null}
        {sellingHint(body) ? <DsText v="caption" tone="warning">{SELLING_HINT}</DsText> : null}
        <DsText v="caption">No street racing, no timing on public roads and nothing about where police are. Posts can be reported.</DsText>
      </View>

      <MapPicker
        visible={picking}
        mode="point"
        title="Place the post"
        hint={placeError ?? 'Move the map so the crosshair is on the spot. Not near your home.'}
        confirmLabel="Use this place"
        colour={POST_COLOUR}
        start={at ?? home ?? { lat: 52.63, lng: -1.7 }}
        span={0.05}
        initial={at ? [at] : []}
        showKinds={['photo', 'venue', 'track']}
        snap
        onDone={(stops) => {
          const s = stops[0];
          if (!s) {
            setPicking(false);
            return;
          }
          const problem = locationProblem(s.at, home);
          if (problem) {
            // Stay on the map and say why (B5): closing it left the post with no place and no word about it.
            setPlaceError(problem);
            return;
          }
          setPicking(false);
          setPlaceError(null);
          setAt(s.at);
          if (s.name && !placeName) setPlaceName(s.name.slice(0, POST_LIMITS.placeName));
        }}
        onCancel={() => setPicking(false)}
      />
    </ScrollView>
  );
}
