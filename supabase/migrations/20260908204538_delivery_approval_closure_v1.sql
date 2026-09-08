-- Delivery / approval / closure domain hardening.
-- Applied to Supabase project 4b4c as migration 20260908204538.

create table if not exists public.project_closures (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  decision_id uuid not null unique references public.decisions(id) on delete cascade,
  sequence_no integer not null check (sequence_no > 0),
  result text not null check (btrim(result) <> ''),
  remaining text not null default '',
  open_actions integer not null default 0 check (open_actions >= 0),
  open_milestones integer not null default 0 check (open_milestones >= 0),
  open_requests integer not null default 0 check (open_requests >= 0),
  closed_by uuid not null references public.profiles(id),
  closed_at timestamptz not null default now(),
  unique(project_id, sequence_no)
);
create index if not exists project_closures_project_idx on public.project_closures(project_id, closed_at desc);
create index if not exists project_closures_workspace_idx on public.project_closures(workspace_id, closed_at desc);
create index if not exists project_closures_closed_by_idx on public.project_closures(closed_by);

alter table public.project_closures enable row level security;
drop policy if exists project_closures_select on public.project_closures;
create policy project_closures_select on public.project_closures for select to authenticated using (
  app_private.can_access_project(project_id)
  and (
    not app_private.is_external_workspace_member(workspace_id)
    or exists (
      select 1
      from public.project_closure_versions pcv
      join public.deliverable_version_shares dvs
        on dvs.deliverable_version_id=pcv.deliverable_version_id
       and dvs.workspace_id=pcv.workspace_id
       and dvs.project_id=pcv.project_id
      where pcv.decision_id=project_closures.decision_id
    )
  )
);
revoke all on public.project_closures from public, anon;
grant select on public.project_closures to authenticated;

alter table public.project_closure_versions add column if not exists closure_id uuid references public.project_closures(id) on delete cascade;
create index if not exists project_closure_versions_closure_idx on public.project_closure_versions(closure_id);

create or replace function public.register_deliverable_version_v3(
  p_deliverable_id uuid,
  p_storage_path text,
  p_file_name text,
  p_mime_type text default null,
  p_size_bytes bigint default null,
  p_share_external boolean default false
) returns jsonb
language plpgsql security definer set search_path to '' as $$
declare
  v_actor uuid:=auth.uid();
  v_deliverable public.deliverables%rowtype;
  v_version_number integer;
  v_version_id uuid;
  r record;
