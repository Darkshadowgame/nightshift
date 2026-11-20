-- Slipstream backend: the app was renamed from Nightshift (owner decision, 20 Nov 2026).
-- Rewrites the user-facing words inside every app function that still says the old name
-- (reminder pushes, "UK only" errors, moderation and community messages).
-- Function names, arguments, grants, owners and settings are unchanged: each function is
-- re-created from its own current definition with only the name swapped.
do $$
declare
  r record;
begin
  for r in
    select p.oid
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname not in ('pg_catalog', 'information_schema', 'auth', 'storage', 'extensions',
                            'realtime', 'graphql', 'graphql_public', 'vault', 'pgsodium',
                            'pgsodium_masks', 'net', 'cron', 'pgbouncer', 'supabase_functions',
                            'supabase_migrations', 'pgtap', 'tests')
      and n.nspname not like 'pg\_%'
      and p.prokind in ('f', 'p')
      and p.prosrc like '%Nightshift%'
  loop
    execute replace(pg_get_functiondef(r.oid), 'Nightshift', 'Slipstream');
  end loop;
end
$$;
