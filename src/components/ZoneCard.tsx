import { router } from 'expo-router';
import { Linking, View } from 'react-native';
import { MEET_BAN } from '../lib/glossary';
import { zoneInfo, zoneKind, zoneLine, zoneShortName } from '../lib/zones';
import type { BanZone } from '../lib/types';
import { COLOR, RADII, SPACING, line, tint } from '../theme';
import { Button, DsText, Icon, Press } from './ds';

const openUrl = (url: string) => Linking.openURL(url).catch(() => {});

/** The zone's evidence links, labelled by who published them ("Read Sandwell Council's order ›"). */
function SourceLinks({ zone }: { zone: BanZone }) {
  const z = zoneInfo(zone);
  if (!z.source && !z.newsSource) return null;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: SPACING.md, marginLeft: -SPACING.xs }}>
      {z.source ? <Button tier="tertiary" size="sm" label={z.sourceLabel ?? 'Read the order ›'} onPress={() => openUrl(z.source!)} /> : null}
      {z.newsSource ? <Button tier="tertiary" size="sm" label="News report ›" onPress={() => openUrl(z.newsSource!)} /> : null}
    </View>
  );
}

/**
 * A meet ban (a car-meet order area), explained: the kind of order, what it bans in plain words,
 * when, the official source, and what it means for a host. The zone page and host maps show it.
 */
export function ZoneCard({ zone, onClose }: { zone: BanZone; onClose?: () => void }) {
  const z = zoneInfo(zone);
  return (
    <View style={{ gap: SPACING.lg, backgroundColor: COLOR.surface.card, borderColor: COLOR.surface.border, borderWidth: 1, borderRadius: RADII.card, padding: SPACING.lg }}>
      <View style={{ gap: SPACING.xs }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
          <Icon name="alert" size={18} colour={COLOR.state.warning} />
          <DsText v="eyebrow" style={{ color: COLOR.state.warning, flex: 1 }}>
            {MEET_BAN}
          </DsText>
          {onClose ? <Button tier="tertiary" size="sm" label="Close" onPress={onClose} /> : null}
        </View>
        <DsText v="titleLg" accessibilityRole="header">
          {z.name}
        </DsText>
        <DsText v="meta">{z.kind}</DsText>
      </View>
      <Fact label="What it bans" text={z.bans} />
      {z.hours ? <Fact label="When" text={z.hours} /> : null}
      {z.details ? <DsText v="secondary">{z.details}</DsText> : null}
      <Fact label="If you're hosting" text={z.forHosts} />
      <DsText v="caption">
        {z.sample} The area drawn is approximate{z.checked ? `; last checked ${z.checked}` : ''}.
      </DsText>
      <SourceLinks zone={zone} />
    </View>
  );
}

function Fact({ label, text }: { label: string; text: string }) {
  return (
    <View style={{ gap: SPACING.xxs }}>
      <DsText v="label">{label}</DsText>
      <DsText v="body">{text}</DsText>
    </View>
  );
}

/**
 * Inline, where a stop or place is inside a meet ban: the warning, what it bans, the official
 * source link and the full card one tap away. Shown on host steps, plan changes and place pages.
 */
export function ZoneNotice({ zone, subject, onOpen, compact }: { zone: BanZone; subject?: string; onOpen?: () => void; compact?: boolean }) {
  const z = zoneInfo(zone);
  const open = onOpen ?? (() => router.push({ pathname: '/zone/[id]', params: { id: zone.id } }));
  // The host flow's one line (Redesign 2, 3.6): what it is, and the order one tap away. Warn only.
  if (compact) {
    return (
      <Press onPress={open} label={`${zoneLine(zone)}. See the order`} style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, minHeight: 44 }}>
        <Icon name="alert" size={18} colour={COLOR.state.warning} />
        <DsText v="secondary" style={{ flex: 1 }}>
          {`${subject ? `${subject}: inside` : 'Inside'} ${zoneShortName(zone)}'s ${zoneKind(zone) === 'injunction' ? 'court injunction' : zoneKind(zone) === 'pspo' ? 'PSPO' : 'dispersal-order area'}.`}
        </DsText>
        <DsText v="buttonSm" tone="action">
          See the order ›
        </DsText>
      </Press>
    );
  }
  return (
    <View
      style={{ gap: SPACING.xs, padding: SPACING.md, borderRadius: RADII.card, borderWidth: 1, borderColor: line(COLOR.state.warning), backgroundColor: tint(COLOR.state.warning) }}
      accessibilityRole="summary"
    >
      <View style={{ flexDirection: 'row', gap: SPACING.sm, alignItems: 'flex-start' }}>
        <Icon name="alert" size={20} colour={COLOR.state.warning} />
        <DsText v="bodyStrong" style={{ flex: 1 }}>
          {subject ? `${subject} is inside a meet ban` : 'Inside a meet ban'}
        </DsText>
      </View>
      <DsText v="meta" style={{ color: COLOR.text.primary }}>
        {z.name} · {z.kind}
        {z.hours ? ` · ${z.hours}` : ''}
      </DsText>
      <DsText v="secondary" numberOfLines={3}>
        {z.bans}
      </DsText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: SPACING.md, marginLeft: -SPACING.xs }}>
        {z.source ? <Button tier="tertiary" size="sm" label={z.sourceLabel ?? 'Read the order ›'} onPress={() => openUrl(z.source!)} /> : null}
        <Button tier="tertiary" size="sm" label="Details ›" accessibilityLabel={`${MEET_BAN} details: ${z.name}`} onPress={open} />
      </View>
    </View>
  );
}
