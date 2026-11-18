import { modCount } from '../lib/modGroups';
import { carShape } from '../lib/buildShape';
import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Image, View, useWindowDimensions } from 'react-native';
import { distanceLabel, type PersonCard as Card_ } from '../lib/carsNear';
import { classOf } from '../lib/classes';
import { connectLabel, type ConnectionState } from '../lib/connections';
import { boardLabel, listingFacts, priceLabel, type ForumThread } from '../lib/forum';
import { plural } from '../lib/format';
import { postedLabel } from '../lib/messages';
import { conversationTitle, previewLine, type Conversation } from '../lib/messages';
import { VISIBILITY, type Post } from '../lib/posts';
import { postPlace } from '../lib/postPrivacy';
import { useStore } from '../lib/store';
import type { Build, User } from '../lib/types';
import { ASPECT, COLOR, RADII, SPACING } from '../theme';
import { Avatar, BuildThumb, Button, ClassBadge, DsText, Icon, IconButton, ListRow, Press, Sheet, SheetOption, Tag, metaLine } from './ds';
import { photoSource } from '../lib/photoSource';
import { PhotoCredit } from './PhotoCredit';
import { useBuildPicture } from './BuildBits';
import { powerText } from '../lib/dyno';
import { DynoBadge } from './DynoBadge';

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
  // One power figure (crank bhp, "est." from a wheels run); mods in one group count once (REVIEW-10).
  return metaLine([powerText(b), plural(modCount(b.mods), 'mod')]);
}

/** "Connect with people at a meet": the one way into connections, from every empty list of people or chats. */
export const MEET_ACTION = { label: 'Connect with people at a meet', onPress: () => router.navigate('/events') };

/** Open someone's profile. */
export function openProfile(id: string) {
  router.push({ pathname: '/user/[id]', params: { id } });
}

/** When something was posted or sent (4.10): in messages.ts, so it's testable. */
export { postedLabel };

