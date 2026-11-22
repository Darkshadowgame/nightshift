import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useLayoutEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { at, postedLabel, BuildRow, openBuild, moderateOptions, openProfile, openReport, OptionsSheet, personMark, type SheetOption } from '../../components/Community';
import { BuildChooser, CommentBar, ComposerPhotos } from '../../components/ComposerParts';
import { Avatar, Button, DsText, ErrorState, HeaderActions, Hero, Icon, IconButton, ListRow, LoadingState, PAGE_WITH_BAR, Press, Section, Tag, metaLine } from '../../components/ds';
import { useNow } from '../../lib/clock';
import { useCommunity, useCommunityQuery, useMediaLimits } from '../../lib/communityStore';
import { boardLabel, LIMITS, replyProblem, type ForumReply } from '../../lib/forum';
import { fitsLabel } from '../../lib/forumHelp';
import { useGarageGroups } from '../../lib/useGarageGroups';
import { plural } from '../../lib/format';
import { photoUri } from '../../lib/photos';
import { useStore } from '../../lib/store';
import { COLOR, RADII, SPACING } from '../../theme';
import { NotFoundState } from '../../components/Detail';
import { PhotoGallery, PhotoViewer } from '../../components/PhotoGallery';
import { ListingCard, soldWord } from '../../components/ListingCard';

