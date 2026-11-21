import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { allVariants } from '../../data/vehicles';
import { CommunityForum, useForumScope, type ForumFilter } from '../../components/CommunityForum';
import { ActionBar, Button, DsText, EmptyState, PAGE_WITH_BAR } from '../../components/ds';
import { findGroup, groupKindLabel, joinGroup, leaveGroup } from '../../lib/forumGroups';
import { title } from '../../lib/glossary';
import { useStore } from '../../lib/store';
import { COLOR, SPACING } from '../../theme';

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
            </View>
          }
        />
      </ScrollView>
      <ActionBar primary={{ label: 'New thread', onPress: () => router.push({ pathname: '/forum/new', params: { scope, group: group.key } }) }} />
    </View>
  );
}
