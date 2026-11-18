import { carShape } from '../lib/buildShape';
import { router } from 'expo-router';
import { useState } from 'react';
import { Image, View, useWindowDimensions } from 'react-native';
import { distanceLabel, type PersonCard as Card_ } from '../lib/carsNear';
import { classOf, effectivePower } from '../lib/classes';
import { connectLabel, type ConnectionState } from '../lib/connections';
import { boardLabel, listingFacts, priceLabel, type ForumThread } from '../lib/forum';
import { plural, shortAgo } from '../lib/format';
import { conversationTitle, previewLine, type Conversation } from '../lib/messages';
import { VISIBILITY, type Post } from '../lib/posts';
import type { Build, User } from '../lib/types';
import { COLOR, RADII, SPACING } from '../theme';
import { Avatar, BuildThumb, Button, ClassBadge, DsText, EntityCard, Icon, IconButton, ListRow, Press, Sheet, SheetOption, Tag, metaLine } from './ds';
import { photoSource } from '../lib/photoSource';
import { PhotoCredit } from './PhotoCredit';

/** A person's mark data for the DS Avatar: initials from their name, else their handle. */
export function personMark(u?: Pick<User, 'name' | 'handle'> | null): { name?: string | null; handle?: string | null } {
  return { name: u?.name, handle: u?.handle ?? '?' };
}

/** "@sam_p", or "@someone" for a person we can't see any more. */
export function at(u?: Pick<User, 'handle'> | null): string {
  return `@${u?.handle ?? 'someone'}`;
}

/** A build's facts, the same everywhere: "583 bhp · 4 mods". */
export function buildMeta(b: Build): string {
  return metaLine([`${Math.round(effectivePower(b))} bhp`, plural(b.mods.length, 'mod')]);
}

/** "Connect with people at a meet": the one way into connections, from every empty list of people or chats. */
export const MEET_ACTION = { label: 'Connect with people at a meet', onPress: () => router.navigate('/events') };

/** Open someone's profile. */
export function openProfile(id: string) {
  router.push({ pathname: '/user/[id]', params: { id } });
}

/** Open a build. */
export function openBuild(id: string) {
  router.push({ pathname: '/build/[id]', params: { id } });
}

/**
 * A build in a post, reply or list: thumbnail and class badge, "Make Model" as typed, and
 * "bhp · mods". Framed so it reads as something you can open.
 */
export function BuildRow({ build, onPress }: { build: Build; onPress?: () => void }) {
  const body = (
    <>
      <BuildThumb photo={build.photos[0] ? photoSource(build.photos[0]) : null} kind={build.kind} shape={carShape(build)} size={36} />
      <ClassBadge letter={classOf(build)} size="sm" decorative />
      <View style={{ flex: 1, gap: SPACING.xxs }}>
        <DsText v="body" numberOfLines={1}>
          {build.make} {build.model}
        </DsText>
        <DsText v="meta" numberOfLines={1}>
          {buildMeta(build)}
        </DsText>
      </View>
      {onPress ? <Icon name="chevron" size={18} colour={COLOR.text.secondary} /> : null}
    </>
  );
  const frame = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: SPACING.sm,
    padding: SPACING.sm,
    borderRadius: RADII.control,
    borderWidth: 1,
    borderColor: COLOR.surface.border,
    backgroundColor: COLOR.surface.bg,
  };
  if (!onPress) return <View style={frame}>{body}</View>;
  return (
    <Press onPress={onPress} label={`${build.make} ${build.model}, class ${classOf(build)}, ${buildMeta(build)}`} hint="Opens the build" style={frame}>
      {body}
    </Press>
  );
}

/** Width of one tile in a two-column grid on a screen-wide page. */
export function useTileWidth(): number {
  const { width } = useWindowDimensions();
  return Math.floor((Math.min(width, 600) - SPACING.screen * 2 - SPACING.md) / 2);
}

/**
 * A build in a garage grid: thumbnail with its class badge on the corner, then "Make Model"
 * and "bhp · mods". Used by your garage and by profiles.
 */
