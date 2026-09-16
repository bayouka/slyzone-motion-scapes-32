-- 2b2c Communication V4 — C1 dormant backend foundation candidate V0.1
-- Candidate only. Do not apply without red-team + rollback proof.
-- Authority: COMMUNICATION_V4_DATA_SECURITY_CONTRACT_V0_1.md

-- ---------------------------------------------------------------------------
-- 1. Additive conversation lineage
-- ---------------------------------------------------------------------------

alter table public.conversations
  add column if not exists parent_conversation_id uuid,
  add column if not exists source_message_id uuid;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname='conversations_parent_conversation_id_fkey'
  ) then
    alter table public.conversations
      add constraint conversations_parent_conversation_id_fkey
      foreign key (parent_conversation_id)
      references public.conversations(id)
      on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint where conname='conversations_source_message_id_fkey'
  ) then
    alter table public.conversations
      add constraint conversations_source_message_id_fkey
      foreign key (source_message_id)
      references public.messages(id)
      on delete set null;
  end if;
end
$$;

create index if not exists conversations_parent_activity_v4
  on public.conversations(parent_conversation_id, status, last_message_at desc nulls last)
  where parent_conversation_id is not null;

create unique index if not exists conversations_source_message_unique_v4
  on public.conversations(source_message_id)
  where source_message_id is not null;

-- ---------------------------------------------------------------------------
-- 2. Cross-row V4 shape guard
-- ---------------------------------------------------------------------------

create or replace function app_private.validate_conversation_v4_shape()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  v_parent public.conversations%rowtype;
  v_source public.messages%rowtype;
begin
  if tg_op='UPDATE' then
    if new.parent_conversation_id is distinct from old.parent_conversation_id
       or new.source_message_id is distinct from old.source_message_id then
      raise exception 'DISCUSSION_LINEAGE_IMMUTABLE';
    end if;
  end if;

  if new.is_general and new.parent_conversation_id is not null then
    raise exception 'GENERAL_CANNOT_HAVE_PARENT';
  end if;

  if new.kind not in ('team','project')
     and (new.parent_conversation_id is not null or new.source_message_id is not null) then
    raise exception 'DISCUSSION_KIND_INVALID';
  end if;

  if new.source_message_id is not null and new.parent_conversation_id is null then
    raise exception 'DISCUSSION_SOURCE_REQUIRES_PARENT';
  end if;

  if new.parent_conversation_id is null then
    return new;
  end if;

  select * into v_parent
  from public.conversations
  where id=new.parent_conversation_id;

  if not found then raise exception 'DISCUSSION_PARENT_NOT_FOUND'; end if;
  if not v_parent.is_general then raise exception 'DISCUSSION_PARENT_NOT_GENERAL'; end if;
  if v_parent.parent_conversation_id is not null then raise exception 'DISCUSSION_NESTING_FORBIDDEN'; end if;
  if v_parent.status='archived' then raise exception 'DISCUSSION_PARENT_ARCHIVED'; end if;
  if v_parent.workspace_id is distinct from new.workspace_id then raise exception 'DISCUSSION_PARENT_WORKSPACE_MISMATCH'; end if;
  if v_parent.kind is distinct from new.kind then raise exception 'DISCUSSION_PARENT_KIND_MISMATCH'; end if;
  if new.is_general then raise exception 'DISCUSSION_CANNOT_BE_GENERAL'; end if;

  if new.kind='project' then
    if v_parent.project_id is null or new.project_id is distinct from v_parent.project_id then
      raise exception 'DISCUSSION_PARENT_PROJECT_MISMATCH';
    end if;
  elsif new.kind='team' then
    if v_parent.project_id is not null or new.project_id is not null then
      raise exception 'DISCUSSION_TEAM_PROJECT_INVALID';
    end if;
  end if;

  if new.source_message_id is not null then
    select * into v_source
    from public.messages
    where id=new.source_message_id;

    if not found then raise exception 'DISCUSSION_SOURCE_NOT_FOUND'; end if;
    if v_source.deleted_at is not null then raise exception 'DISCUSSION_SOURCE_DELETED'; end if;
    if v_source.workspace_id is distinct from new.workspace_id then raise exception 'DISCUSSION_SOURCE_WORKSPACE_MISMATCH'; end if;
    if v_source.conversation_id is distinct from v_parent.id then raise exception 'DISCUSSION_SOURCE_PARENT_MISMATCH'; end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_validate_conversation_v4_shape on public.conversations;
