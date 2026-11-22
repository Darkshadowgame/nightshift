import type { Role } from './eventView';
import type { SpotKind } from './types';

/**
 * The words the app uses, in one place (REVIEW-5 M2, glossary in docs/SPEC.md).
 * Screens import these rather than writing their own, so a role, a kind of
 * place or a menu path reads the same everywhere.
 *
 * | Use                                   | Not                                   |
 * |---------------------------------------|---------------------------------------|
 * | event (cruise, rolling meet, meet, show, track day) | "meet" as the generic word |
 * | Hosting                               | You host, organiser                   |
 * | Request to go / Requested / Cancel request | Ask to go, Asked to go, Withdraw request |
 * | Public                                | Open to all, Everyone welcome         |
 * | meet point (where an event is)        | stop, spot, venue (for events)        |
 * | Location shows 1 h before / at 21:30  | unlocks, reveal, revealed             |
 * | Shown to people going                 | unlocked, stop locked                 |
 * | area (the circle before it shows)     | rough area                            |
 * | drive (a road to enjoy)               | route (only a cruise's line)          |
 * | meet spot                             | venue, coffee & meet spot             |
 * | check in                              | visit (in buttons)                    |
 * | meet ban                              | ban zone, car-meet order, order area  |
 * | Navigate                              | Start navigation, Navigate the drive  |
 * | Couldn't                              | Could not                             |
 */

/**
 * The one label for how you relate to an event: card, hero, HUD, search and the map card.
 * Being invited says nothing (Redesign 2: "You can go" and "Invited" are cut); only the opposite
 * shows, as `NOT_OPEN`. `filter` is kept for callers that still pass it.
 */
export function roleLabel(role: Role, _filter?: { everyone: boolean }): string {
  switch (role) {
    case 'host':
      return 'Hosting';
    case 'going':
      return 'Going';
    case 'requested':
      return 'Requested';
    case 'invited':
      return '';
    case 'public':
      return 'Public';
    case 'declined':
      return 'Declined';
    default:
      return '';
  }
}

/** Which state tone a role tag uses (the DS `Tag` tones). Hosting is brand, never a layer colour. */
export type Tone = 'brand' | 'success' | 'warning' | 'info' | 'muted' | 'danger' | 'live';
export function roleTone(role: Role): Tone {
  switch (role) {
    case 'host':
      return 'brand';
    case 'going':
      return 'success';
    case 'requested':
      return 'warning';
    case 'invited':
      return 'info';
    case 'declined':
      return 'danger';
    default:
      return 'muted';
  }
}

/** On an event your build can't join (the only invite wording a card shows). */
export const NOT_OPEN = 'Not open to your car';

/** Buttons and sentences about going. */
export const GOING = {
  join: "I'm going",
  request: 'Request to go',
  requestSent: 'Request sent',
  cancelRequest: 'Cancel request',
  leave: "Can't make it",
  /** "Public" events: shows and track days, or an invite open to everyone. */
  public: 'Public',
} as const;

/** Where an event is: one meet point for a meet, several for a rolling meet or a cruise. */
export const MEET_POINT = { one: 'meet point', many: 'meet points' } as const;

/** "1 h", "2 h", "30 min", "1 h 30 min": how far ahead of the start the location shows. */
export function leadText(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return [h ? `${h} h` : null, m ? `${m} min` : null].filter(Boolean).join(' ') || '0 min';
}

/**
 * The exact location becoming visible to the people going, in plain words
 * (REVIEW-7 problem 2). Never "unlocks" or "stop".
 */
export const LOCATION = {
  /** Card meta while it's hidden: "Sample area · location hidden". */
  hidden: 'location hidden',
  /** "Location shows in 2h 10m". */
  showsIn: (what: string) => `Location shows in ${what}`,
  /** "Location shows at 21:30". */
  showsAt: (time: string) => `Location shows at ${time}`,
  /** "Location shows 1 h before", or "at the start" when the lead is 0. */
  lead: (minutes: number) => (minutes > 0 ? `Location shows ${leadText(minutes)} before` : 'Location shows at the start'),
  /** Who sees it. */
  toGoing: 'Shown to people going',
  /** Stat tile value once it's visible to you. */
  shown: 'Shown',
  hiddenValue: 'Hidden',
  /** The host form's control. */
  setting: 'When the location shows',
} as const;

/** Before the meet point shows, a meet is "Around Tamworth". */
export function aroundArea(area: string): string {
  return `Around ${area}`;
}

/**
 * Who the location line is for (Redesign 2, 4.11):
 * - `notGoing`: "Location shows at 21:30 to people going."
 * - `hidden` (you're going): "Location shows at 21:30 (in 20 min)."
 * - `shown`: "Leisure park car park, Tamworth."
 * - `rolling` (shown, a rolling meet): "Now at Leisure park car park. Next location when the host moves on."
 * - `host` (before it shows): "People going see it at 21:30 (1 h before)."
 */
