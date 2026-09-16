import fs from 'node:fs';

const migrationDir='supabase/migrations';
const exists=(name)=>fs.existsSync(`${migrationDir}/${name}`);
const read=(name)=>fs.readFileSync(`${migrationDir}/${name}`,'utf8');
const assert=(ok,msg)=>{if(!ok){console.error(`MIGRATION HISTORY V2 CHECK FAILED: ${msg}`);process.exit(1);}};

// Verified production tail. Filenames here must match supabase_migrations.schema_migrations exactly.
const requiredProductionTail=[
  '20260911210308_pending_call_invite_v2.sql',
  '20260911220328_fix_call_access_rls_execute_v1.sql',
  '20260911220911_call_sync_v2.sql',
  '20260911232657_call_media_sfu_v3.sql',
  '20260911233259_call_media_catalog_active_session_v3.sql',
  '20260912000407_harden_call_media_v3_rpc_execute.sql',
  '20260915100519_activate_g2_backend_v07_blueprint_05.sql',
  '20260915124420_g2_promotion_disposition_v08.sql',
  '20260915164534_g2_src_snapshot_infrastructure_v02.sql',
  '20260915225735_g2_src_snapshot_eligibility_hardening_v01.sql',
  '20260916145814_project_master_blueprint_v1_shadow_requirement_mapping.sql',
  '20260916153234_project_master_blueprint_v1_canonical_bridge_read_model.sql',
  '20260916153749_project_master_blueprint_v1_core_graph_runtime.sql',
  '20260916154153_project_master_blueprint_v1_delivery_lot_dependency_closure.sql',
  '20260916154611_project_master_blueprint_v1_dependency_closure_predicates.sql',
  '20260916155201_project_master_blueprint_v1_quality_testability_predicates.sql',
  '20260916155544_project_master_blueprint_v1_baseline_handoff_predicates.sql',
  '20260916155824_project_master_blueprint_v1_g4_rfd_lot.sql',
  '20260916155938_project_master_blueprint_v1_g5_rfd_project.sql',
  '20260916162910_project_master_blueprint_v1_g4_g5_idempotent_approval.sql',
  '20260916165026_project_master_blueprint_v1_complete_rfd_predicate_set.sql',
  '20260916174121_project_master_blueprint_v1_g0_g3_preproject_bridge_p3.sql',
  '20260916174307_project_master_blueprint_v1_g0_g3_preproject_bridge_p3_g0_column_fix.sql',
  '20260916174852_project_master_blueprint_v1_g3_promotion_actor_hardening_p4.sql',
  '20260916181927_project_master_blueprint_v1_g0_blueprint_05_compat_fix_p5.sql',
  '20260916185631_project_master_blueprint_v1_g3_server_derived_promotion_v1.sql',
  '20260916193059_disable_legacy_idea_decision_conversion_v1.sql',
  '20260916193741_fix_canonical_rfd_reapproval_after_revision_v1.sql',
  '20260916194055_workspace_projection_canonical_delivery_authority_v1.sql',
  '20260916200421_project_master_blueprint_v1_fk_index_hardening.sql',
  '20260916200618_ideas_legacy_rls_policy_split_v1.sql',
  '20260916200626_ideas_legacy_table_grants_hardening_v1.sql',
  '20260916201046_ideas_fk_index_hardening_v1.sql',
  '20260916201151_ideas_rls_initplan_optimization_v1.sql',
];

const missing=requiredProductionTail.filter((name)=>!exists(name));
assert(missing.length===0,`missing verified production migration(s): ${missing.join(', ')}`);

// This alias existed briefly in GitHub but was never the production migration version.
assert(!exists('20260916182111_project_master_blueprint_v1_g0_blueprint_05_compat_fix_p5.sql'),'non-production G0 compatibility timestamp alias must not exist');

const heartbeat=read('20260909093700_revoke_public_call_heartbeat.sql');
for(const marker of [
  'revoke all on function public.heartbeat_call_v1(uuid) from public',
  'revoke all on function public.heartbeat_call_v1(uuid) from anon',
  'grant execute on function public.heartbeat_call_v1(uuid) to authenticated',
]) assert(heartbeat.includes(marker),`heartbeat ACL guard missing: ${marker}`);

const callAccess=read('20260911220328_fix_call_access_rls_execute_v1.sql');
assert(callAccess.includes('grant execute on function app_private.can_access_call_v1(uuid) to authenticated'),'call-access helper authenticated grant missing');

const mediaAcl=read('20260912000407_harden_call_media_v3_rpc_execute.sql');
for(const fn of [
  'register_call_provider_session_v3(uuid,text)',
  'upsert_call_media_track_v3(uuid,text,text,text,text)',
  'end_call_media_track_v3(uuid,text)',
  'end_all_call_media_tracks_v3(uuid)',
  'get_call_media_catalog_v3(uuid)',
  'record_call_media_telemetry_v3(uuid,text,text,jsonb)',
]){
  assert(mediaAcl.includes(`revoke all on function public.${fn} from public`),`V3 media PUBLIC revoke missing for ${fn}`);
  assert(mediaAcl.includes(`revoke all on function public.${fn} from anon`),`V3 media anon revoke missing for ${fn}`);
  assert(mediaAcl.includes(`grant execute on function public.${fn} to authenticated`),`V3 media authenticated grant missing for ${fn}`);
}

