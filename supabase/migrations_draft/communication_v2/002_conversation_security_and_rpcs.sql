-- DRAFT ONLY — DO NOT APPLY TO THE LIVE V4.2.2 DATABASE.
-- Communication v2 / Migration 002: audience security + creation workflows.

begin;

create or replace function app_private.user_is_active_workspace_member_v2(
  p_workspace_id uuid,
  p_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_user_id is not null and exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = p_workspace_id
      and wm.user_id = p_user_id
      and wm.status = 'active'
  );
$$;

create or replace function app_private.user_can_access_project_v2(
  p_project_id uuid,
  p_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_user_id is not null and exists (
    select 1
    from public.projects p
    join public.workspace_members wm on wm.workspace_id = p.workspace_id
    where p.id = p_project_id
      and wm.user_id = p_user_id
      and wm.status = 'active'
      and (
        wm.role in ('owner','admin')
        or (wm.role = 'member' and wm.access_mode = 'all')
        or exists (
          select 1
          from public.project_members pm
          where pm.project_id = p.id and pm.user_id = p_user_id
        )
      )
  );
$$;

create or replace function app_private.user_can_access_conversation_v2(
  p_conversation_id uuid,
  p_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_user_id is not null and exists (
    select 1
    from public.conversations c
    join public.conversation_members cm
      on cm.conversation_id = c.id and cm.user_id = p_user_id
    join public.workspace_members wm
      on wm.workspace_id = c.workspace_id and wm.user_id = p_user_id and wm.status = 'active'
    where c.id = p_conversation_id
      and (
        c.kind in ('direct','context')
        or (c.kind = 'team' and wm.role <> 'guest')
        or (c.kind = 'project' and app_private.user_can_access_project_v2(c.project_id, p_user_id))
      )
  );
$$;

create or replace function app_private.can_access_conversation(p_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select app_private.user_can_access_conversation_v2(p_conversation_id, auth.uid());
$$;

create or replace function app_private.can_manage_conversation(p_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null and exists (
    select 1
    from public.conversations c
    where c.id = p_conversation_id
      and (
        (c.kind = 'direct' and c.created_by = auth.uid() and app_private.can_access_conversation(c.id))
        or (c.kind = 'team' and (c.created_by = auth.uid() or app_private.can_manage_workspace(c.workspace_id)))
        or (c.kind = 'project' and app_private.can_write_project(c.project_id))
        or (c.kind = 'context' and (c.created_by = auth.uid() or app_private.can_manage_workspace(c.workspace_id)))
      )
  );
$$;

revoke all on function app_private.user_is_active_workspace_member_v2(uuid,uuid) from public, anon, authenticated;
revoke all on function app_private.user_can_access_project_v2(uuid,uuid) from public, anon, authenticated;
revoke all on function app_private.user_can_access_conversation_v2(uuid,uuid) from public, anon, authenticated;

-- General topics are created automatically while keeping the existing V4.2.2
-- project/workspace RPCs compatible.
create or replace function app_private.default_general_conversation_v2()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.kind in ('team','project')
     and lower(btrim(new.title)) = lower('Général')
     and not new.is_general then
    new.is_general := true;
  end if;
  return new;
end;
$$;

revoke all on function app_private.default_general_conversation_v2() from public, anon, authenticated;

drop trigger if exists trg_default_general_conversation_v2 on public.conversations;
create trigger trg_default_general_conversation_v2
before insert on public.conversations
for each row execute function app_private.default_general_conversation_v2();

create or replace function app_private.create_workspace_general_v2()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.conversations(workspace_id, project_id, kind, title, is_general, created_by)
  values(new.id, null, 'team', 'Général', true, new.created_by)
  on conflict do nothing;
  return new;
end;
$$;

revoke all on function app_private.create_workspace_general_v2() from public, anon, authenticated;

drop trigger if exists trg_create_workspace_general_v2 on public.workspaces;
create trigger trg_create_workspace_general_v2
after insert on public.workspaces
for each row execute function app_private.create_workspace_general_v2();

-- Backfill one Team/General conversation for existing workspaces.
insert into public.conversations(workspace_id, project_id, kind, title, is_general, created_by)
select w.id, null, 'team', 'Général', true, w.created_by
from public.workspaces w
where not exists (
  select 1 from public.conversations c
  where c.workspace_id = w.id and c.kind = 'team' and c.is_general and c.status <> 'archived'
);

-- Keep Team and Project topic audiences synchronized. Directs are deliberately
-- excluded from both mechanisms, even when linked_project_id is populated.
create or replace function app_private.sync_workspace_team_member_v2()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_workspace uuid := coalesce(new.workspace_id, old.workspace_id);
  v_user uuid := coalesce(new.user_id, old.user_id);
  v_should_have boolean := false;
begin
  if tg_op <> 'DELETE' then
    v_should_have := new.status = 'active' and new.role <> 'guest';
  end if;

  if v_should_have then
    insert into public.conversation_members(conversation_id, user_id, last_read_at)
    select c.id, v_user, now()
    from public.conversations c
    where c.workspace_id = v_workspace and c.kind = 'team' and c.status <> 'archived'
    on conflict (conversation_id,user_id) do nothing;
  else
    delete from public.conversation_members cm
    using public.conversations c
    where cm.conversation_id = c.id
      and c.workspace_id = v_workspace
      and c.kind = 'team'
      and cm.user_id = v_user;
  end if;
  return coalesce(new, old);
end;
$$;

create or replace function app_private.sync_project_conversation_member_v2()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_project uuid := coalesce(new.project_id, old.project_id);
  v_user uuid := coalesce(new.user_id, old.user_id);
begin
  if tg_op = 'DELETE' then
    delete from public.conversation_members cm
    using public.conversations c
    where cm.conversation_id = c.id
      and c.kind = 'project'
      and c.project_id = v_project
      and cm.user_id = v_user;
  else
    insert into public.conversation_members(conversation_id, user_id, last_read_at)
    select c.id, v_user, now()
    from public.conversations c
    where c.kind = 'project'
      and c.project_id = v_project
      and c.status <> 'archived'
    on conflict (conversation_id,user_id) do nothing;
  end if;
  return coalesce(new, old);
end;
$$;

revoke all on function app_private.sync_workspace_team_member_v2() from public, anon, authenticated;
revoke all on function app_private.sync_project_conversation_member_v2() from public, anon, authenticated;

drop trigger if exists trg_sync_workspace_team_member_v2 on public.workspace_members;
create trigger trg_sync_workspace_team_member_v2
after insert or update of status, role or delete on public.workspace_members
for each row execute function app_private.sync_workspace_team_member_v2();

drop trigger if exists trg_sync_project_conversation_member_v2 on public.project_members;
create trigger trg_sync_project_conversation_member_v2
after insert or delete on public.project_members
for each row execute function app_private.sync_project_conversation_member_v2();

-- Backfill audiences from the current membership tables.
insert into public.conversation_members(conversation_id,user_id,last_read_at)
select c.id, wm.user_id, now()
from public.conversations c
join public.workspace_members wm on wm.workspace_id = c.workspace_id
where c.kind = 'team' and c.status <> 'archived'
  and wm.status = 'active' and wm.role <> 'guest'
on conflict (conversation_id,user_id) do nothing;

insert into public.conversation_members(conversation_id,user_id,last_read_at)
select c.id, pm.user_id, now()
from public.conversations c
join public.project_members pm on pm.project_id = c.project_id
where c.kind = 'project' and c.status <> 'archived'
on conflict (conversation_id,user_id) do nothing;

-- Membership table: clients may read membership and update only their own
-- read/preferences columns. Audience membership changes are RPC/trigger-owned.
drop policy if exists conversation_members_insert on public.conversation_members;
drop policy if exists conversation_members_delete on public.conversation_members;
drop policy if exists conversation_members_update on public.conversation_members;

drop policy if exists conversation_members_select on public.conversation_members;
create policy conversation_members_select on public.conversation_members
for select using (app_private.can_access_conversation(conversation_id));

create policy conversation_members_update_self_v2 on public.conversation_members
for update
using (user_id = auth.uid() and app_private.can_access_conversation(conversation_id))
with check (user_id = auth.uid() and app_private.can_access_conversation(conversation_id));

revoke insert, delete on public.conversation_members from authenticated;
revoke update on public.conversation_members from authenticated;
grant update(last_read_at, muted, notification_level, hidden_at) on public.conversation_members to authenticated;

-- Conversation creation is now performed through narrow RPCs. Existing project
-- creation keeps working because its SECURITY DEFINER RPC owns its insert.
revoke insert, delete on public.conversations from authenticated;

create or replace function public.get_or_create_direct_v2(
  p_workspace_id uuid,
  p_other_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_pair text;
  v_id uuid;
begin
  if v_actor is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_other_user_id is null or p_other_user_id = v_actor then raise exception 'DIRECT_RECIPIENT_INVALID'; end if;
  if not app_private.user_is_active_workspace_member_v2(p_workspace_id, v_actor)
     or not app_private.user_is_active_workspace_member_v2(p_workspace_id, p_other_user_id) then
    raise exception 'DIRECT_MEMBER_NOT_ACTIVE';
  end if;

  v_pair := least(v_actor::text,p_other_user_id::text)||':'||greatest(v_actor::text,p_other_user_id::text);

  select c.id into v_id
  from public.conversations c
  where c.workspace_id = p_workspace_id and c.kind = 'direct' and c.direct_pair_key = v_pair
  limit 1;

  if v_id is null then
    begin
      insert into public.conversations(workspace_id,kind,title,direct_pair_key,created_by)
      values(p_workspace_id,'direct','Message direct',v_pair,v_actor)
      returning id into v_id;
    exception when unique_violation then
      select c.id into v_id
      from public.conversations c
      where c.workspace_id = p_workspace_id and c.kind = 'direct' and c.direct_pair_key = v_pair
      limit 1;
    end;

    insert into public.conversation_members(conversation_id,user_id,last_read_at)
    values(v_id,v_actor,now()),(v_id,p_other_user_id,now())
    on conflict (conversation_id,user_id) do nothing;
  end if;

  return v_id;
end;
$$;

create or replace function public.create_group_direct_v2(
  p_workspace_id uuid,
  p_user_ids uuid[],
  p_title text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_id uuid;
  v_user uuid;
  v_members uuid[];
begin
  if v_actor is null then raise exception 'AUTH_REQUIRED'; end if;
  if not app_private.user_is_active_workspace_member_v2(p_workspace_id,v_actor) then raise exception 'WORKSPACE_ACCESS_DENIED'; end if;

  select array_agg(distinct x) into v_members
  from unnest(coalesce(p_user_ids,array[]::uuid[]) || array[v_actor]) as x;

  if coalesce(array_length(v_members,1),0) < 2 then raise exception 'DIRECT_GROUP_REQUIRES_TWO_MEMBERS'; end if;

  foreach v_user in array v_members loop
    if not app_private.user_is_active_workspace_member_v2(p_workspace_id,v_user) then
      raise exception 'DIRECT_MEMBER_NOT_ACTIVE';
    end if;
  end loop;

  insert into public.conversations(workspace_id,kind,title,created_by)
  values(p_workspace_id,'direct',coalesce(nullif(btrim(p_title),''),'Conversation privée'),v_actor)
  returning id into v_id;

  insert into public.conversation_members(conversation_id,user_id,last_read_at)
  select v_id, x, now() from unnest(v_members) as x;

  return v_id;
end;
$$;

create or replace function public.create_team_topic_v2(
  p_workspace_id uuid,
  p_title text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_id uuid;
begin
  if v_actor is null or not app_private.can_write_workspace(p_workspace_id) then raise exception 'WORKSPACE_WRITE_DENIED'; end if;
  if nullif(btrim(p_title),'') is null then raise exception 'TOPIC_TITLE_REQUIRED'; end if;
  if app_private.is_external_workspace_member(p_workspace_id) then raise exception 'TEAM_TOPIC_INTERNAL_ONLY'; end if;

  insert into public.conversations(workspace_id,kind,title,created_by)
  values(p_workspace_id,'team',btrim(p_title),v_actor)
  returning id into v_id;

  insert into public.conversation_members(conversation_id,user_id,last_read_at)
  select v_id,wm.user_id,now()
  from public.workspace_members wm
  where wm.workspace_id=p_workspace_id and wm.status='active' and wm.role<>'guest'
  on conflict (conversation_id,user_id) do nothing;

  return v_id;
end;
$$;

create or replace function public.create_project_topic_v2(
  p_project_id uuid,
  p_title text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_workspace uuid;
  v_id uuid;
begin
  if v_actor is null or not app_private.can_write_project(p_project_id) then raise exception 'PROJECT_WRITE_DENIED'; end if;
  if nullif(btrim(p_title),'') is null then raise exception 'TOPIC_TITLE_REQUIRED'; end if;
  select workspace_id into v_workspace from public.projects where id=p_project_id;
  if v_workspace is null then raise exception 'PROJECT_NOT_FOUND'; end if;

  insert into public.conversations(workspace_id,project_id,kind,title,created_by)
  values(v_workspace,p_project_id,'project',btrim(p_title),v_actor)
  returning id into v_id;

  insert into public.conversation_members(conversation_id,user_id,last_read_at)
  select v_id,pm.user_id,now() from public.project_members pm where pm.project_id=p_project_id
  on conflict (conversation_id,user_id) do nothing;
  insert into public.conversation_members(conversation_id,user_id,last_read_at)
  values(v_id,v_actor,now()) on conflict (conversation_id,user_id) do nothing;

  return v_id;
end;
$$;

create or replace function public.link_direct_to_project_v2(
  p_conversation_id uuid,
  p_project_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_workspace uuid;
  v_project_workspace uuid;
begin
  if v_actor is null or not app_private.can_access_conversation(p_conversation_id) then raise exception 'CONVERSATION_ACCESS_DENIED'; end if;
  select workspace_id into v_workspace from public.conversations where id=p_conversation_id and kind='direct';
  if v_workspace is null then raise exception 'DIRECT_REQUIRED'; end if;
  if not app_private.user_can_access_project_v2(p_project_id,v_actor) then raise exception 'PROJECT_ACCESS_DENIED'; end if;
  select workspace_id into v_project_workspace from public.projects where id=p_project_id;
  if v_project_workspace is distinct from v_workspace then raise exception 'PROJECT_WORKSPACE_MISMATCH'; end if;

  update public.conversations set linked_project_id=p_project_id where id=p_conversation_id;
end;
$$;

create or replace function public.set_conversation_status_v2(
  p_conversation_id uuid,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_general boolean;
  v_kind text;
begin
  if p_status not in ('active','resolved','archived') then raise exception 'CONVERSATION_STATUS_INVALID'; end if;
  if not app_private.can_manage_conversation(p_conversation_id) then raise exception 'CONVERSATION_MANAGE_DENIED'; end if;
  select is_general,kind into v_general,v_kind from public.conversations where id=p_conversation_id;
  if v_kind='direct' then raise exception 'DIRECT_HAS_NO_TOPIC_STATUS'; end if;
  if v_general and p_status<>'active' then raise exception 'GENERAL_TOPIC_IS_PERMANENT'; end if;
  update public.conversations set status=p_status where id=p_conversation_id;
end;
$$;

create or replace function public.mark_conversation_read_v2(
  p_conversation_id uuid,
  p_seen_at timestamptz default now()
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not app_private.can_access_conversation(p_conversation_id) then raise exception 'CONVERSATION_ACCESS_DENIED'; end if;
  update public.conversation_members
  set last_read_at=coalesce(p_seen_at,now()), hidden_at=null
  where conversation_id=p_conversation_id and user_id=auth.uid();
end;
$$;

create or replace function public.set_conversation_notifications_v2(
  p_conversation_id uuid,
  p_level text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_level not in ('all','mentions','muted') then raise exception 'NOTIFICATION_LEVEL_INVALID'; end if;
  if not app_private.can_access_conversation(p_conversation_id) then raise exception 'CONVERSATION_ACCESS_DENIED'; end if;
  update public.conversation_members
  set notification_level=p_level, muted=(p_level='muted')
  where conversation_id=p_conversation_id and user_id=auth.uid();
end;
$$;

revoke all on function public.get_or_create_direct_v2(uuid,uuid) from public, anon;
revoke all on function public.create_group_direct_v2(uuid,uuid[],text) from public, anon;
revoke all on function public.create_team_topic_v2(uuid,text) from public, anon;
revoke all on function public.create_project_topic_v2(uuid,text) from public, anon;
revoke all on function public.link_direct_to_project_v2(uuid,uuid) from public, anon;
revoke all on function public.set_conversation_status_v2(uuid,text) from public, anon;
revoke all on function public.mark_conversation_read_v2(uuid,timestamptz) from public, anon;
revoke all on function public.set_conversation_notifications_v2(uuid,text) from public, anon;

grant execute on function public.get_or_create_direct_v2(uuid,uuid) to authenticated;
grant execute on function public.create_group_direct_v2(uuid,uuid[],text) to authenticated;
grant execute on function public.create_team_topic_v2(uuid,text) to authenticated;
grant execute on function public.create_project_topic_v2(uuid,text) to authenticated;
grant execute on function public.link_direct_to_project_v2(uuid,uuid) to authenticated;
grant execute on function public.set_conversation_status_v2(uuid,text) to authenticated;
grant execute on function public.mark_conversation_read_v2(uuid,timestamptz) to authenticated;
grant execute on function public.set_conversation_notifications_v2(uuid,text) to authenticated;

commit;
