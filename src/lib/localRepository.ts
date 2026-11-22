import { appNow } from './appClock';
import { BAN_ZONES, ME } from '../data/seed';
import { castVote as applyVote } from './awards';
import { canGoWith, chosenBuild, ownBuilds } from './bringing';
import {
  addToCrew as applyAddToCrew,
  createCrew as applyCreateCrew,
  joinCrew as applyJoinCrew,
  leaveCrew as applyLeaveCrew,
  setCrewHost as applySetCrewHost,
} from './crews';
import { alertProblem, travelProblem } from './discover';
import {
  answerRequest as applyAnswer,
  applyEventEdit,
  applyPlanChange,
  canEditEvent,
  checkIn as applyCheckIn,
  dropOut,
  moveOn as applyMoveOn,
  planChangedMessage,
  rsvp,
} from './events';
import { redrawScene, type Persisted } from './localState';
import type { Notice } from './notice';
import { notifyNow } from './notify';
import { deletePhotos } from './photos';
import { droppedPhotos } from './photoRefs';
import { bundledSpots, isBundled, setProgress } from './placeStore';
import { applyProfile, profileProblem } from './profile';
import { movedOnReminder } from './reminders';
import type { Repository } from './repository';
import { keepsScene } from './scene';
import { driveMiles, judgeRun, makeSpot, rateSpot as applyRating, recordCompletion } from './spots';
import type { ChatMessage, NightEvent, Spot } from './types';
import { newId } from './ids';
import { inviteProblem, newInvitees, withInvites } from './eventInvites';
import { withCoHost, withStatus } from './meetExtras';

export interface LocalContext {
  /** The latest state (not a render's snapshot). */
  get(): Persisted;
  set(fn: (s: Persisted) => Persisted): void;
  /** Every place on the map: bundled ones with progress, then suggested ones. */
  spots(): Spot[];
}

/**
 * The demo: every rule runs on the phone against the saved sample scene.
 * The same code the app has always run; only now behind the Repository interface.
 */
