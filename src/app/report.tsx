import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { Button, Card, Chip, InlineError, Row, Section, ToggleRow, Txt, s as ui } from '../components/ui';
import { useCommunity } from '../lib/communityStore';
import { REPORT_REASONS, reportProblem, type ReportReason, type ReportTarget } from '../lib/moderation';
import { useStore } from '../lib/store';
import { C, STATE } from '../theme';

const TARGETS: ReportTarget[] = ['thread', 'reply', 'message', 'post', 'comment', 'profile', 'build', 'chat', 'event', 'crew', 'spot'];

/**
 * Report something, with a reason (and block the person too, if you like), or
 * block someone (`target=block`, with an optional report). Reports go to the
 * Nightshift team; three different people reporting a post hides it until
 * someone looks.
 */
export default function ReportScreen() {
  const p = useLocalSearchParams<{ target: string; id: string; user?: string; what?: string }>();
  const { users } = useStore();
  const community = useCommunity();
  const blocking = p.target === 'block';
  const target = (TARGETS.includes(p.target as ReportTarget) ? p.target : 'profile') as ReportTarget;
  const userId = p.user ?? (blocking ? p.id : undefined);
  const handle = users.find((u) => u.id === userId)?.handle;
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [note, setNote] = useState('');
  const [alsoBlock, setAlsoBlock] = useState(false);
  const [alsoReport, setAlsoReport] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const what = p.what ?? target;

  async function submit() {
    setError(null);
    const reporting = !blocking || alsoReport;
    if (reporting) {
      const problem = reportProblem(reason, note);
      if (problem) return setError(problem);
    }
    setBusy(true);
    try {
      if (reporting) await community.run((s) => s.report(blocking ? 'profile' : target, p.id, reason!, note));
      if ((blocking || alsoBlock) && userId) await community.run((s) => s.block(userId));
      setDone(
        blocking
          ? `@${handle ?? 'They'} is blocked.${reporting ? ' Thanks for the report too.' : ''}`
          : `Thanks. The Nightshift team will look at it.${alsoBlock ? ` @${handle ?? 'They'} is blocked.` : ''}`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send that.');
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <View style={{ flex: 1, backgroundColor: C.asphalt, padding: 16, gap: 16 }}>
        <Card accent={STATE.success}>
          <Txt v="h3">{blocking ? 'Blocked' : 'Report sent'}</Txt>
          <Txt>{done}</Txt>
          {blocking || alsoBlock ? <Txt v="caption">Unblock any time from Community › People › Connections and blocked people.</Txt> : null}
        </Card>
        <Button label="Done" onPress={() => router.back()} />
      </View>
    );
  }

  const reasons = (
    <>
      <View style={{ gap: 8 }}>
        {REPORT_REASONS.map((r) => (
          <Chip key={r.key} label={r.label} raw on={reason === r.key} onPress={() => setReason(r.key)} />
        ))}
      </View>
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder={reason === 'other' ? "Say what's wrong" : 'Anything else we should know (optional)'}
        placeholderTextColor={C.fog}
        multiline
        maxLength={500}
        accessibilityLabel="Note for the Nightshift team"
        style={[ui.input, { minHeight: 80, textAlignVertical: 'top' }]}
      />
    </>
  );

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 18, paddingBottom: 60 }} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
      {blocking ? (
        <>
          <Txt v="h2" style={{ textTransform: 'none' }}>Block @{handle ?? 'this person'}?</Txt>
          <Card>
            <Txt>They won't be able to message you or connect with you, and you won't see their posts, threads, replies, comments, messages or event chat.</Txt>
            <Txt v="caption">They aren't told. Any connection between you ends.</Txt>
          </Card>
          <ToggleRow label="Report them too" hint="Tell the Nightshift team what happened." value={alsoReport} onValueChange={setAlsoReport} />
          {alsoReport ? <Section title="What's wrong?">{reasons}</Section> : null}
          <Row>
            <Button label={busy ? 'Blocking…' : 'Block'} kind="danger" onPress={submit} busy={busy} style={{ flex: 1 }} />
          </Row>
        </>
      ) : (
        <>
          <Txt v="h2">Report this {what}</Txt>
          <Section title="What's wrong?">{reasons}</Section>
          {userId && userId !== community.me ? (
            <ToggleRow label={`Also block @${handle ?? 'them'}`} hint="Hides everything they post from you and stops their messages." value={alsoBlock} onValueChange={setAlsoBlock} />
          ) : null}
          <Button label="Send report" onPress={submit} busy={busy} disabled={!reason} />
          <Txt v="caption">Reports are private. If someone's in danger, call 999.</Txt>
        </>
      )}
      <InlineError message={error} />
    </ScrollView>
  );
}
