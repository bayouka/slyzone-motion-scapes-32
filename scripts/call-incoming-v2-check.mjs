import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const boot = read('site/assets/boot.js');
const js = read('site/assets/call-incoming-v2.js');
const css = read('site/assets/call-incoming-v2.css');
const migration = read('supabase/migrations/20260911225000_pending_call_invite_v2.sql');

const fail = (message) => {
  console.error(`CALL INCOMING V2 CHECK FAILED: ${message}`);
  process.exit(1);
};

const livePos = boot.indexOf('./live.js?');
const receiverPos = boot.indexOf('./call-incoming-v2.js?');
const homePos = boot.indexOf('./home-v6.js?');
if (livePos < 0 || receiverPos < 0 || homePos < 0) fail('boot chain missing live, incoming receiver or Home V6');
if (!(livePos < receiverPos && receiverPos < homePos)) fail('incoming receiver must load after live.js and before presentation owners');

for (const marker of [
  '__4B4C_INCOMING_CALL_V2_OWNER__',
  "api.rpc('get_pending_call_invite_v2')",
  'data-action="call-accept-v1"',
  'data-action="call-decline-v1"',
  'POLL_MS = 1400',
  "window.addEventListener('focus'",
  "document.addEventListener('visibilitychange'",
]) if (!js.includes(marker)) fail(`receiver missing ${marker}`);

for (const forbidden of ['RTCPeerConnection', 'send_call_signal_v1', 'join_call_v1', 'start_private_call_v2', 'api.insert(', 'api.update(', 'api.remove(']) {
  if (js.includes(forbidden)) fail(`receiver must not duplicate call workflow: ${forbidden}`);
}

for (const marker of ['#incoming-call-v2', '.incoming-call-card-v2', '@media(max-width:640px)', 'prefers-reduced-motion:reduce']) {
  if (!css.includes(marker)) fail(`receiver CSS missing ${marker}`);
}

for (const marker of [
  'create or replace function public.get_pending_call_invite_v2()',
  "ci.invited_user_id = auth.uid()",
  "ci.status = 'pending'",
  "cs.status = 'live'",
  "wm.status = 'active'",
  "cp.user_id = cs.started_by",
  "interval '25 seconds'",
  'grant execute on function public.get_pending_call_invite_v2() to authenticated',
]) if (!migration.includes(marker)) fail(`migration missing ${marker}`);

console.log('call incoming v2: OK');
