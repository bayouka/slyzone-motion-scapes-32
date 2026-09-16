-- 4b4c Project Master Blueprint V1 — canonical runtime bridge read model
-- Applied live first via Supabase migration 20260916153234.
-- Read-only compatibility projection: R7 stays authoritative for legacy runtime semantics.

create or replace function public.get_project_definition_canonical_bridge_v1(p_project_definition_id uuid)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'schema_version', '1.0',
    'bridge_contract', 'PROJECT_DEFINITION_CANONICAL_RUNTIME_BRIDGE@1.0',
    'coverage', jsonb_build_object(
      'requirement_domain_classification', 'FULL_FOR_R7_REQUIREMENT_SET',
      'legacy_readiness_projection', 'PARTIAL',
      'canonical_formal_gates', 'NOT_RUNTIME_COMPLETE',
      'delivery_lots', 'NOT_IMPLEMENTED',
      'dependency_closure', 'NOT_IMPLEMENTED'
    ),
    'project_definition', jsonb_build_object(
      'id', pd.id,
      'idea_id', pd.idea_id,
      'workspace_id', pd.workspace_id,
      'approved_idea_snapshot_id', pd.approved_idea_snapshot_id,
      'approved_decision_record_id', pd.approved_decision_record_id,
      'decision_package_id', pd.decision_package_id,
      'status', pd.status,
      'version', pd.version,
      'definition_revision', pd.definition_revision,
      'created_engine_revision', pd.created_engine_revision,
      'baseline_hash', pd.baseline_hash,
      'context_fingerprint', pd.context_fingerprint,
      'build_ready_snapshot_id', pd.build_ready_snapshot_id,
      'build_ready_hash', pd.build_ready_hash,
      'initialized_at', pd.initialized_at,
      'created_at', pd.created_at,
      'updated_at', pd.updated_at
    ),
    'requirements', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'requirement_id', rs.requirement_id,
          'legacy_domain_id', m.legacy_domain_id,
          'canonical_primary_domain_id', m.canonical_primary_domain_id,
          'canonical_domain_ids', to_jsonb(m.canonical_domain_ids),
          'mapping_version', m.mapping_version,
          'mapping_rationale', m.rationale,
          'applicable', rs.applicable,
          'resolution_level', rs.resolution_level,
          'state', rs.state,
          'lock_state', rs.lock_state,
          'value', rs.value,
          'input_fingerprint', rs.input_fingerprint,
          'context_fingerprint', rs.context_fingerprint,
          'authority_type', rs.authority_type,
          'authority_evidence', rs.authority_evidence,
          'accepted_by', rs.accepted_by,
          'owner_ref', rs.owner_ref,
          'blocker_status', rs.blocker_status,
          'blocker_reason', rs.blocker_reason,
          'acceptance_rule', rs.acceptance_rule,
          'verify_result', rs.verify_result,
          'definition_revision', rs.definition_revision,
          'updated_at', rs.updated_at
        )
        order by rs.requirement_id
      )
      from public.project_definition_requirement_states rs
      join app_private.project_definition_requirement_canonical_map_v1 m
        on m.requirement_id = rs.requirement_id
      where rs.project_definition_id = pd.id
    ), '[]'::jsonb),
    'legacy_readiness_predicates', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'legacy_gate_id', gs.gate_id,
          'canonical_predicate_id', case gs.gate_id
            when 'G8_PROJECT_PRODUCT_DEFINITION_STABLE' then 'PROJECT_PRODUCT_READY'
            when 'G9_PROJECT_EXPERIENCE_DEFINITION_STABLE' then 'PROJECT_EXPERIENCE_READY'
            when 'G10_PROJECT_TECH_NFR_STABLE' then 'PROJECT_TECH_READY'
            when 'G11_TRACEABILITY_AND_ACCEPTANCE_READY' then 'TRACEABILITY_READY'
          end,
          'legacy_status', gs.status,
          'evaluation_fingerprint', gs.evaluation_fingerprint,
          'definition_revision', gs.definition_revision,
          'evaluated_at', gs.evaluated_at,
          'details', gs.details,
          'derived_from_legacy_runtime', true
        )
        order by gs.gate_id
      )
      from public.project_definition_gate_states gs
      where gs.project_definition_id = pd.id
        and gs.gate_id in (
          'G8_PROJECT_PRODUCT_DEFINITION_STABLE',
          'G9_PROJECT_EXPERIENCE_DEFINITION_STABLE',
          'G10_PROJECT_TECH_NFR_STABLE',
          'G11_TRACEABILITY_AND_ACCEPTANCE_READY'
        )
    ), '[]'::jsonb),
    'legacy_rfd_evidence', (
      select case when gs.gate_id is null then null else jsonb_build_object(
        'legacy_gate_id', gs.gate_id,
        'legacy_status', gs.status,
        'evaluation_fingerprint', gs.evaluation_fingerprint,
        'definition_revision', gs.definition_revision,
        'evaluated_at', gs.evaluated_at,
        'details', gs.details,
        'canonical_rfd', false,
        'reason', 'Legacy G12 predates canonical DeliveryLot, DependencyClosure and G4/G5 and is evidence only.'
      ) end
      from public.project_definition_gate_states gs
      where gs.project_definition_id = pd.id
        and gs.gate_id = 'G12_READY_FOR_DEVELOPMENT'
      limit 1
    ),
    'canonical_predicates_not_yet_derivable', jsonb_build_array(
      'QUALITY_REQUIREMENTS_DEFINED',
      'TESTABILITY_READY',
      'DEPENDENCY_CLOSURE',
      'CRITICAL_TBD_CLOSURE',
      'OWNERSHIP_CLOSURE',
      'BASELINE_READY',
      'HANDOFF_INTEGRITY'
    ),
    'canonical_formal_gates_emitted', '[]'::jsonb
  )
  from public.project_definitions pd
  where pd.id = p_project_definition_id;
$$;

revoke all on function public.get_project_definition_canonical_bridge_v1(uuid) from public, anon, authenticated;
grant execute on function public.get_project_definition_canonical_bridge_v1(uuid) to service_role;
