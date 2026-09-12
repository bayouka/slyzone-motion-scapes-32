alter table public.idea_decisions add column if not exists idea_version integer;

with ranked as (
  select d.id,d.idea_id,d.outcome,row_number() over(partition by d.idea_id order by d.decided_at desc,d.id desc) rn
  from public.idea_decisions d
)
update public.idea_decisions d
set idea_version=greatest(i.version-1,0)
from ranked r join public.ideas i on i.id=r.idea_id
where d.id=r.id and r.rn=1 and i.status=r.outcome and d.idea_version is null;

create or replace function public.decide_idea_v1(p_idea_id uuid,p_outcome text,p_rationale text default '')
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_idea public.ideas; v_reason text:=btrim(coalesce(p_rationale,''));
begin
  if not app_private.can_manage_idea(p_idea_id) then raise exception 'FORBIDDEN'; end if;
  if p_outcome not in ('approved','needs_work','parked','rejected') then raise exception 'INVALID_IDEA_DECISION'; end if;
  if v_reason='' then raise exception 'DECISION_RATIONALE_REQUIRED'; end if;
  if length(v_reason)>4000 then raise exception 'DECISION_RATIONALE_TOO_LONG'; end if;
  select * into v_idea from public.ideas where id=p_idea_id for update;
  if v_idea.id is null then raise exception 'IDEA_NOT_FOUND'; end if;
  insert into public.idea_decisions(idea_id,outcome,rationale,decided_by,idea_version) values(p_idea_id,p_outcome,v_reason,auth.uid(),v_idea.version);
  update public.ideas set status=p_outcome,readiness=case when p_outcome='approved' then 'decision' else readiness end,version=version+1 where id=p_idea_id;
  return jsonb_build_object('idea_id',p_idea_id,'status',p_outcome,'decided_idea_version',v_idea.version);
end $$;

create or replace function public.update_idea_core_v1(p_idea_id uuid,p_expected_version integer,p_title text,p_summary text,p_problem text,p_audience text,p_proposal text,p_readiness text default null)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_row public.ideas;
begin
  if not app_private.can_write_idea(p_idea_id) then raise exception 'FORBIDDEN'; end if;
  update public.ideas set title=coalesce(nullif(btrim(p_title),''),title),summary=coalesce(p_summary,''),problem=coalesce(p_problem,''),audience=coalesce(p_audience,''),proposal=coalesce(p_proposal,''),readiness=case when status='approved' then 'decision' else coalesce(p_readiness,readiness) end,version=version+1,status=case when status='approved' then 'needs_work' when status='draft' and (nullif(btrim(coalesce(p_summary,'')),'') is not null or nullif(btrim(coalesce(p_problem,'')),'') is not null) then 'exploring' else status end where id=p_idea_id and version=p_expected_version returning * into v_row;
  if v_row.id is null then raise exception 'STALE_IDEA'; end if;
  return jsonb_build_object('idea_id',v_row.id,'version',v_row.version,'status',v_row.status,'readiness',v_row.readiness);
end $$;

create or replace function public.create_idea_item_v1(p_idea_id uuid,p_kind text,p_title text,p_body text default '',p_url text default null)
returns uuid language plpgsql security definer set search_path=''
as $$
declare v_id uuid;
begin
  if not app_private.can_write_idea(p_idea_id) then raise exception 'FORBIDDEN'; end if;
  if p_kind not in ('question','reference','hypothesis','path','risk','evidence','note') then raise exception 'INVALID_IDEA_ITEM_KIND'; end if;
  if nullif(btrim(p_title),'') is null then raise exception 'IDEA_ITEM_TITLE_REQUIRED'; end if;
  insert into public.idea_items(idea_id,kind,title,body,url,created_by) values(p_idea_id,p_kind,btrim(p_title),coalesce(p_body,''),nullif(btrim(p_url),''),auth.uid()) returning id into v_id;
  update public.ideas set version=version+1,status=case when status='approved' then 'needs_work' else status end,readiness=case when status='approved' then 'decision' else readiness end where id=p_idea_id;
  return v_id;
end $$;

create or replace function public.set_idea_item_state_v1(p_item_id uuid,p_state text)
returns void language plpgsql security definer set search_path=''
as $$
declare v_idea uuid;
begin
  select idea_id into v_idea from public.idea_items where id=p_item_id;
  if v_idea is null or not app_private.can_write_idea(v_idea) then raise exception 'FORBIDDEN'; end if;
  if p_state not in ('open','keep','explore','drop','resolved') then raise exception 'INVALID_IDEA_ITEM_STATE'; end if;
  update public.idea_items set state=p_state where id=p_item_id;
  update public.ideas set version=version+1,status=case when status='approved' then 'needs_work' else status end,readiness=case when status='approved' then 'decision' else readiness end where id=v_idea;
end $$;

create or replace function public.accept_idea_ai_suggestion_v2(p_idea_id uuid,p_kind text,p_title text,p_body text,p_state text default 'kept')
returns uuid language plpgsql security definer set search_path=''
as $$
declare v_id uuid; v_state text;
begin
  if not app_private.can_write_idea(p_idea_id) then raise exception 'FORBIDDEN'; end if;
  if p_kind not in ('question','hypothesis','path','risk','evidence','note') then raise exception 'INVALID_IDEA_ITEM_KIND'; end if;
  v_state:=case p_state when 'kept' then 'keep' when 'rejected' then 'drop' when 'keep' then 'keep' when 'drop' then 'drop' when 'explore' then 'explore' when 'open' then 'open' when 'resolved' then 'resolved' else null end;
  if v_state is null then raise exception 'INVALID_IDEA_ITEM_STATE'; end if;
  insert into public.idea_items(idea_id,kind,title,body,state,created_by) values(p_idea_id,p_kind,btrim(p_title),coalesce(p_body,''),v_state,auth.uid()) returning id into v_id;
  update public.ideas set version=version+1,status=case when status='approved' then 'needs_work' else status end,readiness=case when status='approved' then 'decision' else readiness end where id=p_idea_id;
  return v_id;
