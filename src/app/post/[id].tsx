import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { at, openProfile, openReport, OptionsSheet, personMark, PostCard, type SheetOption } from '../../components/Community';
import { Field, INPUT } from '../../components/ComposerParts';
import { Avatar, Button, DsText, EmptyState, ErrorState, IconButton, LoadingState, Press, RowDivider, Section, Tag } from '../../components/ds';
import { NightMap } from '../../components/NightMap';
import { NotFound } from '../../components/ui';
import { useNow } from '../../lib/clock';
import { useCommunity, useCommunityQuery } from '../../lib/communityStore';
import { shortAgo } from '../../lib/format';
import { commentProblem, POST_LIMITS, withLike, type PostComment } from '../../lib/posts';
import { useStore } from '../../lib/store';
import { COLOR, POST_COLOUR, RADII, SPACING } from '../../theme';

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
    if (q.loading)
      return (
        <View style={{ flex: 1, backgroundColor: COLOR.surface.bg, padding: SPACING.screen }}>
          <LoadingState label="Loading the post" />
        </View>
      );
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
      setError(e instanceof Error ? e.message : "Couldn't send that.");
    } finally {
      setBusy(false);
    }
  }

  const postMenu = (): SheetOption[] =>
    post.authorId === community.me
      ? [{ label: 'Delete post', danger: true, onPress: () => community.run((s) => s.deletePost(post.id)).then(() => router.back()).catch((e) => setError(e instanceof Error ? e.message : "Couldn't delete it.")) }]
      : [
          { label: 'Report post', onPress: () => openReport('post', post.id, post.authorId, 'post') },
          { label: `Block @${author?.handle ?? 'them'}`, danger: true, onPress: () => openReport('block', post.authorId, post.authorId) },
        ];

  const commentMenu = (c: PostComment): SheetOption[] => {
    const out: SheetOption[] = [];
    if (c.authorId === community.me || post.authorId === community.me) {
      out.push({ label: 'Delete comment', danger: true, onPress: () => community.run((s) => s.deleteComment(c.id)).catch((e) => setError(e instanceof Error ? e.message : "Couldn't delete it.")) });
    }
    if (c.authorId !== community.me) {
      out.push({ label: 'Report comment', onPress: () => openReport('comment', c.id, c.authorId, 'comment') });
      out.push({ label: `Block @${handleOf(c.authorId)}`, danger: true, onPress: () => openReport('block', c.authorId, c.authorId) });
    }
    return out;
  };

  return (
    <ScrollView contentContainerStyle={{ padding: SPACING.screen, gap: SPACING.section, paddingBottom: SPACING.xxxl }} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive" automaticallyAdjustKeyboardInsets>
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
        onMore={() => setMenu(postMenu())}
      />

      {post.at ? (
        <View style={{ height: 180, borderRadius: RADII.card, overflow: 'hidden', borderWidth: 1, borderColor: COLOR.surface.border }}>
          <NightMap pins={[{ id: 'post', at: post.at, glyph: 'post', colour: POST_COLOUR, title: post.placeName ?? 'Post', size: 34 }]} centre={post.at} span={0.03} />
        </View>
      ) : null}

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
                      <DsText v="meta">{shortAgo(c.createdAt, now)}</DsText>
                      {c.sample ? <Tag label="Sample" /> : null}
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
        <Field label="Your comment">
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Add a comment"
            placeholderTextColor={COLOR.text.secondary}
            multiline
            maxLength={POST_LIMITS.comment}
            accessibilityLabel="Your comment"
            style={INPUT}
          />
        </Field>
        <Button label="Comment" block haptic="success" onPress={send} busy={busy} disabled={!text.trim()} hint="Write something first" />
        {error ? <ErrorState title={error} /> : null}
      </Section>
      <OptionsSheet visible={!!menu} options={menu ?? []} onClose={() => setMenu(null)} />
    </ScrollView>
  );
}