begin
  if v_actor is null then raise exception 'AUTH_REQUIRED'; end if;
  if nullif(btrim(coalesce(p_storage_path,'')),'') is null then raise exception 'STORAGE_PATH_REQUIRED'; end if;
  if nullif(btrim(coalesce(p_file_name,'')),'') is null then raise exception 'FILE_NAME_REQUIRED'; end if;
  if p_size_bytes is not null and p_size_bytes<0 then raise exception 'FILE_SIZE_INVALID'; end if;

  select * into v_deliverable from public.deliverables where id=p_deliverable_id for update;
  if not found then raise exception 'DELIVERABLE_NOT_FOUND'; end if;
  if not app_private.can_write_project(v_deliverable.project_id) then raise exception 'PROJECT_WRITE_DENIED'; end if;
  if not app_private.can_write_storage_path(p_storage_path) then raise exception 'STORAGE_PATH_DENIED'; end if;
  if exists(select 1 from public.deliverable_versions where storage_path=p_storage_path) then raise exception 'STORAGE_PATH_ALREADY_REGISTERED'; end if;

  select coalesce(max(version_number),0)+1 into v_version_number
  from public.deliverable_versions where deliverable_id=v_deliverable.id;

  insert into public.deliverable_versions(workspace_id,deliverable_id,version_number,storage_path,file_name,mime_type,size_bytes,created_by)
  values(v_deliverable.workspace_id,v_deliverable.id,v_version_number,p_storage_path,p_file_name,p_mime_type,p_size_bytes,v_actor)
  returning id into v_version_id;

  perform set_config('app.approval_supersede_v1','1',true);
  for r in
    select a.id,a.validator_id,a.requested_by,dv.version_number old_version
    from public.approvals a
    join public.deliverable_versions dv on dv.id=a.deliverable_version_id
    where a.status='pending' and dv.deliverable_id=v_deliverable.id and dv.id<>v_version_id
    for update of a
  loop
    update public.approvals
      set status='cancelled',decided_at=now(),decision_note='Version remplacée par v'||v_version_number::text,comment='Version remplacée par v'||v_version_number::text
      where id=r.id;
    if r.validator_id is distinct from v_actor then
      insert into public.notifications(workspace_id,user_id,kind,title,route)
      values(v_deliverable.workspace_id,r.validator_id,'approval_replaced',v_deliverable.title||' · validation v'||r.old_version::text||' remplacée par v'||v_version_number::text,'#/projects/'||v_deliverable.project_id::text||'/resources');
    end if;
    if r.requested_by is distinct from v_actor and r.requested_by is distinct from r.validator_id then
      insert into public.notifications(workspace_id,user_id,kind,title,route)
      values(v_deliverable.workspace_id,r.requested_by,'approval_replaced',v_deliverable.title||' · v'||r.old_version::text||' remplacée par v'||v_version_number::text,'#/projects/'||v_deliverable.project_id::text||'/resources');
    end if;
  end loop;
  perform set_config('app.approval_supersede_v1','0',true);

  if coalesce(p_share_external,false) then
    update public.deliverables set visibility='shared',status='draft',updated_at=now() where id=v_deliverable.id;
    insert into public.deliverable_version_shares(deliverable_version_id,workspace_id,project_id,shared_by)
    values(v_version_id,v_deliverable.workspace_id,v_deliverable.project_id,v_actor)
    on conflict (deliverable_version_id) do nothing;
  else
    update public.deliverables set status='draft',updated_at=now() where id=v_deliverable.id;
  end if;

  insert into public.audit_events(workspace_id,actor_id,event_type,entity_type,entity_id,payload)
  values(v_deliverable.workspace_id,v_actor,'deliverable.version_created','deliverable_version',v_version_id,
    jsonb_build_object('deliverable_id',v_deliverable.id,'project_id',v_deliverable.project_id,'version_number',v_version_number,'shared_external',coalesce(p_share_external,false)));

  return jsonb_build_object('version_id',v_version_id,'version_number',v_version_number,'shared_external',coalesce(p_share_external,false));
end;$$;

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

create or replace function public.decide_deliverable_approval_v1(
  p_approval_id uuid,p_status text,p_decision_note text default ''
) returns jsonb
language plpgsql security definer set search_path to '' as $$
declare
  v_actor uuid:=auth.uid();
  v_approval public.approvals%rowtype;
  v_project_status text;
  v_deliverable public.deliverables%rowtype;
  v_version public.deliverable_versions%rowtype;
begin
  if v_actor is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_status not in ('approved','changes_requested') then raise exception 'APPROVAL_DECISION_INVALID'; end if;
  if p_status='changes_requested' and nullif(btrim(coalesce(p_decision_note,'')),'') is null then raise exception 'APPROVAL_CHANGE_NOTE_REQUIRED'; end if;

  select * into v_approval from public.approvals where id=p_approval_id for update;
  if not found then raise exception 'APPROVAL_NOT_FOUND'; end if;
  if v_approval.validator_id is distinct from v_actor then raise exception 'APPROVAL_ONLY_VALIDATOR_CAN_DECIDE'; end if;
  if v_approval.status<>'pending' then raise exception 'APPROVAL_ALREADY_FINAL'; end if;

  select p.status into v_project_status from public.projects p where p.id=v_approval.project_id;
  if v_project_status in ('completed','archived') then raise exception 'PROJECT_APPROVAL_CLOSED'; end if;
  select * into v_version from public.deliverable_versions where id=v_approval.deliverable_version_id;
  select * into v_deliverable from public.deliverables where id=v_version.deliverable_id;
  if exists(select 1 from public.deliverable_versions dv where dv.deliverable_id=v_deliverable.id and dv.version_number>v_version.version_number) then raise exception 'APPROVAL_VERSION_SUPERSEDED'; end if;

  update public.approvals set status=p_status,decision_note=btrim(coalesce(p_decision_note,'')),comment=btrim(coalesce(p_decision_note,'')),decided_at=now()
  where id=v_approval.id;

  if v_approval.requested_by is distinct from v_actor then
    insert into public.notifications(workspace_id,user_id,kind,title,route)
    values(v_approval.workspace_id,v_approval.requested_by,
      case when p_status='approved' then 'approval_approved' else 'approval_changes_requested' end,
      v_deliverable.title||' · v'||v_version.version_number::text||case when p_status='approved' then ' approuvée' else ' · modifications demandées' end,
      '#/projects/'||v_approval.project_id::text||'/resources');
  end if;

  insert into public.audit_events(workspace_id,actor_id,event_type,entity_type,entity_id,payload)
  values(v_approval.workspace_id,v_actor,
    case when p_status='approved' then 'deliverable.approved' else 'deliverable.changes_requested' end,
    'approval',v_approval.id,
    jsonb_build_object('deliverable_id',v_deliverable.id,'version_id',v_version.id,'version_number',v_version.version_number,'requested_by',v_approval.requested_by,'decision_note',btrim(coalesce(p_decision_note,''))));

  return jsonb_build_object('approval_id',v_approval.id,'status',p_status,'decided_at',now(),'deliverable_id',v_deliverable.id,'version_id',v_version.id,'version_number',v_version.version_number);
