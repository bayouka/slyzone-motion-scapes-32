-- Tighten Idea governance: editors may improve content, but only the author
-- or workspace managers may change access, take the final decision or convert.

create or replace function app_private.can_manage_idea(p_idea_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select exists (
    select 1 from public.ideas i
    where i.id=p_idea_id and (i.created_by=auth.uid() or app_private.can_manage_workspace(i.workspace_id))
  );
$$;

alter policy idea_members_write on public.idea_members using (app_private.can_manage_idea(idea_id)) with check (app_private.can_manage_idea(idea_id));
alter policy idea_decisions_write on public.idea_decisions using (app_private.can_manage_idea(idea_id)) with check (app_private.can_manage_idea(idea_id));

create or replace function public.set_idea_access_v1(p_idea_id uuid,p_visibility text,p_member_ids uuid[] default array[]::uuid[])
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid(); v_owner uuid; v_workspace uuid; v_conversation uuid; v_title text;
begin
  if not app_private.can_manage_idea(p_idea_id) then raise exception 'FORBIDDEN'; end if;
  if p_visibility not in ('private','shared','team') then raise exception 'INVALID_IDEA_VISIBILITY'; end if;
  select workspace_id,created_by,conversation_id,title into v_workspace,v_owner,v_conversation,v_title from public.ideas where id=p_idea_id for update;
  delete from public.idea_members where idea_id=p_idea_id and user_id<>v_owner;
  insert into public.idea_members(idea_id,user_id,role) values(p_idea_id,v_owner,'editor') on conflict(idea_id,user_id) do update set role='editor';
  if p_visibility='shared' then
    insert into public.idea_members(idea_id,user_id,role)
    select p_idea_id,wm.user_id,'reviewer' from public.workspace_members wm
    where wm.workspace_id=v_workspace and wm.status='active' and wm.role in ('owner','admin','member') and wm.user_id=any(coalesce(p_member_ids,array[]::uuid[])) and wm.user_id<>v_owner
    on conflict(idea_id,user_id) do nothing;
  elsif p_visibility='team' then
    insert into public.idea_members(idea_id,user_id,role)
    select p_idea_id,wm.user_id,'reviewer' from public.workspace_members wm
    where wm.workspace_id=v_workspace and wm.status='active' and wm.role in ('owner','admin','member') and wm.user_id<>v_owner
    on conflict(idea_id,user_id) do nothing;
  end if;
  if p_visibility<>'private' then
    if v_conversation is null then
      insert into public.conversations(workspace_id,kind,title,context_type,context_id,created_by)
      values(v_workspace,'context',v_title,'idea',p_idea_id,v_owner) returning id into v_conversation;
      update public.ideas set conversation_id=v_conversation where id=p_idea_id;
    else
      update public.conversations set status='active',title=v_title where id=v_conversation;
    end if;
    delete from public.conversation_members where conversation_id=v_conversation;
    insert into public.conversation_members(conversation_id,user_id,last_read_at)
    select v_conversation,im.user_id,now() from public.idea_members im where im.idea_id=p_idea_id on conflict do nothing;
  elsif v_conversation is not null then
    update public.conversations set status='archived' where id=v_conversation;
    delete from public.conversation_members where conversation_id=v_conversation and user_id<>v_owner;
  end if;
  update public.ideas set visibility=p_visibility,version=version+1,status=case when status in ('draft','exploring') and p_visibility<>'private' then 'ready_for_review' else status end,readiness=case when p_visibility='private' then readiness else 'share' end where id=p_idea_id;
  return jsonb_build_object('idea_id',p_idea_id,'visibility',p_visibility,'conversation_id',v_conversation,'members',(select count(*) from public.idea_members where idea_id=p_idea_id));
end $$;

create or replace function public.decide_idea_v1(p_idea_id uuid,p_outcome text,p_rationale text default '')
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_status text;
begin
  if not app_private.can_manage_idea(p_idea_id) then raise exception 'FORBIDDEN'; end if;
  if p_outcome not in ('approved','needs_work','parked','rejected') then raise exception 'INVALID_IDEA_DECISION'; end if;
  v_status:=p_outcome;
  insert into public.idea_decisions(idea_id,outcome,rationale,decided_by) values(p_idea_id,p_outcome,coalesce(p_rationale,''),auth.uid());
  update public.ideas set status=v_status,readiness=case when p_outcome='approved' then 'decision' else readiness end,version=version+1 where id=p_idea_id;
  return jsonb_build_object('idea_id',p_idea_id,'status',v_status);
end $$;

create or replace function public.convert_idea_to_project_v1(p_idea_id uuid,p_target_date date default null,p_phase_titles text[] default array[]::text[])
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_idea public.ideas; v_result jsonb; v_project uuid; v_title text; v_pos integer:=0; v_participants uuid[];
begin
  if not app_private.can_manage_idea(p_idea_id) then raise exception 'FORBIDDEN'; end if;
  select * into v_idea from public.ideas where id=p_idea_id for update;
  if v_idea.id is null then raise exception 'IDEA_NOT_FOUND'; end if;
  if v_idea.converted_project_id is not null then return jsonb_build_object('idea_id',p_idea_id,'project_id',v_idea.converted_project_id,'already_converted',true); end if;
  if v_idea.status<>'approved' then raise exception 'IDEA_NOT_APPROVED'; end if;
  select coalesce(array_agg(user_id) filter(where user_id<>v_idea.created_by),array[]::uuid[]) into v_participants from public.idea_members where idea_id=p_idea_id;
  v_result:=app_private.rpc_create_project_with_access_v1(v_idea.workspace_id,v_idea.title,coalesce(nullif(v_idea.proposal,''),nullif(v_idea.summary,''),v_idea.original_text),p_target_date,case when v_idea.visibility='team' then 'team' else 'restricted' end,v_participants);
  v_project:=(v_result->>'project_id')::uuid;
  foreach v_title in array coalesce(p_phase_titles,array[]::text[]) loop
    if nullif(btrim(v_title),'') is not null then
      v_pos:=v_pos+1; if v_pos>5 then exit; end if;
      insert into public.milestones(workspace_id,project_id,title,position,status) values(v_idea.workspace_id,v_project,btrim(v_title),v_pos,case when v_pos=1 then 'active' else 'todo' end);
    end if;
  end loop;
  update public.ideas set converted_project_id=v_project,status='converted',readiness='converted',version=version+1 where id=p_idea_id;
  insert into public.audit_events(workspace_id,actor_id,event_type,entity_type,entity_id,payload)
  values(v_idea.workspace_id,auth.uid(),'idea.converted','idea',p_idea_id,jsonb_build_object('project_id',v_project));
  return v_result || jsonb_build_object('idea_id',p_idea_id,'project_id',v_project,'already_converted',false,'phases',v_pos);
end $$;
