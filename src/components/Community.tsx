import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { distanceLabel, type PersonCard as Card_ } from '../lib/carsNear';
import { classOf, effectivePower } from '../lib/classes';
import { connectLabel, type ConnectionState } from '../lib/connections';
import { boardLabel, type ForumThread } from '../lib/forum';
import { plural, shortAgo } from '../lib/format';
import { conversationTitle, previewLine, type Conversation } from '../lib/messages';
import { photoUri } from '../lib/photos';
import { VISIBILITY, type Post } from '../lib/posts';
import type { Build, User } from '../lib/types';
import { BRAND, C, F, FONT_SCALE, RADIUS, STATE, SURFACE, TYPE } from '../theme';
import { BuildArt } from './BuildArt';
import { Pin } from './Pin';
import { LevelTag } from './Rep';
import { ClassBadge, Row, SampleTag, Tag, Txt } from './ui';

/** A person's mark: their initial in a hexagon-cut tile (no faces, no photos of people). */
export function Avatar({ user, size = 40 }: { user?: Pick<User, 'handle'> | null; size?: number }) {
  const letter = (user?.handle ?? '?').replace(/^@/, '').charAt(0).toUpperCase() || '?';
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: size, height: size, borderRadius: size / 4, borderWidth: 1.5, borderColor: BRAND, backgroundColor: C.kerb, alignItems: 'center', justifyContent: 'center', transform: [{ skewX: '-6deg' }] }}
    >
      <Text allowFontScaling={false} style={{ fontFamily: F.display, color: BRAND, fontSize: size * 0.45 }}>{letter}</Text>
    </View>
  );
}

/** A build's cover photo, or its silhouette. */
export function BuildThumb({ build, height }: { build: Build; height: number }) {
  if (build.photos[0]) {
    return (
      <Image
        source={{ uri: photoUri(build.photos[0]) }}
        style={{ height, borderRadius: RADIUS.card, backgroundColor: C.kerb }}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
        accessibilityLabel={`${build.make} ${build.model}`}
      />
    );
  }
  return <BuildArt kind={build.kind} colour={build.colour} height={height} />;
}

/** Make, model, class, bhp and mods in one line. */
export function BuildLine({ build, onPress }: { build: Build; onPress?: () => void }) {
  const body = (
    <Row gap={10} style={{ flexWrap: 'nowrap' }}>
      <ClassBadge letter={classOf(build)} size="sm" />
      <View style={{ flex: 1 }}>
        <Txt numberOfLines={1}>{build.make} {build.model}</Txt>
        <Txt v="mono" numberOfLines={1}>{Math.round(effectivePower(build))} BHP · {plural(build.mods.length, 'MOD', 'MODS')}</Txt>
      </View>
      {onPress ? <Txt v="label" style={{ color: BRAND }}>›</Txt> : null}
    </Row>
  );
  if (!onPress) return <View style={st.buildLine}>{body}</View>;
  return (
    <Pressable onPress={onPress} accessibilityRole="link" accessibilityLabel={`Open ${build.make} ${build.model}`} style={({ pressed }) => [st.buildLine, pressed && { opacity: 0.8 }]}>
      {body}
    </Pressable>
  );
}

export function connectTone(state: ConnectionState): 'success' | 'warning' | 'info' | 'muted' {
  return state === 'connected' ? 'success' : state === 'outgoing' ? 'warning' : state === 'incoming' ? 'info' : 'muted';
}

