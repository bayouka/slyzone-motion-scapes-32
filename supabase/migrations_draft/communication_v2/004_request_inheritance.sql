-- DRAFT ONLY — DO NOT APPLY TO THE LIVE V4.2.2 DATABASE.
-- Communication v2 / Migration 004: "Réponse attendue", source inheritance,
-- and guarded conversion from private communication to broader project memory.

begin;

alter table public.requests
  add column if not exists response_mode text not null default 'free',
  add column if not exists response_value text;

alter table public.requests drop constraint if exists requests_response_mode_v2;
alter table public.requests
  add constraint requests_response_mode_v2
  check (response_mode in ('free','approval'));

alter table public.requests drop constraint if exists requests_response_value_v2;
alter table public.requests
  add constraint requests_response_value_v2
  check (
    (response_mode='free' and response_value is null)
    or (response_mode='approval' and (response_value is null or response_value in ('approved','rejected')))
  );

create or replace function app_private.user_can_access_message_v2(
  p_message_id uuid,
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
    from public.messages m
    where m.id=p_message_id
      and app_private.user_can_access_conversation_v2(m.conversation_id,p_user_id)
  );
$$;

-- Message-source Requests inherit the source audience for everyone, including
-- requester and recipient. Losing source access means losing the derived private
-- Request too; the Request is not an alternate path back into a Direct.
create or replace function app_private.user_can_access_request_v2(
  p_request_id uuid,
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
    from public.requests r
    join public.workspace_members wm
      on wm.workspace_id=r.workspace_id and wm.user_id=p_user_id and wm.status='active'
    where r.id=p_request_id
      and (
        (
          r.source_type='message'
          and r.source_id is not null
          and app_private.user_can_access_message_v2(r.source_id,p_user_id)
        )
        or (
          coalesce(r.source_type,'')<>'message'
          and (
            r.requester_id=p_user_id
            or r.recipient_id=p_user_id
            or (
              r.project_id is not null
              and wm.role<>'guest'
              and app_private.user_can_access_project_v2(r.project_id,p_user_id)
            )
          )
        )
      )
  );
$$;

-- True when the intended Action/Decision audience contains at least one active
-- user who cannot read the source message. This is the server-side guard behind
-- the UI warning "this will be visible to more people".
create or replace function app_private.message_destination_expands_audience_v2(
  p_message_id uuid,
  p_project_id uuid,
  p_visibility text
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_workspace uuid;
  v_project_workspace uuid;
begin
  if p_visibility not in ('internal','shared') then raise exception 'VISIBILITY_INVALID'; end if;
  select m.workspace_id into v_workspace from public.messages m where m.id=p_message_id;
  if v_workspace is null then raise exception 'MESSAGE_NOT_FOUND'; end if;

  if p_project_id is not null then
    select workspace_id into v_project_workspace from public.projects where id=p_project_id;
    if v_project_workspace is distinct from v_workspace then raise exception 'PROJECT_WORKSPACE_MISMATCH'; end if;

    return exists (
      select 1
      from public.workspace_members wm
      where wm.workspace_id=v_workspace and wm.status='active'
        and app_private.user_can_access_project_v2(p_project_id,wm.user_id)
        and (p_visibility='shared' or wm.role<>'guest')
        and not app_private.user_can_access_message_v2(p_message_id,wm.user_id)
    );
  end if;

  return exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id=v_workspace and wm.status='active'
      and (p_visibility='shared' or wm.role<>'guest')
      and not app_private.user_can_access_message_v2(p_message_id,wm.user_id)
  );
end;
$$;

revoke all on function app_private.user_can_access_message_v2(uuid,uuid) from public, anon, authenticated;
revoke all on function app_private.user_can_access_request_v2(uuid,uuid) from public, anon, authenticated;
revoke all on function app_private.message_destination_expands_audience_v2(uuid,uuid,text) from public, anon, authenticated;

create or replace function app_private.validate_request_v2()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_message public.messages%rowtype;
  v_conversation public.conversations%rowtype;
