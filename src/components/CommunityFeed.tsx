import { router } from 'expo-router';
import { useMemo, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { useNow } from '../lib/clock';
import { useCommunity, useCommunityQuery } from '../lib/communityStore';
import { mergeFeeds, withLike, type Post } from '../lib/posts';
import { useStore } from '../lib/store';
import { SPACING } from '../theme';
import { moderateOptions, openReport, OptionsSheet, PostCard, type SheetOption } from './Community';
import { EmptyState, ErrorState, ListRow, LoadingState, RowDivider } from './ds';

/**
 * Community › Feed (Redesign 2, 3.7): first the "Forum and for sale" row, then one feed: posts
 * near you and from your connections, newest first, photo first. "+" in the header posts one.
 */
export function CommunityFeed() {
  const local = useCommunityQuery((s) => s.feed('local'), []);
  const mine = useCommunityQuery((s) => s.feed('connections'), []);
  const posts = useMemo(() => mergeFeeds(local.data, mine.data), [local.data, mine.data]);
  return (
    <View style={{ gap: SPACING.lg }}>
      <View>
        <ListRow
          leading={{ icon: 'comment' }}
          title="Forum and for sale"
          subtitle="Advice, builds and parts for sale"
          onPress={() => router.push('/forum')}
        />
        <RowDivider />
      </View>
      <PostList
        posts={posts}
        loading={local.loading || mine.loading}
        error={local.error ?? mine.error}
        empty={
          <EmptyState
            glyph="post"
            title="Nothing posted near you yet"
            body="Share a photo of your build, a drive or a meet."
            action={{ label: 'Post a photo', onPress: () => router.push('/post/new') }}
          />
        }
      />
    </View>
  );
}

/** A list of post cards with likes, comments and the ··· menu (report, block, delete). Used by the feed and profiles. */
export function PostList({ posts, loading, error, empty }: { posts: Post[] | null; loading: boolean; error: string | null; empty: ReactNode }) {
  const { users, builds } = useStore();
  const community = useCommunity();
  const now = useNow();
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [menu, setMenu] = useState<Post | null>(null);
  const [err, setErr] = useState<string | null>(null);

  if (!posts) return loading ? <LoadingState label="Loading posts" /> : error ? <ErrorState title={`Couldn't load posts. ${error}`} /> : null;
  const shown = posts.filter((p) => !community.blocked.has(p.authorId));
  if (shown.length === 0) return <>{empty}</>;

  const like = (p: Post, on: boolean) => {
    setErr(null);
    setLiked((l) => ({ ...l, [p.id]: on }));
    community.run((s) => s.likePost(p.id, on)).catch((e) => {
      setLiked((l) => ({ ...l, [p.id]: !on }));
      setErr(e instanceof Error ? e.message : "Couldn't like that.");
    });
  };

  const options = (p: Post): SheetOption[] => {
    const author = users.find((u) => u.id === p.authorId);
    if (p.authorId === community.me) {
      return [{ label: 'Delete post', danger: true, onPress: () => community.run((s) => s.deletePost(p.id)).catch((e) => setErr(e instanceof Error ? e.message : "Couldn't delete it.")) }];
    }
    return [
      { label: 'Report post', onPress: () => openReport('post', p.id, p.authorId, 'post') },
      { label: `Block @${author?.handle ?? 'them'}`, danger: true, onPress: () => openReport('block', p.authorId, p.authorId) },
      ...moderateOptions(p.authorId),
    ];
  };

  return (
    <View style={{ gap: SPACING.md }}>
      {err ? <ErrorState title={err} /> : null}
      {shown.map((p) => {
        const view = liked[p.id] === undefined ? p : withLike(p, liked[p.id]);
        return (
          <PostCard
            key={p.id}
            post={view}
            author={users.find((u) => u.id === p.authorId)}
            build={p.buildId ? builds.find((b) => b.id === p.buildId) : undefined}
            now={now}
            onLike={() => like(p, !view.likedByMe)}
            onOpen={() => router.push({ pathname: '/post/[id]', params: { id: p.id } })}
            onMore={() => setMenu(p)}
          />
        );
      })}
      <OptionsSheet visible={!!menu} title="Post options" options={menu ? options(menu) : []} onClose={() => setMenu(null)} />
    </View>
  );
}
