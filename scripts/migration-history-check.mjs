import fs from 'node:fs';

const migrationDir = 'supabase/migrations';
const requiredProductionTail = [
  '20260908224237_agenda_meeting_workflows_v1.sql',
  '20260908224452_agenda_meeting_manager_scope_v1.sql',
  '20260909010327_communication_live_calls_v1.sql',
  '20260909010513_call_signalling_v1.sql',
  '20260909011410_call_prejoin_hardening_v1.sql',
  '20260909012029_temporary_enable_http_for_communication_preview_check.sql',
  '20260909012709_temporary_disable_http_after_communication_preview_check.sql',
  '20260909032519_global_quick_calls_v1.sql',
  '20260909033553_private_direct_calls_v1.sql',
  '20260909042226_temporary_enable_http_for_cf_probe.sql',
  '20260909042243_temporary_disable_http_after_cf_probe.sql',
  '20260909050314_multi_party_call_invites_v1.sql',
  '20260909053817_add_missing_fk_indexes_4b4c.sql',
  '20260909053900_align_call_invites_with_room_capacity.sql',
  '20260909053925_fix_call_invites_rls_scope_and_initplan.sql',
  '20260909054358_enable_http_for_asset_audit.sql',
  '20260909054556_clean_call_invite_lifecycle.sql',
  '20260909055328_align_call_capacity_errors_with_prod_ui.sql',
  '20260909071845_call_presence_heartbeat_and_room_reuse.sql',
  '20260909073012_expire_unanswered_call_invites.sql',
  '20260909092310_revoke_anon_call_heartbeat.sql',
  '20260909093700_revoke_public_call_heartbeat.sql',
  '20260911210308_pending_call_invite_v2.sql',
  '20260911220328_fix_call_access_rls_execute_v1.sql',
  '20260911220911_call_sync_v2.sql',
  '20260911232657_call_media_sfu_v3.sql',
  '20260911233259_call_media_catalog_active_session_v3.sql',
  '20260912000407_harden_call_media_v3_rpc_execute.sql',
];

const missing = requiredProductionTail.filter((name) => !fs.existsSync(`${migrationDir}/${name}`));
if (missing.length) {
  console.error(`MIGRATION HISTORY CHECK FAILED: missing production migration: ${missing.join(', ')}`);
  process.exit(1);
}

const heartbeat = fs.readFileSync(`${migrationDir}/20260909093700_revoke_public_call_heartbeat.sql`, 'utf8');
for (const required of [
  'revoke all on function public.heartbeat_call_v1(uuid) from public',
  'revoke all on function public.heartbeat_call_v1(uuid) from anon',
  'grant execute on function public.heartbeat_call_v1(uuid) to authenticated',
]) {
  if (!heartbeat.includes(required)) {
    console.error(`MIGRATION HISTORY CHECK FAILED: final heartbeat ACL guard missing: ${required}`);
    process.exit(1);
  }
}

const incoming = fs.readFileSync(`${migrationDir}/20260911210308_pending_call_invite_v2.sql`, 'utf8');
for (const required of [
  'create or replace function public.get_pending_call_invite_v2()',
  'ci.invited_user_id = auth.uid()',
  "ci.status = 'pending'",
  'cp.user_id = cs.started_by',
  "interval '25 seconds'",
  'revoke all on function public.get_pending_call_invite_v2() from anon',
  'grant execute on function public.get_pending_call_invite_v2() to authenticated',
]) {
  if (!incoming.includes(required)) {
    console.error(`MIGRATION HISTORY CHECK FAILED: incoming call guard missing: ${required}`);
    process.exit(1);
  }
}

const accessFix = fs.readFileSync(`${migrationDir}/20260911220328_fix_call_access_rls_execute_v1.sql`, 'utf8');
if (!accessFix.includes('grant execute on function app_private.can_access_call_v1(uuid) to authenticated')) {
  console.error('MIGRATION HISTORY CHECK FAILED: call-access helper grant missing');
  process.exit(1);
}

const sync = fs.readFileSync(`${migrationDir}/20260911220911_call_sync_v2.sql`, 'utf8');
for (const required of [
  'create or replace function public.get_call_sync_v2(',
  "if not app_private.can_access_call_v1(p_call_id) then raise exception 'CALL_ACCESS_DENIED'",
  "'participants'",
  "'signals'",
  's.id>v_after',
  'grant execute on function public.get_call_sync_v2(uuid,bigint) to authenticated',
]) {
  if (!sync.includes(required)) {
    console.error(`MIGRATION HISTORY CHECK FAILED: call sync guard missing: ${required}`);
    process.exit(1);
  }
}

const v3Media = fs.readFileSync(`${migrationDir}/20260911232657_call_media_sfu_v3.sql`, 'utf8');
for (const required of [
  'create table if not exists public.call_media_tracks_v3',
  'create table if not exists public.call_media_telemetry_v3',
  'create or replace function public.register_call_provider_session_v3(',
  'create or replace function public.get_call_media_catalog_v3(',
  'create or replace function public.record_call_media_telemetry_v3(',
]) {
  if (!v3Media.includes(required)) {
    console.error(`MIGRATION HISTORY CHECK FAILED: V3 media migration missing: ${required}`);
    process.exit(1);
  }
}

const v3Catalog = fs.readFileSync(`${migrationDir}/20260911233259_call_media_catalog_active_session_v3.sql`, 'utf8').replace(/\s+/g, '');
for (const required of ['cp.provider_session_id=t.provider_session_id','cp.left_atisnull']) {
  if (!v3Catalog.includes(required.replace(/\s+/g, ''))) {
    console.error(`MIGRATION HISTORY CHECK FAILED: V3 catalog active-session guard missing: ${required}`);
    process.exit(1);
  }
}

const v3Acl = fs.readFileSync(`${migrationDir}/20260912000407_harden_call_media_v3_rpc_execute.sql`, 'utf8');
for (const fn of [
  'register_call_provider_session_v3(uuid,text)',
  'upsert_call_media_track_v3(uuid,text,text,text,text)',
  'end_call_media_track_v3(uuid,text)',
  'end_all_call_media_tracks_v3(uuid)',
  'get_call_media_catalog_v3(uuid)',
  'record_call_media_telemetry_v3(uuid,text,text,jsonb)',
]) {
  for (const role of ['public', 'anon']) {
    const marker = `revoke all on function public.${fn} from ${role}`;
    if (!v3Acl.includes(marker)) {
      console.error(`MIGRATION HISTORY CHECK FAILED: V3 RPC ACL guard missing: ${marker}`);
      process.exit(1);
    }
  }
  const grant = `grant execute on function public.${fn} to authenticated`;
  if (!v3Acl.includes(grant)) {
    console.error(`MIGRATION HISTORY CHECK FAILED: V3 authenticated grant missing: ${grant}`);
    process.exit(1);
  }
}

console.log(`migration history: OK (${requiredProductionTail.length} production migrations guarded)`);
