import type { ConnectionRow } from '../lib/connections';
import type { ForumReply, ForumThread, SolvedRecord } from '../lib/forum';
import type { Conversation, Message } from '../lib/messages';
import type { Post, PostComment } from '../lib/posts';
import type { LatLng } from '../lib/types';
import { SAMPLE_PHOTOS } from './samplePhotos';
import { ME, samplePhotoRefs } from './seed';

/**
 * The demo's Community: made-up threads, posts and chats between the sample
 * people (all labelled Sample), laid out round your own home area. Nothing
 * here is real and nothing is sent anywhere.
 */

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

export interface CommunitySample {
  connections: ConnectionRow[];
  threads: ForumThread[];
  replies: ForumReply[];
  solved: SolvedRecord[];
  posts: Post[];
  comments: PostComment[];
  conversations: Conversation[];
  messages: Message[];
  /** Sample likes per build (Rate builds). */
  likes: Record<string, number>;
}

export function communitySample(now: Date, home: LatLng, region: string): CommunitySample {
  const ago = (ms: number) => new Date(now.getTime() - ms).toISOString();
  const near = (dLat: number, dLng: number): LatLng => ({ lat: Math.round((home.lat + dLat) * 1e4) / 1e4, lng: Math.round((home.lng + dLng) * 1e4) / 1e4 });

  const connections: ConnectionRow[] = [
    // Not @dan_r or anyone at tonight's live meet (REVIEW-11 #15): the first person a newcomer meets
    // there can still be connected with.
    { from: ME, to: 'mo', status: 'accepted', createdAt: ago(30 * DAY), answeredAt: ago(30 * DAY) },
    { from: 'aimee', to: ME, status: 'accepted', createdAt: ago(20 * DAY), answeredAt: ago(19 * DAY) },
    // No waiting requests and nothing unread on a first open (REVIEW-10 #13): badges only come from
    // something that happens (a sample person answering, a reply in a chat).
  ];

  const t = (
    id: string,
    board: ForumThread['board'],
    authorId: string,
    title: string,
    body: string,
    created: number,
    extra: Partial<ForumThread> = {},
  ): ForumThread => ({
    id, board, authorId, title, body, photos: [], createdAt: ago(created), lastActivityAt: ago(created), replyCount: 0, sample: true, ...extra,
  });
  const threads: ForumThread[] = [
    t('ft-clutch', 'advice', 'kez', 'Clutch slipping in 3rd after a Stage 2 map',
      'Had the map done last week and now it slips in 3rd on full boost. Stock clutch, 62k miles. Is it worth an uprated one or just a new standard clutch?', 2 * DAY, { buildId: 'b-kez-0' }),
    t('ft-rs3', 'builds', 'mo', 'RS3 8V build: from stock to Stage 2+',
      'Starting a thread for the RS3. Intake, downpipe with a sports cat, intercooler and a custom map so far. Next up: brakes before any more power.', 9 * DAY, { buildId: 'b-mo-0' }),
    t('ft-winter-r1', 'bikes', 'aimee', 'Winter storage for an R1?',
      'First winter with the R1. Garage is dry but cold. Battery tender and fuel stabiliser, anything else?', 4 * DAY),
    t('ft-ceramic', 'detailing', 'bex', 'Ceramic coat or wax on a daily?',
      'GTI does 15k a year in all weather. Is a ceramic coat worth it over a good wax every few months?', 6 * DAY),
    t('ft-show', 'meets', 'dan', 'Going to the Sunday show? Parking tips',
      'Last year the show car park filled by 9. Arrive early and use the overflow field, the marshals are sound.', 1 * DAY),
    t('ft-arches', 'for_sale', 'ash', 'Wanted: genuine Saxo VTS rear arches',
      'Looking for a pair of genuine rear arches, any colour. Collection anywhere in the area. Posts only, sort payment in person.', 3 * DAY,
      { listing: { kind: 'wanted', pricePence: 8000, handover: 'either' } }),
    t('ft-focus-wheels', 'for_sale', 'cal', 'Focus RS Mk3 forged 19s with tyres',
      'Genuine Ford forged 19s off my RS, swapped for 18s for track days. One light kerb mark, tyres at 5 mm. Fits any Focus RS or ST Mk3. Viewing welcome.', 1 * DAY + 4 * HOUR,
      { buildId: 'b-cal-0', listing: { kind: 'sale', pricePence: 85000, ono: true, condition: 'good', handover: 'collection' } }),
    t('ft-first-car', 'cars', 'tom', 'GR Yaris or Civic Type R as a first proper car?',
      'Insurance quotes are similar for both at 24. Which would you live with every day?', 2 * DAY + 5 * HOUR),
    t('ft-local-coffee', 'local', 'priya', 'Cafes that welcome a few cars on a Sunday?',
      'Looking for somewhere friendly for a small group. Not after a big meet, just coffee and a chat.', 5 * DAY, { region }),
    // Everyone (the whole UK) and Local threads, some in make or model groups (forumGroups.ts).
    t('ft-cupra-fault', 'advice', 'mo', 'Cupra Formentor: what does this gearbox warning mean?',
      'Amber gearbox symbol with a message to see a dealer, came up on the motorway then cleared at the next start. 2022 VZ2 on 14k miles. Anyone had it?', 1 * DAY + 2 * HOUR,
      { groupKey: 'cupra:formentor' }),
    t('ft-leon-dsg', 'advice', 'kez', 'Leon DSG juddering at low speed: software or clutch?',
      'Judders pulling away on a hill and in queues. Service history is clean. Was it a software update or a new clutch pack for you?', 3 * DAY + HOUR, { groupKey: 'seat:leon' }),
    t('ft-n54-hpfp', 'cars', 'dan', '335i N54: the signs of a failing high pressure fuel pump',
      'Long crank and a stumble over 4,000 rpm on mine. What did yours do before it went, and who did the job?', 4 * DAY + 3 * HOUR, { groupKey: 'bmw:335i' }),
    t('ft-leon-cruise', 'meets', 'cal', 'Leon owners: Sunday morning coffee run?',
      'Easy road, a cafe with space for a dozen cars and back by lunch. All Leons welcome, any age.', 1 * DAY + 6 * HOUR, { region, groupKey: 'seat:leon' }),
    t('ft-bmw-garage', 'advice', 'priya', 'Independent BMW specialist round here?',
      'Looking for someone good with N-series engines who is not main dealer prices. Who do you use?', 2 * DAY + 8 * HOUR, { region, groupKey: 'bmw' }),
    // Fault codes, solved threads (the group "Common problems") and sold prices ("recently sold for").
    t('ft-p0420', 'advice', 'cal', 'P0420 catalyst code on a 335i: cat or sensor?',
      'Engine light on with P0420 after a long run. Idle is fine and it passed its MOT last year. Do I need a new cat or is it the rear lambda sensor?', 5 * DAY + 2 * HOUR,
      { groupKey: 'bmw:335i' }),
    t('ft-n54-chargepipe', 'for_sale', 'ash', '335i N54 uprated charge pipe',
      'Aluminium charge pipe, fitted for a year, no leaks. Posts only, collection welcome.', 30 * DAY,
      { groupKey: 'bmw:335i', listing: { kind: 'sale', pricePence: 6000, ono: true, condition: 'good', handover: 'either', soldAt: ago(22 * DAY), soldPricePence: 5500 } }),
    t('ft-n54-chargepipe-2', 'for_sale', 'tom', 'N54 charge pipe and boost tap kit',
      'Complete kit off a 2010 335i, boxed and unused.', 24 * DAY,
      { groupKey: 'bmw:335i', listing: { kind: 'sale', pricePence: 4500, condition: 'like_new', handover: 'postage', soldAt: ago(16 * DAY), soldPricePence: 4200 } }),
    t('ft-n54-chargepipe-3', 'for_sale', 'cal', 'Charge pipe upgrade for N54 335i',
      'Swapped for a bigger kit, this one is in good order.', 18 * DAY,
      { groupKey: 'bmw:335i', listing: { kind: 'sale', pricePence: 4000, ono: true, condition: 'good', handover: 'collection', soldAt: ago(9 * DAY), soldPricePence: 3800 } }),
  ];

  const r = (id: string, threadId: string, authorId: string, body: string, created: number, helpfulCount = 0): ForumReply => ({
    id, threadId, authorId, body, photos: [], createdAt: ago(created), helpfulCount, helpfulByMe: false, sample: true,
  });
  const replies: ForumReply[] = [
    r('fr-1', 'ft-clutch', 'dan', 'The stock FK8 clutch is borderline at Stage 1. Go uprated organic if it’s a daily, paddle if it’s mostly track.', 2 * DAY - 2 * HOUR, 4),
    r('fr-2', 'ft-clutch', 'mo', 'Check the slave cylinder and fluid before you spend money. Mine was the slave.', 2 * DAY - 5 * HOUR, 1),
    r('fr-3', 'ft-rs3', 'aimee', 'Proper. Which brake kit are you looking at?', 8 * DAY, 0),
    r('fr-4', 'ft-rs3', 'cal', 'Do the brakes first, you won’t regret it.', 7 * DAY, 2),
    r('fr-5', 'ft-winter-r1', 'sully', 'Tyre pressures up a bit, paddock stands so it’s not on the tyres all winter, and a breathable cover.', 4 * DAY - 3 * HOUR, 3),
    r('fr-6', 'ft-winter-r1', 'liv', 'Spray the chain and any bare metal. Damp gets everywhere.', 3 * DAY, 1),
    r('fr-7', 'ft-ceramic', 'em', 'Ceramic for a daily, every time. Washing gets so much quicker.', 5 * DAY, 2),
    r('fr-8', 'ft-show', 'tom', 'Cheers. Bringing the Yaris, first show.', 20 * HOUR, 0),
    r('fr-9', 'ft-first-car', 'jord', 'Yaris. It’s a rally car with number plates.', 2 * DAY, 1),
    r('fr-11', 'ft-cupra-fault', 'tom', 'Mine did the same after a software update. A dealer re-flashed the gearbox control unit and it has been fine since.', 20 * HOUR, 3),
    r('fr-12', 'ft-cupra-fault', 'aimee', 'Ask them to check for open campaigns on the VIN first. It is often free.', 14 * HOUR, 2),
    r('fr-13', 'ft-leon-dsg', 'jord', 'Wet clutch DSGs hate creeping in traffic. A software relearn sorted mine, a clutch pack was the next step.', 3 * DAY, 2),
    r('fr-14', 'ft-leon-cruise', 'liv', 'Count me in. Can we leave from the services at 9?', 22 * HOUR, 0),
    r('fr-15', 'ft-bmw-garage', 'sully', 'There is a good one on an industrial estate near the ring road. Message me and I will send the name.', 2 * DAY, 1),
    r('fr-16', 'ft-p0420', 'sully', 'Swap the rear lambda sensor first, it is a fraction of the price of a cat. Mine threw P0420 for the same reason and cleared after the sensor.', 5 * DAY, 5),
    r('fr-17', 'ft-p0420', 'dan', 'Check for an exhaust leak before the sensor too. A blow at the downpipe flange gave me a false P0420.', 4 * DAY + 6 * HOUR, 2),
    r('fr-18', 'ft-n54-hpfp', 'sully', 'Mine went at 70k. Long crank was the first sign. A specialist replaced the pump under warranty extension, so ask BMW first.', 4 * DAY, 6),
    r('fr-10', 'ft-first-car', 'cal', 'Civic is the better daily. Bigger boot, comfier on the motorway.', 2 * DAY - 3 * HOUR, 2),
  ];
  for (const th of threads) {
    const mine = replies.filter((x) => x.threadId === th.id);
    th.replyCount = mine.length;
    if (mine.length) th.lastActivityAt = mine.map((x) => x.createdAt).sort().pop()!;
  }
  threads.find((x) => x.id === 'ft-clutch')!.solvedReplyId = 'fr-1';
  for (const [thread, reply] of [['ft-p0420', 'fr-16'], ['ft-n54-hpfp', 'fr-18'], ['ft-leon-dsg', 'fr-13'], ['ft-cupra-fault', 'fr-11']]) threads.find((x) => x.id === thread)!.solvedReplyId = reply;
  const solved: SolvedRecord[] = [{ threadId: 'ft-clutch', userId: 'dan', markedBy: 'kez', rep: 25, day: ago(2 * DAY).slice(0, 10), at: ago(2 * DAY) }];

  const p = (id: string, authorId: string, body: string, created: number, extra: Partial<Post> = {}): Post => ({
    // A post shows its own photo of the same car when it has one (Review 19: one photo on at most two
    // screens), else its build's photo, so the post and the linked build match (REVIEW-9 decision 9).
    id, authorId, body, photos: samplePhotoRefs(SAMPLE_PHOTOS[id] ? id : extra.buildId ?? id), visibility: 'public', createdAt: ago(created), likeCount: 0, commentCount: 0, likedByMe: false, sample: true, ...extra,
  });
  const posts: Post[] = [
    p('po-1', 'dan', 'Fresh from a wash, parked up outside work. The trees are turning, so the leaves are back on the paint.', 3 * HOUR,
      { at: near(0.05, -0.08), placeName: 'Office car park', buildId: 'b-dan-0', likeCount: 12, commentCount: 2 }),
    p('po-2', 'aimee', 'First ride out since the new end can went on. Sounds mint and it’s still road legal.', 7 * HOUR, { buildId: 'b-aimee-0', likeCount: 8 }),
    p('po-3', 'mo', 'Back from the rolling road, and the map’s done. Pulls hard all the way now. Brakes next.', 26 * HOUR,
      { at: near(-0.04, 0.07), placeName: 'Rolling road', buildId: 'b-mo-0', likeCount: 21, commentCount: 1 }),
    p('po-4', 'liv', 'Out early this morning, roads were empty and dry for once.', 30 * HOUR, { at: near(0.11, 0.09), placeName: 'Reservoir viewpoint', buildId: 'b-liv-0', likeCount: 5 }),
    p('po-5', 'mo', 'Connections only: wash day Saturday, 10am. Bring your own snow foam.', 2 * DAY, { visibility: 'connections', likeCount: 3 }),
    // People at tonight's live meet have posts on their profiles too (REVIEW-11 #15).
    p('po-7', 'jord', 'New tyres on the ST. Grip for days, ready for tonight.', 5 * HOUR, { buildId: 'b-jord-0', likeCount: 9, commentCount: 0 }),
    p('po-8', 'em', 'i30 N washed and ready. See you at the car park.', 9 * HOUR, { buildId: 'b-em-0', likeCount: 6 }),
    p('po-6', 'tom', 'GR Yaris a year in: Stage 1 remap, coilovers and forged 18s so far. What would you do next?', 3 * DAY, { buildId: 'b-tom-0', likeCount: 17, commentCount: 1 }),
  ];
  const c = (id: string, postId: string, authorId: string, body: string, created: number): PostComment => ({ id, postId, authorId, body, createdAt: ago(created), sample: true });
  const comments: PostComment[] = [
    c('pc-1', 'po-1', 'mo', 'Proper shot that.', 2 * HOUR),
    c('pc-2', 'po-1', 'aimee', 'Wish my work car park looked like that.', 90 * MIN),
    c('pc-3', 'po-3', 'cal', 'Do the brakes first, honestly.', 20 * HOUR),
    c('pc-4', 'po-6', 'jord', 'Tyres. Then drive it a lot.', 2 * DAY),
  ];

  const conversations: Conversation[] = [
    {
      id: 'cv-mo', kind: 'direct', memberIds: [ME, 'mo'], adminIds: [], lastMessageAt: ago(20 * MIN), unread: 0, canSend: true, sample: true,
      readUpTo: { [ME]: ago(20 * MIN), mo: ago(20 * MIN) },
    },
    {
      id: 'cv-nr', kind: 'group', name: 'NightRunners', memberIds: ['dan', ME, 'mo', 'aimee'], adminIds: ['dan'], lastMessageAt: ago(35 * MIN), unread: 0, canSend: true, sample: true,
      readUpTo: { [ME]: ago(35 * MIN), dan: ago(35 * MIN), mo: ago(40 * MIN), aimee: ago(35 * MIN) },
    },
  ];
  const m = (id: string, conversationId: string, senderId: string | null, body: string, created: number, extra: Partial<Message> = {}): Message => ({
    id, conversationId, senderId, body, createdAt: ago(created), sample: true, ...extra,
  });
  const messages: Message[] = [
    m('ms-1', 'cv-mo', 'mo', 'You coming Sunday?', 2 * HOUR),
    m('ms-2', 'cv-mo', ME, 'Should be. Need to get the new wheels on first.', 110 * MIN),
    m('ms-3', 'cv-mo', 'mo', 'Send pics when they’re on', 20 * MIN),
    m('ms-4', 'cv-nr', null, '@dan_r started the group', 10 * DAY, { system: true }),
    m('ms-5', 'cv-nr', 'mo', 'Wash day Saturday? The hand car wash on the retail park opens at 9.', 4 * HOUR),
    m('ms-6', 'cv-nr', 'aimee', 'I’m in', 50 * MIN),
    m('ms-7', 'cv-nr', 'dan', 'Same. Here’s the M4 after its detail', 35 * MIN, {
      share: { kind: 'build', id: 'b-dan-0', title: 'BMW M4 Competition', subtitle: 'Sample build' },
    }),
  ];

  const likes: Record<string, number> = { 'b-dan-0': 14, 'b-mo-0': 22, 'b-aimee-0': 9, 'b-kez-0': 11, 'b-tom-0': 6 };

  return { connections, threads, replies, solved, posts, comments, conversations, messages, likes };
}

/** What a sample person says back in the demo (labelled Sample). */
/** The demo's auto-replies: each one follows any opener (a hello, a compliment, a question about a meet). */
export const SAMPLE_REPLIES = ['Cheers!', 'Thanks, appreciate it.', 'Cheers, see you at the next one.', 'Nice one, thanks.'];
