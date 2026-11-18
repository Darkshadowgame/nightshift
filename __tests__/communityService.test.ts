import { conversationFromRow, messageFromRow, postFromRow, queueFromRow, replyFromRow, threadFromRow } from '../src/lib/backend/community';
import { createLocalCommunity, emptyDemoCommunity, seedDemoCommunity, type DemoCommunity } from '../src/lib/communityService';
import { ME } from '../src/data/seed';
import type { User } from '../src/lib/types';

const NOW = new Date('2026-11-17T20:00:00Z');
const HOME = { lat: 52.63, lng: -1.7 };
const users: User[] = [
  { id: ME, handle: 'you', name: 'You', region: 'Midlands', home: HOME },
  { id: 'dan', handle: 'dan_r', name: 'Dan', region: 'Midlands', home: { lat: 52.63, lng: -1.71 } },
  { id: 'kez', handle: 'kez_typer', name: 'Kez', region: 'Midlands', home: { lat: 52.52, lng: -1.47 } },
  { id: 'liv', handle: 'liv_on_two', name: 'Liv', region: 'Midlands', home: { lat: 52.92, lng: -1.48 } },
  { id: 'tom', handle: 'tomtom_gr', name: 'Tom', region: 'Midlands', home: { lat: 52.64, lng: -1.68 } },
];

function demo(withRequest = false) {
  let state: DemoCommunity = seedDemoCommunity(emptyDemoCommunity(), HOME, 'Midlands', NOW);
  if (withRequest) state = { ...state, connections: [...state.connections, { from: 'kez', to: ME, status: 'pending', createdAt: NOW.toISOString() }] };
  const svc = createLocalCommunity({ get: () => state, set: (s) => (state = s), users: () => users, travelMiles: () => 25, now: () => NOW, replyDelay: 10 });
  return { svc, get: () => state };
}

describe('the demo Community (LocalCommunity)', () => {
  it('lays out sample threads, posts, chats and requests, all labelled Sample', async () => {
    const { svc } = demo();
    const threads = await svc.threads({ board: 'all', sort: 'active' });
    expect(threads.length).toBeGreaterThan(5);
    expect(threads.every((t) => t.sample)).toBe(true);
    const conns = await svc.connections();
    expect(conns.mo).toBe('connected');
    // The first people at tonight's live meet are not connected yet, so task 7 can connect with them.
    expect(conns.dan).toBeUndefined();
    expect(conns.em).toBeUndefined();
    // Nothing waiting on a first open (REVIEW-10 #13): no requests, nothing unread.
    expect(Object.values(conns)).not.toContain('incoming');
    const convs = await svc.conversations();
    expect(convs.map((c) => c.id)).toEqual(expect.arrayContaining(['cv-mo', 'cv-nr']));
    expect(convs.every((c) => c.unread === 0)).toBe(true);
  });
  it('messages only between connected people, and a block stops them', async () => {
    const { svc } = demo();
    await expect(svc.startDirect('tom')).rejects.toThrow("You can only message people you're connected with.");
    await svc.send('cv-mo', { body: 'On my way' });
    expect((await svc.messages('cv-mo')).messages.pop()!.body).toBe('On my way');
    await svc.block('mo');
    expect((await svc.connections()).mo).toBeUndefined();
    await expect(svc.send('cv-mo', { body: 'hello?' })).rejects.toThrow("You can only message people you're connected with.");
    expect((await svc.threads({ board: 'all', sort: 'new' })).some((t) => t.authorId === 'mo')).toBe(false);
  });
  it('accepting a request connects you; groups only take connections', async () => {
    const { svc } = demo(true);
    await svc.answerConnection('kez', true);
    expect((await svc.connections()).kez).toBe('connected');
    await expect(svc.createGroup('Sunday', ['tom'])).rejects.toThrow("You can only message people you're connected with.");
    const id = await svc.createGroup('Sunday', ['kez', 'mo']);
    const c = (await svc.conversations()).find((x) => x.id === id)!;
    expect(c.adminIds).toEqual([ME]);
    expect((await svc.messages(id)).messages[0].system).toBe(true);
  });
  it('forum: post, reply, helpful, solved (your own reply earns nothing)', async () => {
    const { svc, get } = demo();
    await expect(svc.createThread({ board: 'meets', title: 'Heads up', body: 'Police spotted on the bypass', photos: [] })).rejects.toThrow(/police/);
    const id = await svc.createThread({ board: 'advice', title: 'Best tyres for winter?', body: '', photos: [] });
    await svc.reply(id, 'All-seasons', []);
    const t = await svc.thread(id);
    expect(t!.thread.replyCount).toBe(1);
    await svc.markSolved(id, t!.replies[0].id);
    expect(get().solved.filter((r) => r.threadId === id)).toEqual([]);
    await expect(svc.helpful(t!.replies[0].id, true)).rejects.toThrow("You can't mark your own reply as helpful.");
  });
  it('posts: never near home; local and connections feeds', async () => {
    const { svc } = demo();
    await expect(svc.createPost({ body: 'Home', photos: [], at: { lat: 52.631, lng: -1.701 }, visibility: 'public' })).rejects.toThrow(/1 km of your home area/);
    const id = await svc.createPost({ body: 'Car park', photos: [], at: { lat: 52.7, lng: -1.8 }, placeName: 'Car park', visibility: 'public' });
    expect((await svc.feed('local')).some((p) => p.id === id)).toBe(true);
    expect((await svc.feed('connections')).some((p) => p.id === 'po-5')).toBe(true);
    await svc.likePost(id, true);
    expect((await svc.post(id))!.post.likeCount).toBe(1);
    expect((await svc.postsInBox({ south: 52, west: -2.5, north: 53.5, east: -1 })).some((p) => p.id === id)).toBe(true);
  });
  it('reports need a reason; staff tools are signed-in only', async () => {
    const { svc, get } = demo();
    await svc.report('post', 'po-1', 'spam', '');
    expect(get().reports).toHaveLength(1);
    expect(await svc.moderationStatus()).toEqual({ isStaff: false, suspended: false, until: null });
  });
});

