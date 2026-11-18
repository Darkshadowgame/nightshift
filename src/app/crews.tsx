import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { PAGE } from '../components/Detail';
import { Button, DsText, EmptyState, EntityCard } from '../components/ds';
import { useRepFor } from '../components/Rep';
import { crewEvents, sortCrews } from '../lib/crews';
import { plural } from '../lib/format';
import { useStore } from '../lib/store';
import { COLOR, SPACING } from '../theme';

/** Browse every crew, and start one. */
export default function Crews() {
  const { crews, events, me, users } = useStore();
  const repFor = useRepFor();
  const myCrewId = users.find((u) => u.id === me)?.crewId;
  const list = sortCrews(crews);

  return (
    <ScrollView style={{ backgroundColor: COLOR.surface.bg }} contentContainerStyle={PAGE}>
      <DsText v="secondary">Crews host events together: the owner and the hosts they pick run them. You can be in one crew at a time.</DsText>
      {list.length === 0 ? <EmptyState glyph="chat" title="No crews yet" body="Start one and host events together." /> : null}
      <View style={{ gap: SPACING.md }}>
        {list.map((c) => {
          const total = c.memberIds.reduce((s, uid) => s + repFor(uid).ledger.total, 0);
          const upcoming = crewEvents(c, events).length;
          const mine = c.id === myCrewId;
          return (
            <EntityCard
              key={c.id}
              kind="person"
              eyebrow={`Crew · ${c.tag}`}
              title={c.name}
              status={mine ? { label: 'Your crew', tone: 'success' } : undefined}
              meta={[plural(c.memberIds.length, 'member'), plural(upcoming, 'event'), `${total.toLocaleString('en-GB')} rep`].join(' · ')}
              onPress={() => router.push({ pathname: '/crew/[id]', params: { id: c.id } })}
            />
          );
        })}
      </View>
      <Button label="Start a crew" block size="lg" onPress={() => router.push('/crew/new')} />
    </ScrollView>
  );
}