export type LocationState = 'notGoing' | 'hidden' | 'shown' | 'rolling' | 'host';

export type LocationLineInput = {
  state: LocationState;
  /** When it shows, "21:30" (notGoing, hidden, host). */
  time?: string;
  /** Minutes until it shows: adds "(in 20 min)" when under 60 (hidden only: one countdown per screen). */
  minutesTo?: number | null;
  /** The meet point's name (shown, rolling). */
  point?: string;
  /** The town after the point (shown). */
  town?: string;
  /** How long before the start it shows (host): "(1 h before)". */
  leadMinutes?: number;
};

/** The one sentence about where a meet is. Never stop, unlock, locked, rough area, reveal. */
export function locationSentence({ state, time, minutesTo, point, town, leadMinutes }: LocationLineInput): string {
  const at = time ?? 'the start';
  switch (state) {
    case 'notGoing':
      // A meet that's already on: the time has passed, so no time ("Location shows to people going.").
      return time ? `Location shows at ${time} to people going.` : 'Location shows to people going.';
    case 'hidden':
      return minutesTo != null && minutesTo > 0 && minutesTo < 60 ? `Location shows at ${at} (in ${Math.ceil(minutesTo)} min).` : `Location shows at ${at}.`;
    case 'shown': {
      // The town once (C5, Review 19): "Tamworth meet point." never "Tamworth meet point, Tamworth.".
      const name = point ?? 'Meet point';
      const saysTown = !!town && new RegExp(`\\b${town.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(name);
      return `${[name, saysTown ? null : town].filter(Boolean).join(', ')}.`;
    }
    case 'rolling':
      return `Now at ${point ?? 'the meet point'}. Next location when the host moves on.`;
    case 'host':
      return leadMinutes ? `People going see it at ${at} (${leadText(leadMinutes)} before).` : `People going see it at ${at}.`;
  }
}

/** The demo's one tag and its explanation (Redesign 2, 3.1). */
export const DEMO_NIGHT = {
  /** A meet the demo put you down for (seed.ts DEMO_SEEDED_GOING): on its row and in the sheet (Review 20). */
  seededGoing: "You're going (demo)",
  tag: 'Demo night',
  title: 'Demo night',
  body: "The demo runs on its own clock: Friday night from 21:10, whatever time your phone says, so a meet is always on and you can try everything. Every time in the demo follows that clock. Nothing leaves this phone, and check-in doesn't need you to be at the meet point.",
} as const;

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Tonight's header tag in the demo (owner decision, Review 19): the demo's clock, said once,
 * "Demo · Fri 21:10" (shown in capitals), so every time on screen makes sense at any phone time.
 */
export function demoClockTag(now: Date): string {
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `Demo · ${DAYS[now.getDay()]} ${hh}:${mm}`;
}

/** "Demo · Fri": the demo's day, by a time that follows its clock (the route preview's arrival, chats). */
export function demoDayTag(now: Date): string {
  return `Demo · ${DAYS[now.getDay()]}`;
}

/**
 * The one explanation of class (C5, Review 14): every screen that explains Class uses this sentence,
 * and nothing else (Add a car, Power and dyno, Help, the badge). It matches classes.ts: the headline
 * bhp against the weight (cars: bhp scaled for weight; bikes: bhp per tonne), each on its own scale.
 */
export const CLASS_EXPLAINER = "Class comes from your build's bhp for its weight, with cars and bikes on their own scales, from S (the quickest) down to D.";

/**
 * Words that never appear on a first-level screen (Redesign 2, 4.12, with the owner's decisions in
 * section 9: rep and levels stay as one line on Me and the "+150 rep" moment after check-in;
 * whp, bhp/tonne and "claimed" stay on the Power and dyno page). `__tests__/glossary.test.ts`
 * scans the strings in src/app and src/components for them.
 */
export const BANNED_WORDS: { word: string; re: RegExp; allowIn?: RegExp }[] = [
  { word: 'stop', re: /\bstops?\b/i },
  { word: 'unlock', re: /\bunlock(s|ed|ing)?\b/i },
  { word: 'locked', re: /\blocked\b/i },
  { word: 'rough area', re: /\brough area\b/i },
  { word: 'Sample area', re: /\bSample area\b/i },
  { word: 'Sample (tag)', re: /^Sample$/ },
  { word: 'rep', re: /\brep\b/i, allowIn: /\(tabs\)\/me\.tsx$|components\/(Rep|LadderSheet)\.tsx$|event\/\[id\]\.tsx$/ },
  { word: 'level', re: /\blevels?\b/i, allowIn: /\(tabs\)\/me\.tsx$|components\/(Rep|LadderSheet)\.tsx$/ },
  { word: 'Legend', re: /\bLegend\b/, allowIn: /\(tabs\)\/me\.tsx$|components\/(Rep|LadderSheet)\.tsx$/ },
  { word: 'whp', re: /\bwhp\b/i, allowIn: /dyno|power/i },
  { word: 'bhp/tonne', re: /bhp\s*(\/|per)\s*tonne/i, allowIn: /dyno|power/i },
  { word: 'car scale', re: /\bcar scale\b/i },
  { word: 'claimed', re: /\bclaimed\b/i, allowIn: /dyno|power/i },
  { word: 'invited', re: /\binvited\b/i },
  { word: 'you can go', re: /\byou can go\b/i },
  { word: 'Find', re: /\bFind\b/ },
  { word: 'Where to?', re: /\bWhere to\?/i },
  { word: '+ Host', re: /\+ ?Host\b/ },
  { word: 'Count it without directions', re: /Count it without directions/i },
];

/** Kinds of place, singular and plural. Venues are "meet spots" everywhere in the UI. */
export const PLACE_NAMES: Record<SpotKind, { one: string; many: string }> = {
  drive: { one: 'Drive', many: 'Drives' },
  photo: { one: 'Photo spot', many: 'Photo spots' },
  track: { one: 'Track', many: 'Tracks' },
  venue: { one: 'Meet spot', many: 'Meet spots' },
};

/** "Open drive ›", "Open meet spot ›". */
export function openPlaceLabel(kind: SpotKind): string {
  return `Open ${PLACE_NAMES[kind].one.toLowerCase()} ›`;
}

/** A link's text: "Open ›" or "{Verb} ›". */
export function linkLabel(verb = 'Open'): string {
  return `${verb} ›`;
}

/** A path through the menus, always with "›": menuPath('Settings', 'Demo') is "Settings › Demo". */
export function menuPath(...parts: string[]): string {
  return parts.join(' › ');
}

/** Where things live, for copy that sends people somewhere. */
export const WHERE = {
  demoSkipGps: menuPath('Me', 'Settings', 'Demo'),
  reminders: menuPath('Me', 'Settings', 'Reminders'),
  layers: 'the layers button on the map',
} as const;

/** Marks for things that aren't shared with anyone. */
/** A car-meet order area (PSPO, injunction or dispersal order). The kind goes in the detail. */
export const MEET_BAN = 'Meet ban';

/** One label for directions, events and places alike. */
export const NAVIGATE = 'Navigate';

export const ONLY_ON_PHONE = 'Only on this phone';
/** @deprecated Redesign 2 cuts "Sample" tags on cards: the Tonight header carries DEMO_NIGHT instead. */
export const SAMPLE = 'Sample';

/**
 * Stack header titles: one helper, capitals (native stack headers can't
 * transform text). Detail screens (event, place, build, profile, crew) leave
 * the header blank; their hero carries the title.
 */
export function title(text: string): string {
  return text.toLocaleUpperCase('en-GB');
}

export const SCREEN_TITLES = {
  hostEvent: 'Host a meet',
  editEvent: 'Edit event',
  changePlan: 'Change the plan',
  going: 'Going',
  addBuild: 'Add a car or bike',
  editBuild: 'Edit build',
  profile: 'Your profile',
  suggest: 'Suggest a place',
  crews: 'Crews',
  newCrew: 'Start a crew',
  notifications: 'Notifications',
  search: 'Search',
  settings: 'Settings',
  help: 'How Slipstream works',
  credits: 'Credits',
  feedback: 'Send feedback',
  post: 'Post',
  newPost: 'New post',
  newThread: 'New thread',
  newChat: 'New chat',
  groupInfo: 'Group',
  connections: 'Connections',
  report: 'Report',
  passport: 'Passport',
  recap: 'Your year',
  quiet: 'Quiet alert',
  rateBuilds: 'Rate builds',
  moderation: 'Moderation',
} as const;

/**
 * Confirm-in-place (4.5): "{Verb} it / Keep it", unless the verb is ambiguous; then pass both
 * outcomes in plain words (`explicit`), as leaving a meet does (`LEAVE_MEET`).
 */
export function confirmLabels(verb: string, explicit?: { confirm?: string; cancel?: string }): { confirm: string; cancel: string } {
  return { confirm: explicit?.confirm || `${verb} it`, cancel: explicit?.cancel || 'Keep it' };
}

/** Leaving a meet: "Leave it" also reads as "leave it alone" (Review 16), so both outcomes are said. */
export const LEAVE_MEET = { confirm: "Yes, I can't go", cancel: "I'm still going" } as const;
