import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useLayoutEffect, useState } from 'react';
import { Image, ScrollView, TextInput, View } from 'react-native';
import { Avatar, BuildLine, openReport, OptionsSheet, type SheetOption } from '../../components/Community';
import { BuildChooser, ComposerPhotos } from '../../components/ComposerParts';
import { LevelTag, useRepFor } from '../../components/Rep';
import { Button, Card, HeaderAction, InlineError, NotFound, Pressable_, Row, SampleTag, Section, Tag, Txt, s as ui } from '../../components/ui';
import { useNow } from '../../lib/clock';
import { useCommunity, useCommunityQuery } from '../../lib/communityStore';
import { boardLabel, LIMITS, replyProblem, SOLVED_REP, type ForumReply } from '../../lib/forum';
import { plural, shortAgo } from '../../lib/format';
import { photoUri } from '../../lib/photos';
import { useStore } from '../../lib/store';
import { BRAND, C, F, RADIUS, STATE, TYPE } from '../../theme';

/** A thread: the question, replies (Helpful, Solved), and a reply box. */
export default function ThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const nav = useNavigation();
  const { users, builds, me } = useStore();
  const community = useCommunity();
  const repFor = useRepFor();
  const now = useNow();
  const q = useCommunityQuery((s) => s.thread(id), [id]);
  const [body, setBody] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [buildId, setBuildId] = useState<string | undefined>();
  const [more, setMore] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menu, setMenu] = useState<SheetOption[] | null>(null);
  const thread = q.data?.thread;

  useLayoutEffect(() => {
    if (!thread) return;
    const mine = thread.authorId === community.me;
    const opts: SheetOption[] = mine
      ? [{ label: 'Delete thread', danger: true, onPress: () => community.run((s) => s.deleteThread(thread.id)).then(() => router.back()).catch((e) => setError(e instanceof Error ? e.message : 'Could not delete it.')) }]
      : [
          { label: 'Report thread', onPress: () => openReport('thread', thread.id, thread.authorId, 'thread') },
          { label: 'Block the author', danger: true, onPress: () => openReport('block', thread.authorId, thread.authorId) },
        ];
    nav.setOptions({ headerRight: () => <HeaderAction label="···" accessibilityLabel="Thread options" onPress={() => setMenu(opts)} /> });
  }, [nav, thread, community]);

  if (!q.data || !thread) {
    if (q.loading) return <View style={{ flex: 1, backgroundColor: C.asphalt }} />;
    return <NotFound what="Thread" message={q.error ?? undefined} />;
  }
  const replies = q.data.replies.filter((r) => !community.blocked.has(r.authorId));
  const author = users.find((u) => u.id === thread.authorId);
  const mineThread = thread.authorId === community.me;
  const handleOf = (uid: string) => users.find((u) => u.id === uid)?.handle ?? 'someone';
  const linked = thread.buildId ? builds.find((b) => b.id === thread.buildId) : undefined;
  const solved = replies.find((r) => r.id === thread.solvedReplyId);
  const ordered = solved ? [solved, ...replies.filter((r) => r !== solved)] : replies;

  async function send() {
    setError(null);
    const p = replyProblem(body);
    if (p) return setError(p);
    setBusy(true);
    try {
      await community.run((s) => s.reply(thread!.id, body, photos, buildId));
      setBody('');
      setPhotos([]);
      setBuildId(undefined);
      setMore(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send that.');
    } finally {
      setBusy(false);
    }
  }

  const act = (fn: () => Promise<unknown>) => fn().catch((e) => setError(e instanceof Error ? e.message : 'Could not do that.'));

  const replyMenu = (r: ForumReply): SheetOption[] => {
    const out: SheetOption[] = [];
    if (mineThread && r.authorId !== community.me) {
      out.push(
        thread.solvedReplyId === r.id
          ? { label: 'Unmark as solved', onPress: () => act(() => community.run((s) => s.markSolved(thread.id, null))) }
          : { label: 'Mark as the answer (Solved)', onPress: () => act(() => community.run((s) => s.markSolved(thread.id, r.id))) },
      );
    }
    if (r.authorId === community.me) out.push({ label: 'Delete reply', danger: true, onPress: () => act(() => community.run((s) => s.deleteReply(r.id))) });
    else {
      out.push({ label: 'Report reply', onPress: () => openReport('reply', r.id, r.authorId, 'reply') });
      out.push({ label: `Block @${handleOf(r.authorId)}`, danger: true, onPress: () => openReport('block', r.authorId, r.authorId) });
    }
    return out;
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 18, paddingBottom: 60 }} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive" automaticallyAdjustKeyboardInsets>
      <View style={{ gap: 10 }}>
        <Row gap={6}>
          <Tag label={boardLabel(thread.board)} tone="muted" />
          {thread.region ? <Tag label={thread.region} tone="muted" /> : null}
          {thread.solvedReplyId ? <Tag label="Solved" tone="success" /> : null}
          {thread.sample ? <SampleTag /> : null}
        </Row>
        <Txt v="h2" style={{ textTransform: 'none' }} accessibilityRole="header">{thread.title}</Txt>
        <Pressable_ role="link" onPress={() => router.push({ pathname: '/user/[id]', params: { id: thread.authorId } })} label={`@${author?.handle ?? 'someone'}'s profile`}>
          <Row gap={8}>
            <Avatar user={author} size={28} />
            <Txt style={{ fontFamily: F.bodyBold }}>@{author?.handle ?? 'someone'}</Txt>
            <LevelTag level={repFor(thread.authorId).level.level} />
            <Txt v="caption">{shortAgo(thread.createdAt, now)}</Txt>
          </Row>
        </Pressable_>
        {thread.hidden ? <Txt v="caption" style={{ color: STATE.warning }}>Hidden while it's checked after reports. Only you can see it.</Txt> : null}
        {thread.body ? <Txt selectable>{thread.body}</Txt> : null}
        {thread.photos.map((p) => (
          <Image key={p} source={{ uri: photoUri(p) }} style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: RADIUS.card, backgroundColor: C.kerb }} accessibilityLabel="Photo in the thread" accessibilityIgnoresInvertColors />
        ))}
        {linked ? <BuildLine build={linked} onPress={() => router.push({ pathname: '/build/[id]', params: { id: linked.id } })} /> : null}
      </View>

      <Section title={plural(replies.length, 'Reply', 'Replies')}>
        {mineThread && replies.some((r) => r.authorId !== me) && !thread.solvedReplyId ? (
          <Txt v="caption">Got your answer? Open the ··· on a reply and mark it Solved: its author gets +{SOLVED_REP} rep.</Txt>
        ) : null}
        {ordered.length === 0 ? <Txt v="muted">No replies yet. Be the first to help.</Txt> : null}
        {ordered.map((r) => {
          const isSolved = r.id === thread.solvedReplyId;
          const rb = r.buildId ? builds.find((b) => b.id === r.buildId) : undefined;
          return (
            <Card key={r.id} accent={isSolved ? STATE.success : undefined} style={{ gap: 8 }}>
              <Row style={{ flexWrap: 'nowrap' }} gap={8}>
                <Pressable_ role="link" onPress={() => router.push({ pathname: '/user/[id]', params: { id: r.authorId } })} label={`@${handleOf(r.authorId)}'s profile`}>
                  <Row gap={8}>
                    <Avatar user={users.find((u) => u.id === r.authorId)} size={28} />
                    <Txt style={{ fontFamily: F.bodyBold }} numberOfLines={1}>@{handleOf(r.authorId)}</Txt>
                  </Row>
                </Pressable_>
                <Txt v="caption" style={{ flex: 1 }}>{shortAgo(r.createdAt, now)}</Txt>
                {isSolved ? <Tag label="Solved" tone="success" /> : null}
                {r.sample ? <SampleTag /> : null}
                <Pressable_ onPress={() => setMenu(replyMenu(r))} label="More options for this reply">
                  <Txt v="h3" style={{ color: C.fog, paddingHorizontal: 8 }}>···</Txt>
                </Pressable_>
              </Row>
              {r.hidden ? <Txt v="caption" style={{ color: STATE.warning }}>Hidden while it's checked. Only you can see it.</Txt> : null}
              <Txt selectable>{r.body}</Txt>
              {r.photos.map((p) => (
                <Image key={p} source={{ uri: photoUri(p) }} style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: RADIUS.card, backgroundColor: C.kerb }} accessibilityLabel="Photo in the reply" accessibilityIgnoresInvertColors />
              ))}
              {rb ? <BuildLine build={rb} onPress={() => router.push({ pathname: '/build/[id]', params: { id: rb.id } })} /> : null}
              <Row>
                <Pressable_
                  onPress={() => (r.authorId === community.me ? setError("You can't mark your own reply as helpful.") : act(() => community.run((s) => s.helpful(r.id, !r.helpfulByMe))))}
                  label={`${r.helpfulByMe ? 'Helpful, tap to undo' : 'Mark as helpful'}, ${r.helpfulCount}`}
                >
                  <Txt v="label" scale="chrome" style={{ color: r.helpfulByMe ? BRAND : C.fog, fontSize: TYPE.caption }}>
                    {r.helpfulByMe ? '▲ Helpful' : '△ Helpful'} {r.helpfulCount}
                  </Txt>
                </Pressable_>
              </Row>
            </Card>
          );
        })}
      </Section>

      <Section title="Your reply">
        <TextInput
          value={body}
          onChangeText={setBody}
          placeholder="Share what you know"
          placeholderTextColor={C.fog}
          multiline
          maxLength={LIMITS.body}
          accessibilityLabel="Your reply"
          style={[ui.input, { minHeight: 90, textAlignVertical: 'top' }]}
        />
        {more ? (
          <>
            <ComposerPhotos photos={photos} onChange={setPhotos} onError={setError} />
            <BuildChooser builds={builds.filter((b) => b.ownerId === me)} value={buildId} onChange={setBuildId} />
          </>
        ) : (
          <Pressable_ onPress={() => setMore(true)} role="link" label="Add photos or a build">
            <Txt v="label" style={{ color: BRAND, fontSize: TYPE.muted }}>Add photos or a build ›</Txt>
          </Pressable_>
        )}
        <Button label="Reply" onPress={send} busy={busy} disabled={!body.trim()} />
        <InlineError message={error} />
      </Section>
      <OptionsSheet visible={!!menu} options={menu ?? []} onClose={() => setMenu(null)} />
    </ScrollView>
  );
}
