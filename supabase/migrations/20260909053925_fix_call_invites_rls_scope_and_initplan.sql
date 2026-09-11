
drop policy if exists call_invites_select_v1 on public.call_invites;
create policy call_invites_select_v1
on public.call_invites
for select
to authenticated
using (
  invited_user_id = (select auth.uid())
  or invited_by = (select auth.uid())
  or exists (
    select 1
    from public.call_sessions c
    where c.id = call_invites.call_session_id
      and c.started_by = (select auth.uid())
  )
  or exists (
    select 1
    from public.call_participants cp
    where cp.call_session_id = call_invites.call_session_id
      and cp.user_id = (select auth.uid())
      and cp.left_at is null
  )
);

drop policy if exists call_signals_select_v1 on public.call_signals;
create policy call_signals_select_v1
on public.call_signals
for select
to authenticated
using (
  app_private.can_access_call_v1(call_session_id)
  and (
    to_user = (select auth.uid())
    or from_user = (select auth.uid())
  )
);
