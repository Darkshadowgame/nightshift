import { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { openModerate } from '../components/Community';
import { Button, ChoiceGroup, DsText, EmptyState, ErrorState, ListRow, LoadingState } from '../components/ds';
import type { ModerationActionRow } from '../lib/communityService';
import { useCommunity, useCommunityQuery } from '../lib/communityStore';
import { shortAgo } from '../lib/format';
import { useNow } from '../lib/clock';
import { actionLine } from '../lib/moderation';
import { SPACING } from '../theme';
import { StaffOnly } from '../components/StaffOnly';

const ACTIONS: { key: string; label: string }[] = [
  { key: 'all', label: 'Everything' },
  { key: 'warn', label: 'Warnings' },
  { key: 'ban', label: 'Bans' },
  { key: 'suspend', label: 'Suspensions' },
  { key: 'lift', label: 'Lifted' },
  { key: 'hide', label: 'Hidden' },
  { key: 'unhide', label: 'Restored' },
  { key: 'dismiss', label: 'Dismissed' },
  { key: 'promote', label: 'Promoted' },
  { key: 'demote', label: 'Demoted' },
  { key: 'remove_dyno', label: 'Dyno badges' },
  { key: 'auto_report', label: 'Automatic' },
];

/**
 * Admins and the owner (Settings › Audit log): every moderation action, newest
 * first, filtered by who did it and what. The log can't be changed or deleted.
 */
function ModerationLogScreen() {
  const community = useCommunity();
  const now = useNow();
  const team = useCommunityQuery((s) => s.team(), []);
  const [actor, setActor] = useState('all');
  const [action, setAction] = useState('all');
  const [rows, setRows] = useState<ModerationActionRow[] | null>(null);
  const [more, setMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (before?: string) => {
    setError(null);
    try {
      const page = await community.run((s) => s.auditLog({ actor: actor === 'all' ? null : actor, action: action === 'all' ? null : action, before: before ?? null }));
      setRows((r) => (before ? [...(r ?? []), ...page] : page));
      setMore(page.length === 50);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load the log.");
    }
  };
  useEffect(() => {
    setRows(null);
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actor, action]);

  return (
    <ScrollView contentContainerStyle={{ padding: SPACING.screen, gap: SPACING.md, paddingBottom: SPACING.xxxl }}>
      <ChoiceGroup<string>
        label="Who"
        value={actor}
        onChange={setActor}
        options={[{ key: 'all', label: 'Everyone' }, ...(team.data ?? []).map((t) => ({ key: t.userId, label: `@${t.handle}` }))]}
      />
      <ChoiceGroup<string> label="What" value={action} onChange={setAction} options={ACTIONS} />
      {error ? <ErrorState title={error} onRetry={() => load()} /> : null}
      {!rows && !error ? <LoadingState /> : null}
      {rows && rows.length === 0 ? <EmptyState title="Nothing here" body="No moderation actions match." /> : null}
      {(rows ?? []).map((a) => (
        <ListRow
          key={a.id}
          title={`${actionLine(a)}${a.targetHandle ? ` → ${a.targetHandle}` : ''}`}
          subtitle={[a.targetKind && a.targetKind !== 'profile' ? `On a ${a.targetKind}` : null, a.reason ?? 'No reason given', a.note].filter(Boolean).join(' · ')}
          meta={shortAgo(a.createdAt, now)}
          onPress={a.targetUser ? () => openModerate(a.targetUser!) : undefined}
        />
      ))}
      {more && rows ? <Button label="Show older" tier="tertiary" onPress={() => load(rows[rows.length - 1].createdAt)} /> : null}
      <DsText v="caption">Kept for good: nobody can edit or delete it, not even the owner.</DsText>
    </ScrollView>
  );
}

export default function GatedModerationLogScreen() {
  return (
    <StaffOnly>
      <ModerationLogScreen />
    </StaffOnly>
  );
}
