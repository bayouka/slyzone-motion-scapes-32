-- 2b2c deliverable/version integrity hardening

create table if not exists public.deliverable_version_shares (
  deliverable_version_id uuid primary key references public.deliverable_versions(id) on delete restrict,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  shared_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

alter table public.deliverable_version_shares enable row level security;
create index if not exists deliverable_version_shares_project_idx on public.deliverable_version_shares(project_id, created_at desc);

drop policy if exists deliverable_version_shares_select on public.deliverable_version_shares;
create policy deliverable_version_shares_select on public.deliverable_version_shares
for select to authenticated
using (
  app_private.can_access_project(project_id)
  and exists (
    select 1
    from public.deliverable_versions dv
    join public.deliverables d on d.id=dv.deliverable_id
    where dv.id=deliverable_version_shares.deliverable_version_id
      and d.workspace_id=deliverable_version_shares.workspace_id
      and d.project_id=deliverable_version_shares.project_id
  )
);

revoke insert, update, delete on public.deliverable_version_shares from anon, authenticated;
grant select on public.deliverable_version_shares to authenticated;

create or replace function app_private.guard_deliverable_version_immutable_v1()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  raise exception 'DELIVERABLE_VERSION_IMMUTABLE';
end;
$$;

drop trigger if exists trg_deliverable_version_immutable_v1 on public.deliverable_versions;
create trigger trg_deliverable_version_immutable_v1
before update or delete on public.deliverable_versions
for each row execute function app_private.guard_deliverable_version_immutable_v1();

drop policy if exists deliverable_versions_update on public.deliverable_versions;
drop policy if exists deliverable_versions_delete on public.deliverable_versions;

drop policy if exists deliverable_versions_select on public.deliverable_versions;
create policy deliverable_versions_select on public.deliverable_versions
for select to authenticated
using (
  exists (
    select 1
    from public.deliverables d
    where d.id=deliverable_versions.deliverable_id
      and app_private.can_access_project(d.project_id)
      and (
        not app_private.is_external_workspace_member(d.workspace_id)
        or (
          d.visibility='shared'
          and exists (
            select 1 from public.deliverable_version_shares dvs
            where dvs.deliverable_version_id=deliverable_versions.id
              and dvs.workspace_id=d.workspace_id
              and dvs.project_id=d.project_id
          )
        )
      )
  )
);

create or replace function app_private.can_mutate_storage_path_v2(p_name text)
returns boolean
language sql
stable
security definer
set search_path=''
as $$
  select app_private.can_write_storage_path(p_name)
    and not exists (
      select 1 from public.deliverable_versions dv where dv.storage_path=p_name
    );
$$;

create or replace function app_private.can_read_storage_path(p_name text)
returns boolean
language sql
stable
security definer
set search_path=''
as $$
  with parsed as (
    select app_private.storage_workspace_id(p_name) as workspace_id,
      case when split_part(p_name,'/',2) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
        then split_part(p_name,'/',2)::uuid else null::uuid end as project_id
  )
  select exists (
    select 1 from parsed x
    join public.projects p on p.id=x.project_id and p.workspace_id=x.workspace_id
    where x.workspace_id is not null
      and app_private.can_access_project(x.project_id)
      and (
        not app_private.is_external_workspace_member(x.workspace_id)
        or exists (
          select 1
          from public.deliverable_versions dv
          join public.deliverables d on d.id=dv.deliverable_id
          join public.deliverable_version_shares dvs on dvs.deliverable_version_id=dv.id
          where dv.storage_path=p_name
            and d.project_id=x.project_id
            and d.workspace_id=x.workspace_id
            and d.visibility='shared'
            and dvs.workspace_id=x.workspace_id
            and dvs.project_id=x.project_id
        )
        or exists (
          select 1
          from public.project_resources r
          where r.storage_path=p_name
            and r.project_id=x.project_id
            and r.workspace_id=x.workspace_id
            and r.kind='file'
            and r.visibility='shared'
        )
      )
  );
$$;

drop policy if exists workspace_files_update on storage.objects;
create policy workspace_files_update on storage.objects
for update to authenticated
using (bucket_id='workspace-files' and app_private.can_mutate_storage_path_v2(name))
with check (bucket_id='workspace-files' and app_private.can_mutate_storage_path_v2(name));

drop policy if exists workspace_files_delete on storage.objects;
create policy workspace_files_delete on storage.objects
for delete to authenticated
using (bucket_id='workspace-files' and app_private.can_mutate_storage_path_v2(name));

create or replace function app_private.validate_approval_update_v2()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  v_supersede boolean := coalesce(current_setting('app.approval_supersede_v1',true),'')='1';
begin
  if new.workspace_id is distinct from old.workspace_id
     or new.project_id is distinct from old.project_id
     or new.deliverable_version_id is distinct from old.deliverable_version_id
     or new.requested_by is distinct from old.requested_by
     or new.validator_id is distinct from old.validator_id
     or new.created_at is distinct from old.created_at
     or new.request_note is distinct from old.request_note then
    raise exception 'APPROVAL_CONTEXT_IMMUTABLE';
  end if;

  if old.status is distinct from new.status then
    if old.status <> 'pending' then
      raise exception 'APPROVAL_ALREADY_FINAL';
    end if;

    if new.status in ('approved','changes_requested') then
      if auth.uid() is distinct from old.validator_id then
        raise exception 'APPROVAL_ONLY_VALIDATOR_CAN_DECIDE';
      end if;
      new.decided_at := coalesce(new.decided_at,now());
    elsif new.status='cancelled' then
      if not v_supersede
         and auth.uid() is distinct from old.requested_by
         and not app_private.can_manage_workspace(old.workspace_id) then
        raise exception 'APPROVAL_ONLY_REQUESTER_CAN_CANCEL';
      end if;
      new.decided_at := coalesce(new.decided_at,now());
    else
      raise exception 'APPROVAL_STATUS_TRANSITION_INVALID';
    end if;
  elsif new.comment is distinct from old.comment
        or new.decision_note is distinct from old.decision_note
        or new.decided_at is distinct from old.decided_at then
    raise exception 'APPROVAL_DECISION_FIELDS_REQUIRE_TRANSITION';
  end if;

  return new;
end;
$$;

create or replace function public.register_deliverable_version_v3(
  p_deliverable_id uuid,
  p_storage_path text,
  p_file_name text,
  p_mime_type text default null,
  p_size_bytes bigint default null,
  p_share_external boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_actor uuid:=auth.uid();
  v_deliverable public.deliverables%rowtype;
  v_version_number integer;
  v_version_id uuid;
begin
  if v_actor is null then raise exception 'AUTH_REQUIRED'; end if;
  if nullif(btrim(coalesce(p_storage_path,'')),'') is null then raise exception 'STORAGE_PATH_REQUIRED'; end if;
  if nullif(btrim(coalesce(p_file_name,'')),'') is null then raise exception 'FILE_NAME_REQUIRED'; end if;
  if p_size_bytes is not null and p_size_bytes<0 then raise exception 'FILE_SIZE_INVALID'; end if;

  select * into v_deliverable
  from public.deliverables
  where id=p_deliverable_id
  for update;
  if not found then raise exception 'DELIVERABLE_NOT_FOUND'; end if;
  if not app_private.can_write_project(v_deliverable.project_id) then raise exception 'PROJECT_WRITE_DENIED'; end if;
  if not app_private.can_write_storage_path(p_storage_path) then raise exception 'STORAGE_PATH_DENIED'; end if;
  if exists(select 1 from public.deliverable_versions where storage_path=p_storage_path) then raise exception 'STORAGE_PATH_ALREADY_REGISTERED'; end if;

  select coalesce(max(version_number),0)+1 into v_version_number
  from public.deliverable_versions
  where deliverable_id=v_deliverable.id;

  insert into public.deliverable_versions(
    workspace_id,deliverable_id,version_number,storage_path,file_name,mime_type,size_bytes,created_by
  ) values (
    v_deliverable.workspace_id,v_deliverable.id,v_version_number,p_storage_path,p_file_name,p_mime_type,p_size_bytes,v_actor
  ) returning id into v_version_id;

  perform set_config('app.approval_supersede_v1','1',true);
  update public.approvals a
  set status='cancelled',
      decided_at=now(),
      decision_note='Version remplacée par v'||v_version_number::text
  where a.status='pending'
    and a.deliverable_version_id in (
      select dv.id from public.deliverable_versions dv
      where dv.deliverable_id=v_deliverable.id and dv.id<>v_version_id
    );
  perform set_config('app.approval_supersede_v1','0',true);

  if coalesce(p_share_external,false) then
    update public.deliverables set visibility='shared',status='draft',updated_at=now() where id=v_deliverable.id;
    insert into public.deliverable_version_shares(deliverable_version_id,workspace_id,project_id,shared_by)
    values(v_version_id,v_deliverable.workspace_id,v_deliverable.project_id,v_actor)
    on conflict (deliverable_version_id) do nothing;
  else
    update public.deliverables set status='draft',updated_at=now() where id=v_deliverable.id;
  end if;

  return jsonb_build_object(
    'version_id',v_version_id,
    'version_number',v_version_number,
    'shared_external',coalesce(p_share_external,false)
  );
end;
$$;

create or replace function public.register_deliverable_version_v2(
  p_deliverable_id uuid,
  p_storage_path text,
  p_file_name text,
  p_mime_type text default null,
  p_size_bytes bigint default null
)
returns integer
language plpgsql
security definer
set search_path=''
as $$
declare v_result jsonb;
begin
  v_result:=public.register_deliverable_version_v3(
    p_deliverable_id,p_storage_path,p_file_name,p_mime_type,p_size_bytes,false
  );
  return (v_result->>'version_number')::integer;
end;
$$;

create or replace function public.request_deliverable_approval_v1(
  p_deliverable_id uuid,
  p_version_id uuid,
  p_validator_id uuid,
  p_request_note text default ''
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
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
  if not app_private.can_write_project(v_deliverable.project_id) then raise exception 'PROJECT_WRITE_DENIED'; end if;
  if not app_private.can_assign_approval_validator(v_deliverable.project_id,p_validator_id) then raise exception 'VALIDATOR_PROJECT_ACCESS_DENIED'; end if;

  select wm.role into v_validator_role
  from public.workspace_members wm
  where wm.workspace_id=v_deliverable.workspace_id and wm.user_id=p_validator_id and wm.status='active';
  if v_validator_role is null then raise exception 'VALIDATOR_NOT_ACTIVE'; end if;

  if v_validator_role='guest' then
    update public.deliverables set visibility='shared',updated_at=now() where id=v_deliverable.id;
    insert into public.deliverable_version_shares(deliverable_version_id,workspace_id,project_id,shared_by)
    values(v_version.id,v_deliverable.workspace_id,v_deliverable.project_id,v_actor)
    on conflict (deliverable_version_id) do nothing;
  end if;

  insert into public.approvals(
    workspace_id,project_id,deliverable_version_id,requested_by,validator_id,status,request_note,comment
  ) values (
    v_deliverable.workspace_id,v_deliverable.project_id,v_version.id,v_actor,p_validator_id,'pending',coalesce(p_request_note,''),''
  ) returning id into v_approval_id;

  return jsonb_build_object(
    'approval_id',v_approval_id,
    'deliverable_id',v_deliverable.id,
    'version_id',v_version.id,
    'validator_id',p_validator_id,
    'shared_external',v_validator_role='guest',
    'status','pending'
  );
end;
$$;

create or replace function public.decide_deliverable_approval_v1(
  p_approval_id uuid,
  p_status text,
  p_decision_note text default ''
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_actor uuid:=auth.uid();
  v_approval public.approvals%rowtype;
  v_project_status text;
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

  update public.approvals
  set status=p_status,
      decision_note=btrim(coalesce(p_decision_note,'')),
      comment=btrim(coalesce(p_decision_note,'')),
      decided_at=now()
  where id=v_approval.id;

  return jsonb_build_object('approval_id',v_approval.id,'status',p_status,'decided_at',now());
end;
$$;

create table if not exists public.project_closure_versions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  decision_id uuid not null references public.decisions(id) on delete cascade,
  deliverable_id uuid not null references public.deliverables(id) on delete restrict,
  deliverable_version_id uuid not null references public.deliverable_versions(id) on delete restrict,
  deliverable_title_snapshot text not null,
  version_number_snapshot integer not null,
  file_name_snapshot text not null,
  storage_path_snapshot text not null,
  mime_type_snapshot text,
  size_bytes_snapshot bigint,
  approval_status_snapshot text not null default 'not_requested',
  created_at timestamptz not null default now(),
  unique(decision_id,deliverable_version_id)
);

alter table public.project_closure_versions enable row level security;
create index if not exists project_closure_versions_project_idx on public.project_closure_versions(project_id,created_at desc);

drop policy if exists project_closure_versions_select on public.project_closure_versions;
create policy project_closure_versions_select on public.project_closure_versions
for select to authenticated
using (
  app_private.can_access_project(project_id)
  and (
    not app_private.is_external_workspace_member(workspace_id)
    or exists (
      select 1 from public.deliverable_version_shares dvs
      where dvs.deliverable_version_id=project_closure_versions.deliverable_version_id
        and dvs.workspace_id=project_closure_versions.workspace_id
        and dvs.project_id=project_closure_versions.project_id
    )
  )
);

revoke insert,update,delete on public.project_closure_versions from anon,authenticated;
grant select on public.project_closure_versions to authenticated;

create or replace function public.get_project_closure_preview_v2(p_project_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_actor uuid:=auth.uid();
  v_open_actions int:=0;
  v_open_milestones int:=0;
  v_open_requests int:=0;
  v_pending_approvals int:=0;
  v_deliverables int:=0;
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

  select coalesce(jsonb_agg(to_jsonb(x) order by x.deliverable_title),'[]'::jsonb) into v_candidates
  from (
    select distinct on (d.id)
      d.id deliverable_id,
      d.title deliverable_title,
      dv.id version_id,
      dv.version_number,
      dv.file_name,
      case
        when exists(select 1 from public.approvals a where a.deliverable_version_id=dv.id and a.status='approved') then 'approved'
        when exists(select 1 from public.approvals a where a.deliverable_version_id=dv.id and a.status='changes_requested') then 'changes_requested'
        when exists(select 1 from public.approvals a where a.deliverable_version_id=dv.id and a.status='pending') then 'pending'
        else 'not_requested'
      end approval_status
    from public.deliverables d
    join public.deliverable_versions dv on dv.deliverable_id=d.id
    where d.project_id=p_project_id and d.status<>'archived'
    order by d.id,
      case when exists(select 1 from public.approvals a where a.deliverable_version_id=dv.id and a.status='approved') then 0 else 1 end,
      dv.version_number desc
  ) x;

  return jsonb_build_object(
    'open_actions',v_open_actions,
    'open_milestones',v_open_milestones,
    'open_requests',v_open_requests,
    'pending_approvals',v_pending_approvals,
    'open_commitments',v_open_actions+v_open_milestones+v_open_requests+v_pending_approvals,
    'deliverables',v_deliverables,
    'reference_required',v_deliverables>0,
    'reference_candidates',v_candidates,
    'can_complete',v_pending_approvals=0
  );
end;
$$;

create or replace function public.complete_project_v2(
  p_project_id uuid,
  p_result text,
  p_reference_version_ids uuid[] default array[]::uuid[],
  p_remaining text default '',
  p_confirm_open boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_actor uuid:=auth.uid();
  v_project public.projects%rowtype;
  v_open_actions int:=0;
  v_open_milestones int:=0;
  v_open_requests int:=0;
  v_pending_approvals int:=0;
  v_deliverable_count int:=0;
  v_ref_count int:=0;
  v_distinct_ref_count int:=0;
  v_refs uuid[]:=coalesce(p_reference_version_ids,array[]::uuid[]);
  v_ref_names text:='aucune version sélectionnée';
  v_decision_id uuid;
  v_open_total int:=0;
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
    select count(*),count(distinct dv.id),string_agg(d.title||' · v'||dv.version_number::text,', ' order by d.title,dv.version_number)
      into v_ref_count,v_distinct_ref_count,v_ref_names
    from public.deliverable_versions dv
    join public.deliverables d on d.id=dv.deliverable_id
    where d.project_id=p_project_id and dv.id=any(v_refs);

    if v_ref_count<>cardinality(v_refs) or v_distinct_ref_count<>cardinality(v_refs) then raise exception 'REFERENCE_VERSION_MISMATCH'; end if;
    if exists(
      select 1 from public.approvals a
      where a.deliverable_version_id=any(v_refs) and a.status='changes_requested'
    ) then raise exception 'REFERENCE_VERSION_CHANGES_REQUESTED'; end if;
  end if;

  insert into public.decisions(workspace_id,project_id,title,rationale,status,decided_by,decided_at,source_type,source_id,created_by,visibility)
  values(
    v_project.workspace_id,v_project.id,'Clôture du projet — '||v_project.name,
    'Résultat obtenu : '||btrim(p_result)||E'\n'||
    'Versions de référence : '||coalesce(v_ref_names,'aucune version sélectionnée')||E'\n'||
    'Engagements à transmettre ou restant ouverts : '||coalesce(nullif(btrim(coalesce(p_remaining,'')),''),'aucun')||E'\n'||
    'État au moment de la clôture : '||v_open_actions||' action(s) ouverte(s), '||v_open_milestones||' jalon(s) ouvert(s), '||v_open_requests||' demande(s) non clôturée(s), aucune validation en attente.',
    'decided',v_actor,now(),'project_closure',v_project.id,v_actor,'internal'
  ) returning id into v_decision_id;

  if cardinality(v_refs)>0 then
    insert into public.project_closure_versions(
      workspace_id,project_id,decision_id,deliverable_id,deliverable_version_id,
      deliverable_title_snapshot,version_number_snapshot,file_name_snapshot,storage_path_snapshot,
      mime_type_snapshot,size_bytes_snapshot,approval_status_snapshot
    )
    select
      v_project.workspace_id,v_project.id,v_decision_id,d.id,dv.id,
      d.title,dv.version_number,dv.file_name,dv.storage_path,dv.mime_type,dv.size_bytes,
      case
        when exists(select 1 from public.approvals a where a.deliverable_version_id=dv.id and a.status='approved') then 'approved'
        else 'not_requested'
      end
    from public.deliverable_versions dv
    join public.deliverables d on d.id=dv.deliverable_id
    where dv.id=any(v_refs) and d.project_id=p_project_id;
  end if;

  perform set_config('app.project_status_workflow_v1','1',true);
  update public.projects set status='completed',updated_at=now() where id=v_project.id;

  insert into public.audit_events(workspace_id,actor_id,event_type,entity_type,entity_id,payload)
  values(v_project.workspace_id,v_actor,'project.completed','project',v_project.id,
    jsonb_build_object(
      'decision_id',v_decision_id,
      'reference_version_ids',to_jsonb(v_refs),
      'open_actions',v_open_actions,
      'open_milestones',v_open_milestones,
      'open_requests',v_open_requests,
      'pending_approvals',0
    )
  );

  return jsonb_build_object('project_id',v_project.id,'status','completed','decision_id',v_decision_id,'reference_version_ids',to_jsonb(v_refs));
end;
$$;

create or replace function public.get_workspace_sync_digest_v1(p_workspace_id uuid)
returns table(digest text)
language plpgsql
stable
set search_path=''
as $$
declare
  v_actor uuid:=auth.uid();
  v_digest text;
begin
  if v_actor is null then raise exception 'AUTH_REQUIRED'; end if;
  if not exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id=p_workspace_id and wm.user_id=v_actor and wm.status='active'
  ) then raise exception 'WORKSPACE_ACCESS_DENIED'; end if;

  select md5(concat_ws('|',
    (select concat(count(*),':',coalesce(max(p.updated_at)::text,'')) from public.projects p where p.workspace_id=p_workspace_id),
    (select concat(count(*),':',coalesce(max(a.updated_at)::text,'')) from public.actions a where a.workspace_id=p_workspace_id),
    (select concat(count(*),':',coalesce(max(m.updated_at)::text,'')) from public.milestones m where m.workspace_id=p_workspace_id),
    (select concat(count(*),':',coalesce(max(r.updated_at)::text,'')) from public.requests r where r.workspace_id=p_workspace_id),
    (select concat(count(*),':',coalesce(max(coalesce(ap.decided_at,ap.created_at))::text,'')) from public.approvals ap where ap.workspace_id=p_workspace_id),
    (select concat(count(*),':',coalesce(max(d.updated_at)::text,'')) from public.deliverables d where d.workspace_id=p_workspace_id),
    (select concat(count(*),':',coalesce(max(v.created_at)::text,'')) from public.deliverable_versions v where v.workspace_id=p_workspace_id),
    (select concat(count(*),':',coalesce(max(pr.updated_at)::text,'')) from public.project_resources pr where pr.workspace_id=p_workspace_id),
    (select concat(count(*),':',coalesce(max(dvs.created_at)::text,'')) from public.deliverable_version_shares dvs where dvs.workspace_id=p_workspace_id),
    (select concat(count(*),':',coalesce(max(pcv.created_at)::text,'')) from public.project_closure_versions pcv where pcv.workspace_id=p_workspace_id),
    (select concat(count(*),':',coalesce(max(coalesce(c.last_message_at,c.updated_at,c.created_at))::text,'')) from public.conversations c where c.workspace_id=p_workspace_id),
    (select concat(count(*),':',coalesce(max(coalesce(msg.deleted_at,msg.edited_at,msg.created_at))::text,'')) from public.messages msg where msg.workspace_id=p_workspace_id),
    (select concat(count(*),':',coalesce(max(n.created_at)::text,''),':',coalesce(max(n.read_at)::text,'')) from public.notifications n where n.workspace_id=p_workspace_id and n.user_id=v_actor),
    (select md5(coalesce(string_agg(concat_ws(':',mt.id::text,coalesce(mt.status,''),coalesce(mt.starts_at::text,''),coalesce(mt.ends_at::text,''),coalesce(mt.visibility,''),coalesce(mt.agenda,''),coalesce(mt.live_notes,''),coalesce(mt.summary,'')),'|' order by mt.id::text),'')) from public.meetings mt where mt.workspace_id=p_workspace_id),
    (select md5(coalesce(string_agg(concat_ws(':',wm.user_id::text,coalesce(wm.role,''),coalesce(wm.status,''),coalesce(wm.access_mode,'')),'|' order by wm.user_id::text),'')) from public.workspace_members wm where wm.workspace_id=p_workspace_id),
    (select md5(coalesce(string_agg(concat_ws(':',pm.project_id::text,pm.user_id::text,coalesce(pm.role,'')),'|' order by pm.project_id::text,pm.user_id::text),'')) from public.project_members pm join public.projects p on p.id=pm.project_id where p.workspace_id=p_workspace_id),
    (select md5(coalesce(string_agg(concat_ws(':',aa.action_id::text,aa.user_id::text),'|' order by aa.action_id::text,aa.user_id::text),'')) from public.action_assignees aa join public.actions a on a.id=aa.action_id where a.workspace_id=p_workspace_id),
    (select md5(coalesce(string_agg(concat_ws(':',ma.meeting_id::text,ma.user_id::text,coalesce(ma.response,'')),'|' order by ma.meeting_id::text,ma.user_id::text),'')) from public.meeting_attendees ma join public.meetings mt on mt.id=ma.meeting_id where mt.workspace_id=p_workspace_id),
    (select md5(coalesce(string_agg(concat_ws(':',cm.conversation_id::text,cm.user_id::text,coalesce(cm.hidden_at::text,'')),'|' order by cm.conversation_id::text,cm.user_id::text),'')) from public.conversation_members cm join public.conversations c on c.id=cm.conversation_id where c.workspace_id=p_workspace_id)
  )) into v_digest;
  return query select v_digest;
end;
$$;

drop index if exists public.approvals_one_pending_per_version_validator_idx;

revoke all on function public.register_deliverable_version_v3(uuid,text,text,text,bigint,boolean) from public,anon;
grant execute on function public.register_deliverable_version_v3(uuid,text,text,text,bigint,boolean) to authenticated;
revoke all on function public.register_deliverable_version_v2(uuid,text,text,text,bigint) from public,anon;
grant execute on function public.register_deliverable_version_v2(uuid,text,text,text,bigint) to authenticated;
revoke all on function public.request_deliverable_approval_v1(uuid,uuid,uuid,text) from public,anon;
grant execute on function public.request_deliverable_approval_v1(uuid,uuid,uuid,text) to authenticated;
revoke all on function public.decide_deliverable_approval_v1(uuid,text,text) from public,anon;
grant execute on function public.decide_deliverable_approval_v1(uuid,text,text) to authenticated;
revoke all on function public.get_project_closure_preview_v2(uuid) from public,anon;
grant execute on function public.get_project_closure_preview_v2(uuid) to authenticated;
revoke all on function public.complete_project_v2(uuid,text,uuid[],text,boolean) from public,anon;
grant execute on function public.complete_project_v2(uuid,text,uuid[],text,boolean) to authenticated;
