create or replace function app_private.idea_g1_policy_v1()
returns table(
  ordinal integer,
  requirement_id text,
  title text,
  purpose text,
  preferred_paths text[],
  human_interaction text,
  human_only_reason text,
  accepted_levels text[],
  criticality text,
  conditional_atom boolean,
  unlocks text[]
)
language sql
immutable
set search_path=''
as $function$
  values
    (1,'SV.D02.ORG_CONTEXT','Organisation et activité','Situer l''idée dans une activité réelle.',array['RAW','SRC','WEB','AI_H']::text[],'OPTIONAL_CORRECTION',null,array['RAW_HUMAN','SOURCE_BACKED','ACCEPTED_AS_CURRENT']::text[],'REQUIRED',false,array[]::text[]),
    (2,'SV.D02.DECLARED_PROBLEM','Problème ou opportunité déclarée','Préserver la perception humaine sans la confondre avec le diagnostic.',array['RAW','SRC','HUM']::text[],'OPTIONAL_CORRECTION',null,array['RAW_HUMAN']::text[],'REQUIRED',false,array[]::text[]),
    (3,'SV.D02.PRIMARY_OBJECTIVE','Objectif business ou communication principal','Donner un critère de jugement aux directions futures.',array['RAW','SRC','AI_H','HUM']::text[],'LIGHT_REVIEW','future_internal_intent_if_ambiguous',array['WORKING_ASSUMPTION','AI_RECOMMENDATION','ACCEPTED_AS_CURRENT','HUMAN_VALIDATED','HUMAN_DECISION','EXPERT_SIGNOFF']::text[],'BLOCKING',false,array[]::text[]),
    (4,'SV.D03.PRIMARY_AUDIENCE','Audience principale active','Cibler research, positionnement et solution.',array['RAW','SRC','CONN','AI_H','HUM']::text[],'OPTIONAL_CORRECTION',null,array['WORKING_ASSUMPTION','AI_RECOMMENDATION','ACCEPTED_AS_CURRENT','HUMAN_VALIDATED','HUMAN_DECISION','EXPERT_SIGNOFF']::text[],'REQUIRED',false,array['SV.D05.MARKET_CONTEXT']::text[]),
    (5,'SV.D02.USER_OUTCOME','Résultat principal attendu côté visiteur','Relier l''objectif business à un comportement utilisateur.',array['RAW','SRC','AI_H','AI_R']::text[],'OPTIONAL_CORRECTION',null,array['WORKING_ASSUMPTION','AI_RECOMMENDATION','ACCEPTED_AS_CURRENT','HUMAN_VALIDATED','HUMAN_DECISION','EXPERT_SIGNOFF']::text[],'REQUIRED',false,array[]::text[]),
    (6,'SV.D04.OFFER_BASELINE','Offre actuelle','Éviter de concevoir pour une offre imaginaire ou obsolète.',array['RAW','SRC','AUDIT']::text[],'OPTIONAL_CORRECTION',null,array['RAW_HUMAN','SOURCE_BACKED','ACCEPTED_AS_CURRENT']::text[],'REQUIRED',false,array[]::text[]),
    (7,'SV.D02.HARD_CONSTRAINTS','Contraintes dures','Budget, délai, plateforme, obligation ou ressource qui éliminent réellement des options.',array['RAW','SRC','HUM']::text[],'NONE','private_constraint_if_material',array['RAW_HUMAN','SOURCE_BACKED','OBSERVED','CALCULATED','WORKING_ASSUMPTION','AI_RECOMMENDATION','ACCEPTED_AS_CURRENT','HUMAN_VALIDATED','HUMAN_DECISION','EXPERT_SIGNOFF']::text[],'CONDITIONAL',true,array[]::text[]);
$function$;

revoke all on function app_private.idea_g1_policy_v1() from public, anon, authenticated;

create or replace function app_private.idea_g1_path_has_input_v1(p_idea_id uuid,p_path text)
returns boolean
language sql
stable
security definer
set search_path=''
as $function$
  select case p_path
    when 'RAW' then exists(select 1 from public.idea_sources s where s.idea_id=p_idea_id and s.source_kind='human_raw' and s.status in ('registered','ingested'))
    when 'SRC' then exists(select 1 from public.idea_sources s where s.idea_id=p_idea_id and s.source_kind<>'human_raw' and s.status in ('registered','ingested'))
    when 'AUDIT' then exists(select 1 from public.idea_sources s where s.idea_id=p_idea_id and s.source_kind in ('url','document','image') and s.status in ('registered','ingested'))
    else true
  end;
$function$;

revoke all on function app_private.idea_g1_path_has_input_v1(uuid,text) from public, anon, authenticated;

