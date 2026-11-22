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

/** How far the engine's been tuned. One at a time. */
export type TuneStage = 'stock' | 'stage1' | 'stage2' | 'stage2plus' | 'stage3' | 'stage4' | 'custom';

/** A different engine in the chassis. The build's stock bhp and torque are the donor's. */
export interface EngineSwap {
  donorMake: string;
  /** Engine code or donor model, e.g. "Bandit 1200" or "K20A". */
  donorModel: string;
  donorVariant?: string;
  /** Dataset id of the donor (engine or vehicle variant), when picked from the list. */
  donorId?: string;
  bhp: number;
  torqueLbFt?: number;
  /** Weight change from the swap, kg (can be negative). The build's weight already includes it. */
  weightDeltaKg?: number;
}

export interface Mod {
  id: string;
  category: ModCategory;
  name: string;
  /** Claimed power gain, used when there's no dyno figure. */
  bhpGain?: number;
  /** An optional note from the owner ("BC Racing BR, 30 mm drop"), up to 80 characters. */
  note?: string;
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
  /** Dataset id of the base vehicle picked in the vehicle picker (src/data/vehicles.ts). */
  vehicleId?: string;
  /** Tune stage. Also kept as a "Stage N tune" engine mod so older saves and the backend see it. */
  tuneStage?: TuneStage;
  /** Set when the build runs another engine. Also kept as an "… engine swap" engine mod. */
  engineSwap?: EngineSwap;
  /** Dyno runs, oldest first (dyno.ts). The latest sets `dynoBhp`. */
  dynoRuns?: DynoRun[];
  /** Signed in: the server's say on the Dyno badge (public.dyno_badges); the phone never decides it alone. */
  dynoVerified?: boolean;
}

/** One dyno run: peak figures from a sheet, as the owner checked them (dynoParse.ts reads the sheet). */
export interface DynoRun {
  id: string;
  /** The day of the run, YYYY-MM-DD. */
  date: string;
  /** The rolling road or shop (optional). */
  shop?: string;
  /** Peak power in bhp, as measured (at the wheels or the crank). */
  powerBhp: number;
  /** Peak torque in lb-ft. */
  torqueLbFt?: number;
  at: 'wheels' | 'crank';
  /** The units the sheet printed, kept for showing it as it was. */
  powerUnit?: 'bhp' | 'hp' | 'whp' | 'PS' | 'kW';
  torqueUnit?: 'lb-ft' | 'Nm';
  /** The sheet's photo (a stored photo ref). */
  photo?: string;
  /** Staff took the Dyno badge off this sheet (reported as fake or edited). Set by the server. */
  badgeRemoved?: boolean;
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
  /** How far you'd travel for an event, in miles. Private: only you see it. */
  travelMiles?: number;
  /** How you hear about new events near you. Private: only you see it. */
  alerts?: 'notify' | 'search' | 'off';
  /**
   * Their chosen profile picture (a photo ref: a signed link when signed in, a stored name or sample in
   * the demo). Left out: their main vehicle's photo. Public: everyone sees it.
   */
  avatarRef?: string;
}

export interface Crew {
  id: string;
  name: string;
  tag: string;
  memberIds: string[];
  /** Who started the crew. Owners pick the crew's hosts. */
  ownerId?: string;
  /** Members the owner has made hosts. Only the owner and hosts host crew events. */
  hostIds?: string[];
  /** Built-in emblem key like "bolt-2" (crewEmblems.ts). Left out: a default from the crew's id. */
  emblem?: string;
}

