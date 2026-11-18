import { ScrollView } from 'react-native';
import { openModerate } from '../components/Community';
import { DsText, EmptyState, ErrorState, ListRow, LoadingState, Tag } from '../components/ds';
import { useCommunityQuery } from '../lib/communityStore';
import { ROLE_LABEL } from '../lib/moderation';
import { SPACING } from '../theme';

/** Staff only (Settings › Moderation team): everyone on the team, their role, and how many actions in 7 and 30 days. */
export default function ModerationTeamScreen() {
  const team = useCommunityQuery((s) => s.team(), []);
  if (team.error) return <ErrorState variant="block" title={team.error} onRetry={team.reload} />;
  if (!team.data) return <LoadingState />;
  return (
    <ScrollView contentContainerStyle={{ padding: SPACING.screen, gap: SPACING.sm, paddingBottom: SPACING.xxxl }}>
      <DsText v="caption">Moderators warn, hide and ban from Community for up to 7 days. Admins also ban for longer, suspend fully and choose moderators. Only the owner chooses admins.</DsText>
      {team.data.length === 0 ? <EmptyState title="No team yet" body="The owner adds themselves first (docs/MODERATION.md)." /> : null}
      {team.data.map((t) => (
        <ListRow
          key={t.userId}
          leading={{ avatar: { name: t.displayName, handle: t.handle } }}
          title={t.displayName ?? `@${t.handle}`}
          subtitle={`@${t.handle} · ${t.actions7d} actions in 7 days · ${t.actions30d} in 30`}
          trailing={<Tag label={ROLE_LABEL[t.role]} tone={t.role === 'moderator' ? 'neutral' : 'info'} />}
          onPress={() => openModerate(t.userId)}
        />
      ))}
    </ScrollView>
  );
}
