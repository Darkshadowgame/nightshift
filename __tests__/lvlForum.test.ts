import { ME } from '../src/data/seed';
import { createLocalCommunity, emptyDemoCommunity, seedDemoCommunity, type DemoCommunity } from '../src/lib/communityService';
import { faultMeaning, parseFaultCode } from '../src/lib/faultCodes';
import { searchThreads, soldPriceProblem, type ForumThread } from '../src/lib/forum';
import { commonProblems, fitsLabel, rankSearch, soldPricesOf, soldRange, soldRangeLabel } from '../src/lib/forumHelp';

const NOW = new Date('2026-11-21T12:00:00Z');
const HOME = { lat: 52.63, lng: -1.7 };

function thread(id: string, extra: Partial<ForumThread> = {}): ForumThread {
  return { id, board: 'advice', authorId: 'a', title: `Thread ${id}`, body: '', photos: [], createdAt: '2026-11-01T00:00:00Z', lastActivityAt: '2026-11-01T00:00:00Z', replyCount: 0, ...extra };
}

describe('fault codes', () => {
  it('reads a code typed on its own', () => {
    expect(parseFaultCode('p0420')).toBe('P0420');
    expect(parseFaultCode(' P 0420 ')).toBe('P0420');
    expect(parseFaultCode('U0100')).toBe('U0100');
    expect(parseFaultCode('P4420')).toBeNull();
    expect(parseFaultCode('clutch slipping')).toBeNull();
    expect(parseFaultCode('')).toBeNull();
  });
  it('knows common generic codes and admits the rest', () => {
    expect(faultMeaning('P0420')).toMatch(/Catalyst/);
    expect(faultMeaning('p0300')).toMatch(/misfire/i);
    expect(faultMeaning('P1234')).toBeNull();
  });
  it('searches the text of a post as well as its title', () => {
    const ts = [thread('1', { title: 'Engine light', body: 'Throwing P0420 after a run' }), thread('2', { title: 'Wheels' })];
    expect(searchThreads(ts, 'p0420').map((t) => t.id)).toEqual(['1']);
  });
});

describe('search ranking', () => {
  const garage = [{ key: 'bmw:335i', label: 'BMW 335i' }, { key: 'bmw', label: 'BMW' }];
  it('puts solved first, then your own vehicle, keeping order among equals', () => {
    const ts = [
      thread('plain'),
      thread('other-group', { groupKey: 'seat:leon' }),
      thread('make', { groupKey: 'bmw:m3' }),
      thread('model', { groupKey: 'bmw:335i' }),
      thread('solved', { solvedReplyId: 'r', groupKey: 'seat:leon' }),
    ];
    expect(rankSearch(ts, 'p0420', garage).map((t) => t.id)).toEqual(['solved', 'model', 'make', 'plain', 'other-group']);
  });
  it('leaves a list alone with nothing typed', () => {
    const ts = [thread('b'), thread('a', { solvedReplyId: 'r' })];
    expect(rankSearch(ts, '  ', garage).map((t) => t.id)).toEqual(['b', 'a']);
  });
  it('lifts a code in the title', () => {
    const ts = [thread('x', { title: 'Misfire' }), thread('y', { title: 'P0300 on cold start' })];
    expect(rankSearch(ts, 'P0300', []).map((t) => t.id)).toEqual(['y', 'x']);
  });
});

describe('Common problems', () => {
  const ts = [
    thread('a', { groupKey: 'bmw:335i', solvedReplyId: 'ra', replyCount: 2 }),
    thread('b', { groupKey: 'bmw:335i', solvedReplyId: 'rb', replyCount: 1 }),
    thread('c', { groupKey: 'bmw:m3', solvedReplyId: 'rc' }),
    thread('d', { groupKey: 'bmw:335i' }),
    thread('e', { groupKey: 'bmw:335i', solvedReplyId: 're', hidden: true }),
    thread('f', { groupKey: 'seat:leon', solvedReplyId: 'rf' }),
    thread('g', { groupKey: 'bmw:335i', board: 'for_sale', solvedReplyId: 'rg', listing: { kind: 'sale' } }),
  ];
  it('lists a group\'s solved threads, most helpful fix first', () => {
    const helpful = { ra: 1, rb: 6, rc: 3 };
    expect(commonProblems(ts, helpful, 'bmw:335i').map((p) => p.thread.id)).toEqual(['b', 'a']);
    expect(commonProblems(ts, helpful, 'bmw').map((p) => p.thread.id)).toEqual(['b', 'c', 'a']);
    expect(commonProblems(ts, helpful, 'bmw', 1)).toHaveLength(1);
    expect(commonProblems(ts, helpful, 'ford')).toEqual([]);
  });
});

