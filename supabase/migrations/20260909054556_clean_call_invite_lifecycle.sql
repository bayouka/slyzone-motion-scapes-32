
create or replace function public.cancel_empty_call_v1(p_call_id uuid, p_expected_version integer)
returns boolean
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_actor uuid:=auth.uid();
  v_call public.call_sessions%rowtype;
begin
  if v_actor is null then raise exception 'AUTH_REQUIRED'; end if;

  select * into v_call
  from public.call_sessions
  where id=p_call_id
  for update;

  if not found or v_call.ended_at is not null then return false; end if;
  if v_call.started_by<>v_actor or v_call.version<>p_expected_version then return false; end if;
  if exists(
    select 1 from public.call_participants
    where call_session_id=p_call_id and left_at is null
  ) then return false; end if;

  update public.call_sessions
  set status='ended', ended_at=now(), ended_by=v_actor, version=version+1
  where id=p_call_id and ended_at is null;

  if found then
    update public.call_invites
    set status='cancelled', responded_at=coalesce(responded_at,now())
    where call_session_id=p_call_id and status='pending';
  end if;

  return found;
end;
$function$;

create or replace function public.respond_call_invite_v1(p_call_id uuid, p_accept boolean)
returns public.call_sessions
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_actor uuid:=auth.uid();
  v_call public.call_sessions%rowtype;
begin
  if v_actor is null then raise exception 'AUTH_REQUIRED'; end if;

  select * into v_call
  from public.call_sessions
  where id=p_call_id;

  if not found or v_call.ended_at is not null or v_call.status<>'live' then
    update public.call_invites
    set status='cancelled', responded_at=coalesce(responded_at,now())
    where call_session_id=p_call_id
      and invited_user_id=v_actor
      and status='pending';
    raise exception 'CALL_NOT_LIVE';
  end if;

  update public.call_invites
  set status=case when p_accept then 'accepted' else 'declined' end,
      responded_at=now()
  where call_session_id=p_call_id
    and invited_user_id=v_actor
    and status='pending';

  if not found then raise exception 'CALL_INVITE_NOT_FOUND'; end if;
  return v_call;
end;
$function$;
