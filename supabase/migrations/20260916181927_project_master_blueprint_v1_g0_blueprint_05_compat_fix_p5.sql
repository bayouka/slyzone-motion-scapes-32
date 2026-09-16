-- 4b4c Project Master Blueprint V1 — G0 SITE_VITRINE 0.5 compatibility fix P5
-- Forward-only correction after confirming the live Blueprint Fit authority assigns new SITE_VITRINE Ideas to 0.5.
-- Existing 0.4 Ideas remain supported. The fit decision version must exactly match the current Idea version.

do $migration$
declare
  v_oid oid;
  v_def text;
  v_old_gate text := $$and v_idea.blueprint_version='0.4'
       and v_idea.blueprint_status='active'$$;
  v_new_gate text := $$and v_idea.blueprint_version in ('0.4','0.5')
       and v_fit.blueprint_version=v_idea.blueprint_version
       and v_idea.blueprint_status='active'$$;
  v_old_coverage text := $$'active_idea_blueprint','SITE_VITRINE@0.4',
      'site_vitrine_0_5_activation','UNCHANGED_NON_ACTIVE',$$;
  v_new_coverage text := $$'active_idea_blueprint','SITE_VITRINE@0.5',
      'legacy_idea_blueprint_supported','SITE_VITRINE@0.4',
      'blueprint_activation_changed_by_bridge',false,$$;
begin
  select p.oid into v_oid
  from pg_proc p
  join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public'
    and p.proname='get_canonical_idea_preproject_readiness_v1'
    and pg_get_function_identity_arguments(p.oid)='p_idea_id uuid';

  if v_oid is null then raise exception 'CANONICAL_PREPROJECT_EVALUATOR_NOT_FOUND'; end if;
  v_def := pg_get_functiondef(v_oid);

  if position(v_old_gate in v_def)=0 then raise exception 'EXPECTED_G0_04_GATE_FRAGMENT_NOT_FOUND'; end if;
  if position(v_old_coverage in v_def)=0 then raise exception 'EXPECTED_G0_04_COVERAGE_FRAGMENT_NOT_FOUND'; end if;

  v_def := replace(v_def,v_old_gate,v_new_gate);
  v_def := replace(v_def,v_old_coverage,v_new_coverage);
  execute v_def;
end;
$migration$;

revoke all on function public.get_canonical_idea_preproject_readiness_v1(uuid) from public,anon,authenticated;
grant execute on function public.get_canonical_idea_preproject_readiness_v1(uuid) to service_role;
