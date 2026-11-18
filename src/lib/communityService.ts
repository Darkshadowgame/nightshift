import { communitySample, SAMPLE_REPLIES } from '../data/communitySeed';
import { ME, SAMPLE_PEOPLE } from '../data/seed';
import { peopleNear, type Nearby } from './carsNear';
import {
  answerConnection,
  connectionsOf,
  dropPair,
  removeConnection,
  requestConnection,
  stateWith,
  type ConnectionRow,
  type ConnectionState,
} from './connections';
import {
  forumRepOf,
  replyProblem,
  searchThreads,
  solvedRecord,
  sortThreads,
  threadProblem,
  threadsFor,
  ukDay,
  type BoardKey,
  type ForumRep,
  type ForumReply,
  type ForumThread,
  type SolvedRecord,
  type ThreadDraft,
  type ThreadSort,
} from './forum';
import { newId } from './ids';
import { groupProblem, MAX_GROUP, messageProblem, otherMember, type Conversation, type Message, type ShareCard } from './messages';
import { reportProblem, type ReportReason, type ReportTarget } from './moderation';
import { canSee, commentProblem, feedFor, postProblem, postsInBox, snapPlace, withLike, type FeedScope, type Post, type PostComment, type PostDraft } from './posts';
import type { LatLng, User } from './types';

/**
 * Community behind one interface, like road reports (roadService.ts): the demo
 * keeps everything on the phone (below), signed in it's the server
 * (src/lib/backend/community.ts). Every method rejects with a sentence the
 * screen can show as it is.
 */

export interface ThreadQuery {
  board: BoardKey | 'all';
  region?: string | null;
  sort: ThreadSort;
  query?: string;
}

export interface PostPin {
  id: string;
  authorId: string;
  at: LatLng;
  photo?: string;
  placeName?: string;
  createdAt: string;
}

export interface Box {
  south: number;
  west: number;
  north: number;
  east: number;
}

export interface CommunityService {
  readonly kind: 'local' | 'supabase';
  // People
  peopleNear(maxMiles: number): Promise<Nearby[]>;
  showInNearby(): Promise<boolean>;
  setShowInNearby(on: boolean): Promise<void>;
  // Connections and blocks
  connections(): Promise<Record<string, ConnectionState>>;
  requestConnection(userId: string): Promise<'requested' | 'connected'>;
  answerConnection(userId: string, accept: boolean): Promise<void>;
  removeConnection(userId: string): Promise<void>;
  blocked(): Promise<string[]>;
  block(userId: string): Promise<void>;
  unblock(userId: string): Promise<void>;
  // Rate builds
  rated(): Promise<string[]>;
  rateBuild(buildId: string, like: boolean): Promise<void>;
  buildLikes(buildIds: string[]): Promise<Record<string, number>>;
  // Forum
  threads(q: ThreadQuery): Promise<ForumThread[]>;
  thread(id: string): Promise<{ thread: ForumThread; replies: ForumReply[] } | null>;
  createThread(d: ThreadDraft): Promise<string>;
  reply(threadId: string, body: string, photos: string[], buildId?: string): Promise<void>;
  helpful(replyId: string, on: boolean): Promise<void>;
  markSolved(threadId: string, replyId: string | null): Promise<void>;
  deleteThread(id: string): Promise<void>;
  deleteReply(id: string): Promise<void>;
  forumRep(userIds: string[]): Promise<Record<string, ForumRep>>;
  // Posts
  feed(scope: FeedScope | 'author', opts?: { author?: string; before?: string }): Promise<Post[]>;
  post(id: string): Promise<{ post: Post; comments: PostComment[] } | null>;
  createPost(d: PostDraft): Promise<string>;
  likePost(id: string, on: boolean): Promise<void>;
  comment(postId: string, body: string): Promise<void>;
  deletePost(id: string): Promise<void>;
  deleteComment(id: string): Promise<void>;
  postsInBox(box: Box): Promise<PostPin[]>;
  // Messages
  conversations(): Promise<Conversation[]>;
  messages(conversationId: string): Promise<{ messages: Message[]; readUpTo: Record<string, string> }>;
  startDirect(userId: string): Promise<string>;
  createGroup(name: string, memberIds: string[]): Promise<string>;
  addMembers(conversationId: string, userIds: string[]): Promise<void>;
  removeMember(conversationId: string, userId: string): Promise<void>;
  setAdmin(conversationId: string, userId: string, admin: boolean): Promise<void>;
  renameGroup(conversationId: string, name: string): Promise<void>;
  leave(conversationId: string): Promise<void>;
  send(conversationId: string, m: { body: string; photo?: string; share?: ShareCard }): Promise<void>;
  markRead(conversationId: string): Promise<void>;
  // Safety
  report(target: ReportTarget, id: string, reason: ReportReason, note: string): Promise<void>;
  /** Am I staff (Settings › Moderation), and am I suspended? */
  moderationStatus(): Promise<ModerationStatus>;
  /** Staff: open reports grouped by what was reported. */
  queue(): Promise<QueueItem[]>;
  /** Staff: dismiss, hide, restore, or suspend the person (days, or null until lifted). */
  moderate(reportId: string, action: ModerationAction, days?: number | null): Promise<void>;
  liftSuspension(userId: string): Promise<void>;
  /** Something changed (a message, a request, a read receipt). Returns the unsubscribe. */
  watch(onChange: (what: CommunityChange) => void): () => void;
}

