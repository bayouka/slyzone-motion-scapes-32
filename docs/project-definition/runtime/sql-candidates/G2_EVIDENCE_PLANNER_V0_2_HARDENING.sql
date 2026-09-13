-- 4b4c / 2b2c — G2 Evidence / Market planner hardening V0.2
-- Date: 2026-09-13
-- STATUS: COMPILE/ROLLBACK CANDIDATE ONLY — DO NOT APPLY AS A MIGRATION.
-- Applies after G2_EVIDENCE_PLANNER_V0_1.sql in rollback tests.
-- Replaces path eligibility + planner only. No G2 runtime activation.

-- -----------------------------------------------------------------------------
-- 1. Path/input eligibility
-- -----------------------------------------------------------------------------

create or replace function app_private.idea_g2_path_has_input_v1(
  p_idea_id uuid,
  p_path text,
  p_requirement_id text
) returns boolean
language sql
stable
security definer
set search_path=''
as $function$
  select case p_path
    when 'MEM' then exists(
      select 1 from public.idea_information_items ii
      where ii.idea_id=p_idea_id and ii.state='ACTIVE'
    )
    when 'RAW' then exists(
      select 1 from public.idea_sources s
      where s.idea_id=p_idea_id and s.source_kind='human_raw'
        and s.status in ('registered','ingested')
    )
    when 'SRC' then exists(
      select 1 from public.idea_sources s
      where s.idea_id=p_idea_id and s.source_kind<>'human_raw'
        and s.status in ('registered','ingested')
    )
    when 'AUDIT' then exists(
      select 1 from public.idea_sources s
      where s.idea_id=p_idea_id
        and s.source_kind in ('url','document','image','system_observation')
        and s.status in ('registered','ingested')
    )
    -- CONN/WEB are external capabilities. The adapter's available_paths is the capability guard.
    when 'CONN' then true
    when 'WEB' then true
    -- CALC/AI_H/AI_R input validity is governed primarily by Requirement dependencies/fingerprints.
    when 'CALC' then true
    when 'AI_H' then true
    when 'AI_R' then true
    else false
  end
$function$;

revoke all on function app_private.idea_g2_path_has_input_v1(uuid,text,text)
from public,anon,authenticated;

-- -----------------------------------------------------------------------------
-- 2. Hardened planner candidate
-- -----------------------------------------------------------------------------

create or replace function public.plan_idea_evidence_context_candidate_v2(
  p_idea_id uuid,
  p_expected_engine_revision bigint,
  p_available_paths text[]
) returns jsonb
language plpgsql
security definer
set search_path=''
as $function$
declare
  v_idea public.ideas;
  v_policy record;
  v_req public.idea_requirement_states;
  v_materiality jsonb;
  v_competitor_material boolean;
  v_dependency_ready boolean;
  v_satisfied boolean;
  v_used_unknown boolean := false;
  v_path text;
  v_next_path text;
  v_action_type text;
  v_missing jsonb := '[]'::jsonb;
  v_dependency_blocked jsonb := '[]'::jsonb;
  v_actions jsonb := '[]'::jsonb;
  v_fps jsonb := '{}'::jsonb;
  v_gate_status text := 'READY';
  v_projection_fp text;
  v_critical_conflict boolean;
  v_allowed_auto constant text[] := array['MEM','RAW','SRC','AUDIT','CONN','WEB','CALC','AI_H','AI_R']::text[];
