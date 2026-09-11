create or replace function public.get_pending_call_invite_v2()
returns table(
  call_id uuid,
  workspace_id uuid,
  workspace_name text,
  project_id uuid,
  project_name text,
  started_by uuid,
  started_by_name text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $function$
  select
    cs.id as call_id,
    cs.workspace_id,
    w.name as workspace_name,
    cs.project_id,
    p.name as project_name,
    cs.started_by,
    coalesce(nullif(btrim(pr.display_name), ''), 'Membre') as started_by_name,
    ci.created_at
  from public.call_invites ci
  join public.call_sessions cs on cs.id = ci.call_session_id
  join public.workspaces w on w.id = cs.workspace_id
  left join public.projects p on p.id = cs.project_id
  left join public.profiles pr on pr.id = cs.started_by
  where auth.uid() is not null
    and ci.invited_user_id = auth.uid()
    and ci.status = 'pending'
    and cs.status = 'live'
    and cs.ended_at is null
    and exists (
      select 1
      from public.workspace_members wm
      where wm.workspace_id = cs.workspace_id
        and wm.user_id = auth.uid()
        and wm.status = 'active'
    )
    and exists (
      select 1
      from public.call_participants cp
      where cp.call_session_id = cs.id
        and cp.user_id = cs.started_by
        and cp.left_at is null
        and coalesce(cp.last_seen_at, cp.media_updated_at, cp.joined_at) > now() - interval '25 seconds'
    )
  order by ci.created_at desc
  limit 1;
$function$;

revoke all on function public.get_pending_call_invite_v2() from public;
revoke all on function public.get_pending_call_invite_v2() from anon;
grant execute on function public.get_pending_call_invite_v2() to authenticated;
