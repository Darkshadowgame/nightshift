-- "Fake or edited dyno sheet" as a report reason (owner rule, 18 Nov 2026), on a build.
-- On its own: a new enum value can't be used in the transaction that adds it.
alter type public.report_reason add value if not exists 'fake_dyno';