export function BuildTile({ build, width, trophies = 0, sample }: { build: Build; width: number; trophies?: number; sample?: boolean }) {
  const thumbHeight = Math.round((width * 3) / 4);
  return (
    <Press
      onPress={() => openBuild(build.id)}
      feedback="card"
      label={metaLine([`${build.make} ${build.model}`, `class ${classOf(build)}`, buildMeta(build), trophies ? plural(trophies, 'trophy', 'trophies') : null, sample ? 'Sample' : null])}
      style={{ width, gap: SPACING.xs }}
    >
      <View>
        <BuildThumb photo={build.photos[0] ? photoSource(build.photos[0]) : null} kind={build.kind} shape={carShape(build)} size={thumbHeight} />
        <View style={{ position: 'absolute', left: SPACING.sm, top: SPACING.sm }}>
          <ClassBadge letter={classOf(build)} size="sm" decorative />
        </View>
        {sample ? (
          <View style={{ position: 'absolute', right: SPACING.sm, top: SPACING.sm, backgroundColor: COLOR.surface.glass, borderRadius: RADII.tag }}>
            <Tag label="Sample" />
          </View>
        ) : null}
        <PhotoCredit photoRef={build.photos[0]} kind={build.kind} overlay link={false} />
      </View>
      <DsText v="bodyStrong" numberOfLines={2}>
        {build.make} {build.model}
      </DsText>
      <DsText v="meta" numberOfLines={1}>
        {metaLine([buildMeta(build), trophies ? plural(trophies, 'trophy', 'trophies') : null])}
      </DsText>
    </Press>
  );
}

/** A two-column grid of build tiles; one build gets the full width (REVIEW-8: a half-width card with an empty half). */
export function BuildGrid({ builds, trophiesOf, sampleId }: { builds: Build[]; trophiesOf?: (id: string) => number; sampleId?: (b: Build) => boolean }) {
  const half = useTileWidth();
  const w = builds.length === 1 ? half * 2 + SPACING.md : half;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md }}>
      {builds.map((b) => (
        <BuildTile key={b.id} build={b} width={w} trophies={trophiesOf?.(b.id) ?? 0} sample={sampleId?.(b)} />
      ))}
    </View>
  );
}

/** How a connection state reads next to a person. */
export function connectWord(state: ConnectionState): string | null {
  return state === 'none' ? null : state === 'incoming' ? 'Wants to connect' : connectLabel(state);
}

/**
 * People › near you: one compact row per person. Avatar and handle lead; their best build
 * (thumbnail and class) sits on the right. Tapping opens their profile.
 */
export function PersonNearRow({ card, level, state, sample }: { card: Card_; level: number; state: ConnectionState; sample?: boolean }) {
  const b = card.lead;
  const more = card.builds.length - 1;
  return (
    <ListRow
      leading={{ avatar: personMark(card.user) }}
      title={at(card.user)}
      subtitle={b ? `${b.make} ${b.model}${more > 0 ? ` +${more} more` : ''}` : 'No car or bike yet'}
      meta={metaLine([`Level ${level}`, distanceLabel(card.miles), connectWord(state)])}
      trailing={
        b ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
            <ClassBadge letter={classOf(b)} size="sm" decorative />
            <BuildThumb photo={b.photos[0] ? photoSource(b.photos[0]) : null} kind={b.kind} shape={carShape(b)} size={36} />
          </View>
        ) : undefined
      }
      chevron={false}
      onPress={() => openProfile(card.user.id)}
      accessibilityLabel={metaLine([at(card.user), b ? `${b.make} ${b.model}, class ${classOf(b)}` : 'no car or bike yet', `level ${level}`, distanceLabel(card.miles), connectWord(state), sample ? 'Sample' : null])}
    />
  );
}

