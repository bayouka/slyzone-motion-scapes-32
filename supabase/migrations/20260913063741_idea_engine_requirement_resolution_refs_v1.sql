alter table public.idea_information_requirement_refs
  add column if not exists resolution_levels text[] not null default array[]::text[];

alter table public.idea_information_requirement_refs
  drop constraint if exists idea_information_requirement_refs_levels_check;
alter table public.idea_information_requirement_refs
  add constraint idea_information_requirement_refs_levels_check
  check (
    resolution_levels <@ array['RAW_HUMAN','SOURCE_BACKED','OBSERVED','CALCULATED','WORKING_ASSUMPTION','AI_RECOMMENDATION','ACCEPTED_AS_CURRENT','HUMAN_VALIDATED','HUMAN_DECISION','EXPERT_SIGNOFF','ACCEPTED_UNKNOWN']::text[]
  );

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
      insert into public.idea_information_requirement_refs(idea_id,information_item_id,requirement_id,relation_kind,resolution_levels,created_by)
      values(p_idea_id,v_existing.id,btrim(p_target_requirement_id),'SUPPORTS',array['RAW_HUMAN','ACCEPTED_AS_CURRENT']::text[],v_user)
      on conflict (information_item_id,requirement_id,relation_kind) do update
      set resolution_levels=excluded.resolution_levels;
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
    insert into public.idea_information_requirement_refs(idea_id,information_item_id,requirement_id,relation_kind,resolution_levels,created_by)
    values(p_idea_id,v_item_id,btrim(p_target_requirement_id),'SUPPORTS',array['RAW_HUMAN','ACCEPTED_AS_CURRENT']::text[],v_user)
    on conflict (information_item_id,requirement_id,relation_kind) do update
    set resolution_levels=excluded.resolution_levels;
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
  v_source_kind text;
  v_target_requirement text;
  v_provenance text;
  v_entry_type text;
  v_revision bigint;
  v_info_item_id uuid;
  v_levels text[];
  v_level text;
  v_confidence text;
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
      v_confidence := coalesce(v_mut->>'confidence_class','UNKNOWN');
      if v_confidence not in ('DIRECT','HIGH','MEDIUM','LOW','UNKNOWN') then raise exception 'INVALID_CONFIDENCE_CLASS'; end if;
      if coalesce(v_mut->>'sensitivity','internal') not in ('public','internal','personal','sensitive') then raise exception 'INVALID_SENSITIVITY'; end if;
      v_source_id := nullif(v_mut->>'source_id','')::uuid;
      v_source_kind := null;
      if v_source_id is not null then
        select source_kind into v_source_kind from public.idea_sources s where s.id=v_source_id and s.idea_id=v_run.idea_id and s.status<>'superseded';
        if v_source_kind is null then raise exception 'INVALID_SOURCE'; end if;
      end if;
      v_target_requirement := nullif(btrim(v_mut->>'target_requirement_id'),'');
      if v_target_requirement is not null and not (v_target_requirement=any(v_run.target_requirement_ids)) then raise exception 'MUTATION_TARGET_NOT_DECLARED'; end if;

      v_levels := array[]::text[];
      if v_target_requirement is not null then
        if jsonb_typeof(coalesce(v_mut->'resolution_levels','[]'::jsonb))<>'array' then raise exception 'INVALID_RESOLUTION_LEVELS'; end if;
        v_levels := array(select jsonb_array_elements_text(coalesce(v_mut->'resolution_levels','[]'::jsonb)));
        if cardinality(v_levels)=0 then raise exception 'RESOLUTION_LEVELS_REQUIRED_FOR_TARGET'; end if;
        foreach v_level in array v_levels loop
          if v_level not in ('RAW_HUMAN','SOURCE_BACKED','OBSERVED','CALCULATED','WORKING_ASSUMPTION','AI_RECOMMENDATION','ACCEPTED_AS_CURRENT','HUMAN_VALIDATED','HUMAN_DECISION','EXPERT_SIGNOFF','ACCEPTED_UNKNOWN') then raise exception 'INVALID_RESOLUTION_LEVEL'; end if;
        end loop;

        if v_provenance='SOURCE_EXTRACTED' then
          if v_source_id is null then raise exception 'SOURCE_REQUIRED_FOR_SOURCE_EXTRACTED'; end if;
          if v_source_kind='human_raw' then
            if exists(select 1 from unnest(v_levels) x where x not in ('RAW_HUMAN','ACCEPTED_AS_CURRENT')) then raise exception 'PROVENANCE_LEVEL_MISMATCH'; end if;
            if 'ACCEPTED_AS_CURRENT'=any(v_levels) and v_confidence<>'DIRECT' then raise exception 'DIRECT_HUMAN_EXTRACTION_REQUIRED'; end if;
          else
            if exists(select 1 from unnest(v_levels) x where x not in ('SOURCE_BACKED','OBSERVED')) then raise exception 'PROVENANCE_LEVEL_MISMATCH'; end if;
          end if;
        elsif v_provenance in ('CONNECTOR_EXTRACTED','WEB_RESEARCH') then
          if exists(select 1 from unnest(v_levels) x where x not in ('SOURCE_BACKED','OBSERVED')) then raise exception 'PROVENANCE_LEVEL_MISMATCH'; end if;
        elsif v_provenance='SYSTEM_CALCULATED' then
          if exists(select 1 from unnest(v_levels) x where x<>'CALCULATED') then raise exception 'PROVENANCE_LEVEL_MISMATCH'; end if;
        elsif v_provenance='AI_INFERRED' then
          if exists(select 1 from unnest(v_levels) x where x<>'WORKING_ASSUMPTION') then raise exception 'PROVENANCE_LEVEL_MISMATCH'; end if;
        elsif v_provenance='AI_RECOMMENDED' then
          if exists(select 1 from unnest(v_levels) x where x<>'AI_RECOMMENDATION') then raise exception 'PROVENANCE_LEVEL_MISMATCH'; end if;
        end if;
      end if;

      v_info_item_id := null;
      insert into public.idea_information_items(
        idea_id,semantic_key,item_type,value_jsonb,provenance_type,source_id,source_locator,confidence_class,state,sensitivity,
        valid_from,created_by_action_run_id,created_by,idempotency_key,request_fingerprint
      ) values (
        v_run.idea_id,nullif(btrim(v_mut->>'semantic_key'),''),v_mut->>'item_type',v_mut->'value',v_provenance,v_source_id,nullif(v_mut->>'source_locator',''),
        v_confidence,'ACTIVE',coalesce(v_mut->>'sensitivity','internal'),now(),v_run.id,null,
        'action:'||v_run.id::text||':'||v_index::text,md5(v_mut::text)
      ) on conflict (idea_id,idempotency_key) do nothing
      returning id into v_info_item_id;
      if v_info_item_id is null then
        select id into v_info_item_id from public.idea_information_items where idea_id=v_run.idea_id and idempotency_key='action:'||v_run.id::text||':'||v_index::text;
      end if;
      v_info_count := v_info_count+1;

      if v_target_requirement is not null then
        insert into public.idea_information_requirement_refs(idea_id,information_item_id,requirement_id,relation_kind,resolution_levels,created_by_action_run_id)
        values(v_run.idea_id,v_info_item_id,v_target_requirement,'SUPPORTS',v_levels,v_run.id)
        on conflict (information_item_id,requirement_id,relation_kind) do update
        set resolution_levels=excluded.resolution_levels,created_by_action_run_id=excluded.created_by_action_run_id;
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