/** Open a meet's page. */
export function openEvent(id: string) {
  router.push({ pathname: '/event/[id]', params: { id } });
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
  const pic = useBuildPicture(build);
  const body = (
    <>
      <BuildThumb photo={pic ? photoSource(pic.ref) : null} kind={build.kind} shape={carShape(build)} size={36} />
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
export function BuildTile({ build, width, trophies = 0 }: { build: Build; width: number; trophies?: number; /** Ignored: no sample tags on cards (Redesign 2). */ sample?: boolean }) {
  const thumbHeight = Math.round((width * 3) / 4);
  const pic = useBuildPicture(build);
  return (
    <Press
      onPress={() => openBuild(build.id)}
      feedback="card"
      label={metaLine([`${build.make} ${build.model}`, `class ${classOf(build)}`, buildMeta(build), trophies ? plural(trophies, 'trophy', 'trophies') : null])}
      style={{ width, gap: SPACING.xs }}
    >
      <View>
        <BuildThumb photo={pic ? photoSource(pic.ref) : null} kind={build.kind} shape={carShape(build)} size={thumbHeight} />
        <View style={{ position: 'absolute', left: SPACING.sm, top: SPACING.sm }}>
          <ClassBadge letter={classOf(build)} size="sm" decorative />
        </View>
        <PhotoCredit photoRef={pic?.ref} kind={build.kind} standIn={pic?.standIn} overlay />
      </View>
      <DsText v="bodyStrong" numberOfLines={2}>
        {build.make} {build.model}
      </DsText>
      <DsText v="meta" numberOfLines={1}>
        {metaLine([buildMeta(build), trophies ? plural(trophies, 'trophy', 'trophies') : null])}
      </DsText>
      <DynoBadge build={build} />
    </Press>
  );
}

/** A two-column grid of build tiles; one build gets the full width (REVIEW-8: a half-width card with an empty half). */
export function BuildGrid({ builds, trophiesOf, sampleId, halfOnly }: { builds: Build[]; trophiesOf?: (id: string) => number; sampleId?: (b: Build) => boolean; halfOnly?: boolean }) {
  const half = useTileWidth();
  // `halfOnly`: under a bigger main build (Garage), a lone other build stays half width (REVIEW-9 decision 11).
  const w = builds.length === 1 && !halfOnly ? half * 2 + SPACING.md : half;
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

/** A build's one line next to a person: "Golf R · 320 bhp" (K3: a build is its class badge, name and bhp). */
export function buildLine(b: Build): string {
  return metaLine([`${b.make} ${b.model}`, powerText(b)]);
}

/**
 * People near you: one row per person (Redesign 2, 3.7): avatar, @handle, their best build with
 * its class badge, and a rough distance. No level. Tapping opens their profile.
 */
export function PersonNearRow({ card, state }: { card: Card_; state: ConnectionState; /** Ignored (levels are on Me only). */ level?: number; /** Ignored (no Sample tags). */ sample?: boolean }) {
  const b = card.lead;
  return (
    <ListRow
      leading={{ avatar: personMark(card.user) }}
      title={at(card.user)}
      subtitle={b ? buildLine(b) : 'No car or bike yet'}
      meta={metaLine([distanceLabel(card.miles), connectWord(state)])}
      trailing={b ? <ClassBadge letter={classOf(b)} size="sm" decorative /> : undefined}
      onPress={() => openProfile(card.user.id)}
      accessibilityLabel={metaLine([at(card.user), b ? `${b.make} ${b.model}, class ${classOf(b)}, ${powerText(b)}` : 'no car or bike yet', distanceLabel(card.miles), connectWord(state)])}
    />
  );
}

/** A person's row anywhere else (connections, a chat's members): avatar, @handle, their build. */
export function PersonRow({ user, build, meta, onPress, trailing }: { user?: User; build?: Build; meta?: string; onPress?: () => void; trailing?: ReactNode }) {
  return (
    <ListRow
      leading={{ avatar: personMark(user) }}
      title={at(user)}
      subtitle={build ? buildLine(build) : user?.name || undefined}
      meta={meta}
      trailing={trailing ?? (build ? <ClassBadge letter={classOf(build)} size="sm" decorative /> : undefined)}
      onPress={onPress}
    />
  );
}

/**
 * A feed post, photo first (Redesign 2, 3.7): the photo at 4:5 (ⓘ in the corner, never credit
 * text), then avatar, @handle and their build line, the caption (3 lines), and ♡ and comment
 * counts. A post without a photo is the same card without the picture. Three type sizes: the
 * handle, the caption and meta.
 */
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
  /** On the post's own page: no tap-through, every photo, the whole caption. */
  full?: boolean;
}) {
  const open = onOpen && !full ? onOpen : undefined;
  const [broken, setBroken] = useState<Set<string>>(() => new Set());
  const photos = post.photos.filter((p) => !broken.has(p));
  const shown = full ? photos : photos.slice(0, 1);
  const { events } = useStore();
  const place = postPlace(post, { events });
  // "At {event}" is the place line; a caption that only says the same is not said twice (C5).
  const body = place?.kind === 'event' && post.body.trim() === place.text ? '' : post.body;

  const pictures = shown.map((p, i) => (
    <View key={p} style={{ aspectRatio: ASPECT.post, backgroundColor: COLOR.surface.media }}>
      {/* A photo that can't load (an old web preview link, a file that's gone) drops out instead of leaving a blank frame. */}
      <Image
        source={photoSource(p)}
        onError={() => setBroken((b) => new Set(b).add(p))}
        style={{ width: '100%', height: '100%' }}
        resizeMode="cover"
        accessibilityLabel={i === 0 ? `Photo by ${at(author)}` : 'Another photo in the post'}
        accessibilityIgnoresInvertColors
      />
      <PhotoCredit photoRef={p} overlay corner="topRight" />
      {i === 0 && !full && post.photos.length > 1 ? (
        <View style={{ position: 'absolute', left: SPACING.sm, top: SPACING.sm, backgroundColor: COLOR.surface.glass, borderRadius: RADII.tag }}>
          <Tag label={`+${post.photos.length - 1} photos`} />
        </View>
      ) : null}
    </View>
  ));

  const words = (
    <View style={{ gap: SPACING.sm }}>
      {post.hidden ? (
        <DsText v="caption" tone="warning">
          Hidden while it's checked after reports. Only you can see it.
        </DsText>
      ) : null}
      {body ? (
        <DsText v="body" numberOfLines={full ? undefined : 3} selectable={full}>
          {body}
        </DsText>
      ) : null}
    </View>
  );

  return (
    <View
      style={
        full
          ? { marginHorizontal: -SPACING.screen, marginTop: -SPACING.screen }
          : { backgroundColor: COLOR.surface.card, borderColor: COLOR.surface.border, borderWidth: 1, borderRadius: RADII.card, overflow: 'hidden' }
      }
    >
      {shown.length ? open ? (
        <Press onPress={open} feedback="card" label="Open the post">
          {pictures}
        </Press>
      ) : (
        <View style={{ gap: SPACING.xxs }}>{pictures}</View>
      ) : null}
      <View style={{ paddingHorizontal: full ? SPACING.screen : SPACING.md, paddingTop: SPACING.md, paddingBottom: SPACING.sm, gap: SPACING.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
          <Press onPress={() => author && openProfile(author.id)} role="link" label={`${at(author)}'s profile`} style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flex: 1 }}>
            <Avatar {...personMark(author)} size="md" />
            <View style={{ flex: 1, gap: SPACING.xxs }}>
              <DsText v="bodyStrong" numberOfLines={1}>
                {at(author)}
              </DsText>
              {/* A build is always its class badge, name and bhp (K3). */}
              {build ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
                  <ClassBadge letter={classOf(build)} size="sm" decorative />
                  <DsText v="meta" numberOfLines={1} style={{ flexShrink: 1 }}>
                    {buildLine(build)}
                  </DsText>
                </View>
              ) : null}
            </View>
          </Press>
          {post.visibility === 'connections' ? <Tag label={VISIBILITY.connections.label} tone="info" /> : null}
          {onMore ? <IconButton icon="more" label="More options for this post" onPress={onMore} colour={COLOR.text.secondary} /> : null}
        </View>
        {/* The place on its own line, so the build line is never cut short (Review 14, at 393 wide). */}
        {place?.kind === 'place' ? (
          <DsText v="meta" numberOfLines={1}>
            {place.text}
          </DsText>
        ) : null}
        {place?.kind === 'event' ? (
          // A post made at a meet links to the meet, never names the place (REVIEW-12 #1).
          <Press onPress={() => openEvent(place.eventId)} role="link" label={`${place.text}. Opens the meet`} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xxs, minHeight: 32, alignSelf: 'flex-start' }}>
            <DsText v="meta" numberOfLines={1} style={{ flexShrink: 1 }}>
              {place.text}
            </DsText>
            <Icon name="chevron" size={14} colour={COLOR.text.secondary} />
          </Press>
        ) : null}
        {open ? (
          <Press onPress={open} label="Open the post">
            {words}
          </Press>
        ) : (
          words
        )}
        {full && build ? <BuildRow build={build} onPress={() => openBuild(build.id)} /> : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.lg }}>
          <Press
            onPress={onLike}
            haptic="select"
            state={{ selected: post.likedByMe }}
            label={`${post.likedByMe ? 'Unlike' : 'Like'}, ${plural(post.likeCount, 'like')}`}
            hitSlop={8}
            style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, minHeight: 36 }}
          >
            <Icon name={post.likedByMe ? 'heartOn' : 'heart'} size={20} colour={post.likedByMe ? COLOR.text.primary : COLOR.text.secondary} />
            <DsText v="meta">{post.likeCount}</DsText>
          </Press>
          {open ? (
            <Press onPress={open} label={`Comments, ${post.commentCount}`} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, minHeight: 36 }}>
              <Icon name="comment" size={20} colour={COLOR.text.secondary} />
              <DsText v="meta">{post.commentCount}</DsText>
            </Press>
          ) : null}
          <View style={{ flex: 1 }} />
          <DsText v="meta">{postedLabel(post.createdAt, now)}</DsText>
        </View>
      </View>
    </View>
  );
}

