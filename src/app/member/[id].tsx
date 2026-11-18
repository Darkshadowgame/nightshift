import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { TextField, Field } from '../../components/Detail';
import { Avatar, Button, ChoiceGroup, DsText, EmptyState, ErrorState, ListRow, LoadingState, Section, StatBlock, Tag } from '../../components/ds';
import type { HistoryItem } from '../../lib/communityService';
import { useCommunity, useCommunityQuery } from '../../lib/communityStore';
import { shortAgo } from '../../lib/format';
import { useNow } from '../../lib/clock';
import { actionLine, BAN_CHOICES, banMessage, canActOn, canBan, roleChoices, ROLE_LABEL, WARN_REASONS, type BanScope, type StaffRole } from '../../lib/moderation';
import { SPACING } from '../../theme';

const KIND_LABEL: Record<HistoryItem['kind'], string> = {
  post: 'Post',
  thread: 'Thread',
  reply: 'Reply',
  comment: 'Comment',
  chat: 'Event chat',
  message: 'Reported message',
};

/** Where a history item opens. */
function openItem(h: HistoryItem) {
  if (h.kind === 'post') router.push({ pathname: '/post/[id]', params: { id: h.id } });
  else if (h.kind === 'comment' && h.parentId) router.push({ pathname: '/post/[id]', params: { id: h.parentId } });
  else if (h.kind === 'thread') router.push({ pathname: '/forum/[id]', params: { id: h.id } });
  else if (h.kind === 'reply' && h.parentId) router.push({ pathname: '/forum/[id]', params: { id: h.parentId } });
  else if (h.kind === 'chat' && h.parentId) router.push({ pathname: '/event/[id]', params: { id: h.parentId } });
}

/**
 * Staff only (from "Moderate" on anything someone wrote, or the report queue):
 * who they are, their counts, their whole public history (private messages only
 * when reported), and Warn, Community ban, Lift and role changes. The server
 * checks every action against the staff role (docs/MODERATION.md).
 */
