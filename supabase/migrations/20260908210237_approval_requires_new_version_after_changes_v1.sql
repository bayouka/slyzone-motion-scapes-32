-- A version that received changes_requested is immutable and cannot be resubmitted unchanged.
create or replace function public.request_deliverable_approval_v1(
  p_deliverable_id uuid,p_version_id uuid,p_validator_id uuid,p_request_note text default ''
) returns jsonb
language plpgsql security definer set search_path to '' as $$
declare
  v_actor uuid:=auth.uid();
  v_deliverable public.deliverables%rowtype;
  v_version public.deliverable_versions%rowtype;
  v_validator_role text;
  v_approval_id uuid;
begin
  if v_actor is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into v_deliverable from public.deliverables where id=p_deliverable_id for update;
  if not found then raise exception 'DELIVERABLE_NOT_FOUND'; end if;
  select * into v_version from public.deliverable_versions where id=p_version_id and deliverable_id=p_deliverable_id;
  if not found then raise exception 'DELIVERABLE_VERSION_MISMATCH'; end if;
  if exists(select 1 from public.deliverable_versions dv where dv.deliverable_id=v_deliverable.id and dv.version_number>v_version.version_number) then raise exception 'APPROVAL_VERSION_SUPERSEDED'; end if;
  if exists(select 1 from public.approvals a where a.deliverable_version_id=v_version.id and a.status='changes_requested') then raise exception 'APPROVAL_NEW_VERSION_REQUIRED'; end if;
  if not app_private.can_write_project(v_deliverable.project_id) then raise exception 'PROJECT_WRITE_DENIED'; end if;
  if not app_private.can_assign_approval_validator(v_deliverable.project_id,p_validator_id) then raise exception 'VALIDATOR_PROJECT_ACCESS_DENIED'; end if;
  if exists(select 1 from public.approvals a where a.deliverable_version_id=v_version.id and a.validator_id=p_validator_id and a.status='pending') then raise exception 'APPROVAL_ALREADY_PENDING'; end if;

  select wm.role into v_validator_role from public.workspace_members wm
  where wm.workspace_id=v_deliverable.workspace_id and wm.user_id=p_validator_id and wm.status='active';
  if v_validator_role is null then raise exception 'VALIDATOR_NOT_ACTIVE'; end if;

  if v_validator_role='guest' then
    update public.deliverables set visibility='shared',updated_at=now() where id=v_deliverable.id;
    insert into public.deliverable_version_shares(deliverable_version_id,workspace_id,project_id,shared_by)
    values(v_version.id,v_deliverable.workspace_id,v_deliverable.project_id,v_actor)
    on conflict (deliverable_version_id) do nothing;
  end if;

  insert into public.approvals(workspace_id,project_id,deliverable_version_id,requested_by,validator_id,status,request_note,comment)
  values(v_deliverable.workspace_id,v_deliverable.project_id,v_version.id,v_actor,p_validator_id,'pending',coalesce(p_request_note,''),'')
  returning id into v_approval_id;

  if p_validator_id is distinct from v_actor then
    insert into public.notifications(workspace_id,user_id,kind,title,route)
    values(v_deliverable.workspace_id,p_validator_id,'approval_requested',v_deliverable.title||' · v'||v_version.version_number::text||' à valider','#/projects/'||v_deliverable.project_id::text||'/resources');
  end if;

  insert into public.audit_events(workspace_id,actor_id,event_type,entity_type,entity_id,payload)
  values(v_deliverable.workspace_id,v_actor,'deliverable.approval_requested','approval',v_approval_id,
    jsonb_build_object('deliverable_id',v_deliverable.id,'version_id',v_version.id,'version_number',v_version.version_number,'validator_id',p_validator_id,'shared_external',v_validator_role='guest'));

  return jsonb_build_object('approval_id',v_approval_id,'deliverable_id',v_deliverable.id,'version_id',v_version.id,'validator_id',p_validator_id,'shared_external',v_validator_role='guest','status','pending');
end;$$;