create trigger trg_validate_conversation_v4_shape
before insert or update on public.conversations
for each row execute function app_private.validate_conversation_v4_shape();

-- ---------------------------------------------------------------------------
-- 3. Focus / people concerned. This relation NEVER grants read access.
-- ---------------------------------------------------------------------------

create table if not exists public.conversation_focus_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  added_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  primary key (conversation_id,user_id)
);

alter table public.conversation_focus_members enable row level security;

revoke all on public.conversation_focus_members from anon;
revoke insert, update, delete on public.conversation_focus_members from authenticated;
grant select on public.conversation_focus_members to authenticated;

create or replace function app_private.validate_conversation_focus_member_v1()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  v_parent uuid;
begin
  select c.parent_conversation_id into v_parent
  from public.conversations c
  where c.id=new.conversation_id;

  if v_parent is null then raise exception 'FOCUS_REQUIRES_DISCUSSION'; end if;
  if not app_private.user_can_access_conversation_v2(new.conversation_id,new.user_id) then
    raise exception 'FOCUS_USER_CANNOT_READ_DISCUSSION';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_validate_conversation_focus_member_v1 on public.conversation_focus_members;
create trigger trg_validate_conversation_focus_member_v1
before insert or update on public.conversation_focus_members
for each row execute function app_private.validate_conversation_focus_member_v1();

create policy conversation_focus_members_select_v1
on public.conversation_focus_members
for select
to authenticated
using (app_private.can_access_conversation(conversation_id));

create or replace function app_private.cleanup_conversation_focus_on_member_delete_v1()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  delete from public.conversation_focus_members
  where conversation_id=old.conversation_id and user_id=old.user_id;
  return old;
end;
$$;

drop trigger if exists trg_cleanup_conversation_focus_on_member_delete_v1 on public.conversation_members;
create trigger trg_cleanup_conversation_focus_on_member_delete_v1
after delete on public.conversation_members
for each row execute function app_private.cleanup_conversation_focus_on_member_delete_v1();

-- ---------------------------------------------------------------------------
-- 4. Strict discussion-management authority
-- ---------------------------------------------------------------------------