/** People › Cars near you: the build up top, then the person. Tapping opens their profile. */
export function PersonCard({ card, level, state, sample }: { card: Card_; level: number; state: ConnectionState; sample?: boolean }) {
  const b = card.lead;
  const more = card.builds.length - 1;
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/user/[id]', params: { id: card.user.id } })}
      accessibilityRole="button"
      accessibilityLabel={`@${card.user.handle}${b ? `, ${b.make} ${b.model}, class ${classOf(b)}` : ''}, ${distanceLabel(card.miles)}`}
      style={({ pressed }) => [st.card, pressed && { opacity: 0.85 }]}
    >
      {b ? (
        <View>
          <BuildThumb build={b} height={150} />
          <View style={st.stamp}>
            <ClassBadge letter={classOf(b)} size="md" />
          </View>
          <View style={st.distance}>
            <Text maxFontSizeMultiplier={FONT_SCALE.chrome} style={st.distanceText}>{distanceLabel(card.miles)}</Text>
          </View>
        </View>
      ) : null}
      <View style={{ padding: 12, gap: 6 }}>
        <Row style={{ flexWrap: 'nowrap' }} gap={10}>
          <Avatar user={card.user} size={34} />
          <View style={{ flex: 1 }}>
            <Row gap={6}>
              <Txt v="h3" style={{ textTransform: 'none' }} numberOfLines={1}>@{card.user.handle}</Txt>
              <LevelTag level={level} />
              {sample ? <SampleTag /> : null}
            </Row>
            {!b ? <Txt v="caption">{distanceLabel(card.miles)} · no builds yet</Txt> : null}
          </View>
          {state !== 'none' ? <Tag label={state === 'incoming' ? 'Wants to connect' : connectLabel(state)} tone={connectTone(state)} /> : null}
        </Row>
        {b ? (
          <>
            <Txt numberOfLines={1}>{b.make} {b.model}{b.nickname ? ` "${b.nickname}"` : ''}</Txt>
            <Txt v="mono">
              {Math.round(effectivePower(b))} BHP · {plural(b.mods.length, 'MOD', 'MODS')}{more > 0 ? ` · +${more} MORE` : ''}
            </Txt>
          </>
        ) : null}
      </View>
    </Pressable>
  );
}

/** A feed post: who, when, words, photos, place, linked build, and Like / Comment. */
export function PostCard({
  post,
  author,
  build,
  now,
  onLike,
  onOpen,
  onMore,
  full,
}: {
  post: Post;
  author?: User;
  build?: Build;
  now: Date;
  onLike: () => void;
  onOpen?: () => void;
  onMore?: () => void;
  /** On the post's own page: no tap-through. */
  full?: boolean;
}) {
  const head = (
    <Row style={{ flexWrap: 'nowrap' }} gap={10}>
      <Pressable onPress={() => author && router.push({ pathname: '/user/[id]', params: { id: author.id } })} accessibilityRole="link" accessibilityLabel={`@${author?.handle ?? 'someone'}'s profile`} hitSlop={4}>
        <Avatar user={author} size={36} />
      </Pressable>
      <View style={{ flex: 1 }}>
        <Row gap={6}>
          <Txt style={{ fontFamily: F.bodyBold }} numberOfLines={1}>@{author?.handle ?? 'someone'}</Txt>
          {post.sample ? <SampleTag /> : null}
          {post.visibility === 'connections' ? <Tag label={VISIBILITY.connections.label} tone="info" /> : null}
        </Row>
        <Txt v="caption">{shortAgo(post.createdAt, now)}{post.placeName ? ` · ${post.placeName}` : post.at ? ' · on the map' : ''}</Txt>
      </View>
      {onMore ? (
        <Pressable onPress={onMore} accessibilityRole="button" accessibilityLabel="More options for this post" hitSlop={12} style={st.more}>
          <Txt v="h3" style={{ color: C.fog }}>···</Txt>
        </Pressable>
      ) : null}
    </Row>
  );
  const content = (
    <>
      {post.hidden ? <Txt v="caption" style={{ color: STATE.warning }}>Hidden while it's checked after reports. Only you can see it.</Txt> : null}
      {post.body ? <Txt numberOfLines={full ? undefined : 8}>{post.body}</Txt> : null}
      {post.photos.length ? (
        <View>
          <Image source={{ uri: photoUri(post.photos[0]) }} style={st.photo} resizeMode="cover" accessibilityLabel="Photo in the post" accessibilityIgnoresInvertColors />
          {post.photos.length > 1 && !full ? <Tag label={`+${post.photos.length - 1} photos`} tone="muted" solid /> : null}
          {full
            ? post.photos.slice(1).map((p) => <Image key={p} source={{ uri: photoUri(p) }} style={[st.photo, { marginTop: 8 }]} resizeMode="cover" accessibilityLabel="Photo in the post" accessibilityIgnoresInvertColors />)
            : null}
        </View>
      ) : null}
      {build ? <BuildLine build={build} onPress={() => router.push({ pathname: '/build/[id]', params: { id: build.id } })} /> : null}
    </>
  );
  return (
    <View style={st.card}>
      <View style={{ padding: 12, gap: 10 }}>
        {head}
        {onOpen && !full ? (
          <Pressable onPress={onOpen} accessibilityRole="button" accessibilityLabel="Open the post" style={({ pressed }) => [{ gap: 10 }, pressed && { opacity: 0.85 }]}>
            {content}
          </Pressable>
        ) : (
          content
        )}
        <Row gap={18}>
          <Pressable onPress={onLike} accessibilityRole="button" accessibilityState={{ selected: post.likedByMe }} accessibilityLabel={`${post.likedByMe ? 'Unlike' : 'Like'}, ${plural(post.likeCount, 'like')}`} hitSlop={10} style={st.action}>
            <Txt v="label" scale="chrome" style={{ color: post.likedByMe ? BRAND : C.fog, fontSize: TYPE.caption }}>{post.likedByMe ? '♥' : '♡'} {post.likeCount}</Txt>
          </Pressable>
          {onOpen && !full ? (
            <Pressable onPress={onOpen} accessibilityRole="button" accessibilityLabel={`Comments, ${post.commentCount}`} hitSlop={10} style={st.action}>
              <Txt v="label" scale="chrome" style={{ color: C.fog, fontSize: TYPE.caption }}>Comments {post.commentCount}</Txt>
            </Pressable>
          ) : null}
        </Row>
      </View>
    </View>
  );
}

/** A thread in the forum list. */
export function ThreadRow({ thread, author, now, showBoard }: { thread: ForumThread; author?: User; now: Date; showBoard?: boolean }) {
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/forum/[id]', params: { id: thread.id } })}
      accessibilityRole="button"
      accessibilityLabel={`${thread.title}, ${plural(thread.replyCount, 'reply', 'replies')}${thread.solvedReplyId ? ', solved' : ''}`}
      style={({ pressed }) => [st.thread, pressed && { opacity: 0.85 }]}
    >
      <Row gap={6}>
        {thread.solvedReplyId ? <Tag label="Solved" tone="success" /> : null}
        {showBoard ? <Tag label={boardLabel(thread.board)} tone="muted" /> : null}
        {thread.region ? <Tag label={thread.region} tone="muted" /> : null}
        {thread.sample ? <SampleTag /> : null}
        {thread.hidden ? <Tag label="Hidden" tone="warning" /> : null}
      </Row>
      <Txt v="h3" style={{ textTransform: 'none', fontFamily: F.bodyBold, fontSize: TYPE.body }} numberOfLines={2}>{thread.title}</Txt>
      <Txt v="caption" numberOfLines={1}>
        @{author?.handle ?? 'someone'} · {plural(thread.replyCount, 'reply', 'replies')} · {shortAgo(thread.lastActivityAt, now)}
        {thread.photos.length ? ' · photos' : ''}
      </Txt>
    </Pressable>
  );
}

