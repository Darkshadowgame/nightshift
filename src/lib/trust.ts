import { endTime } from './events';
import { plural } from './format';
import type { NightEvent } from './types';

/**
 * One trust signal for hosts and recurring meets (level-up: Trusted host + Neighbour-friendly record),
 * and the "Seen in person" mark for a vehicle. Rules only: the numbers come from past meets (here, for
 * the demo) or from the server (`host_records()`, signed in).
 *
 * Conservative on purpose:
 * - A meet "ran" when it is over, wasn't cancelled and at least MIN_ATTENDED people checked in.
 * - Only reports staff UPHELD count against a host. Open, dismissed or anonymous "quiet alerts"
 *   never do.
 * - Any upheld report at all means no mark. Say nothing, never anything negative.
 */

export const MIN_ATTENDED = 3;
/** Meets run, with none upheld, for the "Trusted host" mark. */
export const TRUSTED_MEETS = 5;
/** Meets run, with none upheld, for the plain line on a recurring meet. */
export const RECORD_MEETS = 3;

export interface HostRecord {
  /** Meets this host ran that really happened. */
  meetsRun: number;
  /** Reports on those meets that staff upheld. */
  upheld: number;
}

export type TrustTier = 'trusted' | 'record';

export interface TrustSignal {
  tier: TrustTier;
  /** The mark next to the host's name ("Trusted host"), or the plain line for a shorter record. */
  label: string;
  /** One line of why, for a screen reader and the long press. */
  detail: string;
}

export function attendedCount(e: Pick<NightEvent, 'checkIns'>): number {
  return Object.values(e.checkIns).filter((s) => s.length > 0).length;
}

/** The meets a host ran that really happened, from the meets the phone knows (demo and signed-in cache). */
export function hostRecordFromEvents(events: readonly NightEvent[], hostId: string, now: Date): HostRecord {
  const ran = events.filter((e) => e.hostIds.includes(hostId) && !e.cancelled && now.getTime() >= endTime(e).getTime() && attendedCount(e) >= MIN_ATTENDED);
  return { meetsRun: ran.length, upheld: 0 };
}

/** The demo's made-up earlier meets by the sample hosts, so Trusted host shows somewhere in the demo. */
export const DEMO_HOST_RECORDS: Record<string, HostRecord> = {
  dan: { meetsRun: 8, upheld: 0 },
  kez: { meetsRun: 3, upheld: 0 },
  tom: { meetsRun: 5, upheld: 0 },
};

export function addRecords(a: HostRecord, b: HostRecord): HostRecord {
  return { meetsRun: a.meetsRun + b.meetsRun, upheld: a.upheld + b.upheld };
}

/** The one signal for a host (or null: say nothing). */
export function trustSignal(rec: HostRecord | null | undefined): TrustSignal | null {
  if (!rec || rec.upheld > 0) return null;
  if (rec.meetsRun >= TRUSTED_MEETS) {
    return { tier: 'trusted', label: 'Trusted host', detail: `${plural(rec.meetsRun, 'past meet')} with no upheld reports.` };
  }
  if (rec.meetsRun >= RECORD_MEETS) {
    return { tier: 'record', label: `${plural(rec.meetsRun, 'past meet')}, no complaints`, detail: 'Neighbour friendly: no upheld reports from past meets.' };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Seen in person
// ---------------------------------------------------------------------------

/** Different people at the same meet who must confirm before the mark shows. */
export const SEEN_NEEDED = 3;
/** Confirmations one person can give in a day. */
export const SEEN_PER_DAY = 10;

export interface Sighting {
  buildId: string;
  eventId: string;
  witnessId: string;
}

/** The demo's made-up owners whose vehicles already have the mark, so it shows somewhere in the demo. */
export const DEMO_SEEN_OWNERS = ['dan', 'kez'];

/** Distinct people who say they saw this vehicle. */
export function witnessCount(sightings: readonly Sighting[], buildId: string): number {
  return new Set(sightings.filter((s) => s.buildId === buildId).map((s) => s.witnessId)).size;
}

export function seenInPerson(sightings: readonly Sighting[], buildId: string): boolean {
  return witnessCount(sightings, buildId) >= SEEN_NEEDED;
}

export type SightingCheck = { ok: true } | { ok: false; reason: string };

/** Meets both people checked in at. */
export function sharedMeets(events: readonly NightEvent[], a: string, b: string): NightEvent[] {
  return events.filter((e) => !e.cancelled && (e.checkIns[a] ?? []).length > 0 && (e.checkIns[b] ?? []).length > 0);
}

/**
 * Can `witness` say they saw `ownerId`'s vehicle at this meet? Both checked in there, not your own,
 * and not twice. (The server checks the same again, plus the daily limit.)
 */
export function canConfirmSeen(event: NightEvent, ownerId: string, witnessId: string, buildId: string, sightings: readonly Sighting[], sentToday: number): SightingCheck {
  if (ownerId === witnessId) return { ok: false, reason: "You can't confirm your own vehicle." };
  if ((event.checkIns[witnessId] ?? []).length === 0 || (event.checkIns[ownerId] ?? []).length === 0) {
    return { ok: false, reason: 'Only people who were both at the same meet can confirm this.' };
  }
  if (sightings.some((s) => s.buildId === buildId && s.witnessId === witnessId)) return { ok: false, reason: "You've already confirmed this one." };
  if (sentToday >= SEEN_PER_DAY) return { ok: false, reason: "That's enough for today. Try again tomorrow." };
  return { ok: true };
}
