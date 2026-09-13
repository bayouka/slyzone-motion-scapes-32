-- 4b4c / 2b2c — G2 atomic research promotion SQL candidate V0.2 hardening
-- Date: 2026-09-13
-- STATUS: DESIGN/ROLLBACK-TEST CANDIDATE ONLY — DO NOT APPLY AS A MIGRATION.
-- This file intentionally lives outside supabase/migrations/.
-- Test composition: V0.1 base candidate + this V0.2 hardening in ONE transaction, then ROLLBACK.
-- V0.2 narrows create_action_run_v4 and introduces promote_research_action_result_v2.
-- G1 create_action_run_v3 / promote_action_result_v1 remain untouched.

-- -----------------------------------------------------------------------------
-- 0. Private sensitivity ordering helper
-- -----------------------------------------------------------------------------

create or replace function app_private.idea_sensitivity_rank_v1(p_value text)
returns integer
language sql
immutable
set search_path=''
as $function$
  select case p_value
    when 'public' then 1
    when 'internal' then 2
    when 'personal' then 3
    when 'sensitive' then 4
    else null
  end
$function$;

revoke all on function app_private.idea_sensitivity_rank_v1(text)
from public,anon,authenticated;

-- -----------------------------------------------------------------------------
-- 1. Harden candidate Action Run V4
-- V4 is G2 research-specific. All non-research paths continue to use V3.
-- -----------------------------------------------------------------------------

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
  if v_idea.blueprint_id is null or v_idea.blueprint_status<>'active'
    then raise exception 'IDEA_ENGINE_NOT_INITIALIZED';
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
      'action_run_id',v_existing.id,
      'status',v_existing.status,
      'engine_revision',v_idea.engine_revision,
      'acquisition_path',v_existing.acquisition_path,
      'idempotent',true
    );
  end if;

  if v_idea.engine_revision<>p_expected_engine_revision then raise exception 'STALE_ENGINE'; end if;

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
      'engine_revision',v_idea.engine_revision,'research_boundary','v4'
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

-- -----------------------------------------------------------------------------
-- 2. Hardened atomic research promotion V2
-- -----------------------------------------------------------------------------

