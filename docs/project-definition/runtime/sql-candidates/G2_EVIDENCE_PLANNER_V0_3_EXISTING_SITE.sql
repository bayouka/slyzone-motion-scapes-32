-- 4b4c / 2b2c — G2 Evidence Planner V0.3 Existing Site / Redesign guard
-- Date: 2026-09-13
-- STATUS: COMPILE/ROLLBACK CANDIDATE ONLY — DO NOT APPLY AS A MIGRATION.
-- Applies after G2_EVIDENCE_PLANNER_V0_1 + V0_2 in rollback tests.

-- -----------------------------------------------------------------------------
-- 1. Canonical redesign signal
-- -----------------------------------------------------------------------------

create or replace function app_private.idea_g2_is_redesign_v1(p_idea_id uuid)
returns boolean
language sql
stable
security definer
set search_path=''
as $function$
  select
    exists(
      select 1 from public.idea_requirement_states rs
      where rs.idea_id=p_idea_id
        and rs.requirement_id='SV.D04.EXISTING_SITE'
        and rs.applicability_state='ACTIVE'
        and rs.resolution_state='RESOLVED'
    )
    or exists(
      select 1 from public.idea_information_items ii
      where ii.idea_id=p_idea_id and ii.state='ACTIVE'
        and ii.semantic_key='existing_site'
    )
    or exists(
      select 1 from public.idea_information_items ii
      where ii.idea_id=p_idea_id and ii.state='ACTIVE'
        and ii.semantic_key='creation_or_redesign'
        and lower(coalesce(
          case when jsonb_typeof(ii.value_jsonb)='string' then trim(both '"' from ii.value_jsonb::text) end,
          ii.value_jsonb->>'value',
          ii.value_jsonb->>'mode',
          ''
        ))='redesign'
    )
$function$;

revoke all on function app_private.idea_g2_is_redesign_v1(uuid)
from public,anon,authenticated;

-- -----------------------------------------------------------------------------
-- 2. G2 policy V2 includes EXISTING_SITE to prevent audit deadlock
-- -----------------------------------------------------------------------------

create or replace function app_private.idea_g2_policy_v2()
returns table(
  ordinal integer,
  requirement_id text,
  title text,
  preferred_paths text[],
  accepted_levels text[],
  criticality text,
  conditional_atom boolean
)
language sql
immutable
set search_path=''
as $function$
  values
    (1,'SV.D03.PRIMARY_NEED','Besoin ou job principal',array['RAW','SRC','WEB','CONN','AI_H']::text[],array['WORKING_ASSUMPTION','ACCEPTED_AS_CURRENT','HUMAN_VALIDATED']::text[],'REQUIRED',false),
    (2,'SV.D03.OBJECTIONS_TRUST','Objections et besoins de confiance',array['SRC','WEB','CONN','AI_H']::text[],array['WORKING_ASSUMPTION','SOURCE_BACKED','OBSERVED','ACCEPTED_AS_CURRENT']::text[],'ENHANCER',false),
    (3,'SV.D04.EXISTING_SITE','Site existant',array['RAW','SRC']::text[],array['RAW_HUMAN','SOURCE_BACKED','ACCEPTED_AS_CURRENT']::text[],'REQUIRED',true),
    (4,'SV.D04.EXISTING_AUDIT','Audit de l''existant',array['AUDIT','SRC','CONN','AI_H']::text[],array['OBSERVED']::text[],'REQUIRED',true),
    (5,'SV.D04.EVIDENCE_QUALITY','Qualité et fraîcheur des preuves',array['CALC','AI_H']::text[],array['CALCULATED']::text[],'REQUIRED',false),
    (6,'SV.D05.MARKET_CONTEXT','Terrain de marché pertinent',array['CALC','WEB','AI_H']::text[],array['CALCULATED']::text[],'REQUIRED',false),
    (7,'SV.D05.COMPETITOR_SET','Concurrents, alternatives et références',array['WEB','SRC','AUDIT','AI_H']::text[],array['SOURCE_BACKED']::text[],'CONDITIONAL',true),
    (8,'SV.D05.PATTERN_GAP_SYNTHESIS','Patterns, faiblesses et opportunités',array['AUDIT','AI_H','AI_R']::text[],array['AI_RECOMMENDATION']::text[],'REQUIRED',false),
    (9,'SV.D05.RESEARCH_SUFFICIENCY','Suffisance et arrêt de recherche',array['CALC','AI_H']::text[],array['CALCULATED']::text[],'BLOCKING',false);
