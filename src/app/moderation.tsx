import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Card, DsText, EmptyState, ErrorState, LoadingState, Tag, useToast } from '../components/ds';
import type { ModerationAction, QueueItem } from '../lib/communityService';
import { useCommunity, useCommunityQuery } from '../lib/communityStore';
import { shortAgo } from '../lib/format';
import { reportReasonLabel, REPORT_WHAT } from '../lib/moderation';
import { openModerate } from '../components/Community';
import { useNow } from '../lib/clock';
import { useStore } from '../lib/store';
import { COLOR, SPACING } from '../theme';
import { StaffOnly } from '../components/StaffOnly';

const SUSPEND_DAYS: { label: string; days: number | null }[] = [
  { label: '1 day', days: 1 },
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: 'Until lifted', days: null },
];

/** Where a reported thing opens, when it has a screen. */
function hrefFor(i: QueueItem): string | null {
  switch (i.target) {
    case 'thread':
      return `/forum/${i.targetId}`;
    case 'post':
      return `/post/${i.targetId}`;
    case 'profile':
      return `/user/${i.targetId}`;
    case 'build':
      return `/build/${i.targetId}`;
    case 'event':
      return `/event/${i.targetId}`;
    case 'crew':
      return `/crew/${i.targetId}`;
    case 'spot':
      return `/spot/${i.targetId}`;
    default:
      return null;
  }
}

const HIDEABLE = new Set(['thread', 'reply', 'message', 'post', 'comment', 'chat', 'event', 'spot']);

/**
 * Staff only (Settings › Moderation): open reports, most reported first, with
 * a copy of what was reported. Dismiss, hide (or cancel an event, reject a
 * place), or suspend the person so they can't post or message.
 */
function ModerationScreen() {
  const { users } = useStore();
  const community = useCommunity();
  const now = useNow();
  const status = useCommunityQuery((s) => s.moderationStatus(), []);
  const queue = useCommunityQuery((s) => s.queue(), []);
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  if (status.data && !status.data.isStaff) {
    return (
      <View style={{ flex: 1, padding: SPACING.screen, backgroundColor: COLOR.surface.bg }}>
        <EmptyState title="For the Slipstream team" body="Moderation is only for staff. To report something, use Report on it." />
      </View>
    );
  }

  const act = async (i: QueueItem, action: ModerationAction, days?: number | null) => {
    setError(null);
    setBusy(`${i.reportId}:${action}:${days ?? ''}`);
    try {
      await community.run((s) => s.moderate(i.reportId, action, days));
      toast({ message: action === 'dismiss' ? 'Dismissed' : action === 'suspend' ? 'Suspended' : action === 'hide' ? 'Hidden' : 'Restored' });
      setOpen(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't do that.");
    } finally {
      setBusy(null);
    }
  };
  const items = queue.data ?? [];
  const reasonLabel = reportReasonLabel;
  const admin = status.data?.role === 'admin' || status.data?.role === 'owner';

  return (
    <ScrollView style={{ backgroundColor: COLOR.surface.bg }} contentContainerStyle={{ padding: SPACING.screen, gap: SPACING.md, paddingBottom: SPACING.xxxl }}>
      <DsText v="caption">
        Open reports, most reported first. Three reports hide a post, reply, comment or chat line until you decide. Automatic reports come from the spam and
        sell-only rules. To warn someone or ban them from Community, open their recent posts.
      </DsText>
      {error ?? queue.error ? <ErrorState title={(error ?? queue.error)!} /> : null}
      {queue.loading && !queue.data ? <LoadingState /> : null}
      {queue.data && items.length === 0 ? <EmptyState title="Nothing to review" body="No open reports." /> : null}
      {items.map((i) => {
        const who = i.targetUser ? users.find((u) => u.id === i.targetUser) : undefined;
        const href = hrefFor(i);
        const expanded = open === i.reportId;
        return (
          <Card key={i.reportId}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: SPACING.xs }}>
              <Tag label={REPORT_WHAT[i.target]} tone="info" />
              {i.automatic ? <Tag label="Automatic" tone="info" /> : null}
              <Tag label={`${i.reports} report${i.reports === 1 ? '' : 's'}`} tone={i.reports >= 3 ? 'danger' : 'warning'} />
              <DsText v="meta">{shortAgo(i.firstReported, now)}</DsText>
            </View>
            <DsText v="caption">{i.reasons.map(reasonLabel).join(' · ')}</DsText>
            <Card raised>
              <DsText v="body" selectable numberOfLines={expanded ? undefined : 4}>
                {i.excerpt || '(nothing to show)'}
              </DsText>
            </Card>
            {i.notes.length ? <DsText v="caption">Notes: {i.notes.join(' / ')}</DsText> : null}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: SPACING.lg }}>
              {who ? <Button label={`@${who.handle}`} tier="tertiary" size="sm" onPress={() => router.push({ pathname: '/user/[id]', params: { id: who.id } })} /> : null}
              {i.targetUser ? <Button label="Their recent posts" tier="tertiary" size="sm" onPress={() => openModerate(i.targetUser!)} /> : null}
              {href ? <Button label="Open it" tier="tertiary" size="sm" onPress={() => router.push(href as never)} /> : null}
              <Button label={expanded ? 'Fewer actions' : 'Act on it'} tier="tertiary" size="sm" onPress={() => setOpen(expanded ? null : i.reportId)} />
            </View>
            {expanded ? (
              <View style={{ gap: SPACING.sm }}>
                <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                  <Button label="Dismiss" tier="secondary" size="sm" block style={{ flex: 1 }} busy={busy === `${i.reportId}:dismiss:`} onPress={() => act(i, 'dismiss')} />
                  {HIDEABLE.has(i.target) ? (
                    <Button
                      label={i.target === 'event' ? 'Cancel event' : i.target === 'spot' ? 'Reject place' : 'Hide it'}
                      tier="destructive"
                      size="sm"
                      block
                      style={{ flex: 1 }}
                      busy={busy === `${i.reportId}:hide:`}
                      onPress={() => act(i, 'hide')}
                    />
                  ) : null}
                </View>
                {i.reports >= 3 && HIDEABLE.has(i.target) && i.target !== 'event' ? (
                  <Button label="Restore it (reports were wrong)" tier="secondary" size="sm" block busy={busy === `${i.reportId}:restore:`} onPress={() => act(i, 'restore')} />
                ) : null}
                {i.targetUser && admin ? (
                  <View style={{ gap: SPACING.xs }}>
                    <DsText v="label">Suspend @{who?.handle ?? 'them'} (no posting or messages)</DsText>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm }}>
                      {SUSPEND_DAYS.map((d) => (
                        <Button key={d.label} label={d.label} tier="secondary" size="sm" onPress={() => act(i, 'suspend', d.days)} accessibilityLabel={`Suspend for ${d.label}`} busy={busy === `${i.reportId}:suspend:${d.days ?? ''}`} />
                      ))}
                    </View>
                  </View>
                ) : null}
              </View>
            ) : null}
          </Card>
        );
      })}
    </ScrollView>
  );
}

export default function GatedModerationScreen() {
  return (
    <StaffOnly>
      <ModerationScreen />
    </StaffOnly>
  );
}
