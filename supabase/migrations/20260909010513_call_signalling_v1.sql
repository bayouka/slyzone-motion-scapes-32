-- 4b4c communication live V1 — WebRTC signalling
create table if not exists public.call_signals (
  id bigint generated always as identity primary key,
  call_session_id uuid not null references public.call_sessions(id) on delete cascade,
  from_user uuid not null references public.profiles(id) on delete cascade,
  to_user uuid not null references public.profiles(id) on delete cascade,
  signal_type text not null check (signal_type in ('offer','answer','ice')),
  payload jsonb not null,
  created_at timestamptz not null default now(),
  check (from_user <> to_user)
);

create index if not exists call_signals_receiver_v1
  on public.call_signals(call_session_id,to_user,id);

alter table public.call_signals enable row level security;
revoke all on public.call_signals from public,anon,authenticated;
grant select on public.call_signals to authenticated;

drop policy if exists call_signals_select_v1 on public.call_signals;
create policy call_signals_select_v1 on public.call_signals
for select to authenticated
using (
  app_private.can_access_call_v1(call_session_id)
  and (to_user=auth.uid() or from_user=auth.uid())
);

create or replace function public.send_call_signal_v1(
  p_call_id uuid,
  p_to_user uuid,
  p_signal_type text,
  p_payload jsonb
)
returns bigint
language plpgsql security definer set search_path=''
as $$
declare v_actor uuid:=auth.uid(); v_id bigint;
begin
  if v_actor is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_signal_type not in ('offer','answer','ice') then raise exception 'CALL_SIGNAL_TYPE_INVALID'; end if;
  if pg_column_size(p_payload)>65536 then raise exception 'CALL_SIGNAL_TOO_LARGE'; end if;
  if not exists(select 1 from public.call_participants
    where call_session_id=p_call_id and user_id=v_actor and left_at is null) then
    raise exception 'CALL_NOT_JOINED';
  end if;
  if not exists(select 1 from public.call_participants
    where call_session_id=p_call_id and user_id=p_to_user and left_at is null) then
    raise exception 'CALL_TARGET_NOT_JOINED';
  end if;
  if not app_private.can_access_call_v1(p_call_id) then raise exception 'CALL_ACCESS_DENIED'; end if;
  insert into public.call_signals(call_session_id,from_user,to_user,signal_type,payload)
  values(p_call_id,v_actor,p_to_user,p_signal_type,p_payload)
  returning id into v_id;
  return v_id;
end;
$$;
revoke all on function public.send_call_signal_v1(uuid,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.send_call_signal_v1(uuid,uuid,text,jsonb) to authenticated;
