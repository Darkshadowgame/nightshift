import { authMessage, isReviewEmail } from '../src/lib/authLink';
import { CREDITS, LEGAL_PAGES, SITE_URL } from '../src/lib/legal';

describe('legal pages', () => {
  it('are https pages on the published site', () => {
    expect(SITE_URL.startsWith('https://')).toBe(true);
    for (const p of Object.values(LEGAL_PAGES)) {
      expect(p.url.startsWith(SITE_URL)).toBe(true);
      expect(p.url.endsWith('.html')).toBe(true);
    }
  });

  it('credits OpenStreetMap with its licence (ODbL)', () => {
    const osm = CREDITS.find((c) => c.who.includes('OpenStreetMap'));
    expect(osm?.licence).toMatch(/ODbL/);
    expect(osm?.url).toBe('https://www.openstreetmap.org/copyright');
  });
});

describe('App Review sign-in', () => {
  it('offers a password only for appreview addresses', () => {
    expect(isReviewEmail('appreview@example.com')).toBe(true);
    expect(isReviewEmail(' AppReview+1@example.co.uk ')).toBe(true);
    expect(isReviewEmail('someone@example.com')).toBe(false);
    expect(isReviewEmail('me.appreview@example.com')).toBe(false);
    expect(isReviewEmail('appreview@')).toBe(false);
  });

  it('says a wrong password plainly', () => {
    expect(authMessage(new Error('Invalid login credentials'))).toBe("That email and password don't match.");
  });
});
