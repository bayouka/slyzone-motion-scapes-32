alter table public.idea_action_runs
  add column if not exists acquisition_path text;

alter table public.idea_action_runs
  drop constraint if exists idea_action_runs_acquisition_path_check;
alter table public.idea_action_runs
  add constraint idea_action_runs_acquisition_path_check
  check (acquisition_path is null or acquisition_path in ('MEM','RAW','SRC','AUDIT','CONN','WEB','CALC','AI_H','AI_R'));

alter table public.idea_action_runs
  drop constraint if exists idea_action_runs_action_path_consistency_v2;
alter table public.idea_action_runs
  add constraint idea_action_runs_action_path_consistency_v2
  check (
    acquisition_path is null or
    (acquisition_path='MEM' and action_type='REUSE_MEMORY') or
    (acquisition_path='RAW' and action_type='EXTRACT_RAW') or
    (acquisition_path='SRC' and action_type='EXTRACT_SOURCE') or
    (acquisition_path='AUDIT' and action_type='AUDIT') or
    (acquisition_path='CONN' and action_type='FETCH_CONNECTED') or
    (acquisition_path='WEB' and action_type='RESEARCH_WEB') or
    (acquisition_path='CALC' and action_type='CALCULATE') or
    (acquisition_path='AI_H' and action_type='INFER_HYPOTHESIS') or
    (acquisition_path='AI_R' and action_type='GENERATE_RECOMMENDATION')
  );

create index if not exists idea_action_runs_acquisition_lookup_v1
  on public.idea_action_runs(idea_id,acquisition_path,status,updated_at desc)
  where acquisition_path is not null;

