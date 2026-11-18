import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { BuildChooser, ComposerPhotos } from '../../components/ComposerParts';
import { Button, Chip, InlineError, Row, Section, Txt, s as ui } from '../../components/ui';
import { useCommunity } from '../../lib/communityStore';
import { BOARDS, LIMITS, threadProblem, type BoardKey } from '../../lib/forum';
import { REGIONS } from '../../lib/profile';
import { useStore } from '../../lib/store';
import { C } from '../../theme';

/** Start a thread: board, title, body, photos (plate-blurred) and a linked build. */
export default function NewThread() {
  const params = useLocalSearchParams<{ board?: string }>();
  const { users, me, builds } = useStore();
  const community = useCommunity();
  const mine = builds.filter((b) => b.ownerId === me);
  const myRegion = users.find((u) => u.id === me)?.region || REGIONS[0].name;
  const [board, setBoard] = useState<BoardKey>(BOARDS.some((b) => b.key === params.board) ? (params.board as BoardKey) : 'advice');
  const [region, setRegion] = useState(myRegion);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [buildId, setBuildId] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const info = BOARDS.find((b) => b.key === board)!;

  async function submit() {
    setError(null);
    const draft = { board, region: board === 'local' ? region : undefined, title, body, photos, buildId };
    const p = threadProblem(draft);
    if (p) return setError(p);
    setBusy(true);
    try {
      const id = await community.run((s) => s.createThread(draft));
      router.replace({ pathname: '/forum/[id]', params: { id } });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not post that.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: 60 }} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive" automaticallyAdjustKeyboardInsets>
      <Section title="Board">
        <Row>
          {BOARDS.map((b) => (
            <Chip key={b.key} label={b.short} on={board === b.key} onPress={() => setBoard(b.key)} accessibilityLabel={b.label} />
          ))}
        </Row>
        <Txt v="caption">{info.label}: {info.hint}</Txt>
        {board === 'local' ? (
          <Row>
            {REGIONS.map((r) => (
              <Chip key={r.name} label={r.name} raw on={region === r.name} onPress={() => setRegion(r.name)} />
            ))}
          </Row>
        ) : null}
      </Section>
      <Section title="Title">
        <TextInput value={title} onChangeText={setTitle} placeholder="e.g. Clutch slipping after a remap" placeholderTextColor={C.fog} maxLength={LIMITS.title[1]} accessibilityLabel="Thread title" style={ui.input} />
      </Section>
      <Section title="Details">
        <TextInput
          value={body}
          onChangeText={setBody}
          placeholder="What's the car or bike, what have you tried, what do you want to know?"
          placeholderTextColor={C.fog}
          multiline
          maxLength={LIMITS.body}
          accessibilityLabel="Thread details"
          style={[ui.input, { minHeight: 140, textAlignVertical: 'top' }]}
        />
      </Section>
      <Section title="Photos">
        <ComposerPhotos photos={photos} onChange={setPhotos} onError={setError} />
      </Section>
      <Section title="Link a build">
        <BuildChooser builds={mine} value={buildId} onChange={setBuildId} />
      </Section>
      <View style={{ gap: 8 }}>
        <Button label="Post thread" onPress={submit} busy={busy} />
        <InlineError message={error} />
        <Txt v="caption">
          {board === 'for_sale' ? 'Nightshift never handles payments: meet safely and pay in person. ' : ''}
          No street racing, no timing on public roads and nothing about where police are.
        </Txt>
      </View>
    </ScrollView>
  );
}
