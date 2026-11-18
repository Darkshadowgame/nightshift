import { Linking, ScrollView, StyleSheet } from 'react-native';
import { Button, DsText, ListRow, RowDivider, Section } from '../components/ds';
import { BRANDS_NOTE, CREDITS } from '../lib/legal';
import { SPACING } from '../theme';

/** Settings › About and legal › Open data and credits. */
export default function Credits() {
  return (
    <ScrollView contentContainerStyle={st.page}>
      <Section title="Open data and credits" gap="sm">
        {CREDITS.map((c, i) => (
          <ListRowWithLink key={c.what} what={c.what} who={c.who} licence={c.licence} url={c.url} last={i === CREDITS.length - 1} />
        ))}
      </Section>
      <DsText v="caption">{BRANDS_NOTE}</DsText>
    </ScrollView>
  );
}

function ListRowWithLink({ what, who, licence, url, last }: { what: string; who: string; licence?: string; url?: string; last: boolean }) {
  return (
    <>
      <ListRow title={what} subtitle={who} meta={licence} />
      {url ? <Button label="Source and licence" tier="tertiary" size="sm" onPress={() => Linking.openURL(url).catch(() => {})} accessibilityLabel={`${what}: source and licence, opens in Safari`} /> : null}
      {last ? null : <RowDivider />}
    </>
  );
}

const st = StyleSheet.create({
  page: { padding: SPACING.screen, gap: SPACING.section, paddingBottom: SPACING.xxxl },
});
