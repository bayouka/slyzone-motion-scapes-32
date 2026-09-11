
revoke execute on function public.heartbeat_call_v1(uuid) from anon;
grant execute on function public.heartbeat_call_v1(uuid) to authenticated;
