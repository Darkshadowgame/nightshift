import { router } from 'expo-router';
import { Linking } from 'react-native';
import { LEGAL_PAGES, type LegalPage } from '../lib/legal';
import { Card, ListRow, Section, Txt } from './ui';

const ROWS: { key: LegalPage; subtitle: string }[] = [
  { key: 'guidelines', subtitle: 'Legal meets, no plates, no harassment, 18+' },
  { key: 'terms', subtitle: 'Including the rules for what you post' },
  { key: 'privacy', subtitle: 'What is stored, who sees it, how to delete it' },
  { key: 'support', subtitle: 'Help and how to contact us' },
];

/** Open one of the legal pages in Safari. */
export function openLegal(page: LegalPage) {
  Linking.openURL(LEGAL_PAGES[page].url).catch(() => {});
}

/**
 * Settings › About and legal: the pages App Review and the Terms point to
 * (they open in Safari), and the open-data credits.
 */
export function AboutSection() {
  return (
    <Section title="About and legal">
      <Card>
        {ROWS.map((r) => (
          <ListRow
            key={r.key}
            title={LEGAL_PAGES[r.key].label}
            subtitle={r.subtitle}
            onPress={() => openLegal(r.key)}
            accessibilityLabel={`${LEGAL_PAGES[r.key].label}, opens in Safari`}
          />
        ))}
        <ListRow title="Open data and credits" subtitle="OpenStreetMap, Wikimedia Commons, TfL and more" onPress={() => router.push('/credits')} />
        <Txt v="caption">Nightshift is 18+. No ads, no tracking and we never sell your data.</Txt>
      </Card>
    </Section>
  );
}