/** A feed post: who and when, the words, photos, place, linked build, then Like and Comments. */
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
  /** On the post's own page: no tap-through, every photo. */
  full?: boolean;
}) {
  const open = onOpen && !full ? onOpen : undefined;
  const photos = full ? post.photos : post.photos.slice(0, 1);
  const [broken, setBroken] = useState<Set<string>>(() => new Set());
  const content = (
    <View style={{ gap: SPACING.sm }}>
      {post.hidden ? (
        <DsText v="caption" tone="warning">
          Hidden while it's checked after reports. Only you can see it.
        </DsText>
      ) : null}
      {post.body ? (
        <DsText v="body" numberOfLines={full ? undefined : 8} selectable={full}>
          {post.body}
        </DsText>
      ) : null}
      {photos.filter((p) => !broken.has(p)).map((p, i) => (
        <View key={p}>
          {/* A photo that can't load (an old web preview link, a file that's gone) drops out instead of leaving a blank frame. */}
          <Image
            source={photoSource(p)}
            onError={() => setBroken((b) => new Set(b).add(p))}
            style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: RADII.control, backgroundColor: COLOR.surface.media }}
            resizeMode="cover"
            accessibilityLabel="Photo in the post"
            accessibilityIgnoresInvertColors
          />
          <PhotoCredit photoRef={p} overlay link={!!full} />
          {i === 0 && !full && post.photos.length > 1 ? (
            <View style={{ position: 'absolute', right: SPACING.sm, bottom: SPACING.sm, backgroundColor: COLOR.surface.glass, borderRadius: RADII.tag }}>
              <Tag label={`+${post.photos.length - 1} photos`} />
            </View>
          ) : null}
        </View>
      ))}
    </View>
  );
  return (
    <View style={{ backgroundColor: COLOR.surface.card, borderColor: COLOR.surface.border, borderWidth: 1, borderRadius: RADII.card, padding: SPACING.md, gap: SPACING.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
        <Press onPress={() => author && openProfile(author.id)} role="link" label={`${at(author)}'s profile`} style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flex: 1 }}>
          <Avatar {...personMark(author)} size="md" />
          <View style={{ flex: 1, gap: SPACING.xxs }}>
            <DsText v="bodyStrong" numberOfLines={1}>
              {at(author)}
            </DsText>
            <DsText v="meta" numberOfLines={1}>
              {metaLine([shortAgo(post.createdAt, now), post.placeName ? post.placeName : post.at ? 'On the map' : null])}
            </DsText>
          </View>
        </Press>
        {post.sample || post.visibility === 'connections' ? (
          <View style={{ flexDirection: 'row', gap: SPACING.xs }}>
            {post.sample ? <Tag label="Sample" /> : null}
            {post.visibility === 'connections' ? <Tag label={VISIBILITY.connections.label} tone="info" /> : null}
          </View>
        ) : null}
        {onMore ? <IconButton icon="more" label="More options for this post" onPress={onMore} colour={COLOR.text.secondary} /> : null}
      </View>
      {open ? (
        <Press onPress={open} label="Open the post" style={{ gap: SPACING.sm }}>
          {content}
        </Press>
      ) : (
        content
      )}
      {build ? <BuildRow build={build} onPress={() => openBuild(build.id)} /> : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.lg }}>
        <Press
          onPress={onLike}
          haptic="select"
          state={{ selected: post.likedByMe }}
          label={`${post.likedByMe ? 'Unlike' : 'Like'}, ${plural(post.likeCount, 'like')}`}
          hitSlop={8}
          style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, minHeight: 36 }}
        >
          <Icon name={post.likedByMe ? 'heartOn' : 'heart'} size={20} colour={post.likedByMe ? COLOR.action.selected : COLOR.text.secondary} />
          <DsText v="meta">{post.likeCount}</DsText>
        </Press>
        {open ? (
          <Press onPress={open} label={`Comments, ${post.commentCount}`} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, minHeight: 36 }}>
            <Icon name="comment" size={20} colour={COLOR.text.secondary} />
            <DsText v="meta">{post.commentCount}</DsText>
          </Press>
        ) : null}
      </View>
    </View>
  );
}

/** A thread on the forum, as a card: board, author, title, replies and Solved. */
export function ThreadCard({ thread, author, now, showBoard }: { thread: ForumThread; author?: User; now: Date; showBoard?: boolean }) {
  // For sale and wanted: the price leads, then condition and collection or postage.
  const l = thread.listing;
  return (
    <EntityCard
      kind="person"
      eyebrow={l ? (l.kind === 'wanted' ? 'Wanted' : 'For sale') : showBoard ? boardLabel(thread.board) : thread.region ?? 'Thread'}
      mark={{ avatar: personMark(author) }}
      status={
        thread.hidden
          ? { label: 'Hidden', tone: 'warning' }
          : l?.soldAt
            ? { label: l.kind === 'wanted' ? 'Found' : 'Sold', tone: 'success' }
            : thread.solvedReplyId
              ? { label: 'Solved', tone: 'success' }
              : undefined
      }
      sample={thread.sample}
      title={thread.title}
      finished={!!l?.soldAt}
      meta={l ? metaLine([priceLabel(l), ...listingFacts(l)]) : metaLine([at(author), plural(thread.replyCount, 'reply', 'replies'), shortAgo(thread.lastActivityAt, now), thread.photos.length ? 'Photos' : null])}
      detail={l ? metaLine([at(author), plural(thread.replyCount, 'reply', 'replies'), shortAgo(thread.lastActivityAt, now)]) : undefined}
      onPress={() => router.push({ pathname: '/forum/[id]', params: { id: thread.id } })}
    />
  );
}

