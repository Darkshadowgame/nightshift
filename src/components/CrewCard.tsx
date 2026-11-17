import { router } from 'expo-router';
import { Pressable } from 'react-native';
import { plural } from '../lib/format';
import type { Crew } from '../lib/types';
import { BRAND, C } from '../theme';
import { Card, Row, Txt } from './ui';

/** A crew as a card that opens it: used on Me, profiles and the crews list. Crews are brand, not a layer colour. */
export function CrewCard({ crew, note }: { crew: Crew; note?: string }) {
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/crew/[id]', params: { id: crew.id } })}
      accessibilityRole="button"
      accessibilityLabel={`Open ${crew.name}`}
      style={({ pressed }) => [pressed && { opacity: 0.8 }]}
    >
      <Card accent={BRAND}>
        <Row style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
          <Row style={{ flexShrink: 1 }}>
            <Txt v="h3" style={{ flexShrink: 1 }}>{crew.name}</Txt>
            <Txt v="mono" style={{ color: C.chalk }}>[{crew.tag}]</Txt>
          </Row>
          <Txt v="label" style={{ color: BRAND }}>Open ›</Txt>
        </Row>
        <Txt v="muted">{note ?? plural(crew.memberIds.length, 'member')}</Txt>
      </Card>
    </Pressable>
  );
}
