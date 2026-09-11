-- 2b2c call reliability V2
-- Keep the private access helper executable by authenticated because RLS policies invoke it.
grant execute on function app_private.can_access_call_v1(uuid) to authenticated;

-- One governed snapshot for the hot call loop. This avoids a Promise.all of several
-- RLS-protected tables where one failing read can silently stop WebRTC negotiation.
create or replace function public.get_call_sync_v2(
  p_call_id uuid,
  p_after_signal_id bigint default 0
)
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $$
declare
  v_actor uuid := auth.uid();
  v_call public.call_sessions%rowtype;
  v_after bigint := greatest(coalesce(p_after_signal_id,0),0);
  v_latest bigint;
begin
  if v_actor is null then raise exception 'AUTH_REQUIRED'; end if;
  if not app_private.can_access_call_v1(p_call_id) then raise exception 'CALL_ACCESS_DENIED'; end if;

  select * into v_call
  from public.call_sessions
  where id=p_call_id;
  if not found then raise exception 'CALL_NOT_FOUND'; end if;

  select coalesce(max(id),v_after) into v_latest
  from public.call_signals
  where call_session_id=p_call_id and to_user=v_actor;

  return jsonb_build_object(
    'call', to_jsonb(v_call),
    'participants', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.joined_at)
      from (
        select cp.* from public.call_participants cp
        where cp.call_session_id=p_call_id and cp.left_at is null
        order by cp.joined_at
      ) x
    ), '[]'::jsonb),
    'invites', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.created_at)
      from (
        select ci.* from public.call_invites ci
        where ci.call_session_id=p_call_id
        order by ci.created_at
      ) x
    ), '[]'::jsonb),
    'signals', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.id)
      from (
        select s.* from public.call_signals s
        where s.call_session_id=p_call_id
          and s.to_user=v_actor
          and s.id>v_after
        order by s.id
        limit 500
      ) x
    ), '[]'::jsonb),
    'latest_signal_id', v_latest,
    'server_time', clock_timestamp()
  );
end;
$$;

revoke all on function public.get_call_sync_v2(uuid,bigint) from public,anon,authenticated;
grant execute on function public.get_call_sync_v2(uuid,bigint) to authenticated;
