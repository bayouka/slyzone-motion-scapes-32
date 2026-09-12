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

for (const forbidden of ['workerApi(', '/api/call-v3/', 'register_call_provider_session_v3', 'get_call_media_catalog_v3', 'CF_REALTIME_APP_SECRET']) {
  assert(!src.includes(forbidden), `engine retains SFU dependency ${forbidden}`);
}

assert(src.includes("if(peer.initiator)createInitiatorTransceivers(ctx,peer)"), 'only deterministic initiator may precreate transceivers');
assert(src.includes("rejected non-deterministic offer"), 'non-deterministic offers must be rejected');
assert(index.includes('3.1.4-direct-pilot'), 'index V3 Direct pilot marker missing');
assert(index.includes("const pilotWorkspaceId = '55e03b9c-7f79-4088-828d-05b4727f521e'"), 'pilot workspace scope missing');
assert(index.includes("params.get('callv2') === '1'"), 'explicit V2 rollback query missing');
assert(index.includes("localStorage.getItem('2b2c.call.engine.v2') === '1'"), 'persistent V2 rollback missing');
assert(index.includes('const pilotV3 = currentWorkspaceId === pilotWorkspaceId'), 'pilot selection missing');
assert(index.includes('const callV3Enabled = !forceV2 && (explicitV3 || pilotV3)'), 'pilot/rollback precedence mismatch');
assert(index.includes('call-engine-v3-direct.js?v=3.1.0-direct-preview'), 'index must load direct engine');
assert(index.includes('call-certification-v3.js?v=1.0.0'), 'passive certification loader missing');
assert(index.includes('call-engine-v2.js?v=2.0.0'), 'V2 rollback missing');
assert(!index.includes('call-engine-v3.js?v=3.0.0-sfu-preview'), 'index still loads SFU preview');
assert(worker.includes("code: '3.1.4-direct-pilot'"), 'health Direct pilot code missing');
assert(worker.includes("transport: 'p2p-stun'"), 'health Direct transport missing');
assert(worker.includes("certification: '1.0.0'"), 'health certification marker missing');
assert(worker.includes('pilot_default: true'), 'pilot default health marker missing');
assert(worker.includes('global_default: false'), 'global default must remain false');
assert(worker.includes('configured: true'), 'Direct engine must not depend on external provisioning');
assert(!worker.includes('handleCallSfuV3'), 'Worker still owns SFU route');

console.log('Call Engine V3 Direct pilot gate: OK');
