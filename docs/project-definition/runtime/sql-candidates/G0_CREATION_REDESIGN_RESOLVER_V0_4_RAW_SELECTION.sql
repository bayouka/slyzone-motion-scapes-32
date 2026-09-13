-- 4b4c / 2b2c — Creation / Redesign context resolver V0.4 — selected RAW basis + authority
-- Date: 2026-09-13
-- STATUS: COMPILE/ROLLBACK CANDIDATE ONLY — DO NOT APPLY AS A MIGRATION.
-- Supersedes candidate V0.3 for future G2 bundle only. Active G0/G1 runtime unchanged.

create or replace function public.recompute_idea_creation_redesign_candidate_v4(
  p_idea_id uuid,
  p_expected_engine_revision bigint
) returns jsonb
language plpgsql
security definer
set search_path=''
as $function$
declare
  v_idea public.ideas;
  v_raw_source public.idea_sources;
  v_levels text[];
  v_refs jsonb;
  v_state text;
  v_lock text;
  v_basis text;
  v_raw_hash text;
  v_accepted_unknown boolean;
  v_best_tier integer;
  v_value_count integer:=0;
  v_context_value text;
begin
  select * into v_idea from public.ideas where id=p_idea_id for update;
  if v_idea.id is null then raise exception 'IDEA_NOT_FOUND'; end if;
  if v_idea.engine_revision<>p_expected_engine_revision then raise exception 'STALE_ENGINE'; end if;
  if v_idea.blueprint_id<>'SITE_VITRINE' or v_idea.blueprint_version<>'0.5' or v_idea.blueprint_status<>'active'
    then raise exception 'G0_CONTEXT_BLUEPRINT_0_5_NOT_ACTIVE';
  end if;

  -- Match the active Foundation RAW selection rule exactly: canonical initial RAW first,
  -- otherwise the oldest current human_raw Source. Non-selected RAW Sources are not inputs
  -- to this classification and therefore must not create false staleness.
  select * into v_raw_source
  from public.idea_sources s
  where s.idea_id=p_idea_id
    and s.source_kind='human_raw'
    and s.status in ('registered','ingested')
  order by case when s.idempotency_key='system:initial-original-text' then 0 else 1 end,
           s.created_at asc,
           s.id::text asc
  limit 1;

  v_raw_hash:=coalesce(v_raw_source.content_hash,md5(v_idea.original_text));

  v_basis:=md5(jsonb_build_object(
    'blueprint','SITE_VITRINE@0.5',
    'requirement_id','SV.D04.CREATION_OR_REDESIGN',
    'raw_source_id',v_raw_source.id,
    'raw_source_version',v_raw_source.source_version,
    'raw_hash',v_raw_hash
  )::text);

  select coalesce(array_agg(distinct lvl order by lvl),'{}'::text[])
  into v_levels
  from public.idea_information_requirement_refs rr
  join public.idea_information_items ii
    on ii.id=rr.information_item_id and ii.idea_id=p_idea_id and ii.state='ACTIVE'
  left join public.idea_sources src on src.id=ii.source_id
  left join public.idea_action_runs ar on ar.id=ii.created_by_action_run_id
  cross join lateral unnest(rr.resolution_levels) lvl
  where rr.idea_id=p_idea_id
    and rr.requirement_id='SV.D04.CREATION_OR_REDESIGN'
    and rr.relation_kind<>'CONFLICTS'
    and (ii.source_id is null or coalesce(src.status,'registered') not in ('superseded','stale','failed'))
    and (
      ii.created_by_action_run_id is null
      or (
        ar.idea_id=p_idea_id
        and ar.status='succeeded'
        and ar.promoted_at is not null
        and ar.target_requirement_fingerprints->>'SV.D04.CREATION_OR_REDESIGN'=v_basis
      )
    );

  select coalesce(jsonb_agg(jsonb_build_object(
    'information_item_id',ii.id,
    'request_fingerprint',ii.request_fingerprint,
    'provenance_type',ii.provenance_type,
    'confidence_class',ii.confidence_class,
    'source_id',ii.source_id,
    'source_hash',src.content_hash,
    'resolution_levels',to_jsonb(rr.resolution_levels),
    'created_by_action_run_id',ii.created_by_action_run_id,
    'normalized_value',lower(coalesce(
      case when jsonb_typeof(ii.value_jsonb)='string' then trim(both '"' from ii.value_jsonb::text) end,
      ii.value_jsonb->>'value',ii.value_jsonb->>'mode',ii.value_jsonb->>'classification',''
    )),
    'authority_tier',case
      when ii.provenance_type in ('HUMAN_DECLARED','HUMAN_GUIDED_ANSWER') then 0
      when 'HUMAN_DECISION'=any(rr.resolution_levels) or 'HUMAN_VALIDATED'=any(rr.resolution_levels) then 0
      when 'ACCEPTED_AS_CURRENT'=any(rr.resolution_levels) and ii.confidence_class='DIRECT' then 1
      else 2
    end
  ) order by
    case
      when ii.provenance_type in ('HUMAN_DECLARED','HUMAN_GUIDED_ANSWER') then 0
      when 'HUMAN_DECISION'=any(rr.resolution_levels) or 'HUMAN_VALIDATED'=any(rr.resolution_levels) then 0
      when 'ACCEPTED_AS_CURRENT'=any(rr.resolution_levels) and ii.confidence_class='DIRECT' then 1
      else 2
    end,
    ii.created_at desc,
    ii.id::text),'[]'::jsonb)
  into v_refs
  from public.idea_information_requirement_refs rr
  join public.idea_information_items ii
    on ii.id=rr.information_item_id and ii.idea_id=p_idea_id and ii.state='ACTIVE'
  left join public.idea_sources src on src.id=ii.source_id
  left join public.idea_action_runs ar on ar.id=ii.created_by_action_run_id
  where rr.idea_id=p_idea_id
    and rr.requirement_id='SV.D04.CREATION_OR_REDESIGN'
    and rr.relation_kind<>'CONFLICTS'
    and (ii.source_id is null or coalesce(src.status,'registered') not in ('superseded','stale','failed'))
    and (
      ii.created_by_action_run_id is null
      or (
        ar.idea_id=p_idea_id
        and ar.status='succeeded'
        and ar.promoted_at is not null
        and ar.target_requirement_fingerprints->>'SV.D04.CREATION_OR_REDESIGN'=v_basis
      )
    );

  with candidates as (
    select
      lower(coalesce(
        case when jsonb_typeof(ii.value_jsonb)='string' then trim(both '"' from ii.value_jsonb::text) end,
        ii.value_jsonb->>'value',ii.value_jsonb->>'mode',ii.value_jsonb->>'classification',''
      )) as normalized_value,
      case
        when ii.provenance_type in ('HUMAN_DECLARED','HUMAN_GUIDED_ANSWER') then 0
        when 'HUMAN_DECISION'=any(rr.resolution_levels) or 'HUMAN_VALIDATED'=any(rr.resolution_levels) then 0
        when 'ACCEPTED_AS_CURRENT'=any(rr.resolution_levels) and ii.confidence_class='DIRECT' then 1
        else 2
      end as authority_tier
    from public.idea_information_requirement_refs rr
    join public.idea_information_items ii
      on ii.id=rr.information_item_id and ii.idea_id=p_idea_id and ii.state='ACTIVE'
    left join public.idea_sources src on src.id=ii.source_id
    left join public.idea_action_runs ar on ar.id=ii.created_by_action_run_id
    where rr.idea_id=p_idea_id
      and rr.requirement_id='SV.D04.CREATION_OR_REDESIGN'
      and rr.relation_kind<>'CONFLICTS'
      and (ii.source_id is null or coalesce(src.status,'registered') not in ('superseded','stale','failed'))
      and (
        ii.created_by_action_run_id is null
        or (
          ar.idea_id=p_idea_id
          and ar.status='succeeded'
          and ar.promoted_at is not null
          and ar.target_requirement_fingerprints->>'SV.D04.CREATION_OR_REDESIGN'=v_basis
        )
      )
  ), valid as (
    select * from candidates where normalized_value in ('creation','redesign')
  ), best as (
    select min(authority_tier) as tier from valid
  )
  select b.tier,count(distinct v.normalized_value),min(v.normalized_value)
    into v_best_tier,v_value_count,v_context_value
  from best b
  left join valid v on v.authority_tier=b.tier
  group by b.tier;

  select exists(
    select 1 from public.idea_ledger_entries le
    where le.idea_id=p_idea_id and le.entry_type='ACCEPTED_UNKNOWN' and le.state='accepted'
      and exists(
        select 1 from jsonb_array_elements(le.target_refs) tr
        where tr->>'requirement_id'='SV.D04.CREATION_OR_REDESIGN'
      )
  ) into v_accepted_unknown;

  if v_value_count>1 then
    v_state:='CONFLICTED'; v_lock:='REVIEW_REQUIRED'; v_context_value:=null;
  elsif v_context_value is not null
        and v_levels && array['ACCEPTED_AS_CURRENT','HUMAN_VALIDATED','HUMAN_DECISION']::text[] then
    v_state:='RESOLVED'; v_lock:='VALIDATED_CURRENT';
  elsif v_context_value is not null and cardinality(v_levels)>0 then
    v_state:='RESOLVED'; v_lock:='WORKING';
  elsif v_accepted_unknown then
    v_state:='ACCEPTED_UNKNOWN'; v_lock:='WORKING';
  else
    v_state:='UNRESOLVED'; v_lock:='WORKING';
  end if;

  insert into public.idea_requirement_states(
    idea_id,requirement_id,blueprint_version,applicability_state,resolution_state,
    criticality_current,lock_state,resolution_refs,input_fingerprint,last_evaluated_at,
    stale_reason,version,evaluated_engine_revision,resolution_levels,authority_ok
  ) values(
    p_idea_id,'SV.D04.CREATION_OR_REDESIGN','0.5','ACTIVE',v_state,'REQUIRED',v_lock,
    v_refs,v_basis,now(),null,1,v_idea.engine_revision,v_levels,true
  )
  on conflict (idea_id,requirement_id) do update set
    blueprint_version='0.5',
    applicability_state='ACTIVE',resolution_state=excluded.resolution_state,
    criticality_current='REQUIRED',lock_state=excluded.lock_state,
    resolution_refs=excluded.resolution_refs,input_fingerprint=excluded.input_fingerprint,
    last_evaluated_at=now(),stale_reason=null,
    version=public.idea_requirement_states.version+1,
    evaluated_engine_revision=excluded.evaluated_engine_revision,
    resolution_levels=excluded.resolution_levels,authority_ok=true;

  return jsonb_build_object(
    'idea_id',p_idea_id,'engine_revision',v_idea.engine_revision,
    'requirement_id','SV.D04.CREATION_OR_REDESIGN',
    'resolution_state',v_state,'resolution_levels',to_jsonb(v_levels),
    'input_fingerprint',v_basis,
    'raw_source_id',v_raw_source.id,
    'raw_source_version',v_raw_source.source_version,
    'raw_hash',v_raw_hash,
    'context_value',v_context_value,'authority_tier',v_best_tier
  );
