import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { FlatList, Image, KeyboardAvoidingView, Platform, TextInput, View } from 'react-native';
import { at, openProfile, openReport, OptionsSheet, personMark, type SheetOption } from '../../components/Community';
import { INPUT } from '../../components/ComposerParts';
import { Avatar, Button, DsText, ErrorState, HeaderActions, IconButton, LoadingState, Press, screenHeader } from '../../components/ds';
import { usePhotoFlow } from '../../components/PhotoFlow';
import { ShareCardView, SharePicker } from '../../components/SharePicker';
import { useNow } from '../../lib/clock';
import { useCommunity, useCommunityQuery } from '../../lib/communityStore';
import { formatTime } from '../../lib/format';
import { conversationTitle, dayLabel, MESSAGE_MAX, messageProblem, otherMember, seenLabel, shareHref, type Message, type ShareCard } from '../../lib/messages';
import { photoUri } from '../../lib/photos';
import { useStore } from '../../lib/store';
import { COLOR, line, RADII, SPACING, tint } from '../../theme';
import { NotFoundState } from '../../components/Detail';

/** One chat: messages, photos (plate-blurred), shared cards, "Seen". Only between connected people. */
export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const nav = useNavigation();
  const { users } = useStore();
  const community = useCommunity();
  const now = useNow();
  const q = useCommunityQuery((s) => s.messages(id), [id]);
  const conv = community.conversations.find((c) => c.id === id);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [menu, setMenu] = useState<SheetOption[] | null>(null);
  const list = useRef<FlatList<Message>>(null);
  const handleOf = (uid: string) => users.find((u) => u.id === uid)?.handle;
  const other = conv ? otherMember(conv, community.me) : undefined;

  const send = async (m: { body: string; photo?: string; share?: ShareCard }) => {
    setError(null);
    const p = messageProblem(m.body, m.photo, m.share);
    if (p) return setError(p);
    setBusy(true);
    try {
      await community.run((s) => s.send(id, m));
      if (!m.photo && !m.share) setText('');
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't send that.");
    } finally {
      setBusy(false);
    }
  };
  const flow = usePhotoFlow({ onError: setError, onPhoto: (ref) => void send({ body: '', photo: ref }) });

  // While this chat is on screen: no phone notifications for it, and it's read.
  useEffect(() => {
    community.setActiveConversation(id);
    return () => community.setActiveConversation(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  const count = q.data?.messages.length ?? 0;
  useEffect(() => {
    if (!community.service || !id) return;
    community.service.markRead(id).then(() => community.refresh()).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, count, community.service]);

  useLayoutEffect(() => {
    if (!conv) return;
    const title = conversationTitle(conv, community.me, handleOf);
    const options: SheetOption[] =
      conv.kind === 'group'
        ? [{ label: 'Group info', detail: 'Members, name, leave', onPress: () => router.push({ pathname: '/chat/info', params: { id } }) }]
        : [
            ...(other ? [{ label: `View @${handleOf(other) ?? 'profile'}`, onPress: () => openProfile(other) }] : []),
            ...(other ? [{ label: 'Report this person', onPress: () => openReport('profile', other, other, 'profile') }] : []),
            ...(other ? [{ label: 'Block', danger: true, onPress: () => openReport('block', other, other) }] : []),
            { label: 'Delete chat', danger: true, onPress: () => community.run((s) => s.leave(id)).then(() => router.back()).catch((e) => setError(e instanceof Error ? e.message : "Couldn't delete it.")) },
          ];
    // A chat's title is content (a handle or a group name): sentence case, never shouted.
    nav.setOptions({ ...screenHeader({ title, content: true }), headerRight: () => <HeaderActions onMenu={() => setMenu(options)} /> });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nav, conv?.id, conv?.name, conv?.memberIds.length, other, users.length]);

  if (flow.view) return <View style={{ flex: 1, backgroundColor: COLOR.surface.bg, padding: SPACING.screen }}>{flow.view}</View>;
  if (!conv) {
    if (!q.data || q.loading)
      return (
        <View style={{ flex: 1, backgroundColor: COLOR.surface.bg, padding: SPACING.screen }}>
          <LoadingState label="Loading the chat" />
        </View>
      );
    return <NotFoundState what="Chat" message="You're not in this chat any more." />;
  }
  const messages = (q.data?.messages ?? []).filter((m) => !(m.senderId && community.blocked.has(m.senderId)));
  const seen = seenLabel({ ...conv, readUpTo: q.data?.readUpTo }, messages, community.me);
  const rows = [...messages].reverse();

  const messageMenu = (m: Message): SheetOption[] =>
    !m.senderId || m.senderId === community.me
      ? []
      : [
          { label: 'Report message', onPress: () => openReport('message', m.id, m.senderId!, 'message') },
          { label: `Block @${handleOf(m.senderId) ?? 'them'}`, danger: true, onPress: () => openReport('block', m.senderId!, m.senderId!) },
        ];

  /** Messages from one person within 10 minutes run together: one name, one time under the last. */
  const sameRun = (a?: Message, b?: Message) =>
    !!a && !!b && !a.system && !b.system && a.senderId === b.senderId && Math.abs(new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) < 10 * 60_000 && dayLabel(a.createdAt, now) === dayLabel(b.createdAt, now);

  const renderItem = ({ item: m, index }: { item: Message; index: number }) => {
    const older = rows[index + 1];
    const newer = rows[index - 1];
    const newDay = !older || dayLabel(older.createdAt, now) !== dayLabel(m.createdAt, now);
    const mine = m.senderId === community.me;
    const firstOfRun = !sameRun(older, m);
    const lastOfRun = !sameRun(m, newer);
    const sender = m.senderId ? users.find((u) => u.id === m.senderId) : undefined;
    const showName = conv.kind === 'group' && !mine && !!m.senderId && firstOfRun;
    const side = mine ? 'flex-end' : 'flex-start';
    return (
      <View style={{ gap: SPACING.xs, marginTop: firstOfRun ? SPACING.sm : 0 }}>
        {newDay ? (
          <DsText v="label" style={{ textAlign: 'center', marginVertical: SPACING.sm }}>
            {dayLabel(m.createdAt, now)}
          </DsText>
        ) : null}
        {m.system ? (
          <DsText v="caption" style={{ textAlign: 'center' }}>
            {m.body}
          </DsText>
        ) : (
          <Press
            onLongPress={() => {
              const opts = messageMenu(m);
              if (opts.length) setMenu(opts);
            }}
            feedback="none"
            role="text"
            label={`${mine ? 'You' : at(sender)}, ${formatTime(m.createdAt)}: ${m.photo ? 'photo. ' : ''}${m.share ? `shared ${m.share.title}. ` : ''}${m.body}`}
            hint={mine ? undefined : 'Long press to report or block'}
            style={{ alignSelf: side, maxWidth: '82%', gap: SPACING.xs, alignItems: side }}
          >
            {showName ? (
              <Press onPress={() => openProfile(m.senderId!)} role="link" label={`${at(sender)}'s profile`} style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
                <Avatar {...personMark(sender)} size="sm" />
                <DsText v="secondary">{at(sender)}</DsText>
              </Press>
            ) : null}
            {m.photo ? <Image source={{ uri: photoUri(m.photo) }} style={{ width: 220, height: 220, borderRadius: RADII.card, backgroundColor: COLOR.surface.media }} accessibilityIgnoresInvertColors /> : null}
            {m.share ? <ShareCardView card={m.share} onPress={() => router.push(shareHref(m.share!) as never)} /> : null}
            {m.body ? (
              <View
                style={{
                  // Yours in a blue-grey tint, theirs on the card: told apart by colour as well as side (REVIEW-7 inconsistency 15).
                  backgroundColor: mine ? tint(COLOR.state.info) : COLOR.surface.card,
                  borderWidth: 1,
                  borderColor: mine ? line(COLOR.state.info) : COLOR.surface.border,
                  borderRadius: RADII.sheet,
                  borderBottomRightRadius: mine && lastOfRun ? RADII.tag : RADII.sheet,
                  borderBottomLeftRadius: !mine && lastOfRun ? RADII.tag : RADII.sheet,
                  paddingHorizontal: SPACING.md,
                  paddingVertical: SPACING.sm,
                }}
              >
                <DsText v="body" selectable>
                  {m.body}
                </DsText>
              </View>
            ) : null}
            {lastOfRun ? <DsText v="meta">{formatTime(m.createdAt)}</DsText> : null}
          </Press>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: COLOR.surface.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <FlatList
        ref={list}
        data={rows}
        inverted
        keyExtractor={(m) => m.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: SPACING.screen, gap: SPACING.xs }}
        ListHeaderComponent={
          seen ? (
            <DsText v="meta" style={{ textAlign: 'right' }} accessibilityLiveRegion="polite">
              {seen}
            </DsText>
          ) : undefined
        }
        ListEmptyComponent={
          <View style={{ transform: [{ scaleY: -1 }] }}>
            <DsText v="secondary" style={{ textAlign: 'center' }}>
              {conv.kind === 'group' ? 'Say hello to the group.' : 'Say hello.'}
            </DsText>
          </View>
        }
        keyboardShouldPersistTaps="handled"
      />
      <View style={{ paddingHorizontal: SPACING.md, paddingTop: SPACING.sm, paddingBottom: SPACING.xl, gap: SPACING.sm, borderTopWidth: 1, borderTopColor: COLOR.surface.border, backgroundColor: COLOR.surface.bg }}>
        {error ? <ErrorState title={error} /> : null}
        {conv.canSend ? (
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: SPACING.sm }}>
            <IconButton
              icon="camera"
              label="Add a photo or share something"
              onPress={() =>
                setMenu([
                  { label: 'Take a photo', onPress: () => void flow.pick(true) },
                  { label: 'Choose a photo', onPress: () => void flow.pick(false) },
                  { label: 'Share a build, event or place', onPress: () => setSharing(true) },
                ])
              }
            />
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Message"
              placeholderTextColor={COLOR.text.secondary}
              multiline
              numberOfLines={1}
              maxLength={MESSAGE_MAX}
              accessibilityLabel="Message"
              style={[INPUT, { flex: 1, maxHeight: 120 }]}
            />
            <Button label="Send" size="sm" haptic="success" onPress={() => void send({ body: text })} busy={busy} disabled={!text.trim()} />
          </View>
        ) : (
          <DsText v="secondary" style={{ textAlign: 'center' }}>
            {conv.kind === 'direct'
              ? "You're no longer connected, so you can't send messages here. Connect again to carry on."
              : "You're not in this group any more."}
          </DsText>
        )}
      </View>
      <SharePicker visible={sharing} onPick={(c) => void send({ body: '', share: c })} onClose={() => setSharing(false)} />
      <OptionsSheet visible={!!menu} options={menu ?? []} onClose={() => setMenu(null)} />
    </KeyboardAvoidingView>
  );
}
