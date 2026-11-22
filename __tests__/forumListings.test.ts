import { listingFromRow, listingParams, threadFromRow, type ThreadRow } from '../src/lib/backend/community';
import { ME } from '../src/data/seed';
import { createLocalCommunity, emptyDemoCommunity, seedDemoCommunity, type DemoCommunity } from '../src/lib/communityService';
import { BOARDS, cleanListing, listingFacts, listingProblem, parsePrice, priceLabel, threadProblem } from '../src/lib/forum';

describe('listings (For sale and wanted)', () => {
  it('reads typed prices as pence', () => {
    expect(parsePrice('')).toBeNull();
    expect(parsePrice('450')).toBe(45000);
    expect(parsePrice('£1,250.5')).toBe(125050);
    expect(parsePrice(' £45.99 ')).toBe(4599);
    expect(parsePrice('cheap')).toBeNaN();
    expect(parsePrice('4.999')).toBeNaN();
  });

  it('reads "250 ono" and "£250 ONO" (REVIEW-9)', () => {
    const { typedOno } = jest.requireActual('../src/lib/forum') as typeof import('../src/lib/forum');
    expect(parsePrice('250 ono')).toBe(25000);
    expect(parsePrice('£250 ONO')).toBe(25000);
    expect(parsePrice('250')).toBe(25000);
    expect(parsePrice('ono')).toBeNull();
    expect([typedOno('250 ono'), typedOno('£250 ONO'), typedOno('250'), typedOno('£1,250 o.n.o.')]).toEqual([true, true, false, true]);
  });

  it('labels prices and budgets', () => {
    expect(priceLabel({ kind: 'sale', pricePence: 45000, ono: true })).toBe('£450 ONO');
    expect(priceLabel({ kind: 'sale', pricePence: 125050 })).toBe('£1,250.50');
    expect(priceLabel({ kind: 'sale' })).toBe('Offers');
    expect(priceLabel({ kind: 'wanted', pricePence: 8000 })).toBe('Budget £80');
    expect(priceLabel({ kind: 'wanted' })).toBe('Any budget');
  });

  it('refuses what the server refuses, in the same words', () => {
    expect(listingProblem({ kind: 'sale', pricePence: 100 })).toBeNull();
    expect(listingProblem({ kind: 'sale', ono: true })).toBe('Add a price to say "or nearest offer".');
    expect(listingProblem({ kind: 'sale', pricePence: -1 })).toBe('Give a price between £0 and £1,000,000.');
    expect(listingProblem({ kind: 'sale', pricePence: 100_000_001 })).toBe('Give a price between £0 and £1,000,000.');
    expect(threadProblem({ board: 'for_sale', title: 'FK8 rear wing', body: '', photos: [], listing: { kind: 'sale', ono: true } })).toBe('Add a price to say "or nearest offer".');
    // Other boards ignore a listing.
    expect(threadProblem({ board: 'advice', title: 'FK8 rear wing', body: '', photos: [], listing: { kind: 'sale', ono: true } })).toBeNull();
  });

  it('saves wanted listings without a condition, and ONO only with a price', () => {
    expect(cleanListing({ kind: 'wanted', pricePence: 8000, condition: 'good', handover: 'either' })).toEqual({ kind: 'wanted', pricePence: 8000, handover: 'either' });
    expect(cleanListing({ kind: 'sale', ono: true })).toEqual({ kind: 'sale' });
    expect(listingFacts({ kind: 'sale', condition: 'like_new', handover: 'postage' })).toEqual(['Used: like new', 'Postage only']);
  });

  it('maps rows and arguments both ways', () => {
    const row: ThreadRow = {
      id: 't1', board: 'for_sale', region: null, author_id: 'u1', title: 'Wheels', body: '', photos: [], build_id: null, created_at: 'x', last_activity_at: 'x',
      reply_count: 0, solved_reply_id: null, hidden_at: null, listing_kind: 'sale', price_pence: 85000, ono: true, condition: 'good', handover: 'collection', sold_at: '2026-11-18T20:00:00Z',
    };
    expect(threadFromRow(row).listing).toEqual({ kind: 'sale', pricePence: 85000, ono: true, condition: 'good', handover: 'collection', soldAt: '2026-11-18T20:00:00Z' });
    // A listing from before the columns reads as for sale, offers.
    expect(listingFromRow({ ...row, listing_kind: null, price_pence: null, ono: false, condition: null, handover: null, sold_at: null })).toEqual({ kind: 'sale' });
    expect(threadFromRow({ ...row, board: 'advice' }).listing).toBeUndefined();
    expect(listingParams({ kind: 'wanted', pricePence: 8000 })).toEqual({ p_listing_kind: 'wanted', p_price_pence: 8000, p_ono: false, p_condition: null, p_handover: null });
  });

  it('has one name per board and a placeholder for each', () => {
    for (const b of BOARDS) {
      expect(b.title.startsWith('e.g. ')).toBe(true);
      expect(b.body.length).toBeGreaterThan(10);
    }
    expect(BOARDS.find((b) => b.key === 'for_sale')!.body).toMatch(/part numbers/);
  });
});

describe('listings in the demo', () => {
  const NOW = new Date('2026-11-17T20:00:00Z');
  const HOME = { lat: 52.63, lng: -1.7 };
  function demo() {
    let state: DemoCommunity = seedDemoCommunity(emptyDemoCommunity(), HOME, 'Midlands', NOW);
    const users = [
      { id: ME, handle: 'you', name: 'You', region: 'Midlands', home: HOME },
      { id: 'cal', handle: 'cal_focusrs', name: 'Cal', region: 'Midlands', home: HOME },
    ];
    return createLocalCommunity({ get: () => state, set: (s) => (state = s), users: () => users, travelMiles: () => 25, now: () => NOW, replyDelay: 10 });
  }

  it('has a sample wanted and a sample for-sale listing', async () => {
    const list = await demo().threads({ board: 'for_sale', sort: 'new' });
    // One wanted, the live for-sale listing, and three sold charge pipes that feed "recently sold for".
    expect(list.filter((t) => !t.listing?.soldAt).map((t) => t.listing?.kind).sort()).toEqual(['sale', 'wanted']);
    expect(list.filter((t) => t.listing?.soldAt)).toHaveLength(3);
  });

  it('posts a listing and only its author marks it sold', async () => {
    const svc = demo();
    const id = await svc.createThread({ board: 'for_sale', title: 'FK8 rear wing', body: 'Fits: Honda Civic Type R FK8', photos: [], listing: { kind: 'sale', pricePence: 45000, ono: true, condition: 'good', handover: 'collection' } });
    expect((await svc.thread(id))!.thread.listing).toEqual({ kind: 'sale', pricePence: 45000, ono: true, condition: 'good', handover: 'collection' });
    await svc.setListingSold(id, true);
    expect((await svc.thread(id))!.thread.listing!.soldAt).toBeTruthy();
    await svc.setListingSold(id, false);
    expect((await svc.thread(id))!.thread.listing!.soldAt).toBeUndefined();
    await expect(svc.setListingSold('ft-focus-wheels', true)).rejects.toThrow('Only the person who listed it can mark it sold.');
  });
});
