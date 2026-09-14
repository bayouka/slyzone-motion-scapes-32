-- 4b4c / 2b2c — G2 Evidence Planner V0.10 — resolution-safe paths
-- Date: 2026-09-15
-- STATUS: COMPILE/ROLLBACK CANDIDATE ONLY — DO NOT APPLY AS A MIGRATION.
-- Requires: G0 resolver V0.4 + G2 final helpers + recompute V0.6
--           + G2_RESOLUTION_PATH_POLICY_V0_1.sql.

create or replace function public.plan_idea_evidence_context_candidate_v10(
  p_idea_id uuid,
  p_expected_engine_revision bigint,
  p_available_paths text[],
  p_raw_context_available boolean default true
) returns jsonb
language plpgsql
security definer
set search_path=''
as $function$
declare
  v_idea public.ideas;
  v_context_plan jsonb;
  v_recompute jsonb;
  v_policy record;
  v_req public.idea_requirement_states;
  v_competitor_material boolean;
  v_dependency_ready boolean;
  v_satisfied boolean;
  v_used_unknown boolean:=false;
  v_path text;
  v_next_path text;
  v_action_type text;
  v_missing jsonb:='[]'::jsonb;
  v_dependency_blocked jsonb:='[]'::jsonb;
  v_actions jsonb:='[]'::jsonb;
  v_inflight jsonb:='[]'::jsonb;
  v_exhausted jsonb:='[]'::jsonb;
  v_capability_blocked jsonb:='[]'::jsonb;
  v_supportive jsonb:='[]'::jsonb;
  v_fps jsonb:='{}'::jsonb;
  v_gate_status text:='READY';
  v_projection_fp text;
  v_critical_conflict boolean;
  v_has_fresh_inflight boolean;
  v_path_already_promoted boolean;
  v_resolving_available_count integer;
  v_resolving_exhausted_count integer;
  v_allowed_auto constant text[]:=array[
    'MEM','RAW','SRC','AUDIT','CONN','WEB','CALC','AI_H','AI_R'
  ]::text[];
