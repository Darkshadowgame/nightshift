import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { Avatar, openReport, OptionsSheet, PostCard, type SheetOption } from '../../components/Community';
import { NightMap } from '../../components/NightMap';
import { Button, Card, EmptyState, InlineError, NotFound, Pressable_, Row, SampleTag, Section, Txt, s as ui } from '../../components/ui';
import { useNow } from '../../lib/clock';
import { useCommunity, useCommunityQuery } from '../../lib/communityStore';
import { shortAgo } from '../../lib/format';
import { commentProblem, POST_LIMITS, withLike, type PostComment } from '../../lib/posts';
import { useStore } from '../../lib/store';
import { C, F, POST_COLOUR, RADIUS } from '../../theme';

/** One post with its comments. */
export default function PostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { users, builds } = useStore();
  const community = useCommunity();
  const now = useNow();
  const q = useCommunityQuery((s) => s.post(id), [id]);
  const [liked, setLiked] = useState<boolean | null>(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menu, setMenu] = useState<SheetOption[] | null>(null);

  if (!q.data) {
    if (q.loading) return <View style={{ flex: 1, backgroundColor: C.asphalt }} />;
    return <NotFound what="Post" message={q.error ?? "It may have been deleted, or it's for someone's connections only."} />;
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
      setError(e instanceof Error ? e.message : 'Could not send that.');
    } finally {
      setBusy(false);
    }
  }

  const postMenu = (): SheetOption[] =>
    post.authorId === community.me
      ? [{ label: 'Delete post', danger: true, onPress: () => community.run((s) => s.deletePost(post.id)).then(() => router.back()).catch((e) => setError(e instanceof Error ? e.message : 'Could not delete it.')) }]
      : [
          { label: 'Report post', onPress: () => openReport('post', post.id, post.authorId, 'post') },
          { label: `Block @${author?.handle ?? 'them'}`, danger: true, onPress: () => openReport('block', post.authorId, post.authorId) },
        ];

  const commentMenu = (c: PostComment): SheetOption[] => {
    const out: SheetOption[] = [];
    if (c.authorId === community.me || post.authorId === community.me) {
      out.push({ label: 'Delete comment', danger: true, onPress: () => community.run((s) => s.deleteComment(c.id)).catch((e) => setError(e instanceof Error ? e.message : 'Could not delete it.')) });
    }
    if (c.authorId !== community.me) {
      out.push({ label: 'Report comment', onPress: () => openReport('comment', c.id, c.authorId, 'comment') });
      out.push({ label: `Block @${handleOf(c.authorId)}`, danger: true, onPress: () => openReport('block', c.authorId, c.authorId) });
    }
    return out;
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 18, paddingBottom: 60 }} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive" automaticallyAdjustKeyboardInsets>
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
            setError(e instanceof Error ? e.message : 'Could not like that.');
          });
        }}
        onMore={() => setMenu(postMenu())}
      />

      {post.at ? (
        <View style={{ height: 180, borderRadius: RADIUS.sheet, overflow: 'hidden', borderWidth: 1, borderColor: C.kerb }}>
          <NightMap pins={[{ id: 'post', at: post.at, glyph: 'post', colour: POST_COLOUR, title: post.placeName ?? 'Post', size: 34 }]} centre={post.at} span={0.03} />
        </View>
      ) : null}

      <Section title={`Comments (${shown.length})`}>
        {shown.length === 0 ? <Txt v="muted">No comments yet.</Txt> : null}
        {shown.map((c) => (
          <Card key={c.id} style={{ gap: 6 }}>
            <Row style={{ flexWrap: 'nowrap' }} gap={10}>
              <Pressable_ onPress={() => router.push({ pathname: '/user/[id]', params: { id: c.authorId } })} label={`@${handleOf(c.authorId)}'s profile`}>
                <Avatar user={users.find((u) => u.id === c.authorId)} size={28} />
              </Pressable_>
              <Txt style={{ fontFamily: F.bodyBold, flex: 1 }} numberOfLines={1}>@{handleOf(c.authorId)} <Txt v="caption">{shortAgo(c.createdAt, now)}</Txt></Txt>
              {c.sample ? <SampleTag /> : null}
              {commentMenu(c).length ? (
                <Pressable_ onPress={() => setMenu(commentMenu(c))} label="More options for this comment">
                  <Txt v="h3" style={{ color: C.fog, paddingHorizontal: 8 }}>···</Txt>
                </Pressable_>
              ) : null}
            </Row>
            {c.hidden ? <Txt v="caption">Hidden while it's checked. Only you can see it.</Txt> : null}
            <Txt>{c.body}</Txt>
          </Card>
        ))}
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Add a comment"
          placeholderTextColor={C.fog}
          multiline
          maxLength={POST_LIMITS.comment}
          accessibilityLabel="Your comment"
          style={[ui.input, { minHeight: 48 }]}
        />
        <Button label="Comment" onPress={send} busy={busy} disabled={!text.trim()} />
        <InlineError message={error} />
      </Section>
      {!comments.length && !post.body && !post.photos.length ? <EmptyState title="Nothing here" /> : null}
      <OptionsSheet visible={!!menu} options={menu ?? []} onClose={() => setMenu(null)} />
    </ScrollView>
  );
}
