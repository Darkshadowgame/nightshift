import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { CommunityForum, FORUM_FILTERS, type ForumFilter } from '../../components/CommunityForum';
import { ActionBar, PAGE_WITH_BAR } from '../../components/ds';
import { COLOR, SPACING } from '../../theme';

/**
 * Forum and for sale (Redesign 2, 3.7): one tap from Community (the Feed's first row). A pushed
 * list: board pills (All, Advice, Builds, For sale, Local), thread rows. A pushed screen's header
 * has at most Share and `···` (4.1), so writing a thread is the ActionBar's one primary (4.3):
 * "New thread", or "Sell a part" when the For sale board is picked.
 */
export default function ForumScreen() {
  const params = useLocalSearchParams<{ board?: string }>();
  const board: ForumFilter = FORUM_FILTERS.some((f) => f.key === params.board) ? (params.board as ForumFilter) : 'all';
  const sell = board === 'for_sale';

  return (
    <View style={{ flex: 1, backgroundColor: COLOR.surface.bg }}>
      <ScrollView contentContainerStyle={[PAGE_WITH_BAR, { gap: SPACING.lg }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <CommunityForum board={board} onBoard={(b) => router.setParams({ board: b })} />
      </ScrollView>
      <ActionBar
        primary={{
          label: sell ? 'Sell a part' : 'New thread',
          onPress: () => router.push({ pathname: '/forum/new', params: board === 'all' ? {} : { board } }),
        }}
      />
    </View>
  );
}
