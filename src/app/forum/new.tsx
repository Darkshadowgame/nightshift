import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { BuildChooser, ComposerPhotos, Field, INPUT } from '../../components/ComposerParts';
import { Button, ChoiceGroup, DsText, ErrorState } from '../../components/ds';
import { useCommunity } from '../../lib/communityStore';
import { BOARDS, LIMITS, threadProblem, type BoardKey } from '../../lib/forum';
import { REGIONS } from '../../lib/profile';
import { useStore } from '../../lib/store';
import { COLOR, SPACING } from '../../theme';

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
      setError(e instanceof Error ? e.message : "Couldn't post that.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: SPACING.screen, gap: SPACING.section, paddingBottom: SPACING.xxxl }} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive" automaticallyAdjustKeyboardInsets>
      <Field label="Title" hint="One line that says what you need. People pick threads by the title.">
        <TextInput value={title} onChangeText={setTitle} placeholder="e.g. Clutch slipping after a remap" placeholderTextColor={COLOR.text.secondary} maxLength={LIMITS.title[1]} accessibilityLabel="Thread title" style={INPUT} />
      </Field>
      <Field label="Details">
        <TextInput
          value={body}
          onChangeText={setBody}
          placeholder="What's the car or bike, what have you tried, what do you want to know?"
          placeholderTextColor={COLOR.text.secondary}
          multiline
          maxLength={LIMITS.body}
          accessibilityLabel="Thread details"
          style={[INPUT, { minHeight: 140, textAlignVertical: 'top' }]}
        />
      </Field>
      <View style={{ gap: SPACING.xs }}>
        <ChoiceGroup<BoardKey> label="Board" value={board} onChange={setBoard} options={BOARDS.map((b) => ({ key: b.key, label: b.short }))} />
        <DsText v="caption">{info.label}. {info.hint}</DsText>
      </View>
      {board === 'local' ? <ChoiceGroup<string> label="Region" value={region} onChange={setRegion} options={REGIONS.map((r) => ({ key: r.name, label: r.name }))} /> : null}
      <Field label="Photos">
        <ComposerPhotos photos={photos} onChange={setPhotos} onError={setError} />
      </Field>
      <BuildChooser builds={mine} value={buildId} onChange={setBuildId} />
      <View style={{ gap: SPACING.sm }}>
        <Button label="Post thread" size="lg" block haptic="success" onPress={submit} busy={busy} disabled={!title.trim()} hint="Give it a title first" />
        {error ? <ErrorState title={error} /> : null}
        <DsText v="caption">
          {board === 'for_sale' ? 'Nightshift never handles payments: meet safely and pay in person. ' : ''}
          No street racing, no timing on public roads and nothing about where police are.
        </DsText>
      </View>
    </ScrollView>
  );
}
