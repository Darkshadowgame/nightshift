/**
 * Local meets and organised events (owner decision, 22 Nov 2026: "We should separate planned meets
 * with sponsors vs local meets just for fun and culture").
 *
 * Every meet is one of two kinds, and the app keeps them visibly apart. This is a flag on the event,
 * not a sixth meet type: a meet, cruise, rolling meet, show or track day is a local meet or an
 * organised event.
 *
 * - **Local meet** (the default): people getting together for fun, hosted by a person or a crew. It
 *   never carries a sponsor, a ticket price or any commercial content.
 * - **Organised event**: planned by an organiser or business. May carry an organiser name, up to 3
 *   sponsors, a ticket price and an external ticket link (https only, opened in the browser: the app
 *   takes no payment). Always labelled "Organised"; sponsors under "Sponsored by".
 *
 * Only accounts marked as organisers (staff set the mark) can post one. Shows and track days default
 * to organised (`isOrganised`), so the ones the app already knows about land on the right side.
 *
 * Pure logic; the screens draw it. Mirrors the server's checks in 20261122190000_organised_events.sql.
 */

import { EVENT_LABELS, isPublicType } from './events';
import type { EventView } from './eventView';
import type { NightEvent, Sponsor } from './types';

export const MAX_SPONSORS = 3;
export const ORGANISER_NAME_MAX = 60;
export const SPONSOR_NAME_MAX = 40;
export const TICKET_URL_MAX = 300;
/** £1,000 a ticket is the most the app takes at face value. */
export const TICKET_MAX_PENCE = 100_000;

/** The one word that marks an organised event, said the same everywhere. */
export const ORGANISED_TAG = 'Organised';

/** Owner-facing words, in one place. */
export const ORGANISED_WORDS = {
  localGroup: 'Local meets',
  organisedGroup: 'Organised meets',
  section: 'Organised meet',
  sponsoredBy: 'Sponsored by',
  sponsoredHint: 'Sponsors paid or supported this meet.',
  kind: 'Kind',
  organiser: 'Organiser name',
  sponsors: 'Sponsors',
  sponsorName: 'Sponsor name',
  ticketPrice: 'Ticket price (£, from)',
  ticketLink: 'Ticket link (https)',
  noPayments: 'Tickets are sold on the organiser’s own site. Slipstream takes no payment.',
} as const;

/** Is this an organised event? Left unset, shows and track days are; everything else is a local meet. */
export function isOrganised(e: Pick<NightEvent, 'organised' | 'type'>): boolean {
  return e.organised ?? isPublicType(e.type);
}

/** "Meet", or "Show · Organised": the kind line on rows, cards and the meet page. */
export function kindParts(e: Pick<NightEvent, 'organised' | 'type'>): string[] {
  return isOrganised(e) ? [EVENT_LABELS[e.type], ORGANISED_TAG] : [EVENT_LABELS[e.type]];
}
export function kindText(e: Pick<NightEvent, 'organised' | 'type'>): string {
  return kindParts(e).join(' · ');
}

/** What a screen reader hears after the title of an organised event. */
export const ORGANISED_A11Y = 'organised meet';

// ---------------------------------------------------------------------------
// Tickets
// ---------------------------------------------------------------------------

/** "£12", "£12.50": pence as pounds, no trailing .00. */
export function poundsText(pence: number): string {
  const pounds = pence / 100;
  return `£${Number.isInteger(pounds) ? pounds : pounds.toFixed(2)}`;
}

/** "12", "12.5" or "£12.50" typed by a host into pence; null when it isn't a price (or is 0, or too big). */
export function parsePence(input: string): number | null {
  const t = input.trim().replace(/^£/, '').replace(/,/g, '');
  if (!/^\d{1,4}(\.\d{1,2})?$/.test(t)) return null;
  const pence = Math.round(Number(t) * 100);
  return pence >= 1 && pence <= TICKET_MAX_PENCE ? pence : null;
}

/** The price as a host edits it: "12", "12.50". */
export function penceInput(pence: number | undefined): string {
  if (!pence) return '';
  const pounds = pence / 100;
  return Number.isInteger(pounds) ? String(pounds) : pounds.toFixed(2);
}

