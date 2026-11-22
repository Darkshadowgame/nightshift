import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DraftStop } from './events';
import type { EventType, InviteFilter, Sponsor } from './types';
import { clock, type DayChoice } from './when';
import { copyOf, lastMeet } from './meetExtras';
import { penceInput } from './organised';
import type { NightEvent } from './types';

/**
 * The host wizard's draft (REVIEW-10 decision 2): saved on the phone as you go, so a stray back
 * swipe never loses a meet. Opening Host again offers "Carry on with your draft". One draft per
 * person on this phone; editing an event that already exists never makes one.
 */
export interface HostDraft {
  step: number;
  type: EventType;
  title: string;
  description: string;
  areaName: string;
  /** The day picked: a quick day ("Tonight", "Sat 21") or a date from the calendar. */
  day: DayChoice;
  time: string;
  endTime: string | null;
  reveal: number;
  stops: DraftStop[];
  filter: InviteFilter;
  crewOwned: boolean;
  coHosts: string[];
  /** Added later: older drafts have neither. */
  rules?: string[];
  capacity?: number;
  /** Organiser accounts only (organised.ts): kind and its fields. Older drafts have none. */
  kind?: 'local' | 'organised';
  organiser?: string;
  sponsors?: Sponsor[];
  ticketPrice?: string;
  ticketLink?: string;
  savedAt: string;
}

const KEY = (me: string) => `nightshift.hostDraft.${me}`;

/** Worth keeping: anything typed or placed, or past the first step. */
export function worthKeeping(d: Pick<HostDraft, 'step' | 'title' | 'description' | 'stops'>): boolean {
  return d.step > 0 || !!d.title.trim() || !!d.description.trim() || d.stops.some((s) => s.at || s.name.trim());
}

/** "Car park meet · step 3 of 5", for the Carry on card. */
export function draftSummary(d: HostDraft, steps: number): string {
  return `${d.title.trim() || 'No name yet'} · step ${Math.min(d.step, steps - 1) + 1} of ${steps}`;
}

/** A draft whose picked date has gone falls back to the first quick day (Tonight). */
export function restoredDay(d: HostDraft, quick: DayChoice[], now: Date): { picked: DayChoice | null; index: number } {
  if (d.day.date) {
    const at = new Date(d.day.date);
    at.setHours(23, 59, 0, 0);
    return at.getTime() >= now.getTime() ? { picked: d.day, index: quick.length } : { picked: null, index: 0 };
  }
  const i = quick.findIndex((q) => q.days === d.day.days);
  return { picked: null, index: Math.max(0, i) };
}

export async function loadHostDraft(me: string): Promise<HostDraft | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY(me));
    return raw ? (JSON.parse(raw) as HostDraft) : null;
  } catch {
    return null;
  }
}

export async function saveHostDraft(me: string, d: HostDraft): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY(me), JSON.stringify(d));
  } catch {
    // Storage full or blocked: the draft only lives in the form.
  }
}

export async function clearHostDraft(me: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY(me));
  } catch {
    // Nothing to clear.
  }
}

/**
 * "Same as last time": a draft made from the host's previous meet, one week on (or the next free
 * week), at the "Check and post" step so it is two taps: pick it, then post. Name, text, places,
 * rules, places limit, invite rules, crew and co-hosts carry over; nobody going, no history.
 */
export function draftFromEvent(source: NightEvent, me: string, now: Date, id = 'template'): HostDraft {
  const next = copyOf(source, id, now);
  const start = new Date(next.startsAt);
  return {
    step: 3,
    type: next.type,
    title: next.title,
    description: next.description ?? '',
    areaName: next.areaName,
    day: { label: 'Same day next week', days: 0, date: start.toISOString() },
    time: clock(start),
    endTime: next.endsAt ? clock(new Date(next.endsAt)) : null,
    reveal: next.revealMinutesBefore,
    stops: source.stops.map((s) => ({ key: s.id, name: s.name, at: s.at })),
    filter: next.filter,
    crewOwned: !!next.crewId,
    coHosts: next.hostIds.filter((h) => h !== me),
    rules: next.rules,
    capacity: next.capacity,
    ...(source.organised ? { kind: 'organised' as const, organiser: source.organiser ?? '', sponsors: (source.sponsors ?? []).map((x) => ({ ...x })), ticketPrice: penceInput(source.ticketPence), ticketLink: source.ticketUrl ?? '' } : {}),
    savedAt: now.toISOString(),
  };
}

/** The host's most recent finished meet worth copying (not cancelled, not a public show), or null. */
export function templateSource(events: readonly NightEvent[], me: string, now: Date): NightEvent | null {
  const last = lastMeet(events.filter((e) => e.type !== 'show' && e.type !== 'trackday' && e.stops.every((s) => s.at)), me, now);
  return last;
}
