import fs from 'node:fs';

const read=(path)=>fs.readFileSync(path,'utf8');
const assert=(condition,message)=>{if(!condition)throw new Error(`CALL V3 GATE FAILED: ${message}`);};

const index=read('site/index.html');
const client=read('site/assets/call-engine-v3.js');
const css=read('site/assets/call-engine-v3.css');
const worker=read('src/worker.js');
const proxy=read('src/call-sfu-v3.js');
const migration=read('supabase/migrations/20260911232657_call_media_sfu_v3.sql');
const catalogMigration=read('supabase/migrations/20260911233259_call_media_catalog_active_session_v3.sql');
const aclMigration=read('supabase/migrations/20260912000407_harden_call_media_v3_rpc_execute.sql');

assert(index.includes("params.get('callv3') === '1'"),'query preview flag missing');
assert(index.includes("localStorage.getItem('2b2c.call.engine.v3') === '1'"),'localStorage preview flag missing');
assert(index.includes("if (callV3Enabled)"),'V3/V2 exclusive loader missing');
assert(index.includes("call-engine-v3.js?v=3.0.0-sfu-preview"),'V3 client not loaded behind flag');
assert(index.includes("call-engine-v3.css?v=3.0.0-sfu-preview"),'V3 CSS not loaded behind flag');
assert(index.includes("call-engine-v2.js?v=2.0.0"),'V2 rollback/default owner missing');
assert(index.indexOf("if (callV3Enabled)") < index.indexOf("call-engine-v2.js?v=2.0.0"),'V3 must choose engine before V2 loader');

assert((client.match(/new RTCPeerConnection\s*\(/g)||[]).length===1,'V3 must create exactly one PeerConnection in its source');
assert(client.includes("STUN = [{ urls: 'stun:stun.cloudflare.com:3478' }]") ,'Cloudflare STUN configuration missing');
assert(client.includes("workerApi('/api/call-v3/session'"),'SFU session creation missing');
assert(client.includes("workerApi('/api/call-v3/tracks/publish'"),'SFU publication missing');
assert(client.includes("workerApi('/api/call-v3/tracks/subscribe'"),'SFU subscription missing');
assert(client.includes("workerApi('/api/call-v3/renegotiate'"),'SFU renegotiation missing');
assert(client.includes('register_call_provider_session_v3'),'provider session registry missing');
assert(client.includes('get_call_media_catalog_v3'),'explicit media catalog missing');
assert(client.includes("role:'screen'")||client.includes("role: 'screen'"),'screen role missing');
assert(client.includes("role:'camera'")||client.includes("role: 'camera'"),'camera role missing');
assert(client.includes("role:'audio'")||client.includes("role: 'audio'"),'audio role missing');
assert(client.includes('getStats()'),'RTP health stats missing');
assert(client.includes("'media-waiting'"),'media-waiting state missing');
assert(client.includes('framesDecoded'),'decoded-frame health signal missing');
assert(client.includes('inboundBytes'),'inbound RTP progress signal missing');
assert(client.includes("ctx.screenTx.sender.replaceTrack(null)")||client.includes("ctx.screenTx?.sender.replaceTrack(null)"),'screen sender reuse missing');
assert(!client.includes('send_call_signal_v1'),'V3 must not use client-to-client signaling RPC');
assert(!client.includes('call_signals'),'V3 must not use client-to-client signal table');
assert(!client.includes('MutationObserver'),'V3 must not depend on MutationObserver');
assert(!client.includes('HTMLMediaElement.prototype'),'V3 must not monkey-patch media elements');
assert(!/cameraTx[^\n]{0,120}replaceTrack\([^\n]*screen/i.test(client),'screen must never replace camera sender');
assert(!client.includes('one(catalogRaw)'),'JSONB media catalog must remain the complete array');

assert(worker.includes("import { handleCallSfuV3 } from './call-sfu-v3.js'"),'Worker V3 proxy import missing');
assert(worker.includes('call_engine_v3'),'Worker health preview marker missing');
assert(worker.includes('default: false'),'V3 must remain non-default before certification');
assert(proxy.includes('CF_REALTIME_APP_ID'),'Realtime App ID secret binding missing');
assert(proxy.includes('CF_REALTIME_APP_SECRET'),'Realtime App Secret binding missing');
assert(proxy.includes("'/sessions/new'"),'Realtime create-session upstream route missing');
assert(proxy.includes('/tracks/new'),'Realtime tracks/new upstream route missing');
assert(proxy.includes('/renegotiate'),'Realtime renegotiation upstream route missing');
assert(proxy.includes('get_call_sync_v2'),'Worker call authorization missing');
assert(proxy.includes('get_call_media_catalog_v3'),'Worker subscription authorization catalog missing');
assert(!proxy.includes('service_role'),'Worker must not embed Supabase service role credentials');

for(const marker of ['call_media_tracks_v3','call_media_telemetry_v3','register_call_provider_session_v3','upsert_call_media_track_v3','record_call_media_telemetry_v3']) assert(migration.includes(marker),`migration missing ${marker}`);
assert(migration.includes("role in ('audio','camera','screen')"),'track roles must be constrained');
assert(catalogMigration.replace(/\s+/g,'').includes('cp.provider_session_id=t.provider_session_id'),'catalog must reject stale provider sessions');
assert(catalogMigration.replace(/\s+/g,'').includes('cp.left_atisnull'),'catalog must reject departed participants');
for(const fn of [
  'register_call_provider_session_v3(uuid,text)',
  'upsert_call_media_track_v3(uuid,text,text,text,text)',
  'end_call_media_track_v3(uuid,text)',
  'end_all_call_media_tracks_v3(uuid)',
  'get_call_media_catalog_v3(uuid)',
  'record_call_media_telemetry_v3(uuid,text,text,jsonb)',
]) {
  assert(aclMigration.includes(`revoke all on function public.${fn} from public`),`PUBLIC execute revoke missing for ${fn}`);
  assert(aclMigration.includes(`revoke all on function public.${fn} from anon`),`anon execute revoke missing for ${fn}`);
  assert(aclMigration.includes(`grant execute on function public.${fn} to authenticated`),`authenticated execute grant missing for ${fn}`);
}

assert(css.includes('.ce3-tile.screen video{object-fit:contain'),'remote screen must preserve complete aspect ratio');
assert(css.includes('.ce3-share-local'),'local share must use compact preview');
assert(css.includes('@media(max-width:640px)'),'mobile layout contract missing');
assert(css.includes('prefers-reduced-motion:reduce'),'reduced-motion contract missing');

console.log('Call Engine V3 static architecture gate: OK');
