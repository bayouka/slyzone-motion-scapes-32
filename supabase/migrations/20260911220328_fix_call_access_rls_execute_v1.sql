-- 4b4c Call Engine V2 — restore helper EXECUTE required by call RLS policies.
grant execute on function app_private.can_access_call_v1(uuid) to authenticated;
