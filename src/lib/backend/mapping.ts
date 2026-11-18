/**
 * Supabase rows <-> the app's types (src/lib/types.ts). Pure, so the mapping
 * is unit-tested without a network (see __tests__/backendMapping.test.ts).
 * Column names follow supabase/migrations; docs/BACKEND.md section 5 has the
 * action-by-action table.
 */
import type { Award, AwardCategory, Vote } from '../awards';
import type { AlertMode } from '../discover';
import type { Notice } from '../notice';
import type { ProgressMap } from '../placeStore';
import type { Build, ClassLetter, DynoRun, Crew, EngineSwap, EventType, LatLng, Mod, ModCategory, NightEvent, PlaceRep, PlanChangeLog, Spot, Stop, TuneStage, User, VehicleKind, ChatMessage } from '../types';

// ---------------------------------------------------------------------------
// Rows (only the columns the app reads)
// ---------------------------------------------------------------------------

export interface ProfileRow { id: string; handle: string | null; display_name: string | null; region: string | null; onboarded: boolean }
export interface HomeRow { user_id: string; lat: number; lng: number }
export interface SettingsRow { travel_miles: number; new_event_alerts: AlertMode }
export interface ModRow { id: string; build_id?: string; category: ModCategory; name: string; bhp_gain: number | null; position: number }
export interface BuildPhotoRow { id?: string; storage_path: string; position: number }
export interface DynoRunRow {
  id?: string; build_id?: string; run_on: string; shop: string | null; power_bhp: number; torque_lb_ft: number | null;
  measured_at: 'wheels' | 'crank'; power_unit: string | null; torque_unit: string | null; storage_path: string | null; position: number;
}
export interface BuildRow {
  id: string; owner_id: string; kind: VehicleKind; make: string; model: string; year: number | null; nickname: string | null;
  stock_bhp: number; weight_kg: number; torque_lb_ft: number | null; dyno_bhp: number | null; colour: string | null;
  vehicle_id: string | null; tune_stage: TuneStage | null; engine_swap: EngineSwap | null;
  build_mods?: ModRow[]; build_photos?: BuildPhotoRow[]; build_dyno_runs?: DynoRunRow[];
}
export interface CrewMemberRow { user_id: string; role: 'owner' | 'host' | 'member'; joined_at: string }
export interface CrewRow { id: string; name: string; tag: string; crew_members?: CrewMemberRow[] }
export interface EventRow {
  id: string; type: EventType; title: string; description: string | null; starts_at: string; ends_at: string | null;
  reveal_minutes_before: number; area_lat: number; area_lng: number; area_radius_miles: number; area_name: string;
  current_stop: number; crew_id: string | null; route_miles: number | null;
  invite_everyone: boolean; invite_cars: boolean; invite_bikes: boolean; invite_classes: ClassLetter[]; invite_min_mods: number;
  invite_brands: string[]; invite_radius_miles: number; created_by: string | null; cancelled_at: string | null; created_at?: string;
}
/** A row from get_event_stops(): locked stops have name, lat, lng and note null and visible false. */
export interface StopRow { id: string; event_id: string; position: number; name: string | null; lat: number | null; lng: number | null; note: string | null; revealed_at: string | null; visible: boolean }
export interface GoingRow { event_id: string; user_id: string; build_id: string | null }
export interface RequestRow { event_id: string; user_id: string; status: 'pending' | 'approved' | 'declined'; build_id: string | null }
export interface CheckInRow { event_id: string; user_id: string; stop_id: string }
export interface HostRow { event_id: string; user_id: string }
export interface PlanChangeRow { id: string; event_id: string; by_user: string | null; at: string; text: string; ban_zone: string | null }
export interface ChatRow { id: string; event_id: string; user_id: string; body: string; system: boolean; created_at: string }
export interface VoteRow { event_id: string; voter_id: string; category: AwardCategory; build_id: string; created_at: string }
export interface AwardRow { event_id: string; category: AwardCategory; build_id: string; owner_id: string; votes: number; awarded_at: string }
export interface NoticeRow { id: string; event_id: string | null; kind: string; key: string | null; title: string; body: string; created_at: string; read_at: string | null }
export interface SpotRow {
  id: string; kind: Spot['kind']; name: string; description: string; lat: number; lng: number; path: LatLng[] | null; miles: number | null;
  author_id: string | null; status: 'pending' | 'approved' | 'rejected'; created_at: string; ban_zone: string | null; warnings: string[] | null; region: string | null;
  /** Nightshift's own places: the app's stable id (src/data/places.ts). Null for places people suggest. */
  bundled_id?: string | null;
  limit_mph?: number | null;
}
export interface SpotStatsRow { spot_id: string; people: number; rating_average: number | null; rating_count: number; completed_by_me: boolean }
export interface CompletionRow { spot_id: string; completed_on: string; photo_path: string | null }
export interface RatingRow { spot_id: string; stars: number }
export interface PlaceRepRow { user_id: string; drives: number; drives_rep: number; photo_spots: number }

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Server ids are UUIDs; the app's own ids (`ev-…`, `crew-…`) only exist on the phone. */
export function isUuid(id: string | null | undefined): id is string {
  return !!id && UUID.test(id);
}

