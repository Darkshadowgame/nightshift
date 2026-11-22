jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

import { DEFAULT_EVENT_FILTER, filterEvents, filterLine, NO_EVENT_FILTER, savedEventFilter, type EventFilter } from '../src/lib/eventFilter';
import type { EventView } from '../src/lib/eventView';
import { draftFromEvent as hostDraftFrom } from '../src/lib/hostDraft';
import { stripMeets } from '../src/lib/mapNight';
import { eventFromRows, organisedArgs, type EventRow } from '../src/lib/backend/mapping';
import {
  canPostOrganised, checkOrganised, countNouns, EMPTY_ORGANISED, isOrganised, kindText, matchesShow, organisedFacts, parsePence, penceInput, poundsText, safeTicketUrl,
  savedShow, showGroupHeadings, splitByKind, sponsorShopId, ticketLine, ticketLink, withKind,
} from '../src/lib/organised';
import type { NightEvent } from '../src/lib/types';

const NOW = new Date(2026, 10, 20, 21, 10);
const at = (h: number, days = 0) => new Date(2026, 10, 20 + days, h, 0).toISOString();

function ev(id: string, over: Partial<NightEvent> = {}): NightEvent {
  return {
    id, type: 'meet', title: id, startsAt: at(22), endsAt: at(23), area: { lat: 52, lng: -1 }, areaName: 'Town', stops: [], currentStop: 0, revealMinutesBefore: 0,
    hostIds: ['h'], filter: { everyone: true, cars: true, bikes: true, classes: [], minMods: 0, brands: [], radiusMiles: 25 }, going: ['a'], checkIns: {}, ...over,
  };
}
const view = (e: NightEvent, phase = 'upcoming'): EventView => ({ event: e, role: 'public', phase: phase as never, status: null, shownStop: -1 });

describe('which kind an event is', () => {
  test('a meet is local unless flagged; shows and track days default to organised', () => {
    expect(isOrganised(ev('a'))).toBe(false);
    expect(isOrganised(ev('a', { organised: true }))).toBe(true);
    expect(isOrganised(ev('s', { type: 'show' }))).toBe(true);
    expect(isOrganised(ev('t', { type: 'trackday' }))).toBe(true);
    expect(isOrganised(ev('s', { type: 'show', organised: false }))).toBe(false);
  });
  test('the kind line keeps the type and adds one word', () => {
    expect(kindText(ev('a'))).toBe('Meet');
    expect(kindText(ev('a', { organised: true, type: 'cruise' }))).toBe('Cruise · Organised');
    expect(kindText(ev('s', { type: 'show' }))).toBe('Show · Organised');
  });
});

describe('tickets', () => {
  test('pounds and pence', () => {
    expect(poundsText(1200)).toBe('£12');
    expect(poundsText(1250)).toBe('£12.50');
    expect(parsePence('12')).toBe(1200);
    expect(parsePence('£12.5')).toBe(1250);
    expect(parsePence('0')).toBeNull();
    expect(parsePence('12.345')).toBeNull();
    expect(parsePence('abc')).toBeNull();
    expect(parsePence('1001')).toBeNull();
    expect(penceInput(1250)).toBe('12.50');
    expect(penceInput(undefined)).toBe('');
  });
  test('only https links with a real host open', () => {
    expect(safeTicketUrl('https://example.com/tickets?x=1')).toBe('https://example.com/tickets?x=1');
    expect(safeTicketUrl('  https://example.com ')).toBe('https://example.com');
    for (const bad of ['http://example.com', 'javascript:alert(1)', 'https://', 'https://localhost', 'https://a b.com', 'https://user@example.com', '', undefined, `https://example.com/${'a'.repeat(300)}`]) {
      expect(safeTicketUrl(bad as never)).toBeNull();
    }
  });
  test('the ticket row says from-price, or just Tickets for a link', () => {
    expect(ticketLine({ ticketPence: 1200, ticketUrl: 'https://example.com' })).toBe('Tickets from £12');
    expect(ticketLine({ ticketUrl: 'https://example.com' })).toBe('Tickets');
    expect(ticketLine({})).toBeNull();
    expect(ticketLine({ ticketUrl: 'http://example.com' })).toBeNull();
  });
  test('a local meet never offers a link, even with stray data', () => {
    expect(ticketLink({ type: 'meet', ticketUrl: 'https://example.com' })).toBeNull();
    expect(ticketLink({ type: 'meet', organised: true, ticketUrl: 'https://example.com' })).toBe('https://example.com');
  });
});

