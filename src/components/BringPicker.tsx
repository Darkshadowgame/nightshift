import { carShape } from '../lib/buildShape';
import { View } from 'react-native';
import { buildTag } from '../lib/bringing';
import { classOf } from '../lib/classes';
import type { Build } from '../lib/types';
import { COLOR, RADII, SPACING } from '../theme';
import { BuildThumb, Button, ClassBadge, DsText, Press } from './ds';
import { photoSource } from '../lib/photoSource';

/** Which build: thumb, class, "Make Model", its tag, and whether the invite covers it. One radio row. */
export function BuildOption({ build, on, fits, locked, onPress }: { build: Build; on: boolean; fits: boolean; locked?: boolean; onPress?: () => void }) {
  const tag = buildTag(build);
  return (
    <Press
      onPress={onPress}
      disabled={locked || !onPress}
      haptic="select"
      role="radio"
      state={{ checked: on, disabled: !!locked }}
      label={`${build.make} ${build.model}, class ${classOf(build)}${tag ? `, ${tag}` : ''}${fits ? '' : ", doesn't match the invite"}`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
        padding: SPACING.sm,
        minHeight: 56,
        borderRadius: RADII.control,
        borderWidth: 1,
        borderStyle: locked ? 'dashed' : 'solid',
        borderColor: on ? COLOR.action.selected : COLOR.surface.borderStrong,
        backgroundColor: on ? COLOR.action.selectedTint : 'transparent',
      }}
    >
      <BuildThumb photo={build.photos[0] ? photoSource(build.photos[0]) : null} kind={build.kind} shape={carShape(build)} size={36} />
      <View style={{ flex: 1, gap: SPACING.xxs }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
          <ClassBadge letter={classOf(build)} size="sm" decorative />
          <DsText v="body" numberOfLines={1} tone={locked ? 'secondary' : 'primary'} style={{ flexShrink: 1 }}>
            {build.make} {build.model}
          </DsText>
        </View>
        {tag || build.nickname ? (
          <DsText v="meta" numberOfLines={1}>
            {[tag, build.nickname].filter(Boolean).join(' · ')}
          </DsText>
        ) : null}
        {fits ? null : (
          <DsText v="caption" tone="warning">
            Doesn't match the invite
          </DsText>
        )}
      </View>
      {onPress ? (
        <View
          style={{ width: 18, height: 18, borderRadius: RADII.pill, borderWidth: 1.5, borderColor: on ? COLOR.action.selected : COLOR.surface.borderStrong, alignItems: 'center', justifyContent: 'center' }}
        >
          {on ? <View style={{ width: 9, height: 9, borderRadius: RADII.pill, backgroundColor: COLOR.action.selected }} /> : null}
        </View>
      ) : null}
    </Press>
  );
}

/**
 * Pick which of your builds you're bringing, inline on the event. Builds the invite doesn't cover
 * are shown and marked; `lockUnfit` (at check-in) makes them unpickable. The confirm button is the
 * page's primary action while the picker is open.
 */
export function BringPicker({
  title,
  builds,
  picked,
  fits,
  onPick,
  confirmLabel,
  note,
  onConfirm,
  onCancel,
  lockUnfit,
  busy,
}: {
  title: string;
  builds: Build[];
  picked?: string;
  fits: (b: Build) => boolean;
  onPick: (id: string) => void;
  confirmLabel: string;
  /** A line above the buttons, e.g. "you'd go back to asking a host". */
  note?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
  lockUnfit?: boolean;
  busy?: boolean;
}) {
  return (
    <View style={{ gap: SPACING.md }}>
      <DsText v="label">{title}</DsText>
      <View accessibilityRole="radiogroup" accessibilityLabel={title} style={{ gap: SPACING.sm }}>
        {builds.map((b) => {
          const ok = fits(b);
          return <BuildOption key={b.id} build={b} on={b.id === picked} fits={ok} locked={lockUnfit && !ok} onPress={() => onPick(b.id)} />;
        })}
      </View>
      {note ? (
        <DsText v="caption" accessibilityLiveRegion="polite">
          {note}
        </DsText>
      ) : null}
      <Button label={confirmLabel} size="lg" block disabled={!picked} hint="Pick one first" busy={busy} onPress={onConfirm} />
      <Button label="Not now" tier="tertiary" size="sm" style={{ alignSelf: 'center' }} onPress={onCancel} />
    </View>
  );
}
