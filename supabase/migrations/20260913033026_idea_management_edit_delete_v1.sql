alter table public.ideas add column if not exists current_description text not null default '';

update public.ideas
set current_description=original_text
where nullif(btrim(current_description),'') is null;

create or replace function public.update_idea_content_v2(
  p_idea_id uuid,
  p_expected_version integer,
  p_title text,
  p_current_description text,
  p_summary text default '',
  p_problem text default '',
  p_audience text default '',
  p_proposal text default ''
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user uuid:=auth.uid();
  v_old public.ideas;
  v_new public.ideas;
  v_content_changed boolean;
  v_title_changed boolean;
begin
  if v_user is null then raise exception 'FORBIDDEN'; end if;
  if nullif(btrim(p_title),'') is null then raise exception 'IDEA_TITLE_REQUIRED'; end if;
  if nullif(btrim(p_current_description),'') is null then raise exception 'IDEA_DESCRIPTION_REQUIRED'; end if;

  select * into v_old from public.ideas where id=p_idea_id for update;
  if v_old.id is null then raise exception 'IDEA_NOT_FOUND'; end if;
  if not app_private.can_write_idea(p_idea_id) then raise exception 'FORBIDDEN'; end if;
  if v_old.version<>p_expected_version then raise exception 'STALE_IDEA'; end if;
  if v_old.converted_project_id is not null or v_old.status='converted' then raise exception 'IDEA_ALREADY_CONVERTED'; end if;

  v_title_changed := v_old.title is distinct from btrim(p_title);
  v_content_changed :=
    coalesce(nullif(btrim(v_old.current_description),''),v_old.original_text) is distinct from btrim(p_current_description)
    or v_old.summary is distinct from coalesce(p_summary,'')
    or v_old.problem is distinct from coalesce(p_problem,'')
    or v_old.audience is distinct from coalesce(p_audience,'')
    or v_old.proposal is distinct from coalesce(p_proposal,'');

  update public.ideas set
    title=btrim(p_title),
    current_description=btrim(p_current_description),
    summary=coalesce(p_summary,''),
    problem=coalesce(p_problem,''),
    audience=coalesce(p_audience,''),
    proposal=coalesce(p_proposal,''),
    version=version+1,
    engine_revision=case when v_content_changed and blueprint_id is not null then engine_revision+1 else engine_revision end,
    status=case
      when v_content_changed and status in ('approved','in_review','ready_for_review') then 'needs_work'
      when status='draft' and (
        nullif(btrim(coalesce(p_summary,'')),'') is not null
        or nullif(btrim(coalesce(p_problem,'')),'') is not null
        or nullif(btrim(coalesce(p_audience,'')),'') is not null
        or nullif(btrim(coalesce(p_proposal,'')),'') is not null
      ) then 'exploring'
      else status
    end
  where id=p_idea_id
  returning * into v_new;

  if v_content_changed and v_old.blueprint_id is not null then
    update public.idea_requirement_states
      set resolution='STALE', updated_at=now()
      where idea_id=p_idea_id and source_engine_revision < v_new.engine_revision and resolution<>'STALE';

    update public.idea_action_runs
      set status='stale', stale_reason='idea_content_changed', completed_at=coalesce(completed_at,now())
      where idea_id=p_idea_id and status in ('queued','running') and input_engine_revision < v_new.engine_revision;
  end if;

  insert into public.audit_events(workspace_id,actor_id,event_type,entity_type,entity_id,payload)
  values(v_new.workspace_id,v_user,'idea.content_updated','idea',v_new.id,
    jsonb_build_object(
      'previous_version',v_old.version,
      'version',v_new.version,
      'title_changed',v_title_changed,
      'content_changed',v_content_changed,
      'engine_revision',v_new.engine_revision
    ));

  return jsonb_build_object(
    'idea_id',v_new.id,
    'version',v_new.version,
    'engine_revision',v_new.engine_revision,
    'status',v_new.status,
    'title_changed',v_title_changed,
    'content_changed',v_content_changed
  );
end $$;

create or replace function public.delete_idea_v2(
  p_idea_id uuid,
  p_expected_version integer
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user uuid:=auth.uid();
  v_row public.ideas;
begin
  if v_user is null then raise exception 'FORBIDDEN'; end if;
  select * into v_row from public.ideas where id=p_idea_id for update;
  if v_row.id is null then raise exception 'IDEA_NOT_FOUND'; end if;
  if v_row.version<>p_expected_version then raise exception 'STALE_IDEA'; end if;
  if not (v_row.created_by=v_user or app_private.can_manage_workspace(v_row.workspace_id)) then raise exception 'FORBIDDEN'; end if;
  if v_row.converted_project_id is not null or v_row.status='converted' then raise exception 'IDEA_ALREADY_CONVERTED'; end if;
  if exists(select 1 from public.project_definitions pd where pd.idea_id=p_idea_id) then raise exception 'IDEA_HAS_PROJECT_DEFINITION'; end if;
  if exists(select 1 from public.idea_snapshots s where s.idea_id=p_idea_id) then raise exception 'IDEA_HAS_PROTECTED_HISTORY'; end if;

  insert into public.audit_events(workspace_id,actor_id,event_type,entity_type,entity_id,payload)
  values(v_row.workspace_id,v_user,'idea.deleted','idea',v_row.id,
    jsonb_build_object('title',v_row.title,'status',v_row.status,'version',v_row.version));

  delete from public.ideas where id=p_idea_id;
  return jsonb_build_object('idea_id',p_idea_id,'deleted',true);
end $$;

revoke all on function public.update_idea_content_v2(uuid,integer,text,text,text,text,text,text) from public,anon;
revoke all on function public.delete_idea_v2(uuid,integer) from public,anon;
grant execute on function public.update_idea_content_v2(uuid,integer,text,text,text,text,text,text) to authenticated,service_role;
grant execute on function public.delete_idea_v2(uuid,integer) to authenticated,service_role;