end;$$;

create or replace function public.get_project_closure_preview_v3(p_project_id uuid) returns jsonb
language plpgsql security definer set search_path to '' as $$
declare
  v_actor uuid:=auth.uid();
  v_open_actions int:=0; v_open_milestones int:=0; v_open_requests int:=0; v_pending_approvals int:=0; v_deliverables int:=0;
  v_candidates jsonb:='[]'::jsonb;
begin
  if v_actor is null then raise exception 'AUTH_REQUIRED'; end if;
  if not app_private.can_manage_project_lifecycle_v1(p_project_id) then raise exception 'PROJECT_LIFECYCLE_FORBIDDEN'; end if;
  if not exists(select 1 from public.projects p where p.id=p_project_id) then raise exception 'PROJECT_NOT_FOUND'; end if;

  select count(*) into v_open_actions from public.actions a where a.project_id=p_project_id and a.status not in ('done','cancelled');
  select count(*) into v_open_milestones from public.milestones m where m.project_id=p_project_id and m.status not in ('done','cancelled');
  select count(*) into v_open_requests from public.requests r where r.project_id=p_project_id and r.status in ('open','answered');
  select count(*) into v_pending_approvals from public.approvals a where a.project_id=p_project_id and a.status='pending';
  select count(*) into v_deliverables from public.deliverables d where d.project_id=p_project_id and d.status<>'archived';

  select coalesce(jsonb_agg(to_jsonb(x) order by x.deliverable_title,x.version_number desc),'[]'::jsonb) into v_candidates
  from (
    select d.id deliverable_id,d.title deliverable_title,d.visibility deliverable_visibility,
      dv.id version_id,dv.version_number,dv.file_name,dv.mime_type,dv.size_bytes,dv.created_at,dv.created_by,
      dv.version_number=(select max(dv2.version_number) from public.deliverable_versions dv2 where dv2.deliverable_id=d.id) as is_latest,
      exists(select 1 from public.deliverable_version_shares s where s.deliverable_version_id=dv.id) as shared_external,
      case
        when exists(select 1 from public.approvals a where a.deliverable_version_id=dv.id and a.status='changes_requested') then 'changes_requested'
        when exists(select 1 from public.approvals a where a.deliverable_version_id=dv.id and a.status='pending') then 'pending'
        when exists(select 1 from public.approvals a where a.deliverable_version_id=dv.id and a.status='approved') then 'approved'
        else 'not_requested'
      end approval_status,
      case
        when dv.id=(select dv3.id from public.deliverable_versions dv3 where dv3.deliverable_id=d.id and exists(select 1 from public.approvals aa where aa.deliverable_version_id=dv3.id and aa.status='approved') order by dv3.version_number desc limit 1) then true
        when not exists(select 1 from public.deliverable_versions dv4 join public.approvals aa4 on aa4.deliverable_version_id=dv4.id and aa4.status='approved' where dv4.deliverable_id=d.id)
             and dv.version_number=(select max(dv5.version_number) from public.deliverable_versions dv5 where dv5.deliverable_id=d.id) then true
        else false
      end recommended
    from public.deliverables d join public.deliverable_versions dv on dv.deliverable_id=d.id
    where d.project_id=p_project_id and d.status<>'archived'
  ) x;

  return jsonb_build_object(
    'open_actions',v_open_actions,'open_milestones',v_open_milestones,'open_requests',v_open_requests,'pending_approvals',v_pending_approvals,
    'open_commitments',v_open_actions+v_open_milestones+v_open_requests+v_pending_approvals,
    'deliverables',v_deliverables,'reference_required',v_deliverables>0,'reference_candidates',v_candidates,'can_complete',v_pending_approvals=0
  );
