-- 4b4c / 2b2c — G2 research Action Run creation V0.4 — Blueprint guard
-- Date: 2026-09-13
-- STATUS: COMPILE/ROLLBACK CANDIDATE ONLY — DO NOT APPLY AS A MIGRATION.
-- Supersedes G2_RESEARCH_ACTION_V0_3_TARGET_GUARD for future G2 bundle.
-- G1 create_action_run_v3 remains untouched.

create or replace function public.create_action_run_v4(
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
  v_has_source boolean := false;
  v_has_information boolean := false;
begin
  v_expected_action := case p_acquisition_path
    when 'WEB' then 'RESEARCH_WEB'
    when 'AUDIT' then 'AUDIT'
    when 'CONN' then 'FETCH_CONNECTED'
    else null
  end;

  if v_expected_action is null then raise exception 'RESEARCH_ACTION_PATH_REQUIRED'; end if;
  if p_action_type is distinct from v_expected_action then raise exception 'ACTION_PATH_MISMATCH'; end if;
  if coalesce(cardinality(p_target_requirement_ids),0)=0
    then raise exception 'RESEARCH_REQUIREMENT_TARGET_REQUIRED';
  end if;
  if p_target_requirement_fingerprints is null
     or jsonb_typeof(p_target_requirement_fingerprints)<>'object'
    then raise exception 'INVALID_TARGET_REQUIREMENT_FINGERPRINTS';
  end if;

  for v_key in select jsonb_object_keys(p_target_requirement_fingerprints) loop
    if not (v_key=any(coalesce(p_target_requirement_ids,array[]::text[])))
      then raise exception 'FINGERPRINT_TARGET_NOT_DECLARED';
    end if;
    if nullif(btrim(p_target_requirement_fingerprints->>v_key),'') is null
      then raise exception 'EMPTY_TARGET_REQUIREMENT_FINGERPRINT';
    end if;
  end loop;

  foreach v_target in array coalesce(p_target_requirement_ids,array[]::text[]) loop
    if not (p_target_requirement_fingerprints ? v_target)
      then raise exception 'TARGET_REQUIREMENT_FINGERPRINT_REQUIRED';
    end if;
  end loop;

  if nullif(btrim(p_input_fingerprint),'') is null then raise exception 'INPUT_FINGERPRINT_REQUIRED'; end if;
  if nullif(btrim(p_projection_fingerprint),'') is null then raise exception 'PROJECTION_FINGERPRINT_REQUIRED'; end if;
  if nullif(btrim(p_idempotency_key),'') is null then raise exception 'IDEMPOTENCY_KEY_REQUIRED'; end if;
  if p_permission_scope is null or jsonb_typeof(p_permission_scope)<>'object'
    then raise exception 'INVALID_PERMISSION_SCOPE';
  end if;
  if jsonb_typeof(coalesce(p_permission_scope->'allowed_mutation_kinds','[]'::jsonb))<>'array'
    then raise exception 'INVALID_PERMISSION_SCOPE';
  end if;

  for v_kind in
    select jsonb_array_elements_text(coalesce(p_permission_scope->'allowed_mutation_kinds','[]'::jsonb))
  loop
    if v_kind not in ('SOURCE','INFORMATION_ITEM','LEDGER_ENTRY')
      then raise exception 'UNSUPPORTED_MUTATION_PERMISSION';
    end if;
    if v_kind='SOURCE' then v_has_source := true; end if;
    if v_kind='INFORMATION_ITEM' then v_has_information := true; end if;
  end loop;
  if not v_has_source then raise exception 'RESEARCH_SOURCE_PERMISSION_REQUIRED'; end if;
  if not v_has_information then raise exception 'RESEARCH_INFORMATION_PERMISSION_REQUIRED'; end if;

  select * into v_idea from public.ideas where id=p_idea_id for update;
  if v_idea.id is null then raise exception 'IDEA_NOT_FOUND'; end if;
  if v_idea.blueprint_id<>'SITE_VITRINE'
     or v_idea.blueprint_version<>'0.5'
     or v_idea.blueprint_status<>'active'
    then raise exception 'G2_BLUEPRINT_0_5_NOT_ACTIVE';
  end if;

  v_fp := md5(jsonb_build_object(
    'action_type',p_action_type,
    'acquisition_path',p_acquisition_path,
    'target_requirement_ids',to_jsonb(coalesce(p_target_requirement_ids,array[]::text[])),
    'target_requirement_fingerprints',p_target_requirement_fingerprints,
    'target_artifact_keys',to_jsonb(coalesce(p_target_artifact_keys,array[]::text[])),
    'input_fingerprint',p_input_fingerprint,
    'projection_fingerprint',p_projection_fingerprint,
    'permission_scope',p_permission_scope,
    'provider',p_provider,
    'model',p_model,
    'prompt_version',p_prompt_version,
    'schema_version',p_schema_version,
    'tool_version',p_tool_version
  )::text);

  select * into v_existing
  from public.idea_action_runs
  where idea_id=p_idea_id and idempotency_key=p_idempotency_key;
  if v_existing.id is not null then
    if v_existing.request_fingerprint is distinct from v_fp
      then raise exception 'IDEMPOTENCY_KEY_REUSE';
    end if;
    return jsonb_build_object(
      'action_run_id',v_existing.id,'status',v_existing.status,
      'engine_revision',v_idea.engine_revision,'acquisition_path',v_existing.acquisition_path,
      'idempotent',true
    );
  end if;

  if v_idea.engine_revision<>p_expected_engine_revision then raise exception 'STALE_ENGINE'; end if;

  foreach v_target in array coalesce(p_target_requirement_ids,array[]::text[]) loop
    v_current_target_fp := null;
    v_target_applicability := null;
    select input_fingerprint,applicability_state
      into v_current_target_fp,v_target_applicability
    from public.idea_requirement_states
    where idea_id=p_idea_id and requirement_id=v_target;

    if nullif(v_current_target_fp,'') is null
      then raise exception 'TARGET_REQUIREMENT_STATE_REQUIRED';
    end if;
    if v_target_applicability<>'ACTIVE'
      then raise exception 'TARGET_REQUIREMENT_NOT_ACTIVE';
    end if;
    if v_current_target_fp is distinct from p_target_requirement_fingerprints->>v_target
      then raise exception 'STALE_TARGET_REQUIREMENT';
    end if;
  end loop;

  insert into public.idea_action_runs(
    idea_id,action_type,acquisition_path,target_requirement_ids,target_requirement_fingerprints,
    target_artifact_keys,target_signature,input_fingerprint,projection_fingerprint,input_refs,
    provider,model,prompt_version,schema_version,tool_version,permission_scope,status,attempt,
    idempotency_key,request_fingerprint,created_engine_revision,created_by_actor
  ) values (
    p_idea_id,p_action_type,p_acquisition_path,
    coalesce(p_target_requirement_ids,array[]::text[]),p_target_requirement_fingerprints,
    coalesce(p_target_artifact_keys,array[]::text[]),
    md5(jsonb_build_object(
      'requirements',to_jsonb(coalesce(p_target_requirement_ids,array[]::text[])),
      'requirement_fingerprints',p_target_requirement_fingerprints,
      'artifacts',to_jsonb(coalesce(p_target_artifact_keys,array[]::text[]))
    )::text),
    p_input_fingerprint,p_projection_fingerprint,'{}'::jsonb,p_provider,p_model,p_prompt_version,
    p_schema_version,p_tool_version,p_permission_scope,'queued',1,p_idempotency_key,v_fp,
    v_idea.engine_revision,'system'
  ) returning id into v_run_id;

  insert into public.audit_events(workspace_id,actor_id,event_type,entity_type,entity_id,payload)
  values(
    v_idea.workspace_id,null,'idea.action_run_created','idea_action_run',v_run_id,
    jsonb_build_object(
      'idea_id',p_idea_id,'action_type',p_action_type,'acquisition_path',p_acquisition_path,
      'requirement_target_count',coalesce(cardinality(p_target_requirement_ids),0),
      'artifact_target_count',coalesce(cardinality(p_target_artifact_keys),0),
      'engine_revision',v_idea.engine_revision,'research_boundary','v4-blueprint-guard-v0.4'
    )
  );

  return jsonb_build_object(
    'action_run_id',v_run_id,'status','queued','engine_revision',v_idea.engine_revision,
    'acquisition_path',p_acquisition_path,'idempotent',false
  );
end;
$function$;

revoke all on function public.create_action_run_v4(
  uuid,bigint,text,text,text[],jsonb,text[],text,text,jsonb,text,text,text,text,text,text
) from public,anon,authenticated;
grant execute on function public.create_action_run_v4(
  uuid,bigint,text,text,text[],jsonb,text[],text,text,jsonb,text,text,text,text,text,text
) to service_role;

-- Final creation guards:
-- - research-only WEB/AUDIT/CONN;
-- - explicit SITE_VITRINE@0.5 active requirement;
-- - target Requirement exists, ACTIVE and exact current basis;
-- - exact idempotency request fingerprint;
-- - G1 create_action_run_v3 untouched.
