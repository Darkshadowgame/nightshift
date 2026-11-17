import { Image } from 'react-native';
import { router } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { BuildArt } from '../../components/BuildArt';
import { Button, Card, ClassBadge, Row, Txt } from '../../components/ui';
import { classOf, effectivePower, isModified } from '../../lib/classes';
import { useStore } from '../../lib/store';
import { C } from '../../theme';

export default function Garage() {
  const { builds, me } = useStore();
  const mine = builds.filter((b) => b.ownerId === me);
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}>
      {mine.length === 0 ? (
        <Card>
          <Txt v="h3">Your garage is empty</Txt>
          <Txt v="muted">Add your car or bike. Invites to meets and cruises are matched against your builds.</Txt>
        </Card>
      ) : null}
      {mine.map((b) => (
        <Pressable
          key={b.id}
          onPress={() => router.push({ pathname: '/build/[id]', params: { id: b.id } })}
          accessibilityRole="button"
          style={({ pressed }) => [{ gap: 10 }, pressed && { opacity: 0.85 }]}
        >
          {b.photos[0] ? (
            <Image source={{ uri: b.photos[0] }} style={{ height: 180, borderRadius: 10 }} />
          ) : (
            <BuildArt kind={b.kind} colour={b.colour} height={150} />
          )}
          <Row style={{ flexWrap: 'nowrap' }} gap={12}>
            <ClassBadge letter={classOf(b)} size="lg" />
            <View style={{ flex: 1 }}>
              <Txt v="h2">{b.make} {b.model}</Txt>
              <Txt v="mono">
                {Math.round(effectivePower(b))} BHP{b.dynoBhp ? ' (DYNO)' : ''} · {b.mods.length} MODS{isModified(b) ? ' · MODIFIED' : ''}
              </Txt>
              {b.nickname ? <Txt v="muted">{b.nickname}</Txt> : null}
            </View>
          </Row>
        </Pressable>
      ))}
      <Button label="+ Add a car or bike" onPress={() => router.push('/build/edit')} />
      <Txt v="muted" style={{ textAlign: 'center', color: C.fog }}>
        Class comes from power-to-weight. Cars and bikes use separate scales, so a litre superbike and an M4 are both S.
      </Txt>
    </ScrollView>
  );
}
