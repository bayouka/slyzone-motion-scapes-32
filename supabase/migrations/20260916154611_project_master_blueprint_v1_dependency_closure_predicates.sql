-- 4b4c Project Master Blueprint V1 — complete canonical DependencyClosure predicates.
-- Applied live first via Supabase migration 20260916154611.

alter table app_private.project_node_definitions_v1
  add column if not exists rfd_criticality text not null default 'REQUIRED',
  add column if not exists ownership_requirement text not null default 'OWNER_REF';

alter table app_private.project_node_definitions_v1
  drop constraint if exists project_node_definitions_v1_rfd_criticality_check;
alter table app_private.project_node_definitions_v1
  add constraint project_node_definitions_v1_rfd_criticality_check
  check (rfd_criticality in ('BLOCKING','REQUIRED','CONDITIONAL','NON_BLOCKING'));

alter table app_private.project_node_definitions_v1
  drop constraint if exists project_node_definitions_v1_ownership_requirement_check;
alter table app_private.project_node_definitions_v1
  add constraint project_node_definitions_v1_ownership_requirement_check
  check (ownership_requirement in ('NONE','OWNER_REF','AUTHORITY_ACCEPTED_BY','OWNER_OR_AUTHORITY'));

update app_private.project_node_definitions_v1
set rfd_criticality = case
  when node_id in (
    'SV.D06.APPROVED_BASELINE',
    'SV.D15.EXPERT_SIGNOFF',
    'SV.D15.ACCEPTANCE_CRITERIA',
    'SV.D16.DEVELOPER_AMBIGUITY_AUDIT',
    'SV.D16.READY_APPROVAL'
  ) then 'BLOCKING'
  when node_id in (
    'SV.D09.SEO_PAGE_MAP',
    'SV.D12.BUSINESS_RULES',
    'SV.D14.MEASUREMENT_PLAN'
  ) then 'CONDITIONAL'
  else 'REQUIRED'
end,
ownership_requirement = case
  when node_id='SV.D16.SOURCE_OF_TRUTH_MANIFEST' then 'NONE'
  when legacy_semantic_type in ('DECISION','VERIFY') then 'OWNER_OR_AUTHORITY'
  else 'OWNER_REF'
end
where blueprint_id='SITE_VITRINE' and blueprint_version='1.0-bridge-r7';

create table if not exists app_private.project_ownership_assignments_v1 (
  id uuid primary key default gen_random_uuid(),
  project_definition_id uuid not null references public.project_definitions(id) on delete cascade,
  blueprint_id text not null,
  blueprint_version text not null,
  node_id text not null,
  responsibility_type text not null,
  owner_ref text not null,
  authority_type text not null,
  status text not null default 'ACTIVE',
  source_ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (blueprint_id, blueprint_version, node_id)
    references app_private.project_node_definitions_v1(blueprint_id, blueprint_version, node_id),
  constraint project_ownership_assignments_v1_responsibility_check
    check (responsibility_type in ('DECIDES','IMPLEMENTS','VALIDATES','PROVIDES','VERIFIES','APPROVES')),
  constraint project_ownership_assignments_v1_authority_check
    check (authority_type in ('USER','ROLE','TEAM','EXPERT','SYSTEM')),
  constraint project_ownership_assignments_v1_status_check
    check (status in ('ACTIVE','SUPERSEDED','REVOKED')),
  constraint project_ownership_assignments_v1_owner_check
    check (length(btrim(owner_ref)) > 0)
);

create unique index if not exists project_ownership_assignments_v1_active_unique
  on app_private.project_ownership_assignments_v1(project_definition_id,blueprint_id,blueprint_version,node_id,responsibility_type,owner_ref)
  where status='ACTIVE';

revoke all on table app_private.project_ownership_assignments_v1 from public, anon, authenticated;
grant select on table app_private.project_ownership_assignments_v1 to service_role;

create table if not exists app_private.project_conflict_records_v1 (
  id uuid primary key default gen_random_uuid(),
  project_definition_id uuid not null references public.project_definitions(id) on delete cascade,
  blueprint_id text not null,
  blueprint_version text not null,
  node_id text,
  severity text not null,
  status text not null default 'OPEN',
  description text not null,
  source_refs jsonb not null default '[]'::jsonb,
  resolution text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  foreign key (blueprint_id, blueprint_version)
    references app_private.project_blueprint_packs_v1(blueprint_id, blueprint_version),
  foreign key (blueprint_id, blueprint_version, node_id)
    references app_private.project_node_definitions_v1(blueprint_id, blueprint_version, node_id),
  constraint project_conflict_records_v1_severity_check
    check (severity in ('CRITICAL','HIGH','MEDIUM','LOW')),
  constraint project_conflict_records_v1_status_check
    check (status in ('OPEN','RESOLVED','ACCEPTED')),
  constraint project_conflict_records_v1_description_check
    check (length(btrim(description)) > 0),
  constraint project_conflict_records_v1_source_refs_check
    check (jsonb_typeof(source_refs)='array')
);

