import type { SupabaseClient } from '@supabase/supabase-js';
import type { Nearby } from '../carsNear';
import type { ConnectionState } from '../connections';
import type { CommunityChange, CommunityService, PostPin, QueueItem } from '../communityService';
import { ilikePattern, NO_FORUM_REP, replyProblem, threadProblem, type BoardKey, type ForumRep, type ForumReply, type ForumThread } from '../forum';
import { uuid } from '../ids';
import { groupProblem, messageProblem, type Conversation, type Message, type ShareCard } from '../messages';
import { reportProblem, type ReportReason, type ReportTarget } from '../moderation';
import { photoUri } from '../photos';
import { commentProblem, postProblem, type Post, type PostComment, type PostVisibility } from '../posts';
import type { LatLng } from '../types';
import { isUuid } from './mapping';
import { isNetworkError, OFFLINE } from './outbox';

/**
 * Community on the server (docs/BACKEND.md section 3b): the RPCs and tables in
 * supabase/migrations/20261117220000_community.sql. Photos go to `photos`
 * ({uid}/forum/…, {uid}/posts/…) or the private `messages` bucket
 * ({uid}/{conversation}/…), and come back as signed links.
 */

// ---------------------------------------------------------------------------
// Rows and mappers (unit-tested)
// ---------------------------------------------------------------------------

export interface ThreadRow {
  id: string;
  board: BoardKey;
  region: string | null;
  author_id: string;
  title: string;
  body: string;
  photos: string[] | null;
  build_id: string | null;
  created_at: string;
  last_activity_at: string;
  reply_count: number;
  solved_reply_id: string | null;
  hidden_at: string | null;
}

export interface ReplyRow {
  id: string;
  thread_id: string;
  author_id: string;
  body: string;
  photos: string[] | null;
  build_id: string | null;
  created_at: string;
  helpful_count: number;
  hidden_at: string | null;
}

export interface PostRow {
  id: string;
  author_id: string;
  body: string;
  photos: string[] | null;
  lat: number | null;
  lng: number | null;
  place_name: string | null;
  visibility: PostVisibility;
  build_id: string | null;
  created_at: string;
  like_count: number;
  comment_count: number;
  liked_by_me: boolean;
  hidden: boolean;
}

export interface CommentRow {
  id: string;
  post_id: string;
  author_id: string;
  body: string;
  created_at: string;
  hidden_at: string | null;
}

export interface ConversationRow {
  id: string;
  kind: 'direct' | 'group';
  name: string | null;
  created_at: string;
  last_message_at: string;
  member_ids: string[];
  admin_ids: string[];
  unread: number;
  last_body: string | null;
  last_sender: string | null;
  last_kind: 'text' | 'photo' | 'share' | 'system' | null;
  can_send: boolean;
}

export interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string | null;
  body: string;
  photo_path: string | null;
  share: ShareCard | null;
  system: boolean;
  created_at: string;
}

type Signed = (path: string) => string;
const same: Signed = (p) => p;

export function threadFromRow(r: ThreadRow, sign: Signed = same): ForumThread {
  return {
    id: r.id,
    board: r.board,
    ...(r.region ? { region: r.region } : {}),
    authorId: r.author_id,
    title: r.title,
    body: r.body ?? '',
    photos: (r.photos ?? []).map(sign),
    ...(r.build_id ? { buildId: r.build_id } : {}),
    createdAt: r.created_at,
    lastActivityAt: r.last_activity_at,
    replyCount: r.reply_count ?? 0,
    ...(r.solved_reply_id ? { solvedReplyId: r.solved_reply_id } : {}),
    ...(r.hidden_at ? { hidden: true } : {}),
  };
}

export function replyFromRow(r: ReplyRow, helpful: ReadonlySet<string>, sign: Signed = same): ForumReply {
  return {
    id: r.id,
    threadId: r.thread_id,
    authorId: r.author_id,
    body: r.body,
    photos: (r.photos ?? []).map(sign),
    ...(r.build_id ? { buildId: r.build_id } : {}),
    createdAt: r.created_at,
    helpfulCount: r.helpful_count ?? 0,
    helpfulByMe: helpful.has(r.id),
    ...(r.hidden_at ? { hidden: true } : {}),
  };
}

