create or replace function public.get_idea_decision_brief_v5(p_idea_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_idea public.ideas;
  v_total int:=0; v_approve int:=0; v_deepen int:=0; v_park int:=0; v_reject int:=0;
  v_open_questions int:=0; v_open_risks int:=0; v_evidence int:=0;
  v_can_manage boolean:=false;
begin
  if not app_private.can_access_idea(p_idea_id) then raise exception 'FORBIDDEN'; end if;
  select * into v_idea from public.ideas where id=p_idea_id;
  if v_idea.id is null then raise exception 'IDEA_NOT_FOUND'; end if;
  v_can_manage:=app_private.can_manage_idea(p_idea_id);
  select count(*),count(*) filter(where stance='approve'),count(*) filter(where stance='deepen'),count(*) filter(where stance='park'),count(*) filter(where stance='reject')
    into v_total,v_approve,v_deepen,v_park,v_reject from public.idea_team_feedback where idea_id=p_idea_id;
  select count(*) filter(where kind='question' and state not in ('resolved','drop')),count(*) filter(where kind='risk' and state not in ('resolved','drop')),count(*) filter(where kind in ('reference','evidence') and state<>'drop')
    into v_open_questions,v_open_risks,v_evidence from public.idea_items where idea_id=p_idea_id;
  return jsonb_build_object('idea_id',p_idea_id,'status',v_idea.status,'version',v_idea.version,'can_manage',v_can_manage,'core_complete',(nullif(btrim(v_idea.problem),'') is not null and nullif(btrim(v_idea.audience),'') is not null and nullif(btrim(v_idea.proposal),'') is not null),'open_questions',v_open_questions,'open_risks',v_open_risks,'evidence_count',v_evidence,'feedback',jsonb_build_object('total',v_total,'approve',v_approve,'deepen',v_deepen,'park',v_park,'reject',v_reject),'conversion_allowed',(v_can_manage and v_idea.status='approved' and v_idea.converted_project_id is null),'converted_project_id',v_idea.converted_project_id);
end $$;
revoke all on function public.get_idea_decision_brief_v5(uuid) from public,anon;
grant execute on function public.get_idea_decision_brief_v5(uuid) to authenticated;
