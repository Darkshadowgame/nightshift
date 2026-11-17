import type { Crew, CrewRole, NightEvent, User } from './types';

/**
 * Crews. Someone is in at most one crew. Membership is kept in two places
 * (crew.memberIds and user.crewId), so every change goes through here to keep
 * them in step.
 */

export interface CrewState {
  crews: Crew[];
  users: User[];
}

export function normaliseTag(raw: string): string {
  return raw.trim().replace(/[^a-z0-9]/gi, '').toUpperCase();
}

export function crewProblem(name: string, tag: string, crews: Crew[]): string | null {
  const n = name.trim();
  if (n.length < 3) return 'Crew names need at least 3 characters.';
  if (n.length > 30) return 'Keep the crew name to 30 characters or fewer.';
  if (crews.some((c) => c.name.toLowerCase() === n.toLowerCase())) return 'There is already a crew with that name.';
  const t = normaliseTag(tag);
  if (t.length < 2 || t.length > 4) return 'Tags are 2 to 4 letters or numbers.';
  if (crews.some((c) => c.tag.toUpperCase() === t)) return 'Another crew has that tag.';
  return null;
}

/** Owner, host or plain member (undefined if not in the crew). */
export function crewRole(crew: Crew, userId: string): CrewRole | undefined {
  if (!crew.memberIds.includes(userId)) return undefined;
  if (crew.ownerId === userId) return 'owner';
  if (crew.hostIds?.includes(userId)) return 'host';
  return 'member';
}

/** Owners and hosts host the crew's events. Plain members don't. */
export function isCrewHost(crew: Crew | undefined, userId: string): boolean {
  if (!crew) return false;
  const role = crewRole(crew, userId);
  return role === 'owner' || role === 'host';
}

/** Someone leaves: they lose any role. If the owner leaves, a host (or the longest-standing member) takes over. */
function dropMember(c: Crew, userId: string): Crew {
  const memberIds = c.memberIds.filter((m) => m !== userId);
  const hostIds = (c.hostIds ?? []).filter((h) => h !== userId);
  if (c.ownerId !== userId) return { ...c, memberIds, hostIds };
  const heir = hostIds.find((h) => memberIds.includes(h)) ?? memberIds[0];
  return { ...c, memberIds, ownerId: heir, hostIds: hostIds.filter((h) => h !== heir) };
}

function withoutUser(state: CrewState, userId: string): CrewState {
  return {
    crews: state.crews.map((c) => (c.memberIds.includes(userId) ? dropMember(c, userId) : c)),
    users: state.users.map((u) => (u.id === userId && u.crewId ? { ...u, crewId: undefined } : u)),
  };
}

/** The owner makes a member a host, or takes it away. Throws with a readable reason. */
export function setCrewHost(state: CrewState, actorId: string, crewId: string, userId: string, host: boolean): CrewState {
  const crew = state.crews.find((c) => c.id === crewId);
  if (!crew) throw new Error('That crew no longer exists.');
  if (crew.ownerId !== actorId) throw new Error('Only the crew owner can pick hosts.');
  if (!crew.memberIds.includes(userId)) throw new Error('They are not in this crew.');
  if (userId === crew.ownerId) throw new Error('The owner is always a host.');
  const others = (crew.hostIds ?? []).filter((h) => h !== userId);
  const next: Crew = { ...crew, hostIds: host ? [...others, userId] : others };
  return { ...state, crews: state.crews.map((c) => (c.id === crewId ? next : c)) };
}

/** Join a crew as a plain member, leaving any other one. */
export function joinCrew(state: CrewState, userId: string, crewId: string): CrewState {
  if (!state.crews.some((c) => c.id === crewId)) throw new Error('That crew no longer exists.');
  const left = withoutUser(state, userId);
  return {
    crews: left.crews.map((c) => (c.id === crewId ? { ...c, memberIds: [...c.memberIds, userId] } : c)),
    users: left.users.map((u) => (u.id === userId ? { ...u, crewId } : u)),
  };
}

export function leaveCrew(state: CrewState, userId: string): CrewState {
  return withoutUser(state, userId);
}

/** Start a crew with you as its first member. Throws with a readable reason. */
export function createCrew(state: CrewState, userId: string, name: string, tag: string, id: string): CrewState {
  const problem = crewProblem(name, tag, state.crews);
  if (problem) throw new Error(problem);
  const crew: Crew = { id, name: name.trim(), tag: normaliseTag(tag), memberIds: [], hostIds: [] };
  const joined = joinCrew({ ...state, crews: [...state.crews, crew] }, userId, id);
  return { ...joined, crews: joined.crews.map((c) => (c.id === id ? { ...c, ownerId: userId } : c)) };
}

/** Crews saved before roles: the first member becomes owner. */
export function withRoles(crew: Crew): Crew {
  if (crew.ownerId && crew.hostIds) return crew;
  return { ...crew, ownerId: crew.ownerId ?? crew.memberIds[0], hostIds: crew.hostIds ?? [] };
}

/** Events the crew runs (its owner and hosts host them). Newest first. */
export function crewEvents(crew: Crew, events: NightEvent[]): NightEvent[] {
  return events.filter((e) => e.crewId === crew.id && !e.cancelled).sort((a, b) => b.startsAt.localeCompare(a.startsAt));
}

/** Crews with the most members first, then by name. */
export function sortCrews(crews: Crew[]): Crew[] {
  return [...crews].sort((a, b) => b.memberIds.length - a.memberIds.length || a.name.localeCompare(b.name));
}
