-- 4b4c Project Master Blueprint V1 — QUALITY_REQUIREMENTS_DEFINED + TESTABILITY_READY.
-- Applied live first via Supabase migration 20260916155201.
-- Additive service-only policy/evaluation layer over the R7 instance state.

create table if not exists app_private.project_readiness_node_policy_v1 (
  blueprint_id text not null,
  blueprint_version text not null,
  node_id text not null,
  quality_role text not null default 'NONE',
  quality_scope text not null default 'CLOSURE_ONLY',
  testability_mode text not null default 'ACCEPTANCE_RULE',
  notes text not null default '',
  primary key (blueprint_id, blueprint_version, node_id),
  foreign key (blueprint_id, blueprint_version, node_id)
    references app_private.project_node_definitions_v1(blueprint_id, blueprint_version, node_id)
    on delete cascade,
  constraint project_readiness_node_policy_v1_quality_role_check
    check (quality_role in ('NONE','QUALITY_REQUIREMENT','QUALITY_AUTHORITY')),
  constraint project_readiness_node_policy_v1_quality_scope_check
    check (quality_scope in ('CLOSURE_ONLY','PROJECT_OVERLAY')),
  constraint project_readiness_node_policy_v1_testability_mode_check
    check (testability_mode in ('NONE','ACCEPTANCE_RULE','DETERMINISTIC_STATE','AUTHORITY_DECISION','EXPERT_SIGNOFF'))
);

revoke all on table app_private.project_readiness_node_policy_v1 from public, anon, authenticated;
grant select on table app_private.project_readiness_node_policy_v1 to service_role;

insert into app_private.project_readiness_node_policy_v1
(blueprint_id, blueprint_version, node_id, quality_role, quality_scope, testability_mode, notes)
select
  nd.blueprint_id,
  nd.blueprint_version,
  nd.node_id,
  case
    when nd.node_id in ('SV.D15.PRIVACY_SECURITY','SV.D15.ACCESSIBILITY_TARGET','SV.D15.PERFORMANCE_RELIABILITY') then 'QUALITY_REQUIREMENT'
    when nd.node_id='SV.D15.EXPERT_SIGNOFF' then 'QUALITY_AUTHORITY'
    else 'NONE'
  end,
  case
    when nd.node_id in ('SV.D15.PRIVACY_SECURITY','SV.D15.ACCESSIBILITY_TARGET','SV.D15.PERFORMANCE_RELIABILITY','SV.D15.EXPERT_SIGNOFF') then 'PROJECT_OVERLAY'
    else 'CLOSURE_ONLY'
  end,
  case
    when nd.node_id='SV.D06.APPROVED_BASELINE' then 'DETERMINISTIC_STATE'
    when nd.node_id in ('SV.D14.DELIVERY_APPROACH','SV.D15.ACCESSIBILITY_TARGET','SV.D16.IMPLEMENTATION_DISCRETION','SV.D16.READY_APPROVAL') then 'AUTHORITY_DECISION'
    when nd.node_id='SV.D15.EXPERT_SIGNOFF' then 'EXPERT_SIGNOFF'
    when nd.node_id in ('SV.D16.SOURCE_OF_TRUTH_MANIFEST','SV.D16.DEVELOPER_AMBIGUITY_AUDIT') then 'DETERMINISTIC_STATE'
    else 'ACCEPTANCE_RULE'
  end,
  'Canonical readiness bridge policy for SITE_VITRINE@1.0-bridge-r7'
from app_private.project_node_definitions_v1 nd
where nd.blueprint_id='SITE_VITRINE' and nd.blueprint_version='1.0-bridge-r7'
on conflict (blueprint_id, blueprint_version, node_id) do update
set quality_role=excluded.quality_role,
    quality_scope=excluded.quality_scope,
    testability_mode=excluded.testability_mode,
    notes=excluded.notes;

