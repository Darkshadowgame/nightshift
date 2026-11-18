import { endTime, EVENT_LABELS } from '../lib/events';
import { STATUS_LABELS, type EventView, type MyEventStatus } from '../lib/eventView';
import { distanceText, meetDistance, type DistanceOrigin } from '../lib/format';
import { milesBetween } from '../lib/geo';
import { NOT_OPEN, PLACE_NAMES } from '../lib/glossary';
import { photoSource, sampleRef } from '../lib/photoSource';
import type { Build, NightEvent, Spot } from '../lib/types';
import { eventTimeLabel } from '../lib/when';
import { EVENT_COLOURS, SPOT_COLOURS, COLOR } from '../theme';
import { PhotoCard, metaLine, type CardAction, type EntityTag, type Photo, type TagTone } from './ds';
import { PhotoCredit } from './PhotoCredit';

const STATUS_TONES: Record<MyEventStatus, TagTone> = {
  hosting: 'info',
  hosted: 'neutral',
  checkedIn: 'success',
  went: 'neutral',
  going: 'success',
  requested: 'warning',
  declined: 'danger',
};

/**
 * Your status with an event as its one tag (Review 12, K3): Going, Checked in, Went, Hosting…
 * from `myEventStatus()` (eventView.ts). Tonight, the event page, Search and Me all use this, so the
 * same meet says the same thing everywhere. Nothing for an event you have no part in.
 */
export function statusTag(status: MyEventStatus | null | undefined): EntityTag | undefined {
  return status ? { label: STATUS_LABELS[status], tone: STATUS_TONES[status] } : undefined;
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

/**
 * An event's one time phrase on a card or row (4.10, when.ts `eventTimeLabel`): "Live · until 23:00",
 * "Tonight 22:00", "Sat 10:00", "Ended Fri". Never a countdown.
 */
export function cardTime(e: NightEvent, now: Date): string {
  return e.cancelled ? 'Cancelled' : eventTimeLabel(e.startsAt, endTime(e), now);
}

/** The one distance to a meet (format.ts `meetDistance`): the same number before and after you go. */
export function cardDistance(v: EventView, origin: DistanceOrigin | null | undefined): string | null {
  return meetDistance(v.event, origin ?? null, v.shownStop < 0);
}

/** "Not open to your car" on events you can't simply join (Redesign 2: only the negative shows). */
export function notOpenLine(v: EventView): string | undefined {
  return v.role === 'none' || v.role === 'declined' ? NOT_OPEN : undefined;
}

/**
 * An event on a browse surface (Tonight's sheet and list, Search): the one PhotoCard anatomy.
 * Photo (the host's build) → kind line (● Meet) → title → "Live · until 23:00 · 2 mi · 9 going".
 */
export function EventEntityCard({
  view: v,
  now,
  origin,
  onPress,
  tag,
  action,
  builds,
  titleOnPhoto,
}: {
  view: EventView;
  now: Date;
  /** Where distances are measured from (format.ts `distanceOrigin`). */
  origin?: DistanceOrigin | null;
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
      tag={tag ?? statusTag(v.status) ?? null}
      meta={metaLine([cardTime(e, now), cardDistance(v, origin), `${e.going.length} going`])}
      detail={notOpenLine(v)}
      finished={done}
      onPress={onPress}
      action={action}
      titleOnPhoto={titleOnPhoto}
    />
  );
}

/** "12 mi drive": a drive's length. */
export function driveLength(s: Spot): string | null {
  return s.kind === 'drive' && s.miles ? `${s.miles} mi drive` : null;
}

/** The distance to a place, from the same origin and with the same rounding as meets. */
export function placeDistance(s: Spot, origin: DistanceOrigin | null | undefined): string | null {
  return origin ? distanceText(milesBetween(origin.at, s.at), origin.from) : null;
}

/** A drive, photo spot or track on a browse surface. */
export function PlaceEntityCard({ spot: s, origin, onPress }: { spot: Spot; origin?: DistanceOrigin | null; onPress: () => void }) {
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
      meta={metaLine([driveLength(s), s.region, placeDistance(s, origin)])}
      onPress={onPress}
    />
  );
}