/** A conversation in Messages. */
export function ConversationRow({ c, me, users, now }: { c: Conversation; me: string; users: User[]; now: Date }) {
  const handleOf = (id: string) => users.find((u) => u.id === id)?.handle;
  const title = conversationTitle(c, me, handleOf);
  const other = c.kind === 'direct' ? users.find((u) => c.memberIds.includes(u.id) && u.id !== me) : undefined;
  const unread = c.unread > 0;
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/chat/[id]', params: { id: c.id } })}
      accessibilityRole="button"
      accessibilityLabel={`${title}${unread ? `, ${c.unread} unread` : ''}`}
      style={({ pressed }) => [st.conv, pressed && { opacity: 0.85 }]}
    >
      {c.kind === 'group' ? (
        <View style={st.groupMark}>
          <Pin glyph="community" colour={BRAND} size={30} />
        </View>
      ) : (
        <Avatar user={other} size={42} />
      )}
      <View style={{ flex: 1, gap: 2 }}>
        <Row gap={6} style={{ flexWrap: 'nowrap' }}>
          <Txt style={{ fontFamily: unread ? F.bodyBold : F.bodyMed, flexShrink: 1 }} numberOfLines={1}>{title}</Txt>
          {c.kind === 'group' ? <Txt v="caption">{c.memberIds.length}</Txt> : null}
          {c.sample ? <SampleTag /> : null}
        </Row>
        <Txt v="muted" numberOfLines={1} style={unread ? { color: C.chalk } : undefined}>{previewLine(c, me, handleOf)}</Txt>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <Txt v="caption">{shortAgo(c.lastMessageAt, now)}</Txt>
        {unread ? (
          <View style={st.unread} accessibilityLabel={`${c.unread} unread`}>
            <Text maxFontSizeMultiplier={FONT_SCALE.chrome} style={st.unreadText}>{c.unread > 99 ? '99+' : c.unread}</Text>
          </View>
        ) : !c.canSend ? (
          <Tag label="Read only" tone="muted" />
        ) : null}
      </View>
    </Pressable>
  );
}

export interface SheetOption {
  label: string;
  onPress: () => void;
  danger?: boolean;
}