end;$$;

create or replace function public.complete_project_v3(
  p_project_id uuid,p_result text,p_reference_version_ids uuid[] default array[]::uuid[],p_remaining text default '',p_confirm_open boolean default false
) returns jsonb
language plpgsql security definer set search_path to '' as $$
declare
  v_actor uuid:=auth.uid(); v_project public.projects%rowtype;
  v_open_actions int:=0; v_open_milestones int:=0; v_open_requests int:=0; v_pending_approvals int:=0; v_deliverable_count int:=0;
  v_ref_count int:=0; v_distinct_ref_count int:=0; v_distinct_deliverables int:=0; v_refs uuid[]:=coalesce(p_reference_version_ids,array[]::uuid[]);
  v_ref_names text:='aucune version sélectionnée'; v_decision_id uuid; v_closure_id uuid; v_sequence int; v_open_total int:=0;
begin
  if v_actor is null then raise exception 'AUTH_REQUIRED'; end if;
  if nullif(btrim(coalesce(p_result,'')),'') is null then raise exception 'PROJECT_RESULT_REQUIRED'; end if;
  select * into v_project from public.projects where id=p_project_id for update;
  if not found then raise exception 'PROJECT_NOT_FOUND'; end if;
  if not app_private.can_manage_project_lifecycle_v1(p_project_id) then raise exception 'PROJECT_LIFECYCLE_FORBIDDEN'; end if;
  if v_project.status='archived' then raise exception 'ARCHIVED_PROJECT_CANNOT_COMPLETE'; end if;
  if v_project.status='completed' then raise exception 'PROJECT_ALREADY_COMPLETED'; end if;

  select count(*) into v_open_actions from public.actions a where a.project_id=p_project_id and a.status not in ('done','cancelled');
  select count(*) into v_open_milestones from public.milestones m where m.project_id=p_project_id and m.status not in ('done','cancelled');
  select count(*) into v_open_requests from public.requests r where r.project_id=p_project_id and r.status in ('open','answered');
  select count(*) into v_pending_approvals from public.approvals a where a.project_id=p_project_id and a.status='pending';
  select count(*) into v_deliverable_count from public.deliverables d where d.project_id=p_project_id and d.status<>'archived';
  if v_pending_approvals>0 then raise exception 'PROJECT_PENDING_APPROVALS'; end if;
  v_open_total:=v_open_actions+v_open_milestones+v_open_requests;
  if v_open_total>0 and not coalesce(p_confirm_open,false) then raise exception 'OPEN_COMMITMENTS_CONFIRMATION_REQUIRED'; end if;
  if v_open_total>0 and nullif(btrim(coalesce(p_remaining,'')),'') is null then raise exception 'PROJECT_REMAINING_REQUIRED'; end if;
  if v_deliverable_count>0 and cardinality(v_refs)=0 then raise exception 'PROJECT_REFERENCE_VERSION_REQUIRED'; end if;

  if cardinality(v_refs)>0 then
    select count(*),count(distinct dv.id),count(distinct d.id),string_agg(d.title||' · v'||dv.version_number::text,', ' order by d.title,dv.version_number)
    into v_ref_count,v_distinct_ref_count,v_distinct_deliverables,v_ref_names
    from public.deliverable_versions dv join public.deliverables d on d.id=dv.deliverable_id
    where d.project_id=p_project_id and dv.id=any(v_refs);
    if v_ref_count<>cardinality(v_refs) or v_distinct_ref_count<>cardinality(v_refs) then raise exception 'REFERENCE_VERSION_MISMATCH'; end if;
    if v_distinct_deliverables<>cardinality(v_refs) then raise exception 'REFERENCE_ONE_VERSION_PER_DELIVERABLE'; end if;
    if exists(select 1 from public.approvals a where a.deliverable_version_id=any(v_refs) and a.status='changes_requested') then raise exception 'REFERENCE_VERSION_CHANGES_REQUESTED'; end if;
  end if;

  select coalesce(max(sequence_no),0)+1 into v_sequence from public.project_closures where project_id=p_project_id;
  insert into public.decisions(workspace_id,project_id,title,rationale,status,decided_by,decided_at,source_type,source_id,created_by,visibility)
  values(v_project.workspace_id,v_project.id,'Clôture #'||v_sequence::text||' — '||v_project.name,
    'Résultat obtenu : '||btrim(p_result)||E'\n'||'Versions finales : '||coalesce(v_ref_names,'aucune version sélectionnée')||E'\n'||
    'Engagements transmis/restants : '||coalesce(nullif(btrim(coalesce(p_remaining,'')),''),'aucun'),
    'decided',v_actor,now(),'project_closure',v_project.id,v_actor,'internal') returning id into v_decision_id;

  insert into public.project_closures(workspace_id,project_id,decision_id,sequence_no,result,remaining,open_actions,open_milestones,open_requests,closed_by)
  values(v_project.workspace_id,v_project.id,v_decision_id,v_sequence,btrim(p_result),btrim(coalesce(p_remaining,'')),v_open_actions,v_open_milestones,v_open_requests,v_actor)
  returning id into v_closure_id;

  if cardinality(v_refs)>0 then
    insert into public.project_closure_versions(closure_id,workspace_id,project_id,decision_id,deliverable_id,deliverable_version_id,deliverable_title_snapshot,version_number_snapshot,file_name_snapshot,storage_path_snapshot,mime_type_snapshot,size_bytes_snapshot,approval_status_snapshot)
    select v_closure_id,v_project.workspace_id,v_project.id,v_decision_id,d.id,dv.id,d.title,dv.version_number,dv.file_name,dv.storage_path,dv.mime_type,dv.size_bytes,
      case when exists(select 1 from public.approvals a where a.deliverable_version_id=dv.id and a.status='approved') then 'approved' else 'not_requested' end
    from public.deliverable_versions dv join public.deliverables d on d.id=dv.deliverable_id
    where dv.id=any(v_refs) and d.project_id=p_project_id;
  end if;

  perform set_config('app.project_status_workflow_v1','1',true);
  update public.projects set status='completed',updated_at=now() where id=v_project.id;
  insert into public.audit_events(workspace_id,actor_id,event_type,entity_type,entity_id,payload)
  values(v_project.workspace_id,v_actor,'project.completed','project',v_project.id,
    jsonb_build_object('closure_id',v_closure_id,'sequence_no',v_sequence,'decision_id',v_decision_id,'reference_version_ids',to_jsonb(v_refs),'open_actions',v_open_actions,'open_milestones',v_open_milestones,'open_requests',v_open_requests));

  return jsonb_build_object('project_id',v_project.id,'status','completed','closure_id',v_closure_id,'sequence_no',v_sequence,'decision_id',v_decision_id,'reference_version_ids',to_jsonb(v_refs));
