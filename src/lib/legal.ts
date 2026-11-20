/**
 * The legal and support pages (site/ in the repo, served by GitHub Pages from the
 * gh-pages branch) and the open-data credits shown in Settings › About.
 * docs/APP-STORE.md uses the same URLs for App Store Connect.
 */
export const SITE_URL = 'https://darkshadowgame.github.io/nightshift/';

export const LEGAL_PAGES = {
  privacy: { label: 'Privacy Policy', url: `${SITE_URL}privacy.html` },
  terms: { label: 'Terms of Use', url: `${SITE_URL}terms.html` },
  guidelines: { label: 'Community Guidelines', url: `${SITE_URL}guidelines.html` },
  support: { label: 'Support', url: `${SITE_URL}support.html` },
} as const;

export type LegalPage = keyof typeof LEGAL_PAGES;

/**
 * Support email. TODO (owner): pick the address, then set it here and in site/*.html.
 * Until then the app shows the Support page instead of a mail link.
 */
export const SUPPORT_EMAIL: string | null = null;

/** One credit line: who, for what, and where the licence is. */
export interface Credit {
  what: string;
  who: string;
  licence?: string;
  url?: string;
}

/** Everything the app shows that isn't ours. Keep in step with site/index.html. */
export const CREDITS: Credit[] = [
  { what: 'Map, place search, place names and routes', who: 'Apple Maps' },
  {
    what: 'Drives, circuits, shops, speed camera sites and council boundaries for ban zones',
    who: '© OpenStreetMap contributors',
    licence: 'Open Database Licence (ODbL)',
    url: 'https://www.openstreetmap.org/copyright',
  },
  {
    what: 'Nearby photos on place screens',
    who: 'Wikimedia Commons: each photo shows its author and licence',
    url: 'https://commons.wikimedia.org/',
  },
  {
    what: 'Road closures in London (when shown)',
    who: 'Powered by TfL Open Data. Contains OS data © Crown copyright and database rights 2016 and Geomni UK Map data © and database rights 2019',
    url: 'https://tfl.gov.uk/info-for/open-data-users/',
  },
  {
    what: 'Road and lane closures (when shown)',
    who: 'National Highways and DfT Street Manager',
    licence: 'Open Government Licence v3.0',
    url: 'https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/',
  },
  {
    what: 'Ban zones',
    who: 'Council and court orders, each linked from its zone. A sample: check the current order',
  },
  {
    what: 'Fonts',
    who: 'Chakra Petch, Barlow and Barlow Condensed',
    licence: 'SIL Open Font License 1.1',
    url: 'https://openfontlicense.org/',
  },
];

/** Car and bike makes are named only to describe what people own. */
export const BRANDS_NOTE =
  "Car and bike makes and models are named only to describe the vehicles people own. Slipstream isn't connected with or endorsed by any manufacturer.";
