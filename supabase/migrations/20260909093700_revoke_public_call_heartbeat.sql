
revoke all on function public.heartbeat_call_v1(uuid) from public;
revoke all on function public.heartbeat_call_v1(uuid) from anon;
grant execute on function public.heartbeat_call_v1(uuid) to authenticated;
grant execute on function public.heartbeat_call_v1(uuid) to service_role;
