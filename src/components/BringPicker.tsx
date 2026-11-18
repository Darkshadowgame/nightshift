import { View } from 'react-native';
import { classOf, effectivePower } from '../lib/classes';
import { NOT_OPEN } from '../lib/glossary';
import type { Build } from '../lib/types';
import { SPACING } from '../theme';
import { Button, DsText, ListRow, RowDivider, Sheet } from './ds';

/** "Ford Fiesta ST": a build in a sentence ("You're going with your Fiesta ST"). */
export function shortBuildName(b: Build): string {
  return b.model || `${b.make} ${b.model}`.trim();
}

/** "197 bhp": the one power number (Redesign 2, 4.9). */
export function bhpLine(b: Build): string {
  return `${Math.round(effectivePower(b))} bhp`;
}

/**
 * "What are you bringing?" (Redesign 2, 3.5): the sheet behind I'm going, Change and check-in.
 *
 * - Two or more builds: one row each (ClassBadge, name, bhp); a build the invite doesn't cover says
 *   "Not open to your car" (and can't be picked when `lockUnfit`, at check-in). Tap picks it.
 * - No builds: **Add your car** (primary) and **Go as a passenger** (secondary).
 */
export function BringSheet({
  visible,
  title = 'What are you bringing?',
  builds,
  picked,
  fits,
  lockUnfit,
  onPick,
  onAddCar,
  onPassenger,
  onClose,
}: {
  visible: boolean;
  title?: string;
  builds: Build[];
  picked?: string;
  fits: (b: Build) => boolean;
  lockUnfit?: boolean;
  onPick: (buildId: string) => void;
  onAddCar?: () => void;
  onPassenger?: () => void;
  onClose: () => void;
}) {
  return (
    <Sheet visible={visible} title={title} onClose={onClose}>
      {builds.length === 0 ? (
        <View style={{ gap: SPACING.md }}>
          <DsText v="secondary">Add your car or bike so the host knows what's coming, or go along as a passenger.</DsText>
          {onAddCar ? <Button label="Add your car" block onPress={onAddCar} /> : null}
          {onPassenger ? <Button label="Go as a passenger" tier="secondary" block onPress={onPassenger} /> : null}
        </View>
      ) : (
        <View>
          {builds.map((b, i) => {
            const ok = fits(b);
            const locked = lockUnfit && !ok;
            return (
              <View key={b.id}>
                {i > 0 ? <RowDivider inset /> : null}
                <ListRow
                  leading={{ classBadge: classOf(b) }}
                  title={`${b.make} ${b.model}`}
                  subtitle={ok ? bhpLine(b) : `${bhpLine(b)} · ${NOT_OPEN}`}
                  trailing={picked === b.id ? <DsText v="tag" tone="success">Bringing</DsText> : undefined}
                  disabled={locked}
                  onPress={locked ? undefined : () => onPick(b.id)}
                  accessibilityHint={ok ? undefined : 'A host has to say yes'}
                />
              </View>
            );
          })}
        </View>
      )}
    </Sheet>
  );
}
