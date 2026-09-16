-- Project Master Blueprint V1 — complete the G4 RFD predicate set to match the canonical 11-predicate contract.
-- Applied live first via Supabase migration 20260916165026.
-- Bridges legacy R7 project-level gates G8-G11 into four canonical project readiness predicates,
-- then composes them with the seven native RFD predicates.

create or replace function app_private.get_project_readiness_predicates_v1(p_project_definition_id uuid)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with pd as (
    select id, definition_revision
    from public.project_definitions
    where id=p_project_definition_id and status<>'superseded'
  ),
  evaluated as (
    select
      pd.id,
      pd.definition_revision,
      app_private.project_definition_state_fingerprint_v1(pd.id) as state_fingerprint,
      app_private.project_gate_ready_v1(pd.id,'G8_PROJECT_PRODUCT_DEFINITION_STABLE') as product_ready,
      app_private.project_gate_ready_v1(pd.id,'G9_PROJECT_EXPERIENCE_DEFINITION_STABLE') as experience_ready,
      app_private.project_gate_ready_v1(pd.id,'G10_PROJECT_TECH_NFR_STABLE') as tech_ready,
      app_private.project_gate_ready_v1(pd.id,'G11_TRACEABILITY_AND_ACCEPTANCE_READY') as traceability_ready
    from pd
  )
  select jsonb_build_object(
    'schema_version','1.0',
    'project_definition_id',id,
    'definition_revision',definition_revision,
    'source','R7_PROJECT_GATE_BRIDGE',
    'source_state_fingerprint',state_fingerprint,
    'predicates',jsonb_build_object(
      'PROJECT_PRODUCT_READY',case when product_ready then 'PASS' else 'FAIL' end,
      'PROJECT_EXPERIENCE_READY',case when experience_ready then 'PASS' else 'FAIL' end,
      'PROJECT_TECH_READY',case when tech_ready then 'PASS' else 'FAIL' end,
      'TRACEABILITY_READY',case when traceability_ready then 'PASS' else 'FAIL' end
    ),
    'source_gates',jsonb_build_object(
      'G8_PROJECT_PRODUCT_DEFINITION_STABLE',case when product_ready then 'READY' else 'NOT_READY' end,
      'G9_PROJECT_EXPERIENCE_DEFINITION_STABLE',case when experience_ready then 'READY' else 'NOT_READY' end,
      'G10_PROJECT_TECH_NFR_STABLE',case when tech_ready then 'READY' else 'NOT_READY' end,
      'G11_TRACEABILITY_AND_ACCEPTANCE_READY',case when traceability_ready then 'READY' else 'NOT_READY' end
    ),
    'status',case when product_ready and experience_ready and tech_ready and traceability_ready then 'PASS' else 'FAIL' end,
    'readiness_fingerprint',md5(jsonb_build_object(
      'project_definition_id',id,
      'definition_revision',definition_revision,
      'state_fingerprint',state_fingerprint,
      'product_ready',product_ready,
      'experience_ready',experience_ready,
      'tech_ready',tech_ready,
      'traceability_ready',traceability_ready
    )::text)
  )
  from evaluated;
$$;

revoke all on function app_private.get_project_readiness_predicates_v1(uuid) from public, anon, authenticated;
grant execute on function app_private.get_project_readiness_predicates_v1(uuid) to service_role;

