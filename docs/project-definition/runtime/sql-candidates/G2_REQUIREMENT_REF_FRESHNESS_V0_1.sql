-- 4b4c / 2b2c — G2 Requirement ref freshness helper V0.1
-- Date: 2026-09-13
-- STATUS: COMPILE/ROLLBACK CANDIDATE ONLY — DO NOT APPLY AS A MIGRATION.
-- Requires G2_HUMAN_BASIS_LINEAGE_V0_1 schema column.

create or replace function app_private.idea_g2_requirement_ref_current_v1(
  p_idea_id uuid,
  p_action_run_id uuid,
  p_direct_target_basis text,
  p_requirement_id text,
  p_current_basis text
) returns boolean
language plpgsql
stable
security definer
set search_path=''
as $function$
begin
  if nullif(btrim(p_current_basis),'') is null then return false; end if;

  if p_action_run_id is null then
    return nullif(btrim(p_direct_target_basis),'') is not null
      and p_direct_target_basis=p_current_basis;
  end if;

  return exists(
    select 1
    from public.idea_action_runs ar
    where ar.id=p_action_run_id
      and ar.idea_id=p_idea_id
      and ar.status='succeeded'
      and ar.promoted_at is not null
      and ar.target_requirement_fingerprints->>p_requirement_id=p_current_basis
  );
end;
$function$;

revoke all on function app_private.idea_g2_requirement_ref_current_v1(
  uuid,uuid,text,text,text
) from public,anon,authenticated;

-- Invariants:
-- - machine result currentness is proven by promoted Action Run target basis;
-- - direct human result currentness is proven by ref.target_basis_fingerprint;
-- - legacy/unscoped direct refs are historical only for G2;
-- - a Requirement basis change invalidates both machine and direct-human dependent results without deleting history.