end;$$;

create or replace function public.get_project_delivery_history_v1(p_project_id uuid) returns jsonb
language plpgsql security definer set search_path to '' as $$
declare
  v_actor uuid:=auth.uid(); v_workspace uuid; v_external boolean;
begin
  if v_actor is null then raise exception 'AUTH_REQUIRED'; end if;
  select workspace_id into v_workspace from public.projects where id=p_project_id;
  if v_workspace is null then raise exception 'PROJECT_NOT_FOUND'; end if;
  if not app_private.can_access_project(p_project_id) then raise exception 'PROJECT_ACCESS_DENIED'; end if;
  v_external:=app_private.is_external_workspace_member(v_workspace);
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'closure_id',c.id,'sequence_no',c.sequence_no,'result',c.result,
      'remaining',case when v_external then null else c.remaining end,
      'open_actions',case when v_external then null else c.open_actions end,
      'open_milestones',case when v_external then null else c.open_milestones end,
      'open_requests',case when v_external then null else c.open_requests end,
      'closed_by',c.closed_by,'closed_at',c.closed_at,
      'reopened_at',(select min(d.decided_at) from public.decisions d where d.project_id=c.project_id and d.source_type='project_reopen' and d.decided_at>c.closed_at and not exists(select 1 from public.project_closures c2 where c2.project_id=c.project_id and c2.closed_at>c.closed_at and c2.closed_at<d.decided_at)),
      'versions',coalesce((select jsonb_agg(jsonb_build_object(
        'deliverable_id',cv.deliverable_id,'version_id',cv.deliverable_version_id,'title',cv.deliverable_title_snapshot,'version_number',cv.version_number_snapshot,
        'file_name',cv.file_name_snapshot,'mime_type',cv.mime_type_snapshot,'size_bytes',cv.size_bytes_snapshot,'approval_status',cv.approval_status_snapshot
      ) order by cv.deliverable_title_snapshot,cv.version_number_snapshot)
      from public.project_closure_versions cv
      where cv.closure_id=c.id and (not v_external or exists(select 1 from public.deliverable_version_shares s where s.deliverable_version_id=cv.deliverable_version_id and s.project_id=c.project_id))), '[]'::jsonb)
    ) order by c.sequence_no desc)
    from public.project_closures c
    where c.project_id=p_project_id
      and (not v_external or exists(select 1 from public.project_closure_versions cv join public.deliverable_version_shares s on s.deliverable_version_id=cv.deliverable_version_id where cv.closure_id=c.id and s.project_id=c.project_id))
  ),'[]'::jsonb);
