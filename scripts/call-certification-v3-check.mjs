import fs from 'node:fs';

const src = fs.readFileSync('site/assets/call-certification-v3.js', 'utf8');
const index = fs.readFileSync('site/index.html', 'utf8');
const worker = fs.readFileSync('src/worker.js', 'utf8');
const assert = (ok, message) => { if (!ok) throw new Error(`CALL CERTIFICATION V3 CHECK FAILED: ${message}`); };

for (const marker of [
  "window.__4B4C_CALL_CERTIFICATION_V3__",
  "record_call_media_telemetry_v3",
  "class CertifiedPeerConnection extends NativePeerConnection",
  "connectionstatechange",
  "iceconnectionstatechange",
  "addEventListener('track'",
  "pc.getStats()",
  "inbound_bytes",
  "frames_decoded",
  "rtt_ms",
  "loss_percent",
  "remote_candidate_type",
  "transceiver_count",
  "version: '1.0.0'",
]) assert(src.includes(marker), `missing ${marker}`);

assert(index.includes("call-certification-v3.js?v=1.0.0"), 'certification module not loaded');
assert(index.indexOf('call-certification-v3.js?v=1.0.0') < index.indexOf('call-engine-v3-direct.js?v=3.1.0-direct-preview'), 'certification must wrap RTCPeerConnection before V3 engine');
assert(worker.includes("certification: '1.0.0'"), 'health certification marker missing');
assert(worker.includes("code: '3.1.3-direct-preview'"), 'health release marker mismatch');

console.log('Call Engine V3 passive certification gate: OK');
