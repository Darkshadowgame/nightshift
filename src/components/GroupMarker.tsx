import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type { GroupMember } from '../lib/groupLive';
import { ART, COLOR, RADII, SPACING, themedStyles } from '../theme';
import { Avatar } from './ds/Marks';
import { DsText } from './ds/Text';

/** One member of your group on the driving map. */
export interface GroupDot {
  member: GroupMember;
  /** Position older than 60 s: drawn dimmed. */
  stale: boolean;
}

export const GROUP_MARKER_W = 72;
export const GROUP_MARKER_H = 60;
const RING = 44;

export function groupMarkerLabel(d: GroupDot): string {
  return `${d.member.handle || d.member.name} in your group${d.stale ? ', position is old' : ''}`;
}

/**
 * A small marker for a group member: their avatar (or initials), a little wedge showing which way they
 * are heading when that is known, and their handle under it. Dimmed when their position is old.
 * `mapHeading` is the way the map's top faces, so the wedge points the right way on screen.
 */
export function GroupMarkerFace({ dot, mapHeading }: { dot: GroupDot; mapHeading: number }) {
  const m = dot.member;
  const turn = m.heading !== null ? m.heading - mapHeading : null;
  return (
    <View style={[st.box, { opacity: dot.stale ? 0.5 : 1 }]} accessible accessibilityLabel={groupMarkerLabel(dot)}>
      <View style={st.ring}>
        {turn !== null ? (
          <View style={[st.wedge, { transform: [{ rotate: `${Math.round(turn)}deg` }] }]}>
            <Svg width={RING} height={RING} viewBox="0 0 44 44">
              <Path d="M22 0 L29 9 L15 9 Z" fill={ART.signWhite} stroke={ART.ink} strokeWidth={1.5} strokeLinejoin="round" />
            </Svg>
          </View>
        ) : null}
        <Avatar name={m.name} handle={m.handle} size="sm" />
      </View>
      <View style={st.label}>
        <DsText v="tag" numberOfLines={1} style={{ textTransform: 'none' }}>
          {m.handle || m.name}
        </DsText>
      </View>
    </View>
  );
}

const st = themedStyles(() => StyleSheet.create({
  box: { width: GROUP_MARKER_W, height: GROUP_MARKER_H, alignItems: 'center' },
  ring: { width: RING, height: RING, alignItems: 'center', justifyContent: 'center' },
  wedge: { position: 'absolute', width: RING, height: RING },
  label: { maxWidth: GROUP_MARKER_W, backgroundColor: COLOR.surface.glass, borderRadius: RADII.tag, paddingHorizontal: SPACING.xs, paddingVertical: 1, marginTop: -2 },
}));