export interface ModerationStatus {
  isStaff: boolean;
  suspended: boolean;
  /** Null with `suspended`: until staff lift it. */
  until: string | null;
}

export type ModerationAction = 'dismiss' | 'hide' | 'restore' | 'suspend';

export interface QueueItem {
  reportId: string;
  target: ReportTarget;
  targetId: string;
  targetUser: string | null;
  reports: number;
  reasons: ReportReason[];
  firstReported: string;
  excerpt: string;
  notes: string[];
}

export type CommunityChange =
  | { kind: 'message'; conversationId: string; senderId: string | null; body: string }
  | { kind: 'connections' }
  | { kind: 'read'; conversationId: string };

// ---------------------------------------------------------------------------
// The demo
// ---------------------------------------------------------------------------

/** What the demo keeps (AsyncStorage `nightshift.community.demo`). */
export interface DemoCommunity {
  version: 1;
  /** The home area the samples were laid out round. */
  around: LatLng | null;
  connections: ConnectionRow[];
  /** When you sent connection requests (for the daily limit). */
  sent: string[];
  blocks: string[];
  hidden: boolean;
  rated: Record<string, boolean>;
  likes: Record<string, number>;
  threads: ForumThread[];
  replies: ForumReply[];
  solved: SolvedRecord[];
  posts: Post[];
  comments: PostComment[];
  conversations: Conversation[];
  messages: Message[];
  reports: { target: ReportTarget; id: string; reason: ReportReason; note: string; at: string }[];
}

export function emptyDemoCommunity(): DemoCommunity {
  return {
    version: 1, around: null, connections: [], sent: [], blocks: [], hidden: false, rated: {}, likes: {}, threads: [], replies: [], solved: [], posts: [],
    comments: [], conversations: [], messages: [], reports: [],
  };
}

/** Lay the samples out round this home (first run, or a new home area), keeping what you made. */
export function seedDemoCommunity(s: DemoCommunity, home: LatLng, region: string, now: Date): DemoCommunity {
  const sample = communitySample(now, home, region);
  const mine = <T extends { sample?: boolean }>(xs: T[]) => xs.filter((x) => !x.sample);
  const sampleIds = new Set(sample.conversations.map((c) => c.id));
  return {
    ...s,
    around: home,
    connections: s.around ? s.connections : sample.connections,
    likes: { ...sample.likes, ...s.likes },
    threads: [...sample.threads, ...mine(s.threads)],
    replies: [...sample.replies, ...mine(s.replies)],
    solved: s.around ? s.solved : sample.solved,
    posts: [...sample.posts, ...mine(s.posts)],
    comments: [...sample.comments, ...mine(s.comments)],
    conversations: [...sample.conversations, ...s.conversations.filter((c) => !sampleIds.has(c.id))],
    messages: [...sample.messages, ...s.messages.filter((m) => !m.sample && !(sampleIds.has(m.conversationId) && m.sample))],
  };
}

