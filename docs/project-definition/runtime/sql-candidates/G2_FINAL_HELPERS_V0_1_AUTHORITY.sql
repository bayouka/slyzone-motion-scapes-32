-- 4b4c / 2b2c — G2 final deterministic helper set V0.1
-- Date: 2026-09-13
-- STATUS: COMPILE/ROLLBACK CANDIDATE ONLY — DO NOT APPLY AS A MIGRATION.
-- Designed for G0 creation/redesign resolver V0.3 and Blueprint 0.5 candidate.

create or replace function app_private.idea_requirement_has_level_v1(
  p_idea_id uuid,
  p_requirement_id text,
  p_level text
) returns boolean
language sql
stable
security definer
set search_path=''
as $function$
  select exists(
    select 1
    from public.idea_requirement_states rs
    where rs.idea_id=p_idea_id
      and rs.requirement_id=p_requirement_id
      and rs.applicability_state='ACTIVE'
      and rs.resolution_state='RESOLVED'
      and rs.authority_ok
      and p_level=any(rs.resolution_levels)
  )
$function$;

revoke all on function app_private.idea_requirement_has_level_v1(uuid,text,text)
from public,anon,authenticated;

create or replace function app_private.idea_g2_explicit_market_compare_v1(p_idea_id uuid)
returns boolean
language sql
stable
security definer
set search_path=''
as $function$
  select exists(
    select 1
    from public.idea_information_items ii
    where ii.idea_id=p_idea_id
      and ii.state='ACTIVE'
      and ii.semantic_key in ('research.market_comparison_required','decision.market_comparison_required')
      and (
        ii.value_jsonb='true'::jsonb
        or lower(coalesce(ii.value_jsonb->>'value','false'))='true'
        or lower(coalesce(ii.value_jsonb->>'required','false'))='true'
      )
  )
$function$;

revoke all on function app_private.idea_g2_explicit_market_compare_v1(uuid)
from public,anon,authenticated;

create or replace function app_private.idea_g2_has_material_market_conflict_v1(p_idea_id uuid)
returns boolean
language sql
stable
security definer
set search_path=''
as $function$
  select exists(
    select 1
    from public.idea_ledger_entries le
    where le.idea_id=p_idea_id
      and le.entry_type='CONFLICT'
      and le.state='open'
      and le.materiality in ('SUBSTANTIVE','CRITICAL')
      and (
        jsonb_array_length(le.target_refs)=0
        or exists(
          select 1 from jsonb_array_elements(le.target_refs) tr
          where tr->>'requirement_id' in (
            'SV.D03.PRIMARY_NEED',
            'SV.D04.EXISTING_AUDIT',
            'SV.D04.EVIDENCE_QUALITY',
            'SV.D05.MARKET_CONTEXT',
            'SV.D05.COMPETITOR_SET',
            'SV.D05.PATTERN_GAP_SYNTHESIS',
            'SV.D05.RESEARCH_SUFFICIENCY'
          )
        )
      )
  )
$function$;

revoke all on function app_private.idea_g2_has_material_market_conflict_v1(uuid)
from public,anon,authenticated;

create or replace function app_private.idea_g2_path_has_input_v1(
  p_idea_id uuid,
  p_path text,
  p_requirement_id text
) returns boolean
language sql
stable
security definer
set search_path=''
as $function$
  select case p_path
    when 'MEM' then exists(
      select 1 from public.idea_information_items ii
      where ii.idea_id=p_idea_id and ii.state='ACTIVE'
    )
    when 'RAW' then exists(
      select 1 from public.idea_sources s
      where s.idea_id=p_idea_id and s.source_kind='human_raw'
        and s.status in ('registered','ingested')
    )
    when 'SRC' then exists(
      select 1 from public.idea_sources s
      where s.idea_id=p_idea_id and s.source_kind<>'human_raw'
        and s.status in ('registered','ingested')
    )
    when 'AUDIT' then exists(
      select 1 from public.idea_sources s
      where s.idea_id=p_idea_id
        and s.source_kind in ('url','document','image','system_observation')
        and s.status in ('registered','ingested')
    )
    when 'CONN' then true
    when 'WEB' then true
    when 'CALC' then true
    when 'AI_H' then true
    when 'AI_R' then true
    else false
  end
