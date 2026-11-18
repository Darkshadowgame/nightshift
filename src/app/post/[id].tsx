import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useLayoutEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { at, postedLabel, moderateOptions, openProfile, openReport, OptionsSheet, personMark, PostCard, type SheetOption } from '../../components/Community';
import { CommentBar } from '../../components/ComposerParts';
import { Avatar, DsText, EmptyState, ErrorState, HeaderActions, IconButton, LoadingState, PAGE_WITH_BAR, Press, RowDivider, Section } from '../../components/ds';
import { useNow } from '../../lib/clock';
import { useCommunity, useCommunityQuery } from '../../lib/communityStore';
import { commentProblem, POST_LIMITS, withLike, type PostComment } from '../../lib/posts';
import { useStore } from '../../lib/store';
import { COLOR, SPACING } from '../../theme';
import { NotFoundState } from '../../components/Detail';

/** One post with its comments (T3): the post, comments, and the comment field in the bottom bar. ··· has report, block and delete. */
export default function PostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const nav = useNavigation();
  const { users, builds } = useStore();
  const community = useCommunity();
  const now = useNow();
  const q = useCommunityQuery((s) => s.post(id), [id]);
  const [liked, setLiked] = useState<boolean | null>(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menu, setMenu] = useState<SheetOption[] | null>(null);
  const loaded = q.data?.post;

  useLayoutEffect(() => {
    nav.setOptions({ headerRight: loaded ? () => <HeaderActions onMenu={() => setMenu(postMenuFor(loaded.authorId, loaded.id))} /> : undefined });
  }, [nav, loaded?.id, loaded?.authorId]); // eslint-disable-line react-hooks/exhaustive-deps

  function postMenuFor(authorId: string, postId: string): SheetOption[] {
    const author = users.find((u) => u.id === authorId);
    return authorId === community.me
      ? [{ label: 'Delete post', danger: true, onPress: () => community.run((s) => s.deletePost(postId)).then(() => router.back()).catch((e) => setError(e instanceof Error ? e.message : "Couldn't delete it.")) }]
      : [
          { label: 'Report post', onPress: () => openReport('post', postId, authorId, 'post') },
          { label: `Block @${author?.handle ?? 'them'}`, danger: true, onPress: () => openReport('block', authorId, authorId) },
          ...moderateOptions(authorId),
        ];
  }

  if (!q.data) {
    if (q.loading)
      return (
        <View style={{ flex: 1, backgroundColor: COLOR.surface.bg, padding: SPACING.screen }}>
          <LoadingState label="Loading the post" />
        </View>
      );
    return <NotFoundState what="Post" message={q.error ?? "It may have been deleted, or it's for someone's connections only."} />;
  }
  const { comments } = q.data;
  const post = liked === null ? q.data.post : withLike(q.data.post, liked);
  const author = users.find((u) => u.id === post.authorId);
  const handleOf = (uid: string) => users.find((u) => u.id === uid)?.handle ?? 'someone';
  const shown = comments.filter((c) => !community.blocked.has(c.authorId));

  async function send() {
    setError(null);
    const p = commentProblem(text);
    if (p) return setError(p);
    setBusy(true);
    try {
      await community.run((s) => s.comment(post.id, text));
      setText('');
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't send that.");
    } finally {
      setBusy(false);
    }
  }

  const commentMenu = (c: PostComment): SheetOption[] => {
    const out: SheetOption[] = [];
    if (c.authorId === community.me || post.authorId === community.me) {
      out.push({ label: 'Delete comment', danger: true, onPress: () => community.run((s) => s.deleteComment(c.id)).catch((e) => setError(e instanceof Error ? e.message : "Couldn't delete it.")) });
    }
    if (c.authorId !== community.me) {
      out.push({ label: 'Report comment', onPress: () => openReport('comment', c.id, c.authorId, 'comment') });
      out.push({ label: `Block @${handleOf(c.authorId)}`, danger: true, onPress: () => openReport('block', c.authorId, c.authorId) });
      out.push(...moderateOptions(c.authorId));
    }
    return out;
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
    <ScrollView contentContainerStyle={PAGE_WITH_BAR} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive" showsVerticalScrollIndicator={false}>
      <PostCard
        post={post}
        author={author}
        build={post.buildId ? builds.find((b) => b.id === post.buildId) : undefined}
        now={now}
        full
        onLike={() => {
          const on = !post.likedByMe;
          setLiked(on);
          community.run((s) => s.likePost(post.id, on)).catch((e) => {
            setLiked(!on);
            setError(e instanceof Error ? e.message : "Couldn't like that.");
          });
        }}
      />

      {/* No map of the spot (REVIEW-10: it showed where the poster parked). The place name is on the card. */}

      <Section title={`Comments (${shown.length})`}>
        {shown.length === 0 ? <EmptyState variant="inline" title="No comments yet." /> : null}
        <View>
          {shown.map((c, i) => {
            const opts = commentMenu(c);
            return (
              <View key={c.id}>
                {i ? <RowDivider inset /> : null}
                <View style={{ flexDirection: 'row', gap: SPACING.md, paddingVertical: SPACING.sm }}>
                  <Press onPress={() => openProfile(c.authorId)} role="link" label={`${at(users.find((u) => u.id === c.authorId))}'s profile`}>
                    <Avatar {...personMark(users.find((u) => u.id === c.authorId))} size="md" />
                  </Press>
                  <View style={{ flex: 1, gap: SPACING.xxs }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                      <DsText v="bodyStrong" numberOfLines={1} style={{ flexShrink: 1 }}>
                        @{handleOf(c.authorId)}
                      </DsText>
                      <DsText v="meta">{postedLabel(c.createdAt, now)}</DsText>
                    </View>
                    {c.hidden ? (
                      <DsText v="caption" tone="warning">
                        Hidden while it's checked. Only you can see it.
                      </DsText>
                    ) : null}
                    <DsText v="body" selectable>
                      {c.body}
                    </DsText>
                  </View>
                  {opts.length ? <IconButton icon="more" label="More options for this comment" colour={COLOR.text.secondary} onPress={() => setMenu(opts)} /> : null}
                </View>
              </View>
            );
          })}
        </View>
        {error ? <ErrorState title={error} /> : null}
      </Section>
    </ScrollView>
      <CommentBar value={text} onChange={setText} onSend={send} busy={busy} placeholder="Add a comment" label="Your comment" maxLength={POST_LIMITS.comment} />
      <OptionsSheet visible={!!menu} options={menu ?? []} onClose={() => setMenu(null)} />
    </KeyboardAvoidingView>
  );
}
