create or replace function public.apply_human_information_v1(
  p_idea_id uuid,
  p_expected_engine_revision bigint,
  p_semantic_key text,
  p_item_type text,
  p_value jsonb,
  p_provenance_type text,
  p_sensitivity text,
  p_idempotency_key text,
  p_source_id uuid default null,
  p_supersedes_id uuid default null,
  p_target_requirement_id text default null
) returns jsonb
language plpgsql
security definer
set search_path=''
as $$
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
      on conflict (information_item_id,requirement_id,relation_kind) do update set resolution_levels=excluded.resolution_levels;
      update public.idea_ledger_entries le set state='superseded'
      where le.idea_id=p_idea_id and le.entry_type='ACCEPTED_UNKNOWN' and le.state='accepted'
        and exists(select 1 from jsonb_array_elements(le.target_refs) tr where tr->>'requirement_id'=btrim(p_target_requirement_id));
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
    on conflict (information_item_id,requirement_id,relation_kind) do update set resolution_levels=excluded.resolution_levels;
    update public.idea_requirement_states set resolution_state='STALE',stale_reason='HUMAN_INFORMATION_CHANGED'
    where idea_id=p_idea_id and requirement_id=p_target_requirement_id and resolution_state<>'NOT_RELEVANT';
    update public.idea_ledger_entries le set state='superseded'
    where le.idea_id=p_idea_id and le.entry_type='ACCEPTED_UNKNOWN' and le.state='accepted'
      and exists(select 1 from jsonb_array_elements(le.target_refs) tr where tr->>'requirement_id'=btrim(p_target_requirement_id));
  end if;

  update public.ideas set engine_revision=engine_revision+1 where id=p_idea_id returning engine_revision into v_revision;
  v_target_refs := jsonb_build_array(jsonb_strip_nulls(jsonb_build_object('semantic_key',nullif(btrim(p_semantic_key),''),'requirement_id',nullif(btrim(p_target_requirement_id),''),'information_item_id',v_item_id)));
  insert into public.idea_ledger_entries(idea_id,entry_type,target_refs,payload,state,materiality,source_refs,created_by)
  values(p_idea_id,'CHANGE',v_target_refs,jsonb_strip_nulls(jsonb_build_object('event','human_information_applied','information_item_id',v_item_id,'supersedes_id',p_supersedes_id,'provenance_type',p_provenance_type)),'open','LOCAL',case when p_source_id is null then '[]'::jsonb else jsonb_build_array(jsonb_build_object('source_id',p_source_id)) end,v_user);
  insert into public.audit_events(workspace_id,actor_id,event_type,entity_type,entity_id,payload)
  values(v_idea.workspace_id,v_user,'idea.human_information_applied','idea_information_item',v_item_id,jsonb_strip_nulls(jsonb_build_object('idea_id',p_idea_id,'semantic_key',nullif(btrim(p_semantic_key),''),'item_type',p_item_type,'provenance_type',p_provenance_type,'supersedes_id',p_supersedes_id,'target_requirement_id',nullif(btrim(p_target_requirement_id),''),'revision_before',p_expected_engine_revision,'revision_after',v_revision)));
  return jsonb_build_object('information_item_id',v_item_id,'engine_revision',v_revision,'idempotent',false);
end;
$$;

create or replace function public.accept_idea_requirement_unknown_v1(
  p_idea_id uuid,
  p_expected_engine_revision bigint,
  p_requirement_id text,
  p_note text,
  p_idempotency_key text
) returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user uuid:=auth.uid();
  v_idea public.ideas;
  v_existing public.idea_ledger_entries;
  v_revision bigint;
  v_key text:=nullif(btrim(p_idempotency_key),'');
