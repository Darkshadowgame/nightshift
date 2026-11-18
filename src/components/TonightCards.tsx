import { isSeedEvent } from '../lib/demoTime';
import { EVENT_LABELS } from '../lib/events';
import type { EventView } from '../lib/eventView';
import { formatWhen } from '../lib/format';
import { formatMiles } from '../lib/geo';
import { roleLabel, PLACE_NAMES, UNLOCK } from '../lib/glossary';
import { countdown, unlocksIn } from '../lib/hud';
import { endTime } from '../lib/events';
import type { Role } from '../lib/eventView';
import type { Spot } from '../lib/types';
import { EVENT_COLOURS, SPOT_COLOURS, COLOR } from '../theme';
import { EntityCard, metaLine, type EntityTag, type TagTone } from './ds';

/** A role as one status tag: Going, Hosting, Requested, Invited. Public needs no tag. */
export function roleTag(role: Role): EntityTag | undefined {
  const tone: Partial<Record<Role, TagTone>> = { host: 'selected', going: 'success', requested: 'warning', invited: 'info', declined: 'danger' };
  const label = roleLabel(role);
  return label && tone[role] ? { label, tone: tone[role] } : undefined;
}

/** When, in one phrase: "Live · ends in 2h 10m", "Tonight 22:30 · in 3h", "Sat 23 Nov 22:30". */
export function whenLine(v: EventView, now: Date): string {
  const e = v.event;
  if (v.phase === 'live') return `Live · ends in ${countdown(endTime(e), now)}`;
  if (v.phase === 'cancelled') return 'Cancelled';
  if (v.phase === 'over') return 'Finished';
  const soon = new Date(e.startsAt).getTime() - now.getTime() < 24 * 3_600_000;
  return soon ? `${formatWhen(e.startsAt, now)} · in ${countdown(e.startsAt, now)}` : formatWhen(e.startsAt, now);
}

/**
 * An event on a browse surface (Tonight's sheet and list, Search): the one EntityCard anatomy.
 * The place is the shown stop, or the rough area while it's locked (and when it unlocks).
 */
export function EventEntityCard({
  view: v,
  now,
  miles,
  onPress,
  tag,
  action,
}: {
  view: EventView;
  now: Date;
  /** Distance to the shown stop or the rough area, already worked out. */
  miles?: number | null;
  onPress: () => void;
  /** Overrides the role tag, e.g. "New". */
  tag?: EntityTag;
  action?: { label: string; onPress: () => void; busy?: boolean };
}) {
  const e = v.event;
  const locked = v.shownStop < 0;
  const unlock = unlocksIn(v, now);
  const place = locked ? `${e.areaName} · ${unlock ? UNLOCK.in(unlock) : UNLOCK.locked}` : e.stops[v.shownStop].name;
  const done = v.phase === 'over' || v.phase === 'cancelled';
  return (
    <EntityCard
      kind="event"
      eyebrow={EVENT_LABELS[e.type]}
      layerColour={EVENT_COLOURS[e.type]}
      mark={{ pin: locked ? 'locked' : e.type, colour: done ? COLOR.text.secondary : EVENT_COLOURS[e.type] }}
      title={e.title}
      sample={isSeedEvent(e.id)}
      status={tag ?? (v.phase === 'live' && !roleTag(v.role) ? { label: 'Live', tone: 'live' } : roleTag(v.role))}
      meta={metaLine([whenLine(v, now), `${e.going.length} going`, miles != null ? formatMiles(miles) : null])}
      detail={place}
      finished={done}
      onPress={onPress}
      action={action}
    />
  );
}

/** A drive, photo spot, track or meet spot on a browse surface. */
export function PlaceEntityCard({ spot: s, miles, onPress, milesFrom = '' }: { spot: Spot; miles?: number | null; onPress: () => void; milesFrom?: string }) {
  return (
    <EntityCard
      kind="place"
      eyebrow={PLACE_NAMES[s.kind].one}
      layerColour={s.status === 'pending' ? COLOR.text.secondary : SPOT_COLOURS[s.kind]}
      mark={{ pin: s.kind, colour: s.status === 'pending' ? COLOR.text.secondary : SPOT_COLOURS[s.kind] }}
      title={s.name}
      status={s.status === 'pending' ? { label: 'Waiting', tone: 'warning' } : undefined}
      meta={metaLine([s.kind === 'drive' && s.miles ? `${s.miles} mi drive` : null, s.region, miles != null ? `${formatMiles(miles)}${milesFrom}` : null])}
      onPress={onPress}
    />
  );
}