export interface LocalCommunityContext {
  get(): DemoCommunity;
  set(s: DemoCommunity): void;
  users(): User[];
  travelMiles(): number;
  now?: () => Date;
  /** Wait before a sample person answers (ms). */
  replyDelay?: number;
}

export function createLocalCommunity(ctx: LocalCommunityContext): CommunityService {
  const now = ctx.now ?? (() => new Date());
  const listeners = new Set<(c: CommunityChange) => void>();
  const emit = (c: CommunityChange) => listeners.forEach((l) => l(c));
  const delay = ctx.replyDelay ?? 4000;
  const update = (fn: (s: DemoCommunity) => DemoCommunity) => ctx.set(fn(ctx.get()));
  const me = () => ctx.users().find((u) => u.id === ME);
  const blocked = () => new Set(ctx.get().blocks);
  const connected = () => {
    const states = connectionsOf(ctx.get().connections, ME, now());
    return new Set(Object.keys(states).filter((k) => states[k] === 'connected'));
  };
  const isSample = (id: string) => SAMPLE_PEOPLE.includes(id);
  const iso = () => now().toISOString();

  function convView(c: Conversation, s: DemoCommunity): Conversation {
    const bl = new Set(s.blocks);
    const msgs = s.messages.filter((m) => m.conversationId === c.id && !(m.senderId && bl.has(m.senderId)));
    const read = c.readUpTo?.[ME] ?? '';
    const unread = msgs.filter((m) => m.senderId && m.senderId !== ME && m.createdAt > read).length;
    const last = msgs[msgs.length - 1];
    const other = otherMember(c, ME);
    const canSend = c.kind === 'group' ? c.memberIds.includes(ME) : !!other && stateWith(s.connections, ME, other, now()) === 'connected' && !bl.has(other);
    return {
      ...c,
      unread,
      canSend,
      lastMessageAt: last?.createdAt ?? c.lastMessageAt,
      last: last
        ? { body: last.body, senderId: last.senderId, kind: last.system ? 'system' : last.photo ? 'photo' : last.share ? 'share' : 'text' }
        : undefined,
    };
  }

  function addMessage(conversationId: string, m: Omit<Message, 'id' | 'conversationId' | 'createdAt'>) {
    const msg: Message = { id: newId('ms'), conversationId, createdAt: iso(), ...m };
    update((s) => ({
      ...s,
      messages: [...s.messages, msg],
      conversations: s.conversations.map((c) =>
        c.id === conversationId
          ? { ...c, lastMessageAt: msg.createdAt, readUpTo: m.senderId ? { ...c.readUpTo, [m.senderId]: msg.createdAt } : c.readUpTo }
          : c,
      ),
    }));
    emit({ kind: 'message', conversationId, senderId: msg.senderId, body: msg.body });
  }

  const handle = (id: string) => ctx.users().find((u) => u.id === id)?.handle ?? 'someone';

  return {
    kind: 'local',

    async peopleNear(maxMiles) {
      const m = me();
      if (!m) return [];
      return peopleNear(m, ctx.users(), maxMiles, { blocked: blocked() });
    },
    async showInNearby() {
      return !ctx.get().hidden;
    },
    async setShowInNearby(on) {
      update((s) => ({ ...s, hidden: !on }));
    },

    async connections() {
      return connectionsOf(ctx.get().connections, ME, now());
    },
    async requestConnection(userId) {
      const s = ctx.get();
      const today = s.sent.filter((t) => now().getTime() - new Date(t).getTime() < 86_400_000).length;
      const { rows, result } = requestConnection(s.connections, ME, userId, now(), { blocked: s.blocks.includes(userId), sentToday: today });
      const sentNew = rows !== s.connections && result === 'requested';
      ctx.set({ ...s, connections: rows, sent: sentNew ? [...s.sent, iso()].slice(-50) : s.sent });
      emit({ kind: 'connections' });
      // Sample people accept after a moment, so the demo can be tried end to end.
      if (result === 'requested' && isSample(userId)) {
        setTimeout(() => {
          const cur = ctx.get();
          if (cur.connections.some((r) => r.from === ME && r.to === userId && r.status === 'pending')) {
            ctx.set({ ...cur, connections: cur.connections.map((r) => (r.from === ME && r.to === userId ? { ...r, status: 'accepted', answeredAt: iso() } : r)) });
            emit({ kind: 'connections' });
          }
        }, delay);
      }
      return result;
    },
    async answerConnection(userId, accept) {
      update((s) => ({ ...s, connections: answerConnection(s.connections, ME, userId, accept, now()) }));
      emit({ kind: 'connections' });
    },
    async removeConnection(userId) {
      update((s) => ({ ...s, connections: removeConnection(s.connections, ME, userId) }));
      emit({ kind: 'connections' });
    },
    async blocked() {
      return ctx.get().blocks;
    },
    async block(userId) {
      if (userId === ME) throw new Error("You can't block yourself.");
      update((s) => ({ ...s, blocks: s.blocks.includes(userId) ? s.blocks : [...s.blocks, userId], connections: dropPair(s.connections, ME, userId) }));
      emit({ kind: 'connections' });
    },
    async unblock(userId) {
      update((s) => ({ ...s, blocks: s.blocks.filter((b) => b !== userId) }));
      emit({ kind: 'connections' });
    },

    async rated() {
      return Object.keys(ctx.get().rated);
    },
    async rateBuild(buildId, like) {
      update((s) => {
        const was = s.rated[buildId];
        const likes = { ...s.likes };
        if (was !== like) likes[buildId] = Math.max(0, (likes[buildId] ?? 0) + (like ? 1 : was ? -1 : 0));
        return { ...s, rated: { ...s.rated, [buildId]: like }, likes };
      });
    },
    async buildLikes(ids) {
      const s = ctx.get();
      return Object.fromEntries(ids.map((id) => [id, s.likes[id] ?? 0]));
    },

    async threads(q) {
      const s = ctx.get();
      const bl = blocked();
      const visible = s.threads.filter((t) => !bl.has(t.authorId) && (!t.hidden || t.authorId === ME));
      return sortThreads(searchThreads(threadsFor(visible, q.board, q.region ?? null), q.query ?? ''), q.sort);
    },
    async thread(id) {
      const s = ctx.get();
      const bl = blocked();
      const thread = s.threads.find((t) => t.id === id);
      if (!thread || bl.has(thread.authorId) || (thread.hidden && thread.authorId !== ME)) return null;
      const replies = s.replies
        .filter((r) => r.threadId === id && !bl.has(r.authorId) && (!r.hidden || r.authorId === ME))
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      return { thread, replies };
    },
    async createThread(d) {
      const p = threadProblem(d);
      if (p) throw new Error(p);
      const t: ForumThread = {
        id: newId('ft'), board: d.board, region: d.board === 'local' ? d.region : undefined, authorId: ME, title: d.title.trim(), body: d.body.trim(),
        photos: d.photos, buildId: d.buildId, createdAt: iso(), lastActivityAt: iso(), replyCount: 0,
      };
      update((s) => ({ ...s, threads: [t, ...s.threads] }));
      return t.id;
    },
    async reply(threadId, body, photos, buildId) {
      const p = replyProblem(body);
      if (p) throw new Error(p);
      const s = ctx.get();
      if (!s.threads.some((t) => t.id === threadId)) throw new Error("That thread isn't there any more.");
      const r: ForumReply = { id: newId('fr'), threadId, authorId: ME, body: body.trim(), photos, buildId, createdAt: iso(), helpfulCount: 0, helpfulByMe: false };
      ctx.set({
        ...s,
        replies: [...s.replies, r],
        threads: s.threads.map((t) => (t.id === threadId ? { ...t, replyCount: t.replyCount + 1, lastActivityAt: r.createdAt } : t)),
      });
    },
    async helpful(replyId, on) {
      const r = ctx.get().replies.find((x) => x.id === replyId);
      if (!r) throw new Error("That reply isn't there any more.");
      if (r.authorId === ME) throw new Error("You can't mark your own reply as helpful.");
      update((s) => ({
        ...s,
        replies: s.replies.map((x) =>
          x.id === replyId && x.helpfulByMe !== on ? { ...x, helpfulByMe: on, helpfulCount: Math.max(0, x.helpfulCount + (on ? 1 : -1)) } : x,
        ),
      }));
    },
    async markSolved(threadId, replyId) {
      const s = ctx.get();
      const t = s.threads.find((x) => x.id === threadId);
      if (!t) throw new Error("That thread isn't there any more.");
      if (t.authorId !== ME) throw new Error('Only the person who started the thread can mark it solved.');
      const r = replyId ? s.replies.find((x) => x.id === replyId && x.threadId === threadId) : null;
      if (replyId && !r) throw new Error("That reply isn't there any more.");
      const rec = r ? solvedRecord(s.solved, t, r, now(), ukDay(now())) : null;
      ctx.set({
        ...s,
        threads: s.threads.map((x) => (x.id === threadId ? { ...x, solvedReplyId: replyId ?? undefined } : x)),
        solved: rec ? [...s.solved, rec] : s.solved,
      });
    },
    async deleteThread(id) {
      update((s) => ({ ...s, threads: s.threads.filter((t) => !(t.id === id && t.authorId === ME)), replies: s.replies.filter((r) => r.threadId !== id || s.threads.some((t) => t.id === id && t.authorId !== ME)) }));
    },
    async deleteReply(id) {
      update((s) => {
        const r = s.replies.find((x) => x.id === id && x.authorId === ME);
        if (!r) return s;
        return {
          ...s,
          replies: s.replies.filter((x) => x !== r),
          threads: s.threads.map((t) =>
            t.id === r.threadId ? { ...t, replyCount: Math.max(0, t.replyCount - 1), solvedReplyId: t.solvedReplyId === id ? undefined : t.solvedReplyId } : t,
          ),
        };
      });
    },
    async forumRep(ids) {
      const s = ctx.get();
      return Object.fromEntries(ids.map((id) => [id, forumRepOf(s.solved, id)]));
    },

    async feed(scope, opts = {}) {
      const s = ctx.get();
      const m = me();
      const people = { me: ME, connected: connected(), blocked: blocked() };
      if (scope === 'author') {
        return s.posts.filter((p) => p.authorId === opts.author && canSee(p, people)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      }
      const homes = new Map(ctx.users().filter((u) => u.home).map((u) => [u.id, u.home]));
      const out = feedFor(s.posts, scope, { ...people, home: m?.home ?? null, miles: ctx.travelMiles(), homes });
      return opts.before ? out.filter((p) => p.createdAt < opts.before!) : out;
    },
    async post(id) {
      const s = ctx.get();
      const post = s.posts.find((p) => p.id === id);
      if (!post || !canSee(post, { me: ME, connected: connected(), blocked: blocked() })) return null;
      const bl = blocked();
      const comments = s.comments.filter((c) => c.postId === id && !bl.has(c.authorId) && (!c.hidden || c.authorId === ME)).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      return { post, comments };
    },
    async createPost(d) {
      const p = postProblem(d, me()?.home ?? null);
      if (p) throw new Error(p);
      const post: Post = {
        id: newId('po'), authorId: ME, body: d.body.trim(), photos: d.photos, at: d.at ? snapPlace(d.at) : undefined,
        placeName: d.at ? d.placeName?.trim() || undefined : undefined, visibility: d.visibility, buildId: d.buildId, createdAt: iso(),
        likeCount: 0, commentCount: 0, likedByMe: false,
      };
      update((s) => ({ ...s, posts: [post, ...s.posts] }));
      return post.id;
    },
    async likePost(id, on) {
      update((s) => ({ ...s, posts: s.posts.map((p) => (p.id === id ? withLike(p, on) : p)) }));
    },
    async comment(postId, body) {
      const p = commentProblem(body);
      if (p) throw new Error(p);
      const c: PostComment = { id: newId('pc'), postId, authorId: ME, body: body.trim(), createdAt: iso() };
      update((s) => ({ ...s, comments: [...s.comments, c], posts: s.posts.map((x) => (x.id === postId ? { ...x, commentCount: x.commentCount + 1 } : x)) }));
    },
    async deletePost(id) {
      update((s) => ({ ...s, posts: s.posts.filter((p) => !(p.id === id && p.authorId === ME)) }));
    },
    async deleteComment(id) {
      update((s) => {
        const c = s.comments.find((x) => x.id === id);
        const post = c ? s.posts.find((p) => p.id === c.postId) : undefined;
        if (!c || (c.authorId !== ME && post?.authorId !== ME)) return s;
        return { ...s, comments: s.comments.filter((x) => x !== c), posts: s.posts.map((p) => (p === post ? { ...p, commentCount: Math.max(0, p.commentCount - 1) } : p)) };
      });
    },
    async postsInBox(box) {
      const people = { me: ME, connected: connected(), blocked: blocked() };
      return postsInBox(ctx.get().posts.filter((p) => canSee(p, people)), box, now()).map((p) => ({
        id: p.id, authorId: p.authorId, at: p.at!, photo: p.photos[0], placeName: p.placeName, createdAt: p.createdAt,
      }));
    },

    async conversations() {
      const s = ctx.get();
      return s.conversations
        .filter((c) => c.memberIds.includes(ME))
        .map((c) => convView(c, s))
        .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
    },
    async messages(conversationId) {
      const s = ctx.get();
      const c = s.conversations.find((x) => x.id === conversationId && x.memberIds.includes(ME));
      if (!c) return { messages: [], readUpTo: {} };
      const bl = blocked();
      return {
        messages: s.messages.filter((m) => m.conversationId === conversationId && !(m.senderId && bl.has(m.senderId))).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
        readUpTo: c.readUpTo ?? {},
      };
    },
    async startDirect(userId) {
      const s = ctx.get();
      if (stateWith(s.connections, ME, userId, now()) !== 'connected' || s.blocks.includes(userId)) {
        throw new Error("You can only message people you're connected with.");
      }
      const found = s.conversations.find((c) => c.kind === 'direct' && c.memberIds.includes(userId));
      if (found) {
        if (!found.memberIds.includes(ME)) update((x) => ({ ...x, conversations: x.conversations.map((c) => (c === found ? { ...c, memberIds: [...c.memberIds, ME] } : c)) }));
        return found.id;
      }
      const c: Conversation = { id: newId('cv'), kind: 'direct', memberIds: [ME, userId], adminIds: [], lastMessageAt: iso(), unread: 0, canSend: true, readUpTo: { [ME]: iso() } };
      ctx.set({ ...s, conversations: [c, ...s.conversations] });
      return c.id;
    },
    async createGroup(name, memberIds) {
      const ids = Array.from(new Set(memberIds.filter((x) => x !== ME)));
      const p = groupProblem(name, ids);
      if (p) throw new Error(p);
      const s = ctx.get();
      for (const id of ids) {
        if (stateWith(s.connections, ME, id, now()) !== 'connected' || s.blocks.includes(id)) throw new Error("You can only message people you're connected with.");
      }
      const c: Conversation = {
        id: newId('cv'), kind: 'group', name: name.trim(), memberIds: [ME, ...ids], adminIds: [ME], lastMessageAt: iso(), unread: 0, canSend: true, readUpTo: { [ME]: iso() },
      };
      ctx.set({ ...s, conversations: [c, ...s.conversations] });
      addMessage(c.id, { senderId: null, body: `@${handle(ME)} started the group`, system: true });
      return c.id;
    },
    async addMembers(conversationId, userIds) {
      const s = ctx.get();
      const c = s.conversations.find((x) => x.id === conversationId);
      if (!c || !c.adminIds.includes(ME)) throw new Error("Only the group's admins can add people.");
      const add = userIds.filter((id) => !c.memberIds.includes(id));
      if (c.memberIds.length + add.length > MAX_GROUP) throw new Error('Groups can have up to 50 people.');
      for (const id of add) {
        if (stateWith(s.connections, ME, id, now()) !== 'connected' || s.blocks.includes(id)) throw new Error("You can only message people you're connected with.");
      }
      update((x) => ({ ...x, conversations: x.conversations.map((y) => (y.id === conversationId ? { ...y, memberIds: [...y.memberIds, ...add] } : y)) }));
      for (const id of add) addMessage(conversationId, { senderId: null, body: `@${handle(ME)} added @${handle(id)}`, system: true });
    },
    async removeMember(conversationId, userId) {
      const c = ctx.get().conversations.find((x) => x.id === conversationId);
      if (!c || !c.adminIds.includes(ME)) throw new Error("Only the group's admins can remove people.");
      if (userId === ME) throw new Error('Use Leave the group instead.');
      update((x) => ({
        ...x,
        conversations: x.conversations.map((y) => (y.id === conversationId ? { ...y, memberIds: y.memberIds.filter((m) => m !== userId), adminIds: y.adminIds.filter((m) => m !== userId) } : y)),
      }));
      addMessage(conversationId, { senderId: null, body: `@${handle(ME)} removed @${handle(userId)}`, system: true });
    },
    async setAdmin(conversationId, userId, admin) {
      const c = ctx.get().conversations.find((x) => x.id === conversationId);
      if (!c || !c.adminIds.includes(ME)) throw new Error("Only the group's admins can do that.");
      if (userId === ME && !admin) throw new Error('Make someone else an admin, then leave the group.');
      update((x) => ({
        ...x,
        conversations: x.conversations.map((y) =>
          y.id === conversationId ? { ...y, adminIds: admin ? Array.from(new Set([...y.adminIds, userId])) : y.adminIds.filter((m) => m !== userId) } : y,
        ),
      }));
    },
    async renameGroup(conversationId, name) {
      const c = ctx.get().conversations.find((x) => x.id === conversationId);
      if (!c || !c.adminIds.includes(ME)) throw new Error("Only the group's admins can rename it.");
      const p = groupProblem(name, ['x']);
      if (p) throw new Error(p);
      update((x) => ({ ...x, conversations: x.conversations.map((y) => (y.id === conversationId ? { ...y, name: name.trim() } : y)) }));
      addMessage(conversationId, { senderId: null, body: `@${handle(ME)} renamed the group`, system: true });
    },
    async leave(conversationId) {
      const c = ctx.get().conversations.find((x) => x.id === conversationId);
      if (!c) return;
      if (c.kind === 'group' && c.memberIds.length > 1) addMessage(conversationId, { senderId: null, body: `@${handle(ME)} left`, system: true });
      update((x) => ({
        ...x,
        conversations: x.conversations
          .map((y) => {
            if (y.id !== conversationId) return y;
            const memberIds = y.memberIds.filter((m) => m !== ME);
            let adminIds = y.adminIds.filter((m) => m !== ME);
            if (y.kind === 'group' && adminIds.length === 0 && memberIds.length) adminIds = [memberIds[0]];
            return { ...y, memberIds, adminIds };
          })
          .filter((y) => y.memberIds.length > 0),
      }));
    },
    async send(conversationId, m) {
      const p = messageProblem(m.body, m.photo, m.share);
      if (p) throw new Error(p);
      const c = (await this.conversations()).find((x) => x.id === conversationId);
      if (!c || !c.canSend) throw new Error("You can only message people you're connected with.");
      addMessage(conversationId, { senderId: ME, body: m.body.trim(), photo: m.photo, share: m.share });
      // A sample person in the chat answers after a moment (labelled Sample).
      const who = c.memberIds.filter((id) => id !== ME && isSample(id));
      if (who.length) {
        setTimeout(() => {
          const live = ctx.get().conversations.find((x) => x.id === conversationId);
          if (!live) return;
          const sender = who[Math.floor(Math.random() * who.length)];
          if (ctx.get().blocks.includes(sender)) return;
          addMessage(conversationId, { senderId: sender, body: SAMPLE_REPLIES[Math.floor(Math.random() * SAMPLE_REPLIES.length)], sample: true });
        }, delay);
      }
    },
    async markRead(conversationId) {
      update((s) => ({ ...s, conversations: s.conversations.map((c) => (c.id === conversationId ? { ...c, readUpTo: { ...c.readUpTo, [ME]: iso() } } : c)) }));
      emit({ kind: 'read', conversationId });
    },

    async report(target, id, reason, note) {
      const p = reportProblem(reason, note);
      if (p) throw new Error(p);
      update((s) => ({ ...s, reports: [...s.reports, { target, id, reason, note: note.trim(), at: iso() }].slice(-100) }));
    },
    async moderationStatus() {
      return { isStaff: false, suspended: false, until: null };
    },
    async queue() {
      return [];
    },
    async moderate() {
      throw new Error('Moderation is for the Nightshift team, signed in.');
    },
    async liftSuspension() {
      throw new Error('Moderation is for the Nightshift team, signed in.');
    },
    watch(onChange) {
      listeners.add(onChange);
      return () => listeners.delete(onChange);
    },
  };
}
