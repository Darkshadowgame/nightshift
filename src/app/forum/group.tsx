import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { allVariants } from '../../data/vehicles';
import { CommunityForum, useForumScope, type ForumFilter } from '../../components/CommunityForum';
import { useState } from 'react';
import { ThreadCard } from '../../components/Community';
import { useNow } from '../../lib/clock';
import { useCommunityQuery } from '../../lib/communityStore';
import { ActionBar, Button, DsText, EmptyState, PAGE_WITH_BAR, RowDivider, Section } from '../../components/ds';
import { findGroup, groupKindLabel, joinGroup, leaveGroup } from '../../lib/forumGroups';
import { title } from '../../lib/glossary';
import { useStore } from '../../lib/store';
import { COLOR, SPACING } from '../../theme';

/**
 * "Common problems": the group's solved threads, the ones whose fix helped most first. Made from the
 * threads themselves, so nobody writes it by hand. Hidden until the group has a solved thread.
 */
function CommonProblems({ group }: { group: string }) {
  const { users } = useStore();
  const now = useNow();
  const [all, setAll] = useState(false);
  const q = useCommunityQuery((s) => s.commonProblems(group), [group]);
  const items = q.data ?? [];
  if (!items.length) return null;
  const shown = all ? items : items.slice(0, 3);
  return (
    <Section title="Common problems">
      <View>
        {shown.map((p, i) => (
          <View key={p.thread.id}>
            {i ? <RowDivider inset /> : null}
            <ThreadCard thread={p.thread} author={users.find((u) => u.id === p.thread.authorId)} now={now} showGroup={false} showRegion={false} />
          </View>
        ))}
      </View>
      {items.length > 3 && !all ? <Button tier="tertiary" size="sm" label={`Show all ${items.length}`} onPress={() => setAll(true)} style={{ alignSelf: 'flex-start' }} /> : null}
    </Section>
  );
}

/**
 * One group's forum: its threads, with the Everyone / Local switch still applying. Join or leave is
 * one secondary button (the page's one primary is "New thread", which tags the thread with the group).
 */
export default function ForumGroup() {
  const { key } = useLocalSearchParams<{ key?: string }>();
  const { settings, setSettings } = useStore();
  const [scope] = useForumScope();
  const group = findGroup(allVariants(), key);
  if (!group) {
    return (
      <View style={{ flex: 1, backgroundColor: COLOR.surface.bg, padding: SPACING.screen }}>
        <EmptyState glyph="forum" title="That group isn’t there" action={{ label: 'Browse groups', onPress: () => router.replace('/forum/groups') }} />
      </View>
    );
  }
  const joined = (settings.forumGroups ?? []).includes(group.key);
  const board: ForumFilter = 'all';

  return (
    <View style={{ flex: 1, backgroundColor: COLOR.surface.bg }}>
      <Stack.Screen options={{ title: title(group.label) }} />
      <ScrollView contentContainerStyle={[PAGE_WITH_BAR, { gap: SPACING.lg }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <CommunityForum
          board={board}
          onBoard={() => {}}
          hideBoards
          group={group.key}
          header={
            <View style={{ gap: SPACING.sm }}>
              <DsText v="caption">{groupKindLabel(group)}</DsText>
              <Button
                tier="secondary"
                label={joined ? 'Joined' : 'Join group'}
                icon={joined ? 'check' : 'plus'}
                onPress={() => setSettings({ forumGroups: joined ? leaveGroup(settings.forumGroups, group.key) : joinGroup(settings.forumGroups, group.key) })}
                accessibilityLabel={joined ? `Joined ${group.label}. Tap to leave` : `Join ${group.label}`}
              />
              <CommonProblems group={group.key} />
            </View>
          }
        />
      </ScrollView>
      <ActionBar primary={{ label: 'New thread', onPress: () => router.push({ pathname: '/forum/new', params: { scope, group: group.key } }) }} />
    </View>
  );
}
