import type { Crew, NightEvent, User } from './types';

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

function withoutUser(state: CrewState, userId: string): CrewState {
  return {
    crews: state.crews.map((c) => (c.memberIds.includes(userId) ? { ...c, memberIds: c.memberIds.filter((m) => m !== userId) } : c)),
    users: state.users.map((u) => (u.id === userId && u.crewId ? { ...u, crewId: undefined } : u)),
  };
}

/** Join a crew, leaving any other one. */
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
  const crew: Crew = { id, name: name.trim(), tag: normaliseTag(tag), memberIds: [] };
  return joinCrew({ ...state, crews: [...state.crews, crew] }, userId, id);
}

/** Events the crew hosts (any member can host them). Newest first. */
export function crewEvents(crew: Crew, events: NightEvent[]): NightEvent[] {
  return events.filter((e) => e.crewId === crew.id && !e.cancelled).sort((a, b) => b.startsAt.localeCompare(a.startsAt));
}

/** Crews with the most members first, then by name. */
export function sortCrews(crews: Crew[]): Crew[] {
  return [...crews].sort((a, b) => b.memberIds.length - a.memberIds.length || a.name.localeCompare(b.name));
}