/** A conversation in Messages: avatar, name, last line, time, unread. */
export function ConversationRow({ c, me, users, now }: { c: Conversation; me: string; users: User[]; now: Date }) {
  const handleOf = (id: string) => users.find((u) => u.id === id)?.handle;
  const title = conversationTitle(c, me, handleOf);
  const other = c.kind === 'direct' ? users.find((u) => c.memberIds.includes(u.id) && u.id !== me) : undefined;
  const unread = c.unread > 0;
  return (
    <ListRow
      leading={{ avatar: c.kind === 'group' ? { name: c.name ?? title } : personMark(other) }}
      title={title}
      subtitle={previewLine(c, me, handleOf)}
      meta={c.kind === 'group' ? metaLine(['Group', plural(c.memberIds.length, 'person', 'people')]) : undefined}
      unread={unread}
      chevron={false}
      trailing={
        <View style={{ alignItems: 'flex-end', gap: SPACING.xs }}>
          <DsText v="meta">{shortAgo(c.lastMessageAt, now)}</DsText>
          {unread ? <Tag label={c.unread > 99 ? '99+' : String(c.unread)} tone="selected" /> : !c.canSend ? <Tag label="Read only" /> : c.sample ? <Tag label="Sample" /> : null}
        </View>
      }
      onPress={() => router.push({ pathname: '/chat/[id]', params: { id: c.id } })}
      accessibilityLabel={metaLine([title, unread ? `${c.unread} unread` : null, previewLine(c, me, handleOf), shortAgo(c.lastMessageAt, now)])}
    />
  );
}

export interface SheetOptionSpec {
  label: string;
  detail?: string;
  onPress: () => void;
  danger?: boolean;
}
/** Kept for screens that build a menu: the options of an OptionsSheet. */
export type { SheetOptionSpec as SheetOption };

/** The ··· menu: a DS Sheet of options (Report, Block, Delete…). Each option closes the sheet first. */
export function OptionsSheet({ visible, title = 'Options', options, onClose }: { visible: boolean; title?: string; options: SheetOptionSpec[]; onClose: () => void }) {
  return (
    <Sheet visible={visible} title={title} onClose={onClose}>
      <View>
        {options.map((o) => (
          <SheetOption
            key={o.label}
            label={o.label}
            detail={o.detail}
            destructive={o.danger}
            onPress={() => {
              onClose();
              o.onPress();
            }}
          />
        ))}
      </View>
    </Sheet>
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

/** "Report this event" at the foot of a page (App Store 1.2: every kind of user content can be reported). */
export function ReportLink({ target, id, userId, what }: { target: string; id: string; userId?: string; what: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Button label={`Report this ${what}`} tier="tertiary" size="sm" onPress={() => openReport(target, id, userId, what)} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Staff: "Moderate" on anything someone wrote (docs/MODERATION.md)
// ---------------------------------------------------------------------------

let staffNow = false;
/** Set by ModerationGate once the app knows (my_moderation_status). The server checks every action anyway. */
export function setStaffNow(v: boolean) {
  staffNow = v;
}
export function isStaffNow(): boolean {
  return staffNow;
}

/** Open the Member moderation screen for this person. */
export function openModerate(userId: string) {
  router.push({ pathname: '/member/[id]', params: { id: userId } });
}

/** The "Moderate" option for a ··· menu: only for staff, never on yourself. */
export function moderateOptions(userId: string | null | undefined, me?: string | null): SheetOptionSpec[] {
  if (!staffNow || !userId || userId === me) return [];
  return [{ label: 'Moderate', detail: 'Their history, warn, ban', onPress: () => openModerate(userId) }];
}
