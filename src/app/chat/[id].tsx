import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { FlatList, Keyboard, KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from 'react-native';
import { at, mainBuild, openProfile, openReport, OptionsSheet, PersonRow, personMark, type SheetOption } from '../../components/Community';
import { ownBuilds } from '../../lib/bringing';
import { INPUT } from '../../components/ComposerParts';
import { ActionBar, Avatar, Button, DsText, ErrorState, FitImage, HeaderActions, IconButton, LoadingState, Press, screenHeader, useToast } from '../../components/ds';
import { usePhotoFlow } from '../../components/PhotoFlow';
import { ShareCardView, SharePicker } from '../../components/SharePicker';
import { useNow } from '../../lib/clock';
import { useCommunity, useCommunityQuery } from '../../lib/communityStore';
import { clock, dayLabelShort } from '../../lib/when';
import { QUICK_REPLIES, showQuickReplies } from '../../lib/quickReplies';
import { chipFace } from '../../components/ds/Choice';
import { conversationTitle, MESSAGE_MAX, messageProblem, otherMember, seenLabel, shareHref, type Message, type ShareCard } from '../../lib/messages';
import { photoUri } from '../../lib/photos';
import { useStore } from '../../lib/store';
import { COLOR, RADII, SPACING } from '../../theme';
import { NotFoundState } from '../../components/Detail';
import { PhotoViewer } from '../../components/PhotoGallery';
import { StackTabBar } from '../../components/StackTabBar';
import { MEDIA_LIMITS } from '../../lib/mediaLimits';

const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** The toast's height and its gap above the composer, at 1.3x text too. */
const TOAST_ROOM = 76;

/** One chat: messages, photos (plate-blurred), shared cards, "Seen". Only between connected people. */
export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const nav = useNavigation();
  const { users, builds, backend } = useStore();
  const demo = backend === 'local';
  const community = useCommunity();
  const toast = useToast();
  const now = useNow();
  const q = useCommunityQuery((s) => s.messages(id), [id]);
  const conv = community.conversations.find((c) => c.id === id);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  // The tab bar steps aside while the phone's keyboard is up (not on web: no layout jump under a tap).
  const [typing, setTyping] = useState(false);
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const show = Keyboard.addListener('keyboardDidShow', () => setTyping(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setTyping(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  const [menu, setMenu] = useState<SheetOption[] | null>(null);
  /** While the "Sent" toast shows, the newest message sits above it, never under it (Review 14). */
  const [toastRoom, setToastRoom] = useState(false);
  const roomTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (roomTimer.current) clearTimeout(roomTimer.current);
  }, []);
  const list = useRef<FlatList<{ key: string; msgs: Message[] }>>(null);
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
      // Every done action gets a toast (4.7): "sent" is on the list.
      toast({ message: m.photo ? 'Photo sent' : m.share ? 'Shared' : 'Sent' });
      setToastRoom(true);
      if (roomTimer.current) clearTimeout(roomTimer.current);
      roomTimer.current = setTimeout(() => setToastRoom(false), 3600);
      list.current?.scrollToOffset({ offset: 0, animated: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't send that.");
    } finally {
      setBusy(false);
    }
  };
  // Photos picked together are checked one by one, then sent together: one message each, shown as one grid.
  const batch = useRef<string[]>([]);
  const sendPhotos = async () => {
    const refs = batch.current;
    batch.current = [];
    if (!refs.length) return;
    setError(null);
    setBusy(true);
    let sent = 0;
    try {
      for (const ref of refs) {
        await community.run((s) => s.send(id, { body: '', photo: ref }));
        sent += 1;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't send that.");
    } finally {
      setBusy(false);
    }
    if (!sent) return;
    toast({ message: sent === 1 ? 'Photo sent' : `${sent} photos sent` });
    setToastRoom(true);
    if (roomTimer.current) clearTimeout(roomTimer.current);
    roomTimer.current = setTimeout(() => setToastRoom(false), 3600);
    list.current?.scrollToOffset({ offset: 0, animated: true });
  };
  const flow = usePhotoFlow({ onError: setError, onPhoto: (ref) => void batch.current.push(ref), onFinish: () => void sendPhotos() });
  const [viewing, setViewing] = useState<{ photos: string[]; start: number } | null>(null);

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
    // 4.1 and K3 (Review 15): a group chat is titled with its name in caps, like any titled screen.
    // A 1-to-1 chat has no header title: the person shows as a person row (avatar, @handle, their
    // build) pinned at the top of the thread, never a bare "@handle" title.
    nav.setOptions({ ...screenHeader({ title: conv.kind === 'group' ? title : '' }), headerRight: () => <HeaderActions onMenu={() => setMenu(options)} /> });
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

  // The demo runs on its own Friday-night clock (demoTime.ts): its day says so, so a 21:13 stamp
  // at lunchtime makes sense (Review 19 #36).
  const dayLine = (d: string) => {
    const label = dayLabelShort(d, now);
    return demo && label === 'Today' ? `Demo · ${WEEKDAY_SHORT[new Date(d).getDay()]}` : label;
  };

  /** Messages from one person within 10 minutes run together: one name, one time under the last. */
  const sameRun = (a?: Message, b?: Message) =>
    !!a && !!b && !a.system && !b.system && a.senderId === b.senderId && Math.abs(new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) < 10 * 60_000 && dayLabelShort(a.createdAt, now) === dayLabelShort(b.createdAt, now);

  /** Photos on their own sent together (one message each) show as one grid bubble. */
  const photoOnly = (m: Message) => !!m.photo && !m.body && !m.share && !m.system;
  const items: { key: string; msgs: Message[] }[] = [];
  for (const m of rows) {
    const last = items[items.length - 1];
    if (last && photoOnly(m) && photoOnly(last.msgs[0]) && sameRun(m, last.msgs[0]) && last.msgs.length < MEDIA_LIMITS.chatPhotos) last.msgs.unshift(m);
    else items.push({ key: m.id, msgs: [m] });
  }

  const renderItem = ({ item, index }: { item: { key: string; msgs: Message[] }; index: number }) => {
    const group = item.msgs;
    const m = group[group.length - 1];
    const oldest = group[0];
    const older = items[index + 1]?.msgs[items[index + 1].msgs.length - 1];
    const newer = items[index - 1]?.msgs[0];
    const newDay = !older || dayLabelShort(older.createdAt, now) !== dayLabelShort(oldest.createdAt, now);
    const mine = m.senderId === community.me;
    const firstOfRun = !sameRun(older, oldest);
    const lastOfRun = !sameRun(m, newer);
    const sender = m.senderId ? users.find((u) => u.id === m.senderId) : undefined;
    const showName = conv.kind === 'group' && !mine && !!m.senderId && firstOfRun;
    const side = mine ? 'flex-end' : 'flex-start';
    return (
      <View style={{ gap: SPACING.xs, marginTop: firstOfRun ? SPACING.sm : 0 }}>
        {newDay ? (
          <DsText v="label" style={{ textAlign: 'center', marginVertical: SPACING.sm }}>
            {dayLine(m.createdAt)}
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
            label={`${mine ? 'You' : at(sender)}, ${clock(m.createdAt)}: ${group.length > 1 ? `${group.length} photos. ` : m.photo ? 'photo. ' : ''}${m.share ? `shared ${m.share.title}. ` : ''}${m.body}`}
            hint={mine ? undefined : 'Long press to report or block'}
            style={{ alignSelf: side, maxWidth: '82%', gap: SPACING.xs, alignItems: side }}
          >
            {showName ? (
              <Press onPress={() => openProfile(m.senderId!)} role="link" label={`${at(sender)}'s profile`} style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
                <Avatar {...personMark(sender)} size="sm" />
                <DsText v="secondary">{at(sender)}</DsText>
              </Press>
            ) : null}
            {group.length > 1 ? (
              <PhotoGrid
                photos={group.map((g) => g.photo!)}
                onOpen={(i) => setViewing({ photos: group.map((g) => g.photo!), start: i })}
                onLongPress={(i) => {
                  const opts = messageMenu(group[i]);
                  if (opts.length) setMenu(opts);
                }}
              />
            ) : m.photo ? (
              <Press onPress={() => setViewing({ photos: [m.photo!], start: 0 })} feedback="card" label="Open the photo">
                <FitImage source={photoUri(m.photo)} frameAspect={1} style={{ width: 220, height: 220, borderRadius: RADII.card, backgroundColor: COLOR.surface.media }} accessibilityLabel="Photo" />
              </Press>
            ) : null}
            {m.share ? <ShareCardView card={m.share} onPress={() => router.push(shareHref(m.share!) as never)} /> : null}
            {m.body ? (
              <View
                style={{
                  // Yours in the design system's own-bubble blue, theirs on the raised grey: told apart by
                  // colour as well as side (REVIEW-7 #15; REVIEW-8 and REVIEW-10: the tints read as grey).
                  backgroundColor: mine ? COLOR.chat.own : COLOR.chat.theirs,
                  borderWidth: 1,
                  borderColor: mine ? COLOR.chat.ownBorder : COLOR.chat.theirsBorder,
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
            {lastOfRun ? <DsText v="meta">{clock(m.createdAt)}</DsText> : null}
          </Press>
        )}
      </View>
    );
  };

  const person = conv.kind === 'direct' && other ? users.find((u) => u.id === other) : undefined;
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: COLOR.surface.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      {person ? (
        <View style={{ paddingHorizontal: SPACING.screen, borderBottomWidth: 1, borderBottomColor: COLOR.surface.raisedHi }}>
          <PersonRow user={person} build={mainBuild(ownBuilds(person.id, builds))} onPress={() => openProfile(person.id)} />
        </View>
      ) : null}
      <FlatList
        ref={list}
        data={items}
        inverted
        keyExtractor={(it) => it.key}
        renderItem={renderItem}
        contentContainerStyle={{ padding: SPACING.screen, gap: SPACING.xs }}
        ListHeaderComponent={
          seen || toastRoom ? (
            // Inverted: the header is the bottom of the chat, and its top padding shows under it.
            <View style={{ paddingTop: toastRoom ? TOAST_ROOM : 0 }}>
              {seen ? (
                <DsText v="meta" style={{ textAlign: 'right' }} accessibilityLiveRegion="polite">
                  {seen}
                </DsText>
              ) : null}
            </View>
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
      {/* The composer is the ActionBar (as on post and thread pages), so the "Sent" toast sits above it, never over Send. */}
      {/* The tab bar stays under the composer (Review 19 #35), out of the way while you type. */}
      <ActionBar footer={typing ? undefined : <StackTabBar />}>
        {error ? <ErrorState title={error} /> : null}
        {showQuickReplies(text, conv.canSend) ? (
          // One calm row of one-tap replies: gone as soon as you type.
          <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: SPACING.sm }} style={{ flexGrow: 0 }}>
            {QUICK_REPLIES.map((r) => (
              <Press key={r} onPress={() => void send({ body: r })} role="button" label={`Send: ${r}`} haptic="select" disabled={busy} style={{ minHeight: 34, justifyContent: 'center', paddingHorizontal: SPACING.md, ...chipFace(false) }}>
                <DsText v="body">{r}</DsText>
              </Press>
            ))}
          </ScrollView>
        ) : null}
        {conv.canSend ? (
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: SPACING.sm }}>
            <IconButton
              icon="camera"
              label="Add a photo or share something"
              onPress={() =>
                setMenu([
                  { label: 'Take a photo', onPress: () => void flow.pick(true) },
                  { label: 'Choose photos', detail: `Up to ${MEDIA_LIMITS.chatPhotos} at once`, onPress: () => void flow.pick(false, MEDIA_LIMITS.chatPhotos) },
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
            <Button label="Send" size="md" haptic="success" onPress={() => void send({ body: text })} busy={busy} />
          </View>
        ) : (
          <DsText v="secondary" style={{ textAlign: 'center' }}>
            {conv.kind === 'direct'
              ? "You're no longer connected, so you can't send messages here. Connect again to carry on."
              : "You're not in this group any more."}
          </DsText>
        )}
      </ActionBar>
      <SharePicker visible={sharing} onPick={(c) => void send({ body: '', share: c })} onClose={() => setSharing(false)} />
      <OptionsSheet visible={!!menu} options={menu ?? []} onClose={() => setMenu(null)} />
      <PhotoViewer photos={viewing?.photos ?? []} start={viewing?.start ?? null} onClose={() => setViewing(null)} />
    </KeyboardAvoidingView>
  );
}

/** Several photos in one bubble: 2 across for 2 or 4, else 3 across; tap opens them, long press reports that one. */
function PhotoGrid({ photos, onOpen, onLongPress }: { photos: string[]; onOpen: (i: number) => void; onLongPress: (i: number) => void }) {
  const cols = photos.length === 2 || photos.length === 4 ? 2 : 3;
  const gap = SPACING.xxs;
  const cell = (220 - gap * (cols - 1)) / cols;
  return (
    <View style={{ width: 220, flexDirection: 'row', flexWrap: 'wrap', gap, borderRadius: RADII.card, overflow: 'hidden' }}>
      {photos.map((p, i) => (
        <Press key={p} onPress={() => onOpen(i)} onLongPress={() => onLongPress(i)} feedback="card" label={`Open photo ${i + 1} of ${photos.length}`}>
          <FitImage fit="cover" source={photoUri(p)} frameAspect={1} style={{ width: cell, height: cell, backgroundColor: COLOR.surface.media }} />
        </Press>
      ))}
    </View>
  );
}
