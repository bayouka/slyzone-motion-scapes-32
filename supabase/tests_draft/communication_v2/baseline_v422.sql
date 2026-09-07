-- Disposable PostgreSQL baseline reproducing the V4.2.2 communication-relevant schema.
-- Source: read-only introspection of Supabase project 4b4c (wexfzhegiewhldkugtow).
-- This file is for CI validation only. It is NOT a production migration.

create extension if not exists pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
END $$;

create schema if not exists auth;
create schema if not exists app_private;

create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid;
$$;

create table auth.users (
  id uuid primary key,
  aud text,
  role text,
  email text,
  encrypted_password text,
  email_confirmed_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$'),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','member','guest')),
  status text not null default 'active' check (status in ('active','invited','suspended')),
  joined_at timestamptz not null default now(),
  access_mode text not null default 'selected' check (access_mode in ('all','selected')),
  last_seen_at timestamptz,
  primary key(workspace_id,user_id)
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160),
  objective text not null default '',
  status text not null default 'active' check (status in ('active','on_hold','completed','archived')),
  health text not null default 'on_track' check (health in ('on_track','at_risk','off_track')),
  target_date date,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('lead','member','viewer','client')),
  joined_at timestamptz not null default now(),
  primary key(project_id,user_id)
);

create table public.milestones (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  position integer not null default 0,
  status text not null default 'todo' check (status in ('todo','active','done','cancelled')),
  due_date date,
  created_at timestamptz not null default now(),
  description text not null default '',
  start_date date,
  owner_id uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  visibility text not null default 'internal' check (visibility in ('internal','shared'))
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  kind text not null default 'project' check (kind in ('direct','project','context')),
  title text not null,
  context_type text,
  context_id uuid,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  last_read_at timestamptz,
  muted boolean not null default false,
  primary key(conversation_id,user_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  body text not null check (char_length(body) between 1 and 20000),
  reply_to_id uuid references public.messages(id) on delete set null,
  edited_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.requests (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  title text not null,
  body text not null default '',
  requester_id uuid not null references public.profiles(id),
  recipient_id uuid not null references public.profiles(id),
  status text not null default 'open' check (status in ('open','answered','satisfied','cancelled')),
  due_at timestamptz,
  source_type text,
  source_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  response text not null default '',
  answered_at timestamptz
);

create table public.actions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  milestone_id uuid references public.milestones(id) on delete set null,
  title text not null,
  description text not null default '',
  status text not null default 'todo' check (status in ('todo','in_progress','blocked','done','cancelled')),
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  due_at timestamptz,
  blocked_reason text,
  created_by uuid not null references public.profiles(id),
  source_type text,
  source_id uuid,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  visibility text not null default 'internal' check (visibility in ('internal','shared'))
);

create table public.decisions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  title text not null,
  rationale text not null default '',
  status text not null default 'decided' check (status in ('proposed','decided','superseded','cancelled')),
  decided_by uuid references public.profiles(id),
  decided_at timestamptz,
  source_type text,
  source_id uuid,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  visibility text not null default 'internal' check (visibility in ('internal','shared'))
);

create table public.deliverables (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text not null default '',
  visibility text not null default 'internal' check (visibility in ('internal','shared')),
  status text not null default 'draft' check (status in ('draft','review','approved','archived')),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.deliverable_versions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  deliverable_id uuid not null references public.deliverables(id) on delete cascade,
  version_number integer not null check (version_number>0),
  storage_path text not null,
  file_name text not null,
  mime_type text,
  size_bytes bigint check (size_bytes is null or size_bytes>=0),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  unique(deliverable_id,version_number)
);

