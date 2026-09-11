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
];

const missing = requiredProductionTail.filter((name) => !fs.existsSync(`${migrationDir}/${name}`));
if (missing.length) {
  console.error(`MIGRATION HISTORY CHECK FAILED: missing recovered production migrations: ${missing.join(', ')}`);
  process.exit(1);
}

const latest = fs.readFileSync(`${migrationDir}/20260909093700_revoke_public_call_heartbeat.sql`, 'utf8');
for (const required of [
  'revoke all on function public.heartbeat_call_v1(uuid) from public',
  'revoke all on function public.heartbeat_call_v1(uuid) from anon',
  'grant execute on function public.heartbeat_call_v1(uuid) to authenticated',
]) {
  if (!latest.includes(required)) {
    console.error(`MIGRATION HISTORY CHECK FAILED: final heartbeat ACL guard missing: ${required}`);
    process.exit(1);
  }
}

console.log(`migration history: OK (${requiredProductionTail.length} recovered production migrations guarded)`);
