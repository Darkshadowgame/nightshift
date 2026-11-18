import { Linking } from 'react-native';
import { LEGAL_PAGES, type LegalPage } from '../lib/legal';

/** The hosted pages App Review and the Terms point to, with a line on what each is. */
export const LEGAL_ROWS: { key: LegalPage; subtitle: string }[] = [
  { key: 'guidelines', subtitle: 'Legal meets, no plates, no harassment, 18+' },
  { key: 'terms', subtitle: 'Including the rules for what you post' },
  { key: 'privacy', subtitle: 'What is stored, who sees it, how to delete it' },
  { key: 'support', subtitle: 'Help and how to contact us' },
];

/** Open one of the legal pages on the hosted site (Safari). */
export function openLegal(page: LegalPage) {
  Linking.openURL(LEGAL_PAGES[page].url).catch(() => {});
}