create or replace function app_private.can_manage_discussion_v1(p_conversation_id uuid,p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path=''
as $$
  select p_user_id is not null and exists (
    select 1
    from public.conversations c
    left join public.projects p on p.id=c.project_id
    where c.id=p_conversation_id
      and c.parent_conversation_id is not null
      and c.kind in ('team','project')
      and (
        c.created_by=p_user_id
        or exists (
          select 1 from public.workspace_members wm
          where wm.workspace_id=c.workspace_id
            and wm.user_id=p_user_id
            and wm.status='active'
            and wm.role in ('owner','admin')
        )
        or (c.kind='project' and p.lead_user_id=p_user_id)
      )
      and app_private.user_can_access_conversation_v2(c.id,p_user_id)
  );
$$;

-- ---------------------------------------------------------------------------
-- 5. Create Discussion — TEXT-ONLY C1 contract.
-- Attachments are intentionally deferred until the storage workflow is designed;
-- C1 must not pretend attachment creation is atomic when the target conversation
-- ID does not exist before the RPC.
-- ---------------------------------------------------------------------------

create or replace function public.create_discussion_v1(
  p_parent_general_conversation_id uuid,
  p_title text,
  p_first_body text default null,
  p_source_message_id uuid default null,
  p_opening_note text default null,
  p_focus_user_ids uuid[] default array[]::uuid[],
  p_mentioned_user_ids uuid[] default array[]::uuid[]
)
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
  v_actor uuid:=auth.uid();
  v_parent public.conversations%rowtype;
  v_id uuid;
  v_title text:=nullif(btrim(coalesce(p_title,'')),'');
  v_body text:=nullif(btrim(coalesce(p_first_body,'')),'');
  v_note text:=nullif(btrim(coalesce(p_opening_note,'')),'');
  v_focus uuid[];
  v_user uuid;
begin
  if v_actor is null then raise exception 'AUTH_REQUIRED'; end if;
  if v_title is null or char_length(v_title)>120 then raise exception 'DISCUSSION_TITLE_INVALID'; end if;

  select * into v_parent
  from public.conversations
  where id=p_parent_general_conversation_id
  for share;

  if not found or not v_parent.is_general or v_parent.parent_conversation_id is not null then
    raise exception 'DISCUSSION_PARENT_INVALID';
  end if;
  if v_parent.kind not in ('team','project') or v_parent.status<>'active' then
    raise exception 'DISCUSSION_PARENT_INVALID';
  end if;
  if not app_private.user_can_access_conversation_v2(v_parent.id,v_actor) then
    raise exception 'DISCUSSION_PARENT_ACCESS_DENIED';
  end if;
  if v_parent.kind='team' and not app_private.can_write_workspace(v_parent.workspace_id) then
    raise exception 'WORKSPACE_WRITE_DENIED';
  end if;
  if v_parent.kind='project' and not app_private.can_write_project(v_parent.project_id) then
    raise exception 'PROJECT_WRITE_DENIED';
  end if;

  if p_source_message_id is null then
    if v_body is null then raise exception 'DISCUSSION_FIRST_MESSAGE_REQUIRED'; end if;
    if v_note is not null then raise exception 'DISCUSSION_OPENING_NOTE_WITHOUT_SOURCE'; end if;
  else
    if v_body is not null then raise exception 'DISCUSSION_SOURCE_MODE_CONFLICT'; end if;
    perform 1
    from public.messages m
    where m.id=p_source_message_id
      and m.conversation_id=v_parent.id
      and m.workspace_id=v_parent.workspace_id
      and m.deleted_at is null;
    if not found then raise exception 'DISCUSSION_SOURCE_INVALID'; end if;
  end if;

  select coalesce(array_agg(distinct x),array[]::uuid[]) into v_focus
  from unnest(coalesce(p_focus_user_ids,array[]::uuid[])) x
  where x is not null;

  if coalesce(array_length(v_focus,1),0)>20 then raise exception 'DISCUSSION_FOCUS_LIMIT'; end if;
  foreach v_user in array v_focus loop
    if not app_private.user_can_access_conversation_v2(v_parent.id,v_user) then
      raise exception 'FOCUS_USER_CANNOT_READ_PARENT';
    end if;
  end loop;

  insert into public.conversations(
    workspace_id,project_id,kind,title,created_by,is_general,parent_conversation_id,source_message_id
  ) values (
    v_parent.workspace_id,v_parent.project_id,v_parent.kind,v_title,v_actor,false,v_parent.id,p_source_message_id
  ) returning id into v_id;

  -- Existing V3 membership triggers materialize the inherited readable audience.
  -- C1 then gives that inherited audience the V4 default without changing any
  -- non-V4 conversation.
  update public.conversation_members
  set notification_level='mentions', muted=false
  where conversation_id=v_id;

  update public.conversation_members
  set notification_level='all', muted=false
  where conversation_id=v_id and user_id=v_actor;

  foreach v_user in array v_focus loop
    insert into public.conversation_focus_members(conversation_id,user_id,added_by)
    values(v_id,v_user,v_actor)
    on conflict (conversation_id,user_id) do update set added_by=excluded.added_by;

    update public.conversation_members
    set notification_level=case when notification_level='muted' then 'muted' else 'all' end,
        muted=(notification_level='muted')
    where conversation_id=v_id and user_id=v_user;
  end loop;

  if p_source_message_id is null then
    perform public.send_message_v3(
      v_id,v_body,'chat',null,false,null,
      coalesce(p_mentioned_user_ids,array[]::uuid[]),'[]'::jsonb
    );
  elsif v_note is not null then
    perform public.send_message_v3(
      v_id,v_note,'chat',null,false,null,
      coalesce(p_mentioned_user_ids,array[]::uuid[]),'[]'::jsonb
    );
  elsif coalesce(array_length(p_mentioned_user_ids,1),0)>0 then
    raise exception 'DISCUSSION_MENTION_REQUIRES_OPENING_NOTE';
  end if;

  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 6. Focus / follow / resolve / reopen
-- ---------------------------------------------------------------------------

create or replace function public.set_discussion_focus_members_v1(
  p_conversation_id uuid,
  p_user_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare
  v_actor uuid:=auth.uid();
  v_ids uuid[];
  v_user uuid;
begin
  if v_actor is null or not app_private.can_manage_discussion_v1(p_conversation_id,v_actor) then
    raise exception 'DISCUSSION_MANAGE_DENIED';
  end if;

  select coalesce(array_agg(distinct x),array[]::uuid[]) into v_ids
  from unnest(coalesce(p_user_ids,array[]::uuid[])) x
  where x is not null;

  if coalesce(array_length(v_ids,1),0)>20 then raise exception 'DISCUSSION_FOCUS_LIMIT'; end if;
  foreach v_user in array v_ids loop
    if not app_private.user_can_access_conversation_v2(p_conversation_id,v_user) then
      raise exception 'FOCUS_USER_CANNOT_READ_DISCUSSION';
    end if;
  end loop;

  delete from public.conversation_focus_members
  where conversation_id=p_conversation_id
    and not (user_id=any(v_ids));

  foreach v_user in array v_ids loop
    insert into public.conversation_focus_members(conversation_id,user_id,added_by)
    values(p_conversation_id,v_user,v_actor)
    on conflict (conversation_id,user_id) do update set added_by=excluded.added_by;

    update public.conversation_members
    set notification_level=case when notification_level='muted' then 'muted' else 'all' end,
        muted=(notification_level='muted')
    where conversation_id=p_conversation_id and user_id=v_user;
  end loop;
end;
$$;

create or replace function public.set_conversation_follow_v1(
  p_conversation_id uuid,
  p_mode text
)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare
  v_actor uuid:=auth.uid();
  v_level text;
begin
  if v_actor is null or not app_private.user_can_access_conversation_v2(p_conversation_id,v_actor) then
    raise exception 'CONVERSATION_ACCESS_DENIED';
  end if;
  v_level:=case p_mode when 'follow' then 'all' when 'mentions' then 'mentions' when 'mute' then 'muted' else null end;
  if v_level is null then raise exception 'FOLLOW_MODE_INVALID'; end if;

  insert into public.conversation_members(conversation_id,user_id,last_read_at,muted,notification_level)
  values(p_conversation_id,v_actor,null,v_level='muted',v_level)
  on conflict (conversation_id,user_id) do update
    set muted=excluded.muted, notification_level=excluded.notification_level;
end;
$$;

create or replace function public.resolve_discussion_v1(p_conversation_id uuid)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare v_actor uuid:=auth.uid();
begin
  if v_actor is null or not app_private.can_manage_discussion_v1(p_conversation_id,v_actor) then
    raise exception 'DISCUSSION_MANAGE_DENIED';
  end if;
  update public.conversations
  set status='resolved'
  where id=p_conversation_id and parent_conversation_id is not null and status='active';
  if not found then raise exception 'DISCUSSION_NOT_ACTIVE'; end if;
end;
$$;

create or replace function public.reopen_discussion_v1(p_conversation_id uuid)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare v_actor uuid:=auth.uid();
begin
  if v_actor is null or not app_private.can_manage_discussion_v1(p_conversation_id,v_actor) then
    raise exception 'DISCUSSION_MANAGE_DENIED';
  end if;
  update public.conversations
  set status='active'
  where id=p_conversation_id and parent_conversation_id is not null and status='resolved';
  if not found then raise exception 'DISCUSSION_NOT_RESOLVED'; end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 7. Seen-message read boundary
-- ---------------------------------------------------------------------------

create or replace function public.mark_conversation_read_v4(
  p_conversation_id uuid,
  p_seen_message_id uuid
)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare
  v_actor uuid:=auth.uid();
  v_seen_at timestamptz;
begin
  if v_actor is null or not app_private.user_can_access_conversation_v2(p_conversation_id,v_actor) then
    raise exception 'CONVERSATION_ACCESS_DENIED';
  end if;

  select m.created_at into v_seen_at
  from public.messages m
  where m.id=p_seen_message_id and m.conversation_id=p_conversation_id;
  if v_seen_at is null then raise exception 'SEEN_MESSAGE_INVALID'; end if;

  perform public.mark_conversation_read_v3(p_conversation_id,v_seen_at);
end;
$$;

-- ---------------------------------------------------------------------------
-- 8. Resolved-write guard + auto-follow on participation
-- ---------------------------------------------------------------------------

create or replace function app_private.validate_message_v2()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  v_conversation public.conversations%rowtype;
  v_reply_conversation uuid;
begin
  if tg_op = 'UPDATE' then
    if new.workspace_id is distinct from old.workspace_id
       or new.conversation_id is distinct from old.conversation_id
       or new.author_id is distinct from old.author_id
       or new.created_at is distinct from old.created_at
       or new.reply_to_id is distinct from old.reply_to_id
       or new.format is distinct from old.format
       or new.is_announcement is distinct from old.is_announcement then
      raise exception 'MESSAGE_IMMUTABLE_FIELDS';
    end if;
  end if;

  select * into v_conversation from public.conversations where id=new.conversation_id;
  if not found then raise exception 'CONVERSATION_NOT_FOUND'; end if;
  if v_conversation.workspace_id is distinct from new.workspace_id then raise exception 'MESSAGE_WORKSPACE_MISMATCH'; end if;
  if tg_op='INSERT' and v_conversation.parent_conversation_id is not null and v_conversation.status='resolved' then
    raise exception 'DISCUSSION_RESOLVED';
  end if;

  new.body := btrim(new.body);
  if char_length(new.body) < 1 or char_length(new.body) > 20000 then raise exception 'MESSAGE_BODY_INVALID'; end if;

  if new.format='chat' then
    if new.subject is not null or new.is_announcement then raise exception 'CHAT_MESSAGE_SHAPE_INVALID'; end if;
  else
    new.subject := nullif(btrim(coalesce(new.subject,'')),'');
    if new.subject is null then raise exception 'STRUCTURED_MESSAGE_SUBJECT_REQUIRED'; end if;
  end if;

  if new.is_announcement and v_conversation.kind not in ('team','project') then
    raise exception 'ANNOUNCEMENT_AUDIENCE_INVALID';
  end if;

  if new.reply_to_id is not null then
    select conversation_id into v_reply_conversation from public.messages where id=new.reply_to_id;
    if v_reply_conversation is null or v_reply_conversation is distinct from new.conversation_id then
      raise exception 'MESSAGE_REPLY_CROSS_CONVERSATION';
    end if;
  end if;

  return new;
end;
$$;

create or replace function app_private.auto_follow_discussion_author_v1()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  update public.conversation_members cm
  set notification_level='all', muted=false
  from public.conversations c
  where c.id=new.conversation_id
    and c.parent_conversation_id is not null
    and cm.conversation_id=c.id
    and cm.user_id=new.author_id
    and cm.notification_level='mentions';
  return new;
end;
$$;

drop trigger if exists trg_auto_follow_discussion_author_v1 on public.messages;
create trigger trg_auto_follow_discussion_author_v1
after insert on public.messages
for each row execute function app_private.auto_follow_discussion_author_v1();

-- ---------------------------------------------------------------------------
-- 9. Keep C1 truly dormant: no authenticated EXECUTE yet.
-- C4 activation will grant the intended end-user RPCs after preview/E2E proof.
-- ---------------------------------------------------------------------------

revoke all on function public.create_discussion_v1(uuid,text,text,uuid,text,uuid[],uuid[]) from public, anon, authenticated;
revoke all on function public.set_discussion_focus_members_v1(uuid,uuid[]) from public, anon, authenticated;
revoke all on function public.set_conversation_follow_v1(uuid,text) from public, anon, authenticated;
revoke all on function public.resolve_discussion_v1(uuid) from public, anon, authenticated;
revoke all on function public.reopen_discussion_v1(uuid) from public, anon, authenticated;
revoke all on function public.mark_conversation_read_v4(uuid,uuid) from public, anon, authenticated;

grant execute on function public.create_discussion_v1(uuid,text,text,uuid,text,uuid[],uuid[]) to service_role;
grant execute on function public.set_discussion_focus_members_v1(uuid,uuid[]) to service_role;
grant execute on function public.set_conversation_follow_v1(uuid,text) to service_role;
grant execute on function public.resolve_discussion_v1(uuid) to service_role;
grant execute on function public.reopen_discussion_v1(uuid) to service_role;
grant execute on function public.mark_conversation_read_v4(uuid,uuid) to service_role;

comment on column public.conversations.parent_conversation_id is 'Communication V4 dormant: General parent of a structured Discussion.';
comment on column public.conversations.source_message_id is 'Communication V4 dormant: optional source message used as Discussion point of departure.';
comment on table public.conversation_focus_members is 'Communication V4 dormant: people concerned by a Discussion; never grants access.';