/** "Sold" for a sale, "Found" for a wanted listing, "Solved" for an answered thread, "Hidden" while it's checked. */
function threadState(thread: ForumThread): { label: string; tone: 'warning' | 'success' } | undefined {
  const l = thread.listing;
  if (thread.hidden) return { label: 'Hidden', tone: 'warning' };
  if (l?.soldAt) return { label: l.kind === 'wanted' ? 'Found' : 'Sold', tone: 'success' };
  if (thread.solvedReplyId) return { label: 'Solved', tone: 'success' };
  return undefined;
}

/**
 * A thread in Forum and for sale, as one row: the author's avatar, the title, then the price for
 * a listing (or the board), and who, replies and when. Sold, Found or Solved on the right.
 */
export function ThreadCard({ thread, author, now, showBoard }: { thread: ForumThread; author?: User; now: Date; showBoard?: boolean }) {
  const l = thread.listing;
  const state = threadState(thread);
  const kind = l ? (l.kind === 'wanted' ? 'Wanted' : 'For sale') : showBoard ? boardLabel(thread.board) : null;
  const subtitle = l ? metaLine([kind, priceLabel(l), ...listingFacts(l).slice(0, 1)]) : metaLine([kind, thread.region]);
  const meta = metaLine([at(author), plural(thread.replyCount, 'reply', 'replies'), postedLabel(thread.lastActivityAt, now)]);
  return (
    <ListRow
      leading={{ avatar: personMark(author) }}
      title={thread.title}
      subtitle={subtitle || undefined}
      meta={meta}
      trailing={state ? <Tag label={state.label} tone={state.tone} /> : undefined}
      onPress={() => router.push({ pathname: '/forum/[id]', params: { id: thread.id } })}
      accessibilityLabel={metaLine([thread.title, subtitle, meta, state?.label])}
    />
  );
}

/** A chat in Community › Chats: avatar, name, last line, time, and the unread dot. */
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
          <DsText v="meta">{postedLabel(c.lastMessageAt, now)}</DsText>
          {!c.canSend ? <Tag label="Read only" /> : null}
        </View>
      }
      onPress={() => router.push({ pathname: '/chat/[id]', params: { id: c.id } })}
      accessibilityLabel={metaLine([title, unread ? `${c.unread} unread` : null, previewLine(c, me, handleOf), postedLabel(c.lastMessageAt, now)])}
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