describe('server rows to the app (backend/community.ts)', () => {
  const sign = (p: string) => `https://signed/${p}`;
  it('threads, replies and posts sign their photos', () => {
    const t = threadFromRow({ id: 't', board: 'local', region: 'East', author_id: 'a', title: 'T', body: 'B', photos: ['a/forum/1.jpg'], build_id: null, created_at: 'x', last_activity_at: 'y', reply_count: 2, solved_reply_id: 'r', hidden_at: null }, sign);
    expect(t).toMatchObject({ region: 'East', photos: ['https://signed/a/forum/1.jpg'], replyCount: 2, solvedReplyId: 'r' });
    expect(t.hidden).toBeUndefined();
    const r = replyFromRow({ id: 'r', thread_id: 't', author_id: 'b', body: 'x', photos: null, build_id: null, created_at: 'z', helpful_count: 3, hidden_at: 'h' }, new Set(['r']));
    expect(r).toMatchObject({ helpfulCount: 3, helpfulByMe: true, hidden: true, photos: [] });
    const p = postFromRow({ id: 'p', author_id: 'a', body: 'b', photos: [], lat: 52.1, lng: -1.2, place_name: 'Spot', visibility: 'connections', build_id: null, created_at: 'c', like_count: 1, comment_count: 0, liked_by_me: true, hidden: false });
    expect(p).toMatchObject({ at: { lat: 52.1, lng: -1.2 }, placeName: 'Spot', visibility: 'connections', likedByMe: true });
  });
  it('conversations, messages and the moderation queue', () => {
    const c = conversationFromRow({ id: 'c', kind: 'group', name: 'NR', created_at: 'a', last_message_at: 'b', member_ids: ['a', 'b'], admin_ids: ['a'], unread: 2, last_body: '', last_sender: 'b', last_kind: 'photo', can_send: true });
    expect(c).toMatchObject({ name: 'NR', unread: 2, last: { kind: 'photo', senderId: 'b' }, canSend: true });
    const m = messageFromRow({ id: 'm', conversation_id: 'c', sender_id: null, body: '@a left', photo_path: 'a/c/1.jpg', share: null, system: true, created_at: 'x' }, sign);
    expect(m).toMatchObject({ senderId: null, system: true, photo: 'https://signed/a/c/1.jpg' });
    const q = queueFromRow({ target: 'chat', target_id: 't', target_user: 'u', reports: 3, reasons: '{harassment,hate}', first_reported: 'f', report_id: 'r', excerpt: 'x', notes: null });
    expect(q.reasons).toEqual(['harassment', 'hate']);
  });
});
