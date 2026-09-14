-- 4b4c / 2b2c — G2 Action Input Boundary V0.2 — attempt fenced
-- Date: 2026-09-15
-- STATUS: COMPILE/ROLLBACK CANDIDATE ONLY — DO NOT APPLY AS A MIGRATION.
-- Supersedes G2_ACTION_INPUT_BOUNDARY_V0_1.sql for future packages.
-- Requires G2_ACTION_LIFECYCLE_V0_3_ATTEMPT_FENCED.sql.

create or replace function public.get_g2_action_input_candidate_v2(
  p_action_run_id uuid,
  p_current_input_fingerprint text,
  p_expected_attempt integer
) returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $function$
declare
  v_run public.idea_action_runs;
  v_idea public.ideas;
  v_target_states jsonb:='[]'::jsonb;
  v_context_states jsonb:='[]'::jsonb;
  v_items jsonb:='[]'::jsonb;
  v_sources jsonb:='[]'::jsonb;
  v_raw jsonb:=null;
  v_raw_source public.idea_sources;
  v_allowed_requirements constant text[]:=array[
    'SV.D02.ORG_CONTEXT','SV.D02.DECLARED_PROBLEM','SV.D02.PRIMARY_OBJECTIVE',
    'SV.D02.USER_OUTCOME','SV.D02.HARD_CONSTRAINTS','SV.D03.PRIMARY_AUDIENCE',
    'SV.D04.OFFER_BASELINE','SV.D04.CREATION_OR_REDESIGN',
    'SV.D03.PRIMARY_NEED','SV.D03.OBJECTIONS_TRUST','SV.D04.EXISTING_SITE',
    'SV.D04.EXISTING_AUDIT','SV.D04.EVIDENCE_QUALITY','SV.D05.MARKET_CONTEXT',
    'SV.D05.COMPETITOR_SET','SV.D05.PATTERN_GAP_SYNTHESIS','SV.D05.RESEARCH_SUFFICIENCY'
  ]::text[];
