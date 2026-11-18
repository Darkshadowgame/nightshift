import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { BuildChooser, ComposerPhotos } from '../../components/ComposerParts';
import { MapPicker } from '../../components/MapPicker';
import { Button, Card, InlineError, LinkText, Notice, Row, Section, Segmented, Txt, s as ui } from '../../components/ui';
import { useCommunity } from '../../lib/communityStore';
import { locationProblem, POST_LIMITS, postProblem, VISIBILITY, type PostVisibility } from '../../lib/posts';
import { useStore } from '../../lib/store';
import type { LatLng } from '../../lib/types';
import { C, POST_COLOUR } from '../../theme';

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
      setError(e instanceof Error ? e.message : 'Could not post that.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: 60 }} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive" automaticallyAdjustKeyboardInsets>
      <TextInput
        value={body}
        onChangeText={setBody}
        placeholder="What's happening with the build?"
        placeholderTextColor={C.fog}
        multiline
        maxLength={POST_LIMITS.body}
        accessibilityLabel="Post text"
        style={[ui.input, { minHeight: 120, textAlignVertical: 'top' }]}
      />

      <Section title="Photos">
        <ComposerPhotos photos={photos} onChange={setPhotos} onError={setError} />
      </Section>

      <Section title="Place (optional)">
        {at ? (
          <Card>
            <TextInput
              value={placeName}
              onChangeText={setPlaceName}
              placeholder="Name it, e.g. Old airfield car park"
              placeholderTextColor={C.fog}
              maxLength={POST_LIMITS.placeName}
              accessibilityLabel="Name of the place"
              style={ui.input}
            />
            <Row gap={18}>
              <LinkText label="Move it ›" onPress={() => setPicking(true)} />
              <LinkText label="Remove the place" colour={C.fog} onPress={() => setAt(null)} />
            </Row>
            <Txt v="caption">It shows on the map's Posts layer for 30 days.</Txt>
          </Card>
        ) : (
          <>
            <Button label="Add a place" kind="secondary" onPress={() => setPicking(true)} />
            <Txt v="caption">Posts with a place show on the map. Never your home: places within about 1 km of your home area can't be shared.</Txt>
          </>
        )}
        {placeError ? <Notice onDismiss={() => setPlaceError(null)}>{placeError}</Notice> : null}
      </Section>

      <Section title="Who sees it">
        <Segmented<PostVisibility>
          value={visibility}
          onChange={setVisibility}
          options={[
            { key: 'public', label: VISIBILITY.public.label },
            { key: 'connections', label: VISIBILITY.connections.label },
          ]}
        />
        <Txt v="caption">{VISIBILITY[visibility].hint}.</Txt>
      </Section>

      <Section title="Link a build">
        <BuildChooser builds={mine} value={buildId} onChange={setBuildId} />
      </Section>

      <View style={{ gap: 8 }}>
        <Button label="Post" onPress={submit} busy={busy} />
        <InlineError message={error} />
        <Txt v="caption">No street racing, no timing on public roads and nothing about where police are. Posts can be reported.</Txt>
      </View>

      <MapPicker
        visible={picking}
        mode="point"
        title="PLACE THE POST"
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