export function postFromRow(r: PostRow, sign: Signed = same): Post {
  return {
    id: r.id,
    authorId: r.author_id,
    body: r.body ?? '',
    photos: (r.photos ?? []).map(sign),
    ...(typeof r.lat === 'number' && typeof r.lng === 'number' ? { at: { lat: r.lat, lng: r.lng } } : {}),
    ...(r.place_name ? { placeName: r.place_name } : {}),
    visibility: r.visibility,
    ...(r.build_id ? { buildId: r.build_id } : {}),
    createdAt: r.created_at,
    likeCount: r.like_count ?? 0,
    commentCount: r.comment_count ?? 0,
    likedByMe: !!r.liked_by_me,
    ...(r.hidden ? { hidden: true } : {}),
  };
}

export function commentFromRow(r: CommentRow): PostComment {
  return { id: r.id, postId: r.post_id, authorId: r.author_id, body: r.body, createdAt: r.created_at, ...(r.hidden_at ? { hidden: true } : {}) };
}

export function conversationFromRow(r: ConversationRow): Conversation {
  return {
    id: r.id,
    kind: r.kind,
    ...(r.name ? { name: r.name } : {}),
    memberIds: r.member_ids ?? [],
    adminIds: r.admin_ids ?? [],
    lastMessageAt: r.last_message_at,
    unread: r.unread ?? 0,
    ...(r.last_kind ? { last: { body: r.last_body ?? '', senderId: r.last_sender, kind: r.last_kind } } : {}),
    canSend: !!r.can_send,
  };
}

export function messageFromRow(r: MessageRow, sign: Signed = same): Message {
  return {
    id: r.id,
    conversationId: r.conversation_id,
    senderId: r.sender_id,
    body: r.body ?? '',
    ...(r.photo_path ? { photo: sign(r.photo_path) } : {}),
    ...(r.share ? { share: r.share } : {}),
    ...(r.system ? { system: true } : {}),
    createdAt: r.created_at,
  };
}

export interface QueueRow {
  target: ReportTarget;
  target_id: string;
  target_user: string | null;
  reports: number;
  reasons: ReportReason[] | string | null;
  first_reported: string;
  report_id: string;
  excerpt: string | null;
  notes: string[] | null;
}

/** Postgres arrays of enums can arrive as "{a,b}" text. */
function enumArray<T extends string>(v: T[] | string | null): T[] {
  if (Array.isArray(v)) return v;
  if (!v) return [];
  return v.replace(/^\{|\}$/g, '').split(',').filter(Boolean) as T[];
}

export function queueFromRow(r: QueueRow): QueueItem {
  return {
    reportId: r.report_id,
    target: r.target,
    targetId: r.target_id,
    targetUser: r.target_user,
    reports: r.reports ?? 1,
    reasons: enumArray<ReportReason>(r.reasons),
    firstReported: r.first_reported,
    excerpt: r.excerpt ?? '',
    notes: r.notes ?? [],
  };
}

const THREAD_COLS = 'id,board,region,author_id,title,body,photos,build_id,created_at,last_activity_at,reply_count,solved_reply_id,hidden_at';
const REPLY_COLS = 'id,thread_id,author_id,body,photos,build_id,created_at,helpful_count,hidden_at';
const MESSAGE_COLS = 'id,conversation_id,sender_id,body,photo_path,share,system,created_at';
const SIGNED_SECONDS = 7 * 24 * 3600;

type Result<T> = { data: T | null; error: { message: string } | null };

