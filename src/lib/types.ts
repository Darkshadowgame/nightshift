export type VehicleKind = 'car' | 'bike';
export type ClassLetter = 'S' | 'A' | 'B' | 'C' | 'D';
export const CLASS_LETTERS: ClassLetter[] = ['S', 'A', 'B', 'C', 'D'];

export type ModCategory =
  | 'engine'
  | 'intake'
  | 'exhaust'
  | 'turbo'
  | 'suspension'
  | 'brakes'
  | 'wheels'
  | 'body'
  | 'interior'
  | 'lighting'
  | 'audio'
  | 'other';

export interface Mod {
  id: string;
  category: ModCategory;
  name: string;
  /** Claimed power gain, used when there's no dyno figure. */
  bhpGain?: number;
}

export interface Build {
  id: string;
  ownerId: string;
  kind: VehicleKind;
  make: string;
  model: string;
  year?: number;
  nickname?: string;
  stockBhp: number;
  /** Kerb weight for cars, wet weight for bikes. */
  weightKg: number;
  torqueLbFt?: number;
  /** A measured figure from a dyno sheet. Wins over stock + mods. */
  dynoBhp?: number;
  mods: Mod[];
  photos: string[];
  /** Accent colour used for the build's card art. */
  colour?: string;
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface User {
  id: string;
  handle: string;
  name: string;
  /** Only used to work out invites. Never shown to other people. */
  home: LatLng;
  region: string;
  crewId?: string;
}

export interface Crew {
  id: string;
  name: string;
  tag: string;
  memberIds: string[];
}

export type EventType = 'cruise' | 'rolling' | 'meet' | 'show' | 'trackday';

export interface Stop {
  id: string;
  name: string;
  /** Rolling meets can add a stop on the night, so a planned stop may have no place yet. */
  at?: LatLng;
  note?: string;
  /** Set when a host moves the rolling meet on to this stop (ISO time). */
  revealedAt?: string;
}

export interface InviteFilter {
  everyone: boolean;
  cars: boolean;
  bikes: boolean;
  /** Empty means every class. */
  classes: ClassLetter[];
  minMods: number;
  /** Empty means every brand. */
  brands: string[];
  radiusMiles: number;
}

export interface NightEvent {
  id: string;
  type: EventType;
  title: string;
  description?: string;
  startsAt: string;
  endsAt?: string;
  /** Approximate area shown to invited people before the reveal. */
  area: LatLng;
  areaName: string;
  stops: Stop[];
  /** Rolling meets: the index of the stop the meet is at now. */
  currentStop: number;
  revealMinutesBefore: number;
  hostIds: string[];
  crewId?: string;
  filter: InviteFilter;
  going: string[];
  /** userId -> stop ids checked in at. */
  checkIns: Record<string, string[]>;
  cancelled?: boolean;
  /** Length of a cruise route, for display. */
  routeMiles?: number;
  /** Changes hosts made to the plan (rolling meets on the night, and edits). Only hosts see this. */
  changes?: PlanChangeLog[];
}

export interface PlanChangeLog {
  id: string;
  at: string;
  /** User id of the host who made the change. */
  by: string;
  /** What changed, in plain words. May name places, so hosts only. */
  text: string;
  /** Set when the new place is inside a ban zone. */
  banZone?: string;
}

export interface ChatMessage {
  id: string;
  eventId: string;
  userId: string;
  text: string;
  at: string;
  /** App-written line (e.g. "Hosts changed the plan"), shown differently from people's messages. */
  system?: boolean;
}

export type SpotKind = 'photo' | 'drive' | 'track';

export type SpotStatus = 'pending' | 'approved';

/**
 * A finished drive or a photo spot visit. Only the day is kept: never a time
 * of day, a duration or a speed.
 */
export interface SpotCompletion {
  userId: string;
  /** Day only, YYYY-MM-DD. */
  on: string;
  /** Photo spots: a plate-blurred photo taken on the visit. */
  photo?: string;
}

export interface SpotRating {
  userId: string;
  stars: number;
}

export interface Spot {
  id: string;
  kind: SpotKind;
  name: string;
  at: LatLng;
  description: string;
  /** Drives: the line of the road. Each point is a checkpoint. */
  path?: LatLng[];
  miles?: number;
  /** Who suggested it. Tracks have no author. */
  authorId?: string;
  status: SpotStatus;
  createdAt: string;
  completions: SpotCompletion[];
  ratings: SpotRating[];
  /** Set when any point is inside a ban zone (a warning, not a block). */
  banZone?: string;
}

export interface BanZone {
  id: string;
  name: string;
  centre: LatLng;
  radiusMiles: number;
  note: string;
}
