-- 4b4c / 2b2c — align legacy Idea editor with the canonical R3→R7 runtime.
-- Material content change suspends Blueprint reuse until G0 reclassification and preserves prior evidence/history.

create or replace function public.update_idea_content_v2(
  p_idea_id uuid,
  p_expected_version integer,
  p_title text,
  p_current_description text,
  p_summary text default ''::text,
  p_problem text default ''::text,
  p_audience text default ''::text,
  p_proposal text default ''::text
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
  v_pkg_id uuid;
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

  if v_content_changed and exists(
    select 1 from public.project_definitions pd
    where pd.idea_id=p_idea_id and pd.status<>'superseded'
  ) then
    raise exception 'IDEA_HAS_PROJECT_DEFINITION_USE_CHANGE_WORKFLOW';
  end if;

  update public.ideas set
    title=btrim(p_title),
    current_description=btrim(p_current_description),
    summary=coalesce(p_summary,''),
    problem=coalesce(p_problem,''),
    audience=coalesce(p_audience,''),
    proposal=coalesce(p_proposal,''),
    version=version+1,
    engine_revision=case
      when v_content_changed and blueprint_status in ('active','mismatch','migration_required') then engine_revision+1
      else engine_revision
    end,
    blueprint_status=case
      when v_content_changed and blueprint_status in ('active','mismatch','migration_required') then 'migration_required'
      else blueprint_status
    end,
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

  if v_content_changed then
    update public.idea_blueprint_fit_assessments
      set state='superseded'
      where idea_id=p_idea_id and state='current';
  end if;

  if v_content_changed and v_new.blueprint_status='migration_required' then
    update public.idea_requirement_states
      set lock_state='REVIEW_REQUIRED',
          stale_reason='idea_content_changed_pending_change_impact',
          version=version+1,
          updated_at=now()
      where idea_id=p_idea_id
        and applicability_state='ACTIVE'
        and evaluated_engine_revision < v_new.engine_revision
        and lock_state not in ('SUPERSEDED','REJECTED');

    update public.idea_action_runs
      set status='stale',
          stale_reason='idea_content_changed',
          completed_at=coalesce(completed_at,now()),
          completed_engine_revision=coalesce(completed_engine_revision,v_new.engine_revision)
      where idea_id=p_idea_id
        and promoted_at is null
        and status in ('queued','running','succeeded')
        and created_engine_revision < v_new.engine_revision;

    for v_pkg_id in
      select id from public.idea_decision_packages
      where idea_id=p_idea_id and state in ('draft','current')
    loop
      perform public.mark_decision_package_stale_v1(v_pkg_id,'idea_content_changed');
    end loop;
  end if;

  insert into public.audit_events(workspace_id,actor_id,event_type,entity_type,entity_id,payload)
  values(v_new.workspace_id,v_user,'idea.content_updated','idea',v_new.id,
    jsonb_build_object(
      'previous_version',v_old.version,
      'version',v_new.version,
      'title_changed',v_title_changed,
      'content_changed',v_content_changed,
      'engine_revision_before',v_old.engine_revision,
      'engine_revision',v_new.engine_revision,
      'blueprint_status_before',v_old.blueprint_status,
      'blueprint_status',v_new.blueprint_status
    ));

  return jsonb_build_object(
    'idea_id',v_new.id,
    'version',v_new.version,
    'engine_revision',v_new.engine_revision,
    'blueprint_status',v_new.blueprint_status,
    'status',v_new.status,
    'title_changed',v_title_changed,
    'content_changed',v_content_changed
  );
end;
$$;