create table if not exists public.idea_information_requirement_refs (
  idea_id uuid not null references public.ideas(id) on delete cascade,
  information_item_id uuid not null references public.idea_information_items(id) on delete cascade,
  requirement_id text not null,
  relation_kind text not null default 'SUPPORTS' check (relation_kind in ('SUPPORTS','RESOLVES','CONFLICTS')),
  created_by_action_run_id uuid references public.idea_action_runs(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key(information_item_id,requirement_id,relation_kind)
);

create index if not exists idea_information_requirement_refs_lookup_v1
  on public.idea_information_requirement_refs(idea_id,requirement_id,created_at desc);

alter table public.idea_information_requirement_refs enable row level security;

drop policy if exists idea_information_requirement_refs_select_v1 on public.idea_information_requirement_refs;
create policy idea_information_requirement_refs_select_v1
  on public.idea_information_requirement_refs
  for select to authenticated
  using (app_private.can_access_idea(idea_id));

revoke all on public.idea_information_requirement_refs from public, anon, authenticated;
grant select on public.idea_information_requirement_refs to authenticated;
grant all on public.idea_information_requirement_refs to service_role;

create or replace function app_private.validate_information_requirement_ref_v1()
returns trigger
language plpgsql
security definer
set search_path=''
as $function$
declare
  v_item_idea uuid;
  v_run_idea uuid;
begin
  select idea_id into v_item_idea from public.idea_information_items where id=new.information_item_id;
  if v_item_idea is null then raise exception 'INFORMATION_ITEM_NOT_FOUND'; end if;
  if v_item_idea<>new.idea_id then raise exception 'INFORMATION_REQUIREMENT_IDEA_MISMATCH'; end if;
  if new.created_by_action_run_id is not null then
    select idea_id into v_run_idea from public.idea_action_runs where id=new.created_by_action_run_id;
    if v_run_idea is null or v_run_idea<>new.idea_id then raise exception 'INFORMATION_REQUIREMENT_ACTION_MISMATCH'; end if;
  end if;
  return new;
end;
$function$;

revoke all on function app_private.validate_information_requirement_ref_v1() from public, anon, authenticated;

drop trigger if exists idea_information_requirement_refs_validate_v1 on public.idea_information_requirement_refs;
create trigger idea_information_requirement_refs_validate_v1
before insert or update on public.idea_information_requirement_refs
for each row execute function app_private.validate_information_requirement_ref_v1();

create or replace function public.create_action_run_v2(
  p_idea_id uuid,
  p_expected_engine_revision bigint,
  p_action_type text,
  p_acquisition_path text,
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
begin
  v_expected_action := case p_acquisition_path
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
  if v_expected_action is null then raise exception 'INVALID_ACQUISITION_PATH'; end if;
  if p_action_type is distinct from v_expected_action then raise exception 'ACTION_PATH_MISMATCH'; end if;
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
    'action_type',p_action_type,'acquisition_path',p_acquisition_path,
    'target_requirement_ids',to_jsonb(coalesce(p_target_requirement_ids,array[]::text[])),
    'target_artifact_keys',to_jsonb(coalesce(p_target_artifact_keys,array[]::text[])),
    'input_fingerprint',p_input_fingerprint,'projection_fingerprint',p_projection_fingerprint,
    'permission_scope',p_permission_scope,'provider',p_provider,'model',p_model,
    'prompt_version',p_prompt_version,'schema_version',p_schema_version,'tool_version',p_tool_version
  )::text);

  select * into v_existing from public.idea_action_runs where idea_id=p_idea_id and idempotency_key=p_idempotency_key;
  if v_existing.id is not null then
    if v_existing.request_fingerprint is distinct from v_fp then raise exception 'IDEMPOTENCY_KEY_REUSE'; end if;
    return jsonb_build_object('action_run_id',v_existing.id,'status',v_existing.status,'engine_revision',v_idea.engine_revision,'acquisition_path',v_existing.acquisition_path,'idempotent',true);
  end if;

  if v_idea.engine_revision<>p_expected_engine_revision then raise exception 'STALE_ENGINE'; end if;

  insert into public.idea_action_runs(
    idea_id,action_type,acquisition_path,target_requirement_ids,target_artifact_keys,target_signature,input_fingerprint,projection_fingerprint,
    input_refs,provider,model,prompt_version,schema_version,tool_version,permission_scope,status,attempt,idempotency_key,
    request_fingerprint,created_engine_revision,created_by_actor
  ) values (
    p_idea_id,p_action_type,p_acquisition_path,coalesce(p_target_requirement_ids,array[]::text[]),coalesce(p_target_artifact_keys,array[]::text[]),
    md5(jsonb_build_object('requirements',to_jsonb(coalesce(p_target_requirement_ids,array[]::text[])),'artifacts',to_jsonb(coalesce(p_target_artifact_keys,array[]::text[])))::text),
    p_input_fingerprint,p_projection_fingerprint,'{}'::jsonb,p_provider,p_model,p_prompt_version,p_schema_version,p_tool_version,
    p_permission_scope,'queued',1,p_idempotency_key,v_fp,v_idea.engine_revision,'system'
  ) returning id into v_run_id;

  insert into public.audit_events(workspace_id,actor_id,event_type,entity_type,entity_id,payload)
  values(v_idea.workspace_id,null,'idea.action_run_created','idea_action_run',v_run_id,
    jsonb_build_object('idea_id',p_idea_id,'action_type',p_action_type,'acquisition_path',p_acquisition_path,
      'requirement_target_count',coalesce(cardinality(p_target_requirement_ids),0),'artifact_target_count',coalesce(cardinality(p_target_artifact_keys),0),'engine_revision',v_idea.engine_revision));

  return jsonb_build_object('action_run_id',v_run_id,'status','queued','engine_revision',v_idea.engine_revision,'acquisition_path',p_acquisition_path,'idempotent',false);
end;
$function$;

revoke all on function public.create_action_run_v2(uuid,bigint,text,text,text[],text[],text,text,jsonb,text,text,text,text,text,text) from public, anon, authenticated;
grant execute on function public.create_action_run_v2(uuid,bigint,text,text,text[],text[],text,text,jsonb,text,text,text,text,text,text) to service_role;

create or replace function public.apply_human_information_v1(
  p_idea_id uuid, p_expected_engine_revision bigint, p_semantic_key text, p_item_type text, p_value jsonb,
  p_provenance_type text, p_sensitivity text, p_idempotency_key text, p_source_id uuid default null,
  p_supersedes_id uuid default null, p_target_requirement_id text default null
) returns jsonb
language plpgsql
security definer
set search_path=''
as $function$
declare
  v_user uuid := auth.uid();
  v_idea public.ideas;
  v_existing public.idea_information_items;
  v_old public.idea_information_items;
  v_item_id uuid;
  v_revision bigint;
  v_fp text;
  v_target_refs jsonb;
