import fs from 'node:fs';

const boot = fs.readFileSync('site/assets/boot.js', 'utf8');
const c0 = fs.readFileSync('site/assets/communication-v4-c0-safety.js', 'utf8');

function fail(message) {
  console.error(`COMMUNICATION V4 C0 CHECK FAILED: ${message}`);
  process.exit(1);
}

function requireMarker(text, marker, label) {
  if (!text.includes(marker)) fail(`${label}: ${marker}`);
}

requireMarker(boot, './communication-workspace-v1.js?', 'V3 runtime owner missing');
requireMarker(boot, './communication-v4-c0-safety.js?', 'C0 safety layer not loaded');
if (boot.indexOf('./communication-v4-c0-safety.js?') < boot.indexOf('./communication-workspace-v1.js?')) fail('C0 must load after Communication V3');

for (const marker of [
  "['direct','group','topic','meeting']",
  'PENDING_CREATE_KEY',
  'location.reload()',
  'normalizeMessagesHome',
  'meta?.is_general',
  'call-conversation',
  "label === 'Équipe' || label === 'Projet'",
  'MAX_CALL_INVITEES = 5',
  'Qui voulez-vous appeler ?',
  'Aucun appel collectif',
  'cw-c0-transform-menu',
  'Transformer en…',
]) requireMarker(c0, marker, 'C0 contract missing');

if (c0.includes('MutationObserver')) fail('C0 must not introduce MutationObserver');
if (c0.includes("api.rpc('set_conversation_status_v2'")) fail('C0 must not mutate conversation status itself');
if (c0.includes('create table') || c0.includes('alter table')) fail('C0 must not contain backend migration logic');

console.log('communication v4 C0 safety: OK');