/**
 * Where other people live is never sent to the phone (profile_homes is
 * owner-only). Their User.home is this placeholder; anything that needs other
 * people's homes (invite counts, invites) asks the server instead.
 */
export const UNKNOWN_HOME: LatLng = { lat: 0, lng: 0 };

const num = (v: number | string | null | undefined): number | undefined => (v === null || v === undefined || v === '' ? undefined : Number(v));

// ---------------------------------------------------------------------------
// People
// ---------------------------------------------------------------------------

export function userFromRows(p: ProfileRow, opts: { home?: HomeRow | null; settings?: SettingsRow | null; crewId?: string } = {}): User {
  return {
    id: p.id,
    handle: p.handle ?? '',
    name: p.display_name ?? '',
    region: p.region ?? '',
    home: opts.home ? { lat: opts.home.lat, lng: opts.home.lng } : UNKNOWN_HOME,
    ...(opts.crewId ? { crewId: opts.crewId } : {}),
    ...(opts.settings ? { travelMiles: opts.settings.travel_miles, alerts: opts.settings.new_event_alerts } : {}),
  };
}

// ---------------------------------------------------------------------------
// Garage
// ---------------------------------------------------------------------------

/**
 * `photoUrl` turns a Storage path into something an <Image> can show (a signed
 * URL). The path is kept recoverable from it by storagePathOf().
 */
export function buildFromRow(r: BuildRow, photoUrl: (path: string) => string = (p) => p): Build {
  const mods: Mod[] = [...(r.build_mods ?? [])]
    .sort((a, b) => a.position - b.position)
    .map((m) => ({ id: m.id, category: m.category, name: m.name, ...(num(m.bhp_gain) !== undefined ? { bhpGain: num(m.bhp_gain) } : {}) }));
  const photos = [...(r.build_photos ?? [])].sort((a, b) => a.position - b.position).map((p) => photoUrl(p.storage_path));
  const b: Build = {
    id: r.id, ownerId: r.owner_id, kind: r.kind, make: r.make, model: r.model,
    stockBhp: Number(r.stock_bhp), weightKg: Number(r.weight_kg), mods, photos,
  };
  if (r.year !== null) b.year = r.year;
  if (r.nickname) b.nickname = r.nickname;
  if (num(r.torque_lb_ft) !== undefined) b.torqueLbFt = num(r.torque_lb_ft);
  if (num(r.dyno_bhp) !== undefined) b.dynoBhp = num(r.dyno_bhp);
  if (r.colour) b.colour = r.colour;
  if (r.vehicle_id) b.vehicleId = r.vehicle_id;
  if (r.tune_stage) b.tuneStage = r.tune_stage;
  if (r.engine_swap) b.engineSwap = r.engine_swap;
  if (r.build_dyno_runs?.length) b.dynoRuns = [...r.build_dyno_runs].sort((a, c) => a.position - c.position).map((d) => dynoRunFromRow(d, photoUrl));
  return b;
}

