import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useNow } from '../lib/clock';
import { useCommunityQuery } from '../lib/communityStore';
import { BOARDS, type BoardKey, type ThreadSort } from '../lib/forum';
import { useStore } from '../lib/store';
import { SPACING } from '../theme';
import { ThreadCard } from './Community';
import { Button, DsText, EmptyState, ErrorState, ListRow, LoadingState, RowDivider, SearchField, Section, SegmentedControl } from './ds';

/**
 * Community › Forum: ask for advice. The boards as a list; open one for its threads (Most active
 * or Newest). One search field finds threads by title across every board. "+ New" writes one.
 */
export function CommunityForum() {
  const { users, me } = useStore();
  const now = useNow();
  const region = users.find((u) => u.id === me)?.region || null;
  const [board, setBoard] = useState<BoardKey | null>(null);
  const [sort, setSort] = useState<ThreadSort>('active');
  const [typed, setTyped] = useState('');
  const [query, setQuery] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setQuery(typed.trim()), 300);
    return () => clearTimeout(t);
  }, [typed]);
  const scope: BoardKey | 'all' = query ? 'all' : board ?? 'all';
  const threads = useCommunityQuery((s) => s.threads({ board: scope, region, sort, query }), [scope, region, sort, query]);
  const info = board ? BOARDS.find((b) => b.key === board) : undefined;
  const boardName = (key: BoardKey, label: string) => (key === 'local' && region ? `Local · ${region}` : label);

  const list = !threads.data ? (
    threads.loading ? <LoadingState label="Loading threads" /> : null
  ) : threads.data.length === 0 ? (
    query ? (
      <EmptyState glyph="forum" title="No threads match" body={`Nothing with "${query}" in the title.`} action={{ label: 'Clear search', onPress: () => setTyped('') }} />
    ) : (
      <EmptyState
        glyph="forum"
        title="No threads here yet"
        body="Start the first one: ask a question or show what you're working on."
        action={{ label: 'New thread', onPress: () => router.push({ pathname: '/forum/new', params: board ? { board } : {} }) }}
      />
    )
  ) : (
    <View style={{ gap: SPACING.md }}>
      {(board || query ? threads.data : threads.data.slice(0, 4)).map((t) => (
        <ThreadCard key={t.id} thread={t} author={users.find((u) => u.id === t.authorId)} now={now} showBoard={!board} />
      ))}
    </View>
  );

  return (
    <View style={{ gap: SPACING.lg }}>
      <SearchField value={typed} onChangeText={setTyped} placeholder="Search thread titles" loading={typed.trim() !== query && typed.trim() !== ''} />
      {threads.error ? <ErrorState title={`Couldn't load threads. ${threads.error}`} /> : null}

      {query ? (
        <Section title="Results">{list}</Section>
      ) : info ? (
        <>
          <View style={{ gap: SPACING.xs }}>
            <Button label="All boards" icon="back" tier="tertiary" size="sm" onPress={() => setBoard(null)} />
            <DsText v="titleLg" accessibilityRole="header">
              {boardName(info.key, info.label)}
            </DsText>
            <DsText v="secondary">{info.hint}</DsText>
          </View>
          <SegmentedControl<ThreadSort>
            value={sort}
            onChange={setSort}
            accessibilityLabel="Sort threads"
            options={[
              { key: 'active', label: 'Most active' },
              { key: 'new', label: 'Newest' },
            ]}
          />
          {list}
        </>
      ) : (
        <>
          <Section title="Latest threads">{list}</Section>
          <Section title="Boards">
            <View>
              {BOARDS.map((b, i) => (
                <View key={b.key}>
                  {i ? <RowDivider /> : null}
                  <ListRow title={boardName(b.key, b.label)} subtitle={b.hint} onPress={() => setBoard(b.key)} />
                </View>
              ))}
            </View>
          </Section>
          <DsText v="caption">Be decent: posts are checked against the rules. No street racing, no timing on public roads and nothing about where police are.</DsText>
        </>
      )}
    </View>
  );
}
