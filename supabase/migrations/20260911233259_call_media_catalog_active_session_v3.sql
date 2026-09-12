-- Call Engine V3 — expose only tracks belonging to the participant's current active provider session.
create or replace function public.get_call_media_catalog_v3(p_call_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null then raise exception 'AUTH_REQUIRED'; end if;
  if not app_private.can_access_call_v1(p_call_id) then raise exception 'CALL_ACCESS_DENIED'; end if;

  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'user_id',t.user_id,
      'provider_session_id',t.provider_session_id,
      'provider_track_id',t.provider_track_id,
      'role',t.role,
      'mid',t.mid,
      'state',t.state,
      'updated_at',t.updated_at
    ) order by t.user_id,t.role)
    from public.call_media_tracks_v3 t
    join public.call_participants cp
      on cp.call_session_id=t.call_session_id
     and cp.user_id=t.user_id
     and cp.left_at is null
     and cp.provider_session_id=t.provider_session_id
    where t.call_session_id=p_call_id
      and t.state='live'
  ),'[]'::jsonb);
end;
$$;

grant execute on function public.get_call_media_catalog_v3(uuid) to authenticated;
