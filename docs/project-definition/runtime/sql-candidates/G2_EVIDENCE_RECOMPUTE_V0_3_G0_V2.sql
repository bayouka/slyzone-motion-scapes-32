-- 4b4c / 2b2c — G2 Evidence / Market recompute V0.3 — Basis Fingerprint + G0 V0.2
-- Date: 2026-09-13
-- STATUS: COMPILE/ROLLBACK CANDIDATE ONLY — DO NOT APPLY AS A MIGRATION.
-- Requires G0_CREATION_REDESIGN_RESOLVER_V0_2_BASIS + final G2 helpers.
-- Blueprint 0.5 remains NON ACTIVE.

create or replace function app_private.idea_requirement_resolution_signature_v1(
  p_idea_id uuid,
  p_requirement_id text
) returns text
language sql
stable
security definer
set search_path=''
as $function$
  select md5(jsonb_build_object(
    'requirement_id',rs.requirement_id,
    'input_fingerprint',rs.input_fingerprint,
    'applicability_state',rs.applicability_state,
    'resolution_state',rs.resolution_state,
    'resolution_levels',to_jsonb(rs.resolution_levels),
    'resolution_refs',rs.resolution_refs,
    'authority_ok',rs.authority_ok
  )::text)
  from public.idea_requirement_states rs
  where rs.idea_id=p_idea_id and rs.requirement_id=p_requirement_id
$function$;

revoke all on function app_private.idea_requirement_resolution_signature_v1(uuid,text)
from public,anon,authenticated;

create or replace function app_private.idea_source_inventory_fingerprint_v1(p_idea_id uuid)
returns text
language sql
stable
security definer
set search_path=''
as $function$
  select md5(coalesce(string_agg(
    s.id::text||':'||s.source_kind||':'||coalesce(s.locator,'')||':'||s.source_version::text||':'||
    coalesce(s.content_hash,'')||':'||s.status||':'||coalesce(s.freshness_at::text,'')||':'||s.sensitivity,
    '|' order by s.id::text
  ),''))
  from public.idea_sources s
  where s.idea_id=p_idea_id and s.status<>'superseded'
$function$;

revoke all on function app_private.idea_source_inventory_fingerprint_v1(uuid)
from public,anon,authenticated;

