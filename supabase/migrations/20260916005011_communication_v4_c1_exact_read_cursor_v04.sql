-- 2b2c Communication V4 — C1 exact read-cursor hardening candidate V0.4
-- Applies on top of C1 dormant foundation V0.3.
-- Candidate only until transactional validation passes.

-- ---------------------------------------------------------------------------
-- 1. Exact cursor persisted beside legacy timestamp
-- ---------------------------------------------------------------------------

alter table public.conversation_members
  add column if not exists last_read_message_id uuid;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname='conversation_members_last_read_message_id_fkey'
  ) then
    alter table public.conversation_members
      add constraint conversation_members_last_read_message_id_fkey
      foreign key (last_read_message_id)
      references public.messages(id)
      on delete set null;
  end if;
end
$$;

create index if not exists conversation_members_last_read_message_idx_v4
  on public.conversation_members(last_read_message_id)
  where last_read_message_id is not null;

-- ---------------------------------------------------------------------------
-- 2. Cursor is server-workflow controlled.
-- Existing self-update semantics for notification_level/hidden_at remain intact.
-- FK cleanup may set a cursor to NULL after the referenced message disappears.
-- ---------------------------------------------------------------------------

create or replace function app_private.validate_conversation_member_update_v2()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  v_cursor_conversation uuid;
  v_cursor_workflow boolean := coalesce(current_setting('app.allow_communication_v4_read_cursor',true),'0')='1';
  v_fk_cleanup boolean := false;
begin
  if tg_op='UPDATE' then
    if new.conversation_id is distinct from old.conversation_id
       or new.user_id is distinct from old.user_id then
      raise exception 'CONVERSATION_MEMBER_IDENTITY_IMMUTABLE';
    end if;

    if new.last_read_message_id is distinct from old.last_read_message_id then
      -- ON DELETE SET NULL is allowed only after the old referenced message is gone.
      v_fk_cleanup := new.last_read_message_id is null
        and old.last_read_message_id is not null
        and not exists(select 1 from public.messages m where m.id=old.last_read_message_id);

      if not v_cursor_workflow and not v_fk_cleanup then
        raise exception 'CONVERSATION_READ_CURSOR_USE_WORKFLOW';
      end if;
    end if;
  elsif new.last_read_message_id is not null and not v_cursor_workflow then
    raise exception 'CONVERSATION_READ_CURSOR_USE_WORKFLOW';
  end if;

  if new.last_read_message_id is not null then
    select m.conversation_id into v_cursor_conversation
    from public.messages m
    where m.id=new.last_read_message_id;

    if v_cursor_conversation is null
       or v_cursor_conversation is distinct from new.conversation_id then
      raise exception 'CONVERSATION_READ_CURSOR_MESSAGE_INVALID';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_validate_conversation_member_update_v2 on public.conversation_members;
create trigger trg_validate_conversation_member_update_v2
before insert or update on public.conversation_members
for each row execute function app_private.validate_conversation_member_update_v2();

-- ---------------------------------------------------------------------------
-- 3. Exact seen-message read workflow.
-- V4 total message order is (created_at, id). UUID is only a deterministic
-- tie-breaker when timestamps are equal; every V4 read model/renderer must use
-- the same order.
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
  v_workspace uuid;
  v_seen_at timestamptz;
  v_current_message uuid;
  v_current_at timestamptz;
  v_legacy_read_at timestamptz;
begin
  if v_actor is null
     or not app_private.user_can_access_conversation_v2(p_conversation_id,v_actor) then
    raise exception 'CONVERSATION_ACCESS_DENIED';
  end if;

  select c.workspace_id into v_workspace
  from public.conversations c
  where c.id=p_conversation_id;

  select m.created_at into v_seen_at
  from public.messages m
  where m.id=p_seen_message_id
    and m.conversation_id=p_conversation_id;
  if v_seen_at is null then raise exception 'SEEN_MESSAGE_INVALID'; end if;

  select cm.last_read_message_id,cm.last_read_at
  into v_current_message,v_legacy_read_at
  from public.conversation_members cm
  where cm.conversation_id=p_conversation_id
    and cm.user_id=v_actor
  for update;

  if v_current_message is not null then
    select m.created_at into v_current_at
    from public.messages m
    where m.id=v_current_message
      and m.conversation_id=p_conversation_id;

    if v_current_at is not null
       and row(v_seen_at,p_seen_message_id) <= row(v_current_at,v_current_message) then
      return;
    end if;
  elsif v_legacy_read_at is not null and v_legacy_read_at > v_seen_at then
    -- C2 must seed an exact cursor before exposing V4 on legacy conversations.
    -- Until then, never regress a later legacy timestamp.
    return;
  end if;

  perform set_config('app.allow_communication_v4_read_cursor','1',true);

  insert into public.conversation_members(
    conversation_id,user_id,last_read_at,last_read_message_id,hidden_at
  ) values (
    p_conversation_id,v_actor,v_seen_at,p_seen_message_id,null
  )
  on conflict (conversation_id,user_id) do update
    set last_read_at=excluded.last_read_at,
        last_read_message_id=excluded.last_read_message_id,
        hidden_at=null;

  perform set_config('app.allow_communication_v4_read_cursor','0',true);

  update public.mentions mn
  set read_at=coalesce(mn.read_at,now())
  from public.messages m
  where mn.message_id=m.id
    and mn.mentioned_user_id=v_actor
    and mn.read_at is null
    and m.conversation_id=p_conversation_id
    and row(m.created_at,m.id) <= row(v_seen_at,p_seen_message_id);

  update public.notifications n
  set read_at=coalesce(n.read_at,now())
  where n.workspace_id=v_workspace
    and n.user_id=v_actor
    and n.read_at is null
    and n.kind in ('mention','announcement')
    and exists (
      select 1
      from public.messages m
      where m.conversation_id=p_conversation_id
        and n.route='/messages/'||p_conversation_id::text||'/message/'||m.id::text
        and row(m.created_at,m.id) <= row(v_seen_at,p_seen_message_id)
    );
end;
$$;

revoke all on function public.mark_conversation_read_v4(uuid,uuid)
  from public, anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 4. New V4 Discussions must not begin life with inherited members already read
-- at transaction timestamp. Otherwise first-message unread state can disappear
-- because PostgreSQL now() is transaction-stable.
-- C1 remains text-only and dormant.
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
  if lower(v_title)=lower('Général') then raise exception 'DISCUSSION_TITLE_RESERVED'; end if;

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
    if exists(select 1 from public.conversations c where c.source_message_id=p_source_message_id) then
      raise exception 'DISCUSSION_SOURCE_ALREADY_USED';
    end if;
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

  -- V3 audience sync runs on INSERT. Reset only the new Discussion read state so
  -- its first child message can be unread for everyone except its author.
  update public.conversation_members
  set last_read_at=null,
      last_read_message_id=null,
      notification_level='mentions',
      muted=false
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

revoke all on function public.create_discussion_v1(uuid,text,text,uuid,text,uuid[],uuid[])
  from public, anon, authenticated, service_role;

comment on column public.conversation_members.last_read_message_id is
  'Communication V4 dormant: exact read cursor. Valid only with last_read_at and V4 total order (created_at,id).';
