import { EVENT_LABELS } from '../lib/events';
import type { EventView } from '../lib/eventView';
import type { DistanceOrigin } from '../lib/format';
import { NOT_OPEN } from '../lib/glossary';
import { COLOR, EVENT_COLOURS } from '../theme';
import { ListRow, metaLine, Tag, type EntityTag, type TagTone } from './ds';
import { cardDistance, cardTime, notOpenLine, statusTag } from './TonightCards';

/**
 * An event as a row (K3, Review 16): the one row format on Tonight's list, Search and Me, with the
 * same fields in the same order. The pin in the layer colour (grey once it's over), the title, then
 * "Meet · Sun 10:00 · about 1 mi from home" (kind, the one time phrase from when.ts, the one
 * distance), "Not open to your car" when it isn't, and your status as its tag.
 *
 * `tag` overrides the status tag (Me's "Results"); `notOpen` overrides who-can-come (Search's own
 * check).
 */
export function EventRow({
  view: v,
  now,
  origin,
  onPress,
  tag,
  notOpen,
  accessibilityHint,
}: {
  view: EventView;
  now: Date;
  /** Where distances are measured from (format.ts `distanceOrigin`). */
  origin?: DistanceOrigin | null;
  onPress: () => void;
  tag?: EntityTag;
  notOpen?: boolean;
  accessibilityHint?: string;
}) {
  const e = v.event;
  const shown = tag ?? statusTag(v.status);
  const closed = notOpen ?? !!notOpenLine(v);
  return (
    <ListRow
      leading={{ pin: e.type, colour: v.phase === 'over' || v.phase === 'cancelled' ? COLOR.text.secondary : EVENT_COLOURS[e.type] }}
      title={e.title}
      // Never cut (Review 17, 1.3x text): the meta wraps to as many lines as it needs, breaking after a
      // "·" rather than before it, so no line starts with a dot.
      subtitle={metaLine([EVENT_LABELS[e.type], cardTime(e, now), cardDistance(v, origin)]).replace(/ · /g, '\u00a0· ')}
      subtitleLines={4}
      meta={closed ? NOT_OPEN : undefined}
      trailing={shown ? <Tag label={shown.label} tone={shown.tone as TagTone} /> : undefined}
      onPress={onPress}
      accessibilityHint={accessibilityHint}
    />
  );
}
