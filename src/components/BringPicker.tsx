import { Pressable, View } from 'react-native';
import { buildTag } from '../lib/bringing';
import { classOf } from '../lib/classes';
import type { Build } from '../lib/types';
import { C } from '../theme';
import { Button, Card, ClassBadge, Row, Txt } from './ui';

/**
 * Pick which of your builds you're bringing. Builds the invite doesn't cover
 * are shown and marked; `lockUnfit` (at check-in) makes them unpickable.
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
}) {
  return (
    <Card accent={C.sodium}>
      <Txt v="eyebrow">{title}</Txt>
      <View accessibilityRole="radiogroup" style={{ gap: 8 }}>
        {builds.map((b) => {
          const on = b.id === picked;
          const ok = fits(b);
          const locked = lockUnfit && !ok;
          const tag = buildTag(b);
          return (
            <Pressable
              key={b.id}
              onPress={() => onPick(b.id)}
              disabled={locked}
              accessibilityRole="radio"
              accessibilityState={{ checked: on, disabled: !!locked }}
              accessibilityLabel={`${b.make} ${b.model}, class ${classOf(b)}${tag ? `, ${tag}` : ''}${ok ? '' : ", doesn't match the invite"}`}
              style={({ pressed }) => [
                {
                  flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 8, borderWidth: 1,
                  borderColor: on ? C.sodium : C.kerb, backgroundColor: on ? `${C.sodium}1f` : C.tarmac,
                },
                (pressed || locked) && { opacity: locked ? 0.45 : 0.8 },
              ]}
            >
              <ClassBadge letter={classOf(b)} size="sm" />
              <View style={{ flex: 1 }}>
                <Txt numberOfLines={1}>{b.make} {b.model}</Txt>
                {tag ? <Txt v="label" style={{ color: C.magenta }} numberOfLines={1}>{tag}</Txt> : null}
                {b.nickname ? <Txt v="muted" numberOfLines={1} style={{ fontSize: 12 }}>{b.nickname}</Txt> : null}
                {ok ? null : <Txt v="label" style={{ color: C.alert, fontSize: 11 }}>Doesn't match the invite</Txt>}
              </View>
              <Txt v="label" style={{ color: on ? C.sodium : C.fog }}>{on ? '● ' : '○ '}</Txt>
            </Pressable>
          );
        })}
      </View>
      {note ? <Txt v="muted" style={{ fontSize: 12 }} accessibilityLiveRegion="polite">{note}</Txt> : null}
      <Row style={{ flexWrap: 'nowrap' }}>
        <Button label={confirmLabel} style={{ flex: 1 }} disabled={!picked} onPress={onConfirm} />
        <Button label="Cancel" kind="ghost" onPress={onCancel} />
      </Row>
    </Card>
  );
}
