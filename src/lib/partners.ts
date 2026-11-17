import type { ShopCategory } from './shopCategories';
import { ALL_CATEGORIES } from './shopCategories';
import type { LatLng } from './types';

/**
 * Partners: local businesses that pay to be highlighted on the Shops layer
 * (the app's money model: no ads, no paywalls). A partner is always shown as
 * one: a "Partner" badge on its pin card and screen, never mixed in looking
 * like an ordinary listing.
 *
 * Production partners come from the backend's `partner_venues` table (staff
 * managed; signed-in users read active rows). Until the app is wired to it the
 * production list is empty, and the demo shows two clearly labelled samples
 * near your home area (`demoPartners`).
 */

export interface Partner {
  id: string;
  name: string;
  at: LatLng;
  categories: ShopCategory[];
  /** Always shown: "Partner" (or "Sample partner" in the demo). */
  label: string;
  description?: string;
  /** What the partner offers Nightshift members. */
  offer?: string;
  /** Their own link (website or offer page). */
  link?: string;
  address?: string;
  phone?: string;
  hours?: string;
  /** A made-up demo business, not a real one. */
  demo?: boolean;
}

/**
 * A `partner_venues` row as the app will read it (location as plain lat/lng,
 * like every RPC). Columns marked "later" need a migration: see docs/BACKEND.md.
 */
export interface PartnerVenueRow {
  id: string;
  name: string;
  description: string | null;
  lat: number;
  lng: number;
  address: string | null;
  website: string | null;
  partner_label: string;
  active: boolean;
  /** later */
  offer?: string | null;
  /** later: ShopCategory keys */
  categories?: string[] | null;
  /** later */
  phone?: string | null;
  /** later */
  opening_hours?: string | null;
}

/** Map a backend row to a partner; null for inactive rows or rows without a label (never shown unlabelled). */
export function partnerFromRow(row: PartnerVenueRow): Partner | null {
  if (!row.active) return null;
  const label = row.partner_label?.trim();
  if (!label || !row.name?.trim()) return null;
  if (!Number.isFinite(row.lat) || !Number.isFinite(row.lng)) return null;
  const cats = (row.categories ?? []).filter((c): c is ShopCategory => (ALL_CATEGORIES as string[]).includes(c));
  return {
    id: row.id,
    name: row.name.trim(),
    at: { lat: row.lat, lng: row.lng },
    categories: cats.length ? cats : ['coffee'],
    label,
    ...(row.description ? { description: row.description } : {}),
    ...(row.offer ? { offer: row.offer } : {}),
    ...(row.website ? { link: row.website } : {}),
    ...(row.address ? { address: row.address } : {}),
    ...(row.phone ? { phone: row.phone } : {}),
    ...(row.opening_hours ? { hours: row.opening_hours } : {}),
  };
}

/** Demo samples: placed by distance and bearing from your home area, like the sample scene. */
export interface DemoPartnerSeed extends Omit<Partner, 'at' | 'demo'> {
  miles: number;
  bearing: number;
}

function offset(from: LatLng, miles: number, bearing: number): LatLng {
  const rad = (bearing * Math.PI) / 180;
  const dLat = (miles / 69.05) * Math.cos(rad);
  const dLng = ((miles / 69.05) * Math.sin(rad)) / Math.cos((from.lat * Math.PI) / 180);
  return { lat: Math.round((from.lat + dLat) * 1e5) / 1e5, lng: Math.round((from.lng + dLng) * 1e5) / 1e5 };
}

export function demoPartners(seeds: readonly DemoPartnerSeed[], home: LatLng | undefined): Partner[] {
  if (!home) return [];
  return seeds.map(({ miles, bearing, ...p }) => ({ ...p, at: offset(home, miles, bearing), demo: true }));
}

/** The badge text: always says partner. */
export function partnerBadge(p: Partner): string {
  const l = p.label.trim();
  return /partner/i.test(l) ? l : `${l} · Partner`;
}
