-- 4b4c Project Master Blueprint V1 — canonical pre-project bridge P3
-- Additive compatibility layer. No historical Idea gate or requirement state is rewritten.
-- Canonical predicates are derived from current runtime evidence; G0-G3 are not stored as a second truth source.

create or replace function app_private.idea_canonical_requirement_check_v1(
  p_idea_id uuid,
  p_requirement_id text,
  p_accepted_levels text[],
  p_allow_not_relevant boolean default false,
  p_allow_accepted_unknown boolean default false
)
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $$
declare
  v_idea public.ideas;
  v_state public.idea_requirement_states;
  v_ready boolean := false;
  v_reason text := null;
  v_levels_ok boolean := false;
begin
  select * into v_idea from public.ideas where id=p_idea_id;
  if v_idea.id is null then
    return jsonb_build_object('requirement_id',p_requirement_id,'ready',false,'reason','IDEA_NOT_FOUND');
  end if;

  select * into v_state
  from public.idea_requirement_states
  where idea_id=p_idea_id and requirement_id=p_requirement_id;

  if v_state.idea_id is null then
    return jsonb_build_object(
      'requirement_id',p_requirement_id,'ready',false,'reason','MISSING_REQUIREMENT_STATE',
      'basis_fingerprint',md5(jsonb_build_object('idea_id',p_idea_id,'requirement_id',p_requirement_id,'missing',true)::text)
    );
  end if;

  if v_state.evaluated_engine_revision is distinct from v_idea.engine_revision then
    v_reason := 'STALE_ENGINE_REVISION';
  elsif v_state.lock_state in ('STALE','SUPERSEDED','REJECTED','REVIEW_REQUIRED') then
    v_reason := 'NON_CURRENT_LOCK_STATE';
  elsif v_state.resolution_state in ('STALE','CONFLICTED','UNRESOLVED') then
    v_reason := 'UNRESOLVED_OR_CONFLICTED';
  elsif not coalesce(v_state.authority_ok,false) then
    v_reason := 'AUTHORITY_NOT_SATISFIED';
  elsif nullif(btrim(v_state.input_fingerprint),'') is null then
    v_reason := 'MISSING_INPUT_FINGERPRINT';
  elsif v_state.applicability_state='NOT_RELEVANT' then
    if p_allow_not_relevant and v_state.resolution_state='NOT_RELEVANT' then
      v_ready := true;
      v_reason := 'NOT_RELEVANT_ACCEPTED';
    else
      v_reason := 'UNEXPECTED_NOT_RELEVANT';
    end if;
  elsif v_state.resolution_state='ACCEPTED_UNKNOWN' then
    if p_allow_accepted_unknown then
      v_ready := true;
      v_reason := 'ACCEPTED_UNKNOWN_EXPLICIT';
    else
      v_reason := 'ACCEPTED_UNKNOWN_NOT_ALLOWED';
    end if;
  elsif v_state.resolution_state<>'RESOLVED' then
    v_reason := 'RESOLUTION_NOT_READY';
  else
    v_levels_ok := coalesce(cardinality(p_accepted_levels),0)=0 or coalesce(v_state.resolution_levels && p_accepted_levels,false);
    if v_levels_ok then
      v_ready := true;
      v_reason := 'SATISFIED';
    else
      v_reason := 'RESOLUTION_LEVEL_INSUFFICIENT';
    end if;
  end if;

  return jsonb_build_object(
    'requirement_id',p_requirement_id,
    'ready',v_ready,
    'reason',v_reason,
    'applicability_state',v_state.applicability_state,
    'resolution_state',v_state.resolution_state,
    'resolution_levels',to_jsonb(v_state.resolution_levels),
    'criticality_current',v_state.criticality_current,
    'lock_state',v_state.lock_state,
    'authority_ok',v_state.authority_ok,
    'evaluated_engine_revision',v_state.evaluated_engine_revision,
    'input_fingerprint',v_state.input_fingerprint,
    'basis_fingerprint',md5(jsonb_build_object(
      'requirement_id',p_requirement_id,
      'applicability',v_state.applicability_state,
      'resolution',v_state.resolution_state,
      'levels',to_jsonb(v_state.resolution_levels),
      'lock',v_state.lock_state,
      'authority_ok',v_state.authority_ok,
      'engine_revision',v_state.evaluated_engine_revision,
      'input_fingerprint',v_state.input_fingerprint
    )::text)
  );
end;
$$;

revoke all on function app_private.idea_canonical_requirement_check_v1(uuid,text,text[],boolean,boolean) from public,anon,authenticated;
grant execute on function app_private.idea_canonical_requirement_check_v1(uuid,text,text[],boolean,boolean) to service_role;

create or replace function app_private.idea_canonical_artifact_check_v1(
  p_idea_id uuid,
  p_artifact_key text
)
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $$
declare
  v_art public.idea_artifacts;
  v_ready boolean := false;
  v_reason text;
