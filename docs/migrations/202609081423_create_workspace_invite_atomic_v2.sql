create or replace function app_private.rpc_create_workspace_invite_v2(
  p_workspace_id uuid,
  p_email text,
  p_role text,
  p_project_ids uuid[] default array[]::uuid[]
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user uuid := auth.uid();
  v_email text := lower(trim(coalesce(p_email,'')));
  v_role text := lower(trim(coalesce(p_role,'member')));
  v_invite public.workspace_invites%rowtype;
  v_bad_count integer;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  if not app_private.can_manage_workspace(p_workspace_id) then raise exception 'FORBIDDEN'; end if;
  if position('@' in v_email) <= 1 then raise exception 'EMAIL_INVALID'; end if;
  if v_role not in ('admin','member','guest') then raise exception 'ROLE_INVALID'; end if;

  if exists (
    select 1 from public.workspace_invites wi
    where wi.workspace_id=p_workspace_id
      and lower(wi.email)=v_email
      and wi.status='pending'
      and wi.expires_at>now()
  ) then raise exception 'PENDING_INVITE_ALREADY_EXISTS'; end if;

  if v_role='guest' and coalesce(cardinality(p_project_ids),0)=0 then
    raise exception 'GUEST_PROJECT_REQUIRED';
  end if;

  if v_role <> 'admin' and coalesce(cardinality(p_project_ids),0)>0 then
    select count(*) into v_bad_count
    from unnest(p_project_ids) x(project_id)
    left join public.projects p on p.id=x.project_id and p.workspace_id=p_workspace_id
    where p.id is null
       or (v_role='member' and p.visibility<>'restricted');
    if v_bad_count>0 then raise exception 'PROJECT_ACCESS_INVALID'; end if;
  end if;

  insert into public.workspace_invites(workspace_id,email,role,status,access_mode,invited_by)
  values(
    p_workspace_id,
    v_email,
    v_role,
    'pending',
    case when v_role='guest' then 'selected' else 'all' end,
    v_user
  )
  returning * into v_invite;

  if v_role <> 'admin' and coalesce(cardinality(p_project_ids),0)>0 then
    insert into public.workspace_invite_projects(invite_id,project_id,project_role)
    select v_invite.id,
           x.project_id,
           case when v_role='guest' then 'viewer' else 'member' end
    from (select distinct unnest(p_project_ids) as project_id) x;
  end if;

  insert into public.audit_events(workspace_id,actor_id,event_type,entity_type,entity_id,payload)
  values(
    p_workspace_id,
    v_user,
    'workspace.invite_created',
    'workspace_invite',
    v_invite.id,
    jsonb_build_object(
      'email',v_email,
      'role',v_role,
      'project_count',case when v_role='admin' then 0 else coalesce(cardinality(p_project_ids),0) end,
      'expires_at',v_invite.expires_at
    )
  );

  return jsonb_build_object(
    'invite_id',v_invite.id,
    'token',v_invite.token,
    'expires_at',v_invite.expires_at,
    'email',v_invite.email,
    'role',v_invite.role
  );
end;
$$;

create or replace function public.create_workspace_invite_v2(
  p_workspace_id uuid,
  p_email text,
  p_role text,
  p_project_ids uuid[] default array[]::uuid[]
)
returns jsonb
language sql
security definer
set search_path=''
as $$
  select app_private.rpc_create_workspace_invite_v2(p_workspace_id,p_email,p_role,p_project_ids)
$$;

revoke all on function public.create_workspace_invite_v2(uuid,text,text,uuid[]) from public;
grant execute on function public.create_workspace_invite_v2(uuid,text,text,uuid[]) to authenticated;
revoke all on function app_private.rpc_create_workspace_invite_v2(uuid,text,text,uuid[]) from public;
grant execute on function app_private.rpc_create_workspace_invite_v2(uuid,text,text,uuid[]) to authenticated;