$function$;

revoke all on function app_private.idea_g2_path_has_input_v1(uuid,text,text)
from public,anon,authenticated;

create or replace function app_private.idea_g2_policy_v2()
returns table(
  ordinal integer,
  requirement_id text,
  title text,
  preferred_paths text[],
  accepted_levels text[],
  criticality text,
  conditional_atom boolean
)
language sql
immutable
set search_path=''
as $function$
  values
    (1,'SV.D03.PRIMARY_NEED','Besoin ou job principal',array['RAW','SRC','WEB','CONN','AI_H']::text[],array['WORKING_ASSUMPTION','ACCEPTED_AS_CURRENT','HUMAN_VALIDATED']::text[],'REQUIRED',false),
    (2,'SV.D03.OBJECTIONS_TRUST','Objections et besoins de confiance',array['SRC','WEB','CONN','AI_H']::text[],array['WORKING_ASSUMPTION','SOURCE_BACKED','OBSERVED','ACCEPTED_AS_CURRENT']::text[],'ENHANCER',false),
    (3,'SV.D04.EXISTING_SITE','Site existant',array['RAW','SRC']::text[],array['RAW_HUMAN','SOURCE_BACKED','ACCEPTED_AS_CURRENT']::text[],'REQUIRED',true),
    (4,'SV.D04.EXISTING_AUDIT','Audit de l''existant',array['AUDIT','SRC','CONN','AI_H']::text[],array['OBSERVED']::text[],'REQUIRED',true),
    (5,'SV.D04.EVIDENCE_QUALITY','Qualité et fraîcheur des preuves',array['CALC','AI_H']::text[],array['CALCULATED']::text[],'REQUIRED',false),
    (6,'SV.D05.MARKET_CONTEXT','Terrain de marché pertinent',array['CALC','WEB','AI_H']::text[],array['CALCULATED']::text[],'REQUIRED',false),
    (7,'SV.D05.COMPETITOR_SET','Concurrents, alternatives et références',array['WEB','SRC','AUDIT','AI_H']::text[],array['SOURCE_BACKED']::text[],'CONDITIONAL',true),
    (8,'SV.D05.PATTERN_GAP_SYNTHESIS','Patterns, faiblesses et opportunités',array['AUDIT','AI_H','AI_R']::text[],array['AI_RECOMMENDATION']::text[],'REQUIRED',false),
    (9,'SV.D05.RESEARCH_SUFFICIENCY','Suffisance et arrêt de recherche',array['CALC','AI_H']::text[],array['CALCULATED']::text[],'BLOCKING',false);
$function$;

revoke all on function app_private.idea_g2_policy_v2()
from public,anon,authenticated;

create or replace function app_private.idea_g2_creation_redesign_value_v1(p_idea_id uuid)
returns text
language sql
stable
security definer
set search_path=''
as $function$
  select ref->>'normalized_value'
  from public.idea_requirement_states rs
  cross join lateral jsonb_array_elements(rs.resolution_refs) ref
  where rs.idea_id=p_idea_id
    and rs.requirement_id='SV.D04.CREATION_OR_REDESIGN'
    and rs.applicability_state='ACTIVE'
    and rs.resolution_state='RESOLVED'
    and rs.authority_ok
    and ref->>'normalized_value' in ('creation','redesign')
  order by coalesce(nullif(ref->>'authority_tier','')::integer,99),
           ref->>'information_item_id'
  limit 1
$function$;

revoke all on function app_private.idea_g2_creation_redesign_value_v1(uuid)
from public,anon,authenticated;

create or replace function app_private.idea_g2_is_redesign_v2(p_idea_id uuid)
returns boolean
language sql
stable
security definer
set search_path=''
as $function$
  select coalesce(app_private.idea_g2_creation_redesign_value_v1(p_idea_id)='redesign',false)
$function$;

revoke all on function app_private.idea_g2_is_redesign_v2(uuid)
from public,anon,authenticated;