begin
  select * into v_art
  from public.idea_artifacts
  where idea_id=p_idea_id and artifact_key=p_artifact_key and state in ('current','frozen')
  order by version desc
  limit 1;

  if v_art.id is null then
    return jsonb_build_object(
      'artifact_key',p_artifact_key,'ready',false,'reason','CURRENT_ARTIFACT_MISSING',
      'basis_fingerprint',md5(jsonb_build_object('idea_id',p_idea_id,'artifact_key',p_artifact_key,'missing',true)::text)
    );
  end if;

  if v_art.purpose_stage<>'FOR_DECISION' then
    v_reason := 'ARTIFACT_PURPOSE_INVALID';
  elsif v_art.spec_status<>'CONCEPT_NOT_FINAL_SPEC' then
    v_reason := 'ARTIFACT_SPEC_BOUNDARY_INVALID';
  elsif v_art.freshness_status<>'fresh' then
    v_reason := 'ARTIFACT_STALE';
  elsif nullif(btrim(v_art.input_fingerprint),'') is null or nullif(btrim(v_art.content_hash),'') is null then
    v_reason := 'ARTIFACT_FINGERPRINT_MISSING';
  else
    v_ready := true;
    v_reason := 'SATISFIED';
  end if;

  return jsonb_build_object(
    'artifact_key',p_artifact_key,
    'artifact_id',v_art.id,
    'version',v_art.version,
    'state',v_art.state,
    'ready',v_ready,
    'reason',v_reason,
    'freshness_status',v_art.freshness_status,
    'input_fingerprint',v_art.input_fingerprint,
    'content_hash',v_art.content_hash,
    'basis_fingerprint',md5(jsonb_build_object(
      'artifact_id',v_art.id,'version',v_art.version,'input_fingerprint',v_art.input_fingerprint,'content_hash',v_art.content_hash
    )::text)
  );
end;
$$;

revoke all on function app_private.idea_canonical_artifact_check_v1(uuid,text) from public,anon,authenticated;
grant execute on function app_private.idea_canonical_artifact_check_v1(uuid,text) to service_role;

