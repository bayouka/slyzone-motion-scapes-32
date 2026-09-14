-- 4b4c / 2b2c
-- Prevent invitation signup from using the masked public-preview email as the real Auth email.
-- The invitation token is the bearer capability; return the exact invited address so the
-- existing signup UI can prefill the correct account and the backend can still enforce
-- exact email matching in accept_workspace_invite.

create or replace function app_private.rpc_workspace_invite_public_preview(p_token uuid)
returns table(
  workspace_name text,
  invited_email text,
  invite_role text,
  invite_status text,
  access_mode text,
  expires_at timestamptz,
  project_names text[]
)
language sql
stable
security definer
set search_path to ''
as $function$
  with invite_data as (
    select
      wi.workspace_id,
      w.name as workspace_name,
      wi.email,
      wi.role,
      case
        when wi.status='pending' and wi.expires_at <= now() then 'expired'
        else wi.status
      end as effective_status,
      wi.access_mode,
      wi.expires_at,
      coalesce(
        array_agg(p.name order by p.name) filter (where p.id is not null),
        array[]::text[]
      ) as project_names
    from public.workspace_invites wi
    join public.workspaces w on w.id=wi.workspace_id
    left join public.workspace_invite_projects wip on wip.invite_id=wi.id
    left join public.projects p on p.id=wip.project_id
    where wi.token=p_token
    group by wi.workspace_id,w.name,wi.email,wi.role,wi.status,wi.access_mode,wi.expires_at
    limit 1
  )
  select
    d.workspace_name,
    d.email as invited_email,
    d.role as invite_role,
    d.effective_status as invite_status,
    d.access_mode,
    d.expires_at,
    d.project_names
  from invite_data d
$function$;
