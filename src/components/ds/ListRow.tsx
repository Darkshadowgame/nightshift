import type { ReactNode } from 'react';
import { View } from 'react-native';
import type { ClassLetter } from '../../lib/types';
import { COLOR, SPACING } from '../../theme';
import { Pin, type Glyph } from '../Pin';
import { Icon, type IconName } from './Icon';
import { contentColour, entityA11yLabel } from './logic';
import { Avatar, BuildLine, ClassBadge, type Photo } from './Marks';
import { Press } from './Press';
import { DsText } from './Text';

/** What leads a row. A person is always an avatar; a build is its class badge; a place or event its pin. */
export type Leading =
  | { avatar: { name?: string | null; handle?: string | null; photo?: Photo | null } }
  | { pin: Glyph; colour: string }
  | { classBadge: ClassLetter }
  | { icon: IconName; colour?: string };

function LeadingMark({ leading }: { leading: Leading }) {
  if ('avatar' in leading) return <Avatar {...leading.avatar} size="md" />;
  if ('pin' in leading)
    return (
      <View aria-hidden>
        <Pin glyph={leading.pin} colour={contentColour(leading.colour, COLOR.text.secondary)} size={36} />
      </View>
    );
  if ('classBadge' in leading) return <ClassBadge letter={leading.classBadge} size="md" decorative />;
  return (
    <View style={{ width: 40, alignItems: 'center' }}>
      <Icon name={leading.icon} size={22} colour={leading.colour ?? COLOR.text.secondary} />
    </View>
  );
}

/**
 * The one row. Leading mark, title (as typed), subtitle, meta (one line of facts), trailing
 * (a Tag, a value or a small Button) and a chevron when it opens something. Min height 56 with a
 * leading mark, 44 without. Replaces EventRow, ThreadRow, ConversationRow, BuildLine and the
 * hand-rolled person rows.
 *
 * A trailing Button only on a row without `onPress` (a pressable row is one control for a screen
 * reader, so a button inside it can't be reached). Put the row's other actions in a Sheet.
 */
export function ListRow({
  leading,
  title,
  subtitle,
  subtitleLines = 2,
  meta,
  build,
  trailing,
  chevron,
  unread,
  onPress,
  onLongPress,
  disabled,
  accessibilityLabel,
  accessibilityHint,
}: {
  leading?: Leading;
  title: string;
  subtitle?: string;
  /** How many lines the subtitle may take before it's cut (default 2). An event's meta line wraps whole (Review 17). */
  subtitleLines?: number;
  meta?: string;
  /** A person's build, under their handle: ClassBadge + name + "bhp" (K3). Instead of a subtitle. */
  build?: { letter: ClassLetter; name: string; power: string };
  trailing?: ReactNode;
  /** Defaults to true when the row opens something. */
  chevron?: boolean;
  /** A red dot before the title: new since you last looked (red means "now", never sodium: 5.4). */
  unread?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}) {
  const showChevron = chevron ?? !!onPress;
  const label =
    accessibilityLabel ??
    entityA11yLabel({ title: unread ? `New: ${title}` : title, meta: build ? `${build.name}, Class ${build.letter}, ${build.power}` : subtitle, detail: meta });
  const body = (
    <>
      {leading ? <LeadingMark leading={leading} /> : null}
      <View style={{ flex: 1, gap: SPACING.xxs }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
          {unread ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: COLOR.badge.bg }} /> : null}
          <DsText v={unread ? 'bodyStrong' : 'body'} numberOfLines={2} style={{ flexShrink: 1 }}>
            {title}
          </DsText>
        </View>
        {build ? <BuildLine {...build} /> : subtitle ? (
          <DsText v="secondary" numberOfLines={subtitleLines}>
            {subtitle}
          </DsText>
        ) : null}
        {meta ? (
          <DsText v="meta" numberOfLines={2}>
            {meta}
          </DsText>
        ) : null}
      </View>
      {trailing ? <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>{trailing}</View> : null}
      {showChevron ? <Icon name="chevron" size={18} colour={COLOR.text.secondary} /> : null}
    </>
  );
  const rowStyle = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: SPACING.md,
    minHeight: leading ? 56 : 44,
    paddingVertical: SPACING.sm,
  };
  if (!onPress && !onLongPress) {
    return (
      // Grouped for screen readers, unless the trailing slot holds its own control (a small Button).
      <View style={rowStyle} accessible={!trailing} accessibilityLabel={trailing ? undefined : label}>
        {body}
      </View>
    );
  }
  return (
    <Press onPress={onPress} onLongPress={onLongPress} disabled={disabled} label={label} hint={accessibilityHint} style={rowStyle}>
      {body}
    </Press>
  );
}

/** A hairline between rows in a list. */
export function RowDivider({ inset }: { inset?: boolean }) {
  return <View style={{ height: 1, backgroundColor: COLOR.surface.border, marginLeft: inset ? 40 + SPACING.md : 0 }} />;
}