create or replace function app_private.idea_g2_competitive_materiality_v4(p_idea_id uuid)
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
  v_is_redesign:=app_private.idea_g2_is_redesign_v2(p_idea_id);
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
    'creation_redesign_value',app_private.idea_g2_creation_redesign_value_v1(p_idea_id),
    'audit_observed',v_audit_observed,
    'evidence_quality_calculated',v_evidence_quality,
    'explicit_market_compare',v_explicit_compare,
    'material_market_conflict',v_material_conflict
  );
end;
$function$;

revoke all on function app_private.idea_g2_competitive_materiality_v4(uuid)
from public,anon,authenticated;

create or replace function app_private.idea_g2_dependency_ready_v3(
  p_idea_id uuid,
  p_requirement_id text,
  p_competitor_material boolean
) returns boolean
language plpgsql
stable
security definer
set search_path=''
as $function$
declare
  v_is_redesign boolean;
  v_competitor_ready boolean;
  v_audit_ready boolean;
begin
  v_is_redesign:=app_private.idea_g2_is_redesign_v2(p_idea_id);
  v_competitor_ready:=p_competitor_material and app_private.idea_requirement_has_level_v1(
    p_idea_id,'SV.D05.COMPETITOR_SET','SOURCE_BACKED'
  );
  v_audit_ready:=v_is_redesign and app_private.idea_requirement_has_level_v1(
    p_idea_id,'SV.D04.EXISTING_AUDIT','OBSERVED'
  );

  return case p_requirement_id
    when 'SV.D03.PRIMARY_NEED' then exists(
      select 1 from public.idea_requirement_states rs
      where rs.idea_id=p_idea_id and rs.requirement_id='SV.D03.PRIMARY_AUDIENCE'
        and rs.applicability_state='ACTIVE' and rs.resolution_state='RESOLVED'
        and rs.authority_ok
    )
    when 'SV.D04.EXISTING_SITE' then v_is_redesign
    when 'SV.D04.EXISTING_AUDIT' then app_private.idea_requirement_has_level_v1(
      p_idea_id,'SV.D04.EXISTING_SITE','SOURCE_BACKED'
    ) or app_private.idea_requirement_has_level_v1(
      p_idea_id,'SV.D04.EXISTING_SITE','RAW_HUMAN'
    ) or app_private.idea_requirement_has_level_v1(
      p_idea_id,'SV.D04.EXISTING_SITE','ACCEPTED_AS_CURRENT'
    )
    when 'SV.D05.MARKET_CONTEXT' then
      (select count(*)=3 from public.idea_requirement_states rs
       where rs.idea_id=p_idea_id
         and rs.requirement_id in ('SV.D02.ORG_CONTEXT','SV.D03.PRIMARY_AUDIENCE','SV.D04.OFFER_BASELINE')
         and rs.applicability_state='ACTIVE'
         and rs.resolution_state='RESOLVED'
         and rs.authority_ok)
    when 'SV.D05.COMPETITOR_SET' then app_private.idea_requirement_has_level_v1(
      p_idea_id,'SV.D05.MARKET_CONTEXT','CALCULATED'
    )
    when 'SV.D05.PATTERN_GAP_SYNTHESIS' then (v_competitor_ready or v_audit_ready)
    when 'SV.D05.RESEARCH_SUFFICIENCY' then
      (app_private.idea_requirement_has_level_v1(
        p_idea_id,'SV.D05.PATTERN_GAP_SYNTHESIS','AI_RECOMMENDATION'
      ) or v_audit_ready)
    else true
  end;
end;
$function$;

revoke all on function app_private.idea_g2_dependency_ready_v3(uuid,text,boolean)
from public,anon,authenticated;

-- Invariants:
-- - redesign derives only from the current G0 structural resolution;
-- - EXISTING_SITE history cannot define current creation/redesign context;
-- - direct human structural correction outranks machine extraction through G0 resolution refs;
-- - materiality remains deterministic and independent of COMPETITOR_SET's own output;
-- - dependency readiness consumes basis-aware materialized Requirement state.