end $$;

create or replace function public.answer_idea_question_v3(p_idea_id uuid,p_question_item_id uuid,p_answer text)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_user uuid:=auth.uid(); v_id uuid;
begin
  if v_user is null or not app_private.can_write_idea(p_idea_id) then raise exception 'FORBIDDEN'; end if;
  if not exists(select 1 from public.idea_items where id=p_question_item_id and idea_id=p_idea_id and kind='question') then raise exception 'QUESTION_NOT_FOUND'; end if;
  if nullif(btrim(p_answer),'') is null then raise exception 'ANSWER_REQUIRED'; end if;
  insert into public.idea_question_answers(idea_id,question_item_id,answered_by,answer) values(p_idea_id,p_question_item_id,v_user,btrim(p_answer)) on conflict(question_item_id,answered_by) do update set answer=excluded.answer,updated_at=now() returning id into v_id;
  update public.idea_items set state='resolved' where id=p_question_item_id and idea_id=p_idea_id;
  update public.ideas set version=version+1,updated_at=now(),status=case when status='approved' then 'needs_work' else status end,readiness=case when status='approved' then 'decision' else readiness end where id=p_idea_id;
  return jsonb_build_object('answer_id',v_id,'question_item_id',p_question_item_id,'state','resolved');
end $$;

create or replace function public.answer_new_idea_question_v3(p_idea_id uuid,p_question text,p_why text,p_answer text)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_user uuid:=auth.uid(); v_item uuid; v_answer uuid;
begin
  if v_user is null or not app_private.can_write_idea(p_idea_id) then raise exception 'FORBIDDEN'; end if;
  if nullif(btrim(p_question),'') is null or nullif(btrim(p_answer),'') is null then raise exception 'QUESTION_AND_ANSWER_REQUIRED'; end if;
  insert into public.idea_items(idea_id,kind,title,body,state,created_by) values(p_idea_id,'question',btrim(p_question),coalesce(p_why,''),'resolved',v_user) returning id into v_item;
  insert into public.idea_question_answers(idea_id,question_item_id,answered_by,answer) values(p_idea_id,v_item,v_user,btrim(p_answer)) returning id into v_answer;
  update public.ideas set version=version+1,updated_at=now(),status=case when status='approved' then 'needs_work' else status end,readiness=case when status='approved' then 'decision' else readiness end where id=p_idea_id;
  return jsonb_build_object('question_item_id',v_item,'answer_id',v_answer,'state','resolved');
end $$;

create or replace function public.convert_idea_to_project_v1(p_idea_id uuid,p_target_date date default null,p_phase_titles text[] default array[]::text[])
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_idea public.ideas; v_result jsonb; v_project uuid; v_title text; v_pos integer:=0; v_participants uuid[]; v_decision public.idea_decisions;
begin
  if not app_private.can_manage_idea(p_idea_id) then raise exception 'FORBIDDEN'; end if;
  select * into v_idea from public.ideas where id=p_idea_id for update;
  if v_idea.id is null then raise exception 'IDEA_NOT_FOUND'; end if;
  if v_idea.converted_project_id is not null then return jsonb_build_object('idea_id',p_idea_id,'project_id',v_idea.converted_project_id,'already_converted',true); end if;
  if v_idea.status<>'approved' then raise exception 'IDEA_NOT_APPROVED'; end if;
  select * into v_decision from public.idea_decisions where idea_id=p_idea_id order by decided_at desc,id desc limit 1;
  if v_decision.id is null or v_decision.outcome<>'approved' or v_decision.idea_version is null or v_decision.idea_version<>v_idea.version-1 then raise exception 'STALE_IDEA_APPROVAL'; end if;
  select coalesce(array_agg(user_id) filter(where user_id<>v_idea.created_by),array[]::uuid[]) into v_participants from public.idea_members where idea_id=p_idea_id;
  v_result:=app_private.rpc_create_project_with_access_v1(v_idea.workspace_id,v_idea.title,coalesce(nullif(v_idea.proposal,''),nullif(v_idea.summary,''),v_idea.original_text),p_target_date,case when v_idea.visibility='team' then 'team' else 'restricted' end,v_participants);
  v_project:=(v_result->>'project_id')::uuid;
  foreach v_title in array coalesce(p_phase_titles,array[]::text[]) loop if nullif(btrim(v_title),'') is not null then v_pos:=v_pos+1; if v_pos>5 then exit; end if; insert into public.milestones(workspace_id,project_id,title,position,status) values(v_idea.workspace_id,v_project,btrim(v_title),v_pos,case when v_pos=1 then 'active' else 'todo' end); end if; end loop;
  update public.ideas set converted_project_id=v_project,status='converted',readiness='converted',version=version+1 where id=p_idea_id;
  insert into public.audit_events(workspace_id,actor_id,event_type,entity_type,entity_id,payload) values(v_idea.workspace_id,auth.uid(),'idea.converted','idea',p_idea_id,jsonb_build_object('project_id',v_project));
  return v_result||jsonb_build_object('idea_id',p_idea_id,'project_id',v_project,'already_converted',false,'phases',v_pos);
end $$;
