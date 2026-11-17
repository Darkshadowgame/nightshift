import { router } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { LevelTag, useRepFor } from '../components/Rep';
import { Button, Row, Txt } from '../components/ui';
import { crewEvents, sortCrews } from '../lib/crews';
import { levelFor } from '../lib/rep';
import { useStore } from '../lib/store';
import { C } from '../theme';

/** Browse every crew, and start one. */
export default function Crews() {
  const { crews, events, me, users } = useStore();
  const repFor = useRepFor();
  const myCrewId = users.find((u) => u.id === me)?.crewId;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 48 }}>
      <Txt v="muted">Crews host events together: any member can run them. You can be in one crew at a time.</Txt>
      {sortCrews(crews).map((c) => {
        const total = c.memberIds.reduce((s, uid) => s + repFor(uid).ledger.total, 0);
        const upcoming = crewEvents(c, events).length;
        const mine = c.id === myCrewId;
        return (
          <Pressable
            key={c.id}
            onPress={() => router.push({ pathname: '/crew/[id]', params: { id: c.id } })}
            accessibilityRole="button"
            accessibilityLabel={`${c.name}, ${c.memberIds.length} members`}
            style={({ pressed }) => [
              { backgroundColor: C.tarmac, borderColor: C.kerb, borderWidth: 1, borderLeftWidth: 3, borderLeftColor: mine ? C.neon : C.kerbHi, borderRadius: 8, padding: 14, gap: 6 },
              pressed && { opacity: 0.8 },
            ]}
          >
            <Row style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
              <Row style={{ flex: 1 }}>
                <Txt v="h3">{c.name}</Txt>
                <Txt v="mono" style={{ color: C.neon }}>[{c.tag}]</Txt>
              </Row>
              <LevelTag level={levelFor(c.memberIds.length ? total / c.memberIds.length : 0).level} />
            </Row>
            <Txt v="mono">
              {c.memberIds.length} MEMBER{c.memberIds.length === 1 ? '' : 'S'} · {upcoming} EVENT{upcoming === 1 ? '' : 'S'} · {total.toLocaleString('en-GB')} REP
            </Txt>
            {mine ? <Txt v="label" style={{ color: C.neon }}>Your crew</Txt> : null}
          </Pressable>
        );
      })}
      <View style={{ marginTop: 8 }}>
        <Button label="Start a crew" onPress={() => router.push('/crew/new')} />
      </View>
    </ScrollView>
  );
}