create or replace function public.recompute_idea_foundation_v1(p_idea_id uuid,p_expected_engine_revision bigint)
returns jsonb
language plpgsql
security definer
set search_path=''
as $function$
declare
  v_idea public.ideas;
  v_policy record;
  v_levels text[];
  v_refs jsonb;
  v_state text;
  v_lock text;
  v_fp text;
  v_dep_fps jsonb;
  v_fps jsonb := '{}'::jsonb;
  v_raw_hash text;
  v_description_hash text;
  v_conflict boolean;
  v_accepted_unknown boolean;
  v_count integer := 0;
begin
  select * into v_idea from public.ideas where id=p_idea_id for update;
  if v_idea.id is null then raise exception 'IDEA_NOT_FOUND'; end if;
  if v_idea.engine_revision<>p_expected_engine_revision then raise exception 'STALE_ENGINE'; end if;
  if v_idea.blueprint_id<>'SITE_VITRINE' or v_idea.blueprint_version<>'0.4' or v_idea.blueprint_status<>'active' then raise exception 'FOUNDATION_BLUEPRINT_NOT_ACTIVE'; end if;

  select coalesce(max(s.content_hash) filter (where s.source_kind='human_raw' and s.status in ('registered','ingested')),md5(v_idea.original_text))
    into v_raw_hash from public.idea_sources s where s.idea_id=p_idea_id;
  v_description_hash:=md5(coalesce(v_idea.current_description,''));

  for v_policy in select * from app_private.idea_g1_policy_v1() order by ordinal loop
    select coalesce(array_agg(distinct lvl order by lvl),'{}'::text[])
      into v_levels
    from public.idea_information_requirement_refs rr
    join public.idea_information_items ii on ii.id=rr.information_item_id and ii.idea_id=p_idea_id and ii.state='ACTIVE'
    left join public.idea_sources src on src.id=ii.source_id
    cross join lateral unnest(rr.resolution_levels) lvl
    where rr.idea_id=p_idea_id and rr.requirement_id=v_policy.requirement_id
      and rr.relation_kind<>'CONFLICTS'
      and (ii.source_id is null or coalesce(src.status,'registered')<>'superseded');

    select coalesce(jsonb_agg(jsonb_build_object(
      'information_item_id',ii.id,
      'request_fingerprint',ii.request_fingerprint,
      'relation_kind',rr.relation_kind,
      'resolution_levels',to_jsonb(rr.resolution_levels),
      'provenance_type',ii.provenance_type,
      'confidence_class',ii.confidence_class,
      'source_id',ii.source_id,
      'source_hash',src.content_hash,
      'source_status',src.status
    ) order by ii.id::text,rr.relation_kind),'[]'::jsonb)
      into v_refs
    from public.idea_information_requirement_refs rr
    join public.idea_information_items ii on ii.id=rr.information_item_id and ii.idea_id=p_idea_id and ii.state='ACTIVE'
    left join public.idea_sources src on src.id=ii.source_id
    where rr.idea_id=p_idea_id and rr.requirement_id=v_policy.requirement_id
      and (ii.source_id is null or coalesce(src.status,'registered')<>'superseded');

    select exists(
      select 1 from public.idea_information_requirement_refs rr
      join public.idea_information_items ii on ii.id=rr.information_item_id and ii.state='ACTIVE'
      where rr.idea_id=p_idea_id and rr.requirement_id=v_policy.requirement_id and rr.relation_kind='CONFLICTS'
    ) or exists(
      select 1 from public.idea_ledger_entries le
      where le.idea_id=p_idea_id and le.entry_type='CONFLICT' and le.state='open'
        and exists(select 1 from jsonb_array_elements(le.target_refs) tr where tr->>'requirement_id'=v_policy.requirement_id)
    ) into v_conflict;

    select exists(
      select 1 from public.idea_ledger_entries le
      where le.idea_id=p_idea_id and le.entry_type='ACCEPTED_UNKNOWN' and le.state='accepted'
        and exists(select 1 from jsonb_array_elements(le.target_refs) tr where tr->>'requirement_id'=v_policy.requirement_id)
    ) into v_accepted_unknown;

    if v_conflict then v_state:='CONFLICTED';
    elsif v_accepted_unknown then v_state:='ACCEPTED_UNKNOWN';
    elsif cardinality(v_levels)>0 then v_state:='RESOLVED';
    else v_state:='UNRESOLVED';
    end if;

    if v_state='CONFLICTED' then v_lock:='REVIEW_REQUIRED';
    elsif v_state='RESOLVED' and v_levels && array['AI_RECOMMENDATION','WORKING_ASSUMPTION']::text[]
          and not (v_levels && array['RAW_HUMAN','SOURCE_BACKED','OBSERVED','CALCULATED','ACCEPTED_AS_CURRENT','HUMAN_VALIDATED','HUMAN_DECISION','EXPERT_SIGNOFF']::text[])
      then v_lock:='AI_PROPOSED';
    elsif v_state in ('RESOLVED','ACCEPTED_UNKNOWN') then v_lock:='VALIDATED_CURRENT';
    else v_lock:='WORKING';
    end if;

    v_dep_fps:='{}'::jsonb;
    if v_policy.requirement_id='SV.D03.PRIMARY_AUDIENCE' then
      v_dep_fps:=jsonb_build_object(
        'SV.D02.ORG_CONTEXT',v_fps->>'SV.D02.ORG_CONTEXT',
        'SV.D02.PRIMARY_OBJECTIVE',v_fps->>'SV.D02.PRIMARY_OBJECTIVE'
      );
    elsif v_policy.requirement_id='SV.D02.USER_OUTCOME' then
      v_dep_fps:=jsonb_build_object(
        'SV.D02.PRIMARY_OBJECTIVE',v_fps->>'SV.D02.PRIMARY_OBJECTIVE',
        'SV.D03.PRIMARY_AUDIENCE',v_fps->>'SV.D03.PRIMARY_AUDIENCE'
      );
    end if;

    v_fp:=md5(jsonb_build_object(
      'blueprint','SITE_VITRINE@0.4','requirement_id',v_policy.requirement_id,
      'description_hash',v_description_hash,'raw_hash',v_raw_hash,
      'state',v_state,'levels',to_jsonb(v_levels),'refs',v_refs,'dependencies',v_dep_fps
    )::text);
    v_fps:=v_fps||jsonb_build_object(v_policy.requirement_id,v_fp);

    insert into public.idea_requirement_states(
      idea_id,requirement_id,blueprint_version,applicability_state,resolution_state,criticality_current,lock_state,
      resolution_refs,input_fingerprint,last_evaluated_at,stale_reason,version,evaluated_engine_revision,resolution_levels,authority_ok
    ) values(
      p_idea_id,v_policy.requirement_id,'0.4','ACTIVE',v_state,v_policy.criticality,v_lock,
      v_refs,v_fp,now(),null,1,v_idea.engine_revision,v_levels,true
    )
    on conflict (idea_id,requirement_id) do update set
      blueprint_version=excluded.blueprint_version,
      applicability_state=excluded.applicability_state,
      resolution_state=excluded.resolution_state,
      criticality_current=excluded.criticality_current,
      lock_state=excluded.lock_state,
      resolution_refs=excluded.resolution_refs,
      input_fingerprint=excluded.input_fingerprint,
      last_evaluated_at=excluded.last_evaluated_at,
      stale_reason=null,
      version=public.idea_requirement_states.version+1,
      evaluated_engine_revision=excluded.evaluated_engine_revision,
      resolution_levels=excluded.resolution_levels,
      authority_ok=true;
    v_count:=v_count+1;
  end loop;

  return jsonb_build_object('idea_id',p_idea_id,'engine_revision',v_idea.engine_revision,'materialized_count',v_count,'requirement_fingerprints',v_fps);
