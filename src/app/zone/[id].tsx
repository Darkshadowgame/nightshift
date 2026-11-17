import { Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView } from 'react-native';
import { ZoneCard } from '../../components/ZoneCard';
import { NotFound } from '../../components/ui';
import { BAN_ZONES } from '../../data/seed';
import { title } from '../../lib/glossary';
import { C } from '../../theme';

/** One car-meet order area, explained (from a place page or a stop warning). */
export default function ZoneScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const zone = BAN_ZONES.find((z) => z.id === id);
  if (!zone) return <NotFound what="Order area" message="This area is no longer listed." />;
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.asphalt }} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Stack.Screen options={{ title: title('Car-meet order') }} />
      <ZoneCard zone={zone} />
    </ScrollView>
  );
}