const POWER_UNITS = ['bhp', 'hp', 'whp', 'PS', 'kW'] as const;
const TORQUE_UNITS = ['lb-ft', 'Nm'] as const;

export function dynoRunFromRow(d: DynoRunRow, photoUrl: (path: string) => string = (p) => p): DynoRun {
  const run: DynoRun = { id: d.id ?? `${d.run_on}-${d.position}`, date: d.run_on, powerBhp: Number(d.power_bhp), at: d.measured_at };
  if (num(d.torque_lb_ft) !== undefined) run.torqueLbFt = num(d.torque_lb_ft);
  if (d.shop) run.shop = d.shop;
  const pu = POWER_UNITS.find((u) => u === d.power_unit);
  if (pu) run.powerUnit = pu;
  const tu = TORQUE_UNITS.find((u) => u === d.torque_unit);
  if (tu) run.torqueUnit = tu;
  if (d.storage_path) run.photo = photoUrl(d.storage_path);
  return run;
}

/** Rows for a build's dyno runs; `pathOf` gives each run's stored photo path (or null). */
export function dynoRunsToRows(buildId: string, runs: DynoRun[], pathOf: (run: DynoRun) => string | null): DynoRunRow[] {
  return runs.map((r, position) => ({
    build_id: buildId, run_on: r.date, shop: r.shop?.trim() ? r.shop.trim().slice(0, 60) : null, power_bhp: r.powerBhp, torque_lb_ft: r.torqueLbFt ?? null,
    measured_at: r.at, power_unit: r.powerUnit ?? null, torque_unit: r.torqueUnit ?? null, storage_path: pathOf(r), position,
  }));
}

/** The builds row to upsert (owner_id comes from auth.uid() on insert). Empty strings become null. */
export function buildToRow(b: Build): Omit<BuildRow, 'owner_id' | 'build_mods' | 'build_photos' | 'build_dyno_runs'> {
  const trim = (s?: string) => (s && s.trim() ? s.trim() : null);
  const colour = b.colour && /^#[0-9a-fA-F]{6}$/.test(b.colour) ? b.colour : null;
  return {
    id: b.id, kind: b.kind, make: b.make.trim(), model: b.model.trim(), year: b.year ?? null, nickname: trim(b.nickname),
    stock_bhp: b.stockBhp, weight_kg: b.weightKg, torque_lb_ft: b.torqueLbFt ?? null, dyno_bhp: b.dynoBhp ?? null, colour,
    vehicle_id: trim(b.vehicleId), tune_stage: b.tuneStage ?? null, engine_swap: b.engineSwap ?? null,
  };
}

export function modsToRows(buildId: string, mods: Mod[]): Omit<ModRow, 'id'>[] {
  return mods.map((m, i) => ({ build_id: buildId, category: m.category, name: m.name.trim().slice(0, 60), bhp_gain: m.bhpGain ?? null, position: i }));
}

/** The Storage path inside a signed URL (…/object/sign/photos/<path>?token=…), or null for anything else. */
export function storagePathOf(ref: string, bucket = 'photos'): string | null {
  const m = ref.match(new RegExp(`/storage/v1/object/(?:sign|public|authenticated)/${bucket}/([^?#]+)`));
  return m ? decodeURIComponent(m[1]) : null;
}

/** Where a new build photo goes: photos/{uid}/builds/{buildId}/{uuid}.jpg (the bucket policy needs {uid} first). */
export function buildPhotoPath(uid: string, buildId: string, fileId: string, ext = 'jpg'): string {
  return `${uid}/builds/${buildId}/${fileId}.${ext}`;
}

export function spotPhotoPath(uid: string, spotId: string, fileId: string, ext = 'jpg'): string {
  return `${uid}/spots/${spotId}/${fileId}.${ext}`;
}