$function$;

revoke all on function app_private.idea_g2_policy_v2()
from public,anon,authenticated;

-- -----------------------------------------------------------------------------
-- 3. Materiality V2 derives redesign from canonical signals
-- -----------------------------------------------------------------------------

create or replace function app_private.idea_g2_competitive_materiality_v2(p_idea_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $function$
declare
  v_is_redesign boolean := false;
  v_audit_observed boolean := false;
  v_evidence_quality boolean := false;
  v_explicit_compare boolean := false;
  v_existing_competitor boolean := false;
  v_material_conflict boolean := false;
  v_material boolean := true;
  v_reason text;
begin
  v_is_redesign:=app_private.idea_g2_is_redesign_v1(p_idea_id);
  v_audit_observed:=app_private.idea_requirement_has_level_v1(p_idea_id,'SV.D04.EXISTING_AUDIT','OBSERVED');
  v_evidence_quality:=app_private.idea_requirement_has_level_v1(p_idea_id,'SV.D04.EVIDENCE_QUALITY','CALCULATED');
  v_existing_competitor:=app_private.idea_requirement_has_level_v1(p_idea_id,'SV.D05.COMPETITOR_SET','SOURCE_BACKED');
  v_explicit_compare:=app_private.idea_g2_explicit_market_compare_v1(p_idea_id);
  v_material_conflict:=app_private.idea_g2_has_material_market_conflict_v1(p_idea_id);

  if v_existing_competitor then
    v_material:=true; v_reason:='CURRENT_COMPETITIVE_EVIDENCE_ALREADY_IN_GRAPH';
  elsif v_explicit_compare then
    v_material:=true; v_reason:='EXPLICIT_MARKET_COMPARISON_REQUIRED';
  elsif v_material_conflict then
    v_material:=true; v_reason:='MATERIAL_MARKET_CONFLICT_REQUIRES_TRIANGULATION';
  elsif v_is_redesign and v_audit_observed and v_evidence_quality then
    v_material:=false; v_reason:='CURRENT_AUDIT_BASELINE_SUFFICIENT_FOR_G2';
  else
    v_material:=true; v_reason:='DEFAULT_EXTERNAL_BASELINE_REQUIRED';
  end if;

  return jsonb_build_object(
    'competitive_evidence_material',v_material,
    'reason',v_reason,
    'is_redesign',v_is_redesign,
    'audit_observed',v_audit_observed,
    'evidence_quality_calculated',v_evidence_quality,
    'explicit_market_compare',v_explicit_compare,
    'existing_competitor_source_backed',v_existing_competitor,
    'material_market_conflict',v_material_conflict
  );
end;
$function$;

revoke all on function app_private.idea_g2_competitive_materiality_v2(uuid)
from public,anon,authenticated;

-- -----------------------------------------------------------------------------
-- 4. Dependency V2
-- -----------------------------------------------------------------------------

create or replace function app_private.idea_g2_dependency_ready_v2(
  p_idea_id uuid,
  p_requirement_id text,
  p_competitor_material boolean
) returns boolean
language plpgsql
stable
security definer
set search_path=''
as $function$
declare
  v_is_redesign boolean;
  v_competitor_ready boolean;
  v_audit_ready boolean;
begin
  v_is_redesign:=app_private.idea_g2_is_redesign_v1(p_idea_id);
  v_competitor_ready:=p_competitor_material and app_private.idea_requirement_has_level_v1(
    p_idea_id,'SV.D05.COMPETITOR_SET','SOURCE_BACKED'
  );
  v_audit_ready:=v_is_redesign and app_private.idea_requirement_has_level_v1(
    p_idea_id,'SV.D04.EXISTING_AUDIT','OBSERVED'
  );

  return case p_requirement_id
    when 'SV.D03.PRIMARY_NEED' then exists(
      select 1 from public.idea_requirement_states rs
      where rs.idea_id=p_idea_id and rs.requirement_id='SV.D03.PRIMARY_AUDIENCE'
        and rs.applicability_state='ACTIVE' and rs.resolution_state='RESOLVED'
    )
    when 'SV.D04.EXISTING_SITE' then v_is_redesign
    when 'SV.D04.EXISTING_AUDIT' then app_private.idea_requirement_has_level_v1(
      p_idea_id,'SV.D04.EXISTING_SITE','SOURCE_BACKED'
    ) or app_private.idea_requirement_has_level_v1(
      p_idea_id,'SV.D04.EXISTING_SITE','RAW_HUMAN'
    ) or app_private.idea_requirement_has_level_v1(
      p_idea_id,'SV.D04.EXISTING_SITE','ACCEPTED_AS_CURRENT'
    )
    when 'SV.D05.MARKET_CONTEXT' then
      (select count(*)=3 from public.idea_requirement_states rs
       where rs.idea_id=p_idea_id
         and rs.requirement_id in ('SV.D02.ORG_CONTEXT','SV.D03.PRIMARY_AUDIENCE','SV.D04.OFFER_BASELINE')
         and rs.applicability_state='ACTIVE' and rs.resolution_state='RESOLVED')
    when 'SV.D05.COMPETITOR_SET' then app_private.idea_requirement_has_level_v1(
      p_idea_id,'SV.D05.MARKET_CONTEXT','CALCULATED'
    )
    when 'SV.D05.PATTERN_GAP_SYNTHESIS' then (v_competitor_ready or v_audit_ready)
    when 'SV.D05.RESEARCH_SUFFICIENCY' then
      (app_private.idea_requirement_has_level_v1(p_idea_id,'SV.D05.PATTERN_GAP_SYNTHESIS','AI_RECOMMENDATION') or v_audit_ready)
    else true
  end;
end;
$function$;

revoke all on function app_private.idea_g2_dependency_ready_v2(uuid,text,boolean)
from public,anon,authenticated;

-- -----------------------------------------------------------------------------
-- 5. Planner V3
-- -----------------------------------------------------------------------------

create or replace function public.plan_idea_evidence_context_candidate_v3(
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
  v_is_redesign boolean;
  v_dependency_ready boolean;
  v_satisfied boolean;
  v_used_unknown boolean:=false;
  v_path text;
  v_next_path text;
  v_action_type text;
  v_missing jsonb:='[]'::jsonb;
  v_dependency_blocked jsonb:='[]'::jsonb;
  v_actions jsonb:='[]'::jsonb;
  v_fps jsonb:='{}'::jsonb;
  v_gate_status text:='READY';
  v_projection_fp text;
  v_critical_conflict boolean;
  v_allowed_auto constant text[]:=array['MEM','RAW','SRC','AUDIT','CONN','WEB','CALC','AI_H','AI_R']::text[];
begin
  if p_available_paths is null then p_available_paths:=array[]::text[]; end if;
  if exists(select 1 from unnest(p_available_paths) p where not (p=any(v_allowed_auto)))
    then raise exception 'INVALID_AVAILABLE_PATH';
  end if;

  select * into v_idea from public.ideas where id=p_idea_id;
  if v_idea.id is null then raise exception 'IDEA_NOT_FOUND'; end if;
  if v_idea.engine_revision<>p_expected_engine_revision then raise exception 'STALE_ENGINE'; end if;
  -- Candidate safety: active runtime is still 0.4, so V3 planner only accepts explicit 0.5 fixtures/future activation.
  if v_idea.blueprint_id<>'SITE_VITRINE' or v_idea.blueprint_version<>'0.5' or v_idea.blueprint_status<>'active'
    then raise exception 'G2_BLUEPRINT_0_5_NOT_ACTIVE';
  end if;

  v_is_redesign:=app_private.idea_g2_is_redesign_v1(p_idea_id);
  v_materiality:=app_private.idea_g2_competitive_materiality_v2(p_idea_id);
  v_competitor_material:=coalesce((v_materiality->>'competitive_evidence_material')::boolean,true);
  v_critical_conflict:=app_private.idea_g2_has_material_market_conflict_v1(p_idea_id);

  for v_policy in select * from app_private.idea_g2_policy_v2() order by ordinal loop
    if v_policy.requirement_id in ('SV.D04.EXISTING_SITE','SV.D04.EXISTING_AUDIT') and not v_is_redesign then
      continue;
    end if;
    if v_policy.requirement_id='SV.D05.COMPETITOR_SET' and not v_competitor_material then
      continue;
    end if;

    v_req:=null;
    select * into v_req from public.idea_requirement_states
    where idea_id=p_idea_id and requirement_id=v_policy.requirement_id;

    if v_req.idea_id is null then
      v_missing:=v_missing||jsonb_build_array(jsonb_build_object(
        'requirement_id',v_policy.requirement_id,'status','STATE_MISSING','criticality',v_policy.criticality
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
      'requirement_id',v_policy.requirement_id,'status',v_req.resolution_state,'criticality',v_policy.criticality
    ));
    if v_policy.criticality in ('REQUIRED','BLOCKING') then v_gate_status:='NOT_READY'; end if;

    v_dependency_ready:=app_private.idea_g2_dependency_ready_v2(
      p_idea_id,v_policy.requirement_id,v_competitor_material
    );
    if not v_dependency_ready then
      v_dependency_blocked:=v_dependency_blocked||jsonb_build_array(jsonb_build_object(
        'requirement_id',v_policy.requirement_id,'reason','DEPENDENCY_NOT_READY'
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
          where ar.idea_id=p_idea_id and ar.acquisition_path=v_path
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
        'action_type',v_action_type,'acquisition_path',v_next_path,
        'requirement_id',v_policy.requirement_id,'target_fingerprint',v_req.input_fingerprint
      ));
    end if;
  end loop;

  if v_critical_conflict then v_gate_status:='NOT_READY'; end if;
  if v_gate_status='READY' and v_used_unknown then v_gate_status:='READY_WITH_ACCEPTED_UNKNOWNS'; end if;

  v_projection_fp:=md5(jsonb_build_object(
    'idea_id',p_idea_id,'engine_revision',v_idea.engine_revision,'is_redesign',v_is_redesign,
    'competitive_materiality',v_materiality,'requirement_fingerprints',v_fps,
    'missing',v_missing,'dependency_blocked',v_dependency_blocked,
    'critical_conflict',v_critical_conflict,'used_unknown',v_used_unknown
  )::text);

  return jsonb_build_object(
    'gate_id','G2_EVIDENCE_CONTEXT_SUFFICIENT','gate_status',v_gate_status,
    'projection_fingerprint',v_projection_fp,'is_redesign',v_is_redesign,
    'competitive_evidence_material',v_competitor_material,
    'competitive_evidence_reason',v_materiality->>'reason',
    'missing_requirements',v_missing,'dependency_blocked_requirements',v_dependency_blocked,
    'eligible_system_actions',v_actions,'dominant_user_action',null,
    'material_market_conflict',v_critical_conflict,'used_accepted_unknown',v_used_unknown
  );
end;
$function$;

revoke all on function public.plan_idea_evidence_context_candidate_v3(uuid,bigint,text[])
from public,anon,authenticated;
grant execute on function public.plan_idea_evidence_context_candidate_v3(uuid,bigint,text[])
to service_role;

-- V0.3 invariants:
-- - a generic URL never implies redesign/current site;
-- - redesign derives from canonical Information/Requirement state only;
-- - EXISTING_SITE is an explicit conditional Requirement in G2 planning;
-- - EXISTING_AUDIT cannot be planned before EXISTING_SITE becomes usable;
-- - planner only accepts explicit SITE_VITRINE@0.5, preserving current 0.4 runtime safety.