describe('what the meet page shows', () => {
  test('nothing for a local meet, even one carrying sponsors', () => {
    expect(organisedFacts(ev('a', { sponsors: [{ name: 'Sneaky' }], ticketPence: 500 }))).toBeNull();
  });
  test('organiser, at most 3 sponsors and the ticket row for an organised event', () => {
    const f = organisedFacts(ev('o', { organised: true, organiser: ' Sample Show Co ', sponsors: [{ name: 'A' }, { name: ' ' }, { name: 'B' }, { name: 'C' }, { name: 'D' }], ticketPence: 1200, ticketUrl: 'https://example.com' }))!;
    expect(f.organisedBy).toBe('Organised by Sample Show Co');
    expect(f.sponsors.map((s) => s.name)).toEqual(['A', 'B', 'C']);
    expect(f.ticket).toEqual({ title: 'Tickets from £12', link: 'https://example.com' });
  });
  test('sponsor shop ids only open shop pages of the right shape', () => {
    expect(sponsorShopId({ name: 'x', shop: 'partner:demo-partner-detailing' })).toBe('partner:demo-partner-detailing');
    expect(sponsorShopId({ name: 'x', shop: '../etc' })).toBeNull();
    expect(sponsorShopId({ name: 'x' })).toBeNull();
  });
});

describe('the host form', () => {
  test('only an organiser account, with the server ready, can post organised events', () => {
    expect(canPostOrganised(true, true)).toBe(true);
    expect(canPostOrganised(true, false)).toBe(false);
    expect(canPostOrganised(false, true)).toBe(false);
  });
  test('checks and tidies the fields', () => {
    expect(checkOrganised(EMPTY_ORGANISED)).toMatchObject({ ok: false, at: 'organiser' });
    const ok = checkOrganised({ organiser: '  Sample   Co ', sponsors: [{ name: 'A', shop: 'partner:x' }, { name: 'a' }, { name: ' ' }], price: '12.50', link: 'https://example.com' });
    expect(ok).toEqual({ ok: true, value: { organiser: 'Sample Co', sponsors: [{ name: 'A', shop: 'partner:x' }], ticketPence: 1250, ticketUrl: 'https://example.com' } });
    expect(checkOrganised({ ...EMPTY_ORGANISED, organiser: 'Sample Co', sponsors: [{ name: 'A' }, { name: 'B' }, { name: 'C' }, { name: 'D' }] })).toMatchObject({ ok: false, at: 'sponsors' });
    expect(checkOrganised({ ...EMPTY_ORGANISED, organiser: 'Sample Co', price: 'free' })).toMatchObject({ ok: false, at: 'price' });
    expect(checkOrganised({ ...EMPTY_ORGANISED, organiser: 'Sample Co', link: 'http://example.com' })).toMatchObject({ ok: false, at: 'link' });
    expect(checkOrganised({ ...EMPTY_ORGANISED, organiser: 'Sample Co', sponsors: [{ name: 'x'.repeat(41) }] })).toMatchObject({ ok: false, at: 'sponsors' });
  });
  test('a local meet is stripped of everything commercial; an organised one gets it', () => {
    const dirty = ev('a', { organised: true, organiser: 'X Co', sponsors: [{ name: 'A' }], ticketPence: 100, ticketUrl: 'https://example.com' });
    const local = withKind(dirty, 'local', { ...EMPTY_ORGANISED, organiser: 'X Co' });
    expect(local.organised).toBe(false);
    expect(local.sponsors).toBeUndefined();
    expect(local.ticketPence).toBeUndefined();
    expect(local.ticketUrl).toBeUndefined();
    expect(local.organiser).toBeUndefined();
    const org = withKind(ev('b'), 'organised', { organiser: 'Y Co', sponsors: [{ name: 'S' }], price: '5', link: '' });
    expect(org).toMatchObject({ organised: true, organiser: 'Y Co', sponsors: [{ name: 'S' }], ticketPence: 500 });
    // A draft that does not pass the checks never makes an organised event.
    expect(withKind(ev('c'), 'organised', EMPTY_ORGANISED).organised).toBe(false);
  });
  test('"Same as last time" carries an organised event over, and nothing for a local one', () => {
    const src = ev('o', { organised: true, organiser: 'Y Co', sponsors: [{ name: 'S' }], ticketPence: 500, ticketUrl: 'https://example.com', stops: [{ id: 's', name: 'P', at: { lat: 52, lng: -1 } }] });
    const d = hostDraftFrom(src, 'h', NOW);
    expect(d).toMatchObject({ kind: 'organised', organiser: 'Y Co', sponsors: [{ name: 'S' }], ticketPrice: '5', ticketLink: 'https://example.com' });
    expect(hostDraftFrom(ev('l', { stops: src.stops }), 'h', NOW).kind).toBeUndefined();
  });
});

