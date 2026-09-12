import fs from 'node:fs';

const src = fs.readFileSync('site/assets/call-engine-v3-direct.js', 'utf8');
const index = fs.readFileSync('site/index.html', 'utf8');
const worker = fs.readFileSync('src/worker.js', 'utf8');
const assert = (ok, message) => { if (!ok) throw new Error(`V3 DIRECT CHECK FAILED: ${message}`); };

for (const marker of [
  "version:'3.1.0-direct-preview'",
  "transport:'p2p-stun'",
  "const isInitiatorFor = (remoteUserId) => String(uid()).localeCompare(String(remoteUserId)) < 0",
  'function createInitiatorTransceivers',
  'peer.rolesByMid',
  "ROLE_ORDER = ['audio', 'camera', 'screen']",
  'send_call_signal_v1',
  'get_call_sync_v2',
  'stun:stun.cloudflare.com:3478',
  'stun:stun.cloudflare.com:53',
  "replaceRoleTrack(ctx,'screen'",
  "replaceRoleTrack(ctx,'camera'",
  'status=eq.live',
  'participant.screen_enabled',
]) assert(src.includes(marker), `engine missing ${marker}`);

for (const forbidden of [
  'workerApi(',
  '/api/call-v3/',
  'register_call_provider_session_v3',
  'get_call_media_catalog_v3',
  'CF_REALTIME_APP_SECRET',
]) assert(!src.includes(forbidden), `engine retains SFU dependency ${forbidden}`);

assert(src.includes("if(peer.initiator)createInitiatorTransceivers(ctx,peer)"), 'only deterministic initiator may precreate transceivers');
assert(src.includes("rejected non-deterministic offer"), 'non-deterministic offers must be rejected');
assert(index.includes('3.1.0-direct-preview'), 'index V3 Direct marker missing');
assert(index.includes('call-engine-v3-direct.js?v=3.1.0-direct-preview'), 'index must load direct engine behind V3 flag');
assert(!index.includes('call-engine-v3.js?v=3.0.0-sfu-preview'), 'index still loads SFU preview');
assert(worker.includes("code: '3.1.0-direct-preview'"), 'health Direct code missing');
assert(worker.includes("transport: 'p2p-stun'"), 'health Direct transport missing');
assert(worker.includes('configured: true'), 'Direct engine must not depend on external provisioning');
assert(!worker.includes('handleCallSfuV3'), 'Worker still owns SFU route');

console.log('Call Engine V3 Direct gate: OK');
