-- DRAFT VALIDATION PATCH — consolidate into 002_conversation_security_and_rpcs.sql after QA.
-- A Direct creator has seen the empty conversation; recipients have not read
-- anything yet. Their last_read_at therefore starts NULL so the first message
-- is reliably unread even if creation and send occur in one transaction.

begin;

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
    values
      (v_id,v_actor,now()),
      (v_id,p_other_user_id,null)
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
  select v_id, x, case when x=v_actor then now() else null end
  from unnest(v_members) as x;

  return v_id;
end;
$$;

revoke all on function public.get_or_create_direct_v2(uuid,uuid) from public,anon;
revoke all on function public.create_group_direct_v2(uuid,uuid[],text) from public,anon;
grant execute on function public.get_or_create_direct_v2(uuid,uuid) to authenticated;
grant execute on function public.create_group_direct_v2(uuid,uuid[],text) to authenticated;

commit;
