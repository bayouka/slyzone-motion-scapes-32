create or replace function public.answer_new_idea_question_v3(p_idea_id uuid,p_question text,p_why text,p_answer text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid(); v_item uuid; v_answer uuid;
begin
  if v_user is null or not app_private.can_write_idea(p_idea_id) then raise exception 'FORBIDDEN'; end if;
  if nullif(btrim(p_question),'') is null or nullif(btrim(p_answer),'') is null then raise exception 'QUESTION_AND_ANSWER_REQUIRED'; end if;
  insert into public.idea_items(idea_id,kind,title,body,state,created_by)
  values(p_idea_id,'question',btrim(p_question),coalesce(p_why,''),'resolved',v_user)
  returning id into v_item;
  insert into public.idea_question_answers(idea_id,question_item_id,answered_by,answer)
  values(p_idea_id,v_item,v_user,btrim(p_answer)) returning id into v_answer;
  update public.ideas set version=version+1,updated_at=now() where id=p_idea_id;
  return jsonb_build_object('question_item_id',v_item,'answer_id',v_answer,'state','resolved');
end $$;
revoke all on function public.answer_new_idea_question_v3(uuid,text,text,text) from public,anon;
grant execute on function public.answer_new_idea_question_v3(uuid,text,text,text) to authenticated;
