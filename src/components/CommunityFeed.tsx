import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { useNow } from '../lib/clock';
import { useCommunity, useCommunityQuery } from '../lib/communityStore';
import { withLike, type FeedScope, type Post } from '../lib/posts';
import { useStore } from '../lib/store';
import { SPACING } from '../theme';
import { moderateOptions, openReport, OptionsSheet, PostCard, type SheetOption } from './Community';
import { EmptyState, ErrorState, LoadingState, SegmentedControl } from './ds';

type Scope = Extract<FeedScope, 'local' | 'connections'>;

/**
 * Community › Feed: posts from people near you or from your connections, newest first.
 * "+ New" in the header writes one.
 */
export function CommunityFeed() {
  const [scope, setScope] = useState<Scope>('local');
  const feed = useCommunityQuery((s) => s.feed(scope), [scope]);
  return (
    <View style={{ gap: SPACING.lg }}>
      <SegmentedControl<Scope>
        value={scope}
        onChange={setScope}
        accessibilityLabel="Whose posts"
        options={[
          { key: 'local', label: 'Near you' },
          { key: 'connections', label: 'Connections' },
        ]}
      />
      <PostList
        posts={feed.data}
        loading={feed.loading}
        error={feed.error}
        empty={
          scope === 'local' ? (
            <EmptyState
              glyph="post"
              title="Nothing posted near you yet"
              body="Share a photo of your build, a drive or a good spot. Posts with a place show on the map."
              action={{ label: 'New post', onPress: () => router.push('/post/new') }}
            />
          ) : (
            <EmptyState
              glyph="community"
              title="No posts from connections"
              body="Meet people at an event, connect, and their posts show here."
              action={{ label: 'Find people', onPress: () => router.setParams({ tab: 'people' }) }}
            />
          )
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
