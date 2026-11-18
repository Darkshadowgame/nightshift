import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';
import { ScrollView } from 'react-native';
import { CommunityForum, FORUM_FILTERS, type ForumFilter } from '../../components/CommunityForum';
import { HeaderActions } from '../../components/ds';
import { SPACING } from '../../theme';

/**
 * Forum and for sale (Redesign 2, 3.7): one tap from Community (the Feed's first row). A pushed
 * T1 list: board pills (All, Advice, Builds, For sale, Local), thread rows. "+" writes a thread,
 * or a listing when the For sale board is picked.
 */
export default function ForumScreen() {
  const nav = useNavigation();
  const params = useLocalSearchParams<{ board?: string }>();
  const board: ForumFilter = FORUM_FILTERS.some((f) => f.key === params.board) ? (params.board as ForumFilter) : 'all';

  useLayoutEffect(() => {
    const sell = board === 'for_sale';
    nav.setOptions({
      headerRight: () => (
        <HeaderActions
          add={{
            label: sell ? 'Sell a part' : 'New thread',
            onPress: () => router.push({ pathname: '/forum/new', params: board === 'all' ? {} : { board } }),
          }}
        />
      ),
    });
  }, [nav, board]);

  return (
    <ScrollView contentContainerStyle={{ padding: SPACING.screen, gap: SPACING.lg, paddingBottom: SPACING.xxxl }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <CommunityForum board={board} onBoard={(b) => router.setParams({ board: b })} />
    </ScrollView>
  );
}