create or replace function app_private.idea_g2_competitive_materiality_v3(p_idea_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $function$
declare
  v_is_redesign boolean:=false;
  v_audit_observed boolean:=false;
  v_evidence_quality boolean:=false;
  v_explicit_compare boolean:=false;
  v_material_conflict boolean:=false;
  v_material boolean:=true;
  v_reason text;
begin
  v_is_redesign:=app_private.idea_g2_is_redesign_v1(p_idea_id);
  v_audit_observed:=app_private.idea_requirement_has_level_v1(
    p_idea_id,'SV.D04.EXISTING_AUDIT','OBSERVED'
  );
  v_evidence_quality:=app_private.idea_requirement_has_level_v1(
    p_idea_id,'SV.D04.EVIDENCE_QUALITY','CALCULATED'
  );
  v_explicit_compare:=app_private.idea_g2_explicit_market_compare_v1(p_idea_id);
  v_material_conflict:=app_private.idea_g2_has_material_market_conflict_v1(p_idea_id);

  if v_explicit_compare then
    v_material:=true; v_reason:='EXPLICIT_MARKET_COMPARISON_REQUIRED';
  elsif v_material_conflict then
    v_material:=true; v_reason:='MATERIAL_MARKET_CONFLICT_REQUIRES_TRIANGULATION';
  elsif v_is_redesign and v_audit_observed and v_evidence_quality then
    v_material:=false; v_reason:='CURRENT_AUDIT_BASELINE_SUFFICIENT_FOR_G2';
  else
    v_material:=true; v_reason:='DEFAULT_EXTERNAL_BASELINE_REQUIRED';
  end if;

  return jsonb_build_object(
    'competitive_evidence_material',v_material,
    'reason',v_reason,
    'is_redesign',v_is_redesign,
    'audit_observed',v_audit_observed,
    'evidence_quality_calculated',v_evidence_quality,
    'explicit_market_compare',v_explicit_compare,
    'material_market_conflict',v_material_conflict
  );
end;
$function$;

revoke all on function app_private.idea_g2_competitive_materiality_v3(uuid)
from public,anon,authenticated;

create or replace function app_private.idea_g2_basis_unknown_accepted_v1(
  p_idea_id uuid,
  p_requirement_id text,
  p_basis_fingerprint text
) returns boolean
language sql
stable
security definer
set search_path=''
as $function$
  select exists(
    select 1
    from public.idea_ledger_entries le
    where le.idea_id=p_idea_id
      and le.entry_type='ACCEPTED_UNKNOWN'
      and le.state='accepted'
      and exists(
        select 1
        from jsonb_array_elements(le.target_refs) tr
        where tr->>'requirement_id'=p_requirement_id
          and tr->>'basis_fingerprint'=p_basis_fingerprint
      )
  )
$function$;

revoke all on function app_private.idea_g2_basis_unknown_accepted_v1(uuid,text,text)
from public,anon,authenticated;

create or replace function public.recompute_idea_evidence_context_candidate_v3(
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
  v_basis text;
  v_basis_payload jsonb;
  v_fps jsonb:='{}'::jsonb;
  v_signatures jsonb:='{}'::jsonb;
  v_conflict boolean;
  v_accepted_unknown boolean;
  v_is_redesign boolean;
  v_materiality jsonb;
  v_materiality_fp text;
  v_competitor_material boolean:=true;
  v_source_inventory_fp text;
  v_count integer:=0;
  v_parent_sig text;
  v_parent_sig_2 text;
  v_parent_sig_3 text;
  v_resolution_sig text;
begin
  select * into v_idea from public.ideas where id=p_idea_id for update;
  if v_idea.id is null then raise exception 'IDEA_NOT_FOUND'; end if;
  if v_idea.engine_revision<>p_expected_engine_revision then raise exception 'STALE_ENGINE'; end if;
  if v_idea.blueprint_id<>'SITE_VITRINE' or v_idea.blueprint_version<>'0.5' or v_idea.blueprint_status<>'active'
    then raise exception 'G2_BLUEPRINT_0_5_NOT_ACTIVE';
  end if;

  v_context:=public.recompute_idea_creation_redesign_candidate_v2(
    p_idea_id,p_expected_engine_revision
  );
  select * into v_context_state
  from public.idea_requirement_states
  where idea_id=p_idea_id and requirement_id='SV.D04.CREATION_OR_REDESIGN';

  if v_context_state.resolution_state<>'RESOLVED'
     or not v_context_state.authority_ok
     or not (v_context_state.resolution_levels && array[
       'ACCEPTED_AS_CURRENT','HUMAN_VALIDATED','HUMAN_DECISION'
     ]::text[])
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
  v_source_inventory_fp:=app_private.idea_source_inventory_fingerprint_v1(p_idea_id);

  for v_policy in select * from app_private.idea_g2_policy_v2() order by ordinal loop
    v_applicability:='ACTIVE';
    if v_policy.requirement_id in ('SV.D04.EXISTING_SITE','SV.D04.EXISTING_AUDIT')
       and not v_is_redesign then
      v_applicability:='NOT_RELEVANT';
    end if;

    if v_policy.requirement_id='SV.D05.COMPETITOR_SET' then
      v_materiality:=app_private.idea_g2_competitive_materiality_v3(p_idea_id);
      v_competitor_material:=coalesce(
        (v_materiality->>'competitive_evidence_material')::boolean,true
      );
      if not v_competitor_material then v_applicability:='NOT_RELEVANT'; end if;
    end if;

    v_basis_payload:=jsonb_build_object(
      'blueprint','SITE_VITRINE@0.5',
      'requirement_id',v_policy.requirement_id,
      'applicability',v_applicability
    );

    if v_policy.requirement_id in ('SV.D03.PRIMARY_NEED','SV.D03.OBJECTIONS_TRUST') then
      v_parent_sig:=app_private.idea_requirement_resolution_signature_v1(
        p_idea_id,'SV.D03.PRIMARY_AUDIENCE'
      );
      v_basis_payload:=v_basis_payload||jsonb_build_object(
        'primary_audience_signature',v_parent_sig
      );
    elsif v_policy.requirement_id='SV.D04.EXISTING_SITE' then
      v_parent_sig:=app_private.idea_requirement_resolution_signature_v1(
        p_idea_id,'SV.D04.CREATION_OR_REDESIGN'
      );
      v_basis_payload:=v_basis_payload||jsonb_build_object(
        'creation_redesign_signature',v_parent_sig
      );
    elsif v_policy.requirement_id='SV.D04.EXISTING_AUDIT' then
      v_parent_sig:=app_private.idea_requirement_resolution_signature_v1(
        p_idea_id,'SV.D04.EXISTING_SITE'
      );
      v_basis_payload:=v_basis_payload||jsonb_build_object(
        'existing_site_signature',v_parent_sig
      );
    elsif v_policy.requirement_id='SV.D04.EVIDENCE_QUALITY' then
      v_basis_payload:=v_basis_payload||jsonb_build_object(
        'source_inventory_fingerprint',v_source_inventory_fp
      );
    elsif v_policy.requirement_id='SV.D05.MARKET_CONTEXT' then
      v_parent_sig:=app_private.idea_requirement_resolution_signature_v1(
        p_idea_id,'SV.D02.ORG_CONTEXT'
      );
      v_parent_sig_2:=app_private.idea_requirement_resolution_signature_v1(
        p_idea_id,'SV.D03.PRIMARY_AUDIENCE'
      );
      v_parent_sig_3:=app_private.idea_requirement_resolution_signature_v1(
        p_idea_id,'SV.D04.OFFER_BASELINE'
      );
      v_basis_payload:=v_basis_payload||jsonb_build_object(
        'org_context_signature',v_parent_sig,
        'primary_audience_signature',v_parent_sig_2,
        'offer_baseline_signature',v_parent_sig_3
      );
    elsif v_policy.requirement_id='SV.D05.COMPETITOR_SET' then
      v_parent_sig:=app_private.idea_requirement_resolution_signature_v1(
        p_idea_id,'SV.D05.MARKET_CONTEXT'
      );
      v_materiality_fp:=md5(coalesce(v_materiality,'{}'::jsonb)::text);
      v_basis_payload:=v_basis_payload||jsonb_build_object(
        'market_context_signature',v_parent_sig,
        'competitive_materiality_fingerprint',v_materiality_fp
      );
    elsif v_policy.requirement_id='SV.D05.PATTERN_GAP_SYNTHESIS' then
      v_parent_sig:=app_private.idea_requirement_resolution_signature_v1(
        p_idea_id,'SV.D05.COMPETITOR_SET'
      );
      v_parent_sig_2:=app_private.idea_requirement_resolution_signature_v1(
        p_idea_id,'SV.D04.EXISTING_AUDIT'
      );
      if v_materiality is null then
        v_materiality:=app_private.idea_g2_competitive_materiality_v3(p_idea_id);
      end if;
      v_materiality_fp:=md5(v_materiality::text);
      v_basis_payload:=v_basis_payload||jsonb_build_object(
        'competitor_set_signature',v_parent_sig,
        'existing_audit_signature',v_parent_sig_2,
        'competitive_materiality_fingerprint',v_materiality_fp
      );
    elsif v_policy.requirement_id='SV.D05.RESEARCH_SUFFICIENCY' then
      v_parent_sig:=app_private.idea_requirement_resolution_signature_v1(
        p_idea_id,'SV.D05.PATTERN_GAP_SYNTHESIS'
      );
      v_parent_sig_2:=app_private.idea_requirement_resolution_signature_v1(
        p_idea_id,'SV.D04.EXISTING_AUDIT'
      );
      v_parent_sig_3:=app_private.idea_requirement_resolution_signature_v1(
        p_idea_id,'SV.D04.EVIDENCE_QUALITY'
      );
      if v_materiality is null then
        v_materiality:=app_private.idea_g2_competitive_materiality_v3(p_idea_id);
      end if;
      v_materiality_fp:=md5(v_materiality::text);
      v_basis_payload:=v_basis_payload||jsonb_build_object(
        'pattern_gap_signature',v_parent_sig,
        'existing_audit_signature',v_parent_sig_2,
        'evidence_quality_signature',v_parent_sig_3,
        'source_inventory_fingerprint',v_source_inventory_fp,
        'competitive_materiality_fingerprint',v_materiality_fp
      );
    end if;

    v_basis:=md5(v_basis_payload::text);
    v_fps:=v_fps||jsonb_build_object(v_policy.requirement_id,v_basis);

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
        on ii.id=rr.information_item_id
       and ii.idea_id=p_idea_id
       and ii.state='ACTIVE'
      left join public.idea_sources src on src.id=ii.source_id
      left join public.idea_action_runs ar on ar.id=ii.created_by_action_run_id
      cross join lateral unnest(rr.resolution_levels) lvl
      where rr.idea_id=p_idea_id
        and rr.requirement_id=v_policy.requirement_id
        and rr.relation_kind<>'CONFLICTS'
        and (ii.source_id is null or coalesce(src.status,'registered') not in ('superseded','stale','failed'))
        and (
          ii.created_by_action_run_id is null
          or (
            ar.idea_id=p_idea_id
            and ar.status='succeeded'
            and ar.promoted_at is not null
            and ar.target_requirement_fingerprints->>v_policy.requirement_id=v_basis
          )
        );

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
        'freshness_at',src.freshness_at,
        'created_by_action_run_id',ii.created_by_action_run_id
      ) order by ii.id::text,rr.relation_kind),'[]'::jsonb)
      into v_refs
      from public.idea_information_requirement_refs rr
      join public.idea_information_items ii
        on ii.id=rr.information_item_id
       and ii.idea_id=p_idea_id
       and ii.state='ACTIVE'
      left join public.idea_sources src on src.id=ii.source_id
      left join public.idea_action_runs ar on ar.id=ii.created_by_action_run_id
      where rr.idea_id=p_idea_id
        and rr.requirement_id=v_policy.requirement_id
        and rr.relation_kind<>'CONFLICTS'
        and (ii.source_id is null or coalesce(src.status,'registered') not in ('superseded','stale','failed'))
        and (
          ii.created_by_action_run_id is null
          or (
            ar.idea_id=p_idea_id
            and ar.status='succeeded'
            and ar.promoted_at is not null
            and ar.target_requirement_fingerprints->>v_policy.requirement_id=v_basis
          )
        );

      select exists(
        select 1
        from public.idea_information_requirement_refs rr
        join public.idea_information_items ii
          on ii.id=rr.information_item_id
         and ii.idea_id=p_idea_id
         and ii.state='ACTIVE'
        left join public.idea_action_runs ar on ar.id=ii.created_by_action_run_id
        where rr.idea_id=p_idea_id
          and rr.requirement_id=v_policy.requirement_id
          and rr.relation_kind='CONFLICTS'
          and (
            ii.created_by_action_run_id is null
            or (
              ar.idea_id=p_idea_id
              and ar.status='succeeded'
              and ar.promoted_at is not null
              and ar.target_requirement_fingerprints->>v_policy.requirement_id=v_basis
            )
          )
      ) or exists(
        select 1
        from public.idea_ledger_entries le
        where le.idea_id=p_idea_id
          and le.entry_type='CONFLICT'
          and le.state='open'
          and exists(
            select 1 from jsonb_array_elements(le.target_refs) tr
            where tr->>'requirement_id'=v_policy.requirement_id
          )
      ) into v_conflict;

      v_accepted_unknown:=app_private.idea_g2_basis_unknown_accepted_v1(
        p_idea_id,v_policy.requirement_id,v_basis
      );

      if v_conflict then v_state:='CONFLICTED';
      elsif v_accepted_unknown then v_state:='ACCEPTED_UNKNOWN';
      elsif cardinality(v_levels)>0 then v_state:='RESOLVED';
      else v_state:='UNRESOLVED';
      end if;

      if v_state='CONFLICTED' then v_lock:='REVIEW_REQUIRED';
      elsif v_state='RESOLVED'
            and v_levels && array['AI_RECOMMENDATION','WORKING_ASSUMPTION']::text[]
            and not (v_levels && array[
              'RAW_HUMAN','SOURCE_BACKED','OBSERVED','CALCULATED','ACCEPTED_AS_CURRENT',
              'HUMAN_VALIDATED','HUMAN_DECISION','EXPERT_SIGNOFF'
            ]::text[])
        then v_lock:='AI_PROPOSED';
      elsif v_state in ('RESOLVED','ACCEPTED_UNKNOWN') then v_lock:='VALIDATED_CURRENT';
      else v_lock:='WORKING';
      end if;
    end if;

    insert into public.idea_requirement_states(
      idea_id,requirement_id,blueprint_version,applicability_state,resolution_state,
      criticality_current,lock_state,resolution_refs,input_fingerprint,last_evaluated_at,
      stale_reason,version,evaluated_engine_revision,resolution_levels,authority_ok
    ) values(
      p_idea_id,v_policy.requirement_id,'0.5',v_applicability,v_state,v_policy.criticality,
      v_lock,v_refs,v_basis,now(),null,1,v_idea.engine_revision,v_levels,true
    )
    on conflict (idea_id,requirement_id) do update set
      blueprint_version='0.5',
      applicability_state=excluded.applicability_state,
      resolution_state=excluded.resolution_state,
      criticality_current=excluded.criticality_current,
      lock_state=excluded.lock_state,
      resolution_refs=excluded.resolution_refs,
      input_fingerprint=excluded.input_fingerprint,
      last_evaluated_at=now(),
      stale_reason=null,
      version=public.idea_requirement_states.version+1,
      evaluated_engine_revision=excluded.evaluated_engine_revision,
      resolution_levels=excluded.resolution_levels,
      authority_ok=true;

    v_resolution_sig:=app_private.idea_requirement_resolution_signature_v1(
      p_idea_id,v_policy.requirement_id
    );
    v_signatures:=v_signatures||jsonb_build_object(
      v_policy.requirement_id,v_resolution_sig
    );
    v_count:=v_count+1;
  end loop;

  if v_materiality is null then
    v_materiality:=app_private.idea_g2_competitive_materiality_v3(p_idea_id);
  end if;

  return jsonb_build_object(
    'idea_id',p_idea_id,
    'engine_revision',v_idea.engine_revision,
    'context_ready',true,
    'is_redesign',v_is_redesign,
    'competitive_materiality',v_materiality,
    'source_inventory_fingerprint',v_source_inventory_fp,
    'materialized_count',v_count,
    'requirement_basis_fingerprints',v_fps,
    'requirement_resolution_signatures',v_signatures
  );
end;
$function$;

revoke all on function public.recompute_idea_evidence_context_candidate_v3(uuid,bigint)
from public,anon,authenticated;
grant execute on function public.recompute_idea_evidence_context_candidate_v3(uuid,bigint)
to service_role;

-- V0.3 invariants:
-- - all V0.2 basis semantics preserved;
-- - structural context recompute now uses G0 resolver V0.2 basis-safe contract;
-- - no dependency on superseded G0 resolver V0.1;
-- - recompute remains cache/materialization only: no engine_revision bump.
