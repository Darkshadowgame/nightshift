import { hasCompleted } from './spots';
import type { Build, Spot } from './types';

/**
 * Drive log: every drive you finish, with the day and the vehicle you used. Phone only. Drives
 * the server already counts for you (your completions) appear too, without a vehicle.
 */
export interface DriveLogEntry {
  spotId: string;
  name: string;
  /** Day only, YYYY-MM-DD. */
  on: string;
  miles?: number;
  /** "Golf GTI": make and model, never a number plate. */
  vehicle?: string;
}

export const MAX_LOG = 300;

export function vehicleName(b: Pick<Build, 'make' | 'model' | 'nickname'> | undefined): string | undefined {
  return b ? `${b.make} ${b.model}`.trim() : undefined;
}

export function savedLog(raw: unknown): DriveLogEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((e): e is DriveLogEntry => !!e && typeof e.spotId === 'string' && typeof e.name === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(e.on)).slice(0, MAX_LOG);
}

export function addLogEntry(log: readonly DriveLogEntry[], e: DriveLogEntry): DriveLogEntry[] {
  return [e, ...log].slice(0, MAX_LOG);
}

/** The log, newest first: the phone's entries, plus finished drives the log doesn't have (a day each). */
export function driveLog(log: readonly DriveLogEntry[], spots: readonly Spot[], me: string): DriveLogEntry[] {
  const have = new Set(log.map((e) => `${e.spotId}|${e.on}`));
  const extra: DriveLogEntry[] = [];
  for (const s of spots) {
    if (s.kind !== 'drive' || !hasCompleted(s, me)) continue;
    for (const c of s.completions) {
      if (c.userId === me && !have.has(`${s.id}|${c.on}`)) {
        have.add(`${s.id}|${c.on}`);
        extra.push({ spotId: s.id, name: s.name, on: c.on, miles: s.miles });
      }
    }
  }
  return [...log, ...extra].sort((a, b) => b.on.localeCompare(a.on));
}