create or replace function public.promote_research_action_result_v2(
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
  v_mut jsonb;
  v_kind text;
  v_allowed boolean;
  v_source_key text;
  v_source_kind text;
  v_locator text;
  v_content_hash text;
  v_sensitivity text;
  v_existing_source public.idea_sources;
  v_source_id uuid;
  v_source_map jsonb := '{}'::jsonb;
  v_source_identity_map jsonb := '{}'::jsonb;
  v_source_identity text;
  v_source_count integer := 0;
  v_source_reused_count integer := 0;
  v_info_count integer := 0;
  v_ledger_count integer := 0;
  v_index integer := 0;
  v_provenance text;
  v_target_requirement text;
  v_levels text[];
  v_level text;
  v_confidence text;
  v_info_item_id uuid;
  v_entry_type text;
  v_revision bigint;
  v_old_rank integer;
  v_new_rank integer;
  v_staled_count integer := 0;
  v_staled_delta integer := 0;
  v_item_sensitivity text;
  v_item_rank integer;
  v_source_sensitivity text;
  v_source_rank integer;
  v_canonical_source_locator text;
  v_source_refs_resolved jsonb;
  v_ref jsonb;
  v_ref_key text;
  v_ref_source_id uuid;
  v_ref_key_count integer;
begin
  select * into v_run
  from public.idea_action_runs
  where id=p_action_run_id
  for update;

  if v_run.id is null then raise exception 'ACTION_RUN_NOT_FOUND'; end if;

  select * into v_idea
  from public.ideas
  where id=v_run.idea_id
  for update;

  if v_run.promoted_at is not null then
    return jsonb_build_object(
      'action_run_id',v_run.id,'promoted',true,
      'engine_revision',v_run.promoted_engine_revision,'idempotent',true
    );
  end if;

  if v_run.status<>'succeeded' then raise exception 'ACTION_RUN_NOT_PROMOTABLE'; end if;
  if v_run.acquisition_path not in ('WEB','AUDIT','CONN')
    then raise exception 'RESEARCH_PROMOTION_PATH_FORBIDDEN';
  end if;

  if v_idea.engine_revision<>v_run.created_engine_revision then
    update public.idea_action_runs
    set status='stale',stale_reason='IDEA_REVISION_CHANGED_BEFORE_RESEARCH_PROMOTION'
    where id=v_run.id;
    return jsonb_build_object(
      'action_run_id',v_run.id,'promoted',false,'status','stale',
      'engine_revision',v_idea.engine_revision,'idempotent',false
    );
  end if;

  if v_run.input_fingerprint is distinct from p_current_input_fingerprint then
    update public.idea_action_runs
    set status='stale',stale_reason='INPUT_CHANGED_BEFORE_RESEARCH_PROMOTION'
    where id=v_run.id;
    return jsonb_build_object(
      'action_run_id',v_run.id,'promoted',false,'status','stale',
      'engine_revision',v_idea.engine_revision,'idempotent',false
    );
  end if;

  foreach v_target in array coalesce(v_run.target_requirement_ids,array[]::text[]) loop
    select input_fingerprint into v_current_fp
    from public.idea_requirement_states
    where idea_id=v_run.idea_id and requirement_id=v_target;

    if nullif(v_current_fp,'') is null
       or v_current_fp is distinct from v_run.target_requirement_fingerprints->>v_target
    then
      update public.idea_action_runs
      set status='stale',stale_reason='TARGET_REQUIREMENT_CHANGED_BEFORE_PROMOTION'
      where id=v_run.id;
      return jsonb_build_object(
        'action_run_id',v_run.id,'promoted',false,'status','stale',
        'engine_revision',v_idea.engine_revision,'idempotent',false
      );
    end if;
  end loop;

  if jsonb_array_length(v_run.proposed_mutations)=0 then raise exception 'NO_PROPOSED_MUTATIONS'; end if;

  -- Pass 1: canonical Sources. No Idea revision bump occurs here.
  for v_mut in select value from jsonb_array_elements(v_run.proposed_mutations) loop
    v_kind := v_mut->>'kind';
    if v_kind<>'SOURCE' then continue; end if;

    select exists(
      select 1 from jsonb_array_elements_text(
        coalesce(v_run.permission_scope->'allowed_mutation_kinds','[]'::jsonb)
      ) x where x='SOURCE'
    ) into v_allowed;
    if not v_allowed then raise exception 'SOURCE_MUTATION_NOT_PERMITTED'; end if;

    v_source_key := nullif(btrim(v_mut->>'source_key'),'');
    v_source_kind := nullif(btrim(v_mut->>'source_kind'),'');
    v_locator := nullif(btrim(v_mut->>'locator'),'');
    v_content_hash := nullif(btrim(v_mut->>'content_hash'),'');
    v_sensitivity := coalesce(nullif(btrim(v_mut->>'sensitivity'),''),'internal');

    if v_source_key is null then raise exception 'SOURCE_KEY_REQUIRED'; end if;
    if v_source_map ? v_source_key then raise exception 'DUPLICATE_SOURCE_KEY'; end if;
    if v_source_kind is null then raise exception 'SOURCE_KIND_REQUIRED'; end if;
    if v_locator is null then raise exception 'SOURCE_LOCATOR_REQUIRED'; end if;
    if v_content_hash is null then raise exception 'SOURCE_CONTENT_HASH_REQUIRED'; end if;
    if app_private.idea_sensitivity_rank_v1(v_sensitivity) is null
      then raise exception 'INVALID_SENSITIVITY';
    end if;

    if v_run.acquisition_path='WEB' then
      if v_source_kind<>'url' then raise exception 'WEB_SOURCE_INVALID'; end if;
    elsif v_run.acquisition_path='CONN' then
      if v_source_kind<>'connector' then raise exception 'CONNECTOR_SOURCE_INVALID'; end if;
    elsif v_run.acquisition_path='AUDIT' then
      if v_source_kind not in ('url','document','image','system_observation')
        then raise exception 'AUDIT_SOURCE_INVALID';
      end if;
    end if;

    -- locator must already be normalized and security-validated by the executor.
    v_source_identity := md5(v_source_kind||E'\x1f'||v_locator);
    if v_source_identity_map ? v_source_identity
      then raise exception 'DUPLICATE_SOURCE_IDENTITY';
    end if;
    v_source_identity_map := v_source_identity_map || jsonb_build_object(v_source_identity,true);

    -- Serializes same Idea/source identity without imposing a production unique index yet.
    perform pg_advisory_xact_lock(
      hashtextextended(v_run.idea_id::text||E'\x1f'||v_source_kind||E'\x1f'||v_locator,0)
    );

    select * into v_existing_source
    from public.idea_sources
    where idea_id=v_run.idea_id
      and source_kind=v_source_kind
      and locator=v_locator
      and status<>'superseded'
    order by updated_at desc
    limit 1
    for update;

    if v_existing_source.id is null then
      insert into public.idea_sources(
        idea_id,source_kind,locator,title,content_hash,source_version,fetched_at,freshness_at,
        status,sensitivity,created_by,created_by_action_run_id,idempotency_key,request_fingerprint
      ) values (
        v_run.idea_id,v_source_kind,v_locator,nullif(btrim(v_mut->>'title'),''),v_content_hash,1,
        coalesce(nullif(v_mut->>'fetched_at','')::timestamptz,now()),
        nullif(v_mut->>'freshness_at','')::timestamptz,
        'ingested',v_sensitivity,null,v_run.id,
        'research-source:'||v_run.id::text||':'||v_source_key,
        md5(v_mut::text)
      ) returning id into v_source_id;
      v_source_count := v_source_count+1;
    else
      v_source_id := v_existing_source.id;
      v_source_reused_count := v_source_reused_count+1;
      v_old_rank := app_private.idea_sensitivity_rank_v1(v_existing_source.sensitivity);
      v_new_rank := app_private.idea_sensitivity_rank_v1(v_sensitivity);

      if v_existing_source.content_hash is distinct from v_content_hash then
        update public.idea_information_items
        set state='STALE'
        where source_id=v_existing_source.id and state='ACTIVE';
        get diagnostics v_staled_delta = row_count;
        v_staled_count := v_staled_count + v_staled_delta;

        update public.idea_sources
        set content_hash=v_content_hash,
            source_version=source_version+1,
            fetched_at=coalesce(nullif(v_mut->>'fetched_at','')::timestamptz,now()),
            freshness_at=nullif(v_mut->>'freshness_at','')::timestamptz,
            status='ingested',
            sensitivity=case when v_new_rank>v_old_rank then v_sensitivity else sensitivity end
        where id=v_existing_source.id;
      else
        update public.idea_sources
        set fetched_at=coalesce(nullif(v_mut->>'fetched_at','')::timestamptz,fetched_at),
            freshness_at=coalesce(nullif(v_mut->>'freshness_at','')::timestamptz,freshness_at),
            status='ingested',
            sensitivity=case when v_new_rank>v_old_rank then v_sensitivity else sensitivity end
        where id=v_existing_source.id;
      end if;
    end if;

    v_source_map := v_source_map || jsonb_build_object(v_source_key,v_source_id::text);
  end loop;

  if v_source_map='{}'::jsonb then raise exception 'RESEARCH_SOURCE_PROPOSAL_REQUIRED'; end if;

  -- Pass 2: observations and optional Ledger entries.
  for v_mut in select value from jsonb_array_elements(v_run.proposed_mutations) loop
    v_kind := v_mut->>'kind';
    if v_kind='SOURCE' then continue; end if;
    v_index := v_index+1;

    select exists(
      select 1 from jsonb_array_elements_text(
        coalesce(v_run.permission_scope->'allowed_mutation_kinds','[]'::jsonb)
      ) x where x=v_kind
    ) into v_allowed;
    if not v_allowed then raise exception 'MUTATION_KIND_NOT_PERMITTED'; end if;

    if v_kind='INFORMATION_ITEM' then
      v_provenance := v_mut->>'provenance_type';

      -- Research promotion is evidence-only. CALC / AI_H / AI_R remain separate Action Runs.
      if v_run.acquisition_path='WEB' and v_provenance<>'WEB_RESEARCH'
        then raise exception 'PROVENANCE_PATH_MISMATCH';
      elsif v_run.acquisition_path='CONN' and v_provenance<>'CONNECTOR_EXTRACTED'
        then raise exception 'PROVENANCE_PATH_MISMATCH';
      elsif v_run.acquisition_path='AUDIT' and v_provenance<>'SOURCE_EXTRACTED'
        then raise exception 'PROVENANCE_PATH_MISMATCH';
      end if;

      if (v_mut->>'item_type') not in (
        'FACT','PREFERENCE','CONSTRAINT','ASSUMPTION','OPTION','EVIDENCE','RISK','QUESTION','DECISION_INPUT'
      ) then raise exception 'INVALID_INFORMATION_TYPE'; end if;
      if not (v_mut ? 'value') then raise exception 'MUTATION_VALUE_REQUIRED'; end if;

      v_confidence := coalesce(v_mut->>'confidence_class','UNKNOWN');
      if v_confidence not in ('DIRECT','HIGH','MEDIUM','LOW','UNKNOWN')
        then raise exception 'INVALID_CONFIDENCE_CLASS';
      end if;

      v_target_requirement := nullif(btrim(v_mut->>'target_requirement_id'),'');
      if v_target_requirement is null
         or not (v_target_requirement=any(v_run.target_requirement_ids))
        then raise exception 'MUTATION_TARGET_NOT_DECLARED';
      end if;

      if jsonb_typeof(coalesce(v_mut->'resolution_levels','[]'::jsonb))<>'array'
        then raise exception 'INVALID_RESOLUTION_LEVELS';
      end if;
      v_levels := array(select jsonb_array_elements_text(coalesce(v_mut->'resolution_levels','[]'::jsonb)));
      if cardinality(v_levels)=0 then raise exception 'RESOLUTION_LEVELS_REQUIRED_FOR_TARGET'; end if;
      foreach v_level in array v_levels loop
        if v_level not in ('SOURCE_BACKED','OBSERVED')
          then raise exception 'PROVENANCE_LEVEL_MISMATCH';
        end if;
      end loop;

      v_source_key := nullif(btrim(v_mut->>'source_key'),'');
      if v_source_key is null then raise exception 'SOURCE_KEY_REQUIRED_FOR_RESEARCH_OBSERVATION'; end if;
      if v_mut ? 'source_id' then raise exception 'DIRECT_SOURCE_ID_FORBIDDEN'; end if;
      v_source_id := nullif(v_source_map->>v_source_key,'')::uuid;
      if v_source_id is null then raise exception 'UNKNOWN_SOURCE_KEY'; end if;

      select s.sensitivity,s.locator into v_source_sensitivity,v_canonical_source_locator
      from public.idea_sources s
      where s.id=v_source_id and s.idea_id=v_run.idea_id
        and s.status='ingested' and nullif(s.content_hash,'') is not null;
      if v_source_sensitivity is null then raise exception 'RESEARCH_SOURCE_NOT_CURRENT'; end if;

      if v_run.acquisition_path='WEB' and not exists(
        select 1 from public.idea_sources s
        where s.id=v_source_id and s.idea_id=v_run.idea_id and s.source_kind='url' and s.status='ingested'
      ) then raise exception 'WEB_SOURCE_NOT_CURRENT'; end if;
      if v_run.acquisition_path='CONN' and not exists(
        select 1 from public.idea_sources s
        where s.id=v_source_id and s.idea_id=v_run.idea_id and s.source_kind='connector' and s.status='ingested'
      ) then raise exception 'CONNECTOR_SOURCE_NOT_CURRENT'; end if;

      v_item_sensitivity := coalesce(nullif(btrim(v_mut->>'sensitivity'),''),'internal');
      v_item_rank := app_private.idea_sensitivity_rank_v1(v_item_sensitivity);
      v_source_rank := app_private.idea_sensitivity_rank_v1(v_source_sensitivity);
      if v_item_rank is null then raise exception 'INVALID_SENSITIVITY'; end if;
      -- Monotonic confidentiality: automatically elevate observation to Source sensitivity.
      if v_item_rank<v_source_rank then v_item_sensitivity := v_source_sensitivity; end if;

      insert into public.idea_information_items(
        idea_id,semantic_key,item_type,value_jsonb,provenance_type,source_id,source_locator,
        confidence_class,state,sensitivity,valid_from,created_by_action_run_id,created_by,
        idempotency_key,request_fingerprint
      ) values (
        v_run.idea_id,nullif(btrim(v_mut->>'semantic_key'),''),v_mut->>'item_type',v_mut->'value',
        v_provenance,v_source_id,v_canonical_source_locator,v_confidence,'ACTIVE',
        v_item_sensitivity,now(),v_run.id,null,
        'research-action:'||v_run.id::text||':'||v_index::text,md5(v_mut::text)
      ) returning id into v_info_item_id;

      insert into public.idea_information_requirement_refs(
        idea_id,information_item_id,requirement_id,relation_kind,resolution_levels,created_by_action_run_id
      ) values (
        v_run.idea_id,v_info_item_id,v_target_requirement,'SUPPORTS',v_levels,v_run.id
      );

      update public.idea_requirement_states
      set resolution_state='STALE',stale_reason='RESEARCH_ACTION_RESULT_PROMOTED'
      where idea_id=v_run.idea_id
        and requirement_id=v_target_requirement
        and resolution_state<>'NOT_RELEVANT';

      v_info_count := v_info_count+1;

    elsif v_kind='LEDGER_ENTRY' then
      v_entry_type := v_mut->>'entry_type';
      if v_entry_type not in ('ASSUMPTION','RISK_UNKNOWN','RECOMMENDATION')
        then raise exception 'INVALID_MACHINE_LEDGER_TYPE';
      end if;
      if jsonb_typeof(coalesce(v_mut->'target_refs','[]'::jsonb))<>'array'
        then raise exception 'INVALID_TARGET_REFS';
      end if;
      if jsonb_typeof(coalesce(v_mut->'source_refs','[]'::jsonb))<>'array'
        then raise exception 'INVALID_SOURCE_REFS';
      end if;
      if jsonb_typeof(coalesce(v_mut->'payload','{}'::jsonb))<>'object'
        then raise exception 'INVALID_LEDGER_PAYLOAD';
      end if;
      if coalesce(v_mut->>'materiality','LOCAL') not in ('COSMETIC','LOCAL','SUBSTANTIVE','CRITICAL')
        then raise exception 'INVALID_MATERIALITY';
      end if;

      -- Direct source UUIDs are forbidden. Every source ref must be a run-local source_key alias.
      v_source_refs_resolved := '[]'::jsonb;
      for v_ref in select value from jsonb_array_elements(coalesce(v_mut->'source_refs','[]'::jsonb)) loop
        if jsonb_typeof(v_ref)<>'object' then raise exception 'INVALID_LEDGER_SOURCE_REF'; end if;
        select count(*) into v_ref_key_count from jsonb_object_keys(v_ref);
        if v_ref_key_count<>1 or not (v_ref ? 'source_key')
          then raise exception 'LEDGER_SOURCE_ALIAS_REQUIRED';
        end if;
        v_ref_key := nullif(btrim(v_ref->>'source_key'),'');
        if v_ref_key is null then raise exception 'LEDGER_SOURCE_ALIAS_REQUIRED'; end if;
        v_ref_source_id := nullif(v_source_map->>v_ref_key,'')::uuid;
        if v_ref_source_id is null then raise exception 'UNKNOWN_SOURCE_KEY'; end if;
        if not exists(
          select 1 from public.idea_sources s
          where s.id=v_ref_source_id and s.idea_id=v_run.idea_id and s.status='ingested'
        ) then raise exception 'LEDGER_SOURCE_NOT_CURRENT'; end if;
        v_source_refs_resolved := v_source_refs_resolved ||
          jsonb_build_array(jsonb_build_object('source_id',v_ref_source_id));
      end loop;

      insert into public.idea_ledger_entries(
        idea_id,entry_type,target_refs,payload,state,materiality,source_refs,
        created_by,created_by_action_run_id
      ) values (
        v_run.idea_id,v_entry_type,coalesce(v_mut->'target_refs','[]'::jsonb),
        coalesce(v_mut->'payload','{}'::jsonb),'open',coalesce(v_mut->>'materiality','LOCAL'),
        v_source_refs_resolved,null,v_run.id
      );
      v_ledger_count := v_ledger_count+1;
    else
      raise exception 'UNSUPPORTED_MUTATION_KIND';
    end if;
  end loop;

  if v_info_count=0 then raise exception 'RESEARCH_OBSERVATION_REQUIRED'; end if;

  update public.ideas
  set engine_revision=engine_revision+1
  where id=v_run.idea_id
  returning engine_revision into v_revision;

  update public.idea_action_runs
  set promoted_at=now(),promoted_engine_revision=v_revision
  where id=v_run.id;

  insert into public.audit_events(workspace_id,actor_id,event_type,entity_type,entity_id,payload)
  values(
    v_idea.workspace_id,null,'idea.research_action_result_promoted','idea_action_run',v_run.id,
    jsonb_build_object(
      'idea_id',v_run.idea_id,
      'acquisition_path',v_run.acquisition_path,
      'sources_created',v_source_count,
      'sources_reused',v_source_reused_count,
      'information_items_created',v_info_count,
      'ledger_entries_created',v_ledger_count,
      'prior_source_items_staled',v_staled_count,
      'revision_before',v_run.created_engine_revision,
      'revision_after',v_revision,
      'promotion_contract','atomic-research-v2'
    )
  );

  return jsonb_build_object(
    'action_run_id',v_run.id,'promoted',true,'engine_revision',v_revision,
    'sources_created',v_source_count,'sources_reused',v_source_reused_count,
    'information_items_created',v_info_count,'ledger_entries_created',v_ledger_count,
    'staled_information_items',v_staled_count,'idempotent',false
  );
end;
$function$;

revoke all on function public.promote_research_action_result_v2(uuid,text)
from public,anon,authenticated;
grant execute on function public.promote_research_action_result_v2(uuid,text) to service_role;

-- -----------------------------------------------------------------------------
-- V0.2 hardening decisions
-- -----------------------------------------------------------------------------
-- 1. stale counters are cumulative across all refreshed Sources;
-- 2. Information Item sensitivity is max(proposed sensitivity, canonical Source sensitivity);
-- 3. Ledger source_refs accept run-local source_key aliases only and are server-resolved;
-- 4. Action Run V4 is research-only (WEB/AUDIT/CONN); all other paths stay on V3;
-- 5. Research promotion is evidence-only: path/provenance must match exactly;
-- 6. every proposed Source requires a non-empty normalized locator;
-- 7. duplicate source identity within one run is rejected;
-- 8. an advisory xact lock serializes concurrent promotions of the same Idea/source identity;
-- 9. client-provided source_id/source_locator cannot override canonical source linkage;
-- 10. at least one Source and one Information Item must be promoted by a research run.
-- -----------------------------------------------------------------------------