describe('the Show filter', () => {
  const local = view(ev('local'));
  const org = view(ev('org', { organised: true }));
  const show = view(ev('show', { type: 'show' }));
  const all = [local, org, show];
  const f = (x: Partial<EventFilter>): EventFilter => ({ ...NO_EVENT_FILTER, ...x });
  test('matches', () => {
    expect(matchesShow(local.event, 'all')).toBe(true);
    expect(matchesShow(local.event, 'local')).toBe(true);
    expect(matchesShow(org.event, 'local')).toBe(false);
    expect(matchesShow(org.event, 'organised')).toBe(true);
    expect(matchesShow(show.event, 'organised')).toBe(true);
  });
  test('default All; odd saves fall back to All; the choice is saved with the filter', () => {
    expect(DEFAULT_EVENT_FILTER.show).toBe('all');
    expect(savedShow('nope')).toBe('all');
    expect(savedEventFilter({ show: 'organised' }).show).toBe('organised');
    expect(savedEventFilter({}).show).toBe('all');
    expect(savedEventFilter({ show: 'x' as never }).show).toBe('all');
  });
  test('filters the list and the count line follows', () => {
    const r = filterEvents(all, f({ show: 'local' }), true, NOW);
    expect(r.shown.map((v) => v.event.id)).toEqual(['local']);
    expect(filterLine(r, f({ show: 'local' }), true, true)?.text).toBe('1 local meet · 2 hidden by your filters');
    const o = filterEvents(all, f({ show: 'organised' }), true, NOW);
    expect(o.shown.map((v) => v.event.id)).toEqual(['org', 'show']);
    expect(filterLine(o, f({ show: 'organised' }), true, true)?.text).toBe('2 organised meets · 1 hidden by your filters');
    expect(filterEvents(all, f({ show: 'all' }), true, NOW).shown).toHaveLength(3);
  });
  test('yours always show', () => {
    const mine = { ...org, role: 'going' as const };
    expect(filterEvents([mine], f({ show: 'local' }), true, NOW).shown).toHaveLength(1);
  });
  test('counting words', () => {
    expect(countNouns('all')).toEqual({ one: 'meet', many: 'meets' });
  });
  test('groups: local first, headings only when both kinds are on the list', () => {
    expect(splitByKind(all).local.map((v) => v.event.id)).toEqual(['local']);
    expect(splitByKind(all).organised.map((v) => v.event.id)).toEqual(['org', 'show']);
    expect(showGroupHeadings('all', all)).toBe(true);
    expect(showGroupHeadings('all', [local])).toBe(false);
    expect(showGroupHeadings('all', [org])).toBe(false);
    expect(showGroupHeadings('local', all)).toBe(false);
  });
});

describe('the tonight strip keeps the kinds apart', () => {
  test('local first, organised after, each in time order, organised flagged', () => {
    const views = [view(ev('o1', { organised: true, startsAt: at(21, 0), endsAt: at(23) })), view(ev('l1', { startsAt: at(22), endsAt: at(23) })), view(ev('l0', { startsAt: at(21), endsAt: at(23) }))];
    const out = stripMeets(views, NOW);
    expect(out.map((m) => m.id)).toEqual(['l0', 'l1', 'o1']);
    expect(out.map((m) => !!m.organised)).toEqual([false, false, true]);
  });
});

describe('the server rows', () => {
  const row = (x: Partial<EventRow>): EventRow =>
    ({
      id: 'e1', type: 'meet', title: 'T', description: null, starts_at: at(22), ends_at: null, reveal_minutes_before: 60, area_lat: 52, area_lng: -1, area_radius_miles: 3, area_name: 'Town',
      current_stop: 0, crew_id: null, route_miles: null, invite_everyone: true, invite_cars: true, invite_bikes: true, invite_classes: [], invite_min_mods: 0, invite_brands: [],
      invite_radius_miles: 25, created_by: null, cancelled_at: null, ...x,
    }) as EventRow;
  const parts = { going: [], requests: [], checkIns: [], hosts: [], stops: [] } as never;
  test('rows from before the migration are plain', () => {
    const e = eventFromRows(row({}), parts);
    expect(e.organised).toBeUndefined();
    expect(isOrganised(e)).toBe(false);
  });
  test('an organised row maps; a local row never carries the fields', () => {
    const e = eventFromRows(row({ organised: true, organiser_name: 'Sample Co', sponsors: [{ name: 'A', shop: 'partner:x' }, { name: 'B' }], ticket_pence: 1200, ticket_url: 'https://example.com' }), parts);
    expect(e).toMatchObject({ organised: true, organiser: 'Sample Co', sponsors: [{ name: 'A', shop: 'partner:x' }, { name: 'B' }], ticketPence: 1200, ticketUrl: 'https://example.com' });
    const l = eventFromRows(row({ organised: false, organiser_name: 'Stray', ticket_pence: 5 }), parts);
    expect(l.organiser).toBeUndefined();
    expect(l.ticketPence).toBeUndefined();
  });
  test('a show the server calls local stays local', () => {
    expect(isOrganised(eventFromRows(row({ type: 'show', organised: false }), parts))).toBe(false);
    expect(isOrganised(eventFromRows(row({ type: 'show' }), parts))).toBe(true);
  });
  test('the call clears everything for a local meet', () => {
    expect(organisedArgs(ev('a', { organised: false, ticketPence: 5, sponsors: [{ name: 'x' }] }), 'e1')).toEqual({
      p_event_id: 'e1', p_organised: false, p_organiser: null, p_sponsors: [], p_ticket_pence: null, p_ticket_url: null,
    });
    expect(organisedArgs(ev('a', { organised: true, organiser: 'Co', sponsors: [{ name: 'x', shop: 'partner:y' }], ticketPence: 5, ticketUrl: 'https://example.com' }), 'e1')).toMatchObject({
      p_organised: true, p_organiser: 'Co', p_sponsors: [{ name: 'x', shop: 'partner:y' }], p_ticket_pence: 5, p_ticket_url: 'https://example.com',
    });
  });
});