export function createRemoteCommunity(client: SupabaseClient, uid: string): CommunityService {
  async function call<T>(run: () => PromiseLike<Result<T>>): Promise<T> {
    let res: Result<T>;
    try {
      res = await run();
    } catch (e) {
      throw new Error(isNetworkError(e) ? OFFLINE : e instanceof Error ? e.message : String(e));
    }
    if (res.error) throw new Error(isNetworkError(res.error) ? OFFLINE : res.error.message);
    return res.data as T;
  }
  const rpc = <T>(name: string, args: Record<string, unknown> = {}) => call<T>(() => client.rpc(name, args) as unknown as PromiseLike<Result<T>>);

  /** Signed links for paths in a bucket; paths that fail are dropped. */
  async function signer(bucket: 'photos' | 'messages', paths: string[]): Promise<Signed> {
    const unique = Array.from(new Set(paths.filter(Boolean)));
    const map = new Map<string, string>();
    if (unique.length) {
      try {
        const { data } = await client.storage.from(bucket).createSignedUrls(unique, SIGNED_SECONDS);
        for (const d of data ?? []) if (d.path && d.signedUrl) map.set(d.path, d.signedUrl);
      } catch {
        // Photos just don't show until the next read.
      }
    }
    return (p) => map.get(p) ?? '';
  }

  async function upload(bucket: 'photos' | 'messages', path: string, ref: string): Promise<void> {
    const res = await fetch(photoUri(ref));
    const body = await res.arrayBuffer();
    await call(() => client.storage.from(bucket).upload(path, body, { contentType: 'image/jpeg', upsert: true }) as unknown as PromiseLike<Result<unknown>>);
  }

  async function uploadAll(folder: 'forum' | 'posts', refs: string[]): Promise<string[]> {
    const out: string[] = [];
    for (const ref of refs) {
      const path = `${uid}/${folder}/${uuid()}.jpg`;
      await upload('photos', path, ref);
      out.push(path);
    }
    return out;
  }

  const clean = (ps: string[]) => ps.filter(Boolean);

  async function threadsWithPhotos(rows: ThreadRow[]): Promise<ForumThread[]> {
    const sign = await signer('photos', rows.flatMap((r) => r.photos ?? []));
    return rows.map((r) => {
      const t = threadFromRow(r, sign);
      return { ...t, photos: clean(t.photos) };
    });
  }

  async function postsWithPhotos(rows: PostRow[]): Promise<Post[]> {
    const sign = await signer('photos', rows.flatMap((r) => r.photos ?? []));
    return rows.map((r) => {
      const p = postFromRow(r, sign);
      return { ...p, photos: clean(p.photos) };
    });
  }

  const svc: CommunityService = {
    kind: 'supabase',

    async peopleNear(maxMiles) {
      const rows = await rpc<{ user_id: string; miles: number }[]>('people_near', { p_max_miles: Math.round(maxMiles) });
      return (rows ?? []).map((r): Nearby => ({ userId: r.user_id, miles: r.miles }));
    },
    async showInNearby() {
      const rows = await call<{ show_in_nearby: boolean }[]>(() => client.from('profile_settings').select('show_in_nearby').eq('user_id', uid) as unknown as PromiseLike<Result<{ show_in_nearby: boolean }[]>>);
      return rows?.[0]?.show_in_nearby ?? true;
    },
    async setShowInNearby(on) {
      await rpc('save_community_prefs', { p_show_in_nearby: on });
    },

    async connections() {
      const rows = await rpc<{ user_id: string; state: ConnectionState }[]>('my_connections');
      return Object.fromEntries((rows ?? []).map((r) => [r.user_id, r.state]));
    },
    async requestConnection(userId) {
      return rpc<'requested' | 'connected'>('request_connection', { p_user: userId });
    },
    async answerConnection(userId, accept) {
      await rpc('answer_connection', { p_user: userId, p_accept: accept });
    },
    async removeConnection(userId) {
      await rpc('remove_connection', { p_user: userId });
    },
    async blocked() {
      const rows = await call<{ blocked_id: string }[]>(() => client.from('blocks').select('blocked_id') as unknown as PromiseLike<Result<{ blocked_id: string }[]>>);
      return (rows ?? []).map((r) => r.blocked_id);
    },
    async block(userId) {
      await rpc('block_user', { p_user: userId });
    },
    async unblock(userId) {
      await rpc('unblock_user', { p_user: userId });
    },

    async rated() {
      const rows = await call<{ build_id: string }[]>(() => client.from('build_ratings').select('build_id') as unknown as PromiseLike<Result<{ build_id: string }[]>>);
      return (rows ?? []).map((r) => r.build_id);
    },
    async rateBuild(buildId, like) {
      await rpc('rate_build', { p_build_id: buildId, p_like: like });
    },
    async buildLikes(ids) {
      const uuids = ids.filter(isUuid);
      if (!uuids.length) return {};
      const rows = await rpc<{ build_id: string; likes: number }[]>('build_likes', { p_build_ids: uuids });
      return Object.fromEntries((rows ?? []).map((r) => [r.build_id, r.likes]));
    },

    async threads(q) {
      const rows = await call<ThreadRow[]>(() => {
        let x = client.from('forum_threads').select(THREAD_COLS);
        if (q.board !== 'all') x = x.eq('board', q.board);
        if (q.board === 'local' && q.region) x = x.eq('region', q.region);
        if (q.query?.trim()) x = x.ilike('title', ilikePattern(q.query));
        return x.order(q.sort === 'new' ? 'created_at' : 'last_activity_at', { ascending: false }).limit(60) as unknown as PromiseLike<Result<ThreadRow[]>>;
      });
      return threadsWithPhotos(rows ?? []);
    },
    async thread(id) {
      if (!isUuid(id)) return null;
      const [threads, replies] = await Promise.all([
        call<ThreadRow[]>(() => client.from('forum_threads').select(THREAD_COLS).eq('id', id) as unknown as PromiseLike<Result<ThreadRow[]>>),
        call<ReplyRow[]>(() => client.from('forum_replies').select(REPLY_COLS).eq('thread_id', id).order('created_at').limit(500) as unknown as PromiseLike<Result<ReplyRow[]>>),
      ]);
      if (!threads?.length) return null;
      const ids = (replies ?? []).map((r) => r.id);
      const helpful = ids.length
        ? await call<{ reply_id: string }[]>(() => client.from('forum_helpful').select('reply_id').in('reply_id', ids) as unknown as PromiseLike<Result<{ reply_id: string }[]>>)
        : [];
      const mine = new Set((helpful ?? []).map((h) => h.reply_id));
      const sign = await signer('photos', [...(threads[0].photos ?? []), ...(replies ?? []).flatMap((r) => r.photos ?? [])]);
      const thread = threadFromRow(threads[0], sign);
      return {
        thread: { ...thread, photos: clean(thread.photos) },
        replies: (replies ?? []).map((r) => {
          const x = replyFromRow(r, mine, sign);
          return { ...x, photos: clean(x.photos) };
        }),
      };
    },
    async createThread(d) {
      const p = threadProblem(d);
      if (p) throw new Error(p);
      const photos = await uploadAll('forum', d.photos);
      return rpc<string>('create_thread', {
        p_board: d.board, p_region: d.board === 'local' ? d.region ?? null : null, p_title: d.title.trim(), p_body: d.body.trim(), p_photos: photos,
        p_build_id: d.buildId && isUuid(d.buildId) ? d.buildId : null,
      });
    },
    async reply(threadId, body, photos, buildId) {
      const p = replyProblem(body);
      if (p) throw new Error(p);
      const paths = await uploadAll('forum', photos);
      await rpc('reply_thread', { p_thread_id: threadId, p_body: body.trim(), p_photos: paths, p_build_id: buildId && isUuid(buildId) ? buildId : null });
    },
    async helpful(replyId, on) {
      await rpc('mark_helpful', { p_reply_id: replyId, p_on: on });
    },
    async markSolved(threadId, replyId) {
      await rpc('mark_solved', { p_thread_id: threadId, p_reply_id: replyId });
    },
    async deleteThread(id) {
      await call(() => client.from('forum_threads').delete().eq('id', id) as unknown as PromiseLike<Result<unknown>>);
    },
    async deleteReply(id) {
      await call(() => client.from('forum_replies').delete().eq('id', id) as unknown as PromiseLike<Result<unknown>>);
    },
    async forumRep(ids) {
      const uuids = Array.from(new Set(ids.filter(isUuid)));
      const out: Record<string, ForumRep> = {};
      if (!uuids.length) return out;
      const rows = await rpc<{ user_id: string; solved: number; rep: number }[]>('forum_rep_for', { p_user_ids: uuids });
      for (const id of uuids) out[id] = NO_FORUM_REP;
      for (const r of rows ?? []) out[r.user_id] = { solved: r.solved, rep: r.rep };
      return out;
    },

    async feed(scope, opts = {}) {
      const rows = await rpc<PostRow[]>('feed_posts', { p_scope: scope, p_before: opts.before ?? null, p_author: opts.author ?? null });
      return postsWithPhotos(rows ?? []);
    },
    async post(id) {
      if (!isUuid(id)) return null;
      const base = await call<{ author_id: string }[]>(() => client.from('posts').select('author_id').eq('id', id) as unknown as PromiseLike<Result<{ author_id: string }[]>>);
      if (!base?.length) return null;
      // The place comes back as lat/lng through feed_posts() (the author's newest 50).
      const rows = await rpc<PostRow[]>('feed_posts', { p_scope: 'author', p_before: null, p_author: base[0].author_id });
      let row = (rows ?? []).find((r) => r.id === id);
      if (!row) {
        const plain = await call<(Omit<PostRow, 'lat' | 'lng' | 'liked_by_me' | 'hidden'> & { hidden_at: string | null })[]>(
          () =>
            client.from('posts').select('id,author_id,body,photos,place_name,visibility,build_id,created_at,like_count,comment_count,hidden_at').eq('id', id) as unknown as PromiseLike<
              Result<(Omit<PostRow, 'lat' | 'lng' | 'liked_by_me' | 'hidden'> & { hidden_at: string | null })[]>
            >,
        );
        const likes = await call<{ post_id: string }[]>(() => client.from('post_likes').select('post_id').eq('post_id', id) as unknown as PromiseLike<Result<{ post_id: string }[]>>);
        if (!plain?.length) return null;
        row = { ...plain[0], lat: null, lng: null, liked_by_me: (likes ?? []).length > 0, hidden: !!plain[0].hidden_at };
      }
      const [post] = await postsWithPhotos([row]);
      const comments = await call<CommentRow[]>(() =>
        client.from('post_comments').select('id,post_id,author_id,body,created_at,hidden_at').eq('post_id', id).order('created_at').limit(500) as unknown as PromiseLike<Result<CommentRow[]>>,
      );
      return { post, comments: (comments ?? []).map(commentFromRow) };
    },
    async createPost(d) {
      const p = postProblem(d, null);
      if (p) throw new Error(p);
      const photos = await uploadAll('posts', d.photos);
      return rpc<string>('create_post', {
        p_body: d.body.trim(), p_photos: photos, p_lat: d.at?.lat ?? null, p_lng: d.at?.lng ?? null, p_place_name: d.at ? d.placeName?.trim() || null : null,
        p_visibility: d.visibility, p_build_id: d.buildId && isUuid(d.buildId) ? d.buildId : null,
      });
    },
    async likePost(id, on) {
      await rpc('like_post', { p_post_id: id, p_on: on });
    },
    async comment(postId, body) {
      const p = commentProblem(body);
      if (p) throw new Error(p);
      await rpc('comment_post', { p_post_id: postId, p_body: body.trim() });
    },
    async deletePost(id) {
      await call(() => client.from('posts').delete().eq('id', id) as unknown as PromiseLike<Result<unknown>>);
    },
    async deleteComment(id) {
      await call(() => client.from('post_comments').delete().eq('id', id) as unknown as PromiseLike<Result<unknown>>);
    },
    async postsInBox(box) {
      const rows = await rpc<{ id: string; author_id: string; lat: number; lng: number; photo: string | null; place_name: string | null; created_at: string }[]>('posts_in_box', {
        p_south: box.south, p_west: box.west, p_north: box.north, p_east: box.east,
      });
      const sign = await signer('photos', (rows ?? []).map((r) => r.photo ?? ''));
      return (rows ?? []).map(
        (r): PostPin => ({ id: r.id, authorId: r.author_id, at: { lat: r.lat, lng: r.lng } as LatLng, ...(r.photo && sign(r.photo) ? { photo: sign(r.photo) } : {}), ...(r.place_name ? { placeName: r.place_name } : {}), createdAt: r.created_at }),
      );
    },

    async conversations() {
      const rows = await rpc<ConversationRow[]>('my_conversations');
      return (rows ?? []).map(conversationFromRow);
    },
    async messages(conversationId) {
      if (!isUuid(conversationId)) return { messages: [], readUpTo: {} };
      const [rows, members] = await Promise.all([
        call<MessageRow[]>(() =>
          client.from('messages').select(MESSAGE_COLS).eq('conversation_id', conversationId).order('created_at', { ascending: false }).limit(300) as unknown as PromiseLike<Result<MessageRow[]>>,
        ),
        call<{ user_id: string; last_read_at: string }[]>(() =>
          client.from('conversation_members').select('user_id,last_read_at').eq('conversation_id', conversationId) as unknown as PromiseLike<Result<{ user_id: string; last_read_at: string }[]>>,
        ),
      ]);
      const list = (rows ?? []).reverse();
      const sign = await signer('messages', list.map((m) => m.photo_path ?? ''));
      return {
        messages: list.map((m) => messageFromRow(m, sign)),
        readUpTo: Object.fromEntries((members ?? []).map((m) => [m.user_id, m.last_read_at])),
      };
    },
    async startDirect(userId) {
      return rpc<string>('start_direct', { p_user: userId });
    },
    async createGroup(name, memberIds) {
      const p = groupProblem(name, memberIds);
      if (p) throw new Error(p);
      return rpc<string>('create_group', { p_name: name.trim(), p_member_ids: memberIds });
    },
    async addMembers(conversationId, userIds) {
      await rpc('add_group_members', { p_conversation_id: conversationId, p_member_ids: userIds });
    },
    async removeMember(conversationId, userId) {
      await rpc('remove_group_member', { p_conversation_id: conversationId, p_user: userId });
    },
    async setAdmin(conversationId, userId, admin) {
      await rpc('set_group_admin', { p_conversation_id: conversationId, p_user: userId, p_admin: admin });
    },
    async renameGroup(conversationId, name) {
      await rpc('rename_group', { p_conversation_id: conversationId, p_name: name.trim() });
    },
    async leave(conversationId) {
      await rpc('leave_conversation', { p_conversation_id: conversationId });
    },
    async send(conversationId, m) {
      const p = messageProblem(m.body, m.photo, m.share);
      if (p) throw new Error(p);
      let path: string | null = null;
      if (m.photo) {
        path = `${uid}/${conversationId}/${uuid()}.jpg`;
        await upload('messages', path, m.photo);
      }
      await rpc('send_message', { p_conversation_id: conversationId, p_body: m.body.trim(), p_photo_path: path, p_share: m.share ?? null });
    },
    async markRead(conversationId) {
      await rpc('mark_conversation_read', { p_conversation_id: conversationId });
    },

    async report(target, id, reason, note) {
      const p = reportProblem(reason, note);
      if (p) throw new Error(p);
      await rpc('report_content', { p_target: target, p_target_id: id, p_reason: reason, p_note: note.trim() || null });
    },
    async moderationStatus() {
      const rows = await rpc<{ is_staff: boolean; suspended: boolean; suspended_until: string | null }[]>('my_moderation_status');
      const r = rows?.[0];
      return { isStaff: !!r?.is_staff, suspended: !!r?.suspended, until: r?.suspended_until ?? null };
    },
    async queue() {
      const rows = await call<QueueRow[]>(() => client.from('moderation_queue').select('*').order('reports', { ascending: false }).order('first_reported').limit(200) as unknown as PromiseLike<Result<QueueRow[]>>);
      return (rows ?? []).map(queueFromRow);
    },
    async moderate(reportId, action, days) {
      await rpc('moderate_report', { p_report_id: reportId, p_action: action, p_days: days ?? null, p_reason: null });
    },
    async liftSuspension(userId) {
      await rpc('lift_suspension', { p_user: userId });
    },
    watch(onChange: (c: CommunityChange) => void) {
      const channel = client
        .channel(`community:${uid}:${uuid().slice(0, 8)}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (p) => {
          const r = p.new as MessageRow;
          onChange({ kind: 'message', conversationId: r.conversation_id, senderId: r.sender_id, body: r.body });
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'conversation_members' }, (p) => {
          const r = p.new as { conversation_id: string };
          onChange({ kind: 'read', conversationId: r.conversation_id });
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'connections' }, () => onChange({ kind: 'connections' }))
        .subscribe();
      return () => {
        client.removeChannel(channel).catch(() => {});
      };
    },
  };
  return svc;
}
