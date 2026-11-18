import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Card, Chip, EmptyState, InlineError, LinkText, Row, Tag, Txt } from '../components/ui';
import type { ModerationAction, QueueItem } from '../lib/communityService';
import { useCommunity, useCommunityQuery } from '../lib/communityStore';
import { shortAgo } from '../lib/format';
import { REPORT_REASONS, REPORT_WHAT } from '../lib/moderation';
import { useNow } from '../lib/clock';
import { useStore } from '../lib/store';
import { STATE } from '../theme';

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
export default function ModerationScreen() {
  const { users } = useStore();
  const community = useCommunity();
  const now = useNow();
  const status = useCommunityQuery((s) => s.moderationStatus(), []);
  const queue = useCommunityQuery((s) => s.queue(), []);
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  if (status.data && !status.data.isStaff) {
    return (
      <View style={{ flex: 1, padding: 16 }}>
        <EmptyState title="For the Nightshift team" body="Moderation is only for staff. To report something, use Report on it." />
      </View>
    );
  }

  const act = async (i: QueueItem, action: ModerationAction, days?: number | null) => {
    setError(null);
    setDone(null);
    setBusy(`${i.reportId}:${action}:${days ?? ''}`);
    try {
      await community.run((s) => s.moderate(i.reportId, action, days));
      setDone(action === 'dismiss' ? 'Dismissed.' : action === 'suspend' ? 'Suspended.' : action === 'hide' ? 'Hidden.' : 'Restored.');
      setOpen(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not do that.');
    } finally {
      setBusy(null);
    }
  };
  const items = queue.data ?? [];
  const reasonLabel = (k: string) => REPORT_REASONS.find((r) => r.key === k)?.label ?? k;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 60 }}>
      <Txt v="caption">Open reports, most reported first. Three reports hide a post, reply, comment or chat line until you decide.</Txt>
      {done ? <Txt style={{ color: STATE.success }} accessibilityLiveRegion="polite">{done}</Txt> : null}
      <InlineError message={error ?? queue.error} />
      {queue.loading && !queue.data ? <Txt v="muted">Loading reports…</Txt> : null}
      {queue.data && items.length === 0 ? <EmptyState title="Nothing to review" body="No open reports." /> : null}
      {items.map((i) => {
        const who = i.targetUser ? users.find((u) => u.id === i.targetUser) : undefined;
        const href = hrefFor(i);
        const expanded = open === i.reportId;
        return (
          <Card key={i.reportId} accent={i.reports >= 3 ? STATE.danger : STATE.warning} style={{ gap: 8 }}>
            <Row gap={6}>
              <Tag label={REPORT_WHAT[i.target]} tone="info" />
              <Tag label={`${i.reports} report${i.reports === 1 ? '' : 's'}`} tone={i.reports >= 3 ? 'danger' : 'warning'} />
              <Txt v="caption">{shortAgo(i.firstReported, now)}</Txt>
            </Row>
            <Txt v="caption">{i.reasons.map(reasonLabel).join(' · ')}</Txt>
            <Card variant="raised">
              <Txt selectable numberOfLines={expanded ? undefined : 4}>{i.excerpt || '(nothing to show)'}</Txt>
            </Card>
            {i.notes.length ? <Txt v="caption">Notes: {i.notes.join(' / ')}</Txt> : null}
            <Row gap={16}>
              {who ? <LinkText label={`@${who.handle} ›`} onPress={() => router.push({ pathname: '/user/[id]', params: { id: who.id } })} /> : null}
              {href ? <LinkText label="Open it ›" onPress={() => router.push(href as never)} /> : null}
              <LinkText label={expanded ? 'Fewer actions' : 'Act on it ›'} onPress={() => setOpen(expanded ? null : i.reportId)} />
            </Row>
            {expanded ? (
              <View style={{ gap: 10 }}>
                <Row style={{ flexWrap: 'nowrap' }}>
                  <Button label="Dismiss" kind="secondary" size="sm" style={{ flex: 1 }} busy={busy === `${i.reportId}:dismiss:`} onPress={() => act(i, 'dismiss')} />
                  {HIDEABLE.has(i.target) ? (
                    <Button
                      label={i.target === 'event' ? 'Cancel event' : i.target === 'spot' ? 'Reject place' : 'Hide it'}
                      kind="danger"
                      size="sm"
                      style={{ flex: 1 }}
                      busy={busy === `${i.reportId}:hide:`}
                      onPress={() => act(i, 'hide')}
                    />
                  ) : null}
                </Row>
                {i.reports >= 3 && HIDEABLE.has(i.target) && i.target !== 'event' ? (
                  <Button label="Restore it (reports were wrong)" kind="secondary" size="sm" busy={busy === `${i.reportId}:restore:`} onPress={() => act(i, 'restore')} />
                ) : null}
                {i.targetUser ? (
                  <View style={{ gap: 6 }}>
                    <Txt v="label">Suspend @{who?.handle ?? 'them'} (no posting or messages)</Txt>
                    <Row>
                      {SUSPEND_DAYS.map((d) => (
                        <Chip key={d.label} label={d.label} onPress={() => act(i, 'suspend', d.days)} accessibilityLabel={`Suspend for ${d.label}`} />
                      ))}
                    </Row>
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
