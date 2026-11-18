import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { TextInput, View } from 'react-native';
import { useNow } from '../lib/clock';
import { useCommunityQuery } from '../lib/communityStore';
import { BOARDS, type BoardKey, type ThreadSort } from '../lib/forum';
import { useStore } from '../lib/store';
import { C } from '../theme';
import { ThreadRow } from './Community';
import { Chip, EmptyState, InlineError, Row, s as ui, Txt } from './ui';

/** Community › Forum: boards, Active or New, search by title. "New thread" is in the header. */
export function CommunityForum() {
  const { users, me } = useStore();
  const now = useNow();
  const region = users.find((u) => u.id === me)?.region || null;
  const [board, setBoard] = useState<BoardKey | 'all'>('all');
  const [sort, setSort] = useState<ThreadSort>('active');
  const [typed, setTyped] = useState('');
  const [query, setQuery] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setQuery(typed), 300);
    return () => clearTimeout(t);
  }, [typed]);
  const threads = useCommunityQuery((s) => s.threads({ board, region, sort, query }), [board, region, sort, query]);
  const info = BOARDS.find((b) => b.key === board);

  return (
    <View style={{ gap: 14 }}>
      <Row>
        <Chip label="All" on={board === 'all'} onPress={() => setBoard('all')} />
        {BOARDS.map((b) => (
          <Chip key={b.key} label={b.key === 'local' && region ? `Local · ${region}` : b.short} on={board === b.key} onPress={() => setBoard(b.key)} accessibilityLabel={b.label} />
        ))}
      </Row>
      {info ? <Txt v="caption">{info.label}: {info.hint}</Txt> : <Txt v="caption">Ask for advice, show your build, sell parts. Be decent: posts are checked against the rules.</Txt>}
      <Row style={{ flexWrap: 'nowrap' }}>
        <TextInput
          value={typed}
          onChangeText={setTyped}
          placeholder="Search thread titles"
          placeholderTextColor={C.fog}
          accessibilityLabel="Search thread titles"
          returnKeyType="search"
          autoCorrect={false}
          style={[ui.input, { flex: 1 }]}
        />
      </Row>
      <Row>
        <Chip label="Most active" on={sort === 'active'} onPress={() => setSort('active')} accessibilityLabel="Sort by most recent activity" />
        <Chip label="Newest" on={sort === 'new'} onPress={() => setSort('new')} accessibilityLabel="Sort by newest threads" />
      </Row>
      <InlineError message={threads.error} />
      {!threads.data ? (
        threads.loading ? <Txt v="muted">Loading threads…</Txt> : null
      ) : threads.data.length === 0 ? (
        query ? (
          <EmptyState glyph="forum" title="No threads match" body={`Nothing with "${query}" in the title.`} action={{ label: 'Clear search', onPress: () => setTyped('') }} />
        ) : (
          <EmptyState
            glyph="forum"
            title="No threads here yet"
            body="Start the first one: ask a question or show what you're working on."
            action={{ label: 'New thread', onPress: () => router.push({ pathname: '/forum/new', params: board === 'all' ? {} : { board } }) }}
          />
        )
      ) : (
        <View style={{ gap: 10 }}>
          {threads.data.map((t) => (
            <ThreadRow key={t.id} thread={t} author={users.find((u) => u.id === t.authorId)} now={now} showBoard={board === 'all'} />
          ))}
        </View>
      )}
    </View>
  );
}
