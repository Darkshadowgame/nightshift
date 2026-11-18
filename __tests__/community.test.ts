import { readFileSync } from 'fs';
import { join } from 'path';
import { coarse, distanceLabel, makesNear, peopleNear, personCards, roughMiles, buildsToRate, ANY_NEAR } from '../src/lib/carsNear';
import {
  answerConnection,
  canMessage,
  connectionsOf,
  connectLabel,
  dropPair,
  removeConnection,
  requestConnection,
  stateWith,
  type ConnectionRow,
} from '../src/lib/connections';
import { forumRepOf, ilikePattern, replyProblem, searchThreads, solvedRecord, sortThreads, threadProblem, type ForumThread, type SolvedRecord } from '../src/lib/forum';
import { conversationTitle, groupProblem, messageProblem, previewLine, seenLabel, shareBuild, shareEvent, totalUnread, type Conversation, type Message } from '../src/lib/messages';
import { BANNED_TERMS, normaliseForWords, reportProblem, textProblem, TEXT_PROBLEMS } from '../src/lib/moderation';
import { canSee, commentProblem, feedFor, locationProblem, mergeFeeds, postProblem, postsInBox, snapPlace, withLike, type Post } from '../src/lib/posts';
import { repLedger } from '../src/lib/rep';
import type { Build, NightEvent, User } from '../src/lib/types';

const MIGRATION = readFileSync(join(__dirname, '../supabase/migrations/20261117220000_community.sql'), 'utf8');
const NOW = new Date('2026-11-17T20:00:00Z');
const iso = (msAgo: number) => new Date(NOW.getTime() - msAgo).toISOString();
const DAY = 86_400_000;