/** A small menu from the bottom: Report, Block, Delete and so on. */
export function OptionsSheet({ visible, title, options, onClose }: { visible: boolean; title?: string; options: SheetOption[]; onClose: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={st.scrim} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close the menu">
        <Pressable style={st.sheet} onPress={() => {}} accessibilityViewIsModal>
          {title ? <Txt v="label" style={{ paddingHorizontal: 4, paddingBottom: 4 }}>{title}</Txt> : null}
          {options.map((o) => (
            <Pressable
              key={o.label}
              onPress={() => {
                onClose();
                o.onPress();
              }}
              accessibilityRole="button"
              style={({ pressed }) => [st.option, pressed && { backgroundColor: C.kerb }]}
            >
              <Txt style={{ color: o.danger ? STATE.danger : C.chalk, fontFamily: F.bodyMed }}>{o.label}</Txt>
            </Pressable>
          ))}
          <Pressable onPress={onClose} accessibilityRole="button" style={({ pressed }) => [st.option, { borderBottomWidth: 0 }, pressed && { backgroundColor: C.kerb }]}>
            <Txt style={{ color: C.fog }}>Close</Txt>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/** Keeps a menu's open/closed state next to the thing it's for. */
export function useSheet(): { open: boolean; show: () => void; hide: () => void } {
  const [open, setOpen] = useState(false);
  return { open, show: () => setOpen(true), hide: () => setOpen(false) };
}

/** Open the report screen for something. */
export function openReport(target: string, id: string, userId?: string, what?: string) {
  router.push({ pathname: '/report', params: { target, id, ...(userId ? { user: userId } : {}), ...(what ? { what } : {}) } });
}

/** A small count bubble for a header or row. */
export function CountBubble({ n, children }: { n: number; children?: ReactNode }) {
  if (n <= 0) return <>{children}</>;
  return (
    <View style={st.unread} accessibilityLabel={`${n} waiting`}>
      <Text maxFontSizeMultiplier={FONT_SCALE.chrome} style={st.unreadText}>{n > 99 ? '99+' : n}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  card: { backgroundColor: C.tarmac, borderColor: C.kerb, borderWidth: 1, borderRadius: RADIUS.card, overflow: 'hidden' },
  stamp: { position: 'absolute', left: 10, top: 10 },
  distance: { position: 'absolute', right: 10, bottom: 10, backgroundColor: SURFACE.glass, borderRadius: RADIUS.pill, paddingHorizontal: 10, paddingVertical: 4 },
  distanceText: { fontFamily: F.labelBold, fontSize: TYPE.label, letterSpacing: 1, color: C.chalk, textTransform: 'uppercase' },
  photo: { width: '100%', aspectRatio: 4 / 3, borderRadius: RADIUS.card, backgroundColor: C.kerb },
  buildLine: { backgroundColor: C.asphalt, borderRadius: RADIUS.card, borderWidth: 1, borderColor: C.kerb, padding: 10 },
  action: { minHeight: 32, justifyContent: 'center' },
  more: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  thread: { backgroundColor: C.tarmac, borderColor: C.kerb, borderWidth: 1, borderRadius: RADIUS.card, padding: 12, gap: 6 },
  conv: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64, paddingVertical: 8 },
  groupMark: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  unread: { minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6, backgroundColor: BRAND, alignItems: 'center', justifyContent: 'center' },
  unreadText: { color: C.ink, fontFamily: F.labelBold, fontSize: TYPE.label },
  scrim: { flex: 1, backgroundColor: SURFACE.scrim, justifyContent: 'flex-end' },
  sheet: { backgroundColor: SURFACE.glassRaised, borderTopLeftRadius: RADIUS.sheet, borderTopRightRadius: RADIUS.sheet, borderColor: C.kerbHi, borderWidth: 1, padding: 12, paddingBottom: 34, gap: 2 },
  option: { minHeight: 50, justifyContent: 'center', paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: C.kerb },
});

/** "Report this event" at the foot of a page (App Store 1.2: every kind of user content can be reported). */
export function ReportLink({ target, id, userId, what }: { target: string; id: string; userId?: string; what: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Pressable onPress={() => openReport(target, id, userId, what)} accessibilityRole="link" hitSlop={12} style={({ pressed }) => [{ minHeight: 44, justifyContent: 'center' }, pressed && { opacity: 0.7 }]}>
        <Txt v="label" style={{ color: C.fog, fontSize: TYPE.caption }}>Report this {what}</Txt>
      </Pressable>
    </View>
  );
}
