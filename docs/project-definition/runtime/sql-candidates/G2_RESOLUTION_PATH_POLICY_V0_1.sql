-- 4b4c / 2b2c — G2 Resolution Path Policy V0.1
-- Date: 2026-09-15
-- STATUS: CANDIDATE ONLY — DO NOT APPLY AS A MIGRATION.
--
-- Purpose:
--   Prevent acquisition loops by distinguishing a path that can directly
--   resolve a Requirement from a path that can only provide supporting input.
--   The planner MUST schedule only resolving_paths. supportive_paths are
--   capabilities for a resolver/executor, not standalone completion attempts.

create or replace function app_private.idea_g2_path_produced_levels_v1(p_path text)
returns text[]
language sql
immutable
set search_path=''
as $function$
  select case upper(coalesce(p_path,''))
    when 'RAW'   then array['RAW_HUMAN','ACCEPTED_AS_CURRENT']::text[]
    when 'SRC'   then array['SOURCE_BACKED','OBSERVED']::text[]
    when 'AUDIT' then array['OBSERVED','SOURCE_BACKED']::text[]
    when 'CONN'  then array['SOURCE_BACKED','OBSERVED']::text[]
    when 'WEB'   then array['SOURCE_BACKED','OBSERVED']::text[]
    when 'CALC'  then array['CALCULATED']::text[]
    when 'AI_H'  then array['WORKING_ASSUMPTION']::text[]
    when 'AI_R'  then array['AI_RECOMMENDATION']::text[]
    else array[]::text[]
  end
$function$;

revoke all on function app_private.idea_g2_path_produced_levels_v1(text)
from public,anon,authenticated;

create or replace function app_private.idea_g2_policy_v3()
returns table(
  ordinal integer,
  requirement_id text,
  title text,
  resolving_paths text[],
  supportive_paths text[],
  accepted_levels text[],
  criticality text,
  conditional_atom boolean
)
language sql
immutable
set search_path=''
as $function$
  values
    (1,'SV.D03.PRIMARY_NEED','Besoin ou job principal',
      array['RAW','SRC','WEB','CONN','AI_H']::text[],array[]::text[],
      array['RAW_HUMAN','WORKING_ASSUMPTION','SOURCE_BACKED','OBSERVED','ACCEPTED_AS_CURRENT','HUMAN_VALIDATED']::text[],
      'REQUIRED',false),
    (2,'SV.D03.OBJECTIONS_TRUST','Objections et besoins de confiance',
      array['SRC','WEB','CONN','AI_H']::text[],array[]::text[],
      array['WORKING_ASSUMPTION','SOURCE_BACKED','OBSERVED','ACCEPTED_AS_CURRENT']::text[],
      'ENHANCER',false),
    (3,'SV.D04.EXISTING_SITE','Site existant',
      array['RAW','SRC']::text[],array[]::text[],
      array['RAW_HUMAN','SOURCE_BACKED','ACCEPTED_AS_CURRENT']::text[],
      'REQUIRED',true),
    (4,'SV.D04.EXISTING_AUDIT','Audit de l''existant',
      array['AUDIT','SRC','CONN']::text[],array['AI_H']::text[],
      array['OBSERVED']::text[],
      'REQUIRED',true),
    (5,'SV.D04.EVIDENCE_QUALITY','Qualité et fraîcheur des preuves',
      array['CALC']::text[],array['AI_H']::text[],
      array['CALCULATED']::text[],
      'REQUIRED',false),
    (6,'SV.D05.MARKET_CONTEXT','Terrain de marché pertinent',
      array['CALC']::text[],array['WEB','AI_H']::text[],
      array['CALCULATED']::text[],
      'REQUIRED',false),
    (7,'SV.D05.COMPETITOR_SET','Concurrents, alternatives et références',
      array['WEB','SRC','AUDIT']::text[],array['AI_H']::text[],
      array['SOURCE_BACKED']::text[],
      'CONDITIONAL',true),
    (8,'SV.D05.PATTERN_GAP_SYNTHESIS','Patterns, faiblesses et opportunités',
      array['AI_R']::text[],array['AUDIT','AI_H']::text[],
      array['AI_RECOMMENDATION']::text[],
      'REQUIRED',false),
    (9,'SV.D05.RESEARCH_SUFFICIENCY','Suffisance et arrêt de recherche',
      array['CALC']::text[],array['AI_H']::text[],
      array['CALCULATED']::text[],
      'BLOCKING',false);
$function$;

revoke all on function app_private.idea_g2_policy_v3()
from public,anon,authenticated;

create or replace function app_private.idea_g2_path_can_resolve_v1(
  p_requirement_id text,
  p_path text
) returns boolean
language sql
immutable
set search_path=''
as $function$
  select coalesce((
    select
      upper(p_path)=any(p.resolving_paths)
      and app_private.idea_g2_path_produced_levels_v1(upper(p_path)) && p.accepted_levels
    from app_private.idea_g2_policy_v3() p
    where p.requirement_id=p_requirement_id
  ),false)
$function$;

revoke all on function app_private.idea_g2_path_can_resolve_v1(text,text)
from public,anon,authenticated;

-- Red-team invariants:
-- 1. EVIDENCE_QUALITY: AI_H cannot be scheduled as a resolving path.
-- 2. MARKET_CONTEXT: WEB/AI_H cannot be scheduled as resolving paths.
-- 3. PATTERN_GAP_SYNTHESIS: AUDIT/AI_H cannot be scheduled as resolving paths.
-- 4. RESEARCH_SUFFICIENCY: AI_H cannot be scheduled as a resolving path.
-- 5. COMPETITOR_SET: AI_H cannot create a SOURCE_BACKED set.
-- 6. Every resolving path must have at least one produced level accepted by its Requirement.