begin
  if p_available_paths is null then p_available_paths:=array[]::text[]; end if;
  if exists(select 1 from unnest(p_available_paths) p where not (p=any(v_allowed_auto)))
    then raise exception 'INVALID_AVAILABLE_PATH';
  end if;

  select * into v_idea from public.ideas where id=p_idea_id;
  if v_idea.id is null then raise exception 'IDEA_NOT_FOUND'; end if;
  if v_idea.engine_revision<>p_expected_engine_revision then raise exception 'STALE_ENGINE'; end if;
  if v_idea.blueprint_id<>'SITE_VITRINE'
     or v_idea.blueprint_version<>'0.5'
     or v_idea.blueprint_status<>'active'
    then raise exception 'G2_BLUEPRINT_0_5_NOT_ACTIVE';
  end if;

  v_context_plan:=public.plan_idea_creation_redesign_candidate_v4(
    p_idea_id,p_expected_engine_revision,p_raw_context_available
  );
  if coalesce(v_context_plan->>'status','')<>'RESOLVED' then
    return jsonb_build_object(
      'gate_id','G2_EVIDENCE_CONTEXT_SUFFICIENT',
      'gate_status','NOT_READY',
      'context_prerequisite',jsonb_build_object(
        'requirement_id','SV.D04.CREATION_OR_REDESIGN',
        'status',v_context_plan->>'status'
      ),
      'eligible_system_actions',case
        when v_context_plan->'eligible_system_action' is null
          or v_context_plan->'eligible_system_action'='null'::jsonb
        then '[]'::jsonb
        else jsonb_build_array(v_context_plan->'eligible_system_action')
      end,
      'inflight_requirements','[]'::jsonb,
      'dominant_user_action',v_context_plan->'dominant_user_action',
      'missing_requirements',jsonb_build_array(jsonb_build_object(
        'requirement_id','SV.D04.CREATION_OR_REDESIGN',
        'status',coalesce(v_context_plan->>'status','UNRESOLVED'),
        'criticality','CONTEXT_PREREQUISITE'
      )),
      'dependency_blocked_requirements','[]'::jsonb,
      'capability_blocked_requirements','[]'::jsonb,
      'exhausted_resolution_paths','[]'::jsonb
    );
  end if;

  v_recompute:=public.recompute_idea_evidence_context_candidate_v6(
    p_idea_id,p_expected_engine_revision
  );
  if coalesce((v_recompute->>'context_ready')::boolean,false)=false then
    raise exception 'G2_CONTEXT_RECOMPUTE_NOT_READY';
  end if;

  v_competitor_material:=coalesce(
    (v_recompute->'competitive_materiality'->>'competitive_evidence_material')::boolean,
    true
  );
  v_critical_conflict:=app_private.idea_g2_has_material_market_conflict_v1(p_idea_id);

  for v_policy in select * from app_private.idea_g2_policy_v3() order by ordinal loop
    select * into v_req
    from public.idea_requirement_states
    where idea_id=p_idea_id and requirement_id=v_policy.requirement_id;

    if v_req.idea_id is null then
      raise exception 'G2_REQUIREMENT_STATE_MISSING_AFTER_RECOMPUTE';
    end if;

    v_fps:=v_fps||jsonb_build_object(v_policy.requirement_id,v_req.input_fingerprint);

    if v_req.applicability_state='NOT_RELEVANT'
       or v_req.resolution_state='NOT_RELEVANT' then
      continue;
    end if;

    v_satisfied:=false;
    if v_req.resolution_state='ACCEPTED_UNKNOWN' then
      v_satisfied:=v_policy.criticality<>'BLOCKING';
      v_used_unknown:=v_used_unknown or v_satisfied;
    elsif v_req.resolution_state='RESOLVED' and v_req.authority_ok then
      v_satisfied:=v_req.resolution_levels && v_policy.accepted_levels;
    end if;
    if v_satisfied then continue; end if;

    v_missing:=v_missing||jsonb_build_array(jsonb_build_object(
      'requirement_id',v_policy.requirement_id,
      'status',v_req.resolution_state,
      'criticality',v_policy.criticality,
      'basis_fingerprint',v_req.input_fingerprint
    ));

    if v_policy.criticality in ('BLOCKING','REQUIRED','CONDITIONAL') then
      v_gate_status:='NOT_READY';
    end if;

    v_dependency_ready:=app_private.idea_g2_dependency_ready_v3(
      p_idea_id,v_policy.requirement_id,v_competitor_material
    );
    if not v_dependency_ready then
      v_dependency_blocked:=v_dependency_blocked||jsonb_build_array(jsonb_build_object(
        'requirement_id',v_policy.requirement_id,
        'reason','DEPENDENCY_NOT_READY',
        'basis_fingerprint',v_req.input_fingerprint
      ));
      continue;
    end if;

    select exists(
      select 1
      from public.idea_action_runs ar
      where ar.idea_id=p_idea_id
        and ar.target_requirement_fingerprints->>v_policy.requirement_id=v_req.input_fingerprint
        and (
          ar.status in ('queued','running')
          or (ar.status='succeeded' and ar.promoted_at is null)
        )
    ) into v_has_fresh_inflight;

    if v_has_fresh_inflight then
      v_inflight:=v_inflight||jsonb_build_array(jsonb_build_object(
        'requirement_id',v_policy.requirement_id,
        'basis_fingerprint',v_req.input_fingerprint
      ));
      continue;
    end if;

    -- Expose support capabilities for diagnostics/orchestrator context only.
    -- They are deliberately NOT added to eligible_system_actions.
    foreach v_path in array v_policy.supportive_paths loop
      if v_path=any(p_available_paths)
         and app_private.idea_g2_path_has_input_v1(p_idea_id,v_path,v_policy.requirement_id)
      then
        v_supportive:=v_supportive||jsonb_build_array(jsonb_build_object(
          'requirement_id',v_policy.requirement_id,
          'acquisition_path',v_path,
          'role','SUPPORTIVE_ONLY'
        ));
      end if;
    end loop;

    v_next_path:=null;
    v_resolving_available_count:=0;
    v_resolving_exhausted_count:=0;

    foreach v_path in array v_policy.resolving_paths loop
      if not (v_path=any(v_allowed_auto))
         or not (v_path=any(p_available_paths))
         or not app_private.idea_g2_path_has_input_v1(
           p_idea_id,v_path,v_policy.requirement_id
         )
      then
        continue;
      end if;

      -- Defense in depth: even a misconfigured policy cannot schedule a path
      -- whose produced levels do not intersect accepted levels.
      if not app_private.idea_g2_path_can_resolve_v1(v_policy.requirement_id,v_path) then
        continue;
      end if;

      v_resolving_available_count:=v_resolving_available_count+1;

      select exists(
        select 1
        from public.idea_action_runs ar
        where ar.idea_id=p_idea_id
          and ar.acquisition_path=v_path
          and ar.target_requirement_fingerprints->>v_policy.requirement_id=v_req.input_fingerprint
          and ar.status='succeeded'
          and ar.promoted_at is not null
      ) into v_path_already_promoted;

      if v_path_already_promoted then
        v_resolving_exhausted_count:=v_resolving_exhausted_count+1;
        v_exhausted:=v_exhausted||jsonb_build_array(jsonb_build_object(
          'requirement_id',v_policy.requirement_id,
          'acquisition_path',v_path,
          'basis_fingerprint',v_req.input_fingerprint,
          'reason','PROMOTED_WITHOUT_RESOLUTION'
        ));
        continue;
      end if;

      v_next_path:=v_path;
      exit;
    end loop;

    if v_next_path is not null then
      v_action_type:=case v_next_path
        when 'MEM' then 'REUSE_MEMORY'
        when 'RAW' then 'EXTRACT_RAW'
        when 'SRC' then 'EXTRACT_SOURCE'
        when 'AUDIT' then 'AUDIT'
        when 'CONN' then 'FETCH_CONNECTED'
        when 'WEB' then 'RESEARCH_WEB'
        when 'CALC' then 'CALCULATE'
        when 'AI_H' then 'INFER_HYPOTHESIS'
        when 'AI_R' then 'GENERATE_RECOMMENDATION'
        else null
      end;
      v_actions:=v_actions||jsonb_build_array(jsonb_build_object(
        'action_type',v_action_type,
        'acquisition_path',v_next_path,
        'path_role','GATE_SATISFYING',
        'requirement_id',v_policy.requirement_id,
        'target_fingerprint',v_req.input_fingerprint,
        'expected_resolution_levels',app_private.idea_g2_path_produced_levels_v1(v_next_path)
      ));
    elsif v_resolving_available_count>0
          and v_resolving_available_count=v_resolving_exhausted_count then
      v_capability_blocked:=v_capability_blocked||jsonb_build_array(jsonb_build_object(
        'requirement_id',v_policy.requirement_id,
        'basis_fingerprint',v_req.input_fingerprint,
        'reason','RESOLUTION_PATHS_EXHAUSTED_ON_CURRENT_BASIS'
      ));
    end if;
  end loop;

  if v_critical_conflict then v_gate_status:='NOT_READY'; end if;
  if v_gate_status='READY' and v_used_unknown then
    v_gate_status:='READY_WITH_ACCEPTED_UNKNOWNS';
  end if;

  v_projection_fp:=md5(jsonb_build_object(
    'idea_id',p_idea_id,
    'engine_revision',v_idea.engine_revision,
    'context_fingerprint',(
      select input_fingerprint
      from public.idea_requirement_states
      where idea_id=p_idea_id and requirement_id='SV.D04.CREATION_OR_REDESIGN'
    ),
    'g2_basis_fingerprints',v_fps,
    'g2_resolution_signatures',v_recompute->'requirement_resolution_signatures',
    'competitive_materiality',v_recompute->'competitive_materiality',
    'missing',v_missing,
    'dependency_blocked',v_dependency_blocked,
    'inflight',v_inflight,
    'exhausted',v_exhausted,
    'capability_blocked',v_capability_blocked,
    'critical_conflict',v_critical_conflict,
    'used_unknown',v_used_unknown
  )::text);

  return jsonb_build_object(
    'gate_id','G2_EVIDENCE_CONTEXT_SUFFICIENT',
    'gate_status',v_gate_status,
    'projection_fingerprint',v_projection_fp,
    'context_prerequisite',jsonb_build_object(
      'requirement_id','SV.D04.CREATION_OR_REDESIGN','status','RESOLVED',
      'value',v_recompute->>'creation_redesign_value'
    ),
    'is_redesign',v_recompute->'is_redesign',
    'competitive_evidence_material',v_competitor_material,
    'competitive_evidence_reason',v_recompute->'competitive_materiality'->>'reason',
    'missing_requirements',v_missing,
    'dependency_blocked_requirements',v_dependency_blocked,
    'inflight_requirements',v_inflight,
    'eligible_system_actions',v_actions,
    'supportive_capabilities',v_supportive,
    'exhausted_resolution_paths',v_exhausted,
    'capability_blocked_requirements',v_capability_blocked,
    'dominant_user_action',null,
    'material_market_conflict',v_critical_conflict,
    'used_accepted_unknown',v_used_unknown
  );
end;
$function$;

revoke all on function public.plan_idea_evidence_context_candidate_v10(
  uuid,bigint,text[],boolean
) from public,anon,authenticated;
grant execute on function public.plan_idea_evidence_context_candidate_v10(
  uuid,bigint,text[],boolean
) to service_role;

-- V0.10 invariants:
-- - only GATE_SATISFYING/resolving paths enter eligible_system_actions;
-- - supportive paths are metadata only and cannot cause standalone completion loops;
-- - path-produced levels must intersect Requirement accepted levels;
-- - a path promoted on the same Requirement+basis without resolution is exhausted;
-- - an exhausted path is never automatically rerun until the basis changes;
-- - no generic human fallback is introduced;
-- - Blueprint 0.5 remains mandatory and G2 remains candidate-only.
