import { endTime, EVENT_LABELS } from '../lib/events';
import type { EventView, Role } from '../lib/eventView';
import { distanceText } from '../lib/format';
import { NOT_OPEN, PLACE_NAMES } from '../lib/glossary';
import { photoSource, sampleRef } from '../lib/photoSource';
import type { Build, NightEvent, Spot } from '../lib/types';
import { clock, endedLabel, whenLabel } from '../lib/when';
import { EVENT_COLOURS, SPOT_COLOURS, COLOR } from '../theme';
import { ListRow, PhotoCard, Tag, metaLine, type CardAction, type EntityTag, type Photo, type TagTone } from './ds';
import { PhotoCredit } from './PhotoCredit';

/** A role as one status tag: Going, Hosting, Requested. Nothing for an event you can simply go to. */
export function roleTag(role: Role, _filter?: { everyone: boolean }): EntityTag | undefined {
  const tags: Partial<Record<Role, EntityTag>> = {
    host: { label: 'Hosting', tone: 'info' },
    going: { label: 'Going', tone: 'success' },
    requested: { label: 'Requested', tone: 'warning' },
    declined: { label: 'Declined', tone: 'danger' },
  };
  return tags[role];
}

/**
 * Every event gets a picture (Redesign 2, 5.1): the host's build photo, else (in the card's
 * fallback) the area drawing in the layer colour. Returns the stored photo ref, for credits.
 */
export function eventPhotoRef(e: NightEvent, builds: Build[]): string | null {
  for (const h of e.hostIds) {
    const b = builds.find((x) => x.ownerId === h && x.photos.length > 0);
    if (b) return b.photos[0];
  }
  return null;
}

export function eventPhoto(e: NightEvent, builds: Build[]): Photo | null {
  const ref = eventPhotoRef(e, builds);
  return ref ? photoSource(ref) : null;
}

/** An event's one time phrase on a card: "Until 23:00" (live), "Tonight 22:00", "Sat 10:00", "Ended Fri". Never a countdown. */
export function cardTime(e: NightEvent, now: Date): string {
  const start = new Date(e.startsAt);
  const end = endTime(e);
  if (e.cancelled) return 'Cancelled';
  if (end.getTime() <= now.getTime()) return endedLabel(end, now);
  if (start.getTime() <= now.getTime()) return `Until ${clock(end)}`;
  return whenLabel(start, now);
}

/** "2 mi" / "2 mi from home" to a shown meet point, "about 6 mi" to a hidden one's area. */
export function cardDistance(v: EventView, miles: number | null | undefined, fromHome: boolean): string | null {
  if (miles == null) return null;
  return v.shownStop < 0 ? distanceText(miles, 'about') : distanceText(miles, fromHome ? 'home' : 'you');
}

/** "Not open to your car" on events you can't simply join (Redesign 2: only the negative shows). */
export function notOpenLine(v: EventView): string | undefined {
  return v.role === 'none' || v.role === 'declined' ? NOT_OPEN : undefined;
}

/**
 * An event on a browse surface (Tonight's sheet and list, Search): the one PhotoCard anatomy.
 * Photo (the host's build) → kind line (● Live · Meet) → title → "Until 23:00 · 2 mi · 9 going".
 */
export function EventEntityCard({
  view: v,
  now,
  miles,
  onPress,
  tag,
  action,
  milesFrom = '',
  builds,
  titleOnPhoto,
}: {
  view: EventView;
  /** " from home" when the distance isn't from a GPS fix. */
  milesFrom?: string;
  now: Date;
  /** Distance to the shown meet point or the area, already worked out. */
  miles?: number | null;
  onPress: () => void;
  /** Overrides the role tag. */
  tag?: EntityTag;
  action?: CardAction | null;
  /** For the host's build photo. Without it the card draws the area. */
  builds?: Build[];
  titleOnPhoto?: boolean;
}) {
  const e = v.event;
  const done = v.phase === 'over' || v.phase === 'cancelled';
  const ref = builds ? eventPhotoRef(e, builds) : null;
  return (
    <PhotoCard
      kind="event"
      photo={ref ? photoSource(ref) : null}
      overlay={ref ? <PhotoCredit photoRef={ref} overlay corner="topRight" /> : undefined}
      eyebrow={EVENT_LABELS[e.type]}
      layerColour={EVENT_COLOURS[e.type]}
      live={v.phase === 'live'}
      title={e.title}
      tag={tag ?? roleTag(v.role, e.filter) ?? null}
      meta={metaLine([cardTime(e, now), cardDistance(v, miles, milesFrom.includes('home')), `${e.going.length} going`])}
      detail={notOpenLine(v)}
      finished={done}
      onPress={onPress}
      action={action}
      titleOnPhoto={titleOnPhoto}
    />
  );
}

/** An event as a row (This week, Later, notifications): pin, title, "Tomorrow 20:00 · about 9 mi", tag. */
export function EventRow({ view: v, now, miles, milesFrom = '', onPress }: { view: EventView; now: Date; miles?: number | null; milesFrom?: string; onPress: () => void }) {
  const e = v.event;
  const tag = roleTag(v.role, e.filter);
  return (
    <ListRow
      leading={{ pin: e.type, colour: v.phase === 'over' ? COLOR.text.secondary : EVENT_COLOURS[e.type] }}
      title={e.title}
      subtitle={metaLine([cardTime(e, now), cardDistance(v, miles, milesFrom.includes('home'))])}
      meta={notOpenLine(v)}
      trailing={tag ? <Tag label={tag.label} tone={tag.tone as TagTone} /> : undefined}
      onPress={onPress}
    />
  );
}

/** A drive, photo spot or track on a browse surface. */
export function PlaceEntityCard({ spot: s, miles, onPress, milesFrom = '' }: { spot: Spot; miles?: number | null; onPress: () => void; milesFrom?: string }) {
  const ref = s.photo ?? sampleRef(s.id);
  return (
    <PhotoCard
      kind="place"
      photo={ref ? photoSource(ref) : null}
      overlay={ref ? <PhotoCredit photoRef={ref} kind="place" overlay corner="topRight" /> : undefined}
      eyebrow={PLACE_NAMES[s.kind].one}
      layerColour={s.status === 'pending' ? COLOR.text.secondary : SPOT_COLOURS[s.kind]}
      title={s.name}
      tag={s.status === 'pending' ? { label: 'Waiting', tone: 'warning' } : null}
      meta={metaLine([s.kind === 'drive' && s.miles ? `${s.miles} mi drive` : null, s.region, miles != null ? distanceText(miles, milesFrom.includes('home') ? 'home' : 'you') : null])}
      onPress={onPress}
    />
  );
}
