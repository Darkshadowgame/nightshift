import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { DsText, EmptyState, ListRow, RowDivider, Section, metaLine } from '../components/ds';
import { driveLog } from '../lib/driveLog';
import { plural } from '../lib/format';
import { savedLog } from '../lib/driveLog';
import { useStore } from '../lib/store';
import { COLOR, LAYER, SPACING } from '../theme';

const dayText = (on: string) => new Date(`${on}T12:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });

/**
 * Drive log (T1 body, from Me): every drive you have finished, newest first, with the day and the
 * vehicle you used. Kept on this phone; nothing here is shared.
 */
export default function DriveLogScreen() {
  const { spots, me, settings } = useStore();
  const rows = driveLog(savedLog(settings.driveLog), spots, me);
  return (
    <ScrollView contentContainerStyle={st.page}>
      {rows.length === 0 ? (
        <EmptyState variant="block" icon="pin" title="No drives yet. Finish one and it shows up here." action={{ label: "See tonight's meets", onPress: () => router.navigate('/') }} />
      ) : (
        <Section title={plural(rows.length, 'drive')}>
          <View>
            {rows.map((r, i) => (
              <View key={`${r.spotId}-${r.on}-${i}`}>
                {i ? <RowDivider /> : null}
                <ListRow
                  leading={{ pin: 'drive', colour: LAYER.drive }}
                  title={r.name}
                  subtitle={metaLine([dayText(r.on), r.vehicle, r.miles ? `${r.miles.toFixed(1)} mi` : null])}
                  onPress={() => router.push({ pathname: '/spot/[id]', params: { id: r.spotId } })}
                />
              </View>
            ))}
          </View>
        </Section>
      )}
      <DsText v="caption" style={{ color: COLOR.text.secondary }}>
        Saved on this phone only.
      </DsText>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  page: { padding: SPACING.screen, gap: SPACING.section, paddingBottom: SPACING.xxxl },
});
