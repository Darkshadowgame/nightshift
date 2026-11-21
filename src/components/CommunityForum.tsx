import { router } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { useNow } from '../lib/clock';
import { useCommunityQuery } from '../lib/communityStore';
import type { BoardKey } from '../lib/forum';
import { isScope, SCOPES, type ForumScope } from '../lib/forum';
import { useStore } from '../lib/store';
import { SPACING } from '../theme';
import { ThreadCard } from './Community';
import { ChipGroup, DsText, EmptyState, ErrorState, LoadingState, RowDivider, SearchField, SegmentedControl } from './ds';

/** The boards a first-time user picks from. With none picked ('all'), every board shows, the rest (Cars, Bikes, Detailing) too. Local is the toggle now, not a board. */
type BoardFilter = Extract<BoardKey, 'advice' | 'builds' | 'meets' | 'for_sale'>;
export type ForumFilter = 'all' | BoardFilter;
const BOARD_FILTERS: { key: BoardFilter; label: string }[] = [
  { key: 'advice', label: 'Advice' },
  { key: 'builds', label: 'Builds' },
  { key: 'meets', label: 'Meets' },
  { key: 'for_sale', label: 'For sale' },
];

/** Who the forum is for, Everyone or Local, kept on the phone so the next visit opens the same. */
export function useForumScope(): [ForumScope, (s: ForumScope) => void] {
  const { settings, setSettings } = useStore();
  const scope: ForumScope = isScope(settings.forumScope) ? settings.forumScope : 'everyone';
  return [scope, (s) => setSettings({ forumScope: s })];
}

/** The Everyone / Local switch. One line under it says who the list is for. */
export function ScopeToggle({ scope, onScope, region }: { scope: ForumScope; onScope: (s: ForumScope) => void; region: string | null }) {
  return (
    <View style={{ gap: SPACING.xs }}>
      <SegmentedControl<ForumScope> value={scope} onChange={onScope} accessibilityLabel="Who the threads are for" options={SCOPES} />
      <DsText v="caption">{scope === 'everyone' ? 'Threads for everyone in the UK.' : region ? `Threads for ${region}.` : 'Threads for your area.'}</DsText>
    </View>
  );
}
export const FORUM_FILTERS: { key: ForumFilter; label: string }[] = [{ key: 'all', label: 'All' }, ...BOARD_FILTERS];

/**
 * Forum and for sale (Redesign 2, 3.7), pushed from the Feed's first row: board pills, one search
 * on titles, then thread rows, most active first. "+" in the header writes a thread (a listing on
 * For sale).
 */
export function CommunityForum({ board, onBoard, group, header, hideBoards }: { board: ForumFilter; onBoard: (b: ForumFilter) => void; group?: string; header?: ReactNode; hideBoards?: boolean }) {
  const { users, me } = useStore();
  const now = useNow();
  const region = users.find((u) => u.id === me)?.region || null;
  const [typed, setTyped] = useState('');
  const [query, setQuery] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setQuery(typed.trim()), 300);
    return () => clearTimeout(t);
  }, [typed]);
  const [who, setWho] = useForumScope();
  const scope: ForumFilter = query ? 'all' : board;
  const threads = useCommunityQuery((s) => s.threads({ board: scope, region, scope: who, group, sort: 'active', query }), [scope, region, who, group, query]);
  const params = (): Record<string, string> => ({ ...(board === 'all' ? {} : { board }), scope: who, ...(group ? { group } : {}) });

  const list = !threads.data ? (
    threads.loading ? <LoadingState label="Loading threads" /> : null
  ) : threads.data.length === 0 ? (
    query ? (
      <EmptyState variant="inline" title={`No thread titles with "${query}".`} action={{ label: 'Clear search', onPress: () => setTyped('') }} />
    ) : (
      <EmptyState
        glyph="forum"
        title={board === 'for_sale' ? 'Nothing for sale yet' : who === 'local' ? 'No local threads yet' : 'No threads here yet'}
        body={board === 'for_sale' ? 'List a part you want to sell, or one you’re after.' : who === 'local' ? 'Start one for your area, or switch to Everyone.' : 'Ask a question or show what you’re working on.'}
        action={{
          label: board === 'for_sale' ? 'Sell a part' : 'New thread',
          onPress: () => router.push({ pathname: '/forum/new', params: params() }),
        }}
      />
    )
  ) : (
    <View>
      {threads.data.map((t, i) => (
        <View key={t.id}>
          {i ? <RowDivider inset /> : null}
          <ThreadCard thread={t} author={users.find((u) => u.id === t.authorId)} now={now} showBoard={scope === 'all'} showGroup={!group} showRegion={false} />
        </View>
      ))}
    </View>
  );

  return (
    <View style={{ gap: SPACING.lg }}>
      <ScopeToggle scope={who} onScope={setWho} region={region} />
      {header}
      {/* A filter: nothing picked means every board, so there's no "All" chip (4.4). One board at a time: picking another swaps. */}
      {hideBoards ? null : (
      <ChipGroup<BoardFilter>
        label="Boards"
        options={BOARD_FILTERS}
        selected={board === 'all' ? [] : [board]}
        onChange={(next) => onBoard(next.find((k) => k !== board) ?? 'all')}
      />
      )}
      <SearchField value={typed} onChangeText={setTyped} placeholder="Search thread titles" loading={typed.trim() !== query && typed.trim() !== ''} />
      {threads.error ? <ErrorState title={`Couldn't load threads. ${threads.error}`} /> : null}
      {list}
      <DsText v="caption">Be decent: posts are checked against the rules. No street racing, no timing on public roads and nothing about where police are.</DsText>
    </View>
  );
}
