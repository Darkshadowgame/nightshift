import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { allVariants } from '../../data/vehicles';
import { CommunityForum, FORUM_FILTERS, useForumScope, type ForumFilter } from '../../components/CommunityForum';
import { ActionBar, ListRow, PAGE_WITH_BAR } from '../../components/ds';
import { findGroup } from '../../lib/forumGroups';
import { useStore } from '../../lib/store';
import { COLOR, SPACING } from '../../theme';

/**
 * Forum and for sale (Redesign 2, 3.7): one tap from Community (the Feed's first row). A pushed
 * list: the Everyone / Local switch, one row into make and model groups, board pills (All, Advice,
 * Builds, Meets, For sale) and thread rows. A pushed screen's header has at most Share and `···`
 * (4.1), so writing a thread is the ActionBar's one primary (4.3): "New thread", or "Sell a part"
 * when the For sale board is picked.
 */
export default function ForumScreen() {
  const params = useLocalSearchParams<{ board?: string }>();
  const { settings } = useStore();
  const [scope] = useForumScope();
  const board: ForumFilter = FORUM_FILTERS.some((f) => f.key === params.board) ? (params.board as ForumFilter) : 'all';
  const sell = board === 'for_sale';
  const joined = (settings.forumGroups ?? []).map((k) => findGroup(allVariants(), k)?.label).filter((l): l is string => !!l);

  return (
    <View style={{ flex: 1, backgroundColor: COLOR.surface.bg }}>
      <ScrollView contentContainerStyle={[PAGE_WITH_BAR, { gap: SPACING.lg }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <CommunityForum
          board={board}
          onBoard={(b) => router.setParams({ board: b })}
          header={
            <ListRow
              leading={{ icon: 'comment' }}
              title="Groups"
              subtitle={joined.length ? joined.slice(0, 3).join(', ') + (joined.length > 3 ? ` and ${joined.length - 3} more` : '') : 'Join one for your make or model, like SEAT Leon or BMW.'}
              onPress={() => router.push('/forum/groups')}
              accessibilityLabel={`Groups. ${joined.length ? joined.join(', ') : 'Join one for your make or model'}`}
            />
          }
        />
      </ScrollView>
      <ActionBar
        primary={{
          label: sell ? 'Sell a part' : 'New thread',
          onPress: () => router.push({ pathname: '/forum/new', params: { scope, ...(board === 'all' ? {} : { board }) } }),
        }}
      />
    </View>
  );
}