begin
  if v_user is null or not app_private.can_write_idea(p_idea_id) then raise exception 'FORBIDDEN' using errcode='42501'; end if;
  if v_key is null then raise exception 'IDEMPOTENCY_KEY_REQUIRED'; end if;
  if not exists(select 1 from app_private.idea_g1_policy_v1() p where p.requirement_id=p_requirement_id) then raise exception 'UNSUPPORTED_REQUIREMENT'; end if;

  select * into v_idea from public.ideas where id=p_idea_id for update;
  if v_idea.id is null then raise exception 'IDEA_NOT_FOUND'; end if;
  if v_idea.blueprint_id<>'SITE_VITRINE' or v_idea.blueprint_version<>'0.4' or v_idea.blueprint_status<>'active' then raise exception 'FOUNDATION_BLUEPRINT_NOT_ACTIVE'; end if;

  select * into v_existing
  from public.idea_ledger_entries le
  where le.idea_id=p_idea_id and le.entry_type='ACCEPTED_UNKNOWN' and le.payload->>'idempotency_key'=v_key
  limit 1;
  if v_existing.id is not null then
    return jsonb_build_object('ledger_entry_id',v_existing.id,'engine_revision',v_idea.engine_revision,'idempotent',true);
  end if;

  if v_idea.engine_revision<>p_expected_engine_revision then raise exception 'STALE_ENGINE'; end if;

  insert into public.idea_ledger_entries(idea_id,entry_type,target_refs,payload,state,materiality,source_refs,created_by)
  values(
    p_idea_id,'ACCEPTED_UNKNOWN',jsonb_build_array(jsonb_build_object('requirement_id',p_requirement_id)),
    jsonb_strip_nulls(jsonb_build_object('event','requirement_unknown_accepted','requirement_id',p_requirement_id,'note',nullif(btrim(p_note),''),'idempotency_key',v_key)),
    'accepted','LOCAL','[]'::jsonb,v_user
  ) returning * into v_existing;

  update public.idea_requirement_states set resolution_state='ACCEPTED_UNKNOWN',resolution_levels=array['ACCEPTED_UNKNOWN']::text[],lock_state='VALIDATED_CURRENT',stale_reason=null
  where idea_id=p_idea_id and requirement_id=p_requirement_id;
  update public.ideas set engine_revision=engine_revision+1 where id=p_idea_id returning engine_revision into v_revision;

  insert into public.audit_events(workspace_id,actor_id,event_type,entity_type,entity_id,payload)
  values(v_idea.workspace_id,v_user,'idea.requirement_unknown_accepted','idea',p_idea_id,jsonb_build_object('requirement_id',p_requirement_id,'revision_before',p_expected_engine_revision,'revision_after',v_revision));
  return jsonb_build_object('ledger_entry_id',v_existing.id,'engine_revision',v_revision,'idempotent',false);
end;
$$;

revoke all on function public.accept_idea_requirement_unknown_v1(uuid,bigint,text,text,text) from public,anon;
grant execute on function public.accept_idea_requirement_unknown_v1(uuid,bigint,text,text,text) to authenticated,service_role;

create or replace function public.plan_idea_foundation_v1(p_idea_id uuid,p_expected_engine_revision bigint,p_available_paths text[])
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_idea public.ideas;
  v_policy record;
  v_req public.idea_requirement_states;
  v_path text;
  v_next_path text;
  v_satisfied boolean;
  v_skip_actions boolean;
  v_used_unknown boolean:=false;
  v_missing jsonb:='[]'::jsonb;
  v_groups jsonb:='{}'::jsonb;
  v_group jsonb;
  v_system_actions jsonb:='[]'::jsonb;
  v_human jsonb:=null;
  v_foundation_conflict boolean;
  v_gate_status text;
  v_projection_fingerprint text;
  v_fps jsonb:='{}'::jsonb;
  v_action_type text;
  v_input_fp text;
  v_allowed_auto constant text[]:=array['MEM','RAW','SRC','AUDIT','CONN','WEB','CALC','AI_H','AI_R']::text[];