create or replace function public.get_canonical_idea_preproject_readiness_v1(p_idea_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $$
declare
  v_idea public.ideas;
  v_fit public.idea_blueprint_fit_decisions;
  v_g0_ready boolean := false;
  v_g0_outcome text := 'UNRESOLVED';

  v_foundation_checks jsonb := '[]'::jsonb;
  v_evidence_checks jsonb := '[]'::jsonb;
  v_strategy_checks jsonb := '[]'::jsonb;
  v_strategy_core_checks jsonb := '[]'::jsonb;
  v_prefiguration_checks jsonb := '[]'::jsonb;
  v_conditional_checks jsonb := '[]'::jsonb;

  v_foundation_ready boolean := false;
  v_evidence_ready boolean := false;
  v_strategy_ready boolean := false;
  v_strategy_core_ready boolean := false;
  v_prefiguration_ready boolean := false;
  v_decision_package_ready boolean := false;

  v_pkg public.idea_decision_packages;
  v_snap public.idea_snapshots;
  v_pkg_outputs_fresh boolean := false;
  v_pkg_exec_memo boolean := false;
  v_pkg_material_feedback_open boolean := false;
  v_pkg_output_basis jsonb := '[]'::jsonb;
  v_pkg_reason text := 'DECISION_PACKAGE_MISSING';

  v_g1_ready boolean := false;
  v_g1_path text := 'NONE';
  v_g1_status text := 'NOT_READY';
  v_g1_basis jsonb;
  v_g1_fingerprint text;

  v_decision public.idea_decision_records_v2;
  v_g2_ready boolean := false;
  v_g2_status text := 'NOT_READY';
  v_g2_fingerprint text;

  v_pd public.project_definitions;
  v_g3_ready boolean := false;
  v_g3_status text := 'NOT_READY';
  v_g3_fingerprint text;
  v_baseline_complete boolean := false;

  v_required jsonb;
  v_ready_count integer;
  v_total_count integer;
  v_conditional_unmaterialized text[] := array[]::text[];
begin
  select * into v_idea from public.ideas where id=p_idea_id;
  if v_idea.id is null then raise exception 'IDEA_NOT_FOUND'; end if;

  select * into v_fit
  from public.idea_blueprint_fit_decisions
  where idea_id=p_idea_id
  order by decided_at desc,created_at desc
  limit 1;

  if v_fit.id is not null then
    if v_fit.decision='SITE_VITRINE'
       and v_idea.blueprint_id='SITE_VITRINE'
       and v_idea.blueprint_version='0.4'
       and v_idea.blueprint_status='active' then
      v_g0_ready := true;
      v_g0_outcome := 'SITE_VITRINE';
    elsif v_fit.decision='BLUEPRINT_MISMATCH'
       and v_idea.blueprint_status='mismatch'
       and v_idea.blueprint_id is null then
      v_g0_ready := true;
      v_g0_outcome := 'BLUEPRINT_MISMATCH';
    else
      v_g0_outcome := 'STATE_MISMATCH';
    end if;
  end if;

  select coalesce(jsonb_agg(chk order by ordinal),'[]'::jsonb)
  into v_foundation_checks
  from (
    select p.ordinal,
           app_private.idea_canonical_requirement_check_v1(
             p_idea_id,p.requirement_id,p.accepted_levels,p.conditional_atom,p.conditional_atom
           ) as chk
    from app_private.idea_g1_policy_v1() p
  ) q;

  select count(*),count(*) filter (where coalesce((x->>'ready')::boolean,false))
  into v_total_count,v_ready_count
  from jsonb_array_elements(v_foundation_checks) x;
  v_foundation_ready := v_total_count>0 and v_ready_count=v_total_count;

  with policy(requirement_id,accepted_levels,conditional_atom) as (
    values
      ('SV.D03.PRIMARY_NEED',array['WORKING_ASSUMPTION','AI_RECOMMENDATION','ACCEPTED_AS_CURRENT','HUMAN_VALIDATED','HUMAN_DECISION','EXPERT_SIGNOFF']::text[],false),
      ('SV.D04.EVIDENCE_QUALITY',array['CALCULATED','AI_RECOMMENDATION','ACCEPTED_AS_CURRENT','HUMAN_VALIDATED','HUMAN_DECISION','EXPERT_SIGNOFF']::text[],false),
      ('SV.D05.MARKET_CONTEXT',array['CALCULATED','AI_RECOMMENDATION','ACCEPTED_AS_CURRENT','HUMAN_VALIDATED','HUMAN_DECISION','EXPERT_SIGNOFF']::text[],false),
      ('SV.D05.PATTERN_GAP_SYNTHESIS',array['AI_RECOMMENDATION','ACCEPTED_AS_CURRENT','HUMAN_VALIDATED','HUMAN_DECISION','EXPERT_SIGNOFF']::text[],false),
      ('SV.D05.RESEARCH_SUFFICIENCY',array['CALCULATED','ACCEPTED_AS_CURRENT','HUMAN_VALIDATED','HUMAN_DECISION','EXPERT_SIGNOFF']::text[],false),
      ('SV.D04.EXISTING_AUDIT',array['OBSERVED','CALCULATED','AI_RECOMMENDATION','ACCEPTED_AS_CURRENT','HUMAN_VALIDATED','EXPERT_SIGNOFF']::text[],true),
      ('SV.D05.COMPETITOR_SET',array['SOURCE_BACKED','OBSERVED','CALCULATED','AI_RECOMMENDATION','ACCEPTED_AS_CURRENT','HUMAN_VALIDATED','HUMAN_DECISION','EXPERT_SIGNOFF']::text[],true)
  )
  select coalesce(jsonb_agg(app_private.idea_canonical_requirement_check_v1(
    p_idea_id,requirement_id,accepted_levels,conditional_atom,false
  ) order by requirement_id),'[]'::jsonb)
  into v_evidence_checks
  from policy;

  select count(*),count(*) filter (where coalesce((x->>'ready')::boolean,false))
  into v_total_count,v_ready_count
  from jsonb_array_elements(v_evidence_checks) x;
  v_evidence_ready := v_total_count>0 and v_ready_count=v_total_count;

  with policy(requirement_id,accepted_levels,conditional_atom) as (
    values
      ('SV.D01.DECISION_QUESTION',array['ACCEPTED_AS_CURRENT','HUMAN_VALIDATED','HUMAN_DECISION','EXPERT_SIGNOFF']::text[],false),
      ('SV.D02.HARD_CONSTRAINTS',array['ACCEPTED_AS_CURRENT','HUMAN_VALIDATED','HUMAN_DECISION','EXPERT_SIGNOFF']::text[],true),
      ('SV.D06.ORIGINAL_IDEA_CHALLENGE',array['AI_RECOMMENDATION','ACCEPTED_AS_CURRENT','HUMAN_VALIDATED','HUMAN_DECISION','EXPERT_SIGNOFF']::text[],false),
      ('SV.D06.OPPORTUNITY_SYNTHESIS',array['AI_RECOMMENDATION','ACCEPTED_AS_CURRENT','HUMAN_VALIDATED','HUMAN_DECISION','EXPERT_SIGNOFF']::text[],false),
      ('SV.D06.POSITIONING_OPTIONS',array['AI_RECOMMENDATION','ACCEPTED_AS_CURRENT','HUMAN_VALIDATED','HUMAN_DECISION','EXPERT_SIGNOFF']::text[],false),
      ('SV.D06.RISKS_ASSUMPTIONS',array['WORKING_ASSUMPTION','AI_RECOMMENDATION','ACCEPTED_AS_CURRENT','HUMAN_VALIDATED','HUMAN_DECISION','EXPERT_SIGNOFF']::text[],false),
      ('SV.D06.RECOMMENDATION',array['AI_RECOMMENDATION','ACCEPTED_AS_CURRENT','HUMAN_VALIDATED','HUMAN_DECISION','EXPERT_SIGNOFF']::text[],false),
      ('SV.D07.OFFER_PRIORITY',array['ACCEPTED_AS_CURRENT','HUMAN_VALIDATED','HUMAN_DECISION','EXPERT_SIGNOFF']::text[],false),
      ('SV.D07.MACRO_SCOPE',array['AI_RECOMMENDATION','ACCEPTED_AS_CURRENT','HUMAN_VALIDATED','HUMAN_DECISION','EXPERT_SIGNOFF']::text[],false)
  )
  select coalesce(jsonb_agg(app_private.idea_canonical_requirement_check_v1(
    p_idea_id,requirement_id,accepted_levels,conditional_atom,false
  ) order by requirement_id),'[]'::jsonb)
  into v_strategy_checks
  from policy;

  select count(*),count(*) filter (where coalesce((x->>'ready')::boolean,false))
  into v_total_count,v_ready_count
  from jsonb_array_elements(v_strategy_checks) x;
  v_strategy_ready := v_total_count>0 and v_ready_count=v_total_count;

  with policy(requirement_id,accepted_levels) as (
    values
      ('SV.D01.DECISION_QUESTION',array['ACCEPTED_AS_CURRENT','HUMAN_VALIDATED','HUMAN_DECISION','EXPERT_SIGNOFF']::text[]),
      ('SV.D06.RISKS_ASSUMPTIONS',array['WORKING_ASSUMPTION','AI_RECOMMENDATION','ACCEPTED_AS_CURRENT','HUMAN_VALIDATED','HUMAN_DECISION','EXPERT_SIGNOFF']::text[]),
      ('SV.D06.RECOMMENDATION',array['AI_RECOMMENDATION','ACCEPTED_AS_CURRENT','HUMAN_VALIDATED','HUMAN_DECISION','EXPERT_SIGNOFF']::text[])
  )
  select coalesce(jsonb_agg(app_private.idea_canonical_requirement_check_v1(
    p_idea_id,requirement_id,accepted_levels,false,false
  ) order by requirement_id),'[]'::jsonb)
  into v_strategy_core_checks
  from policy;

  select count(*),count(*) filter (where coalesce((x->>'ready')::boolean,false))
  into v_total_count,v_ready_count
  from jsonb_array_elements(v_strategy_core_checks) x;
  v_strategy_core_ready := v_total_count>0 and v_ready_count=v_total_count;

  v_required := app_private.idea_canonical_requirement_check_v1(
    p_idea_id,'SV.D06.PREFIGURATION_TARGET',
    array['ACCEPTED_AS_CURRENT','HUMAN_VALIDATED','HUMAN_DECISION','EXPERT_SIGNOFF']::text[],false,false
  );

  with artifacts(artifact_key) as (
    values
      ('PF.CONCEPT_JOURNEY'),('PF.CONCEPT_SITEMAP'),('PF.MESSAGE_HIERARCHY'),
      ('PF.CAPABILITY_SET'),('PF.FEASIBILITY_ENVELOPE'),('PF.SUCCESS_MODEL')
  )
  select jsonb_build_array(v_required) || coalesce(jsonb_agg(app_private.idea_canonical_artifact_check_v1(p_idea_id,artifact_key) order by artifact_key),'[]'::jsonb)
  into v_prefiguration_checks
  from artifacts;

  select count(*),count(*) filter (where coalesce((x->>'ready')::boolean,false))
  into v_total_count,v_ready_count
  from jsonb_array_elements(v_prefiguration_checks) x;
  v_prefiguration_ready := v_total_count>0 and v_ready_count=v_total_count;

  with conditional(requirement_id,accepted_levels,artifact_key) as (
    values
      ('SV.PF.SEO_CONCEPT',array['WORKING_ASSUMPTION','AI_RECOMMENDATION','ACCEPTED_AS_CURRENT','HUMAN_VALIDATED','HUMAN_DECISION']::text[],'PF.SEO_CONCEPT'),
      ('SV.PF.VISUAL_TERRITORIES',array['ACCEPTED_AS_CURRENT','HUMAN_VALIDATED','HUMAN_DECISION']::text[],'PF.VISUAL_TERRITORIES'),
      ('SV.PF.HIFI_CONCEPT',array['AI_RECOMMENDATION','ACCEPTED_AS_CURRENT','HUMAN_VALIDATED','HUMAN_DECISION']::text[],'PF.HIFI_CONCEPT'),
      ('SV.PF.RISK_PROBE',array['EXPERT_SIGNOFF']::text[],null::text),
      ('SV.D21.SCENARIO_MODEL',array['CALCULATED','AI_RECOMMENDATION','ACCEPTED_AS_CURRENT','HUMAN_VALIDATED']::text[],'D21.DECISION_ECONOMICS'),
      ('SV.CV.USER_VALIDATION_EVIDENCE',array['SOURCE_BACKED','RAW_HUMAN','OBSERVED','ACCEPTED_AS_CURRENT','HUMAN_VALIDATED']::text[],'CV.CONCEPT_VALIDATION_RECORD')
  ), evaluated as (
    select c.requirement_id,c.accepted_levels,c.artifact_key,rs.applicability_state,
      case
        when rs.idea_id is null then jsonb_build_object('requirement_id',c.requirement_id,'ready',true,'reason','CONDITIONAL_APPLICABILITY_UNMATERIALIZED','coverage_warning',true)
        when rs.applicability_state='NOT_RELEVANT' then app_private.idea_canonical_requirement_check_v1(p_idea_id,c.requirement_id,c.accepted_levels,true,false)
        else app_private.idea_canonical_requirement_check_v1(p_idea_id,c.requirement_id,c.accepted_levels,false,false)
      end as requirement_check
    from conditional c
    left join public.idea_requirement_states rs on rs.idea_id=p_idea_id and rs.requirement_id=c.requirement_id
  )
  select coalesce(jsonb_agg(
    requirement_check || case
      when artifact_key is not null and applicability_state='ACTIVE'
        then jsonb_build_object('artifact_check',app_private.idea_canonical_artifact_check_v1(p_idea_id,artifact_key))
      else '{}'::jsonb
    end
    order by requirement_id
  ),'[]'::jsonb),
  coalesce(array_agg(requirement_id order by requirement_id) filter (where applicability_state is null),array[]::text[])
  into v_conditional_checks,v_conditional_unmaterialized
  from evaluated;

  if exists (
    select 1
    from jsonb_array_elements(v_conditional_checks) x
    where coalesce(x->>'reason','')<>'CONDITIONAL_APPLICABILITY_UNMATERIALIZED'
      and (
        not coalesce((x->>'ready')::boolean,false)
        or (x ? 'artifact_check' and not coalesce((x->'artifact_check'->>'ready')::boolean,false))
      )
  ) then
    v_prefiguration_ready := false;
  end if;

  select * into v_pkg
  from public.idea_decision_packages
  where idea_id=p_idea_id and state in ('current','frozen')
  order by version desc
  limit 1;

  if v_pkg.id is not null then
    select * into v_snap from public.idea_snapshots
    where id=v_pkg.decision_snapshot_id and idea_id=p_idea_id and snapshot_type='DECISION_SNAPSHOT';

    select count(*)>0 and coalesce(bool_and(
      a.freshness_status='fresh'
      and a.state in ('current','frozen')
      and a.input_fingerprint=v_pkg.snapshot_content_hash
      and a.source_snapshot_id=v_pkg.decision_snapshot_id
    ),false),
    coalesce(bool_or(a.artifact_key='D22.EXECUTIVE_MEMO'),false),
    coalesce(jsonb_agg(jsonb_build_object('artifact_id',a.id,'artifact_key',a.artifact_key,'version',a.version,'content_hash',a.content_hash,'input_fingerprint',a.input_fingerprint) order by a.artifact_key,a.version),'[]'::jsonb)
    into v_pkg_outputs_fresh,v_pkg_exec_memo,v_pkg_output_basis
    from public.idea_artifacts a
    where a.id=any(v_pkg.output_artifact_ids);

    select exists(
      select 1 from public.idea_decision_feedback f
      where f.package_id=v_pkg.id and f.status='open' and f.materiality in ('LOCAL','SUBSTANTIVE','CRITICAL')
    ) into v_pkg_material_feedback_open;

    if v_pkg.snapshot_engine_revision<>v_idea.engine_revision then
      v_pkg_reason := 'PACKAGE_ENGINE_REVISION_STALE';
    elsif v_snap.id is null or v_snap.engine_revision<>v_idea.engine_revision then
      v_pkg_reason := 'DECISION_SNAPSHOT_STALE_OR_MISSING';
    elsif v_snap.content_hash is distinct from v_pkg.snapshot_content_hash then
      v_pkg_reason := 'SNAPSHOT_HASH_MISMATCH';
    elsif not v_pkg_outputs_fresh then
      v_pkg_reason := 'PACKAGE_OUTPUTS_NOT_FRESH';
    elsif not v_pkg_exec_memo then
      v_pkg_reason := 'EXECUTIVE_MEMO_MISSING';
    elsif nullif(btrim(v_pkg.decision_sought),'') is null then
      v_pkg_reason := 'DECISION_ASK_MISSING';
    elsif v_pkg_material_feedback_open then
      v_pkg_reason := 'MATERIAL_REVIEW_FEEDBACK_OPEN';
    else
      v_decision_package_ready := true;
      v_pkg_reason := 'SATISFIED';
    end if;
  end if;

  if v_g0_ready and v_g0_outcome='SITE_VITRINE'
     and v_foundation_ready and v_evidence_ready and v_strategy_ready
     and v_prefiguration_ready and v_decision_package_ready then
    v_g1_ready := true;
    v_g1_path := 'LAUNCH';
    v_g1_status := 'READY';
  elsif v_g0_ready and v_g0_outcome='SITE_VITRINE'
     and v_foundation_ready and v_evidence_ready and v_strategy_core_ready
     and v_decision_package_ready then
    v_g1_ready := true;
    v_g1_path := 'EARLY_NON_GO_DECISION';
    v_g1_status := 'READY';
  end if;

  v_g1_basis := jsonb_build_object(
    'idea_id',v_idea.id,
    'engine_revision',v_idea.engine_revision,
    'blueprint_id',v_idea.blueprint_id,
    'blueprint_version',v_idea.blueprint_version,
    'fit_decision_id',v_fit.id,
    'fit_outcome',v_g0_outcome,
    'decision_path',v_g1_path,
    'foundation',v_foundation_checks,
    'evidence',v_evidence_checks,
    'strategy',case when v_g1_path='EARLY_NON_GO_DECISION' then v_strategy_core_checks else v_strategy_checks end,
    'prefiguration_basis',case when v_g1_path='LAUNCH' then v_prefiguration_checks else '[]'::jsonb end,
    'conditional_prefiguration_basis',case when v_g1_path='LAUNCH' then v_conditional_checks else '[]'::jsonb end,
    'decision_package',case when v_pkg.id is null then null else jsonb_build_object(
      'package_id',v_pkg.id,'package_hash',v_pkg.package_hash,'snapshot_id',v_pkg.decision_snapshot_id,
      'snapshot_hash',v_pkg.snapshot_content_hash,'output_basis',v_pkg_output_basis
    ) end
  );
  v_g1_fingerprint := md5(v_g1_basis::text);

  select * into v_decision
  from public.idea_decision_records_v2
  where idea_id=p_idea_id
  order by decided_at desc
  limit 1;

  if v_decision.id is not null then
    if v_decision.outcome not in ('APPROVE_TO_PROJECT','APPROVE_WITH_CHANGES') then
      v_g2_status := 'RESOLVED_NO_GO';
    elsif not v_g1_ready or v_g1_path<>'LAUNCH' then
      v_g2_status := 'G1_LAUNCH_NOT_READY';
    elsif v_decision.package_id is distinct from v_pkg.id then
      v_g2_status := 'DECISION_PACKAGE_MISMATCH';
    elsif v_decision.decided_engine_revision<>v_idea.engine_revision then
      v_g2_status := 'DECISION_ENGINE_REVISION_STALE';
    elsif v_decision.gate_evaluation_fingerprint is distinct from v_g1_fingerprint then
      v_g2_status := 'LEGACY_OR_STALE_GATE_FINGERPRINT';
    elsif not v_decision.gate_g7_ready or not v_decision.promotable or not v_decision.conditions_resolved then
      v_g2_status := 'DECISION_NOT_PROMOTABLE';
    else
      v_g2_ready := true;
      v_g2_status := 'READY';
    end if;
  end if;
  v_g2_fingerprint := md5(jsonb_build_object(
    'g1_fingerprint',v_g1_fingerprint,
    'decision_record_id',v_decision.id,
    'decision_hash',v_decision.decision_hash,
    'outcome',v_decision.outcome,
    'promotable',v_decision.promotable,
    'conditions_resolved',v_decision.conditions_resolved
  )::text);

  if v_decision.id is not null then
    select * into v_pd
    from public.project_definitions
    where idea_id=p_idea_id and approved_decision_record_id=v_decision.id and status<>'superseded'
    order by version desc
    limit 1;
  end if;

  if v_pd.id is not null then
    v_baseline_complete :=
      nullif(btrim(v_pd.baseline_hash),'') is not null
      and v_pd.approved_idea_snapshot_id is not null
      and v_pd.decision_package_id=v_decision.package_id
      and v_pd.baseline_manifest ?& array[
        'vision','decision_rationale','business_outcomes','approved_targets','positioning','macro_scope','non_goals',
        'critical_constraints','risks','accepted_unknowns','source_evidence_refs','decision_authority'
      ]::text[];

    if not v_g2_ready then
      v_g3_status := 'CANONICAL_G2_NOT_READY';
    elsif not v_baseline_complete then
      v_g3_status := 'BASELINE_INCOMPLETE';
    else
      v_g3_ready := true;
      v_g3_status := 'READY';
    end if;
  end if;
  v_g3_fingerprint := md5(jsonb_build_object(
    'g2_fingerprint',v_g2_fingerprint,'project_definition_id',v_pd.id,'baseline_hash',v_pd.baseline_hash,
    'approved_snapshot_id',v_pd.approved_idea_snapshot_id,'definition_revision',v_pd.definition_revision
  )::text);

  return jsonb_build_object(
    'schema_version','1.0',
    'bridge_contract','IDEA_PREPROJECT_CANONICAL_RUNTIME_BRIDGE@1.0',
    'idea',jsonb_build_object(
      'id',v_idea.id,'workspace_id',v_idea.workspace_id,'engine_revision',v_idea.engine_revision,
      'blueprint_id',v_idea.blueprint_id,'blueprint_version',v_idea.blueprint_version,'blueprint_status',v_idea.blueprint_status
    ),
    'coverage',jsonb_build_object(
      'active_idea_blueprint','SITE_VITRINE@0.4',
      'site_vitrine_0_5_activation','UNCHANGED_NON_ACTIVE',
      'predicate_persistence','DERIVED_NOT_STORED',
      'conditional_prefiguration_applicability','BEST_AVAILABLE_MATERIALIZED_RUNTIME_STATE',
      'conditional_requirements_unmaterialized',to_jsonb(v_conditional_unmaterialized),
      'authenticated_real_idea_e2e','UNPROVEN_NO_PRODUCTION_IDEA'
    ),
    'formal_gates',jsonb_build_object(
      'G0_BLUEPRINT_FIT',jsonb_build_object(
        'ready',v_g0_ready,'outcome',v_g0_outcome,'decision_id',v_fit.id,'decision_actor_type',v_fit.actor_type,
        'fingerprint',md5(jsonb_build_object('decision_id',v_fit.id,'decision',v_g0_outcome,'blueprint_id',v_idea.blueprint_id,'blueprint_version',v_idea.blueprint_version,'blueprint_status',v_idea.blueprint_status)::text)
      ),
      'G1_IDEA_DECISION_READY',jsonb_build_object(
        'ready',v_g1_ready,'status',v_g1_status,'decision_path',v_g1_path,'evaluation_fingerprint',v_g1_fingerprint,
        'allowed_outcomes',case when v_g1_path='LAUNCH' then jsonb_build_array('APPROVE_TO_PROJECT','APPROVE_WITH_CHANGES','REVISE','DEEPEN_RESEARCH','PAUSE','STOP','INSUFFICIENT_INFORMATION')
          when v_g1_path='EARLY_NON_GO_DECISION' then jsonb_build_array('REVISE','DEEPEN_RESEARCH','PAUSE','STOP','INSUFFICIENT_INFORMATION') else '[]'::jsonb end
      ),
      'G2_GO_PROJECT',jsonb_build_object(
        'ready',v_g2_ready,'status',v_g2_status,'evaluation_fingerprint',v_g2_fingerprint,
        'decision_record_id',v_decision.id,'outcome',v_decision.outcome,'promotable',v_decision.promotable,'decided_by',v_decision.decided_by
      ),
      'G3_PROJECT_BASELINE',jsonb_build_object(
        'ready',v_g3_ready,'status',v_g3_status,'evaluation_fingerprint',v_g3_fingerprint,
        'project_definition_id',v_pd.id,'baseline_hash',v_pd.baseline_hash,'baseline_complete',v_baseline_complete
      )
    ),
    'readiness_predicates',jsonb_build_object(
      'FOUNDATION_READY',jsonb_build_object('ready',v_foundation_ready,'checks',v_foundation_checks),
      'EVIDENCE_READY',jsonb_build_object('ready',v_evidence_ready,'checks',v_evidence_checks),
      'STRATEGY_READY',jsonb_build_object('ready',v_strategy_ready,'checks',v_strategy_checks,'early_decision_core_ready',v_strategy_core_ready,'early_decision_core_checks',v_strategy_core_checks),
      'PREFIGURATION_READY',jsonb_build_object('ready',v_prefiguration_ready,'checks',v_prefiguration_checks,'conditional_checks',v_conditional_checks),
      'DECISION_PACKAGE_READY',jsonb_build_object(
        'ready',v_decision_package_ready,'reason',v_pkg_reason,'package_id',v_pkg.id,'package_hash',v_pkg.package_hash,
        'decision_snapshot_id',v_pkg.decision_snapshot_id,'snapshot_hash',v_pkg.snapshot_content_hash,
        'material_feedback_open',v_pkg_material_feedback_open,'output_basis',v_pkg_output_basis
      )
    )
  );
end;
$$;

revoke all on function public.get_canonical_idea_preproject_readiness_v1(uuid) from public,anon,authenticated;
grant execute on function public.get_canonical_idea_preproject_readiness_v1(uuid) to service_role;

create or replace function public.record_canonical_idea_decision_v1(
  p_package_id uuid,
  p_decided_by uuid,
  p_outcome text,
  p_rationale text,
  p_conditions jsonb,
  p_conditions_resolved boolean,
  p_expected_g1_fingerprint text,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_pkg public.idea_decision_packages;
  v_eval jsonb;
  v_g1 jsonb;
  v_result jsonb;
begin
  select * into v_pkg from public.idea_decision_packages where id=p_package_id;
  if v_pkg.id is null then raise exception 'DECISION_PACKAGE_NOT_FOUND'; end if;

  v_eval := public.get_canonical_idea_preproject_readiness_v1(v_pkg.idea_id);
  v_g1 := v_eval->'formal_gates'->'G1_IDEA_DECISION_READY';

  if not coalesce((v_g1->>'ready')::boolean,false) then raise exception 'CANONICAL_G1_NOT_READY'; end if;
  if nullif(btrim(p_expected_g1_fingerprint),'') is null or p_expected_g1_fingerprint is distinct from (v_g1->>'evaluation_fingerprint') then
    raise exception 'STALE_CANONICAL_G1';
  end if;
  if p_package_id::text is distinct from (v_eval->'readiness_predicates'->'DECISION_PACKAGE_READY'->>'package_id') then
    raise exception 'CANONICAL_DECISION_PACKAGE_MISMATCH';
  end if;
  if p_outcome in ('APPROVE_TO_PROJECT','APPROVE_WITH_CHANGES') and coalesce(v_g1->>'decision_path','')<>'LAUNCH' then
    raise exception 'GO_REQUIRES_CANONICAL_LAUNCH_PATH';
  end if;
  if not (v_g1->'allowed_outcomes' ? p_outcome) then raise exception 'OUTCOME_NOT_ALLOWED_FOR_CANONICAL_G1_PATH'; end if;

  v_result := public.record_idea_decision_v2(
    p_package_id,p_decided_by,p_outcome,p_rationale,p_conditions,p_conditions_resolved,
    true,p_expected_g1_fingerprint,p_idempotency_key
  );

  return v_result || jsonb_build_object(
    'canonical_gate_id','G2_GO_PROJECT',
    'canonical_g1_fingerprint',p_expected_g1_fingerprint,
    'canonical_decision_path',v_g1->>'decision_path'
  );
end;
$$;

revoke all on function public.record_canonical_idea_decision_v1(uuid,uuid,text,text,jsonb,boolean,text,text) from public,anon,authenticated;
grant execute on function public.record_canonical_idea_decision_v1(uuid,uuid,text,text,jsonb,boolean,text,text) to service_role;

create or replace function public.promote_canonical_approved_idea_to_project_definition_v1(
  p_decision_record_id uuid,
  p_expected_engine_revision bigint,
  p_baseline_manifest jsonb,
  p_promotion_diff jsonb,
  p_artifact_promotions jsonb,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_decision public.idea_decision_records_v2;
  v_eval jsonb;
  v_g2 jsonb;
  v_result jsonb;
begin
  select * into v_decision from public.idea_decision_records_v2 where id=p_decision_record_id;
  if v_decision.id is null then raise exception 'DECISION_RECORD_NOT_FOUND'; end if;

  v_eval := public.get_canonical_idea_preproject_readiness_v1(v_decision.idea_id);
  v_g2 := v_eval->'formal_gates'->'G2_GO_PROJECT';

  if not coalesce((v_g2->>'ready')::boolean,false) then raise exception 'CANONICAL_G2_NOT_READY'; end if;
  if p_decision_record_id::text is distinct from (v_g2->>'decision_record_id') then raise exception 'CANONICAL_G2_DECISION_MISMATCH'; end if;
  if p_expected_engine_revision is distinct from (v_eval->'idea'->>'engine_revision')::bigint then raise exception 'STALE_ENGINE'; end if;

  v_result := public.promote_approved_idea_to_project_definition_v1(
    p_decision_record_id,p_expected_engine_revision,p_baseline_manifest,p_promotion_diff,p_artifact_promotions,p_idempotency_key
  );

  return v_result || jsonb_build_object(
    'canonical_gate_id','G3_PROJECT_BASELINE',
    'canonical_g2_fingerprint',v_g2->>'evaluation_fingerprint'
  );
end;
$$;

revoke all on function public.promote_canonical_approved_idea_to_project_definition_v1(uuid,bigint,jsonb,jsonb,jsonb,text) from public,anon,authenticated;
grant execute on function public.promote_canonical_approved_idea_to_project_definition_v1(uuid,bigint,jsonb,jsonb,jsonb,text) to service_role;
