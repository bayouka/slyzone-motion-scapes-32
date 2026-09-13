-- 4b4c Idea Engine R5 hardening: explicit review feedback closure

alter table public.idea_decision_feedback
  add column resolved_by uuid null references auth.users(id) on delete set null,
  add column resolution jsonb not null default '{}'::jsonb check (jsonb_typeof(resolution)='object');

create index idea_decision_feedback_resolved_by_idx on public.idea_decision_feedback(resolved_by) where resolved_by is not null;

create or replace function public.resolve_decision_feedback_v1(
  p_feedback_id uuid,
  p_resolved_by uuid,
  p_resolution_status text,
  p_resolution jsonb,
  p_expected_engine_revision bigint
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_feedback public.idea_decision_feedback;
  v_idea public.ideas;
  v_authorized boolean;
begin
  if p_resolution_status not in ('resolved','rejected') then raise exception 'INVALID_FEEDBACK_RESOLUTION_STATUS'; end if;
  if p_resolution is null or jsonb_typeof(p_resolution)<>'object' then raise exception 'INVALID_FEEDBACK_RESOLUTION'; end if;

  select * into v_feedback from public.idea_decision_feedback where id=p_feedback_id for update;
  if v_feedback.id is null then raise exception 'DECISION_FEEDBACK_NOT_FOUND'; end if;
  select * into v_idea from public.ideas where id=v_feedback.idea_id for update;
  if v_idea.engine_revision<>p_expected_engine_revision then raise exception 'STALE_ENGINE'; end if;

  select (
    v_idea.created_by=p_resolved_by
    or exists(select 1 from public.workspace_members wm where wm.workspace_id=v_idea.workspace_id and wm.user_id=p_resolved_by and wm.status='active' and wm.role in ('owner','admin'))
  ) into v_authorized;
  if not coalesce(v_authorized,false) then raise exception 'FEEDBACK_RESOLVER_NOT_AUTHORIZED'; end if;

  if v_feedback.status in ('resolved','rejected') then
    if v_feedback.status<>p_resolution_status or v_feedback.resolution is distinct from p_resolution then raise exception 'FEEDBACK_ALREADY_CLOSED_DIFFERENTLY'; end if;
    return jsonb_build_object('feedback_id',v_feedback.id,'status',v_feedback.status,'engine_revision',v_idea.engine_revision,'idempotent',true);
  end if;
  if v_feedback.status<>'open' then raise exception 'FEEDBACK_NOT_RESOLVABLE'; end if;

  update public.idea_decision_feedback
  set status=p_resolution_status,resolved_by=p_resolved_by,resolution=p_resolution,resolved_at=now()
  where id=v_feedback.id;

  insert into public.audit_events(workspace_id,actor_id,event_type,entity_type,entity_id,payload)
  values(v_idea.workspace_id,p_resolved_by,'idea.decision_feedback_closed','idea_decision_feedback',v_feedback.id,
         jsonb_build_object('idea_id',v_idea.id,'package_id',v_feedback.package_id,'status',p_resolution_status,'materiality',v_feedback.materiality,'engine_revision',v_idea.engine_revision));

  return jsonb_build_object('feedback_id',v_feedback.id,'status',p_resolution_status,'engine_revision',v_idea.engine_revision,'idempotent',false);
end;
$$;

revoke all on function public.resolve_decision_feedback_v1(uuid,uuid,text,jsonb,bigint) from public,anon,authenticated;
grant execute on function public.resolve_decision_feedback_v1(uuid,uuid,text,jsonb,bigint) to service_role;