describe('Fits your model', () => {
  const garage = [{ key: 'seat:leon', label: 'SEAT Leon' }, { key: 'seat', label: 'SEAT' }];
  const sale = (extra: Partial<ForumThread> = {}) => thread('s', { board: 'for_sale', listing: { kind: 'sale' }, ...extra });
  it('shows for a for-sale listing in a group you have', () => {
    expect(fitsLabel(sale({ groupKey: 'seat:leon' }), garage)).toBe('Fits your SEAT Leon');
    expect(fitsLabel(sale({ groupKey: 'seat' }), garage)).toBe('Fits your SEAT');
    expect(fitsLabel(sale({ groupKey: 'seat:ibiza' }), garage)).toBe('Fits your SEAT');
  });
  it('stays quiet otherwise', () => {
    expect(fitsLabel(sale({ groupKey: 'bmw:335i' }), garage)).toBeNull();
    expect(fitsLabel(sale(), garage)).toBeNull();
    expect(fitsLabel(sale({ groupKey: 'seat:leon', listing: { kind: 'wanted' } }), garage)).toBeNull();
    expect(fitsLabel(sale({ groupKey: 'seat:leon', listing: { kind: 'sale', soldAt: '2026-11-01T00:00:00Z' } }), garage)).toBeNull();
    expect(fitsLabel(thread('plain', { groupKey: 'seat:leon' }), garage)).toBeNull();
    expect(fitsLabel(sale({ groupKey: 'seat:leon' }), [])).toBeNull();
  });
});

describe('recently sold for', () => {
  const sold = (id: string, price: number | undefined, extra: Partial<ForumThread> = {}, at = '2026-11-10T00:00:00Z') =>
    thread(id, { board: 'for_sale', title: 'N54 charge pipe', groupKey: 'bmw:335i', listing: { kind: 'sale', soldAt: at, ...(price != null ? { soldPricePence: price } : {}) }, ...extra });
  it('needs three sales before showing a range', () => {
    expect(soldRange([4000, 5000])).toBeNull();
    expect(soldRange([4000, 5000, 3000])).toEqual({ low: 3000, high: 5000, count: 3 });
    expect(soldRangeLabel({ low: 3800, high: 5500, count: 3 })).toBe('Recently sold for £38 to £55 (3 sales)');
    expect(soldRangeLabel({ low: 4250, high: 4250, count: 4 })).toBe('Recently sold for £42.50 (4 sales)');
  });
  it('takes only sold sales that named a price, in the group and search, within the window', () => {
    const ts = [
      sold('a', 5500),
      sold('b', undefined),
      sold('c', 4000, { groupKey: 'seat:leon' }),
      sold('d', 3000, { title: 'Wheels' }),
      sold('e', 2000, {}, '2025-01-01T00:00:00Z'),
      sold('f', 1000, { hidden: true }),
      thread('g', { board: 'for_sale', groupKey: 'bmw:335i', listing: { kind: 'sale', pricePence: 9000 } }),
    ];
    expect(soldPricesOf(ts, { group: 'bmw:335i' })).toEqual([5500, 3000, 2000]);
    expect(soldPricesOf(ts, { group: 'bmw', query: 'charge pipe', sinceIso: '2026-06-01T00:00:00Z' })).toEqual([5500]);
  });
  it('refuses a silly price', () => {
    expect(soldPriceProblem(null)).toBeNull();
    expect(soldPriceProblem(4500)).toBeNull();
    expect(soldPriceProblem(-1)).toMatch(/£1,000,000/);
    expect(soldPriceProblem(100_000_001)).toMatch(/£1,000,000/);
  });
});

describe('in the demo', () => {
  function demo() {
    let state: DemoCommunity = seedDemoCommunity(emptyDemoCommunity(), HOME, 'Midlands', NOW);
    const users = [{ id: ME, handle: 'you', name: 'You', region: 'Midlands', home: HOME }];
    return createLocalCommunity({ get: () => state, set: (s) => (state = s), users: () => users, travelMiles: () => 25, now: () => NOW, replyDelay: 10 });
  }
  it('finds the P0420 thread from the code, and it is solved', async () => {
    const found = await demo().threads({ board: 'all', sort: 'active', query: 'p0420' });
    expect(found.map((t) => t.id)).toContain('ft-p0420');
    expect(found.find((t) => t.id === 'ft-p0420')!.solvedReplyId).toBe('fr-16');
  });
  it('builds a group guide from solved threads, most helpful first', async () => {
    const guide = await demo().commonProblems('bmw');
    expect(guide.map((p) => p.thread.id)).toEqual(['ft-n54-hpfp', 'ft-p0420']);
    expect(guide[0].helpful).toBe(6);
  });
  it('gives a sold range for the group, and records a price when you sell', async () => {
    const svc = demo();
    expect(soldRange(await svc.soldPrices({ group: 'bmw:335i' }))).toEqual({ low: 3800, high: 5500, count: 3 });
    expect(await svc.soldPrices({ group: 'seat' })).toEqual([]);
    const id = await svc.createThread({ board: 'for_sale', title: 'FK8 rear wing', body: '', photos: [], groupKey: 'bmw:335i', listing: { kind: 'sale', pricePence: 45000 } });
    await expect(svc.setListingSold(id, true, -5)).rejects.toThrow(/£1,000,000/);
    await svc.setListingSold(id, true, 41000);
    expect((await svc.thread(id))!.thread.listing!.soldPricePence).toBe(41000);
    expect((await svc.soldPrices({ group: 'bmw:335i' })).length).toBe(4);
    await svc.setListingSold(id, false);
    expect((await svc.thread(id))!.thread.listing!.soldPricePence).toBeUndefined();
  });
  it('lets the asker mark the fixing reply, and only the asker', async () => {
    const svc = demo();
    const id = await svc.createThread({ board: 'advice', title: 'Idle hunting when cold', body: '', photos: [] });
    expect((await svc.thread(id))!.thread.solvedReplyId).toBeUndefined();
    await expect(svc.markSolved('ft-leon-dsg', 'fr-13')).rejects.toThrow(/Only the person who started/);
  });
});
