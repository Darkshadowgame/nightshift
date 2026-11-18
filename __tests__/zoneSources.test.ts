import { BAN_ZONES } from '../src/data/banZones';
import { zoneInfo, zoneSourceKind, zoneSourceLabel } from '../src/lib/zones';

/**
 * Owner rule: "if referring to a council, link to them as evidence". Every ban
 * zone's evidence link must be official: the council (gov.uk, gov.wales,
 * gov.scot, nidirect, a moderngov site or a council's own domain), the court
 * (judiciary.uk, bailii, the National Archives' case law) or the police force.
 * News is a fallback only, labelled as such, and each one is listed here with why.
 */
const OFFICIAL_HOSTS: RegExp[] = [
  /(^|\.)gov\.uk$/, // councils, the National Archives (case law), nidirect.gov.uk
  /(^|\.)gov\.wales$/,
  /(^|\.)gov\.scot$/,
  /(^|\.)judiciary\.uk$/,
  /(^|\.)bailii\.org$/,
  /(^|\.)police\.uk$/, // every force: surrey.police.uk, scotland.police.uk, psni.police.uk …
  /(^|\.)moderngov\.co\.uk$/,
  // Council or police domains not on gov.uk or police.uk go here, one by one, with care.
];

/** Zones that cite news only, because no official page was found. Each needs a reason. */
const NEWS_ONLY: Record<string, string> = {};

const host = (url: string) => new URL(url).hostname.toLowerCase();

describe('ban-zone evidence links', () => {
  test('every zone has an http(s) source', () => {
    for (const z of BAN_ZONES) {
      expect({ id: z.id, ok: typeof z.source === 'string' && /^https?:\/\/[^/]+\.[^/]+/.test(z.source) }).toEqual({ id: z.id, ok: true });
    }
  });

  test('every source that is not news is on an official site', () => {
    for (const z of BAN_ZONES) {
      if (zoneSourceKind(z) === 'news') continue;
      const h = host(z.source!);
      expect({ id: z.id, host: h, official: OFFICIAL_HOSTS.some((re) => re.test(h)) }).toEqual({ id: z.id, host: h, official: true });
    }
  });

  test('news-only zones are allowlisted with a reason and say so in their note', () => {
    const newsOnly = BAN_ZONES.filter((z) => zoneSourceKind(z) === 'news');
    for (const z of newsOnly) {
      expect({ id: z.id, reason: (NEWS_ONLY[z.id] ?? '').length > 10 }).toEqual({ id: z.id, reason: true });
      expect(z.note).toMatch(/no official/i);
    }
    // No stale allowlist entries.
    for (const id of Object.keys(NEWS_ONLY)) expect(newsOnly.map((z) => z.id)).toContain(id);
  });

  test('secondary news links are http(s) and never the same as the official one', () => {
    for (const z of BAN_ZONES) {
      if (!z.newsSource) continue;
      expect(z.newsSource).toMatch(/^https?:\/\//);
      expect(z.newsSource).not.toBe(z.source);
    }
  });

  test('the link is labelled by who published it', () => {
    expect(zoneSourceKind({ source: 'https://caselaw.nationalarchives.gov.uk/ewhc/kb/2025/1' })).toBe('court');
    expect(zoneSourceKind({ source: 'https://www.bailii.org/ew/cases/x.html' })).toBe('court');
    expect(zoneSourceKind({ source: 'https://www.surrey.police.uk/news' })).toBe('police');
    expect(zoneSourceKind({ source: 'https://www.medway.gov.uk/pspo' })).toBe('council');
    expect(zoneSourceLabel('council')).toBe("Read the council's order ›");
    expect(zoneSourceLabel('council', 'Sevenoaks District Council')).toBe("Read Sevenoaks District Council's order ›");
    expect(zoneSourceLabel('court')).toBe('Read the court order ›');
    expect(zoneSourceLabel('police')).toBe('See the police notice ›');
    expect(zoneSourceLabel('news')).toBe('News report (no official page found) ›');

    const halstead = zoneInfo(BAN_ZONES.find((z) => z.id === 'bz-halstead')!);
    expect(halstead.sourceLabel).toBe("Read Sevenoaks District Council's order ›");
    expect(halstead.newsSource).toMatch(/kentonline/);
  });
});
