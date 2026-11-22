import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { groupChipText, isStale, lastUpdatedText, relationText, relationTo, type GroupInfo, type GroupMember } from '../lib/groupLive';
import type { NavRoute } from '../lib/nav';
import type { LatLng } from '../lib/types';
import { COLOR, RADII, SPACING, themedStyles } from '../theme';
import { Button, ConfirmSheet, DsText, ListRow, Sheet } from './ds';
import { Press } from './ds/Press';

/**
 * "3 in the group": a small chip over the driving map (top left, under the manoeuvre banner) that
 * opens the group's list. No sound, no alert, and not a second primary: the driving view's one
 * coloured button stays End.
 */
export function GroupChip({ count, onPress }: { count: number; onPress: () => void }) {
  return (
    <Press onPress={onPress} haptic="tap" label={`${groupChipText(count)}. Open the list`} hitSlop={6} style={st.chip}>
      <DsText v="driveBody" numberOfLines={1}>
        {groupChipText(count)}
      </DsText>
    </Press>
  );
}

/** The list: name, how far ahead or behind, last updated; Leave group (and, for the leader, End for everyone). */
export function GroupSheet({
  visible,
  group,
  members,
  me,
  route,
  nowMs,
  leading,
  onLeave,
  onEnd,
  onClose,
}: {
  visible: boolean;
  group: GroupInfo;
  members: GroupMember[];
  me: LatLng | null;
  route: NavRoute | null;
  nowMs: number;
  leading: boolean;
  onLeave: () => void;
  onEnd: () => void;
  onClose: () => void;
}) {
  const [ending, setEnding] = useState(false);
  return (
    <>
      <Sheet visible={visible} title={groupChipText(members.length + 1)} onClose={onClose}>
        <View style={{ gap: SPACING.sm }}>
          <DsText v="secondary">{`${group.title}. Everyone here can see where you are until the drive ends.`}</DsText>
          {members.map((m) => {
            const stale = isStale(m.updatedAt, nowMs);
            return (
              <View key={m.id} style={{ opacity: stale ? 0.6 : 1 }}>
                <ListRow
                  leading={{ avatar: { name: m.name, handle: m.handle } }}
                  title={m.handle || m.name}
                  subtitle={`${relationText(relationTo(me, m.at, route))} · ${lastUpdatedText(m.updatedAt, nowMs)}`}
                  meta={m.isLeader ? 'Started it' : undefined}
                />
              </View>
            );
          })}
          {members.length === 0 ? <DsText v="secondary">Nobody else is here yet. Send them the link from the drive’s page.</DsText> : null}
          <Button block tier="secondary" label="Leave group" onPress={onLeave} />
          {leading ? <Button block tier="secondary" label="End for everyone" onPress={() => setEnding(true)} /> : null}
        </View>
      </Sheet>
      <ConfirmSheet
        visible={ending}
        title="End the group drive?"
        message="It ends for everyone and nobody’s location is shared any more."
        verb="End"
        confirmLabel="End for everyone"
        cancelLabel="Keep it going"
        onConfirm={() => {
          setEnding(false);
          onEnd();
        }}
        onCancel={() => setEnding(false)}
      />
    </>
  );
}

const st = themedStyles(() => StyleSheet.create({
  chip: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', backgroundColor: COLOR.surface.glassRaised, borderRadius: RADII.pill, borderWidth: 2, borderColor: COLOR.surface.raisedHi, paddingHorizontal: SPACING.md },
}));
