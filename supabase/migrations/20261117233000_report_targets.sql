-- Reports cover every kind of user content (App Store 1.2): event chat lines,
-- events, crews and suggested places as well as the Community. On its own: a
-- new enum value can't be used in the transaction that adds it.
alter type public.report_target add value if not exists 'chat';
alter type public.report_target add value if not exists 'event';
alter type public.report_target add value if not exists 'crew';
alter type public.report_target add value if not exists 'spot';
