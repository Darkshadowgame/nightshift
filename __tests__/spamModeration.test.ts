import { readFileSync } from 'fs';
import { join } from 'path';
import {
  actionLine,
  banMessage,
  canActOn,
  canBan,
  duplicateProblem,
  isNearDuplicate,
  isSelling,
  normaliseForSpam,
  rememberSent,
  reportReasonLabel,
  roleChoices,
  sellingHint,
  similarity,
  SELLING_HINT,
  SPAM_PROBLEMS,
  type SentText,
} from '../src/lib/moderation';

const SQL = readFileSync(join(__dirname, '../supabase/migrations/20261118180000_spam_selling_member_moderation.sql'), 'utf8');
const NOW = Date.UTC(2026, 10, 18, 12, 0);

describe('normaliseForSpam', () => {
  it('lower cases, drops punctuation and emoji, collapses spaces', () => {
    expect(normaliseForSpam('  Check   OUT my page!!! 🚗🔥 ')).toBe('check out my page');
    expect(normaliseForSpam("Don't\nmiss\tit")).toBe('dont miss it');
  });
});

describe('near duplicates', () => {
  it('matches the same text however it is dressed up', () => {
    expect(isNearDuplicate(normaliseForSpam('Follow my detailing page for deals in Leeds!'), normaliseForSpam('follow my DETAILING page for deals in leeds 🚗'))).toBe(true);
  });
  it('matches a near copy at 90% alike, not a different message', () => {
    const a = normaliseForSpam('Follow my detailing page for deals in Leeds');
    expect(similarity(a, normaliseForSpam('Follow my detailing page for deal in Leeds'))).toBeGreaterThanOrEqual(0.9);
    expect(isNearDuplicate(a, normaliseForSpam('Follow my detailing page for deal in Leeds'))).toBe(true);
    expect(isNearDuplicate(a, normaliseForSpam('Anyone going to Ace Cafe on Sunday night?'))).toBe(false);
  });
  it('needs short texts to match exactly, and never counts very short ones', () => {
    expect(isNearDuplicate('see you there mate', 'see you there mat')).toBe(false);
    expect(isNearDuplicate('nice one', 'nice one')).toBe(false);
    expect(isNearDuplicate('see you there mate', 'see you there mate')).toBe(true);
  });
});

describe('duplicateProblem (the server count)', () => {
  const send = (sent: SentText[], text: string, message = false, place: string | null = null) => rememberSent(sent, text, { message, place, now: NOW });
  it('allows two copies in 24 hours across kinds, refuses the third', () => {
    let sent: SentText[] = [];
    sent = send(sent, 'Cheap remaps this weekend, message me');
    expect(duplicateProblem('Cheap remaps this weekend, message me', sent, { message: false, now: NOW })).toBeNull();
    sent = send(sent, 'cheap remaps this weekend message me');
    expect(duplicateProblem('Cheap remaps this weekend!! message me', sent, { message: false, now: NOW })).toBe(SPAM_PROBLEMS.duplicate);
  });
  it('forgets copies older than a day', () => {
    const old = [{ norm: normaliseForSpam('Cheap remaps this weekend, message me'), message: false, place: null, at: NOW - 25 * 3600_000 }];
    expect(duplicateProblem('Cheap remaps this weekend, message me', [...old, ...old], { message: false, now: NOW })).toBeNull();
  });
  it('in private chats only counts different chats (blasting)', () => {
    let sent: SentText[] = [];
    for (let i = 0; i < 3; i++) sent = send(sent, 'Cheap tyres at my mates garage, msg me', true, 'chat-1');
    expect(duplicateProblem('Cheap tyres at my mates garage, msg me', sent, { message: true, place: 'chat-1', now: NOW })).toBeNull();
    expect(duplicateProblem('Cheap tyres at my mates garage, msg me', sent, { message: true, place: 'chat-2', now: NOW })).toBeNull();
    sent = send(sent, 'Cheap tyres at my mates garage, msg me', true, 'chat-2');
    expect(duplicateProblem('Cheap tyres at my mates garage, msg me', sent, { message: true, place: 'chat-3', now: NOW })).toBe(SPAM_PROBLEMS.duplicate);
  });
  it('ignores short replies', () => {
    let sent: SentText[] = [];
    for (let i = 0; i < 5; i++) sent = send(sent, 'Nice one');
    expect(duplicateProblem('Nice one', sent, { message: false, now: NOW })).toBeNull();
  });
});