revoke all on table app_private.project_conflict_records_v1 from public, anon, authenticated;
grant select on table app_private.project_conflict_records_v1 to service_role;

create or replace function public.get_project_delivery_lot_dependency_closure_v1(p_lot_id uuid)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with lot as (
    select dl.* from app_private.project_delivery_lots_v1 dl where dl.id = p_lot_id
  ),
  roots as (
    select array_agg(n.node_id order by n.node_id)::text[] as node_ids
    from app_private.project_delivery_lot_nodes_v1 n where n.lot_id = p_lot_id
  ),
  structural as (
    select app_private.get_blueprint_dependency_closure_v1(
      l.blueprint_id,l.blueprint_version,coalesce(r.node_ids,array[]::text[])
    ) as payload
    from lot l cross join roots r
  ),
  closure_node_ids as (
    select jsonb_array_elements_text(s.payload->'closure_node_ids') as node_id from structural s
  ),
  raw_state_rows as (
    select
      nd.node_id,nd.legacy_requirement_id,nd.title,nd.applicability_default,nd.fulfilment_stage_required,
      nd.rfd_criticality,nd.ownership_requirement,
      prs.id is not null as state_present,
      case when prs.id is null then 'UNRESOLVED' when prs.applicable then 'APPLICABLE' else 'NOT_APPLICABLE' end as applicability_state,
      prs.resolution_level,prs.state as legacy_state,prs.lock_state,prs.blocker_status,prs.blocker_reason,
      prs.owner_ref,prs.authority_type,prs.accepted_by,
      case when nd.legacy_requirement_id is null then false
           else app_private.project_requirement_satisfied_v1(l.project_definition_id,nd.legacy_requirement_id)
      end as legacy_requirement_satisfied,
      exists(
        select 1
        from app_private.project_ownership_assignments_v1 oa
        where oa.project_definition_id=l.project_definition_id
          and oa.blueprint_id=l.blueprint_id
          and oa.blueprint_version=l.blueprint_version
          and oa.node_id=nd.node_id
          and oa.status='ACTIVE'
      ) as has_native_ownership
    from lot l
    join closure_node_ids c on true
    join app_private.project_node_definitions_v1 nd
      on nd.blueprint_id=l.blueprint_id and nd.blueprint_version=l.blueprint_version and nd.node_id=c.node_id
    left join public.project_definition_requirement_states prs
      on prs.project_definition_id=l.project_definition_id and prs.requirement_id=nd.legacy_requirement_id
  ),
  state_rows as (
    select r.*,
      case
        when r.applicability_state='NOT_APPLICABLE' then true
        when r.ownership_requirement='NONE' then true
        when r.has_native_ownership then true
        when r.ownership_requirement='OWNER_REF' then r.owner_ref is not null and btrim(r.owner_ref)<>''
        when r.ownership_requirement='AUTHORITY_ACCEPTED_BY' then r.accepted_by is not null
        when r.ownership_requirement='OWNER_OR_AUTHORITY' then
          (r.owner_ref is not null and btrim(r.owner_ref)<>'') or r.accepted_by is not null
        else false
      end as ownership_resolved,
      case
        when r.legacy_requirement_satisfied and r.fulfilment_stage_required='DEFINITION' then 'DEFINITION_SATISFIED'
        when r.legacy_requirement_satisfied and r.fulfilment_stage_required='RFD' then 'RFD_SATISFIED'
        when r.applicability_state='NOT_APPLICABLE' and r.legacy_requirement_satisfied then 'NOT_APPLICABLE_SATISFIED'
        else 'UNRESOLVED'
      end as canonical_fulfilment_status
    from raw_state_rows r
  ),
  conflicts as (
    select c.id,c.node_id,c.severity,c.status,c.description
    from lot l
    join app_private.project_conflict_records_v1 c
      on c.project_definition_id=l.project_definition_id
     and c.blueprint_id=l.blueprint_id
     and c.blueprint_version=l.blueprint_version
    where c.status='OPEN'
      and c.severity in ('CRITICAL','HIGH')
      and (c.node_id is null or exists(select 1 from closure_node_ids n where n.node_id=c.node_id))
  ),
  diag as (
    select
      count(*) filter (where not state_present)::int as missing_state_count,
      count(*) filter (where state_present and legacy_state <> 'current')::int as stale_state_count,
      count(*) filter (where state_present and blocker_status='OPEN')::int as open_blocker_count,
      count(*) filter (where not legacy_requirement_satisfied)::int as unsatisfied_requirement_count,
      count(*) filter (
        where rfd_criticality in ('BLOCKING','REQUIRED')
          and applicability_state <> 'NOT_APPLICABLE'
          and (
            not state_present
            or resolution_level is null
            or resolution_level in ('UNRESOLVED','WORKING_ASSUMPTION','AI_PROPOSED','ACCEPTED_UNKNOWN')
          )
      )::int as critical_tbd_count,
      count(*) filter (where not ownership_resolved)::int as ownership_gap_count,
      count(*) filter (where legacy_requirement_id is null)::int as unmapped_native_state_count
    from state_rows
  ),
  conflict_diag as (
    select count(*)::int as critical_conflict_count from conflicts
  )
  select jsonb_build_object(
    'schema_version','1.1',
    'object_type','DependencyClosure',
    'lot',jsonb_build_object(
      'id',l.id,'project_definition_id',l.project_definition_id,'lot_key',l.lot_key,'title',l.title,'purpose',l.purpose,
      'status',l.status,'created_definition_revision',l.created_definition_revision,
      'blueprint_id',l.blueprint_id,'blueprint_version',l.blueprint_version
    ),
    'structural',s.payload,
    'node_state_diagnostics',coalesce((select jsonb_agg(jsonb_build_object(
      'node_id',node_id,'legacy_requirement_id',legacy_requirement_id,'title',title,
      'rfd_criticality',rfd_criticality,'ownership_requirement',ownership_requirement,
      'state_present',state_present,'applicability_state',applicability_state,
      'resolution_level',resolution_level,'legacy_state',legacy_state,'lock_state',lock_state,
      'blocker_status',blocker_status,'blocker_reason',blocker_reason,
      'owner_ref',owner_ref,'authority_type',authority_type,'accepted_by',accepted_by,
      'has_native_ownership',has_native_ownership,'ownership_resolved',ownership_resolved,
      'legacy_requirement_satisfied',legacy_requirement_satisfied,
      'canonical_fulfilment_status',canonical_fulfilment_status
    ) order by node_id) from state_rows),'[]'::jsonb),
    'open_critical_conflicts',coalesce((select jsonb_agg(jsonb_build_object(
      'id',id,'node_id',node_id,'severity',severity,'status',status,'description',description
    ) order by severity,id) from conflicts),'[]'::jsonb),
    'diagnostics',jsonb_build_object(
      'missing_state_count',d.missing_state_count,
      'stale_state_count',d.stale_state_count,
      'open_blocker_count',d.open_blocker_count,
      'unsatisfied_requirement_count',d.unsatisfied_requirement_count,
      'critical_tbd_count',d.critical_tbd_count,
      'ownership_gap_count',d.ownership_gap_count,
      'critical_conflict_count',cd.critical_conflict_count,
      'unmapped_native_state_count',d.unmapped_native_state_count,
      'dependency_closure_predicate',case
        when s.payload->>'structural_status'='CLOSED'
         and d.missing_state_count=0
         and d.stale_state_count=0
         and d.open_blocker_count=0
         and d.unsatisfied_requirement_count=0
         and d.critical_tbd_count=0
         and d.ownership_gap_count=0
         and cd.critical_conflict_count=0
         and d.unmapped_native_state_count=0
        then 'PASS' else 'FAIL' end,
      'critical_tbd_closure_predicate',case when d.critical_tbd_count=0 then 'PASS' else 'FAIL' end,
      'ownership_closure_predicate',case when d.ownership_gap_count=0 then 'PASS' else 'FAIL' end,
      'conflict_closure_status',case when cd.critical_conflict_count=0 then 'CLOSED' else 'OPEN_CRITICAL_CONFLICT' end,
      'fulfilment_mapping','BRIDGED_FROM_R7_PROJECT_REQUIREMENT_SATISFACTION_V1'
    )
  )
  from lot l cross join structural s cross join diag d cross join conflict_diag cd;
$$;

revoke all on function public.get_project_delivery_lot_dependency_closure_v1(uuid) from public, anon, authenticated;
grant execute on function public.get_project_delivery_lot_dependency_closure_v1(uuid) to service_role;
