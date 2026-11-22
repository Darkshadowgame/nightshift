import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { BAN_ZONES } from '../../data/seed';
import { applyPlanChange } from '../events';
import { isFull } from '../meetExtras';
import type { Persisted } from '../localState';
import type { Notice } from '../notice';
import { notifyNow } from '../notify';
import { deletePhotos, photoUri } from '../photos';
import { BUNDLED_IDS, isBundled } from '../placeStore';
import { profileProblem } from '../profile';
import type { BackendExtras, Repository } from '../repository';
import { draftProblem, driveMiles, judgeRun } from '../spots';
import type { Build, ChatMessage, NightEvent, PlaceRep, Spot, User } from '../types';
import { uuid } from '../ids';
import { avatarUploadPath, ownPath, planAvatar } from '../avatar';
import { isMissingColumn } from '../mediaLimits';
import { SPAM_PROBLEMS } from '../moderation';
import type { PendingFeedback } from '../feedbackQueue';
import {
  buildFromRow,
  buildPhotoPath,
  buildToRow,
  dynoRunsToRows,
  chatFromRow,
  crewFromRow,
  eventFromRows,
  eventToRpc,
  isUuid,
  modsToRows,
  noticeFromRow,
  placeRepFromRows,
  splitBundledRows,
  spotFromRow,
  spotPhotoPath,
  suggestedPhotoPath,
  storagePathOf,
  userFromRows,
  votesForApp,
  type AwardRow,
  type BuildRow,
  type ChatRow,
  type CheckInRow,
  type CompletionRow,
  type CrewRow,
  type EventRow,
  type GoingRow,
  type HomeRow,
  type HostRow,
  type InviteRow,
  type NoticeRow,
  type PlaceRepRow,
  type PlanChangeRow,
  type ProfileRow,
  type RatingRow,
  type RequestRow,
  type SettingsRow,
  type SpotRow,
  type SpotStatsRow,
  type StatusRow,
  type StopRow,
  type VoteRow,
  type WaitRow,
} from './mapping';
import { sendPendingFeedback, type AppInfo } from './feedback';
import { enqueue, flushOutbox, isNetworkError, OFFLINE, type OutboxItem } from './outbox';

/** How long signed photo links last; every refresh makes new ones. */
const SIGNED_URL_SECONDS = 7 * 24 * 3600;
/** Events that ended longer ago than this drop off the phone (events_for_me()'s default). */
const PAST_DAYS = 8;
/** A bundled place the server doesn't have a row for (the seed hasn't been run for it yet). */
export const NOT_ON_SERVER = "This place isn't on the server yet, so it can't count. Try again after the next update.";

export interface RemoteContext {
  client: SupabaseClient;
  uid: string;
  /** The latest state (not a render's snapshot). */
  get(): Persisted;
  set(fn: (s: Persisted) => Persisted): void;
  /** Every place on the map: bundled ones (with the server's progress), then the server's others. */
  spots(): Spot[];
  /** Reached the server, or couldn't. */
  setOnline(online: boolean): void;
  outbox: { get(): OutboxItem[]; set(items: OutboxItem[]): void };
  /** For feedback: app version, update id, device. */
  appInfo(): AppInfo;
}

export type SupabaseRepository = Repository &
  BackendExtras & {
    /** Send queued writes and the pending feedback. */
    flush(): Promise<void>;
    /** Live notices (e.g. "moved on") for this person. Returns the unsubscribe. */
    watchNotices(): () => void;
    /** Apple 5.1.1(v): delete your photos, then your account and everything in it. */
    deleteAccount(): Promise<void>;
  };

type Result<T> = { data: T | null; error: { message: string } | null };