end;
$function$;

revoke all on function public.recompute_idea_foundation_v1(uuid,bigint) from public, anon, authenticated;
grant execute on function public.recompute_idea_foundation_v1(uuid,bigint) to service_role;

create or replace function public.plan_idea_foundation_v1(p_idea_id uuid,p_expected_engine_revision bigint,p_available_paths text[])
returns jsonb
language plpgsql
security definer
set search_path=''
as $function$
declare
  v_idea public.ideas;
  v_policy record;
  v_req public.idea_requirement_states;
  v_path text;
  v_next_path text;
  v_satisfied boolean;
  v_used_unknown boolean := false;
  v_missing jsonb := '[]'::jsonb;
  v_groups jsonb := '{}'::jsonb;
  v_group jsonb;
  v_system_actions jsonb := '[]'::jsonb;
  v_human jsonb := null;
  v_foundation_conflict boolean;
  v_gate_status text;
  v_projection_fingerprint text;
  v_fps jsonb := '{}'::jsonb;
  v_action_type text;
  v_input_fp text;
  v_key text;
  v_allowed_auto constant text[] := array['MEM','RAW','SRC','AUDIT','CONN','WEB','CALC','AI_H','AI_R']::text[];
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
      and (
        jsonb_array_length(le.target_refs)=0 or exists(
          select 1 from jsonb_array_elements(le.target_refs) tr
          join app_private.idea_g1_policy_v1() pol on pol.requirement_id=tr->>'requirement_id'
        )
      )
  ) into v_foundation_conflict;

  for v_policy in select * from app_private.idea_g1_policy_v1() order by ordinal loop
    select * into v_req from public.idea_requirement_states where idea_id=p_idea_id and requirement_id=v_policy.requirement_id;
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

    if not v_satisfied then
      v_missing:=v_missing||jsonb_build_array(jsonb_build_object('requirement_id',v_policy.requirement_id,'status',v_req.resolution_state,'criticality',v_policy.criticality));
      v_next_path:=null;
      foreach v_path in array v_policy.preferred_paths loop
        if v_path=any(v_allowed_auto) and v_path=any(p_available_paths) and app_private.idea_g1_path_has_input_v1(p_idea_id,v_path) then
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
        v_group:=coalesce(v_groups->v_next_path,jsonb_build_object('requirement_ids','[]'::jsonb,'fingerprints','{}'::jsonb));
        v_group:=jsonb_set(v_group,'{requirement_ids}',(v_group->'requirement_ids')||to_jsonb(v_policy.requirement_id),true);
        v_group:=jsonb_set(v_group,'{fingerprints}',(v_group->'fingerprints')||jsonb_build_object(v_policy.requirement_id,v_req.input_fingerprint),true);
        v_groups:=jsonb_set(v_groups,array[v_next_path],v_group,true);
      elsif v_human is null and (
        'HUM'=any(v_policy.preferred_paths) or v_policy.human_only_reason is not null or v_policy.human_interaction in ('EXPLICIT_CHOICE','FORMAL_APPROVAL','EXPERT_SIGNOFF')
      ) then
        v_human:=jsonb_strip_nulls(jsonb_build_object(
          'type','HUMAN','requirement_id',v_policy.requirement_id,'title',v_policy.title,'purpose',v_policy.purpose,
          'interaction',case when v_policy.human_interaction='NONE' then 'HUMAN_INTENT' else v_policy.human_interaction end,
          'why_now','G1_FOUNDATION_LOCKABLE','what_it_unlocks',to_jsonb(v_policy.unlocks),'human_only_reason',v_policy.human_only_reason,
          'target_fingerprint',v_req.input_fingerprint
        ));
      end if;
    end if;
  end loop;

  foreach v_path in array v_allowed_auto loop
    if v_groups ? v_path then
      v_group:=v_groups->v_path;
      v_action_type:=case v_path
        when 'MEM' then 'REUSE_MEMORY' when 'RAW' then 'EXTRACT_RAW' when 'SRC' then 'EXTRACT_SOURCE'
        when 'AUDIT' then 'AUDIT' when 'CONN' then 'FETCH_CONNECTED' when 'WEB' then 'RESEARCH_WEB'
        when 'CALC' then 'CALCULATE' when 'AI_H' then 'INFER_HYPOTHESIS' when 'AI_R' then 'GENERATE_RECOMMENDATION' end;
      v_input_fp:=md5(jsonb_build_object('idea_id',p_idea_id,'engine_revision',v_idea.engine_revision,'path',v_path,'fingerprints',v_group->'fingerprints')::text);
      v_system_actions:=v_system_actions||jsonb_build_array(jsonb_build_object(
        'action_type',v_action_type,'acquisition_path',v_path,'requirement_ids',v_group->'requirement_ids',
        'target_requirement_fingerprints',v_group->'fingerprints','input_fingerprint',v_input_fp
      ));
    end if;
  end loop;

  if v_foundation_conflict or jsonb_array_length(v_missing)>0 then v_gate_status:='NOT_READY';
  elsif v_used_unknown then v_gate_status:='READY_WITH_ACCEPTED_UNKNOWNS';
  else v_gate_status:='READY'; end if;

  v_projection_fingerprint:=md5(jsonb_build_object('idea_id',p_idea_id,'engine_revision',v_idea.engine_revision,'gate','G1_FOUNDATION_LOCKABLE','requirements',v_fps,'gate_status',v_gate_status)::text);

  return jsonb_build_object(
    'idea_id',p_idea_id,'engine_revision',v_idea.engine_revision,'blueprint_id',v_idea.blueprint_id,'blueprint_version',v_idea.blueprint_version,
    'gate_id','G1_FOUNDATION_LOCKABLE','gate_status',v_gate_status,'projection_fingerprint',v_projection_fingerprint,
    'missing_requirements',v_missing,'eligible_system_actions',v_system_actions,'dominant_user_action',v_human,
    'foundation_conflict',v_foundation_conflict
  );
end;
$function$;

revoke all on function public.plan_idea_foundation_v1(uuid,bigint,text[]) from public, anon, authenticated;
grant execute on function public.plan_idea_foundation_v1(uuid,bigint,text[]) to service_role;