-- Prefer the current deliverable version at closure and require every closure-version row to belong to a structured closure.

do $$ begin
  if exists(select 1 from public.project_closure_versions where closure_id is null) then
    raise exception 'PROJECT_CLOSURE_VERSION_LEGACY_ROWS_REQUIRE_BACKFILL';
  end if;
end $$;
alter table public.project_closure_versions alter column closure_id set not null;

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
      (
        dv.version_number=(select max(dv3.version_number) from public.deliverable_versions dv3 where dv3.deliverable_id=d.id)
        and not exists(select 1 from public.approvals a where a.deliverable_version_id=dv.id and a.status in ('changes_requested','pending'))
      ) recommended
    from public.deliverables d join public.deliverable_versions dv on dv.deliverable_id=d.id
    where d.project_id=p_project_id and d.status<>'archived'
  ) x;

  return jsonb_build_object(
    'open_actions',v_open_actions,'open_milestones',v_open_milestones,'open_requests',v_open_requests,'pending_approvals',v_pending_approvals,
    'open_commitments',v_open_actions+v_open_milestones+v_open_requests+v_pending_approvals,
    'deliverables',v_deliverables,'reference_required',v_deliverables>0,'reference_candidates',v_candidates,'can_complete',v_pending_approvals=0
  );
end;$$;

create or replace function public.complete_project_v1(p_project_id uuid,p_result text,p_reference_deliverable_ids uuid[] default array[]::uuid[],p_remaining text default '',p_confirm_open boolean default false) returns jsonb
language plpgsql security definer set search_path to '' as $$
declare v_version_ids uuid[]:=array[]::uuid[]; d_id uuid; v_id uuid;
begin
  foreach d_id in array coalesce(p_reference_deliverable_ids,array[]::uuid[]) loop
    select dv.id into v_id from public.deliverable_versions dv where dv.deliverable_id=d_id order by dv.version_number desc limit 1;
    if v_id is not null then v_version_ids:=array_append(v_version_ids,v_id); end if;
  end loop;
  return public.complete_project_v3(p_project_id,p_result,v_version_ids,p_remaining,p_confirm_open);
end;$$;
