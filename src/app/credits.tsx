import { Linking, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { DsText, ListRow, RowDivider, Section } from '../components/ds';
import { BRANDS_NOTE, CREDITS, type Credit } from '../lib/legal';
import { SPACING } from '../theme';

/**
 * The web preview has no Apple Maps (Review 14 #22): its map is Stadia's tiles of OpenStreetMap
 * (Esri's if those fail), and the demo's routes come from OSRM. Said for the build you're using.
 */
const WEB_MAP_CREDITS: Credit[] = [
  { what: 'Map', who: '© Stadia Maps © OpenMapTiles © OpenStreetMap contributors (or © Esri, HERE, Garmin if those fail)', url: 'https://stadiamaps.com/attribution/' },
  { what: "Demo night's routes", who: '© OpenStreetMap contributors, OSRM', licence: 'Open Database Licence (ODbL)', url: 'https://project-osrm.org/' },
];

const credits = Platform.OS === 'web' ? [...WEB_MAP_CREDITS, ...CREDITS.filter((c) => c.who !== 'Apple Maps')] : CREDITS;

/** Open data and credits (T5), from Settings › About. A row with a source opens it in Safari. */
export default function Credits() {
  return (
    <ScrollView contentContainerStyle={st.page} showsVerticalScrollIndicator={false}>
      <Section title="Open data and credits" gap="sm">
        <View>
          {credits.map((c, i) => (
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
