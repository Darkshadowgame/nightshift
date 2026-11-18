-- Automatic staff reports for accounts that only sell (owner rule, 18 Nov 2026).
-- On its own: a new enum value can't be used in the transaction that adds it.
alter type public.report_reason add value if not exists 'sell_only';
