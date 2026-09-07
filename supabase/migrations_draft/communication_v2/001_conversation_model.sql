-- DRAFT ONLY — DO NOT APPLY TO THE LIVE V4.2.2 DATABASE.
-- Communication v2 / Migration 001: conversation model.

begin;

alter table public.conversations
  add column if not exists linked_project_id uuid references public.projects(id) on delete set null,
  add column if not exists status text not null default 'active',
  add column if not exists is_general boolean not null default false,
  add column if not exists direct_pair_key text,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists last_message_at timestamptz;

alter table public.conversation_members
  add column if not exists notification_level text not null default 'all',
  add column if not exists hidden_at timestamptz;

-- Preserve the existing V4.2.2 `muted` flag while giving the future UI a
-- three-state preference. It can be removed only after the new UI cutover.
update public.conversation_members
set notification_level = case when muted then 'muted' else 'all' end
where notification_level = 'all';

alter table public.conversations drop constraint if exists conversations_kind_check;
alter table public.conversations
  add constraint conversations_kind_check
  check (kind = any (array['direct'::text, 'project'::text, 'team'::text, 'context'::text]));

alter table public.conversations drop constraint if exists conversations_status_check;
alter table public.conversations
  add constraint conversations_status_check
  check (status = any (array['active'::text, 'resolved'::text, 'archived'::text]));

alter table public.conversation_members drop constraint if exists conversation_members_notification_level_check;
alter table public.conversation_members
  add constraint conversation_members_notification_level_check
  check (notification_level = any (array['all'::text, 'mentions'::text, 'muted'::text]));

alter table public.conversations drop constraint if exists conversations_scope_shape_v2;
alter table public.conversations
  add constraint conversations_scope_shape_v2
  check (
    (kind = 'project' and project_id is not null and linked_project_id is null)
    or (kind = 'team' and project_id is null and linked_project_id is null)
    or (kind = 'direct' and project_id is null)
    or kind = 'context'
  );

alter table public.conversations drop constraint if exists conversations_general_shape_v2;
alter table public.conversations
  add constraint conversations_general_shape_v2
  check (not is_general or kind in ('team','project'));

alter table public.conversations drop constraint if exists conversations_direct_pair_shape_v2;
alter table public.conversations
  add constraint conversations_direct_pair_shape_v2
  check (direct_pair_key is null or kind = 'direct');

-- Existing V4.2.2 data contains one project conversation per project. Mark
-- the oldest conversation as that project's canonical General topic without
-- relying on its localized title.
with ranked as (
  select id,
         row_number() over (partition by project_id order by created_at, id) as rn
  from public.conversations
  where kind = 'project' and project_id is not null
)
update public.conversations c
set is_general = true
from ranked r
where c.id = r.id and r.rn = 1;

update public.conversations c
set last_message_at = m.last_message_at
from (
  select conversation_id, max(created_at) as last_message_at
  from public.messages
  group by conversation_id
) m
where c.id = m.conversation_id
  and c.last_message_at is null;

create unique index if not exists conversations_one_team_general_v2
  on public.conversations(workspace_id)
  where kind = 'team' and is_general and status <> 'archived';

create unique index if not exists conversations_one_project_general_v2
  on public.conversations(project_id)
  where kind = 'project' and is_general and status <> 'archived';

create unique index if not exists conversations_direct_pair_unique_v2
  on public.conversations(workspace_id, direct_pair_key)
  where kind = 'direct' and direct_pair_key is not null;

create index if not exists conversations_workspace_kind_activity_v2
  on public.conversations(workspace_id, kind, last_message_at desc nulls last, created_at desc);

create index if not exists conversations_linked_project_v2
  on public.conversations(linked_project_id, last_message_at desc nulls last)
  where linked_project_id is not null;

create index if not exists conversation_members_user_activity_v2
  on public.conversation_members(user_id, hidden_at, conversation_id);

-- Reuse the existing generic updated_at trigger function from V4.2.2.
drop trigger if exists trg_updated_at_conversations_v2 on public.conversations;
create trigger trg_updated_at_conversations_v2
before update on public.conversations
for each row execute function app_private.set_updated_at();

comment on column public.conversations.project_id is
  'Communication v2: project_id means the conversation uses the project audience.';
comment on column public.conversations.linked_project_id is
  'Communication v2: contextual project link only; it must never expand a Direct audience.';
comment on column public.conversations.direct_pair_key is
  'Canonical unordered member-pair key used only to reuse 1-to-1 Direct conversations.';

commit;
