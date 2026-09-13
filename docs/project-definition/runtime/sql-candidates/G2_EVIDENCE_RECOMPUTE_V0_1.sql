-- 4b4c / 2b2c — G2 Evidence / Market recompute V0.1
-- Date: 2026-09-13
-- STATUS: COMPILE/ROLLBACK CANDIDATE ONLY — DO NOT APPLY AS A MIGRATION.
-- Requires candidate helpers from planner V0.1/V0.2/V0.3 and creation/redesign resolver.

create or replace function public.recompute_idea_evidence_context_candidate_v1(
  p_idea_id uuid,
  p_expected_engine_revision bigint
) returns jsonb
language plpgsql
security definer
set search_path=''
as $function$
declare
  v_idea public.ideas;
  v_context jsonb;
  v_context_state public.idea_requirement_states;
  v_policy record;
  v_levels text[];
  v_refs jsonb;
  v_state text;
  v_lock text;
  v_applicability text;
  v_fp text;
  v_fps jsonb:='{}'::jsonb;
  v_deps jsonb;
  v_conflict boolean;
  v_accepted_unknown boolean;
  v_is_redesign boolean;
  v_materiality jsonb;
  v_competitor_material boolean:=true;
  v_source_inventory_fp text;
  v_count integer:=0;
  v_dep_fp text;
