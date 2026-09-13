-- 4b4c / 2b2c — G2 non-research System Action boundary V0.1
-- Date: 2026-09-14
-- STATUS: COMPILE/ROLLBACK CANDIDATE ONLY — DO NOT APPLY AS A MIGRATION.
-- Research WEB/AUDIT/CONN continues through create_action_run_v4 + atomic research promotion.
-- Active G1 create_action_run_v3 / promote_action_result_v1 remain untouched.

create or replace function public.create_g2_system_action_run_candidate_v1(
  p_idea_id uuid,
  p_expected_engine_revision bigint,
  p_action_type text,
  p_acquisition_path text,
  p_target_requirement_ids text[],
  p_target_requirement_fingerprints jsonb,
  p_target_artifact_keys text[],
  p_input_fingerprint text,
  p_projection_fingerprint text,
  p_permission_scope jsonb,
  p_provider text,
  p_model text,
  p_prompt_version text,
  p_schema_version text,
  p_tool_version text,
  p_idempotency_key text
) returns jsonb
language plpgsql
security definer
set search_path=''
as $function$
declare
  v_idea public.ideas;
  v_existing public.idea_action_runs;
  v_run_id uuid;
  v_fp text;
  v_kind text;
  v_expected_action text;
  v_key text;
  v_target text;
  v_current_target_fp text;
  v_target_applicability text;