begin
  if v_user is null or not app_private.can_write_idea(p_idea_id) then raise exception 'FORBIDDEN' using errcode='42501'; end if;
  if p_provenance_type not in ('HUMAN_DECLARED','HUMAN_GUIDED_ANSWER') then raise exception 'INVALID_HUMAN_PROVENANCE'; end if;
  if p_item_type not in ('FACT','PREFERENCE','CONSTRAINT','ASSUMPTION','OPTION','EVIDENCE','RISK','QUESTION','DECISION_INPUT') then raise exception 'INVALID_INFORMATION_TYPE'; end if;
  if p_sensitivity not in ('public','internal','personal','sensitive') then raise exception 'INVALID_SENSITIVITY'; end if;
  if p_value is null then raise exception 'VALUE_REQUIRED'; end if;
  if nullif(btrim(p_idempotency_key),'') is null then raise exception 'IDEMPOTENCY_KEY_REQUIRED'; end if;

  v_fp := md5(jsonb_build_object('semantic_key',p_semantic_key,'item_type',p_item_type,'value',p_value,'provenance_type',p_provenance_type,'sensitivity',p_sensitivity,'source_id',p_source_id,'supersedes_id',p_supersedes_id,'target_requirement_id',p_target_requirement_id)::text);
  select * into v_idea from public.ideas where id=p_idea_id for update;
  if v_idea.id is null then raise exception 'IDEA_NOT_FOUND'; end if;

  select * into v_existing from public.idea_information_items where idea_id=p_idea_id and idempotency_key=p_idempotency_key;
  if v_existing.id is not null then
    if v_existing.request_fingerprint is distinct from v_fp then raise exception 'IDEMPOTENCY_KEY_REUSE'; end if;
    if nullif(btrim(p_target_requirement_id),'') is not null then
      insert into public.idea_information_requirement_refs(idea_id,information_item_id,requirement_id,relation_kind,created_by)
      values(p_idea_id,v_existing.id,btrim(p_target_requirement_id),'SUPPORTS',v_user)
      on conflict do nothing;
    end if;
    return jsonb_build_object('information_item_id',v_existing.id,'engine_revision',v_idea.engine_revision,'idempotent',true);
  end if;

  if v_idea.engine_revision<>p_expected_engine_revision then raise exception 'STALE_ENGINE'; end if;
  if v_idea.blueprint_id is null or v_idea.blueprint_status<>'active' then raise exception 'IDEA_ENGINE_NOT_INITIALIZED'; end if;

  if p_source_id is not null and not exists(select 1 from public.idea_sources s where s.id=p_source_id and s.idea_id=p_idea_id and s.status<>'superseded') then raise exception 'INVALID_SOURCE'; end if;

  if p_supersedes_id is not null then
    select * into v_old from public.idea_information_items where id=p_supersedes_id for update;
    if v_old.id is null or v_old.idea_id<>p_idea_id then raise exception 'INVALID_SUPERSEDES'; end if;
    if v_old.state<>'ACTIVE' then raise exception 'SUPERSEDED_ITEM_NOT_ACTIVE'; end if;
    update public.idea_information_items set state='SUPERSEDED' where id=p_supersedes_id;
  end if;

  insert into public.idea_information_items(
    idea_id,semantic_key,item_type,value_jsonb,provenance_type,source_id,confidence_class,state,sensitivity,valid_from,supersedes_id,created_by,idempotency_key,request_fingerprint
  ) values (
    p_idea_id,nullif(btrim(p_semantic_key),''),p_item_type,p_value,p_provenance_type,p_source_id,'DIRECT','ACTIVE',p_sensitivity,now(),p_supersedes_id,v_user,p_idempotency_key,v_fp
  ) returning id into v_item_id;

  if nullif(btrim(p_target_requirement_id),'') is not null then
    insert into public.idea_information_requirement_refs(idea_id,information_item_id,requirement_id,relation_kind,created_by)
    values(p_idea_id,v_item_id,btrim(p_target_requirement_id),'SUPPORTS',v_user)
    on conflict do nothing;
    update public.idea_requirement_states set resolution_state='STALE',stale_reason='HUMAN_INFORMATION_CHANGED'
    where idea_id=p_idea_id and requirement_id=p_target_requirement_id and resolution_state<>'NOT_RELEVANT';
  end if;

  update public.ideas set engine_revision=engine_revision+1 where id=p_idea_id returning engine_revision into v_revision;

  v_target_refs := jsonb_build_array(jsonb_strip_nulls(jsonb_build_object('semantic_key',nullif(btrim(p_semantic_key),''),'requirement_id',nullif(btrim(p_target_requirement_id),''),'information_item_id',v_item_id)));
  insert into public.idea_ledger_entries(idea_id,entry_type,target_refs,payload,state,materiality,source_refs,created_by)
  values(p_idea_id,'CHANGE',v_target_refs,
    jsonb_strip_nulls(jsonb_build_object('event','human_information_applied','information_item_id',v_item_id,'supersedes_id',p_supersedes_id,'provenance_type',p_provenance_type)),
    'open','LOCAL',case when p_source_id is null then '[]'::jsonb else jsonb_build_array(jsonb_build_object('source_id',p_source_id)) end,v_user);

  insert into public.audit_events(workspace_id,actor_id,event_type,entity_type,entity_id,payload)
  values(v_idea.workspace_id,v_user,'idea.human_information_applied','idea_information_item',v_item_id,
    jsonb_strip_nulls(jsonb_build_object('idea_id',p_idea_id,'semantic_key',nullif(btrim(p_semantic_key),''),'item_type',p_item_type,'provenance_type',p_provenance_type,'supersedes_id',p_supersedes_id,'target_requirement_id',nullif(btrim(p_target_requirement_id),''),'revision_before',p_expected_engine_revision,'revision_after',v_revision)));

  return jsonb_build_object('information_item_id',v_item_id,'engine_revision',v_revision,'idempotent',false);
