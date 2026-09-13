-- 4b4c Idea Engine R3 System Action lifecycle and deterministic promotion

alter table public.idea_action_runs
  add column created_engine_revision bigint not null default 0 check (created_engine_revision >= 0),
  add column completed_engine_revision bigint null check (completed_engine_revision is null or completed_engine_revision >= 0),
  add column promoted_engine_revision bigint null check (promoted_engine_revision is null or promoted_engine_revision >= 0),
  add column projection_fingerprint text null,
  add column request_fingerprint text null,
  add column result_fingerprint text null,
  add column stale_reason text null,
  add column promoted_at timestamptz null;

alter table public.idea_requirement_states
  add column resolution_levels text[] not null default array[]::text[],
  add column authority_ok boolean not null default true;

create or replace function public.create_action_run_v1(
  p_idea_id uuid,
  p_expected_engine_revision bigint,
  p_action_type text,
  p_target_requirement_ids text[],
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
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_idea public.ideas;
  v_existing public.idea_action_runs;
  v_run_id uuid;
  v_fp text;
  v_kind text;
begin
  if p_action_type not in ('EXTRACT','RESEARCH','CALCULATE','CHALLENGE','COMPARE','GENERATE_CANDIDATE','RECOMMEND','MATERIALIZE','PREPARE_DECISION','PREPARE_PRESENTATION','REASSESS_DELTA') then raise exception 'INVALID_ACTION_TYPE'; end if;
  if coalesce(cardinality(p_target_requirement_ids),0)=0 and coalesce(cardinality(p_target_artifact_keys),0)=0 then raise exception 'ACTION_TARGET_REQUIRED'; end if;
  if nullif(btrim(p_input_fingerprint),'') is null then raise exception 'INPUT_FINGERPRINT_REQUIRED'; end if;
  if nullif(btrim(p_projection_fingerprint),'') is null then raise exception 'PROJECTION_FINGERPRINT_REQUIRED'; end if;
  if nullif(btrim(p_idempotency_key),'') is null then raise exception 'IDEMPOTENCY_KEY_REQUIRED'; end if;
  if p_permission_scope is null or jsonb_typeof(p_permission_scope)<>'object' then raise exception 'INVALID_PERMISSION_SCOPE'; end if;
  if p_permission_scope ? 'allowed_mutation_kinds' and jsonb_typeof(p_permission_scope->'allowed_mutation_kinds')<>'array' then raise exception 'INVALID_PERMISSION_SCOPE'; end if;
  for v_kind in select jsonb_array_elements_text(coalesce(p_permission_scope->'allowed_mutation_kinds','[]'::jsonb)) loop
    if v_kind not in ('INFORMATION_ITEM','LEDGER_ENTRY') then raise exception 'UNSUPPORTED_MUTATION_PERMISSION'; end if;
  end loop;

  select * into v_idea from public.ideas where id=p_idea_id for update;
  if v_idea.id is null then raise exception 'IDEA_NOT_FOUND'; end if;
  if v_idea.blueprint_id is null or v_idea.blueprint_status<>'active' then raise exception 'IDEA_ENGINE_NOT_INITIALIZED'; end if;

  v_fp := md5(jsonb_build_object(
    'action_type',p_action_type,
    'target_requirement_ids',to_jsonb(coalesce(p_target_requirement_ids,array[]::text[])),
    'target_artifact_keys',to_jsonb(coalesce(p_target_artifact_keys,array[]::text[])),
    'input_fingerprint',p_input_fingerprint,
    'projection_fingerprint',p_projection_fingerprint,
    'permission_scope',p_permission_scope,
    'provider',p_provider,'model',p_model,'prompt_version',p_prompt_version,'schema_version',p_schema_version,'tool_version',p_tool_version
  )::text);

  select * into v_existing from public.idea_action_runs where idea_id=p_idea_id and idempotency_key=p_idempotency_key;
  if v_existing.id is not null then
    if v_existing.request_fingerprint is distinct from v_fp then raise exception 'IDEMPOTENCY_KEY_REUSE'; end if;
    return jsonb_build_object('action_run_id',v_existing.id,'status',v_existing.status,'engine_revision',v_idea.engine_revision,'idempotent',true);
  end if;

  if v_idea.engine_revision<>p_expected_engine_revision then raise exception 'STALE_ENGINE'; end if;

  insert into public.idea_action_runs(
    idea_id,action_type,target_requirement_ids,target_artifact_keys,target_signature,input_fingerprint,projection_fingerprint,
    input_refs,provider,model,prompt_version,schema_version,tool_version,permission_scope,status,attempt,idempotency_key,
    request_fingerprint,created_engine_revision,created_by_actor
  ) values (
    p_idea_id,p_action_type,coalesce(p_target_requirement_ids,array[]::text[]),coalesce(p_target_artifact_keys,array[]::text[]),
    md5(jsonb_build_object('requirements',to_jsonb(coalesce(p_target_requirement_ids,array[]::text[])),'artifacts',to_jsonb(coalesce(p_target_artifact_keys,array[]::text[])))::text),
    p_input_fingerprint,p_projection_fingerprint,'{}'::jsonb,p_provider,p_model,p_prompt_version,p_schema_version,p_tool_version,p_permission_scope,'queued',1,p_idempotency_key,
    v_fp,v_idea.engine_revision,'system'
  ) returning id into v_run_id;

  insert into public.audit_events(workspace_id,actor_id,event_type,entity_type,entity_id,payload)
  values(v_idea.workspace_id,null,'idea.action_run_created','idea_action_run',v_run_id,
         jsonb_build_object('idea_id',p_idea_id,'action_type',p_action_type,'requirement_target_count',coalesce(cardinality(p_target_requirement_ids),0),'artifact_target_count',coalesce(cardinality(p_target_artifact_keys),0),'engine_revision',v_idea.engine_revision));

  return jsonb_build_object('action_run_id',v_run_id,'status','queued','engine_revision',v_idea.engine_revision,'idempotent',false);
end;
$$;

create or replace function public.start_action_run_v1(
  p_action_run_id uuid,
  p_current_input_fingerprint text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_run public.idea_action_runs;
  v_revision bigint;
begin
  select * into v_run from public.idea_action_runs where id=p_action_run_id for update;
  if v_run.id is null then raise exception 'ACTION_RUN_NOT_FOUND'; end if;
  select engine_revision into v_revision from public.ideas where id=v_run.idea_id for update;

  if v_run.status='running' then return jsonb_build_object('action_run_id',v_run.id,'status','running','idempotent',true); end if;
  if v_run.status<>'queued' then raise exception 'ACTION_RUN_NOT_STARTABLE'; end if;

  if v_run.input_fingerprint is distinct from p_current_input_fingerprint then
    update public.idea_action_runs set status='stale',stale_reason='INPUT_CHANGED_BEFORE_START',completed_at=now(),completed_engine_revision=v_revision where id=v_run.id;
    return jsonb_build_object('action_run_id',v_run.id,'status','stale','idempotent',false);
  end if;

  update public.idea_action_runs set status='running',started_at=coalesce(started_at,now()) where id=v_run.id;
  return jsonb_build_object('action_run_id',v_run.id,'status','running','idempotent',false);
end;
$$;

create or replace function public.complete_action_run_v1(
  p_action_run_id uuid,
  p_current_input_fingerprint text,
  p_result jsonb,
  p_proposed_mutations jsonb,
  p_latency_ms integer,
  p_cost_metadata jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_run public.idea_action_runs;
  v_revision bigint;
  v_result_fp text;
begin
  if p_result is null then p_result := '{}'::jsonb; end if;
  if p_proposed_mutations is null or jsonb_typeof(p_proposed_mutations)<>'array' then raise exception 'PROPOSED_MUTATIONS_MUST_BE_ARRAY'; end if;
  if p_latency_ms is not null and p_latency_ms<0 then raise exception 'INVALID_LATENCY'; end if;
  if p_cost_metadata is null or jsonb_typeof(p_cost_metadata)<>'object' then raise exception 'INVALID_COST_METADATA'; end if;

  v_result_fp := md5(jsonb_build_object('result',p_result,'proposed_mutations',p_proposed_mutations)::text);
  select * into v_run from public.idea_action_runs where id=p_action_run_id for update;
  if v_run.id is null then raise exception 'ACTION_RUN_NOT_FOUND'; end if;
  select engine_revision into v_revision from public.ideas where id=v_run.idea_id for update;

  if v_run.status in ('succeeded','stale') and v_run.result_fingerprint=v_result_fp then
    return jsonb_build_object('action_run_id',v_run.id,'status',v_run.status,'promotable',v_run.status='succeeded' and v_run.promoted_at is null,'idempotent',true);
  end if;
  if v_run.status in ('succeeded','stale','failed','cancelled') then raise exception 'ACTION_RUN_ALREADY_COMPLETED'; end if;
  if v_run.status<>'running' then raise exception 'ACTION_RUN_NOT_RUNNING'; end if;

  if v_run.input_fingerprint is distinct from p_current_input_fingerprint then
    update public.idea_action_runs
    set status='stale',result=p_result,proposed_mutations=p_proposed_mutations,result_fingerprint=v_result_fp,
        stale_reason='INPUT_CHANGED_DURING_RUN',latency_ms=p_latency_ms,cost_metadata=p_cost_metadata,
        completed_at=now(),completed_engine_revision=v_revision
    where id=v_run.id;
    return jsonb_build_object('action_run_id',v_run.id,'status','stale','promotable',false,'idempotent',false);
  end if;

  update public.idea_action_runs
  set status='succeeded',result=p_result,proposed_mutations=p_proposed_mutations,result_fingerprint=v_result_fp,
      latency_ms=p_latency_ms,cost_metadata=p_cost_metadata,completed_at=now(),completed_engine_revision=v_revision
  where id=v_run.id;

  return jsonb_build_object('action_run_id',v_run.id,'status','succeeded','promotable',true,'idempotent',false);
end;
$$;

create or replace function public.fail_action_run_v1(
  p_action_run_id uuid,
  p_error_code text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_run public.idea_action_runs;
  v_revision bigint;
begin
  if nullif(btrim(p_error_code),'') is null then raise exception 'ERROR_CODE_REQUIRED'; end if;
  select * into v_run from public.idea_action_runs where id=p_action_run_id for update;
  if v_run.id is null then raise exception 'ACTION_RUN_NOT_FOUND'; end if;
  select engine_revision into v_revision from public.ideas where id=v_run.idea_id;
  if v_run.status='failed' and v_run.error_code=p_error_code then return jsonb_build_object('action_run_id',v_run.id,'status','failed','idempotent',true); end if;
  if v_run.status not in ('queued','running') then raise exception 'ACTION_RUN_NOT_FAILABLE'; end if;
  update public.idea_action_runs set status='failed',error_code=p_error_code,completed_at=now(),completed_engine_revision=v_revision where id=v_run.id;
  return jsonb_build_object('action_run_id',v_run.id,'status','failed','idempotent',false);
end;
$$;

create or replace function public.mark_action_run_stale_v1(
  p_action_run_id uuid,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_run public.idea_action_runs;
  v_revision bigint;
begin
  if nullif(btrim(p_reason),'') is null then raise exception 'STALE_REASON_REQUIRED'; end if;
  select * into v_run from public.idea_action_runs where id=p_action_run_id for update;
  if v_run.id is null then raise exception 'ACTION_RUN_NOT_FOUND'; end if;
  if v_run.promoted_at is not null then raise exception 'PROMOTED_RUN_CANNOT_BE_RETIRED'; end if;
  if v_run.status='stale' then return jsonb_build_object('action_run_id',v_run.id,'status','stale','idempotent',true); end if;
  if v_run.status not in ('queued','running','succeeded') then raise exception 'ACTION_RUN_NOT_STALEABLE'; end if;
  select engine_revision into v_revision from public.ideas where id=v_run.idea_id;
  update public.idea_action_runs set status='stale',stale_reason=p_reason,completed_at=coalesce(completed_at,now()),completed_engine_revision=coalesce(completed_engine_revision,v_revision) where id=v_run.id;
  return jsonb_build_object('action_run_id',v_run.id,'status','stale','idempotent',false);
end;
$$;

create or replace function public.materialize_requirement_states_v1(
  p_idea_id uuid,
  p_expected_engine_revision bigint,
  p_blueprint_version text,
  p_states jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_idea public.ideas;
  v_state jsonb;
  v_count integer := 0;
  v_levels text[];
begin
  if p_states is null or jsonb_typeof(p_states)<>'array' then raise exception 'REQUIREMENT_STATES_MUST_BE_ARRAY'; end if;
  if jsonb_array_length(p_states)>200 then raise exception 'TOO_MANY_REQUIREMENT_STATES'; end if;
  select * into v_idea from public.ideas where id=p_idea_id for update;
  if v_idea.id is null then raise exception 'IDEA_NOT_FOUND'; end if;
  if v_idea.engine_revision<>p_expected_engine_revision then raise exception 'STALE_ENGINE'; end if;
  if v_idea.blueprint_version is distinct from p_blueprint_version then raise exception 'BLUEPRINT_VERSION_MISMATCH'; end if;

  delete from public.idea_requirement_states where idea_id=p_idea_id;
  for v_state in select value from jsonb_array_elements(p_states) loop
    if nullif(btrim(v_state->>'requirement_id'),'') is null then raise exception 'REQUIREMENT_ID_REQUIRED'; end if;
    if (v_state->>'applicability_state') not in ('ACTIVE','NOT_RELEVANT') then raise exception 'INVALID_APPLICABILITY_STATE'; end if;
    if (v_state->>'resolution_state') not in ('UNRESOLVED','RESOLVED','ACCEPTED_UNKNOWN','STALE','CONFLICTED','NOT_RELEVANT') then raise exception 'INVALID_RESOLUTION_STATE'; end if;
    if (v_state->>'lock_state') not in ('WORKING','AI_PROPOSED','VALIDATED_CURRENT','LOCKED_FOR_DEPENDENTS','FROZEN_IN_DECISION_SNAPSHOT','APPROVED_FOR_PROJECT','FROZEN_FOR_BUILD','REVIEW_REQUIRED','STALE','SUPERSEDED','REJECTED') then raise exception 'INVALID_LOCK_STATE'; end if;
    if nullif(btrim(v_state->>'input_fingerprint'),'') is null then raise exception 'REQUIREMENT_FINGERPRINT_REQUIRED'; end if;
    if jsonb_typeof(coalesce(v_state->'resolution_refs','[]'::jsonb))<>'array' then raise exception 'INVALID_RESOLUTION_REFS'; end if;
    if jsonb_typeof(coalesce(v_state->'resolution_levels','[]'::jsonb))<>'array' then raise exception 'INVALID_RESOLUTION_LEVELS'; end if;
    v_levels := array(select jsonb_array_elements_text(coalesce(v_state->'resolution_levels','[]'::jsonb)));
    insert into public.idea_requirement_states(
      idea_id,requirement_id,blueprint_version,applicability_state,resolution_state,criticality_current,lock_state,
      resolution_refs,input_fingerprint,last_evaluated_at,stale_reason,version,evaluated_engine_revision,resolution_levels,authority_ok
    ) values (
      p_idea_id,v_state->>'requirement_id',p_blueprint_version,v_state->>'applicability_state',v_state->>'resolution_state',nullif(v_state->>'criticality_current',''),v_state->>'lock_state',
      coalesce(v_state->'resolution_refs','[]'::jsonb),v_state->>'input_fingerprint',now(),nullif(v_state->>'stale_reason',''),1,p_expected_engine_revision,v_levels,coalesce((v_state->>'authority_ok')::boolean,true)
    );
    v_count := v_count+1;
  end loop;
  return jsonb_build_object('idea_id',p_idea_id,'engine_revision',p_expected_engine_revision,'materialized_count',v_count);
end;
$$;

create or replace function public.promote_action_result_v1(
  p_action_run_id uuid,
  p_expected_engine_revision bigint,
  p_current_input_fingerprint text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_run public.idea_action_runs;
  v_idea public.ideas;
  v_mut jsonb;
  v_kind text;
  v_allowed boolean;
  v_index integer := 0;
  v_info_count integer := 0;
  v_ledger_count integer := 0;
  v_source_id uuid;
  v_target_requirement text;
  v_provenance text;
  v_entry_type text;
  v_revision bigint;
begin
  select * into v_run from public.idea_action_runs where id=p_action_run_id for update;
  if v_run.id is null then raise exception 'ACTION_RUN_NOT_FOUND'; end if;
  select * into v_idea from public.ideas where id=v_run.idea_id for update;

  if v_run.promoted_at is not null then
    return jsonb_build_object('action_run_id',v_run.id,'promoted',true,'engine_revision',v_run.promoted_engine_revision,'idempotent',true);
  end if;
  if v_run.status<>'succeeded' then raise exception 'ACTION_RUN_NOT_PROMOTABLE'; end if;
  if v_idea.engine_revision<>p_expected_engine_revision then raise exception 'STALE_ENGINE'; end if;
  if v_run.input_fingerprint is distinct from p_current_input_fingerprint then
    update public.idea_action_runs set status='stale',stale_reason='INPUT_CHANGED_BEFORE_PROMOTION' where id=v_run.id;
    return jsonb_build_object('action_run_id',v_run.id,'promoted',false,'status','stale','engine_revision',v_idea.engine_revision,'idempotent',false);
  end if;
  if jsonb_array_length(v_run.proposed_mutations)=0 then raise exception 'NO_PROPOSED_MUTATIONS'; end if;

  for v_mut in select value from jsonb_array_elements(v_run.proposed_mutations) loop
    v_index := v_index+1;
    v_kind := v_mut->>'kind';
    select exists(select 1 from jsonb_array_elements_text(coalesce(v_run.permission_scope->'allowed_mutation_kinds','[]'::jsonb)) x where x=v_kind) into v_allowed;
    if not v_allowed then raise exception 'MUTATION_KIND_NOT_PERMITTED'; end if;

    if v_kind='INFORMATION_ITEM' then
      v_provenance := v_mut->>'provenance_type';
      if v_provenance not in ('SOURCE_EXTRACTED','CONNECTOR_EXTRACTED','WEB_RESEARCH','SYSTEM_CALCULATED','AI_INFERRED','AI_RECOMMENDED') then raise exception 'INVALID_MACHINE_PROVENANCE'; end if;
      if (v_mut->>'item_type') not in ('FACT','PREFERENCE','CONSTRAINT','ASSUMPTION','OPTION','EVIDENCE','RISK','QUESTION','DECISION_INPUT') then raise exception 'INVALID_INFORMATION_TYPE'; end if;
      if not (v_mut ? 'value') then raise exception 'MUTATION_VALUE_REQUIRED'; end if;
      if coalesce(v_mut->>'confidence_class','UNKNOWN') not in ('DIRECT','HIGH','MEDIUM','LOW','UNKNOWN') then raise exception 'INVALID_CONFIDENCE_CLASS'; end if;
      if coalesce(v_mut->>'sensitivity','internal') not in ('public','internal','personal','sensitive') then raise exception 'INVALID_SENSITIVITY'; end if;
      v_source_id := nullif(v_mut->>'source_id','')::uuid;
      if v_source_id is not null and not exists(select 1 from public.idea_sources s where s.id=v_source_id and s.idea_id=v_run.idea_id and s.status<>'superseded') then raise exception 'INVALID_SOURCE'; end if;
      v_target_requirement := nullif(btrim(v_mut->>'target_requirement_id'),'');

      insert into public.idea_information_items(
        idea_id,semantic_key,item_type,value_jsonb,provenance_type,source_id,source_locator,confidence_class,state,sensitivity,
        valid_from,created_by_action_run_id,created_by,idempotency_key,request_fingerprint
      ) values (
        v_run.idea_id,nullif(btrim(v_mut->>'semantic_key'),''),v_mut->>'item_type',v_mut->'value',v_provenance,v_source_id,nullif(v_mut->>'source_locator',''),
        coalesce(v_mut->>'confidence_class','UNKNOWN'),'ACTIVE',coalesce(v_mut->>'sensitivity','internal'),now(),v_run.id,null,
        'action:'||v_run.id::text||':'||v_index::text,md5(v_mut::text)
      ) on conflict (idea_id,idempotency_key) do nothing;
      v_info_count := v_info_count+1;

      if v_target_requirement is not null then
        update public.idea_requirement_states set resolution_state='STALE',stale_reason='ACTION_RESULT_PROMOTED'
        where idea_id=v_run.idea_id and requirement_id=v_target_requirement and resolution_state<>'NOT_RELEVANT';
      end if;

    elsif v_kind='LEDGER_ENTRY' then
      v_entry_type := v_mut->>'entry_type';
      if v_entry_type not in ('ASSUMPTION','RISK_UNKNOWN','RECOMMENDATION') then raise exception 'INVALID_MACHINE_LEDGER_TYPE'; end if;
      if jsonb_typeof(coalesce(v_mut->'target_refs','[]'::jsonb))<>'array' then raise exception 'INVALID_TARGET_REFS'; end if;
      if jsonb_typeof(coalesce(v_mut->'source_refs','[]'::jsonb))<>'array' then raise exception 'INVALID_SOURCE_REFS'; end if;
      if jsonb_typeof(coalesce(v_mut->'payload','{}'::jsonb))<>'object' then raise exception 'INVALID_LEDGER_PAYLOAD'; end if;
      if coalesce(v_mut->>'materiality','LOCAL') not in ('COSMETIC','LOCAL','SUBSTANTIVE','CRITICAL') then raise exception 'INVALID_MATERIALITY'; end if;
      insert into public.idea_ledger_entries(idea_id,entry_type,target_refs,payload,state,materiality,source_refs,created_by,created_by_action_run_id)
      values(v_run.idea_id,v_entry_type,coalesce(v_mut->'target_refs','[]'::jsonb),coalesce(v_mut->'payload','{}'::jsonb),'open',coalesce(v_mut->>'materiality','LOCAL'),coalesce(v_mut->'source_refs','[]'::jsonb),null,v_run.id);
      v_ledger_count := v_ledger_count+1;
    else
      raise exception 'UNSUPPORTED_MUTATION_KIND';
    end if;
  end loop;

  update public.ideas set engine_revision=engine_revision+1 where id=v_run.idea_id returning engine_revision into v_revision;
  update public.idea_action_runs set promoted_at=now(),promoted_engine_revision=v_revision where id=v_run.id;

  insert into public.audit_events(workspace_id,actor_id,event_type,entity_type,entity_id,payload)
  values(v_idea.workspace_id,null,'idea.action_result_promoted','idea_action_run',v_run.id,
         jsonb_build_object('idea_id',v_run.idea_id,'action_type',v_run.action_type,'information_items_created',v_info_count,'ledger_entries_created',v_ledger_count,'revision_before',p_expected_engine_revision,'revision_after',v_revision));

  return jsonb_build_object('action_run_id',v_run.id,'promoted',true,'engine_revision',v_revision,'information_items_created',v_info_count,'ledger_entries_created',v_ledger_count,'idempotent',false);
end;
$$;

revoke all on function public.create_action_run_v1(uuid,bigint,text,text[],text[],text,text,jsonb,text,text,text,text,text,text) from public, anon, authenticated;
grant execute on function public.create_action_run_v1(uuid,bigint,text,text[],text[],text,text,jsonb,text,text,text,text,text,text) to service_role;
revoke all on function public.start_action_run_v1(uuid,text) from public, anon, authenticated;
grant execute on function public.start_action_run_v1(uuid,text) to service_role;
revoke all on function public.complete_action_run_v1(uuid,text,jsonb,jsonb,integer,jsonb) from public, anon, authenticated;
grant execute on function public.complete_action_run_v1(uuid,text,jsonb,jsonb,integer,jsonb) to service_role;
revoke all on function public.fail_action_run_v1(uuid,text) from public, anon, authenticated;
grant execute on function public.fail_action_run_v1(uuid,text) to service_role;
revoke all on function public.mark_action_run_stale_v1(uuid,text) from public, anon, authenticated;
grant execute on function public.mark_action_run_stale_v1(uuid,text) to service_role;
revoke all on function public.materialize_requirement_states_v1(uuid,bigint,text,jsonb) from public, anon, authenticated;
grant execute on function public.materialize_requirement_states_v1(uuid,bigint,text,jsonb) to service_role;
revoke all on function public.promote_action_result_v1(uuid,bigint,text) from public, anon, authenticated;
grant execute on function public.promote_action_result_v1(uuid,bigint,text) to service_role;
