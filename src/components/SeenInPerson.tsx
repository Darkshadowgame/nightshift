import { useState } from 'react';
import { View } from 'react-native';
import { SEEN_NEEDED } from '../lib/trust';
import { useSeen } from '../lib/useTrust';
import { plural } from '../lib/format';
import type { Build } from '../lib/types';
import { COLOR, SPACING } from '../theme';
import { DsText, ListRow, useToast } from './ds';

/**
 * "Seen in person" on a vehicle (optional, no plates, no documents). Shows the mark once enough
 * different people who were at the same meet say they saw it there; offers you the one tap to say
 * so when you were at a meet with its owner. Nothing at all when neither applies (or before the
 * server has it).
 */
export function SeenInPerson({ build }: { build: Build }) {
  const s = useSeen(build);
  const toast = useToast();
  const [error, setError] = useState<string | null>(null);
  if (!s.live) return null;
  const confirmRow = s.meet ? (
    <ListRow
      leading={{ icon: 'success', colour: COLOR.text.secondary }}
      title={`I saw this at ${s.meet.title}`}
      subtitle="Only people who were there can say so."
      onPress={() => {
        setError(null);
        s.confirm().then(
          () => toast({ message: 'Thanks, noted' }),
          (e) => setError(e instanceof Error ? e.message : "Couldn't confirm that."),
        );
      }}
    />
  ) : null;
  if (!s.seen && !confirmRow) return null;
  return (
    <View style={{ gap: SPACING.xs }}>
      {s.seen ? (
        <ListRow
          leading={{ icon: 'success', colour: COLOR.state.success }}
          title="Seen in person"
          subtitle={`${plural(Math.max(s.count, SEEN_NEEDED), 'person', 'people')} at meets say they saw it there.`}
        />
      ) : null}
      {confirmRow}
      {error ? <DsText v="caption" tone="danger">{error}</DsText> : null}
    </View>
  );
}