end;
$function$;

create or replace function public.promote_action_result_v1(p_action_run_id uuid, p_expected_engine_revision bigint, p_current_input_fingerprint text)
returns jsonb
language plpgsql
security definer
set search_path=''
as $function$
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
  v_info_item_id uuid;
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
      if v_target_requirement is not null and not (v_target_requirement=any(v_run.target_requirement_ids)) then raise exception 'MUTATION_TARGET_NOT_DECLARED'; end if;

      v_info_item_id := null;
      insert into public.idea_information_items(
        idea_id,semantic_key,item_type,value_jsonb,provenance_type,source_id,source_locator,confidence_class,state,sensitivity,
        valid_from,created_by_action_run_id,created_by,idempotency_key,request_fingerprint
      ) values (
        v_run.idea_id,nullif(btrim(v_mut->>'semantic_key'),''),v_mut->>'item_type',v_mut->'value',v_provenance,v_source_id,nullif(v_mut->>'source_locator',''),
        coalesce(v_mut->>'confidence_class','UNKNOWN'),'ACTIVE',coalesce(v_mut->>'sensitivity','internal'),now(),v_run.id,null,
        'action:'||v_run.id::text||':'||v_index::text,md5(v_mut::text)
      ) on conflict (idea_id,idempotency_key) do nothing
      returning id into v_info_item_id;
      if v_info_item_id is null then
        select id into v_info_item_id from public.idea_information_items where idea_id=v_run.idea_id and idempotency_key='action:'||v_run.id::text||':'||v_index::text;
      end if;
      v_info_count := v_info_count+1;

      if v_target_requirement is not null then
        insert into public.idea_information_requirement_refs(idea_id,information_item_id,requirement_id,relation_kind,created_by_action_run_id)
        values(v_run.idea_id,v_info_item_id,v_target_requirement,'SUPPORTS',v_run.id)
        on conflict do nothing;
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
    jsonb_build_object('idea_id',v_run.idea_id,'action_type',v_run.action_type,'acquisition_path',v_run.acquisition_path,'information_items_created',v_info_count,'ledger_entries_created',v_ledger_count,'revision_before',p_expected_engine_revision,'revision_after',v_revision));

  return jsonb_build_object('action_run_id',v_run.id,'promoted',true,'engine_revision',v_revision,'information_items_created',v_info_count,'ledger_entries_created',v_ledger_count,'idempotent',false);
end;
$function$;