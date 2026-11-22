import type { AwardCategory } from './awards';
import type { AlertMode, SearchFilters } from './discover';
import type { PlanChange } from './events';
import type { ProfileDraft } from './profile';
import type { DriveRun, SpotDraft, Verdict } from './spots';
import type { MeetStatus } from './meetExtras';
import type { Build, InviteFilter, LatLng, NightEvent } from './types';

/**
 * Every write the screens make, behind one interface with two implementations:
 *
 * - LocalRepository (localRepository.ts): the demo. Rules run on the phone
 *   (src/lib/*.ts) against the sample scene saved in AsyncStorage.
 * - SupabaseRepository (backend/remote.ts): signed in. Plain data goes to
 *   tables, anything with a rule goes to an RPC that checks it again on the
 *   server and raises with the same sentence the phone shows
 *   (docs/BACKEND.md section 5 maps each one).
 *
 * Every method is async and rejects with an Error whose message can be shown
 * as it is.
 */
export interface Repository {
  readonly kind: 'local' | 'supabase';
  saveBuild(b: Build): Promise<void>;
  deleteBuild(id: string): Promise<void>;
  /** Create an event. Resolves with its id (the server's, when signed in). */
  saveEvent(e: NightEvent): Promise<string>;
  /** Host edits an event before it starts. */
  editEvent(e: NightEvent): Promise<void>;
  /** Host changes a rolling meet's stops on the night. Resolves with any ban-zone warning. */
  changePlan(eventId: string, change: PlanChange): Promise<{ warning?: string }>;
  saveProfile(draft: ProfileDraft): Promise<void>;
  setTravelPrefs(prefs: { travelMiles?: number; alerts?: AlertMode }): Promise<void>;
  /**
   * Your profile picture (avatar.ts): a photo ref (a library pick, or one of your vehicle photos), or null
   * for the default. Signed in it is uploaded and saved on your profile for everyone to see; in the demo it is
   * kept on the demo person. `onlyIfNone`: leave an existing choice alone (moving the old per-phone choice up).
   */
  setAvatar(ref: string | null, onlyIfNone?: boolean): Promise<void>;
  /** 'waitlisted': the meet is full, so you are in line for a place (meetExtras.ts). */
  setGoing(eventId: string, going: boolean, buildId?: string): Promise<'going' | 'requested' | 'waitlisted' | 'none'>;
  /** One-tap status for people going: running late, left, or null to clear it. */
  setMeetStatus(eventId: string, status: MeetStatus | null): Promise<void>;
  /** A host adds a co-host after the meet is made. */
  addCoHost(eventId: string, userId: string): Promise<void>;
  answerRequest(eventId: string, userId: string, approve: boolean): Promise<void>;
  /**
   * Invite connections to an event (eventInvites.ts). Resolves with the ids newly invited. Each gets
   * a notice and the event's card in your 1-to-1 chat (in the demo the screen sends the cards).
   * `connected`/`blocked`: your connections as the Community tab has them (the demo checks with them;
   * the server checks its own).
   */
  inviteConnections(eventId: string, userIds: string[], ctx: { connected: string[]; blocked: ReadonlySet<string> }): Promise<string[]>;
  /**
   * `buildId`: the build you actually turned up in, if it isn't the one you said.
   * `position`: the phone's GPS fix, compared with the stop and never stored (required signed in).
   */
  checkIn(eventId: string, stopIndex: number, buildId?: string, position?: LatLng | null): Promise<void>;
  moveOn(eventId: string): Promise<void>;
  cancelEvent(eventId: string): Promise<void>;
  sendChat(eventId: string, text: string): Promise<void>;
  vote(eventId: string, category: AwardCategory, buildId: string): Promise<void>;
  finishDrive(spotId: string, run: DriveRun): Promise<Verdict>;
  /** `position`: the GPS fix the distance check used (signed in, places on the server). */
  visitSpot(spotId: string, photo?: string, position?: LatLng | null): Promise<void>;
  rateSpot(spotId: string, stars: number): Promise<void>;
  suggestSpot(draft: SpotDraft): Promise<{ id: string; warning?: string }>;
  joinCrew(crewId: string): Promise<void>;
  leaveCrew(): Promise<void>;
  createCrew(name: string, tag: string): Promise<string>;
  setCrewHost(crewId: string, userId: string, host: boolean): Promise<void>;
  /** The owner picks the crew's built-in emblem (crewEmblems.ts). */
  setCrewEmblem(crewId: string, emblem: string): Promise<void>;
  /** Demo only: bring a sample person into your crew. */
  addToCrew(crewId: string, userId: string): Promise<void>;
  markNoticesRead(): Promise<void>;
}

/** Signed-in extras the screens use when they're there (null in the demo). */
export interface BackendExtras {
  /** Re-read everything from the server. */
  refresh(): Promise<void>;
  /** Live updates for one event (chat, going, check-ins, the meet moving on). Returns the unsubscribe. */
  watchEvent(eventId: string): () => void;
  /** Find events on the server (search_events()): ids nearest first with the distance in miles. */
  searchEvents(filters: SearchFilters, from: LatLng | null): Promise<{ eventId: string; miles: number; canGo: boolean }[]>;
  /** The host form's live count (invite_count()): null means "fewer than 3". */
  inviteCount(filter: InviteFilter, area: LatLng): Promise<{ people: number | null; builds: number | null }>;
  /** False until the event invites migration is live on the server: the screens hide Invite connections. */
  invitesLive(): boolean;
  /** False until the meets level-up migration is live on the server: the screens hide its extras. */
  meetsLive(): boolean;
  /** False until the organised events migration (20261122190000) is live: the host form hides the Kind choice. */
  organiserLive(): boolean;
  /** Your account is marked as an organiser (staff set it). Always false in the demo. */
  isOrganiser(): boolean;
  /** Meet history and, for hosts, regulars and newcomers (meet_stats()); null when not live. */
  meetStats(eventId: string): Promise<{ runs: number; typical: number | null; regulars: number | null; newcomers: number | null } | null>;
}