begin
  if nullif(btrim(p_current_input_fingerprint),'') is null then raise exception 'INPUT_FINGERPRINT_REQUIRED'; end if;
  if p_expected_attempt is null or p_expected_attempt<1 then raise exception 'EXPECTED_ATTEMPT_REQUIRED'; end if;

  select * into v_run from public.idea_action_runs where id=p_action_run_id;
  if v_run.id is null then raise exception 'ACTION_RUN_NOT_FOUND'; end if;
  if v_run.acquisition_path not in ('MEM','RAW','SRC','AUDIT','CONN','WEB','CALC','AI_H','AI_R') then raise exception 'G2_ACTION_PATH_REQUIRED'; end if;
  if v_run.status<>'running' then raise exception 'ACTION_RUN_NOT_RUNNING'; end if;
  if v_run.attempt<>p_expected_attempt then raise exception 'ACTION_RUN_ATTEMPT_STALE'; end if;
  if v_run.input_fingerprint is distinct from p_current_input_fingerprint then raise exception 'STALE_INPUT_FINGERPRINT'; end if;

  select * into v_idea from public.ideas where id=v_run.idea_id;
  if v_idea.id is null then raise exception 'IDEA_NOT_FOUND'; end if;
  if v_idea.blueprint_id<>'SITE_VITRINE' or v_idea.blueprint_version<>'0.5' or v_idea.blueprint_status<>'active' then raise exception 'G2_BLUEPRINT_0_5_NOT_ACTIVE'; end if;
  if v_idea.engine_revision is distinct from v_run.created_engine_revision then raise exception 'STALE_ENGINE'; end if;
  if not app_private.idea_g2_run_targets_current_v2(v_run.id) then raise exception 'STALE_TARGET_REQUIREMENT'; end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'requirement_id',rs.requirement_id,'applicability_state',rs.applicability_state,
    'resolution_state',rs.resolution_state,'criticality',rs.criticality_current,
    'resolution_levels',to_jsonb(rs.resolution_levels),'input_fingerprint',rs.input_fingerprint,
    'authority_ok',rs.authority_ok
  ) order by rs.requirement_id),'[]'::jsonb)
  into v_target_states
  from public.idea_requirement_states rs
  where rs.idea_id=v_run.idea_id and rs.requirement_id=any(v_run.target_requirement_ids);

  select coalesce(jsonb_agg(jsonb_build_object(
    'requirement_id',rs.requirement_id,'applicability_state',rs.applicability_state,
    'resolution_state',rs.resolution_state,'criticality',rs.criticality_current,
    'resolution_levels',to_jsonb(rs.resolution_levels),'input_fingerprint',rs.input_fingerprint,
    'authority_ok',rs.authority_ok,'resolution_refs',rs.resolution_refs
  ) order by rs.requirement_id),'[]'::jsonb)
  into v_context_states
  from public.idea_requirement_states rs
  where rs.idea_id=v_run.idea_id and rs.requirement_id=any(v_allowed_requirements);

  with ref_ids as (
    select distinct ref->>'information_item_id' as item_id
    from public.idea_requirement_states rs
    cross join lateral jsonb_array_elements(coalesce(rs.resolution_refs,'[]'::jsonb)) ref
    where rs.idea_id=v_run.idea_id
      and rs.requirement_id=any(v_allowed_requirements)
      and nullif(ref->>'information_item_id','') is not null
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',ii.id,'semantic_key',ii.semantic_key,'item_type',ii.item_type,
    'value',case when octet_length(convert_to(ii.value_jsonb::text,'UTF8'))<=12000 then ii.value_jsonb else jsonb_build_object('_truncated',true,'semantic_key',ii.semantic_key) end,
    'provenance_type',ii.provenance_type,'confidence_class',ii.confidence_class,
    'sensitivity',ii.sensitivity,'source_id',ii.source_id,
    'created_by_action_run_id',ii.created_by_action_run_id,'state',ii.state
  ) order by ii.created_at,ii.id),'[]'::jsonb)
  into v_items
  from ref_ids r
  join public.idea_information_items ii on ii.id::text=r.item_id and ii.idea_id=v_run.idea_id and ii.state='ACTIVE';

  select coalesce(jsonb_agg(x.payload order by x.created_at,x.id),'[]'::jsonb)
  into v_sources
  from (
    select s.id,s.created_at,jsonb_build_object(
      'id',s.id,'source_kind',s.source_kind,'locator',left(coalesce(s.locator,''),2048),
      'title',left(coalesce(s.title,''),400),'human_note',left(coalesce(s.human_note,''),1200),
      'content_hash',s.content_hash,'source_version',s.source_version,
      'fetched_at',s.fetched_at,'freshness_at',s.freshness_at,'status',s.status,'sensitivity',s.sensitivity
    ) payload
    from public.idea_sources s
    where s.idea_id=v_run.idea_id and s.status in ('registered','ingested')
    order by s.created_at,s.id limit 40
  ) x;

  if v_run.acquisition_path='RAW' then
    select * into v_raw_source
    from public.idea_sources s
    where s.idea_id=v_run.idea_id and s.source_kind='human_raw' and s.status in ('registered','ingested')
    order by case when s.idempotency_key='system:initial-original-text' then 0 else 1 end,s.created_at asc,s.id::text asc limit 1;
    if v_raw_source.id is null then raise exception 'RAW_SOURCE_NOT_FOUND'; end if;
    v_raw:=jsonb_build_object(
      'source_id',v_raw_source.id,'source_version',v_raw_source.source_version,
      'content_hash',coalesce(v_raw_source.content_hash,md5(v_idea.original_text)),
      'original_text',left(v_idea.original_text,22000)
    );
  end if;

  return jsonb_build_object(
    'idea',jsonb_build_object('id',v_idea.id,'engine_revision',v_idea.engine_revision,'title',left(v_idea.title,400),'current_description',left(v_idea.current_description,12000),'blueprint_id',v_idea.blueprint_id,'blueprint_version',v_idea.blueprint_version),
    'action_run',jsonb_build_object('id',v_run.id,'attempt',v_run.attempt,'action_type',v_run.action_type,'acquisition_path',v_run.acquisition_path,'input_fingerprint',v_run.input_fingerprint,'projection_fingerprint',v_run.projection_fingerprint,'target_requirement_ids',to_jsonb(v_run.target_requirement_ids),'target_requirement_fingerprints',v_run.target_requirement_fingerprints,'permission_scope',v_run.permission_scope),
    'target_requirement_states',v_target_states,
    'context_requirement_states',v_context_states,
    'current_information_items',v_items,
    'current_sources',v_sources,
    'raw_input',v_raw
  );
end;
$function$;

revoke all on function public.get_g2_action_input_candidate_v2(uuid,text,integer)
from public,anon,authenticated;
grant execute on function public.get_g2_action_input_candidate_v2(uuid,text,integer)
to service_role;

-- V0.2 invariants:
-- - all V0.1 bounded-input guarantees remain;
-- - executor input is additionally fenced by exact Action Run attempt;
-- - a recovered/retried attempt invalidates input reads from every older worker.