create or replace function public.get_project_delivery_lot_quality_testability_v1(p_lot_id uuid)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with lot as (
    select dl.* from app_private.project_delivery_lots_v1 dl where dl.id=p_lot_id
  ),
  roots as (
    select array_agg(n.node_id order by n.node_id)::text[] as node_ids
    from app_private.project_delivery_lot_nodes_v1 n where n.lot_id=p_lot_id
  ),
  structural as (
    select app_private.get_blueprint_dependency_closure_v1(
      l.blueprint_id,l.blueprint_version,coalesce(r.node_ids,array[]::text[])
    ) as payload
    from lot l cross join roots r
  ),
  closure_nodes as (
    select jsonb_array_elements_text(s.payload->'closure_node_ids') as node_id from structural s
  ),
  quality_nodes as (
    select nd.node_id,nd.legacy_requirement_id,nd.title,nd.rfd_criticality,p.quality_role,
           prs.id is not null as state_present,
           case when prs.id is null then 'UNRESOLVED' when prs.applicable then 'APPLICABLE' else 'NOT_APPLICABLE' end as applicability_state,
           prs.resolution_level,prs.state as legacy_state,prs.blocker_status,prs.authority_type,prs.accepted_by,
           case when nd.legacy_requirement_id is null then false
                else app_private.project_requirement_satisfied_v1(l.project_definition_id,nd.legacy_requirement_id)
           end as requirement_satisfied
    from lot l
    join app_private.project_node_definitions_v1 nd
      on nd.blueprint_id=l.blueprint_id and nd.blueprint_version=l.blueprint_version
    join app_private.project_readiness_node_policy_v1 p
      on p.blueprint_id=nd.blueprint_id and p.blueprint_version=nd.blueprint_version and p.node_id=nd.node_id
    left join public.project_definition_requirement_states prs
      on prs.project_definition_id=l.project_definition_id and prs.requirement_id=nd.legacy_requirement_id
    where p.quality_role <> 'NONE'
      and (p.quality_scope='PROJECT_OVERLAY' or exists(select 1 from closure_nodes c where c.node_id=nd.node_id))
  ),
  test_nodes as (
    select nd.node_id,nd.legacy_requirement_id,nd.title,nd.rfd_criticality,p.testability_mode,
           prs.id is not null as state_present,
           case when prs.id is null then 'UNRESOLVED' when prs.applicable then 'APPLICABLE' else 'NOT_APPLICABLE' end as applicability_state,
           prs.resolution_level,prs.state as legacy_state,prs.blocker_status,prs.acceptance_rule,prs.verify_result,
           prs.authority_type,prs.accepted_by,
           case when nd.legacy_requirement_id is null then false
                else app_private.project_requirement_satisfied_v1(l.project_definition_id,nd.legacy_requirement_id)
           end as requirement_satisfied,
           case
             when prs.id is null then false
             when not prs.applicable then app_private.project_requirement_satisfied_v1(l.project_definition_id,nd.legacy_requirement_id)
             when p.testability_mode='NONE' then true
             when p.testability_mode='ACCEPTANCE_RULE' then jsonb_typeof(prs.acceptance_rule)='object' and prs.acceptance_rule <> '{}'::jsonb
             when p.testability_mode='DETERMINISTIC_STATE' then app_private.project_requirement_satisfied_v1(l.project_definition_id,nd.legacy_requirement_id)
             when p.testability_mode='AUTHORITY_DECISION' then
               app_private.project_requirement_satisfied_v1(l.project_definition_id,nd.legacy_requirement_id)
               and prs.authority_type in ('HUMAN','EXPERT') and prs.accepted_by is not null
             when p.testability_mode='EXPERT_SIGNOFF' then
               app_private.project_requirement_satisfied_v1(l.project_definition_id,nd.legacy_requirement_id)
               and prs.authority_type='EXPERT' and prs.accepted_by is not null
             else false
           end as testability_ready
    from lot l
    join closure_nodes c on true
    join app_private.project_node_definitions_v1 nd
      on nd.blueprint_id=l.blueprint_id and nd.blueprint_version=l.blueprint_version and nd.node_id=c.node_id
    join app_private.project_readiness_node_policy_v1 p
      on p.blueprint_id=nd.blueprint_id and p.blueprint_version=nd.blueprint_version and p.node_id=nd.node_id
    left join public.project_definition_requirement_states prs
      on prs.project_definition_id=l.project_definition_id and prs.requirement_id=nd.legacy_requirement_id
    where nd.rfd_criticality in ('BLOCKING','REQUIRED')
  ),
  qdiag as (
    select
      count(*)::int as quality_node_count,
      count(*) filter (where applicability_state='APPLICABLE')::int as applicable_quality_node_count,
      count(*) filter (
        where applicability_state='APPLICABLE'
          and (not state_present or legacy_state<>'current' or blocker_status='OPEN' or not requirement_satisfied)
      )::int as unresolved_quality_count,
      count(*) filter (
        where quality_role='QUALITY_AUTHORITY' and applicability_state='APPLICABLE'
          and (authority_type<>'EXPERT' or accepted_by is null or not requirement_satisfied)
      )::int as unresolved_quality_authority_count
    from quality_nodes
  ),
  tdiag as (
    select
      count(*)::int as testability_node_count,
      count(*) filter (where applicability_state='APPLICABLE')::int as applicable_testability_node_count,
      count(*) filter (where applicability_state='APPLICABLE' and not testability_ready)::int as untestable_node_count,
      count(*) filter (
        where applicability_state='APPLICABLE' and testability_mode='ACCEPTANCE_RULE'
          and (acceptance_rule is null or acceptance_rule='{}'::jsonb)
      )::int as missing_acceptance_rule_count
    from test_nodes
  )
  select jsonb_build_object(
    'schema_version','1.0',
    'lot_id',l.id,
    'quality',jsonb_build_object(
      'predicate','QUALITY_REQUIREMENTS_DEFINED',
      'status',case when q.unresolved_quality_count=0 and q.unresolved_quality_authority_count=0 then 'PASS' else 'FAIL' end,
      'quality_node_count',q.quality_node_count,
      'applicable_quality_node_count',q.applicable_quality_node_count,
      'unresolved_quality_count',q.unresolved_quality_count,
      'unresolved_quality_authority_count',q.unresolved_quality_authority_count,
      'nodes',coalesce((select jsonb_agg(jsonb_build_object(
        'node_id',node_id,'legacy_requirement_id',legacy_requirement_id,'title',title,
        'quality_role',quality_role,'rfd_criticality',rfd_criticality,
        'state_present',state_present,'applicability_state',applicability_state,
        'resolution_level',resolution_level,'legacy_state',legacy_state,'blocker_status',blocker_status,
        'authority_type',authority_type,'accepted_by',accepted_by,'requirement_satisfied',requirement_satisfied
      ) order by node_id) from quality_nodes),'[]'::jsonb)
    ),
    'testability',jsonb_build_object(
      'predicate','TESTABILITY_READY',
      'status',case
        when s.payload->>'structural_status'='CLOSED'
         and t.untestable_node_count=0
         and t.missing_acceptance_rule_count=0
        then 'PASS' else 'FAIL' end,
      'testability_node_count',t.testability_node_count,
      'applicable_testability_node_count',t.applicable_testability_node_count,
      'untestable_node_count',t.untestable_node_count,
      'missing_acceptance_rule_count',t.missing_acceptance_rule_count,
      'acceptance_rule_semantics','NON_EMPTY_STRUCTURED_RULE_OR_EXPLICIT_DETERMINISTIC_AUTHORITY_MODE',
      'nodes',coalesce((select jsonb_agg(jsonb_build_object(
        'node_id',node_id,'legacy_requirement_id',legacy_requirement_id,'title',title,
        'rfd_criticality',rfd_criticality,'testability_mode',testability_mode,
        'state_present',state_present,'applicability_state',applicability_state,
        'resolution_level',resolution_level,'legacy_state',legacy_state,'blocker_status',blocker_status,
        'requirement_satisfied',requirement_satisfied,'testability_ready',testability_ready,
        'acceptance_rule',acceptance_rule,'verify_result',verify_result
      ) order by node_id) from test_nodes),'[]'::jsonb)
    )
  )
  from lot l cross join structural s cross join qdiag q cross join tdiag t;
$$;

revoke all on function public.get_project_delivery_lot_quality_testability_v1(uuid) from public, anon, authenticated;
grant execute on function public.get_project_delivery_lot_quality_testability_v1(uuid) to service_role;