const g45=read('20260916162910_project_master_blueprint_v1_g4_g5_idempotent_approval.sql');
for(const marker of [
  "gate_id='G4_RFD_LOT'",
  "gate_id='G5_RFD_PROJECT'",
  "raise exception 'STALE_G4_APPROVAL'",
  "raise exception 'STALE_G5_APPROVAL'",
  "'idempotent',true",
  'grant execute on function public.approve_project_delivery_lot_rfd_v1(uuid,bigint,text,uuid) to service_role',
  'grant execute on function public.approve_project_rfd_v1(uuid,bigint,text,uuid) to service_role',
]) assert(g45.includes(marker),`G4/G5 guard missing: ${marker}`);

const g0Compat=read('20260916181927_project_master_blueprint_v1_g0_blueprint_05_compat_fix_p5.sql');
for(const marker of [
  "v_idea.blueprint_version in ('0.4','0.5')",
  'v_fit.blueprint_version=v_idea.blueprint_version',
  "'SITE_VITRINE@0.5'",
  'grant execute on function public.get_canonical_idea_preproject_readiness_v1(uuid) to service_role',
]) assert(g0Compat.includes(marker),`G0 0.5 compatibility guard missing: ${marker}`);

const g3Derived=read('20260916185631_project_master_blueprint_v1_g3_server_derived_promotion_v1.sql');
for(const marker of [
  'promote_canonical_approved_idea_to_project_definition_v3',
  "'SERVER_DERIVED_FROM_FROZEN_IDEA_DECISION'",
  "'client_manifest_accepted',false",
  "'client_promotion_diff_accepted',false",
  "'client_artifact_promotions_accepted',false",
  'grant execute on function public.promote_canonical_approved_idea_to_project_definition_v3(uuid,uuid,uuid,bigint,text) to service_role',
]) assert(g3Derived.includes(marker),`server-derived G3 guard missing: ${marker}`);

const legacyDisable=read('20260916193059_disable_legacy_idea_decision_conversion_v1.sql');
for(const marker of [
  'revoke execute on function public.decide_idea_v1(uuid, text, text) from public, anon, authenticated',
  'revoke execute on function public.convert_idea_to_project_v1(uuid, date, text[]) from public, anon, authenticated',
  'grant execute on function public.decide_idea_v1(uuid, text, text) to service_role',
  'grant execute on function public.convert_idea_to_project_v1(uuid, date, text[]) to service_role',
]) assert(legacyDisable.includes(marker),`legacy decision/conversion disable guard missing: ${marker}`);

const canonicalProjection=read('20260916194055_workspace_projection_canonical_delivery_authority_v1.sql');
for(const marker of [
  "'authority','CANONICAL_G4_G5'",
  "'legacy_g12_is_canonical_rfd',false",
  "to_jsonb('CANONICAL_G4_G5'::text)",
  "to_jsonb('1.3'::text)",
]) assert(canonicalProjection.includes(marker),`canonical workspace readiness authority guard missing: ${marker}`);

const policySplit=read('20260916200618_ideas_legacy_rls_policy_split_v1.sql');
for(const marker of [
  'drop policy if exists idea_decisions_write',
  'create policy idea_decisions_insert',
  'create policy idea_items_update',
  'create policy idea_reviews_delete',
  '(select auth.uid())',
]) assert(policySplit.includes(marker),`Ideas legacy RLS split guard missing: ${marker}`);

const grantHardening=read('20260916200626_ideas_legacy_table_grants_hardening_v1.sql');
for(const table of ['idea_decisions','idea_item_votes','idea_items','idea_members','idea_reviews']){
  assert(grantHardening.includes(`revoke truncate, trigger, references on table public.${table} from anon, authenticated`),`least-privilege revoke missing for ${table}`);
}

const ideaIndexes=read('20260916201046_ideas_fk_index_hardening_v1.sql');
for(const marker of [
  'idea_ai_runs_created_by_idx',
  'idea_information_requirement_refs_action_run_idx',
  'idea_question_answers_idea_idx',
  'idea_source_snapshots_action_run_idx',
  'ideas_conversation_idx',
]) assert(ideaIndexes.includes(marker),`Ideas FK index guard missing: ${marker}`);

const ideaInitplan=read('20260916201151_ideas_rls_initplan_optimization_v1.sql');
assert(ideaInitplan.includes('(select auth.uid())'),'Ideas RLS initplan optimization missing');
assert(!ideaInitplan.includes('= auth.uid()'),'Ideas RLS initplan migration must not reintroduce direct auth.uid() equality checks');

console.log(`migration history v2: OK (${requiredProductionTail.length} verified production-tail migrations guarded)`);