begin
  select * into v_idea from public.ideas where id=p_idea_id for update;
  if v_idea.id is null then raise exception 'IDEA_NOT_FOUND'; end if;
  if v_idea.engine_revision<>p_expected_engine_revision then raise exception 'STALE_ENGINE'; end if;
  if v_idea.blueprint_id<>'SITE_VITRINE' or v_idea.blueprint_version<>'0.5' or v_idea.blueprint_status<>'active'
    then raise exception 'G2_BLUEPRINT_0_5_NOT_ACTIVE';
  end if;

  -- Re-materialize the structural context under the current Blueprint version first.
  v_context:=public.recompute_idea_creation_redesign_candidate_v1(p_idea_id,p_expected_engine_revision);
  select * into v_context_state from public.idea_requirement_states
  where idea_id=p_idea_id and requirement_id='SV.D04.CREATION_OR_REDESIGN';

  if v_context_state.resolution_state<>'RESOLVED'
     or not v_context_state.authority_ok
     or not (v_context_state.resolution_levels && array['ACCEPTED_AS_CURRENT','HUMAN_VALIDATED','HUMAN_DECISION']::text[])
  then
    return jsonb_build_object(
      'idea_id',p_idea_id,'engine_revision',v_idea.engine_revision,
      'context_ready',false,
      'context_requirement','SV.D04.CREATION_OR_REDESIGN',
      'context_state',v_context_state.resolution_state,
      'context_fingerprint',v_context_state.input_fingerprint,
      'materialized_count',0
    );
  end if;

  v_is_redesign:=app_private.idea_g2_is_redesign_v1(p_idea_id);

  select md5(coalesce(string_agg(
    s.id::text||':'||s.source_kind||':'||coalesce(s.locator,'')||':'||s.source_version::text||':'||
    coalesce(s.content_hash,'')||':'||s.status||':'||coalesce(s.freshness_at::text,'')||':'||s.sensitivity,
    '|' order by s.id::text
  ),'')) into v_source_inventory_fp
  from public.idea_sources s
  where s.idea_id=p_idea_id and s.status<>'superseded';

  for v_policy in select * from app_private.idea_g2_policy_v2() order by ordinal loop
    -- Applicability is conservative and deterministic.
    v_applicability:='ACTIVE';
    if v_policy.requirement_id in ('SV.D04.EXISTING_SITE','SV.D04.EXISTING_AUDIT') and not v_is_redesign then
      v_applicability:='NOT_RELEVANT';
    end if;

    -- Evidence quality and audit have been recomputed before competitor materiality is needed.
    if v_policy.requirement_id='SV.D05.COMPETITOR_SET' then
      v_materiality:=app_private.idea_g2_competitive_materiality_v2(p_idea_id);
      v_competitor_material:=coalesce((v_materiality->>'competitive_evidence_material')::boolean,true);
      if not v_competitor_material then v_applicability:='NOT_RELEVANT'; end if;
    end if;

    if v_applicability='NOT_RELEVANT' then
      v_levels:=array[]::text[];
      v_refs:='[]'::jsonb;
      v_state:='NOT_RELEVANT';
      v_lock:='VALIDATED_CURRENT';
      v_conflict:=false;
      v_accepted_unknown:=false;
    else
      select coalesce(array_agg(distinct lvl order by lvl),'{}'::text[])
      into v_levels
      from public.idea_information_requirement_refs rr
      join public.idea_information_items ii
        on ii.id=rr.information_item_id and ii.idea_id=p_idea_id and ii.state='ACTIVE'
      left join public.idea_sources src on src.id=ii.source_id
      cross join lateral unnest(rr.resolution_levels) lvl
      where rr.idea_id=p_idea_id and rr.requirement_id=v_policy.requirement_id
        and rr.relation_kind<>'CONFLICTS'
        and (ii.source_id is null or coalesce(src.status,'registered') not in ('superseded','stale','failed'));

      select coalesce(jsonb_agg(jsonb_build_object(
        'information_item_id',ii.id,
        'request_fingerprint',ii.request_fingerprint,
        'relation_kind',rr.relation_kind,
        'resolution_levels',to_jsonb(rr.resolution_levels),
        'provenance_type',ii.provenance_type,
        'confidence_class',ii.confidence_class,
        'source_id',ii.source_id,
        'source_version',src.source_version,
        'source_hash',src.content_hash,
        'source_status',src.status,
        'freshness_at',src.freshness_at
      ) order by ii.id::text,rr.relation_kind),'[]'::jsonb)
      into v_refs
      from public.idea_information_requirement_refs rr
      join public.idea_information_items ii
        on ii.id=rr.information_item_id and ii.idea_id=p_idea_id and ii.state='ACTIVE'
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
      elsif v_state='RESOLVED'
            and v_levels && array['AI_RECOMMENDATION','WORKING_ASSUMPTION']::text[]
            and not (v_levels && array['RAW_HUMAN','SOURCE_BACKED','OBSERVED','CALCULATED','ACCEPTED_AS_CURRENT','HUMAN_VALIDATED','HUMAN_DECISION','EXPERT_SIGNOFF']::text[])
        then v_lock:='AI_PROPOSED';
      elsif v_state in ('RESOLVED','ACCEPTED_UNKNOWN') then v_lock:='VALIDATED_CURRENT';
      else v_lock:='WORKING';
      end if;
    end if;

    v_deps:='{}'::jsonb;
    if v_policy.requirement_id in ('SV.D03.PRIMARY_NEED','SV.D03.OBJECTIONS_TRUST') then
      select input_fingerprint into v_dep_fp from public.idea_requirement_states
      where idea_id=p_idea_id and requirement_id='SV.D03.PRIMARY_AUDIENCE';
      v_deps:=jsonb_build_object('SV.D03.PRIMARY_AUDIENCE',v_dep_fp);
    elsif v_policy.requirement_id='SV.D04.EXISTING_SITE' then
      v_deps:=jsonb_build_object('SV.D04.CREATION_OR_REDESIGN',v_context_state.input_fingerprint);
    elsif v_policy.requirement_id='SV.D04.EXISTING_AUDIT' then
      v_deps:=jsonb_build_object('SV.D04.EXISTING_SITE',v_fps->>'SV.D04.EXISTING_SITE');
    elsif v_policy.requirement_id='SV.D05.MARKET_CONTEXT' then
      v_deps:=jsonb_build_object(
        'SV.D02.ORG_CONTEXT',(select input_fingerprint from public.idea_requirement_states where idea_id=p_idea_id and requirement_id='SV.D02.ORG_CONTEXT'),
        'SV.D03.PRIMARY_AUDIENCE',(select input_fingerprint from public.idea_requirement_states where idea_id=p_idea_id and requirement_id='SV.D03.PRIMARY_AUDIENCE'),
        'SV.D04.OFFER_BASELINE',(select input_fingerprint from public.idea_requirement_states where idea_id=p_idea_id and requirement_id='SV.D04.OFFER_BASELINE')
      );
    elsif v_policy.requirement_id='SV.D05.COMPETITOR_SET' then
      v_deps:=jsonb_build_object('SV.D05.MARKET_CONTEXT',v_fps->>'SV.D05.MARKET_CONTEXT','competitive_materiality',v_materiality);
    elsif v_policy.requirement_id='SV.D05.PATTERN_GAP_SYNTHESIS' then
      v_deps:=jsonb_build_object(
        'SV.D05.COMPETITOR_SET',v_fps->>'SV.D05.COMPETITOR_SET',
        'SV.D04.EXISTING_AUDIT',v_fps->>'SV.D04.EXISTING_AUDIT',
        'competitive_materiality',coalesce(v_materiality,app_private.idea_g2_competitive_materiality_v2(p_idea_id))
      );
    elsif v_policy.requirement_id='SV.D05.RESEARCH_SUFFICIENCY' then
      v_deps:=jsonb_build_object(
        'SV.D05.PATTERN_GAP_SYNTHESIS',v_fps->>'SV.D05.PATTERN_GAP_SYNTHESIS',
        'SV.D04.EXISTING_AUDIT',v_fps->>'SV.D04.EXISTING_AUDIT',
        'SV.D04.EVIDENCE_QUALITY',v_fps->>'SV.D04.EVIDENCE_QUALITY',
        'source_inventory_fingerprint',v_source_inventory_fp,
        'competitive_materiality',coalesce(v_materiality,app_private.idea_g2_competitive_materiality_v2(p_idea_id))
      );
    elsif v_policy.requirement_id='SV.D04.EVIDENCE_QUALITY' then
      v_deps:=jsonb_build_object('source_inventory_fingerprint',v_source_inventory_fp);
    end if;

    v_fp:=md5(jsonb_build_object(
      'blueprint','SITE_VITRINE@0.5',
      'requirement_id',v_policy.requirement_id,
      'applicability',v_applicability,
      'state',v_state,
      'levels',to_jsonb(v_levels),
      'refs',v_refs,
      'dependencies',v_deps
    )::text);
    v_fps:=v_fps||jsonb_build_object(v_policy.requirement_id,v_fp);

    insert into public.idea_requirement_states(
      idea_id,requirement_id,blueprint_version,applicability_state,resolution_state,
      criticality_current,lock_state,resolution_refs,input_fingerprint,last_evaluated_at,
      stale_reason,version,evaluated_engine_revision,resolution_levels,authority_ok
    ) values(
      p_idea_id,v_policy.requirement_id,'0.5',v_applicability,v_state,v_policy.criticality,
      v_lock,v_refs,v_fp,now(),null,1,v_idea.engine_revision,v_levels,true
    )
    on conflict (idea_id,requirement_id) do update set
      blueprint_version='0.5',applicability_state=excluded.applicability_state,
      resolution_state=excluded.resolution_state,criticality_current=excluded.criticality_current,
      lock_state=excluded.lock_state,resolution_refs=excluded.resolution_refs,
      input_fingerprint=excluded.input_fingerprint,last_evaluated_at=now(),stale_reason=null,
      version=public.idea_requirement_states.version+1,
      evaluated_engine_revision=excluded.evaluated_engine_revision,
      resolution_levels=excluded.resolution_levels,authority_ok=true;
    v_count:=v_count+1;
  end loop;

  if v_materiality is null then v_materiality:=app_private.idea_g2_competitive_materiality_v2(p_idea_id); end if;

  return jsonb_build_object(
    'idea_id',p_idea_id,'engine_revision',v_idea.engine_revision,'context_ready',true,
    'is_redesign',v_is_redesign,'competitive_materiality',v_materiality,
    'source_inventory_fingerprint',v_source_inventory_fp,
    'materialized_count',v_count,'requirement_fingerprints',v_fps
  );
end;
$function$;

revoke all on function public.recompute_idea_evidence_context_candidate_v1(uuid,bigint)
from public,anon,authenticated;
grant execute on function public.recompute_idea_evidence_context_candidate_v1(uuid,bigint)
to service_role;

-- Design notes:
-- - recompute is cache/materialization only: no engine_revision bump;
-- - context requirement must be canonically resolved first;
-- - creation makes EXISTING_SITE/EXISTING_AUDIT NOT_RELEVANT;
-- - competitor applicability is computed only after audit/evidence quality have fresh states;
-- - fingerprints include exact supporting refs and dependency fingerprints;
-- - RESEARCH_SUFFICIENCY includes source inventory fingerprint so source changes cannot leave it silently current.
