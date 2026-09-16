import fs from 'node:fs';

const sql = fs.readFileSync('docs/communication-v4/sql/COMMUNICATION_V4_C1_FOUNDATION_CANDIDATE_V0_3.sql', 'utf8');

function fail(message) {
  console.error(`COMMUNICATION V4 C1 CANDIDATE CHECK FAILED: ${message}`);
  process.exit(1);
}

function need(marker, label = marker) {
  if (!sql.includes(marker)) fail(`missing ${label}`);
}

for (const marker of [
  'add column if not exists parent_conversation_id uuid',
  'add column if not exists source_message_id uuid',
  'references public.conversations(id)\n      on delete cascade',
  'references public.messages(id)\n      on delete set null',
  'create unique index if not exists conversations_source_message_unique_v4',
  "app.communication_v4_lineage_migration",
  "DISCUSSION_LINEAGE_IMMUTABLE",
  'create table if not exists public.conversation_focus_members',
  'added_by uuid references public.profiles(id) on delete set null',
  'revoke all on public.conversation_focus_members from public, anon, authenticated',
  'create policy conversation_focus_members_select_v1',
  'FOCUS_USER_CANNOT_READ_DISCUSSION',
  'create or replace function public.create_discussion_v1',
  "DISCUSSION_TITLE_RESERVED",
  "DISCUSSION_SOURCE_ALREADY_USED",
  'TEXT-ONLY C1 contract',
  'create or replace function public.set_discussion_focus_members_v1',
  'create or replace function public.set_conversation_follow_v1',
  'create or replace function public.resolve_discussion_v1',
  'create or replace function public.reopen_discussion_v1',
  'create or replace function public.mark_conversation_read_v4',
  "v_conversation.parent_conversation_id is not null and v_conversation.status='resolved'",
  "cm.notification_level='mentions'",
  'from public, anon, authenticated, service_role',
]) need(marker);

if (/grant\s+execute[\s\S]{0,180}\bto\s+(authenticated|anon|service_role)\b/i.test(sql)) {
  fail('C1 must remain dormant: API roles must not receive EXECUTE');
}

if (/create\s+table[\s\S]*conversation_follow/i.test(sql)) fail('must reuse conversation_members.notification_level, not create follower table');
if (/parent_conversation_id[\s\S]{0,120}on delete restrict/i.test(sql)) fail('parent FK must not block Project/Workspace cascade lifecycle');

console.log('communication v4 C1 candidate: OK');