begin
  if new.source_type='message' then
    if new.source_id is null then raise exception 'REQUEST_MESSAGE_SOURCE_REQUIRED'; end if;
    select * into v_message from public.messages where id=new.source_id;
    if not found then raise exception 'REQUEST_SOURCE_MESSAGE_NOT_FOUND'; end if;
    select * into v_conversation from public.conversations where id=v_message.conversation_id;
    if v_conversation.workspace_id is distinct from new.workspace_id then raise exception 'REQUEST_WORKSPACE_MISMATCH'; end if;
    if not app_private.user_can_access_conversation_v2(v_message.conversation_id,new.recipient_id) then
      raise exception 'REQUEST_RECIPIENT_CANNOT_READ_SOURCE';
    end if;
  end if;

  if new.response_mode='approval' and new.status='answered' and new.response_value is null then
    raise exception 'REQUEST_APPROVAL_VALUE_REQUIRED';
  end if;

  if tg_op='UPDATE' then
    if new.workspace_id is distinct from old.workspace_id
       or new.requester_id is distinct from old.requester_id
       or new.recipient_id is distinct from old.recipient_id
       or new.project_id is distinct from old.project_id
       or new.source_type is distinct from old.source_type
       or new.source_id is distinct from old.source_id
       or new.response_mode is distinct from old.response_mode
       or new.created_at is distinct from old.created_at then
      raise exception 'REQUEST_SOURCE_FIELDS_IMMUTABLE';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function app_private.validate_request_v2() from public, anon, authenticated;

drop trigger if exists trg_validate_request_v2 on public.requests;
create trigger trg_validate_request_v2
before insert or update on public.requests
for each row execute function app_private.validate_request_v2();

drop policy if exists requests_select on public.requests;
create policy requests_select_v2 on public.requests
for select using (app_private.user_can_access_request_v2(id,auth.uid()));

drop policy if exists requests_insert on public.requests;
create policy requests_insert_v2 on public.requests
for insert with check (
  requester_id=auth.uid()
  and app_private.user_is_active_workspace_member_v2(workspace_id,auth.uid())
  and app_private.user_is_active_workspace_member_v2(workspace_id,recipient_id)
  and (
    source_type is distinct from 'message'
    or (
      source_id is not null
      and app_private.user_can_access_message_v2(source_id,auth.uid())
      and app_private.user_can_access_message_v2(source_id,recipient_id)
    )
  )
  and (project_id is null or app_private.user_can_access_project_v2(project_id,auth.uid()))
);

drop policy if exists requests_update on public.requests;
create policy requests_update_v2 on public.requests
for update
using (
  app_private.user_can_access_request_v2(id,auth.uid())
  and (
    requester_id=auth.uid()
    or recipient_id=auth.uid()
    or (source_type is distinct from 'message' and app_private.can_manage_workspace(workspace_id))
  )
)
with check (
  app_private.user_can_access_request_v2(id,auth.uid())
  and (
    requester_id=auth.uid()
    or recipient_id=auth.uid()
    or (source_type is distinct from 'message' and app_private.can_manage_workspace(workspace_id))
  )
);