begin
  if p_available_paths is null then p_available_paths:=array[]::text[]; end if;
  if exists(select 1 from unnest(p_available_paths) p where not (p=any(v_allowed_auto)))
    then raise exception 'INVALID_AVAILABLE_PATH';
  end if;

  select * into v_idea from public.ideas where id=p_idea_id;
  if v_idea.id is null then raise exception 'IDEA_NOT_FOUND'; end if;
  if v_idea.engine_revision<>p_expected_engine_revision then raise exception 'STALE_ENGINE'; end if;
  if v_idea.blueprint_id<>'SITE_VITRINE' or v_idea.blueprint_status<>'active'
    then raise exception 'G2_BLUEPRINT_NOT_ACTIVE';
  end if;

  v_materiality:=app_private.idea_g2_competitive_materiality_v1(p_idea_id);
  v_competitor_material:=coalesce((v_materiality->>'competitive_evidence_material')::boolean,true);
  v_critical_conflict:=app_private.idea_g2_has_material_market_conflict_v1(p_idea_id);

  for v_policy in select * from app_private.idea_g2_policy_v1() order by ordinal loop
    if v_policy.requirement_id='SV.D05.COMPETITOR_SET' and not v_competitor_material then
      continue;
    end if;

    v_req:=null;
    select * into v_req
    from public.idea_requirement_states
    where idea_id=p_idea_id and requirement_id=v_policy.requirement_id;

    if v_policy.requirement_id='SV.D04.EXISTING_AUDIT'
       and (v_req.idea_id is null or v_req.applicability_state<>'ACTIVE') then
      continue;
    end if;

    if v_req.idea_id is null then
      v_missing:=v_missing||jsonb_build_array(jsonb_build_object(
        'requirement_id',v_policy.requirement_id,
        'status','STATE_MISSING',
        'criticality',v_policy.criticality
      ));
      if v_policy.criticality in ('REQUIRED','BLOCKING') then v_gate_status:='NOT_READY'; end if;
      continue;
    end if;

    v_fps:=v_fps||jsonb_build_object(v_policy.requirement_id,v_req.input_fingerprint);

    v_satisfied:=false;
    if v_req.applicability_state='NOT_RELEVANT' or v_req.resolution_state='NOT_RELEVANT' then
      v_satisfied:=true;
    elsif v_req.resolution_state='ACCEPTED_UNKNOWN' then
      v_satisfied:=v_policy.criticality<>'BLOCKING';
      v_used_unknown:=v_used_unknown or v_satisfied;
    elsif v_req.resolution_state='RESOLVED' and v_req.authority_ok then
      v_satisfied:=v_req.resolution_levels && v_policy.accepted_levels;
    end if;

    if v_satisfied then continue; end if;

    v_missing:=v_missing||jsonb_build_array(jsonb_build_object(
      'requirement_id',v_policy.requirement_id,
      'status',v_req.resolution_state,
      'criticality',v_policy.criticality
    ));
    if v_policy.criticality in ('REQUIRED','BLOCKING') then v_gate_status:='NOT_READY'; end if;

    v_dependency_ready:=app_private.idea_g2_dependency_ready_v1(
      p_idea_id,v_policy.requirement_id,v_competitor_material
    );
    if not v_dependency_ready then
      v_dependency_blocked:=v_dependency_blocked||jsonb_build_array(jsonb_build_object(
        'requirement_id',v_policy.requirement_id,
        'reason','DEPENDENCY_NOT_READY'
      ));
      continue;
    end if;

    v_next_path:=null;
    foreach v_path in array v_policy.preferred_paths loop
      if v_path=any(v_allowed_auto)
         and v_path=any(p_available_paths)
         and app_private.idea_g2_path_has_input_v1(p_idea_id,v_path,v_policy.requirement_id)
      then
        if not exists(
          select 1 from public.idea_action_runs ar
          where ar.idea_id=p_idea_id
            and ar.acquisition_path=v_path
            and ar.status in ('queued','running','succeeded')
            and ar.target_requirement_fingerprints->>v_policy.requirement_id=v_req.input_fingerprint
        ) then
          v_next_path:=v_path;
          exit;
        end if;
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
        else null end;
      v_actions:=v_actions||jsonb_build_array(jsonb_build_object(
        'action_type',v_action_type,
        'acquisition_path',v_next_path,
        'requirement_id',v_policy.requirement_id,
        'target_fingerprint',v_req.input_fingerprint
      ));
    end if;
  end loop;

  if v_critical_conflict then v_gate_status:='NOT_READY'; end if;
  if v_gate_status='READY' and v_used_unknown then v_gate_status:='READY_WITH_ACCEPTED_UNKNOWNS'; end if;

  v_projection_fp:=md5(jsonb_build_object(
    'idea_id',p_idea_id,
    'engine_revision',v_idea.engine_revision,
    'competitive_materiality',v_materiality,
    'requirement_fingerprints',v_fps,
    'missing',v_missing,
    'dependency_blocked',v_dependency_blocked,
    'critical_conflict',v_critical_conflict,
    'used_unknown',v_used_unknown
  )::text);

  return jsonb_build_object(
    'gate_id','G2_EVIDENCE_CONTEXT_SUFFICIENT',
    'gate_status',v_gate_status,
    'projection_fingerprint',v_projection_fp,
    'competitive_evidence_material',v_competitor_material,
    'competitive_evidence_reason',v_materiality->>'reason',
    'missing_requirements',v_missing,
    'dependency_blocked_requirements',v_dependency_blocked,
    'eligible_system_actions',v_actions,
    'dominant_user_action',null,
    'material_market_conflict',v_critical_conflict,
    'used_accepted_unknown',v_used_unknown
  );
end;
$function$;

revoke all on function public.plan_idea_evidence_context_candidate_v2(uuid,bigint,text[])
from public,anon,authenticated;
grant execute on function public.plan_idea_evidence_context_candidate_v2(uuid,bigint,text[])
to service_role;

-- V0.2 invariants:
-- - RAW/SRC/AUDIT are never planned without corresponding canonical source input;
-- - WEB/CONN availability comes from server-derived available_paths, not browser choice;
-- - ACCEPTED_UNKNOWN may satisfy non-blocking G2 Requirements only;
-- - RESEARCH_SUFFICIENCY remains BLOCKING and cannot pass as unknown;
-- - no generic human research fallback is emitted.