begin
  if p_available_paths is null then p_available_paths:=array[]::text[]; end if;
  if exists(select 1 from unnest(p_available_paths) p where not (p=any(v_allowed_auto))) then raise exception 'INVALID_AVAILABLE_PATH'; end if;
  select * into v_idea from public.ideas where id=p_idea_id;
  if v_idea.id is null then raise exception 'IDEA_NOT_FOUND'; end if;
  if v_idea.engine_revision<>p_expected_engine_revision then raise exception 'STALE_ENGINE'; end if;
  perform public.recompute_idea_foundation_v1(p_idea_id,p_expected_engine_revision);

  select exists(
    select 1 from public.idea_ledger_entries le
    where le.idea_id=p_idea_id and le.entry_type='CONFLICT' and le.materiality='CRITICAL' and le.state='open'
      and (jsonb_array_length(le.target_refs)=0 or exists(select 1 from jsonb_array_elements(le.target_refs) tr join app_private.idea_g1_policy_v1() pol on pol.requirement_id=tr->>'requirement_id'))
  ) into v_foundation_conflict;

  for v_policy in select * from app_private.idea_g1_policy_v1() order by ordinal loop
    select * into v_req from public.idea_requirement_states where idea_id=p_idea_id and requirement_id=v_policy.requirement_id;
    v_fps:=v_fps||jsonb_build_object(v_policy.requirement_id,v_req.input_fingerprint);
    v_satisfied:=false;
    v_skip_actions:=false;

    if v_req.applicability_state='NOT_RELEVANT' or v_req.resolution_state='NOT_RELEVANT' then
      v_satisfied:=true;
    elsif v_req.resolution_state='ACCEPTED_UNKNOWN' then
      v_satisfied:=v_policy.criticality<>'BLOCKING';
      v_used_unknown:=v_used_unknown or v_satisfied;
      v_skip_actions:=true;
    elsif v_req.resolution_state='RESOLVED' and v_req.authority_ok then
      v_satisfied:=v_req.resolution_levels && v_policy.accepted_levels;
    end if;

    if not v_satisfied then
      v_missing:=v_missing||jsonb_build_array(jsonb_build_object('requirement_id',v_policy.requirement_id,'status',v_req.resolution_state,'criticality',v_policy.criticality));
      if not v_skip_actions then
        v_next_path:=null;
        foreach v_path in array v_policy.preferred_paths loop
          if v_path=any(v_allowed_auto) and v_path=any(p_available_paths) and app_private.idea_g1_path_has_input_v1(p_idea_id,v_path) then
            if not exists(
              select 1 from public.idea_action_runs ar
              where ar.idea_id=p_idea_id and ar.acquisition_path=v_path and ar.status in ('queued','running','succeeded')
                and ar.target_requirement_fingerprints->>v_policy.requirement_id=v_req.input_fingerprint
            ) then v_next_path:=v_path; exit; end if;
          end if;
        end loop;
        if v_next_path is not null then
          v_group:=coalesce(v_groups->v_next_path,jsonb_build_object('requirement_ids','[]'::jsonb,'fingerprints','{}'::jsonb));
          v_group:=jsonb_set(v_group,'{requirement_ids}',(v_group->'requirement_ids')||to_jsonb(v_policy.requirement_id),true);
          v_group:=jsonb_set(v_group,'{fingerprints}',(v_group->'fingerprints')||jsonb_build_object(v_policy.requirement_id,v_req.input_fingerprint),true);
          v_groups:=jsonb_set(v_groups,array[v_next_path],v_group,true);
        elsif v_human is null and ('HUM'=any(v_policy.preferred_paths) or v_policy.human_only_reason is not null or v_policy.human_interaction in ('EXPLICIT_CHOICE','FORMAL_APPROVAL','EXPERT_SIGNOFF')) then
          v_human:=jsonb_strip_nulls(jsonb_build_object(
            'type','HUMAN','requirement_id',v_policy.requirement_id,'title',v_policy.title,'purpose',v_policy.purpose,
            'interaction',case when v_policy.human_interaction='NONE' then 'HUMAN_INTENT' else v_policy.human_interaction end,
            'why_now','G1_FOUNDATION_LOCKABLE','what_it_unlocks',to_jsonb(v_policy.unlocks),'human_only_reason',v_policy.human_only_reason,
            'target_fingerprint',v_req.input_fingerprint
          ));
        end if;
      end if;
    end if;
  end loop;

  foreach v_path in array v_allowed_auto loop
    if v_groups ? v_path then
      v_group:=v_groups->v_path;
      v_action_type:=case v_path when 'MEM' then 'REUSE_MEMORY' when 'RAW' then 'EXTRACT_RAW' when 'SRC' then 'EXTRACT_SOURCE' when 'AUDIT' then 'AUDIT' when 'CONN' then 'FETCH_CONNECTED' when 'WEB' then 'RESEARCH_WEB' when 'CALC' then 'CALCULATE' when 'AI_H' then 'INFER_HYPOTHESIS' when 'AI_R' then 'GENERATE_RECOMMENDATION' end;
      v_input_fp:=md5(jsonb_build_object('idea_id',p_idea_id,'engine_revision',v_idea.engine_revision,'path',v_path,'fingerprints',v_group->'fingerprints')::text);
      v_system_actions:=v_system_actions||jsonb_build_array(jsonb_build_object('action_type',v_action_type,'acquisition_path',v_path,'requirement_ids',v_group->'requirement_ids','target_requirement_fingerprints',v_group->'fingerprints','input_fingerprint',v_input_fp));
    end if;
  end loop;

  if v_foundation_conflict or jsonb_array_length(v_missing)>0 then v_gate_status:='NOT_READY'; elsif v_used_unknown then v_gate_status:='READY_WITH_ACCEPTED_UNKNOWNS'; else v_gate_status:='READY'; end if;
  v_projection_fingerprint:=md5(jsonb_build_object('idea_id',p_idea_id,'engine_revision',v_idea.engine_revision,'gate','G1_FOUNDATION_LOCKABLE','requirements',v_fps,'gate_status',v_gate_status)::text);
  return jsonb_build_object('idea_id',p_idea_id,'engine_revision',v_idea.engine_revision,'blueprint_id',v_idea.blueprint_id,'blueprint_version',v_idea.blueprint_version,'gate_id','G1_FOUNDATION_LOCKABLE','gate_status',v_gate_status,'projection_fingerprint',v_projection_fingerprint,'missing_requirements',v_missing,'eligible_system_actions',v_system_actions,'dominant_user_action',v_human,'foundation_conflict',v_foundation_conflict);
end;
$$;