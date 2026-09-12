create or replace function public.accept_idea_ai_suggestion_v2(
  p_idea_id uuid,
  p_kind text,
  p_title text,
  p_body text,
  p_state text default 'kept'
) returns uuid
language plpgsql security definer set search_path=''
as $$
declare
  v_id uuid;
  v_state text;
begin
  if not app_private.can_write_idea(p_idea_id) then raise exception 'FORBIDDEN'; end if;
  if p_kind not in ('question','hypothesis','path','risk','evidence','note') then
    raise exception 'INVALID_IDEA_ITEM_KIND';
  end if;

  v_state := case p_state
    when 'kept' then 'keep'
    when 'rejected' then 'drop'
    when 'keep' then 'keep'
    when 'drop' then 'drop'
    when 'explore' then 'explore'
    when 'open' then 'open'
    when 'resolved' then 'resolved'
    else null
  end;
  if v_state is null then raise exception 'INVALID_IDEA_ITEM_STATE'; end if;

  insert into public.idea_items(idea_id,kind,title,body,state,created_by)
  values(p_idea_id,p_kind,btrim(p_title),coalesce(p_body,''),v_state,auth.uid())
  returning id into v_id;
  return v_id;
end $$;

revoke all on function public.accept_idea_ai_suggestion_v2(uuid,text,text,text,text) from public,anon;
grant execute on function public.accept_idea_ai_suggestion_v2(uuid,text,text,text,text) to authenticated;
