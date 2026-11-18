import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { FlatList, Image, KeyboardAvoidingView, Platform, Pressable, TextInput, View } from 'react-native';
import { openReport, OptionsSheet, type SheetOption } from '../../components/Community';
import { usePhotoFlow } from '../../components/PhotoFlow';
import { ShareCardView, SharePicker } from '../../components/SharePicker';
import { Button, HeaderAction, InlineError, NotFound, Notice, Row, SampleTag, Txt, s as ui } from '../../components/ui';
import { useNow } from '../../lib/clock';
import { useCommunity, useCommunityQuery } from '../../lib/communityStore';
import { formatTime } from '../../lib/format';
import { conversationTitle, dayLabel, MESSAGE_MAX, messageProblem, otherMember, seenLabel, shareHref, type Message, type ShareCard } from '../../lib/messages';
import { photoUri } from '../../lib/photos';
import { useStore } from '../../lib/store';
import { BRAND, C, F, RADIUS, TYPE } from '../../theme';

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
      setError(e instanceof Error ? e.message : 'Could not send that.');
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
    nav.setOptions({
      title,
      // Handles are never upper-cased.
      headerTitleStyle: { fontFamily: F.display, fontSize: 17, textTransform: 'none' },
      headerRight: () =>
        conv.kind === 'group' ? (
          <HeaderAction label="Info" accessibilityLabel="Group info" onPress={() => router.push({ pathname: '/chat/info', params: { id } })} />
        ) : (
          <HeaderAction
            label="···"
            accessibilityLabel="Chat options"
            onPress={() =>
              setMenu([
                ...(other ? [{ label: `View @${handleOf(other) ?? 'profile'}`, onPress: () => router.push({ pathname: '/user/[id]', params: { id: other } }) }] : []),
                ...(other ? [{ label: 'Report this person', onPress: () => openReport('profile', other, other, 'profile') }] : []),
                ...(other ? [{ label: 'Block', danger: true, onPress: () => openReport('block', other, other) }] : []),
                { label: 'Delete chat', danger: true, onPress: () => community.run((s) => s.leave(id)).then(() => router.back()).catch((e) => setError(e instanceof Error ? e.message : 'Could not delete it.')) },
              ])
            }
          />
        ),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nav, conv?.id, conv?.name, conv?.memberIds.length, other, users.length]);

  if (flow.view) return <View style={{ flex: 1, backgroundColor: C.asphalt, padding: 16 }}>{flow.view}</View>;
  if (!conv) {
    if (!q.data || q.loading) return <View style={{ flex: 1, backgroundColor: C.asphalt }} />;
    return <NotFound what="Chat" message="You're not in this chat any more." />;
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

  const renderItem = ({ item: m, index }: { item: Message; index: number }) => {
    const older = rows[index + 1];
    const newDay = !older || dayLabel(older.createdAt, now) !== dayLabel(m.createdAt, now);
    const mine = m.senderId === community.me;
    const showName = conv.kind === 'group' && !mine && m.senderId && (!older || older.senderId !== m.senderId || newDay);
    return (
      <View style={{ gap: 6 }}>
        {newDay ? <Txt v="micro" style={{ textAlign: 'center', marginTop: 8 }}>{dayLabel(m.createdAt, now)}</Txt> : null}
        {m.system ? (
          <Txt v="caption" style={{ textAlign: 'center' }}>{m.body}</Txt>
        ) : (
          <Pressable
            onLongPress={() => {
              const opts = messageMenu(m);
              if (opts.length) setMenu(opts);
            }}
            accessibilityHint={mine ? undefined : 'Long press to report or block'}
            style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '82%', gap: 3 }}
          >
            {showName ? (
              <Pressable onPress={() => router.push({ pathname: '/user/[id]', params: { id: m.senderId! } })} accessibilityRole="link">
                <Txt v="caption" style={{ color: BRAND }}>@{handleOf(m.senderId!) ?? 'someone'}</Txt>
              </Pressable>
            ) : null}
            <View
              style={{ backgroundColor: mine ? BRAND : C.kerb, borderRadius: RADIUS.sheet, borderBottomRightRadius: mine ? 4 : RADIUS.sheet, borderBottomLeftRadius: mine ? RADIUS.sheet : 4, padding: m.photo ? 4 : 10, gap: 6 }}
              accessibilityLabel={`${mine ? 'You' : `@${handleOf(m.senderId ?? '') ?? 'someone'}`}: ${m.photo ? 'photo. ' : ''}${m.share ? `shared ${m.share.title}. ` : ''}${m.body}`}
            >
              {m.photo ? (
                <Image source={{ uri: photoUri(m.photo) }} style={{ width: 220, height: 220, borderRadius: RADIUS.card, backgroundColor: C.tarmac }} accessibilityIgnoresInvertColors />
              ) : null}
              {m.share ? <ShareCardView card={m.share} mine={mine} onPress={() => router.push(shareHref(m.share!) as never)} /> : null}
              {m.body ? <Txt selectable style={{ color: mine ? C.ink : C.chalk }}>{m.body}</Txt> : null}
            </View>
            <Row gap={6} style={{ alignSelf: mine ? 'flex-end' : 'flex-start' }}>
              <Txt v="micro">{formatTime(m.createdAt)}</Txt>
              {m.sample ? <SampleTag /> : null}
            </Row>
          </Pressable>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.asphalt }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <FlatList
        ref={list}
        data={rows}
        inverted
        keyExtractor={(m) => m.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        ListHeaderComponent={seen ? <Txt v="caption" style={{ textAlign: 'right' }} accessibilityLiveRegion="polite">{seen}</Txt> : undefined}
        ListEmptyComponent={
          <Txt v="muted" style={{ textAlign: 'center', transform: [{ scaleY: -1 }] }}>
            {conv.kind === 'group' ? 'Say hello to the group.' : 'Say hello.'}
          </Txt>
        }
        keyboardShouldPersistTaps="handled"
      />
      <View style={{ padding: 12, paddingBottom: 28, gap: 8, borderTopWidth: 1, borderTopColor: C.kerb, backgroundColor: C.asphalt }}>
        <InlineError message={error} />
        {conv.canSend ? (
          <Row style={{ flexWrap: 'nowrap', alignItems: 'flex-end' }}>
            <Pressable
              onPress={() =>
                setMenu([
                  { label: 'Take a photo', onPress: () => void flow.pick(true) },
                  { label: 'Choose a photo', onPress: () => void flow.pick(false) },
                  { label: 'Share a build, event or place', onPress: () => setSharing(true) },
                ])
              }
              accessibilityRole="button"
              accessibilityLabel="Add a photo or share something"
              style={({ pressed }) => [{ width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: C.kerbHi, alignItems: 'center', justifyContent: 'center' }, pressed && { opacity: 0.8 }]}
            >
              <Txt style={{ color: BRAND, fontFamily: F.display, fontSize: TYPE.title }}>+</Txt>
            </Pressable>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Message"
              placeholderTextColor={C.fog}
              multiline
              maxLength={MESSAGE_MAX}
              accessibilityLabel="Message"
              style={[ui.input, { flex: 1, maxHeight: 120, paddingVertical: 10 }]}
            />
            <Button label="Send" size="sm" onPress={() => void send({ body: text })} busy={busy} disabled={!text.trim()} />
          </Row>
        ) : (
          <Notice>
            {conv.kind === 'direct'
              ? "You're no longer connected, so you can't send messages here. Connect again to carry on."
              : "You're not in this group any more."}
          </Notice>
        )}
      </View>
      <SharePicker visible={sharing} onPick={(c) => void send({ body: '', share: c })} onClose={() => setSharing(false)} />
      <OptionsSheet visible={!!menu} options={menu ?? []} onClose={() => setMenu(null)} />
    </KeyboardAvoidingView>
  );
}
