import { router } from 'expo-router';
import { Linking, Pressable, View } from 'react-native';
import { zoneInfo } from '../lib/zones';
import type { BanZone } from '../lib/types';
import { C } from '../theme';
import { Card, Row, Txt } from './ui';

/**
 * A car-meet order area (a "ban zone"), explained: what kind of order, what it
 * bans in plain words, when, the source, and what it means for a host.
 * Opened from host maps, stop warnings and place pages.
 */
export function ZoneCard({ zone, onClose }: { zone: BanZone; onClose?: () => void }) {
  const z = zoneInfo(zone);
  return (
    <Card accent={C.alert}>
      <Row style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
        <Txt v="h3" style={{ flex: 1 }}>{z.name}</Txt>
        {onClose ? (
          <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close">
            <Txt v="label">Close</Txt>
          </Pressable>
        ) : null}
      </Row>
      <Txt v="mono" style={{ color: C.alert }}>{z.kind.toUpperCase()} · {z.id}</Txt>
      <View style={{ gap: 2 }}>
        <Txt v="label">What it bans</Txt>
        <Txt>{z.bans}</Txt>
      </View>
      {z.hours ? (
        <View style={{ gap: 2 }}>
          <Txt v="label">When</Txt>
          <Txt>{z.hours}</Txt>
        </View>
      ) : null}
      {z.details ? <Txt v="muted">{z.details}</Txt> : null}
      <View style={{ gap: 2 }}>
        <Txt v="label">If you're hosting</Txt>
        <Txt>{z.forHosts}</Txt>
      </View>
      <Txt v="muted" style={{ fontSize: 12 }}>
        {z.sample} The area drawn is approximate{z.checked ? `; last checked ${z.checked}` : ''}.
      </Txt>
      {z.source ? (
        <Pressable onPress={() => Linking.openURL(z.source!).catch(() => {})} accessibilityRole="link" hitSlop={6}>
          <Txt v="label" style={{ color: C.neon }}>Read the order ›</Txt>
        </Pressable>
      ) : null}
    </Card>
  );
}

/**
 * One short line for a place or stop inside an order area, opening the info
 * card: the full legal notice is one tap away, never lost.
 */
export function ZoneNotice({ zone, subject, onOpen }: { zone: BanZone; subject?: string; onOpen?: () => void }) {
  const open = onOpen ?? (() => router.push({ pathname: '/zone/[id]', params: { id: zone.id } }));
  return (
    <Pressable
      onPress={open}
      accessibilityRole="button"
      accessibilityHint="Opens what the order bans and what it means for hosts"
      style={({ pressed }) => [{ borderLeftWidth: 3, borderLeftColor: C.alert, paddingLeft: 10, paddingVertical: 6 }, pressed && { opacity: 0.7 }]}
    >
      <Txt>
        {subject ? `${subject} is inside` : 'Inside'} a car-meet order area ({zone.name}).{' '}
        <Txt v="label" style={{ color: C.alert }}>See details ›</Txt>
      </Txt>
    </Pressable>
  );
}