end;$$;

create or replace function public.get_project_closure_preview_v2(p_project_id uuid) returns jsonb language sql security definer set search_path to '' as $$ select public.get_project_closure_preview_v3(p_project_id); $$;
create or replace function public.get_project_closure_preview_v1(p_project_id uuid) returns jsonb language sql security definer set search_path to '' as $$ select public.get_project_closure_preview_v3(p_project_id); $$;
create or replace function public.complete_project_v2(p_project_id uuid,p_result text,p_reference_version_ids uuid[] default array[]::uuid[],p_remaining text default '',p_confirm_open boolean default false) returns jsonb language sql security definer set search_path to '' as $$ select public.complete_project_v3(p_project_id,p_result,p_reference_version_ids,p_remaining,p_confirm_open); $$;
create or replace function public.complete_project_v1(p_project_id uuid,p_result text,p_reference_deliverable_ids uuid[] default array[]::uuid[],p_remaining text default '',p_confirm_open boolean default false) returns jsonb
language plpgsql security definer set search_path to '' as $$
declare v_version_ids uuid[]:=array[]::uuid[]; d_id uuid; v_id uuid;
begin
  foreach d_id in array coalesce(p_reference_deliverable_ids,array[]::uuid[]) loop
    select dv.id into v_id
    from public.deliverable_versions dv
    where dv.deliverable_id=d_id
    order by case when exists(select 1 from public.approvals a where a.deliverable_version_id=dv.id and a.status='approved') then 0 else 1 end,dv.version_number desc
    limit 1;
    if v_id is not null then v_version_ids:=array_append(v_version_ids,v_id); end if;
  end loop;
  return public.complete_project_v3(p_project_id,p_result,v_version_ids,p_remaining,p_confirm_open);
end;$$;

revoke execute on function public.get_project_closure_preview_v3(uuid) from public,anon;
revoke execute on function public.complete_project_v3(uuid,text,uuid[],text,boolean) from public,anon;
revoke execute on function public.get_project_delivery_history_v1(uuid) from public,anon;
grant execute on function public.get_project_closure_preview_v3(uuid) to authenticated;
grant execute on function public.complete_project_v3(uuid,text,uuid[],text,boolean) to authenticated;
grant execute on function public.get_project_delivery_history_v1(uuid) to authenticated;