begin
  v_expected_action:=case p_acquisition_path
    when 'MEM' then 'REUSE_MEMORY'
    when 'RAW' then 'EXTRACT_RAW'
    when 'SRC' then 'EXTRACT_SOURCE'
    when 'CALC' then 'CALCULATE'
    when 'AI_H' then 'INFER_HYPOTHESIS'
    when 'AI_R' then 'GENERATE_RECOMMENDATION'
    else null
  end;

  if v_expected_action is null then raise exception 'G2_SYSTEM_ACTION_PATH_REQUIRED'; end if;
  if p_action_type is distinct from v_expected_action then raise exception 'ACTION_PATH_MISMATCH'; end if;
  if coalesce(cardinality(p_target_requirement_ids),0)=0 then
    raise exception 'G2_REQUIREMENT_TARGET_REQUIRED';
  end if;
  if p_target_requirement_fingerprints is null
     or jsonb_typeof(p_target_requirement_fingerprints)<>'object' then
    raise exception 'INVALID_TARGET_REQUIREMENT_FINGERPRINTS';
  end if;

  for v_key in select jsonb_object_keys(p_target_requirement_fingerprints) loop
    if not (v_key=any(coalesce(p_target_requirement_ids,array[]::text[]))) then
      raise exception 'FINGERPRINT_TARGET_NOT_DECLARED';
    end if;
    if nullif(btrim(p_target_requirement_fingerprints->>v_key),'') is null then
      raise exception 'EMPTY_TARGET_REQUIREMENT_FINGERPRINT';
    end if;
  end loop;

  foreach v_target in array coalesce(p_target_requirement_ids,array[]::text[]) loop
    if not (p_target_requirement_fingerprints ? v_target) then
      raise exception 'TARGET_REQUIREMENT_FINGERPRINT_REQUIRED';
    end if;
  end loop;

  if nullif(btrim(p_input_fingerprint),'') is null then raise exception 'INPUT_FINGERPRINT_REQUIRED'; end if;
  if nullif(btrim(p_projection_fingerprint),'') is null then raise exception 'PROJECTION_FINGERPRINT_REQUIRED'; end if;
  if nullif(btrim(p_idempotency_key),'') is null then raise exception 'IDEMPOTENCY_KEY_REQUIRED'; end if;
  if p_permission_scope is null or jsonb_typeof(p_permission_scope)<>'object' then
    raise exception 'INVALID_PERMISSION_SCOPE';
  end if;
  if jsonb_typeof(coalesce(p_permission_scope->'allowed_mutation_kinds','[]'::jsonb))<>'array' then
    raise exception 'INVALID_PERMISSION_SCOPE';
  end if;
  for v_kind in select jsonb_array_elements_text(coalesce(p_permission_scope->'allowed_mutation_kinds','[]'::jsonb)) loop
    if v_kind not in ('INFORMATION_ITEM','LEDGER_ENTRY') then
      raise exception 'UNSUPPORTED_MUTATION_PERMISSION';
    end if;
  end loop;

  select * into v_idea from public.ideas where id=p_idea_id for update;
  if v_idea.id is null then raise exception 'IDEA_NOT_FOUND'; end if;
  if v_idea.blueprint_id<>'SITE_VITRINE'
     or v_idea.blueprint_version<>'0.5'
     or v_idea.blueprint_status<>'active' then
    raise exception 'G2_BLUEPRINT_0_5_NOT_ACTIVE';
  end if;

  v_fp:=md5(jsonb_build_object(
    'action_type',p_action_type,
    'acquisition_path',p_acquisition_path,
    'target_requirement_ids',to_jsonb(coalesce(p_target_requirement_ids,array[]::text[])),
    'target_requirement_fingerprints',p_target_requirement_fingerprints,
    'target_artifact_keys',to_jsonb(coalesce(p_target_artifact_keys,array[]::text[])),
    'input_fingerprint',p_input_fingerprint,
    'projection_fingerprint',p_projection_fingerprint,
    'permission_scope',p_permission_scope,
    'provider',p_provider,'model',p_model,
    'prompt_version',p_prompt_version,'schema_version',p_schema_version,'tool_version',p_tool_version
  )::text);

  select * into v_existing
  from public.idea_action_runs
  where idea_id=p_idea_id and idempotency_key=p_idempotency_key;
  if v_existing.id is not null then
    if v_existing.request_fingerprint is distinct from v_fp then raise exception 'IDEMPOTENCY_KEY_REUSE'; end if;
    return jsonb_build_object(
      'action_run_id',v_existing.id,'status',v_existing.status,
      'engine_revision',v_idea.engine_revision,'acquisition_path',v_existing.acquisition_path,
      'idempotent',true
    );
  end if;

  if v_idea.engine_revision<>p_expected_engine_revision then raise exception 'STALE_ENGINE'; end if;

  foreach v_target in array p_target_requirement_ids loop
    v_current_target_fp:=null;
    v_target_applicability:=null;
    select rs.input_fingerprint,rs.applicability_state
      into v_current_target_fp,v_target_applicability
    from public.idea_requirement_states rs
    where rs.idea_id=p_idea_id and rs.requirement_id=v_target;
    if nullif(v_current_target_fp,'') is null then raise exception 'TARGET_REQUIREMENT_STATE_REQUIRED'; end if;
    if v_target_applicability<>'ACTIVE' then raise exception 'TARGET_REQUIREMENT_NOT_ACTIVE'; end if;
    if v_current_target_fp is distinct from p_target_requirement_fingerprints->>v_target then
      raise exception 'STALE_TARGET_REQUIREMENT';
    end if;
  end loop;

  insert into public.idea_action_runs(
    idea_id,action_type,acquisition_path,target_requirement_ids,target_requirement_fingerprints,
    target_artifact_keys,target_signature,input_fingerprint,projection_fingerprint,input_refs,
    provider,model,prompt_version,schema_version,tool_version,permission_scope,status,attempt,
    idempotency_key,request_fingerprint,created_engine_revision,created_by_actor
  ) values(
    p_idea_id,p_action_type,p_acquisition_path,p_target_requirement_ids,p_target_requirement_fingerprints,
    coalesce(p_target_artifact_keys,array[]::text[]),
    md5(jsonb_build_object(
      'requirements',to_jsonb(p_target_requirement_ids),
      'requirement_fingerprints',p_target_requirement_fingerprints,
      'artifacts',to_jsonb(coalesce(p_target_artifact_keys,array[]::text[]))
    )::text),
    p_input_fingerprint,p_projection_fingerprint,'{}'::jsonb,
    p_provider,p_model,p_prompt_version,p_schema_version,p_tool_version,p_permission_scope,
    'queued',1,p_idempotency_key,v_fp,v_idea.engine_revision,'system'
  ) returning id into v_run_id;

  insert into public.audit_events(workspace_id,actor_id,event_type,entity_type,entity_id,payload)
  values(
    v_idea.workspace_id,null,'idea.g2_system_action_run_created','idea_action_run',v_run_id,
    jsonb_build_object(
      'idea_id',p_idea_id,'action_type',p_action_type,'acquisition_path',p_acquisition_path,
      'engine_revision',v_idea.engine_revision,'boundary','g2-system-v1'
    )
  );

  return jsonb_build_object(
    'action_run_id',v_run_id,'status','queued','engine_revision',v_idea.engine_revision,
    'acquisition_path',p_acquisition_path,'idempotent',false
  );
end;
$function$;

revoke all on function public.create_g2_system_action_run_candidate_v1(
  uuid,bigint,text,text,text[],jsonb,text[],text,text,jsonb,text,text,text,text,text,text
) from public,anon,authenticated;
grant execute on function public.create_g2_system_action_run_candidate_v1(
  uuid,bigint,text,text,text[],jsonb,text[],text,text,jsonb,text,text,text,text,text,text
) to service_role;

