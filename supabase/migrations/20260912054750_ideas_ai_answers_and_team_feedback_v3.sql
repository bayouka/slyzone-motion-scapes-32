create table if not exists public.idea_question_answers (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.ideas(id) on delete cascade,
  question_item_id uuid references public.idea_items(id) on delete cascade,
  answered_by uuid not null references auth.users(id) on delete cascade,
  answer text not null check(length(btrim(answer)) between 1 and 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(question_item_id,answered_by)
);
alter table public.idea_question_answers enable row level security;
create policy idea_question_answers_select on public.idea_question_answers for select to authenticated using(app_private.can_access_idea(idea_id));
create policy idea_question_answers_insert on public.idea_question_answers for insert to authenticated with check(answered_by=auth.uid() and app_private.can_write_idea(idea_id));
create policy idea_question_answers_update on public.idea_question_answers for update to authenticated using(answered_by=auth.uid() and app_private.can_write_idea(idea_id)) with check(answered_by=auth.uid() and app_private.can_write_idea(idea_id));
create policy idea_question_answers_delete on public.idea_question_answers for delete to authenticated using(answered_by=auth.uid() and app_private.can_write_idea(idea_id));
revoke all on public.idea_question_answers from anon;
grant select,insert,update,delete on public.idea_question_answers to authenticated;

create table if not exists public.idea_team_feedback (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.ideas(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  stance text not null check(stance in ('approve','deepen','park','reject')),
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(idea_id,user_id)
);
alter table public.idea_team_feedback enable row level security;
create policy idea_team_feedback_select on public.idea_team_feedback for select to authenticated using(app_private.can_access_idea(idea_id));
create policy idea_team_feedback_insert on public.idea_team_feedback for insert to authenticated with check(user_id=auth.uid() and app_private.can_access_idea(idea_id));
create policy idea_team_feedback_update on public.idea_team_feedback for update to authenticated using(user_id=auth.uid() and app_private.can_access_idea(idea_id)) with check(user_id=auth.uid() and app_private.can_access_idea(idea_id));
create policy idea_team_feedback_delete on public.idea_team_feedback for delete to authenticated using(user_id=auth.uid());
revoke all on public.idea_team_feedback from anon;
grant select,insert,update,delete on public.idea_team_feedback to authenticated;

create or replace function public.answer_idea_question_v3(p_idea_id uuid,p_question_item_id uuid,p_answer text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid(); v_id uuid;
begin
  if v_user is null or not app_private.can_write_idea(p_idea_id) then raise exception 'FORBIDDEN'; end if;
  if not exists(select 1 from public.idea_items where id=p_question_item_id and idea_id=p_idea_id and kind='question') then raise exception 'QUESTION_NOT_FOUND'; end if;
  if nullif(btrim(p_answer),'') is null then raise exception 'ANSWER_REQUIRED'; end if;
  insert into public.idea_question_answers(idea_id,question_item_id,answered_by,answer)
  values(p_idea_id,p_question_item_id,v_user,btrim(p_answer))
  on conflict(question_item_id,answered_by) do update set answer=excluded.answer,updated_at=now()
  returning id into v_id;
  update public.idea_items set state='resolved' where id=p_question_item_id and idea_id=p_idea_id;
  update public.ideas set version=version+1,updated_at=now() where id=p_idea_id;
  return jsonb_build_object('answer_id',v_id,'question_item_id',p_question_item_id,'state','resolved');
end $$;
revoke all on function public.answer_idea_question_v3(uuid,uuid,text) from public,anon;
grant execute on function public.answer_idea_question_v3(uuid,uuid,text) to authenticated;

create or replace function public.submit_idea_team_feedback_v3(p_idea_id uuid,p_stance text,p_comment text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid();
begin
  if v_user is null or not app_private.can_access_idea(p_idea_id) then raise exception 'FORBIDDEN'; end if;
  if p_stance not in ('approve','deepen','park','reject') then raise exception 'INVALID_STANCE'; end if;
  insert into public.idea_team_feedback(idea_id,user_id,stance,comment)
  values(p_idea_id,v_user,p_stance,nullif(btrim(p_comment),''))
  on conflict(idea_id,user_id) do update set stance=excluded.stance,comment=excluded.comment,updated_at=now();
  return jsonb_build_object('idea_id',p_idea_id,'stance',p_stance);
end $$;
revoke all on function public.submit_idea_team_feedback_v3(uuid,text,text) from public,anon;
grant execute on function public.submit_idea_team_feedback_v3(uuid,text,text) to authenticated;
