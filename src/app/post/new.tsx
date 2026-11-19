import { openCreated } from '../../lib/openCreated';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { BuildChooser, ComposerPhotos, Field, INPUT, useDiscardGuard } from '../../components/ComposerParts';
import { ActionBar, Button, ChoiceGroup, DsText, ErrorState, PAGE_WITH_BAR, useToast } from '../../components/ds';
import { SELLING_HINT, sellingHint } from '../../lib/moderation';
import { MapPicker } from '../../components/MapPicker';
import { useCommunity, useMediaLimits } from '../../lib/communityStore';
import { lastMapView } from '../../lib/lastView';
import { postPickerStart } from '../../lib/picker';
import { locationProblem, POST_LIMITS, postProblem, VISIBILITY, type PostVisibility } from '../../lib/posts';
import { useStore } from '../../lib/store';
import type { LatLng } from '../../lib/types';
import { COLOR, POST_COLOUR, RADII, SPACING } from '../../theme';

/** New post: words, photos (plate-blurred), an optional place on the map, who sees it, and a linked build. */
export default function NewPost() {
  const { users, me, builds, settings, setSettings } = useStore();
  const community = useCommunity();
  const home = users.find((u) => u.id === me)?.home ?? null;
  const mine = builds.filter((b) => b.ownerId === me);
  const [body, setBody] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const limits = useMediaLimits();
  const [at, setAt] = useState<LatLng | null>(null);
  const [placeName, setPlaceName] = useState('');
  const [visibility, setVisibility] = useState<PostVisibility>('public');
  const [buildId, setBuildId] = useState<string | undefined>(mine.length === 1 ? mine[0].id : undefined);
  const [picking, setPicking] = useState(false);
  const [placeError, setPlaceError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const guard = useDiscardGuard(!!body.trim() || photos.length > 0 || !!at, 'this post');

  async function submit() {
    setError(null);
    const draft = { body, photos, at, placeName, visibility, buildId };
    if (!body.trim() && !photos.length) return setError('Write something or add a photo first.');
    const p = postProblem(draft, home);
    if (p) return setError(p);
    setBusy(true);
    try {
      const id = await community.run((s) => s.createPost(draft));
      // "On the map" should mean you can see it there: turn the Posts layer on (REVIEW-7 bug 8).
      if (at && !settings.postsLayer) setSettings({ postsLayer: true });
      toast({ message: 'Posted' });
      guard.leave(() => openCreated({ pathname: '/post/[id]', params: { id } }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't post that.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1 }}>
    <ScrollView contentContainerStyle={PAGE_WITH_BAR} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive" automaticallyAdjustKeyboardInsets>
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
        <ComposerPhotos photos={photos} onChange={setPhotos} onError={setError} max={limits.photos} />
      </Field>

      <Field label="Place (optional)" hint={at ? 'It shows on the map\'s Posts layer for 30 days.' : 'Posts with a place show on the map. Never your home: places within about half a mile of your home area can\'t be shared.'}>
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
        <ChoiceGroup<PostVisibility>
          label=""
          value={visibility}
          onChange={setVisibility}
          options={[
            { key: 'public', label: VISIBILITY.public.label },
            { key: 'connections', label: VISIBILITY.connections.label },
          ]}
        />
      </Field>

      <BuildChooser builds={mine} value={buildId} onChange={setBuildId} />

      <View style={{ gap: SPACING.sm }}>
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
        start={postPickerStart({ picked: at, lastView: lastMapView(), here: null, home })}
        locateOnOpen
        refuse={(p) => !!locationProblem(p, home)}
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
      <ActionBar primary={{ label: 'Post', onPress: () => void submit(), busy, haptic: 'success' }} />
      {guard.sheet}
    </View>
  );
}
