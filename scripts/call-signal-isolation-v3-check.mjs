import fs from 'node:fs';

const src = fs.readFileSync('site/assets/call-signal-isolation-v3.js', 'utf8');
const index = fs.readFileSync('site/index.html', 'utf8');
const assert = (ok, message) => { if (!ok) throw new Error(`CALL SIGNAL ISOLATION CHECK FAILED: ${message}`); };

for (const marker of [
  "name !== 'get_call_sync_v2'",
  "engine === 'v3-direct'",
  "return !engine || engine === 'v2'",
  "document.documentElement.dataset.callEngine === 'v3'",
  "window.__4B4C_CALL_SIGNAL_ISOLATION_V3__",
]) assert(src.includes(marker), `missing ${marker}`);

assert(index.includes("call-signal-isolation-v3.js?v=1.0.0"), 'isolation module not loaded');
assert(index.indexOf('call-signal-isolation-v3.js?v=1.0.0') < index.indexOf("if (callV3Enabled)"), 'isolation must load before either call engine');
assert(index.includes('3.1.1-direct-preview'), 'release marker mismatch');

console.log('Call signal isolation gate: OK');
