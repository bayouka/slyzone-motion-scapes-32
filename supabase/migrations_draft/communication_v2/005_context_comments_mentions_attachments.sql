-- DRAFT ONLY — DO NOT APPLY TO THE LIVE V4.2.2 DATABASE.
-- Communication v2 / Migration 005: contextual comments, mentions and lightweight attachments.

begin;

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  target_type text not null check (target_type in ('deliverable','deliverable_version','action','decision','meeting','milestone')),
  target_id uuid not null,
  author_id uuid not null references public.profiles(id),
  body text not null check (char_length(body) between 1 and 20000),
  reply_to_id uuid references public.comments(id) on delete set null,
  edited_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.mentions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  mentioned_user_id uuid not null references public.profiles(id) on delete cascade,
  mentioned_by uuid not null references public.profiles(id),
  message_id uuid references public.messages(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  constraint mentions_one_source_v2 check (num_nonnulls(message_id,comment_id)=1),
  constraint mentions_unique_message_user_v2 unique(message_id,mentioned_user_id),
  constraint mentions_unique_comment_user_v2 unique(comment_id,mentioned_user_id)
);

create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  message_id uuid references public.messages(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  storage_path text not null unique,
  file_name text not null check (char_length(btrim(file_name)) between 1 and 255),
  mime_type text,
  size_bytes bigint check (size_bytes is null or size_bytes>=0),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  constraint attachments_one_parent_v2 check (num_nonnulls(message_id,comment_id)=1)
);

create index if not exists comments_target_activity_v2 on public.comments(target_type,target_id,created_at,id);
create index if not exists comments_project_activity_v2 on public.comments(project_id,created_at desc) where project_id is not null;
create index if not exists mentions_user_unread_v2 on public.mentions(mentioned_user_id,read_at,created_at desc);
create index if not exists attachments_message_v2 on public.attachments(message_id) where message_id is not null;
create index if not exists attachments_comment_v2 on public.attachments(comment_id) where comment_id is not null;