/** A thread (T3): the question, replies (Helpful, Solved), and the reply field in the bottom bar. ··· has report, block, sold and delete. */
export default function ThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const nav = useNavigation();
  const { users, builds, me } = useStore();
  const community = useCommunity();
  const now = useNow();
  const q = useCommunityQuery((s) => s.thread(id), [id]);
  const [body, setBody] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const limits = useMediaLimits();
  const [buildId, setBuildId] = useState<string | undefined>();
  const [more, setMore] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menu, setMenu] = useState<SheetOption[] | null>(null);
  const [viewing, setViewing] = useState<{ photos: string[]; start: number } | null>(null);
  const thread = q.data?.thread;
  const garage = useGarageGroups();

  useLayoutEffect(() => {
    if (!thread) return;
    const mine = thread.authorId === community.me;
    const l = thread.listing;
    const opts: SheetOption[] = mine
      ? [
          ...(l
            ? ([
                l.soldAt
                  ? { label: l.kind === 'wanted' ? 'Still looking' : 'Back on sale', onPress: () => community.run((s) => s.setListingSold(thread.id, false)).catch((e) => setError(e instanceof Error ? e.message : "Couldn't change it.")) }
                  : l.kind === 'sale'
                    ? null
                    : { label: `Mark as ${soldWord(l).toLowerCase()}`, detail: 'It stays up, marked ' + soldWord(l), onPress: () => community.run((s) => s.setListingSold(thread.id, true)).catch((e) => setError(e instanceof Error ? e.message : "Couldn't change it.")) },
              ] as (SheetOption | null)[])
            : []).filter((o): o is SheetOption => !!o),
          { label: 'Delete thread', danger: true, onPress: () => community.run((s) => s.deleteThread(thread.id)).then(() => router.back()).catch((e) => setError(e instanceof Error ? e.message : "Couldn't delete it.")) },
        ]
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
    return <NotFoundState what="Thread" message={q.error ?? undefined} />;
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

  const open = (photos: string[], i: number) => setViewing({ photos, start: i });

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
    <ScrollView contentContainerStyle={PAGE_WITH_BAR} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive" showsVerticalScrollIndicator={false}>
      <View style={{ gap: SPACING.md }}>
        {/* One photo: the title sits on it. More: swipe through them ("1/5"), the title under. A tap opens them full screen. */}
        <Hero
          bleed
          photo={thread.photos.length === 1 ? { uri: photoUri(thread.photos[0]) } : null}
          media={thread.photos.length > 1 ? <PhotoGallery photos={thread.photos} aspect={4 / 3} label="in the thread" onOpen={(i) => open(thread.photos, i)} /> : undefined}
          overlay={
            thread.photos.length === 1 ? (
              <Press onPress={() => open(thread.photos, 0)} label="Open the photo" feedback="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}>
                <View />
              </Press>
            ) : undefined
          }
          aspect={4 / 3}
          eyebrow={thread.listing ? thread.region : metaLine([boardLabel(thread.board), thread.region])}
          title={thread.title}
          tag={thread.solvedReplyId ? { label: 'Solved', tone: 'success' } : null}
        />
        {thread.listing ? (
          <ListingCard
            listing={thread.listing}
            mine={mineThread}
            busy={busy}
            fits={fitsLabel(thread, garage)}
            onSold={(sold, price) => {
              setBusy(true);
              community
                .run((s) => s.setListingSold(thread.id, sold, price))
                .catch((e) => setError(e instanceof Error ? e.message : "Couldn't change it."))
                .finally(() => setBusy(false));
            }}
          />
        ) : null}
        <ListRow
          leading={{ avatar: personMark(author) }}
          title={at(author)}
          meta={postedLabel(thread.createdAt, now)}
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
        {linked ? <BuildRow build={linked} onPress={() => openBuild(linked.id)} /> : null}
      </View>

      <Section title={plural(replies.length, 'Reply', 'Replies')}>
        {ordered.length === 0 ? (
          <DsText v="secondary">
            {mineThread
              ? "No replies yet. You'll get a notice when someone replies."
              : thread.board === 'for_sale'
                ? 'No replies yet. Ask about it here.'
                : 'No replies yet. Be the first to help.'}
          </DsText>
        ) : null}
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
                  <DsText v="meta">{postedLabel(r.createdAt, now)}</DsText>
                </Press>
                {isSolved ? <Tag label="Solved" tone="success" /> : null}
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
              {r.photos.length ? (
                <View style={{ borderRadius: RADII.control, overflow: 'hidden' }}>
                  <PhotoGallery photos={r.photos} aspect={4 / 3} label="in the reply" onOpen={(i) => open(r.photos, i)} />
                </View>
              ) : null}
              {rb ? <BuildRow build={rb} onPress={() => openBuild(rb.id)} /> : null}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACING.sm }}>
              <Press
                onPress={() => (own ? setError("You can't mark your own reply as helpful.") : act(() => community.run((s) => s.helpful(r.id, !r.helpfulByMe))))}
                haptic={own ? 'none' : 'select'}
                state={{ selected: r.helpfulByMe }}
                label={`${r.helpfulByMe ? 'Helpful, tap to undo' : 'Mark as helpful'}, ${r.helpfulCount}`}
                hitSlop={8}
                style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, minHeight: 36, alignSelf: 'flex-start' }}
              >
                <Icon name="success" size={20} colour={r.helpfulByMe ? COLOR.state.success : COLOR.text.secondary} />
                <DsText v="meta" style={r.helpfulByMe ? { color: COLOR.text.primary } : undefined}>
                  Helpful {r.helpfulCount}
                </DsText>
              </Press>
              {mineThread && !own && !thread.solvedReplyId && thread.board !== 'for_sale' ? (
                <Button tier="tertiary" size="sm" icon="check" label="This fixed it" accessibilityLabel="Mark this reply as the one that fixed it" onPress={() => act(() => community.run((s) => s.markSolved(thread.id, r.id)))} />
              ) : null}
              </View>
            </View>
          );
        })}
      </Section>

      {error ? <ErrorState title={error} /> : null}
    </ScrollView>
      <CommentBar
        value={body}
        onChange={setBody}
        onSend={() => void send()}
        busy={busy}
        placeholder={thread.listing ? (mineThread ? 'Add an update' : 'Ask about it') : 'Share what you know'}
        label="Your reply"
        maxLength={LIMITS.body}
        extra={
          more ? (
            <>
              <ComposerPhotos photos={photos} onChange={setPhotos} onError={setError} max={limits.photos} />
              <BuildChooser builds={builds.filter((b) => b.ownerId === me)} value={buildId} onChange={setBuildId} />
            </>
          ) : (
            <Button label="Add photos or a build" tier="tertiary" size="sm" onPress={() => setMore(true)} style={{ alignSelf: 'flex-start' }} />
          )
        }
      />
      <OptionsSheet visible={!!menu} title="Options" options={menu ?? []} onClose={() => setMenu(null)} />
      <PhotoViewer photos={viewing?.photos ?? []} start={viewing?.start ?? null} onClose={() => setViewing(null)} />
    </KeyboardAvoidingView>
  );
}
