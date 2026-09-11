import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const boot = read('site/assets/boot.js');
const js = read('site/assets/communication-workspace-v1.js');

const fail = (message) => {
  console.error(`COMMUNICATION V3 CHECK FAILED: ${message}`);
  process.exit(1);
};

if (!boot.includes('./communication-workspace-v1.js?')) fail('communication workspace is not loaded by boot');
if (boot.includes('communication workspace unavailable; native messages view kept')) fail('legacy fallback must not be reintroduced');

for (const marker of [
  "api.rpc('send_message_v3'",
  "api.rpc('mark_conversation_read_v3'",
  "api.rpc('get_unread_conversations_v2'",
  "api.rpc('get_message_badges_v2'",
  "api.rpc('get_or_create_direct_v2'",
  "api.rpc('create_group_direct_v2'",
  "api.rpc('create_project_topic_v2'",
  "api.rpc('create_request_from_message_v2'",
  "api.rpc('create_action_from_message_v2'",
  "api.rpc('create_decision_from_message_v2'",
  'get_workspace_sync_digest_v1',
  'POLL_MS=8000',
]) if (!js.includes(marker)) fail(`communication contract missing ${marker}`);

if (!js.includes("await reloadCurrent('Message envoyé')")) fail('sender must reload conversation after successful send');
if (!js.includes("window.addEventListener('focus'")) fail('message sync must refresh on window focus');

console.log('communication v3: OK');
