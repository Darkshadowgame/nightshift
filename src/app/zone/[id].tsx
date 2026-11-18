import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView } from 'react-native';
import { PAGE } from '../../components/Detail';
import { EmptyState, screenHeader } from '../../components/ds';
import { ZoneCard } from '../../components/ZoneCard';
import { BAN_ZONES } from '../../data/seed';
import { COLOR } from '../../theme';

/** One meet ban, explained (T3: the card carries the title). Reached from the host flow's meet-ban warning and place pages. */
export default function ZoneScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const zone = BAN_ZONES.find((z) => z.id === id);
  return (
    <ScrollView style={{ flex: 1, backgroundColor: COLOR.surface.bg }} contentContainerStyle={PAGE}>
      {/* A detail screen: the card carries the title. */}
      <Stack.Screen options={screenHeader({})} />
      {zone ? (
        <ZoneCard zone={zone} />
      ) : (
        <EmptyState glyph="area" title="Meet ban not found" body="This area is no longer listed." action={{ label: 'See Tonight', onPress: () => router.replace('/') }} />
      )}
    </ScrollView>
  );
}