export type CrewRole = 'owner' | 'host' | 'member';

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
  /** Rough area shown to invited people before the reveal. Fuzzed: never on a stop (see area.ts). */
  area: LatLng;
  /** Radius of the rough-area circle. Contains every stop, at least 3 mi. */
  areaRadiusMiles?: number;
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
  /** People who don't match the invite and asked to go. Hosts approve or decline. */
  requests?: string[];
  /** Requests a host declined. */
  declined?: string[];
  /**
   * userId -> id of the build they're bringing, for people going and people
   * asking to go. Missing for old data and people going without a vehicle
   * (see bringing.ts for the fallbacks).
   */
  vehicles?: Record<string, string>;
  /** Length of a cruise route, for display. */
  routeMiles?: number;
  /** Changes hosts made to the plan (rolling meets on the night, and edits). Only hosts see this. */
  changes?: PlanChangeLog[];
  /** The host's "Let people invite their connections" (eventInvites.ts). Missing means on. */
  allowInvites?: boolean;
  /**
   * Invites from connections the phone knows about: invitee -> who invited them. Signed in: yours
   * (either way) and, for hosts, the people asking to go.
   */
  invitedBy?: Record<string, string>;
  /**
   * The event's own picture, a photo ref (`sample:` for the demo's night photos). Sample meets only
   * for now: without it the card shows the host's build photo (TonightCards `eventPhotoRef`).
   */
  photo?: string;
  /**
   * Photos taken at the meet (sample meets only, `sample:` refs): the Photos grid shows these instead
   * of the builds' own photos, so a meet has pictures of its own (Review 20 #13).
   */
  gallery?: string[];
  /** Standard house rules the host picked (meetExtras.ts RULES ids), shown on the meet page. */
  rules?: string[];
  /** The most people who can go (hosts don't count). Missing means no limit. */
  capacity?: number;
  /** People waiting for a place once it is full, first in line first. */
  waitlist?: string[];
  /** One-tap status from people going: running late, or left. Seen by hosts and people going. */
  status?: Record<string, 'late' | 'left'>;
  /** userId -> when they first checked in (ISO). Missing for older check-ins. */
  arrivals?: Record<string, string>;
  /**
   * An organised event: planned by an organiser or business (organised.ts). Left out, it is a local
   * meet, except that shows and track days default to organised (`isOrganised`). Only organiser
   * accounts can post one. The four fields below are only ever set on an organised event.
   */
  organised?: boolean;
  /** Who runs it ("Sample Show Co"). */
  organiser?: string;
  /** Up to 3 sponsors, always shown under "Sponsored by". */
  sponsors?: Sponsor[];
  /** Cheapest ticket, in pence. Tickets are sold elsewhere: the app only links out. */
  ticketPence?: number;
  /** An https link to buy tickets, opened in the browser. */
  ticketUrl?: string;
}

/** A sponsor of an organised event: a name, and optionally a shop already listed in the app (`/shop/<shop>`). */
export interface Sponsor {
  name: string;
  /** A shop route id, e.g. `partner:demo-partner-detailing`. */
  shop?: string;
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

/** Venues are meet-friendly places (cafés, venues that welcome meets): info only, like tracks. */
export type SpotKind = 'photo' | 'drive' | 'track' | 'venue';

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
  /** Set when any point is inside a ban zone (a warning, not a block): the most specific zone's name. */
  banZone?: string;
  /** Every ban zone it's in (ids), worked out from the current zones when the app reads it. */
  banZoneIds?: string[];
  /** Drives: the road's speed limit where it's the same all the way (national limit A-roads), for the pace check. */
  limitMph?: number;
  /** Things to know before you go (single-track, snow gates, cameras). */
  warnings?: string[];
  /**
   * Notes from the research behind a bundled place ("Medium confidence: …", "an unnamed OSM car
   * park"). Never shown to users; development builds show them under the place (REVIEW-8).
   */
  devNotes?: string[];
  /** Rough region, e.g. "Peak District". */
  region?: string;
  /** Photo spots: which vehicles it suits (photoVehicles.ts). Missing = cars and bikes; ['bike'] = bikes only (pushed, engine off). */
  vehicles?: VehicleKind[];
  /** Suggested photo spots: the suggester's photo of the place with a car or bike in it (stored name, plate-blurred). */
  photo?: string;
  /**
   * Signed in, on a bundled place: what this phone recorded there before
   * Slipstream's own places were on the server. Shown as "Only on this phone";
   * never counted in rep, "Driven by" or the star average.
   */
  phoneOnly?: { completions: number; stars?: number };
}

/** Someone's drives and photo spots as the server counts them (place_rep_for()): the same on every phone. */
export interface PlaceRep {
  drives: number;
  /** Rep for those drives (each drive's length tier, rep.ts driveTier). */
  drivesRep: number;
  photoSpots: number;
}

export interface BanZone {
  id: string;
  name: string;
  /** Circle zones: the centre. Polygon zones: a point inside, for labels and fitting the map. */
  centre: LatLng;
  /** Circle zones: the radius. Polygon zones: roughly how far the outline reaches from the centre. */
  radiusMiles: number;
  /** Borough- or city-wide orders: simplified council boundary rings (any ring counts). */
  polygons?: LatLng[][];
  /** When the order was last checked against its source (YYYY-MM-DD). */
  checked?: string;
  /** What kind of order it is. Worked out from the note when missing (zones.ts). */
  kind?: 'injunction' | 'pspo' | 'dispersal';
  /** What it bans, in plain words, when known. */
  bans?: string;
  /** When it applies, e.g. "3pm to 7am", when known. */
  hours?: string;
  note: string;
  /**
   * The evidence link: the official source (the council's page or sealed order,
   * the court judgment, or the police force's own notice). A news link goes here
   * only when no official page exists, with sourceKind 'news' and the note saying so.
   */
  source?: string;
  /** Who published `source`. Worked out from its web address when missing (zones.ts). */
  sourceKind?: ZoneSourceKind;
  /** The council (or court, or force) that made the order, for the link label. */
  authority?: string;
  /** A news report as a second, secondary link, when there is an official one too. */
  newsSource?: string;
}

export type ZoneSourceKind = 'council' | 'court' | 'police' | 'news';
