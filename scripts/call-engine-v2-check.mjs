import fs from 'node:fs';

const read=(path)=>fs.readFileSync(path,'utf8');
const index=read('site/index.html');
const engine=read('site/assets/call-engine-v2.js');
const continuity=read('site/assets/call-media-continuity-v2.js');
const css=read('site/assets/call-engine-v2.css');
const worker=read('src/worker.js');
const migration=read('supabase/migrations/20260911235900_call_reliability_v2.sql');
const fail=(message)=>{console.error(`CALL ENGINE V2 CHECK FAILED: ${message}`);process.exit(1);};

for(const marker of [
  "await import('./assets/call-media-continuity-v2.js?v=2.0.0')",
  "await import('./assets/call-engine-v2.js?v=2.0.0')",
  "await import('./assets/boot.js?build=522')",
  'assets/call-engine-v2.css?v=2.0.0',
  'name="2b2c-call-engine" content="2.0.0"',
]) if(!index.includes(marker)) fail(`index missing ${marker}`);
const continuityPos=index.indexOf("call-media-continuity-v2.js?v=2.0.0");
const enginePos=index.indexOf("call-engine-v2.js?v=2.0.0");
const bootPos=index.indexOf("boot.js?build=522");
if(!(continuityPos>=0&&continuityPos<enginePos&&enginePos<bootPos)) fail('Call media continuity must load before Call Engine V2, and V2 before boot');
if(!worker.includes("call_engine: '2.0.0'")) fail('health endpoint must expose call engine version');

for(const marker of [
  '__4B4C_CALL_ENGINE_V2__',
  "api.rpc('get_call_sync_v2'",
  "api.rpc('send_call_signal_v1'",
  "api.rpc('heartbeat_call_v1'",
  "api.rpc('set_call_media_state_v1'",
  "api.rpc('start_private_call_v2'",
  "api.rpc('invite_to_call_v1'",
  "api.rpc('respond_call_invite_v1'",
  'new RTCPeerConnection',
  "addTransceiver('audio'",
  "addTransceiver('video'",
  'makingOffer',
  'ignoreOffer',
  'isSettingRemoteAnswerPending',
  'restartIce',
  'getStats()',
  'getDisplayMedia',
  'screenTx.sender.replaceTrack',
  "facingMode: 'user'",
  "window.addEventListener('click', intercept, true)",
  "window.addEventListener('2b2c:start-call'",
  'call-ice-v1',
  'turns?:',
  'MAX_PARTICIPANTS = 6',
]) if(!engine.includes(marker)) fail(`engine missing ${marker}`);

if(engine.includes('MutationObserver')) fail('Call Engine V2 must not use MutationObserver');
if(/cameraTx\.sender\.replaceTrack\(active\.screenTrack/.test(engine)) fail('screen share must never replace the camera sender');
if(!engine.includes('peer.screenTx.sender.replaceTrack(track)')) fail('screen share must use a dedicated sender');

for(const marker of [
  '__4B4C_CALL_MEDIA_CONTINUITY_V2__',
  "this.id.startsWith('ce-v2-')",
  'current === next',
  'trackSignature(current)',
  'trackSignature(next)',
]) if(!continuity.includes(marker)) fail(`media continuity missing ${marker}`);
if(!continuity.includes("Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'srcObject')")) fail('media continuity must preserve the native srcObject descriptor');

for(const marker of ['#incoming-call-v1,#resume-call-v1','.ce-v2-screen-stage','.ce-v2-filmstrip','@media(max-width:640px)','prefers-reduced-motion:reduce']) {
  if(!css.includes(marker)) fail(`Call Engine V2 CSS missing ${marker}`);
}

for(const marker of [
  'grant execute on function app_private.can_access_call_v1(uuid) to authenticated',
  'create or replace function public.get_call_sync_v2(',
  "if not app_private.can_access_call_v1(p_call_id) then raise exception 'CALL_ACCESS_DENIED'",
  "'participants'",
  "'signals'",
  's.id>v_after',
  'grant execute on function public.get_call_sync_v2(uuid,bigint) to authenticated',
]) if(!migration.includes(marker)) fail(`call reliability migration missing ${marker}`);

console.log('call engine v2: OK (2.0.0 + continuous media)');
