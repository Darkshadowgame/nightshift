import type { AccessNote, LowCars, Security } from '../placeExtras';
import { supabase } from './client';

/**
 * Access notes on the server (migration 20261122150000_lvl_places.sql): `access_notes_for()` and
 * `add_access_note()`. The server never says who wrote a note (only whether it's yours), so a
 * place page can show "someone who's been" without a name. Until the migration is applied both
 * calls fail with "function not found": the screen then keeps notes on the phone only.
 */

export interface AccessNoteRow {
  id: string;
  barrier: boolean;
  closes: string | null;
  security: Security | null;
  low_cars: LowCars | null;
  note: string | null;
  noted_on: string;
  mine: boolean;
}

/** The migration isn't applied yet (PostgREST: PGRST202, or Postgres 42883). */
export function isMissingFunction(e: unknown): boolean {
  const x = e as { code?: string; message?: string } | null;
  return !!x && (x.code === 'PGRST202' || x.code === '42883' || /could not find the function|does not exist/i.test(x.message ?? ''));
}

export function noteFromRow(spotId: string, me: string, r: AccessNoteRow): AccessNote {
  return {
    id: r.id,
    spotId,
    userId: r.mine ? me : `visitor-${r.id}`,
    on: r.noted_on,
    ...(r.barrier ? { barrier: true } : {}),
    ...(r.closes ? { closes: r.closes.slice(0, 5) } : {}),
    ...(r.security ? { security: r.security } : {}),
    ...(r.low_cars ? { lowCars: r.low_cars } : {}),
    ...(r.note ? { text: r.note } : {}),
  };
}

/** Everyone's notes for a place. Resolves to null when the server can't do this yet. */
export async function fetchAccessNotes(spotRef: string, me: string): Promise<AccessNote[] | null> {
  try {
    const { data, error } = await supabase().rpc('access_notes_for', { p_spot_ref: spotRef });
    if (error) {
      if (isMissingFunction(error)) return null;
      throw error;
    }
    return ((data ?? []) as AccessNoteRow[]).map((r) => noteFromRow(spotRef, me, r));
  } catch {
    return null;
  }
}

/** Save your note. Rejects with the server's sentence; `null` result means "not available yet". */
export async function postAccessNote(spotRef: string, n: AccessNote): Promise<'saved' | 'unavailable'> {
  const { error } = await supabase().rpc('add_access_note', {
    p_spot_ref: spotRef,
    p_barrier: !!n.barrier,
    p_closes: n.closes ?? null,
    p_security: n.security ?? null,
    p_low_cars: n.lowCars ?? null,
    p_note: n.text ?? null,
  });
  if (!error) return 'saved';
  if (isMissingFunction(error)) return 'unavailable';
  throw new Error(error.message || "Couldn't save your note.");
}