create or replace function public.promote_g2_system_action_result_candidate_v1(
  p_action_run_id uuid,
  p_current_input_fingerprint text
) returns jsonb
language plpgsql
security definer
set search_path=''
as $function$
declare
  v_run public.idea_action_runs;
  v_idea public.ideas;
  v_target text;
  v_current_fp text;
  v_applicability text;
begin
  select * into v_run from public.idea_action_runs where id=p_action_run_id for update;
  if v_run.id is null then raise exception 'ACTION_RUN_NOT_FOUND'; end if;
  if v_run.acquisition_path not in ('MEM','RAW','SRC','CALC','AI_H','AI_R') then
    raise exception 'G2_SYSTEM_ACTION_PATH_REQUIRED';
  end if;

  select * into v_idea from public.ideas where id=v_run.idea_id for update;
  if v_idea.id is null then raise exception 'IDEA_NOT_FOUND'; end if;

  -- Preserve historical idempotence after later Blueprint changes.
  if v_run.promoted_at is not null then
    return public.promote_action_result_v1(
      p_action_run_id,v_idea.engine_revision,p_current_input_fingerprint
    );
  end if;

  if v_idea.blueprint_id<>'SITE_VITRINE'
     or v_idea.blueprint_version<>'0.5'
     or v_idea.blueprint_status<>'active' then
    if v_run.status='succeeded' then
      update public.idea_action_runs
      set status='stale',stale_reason='G2_BLUEPRINT_CHANGED_BEFORE_SYSTEM_PROMOTION'
      where id=v_run.id;
    end if;
    return jsonb_build_object(
      'action_run_id',v_run.id,'promoted',false,'status','stale',
      'engine_revision',v_idea.engine_revision,'idempotent',false
    );
  end if;

  if v_run.status<>'succeeded' then raise exception 'ACTION_RUN_NOT_PROMOTABLE'; end if;
  if v_idea.engine_revision<>v_run.created_engine_revision then
    update public.idea_action_runs
    set status='stale',stale_reason='IDEA_REVISION_CHANGED_BEFORE_G2_SYSTEM_PROMOTION'
    where id=v_run.id;
    return jsonb_build_object('action_run_id',v_run.id,'promoted',false,'status','stale','engine_revision',v_idea.engine_revision,'idempotent',false);
  end if;
  if v_run.input_fingerprint is distinct from p_current_input_fingerprint then
    update public.idea_action_runs
    set status='stale',stale_reason='INPUT_CHANGED_BEFORE_G2_SYSTEM_PROMOTION'
    where id=v_run.id;
    return jsonb_build_object('action_run_id',v_run.id,'promoted',false,'status','stale','engine_revision',v_idea.engine_revision,'idempotent',false);
  end if;

  foreach v_target in array coalesce(v_run.target_requirement_ids,array[]::text[]) loop
    v_current_fp:=null; v_applicability:=null;
    select rs.input_fingerprint,rs.applicability_state
      into v_current_fp,v_applicability
    from public.idea_requirement_states rs
    where rs.idea_id=v_run.idea_id and rs.requirement_id=v_target;
    if nullif(v_current_fp,'') is null
       or v_applicability<>'ACTIVE'
       or v_current_fp is distinct from v_run.target_requirement_fingerprints->>v_target then
      update public.idea_action_runs
      set status='stale',stale_reason='TARGET_REQUIREMENT_CHANGED_BEFORE_G2_SYSTEM_PROMOTION'
      where id=v_run.id;
      return jsonb_build_object('action_run_id',v_run.id,'promoted',false,'status','stale','engine_revision',v_idea.engine_revision,'idempotent',false);
    end if;
  end loop;

  return public.promote_action_result_v1(
    p_action_run_id,v_idea.engine_revision,p_current_input_fingerprint
  );
end;
$function$;

revoke all on function public.promote_g2_system_action_result_candidate_v1(uuid,text)
from public,anon,authenticated;
grant execute on function public.promote_g2_system_action_result_candidate_v1(uuid,text)
to service_role;

-- Invariants:
-- - only non-research G2 paths are accepted here;
-- - active SITE_VITRINE@0.5 + exact current Requirement basis are mandatory;
-- - any Idea revision drift before promotion stales the run;
-- - target basis is revalidated immediately before canonical promotion;
-- - G1 Action Run RPCs remain untouched.