create or replace function app_private.get_project_delivery_lot_prebaseline_readiness_v1(p_lot_id uuid)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with lot as (
    select dl.id,dl.project_definition_id,dl.lot_key,dl.blueprint_id,dl.blueprint_version,pd.definition_revision
    from app_private.project_delivery_lots_v1 dl
    join public.project_definitions pd on pd.id=dl.project_definition_id
    where dl.id=p_lot_id
  ),
  project_ready as (
    select app_private.get_project_readiness_predicates_v1(l.project_definition_id) as payload
    from lot l
  ),
  closure as (
    select public.get_project_delivery_lot_dependency_closure_v1(p_lot_id) as payload
  ),
  qt as (
    select public.get_project_delivery_lot_quality_testability_v1(p_lot_id) as payload
  ),
  combined as (
    select l.*,
      p.payload as project_readiness_payload,
      c.payload as closure_payload,
      q.payload as quality_testability_payload,
      p.payload#>>'{predicates,PROJECT_PRODUCT_READY}' as product_status,
      p.payload#>>'{predicates,PROJECT_EXPERIENCE_READY}' as experience_status,
      p.payload#>>'{predicates,PROJECT_TECH_READY}' as tech_status,
      p.payload#>>'{predicates,TRACEABILITY_READY}' as traceability_status,
      c.payload#>>'{diagnostics,dependency_closure_predicate}' as dependency_status,
      c.payload#>>'{diagnostics,critical_tbd_closure_predicate}' as critical_tbd_status,
      c.payload#>>'{diagnostics,ownership_closure_predicate}' as ownership_status,
      q.payload#>>'{quality,status}' as quality_status,
      q.payload#>>'{testability,status}' as testability_status
    from lot l cross join project_ready p cross join closure c cross join qt q
  )
  select jsonb_build_object(
    'schema_version','1.1',
    'lot_id',id,
    'project_definition_id',project_definition_id,
    'definition_revision',definition_revision,
    'predicates',jsonb_build_object(
      'PROJECT_PRODUCT_READY',product_status,
      'PROJECT_EXPERIENCE_READY',experience_status,
      'PROJECT_TECH_READY',tech_status,
      'TRACEABILITY_READY',traceability_status,
      'DEPENDENCY_CLOSURE',dependency_status,
      'CRITICAL_TBD_CLOSURE',critical_tbd_status,
      'OWNERSHIP_CLOSURE',ownership_status,
      'QUALITY_REQUIREMENTS_DEFINED',quality_status,
      'TESTABILITY_READY',testability_status
    ),
    'status',case
      when product_status='PASS'
       and experience_status='PASS'
       and tech_status='PASS'
       and traceability_status='PASS'
       and dependency_status='PASS'
       and critical_tbd_status='PASS'
       and ownership_status='PASS'
       and quality_status='PASS'
       and testability_status='PASS'
      then 'PASS' else 'FAIL' end,
    'readiness_fingerprint',md5(jsonb_build_object(
      'lot_id',id,
      'project_definition_id',project_definition_id,
      'definition_revision',definition_revision,
      'project_readiness',project_readiness_payload,
      'closure',closure_payload,
      'quality_testability',quality_testability_payload
    )::text),
    'project_readiness',project_readiness_payload,
    'closure',closure_payload,
    'quality_testability',quality_testability_payload
  )
  from combined;
$$;

revoke all on function app_private.get_project_delivery_lot_prebaseline_readiness_v1(uuid) from public, anon, authenticated;
grant execute on function app_private.get_project_delivery_lot_prebaseline_readiness_v1(uuid) to service_role;

create or replace function public.get_project_delivery_lot_rfd_readiness_v1(p_lot_id uuid)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with lot as (
    select dl.*,pd.definition_revision
    from app_private.project_delivery_lots_v1 dl
    join public.project_definitions pd on pd.id=dl.project_definition_id
    where dl.id=p_lot_id
  ),
  pre as (
    select app_private.get_project_delivery_lot_prebaseline_readiness_v1(p_lot_id) as payload
  ),
  bh as (
    select public.get_project_delivery_lot_baseline_handoff_readiness_v1(p_lot_id) as payload
  )
  select jsonb_build_object(
    'schema_version','1.1',
    'formal_gate','G4_RFD_LOT',
    'lot_id',l.id,
    'project_definition_id',l.project_definition_id,
    'definition_revision',l.definition_revision,
    'lot_status',l.status,
    'predicates',(pre.payload->'predicates') || jsonb_build_object(
      'BASELINE_READY',bh.payload->>'BASELINE_READY',
      'HANDOFF_INTEGRITY',bh.payload->>'HANDOFF_INTEGRITY'
    ),
    'ready_for_authorization',
      pre.payload->>'status'='PASS'
      and bh.payload->>'BASELINE_READY'='PASS'
      and bh.payload->>'HANDOFF_INTEGRITY'='PASS'
      and l.status in ('ACTIVE','FROZEN'),
    'evaluation_fingerprint',md5(jsonb_build_object(
      'lot_id',l.id,
      'project_definition_id',l.project_definition_id,
      'definition_revision',l.definition_revision,
      'lot_status',l.status,
      'prebaseline',pre.payload,
      'baseline_handoff',bh.payload
    )::text),
    'diagnostics',jsonb_build_object(
      'project_readiness',pre.payload->'project_readiness',
      'closure',pre.payload->'closure',
      'quality_testability',pre.payload->'quality_testability',
      'prebaseline',pre.payload,
      'baseline_handoff',bh.payload
    )
  )
  from lot l cross join pre cross join bh;
$$;

revoke all on function public.get_project_delivery_lot_rfd_readiness_v1(uuid) from public, anon, authenticated;
grant execute on function public.get_project_delivery_lot_rfd_readiness_v1(uuid) to service_role;
