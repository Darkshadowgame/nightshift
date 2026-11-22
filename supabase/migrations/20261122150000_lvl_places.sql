-- Level-up, places (22 Nov 2026): access notes on photo spots.
--
-- "Barrier shuts 22:00 · Security patrols · Fine for low cars", written by people who have been
-- there, shown on the place page. One note per person per place (a new one replaces the old).
--
-- Purely additive, so phones on older apps keep working: a new table and two new functions, nothing
-- replaced or dropped. The app asks for notes with access_notes_for(); until this is applied that call
-- fails with "function not found" and the place page keeps the person's notes on the phone only.
--
--   * The table has row level security on and no policy, and the app roles have no table grant: notes
--     are read and written only through the two functions below.
--   * add_access_note(): only for someone who has checked in at that photo spot (spot_completions),
--     never the demo; the text goes through private.check_public_text(); rate limited to 20 a day;
--     suspended people can't post.
--   * access_notes_for(): never returns who wrote a note, only whether it is yours.
--   * The place is named by the app's own id: spots.bundled_id for Slipstream's places, the row id for
--     suggested ones.

create table public.spot_access_notes (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid not null references public.spots (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  barrier boolean not null default false,
  closes time,
  security text check (security in ('none', 'patrols', 'moves-on')),
  low_cars text check (low_cars in ('ok', 'scrapes')),
  note text check (note is null or char_length(note) <= 120),
  noted_on date not null default current_date,
  constraint spot_access_notes_once unique (spot_id, user_id),
  constraint spot_access_notes_closes_needs_barrier check (closes is null or barrier),
  constraint spot_access_notes_has_a_fact check (barrier or security is not null or low_cars is not null or note is not null)
);
create index spot_access_notes_spot_idx on public.spot_access_notes (spot_id, noted_on desc);

alter table public.spot_access_notes enable row level security;
revoke all on public.spot_access_notes from public, anon, authenticated;

create function public.add_access_note(
  p_spot_ref text,
  p_barrier boolean,
  p_closes text,
  p_security text,
  p_low_cars text,
  p_note text
)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  v_spot uuid;
  v_closes time;
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
begin
  select s.id into v_spot from public.spots s
    where s.kind = 'photo' and s.status = 'approved' and (s.bundled_id = p_spot_ref or s.id::text = p_spot_ref);
  if v_spot is null then raise exception 'Place not found.'; end if;
  if not exists (select 1 from public.spot_completions c where c.spot_id = v_spot and c.user_id = v_uid) then
    raise exception 'Check in at the spot before adding a note.';
  end if;
  if coalesce(p_closes, '') <> '' then
    if p_closes !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then raise exception 'Enter the closing time like 22:00.'; end if;
    if not coalesce(p_barrier, false) then raise exception 'A closing time needs a barrier or gate.'; end if;
    v_closes := p_closes::time;
  end if;
  if p_security is not null and p_security not in ('none', 'patrols', 'moves-on') then raise exception 'Pick what you saw for security.'; end if;
  if p_low_cars is not null and p_low_cars not in ('ok', 'scrapes') then raise exception 'Say whether low cars are fine.'; end if;
  if not coalesce(p_barrier, false) and p_security is null and p_low_cars is null and v_note is null then
    raise exception 'Add at least one thing you know about getting in.';
  end if;
  if v_note is not null then
    if char_length(v_note) > 120 then raise exception 'Keep it to 120 characters.'; end if;
    perform private.check_public_text(v_note);
  end if;
  perform private.check_not_suspended(v_uid);
  if private.rate_count(v_uid, 'access_note', interval '1 day') >= 20 then
    raise exception 'That''s the most notes for one day.';
  end if;
  perform private.rate_hit(v_uid, 'access_note');
  insert into public.spot_access_notes (spot_id, user_id, barrier, closes, security, low_cars, note)
    values (v_spot, v_uid, coalesce(p_barrier, false), v_closes, p_security, p_low_cars, v_note)
  on conflict on constraint spot_access_notes_once do update
    set barrier = excluded.barrier, closes = excluded.closes, security = excluded.security,
        low_cars = excluded.low_cars, note = excluded.note, noted_on = current_date;
end;
$$;
revoke all on function public.add_access_note(text, boolean, text, text, text, text) from public, anon;
grant execute on function public.add_access_note(text, boolean, text, text, text, text) to authenticated, service_role;

create function public.access_notes_for(p_spot_ref text)
returns table (id uuid, barrier boolean, closes text, security text, low_cars text, note text, noted_on date, mine boolean)
language plpgsql stable security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
begin
  return query
    select n.id, n.barrier, to_char(n.closes, 'HH24:MI'), n.security, n.low_cars, n.note, n.noted_on, n.user_id = v_uid
    from public.spot_access_notes n
    join public.spots s on s.id = n.spot_id
    where s.status = 'approved' and (s.bundled_id = p_spot_ref or s.id::text = p_spot_ref)
    order by n.noted_on desc, n.id
    limit 20;
end;
$$;
revoke all on function public.access_notes_for(text) from public, anon;
grant execute on function public.access_notes_for(text) to authenticated, service_role;
