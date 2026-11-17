import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { CrewCard } from '../components/CrewCard';
import { useRepFor } from '../components/Rep';
import { Button, Txt } from '../components/ui';
import { crewEvents, sortCrews } from '../lib/crews';
import { plural } from '../lib/format';
import { useStore } from '../lib/store';

/** Browse every crew, and start one. */
export default function Crews() {
  const { crews, events, me, users } = useStore();
  const repFor = useRepFor();
  const myCrewId = users.find((u) => u.id === me)?.crewId;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 48 }}>
      <Txt v="muted">Crews host events together: the owner and the hosts they pick run them. You can be in one crew at a time.</Txt>
      {sortCrews(crews).map((c) => {
        const total = c.memberIds.reduce((s, uid) => s + repFor(uid).ledger.total, 0);
        const upcoming = crewEvents(c, events).length;
        const mine = c.id === myCrewId;
        return (
          <CrewCard
            key={c.id}
            crew={c}
            note={[plural(c.memberIds.length, 'member'), plural(upcoming, 'event'), `${total.toLocaleString('en-GB')} rep`, mine ? 'Your crew' : null]
              .filter(Boolean)
              .join(' · ')}
          />
        );
      })}
      <View style={{ marginTop: 8 }}>
        <Button label="Start a crew" onPress={() => router.push('/crew/new')} />
      </View>
    </ScrollView>
  );
}