describe('moderation (mirrors private.text_problem)', () => {
  it('has every word the server has, and the server has every word here', () => {
    const block = MIGRATION.slice(MIGRATION.indexOf('insert into private.banned_terms'), MIGRATION.indexOf('-- Lower case, the usual swaps'));
    let sqlTerms = Array.from(block.matchAll(/\('([a-z ]+)'\)/g)).map((m) => m[1]);
    // Later migrations that take words off the list ("delete from private.banned_terms … in (…)").
    const dir = require('path').join(__dirname, '..', 'supabase', 'migrations');
    for (const f of require('fs').readdirSync(dir).sort()) {
      const sql: string = require('fs').readFileSync(require('path').join(dir, f), 'utf8');
      for (const m of sql.matchAll(/delete from private\.banned_terms[\s\S]*?in \(([^)]*)\)/g)) {
        const gone = Array.from(m[1].matchAll(/'([a-z ]+)'/g)).map((x) => x[1]);
        sqlTerms = sqlTerms.filter((t) => !gone.includes(t));
      }
    }
    expect([...sqlTerms].sort()).toEqual([...BANNED_TERMS].sort());
  });
  it('the SQL normalises with the same swaps', () => {
    expect(MIGRATION).toContain("translate(lower(coalesce(p, '')), '0134579@$!', 'oieastgasi')");
  });
  it('undoes letter swaps and dots between letters', () => {
    expect(normaliseForWords('C.U.N.T')).toBe('cunt');
    expect(normaliseForWords('f*ck1ng')).toBe('fcking');
    expect(normaliseForWords('Sh1t')).toBe('shit');
  });
  it('catches listed words on whole words only', () => {
    expect(textProblem('what a slut')).toBe(TEXT_PROBLEMS.words);
    expect(textProblem('this is shit, it is fucked, a bit wanky, what a cunt')).toBeNull();
    expect(textProblem('S.L.U.T')).toBe(TEXT_PROBLEMS.words);
    expect(textProblem("My turbo's fucked")).toBeNull();
    expect(textProblem('Scunthorpe meet was good')).toBeNull();
    expect(textProblem('Small niggle with the gearbox')).toBeNull();
    expect(textProblem('Ignition retard and tranny fluid')).toBeNull();
  });
  it('no police spotting, but talking about the police is fine', () => {
    expect(textProblem('Police spotted on the ring road')).toBe(TEXT_PROBLEMS.police);
    expect(textProblem('Watch out for the speed trap near the bridge')).toBe(TEXT_PROBLEMS.police);
    expect(textProblem('Camera van at the A15 layby')).toBe(TEXT_PROBLEMS.police);
    expect(textProblem('Pulled by police at a meet, got a ticket for my exhaust')).toBeNull();
  });
  it('no racing on public roads; track days are fine', () => {
    expect(textProblem('Street racing on Friday')).toBe(TEXT_PROBLEMS.racing);
    expect(textProblem('Race on the A46 after the meet')).toBe(TEXT_PROBLEMS.racing);
    expect(textProblem('Roll racing down the bypass')).toBe(TEXT_PROBLEMS.racing);
    expect(textProblem('Track day at Donington, who is in?')).toBeNull();
  });
  it('the SQL has the same sentences', () => {
    for (const s of Object.values(TEXT_PROBLEMS)) expect(MIGRATION).toContain(s.replace(/'/g, "''"));
  });
  it('reports need a reason, and a note for "something else"', () => {
    expect(reportProblem(null, '')).toBe('Pick a reason.');
    expect(reportProblem('other', '')).toMatch(/Say a little/);
    expect(reportProblem('spam', '')).toBeNull();
  });
});

const user = (id: string, lat: number, lng: number): User => ({ id, handle: id, name: id, region: 'Midlands', home: { lat, lng } });
const build = (id: string, ownerId: string, extra: Partial<Build> = {}): Build => ({
  id, ownerId, kind: 'car', make: 'Honda', model: 'Civic', stockBhp: 316, weightKg: 1430, mods: [], photos: [], ...extra,
});

describe('Cars near you (mirrors people_near)', () => {
  it('rounds like private.rough_miles', () => {
    expect(roughMiles(0.4)).toBe(5);
    expect(roughMiles(5.2)).toBe(6);
    expect(roughMiles(13.2)).toBe(14);
    expect(roughMiles(33)).toBe(35);
    expect(roughMiles(87)).toBe(90);
    expect(distanceLabel(5)).toBe('Under 5 mi');
    expect(distanceLabel(12)).toBe('About 12 mi');
  });
  it('snaps homes to 0.05° first', () => {
    expect(coarse({ lat: 53.23, lng: -0.54 })).toEqual({ lat: expect.closeTo(53.25, 6), lng: expect.closeTo(-0.55, 6) });
  });
  it('lists people within the distance, not you, not blocked, nearest first', () => {
    const me = user('me', 53.23, -0.54);
    const users = [me, user('b', 53.21, -0.5), user('c', 53.4, -0.54), user('far', 50.37, -4.14), user('x', 53.22, -0.53)];
    const near = peopleNear(me, users, 25, { blocked: new Set(['x']) });
    expect(near.map((n) => n.userId)).toEqual(['b', 'c']);
    expect(near[1].miles).toBe(10);
  });
  it('cards filter by kind, class and make; people with nothing matching drop out', () => {
    const near = [{ userId: 'b', miles: 5 }, { userId: 'c', miles: 10 }];
    const users = [user('b', 0, 0), user('c', 0, 0)];
    const builds = [build('b1', 'b'), build('c1', 'c', { kind: 'bike', make: 'Yamaha', model: 'R6', stockBhp: 118, weightKg: 190 })];
    expect(personCards(near, users, builds, ANY_NEAR).map((c) => c.lead?.id)).toEqual(['b1', 'c1']);
    expect(personCards(near, users, builds, { ...ANY_NEAR, kind: 'bike' }).map((c) => c.user.id)).toEqual(['c']);
    expect(personCards(near, users, builds, { ...ANY_NEAR, make: 'honda' }).map((c) => c.user.id)).toEqual(['b']);
    expect(makesNear(near, builds)).toEqual(['Honda', 'Yamaha']);
    expect(buildsToRate(near, builds, 'me', new Set(['b1'])).map((b) => b.id)).toEqual(['c1']);
  });
});

describe('connections (mirrors the connection RPCs)', () => {
  it('request, accept, connected; messaging only when connected', () => {
    let rows: ConnectionRow[] = [];
    const r = requestConnection(rows, 'a', 'b', NOW, { blocked: false, sentToday: 0 });
    rows = r.rows;
    expect(r.result).toBe('requested');
    expect(stateWith(rows, 'a', 'b', NOW)).toBe('outgoing');
    expect(stateWith(rows, 'b', 'a', NOW)).toBe('incoming');
    expect(canMessage('outgoing', false)).toBe(false);
    rows = answerConnection(rows, 'b', 'a', true, NOW);
    expect(stateWith(rows, 'a', 'b', NOW)).toBe('connected');
    expect(canMessage('connected', false)).toBe(true);
    expect(canMessage('connected', true)).toBe(false);
    expect(connectLabel('connected')).toBe('Connected');
  });
  it('asking someone who asked you connects you', () => {
    const rows = requestConnection([], 'a', 'b', NOW, { blocked: false, sentToday: 0 }).rows;
    const r = requestConnection(rows, 'b', 'a', NOW, { blocked: false, sentToday: 0 });
    expect(r.result).toBe('connected');
  });
  it('a decline stays "Requested" for the asker for 30 days, then they can ask again', () => {
    let rows = requestConnection([], 'a', 'b', NOW, { blocked: false, sentToday: 0 }).rows;
    rows = answerConnection(rows, 'b', 'a', false, NOW);
    expect(stateWith(rows, 'a', 'b', NOW)).toBe('outgoing');
    expect(stateWith(rows, 'b', 'a', NOW)).toBe('none');
    expect(requestConnection(rows, 'a', 'b', NOW, { blocked: false, sentToday: 0 }).rows).toBe(rows);
    const later = new Date(NOW.getTime() + 31 * DAY);
    expect(stateWith(rows, 'a', 'b', later)).toBe('none');
    const again = requestConnection(rows, 'a', 'b', later, { blocked: false, sentToday: 0 });
    expect(stateWith(again.rows, 'b', 'a', later)).toBe('incoming');
  });
  it('limits and blocks', () => {
    expect(() => requestConnection([], 'a', 'a', NOW, { blocked: false, sentToday: 0 })).toThrow("You can't connect with yourself.");
    expect(() => requestConnection([], 'a', 'b', NOW, { blocked: true, sentToday: 0 })).toThrow("You can't connect with this person.");
    expect(() => requestConnection([], 'a', 'b', NOW, { blocked: false, sentToday: 20 })).toThrow(/most connection requests/);
  });
  it('remove and block end it', () => {
    let rows = requestConnection([], 'a', 'b', NOW, { blocked: false, sentToday: 0 }).rows;
    rows = answerConnection(rows, 'b', 'a', true, NOW);
    expect(removeConnection(rows, 'b', 'a')).toEqual([]);
    expect(dropPair(rows, 'a', 'b')).toEqual([]);
    expect(connectionsOf(rows, 'a', NOW)).toEqual({ b: 'connected' });
  });
});

const thread = (id: string, extra: Partial<ForumThread> = {}): ForumThread => ({
  id, board: 'advice', authorId: 'a', title: 'Clutch slipping', body: '', photos: [], createdAt: iso(DAY), lastActivityAt: iso(DAY), replyCount: 0, ...extra,
});

describe('forum', () => {
  it('checks threads and replies like the server', () => {
    expect(threadProblem({ board: 'advice', title: 'Hi', body: '', photos: [] })).toBe('Give it a title of at least 4 characters.');
    expect(threadProblem({ board: 'local', title: 'Coffee stops', body: '', photos: [] })).toBe('Pick a region for the Local board.');
    expect(threadProblem({ board: 'local', region: 'Midlands', title: 'Coffee stops', body: '', photos: [] })).toBeNull();
    expect(threadProblem({ board: 'meets', title: 'Heads up', body: 'Police spotted at the services', photos: [] })).toBe(TEXT_PROBLEMS.police);
    expect(replyProblem('  ')).toBe('Write a reply first.');
  });
  it('sorts by activity or newest, and searches titles', () => {
    const ts = [thread('1', { createdAt: iso(3 * DAY), lastActivityAt: iso(1000) }), thread('2', { createdAt: iso(DAY), title: 'Wheels for an R6' })];
    expect(sortThreads(ts, 'active').map((t) => t.id)).toEqual(['1', '2']);
    expect(sortThreads(ts, 'new').map((t) => t.id)).toEqual(['2', '1']);
    expect(searchThreads(ts, 'r6 wheels').map((t) => t.id)).toEqual(['2']);
    expect(ilikePattern('50% off_now')).toBe('%50\\%%off\\_now%');
  });
  it('Solved pays 25 once per thread, never for your own, capped against farming', () => {
    const t = { id: 't1', authorId: 'asker' };
    expect(solvedRecord([], t, { authorId: 'asker' }, NOW, '2026-11-17')).toBeNull();
    const first = solvedRecord([], t, { authorId: 'helper' }, NOW, '2026-11-17')!;
    expect(first.rep).toBe(25);
    expect(solvedRecord([first], t, { authorId: 'helper' }, NOW, '2026-11-17')).toBeNull();
    const again = solvedRecord([first], { id: 't2', authorId: 'asker' }, { authorId: 'helper' }, NOW, '2026-11-17')!;
    expect(again.rep).toBe(0);
    const day: SolvedRecord[] = ['x', 'y', 'z'].map((m, i) => ({ threadId: `d${i}`, userId: 'helper', markedBy: m, rep: 25, day: '2026-11-17', at: iso(1000) }));
    expect(solvedRecord(day, { id: 't3', authorId: 'w' }, { authorId: 'helper' }, NOW, '2026-11-17')!.rep).toBe(0);
    expect(forumRepOf([first, again], 'helper')).toEqual({ solved: 2, rep: 25 });
  });
  it('shows in the rep ledger', () => {
    const ledger = repLedger('helper', { events: [], spots: [], builds: [], awards: [], now: NOW, forumRep: { solved: 2, rep: 25 } });
    expect(ledger.lines.find((l) => l.source === 'forum')).toEqual({ source: 'forum', label: 'Answers marked solved', count: 2, rep: 25 });
    expect(ledger.total).toBe(25);
  });
});

const post = (id: string, extra: Partial<Post> = {}): Post => ({
  id, authorId: 'a', body: 'Hi', photos: [], visibility: 'public', createdAt: iso(1000), likeCount: 0, commentCount: 0, likedByMe: false, ...extra,
});

describe('feed posts', () => {
  const home = { lat: 53.23, lng: -0.54 };
  it('never within about 1 km of your home area, UK only', () => {
    expect(locationProblem({ lat: 53.232, lng: -0.542 }, home)).toMatch(/within about 1 km of your home area/);
    expect(locationProblem({ lat: 53.3, lng: -0.6 }, home)).toBeNull();
    expect(locationProblem({ lat: 48.85, lng: 2.35 }, home)).toBe('Places are for the UK only.');
    expect(postProblem({ body: ' ', photos: [], visibility: 'public' }, home)).toBe('Write something or add a photo.');
    expect(postProblem({ body: 'Speed trap at the A15 roundabout', photos: [], visibility: 'public' }, home)).toBe(TEXT_PROBLEMS.police);
    expect(commentProblem('')).toBe('Write a comment first.');
    expect(snapPlace({ lat: 53.123456, lng: -0.987654 })).toEqual({ lat: 53.1235, lng: -0.9877 });
  });
  it('the SQL refuses the same 1 km', () => {
    expect(MIGRATION).toContain("That''s within about 1 km of your home area, so it can''t be shared. Pick a spot further away.");
  });
  it('connections-only posts are for connections; blocks hide everything', () => {
    const ctx = { me: 'me', connected: new Set(['a']), blocked: new Set(['z']) };
    expect(canSee(post('1', { visibility: 'connections' }), ctx)).toBe(true);
    expect(canSee(post('2', { visibility: 'connections', authorId: 'b' }), ctx)).toBe(false);
    expect(canSee(post('3', { authorId: 'z' }), ctx)).toBe(false);
    expect(canSee(post('4', { authorId: 'me', hidden: true }), ctx)).toBe(true);
  });
  it('local feed: placed near you or by people living near you; connections feed', () => {
    const homes = new Map([['a', { lat: 53.2, lng: -0.5 }], ['far', { lat: 50.37, lng: -4.14 }]]);
    const ctx = { me: 'me', home, miles: 25, homes, connected: new Set(['a']), blocked: new Set<string>() };
    const posts = [post('near-home', { authorId: 'a' }), post('far-but-placed', { authorId: 'far', at: { lat: 53.3, lng: -0.6 } }), post('far', { authorId: 'far' })];
    expect(feedFor(posts, 'local', ctx).map((p) => p.id).sort()).toEqual(['far-but-placed', 'near-home']);
    expect(feedFor(posts, 'connections', ctx).map((p) => p.id)).toEqual(['near-home']);
  });
  it('map box and likes', () => {
    const ps = [post('1', { at: { lat: 53.3, lng: -0.6 } }), post('2', { at: { lat: 53.3, lng: -0.6 }, createdAt: iso(40 * DAY) })];
    expect(postsInBox(ps, { south: 53, west: -1, north: 54, east: 0 }, NOW).map((p) => p.id)).toEqual(['1']);
    expect(withLike(post('1'), true)).toMatchObject({ likedByMe: true, likeCount: 1 });
    expect(withLike(post('1', { likedByMe: true, likeCount: 1 }), true).likeCount).toBe(1);
  });
});

describe('messages', () => {
  const conv: Conversation = { id: 'c', kind: 'direct', memberIds: ['me', 'dan'], adminIds: [], lastMessageAt: iso(0), unread: 2, canSend: true, readUpTo: { dan: iso(0) } };
  const msg = (id: string, senderId: string | null, ago: number): Message => ({ id, conversationId: 'c', senderId, body: 'hi', createdAt: iso(ago) });
  it('titles, previews and unread', () => {
    const handle = (id: string) => (id === 'dan' ? 'dan_r' : undefined);
    expect(conversationTitle(conv, 'me', handle)).toBe('@dan_r');
    expect(previewLine({ ...conv, last: { body: 'Hello', senderId: 'me', kind: 'text' } }, 'me', handle)).toBe('You: Hello');
    expect(previewLine({ ...conv, kind: 'group', name: 'NR', last: { body: '', senderId: 'dan', kind: 'photo' } }, 'me', handle)).toBe('@dan_r: Photo');
    expect(totalUnread([conv, { ...conv, unread: 1 }])).toBe(3);
  });
  it('Seen once the other person has read up to your last message', () => {
    expect(seenLabel(conv, [msg('1', 'dan', 2000), msg('2', 'me', 1000)], 'me')).toBe('Seen');
    expect(seenLabel({ ...conv, readUpTo: { dan: iso(5000) } }, [msg('2', 'me', 1000)], 'me')).toBeNull();
    expect(seenLabel(conv, [msg('2', 'dan', 1000)], 'me')).toBeNull();
    expect(seenLabel({ ...conv, kind: 'group', memberIds: ['me', 'a', 'b'], readUpTo: { a: iso(0), b: iso(0) } }, [msg('2', 'me', 1000)], 'me')).toBe('Seen by 2');
  });
  it('rules', () => {
    expect(messageProblem(' ')).toBe('Write a message first.');
    expect(messageProblem('', 'photo.jpg')).toBeNull();
    expect(groupProblem('', ['a'])).toBe('Give the group a name.');
    expect(groupProblem('NR', [])).toBe('Add at least one person.');
    expect(groupProblem('NR', Array.from({ length: 50 }, (_, i) => `u${i}`))).toBe('Groups can have up to 50 people.');
  });
  it('shared cards never carry a stop', () => {
    const e = { id: 'e1', type: 'meet', title: 'Friday meet', startsAt: iso(-DAY), areaName: 'Lincoln area', stops: [{ id: 's', name: 'Secret car park', at: { lat: 1, lng: 1 } }] } as unknown as NightEvent;
    const card = shareEvent(e, NOW);
    expect(card.subtitle).toContain('Lincoln area');
    expect(JSON.stringify(card)).not.toContain('Secret');
    expect(shareBuild(build('b1', 'a')).subtitle).toMatch(/^Class [SABCD] · \d+ bhp · 0 mods$/);
  });
});

describe('Community feed: near you plus connections (Redesign 2, 3.7)', () => {
  const p = (id: string, createdAt: string) => ({ id, createdAt }) as Post;
  test('each post once, newest first', () => {
    const merged = mergeFeeds([p('a', '2026-11-18T10:00:00Z'), p('b', '2026-11-18T09:00:00Z')], [p('b', '2026-11-18T09:00:00Z'), p('c', '2026-11-18T11:00:00Z')]);
    expect(merged!.map((x) => x.id)).toEqual(['c', 'a', 'b']);
  });
  test('null until either has loaded; one half is enough', () => {
    expect(mergeFeeds(null, null)).toBeNull();
    expect(mergeFeeds(null, [p('x', '2026-11-18T09:00:00Z')])!.map((x) => x.id)).toEqual(['x']);
  });
});
