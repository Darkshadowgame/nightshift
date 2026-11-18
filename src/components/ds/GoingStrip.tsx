import { View } from 'react-native';
import { COLOR, SPACING } from '../../theme';
import { Icon } from './Icon';
import { stripFaces } from './logic';
import { Avatar, AVATAR_SIZE, type Photo } from './Marks';
import { Press } from './Press';
import { DsText } from './Text';

export type StripPerson = { id?: string; name?: string | null; handle?: string | null; photo?: Photo | null };

/**
 * Who's going, in one line (Redesign 2, 3.5 item 4): up to six overlapping faces, then the
 * summary from `goingSummary()` (format.ts), "9 going · 7 cars, 2 bikes", and a chevron when it
 * opens the Going list. People who aren't shown add a "+3" face. With nobody going it says the
 * summary alone ("0 going" is the caller's choice of words: pass "Be the first to go").
 *
 * Your face goes first when you're going, so "I'm going" visibly adds you (the morph moment).
 */
export function GoingStrip({ people, summary, onPress, max = 6 }: { people: readonly StripPerson[]; summary: string; onPress?: () => void; max?: number }) {
  const { shown, more } = stripFaces(people, max);
  const size = AVATAR_SIZE.sm;
  const body = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, minHeight: 44 }}>
      {shown.length ? (
        <View style={{ flexDirection: 'row' }} aria-hidden>
          {shown.map((p, i) => (
            <View key={p.id ?? p.handle ?? i} style={{ marginLeft: i === 0 ? 0 : -SPACING.sm, borderRadius: size / 2, borderWidth: 2, borderColor: COLOR.surface.bg }}>
              <Avatar name={p.name} handle={p.handle} photo={p.photo} size="sm" />
            </View>
          ))}
          {more ? (
            <View
              style={{
                marginLeft: -SPACING.sm,
                width: size + 4,
                height: size + 4,
                borderRadius: (size + 4) / 2,
                borderWidth: 2,
                borderColor: COLOR.surface.bg,
                backgroundColor: COLOR.surface.raisedHi,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <DsText v="tag" allowFontScaling={false} style={{ color: COLOR.text.primary, letterSpacing: 0 }}>{`+${more}`}</DsText>
            </View>
          ) : null}
        </View>
      ) : null}
      <DsText v="meta" numberOfLines={2} style={{ flex: 1, color: COLOR.text.primary }}>
        {summary}
      </DsText>
      {onPress ? <Icon name="chevron" size={18} colour={COLOR.text.secondary} /> : null}
    </View>
  );
  return onPress ? (
    <Press onPress={onPress} role="button" label={summary} hint="Opens who's going">
      {body}
    </Press>
  ) : (
    <View accessible accessibilityLabel={summary}>
      {body}
    </View>
  );
}