export function createLocalRepository(ctx: LocalContext): Repository {
  const { get, set } = ctx;
  const updateEvent = (id: string, fn: (e: NightEvent) => NightEvent) =>
    set((s) => ({ ...s, events: s.events.map((e) => (e.id === id ? fn(e) : e)) }));
  const updateSpot = (id: string, fn: (x: Spot) => Spot) =>
    set((s) => {
      if (!isBundled(id)) return { ...s, spots: s.spots.map((x) => (x.id === id ? fn(x) : x)) };
      // A bundled place: only what people did there is saved.
      const base = bundledSpots().find((x) => x.id === id);
      if (!base) return s;
      const p = s.placeProgress[id];
      return { ...s, placeProgress: setProgress(s.placeProgress, fn(p ? { ...base, ...p } : base)) };
    });
  const eventOf = (id: string) => {
    const event = get().events.find((e) => e.id === id);
    if (!event) throw new Error('Event not found.');
    return event;
  };

  return {
    kind: 'local',
    async saveBuild(b) {
      const state = get();
      // Photos taken off the build: delete their files (they were only ever this build's).
      const before = state.builds.find((x) => x.id === b.id)?.photos ?? [];
      const elsewhere = state.builds.filter((x) => x.id !== b.id).flatMap((x) => x.photos);
      deletePhotos(droppedPhotos(before, b.photos, elsewhere));
      set((s) => ({ ...s, builds: s.builds.some((x) => x.id === b.id) ? s.builds.map((x) => (x.id === b.id ? b : x)) : [...s.builds, b] }));
    },
    async deleteBuild(id) {
      const state = get();
      const before = state.builds.find((x) => x.id === id)?.photos ?? [];
      const elsewhere = state.builds.filter((x) => x.id !== id).flatMap((x) => x.photos);
      deletePhotos(droppedPhotos(before, [], elsewhere));
      set((s) => ({ ...s, builds: s.builds.filter((b) => b.id !== id) }));
    },
    async saveEvent(e) {
      set((s) => ({ ...s, events: s.events.some((x) => x.id === e.id) ? s.events.map((x) => (x.id === e.id ? e : x)) : [e, ...s.events] }));
      return e.id;
    },
    async editEvent(edited) {
      const event = eventOf(edited.id);
      const nowDate = appNow();
      const ok = canEditEvent(event, nowDate);
      if (!ok.ok) throw new Error(ok.reason);
      const next = applyEventEdit(event, edited, ME, nowDate, newId('pc'));
      const msg: ChatMessage = { id: newId('c'), eventId: event.id, userId: ME, text: 'Hosts updated the event details', at: nowDate.toISOString(), system: true };
      set((s) => ({ ...s, events: s.events.map((e) => (e.id === event.id ? next : e)), chat: [...s.chat, msg] }));
    },
    async changePlan(eventId, change) {
      const event = eventOf(eventId);
      const nowDate = appNow();
      const result = applyPlanChange(event, change, ME, nowDate, BAN_ZONES, () => newId(`${eventId}-x`));
      const msg = planChangedMessage(eventId, ME, nowDate, newId('c'));
      set((s) => ({ ...s, events: s.events.map((e) => (e.id === eventId ? result.event : e)), chat: [...s.chat, msg] }));
      return { warning: result.warning };
    },
    async saveProfile(draft) {
      const problem = profileProblem(draft, get().users, ME);
      if (problem) throw new Error(problem);
      set((s) => {
        const users = s.users.map((u) => (u.id === ME ? applyProfile(u, draft) : u));
        const next = { ...s, onboarded: true, onboardedAt: s.onboardedAt ?? appNow().toISOString(), users };
        // A new home area far from the sample scene: the scene moves with it. Near it, the scene stays
        // on its real roads and places, and Tonight measures from where you are (Review 20).
        const home = users.find((u) => u.id === ME)!.home;
        return keepsScene(s.scene?.home, home) ? next : redrawScene(next, home, appNow());
      });
    },
    async setAvatar(ref, onlyIfNone = false) {
      if (onlyIfNone && get().users.find((u) => u.id === ME)?.avatarRef) return;
      set((s) => ({
        ...s,
        users: s.users.map((u) => {
          if (u.id !== ME) return u;
          const rest = { ...u };
          delete rest.avatarRef;
          return ref ? { ...rest, avatarRef: ref } : rest;
        }),
      }));
    },
    async setTravelPrefs({ travelMiles, alerts }) {
      const problem = (travelMiles !== undefined && travelProblem(travelMiles)) || (alerts !== undefined && alertProblem(alerts));
      if (problem) throw new Error(problem);
      set((s) => ({
        ...s,
        users: s.users.map((u) => (u.id === ME ? { ...u, ...(travelMiles !== undefined ? { travelMiles } : {}), ...(alerts !== undefined ? { alerts } : {}) } : u)),
        // Leaving "I'll search" clears the NEW tags it was keeping.
        nearby: alerts && alerts !== 'search' && s.nearby ? { ...s.nearby, unseen: [] } : s.nearby,
      }));
    },
    async setGoing(eventId, going, buildId) {
      const state = get();
      const event = eventOf(eventId);
      if (!going) {
        updateEvent(eventId, (e) => dropOut(e, ME));
        return 'none';
      }
      const own = ownBuilds(ME, state.builds);
      if (buildId && !own.some((b) => b.id === buildId)) throw new Error("That isn't one of your builds.");
      const already = event.going.includes(ME) || !!event.requests?.includes(ME);
      // One build: that's the one (the picker only shows for two or more).
      const pick = buildId ?? (!already && own.length === 1 ? own[0].id : undefined);
      const build = pick ? own.find((b) => b.id === pick) : chosenBuild(event, ME, state.builds);
      const eligible = canGoWith(event, ME, state.crews, state.users, state.builds, build);
      const nowDate = appNow();
      const next = rsvp(event, ME, eligible, pick, nowDate); // throws with the reason (a host said no, checked in...)
      updateEvent(eventId, (e) => rsvp(e, ME, eligible, pick, nowDate));
      return next.going.includes(ME) ? 'going' : next.waitlist?.includes(ME) ? 'waitlisted' : next.requests?.includes(ME) ? 'requested' : 'none';
    },
    async setMeetStatus(eventId, status) {
      const next = withStatus(eventOf(eventId), ME, status);
      updateEvent(eventId, () => next);
    },
    async addCoHost(eventId, userId) {
      const next = withCoHost(eventOf(eventId), ME, get().crews, userId);
      updateEvent(eventId, () => next);
    },
    async inviteConnections(eventId, userIds, { connected, blocked }) {
      const state = get();
      const event = eventOf(eventId);
      const nowDate = appNow();
      const problem = inviteProblem(event, ME, userIds, connected, blocked, state.crews, nowDate);
      if (problem) throw new Error(problem);
      const fresh = newInvitees(event, ME, userIds, state.crews);
      if (fresh.length === 0) return [];
      // The sample people are made up: their notice is shown to you instead, so the demo says what happened.
      const handles = fresh.map((id) => `@${state.users.find((u) => u.id === id)?.handle ?? 'someone'}`);
      const who = handles.length <= 2 ? handles.join(' and ') : `${handles.length} people`;
      const notice: Notice = {
        id: newId('n'), eventId, at: nowDate.toISOString(), read: false, kind: 'host',
        text: `You invited ${who} to ${event.title}. They each get a notice and the event in your chat.`,
      };
      set((s) => ({ ...s, events: s.events.map((e) => (e.id === eventId ? withInvites(e, ME, fresh) : e)), notices: [notice, ...s.notices].slice(0, 100) }));
      return fresh;
    },
    async answerRequest(eventId, userId, approve) {
      const next = applyAnswer(eventOf(eventId), ME, get().crews, userId, approve);
      updateEvent(eventId, () => next);
    },
    async checkIn(eventId, stopIndex, buildId) {
      const state = get();
      const event = eventOf(eventId);
      let vehicle: { buildId: string; fits: boolean } | undefined;
      if (buildId) {
        const build = ownBuilds(ME, state.builds).find((b) => b.id === buildId);
        if (!build) throw new Error("That isn't one of your builds.");
        vehicle = { buildId, fits: canGoWith(event, ME, state.crews, state.users, state.builds, build) };
      }
      applyCheckIn(event, stopIndex, ME, vehicle); // throws with the reason
      updateEvent(eventId, (e) => applyCheckIn(e, stopIndex, ME, vehicle));
    },
    async moveOn(eventId) {
      const event = eventOf(eventId);
      const nowDate = appNow();
      const next = applyMoveOn(event, nowDate);
      const stop = next.stops[next.currentStop];
      // In the demo you're the host and may also be checked in: then you get the
      // same "moved on" notification as everyone else at the stop.
      const moved = movedOnReminder(event, ME, nowDate);
      const notice: Notice = moved
        ? { id: newId('n'), eventId, at: nowDate.toISOString(), read: false, kind: 'moved', key: moved.key, text: `${moved.title}. ${moved.body}` }
        : {
            id: newId('n'), eventId, at: nowDate.toISOString(), read: false, kind: 'host',
            text: `${event.title} moved on to ${stop.name}. Everyone checked in at ${event.stops[event.currentStop].name} has been told.`,
          };
      if (moved && get().settings.reminders) notifyNow(moved).catch(() => {});
      set((s) => ({ ...s, events: s.events.map((e) => (e.id === eventId ? next : e)), notices: [notice, ...s.notices] }));
    },
    async cancelEvent(eventId) {
      const msg: ChatMessage = { id: newId('c'), eventId, userId: ME, text: 'The host cancelled this meet', at: appNow().toISOString(), system: true };
      set((s) => ({ ...s, events: s.events.map((e) => (e.id === eventId ? { ...e, cancelled: true } : e)), chat: [...s.chat, msg] }));
    },
    async sendChat(eventId, text) {
      const msg: ChatMessage = { id: newId('c'), eventId, userId: ME, text, at: appNow().toISOString() };
      set((s) => ({ ...s, chat: [...s.chat, msg] }));
    },
    async vote(eventId, category, buildId) {
      const state = get();
      const votes = applyVote(state.votes, eventOf(eventId), state.builds, ME, category, buildId, appNow());
      set((s) => ({ ...s, votes }));
    },
    async finishDrive(spotId, run) {
      const spot = ctx.spots().find((x) => x.id === spotId);
      if (!spot || spot.kind !== 'drive' || !spot.path) return { ok: false, reason: 'Drive not found.' };
      const verdict = judgeRun(run, spot.path, driveMiles(spot), spot.limitMph);
      if (!verdict.ok) return verdict;
      try {
        recordCompletion(spot, ME, appNow());
      } catch (e) {
        return { ok: false, reason: e instanceof Error ? e.message : "Couldn't record the drive." };
      }
      updateSpot(spotId, (x) => recordCompletion(x, ME, appNow()));
      return { ok: true };
    },
    async visitSpot(spotId, photo) {
      const spot = ctx.spots().find((x) => x.id === spotId);
      if (!spot) throw new Error('Spot not found.');
      recordCompletion(spot, ME, appNow(), photo);
      updateSpot(spotId, (x) => recordCompletion(x, ME, appNow(), photo));
    },
    async rateSpot(spotId, stars) {
      const spot = ctx.spots().find((x) => x.id === spotId);
      if (!spot) throw new Error('Place not found.');
      const rated = applyRating(spot, ME, stars);
      updateSpot(spotId, () => rated);
    },
    async suggestSpot(draft) {
      const { spot, warning } = makeSpot(draft, ME, appNow(), newId('sp'), ctx.spots(), BAN_ZONES);
      set((s) => ({ ...s, spots: [...s.spots, spot] }));
      return { id: spot.id, warning };
    },
    async joinCrew(crewId) {
      const next = applyJoinCrew({ crews: get().crews, users: get().users }, ME, crewId);
      set((s) => ({ ...s, ...next }));
    },
    async leaveCrew() {
      const next = applyLeaveCrew({ crews: get().crews, users: get().users }, ME);
      set((s) => ({ ...s, ...next }));
    },
    async createCrew(name, tag) {
      const id = newId('crew');
      const next = applyCreateCrew({ crews: get().crews, users: get().users }, ME, name, tag, id);
      set((s) => ({ ...s, crews: next.crews, users: next.users }));
      return id;
    },
    async setCrewHost(crewId, userId, host) {
      const next = applySetCrewHost({ crews: get().crews, users: get().users }, ME, crewId, userId, host);
      set((s) => ({ ...s, crews: next.crews }));
    },
    async addToCrew(crewId, userId) {
      const next = applyAddToCrew({ crews: get().crews, users: get().users }, ME, crewId, userId);
      set((s) => ({ ...s, crews: next.crews, users: next.users }));
    },
    async markNoticesRead() {
      set((s) => ({ ...s, notices: s.notices.map((n) => ({ ...n, read: true })) }));
    },
  };
}
