import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useNow } from '../lib/clock';
import { useCommunityQuery } from '../lib/communityStore';
import type { BoardKey } from '../lib/forum';
import { useStore } from '../lib/store';
import { SPACING } from '../theme';
import { ThreadCard } from './Community';
import { ChoiceGroup, DsText, EmptyState, ErrorState, LoadingState, RowDivider, SearchField } from './ds';

/** The boards a first-time user picks from. The rest (Cars, Bikes, Detailing, Meets) show under All. */
export type ForumFilter = 'all' | Extract<BoardKey, 'advice' | 'builds' | 'for_sale' | 'local'>;
export const FORUM_FILTERS: { key: ForumFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'advice', label: 'Advice' },
  { key: 'builds', label: 'Builds' },
  { key: 'for_sale', label: 'For sale' },
  { key: 'local', label: 'Local' },
];

/**
 * Forum and for sale (Redesign 2, 3.7), pushed from the Feed's first row: board pills, one search
 * on titles, then thread rows, most active first. "+" in the header writes a thread (a listing on
 * For sale).
 */
export function CommunityForum({ board, onBoard }: { board: ForumFilter; onBoard: (b: ForumFilter) => void }) {
  const { users, me } = useStore();
  const now = useNow();
  const region = users.find((u) => u.id === me)?.region || null;
  const [typed, setTyped] = useState('');
  const [query, setQuery] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setQuery(typed.trim()), 300);
    return () => clearTimeout(t);
  }, [typed]);
  const scope: ForumFilter = query ? 'all' : board;
  const threads = useCommunityQuery((s) => s.threads({ board: scope, region, sort: 'active', query }), [scope, region, query]);

  const list = !threads.data ? (
    threads.loading ? <LoadingState label="Loading threads" /> : null
  ) : threads.data.length === 0 ? (
    query ? (
      <EmptyState variant="inline" title={`No thread titles with "${query}".`} action={{ label: 'Clear search', onPress: () => setTyped('') }} />
    ) : (
      <EmptyState
        glyph="forum"
        title={board === 'for_sale' ? 'Nothing for sale yet' : 'No threads here yet'}
        body={board === 'for_sale' ? 'List a part you want to sell, or one you’re after.' : 'Ask a question or show what you’re working on.'}
        action={{
          label: board === 'for_sale' ? 'Sell a part' : 'New thread',
          onPress: () => router.push({ pathname: '/forum/new', params: board === 'all' ? {} : { board } }),
        }}
      />
    )
  ) : (
    <View>
      {threads.data.map((t, i) => (
        <View key={t.id}>
          {i ? <RowDivider inset /> : null}
          <ThreadCard thread={t} author={users.find((u) => u.id === t.authorId)} now={now} showBoard={scope === 'all'} />
        </View>
      ))}
    </View>
  );

  return (
    <View style={{ gap: SPACING.lg }}>
      <ChoiceGroup<ForumFilter> label="" value={board} onChange={onBoard} options={FORUM_FILTERS} />
      <SearchField value={typed} onChangeText={setTyped} placeholder="Search thread titles" loading={typed.trim() !== query && typed.trim() !== ''} />
      {threads.error ? <ErrorState title={`Couldn't load threads. ${threads.error}`} /> : null}
      {list}
      <DsText v="caption">Be decent: posts are checked against the rules. No street racing, no timing on public roads and nothing about where police are.</DsText>
    </View>
  );
}
