import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { DsText, ListRow, RowDivider, Section } from '../components/ds';
import { BRANDS_NOTE, CREDITS } from '../lib/legal';
import { SPACING } from '../theme';

/** Open data and credits (T5), from Settings › About. A row with a source opens it in Safari. */
export default function Credits() {
  return (
    <ScrollView contentContainerStyle={st.page}>
      <Section title="Open data and credits" gap="sm">
        <View>
          {CREDITS.map((c, i) => (
            <View key={c.what}>
              {i ? <RowDivider /> : null}
              <ListRow
                title={c.what}
                subtitle={c.who}
                meta={c.licence}
                onPress={c.url ? () => Linking.openURL(c.url!).catch(() => {}) : undefined}
                accessibilityHint={c.url ? 'Opens the source and licence in Safari' : undefined}
              />
            </View>
          ))}
        </View>
      </Section>
      <DsText v="caption">{BRANDS_NOTE}</DsText>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  page: { padding: SPACING.screen, gap: SPACING.section, paddingBottom: SPACING.xxxl },
});