export function createSupabaseRepository(ctx: RemoteContext): SupabaseRepository {
  const { client, uid, get, set } = ctx;

  // -------------------------------------------------------------------------
  // Plumbing
  // -------------------------------------------------------------------------

  /** Run one request: the server's sentence as the error, OFFLINE when it never got there. */
  async function call<T>(run: () => PromiseLike<Result<T>>): Promise<T> {
    let res: Result<T>;
    try {
      res = await run();
    } catch (e) {
      if (isNetworkError(e)) {
        ctx.setOnline(false);
        throw new Error(OFFLINE);
      }
      throw e instanceof Error ? e : new Error(String(e));
    }
    if (res.error) {
      if (isNetworkError(res.error)) {
        ctx.setOnline(false);
        throw new Error(OFFLINE);
      }
      ctx.setOnline(true);
      throw new Error(res.error.message);
    }
    ctx.setOnline(true);
    return res.data as T;
  }
  const rpc = <T>(name: string, args: Record<string, unknown> = {}) => call<T>(() => client.rpc(name, args) as unknown as PromiseLike<Result<T>>);
  const offline = (e: unknown) => e instanceof Error && e.message === OFFLINE;

  async function signed(paths: string[]): Promise<Map<string, string>> {
    const out = new Map<string, string>();
    const unique = Array.from(new Set(paths.filter(Boolean)));
    if (unique.length === 0) return out;
    try {
      const { data } = await client.storage.from('photos').createSignedUrls(unique, SIGNED_URL_SECONDS);
      for (const d of data ?? []) if (d.path && d.signedUrl) out.set(d.path, d.signedUrl);
    } catch {
      // Photos just don't show until the next refresh.
    }
    return out;
  }

  async function upload(path: string, ref: string): Promise<void> {
    const res = await fetch(photoUri(ref));
    const body = await res.arrayBuffer();
    const contentType = /\.png$/i.test(path) ? 'image/png' : 'image/jpeg';
    await call(() => client.storage.from('photos').upload(path, body, { contentType, upsert: true }) as unknown as PromiseLike<Result<unknown>>);
  }

  // -------------------------------------------------------------------------
  // Reads
  // -------------------------------------------------------------------------

  /**
   * Invites (20261121090000_event_invites.sql): yours either way, and who invited the people asking
   * to go to events you host. Before that migration is live both reads fail: invites stay off.
   */
  let invitesOn = false;
  async function loadInvites(ids: string[]): Promise<InviteRow[]> {
    try {
      const [own, forHost] = await Promise.all([
        call<InviteRow[]>(() => client.from('event_invites').select('event_id,inviter_id,invitee_id').in('event_id', ids)),
        rpc<{ event_id: string; user_id: string; inviter_id: string }[]>('request_inviters', { p_event_ids: ids }),
      ]);
      invitesOn = true;
      return [...own, ...forHost.map((r) => ({ event_id: r.event_id, inviter_id: r.inviter_id, invitee_id: r.user_id }))];
    } catch (e) {
      if (!offline(e)) invitesOn = false;
      return [];
    }
  }

  /** The host's "Let people invite their connections". Nothing to save before invites are live (the form hides it then). */
  async function setEventInvites(eventId: string, on: boolean): Promise<void> {
    if (invitesOn) await rpc('set_event_invites', { p_event_id: eventId, p_on: on });
  }

  /** True once the meets level-up migration (20261122140000) answers: statuses, waitlist, places, rules, history. */
  let meetsOn = false;

  async function loadMeetParts(ids: string[]): Promise<{ statuses: StatusRow[]; waitlist: WaitRow[] }> {
    try {
      const [statuses, waitlist] = await Promise.all([
        call<StatusRow[]>(() => client.from('event_status').select('event_id,user_id,status').in('event_id', ids)),
        call<WaitRow[]>(() => client.from('event_waitlist').select('event_id,user_id,build_id,created_at').in('event_id', ids)),
      ]);
      meetsOn = true;
      return { statuses, waitlist };
    } catch (e) {
      if (!offline(e)) meetsOn = false;
      return { statuses: [], waitlist: [] };
    }
  }

  /** The host's places and house rules, saved once the migration is live. */
  async function setMeetOptions(e: NightEvent, eventId: string): Promise<void> {
    if (!meetsOn) return;
    await rpc('set_meet_options', { p_event_id: eventId, p_capacity: e.capacity ?? null, p_rules: e.rules ?? [] });
  }

  async function loadEventParts(ids: string[]) {
    if (ids.length === 0) return { hosts: [], going: [], requests: [], checkIns: [], stops: [], changes: [], chat: [], invites: [], statuses: [], waitlist: [] };
    const [hosts, going, requests, checkIns, stops, changes, chat, invites, meetParts] = await Promise.all([
      call<HostRow[]>(() => client.from('event_hosts').select('event_id,user_id').in('event_id', ids)),
      call<GoingRow[]>(() => client.from('event_going').select('event_id,user_id,build_id').in('event_id', ids)),
      call<RequestRow[]>(() => client.from('event_requests').select('event_id,user_id,status,build_id').in('event_id', ids)),
      call<CheckInRow[]>(() => client.from('check_ins').select('event_id,user_id,stop_id,checked_in_at').in('event_id', ids)),
      rpc<StopRow[]>('get_event_stops', { p_event_ids: ids }),
      call<PlanChangeRow[]>(() => client.from('plan_changes').select('id,event_id,by_user,at,text,ban_zone').in('event_id', ids).order('at')),
      call<ChatRow[]>(() => client.from('chat_messages').select('id,event_id,user_id,body,system,created_at').in('event_id', ids).order('created_at').limit(2000)),
      loadInvites(ids),
      loadMeetParts(ids),
    ]);
    return { hosts, going, requests, checkIns, stops, changes, chat, invites, ...meetParts };
  }

  /** Chat lines still waiting in the outbox, so they stay on screen until sent. */
  function queuedChat(eventIds?: Set<string>): ChatMessage[] {
    return ctx.outbox
      .get()
      .flatMap((x) => (x.kind === 'chat' && (!eventIds || eventIds.has(x.eventId)) ? [{ id: x.id, eventId: x.eventId, userId: uid, text: x.text, at: x.at }] : []));
  }

  /** The server's places: people's suggestions as places, Slipstream's own as progress on the bundled ones. */
  async function loadSpots(): Promise<{ spots: Spot[]; bundledServer: NonNullable<Persisted['bundledServer']> }> {
    const rows = await call<SpotRow[]>(() => client.from('spots_list').select('*').limit(2000));
    const ids = rows.map((r) => r.id);
    const [stats, mine, ratings] = await Promise.all([
      ids.length ? rpc<SpotStatsRow[]>('spot_stats', { p_spot_ids: ids }) : Promise.resolve([] as SpotStatsRow[]),
      call<CompletionRow[]>(() => client.from('spot_completions').select('spot_id,completed_on,photo_path').eq('user_id', uid)),
      call<RatingRow[]>(() => client.from('spot_ratings').select('spot_id,stars').eq('user_id', uid)),
    ]);
    const suggested = rows.flatMap((r) => (r.kind === 'photo' && r.author_id ? [suggestedPhotoPath(r.author_id, r.id)] : []));
    const urls = await signed([...mine.flatMap((c) => (c.photo_path ? [c.photo_path] : [])), ...suggested]);
    const byId = new Map(stats.map((s) => [s.spot_id, s]));
    const rated = new Map(ratings.map((r) => [r.spot_id, r]));
    const mapped = rows
      .filter((r) => r.status !== 'rejected' || r.author_id === uid)
      .map((r) => {
        const spot = spotFromRow(r, { me: uid, stats: byId.get(r.id), mine, myRating: rated.get(r.id), photoUrl: (p) => urls.get(p) ?? p });
        const photo = r.author_id ? urls.get(suggestedPhotoPath(r.author_id, r.id)) : undefined;
        return { row: r, spot: photo ? { ...spot, photo } : spot };
      });
    const { own, ids: bundledIds, progress } = splitBundledRows(mapped, BUNDLED_IDS);
    return { spots: own, bundledServer: { ids: bundledIds, progress } };
  }

  /** Everyone's drives and photo spots as the server counts them, so rep is the same on every phone. */
  async function loadPlaceRep(userIds: string[]): Promise<Record<string, PlaceRep>> {
    const ids = Array.from(new Set([uid, ...userIds.filter(isUuid)]));
    return placeRepFromRows(await rpc<PlaceRepRow[]>('place_rep_for', { p_user_ids: ids }));
  }

  async function loadBuilds(): Promise<Build[]> {
    const rows = await call<BuildRow[]>(() =>
      client
        .from('builds')
        .select(
          '*, build_mods(id,category,name,bhp_gain,position,note), build_photos(storage_path,position), build_dyno_runs(id,run_on,shop,power_bhp,torque_lb_ft,measured_at,power_unit,torque_unit,storage_path,position)',
        )
        .order('created_at')
        .limit(2000),
    );
    const urls = await signed(
      rows.flatMap((r) => [...(r.build_photos ?? []).map((p) => p.storage_path), ...(r.build_dyno_runs ?? []).map((d) => d.storage_path ?? '')]),
    );
    const builds = rows.map((r) => buildFromRow(r, (p) => urls.get(p) ?? p));
    // The "Dyno proven" badge is the server's call (public.dyno_badges), never the phone's alone.
    const withRuns = rows.filter((r) => r.build_dyno_runs?.length).map((r) => r.id);
    if (!withRuns.length) return builds;
    const badges = await rpc<{ build_id: string; run_id: string; dyno_verified: boolean; removed: boolean }[]>('dyno_badges', { p_build_ids: withRuns }).catch(() => null);
    if (!badges) return builds.map((b) => (b.dynoRuns?.length ? { ...b, dynoVerified: false } : b));
    const byBuild = new Map(badges.map((x) => [x.build_id, x]));
    return builds.map((b) => {
      const x = byBuild.get(b.id);
      if (!x) return b;
      return { ...b, dynoVerified: x.dyno_verified, dynoRuns: b.dynoRuns?.map((r) => (r.id === x.run_id && x.removed ? { ...r, badgeRemoved: true } : r)) };
    });
  }

  /**
   * Profiles, with each person's picture once the server has `avatar_ref`
   * (20261121150000_profile_avatar.sql). Before that, the older columns only: nobody has a picture.
   */
  let avatarsOn = true;
  async function loadProfiles(): Promise<(ProfileRow & { onboarded_at: string | null })[]> {
    const readOld = () =>
      call<(ProfileRow & { onboarded_at: string | null })[]>(() =>
        client.from('profiles').select('id,handle,display_name,region,onboarded,onboarded_at').or(`onboarded.eq.true,id.eq.${uid}`).limit(2000),
      );
    if (!avatarsOn) return readOld();
    try {
      return await call<(ProfileRow & { onboarded_at: string | null })[]>(() =>
        client.from('profiles').select('id,handle,display_name,region,onboarded,onboarded_at,avatar_ref').or(`onboarded.eq.true,id.eq.${uid}`).limit(2000),
      );
    } catch (e) {
      if (!(e instanceof Error) || !isMissingColumn({ message: e.message })) throw e;
      avatarsOn = false;
      return readOld();
    }
  }

  async function loadPeople(): Promise<Pick<Persisted, 'users' | 'crews' | 'onboarded'> & { onboardedAt?: string }> {
    const [profiles, homes, settings, crewRows] = await Promise.all([
      loadProfiles(),
      call<HomeRow[]>(() => client.from('my_home').select('user_id,lat,lng')),
      call<SettingsRow[]>(() => client.from('profile_settings').select('travel_miles,new_event_alerts')),
      call<CrewRow[]>(() => client.from('crews').select('id,name,tag,crew_members(user_id,role,joined_at)').limit(1000)),
    ]);
    const crews = crewRows.map(crewFromRow);
    const crewOf = new Map<string, string>();
    for (const c of crews) for (const m of c.memberIds) crewOf.set(m, c.id);
    const meRow = profiles.find((p) => p.id === uid) ?? { id: uid, handle: null, display_name: null, region: null, onboarded: false, onboarded_at: null };
    // Profile pictures (20261121150000): Storage paths, shown through signed links.
    const links = await signed(profiles.flatMap((p) => (p.avatar_ref ? [p.avatar_ref] : [])));
    const pic = (p: { avatar_ref?: string | null }) => (p.avatar_ref ? links.get(p.avatar_ref) : undefined);
    const users: User[] = [
      userFromRows(meRow, { home: homes.find((h) => h.user_id === uid) ?? null, settings: settings[0] ?? null, crewId: crewOf.get(uid), avatar: pic(meRow) }),
      ...profiles.filter((p) => p.id !== uid).map((p) => userFromRows(p, { crewId: crewOf.get(p.id), avatar: pic(p) })),
    ];
    return { users, crews, onboarded: meRow.onboarded, ...(meRow.onboarded_at ? { onboardedAt: meRow.onboarded_at } : {}) };
  }

  async function loadEvents(): Promise<Pick<Persisted, 'events' | 'chat' | 'votes'>> {
    const since = new Date(Date.now() - PAST_DAYS * 86_400_000).toISOString();
    const rows = await call<EventRow[]>(() => client.from('events_list').select('*').gte('starts_at', since).order('starts_at').limit(1000));
    const ids = rows.map((r) => r.id);
    const [parts, own, awards] = await Promise.all([
      loadEventParts(ids),
      call<VoteRow[]>(() => client.from('votes').select('event_id,voter_id,category,build_id,created_at').eq('voter_id', uid)),
      ids.length ? call<AwardRow[]>(() => client.from('awards').select('*').in('event_id', ids)) : Promise.resolve([] as AwardRow[]),
    ]);
    const events = rows.map((r) => eventFromRows(r, parts));
    return { events, chat: [...parts.chat.map(chatFromRow), ...queuedChat()], votes: votesForApp(own, awards) };
  }

  async function loadNotices(): Promise<Notice[]> {
    const rows = await call<NoticeRow[]>(() =>
      client.from('notices').select('id,event_id,kind,key,title,body,created_at,read_at').eq('user_id', uid).order('created_at', { ascending: false }).limit(100),
    );
    return rows.map((r) => ({ ...noticeFromRow(r), remote: true }));
  }

  /** Server notices replace the old server ones; the phone's own reminders stay. */
  const mergeNotices = (local: Notice[], server: Notice[]) =>
    [...server, ...local.filter((n) => !n.remote && !server.some((x) => x.key && x.key === n.key))]
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, 100);

  async function refresh(): Promise<void> {
    const [people, events, builds, places, notices] = await Promise.all([loadPeople(), loadEvents(), loadBuilds(), loadSpots(), loadNotices()]);
    set((s) => ({ ...s, ...people, ...events, builds, ...places, notices: mergeNotices(s.notices, notices) }));
    const placeRep = await loadPlaceRep(people.users.map((u) => u.id)).catch(() => null);
    if (placeRep) set((s) => ({ ...s, placeRep }));
  }

  async function refreshEvent(eventId: string): Promise<void> {
    if (!isUuid(eventId)) return;
    const [rows, parts] = await Promise.all([
      call<EventRow[]>(() => client.from('events_list').select('*').eq('id', eventId)),
      loadEventParts([eventId]),
    ]);
    const event = rows[0] ? eventFromRows(rows[0], parts) : null;
    const chat = [...parts.chat.map(chatFromRow), ...queuedChat(new Set([eventId]))];
    set((s) => ({
      ...s,
      events: event ? (s.events.some((e) => e.id === eventId) ? s.events.map((e) => (e.id === eventId ? event : e)) : [...s.events, event]) : s.events.filter((e) => e.id !== eventId),
      chat: [...s.chat.filter((m) => m.eventId !== eventId), ...chat],
    }));
  }

  async function refreshVotes(): Promise<void> {
    const ids = get().events.map((e) => e.id).filter(isUuid);
    const [own, awards] = await Promise.all([
      call<VoteRow[]>(() => client.from('votes').select('event_id,voter_id,category,build_id,created_at').eq('voter_id', uid)),
      ids.length ? call<AwardRow[]>(() => client.from('awards').select('*').in('event_id', ids)) : Promise.resolve([] as AwardRow[]),
    ]);
    set((s) => ({ ...s, votes: votesForApp(own, awards) }));
  }

  const refreshPeople = async () => {
    const people = await loadPeople();
    set((s) => ({ ...s, ...people }));
  };
  const refreshBuilds = async () => {
    const builds = await loadBuilds();
    set((s) => ({ ...s, builds }));
  };
  const refreshSpots = async () => {
    const [places, placeRep] = await Promise.all([loadSpots(), loadPlaceRep(get().users.map((u) => u.id))]);
    set((s) => ({ ...s, ...places, placeRep: { ...s.placeRep, ...placeRep } }));
  };
  /**
   * The server row for a place: its own id, or for one of Slipstream's own
   * places the row seeded with its bundled id (read again once if it's not known yet).
   */
  async function serverSpotId(spotId: string): Promise<string | null> {
    if (!isBundled(spotId)) return spotId;
    const known = get().bundledServer?.ids[spotId];
    if (known) return known;
    await refreshSpots();
    return get().bundledServer?.ids[spotId] ?? null;
  }
  /** After a write: read back, but a failed read-back isn't the write failing. */
  const quietly = (p: Promise<void>) => p.catch(() => {});

  // -------------------------------------------------------------------------
  // Writes
  // -------------------------------------------------------------------------

  /** Every photo ref a build holds: its photos and its dyno sheets. */
  const refsOf = (b: Build | undefined) => [...(b?.photos ?? []), ...(b?.dynoRuns ?? []).flatMap((r) => (r.photo ? [r.photo] : []))];
  /** The Storage paths of a build's photos (and dyno sheets) as the phone has them now. */
  const pathsOf = (buildId: string) => refsOf(get().builds.find((x) => x.id === buildId)).map((r) => storagePathOf(r)).filter((p): p is string => !!p);

  /** `prevPaths`: the photos the build had before this edit, so dropped files can go. */
  async function writeBuild(b: Build, prevPaths: string[]): Promise<void> {
    const paths: string[] = [];
    const uploaded: string[] = [];
    for (const ref of b.photos) {
      const existing = storagePathOf(ref);
      if (existing) {
        paths.push(existing);
        continue;
      }
      const path = buildPhotoPath(uid, b.id, uuid(), /\.png$/i.test(ref) ? 'png' : 'jpg');
      await upload(path, ref);
      paths.push(path);
      uploaded.push(ref);
    }
    // Dyno sheets go in the same bucket and folder as the build's photos.
    const dynoPaths = new Map<string, string>();
    for (const r of b.dynoRuns ?? []) {
      if (!r.photo) continue;
      const existing = storagePathOf(r.photo);
      if (existing) {
        dynoPaths.set(r.id, existing);
        continue;
      }
      const path = buildPhotoPath(uid, b.id, uuid(), /\.png$/i.test(r.photo) ? 'png' : 'jpg');
      await upload(path, r.photo);
      dynoPaths.set(r.id, path);
      uploaded.push(r.photo);
    }
    await call(() => client.from('builds').upsert(buildToRow(b), { onConflict: 'id' }) as unknown as PromiseLike<Result<unknown>>);
    await call(() => client.from('build_dyno_runs').delete().eq('build_id', b.id) as unknown as PromiseLike<Result<unknown>>);
    if (b.dynoRuns?.length)
      await call(() => client.from('build_dyno_runs').insert(dynoRunsToRows(b.id, b.dynoRuns!, (r) => dynoPaths.get(r.id) ?? null)) as unknown as PromiseLike<Result<unknown>>);
    await call(() => client.from('build_mods').delete().eq('build_id', b.id) as unknown as PromiseLike<Result<unknown>>);
    if (b.mods.length) await call(() => client.from('build_mods').insert(modsToRows(b.id, b.mods)) as unknown as PromiseLike<Result<unknown>>);
    await call(() => client.from('build_photos').delete().eq('build_id', b.id) as unknown as PromiseLike<Result<unknown>>);
    if (paths.length)
      await call(() =>
        client.from('build_photos').insert(paths.map((storage_path, position) => ({ build_id: b.id, storage_path, position }))) as unknown as PromiseLike<Result<unknown>>,
      );
    const keep = [...paths, ...dynoPaths.values()];
    const dropped = prevPaths.filter((p) => !keep.includes(p) && p.startsWith(`${uid}/`));
    // (prevPaths may be only the dropped ones, from the outbox: the filter is the same.)
    if (dropped.length) await client.storage.from('photos').remove(dropped).catch(() => {});
    // The uploaded copies are on the server now; the phone's files can go.
    deletePhotos(uploaded);
  }

  async function writeDeleteBuild(buildId: string, paths: string[]): Promise<void> {
    await call(() => client.from('builds').delete().eq('id', buildId) as unknown as PromiseLike<Result<unknown>>);
    const mine = paths.filter((p) => p.startsWith(`${uid}/`));
    if (mine.length) await client.storage.from('photos').remove(mine).catch(() => {});
  }

  async function send(item: OutboxItem): Promise<void> {
    if (item.kind === 'chat') {
      try {
        await call(() => client.from('chat_messages').insert({ event_id: item.eventId, body: item.text }) as unknown as PromiseLike<Result<unknown>>);
      } catch (e) {
        // A refused duplicate can't record itself (the call rolls back): tell the server, which checks it again.
        if (e instanceof Error && e.message === SPAM_PROBLEMS.duplicate) {
          await Promise.resolve(client.rpc('record_blocked_duplicate', { p_kind: 'chat', p_place: item.eventId, p_text: item.text })).catch(() => {});
        }
        throw e;
      }
    } else if (item.kind === 'saveBuild') await writeBuild(item.build, item.drop ?? []);
    else if (item.kind === 'deleteBuild') await writeDeleteBuild(item.buildId, []);
    else if (item.kind === 'markRead') await rpc('mark_notices_read');
  }

  /** Queue a plain-data write while offline; send it now otherwise. */
  async function sendOrQueue(item: OutboxItem): Promise<void> {
    if (ctx.outbox.get().length > 0) {
      // Keep the order: something is already waiting.
      ctx.outbox.set(enqueue(ctx.outbox.get(), item));
      void flush();
      return;
    }
    try {
      await send(item);
    } catch (e) {
      if (!offline(e)) throw e;
      ctx.outbox.set(enqueue(ctx.outbox.get(), item));
    }
  }

  let flushing: Promise<void> | null = null;
  async function flush(): Promise<void> {
    if (flushing) return flushing;
    flushing = (async () => {
      const items = ctx.outbox.get();
      if (items.length) {
        const { left, sent, refused } = await flushOutbox(items, send);
        // Anything added while sending stays queued behind what's left.
        const added = ctx.outbox.get().filter((x) => !items.includes(x));
        ctx.outbox.set([...left, ...added]);
        if (sent.length || refused.length) {
          if (refused.length) {
            const at = new Date().toISOString();
            set((s) => ({
              ...s,
              notices: [
                ...refused.map((r) => ({ id: uuid(), eventId: r.item.kind === 'chat' ? r.item.eventId : '', at, read: false, text: `Couldn't send a change you made offline: ${r.reason}` })),
                ...s.notices,
              ],
            }));
          }
          await quietly(Promise.all([refreshBuilds(), loadEvents().then((ev) => set((s) => ({ ...s, ...ev })))]).then(() => {}));
        }
      }
      await sendFeedback(get().pendingFeedback ?? []);
    })().finally(() => {
      flushing = null;
    });
    return flushing;
  }

  /** The vehicle and mod pickers' and shop screens' suggestions, sent to `feedback`. */
  async function sendFeedback(items: PendingFeedback[]): Promise<void> {
    if (items.length === 0) return;
    const { done, offline: off } = await sendPendingFeedback(client, items, ctx.appInfo(), {
      uid,
      readPhoto: async (ref) => (await fetch(photoUri(ref))).arrayBuffer(),
      dropPhotos: deletePhotos,
    });
    if (off) ctx.setOnline(false);
    if (done.length) set((s) => ({ ...s, pendingFeedback: (s.pendingFeedback ?? []).filter((f) => !done.includes(f.id)) }));
  }

  const eventOf = (id: string) => {
    const e = get().events.find((x) => x.id === id);
    if (!e) throw new Error('Event not found.');
    return e;
  };

  // -------------------------------------------------------------------------
  // Realtime
  // -------------------------------------------------------------------------

  function watchEvent(eventId: string): () => void {
    if (!isUuid(eventId)) return () => {};
    let timer: ReturnType<typeof setTimeout> | null = null;
    const later = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void quietly(refreshEvent(eventId)), 350);
    };
    const filter = `event_id=eq.${eventId}`;
    const channel: RealtimeChannel = client
      .channel(`event:${eventId}:${uuid().slice(0, 8)}`)
      // The meet moving on (current_stop) or being edited or cancelled: read the stops again,
      // through get_event_stops(), which decides what this person may see.
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'events', filter: `id=eq.${eventId}` }, later)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter }, (p) => {
        const msg = chatFromRow(p.new as ChatRow);
        set((s) => (s.chat.some((m) => m.id === msg.id) ? s : { ...s, chat: [...s.chat, msg] }));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_going', filter }, later)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_requests', filter }, later)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'check_ins', filter }, later)
      .subscribe();
    return () => {
      if (timer) clearTimeout(timer);
      void client.removeChannel(channel);
    };
  }

  function watchNotices(): () => void {
    const channel = client
      .channel(`notices:${uid}:${uuid().slice(0, 8)}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notices', filter: `user_id=eq.${uid}` }, (p) => {
        const row = p.new as NoticeRow;
        const n: Notice = { ...noticeFromRow(row), remote: true };
        set((s) => (s.notices.some((x) => x.id === n.id) ? s : { ...s, notices: [n, ...s.notices].slice(0, 100) }));
        // "Moved on": tell the phone now too (real push needs the paid Apple account: Phase 2).
        if (row.kind === 'moved' && row.event_id) {
          if (get().settings.reminders)
            notifyNow({ key: row.key ?? row.id, scheduleId: row.id, eventId: row.event_id, kind: 'moved', at: new Date(), title: row.title, body: row.body, url: `/event/${row.event_id}` }).catch(() => {});
          void quietly(refreshEvent(row.event_id));
        }
      })
      .subscribe();
    return () => void client.removeChannel(channel);
  }

  // -------------------------------------------------------------------------
  // The repository
  // -------------------------------------------------------------------------

  return {
    kind: 'supabase',
    refresh: async () => {
      await refresh();
      await flush();
    },
    flush,
    watchEvent,
    watchNotices,

    async saveBuild(b) {
      const before = pathsOf(b.id);
      const kept = new Set(refsOf(b).map((r) => storagePathOf(r)));
      // On screen straight away; the server copy (with signed photo links) replaces it once saved.
      set((s) => ({ ...s, builds: s.builds.some((x) => x.id === b.id) ? s.builds.map((x) => (x.id === b.id ? b : x)) : [...s.builds, b] }));
      try {
        await sendOrQueue({ id: uuid(), kind: 'saveBuild', build: b, drop: before.filter((p) => !kept.has(p)) });
      } catch (e) {
        await quietly(refreshBuilds());
        throw e;
      }
      if (ctx.outbox.get().length === 0) await quietly(refreshBuilds());
    },
    async deleteBuild(id) {
      const paths = pathsOf(id);
      set((s) => ({ ...s, builds: s.builds.filter((b) => b.id !== id) }));
      try {
        await writeDeleteBuild(id, paths);
      } catch (e) {
        if (!offline(e)) {
          await quietly(refreshBuilds());
          throw e;
        }
        ctx.outbox.set(enqueue(ctx.outbox.get(), { id: uuid(), kind: 'deleteBuild', buildId: id }));
      }
    },
    async saveEvent(e) {
      const r = await rpc<{ id: string; warnings: string[] }>('save_event', eventToRpc(e, uid, true));
      if (e.allowInvites === false) await setEventInvites(r.id, false);
      if (e.capacity || e.rules?.length) await quietly(setMeetOptions(e, r.id));
      await quietly(refreshEvent(r.id));
      return r.id;
    },
    async editEvent(e) {
      await rpc('save_event', eventToRpc(e, uid, false));
      const was = eventOf(e.id);
      if (e.capacity !== was.capacity || (e.rules ?? []).join() !== (was.rules ?? []).join()) await setMeetOptions(e, e.id);
      if ((e.allowInvites !== false) !== (eventOf(e.id).allowInvites !== false)) await setEventInvites(e.id, e.allowInvites !== false);
      await quietly(refreshEvent(e.id));
    },
    async inviteConnections(eventId, userIds) {
      if (!invitesOn) throw new Error("Invites aren't switched on yet. Use Share another way.");
      const before = new Set(Object.keys(eventOf(eventId).invitedBy ?? {}));
      await rpc<number>('invite_connections', { p_event_id: eventId, p_user_ids: userIds });
      await quietly(refreshEvent(eventId));
      const after = get().events.find((x) => x.id === eventId)?.invitedBy ?? {};
      return userIds.filter((id) => after[id] === uid && !before.has(id));
    },
    async changePlan(eventId, change) {
      const event = eventOf(eventId);
      // The rough area is worked out on the phone (area.ts) and checked by the server.
      const local = applyPlanChange(event, change, uid, new Date(), BAN_ZONES, () => uuid());
      const area = change.kind === 'add' || change.kind === 'move'
        ? { p_area_lat: local.event.area.lat, p_area_lng: local.event.area.lng, p_area_radius_miles: local.event.areaRadiusMiles ?? null }
        : {};
      const args: Record<string, unknown> = { p_event_id: eventId, p_kind: change.kind, ...area };
      if (change.kind !== 'add') args.p_stop_id = change.stopId;
      if (change.kind === 'rename' || change.kind === 'add') args.p_name = change.name;
      if (change.kind === 'move' || change.kind === 'add') Object.assign(args, { p_lat: change.at.lat, p_lng: change.at.lng });
      const r = await rpc<{ warning: string | null }>('change_plan', args);
      await quietly(refreshEvent(eventId));
      return r?.warning ? { warning: r.warning } : {};
    },
    async saveProfile(draft) {
      const problem = profileProblem(draft, get().users, uid);
      if (problem) throw new Error(problem);
      await rpc('save_profile', { p_handle: draft.handle, p_name: draft.name, p_region: draft.region, p_home_lat: draft.home!.lat, p_home_lng: draft.home!.lng });
      if (draft.travelMiles !== undefined || draft.alerts !== undefined) {
        const me = get().users.find((u) => u.id === uid);
        await rpc('save_travel_prefs', { p_travel_miles: draft.travelMiles ?? me?.travelMiles ?? 25, p_new_event_alerts: draft.alerts ?? me?.alerts ?? 'notify' });
      }
      await refreshPeople();
      // A new home changes which events are near you: read them again.
      await quietly(loadEvents().then((ev) => set((s) => ({ ...s, ...ev }))));
    },
    async setAvatar(ref, onlyIfNone = false) {
      const me = get().users.find((u) => u.id === uid);
      // Read the server's own copy first when asked to keep an existing choice (the phone's saved copy can be stale).
      if (onlyIfNone) {
        const rows = await call<{ avatar_ref: string | null }[]>(() => client.from('profiles').select('avatar_ref').eq('id', uid));
        if (rows[0]?.avatar_ref) return;
      }
      const plan = planAvatar(ref, uid);
      if (plan.kind === 'refuse') throw new Error("That photo can't be your profile picture.");
      const before = me?.avatarRef ? ownPath(me.avatarRef, uid) : null;
      let path: string | null = null;
      if (plan.kind === 'path') path = plan.path;
      if (plan.kind === 'upload') {
        // The same upload as every other photo: plates were blurred on the phone before it got here.
        path = `${uid}/avatar/${uuid()}.jpg`;
        await upload(path, plan.ref);
      }
      await rpc('set_avatar', { p_ref: path });
      // An older library picture of yours is no use now. Best effort.
      const old = avatarUploadPath(before, uid);
      if (old && old !== path) await Promise.resolve(client.storage.from('photos').remove([old])).catch(() => {});
      await refreshPeople();
    },
    async setTravelPrefs({ travelMiles, alerts }) {
      const me = get().users.find((u) => u.id === uid);
      await rpc('save_travel_prefs', { p_travel_miles: travelMiles ?? me?.travelMiles ?? 25, p_new_event_alerts: alerts ?? me?.alerts ?? 'notify' });
      set((s) => ({
        ...s,
        users: s.users.map((u) => (u.id === uid ? { ...u, ...(travelMiles !== undefined ? { travelMiles } : {}), ...(alerts !== undefined ? { alerts } : {}) } : u)),
        nearby: alerts && alerts !== 'search' && s.nearby ? { ...s.nearby, unseen: [] } : s.nearby,
      }));
    },
    async setMeetStatus(eventId, status) {
      if (!meetsOn) throw new Error("That isn't switched on yet.");
      await rpc('set_meet_status', { p_event_id: eventId, p_status: status });
      await quietly(refreshEvent(eventId));
    },
    async addCoHost(eventId, userId) {
      if (!meetsOn || !isUuid(userId)) throw new Error("That isn't switched on yet.");
      await rpc('add_cohost', { p_event_id: eventId, p_user_id: userId });
      await quietly(refreshEvent(eventId));
    },
    async setGoing(eventId, going, buildId) {
      const ev = get().events.find((x) => x.id === eventId);
      const pick = buildId && isUuid(buildId) ? buildId : null;
      // A full meet: wait your turn. (The server refuses a direct join too, so an old phone sees "full".)
      if (going && meetsOn && ev && isFull(ev) && !ev.going.includes(uid) && !ev.hostIds.includes(uid)) {
        await rpc('join_waitlist', { p_event_id: eventId, p_build_id: pick });
        await quietly(refreshEvent(eventId));
        return 'waitlisted';
      }
      if (!going && meetsOn && ev?.waitlist?.includes(uid)) await rpc('leave_waitlist', { p_event_id: eventId });
      let r: 'going' | 'requested' | 'none';
      try {
        r = await rpc<'going' | 'requested' | 'none'>('set_going', { p_event_id: eventId, p_going: going, p_build_id: buildId && isUuid(buildId) ? buildId : null });
      } catch (e) {
        // People outside the meet can't see how full it is: the server says so, and the waitlist is next.
        if (going && meetsOn && e instanceof Error && /meet is full/i.test(e.message)) {
          await rpc('join_waitlist', { p_event_id: eventId, p_build_id: pick });
          await quietly(refreshEvent(eventId));
          return 'waitlisted';
        }
        throw e;
      }
      await quietly(refreshEvent(eventId));
      return r;
    },
    async answerRequest(eventId, userId, approve) {
      await rpc('answer_request', { p_event_id: eventId, p_user_id: userId, p_approve: approve });
      await quietly(refreshEvent(eventId));
    },
    async checkIn(eventId, stopIndex, buildId, position) {
      if (!position) throw new Error('Turn on location so the app can see you are at the meet point.');
      await rpc('check_in', { p_event_id: eventId, p_position: stopIndex, p_lat: position.lat, p_lng: position.lng, p_build_id: buildId && isUuid(buildId) ? buildId : null });
      await quietly(refreshEvent(eventId));
    },
    async moveOn(eventId) {
      const event = eventOf(eventId);
      const audience = await rpc<string[]>('move_on', { p_event_id: eventId });
      await quietly(refreshEvent(eventId));
      const next = get().events.find((e) => e.id === eventId);
      const stop = next?.stops[next.currentStop];
      const told = (audience ?? []).filter((u) => u !== uid).length;
      const notice: Notice = {
        id: uuid(), eventId, at: new Date().toISOString(), read: false, kind: 'host',
        text: `${event.title} moved on to ${stop?.name ?? 'the next meet point'}. ${told === 1 ? '1 person' : `${told} people`} checked in at ${event.stops[event.currentStop]?.name ?? 'the last meet point'} ${told === 1 ? 'has' : 'have'} been told.`,
      };
      set((s) => ({ ...s, notices: [notice, ...s.notices] }));
    },
    async cancelEvent(eventId) {
      await rpc('cancel_event', { p_event_id: eventId });
      await quietly(refreshEvent(eventId));
    },
    async sendChat(eventId, text) {
      const item: OutboxItem = { id: uuid(), kind: 'chat', eventId, text, at: new Date().toISOString() };
      set((s) => ({ ...s, chat: [...s.chat, { id: item.id, eventId, userId: uid, text, at: item.at }] }));
      try {
        await sendOrQueue(item);
      } catch (e) {
        set((s) => ({ ...s, chat: s.chat.filter((m) => m.id !== item.id) }));
        throw e;
      }
      if (ctx.outbox.get().length === 0) await quietly(refreshEvent(eventId));
    },
    async vote(eventId, category, buildId) {
      await rpc('cast_vote', { p_event_id: eventId, p_category: category, p_build_id: buildId });
      await quietly(refreshVotes());
    },
    async finishDrive(spotId, run) {
      const spot = ctx.spots().find((x) => x.id === spotId);
      if (!spot || spot.kind !== 'drive' || !spot.path) return { ok: false, reason: 'Drive not found.' };
      const verdict = judgeRun(run, spot.path, driveMiles(spot), spot.limitMph);
      if (!verdict.ok) return verdict;
      // Slipstream's own drives too: the server judges the same fixes, so the drive counts on every phone.
      try {
        const id = await serverSpotId(spotId);
        if (!id) return { ok: false, reason: NOT_ON_SERVER };
        const r = await rpc<{ ok: boolean; reason?: string }>('complete_drive', { p_spot_id: id, p_fixes: run.fixes ?? [] });
        if (!r.ok) return { ok: false, reason: r.reason ?? 'That run doesn’t count.' };
      } catch (e) {
        return { ok: false, reason: e instanceof Error ? e.message : "Couldn't record the drive." };
      }
      await quietly(refreshSpots());
      return { ok: true };
    },
    async visitSpot(spotId, photo, position) {
      if (!position) throw new Error('Turn on location so the app can see you are at the spot.');
      const id = await serverSpotId(spotId);
      if (!id) throw new Error(NOT_ON_SERVER);
      let path: string | null = null;
      if (photo) {
        path = storagePathOf(photo) ?? spotPhotoPath(uid, id, uuid());
        if (!storagePathOf(photo)) await upload(path, photo);
      }
      await rpc('visit_spot', { p_spot_id: id, p_lat: position.lat, p_lng: position.lng, p_photo_path: path });
      if (photo && !storagePathOf(photo)) deletePhotos([photo]);
      await quietly(refreshSpots());
    },
    async rateSpot(spotId, stars) {
      const id = await serverSpotId(spotId);
      if (!id) throw new Error(NOT_ON_SERVER);
      await rpc('rate_spot', { p_spot_id: id, p_stars: stars });
      await quietly(refreshSpots());
    },
    async suggestSpot(draft) {
      const problem = draftProblem(draft, ctx.spots());
      if (problem) throw new Error(problem);
      const r = await rpc<{ id: string; warning: string | null }>('suggest_spot', {
        p_kind: draft.kind, p_name: draft.name, p_description: draft.description, p_points: draft.points.map((p) => ({ lat: p.lat, lng: p.lng })),
      });
      // The suggester's photo of the place goes to a fixed path the app can find again (spots has no photo column).
      if (draft.kind === 'photo' && draft.photo) {
        await upload(suggestedPhotoPath(uid, r.id), draft.photo).catch(() => {});
        deletePhotos([draft.photo]);
      }
      await quietly(refreshSpots());
      return { id: r.id, ...(r.warning ? { warning: r.warning } : {}) };
    },
    async joinCrew(crewId) {
      await rpc('join_crew', { p_crew_id: crewId });
      await refreshPeople();
    },
    async leaveCrew() {
      await rpc('leave_crew');
      await refreshPeople();
    },
    async createCrew(name, tag) {
      const id = await rpc<string>('create_crew', { p_name: name, p_tag: tag });
      await refreshPeople();
      return id;
    },
    async setCrewHost(crewId, userId, host) {
      await rpc('set_crew_role', { p_crew_id: crewId, p_user_id: userId, p_role: host ? 'host' : 'member' });
      await refreshPeople();
    },
    async addToCrew() {
      throw new Error("Adding someone needs an invite they accept, which isn't built yet. Ask them to open the crew and tap Join.");
    },
    async markNoticesRead() {
      set((s) => ({ ...s, notices: s.notices.map((n) => ({ ...n, read: true })) }));
      await sendOrQueue({ id: uuid(), kind: 'markRead' }).catch(() => {});
    },

    async searchEvents(filters, from) {
      const rows = await rpc<{ event_id: string; miles: number; can_go: boolean }[]>('search_events', {
        p_max_miles: filters.maxMiles ?? 600,
        p_types: filters.types.length ? filters.types : null,
        p_when: filters.when,
        p_can_go_only: filters.canGoOnly,
        p_vehicles: filters.vehicles,
        p_from_lat: from?.lat ?? null,
        p_from_lng: from?.lng ?? null,
      });
      const known = new Set(get().events.map((e) => e.id));
      const missing = rows.filter((r) => !known.has(r.event_id));
      if (missing.length) await Promise.all(missing.slice(0, 20).map((r) => quietly(refreshEvent(r.event_id))));
      return rows.map((r) => ({ eventId: r.event_id, miles: Number(r.miles), canGo: r.can_go }));
    },
    invitesLive: () => invitesOn,
    meetsLive: () => meetsOn,
    async meetStats(eventId) {
      if (!meetsOn || !isUuid(eventId)) return null;
      try {
        return await rpc<{ runs: number; typical: number | null; regulars: number | null; newcomers: number | null }>('meet_stats', { p_event_id: eventId });
      } catch {
        return null;
      }
    },
    async inviteCount(filter, area) {
      return rpc<{ people: number | null; builds: number | null }>('invite_count', {
        p_filter: {
          everyone: filter.everyone, cars: filter.cars, bikes: filter.bikes, classes: filter.classes,
          min_mods: filter.minMods, brands: filter.brands, radius_miles: filter.radiusMiles,
        },
        p_area_lat: area.lat,
        p_area_lng: area.lng,
      });
    },

    async deleteAccount() {
      // Storage first (Supabase doesn't let SQL delete files): everything under
      // photos/{uid}/ and, once Community is live, the photos you sent in
      // messages (messages/{uid}/...). A bucket that doesn't exist yet is skipped.
      const clearFolder = async (bucket: string, optional: boolean) => {
        const files: string[] = [];
        const walk = async (prefix: string, depth: number): Promise<boolean> => {
          if (depth > 4) return true;
          const { data, error } = await client.storage.from(bucket).list(prefix, { limit: 1000 });
          if (error) {
            if (isNetworkError(error)) throw new Error(OFFLINE);
            if (optional && depth === 0) return false;
            throw new Error(error.message);
          }
          for (const f of data ?? []) {
            const path = `${prefix}/${f.name}`;
            if (f.id) files.push(path);
            else await walk(path, depth + 1);
          }
          return true;
        };
        if (!(await walk(uid, 0))) return;
        for (let i = 0; i < files.length; i += 100) {
          const { error } = await client.storage.from(bucket).remove(files.slice(i, i + 100));
          if (error) throw new Error(isNetworkError(error) ? OFFLINE : error.message);
        }
      };
      await clearFolder('photos', false);
      await clearFolder('messages', true);
      await rpc('delete_my_account');
    },
  };
}