/**
 * A ticket link that is safe to open: https only, a real host, no spaces, no embedded login, sane
 * length. Returns the link as it should be stored, or null.
 */
export function safeTicketUrl(url: string | undefined | null): string | null {
  const t = (url ?? '').trim();
  if (!t || t.length > TICKET_URL_MAX) return null;
  if (!/^https:\/\/[^\s/@?#]+\.[^\s/@?#]+([/?#]\S*)?$/i.test(t)) return null;
  return t;
}

/** The ticket row's title: "Tickets from £12", or "Tickets" when only a link is set. Null with neither. */
export function ticketLine(e: Pick<NightEvent, 'ticketPence' | 'ticketUrl'>): string | null {
  if (e.ticketPence) return `Tickets from ${poundsText(e.ticketPence)}`;
  return safeTicketUrl(e.ticketUrl) ? 'Tickets' : null;
}

/** The ticket link to open, only on an organised event, and only if it is safe. */
export function ticketLink(e: Pick<NightEvent, 'organised' | 'type' | 'ticketUrl'>): string | null {
  return isOrganised(e) ? safeTicketUrl(e.ticketUrl) : null;
}

// ---------------------------------------------------------------------------
// What a screen shows of an organised event
// ---------------------------------------------------------------------------

export interface OrganisedFacts {
  /** "Organised by Sample Show Co", or null when no organiser name is on file. */
  organisedBy: string | null;
  sponsors: Sponsor[];
  ticket: { title: string; link: string | null } | null;
}

/**
 * Everything commercial about an event, or null for a local meet. A local meet never yields sponsors
 * or tickets, even if stray data carried them (the rule is enforced here as well as on the server).
 */
export function organisedFacts(e: NightEvent): OrganisedFacts | null {
  if (!isOrganised(e)) return null;
  const title = ticketLine(e);
  return {
    organisedBy: e.organiser?.trim() ? `Organised by ${e.organiser.trim()}` : null,
    sponsors: (e.sponsors ?? []).filter((s) => s.name.trim()).slice(0, MAX_SPONSORS),
    ticket: title ? { title, link: ticketLink(e) } : null,
  };
}

/** Does a sponsor row open a shop page? Only a shop id of the shape the app's routes take. */
export function sponsorShopId(s: Sponsor): string | null {
  return s.shop && /^(partner:)?[A-Za-z0-9._:-]{1,70}$/.test(s.shop) ? s.shop : null;
}

// ---------------------------------------------------------------------------
// The host form
// ---------------------------------------------------------------------------

export type HostKind = 'local' | 'organised';

export const KIND_CHOICES: { key: HostKind; label: string }[] = [
  { key: 'local', label: 'Local meet' },
  { key: 'organised', label: 'Organised meet' },
];

export const KIND_HINTS: Record<HostKind, string> = {
  local: 'People getting together for fun. No sponsors or tickets.',
  organised: 'Run by an organiser or business. Can have sponsors and a ticket link.',
};

/** Only an organiser account, and only once the server has the feature (the demo has none), can post organised events. */
export function canPostOrganised(isOrganiser: boolean, live: boolean): boolean {
  return isOrganiser && live;
}

export interface OrganisedDraft {
  organiser: string;
  sponsors: Sponsor[];
  /** The price as typed ("12.50"). */
  price: string;
  link: string;
}

export const EMPTY_ORGANISED: OrganisedDraft = { organiser: '', sponsors: [], price: '', link: '' };

/** The draft a host form starts from, for an event that already has these. */
export function draftFromEvent(e: Pick<NightEvent, 'organiser' | 'sponsors' | 'ticketPence' | 'ticketUrl'> | undefined): OrganisedDraft {
  return {
    organiser: e?.organiser ?? '',
    sponsors: (e?.sponsors ?? []).map((s) => ({ ...s })),
    price: penceInput(e?.ticketPence),
    link: e?.ticketUrl ?? '',
  };
}

export type OrganisedCheck =
  | { ok: true; value: Pick<NightEvent, 'organiser' | 'sponsors' | 'ticketPence' | 'ticketUrl'> }
  | { ok: false; at: 'organiser' | 'sponsors' | 'price' | 'link'; message: string };

/** Checks and cleans an organised event's fields, with the sentence to show when one is wrong. */
export function checkOrganised(d: OrganisedDraft): OrganisedCheck {
  const organiser = d.organiser.trim().replace(/\s+/g, ' ');
  if (organiser.length < 2) return { ok: false, at: 'organiser', message: 'Say who is organising it.' };
  if (organiser.length > ORGANISER_NAME_MAX) return { ok: false, at: 'organiser', message: `Keep the organiser name under ${ORGANISER_NAME_MAX} characters.` };
  const sponsors: Sponsor[] = [];
  for (const s of d.sponsors) {
    const name = s.name.trim().replace(/\s+/g, ' ');
    if (!name) continue;
    if (name.length > SPONSOR_NAME_MAX) return { ok: false, at: 'sponsors', message: `Keep each sponsor name under ${SPONSOR_NAME_MAX} characters.` };
    if (sponsors.some((x) => x.name.toLowerCase() === name.toLowerCase())) continue;
    const shop = sponsorShopId(s);
    sponsors.push(shop ? { name, shop } : { name });
  }
  if (sponsors.length > MAX_SPONSORS) return { ok: false, at: 'sponsors', message: `An event can have up to ${MAX_SPONSORS} sponsors.` };
  let ticketPence: number | undefined;
  if (d.price.trim()) {
    const p = parsePence(d.price);
    if (p === null) return { ok: false, at: 'price', message: 'Type the price in pounds, like 12 or 12.50.' };
    ticketPence = p;
  }
  const link = d.link.trim();
  let ticketUrl: string | undefined;
  if (link) {
    const u = safeTicketUrl(link);
    if (!u) return { ok: false, at: 'link', message: 'The ticket link must start with https:// and be a web address.' };
    ticketUrl = u;
  }
  return { ok: true, value: { organiser, ...(sponsors.length ? { sponsors } : {}), ...(ticketPence ? { ticketPence } : {}), ...(ticketUrl ? { ticketUrl } : {}) } };
}

/** The event with its commercial fields set (organised) or stripped (local): the one place the rule is applied on the phone. */
export function withKind(event: NightEvent, kind: HostKind, d: OrganisedDraft): NightEvent {
  const next: NightEvent = { ...event };
  delete next.organised;
  delete next.organiser;
  delete next.sponsors;
  delete next.ticketPence;
  delete next.ticketUrl;
  if (kind === 'local') return { ...next, organised: false };
  const c = checkOrganised(d);
  if (!c.ok) return { ...next, organised: false };
  return { ...next, organised: true, ...c.value };
}

// ---------------------------------------------------------------------------
// The Show filter and the two groups
// ---------------------------------------------------------------------------

export type ShowKind = 'all' | 'local' | 'organised';

export const SHOW_OPTIONS: { key: ShowKind; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'local', label: 'Local meets' },
  { key: 'organised', label: 'Organised meets' },
];

/** A saved choice, with anything odd falling back to All. */
export function savedShow(x: unknown): ShowKind {
  return x === 'local' || x === 'organised' ? x : 'all';
}

/** Does the Show filter let this event through? */
export function matchesShow(e: Pick<NightEvent, 'organised' | 'type'>, show: ShowKind): boolean {
  return show === 'all' || (show === 'organised') === isOrganised(e);
}

/** Local meets first, then organised events, each keeping its order. */
export function splitByKind<T extends { event: Pick<NightEvent, 'organised' | 'type'> }>(items: readonly T[]): { local: T[]; organised: T[] } {
  return { local: items.filter((v) => !isOrganised(v.event)), organised: items.filter((v) => isOrganised(v.event)) };
}

/** Headed groups are only worth showing when both kinds are on the list; one kind alone needs no heading. */
export function showGroupHeadings(show: ShowKind, views: readonly Pick<EventView, 'event'>[]): boolean {
  if (show !== 'all') return false;
  const kinds = new Set(views.map((v) => isOrganised(v.event)));
  return kinds.size === 2;
}

/** The nouns the count line uses for the filter: "3 meets", "3 local meets", "1 organised meet". */
export function countNouns(show: ShowKind): { one: string; many: string } {
  if (show === 'local') return { one: 'local meet', many: 'local meets' };
  if (show === 'organised') return { one: 'organised meet', many: 'organised meets' };
  return { one: 'meet', many: 'meets' };
}