create or replace function public.create_request_from_message_v2(
  p_message_id uuid,
  p_recipient_id uuid,
  p_title text,
  p_body text default '',
  p_due_at timestamptz default null,
  p_response_mode text default 'free'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid:=auth.uid();
  v_message public.messages%rowtype;
  v_conversation public.conversations%rowtype;
  v_id uuid;
  v_project uuid;
begin
  if v_actor is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_response_mode not in ('free','approval') then raise exception 'REQUEST_RESPONSE_MODE_INVALID'; end if;
  if nullif(btrim(p_title),'') is null then raise exception 'REQUEST_TITLE_REQUIRED'; end if;

  select * into v_message from public.messages where id=p_message_id;
  if not found or not app_private.can_access_conversation(v_message.conversation_id) then
    raise exception 'MESSAGE_SOURCE_ACCESS_DENIED';
  end if;
  select * into v_conversation from public.conversations where id=v_message.conversation_id;

  if not app_private.user_can_access_conversation_v2(v_message.conversation_id,p_recipient_id) then
    raise exception 'REQUEST_RECIPIENT_CANNOT_READ_SOURCE';
  end if;

  v_project := coalesce(v_conversation.project_id,v_conversation.linked_project_id);

  insert into public.requests(
    workspace_id,project_id,title,body,requester_id,recipient_id,status,due_at,
    source_type,source_id,response_mode,response
  ) values (
    v_conversation.workspace_id,v_project,btrim(p_title),coalesce(p_body,''),v_actor,p_recipient_id,'open',p_due_at,
    'message',p_message_id,p_response_mode,''
  ) returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.answer_request_v2(
  p_request_id uuid,
  p_response text default '',
  p_response_value text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request public.requests%rowtype;
begin
  select * into v_request from public.requests where id=p_request_id for update;
  if not found or v_request.recipient_id<>auth.uid()
     or not app_private.user_can_access_request_v2(p_request_id,auth.uid()) then raise exception 'REQUEST_ANSWER_DENIED'; end if;
  if v_request.status not in ('open','answered') then raise exception 'REQUEST_NOT_ANSWERABLE'; end if;

  if v_request.response_mode='free' then
    if nullif(btrim(coalesce(p_response,'')),'') is null then raise exception 'REQUEST_RESPONSE_REQUIRED'; end if;
    p_response_value:=null;
  else
    if p_response_value not in ('approved','rejected') then raise exception 'REQUEST_APPROVAL_VALUE_REQUIRED'; end if;
  end if;

  update public.requests
  set response=coalesce(p_response,''), response_value=p_response_value, status='answered', answered_at=now()
  where id=p_request_id;
end;
$$;

create or replace function public.close_request_v2(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request public.requests%rowtype;
begin
  select * into v_request from public.requests where id=p_request_id for update;
  if not found or v_request.requester_id<>auth.uid()
     or not app_private.user_can_access_request_v2(p_request_id,auth.uid()) then raise exception 'REQUEST_CLOSE_DENIED'; end if;
  if v_request.status<>'answered' then raise exception 'REQUEST_NOT_ANSWERED'; end if;
  update public.requests set status='satisfied' where id=p_request_id;
end;
$$;

create or replace function public.create_action_from_message_v2(
  p_message_id uuid,
  p_project_id uuid,
  p_title text,
  p_description text default '',
  p_priority text default 'normal',
  p_due_at timestamptz default null,
  p_visibility text default 'internal',
  p_confirm_audience_expansion boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid:=auth.uid();
  v_message public.messages%rowtype;
  v_project public.projects%rowtype;
  v_id uuid;
begin
  if v_actor is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into v_message from public.messages where id=p_message_id;
  if not found or not app_private.can_access_conversation(v_message.conversation_id) then raise exception 'MESSAGE_SOURCE_ACCESS_DENIED'; end if;
  if not app_private.can_write_project(p_project_id) then raise exception 'PROJECT_WRITE_DENIED'; end if;
  select * into v_project from public.projects where id=p_project_id;
  if v_project.workspace_id is distinct from v_message.workspace_id then raise exception 'PROJECT_WORKSPACE_MISMATCH'; end if;

  if app_private.message_destination_expands_audience_v2(p_message_id,p_project_id,p_visibility)
     and not coalesce(p_confirm_audience_expansion,false) then
    raise exception 'AUDIENCE_EXPANSION_CONFIRMATION_REQUIRED';
  end if;

  insert into public.actions(
    workspace_id,project_id,title,description,priority,due_at,created_by,source_type,source_id,visibility
  ) values (
    v_message.workspace_id,p_project_id,btrim(p_title),coalesce(p_description,''),p_priority,p_due_at,v_actor,'message',p_message_id,p_visibility
  ) returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.create_decision_from_message_v2(
  p_message_id uuid,
  p_project_id uuid default null,
  p_title text default null,
  p_rationale text default '',
  p_visibility text default 'internal',
  p_confirm_audience_expansion boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid:=auth.uid();
  v_message public.messages%rowtype;
  v_project_workspace uuid;
  v_id uuid;
begin
  if v_actor is null then raise exception 'AUTH_REQUIRED'; end if;
  if nullif(btrim(coalesce(p_title,'')),'') is null then raise exception 'DECISION_TITLE_REQUIRED'; end if;
  select * into v_message from public.messages where id=p_message_id;
  if not found or not app_private.can_access_conversation(v_message.conversation_id) then raise exception 'MESSAGE_SOURCE_ACCESS_DENIED'; end if;

  if p_project_id is null then
    if not app_private.can_write_workspace(v_message.workspace_id) then raise exception 'WORKSPACE_WRITE_DENIED'; end if;
  else
    if not app_private.can_write_project(p_project_id) then raise exception 'PROJECT_WRITE_DENIED'; end if;
    select workspace_id into v_project_workspace from public.projects where id=p_project_id;
    if v_project_workspace is distinct from v_message.workspace_id then raise exception 'PROJECT_WORKSPACE_MISMATCH'; end if;
  end if;

  if app_private.message_destination_expands_audience_v2(p_message_id,p_project_id,p_visibility)
     and not coalesce(p_confirm_audience_expansion,false) then
    raise exception 'AUDIENCE_EXPANSION_CONFIRMATION_REQUIRED';
  end if;

  insert into public.decisions(
    workspace_id,project_id,title,rationale,decided_by,decided_at,source_type,source_id,created_by,visibility
  ) values (
    v_message.workspace_id,p_project_id,btrim(p_title),coalesce(p_rationale,''),v_actor,now(),'message',p_message_id,v_actor,p_visibility
  ) returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.create_request_from_message_v2(uuid,uuid,text,text,timestamptz,text) from public, anon;
revoke all on function public.answer_request_v2(uuid,text,text) from public, anon;
revoke all on function public.close_request_v2(uuid) from public, anon;
revoke all on function public.create_action_from_message_v2(uuid,uuid,text,text,text,timestamptz,text,boolean) from public, anon;
revoke all on function public.create_decision_from_message_v2(uuid,uuid,text,text,text,boolean) from public, anon;
grant execute on function public.create_request_from_message_v2(uuid,uuid,text,text,timestamptz,text) to authenticated;
grant execute on function public.answer_request_v2(uuid,text,text) to authenticated;
grant execute on function public.close_request_v2(uuid) to authenticated;
grant execute on function public.create_action_from_message_v2(uuid,uuid,text,text,text,timestamptz,text,boolean) to authenticated;
grant execute on function public.create_decision_from_message_v2(uuid,uuid,text,text,text,boolean) to authenticated;

-- QA-validated auth-scoped Request RLS wrappers
create or replace function app_private.can_access_message_v2(p_message_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select app_private.user_can_access_message_v2(p_message_id,auth.uid());
$$;

create or replace function app_private.can_access_request_v2(p_request_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select app_private.user_can_access_request_v2(p_request_id,auth.uid());
$$;

create or replace function app_private.can_create_request_v2(
  p_workspace_id uuid,
  p_project_id uuid,
  p_source_type text,
  p_source_id uuid,
  p_recipient_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null
    and app_private.user_is_active_workspace_member_v2(p_workspace_id,auth.uid())
    and app_private.user_is_active_workspace_member_v2(p_workspace_id,p_recipient_id)
    and (
      p_source_type is distinct from 'message'
      or (
        p_source_id is not null
        and app_private.user_can_access_message_v2(p_source_id,auth.uid())
        and app_private.user_can_access_message_v2(p_source_id,p_recipient_id)
      )
    )
    and (p_project_id is null or app_private.user_can_access_project_v2(p_project_id,auth.uid()));
$$;

revoke all on function app_private.can_access_message_v2(uuid) from public,anon,authenticated;
revoke all on function app_private.can_access_request_v2(uuid) from public,anon,authenticated;
revoke all on function app_private.can_create_request_v2(uuid,uuid,text,uuid,uuid) from public,anon,authenticated;
grant execute on function app_private.can_access_message_v2(uuid) to authenticated;
grant execute on function app_private.can_access_request_v2(uuid) to authenticated;
grant execute on function app_private.can_create_request_v2(uuid,uuid,text,uuid,uuid) to authenticated;

drop policy if exists requests_select_v2 on public.requests;
create policy requests_select_v2 on public.requests
for select using (app_private.can_access_request_v2(id));

drop policy if exists requests_insert_v2 on public.requests;
create policy requests_insert_v2 on public.requests
for insert with check (
  requester_id=auth.uid()
  and app_private.can_create_request_v2(workspace_id,project_id,source_type,source_id,recipient_id)
);

drop policy if exists requests_update_v2 on public.requests;
create policy requests_update_v2 on public.requests
for update
using (
  app_private.can_access_request_v2(id)
  and (
    requester_id=auth.uid()
    or recipient_id=auth.uid()
    or (source_type is distinct from 'message' and app_private.can_manage_workspace(workspace_id))
  )
)
with check (
  app_private.can_access_request_v2(id)
  and (
    requester_id=auth.uid()
    or recipient_id=auth.uid()
    or (source_type is distinct from 'message' and app_private.can_manage_workspace(workspace_id))
  )
);

commit;
