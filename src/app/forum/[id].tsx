import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useLayoutEffect, useState } from 'react';
import { Image, ScrollView, TextInput, View } from 'react-native';
import { at, BuildRow, openBuild, moderateOptions, openProfile, openReport, OptionsSheet, personMark, type SheetOption } from '../../components/Community';
import { BuildChooser, ComposerPhotos, INPUT } from '../../components/ComposerParts';
import { Avatar, Button, DsText, ErrorState, HeaderActions, Icon, IconButton, ListRow, LoadingState, Press, Section, Tag, metaLine } from '../../components/ds';
import { useRepFor } from '../../components/Rep';
import { NotFound } from '../../components/ui';
import { useNow } from '../../lib/clock';
import { useCommunity, useCommunityQuery } from '../../lib/communityStore';
import { boardLabel, LIMITS, replyProblem, SOLVED_REP, type ForumReply } from '../../lib/forum';
import { plural, shortAgo } from '../../lib/format';
import { photoUri } from '../../lib/photos';
import { useStore } from '../../lib/store';
import { COLOR, RADII, SPACING } from '../../theme';

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
      ? [{ label: 'Delete thread', danger: true, onPress: () => community.run((s) => s.deleteThread(thread.id)).then(() => router.back()).catch((e) => setError(e instanceof Error ? e.message : "Couldn't delete it.")) }]
      : [
          { label: 'Report thread', onPress: () => openReport('thread', thread.id, thread.authorId, 'thread') },
          { label: 'Block the author', danger: true, onPress: () => openReport('block', thread.authorId, thread.authorId) },
          ...moderateOptions(thread.authorId),
        ];
    nav.setOptions({ headerRight: () => <HeaderActions onMenu={() => setMenu(opts)} /> });
  }, [nav, thread, community]);

  if (!q.data || !thread) {
    if (q.loading)
      return (
        <View style={{ flex: 1, backgroundColor: COLOR.surface.bg, padding: SPACING.screen }}>
          <LoadingState label="Loading the thread" />
        </View>
      );
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
      setError(e instanceof Error ? e.message : "Couldn't send that.");
    } finally {
      setBusy(false);
    }
  }

  const act = (fn: () => Promise<unknown>) => fn().catch((e) => setError(e instanceof Error ? e.message : "Couldn't do that."));

  const replyMenu = (r: ForumReply): SheetOption[] => {
    const out: SheetOption[] = [];
    if (mineThread && r.authorId !== community.me) {
      out.push(
        thread.solvedReplyId === r.id
          ? { label: 'Unmark as solved', onPress: () => act(() => community.run((s) => s.markSolved(thread.id, null))) }
          : { label: 'Mark as solved', detail: 'This reply answered your question', onPress: () => act(() => community.run((s) => s.markSolved(thread.id, r.id))) },
      );
    }
    if (r.authorId === community.me) out.push({ label: 'Delete reply', danger: true, onPress: () => act(() => community.run((s) => s.deleteReply(r.id))) });
    else {
      out.push({ label: 'Report reply', onPress: () => openReport('reply', r.id, r.authorId, 'reply') });
      out.push({ label: `Block @${handleOf(r.authorId)}`, danger: true, onPress: () => openReport('block', r.authorId, r.authorId) });
      out.push(...moderateOptions(r.authorId));
    }
    return out;
  };

  const photo = (p: string, label: string) => (
    <Image key={p} source={{ uri: photoUri(p) }} style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: RADII.control, backgroundColor: COLOR.surface.media }} accessibilityLabel={label} accessibilityIgnoresInvertColors />
  );

  return (
    <ScrollView contentContainerStyle={{ padding: SPACING.screen, gap: SPACING.section, paddingBottom: SPACING.xxxl }} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive" automaticallyAdjustKeyboardInsets>
      <View style={{ gap: SPACING.md }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs }}>
          <Tag label={boardLabel(thread.board)} />
          {thread.region ? <Tag label={thread.region} raw /> : null}
          {thread.solvedReplyId ? <Tag label="Solved" tone="success" /> : null}
          {thread.sample ? <Tag label="Sample" /> : null}
        </View>
        <DsText v="titleLg" accessibilityRole="header">
          {thread.title}
        </DsText>
        <ListRow
          leading={{ avatar: personMark(author) }}
          title={at(author)}
          meta={metaLine([`Level ${repFor(thread.authorId).level.level}`, shortAgo(thread.createdAt, now)])}
          onPress={() => openProfile(thread.authorId)}
          chevron={false}
        />
        {thread.hidden ? (
          <DsText v="caption" tone="warning">
            Hidden while it's checked after reports. Only you can see it.
          </DsText>
        ) : null}
        {thread.body ? (
          <DsText v="body" selectable>
            {thread.body}
          </DsText>
        ) : null}
        {thread.photos.map((p) => photo(p, 'Photo in the thread'))}
        {linked ? <BuildRow build={linked} onPress={() => openBuild(linked.id)} /> : null}
      </View>

      <Section title={plural(replies.length, 'Reply', 'Replies')}>
        {mineThread && replies.some((r) => r.authorId !== me) && !thread.solvedReplyId ? (
          <DsText v="caption">Got your answer? Open the ··· on that reply and mark it solved. Its author gets +{SOLVED_REP} rep.</DsText>
        ) : null}
        {ordered.length === 0 ? <DsText v="secondary">No replies yet. Be the first to help.</DsText> : null}
        {ordered.map((r) => {
          const isSolved = r.id === thread.solvedReplyId;
          const rb = r.buildId ? builds.find((b) => b.id === r.buildId) : undefined;
          const own = r.authorId === community.me;
          const ra = users.find((u) => u.id === r.authorId);
          return (
            <View
              key={r.id}
              style={{ gap: SPACING.sm, padding: SPACING.md, borderRadius: RADII.card, borderWidth: 1, borderColor: isSolved ? COLOR.state.success : COLOR.surface.border, backgroundColor: COLOR.surface.card }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                <Press onPress={() => openProfile(r.authorId)} role="link" label={`${at(ra)}'s profile`} style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flex: 1 }}>
                  <Avatar {...personMark(ra)} size="sm" />
                  <DsText v="bodyStrong" numberOfLines={1} style={{ flexShrink: 1 }}>
                    {at(ra)}
                  </DsText>
                  <DsText v="meta">{shortAgo(r.createdAt, now)}</DsText>
                </Press>
                {isSolved || r.sample ? (
                  <View style={{ flexDirection: 'row', gap: SPACING.xs }}>
                    {isSolved ? <Tag label="Solved" tone="success" /> : null}
                    {r.sample ? <Tag label="Sample" /> : null}
                  </View>
                ) : null}
                <IconButton icon="more" label="More options for this reply" colour={COLOR.text.secondary} onPress={() => setMenu(replyMenu(r))} />
              </View>
              {r.hidden ? (
                <DsText v="caption" tone="warning">
                  Hidden while it's checked. Only you can see it.
                </DsText>
              ) : null}
              <DsText v="body" selectable>
                {r.body}
              </DsText>
              {r.photos.map((p) => photo(p, 'Photo in the reply'))}
              {rb ? <BuildRow build={rb} onPress={() => openBuild(rb.id)} /> : null}
              <Press
                onPress={() => (own ? setError("You can't mark your own reply as helpful.") : act(() => community.run((s) => s.helpful(r.id, !r.helpfulByMe))))}
                haptic={own ? 'none' : 'select'}
                state={{ selected: r.helpfulByMe }}
                label={`${r.helpfulByMe ? 'Helpful, tap to undo' : 'Mark as helpful'}, ${r.helpfulCount}`}
                hitSlop={8}
                style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, minHeight: 36, alignSelf: 'flex-start' }}
              >
                <Icon name="success" size={20} colour={r.helpfulByMe ? COLOR.action.selected : COLOR.text.secondary} />
                <DsText v="meta" style={r.helpfulByMe ? { color: COLOR.action.selected } : undefined}>
                  Helpful {r.helpfulCount}
                </DsText>
              </Press>
            </View>
          );
        })}
      </Section>

      <Section title="Your reply">
        <TextInput
            value={body}
            onChangeText={setBody}
            placeholder="Share what you know"
            placeholderTextColor={COLOR.text.secondary}
            multiline
            maxLength={LIMITS.body}
            accessibilityLabel="Your reply"
            style={[INPUT, { minHeight: 90, textAlignVertical: 'top' }]}
          />
        {more ? (
          <>
            <ComposerPhotos photos={photos} onChange={setPhotos} onError={setError} />
            <BuildChooser builds={builds.filter((b) => b.ownerId === me)} value={buildId} onChange={setBuildId} />
          </>
        ) : (
          <Button label="Add photos or a build" tier="tertiary" size="sm" onPress={() => setMore(true)} />
        )}
        <Button label="Reply" block haptic="success" onPress={send} busy={busy} disabled={!body.trim()} hint="Write something first" />
        {error ? <ErrorState title={error} /> : null}
      </Section>
      <OptionsSheet visible={!!menu} title="Options" options={menu ?? []} onClose={() => setMenu(null)} />
    </ScrollView>
  );
}
