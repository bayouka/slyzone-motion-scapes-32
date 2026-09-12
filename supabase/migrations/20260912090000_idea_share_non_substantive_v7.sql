create or replace function public.set_idea_access_v1(p_idea_id uuid, p_visibility text, p_member_ids uuid[] default array[]::uuid[])
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare v_user uuid:=auth.uid(); v_owner uuid; v_workspace uuid; v_conversation uuid; v_title text;
begin
  if not app_private.can_manage_idea(p_idea_id) then raise exception 'FORBIDDEN'; end if;
  if p_visibility not in ('private','shared','team') then raise exception 'INVALID_IDEA_VISIBILITY'; end if;
  select workspace_id,created_by,conversation_id,title into v_workspace,v_owner,v_conversation,v_title from public.ideas where id=p_idea_id for update;
  if v_workspace is null then raise exception 'IDEA_NOT_FOUND'; end if;
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
  update public.ideas set visibility=p_visibility,
    status=case when status in ('draft','exploring') and p_visibility<>'private' then 'ready_for_review' else status end,
    readiness=case when p_visibility='private' then readiness else 'share' end,
    updated_at=now()
  where id=p_idea_id;
  return jsonb_build_object('idea_id',p_idea_id,'visibility',p_visibility,'conversation_id',v_conversation,'members',(select count(*) from public.idea_members where idea_id=p_idea_id),'substantive_change',false);
end $$;