create table public.meetings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  title text not null,
  status text not null default 'planned' check (status in ('planned','live','completed','cancelled')),
  starts_at timestamptz,
  ends_at timestamptz,
  video_room text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  visibility text not null default 'internal' check (visibility in ('internal','shared')),
  agenda text not null default '',
  live_notes text not null default '',
  summary text not null default '',
  check (ends_at is null or starts_at is null or ends_at>=starts_at)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null,
  title text not null,
  route text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.audit_events (
  id bigint generated always as identity primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  entity_type text,
  entity_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- V4.2.2 helper functions used by the draft migrations and fixture.
create or replace function app_private.workspace_role(p_workspace_id uuid)
returns text language sql stable security definer set search_path=''
as $$
  select wm.role from public.workspace_members wm
  where wm.workspace_id=p_workspace_id and wm.user_id=auth.uid() and wm.status='active' limit 1;
$$;

create or replace function app_private.is_workspace_member(p_workspace_id uuid)
returns boolean language sql stable security definer set search_path=''
as $$
  select auth.uid() is not null and exists(
    select 1 from public.workspace_members wm
    where wm.workspace_id=p_workspace_id and wm.user_id=auth.uid() and wm.status='active'
  );
$$;

create or replace function app_private.can_manage_workspace(p_workspace_id uuid)
returns boolean language sql stable security definer set search_path=''
as $$ select coalesce(app_private.workspace_role(p_workspace_id) in ('owner','admin'),false); $$;

create or replace function app_private.can_write_workspace(p_workspace_id uuid)
returns boolean language sql stable security definer set search_path=''
as $$ select coalesce(app_private.workspace_role(p_workspace_id) in ('owner','admin','member'),false); $$;

create or replace function app_private.is_external_workspace_member(p_workspace_id uuid)
returns boolean language sql stable security definer set search_path=''
as $$ select coalesce(app_private.workspace_role(p_workspace_id)='guest',false); $$;

create or replace function app_private.can_access_project(p_project_id uuid)
returns boolean language sql stable security definer set search_path=''
as $$
  select auth.uid() is not null and exists(
    select 1
    from public.projects p
    join public.workspace_members wm on wm.workspace_id=p.workspace_id
    where p.id=p_project_id
      and wm.user_id=auth.uid() and wm.status='active'
      and (
        wm.role in ('owner','admin')
        or (wm.role='member' and wm.access_mode='all')
        or exists(select 1 from public.project_members pm where pm.project_id=p.id and pm.user_id=auth.uid())
      )
  );
$$;

create or replace function app_private.can_write_project(p_project_id uuid)
returns boolean language sql stable security definer set search_path=''
as $$
  select auth.uid() is not null and exists(
    select 1
    from public.projects p
    join public.workspace_members wm on wm.workspace_id=p.workspace_id
    where p.id=p_project_id and wm.user_id=auth.uid() and wm.status='active'
      and (
        wm.role in ('owner','admin')
        or (wm.role='member' and exists(
          select 1 from public.project_members pm
          where pm.project_id=p.id and pm.user_id=auth.uid() and pm.role in ('lead','member')
        ))
      )
  );
$$;

create or replace function app_private.can_access_conversation(p_conversation_id uuid)
returns boolean language sql stable security definer set search_path=''
as $$
  select auth.uid() is not null and exists(
    select 1 from public.conversation_members cm
    where cm.conversation_id=p_conversation_id and cm.user_id=auth.uid()
  );
$$;

create or replace function app_private.can_manage_conversation(p_conversation_id uuid)
returns boolean language sql stable security definer set search_path=''
as $$
  select auth.uid() is not null and exists(
    select 1 from public.conversations c
    where c.id=p_conversation_id and (c.created_by=auth.uid() or app_private.can_manage_workspace(c.workspace_id))
  );
$$;

create or replace function app_private.set_updated_at()
returns trigger language plpgsql set search_path=''
as $$ begin new.updated_at:=now(); return new; end; $$;

create or replace function app_private.notify_message_members()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
  insert into public.notifications(workspace_id,user_id,kind,title,route)
  select new.workspace_id,cm.user_id,'message','Nouveau message','/messages/'||new.conversation_id
  from public.conversation_members cm
  where cm.conversation_id=new.conversation_id and cm.user_id<>new.author_id and cm.muted=false;
  return new;
end; $$;

create or replace function app_private.notify_request_recipient()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
  if new.recipient_id<>new.requester_id then
    insert into public.notifications(workspace_id,user_id,kind,title,route)
    values(new.workspace_id,new.recipient_id,'request','Nouvelle demande : '||new.title,'/requests/'||new.id);
  end if;
  return new;
end; $$;

create or replace function app_private.notify_request_update()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
  if old.status is distinct from new.status and new.status='answered' and new.requester_id<>auth.uid() then
    insert into public.notifications(workspace_id,user_id,kind,title,route)
    values(new.workspace_id,new.requester_id,'request','Réponse reçue : '||new.title,case when new.project_id is null then '/work' else '/projects/'||new.project_id||'/overview' end);
  elsif old.status is distinct from new.status and new.status='satisfied' and new.recipient_id<>auth.uid() then
    insert into public.notifications(workspace_id,user_id,kind,title,route)
    values(new.workspace_id,new.recipient_id,'request','Demande clôturée : '||new.title,case when new.project_id is null then '/work' else '/projects/'||new.project_id||'/overview' end);
  end if;
  return new;
end; $$;

create or replace function app_private.rpc_create_project_with_setup(
  p_workspace_id uuid,
  p_name text,
  p_objective text,
  p_target_date date,
  p_participant_ids uuid[] default array[]::uuid[],
  p_phase_titles text[] default array[]::text[]
)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare
  v_user uuid:=auth.uid();
  v_project uuid;
  v_conversation uuid;
  v_participant uuid;
  v_title text;
  v_position int:=0;
begin
  if v_user is null or not app_private.can_write_workspace(p_workspace_id) then raise exception 'FORBIDDEN'; end if;

  insert into public.projects(workspace_id,name,objective,target_date,created_by)
  values(p_workspace_id,trim(p_name),coalesce(p_objective,''),p_target_date,v_user)
  returning id into v_project;

  insert into public.project_members(project_id,user_id,role)
  values(v_project,v_user,'lead') on conflict do nothing;

  insert into public.conversations(workspace_id,project_id,kind,title,created_by)
  values(p_workspace_id,v_project,'project','Général',v_user)
  returning id into v_conversation;

  insert into public.conversation_members(conversation_id,user_id,last_read_at)
  values(v_conversation,v_user,now()) on conflict do nothing;

  foreach v_participant in array coalesce(p_participant_ids,array[]::uuid[]) loop
    if v_participant<>v_user and exists(
      select 1 from public.workspace_members wm
      where wm.workspace_id=p_workspace_id and wm.user_id=v_participant and wm.status='active' and wm.role<>'guest'
    ) then
      insert into public.project_members(project_id,user_id,role)
      values(v_project,v_participant,'member') on conflict(project_id,user_id) do update set role='member';
      insert into public.conversation_members(conversation_id,user_id,last_read_at)
      values(v_conversation,v_participant,now()) on conflict do nothing;
      insert into public.notifications(workspace_id,user_id,kind,title,route)
      values(p_workspace_id,v_participant,'assignment','Vous avez été ajouté au projet '||trim(p_name),'/projects/'||v_project||'/overview');
    end if;
  end loop;

  foreach v_title in array coalesce(p_phase_titles,array[]::text[]) loop
    if nullif(trim(v_title),'') is not null then
      v_position:=v_position+1;
      insert into public.milestones(workspace_id,project_id,title,position,status)
      values(p_workspace_id,v_project,trim(v_title),v_position,case when v_position=1 then 'active' else 'todo' end);
    end if;
  end loop;

  insert into public.audit_events(workspace_id,actor_id,event_type,entity_type,entity_id,payload)
  values(p_workspace_id,v_user,'project.created','project',v_project,jsonb_build_object('name',trim(p_name),'participants',coalesce(array_length(p_participant_ids,1),0),'phases',v_position));

  return jsonb_build_object('project_id',v_project,'conversation_id',v_conversation);
end; $$;

create or replace function public.create_project_with_setup(
  p_workspace_id uuid,
  p_name text,
  p_objective text default '',
  p_target_date date default null,
  p_participant_ids uuid[] default array[]::uuid[],
  p_phase_titles text[] default array[]::text[]
)
returns jsonb language sql set search_path=''
as $$
  select app_private.rpc_create_project_with_setup(p_workspace_id,p_name,p_objective,p_target_date,p_participant_ids,p_phase_titles);
$$;

-- V4.2.2 RLS policies relevant to Communication v2.
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.requests enable row level security;
alter table public.actions enable row level security;
alter table public.decisions enable row level security;
alter table public.deliverables enable row level security;
alter table public.deliverable_versions enable row level security;
alter table public.meetings enable row level security;
alter table public.milestones enable row level security;
alter table public.notifications enable row level security;

create policy conversations_select on public.conversations for select using (app_private.can_access_conversation(id));
create policy conversations_insert on public.conversations for insert with check (created_by=auth.uid() and app_private.is_workspace_member(workspace_id) and (project_id is null or app_private.can_access_project(project_id)));
create policy conversations_update on public.conversations for update using (created_by=auth.uid() or app_private.can_manage_workspace(workspace_id)) with check (app_private.is_workspace_member(workspace_id));

create policy conversation_members_select on public.conversation_members for select using (app_private.can_access_conversation(conversation_id));
create policy conversation_members_insert on public.conversation_members for insert with check (app_private.can_manage_conversation(conversation_id));
create policy conversation_members_update on public.conversation_members for update using (app_private.can_manage_conversation(conversation_id)) with check (app_private.can_manage_conversation(conversation_id));
create policy conversation_members_delete on public.conversation_members for delete using (app_private.can_manage_conversation(conversation_id));

create policy messages_select on public.messages for select using (app_private.can_access_conversation(conversation_id));
create policy messages_insert on public.messages for insert with check (author_id=auth.uid() and app_private.can_access_conversation(conversation_id) and app_private.is_workspace_member(workspace_id));
create policy messages_update on public.messages for update using (author_id=auth.uid()) with check (author_id=auth.uid());

create policy requests_select on public.requests for select using (
  requester_id=auth.uid() or recipient_id=auth.uid()
  or (project_id is not null and app_private.can_access_project(project_id) and not app_private.is_external_workspace_member(workspace_id))
);
create policy requests_insert on public.requests for insert with check (requester_id=auth.uid() and app_private.is_workspace_member(workspace_id) and (project_id is null or app_private.can_access_project(project_id)));
create policy requests_update on public.requests for update using (requester_id=auth.uid() or recipient_id=auth.uid() or app_private.can_manage_workspace(workspace_id)) with check (app_private.is_workspace_member(workspace_id));

create policy actions_select on public.actions for select using (app_private.can_access_project(project_id) and (not app_private.is_external_workspace_member(workspace_id) or visibility='shared'));
create policy actions_insert on public.actions for insert with check (app_private.can_write_project(project_id));
create policy actions_update on public.actions for update using (app_private.can_write_project(project_id)) with check (app_private.can_write_project(project_id));
create policy actions_delete on public.actions for delete using (app_private.can_write_project(project_id));

create policy decisions_select on public.decisions for select using ((((project_id is null) and app_private.is_workspace_member(workspace_id)) or ((project_id is not null) and app_private.can_access_project(project_id))) and (not app_private.is_external_workspace_member(workspace_id) or visibility='shared'));
create policy decisions_insert on public.decisions for insert with check (((project_id is null) and app_private.can_write_workspace(workspace_id)) or ((project_id is not null) and app_private.can_write_project(project_id)));
create policy decisions_update on public.decisions for update using (((project_id is null) and app_private.can_write_workspace(workspace_id)) or ((project_id is not null) and app_private.can_write_project(project_id))) with check (((project_id is null) and app_private.can_write_workspace(workspace_id)) or ((project_id is not null) and app_private.can_write_project(project_id)));
create policy decisions_delete on public.decisions for delete using (((project_id is null) and app_private.can_write_workspace(workspace_id)) or ((project_id is not null) and app_private.can_write_project(project_id)));

create policy milestones_select on public.milestones for select using (app_private.can_access_project(project_id) and (not app_private.is_external_workspace_member(workspace_id) or visibility='shared'));
create policy milestones_insert on public.milestones for insert with check (app_private.can_write_project(project_id));
create policy milestones_update on public.milestones for update using (app_private.can_write_project(project_id)) with check (app_private.can_write_project(project_id));
create policy milestones_delete on public.milestones for delete using (app_private.can_write_project(project_id));

create policy deliverables_select on public.deliverables for select using (app_private.can_write_workspace(workspace_id) or (visibility='shared' and app_private.can_access_project(project_id)));
create policy deliverables_insert on public.deliverables for insert with check (app_private.can_write_project(project_id));
create policy deliverables_update on public.deliverables for update using (app_private.can_write_project(project_id)) with check (app_private.can_write_project(project_id));
create policy deliverables_delete on public.deliverables for delete using (app_private.can_write_project(project_id));

create policy deliverable_versions_select on public.deliverable_versions for select using (exists(select 1 from public.deliverables d where d.id=deliverable_id and (app_private.can_write_workspace(d.workspace_id) or (d.visibility='shared' and app_private.can_access_project(d.project_id)))));
create policy deliverable_versions_insert on public.deliverable_versions for insert with check (exists(select 1 from public.deliverables d where d.id=deliverable_id and app_private.can_write_project(d.project_id)));
create policy deliverable_versions_update on public.deliverable_versions for update using (exists(select 1 from public.deliverables d where d.id=deliverable_id and app_private.can_write_project(d.project_id))) with check (exists(select 1 from public.deliverables d where d.id=deliverable_id and app_private.can_write_project(d.project_id)));
create policy deliverable_versions_delete on public.deliverable_versions for delete using (exists(select 1 from public.deliverables d where d.id=deliverable_id and app_private.can_write_project(d.project_id)));

create policy meetings_select on public.meetings for select using ((((project_id is null) and app_private.is_workspace_member(workspace_id)) or ((project_id is not null) and app_private.can_access_project(project_id))) and (not app_private.is_external_workspace_member(workspace_id) or visibility='shared'));
create policy meetings_insert on public.meetings for insert with check (((project_id is null) and app_private.can_write_workspace(workspace_id)) or ((project_id is not null) and app_private.can_write_project(project_id)));
create policy meetings_update on public.meetings for update using (((project_id is null) and app_private.can_write_workspace(workspace_id)) or ((project_id is not null) and app_private.can_write_project(project_id))) with check (((project_id is null) and app_private.can_write_workspace(workspace_id)) or ((project_id is not null) and app_private.can_write_project(project_id)));
create policy meetings_delete on public.meetings for delete using (((project_id is null) and app_private.can_write_workspace(workspace_id)) or ((project_id is not null) and app_private.can_write_project(project_id)));

create policy notifications_self on public.notifications for select using (user_id=auth.uid());
create policy notifications_update_self on public.notifications for update using (user_id=auth.uid()) with check (user_id=auth.uid());

-- Relevant V4.2.2 triggers.
create trigger trg_notify_message after insert on public.messages for each row execute function app_private.notify_message_members();
create trigger trg_notify_request after insert on public.requests for each row execute function app_private.notify_request_recipient();
create trigger trg_notify_request_update after update on public.requests for each row execute function app_private.notify_request_update();
create trigger trg_updated_at_requests before update on public.requests for each row execute function app_private.set_updated_at();

-- Supabase-like grants for the test role. Draft migrations further narrow them.
grant usage on schema public,auth to authenticated;
grant select,insert,update,delete on all tables in schema public to authenticated;
grant usage,select on all sequences in schema public to authenticated;
grant execute on all functions in schema public to authenticated;
grant execute on function auth.uid() to authenticated,anon;
