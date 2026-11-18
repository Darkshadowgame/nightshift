-- Dyno runs on a build (REVIEW-9): several per build, each with its day, the
-- rolling road (optional), peak power and torque, wheels or crank, the units the
-- sheet printed and a photo of the sheet. Like builds: everyone signed in reads,
-- only the build's owner writes. Photos go in the private `photos` bucket under
-- {owner_id}/builds/{build_id}/... (the existing storage policies cover them).
-- builds.dyno_bhp stays the figure Class uses; the app sets it from the latest
-- run (src/lib/dyno.ts), so older app versions keep working.

create table public.build_dyno_runs (
  id uuid primary key default gen_random_uuid(),
  build_id uuid not null references public.builds (id) on delete cascade,
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  run_on date not null,
  shop text check (shop is null or char_length(btrim(shop)) between 1 and 60),
  power_bhp numeric not null check (power_bhp between 20 and 2500),
  torque_lb_ft numeric check (torque_lb_ft is null or torque_lb_ft between 10 and 2000),
  measured_at text not null check (measured_at in ('wheels', 'crank')),
  power_unit text check (power_unit is null or power_unit in ('bhp', 'hp', 'whp', 'PS', 'kW')),
  torque_unit text check (torque_unit is null or torque_unit in ('lb-ft', 'Nm')),
  storage_path text,
  position int not null default 0,
  created_at timestamptz not null default now(),
  constraint build_dyno_runs_own_folder check (storage_path is null or split_part(storage_path, '/', 1) = owner_id::text)
);
create index build_dyno_runs_build_idx on public.build_dyno_runs (build_id);

-- No runs in the future (a day's slack for time zones), and at most 20 runs a
-- build (MAX_DYNO_RUNS in dyno.ts). In a trigger: a CHECK can't depend on today.
create function private.dyno_runs_check()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if new.run_on > (now() at time zone 'Europe/London')::date + 1 then
    raise exception 'The run can''t be in the future.';
  end if;
  if tg_op = 'INSERT' and (select count(*) from public.build_dyno_runs where build_id = new.build_id) >= 20 then
    raise exception 'A build keeps its last 20 dyno runs. Remove an old one first.';
  end if;
  return new;
end;
$$;
create trigger build_dyno_runs_check before insert or update on public.build_dyno_runs
  for each row execute function private.dyno_runs_check();
revoke execute on function private.dyno_runs_check() from public, anon, authenticated;

alter table public.build_dyno_runs enable row level security;

create policy "build_dyno_runs: signed-in users read" on public.build_dyno_runs
  for select to authenticated using (true);
create policy "build_dyno_runs: owner adds" on public.build_dyno_runs
  for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and exists (select 1 from public.builds b where b.id = build_id and b.owner_id = (select auth.uid()))
  );
create policy "build_dyno_runs: owner edits" on public.build_dyno_runs
  for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "build_dyno_runs: owner deletes" on public.build_dyno_runs
  for delete to authenticated using (owner_id = (select auth.uid()));

grant select, insert, update, delete on public.build_dyno_runs to authenticated;