describe('isSelling', () => {
  it.each([
    'Coilovers £400 ono',
    'FS: mk7 GTI front splitter, collection only from Leeds',
    'Selling my old Recaros, 300 quid',
    'WTB: E46 M3 rear diff, cash waiting',
    'Exhaust £250 plus postage',
    'BBS RS 17s, £900 ovno',
    'All on ebay.co.uk/itm/123456 have a look',
    'Listed on fb marketplace if anyone wants them',
    'https://www.facebook.com/marketplace/item/123',
    'Got some bits on vinted.co.uk/member/99',
    'Use my code DRIFT10 at checkout',
    'Discount code for the show tickets in my bio',
    'Turbo for sale, dm for price',
    'Stage 1 remap £180, open to offers',
    'Spare set of wheels £350, can post or collect',
  ])('selling: %s', (text) => {
    expect(isSelling(text)).toBe(true);
  });

  it.each([
    'Spent £400 on coilovers and it rides like a dream',
    'Sold my old car last year and miss it every day',
    'The selling point of this car is the chassis',
    'Best selling hot hatch of the decade, change my mind',
    'Paid 3k for the build so far, worth every penny',
    'Fuel was £1.60 a litre at the services, mental',
    'Anyone going to Ace Cafe on Friday?',
    'Collected my car from the bodyshop today',
    'My turbo is fucked, anyone know a good garage near Brum?',
  ])('not selling: %s', (text) => {
    expect(isSelling(text)).toBe(false);
  });

  it('only hints outside For sale & wanted', () => {
    expect(sellingHint('Coilovers £400 ono', 'cars')).toBe(SELLING_HINT);
    expect(sellingHint('Coilovers £400 ono', 'for_sale')).toBeNull();
    expect(sellingHint('Spent £400 on coilovers')).toBeNull();
  });
});

describe('the SQL says the same', () => {
  it('has the same sentences', () => {
    for (const s of Object.values(SPAM_PROBLEMS)) expect(SQL).toContain(s.replace(/'/g, "''"));
  });
  it('has the same selling words', () => {
    for (const w of ['for sale|fs|f/s|wts|wtb|wtt|ono|ovno|selling', 'collection only|price drop', 'use|using) (my )?code', 'postage|posted|p&p|collection|collect|offers|swaps?|px|bnib|boxed|asking']) {
      expect(SQL).toContain(w);
    }
  });
});

describe('bans and roles', () => {
  it('says when a Community ban ends, in UK time', () => {
    expect(banMessage('community', '2026-11-25T14:00:00Z', 'Spamming the forum.')).toBe("You can't post in Community until 25 Nov 2026, 14:00: Spamming the forum.");
    expect(banMessage('community', '2026-07-01T09:30:00Z', null)).toBe("You can't post in Community until 1 Jul 2026, 10:30.");
    expect(banMessage('community', null, 'Spam')).toBe("You can't post in Community until a moderator lifts it: Spam.");
    expect(banMessage('full', null, 'x')).toMatch(/^Your account is suspended/);
  });
  it('moderators ban from Community for up to 7 days; admins anything', () => {
    expect(canBan('moderator', 'community', 7)).toBe(true);
    expect(canBan('moderator', 'community', 30)).toBe(false);
    expect(canBan('moderator', 'community', null)).toBe(false);
    expect(canBan('moderator', 'full', 1)).toBe(false);
    expect(canBan('admin', 'full', null)).toBe(true);
    expect(canBan(null, 'community', 1)).toBe(false);
  });
  it('nobody acts on themselves or on the same or a higher role', () => {
    expect(canActOn('moderator', null, false)).toBe(true);
    expect(canActOn('moderator', 'moderator', false)).toBe(false);
    expect(canActOn('admin', 'moderator', false)).toBe(true);
    expect(canActOn('owner', 'admin', false)).toBe(true);
    expect(canActOn('owner', null, true)).toBe(false);
  });
  it('admins promote and demote moderators; only the owner makes admins', () => {
    expect(roleChoices('moderator', null, false)).toEqual([]);
    expect(roleChoices('admin', null, false)).toEqual(['moderator']);
    expect(roleChoices('admin', 'moderator', false)).toEqual([null]);
    expect(roleChoices('admin', 'admin', false)).toEqual([]);
    expect(roleChoices('owner', null, false)).toEqual(['admin', 'moderator']);
    expect(roleChoices('owner', 'admin', false)).toEqual(['moderator', null]);
    expect(roleChoices('owner', null, true)).toEqual([]);
  });
  it('labels the automatic reason', () => {
    expect(reportReasonLabel('sell_only')).toBe('Only here to sell (automatic)');
    expect(reportReasonLabel('spam')).toBe('Spam');
  });
});

describe('actionLine', () => {
  it('says what, how long and by whom', () => {
    expect(actionLine({ action: 'ban', actorHandle: '@dan', actorRole: 'moderator', days: 7, newRole: null })).toBe('Community ban · 7 days · by @dan (moderator)');
    expect(actionLine({ action: 'suspend', actorHandle: '@kez', actorRole: 'admin', days: null, newRole: null })).toBe('Full suspension · until lifted · by @kez (admin)');
    expect(actionLine({ action: 'cooldown', actorHandle: null, actorRole: 'system', days: 1, newRole: null })).toBe('Automatic 24-hour cooldown · by Nightshift (system)');
    expect(actionLine({ action: 'promote', actorHandle: '@boss', actorRole: 'owner', days: null, newRole: 'admin' })).toBe('Promoted · Admin · by @boss (owner)');
  });
});
