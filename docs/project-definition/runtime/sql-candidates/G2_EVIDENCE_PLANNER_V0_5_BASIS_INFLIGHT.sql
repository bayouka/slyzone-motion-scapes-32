-- 4b4c / 2b2c — G2 Evidence Planner V0.5 — Basis + Inflight Guard
-- Date: 2026-09-13
-- STATUS: COMPILE/ROLLBACK CANDIDATE ONLY — DO NOT APPLY AS A MIGRATION.
-- Requires: G0 resolver, G2 policy/dependency helpers, recompute V0.2 Basis Fingerprint.

create or replace function public.plan_idea_evidence_context_candidate_v5(
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
  v_fps jsonb:='{}'::jsonb;
  v_gate_status text:='READY';
  v_projection_fp text;
  v_critical_conflict boolean;
  v_has_fresh_inflight boolean;
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

  -- G0 structural context remains the only possible targeted human last-mile.
  v_context_plan:=public.plan_idea_creation_redesign_candidate_v1(
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
      'dependency_blocked_requirements','[]'::jsonb
    );
  end if;

  v_recompute:=public.recompute_idea_evidence_context_candidate_v2(
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

  for v_policy in select * from app_private.idea_g2_policy_v2() order by ordinal loop
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

    v_dependency_ready:=app_private.idea_g2_dependency_ready_v2(
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

    -- A fresh in-flight Action Run blocks all alternative paths for this same
    -- Requirement/basis. A previously promoted succeeded run does NOT block new work.
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

    v_next_path:=null;
    foreach v_path in array v_policy.preferred_paths loop
      if v_path=any(v_allowed_auto)
         and v_path=any(p_available_paths)
         and app_private.idea_g2_path_has_input_v1(
           p_idea_id,v_path,v_policy.requirement_id
         )
      then
        v_next_path:=v_path;
        exit;
      end if;
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
        'requirement_id',v_policy.requirement_id,
        'target_fingerprint',v_req.input_fingerprint
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
    'critical_conflict',v_critical_conflict,
    'used_unknown',v_used_unknown
  )::text);

  return jsonb_build_object(
    'gate_id','G2_EVIDENCE_CONTEXT_SUFFICIENT',
    'gate_status',v_gate_status,
    'projection_fingerprint',v_projection_fp,
    'context_prerequisite',jsonb_build_object(
      'requirement_id','SV.D04.CREATION_OR_REDESIGN','status','RESOLVED'
    ),
    'is_redesign',v_recompute->'is_redesign',
    'competitive_evidence_material',v_competitor_material,
    'competitive_evidence_reason',v_recompute->'competitive_materiality'->>'reason',
    'missing_requirements',v_missing,
    'dependency_blocked_requirements',v_dependency_blocked,
    'inflight_requirements',v_inflight,
    'eligible_system_actions',v_actions,
    'dominant_user_action',null,
    'material_market_conflict',v_critical_conflict,
    'used_accepted_unknown',v_used_unknown
  );
end;
$function$;

revoke all on function public.plan_idea_evidence_context_candidate_v5(
  uuid,bigint,text[],boolean
) from public,anon,authenticated;
grant execute on function public.plan_idea_evidence_context_candidate_v5(
  uuid,bigint,text[],boolean
) to service_role;

-- V0.5 invariants:
-- - recompute V0.2 basis semantics always precede planning;
-- - queued/running/succeeded-unpromoted current-basis work prevents duplicate work;
-- - the guard is requirement+basis scoped, not path scoped;
-- - succeeded+promoted historical runs never suppress newly necessary work;
-- - stale/failed/cancelled runs never suppress new work;
-- - projection fingerprint includes both basis fingerprints and resolution signatures;
-- - business research remains system-first; no generic G2 human fallback.