create or replace function app_private.user_can_access_comment_target_v2(
  p_target_type text,
  p_target_id uuid,
  p_user_id uuid
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_workspace uuid;
  v_project uuid;
  v_visibility text;
begin
  if p_user_id is null then return false; end if;

  if p_target_type='action' then
    select workspace_id,project_id,visibility into v_workspace,v_project,v_visibility from public.actions where id=p_target_id;
    return found and app_private.user_can_access_project_v2(v_project,p_user_id)
      and (v_visibility='shared' or exists(select 1 from public.workspace_members wm where wm.workspace_id=v_workspace and wm.user_id=p_user_id and wm.status='active' and wm.role<>'guest'));
  elsif p_target_type='milestone' then
    select workspace_id,project_id,visibility into v_workspace,v_project,v_visibility from public.milestones where id=p_target_id;
    return found and app_private.user_can_access_project_v2(v_project,p_user_id)
      and (v_visibility='shared' or exists(select 1 from public.workspace_members wm where wm.workspace_id=v_workspace and wm.user_id=p_user_id and wm.status='active' and wm.role<>'guest'));
  elsif p_target_type='deliverable' then
    select workspace_id,project_id,visibility into v_workspace,v_project,v_visibility from public.deliverables where id=p_target_id;
    return found and (
      exists(select 1 from public.workspace_members wm where wm.workspace_id=v_workspace and wm.user_id=p_user_id and wm.status='active' and wm.role in ('owner','admin','member'))
      or (v_visibility='shared' and app_private.user_can_access_project_v2(v_project,p_user_id))
    );
  elsif p_target_type='deliverable_version' then
    select d.workspace_id,d.project_id,d.visibility into v_workspace,v_project,v_visibility
    from public.deliverable_versions dv join public.deliverables d on d.id=dv.deliverable_id
    where dv.id=p_target_id;
    return found and (
      exists(select 1 from public.workspace_members wm where wm.workspace_id=v_workspace and wm.user_id=p_user_id and wm.status='active' and wm.role in ('owner','admin','member'))
      or (v_visibility='shared' and app_private.user_can_access_project_v2(v_project,p_user_id))
    );
  elsif p_target_type='decision' then
    select workspace_id,project_id,visibility into v_workspace,v_project,v_visibility from public.decisions where id=p_target_id;
    return found and (
      (v_project is null and app_private.user_is_active_workspace_member_v2(v_workspace,p_user_id))
      or (v_project is not null and app_private.user_can_access_project_v2(v_project,p_user_id))
    ) and (v_visibility='shared' or exists(select 1 from public.workspace_members wm where wm.workspace_id=v_workspace and wm.user_id=p_user_id and wm.status='active' and wm.role<>'guest'));
  elsif p_target_type='meeting' then
    select workspace_id,project_id,visibility into v_workspace,v_project,v_visibility from public.meetings where id=p_target_id;
    return found and (
      (v_project is null and app_private.user_is_active_workspace_member_v2(v_workspace,p_user_id))
      or (v_project is not null and app_private.user_can_access_project_v2(v_project,p_user_id))
    ) and (v_visibility='shared' or exists(select 1 from public.workspace_members wm where wm.workspace_id=v_workspace and wm.user_id=p_user_id and wm.status='active' and wm.role<>'guest'));
  end if;

  return false;
end;
$$;

create or replace function app_private.comment_target_scope_matches_v2(
  p_target_type text,
  p_target_id uuid,
  p_workspace_id uuid,
  p_project_id uuid
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_workspace uuid;
  v_project uuid;
begin
  if p_target_type='action' then select workspace_id,project_id into v_workspace,v_project from public.actions where id=p_target_id;
  elsif p_target_type='milestone' then select workspace_id,project_id into v_workspace,v_project from public.milestones where id=p_target_id;
  elsif p_target_type='deliverable' then select workspace_id,project_id into v_workspace,v_project from public.deliverables where id=p_target_id;
  elsif p_target_type='deliverable_version' then
    select d.workspace_id,d.project_id into v_workspace,v_project from public.deliverable_versions dv join public.deliverables d on d.id=dv.deliverable_id where dv.id=p_target_id;
  elsif p_target_type='decision' then select workspace_id,project_id into v_workspace,v_project from public.decisions where id=p_target_id;
  elsif p_target_type='meeting' then select workspace_id,project_id into v_workspace,v_project from public.meetings where id=p_target_id;
  else return false;
  end if;
  return found and v_workspace is not distinct from p_workspace_id and v_project is not distinct from p_project_id;
end;
$$;

revoke all on function app_private.user_can_access_comment_target_v2(text,uuid,uuid) from public,anon,authenticated;
revoke all on function app_private.comment_target_scope_matches_v2(text,uuid,uuid,uuid) from public,anon,authenticated;

alter table public.comments enable row level security;
alter table public.mentions enable row level security;
alter table public.attachments enable row level security;

create policy comments_select_v2 on public.comments
for select using (app_private.user_can_access_comment_target_v2(target_type,target_id,auth.uid()));
create policy comments_insert_v2 on public.comments
for insert with check (
  author_id=auth.uid()
  and app_private.user_can_access_comment_target_v2(target_type,target_id,auth.uid())
  and app_private.comment_target_scope_matches_v2(target_type,target_id,workspace_id,project_id)
);
create policy comments_update_author_v2 on public.comments
for update
using (author_id=auth.uid() and deleted_at is null and app_private.user_can_access_comment_target_v2(target_type,target_id,auth.uid()))
with check (author_id=auth.uid() and app_private.comment_target_scope_matches_v2(target_type,target_id,workspace_id,project_id));

create policy mentions_select_self_v2 on public.mentions for select using (mentioned_user_id=auth.uid());
create policy mentions_update_self_v2 on public.mentions for update using (mentioned_user_id=auth.uid()) with check (mentioned_user_id=auth.uid());

create policy attachments_select_v2 on public.attachments
for select using (
  (message_id is not null and app_private.user_can_access_message_v2(message_id,auth.uid()))
  or (comment_id is not null and exists(select 1 from public.comments c where c.id=comment_id and app_private.user_can_access_comment_target_v2(c.target_type,c.target_id,auth.uid())))
);

-- Sensitive creation is RPC-owned; ordinary clients only read these tables and
-- update their own comment/mention state through narrow columns.
revoke insert,delete on public.mentions from authenticated;
revoke update on public.mentions from authenticated;
grant update(read_at) on public.mentions to authenticated;
revoke insert,delete on public.attachments from authenticated;
revoke delete on public.comments from authenticated;
revoke update on public.comments from authenticated;
grant update(body,edited_at,deleted_at) on public.comments to authenticated;

create or replace function app_private.add_message_mentions_v2(p_message_id uuid,p_user_ids uuid[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_message public.messages%rowtype;
  v_user uuid;
begin
  select * into v_message from public.messages where id=p_message_id;
  if not found then raise exception 'MESSAGE_NOT_FOUND'; end if;
  foreach v_user in array coalesce(p_user_ids,array[]::uuid[]) loop
    if v_user=v_message.author_id then continue; end if;
    if not app_private.user_can_access_conversation_v2(v_message.conversation_id,v_user) then raise exception 'MENTION_TARGET_CANNOT_READ_SOURCE'; end if;
    insert into public.mentions(workspace_id,mentioned_user_id,mentioned_by,message_id)
    values(v_message.workspace_id,v_user,v_message.author_id,p_message_id)
    on conflict (message_id,mentioned_user_id) do nothing;
  end loop;
end;
$$;

create or replace function public.send_message_with_mentions_v2(
  p_conversation_id uuid,
  p_body text,
  p_format text default 'chat',
  p_subject text default null,
  p_is_announcement boolean default false,
  p_reply_to_id uuid default null,
  p_mentioned_user_ids uuid[] default array[]::uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_message_id uuid;
begin
  v_message_id:=public.send_message_v2(p_conversation_id,p_body,p_format,p_subject,p_is_announcement,p_reply_to_id);
  perform app_private.add_message_mentions_v2(v_message_id,p_mentioned_user_ids);
  return v_message_id;
end;
$$;

create or replace function public.create_comment_v2(
  p_target_type text,
  p_target_id uuid,
  p_body text,
  p_reply_to_id uuid default null,
  p_mentioned_user_ids uuid[] default array[]::uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid:=auth.uid();
  v_workspace uuid;
  v_project uuid;
  v_id uuid;
  v_user uuid;
  v_reply public.comments%rowtype;
begin
  if v_actor is null or not app_private.user_can_access_comment_target_v2(p_target_type,p_target_id,v_actor) then raise exception 'COMMENT_TARGET_ACCESS_DENIED'; end if;

  if p_target_type='action' then select workspace_id,project_id into v_workspace,v_project from public.actions where id=p_target_id;
  elsif p_target_type='milestone' then select workspace_id,project_id into v_workspace,v_project from public.milestones where id=p_target_id;
  elsif p_target_type='deliverable' then select workspace_id,project_id into v_workspace,v_project from public.deliverables where id=p_target_id;
  elsif p_target_type='deliverable_version' then select d.workspace_id,d.project_id into v_workspace,v_project from public.deliverable_versions dv join public.deliverables d on d.id=dv.deliverable_id where dv.id=p_target_id;
  elsif p_target_type='decision' then select workspace_id,project_id into v_workspace,v_project from public.decisions where id=p_target_id;
  elsif p_target_type='meeting' then select workspace_id,project_id into v_workspace,v_project from public.meetings where id=p_target_id;
  else raise exception 'COMMENT_TARGET_TYPE_INVALID'; end if;

  if p_reply_to_id is not null then
    select * into v_reply from public.comments where id=p_reply_to_id;
    if not found or v_reply.target_type<>p_target_type or v_reply.target_id<>p_target_id then raise exception 'COMMENT_REPLY_CROSS_TARGET'; end if;
  end if;

  insert into public.comments(workspace_id,project_id,target_type,target_id,author_id,body,reply_to_id)
  values(v_workspace,v_project,p_target_type,p_target_id,v_actor,btrim(p_body),p_reply_to_id)
  returning id into v_id;

  foreach v_user in array coalesce(p_mentioned_user_ids,array[]::uuid[]) loop
    if v_user=v_actor then continue; end if;
    if not app_private.user_can_access_comment_target_v2(p_target_type,p_target_id,v_user) then raise exception 'MENTION_TARGET_CANNOT_READ_SOURCE'; end if;
    insert into public.mentions(workspace_id,mentioned_user_id,mentioned_by,comment_id)
    values(v_workspace,v_user,v_actor,v_id)
    on conflict (comment_id,mentioned_user_id) do nothing;
  end loop;

  return v_id;
end;
$$;

create or replace function public.add_attachment_to_message_v2(
  p_message_id uuid,p_storage_path text,p_file_name text,p_mime_type text default null,p_size_bytes bigint default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare v_message public.messages%rowtype; v_id uuid;
begin
  select * into v_message from public.messages where id=p_message_id;
  if not found or not app_private.can_access_conversation(v_message.conversation_id) then raise exception 'ATTACHMENT_MESSAGE_ACCESS_DENIED'; end if;
  insert into public.attachments(workspace_id,message_id,storage_path,file_name,mime_type,size_bytes,created_by)
  values(v_message.workspace_id,p_message_id,p_storage_path,btrim(p_file_name),p_mime_type,p_size_bytes,auth.uid()) returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.add_attachment_to_comment_v2(
  p_comment_id uuid,p_storage_path text,p_file_name text,p_mime_type text default null,p_size_bytes bigint default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare v_comment public.comments%rowtype; v_id uuid;
begin
  select * into v_comment from public.comments where id=p_comment_id;
  if not found or not app_private.user_can_access_comment_target_v2(v_comment.target_type,v_comment.target_id,auth.uid()) then raise exception 'ATTACHMENT_COMMENT_ACCESS_DENIED'; end if;
  insert into public.attachments(workspace_id,comment_id,storage_path,file_name,mime_type,size_bytes,created_by)
  values(v_comment.workspace_id,p_comment_id,p_storage_path,btrim(p_file_name),p_mime_type,p_size_bytes,auth.uid()) returning id into v_id;
  return v_id;
end;
$$;

revoke all on function app_private.add_message_mentions_v2(uuid,uuid[]) from public,anon,authenticated;
revoke all on function public.send_message_with_mentions_v2(uuid,text,text,text,boolean,uuid,uuid[]) from public,anon;
revoke all on function public.create_comment_v2(text,uuid,text,uuid,uuid[]) from public,anon;
revoke all on function public.add_attachment_to_message_v2(uuid,text,text,text,bigint) from public,anon;
revoke all on function public.add_attachment_to_comment_v2(uuid,text,text,text,bigint) from public,anon;
grant execute on function public.send_message_with_mentions_v2(uuid,text,text,text,boolean,uuid,uuid[]) to authenticated;
grant execute on function public.create_comment_v2(text,uuid,text,uuid,uuid[]) to authenticated;
grant execute on function public.add_attachment_to_message_v2(uuid,text,text,text,bigint) to authenticated;
grant execute on function public.add_attachment_to_comment_v2(uuid,text,text,text,bigint) to authenticated;

-- QA-validated contextual RLS wrappers and table grants
create or replace function app_private.can_access_comment_target_v2(
  p_target_type text,
  p_target_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select app_private.user_can_access_comment_target_v2(p_target_type,p_target_id,auth.uid());
$$;

create or replace function app_private.can_write_comment_v2(
  p_target_type text,
  p_target_id uuid,
  p_workspace_id uuid,
  p_project_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null
    and app_private.user_can_access_comment_target_v2(p_target_type,p_target_id,auth.uid())
    and app_private.comment_target_scope_matches_v2(p_target_type,p_target_id,p_workspace_id,p_project_id);
$$;

revoke all on function app_private.can_access_comment_target_v2(text,uuid) from public,anon,authenticated;
revoke all on function app_private.can_write_comment_v2(text,uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function app_private.can_access_comment_target_v2(text,uuid) to authenticated;
grant execute on function app_private.can_write_comment_v2(text,uuid,uuid,uuid) to authenticated;

drop policy if exists comments_select_v2 on public.comments;
create policy comments_select_v2 on public.comments
for select using (app_private.can_access_comment_target_v2(target_type,target_id));

drop policy if exists comments_insert_v2 on public.comments;
create policy comments_insert_v2 on public.comments
for insert with check (
  author_id=auth.uid()
  and app_private.can_write_comment_v2(target_type,target_id,workspace_id,project_id)
);

drop policy if exists comments_update_author_v2 on public.comments;
create policy comments_update_author_v2 on public.comments
for update
using (
  author_id=auth.uid()
  and deleted_at is null
  and app_private.can_access_comment_target_v2(target_type,target_id)
)
with check (
  author_id=auth.uid()
  and app_private.can_write_comment_v2(target_type,target_id,workspace_id,project_id)
);

-- Comment creation is RPC-owned. This closes the direct INSERT path that the
-- original draft comment already intended to close but had not revoked.
revoke insert on public.comments from authenticated;

-- Parent visibility is already enforced by the parent tables' RLS. Reusing it
-- avoids exposing arbitrary-user helper predicates through attachment RLS.
drop policy if exists attachments_select_v2 on public.attachments;
create policy attachments_select_v2 on public.attachments
for select using (
  (message_id is not null and exists(
    select 1 from public.messages m where m.id=message_id
  ))
  or
  (comment_id is not null and exists(
    select 1 from public.comments c where c.id=comment_id
  ))
);

-- These tables are created by migration 005, after the baseline grants that
-- existed on V4.2.2. PostgreSQL table privileges must therefore be granted
-- explicitly; RLS remains the row-level authorization boundary.
grant select on public.comments to authenticated;
grant select on public.mentions to authenticated;
grant select on public.attachments to authenticated;

commit;
