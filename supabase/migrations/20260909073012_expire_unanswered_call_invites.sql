
create or replace function public.heartbeat_call_v1(p_call_id uuid)
returns boolean
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_actor uuid:=auth.uid();
begin
  if v_actor is null then raise exception 'AUTH_REQUIRED'; end if;

  update public.call_participants
  set last_seen_at=now()
  where call_session_id=p_call_id
    and user_id=v_actor
    and left_at is null;

  update public.call_invites
  set status='cancelled',
      responded_at=coalesce(responded_at,now())
  where call_session_id=p_call_id
    and status='pending'
    and created_at < now()-interval '90 seconds';

  return found;
end;
$function$;
