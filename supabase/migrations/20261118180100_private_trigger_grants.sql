-- 20261118180000 re-granted every private function to signed-in users. Take back
-- the ones only triggers (and the service role) may run, as before.
revoke execute on function private.queue_nearby_notices(uuid) from public, anon, authenticated;
revoke execute on function private.events_queue_nearby() from public, anon, authenticated;
revoke execute on function private.feedback_guard() from public, anon, authenticated;
revoke execute on function private.feedback_triage_stamp() from public, anon, authenticated;
revoke execute on function private.feedback_notify() from public, anon, authenticated;
revoke execute on function private.rate_hit(uuid, text) from public, anon, authenticated;
-- The new spam and moderation helpers: only through the RPCs and triggers.
revoke execute on function private.spam_gate(uuid, boolean, uuid, text) from public, anon, authenticated;
revoke execute on function private.auto_report(uuid, public.report_reason, text) from public, anon, authenticated;
revoke execute on function private.log_action(uuid, text, uuid, text, uuid, uuid, text, text, text, int, timestamptz, text) from public, anon, authenticated;
revoke execute on function private.moderation_notice(uuid, text, text, text) from public, anon, authenticated;
revoke execute on function private.apply_ban(uuid, uuid, text, int, text, uuid, text, uuid) from public, anon, authenticated;
revoke execute on function private.chat_gate() from public, anon, authenticated;
revoke execute on function private.check_sell_only(uuid) from public, anon, authenticated;
