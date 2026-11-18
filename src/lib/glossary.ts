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

/** The one label for how you relate to an event: card, hero, HUD, Find and the map card. */
export function roleLabel(role: Role): string {
  switch (role) {
    case 'host':
      return 'Hosting';
    case 'going':
      return 'Going';
    case 'requested':
      return 'Requested';
    case 'invited':
      // "Invited" read as a personal invite to a first-timer (REVIEW-8): it means your build fits the invite.
      return 'You can go';
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
  hostEvent: 'Host an event',
  editEvent: 'Edit event',
  changePlan: 'Change the plan',
  addBuild: 'Add a car or bike',
  editBuild: 'Edit build',
  profile: 'Your profile',
  suggest: 'Suggest a place',
  crews: 'Crews',
  newCrew: 'Start a crew',
  notifications: 'Notifications',
  search: 'Search',
  settings: 'Settings',
  help: 'How Nightshift works',
  credits: 'Credits',
  feedback: 'Send feedback',
  newPost: 'New post',
  newThread: 'New thread',
  newChat: 'New chat',
  groupInfo: 'Group',
  connections: 'Connections',
  report: 'Report',
  rateBuilds: 'Rate builds',
  moderation: 'Moderation',
} as const;

/** Confirm-in-place: "{Verb} it / Keep it". */
export function confirmLabels(verb: string): { confirm: string; cancel: string } {
  return { confirm: `${verb} it`, cancel: 'Keep it' };
}