end;
$function$;

revoke all on function public.recompute_idea_creation_redesign_candidate_v4(uuid,bigint)
from public,anon,authenticated;
grant execute on function public.recompute_idea_creation_redesign_candidate_v4(uuid,bigint)
to service_role;

create or replace function public.plan_idea_creation_redesign_candidate_v4(
  p_idea_id uuid,
  p_expected_engine_revision bigint,
  p_raw_available boolean
) returns jsonb
language plpgsql
security definer
set search_path=''
as $function$
declare
  v_recompute jsonb;
  v_req public.idea_requirement_states;
  v_raw_source public.idea_sources;
  v_fresh_run public.idea_action_runs;
  v_ambiguous_run public.idea_action_runs;
  v_satisfied boolean;
begin
  v_recompute:=public.recompute_idea_creation_redesign_candidate_v4(
    p_idea_id,p_expected_engine_revision
  );
  select * into v_req from public.idea_requirement_states
  where idea_id=p_idea_id and requirement_id='SV.D04.CREATION_OR_REDESIGN';

  v_satisfied:=v_req.resolution_state='RESOLVED'
    and v_req.authority_ok
    and v_req.resolution_levels && array['ACCEPTED_AS_CURRENT','HUMAN_VALIDATED','HUMAN_DECISION']::text[];

  if v_satisfied then
    return jsonb_build_object(
      'status','RESOLVED','requirement_id',v_req.requirement_id,
      'input_fingerprint',v_req.input_fingerprint,
      'context_value',v_recompute->>'context_value',
      'eligible_system_action',null,'dominant_user_action',null
    );
  end if;

  if v_req.resolution_state='CONFLICTED' then
    return jsonb_build_object(
      'status','HUMAN_REQUIRED','requirement_id',v_req.requirement_id,
      'input_fingerprint',v_req.input_fingerprint,
      'eligible_system_action',null,
      'dominant_user_action',jsonb_build_object(
        'type','HUMAN','requirement_id',v_req.requirement_id,
        'interaction','EXPLICIT_CHOICE',
        'why_now','CREATION_OR_REDESIGN_CONFLICTED',
        'prompt','Les informations actuelles se contredisent : s’agit-il de créer un nouveau site ou de refaire un site existant ?'
      )
    );
  end if;

  select * into v_raw_source
  from public.idea_sources s
  where s.idea_id=p_idea_id
    and s.source_kind='human_raw'
    and s.status in ('registered','ingested')
  order by case when s.idempotency_key='system:initial-original-text' then 0 else 1 end,
           s.created_at asc,
           s.id::text asc
  limit 1;

  select * into v_ambiguous_run from public.idea_action_runs ar
  where ar.idea_id=p_idea_id and ar.acquisition_path='RAW'
    and ar.status='succeeded' and ar.promoted_at is null
    and ar.target_requirement_fingerprints->>'SV.D04.CREATION_OR_REDESIGN'=v_req.input_fingerprint
    and upper(coalesce(ar.result->>'classification',ar.result->>'resolution',''))='AMBIGUOUS'
  order by ar.completed_at desc nulls last,ar.created_at desc
  limit 1;

  if v_ambiguous_run.id is not null then
    return jsonb_build_object(
      'status','HUMAN_REQUIRED','requirement_id',v_req.requirement_id,
      'input_fingerprint',v_req.input_fingerprint,
      'eligible_system_action',null,
      'dominant_user_action',jsonb_build_object(
        'type','HUMAN','requirement_id',v_req.requirement_id,
        'interaction','OPTIONAL_CORRECTION',
        'why_now','CREATION_OR_REDESIGN_AMBIGUOUS_AFTER_RAW',
        'prompt','S’agit-il de créer un nouveau site ou de refaire un site existant ?'
      )
    );
  end if;

  select * into v_fresh_run from public.idea_action_runs ar
  where ar.idea_id=p_idea_id and ar.acquisition_path='RAW'
    and (
      ar.status in ('queued','running')
      or (ar.status='succeeded' and ar.promoted_at is null)
    )
    and ar.target_requirement_fingerprints->>'SV.D04.CREATION_OR_REDESIGN'=v_req.input_fingerprint
  order by ar.created_at desc limit 1;

  if p_raw_available and v_raw_source.id is not null and v_fresh_run.id is null then
    return jsonb_build_object(
      'status','AUTO_ACTION_AVAILABLE','requirement_id',v_req.requirement_id,
      'input_fingerprint',v_req.input_fingerprint,
      'eligible_system_action',jsonb_build_object(
        'action_type','EXTRACT_RAW','acquisition_path','RAW',
        'requirement_id',v_req.requirement_id,
        'target_fingerprint',v_req.input_fingerprint,
        'source_id',v_raw_source.id
      ),
      'dominant_user_action',null
    );
  end if;

  if v_fresh_run.id is not null then
    return jsonb_build_object(
      'status','SYSTEM_WORK_ACTIVE','requirement_id',v_req.requirement_id,
      'input_fingerprint',v_req.input_fingerprint,
      'eligible_system_action',null,'dominant_user_action',null
    );
  end if;

  return jsonb_build_object(
    'status','UNRESOLVED_NO_AUTO_PATH','requirement_id',v_req.requirement_id,
    'input_fingerprint',v_req.input_fingerprint,
    'eligible_system_action',null,'dominant_user_action',null
  );
end;
$function$;

revoke all on function public.plan_idea_creation_redesign_candidate_v4(uuid,bigint,boolean)
from public,anon,authenticated;
grant execute on function public.plan_idea_creation_redesign_candidate_v4(uuid,bigint,boolean)
to service_role;

-- Invariants:
-- - basis fingerprints the RAW Source actually consumed by classification;
-- - non-selected RAW Sources do not cause false staleness;
-- - selected RAW id/version/hash changes always change the basis;
-- - own classification output never changes its own basis;
-- - direct human corrections outrank machine extraction;
-- - contradictory values at the highest authority tier become CONFLICTED;
-- - structural conflict/ambiguity produces one targeted human last-mile.
