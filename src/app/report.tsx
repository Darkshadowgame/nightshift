import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Callout } from '../components/Detail';
import { Button, Card, ChoiceGroup, DsText, ErrorState, Section, SwitchRow, TextField } from '../components/ds';
import { useCommunity } from '../lib/communityStore';
import { REPORT_REASONS, reportProblem, type ReportReason, type ReportTarget } from '../lib/moderation';
import { useStore } from '../lib/store';
import { COLOR, SPACING } from '../theme';

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
      setError(e instanceof Error ? e.message : "Couldn't send that.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <View style={{ flex: 1, backgroundColor: COLOR.surface.bg, padding: SPACING.screen, gap: SPACING.lg }}>
        <Callout tone="success" title={blocking ? 'Blocked' : 'Report sent'}>
          <DsText v="body">{done}</DsText>
          {blocking || alsoBlock ? <DsText v="caption">Unblock any time from Community › People › Connections and blocked people.</DsText> : null}
        </Callout>
        <Button label="Done" block onPress={() => router.back()} haptic="success" />
      </View>
    );
  }

  const reasons = (
    <>
      <ChoiceGroup label="Reason" layout="list" options={REPORT_REASONS.filter((r) => r.key !== 'fake_dyno' || target === 'build').map((r) => ({ key: r.key, label: r.label }))} value={reason} onChange={setReason} />
      <TextField
        value={note}
        onChangeText={setNote}
        placeholder={reason === 'other' ? "Say what's wrong" : 'Anything else we should know (optional)'}
        multiline
        multilineHeight={80}
        maxLength={500}
        accessibilityLabel="Note for the Nightshift team"
      />
    </>
  );

  return (
    <ScrollView
      style={{ backgroundColor: COLOR.surface.bg }}
      contentContainerStyle={{ padding: SPACING.screen, gap: SPACING.lg, paddingBottom: SPACING.xxxl }}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
    >
      {blocking ? (
        <>
          <DsText v="titleLg" accessibilityRole="header">
            Block @{handle ?? 'this person'}?
          </DsText>
          <Card>
            <DsText v="body">They won't be able to message you or connect with you, and you won't see their posts, threads, replies, comments, messages or event chat.</DsText>
            <DsText v="caption">They aren't told. Any connection between you ends.</DsText>
          </Card>
          <SwitchRow label="Report them too" hint="Tell the Nightshift team what happened." value={alsoReport} onValueChange={setAlsoReport} />
          {alsoReport ? <Section title="What's wrong?">{reasons}</Section> : null}
          <Button label="Block" tier="destructive" block onPress={submit} busy={busy} />
        </>
      ) : (
        <>
          <DsText v="titleLg" accessibilityRole="header">
            Report this {what}
          </DsText>
          <Section title="What's wrong?">{reasons}</Section>
          {userId && userId !== community.me ? (
            <SwitchRow label={`Also block @${handle ?? 'them'}`} hint="Hides everything they post from you and stops their messages." value={alsoBlock} onValueChange={setAlsoBlock} />
          ) : null}
          <Button label="Send report" block onPress={submit} busy={busy} disabled={!reason} hint="Pick a reason first" haptic="success" />
          <DsText v="caption">Reports are private. If someone's in danger, call 999.</DsText>
        </>
      )}
      {error ? <ErrorState title={error} /> : null}
    </ScrollView>
  );
}
