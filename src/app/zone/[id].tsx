import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView } from 'react-native';
import { PAGE } from '../../components/Detail';
import { EmptyState, screenHeader } from '../../components/ds';
import { ZoneCard } from '../../components/ZoneCard';
import { BAN_ZONES } from '../../data/seed';
import { COLOR } from '../../theme';

/** One meet ban, explained (from a place page, a host step or a stop warning). */
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
        <EmptyState glyph="area" title="Meet ban not found" body="This area is no longer listed." action={{ label: 'Go back', onPress: () => (router.canGoBack() ? router.back() : router.replace('/')) }} />
      )}
    </ScrollView>
  );
}
