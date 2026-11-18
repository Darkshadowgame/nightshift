import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { PAGE } from '../components/Detail';
import { Button, DsText, EmptyState, ListRow, RowDivider, Tag, metaLine } from '../components/ds';
import { crewEvents, sortCrews } from '../lib/crews';
import { plural } from '../lib/format';
import { useStore } from '../lib/store';
import { COLOR, SPACING } from '../theme';

/** Browse every crew, and start one. */
export default function Crews() {
  const { crews, events, me, users } = useStore();
  const myCrewId = users.find((u) => u.id === me)?.crewId;
  const list = sortCrews(crews);

  return (
    <ScrollView style={{ backgroundColor: COLOR.surface.bg }} contentContainerStyle={PAGE} showsVerticalScrollIndicator={false}>
      <DsText v="secondary">Crews host events together: the owner and the hosts they pick run them. You can be in one crew at a time.</DsText>
      {list.length === 0 ? <EmptyState glyph="chat" title="No crews yet" body="Start one and host events together." /> : null}
      <View>
        {list.map((c, i) => {
          const upcoming = crewEvents(c, events).length;
          const mine = c.id === myCrewId;
          return (
            <View key={c.id}>
              {i ? <RowDivider /> : null}
              <ListRow
                title={c.name}
                subtitle={metaLine([c.tag, plural(c.memberIds.length, 'member'), plural(upcoming, 'event')])}
                trailing={mine ? <Tag label="Your crew" tone="success" /> : undefined}
                onPress={() => router.push({ pathname: '/crew/[id]', params: { id: c.id } })}
              />
            </View>
          );
        })}
      </View>
      <Button label="Start a crew" tier="secondary" block onPress={() => router.push('/crew/new')} />
    </ScrollView>
  );
}