/** A suggested photo spot's own photo (the suggester's, plate-blurred): one fixed path per place. */
export function suggestedPhotoPath(authorId: string, spotId: string): string {
  return `${authorId}/spots/${spotId}/suggested.jpg`;
}

// ---------------------------------------------------------------------------
// Crews
// ---------------------------------------------------------------------------

export function crewFromRow(r: CrewRow): Crew {
  const members = [...(r.crew_members ?? [])].sort((a, b) => a.joined_at.localeCompare(b.joined_at));
  return {
    id: r.id, name: r.name, tag: r.tag,
    memberIds: members.map((m) => m.user_id),
    ownerId: members.find((m) => m.role === 'owner')?.user_id,
    hostIds: members.filter((m) => m.role === 'host').map((m) => m.user_id),
  };
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

/**
 * A stop as this person may see it. Locked stops keep their id and position
 * but have no place and a neutral name, so the app's own canSeeStop() (which
 * needs `at`) can never show more than the server allowed.
 */
export function stopFromRow(r: StopRow): Stop {
  if (!r.visible || r.lat === null || r.lng === null) {
    return { id: r.id, name: `Meet point ${r.position + 1}`, ...(r.revealed_at ? { revealedAt: r.revealed_at } : {}) };
  }
  return {
    id: r.id, name: r.name ?? `Meet point ${r.position + 1}`, at: { lat: r.lat, lng: r.lng },
    ...(r.note ? { note: r.note } : {}), ...(r.revealed_at ? { revealedAt: r.revealed_at } : {}),
  };
}

export interface EventParts {
  hosts: HostRow[];
  going: GoingRow[];
  requests: RequestRow[];
  checkIns: CheckInRow[];
  stops: StopRow[];
  changes?: PlanChangeRow[];
}

export function eventFromRows(r: EventRow, parts: EventParts): NightEvent {
  const mine = <T extends { event_id: string }>(xs: T[]) => xs.filter((x) => x.event_id === r.id);
  const going = mine(parts.going);
  const requests = mine(parts.requests);
  const vehicles: Record<string, string> = {};
  for (const g of going) if (g.build_id) vehicles[g.user_id] = g.build_id;
  for (const q of requests) if (q.status === 'pending' && q.build_id && !vehicles[q.user_id]) vehicles[q.user_id] = q.build_id;
  const checkIns: Record<string, string[]> = {};
  for (const c of mine(parts.checkIns)) (checkIns[c.user_id] ??= []).push(c.stop_id);
  const stops = mine(parts.stops).sort((a, b) => a.position - b.position).map(stopFromRow);
  const changes: PlanChangeLog[] = mine(parts.changes ?? []).map((c) => ({
    id: c.id, at: c.at, by: c.by_user ?? '', text: c.text, ...(c.ban_zone ? { banZone: c.ban_zone } : {}),
  }));
  const e: NightEvent = {
    id: r.id, type: r.type, title: r.title, startsAt: r.starts_at,
    area: { lat: r.area_lat, lng: r.area_lng }, areaRadiusMiles: Number(r.area_radius_miles), areaName: r.area_name,
    stops, currentStop: r.current_stop, revealMinutesBefore: r.reveal_minutes_before,
    hostIds: mine(parts.hosts).map((h) => h.user_id),
    filter: {
      everyone: r.invite_everyone, cars: r.invite_cars, bikes: r.invite_bikes, classes: r.invite_classes ?? [],
      minMods: r.invite_min_mods, brands: r.invite_brands ?? [], radiusMiles: Number(r.invite_radius_miles),
    },
    going: going.map((g) => g.user_id),
    checkIns,
    requests: requests.filter((q) => q.status === 'pending').map((q) => q.user_id),
    declined: requests.filter((q) => q.status === 'declined').map((q) => q.user_id),
    vehicles,
  };
  if (r.description) e.description = r.description;
  if (r.ends_at) e.endsAt = r.ends_at;
  if (r.crew_id) e.crewId = r.crew_id;
  if (r.route_miles !== null && r.route_miles !== undefined) e.routeMiles = Number(r.route_miles);
  if (r.cancelled_at) e.cancelled = true;
  if (changes.length) e.changes = changes;
  return e;
}

/** save_event()'s arguments. `create`: a new event (the server makes its id); otherwise an edit of `e.id`. */
export function eventToRpc(e: NightEvent, me: string, create: boolean): { p_event: Record<string, unknown>; p_stops: Record<string, unknown>[]; p_cohost_ids: string[] } {
  return {
    p_event: {
      id: create ? null : e.id,
      type: e.type,
      title: e.title,
      description: e.description ?? null,
      starts_at: e.startsAt,
      ends_at: e.endsAt ?? null,
      reveal_minutes_before: e.revealMinutesBefore,
      area: { lat: e.area.lat, lng: e.area.lng },
      area_radius_miles: e.areaRadiusMiles ?? 3,
      area_name: e.areaName,
      crew_id: e.crewId && isUuid(e.crewId) ? e.crewId : null,
      route_miles: e.routeMiles ?? null,
      filter: {
        everyone: e.filter.everyone, cars: e.filter.cars, bikes: e.filter.bikes, classes: e.filter.classes,
        min_mods: e.filter.minMods, brands: e.filter.brands, radius_miles: e.filter.radiusMiles,
      },
    },
    p_stops: e.stops.map((s) => ({ id: isUuid(s.id) ? s.id : null, name: s.name, lat: s.at?.lat ?? null, lng: s.at?.lng ?? null, note: s.note ?? null })),
    p_cohost_ids: e.hostIds.filter((h) => h !== me && isUuid(h)),
  };
}

// ---------------------------------------------------------------------------
// Chat, votes, awards, notices
// ---------------------------------------------------------------------------

export function chatFromRow(r: ChatRow): ChatMessage {
  return { id: r.id, eventId: r.event_id, userId: r.user_id, text: r.body, at: r.created_at, ...(r.system ? { system: true } : {}) };
}

export function voteFromRow(r: VoteRow): Vote {
  return { eventId: r.event_id, voterId: r.voter_id, category: r.category, buildId: r.build_id, at: r.created_at };
}

export function awardFromRow(r: AwardRow): Award {
  return { eventId: r.event_id, category: r.category, buildId: r.build_id, ownerId: r.owner_id, votes: r.votes, at: r.awarded_at };
}

/**
 * Votes are secret on the server: you read only your own, and the results
 * come from the `awards` view. The app works out trophies from a vote list
 * (awards.ts), so each award becomes that many anonymous tallies ("tally:…"),
 * which gives the same winners and counts. For events whose awards are in,
 * your own votes are left out (they're already counted in the tally).
 */
export function votesForApp(own: VoteRow[], awards: AwardRow[]): Vote[] {
  const done = new Set(awards.map((a) => a.event_id));
  const tallies: Vote[] = awards.flatMap((a) =>
    Array.from({ length: a.votes }, (_, i) => ({
      eventId: a.event_id, voterId: `tally:${a.event_id}:${a.category}:${i}`, category: a.category, buildId: a.build_id,
      // The winner reached the top count first: tallies are dated before the close, oldest first.
      at: new Date(new Date(a.awarded_at).getTime() - 86_400_000 + i).toISOString(),
    })),
  );
  return [...own.filter((v) => !done.has(v.event_id)).map(voteFromRow), ...tallies];
}

const NOTICE_KINDS = new Set(['reveal', 'soon', 'moved', 'nearby', 'host']);

export function noticeFromRow(r: NoticeRow): Notice {
  const kind = NOTICE_KINDS.has(r.kind) ? (r.kind as Notice['kind']) : undefined;
  return {
    id: r.id, eventId: r.event_id ?? '', text: `${r.title}. ${r.body}`, at: r.created_at, read: !!r.read_at,
    ...(kind ? { kind } : {}), ...(r.key ? { key: r.key } : {}),
  };
}

// ---------------------------------------------------------------------------
// Places people suggested (the bundled ones stay in the app)
// ---------------------------------------------------------------------------

/**
 * A place from the server. Who drove it and how they rated it stays on the
 * server (spot_stats() gives counts only), so other people's completions and
 * ratings are anonymous stand-ins ("someone:…") that give the same counts and
 * average; yours are real.
 */
export function spotFromRow(r: SpotRow, opts: { me: string; stats?: SpotStatsRow; mine?: CompletionRow[]; myRating?: RatingRow; photoUrl?: (path: string) => string }): Spot {
  const { me, stats, mine = [], myRating } = opts;
  const photoUrl = opts.photoUrl ?? ((p: string) => p);
  const myDays = mine.filter((c) => c.spot_id === r.id);
  const completions = myDays.map((c) => ({ userId: me, on: c.completed_on, ...(c.photo_path ? { photo: photoUrl(c.photo_path) } : {}) }));
  const others = Math.max(0, (stats?.people ?? 0) - (myDays.length > 0 ? 1 : 0));
  for (let i = 0; i < others; i++) completions.push({ userId: `someone:${r.id}:${i}`, on: '' });
  const ratings: Spot['ratings'] = [];
  const count = stats?.rating_count ?? 0;
  const average = stats?.rating_average === null || stats?.rating_average === undefined ? null : Number(stats.rating_average);
  const mineCounts = !!myRating && myDays.length > 0 && r.author_id !== me;
  if (mineCounts) ratings.push({ userId: me, stars: myRating!.stars });
  const rest = count - (mineCounts ? 1 : 0);
  if (rest > 0 && average !== null) {
    // The others' average, so the overall average comes out as the server's.
    const othersAverage = (average * count - (mineCounts ? myRating!.stars : 0)) / rest;
    for (let i = 0; i < rest; i++) ratings.push({ userId: `someone:${r.id}:${i}`, stars: othersAverage });
  }
  const spot: Spot = {
    id: r.id, kind: r.kind, name: r.name, at: { lat: r.lat, lng: r.lng }, description: r.description,
    status: r.status === 'approved' ? 'approved' : 'pending', createdAt: r.created_at, completions, ratings,
  };
  if (r.path && r.path.length) spot.path = r.path;
  if (r.miles !== null) spot.miles = Number(r.miles);
  if (r.author_id) spot.authorId = r.author_id;
  if (r.ban_zone) spot.banZone = r.ban_zone;
  if (r.warnings?.length) spot.warnings = r.warnings;
  if (r.region) spot.region = r.region;
  if (r.limit_mph !== null && r.limit_mph !== undefined) spot.limitMph = Number(r.limit_mph);
  return spot;
}

/**
 * Server places split in two: rows for Nightshift's own places this app has
 * (matched by bundled_id, never by name) become progress on the bundled place
 * plus the server id the RPCs need; everything else is a place in its own
 * right (people's suggestions, or a bundled place this app version doesn't know yet).
 */
export function splitBundledRows(
  rows: { row: SpotRow; spot: Spot }[],
  bundledIds: ReadonlySet<string>,
): { own: Spot[]; ids: Record<string, string>; progress: ProgressMap } {
  const own: Spot[] = [];
  const ids: Record<string, string> = {};
  const progress: ProgressMap = {};
  for (const { row, spot } of rows) {
    const key = row.bundled_id;
    if (!key || !bundledIds.has(key)) {
      own.push(spot);
      continue;
    }
    ids[key] = row.id;
    if (spot.completions.length || spot.ratings.length) progress[key] = { completions: spot.completions, ratings: spot.ratings };
  }
  return { own, ids, progress };
}

/** place_rep_for() rows by user id. */
export function placeRepFromRows(rows: PlaceRepRow[]): Record<string, PlaceRep> {
  return Object.fromEntries(rows.map((r) => [r.user_id, { drives: Number(r.drives) || 0, drivesRep: Number(r.drives_rep) || 0, photoSpots: Number(r.photo_spots) || 0 }]));
}