export default function MemberModerationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const community = useCommunity();
  const now = useNow();
  const status = useCommunityQuery((s) => s.moderationStatus(), []);
  const overview = useCommunityQuery((s) => s.memberOverview(id), [id]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [more, setMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [scope, setScope] = useState<BanScope>('community');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const loadMore = async (reset = false) => {
    setLoadingMore(true);
    try {
      const before = reset ? undefined : history[history.length - 1]?.createdAt;
      const page = await community.run((s) => s.memberHistory(id, before));
      setHistory((h) => (reset ? page : [...h, ...page]));
      setMore(page.length === 30);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load their history.");
    } finally {
      setLoadingMore(false);
    }
  };
  useEffect(() => {
    void loadMore(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (status.data && !status.data.isStaff) {
    return <EmptyState title="For the Nightshift team" body="Member moderation is only for staff." />;
  }
  if (overview.error) return <ErrorState variant="block" title={overview.error} onRetry={overview.reload} />;
  const m = overview.data;
  if (!m) return <LoadingState />;

  const myRole = (status.data?.role ?? null) as StaffRole | null;
  const self = m.id === community.me;
  const canAct = canActOn(myRole, m.role, self);
  const roles = roleChoices(myRole, m.role, self);

  const act = async (key: string, run: () => Promise<void>, message: string) => {
    setError(null);
    setDone(null);
    setBusy(key);
    try {
      await run();
      setDone(message);
      setNote('');
      overview.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't do that.");
    } finally {
      setBusy(null);
    }
  };
  const handle = m.handle ? `@${m.handle}` : 'them';

  return (
    <ScrollView contentContainerStyle={{ padding: SPACING.screen, gap: SPACING.section, paddingBottom: SPACING.xxxl }} keyboardShouldPersistTaps="handled">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md }}>
        <Avatar name={m.displayName} handle={m.handle} size="lg" />
        <View style={{ flex: 1, gap: SPACING.xxs }}>
          <DsText v="title">{m.displayName ?? handle}</DsText>
          <DsText v="meta">
            {handle} · joined {new Date(m.joined).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })} · {m.rep} rep
          </DsText>
          {m.role ? <Tag label={ROLE_LABEL[m.role]} tone="info" /> : null}
        </View>
      </View>

      {m.ban ? (
        <View style={{ gap: SPACING.sm }}>
          <DsText v="bodyStrong" tone="warning">
            {m.ban.scope === 'community' ? 'Banned from Community' : 'Fully suspended'}
          </DsText>
          <DsText v="secondary">{m.ban.scope === 'community' ? banMessage('community', m.ban.until, m.ban.reason) : `Until ${m.ban.until ? new Date(m.ban.until).toLocaleString('en-GB') : 'lifted'}: ${m.ban.reason ?? ''}`}</DsText>
          {canAct ? <Button label="Lift ban" tier="secondary" busy={busy === 'lift'} onPress={() => act('lift', () => community.run((s) => s.liftSuspension(m.id)), 'Ban lifted. They get a notice.')} /> : null}
        </View>
      ) : null}

      <View style={{ gap: SPACING.sm }}>
        <StatBlock
          stats={[
            { value: String(m.counts.posts), label: 'Posts' },
            { value: String(m.counts.threads), label: 'Threads' },
            { value: String(m.counts.comments + m.counts.replies), label: 'Comments' },
            { value: String(m.counts.chat), label: 'Chat lines' },
          ]}
        />
        <StatBlock
          stats={[
            { value: String(m.counts.messages), label: 'Messages' },
            { value: String(m.counts.reportsAgainst), label: 'Reports' },
            { value: String(m.counts.warnings), label: 'Warnings' },
            { value: String(m.counts.bans), label: 'Bans' },
          ]}
        />
        {m.counts.selling30d ? <DsText v="caption">{m.counts.selling30d} selling posts in the last 30 days.</DsText> : null}
      </View>

      {done ? (
        <DsText v="secondary" tone="success" accessibilityLiveRegion="polite">
          {done}
        </DsText>
      ) : null}
      {error ? <ErrorState title={error} /> : null}

      {canAct ? (
        <Section title="Act">
          <ChoiceGroup<string> label="Reason" value={WARN_REASONS.includes(reason) ? reason : null} onChange={setReason} options={WARN_REASONS.map((r) => ({ key: r, label: r }))} />
          <Field label="Reason in your words" hint="They see the reason. Needed for a warning or a ban.">
            <TextField value={reason} onChangeText={setReason} placeholder="What they did" maxLength={200} />
          </Field>
          <Field label="Note for them (optional, warnings)">
            <TextField value={note} onChangeText={setNote} placeholder="Anything else they should know" multiline multilineHeight={64} maxLength={500} />
          </Field>
          <Button
            label="Warn"
            tier="secondary"
            busy={busy === 'warn'}
            disabled={reason.trim().length < 3}
            hint="Give a reason first"
            onPress={() => act('warn', () => community.run((s) => s.warn(m.id, reason, note)), `Warned ${handle}. They see it next time they open the app.`)}
          />
          {myRole === 'admin' || myRole === 'owner' ? (
            <ChoiceGroup<BanScope>
              label="Ban type"
              value={scope}
              onChange={setScope}
              options={[
                { key: 'community', label: 'Community ban', hint: 'No posts, comments, threads, replies, event chat or connection requests' },
                { key: 'full', label: 'Full suspension', hint: 'No messages to connections either' },
              ]}
            />
          ) : (
            <DsText v="caption">Community ban: no posts, comments, threads, replies, event chat or connection requests. Moderators can ban for up to 7 days.</DsText>
          )}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm }}>
            {BAN_CHOICES.filter((c) => canBan(myRole, scope, c.days)).map((c) => (
              <Button
                key={c.label}
                label={c.label}
                tier="destructive"
                size="sm"
                busy={busy === `ban:${c.label}`}
                disabled={reason.trim().length < 3}
                hint="Give a reason first"
                onPress={() =>
                  act(`ban:${c.label}`, () => community.run((s) => s.ban(m.id, scope, c.days, reason)), `${scope === 'full' ? 'Suspended' : 'Banned from Community'} (${c.label.toLowerCase()}). They get a notice.`)
                }
              />
            ))}
          </View>
        </Section>
      ) : (
        <DsText v="caption">{self ? "You can't moderate yourself." : 'They have the same or a higher role than you: ask someone above them.'}</DsText>
      )}

      {roles.length ? (
        <Section title="Role">
          <DsText v="caption">Give a reason above. Every change goes in the audit log and they get a notice.</DsText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm }}>
            {roles.map((r) => (
              <Button
                key={r ?? 'none'}
                label={r ? `Make ${ROLE_LABEL[r].toLowerCase()}` : 'Remove role'}
                tier={r ? 'secondary' : 'destructive'}
                size="sm"
                busy={busy === `role:${r}`}
                disabled={reason.trim().length < 3}
                hint="Give a reason first"
                onPress={() => act(`role:${r}`, () => community.run((s) => s.setRole(m.id, r, reason)), r ? `${handle} is now ${r === 'admin' ? 'an admin' : 'a moderator'}.` : `Removed ${handle}'s role.`)}
              />
            ))}
          </View>
        </Section>
      ) : null}

      <Section title="History">
        <DsText v="caption">Everything public, newest first. Private messages only when someone reported them.</DsText>
        {history.length === 0 && !loadingMore ? <EmptyState variant="inline" title="Nothing posted yet" /> : null}
        {history.map((h) => (
          <ListRow
            key={`${h.kind}:${h.id}`}
            title={h.body.split('\n')[0] || '(photos only)'}
            subtitle={`${KIND_LABEL[h.kind]}${h.board ? ` · ${h.board.replace('_', ' ')}` : ''} · ${shortAgo(h.createdAt, now)}`}
            trailing={
              h.isSelling || h.isRepeat || h.hidden ? (
                <View style={{ flexDirection: 'row', gap: SPACING.xxs }}>
                  {h.isSelling ? <Tag label="Selling" tone="warning" /> : null}
                  {h.isRepeat ? <Tag label="Repeat" tone="warning" /> : null}
                  {h.hidden ? <Tag label="Hidden" tone="danger" /> : null}
                </View>
              ) : undefined
            }
            onPress={h.kind === 'message' ? undefined : () => openItem(h)}
          />
        ))}
        {loadingMore ? <LoadingState variant="inline" /> : more && history.length ? <Button label="Show older" tier="tertiary" onPress={() => loadMore()} /> : null}
      </Section>

      <Section title="Moderation log">
        {m.log.length === 0 ? <DsText v="caption">No moderation actions yet.</DsText> : null}
        {m.log.map((a) => (
          <ListRow key={a.id} title={actionLine(a)} subtitle={[a.reason, a.note].filter(Boolean).join(' · ') || 'No reason given'} meta={shortAgo(a.createdAt, now)} />
        ))}
      </Section>
    </ScrollView>
  );
}
