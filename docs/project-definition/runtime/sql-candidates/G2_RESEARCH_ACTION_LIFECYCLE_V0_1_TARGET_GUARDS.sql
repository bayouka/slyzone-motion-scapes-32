-- 4b4c / 2b2c — G2 research Action Run lifecycle target guards V0.1
-- Date: 2026-09-13
-- STATUS: COMPILE/ROLLBACK CANDIDATE ONLY — DO NOT APPLY AS A MIGRATION.
-- Generic G1 start_action_run_v1 / retry_action_run_v1 remain untouched.

create or replace function app_private.idea_g2_research_run_targets_current_v1(
  p_run_id uuid
) returns boolean
language plpgsql
stable
security definer
set search_path=''
as $function$
declare
  v_run public.idea_action_runs;
  v_target text;
  v_fp text;
  v_applicability text;
begin
  select * into v_run from public.idea_action_runs where id=p_run_id;
  if v_run.id is null then return false; end if;
  if v_run.acquisition_path not in ('WEB','AUDIT','CONN') then return false; end if;
  if coalesce(cardinality(v_run.target_requirement_ids),0)=0 then return false; end if;

  foreach v_target in array v_run.target_requirement_ids loop
    v_fp:=null;
    v_applicability:=null;
    select rs.input_fingerprint,rs.applicability_state
      into v_fp,v_applicability
    from public.idea_requirement_states rs
    where rs.idea_id=v_run.idea_id and rs.requirement_id=v_target;

    if nullif(v_fp,'') is null
       or v_applicability<>'ACTIVE'
       or v_fp is distinct from v_run.target_requirement_fingerprints->>v_target
    then
      return false;
    end if;
  end loop;

  return true;
end;
$function$;

revoke all on function app_private.idea_g2_research_run_targets_current_v1(uuid)
from public,anon,authenticated;

create or replace function public.start_research_action_run_candidate_v1(
  p_action_run_id uuid,
  p_current_input_fingerprint text
) returns jsonb
language plpgsql
security definer
set search_path=''
as $function$
declare
  v_run public.idea_action_runs;
  v_idea public.ideas;
  v_targets_current boolean;
begin
  select * into v_run
  from public.idea_action_runs
  where id=p_action_run_id
  for update;
  if v_run.id is null then raise exception 'ACTION_RUN_NOT_FOUND'; end if;
  if v_run.acquisition_path not in ('WEB','AUDIT','CONN') then
    raise exception 'RESEARCH_ACTION_PATH_REQUIRED';
  end if;

  select * into v_idea
  from public.ideas
  where id=v_run.idea_id
  for update;
  if v_idea.id is null then raise exception 'IDEA_NOT_FOUND'; end if;
  if v_idea.blueprint_id<>'SITE_VITRINE'
     or v_idea.blueprint_version<>'0.5'
     or v_idea.blueprint_status<>'active'
  then
    update public.idea_action_runs
    set status='stale',stale_reason='G2_BLUEPRINT_CHANGED_BEFORE_START',
        completed_at=coalesce(completed_at,now()),
        completed_engine_revision=v_idea.engine_revision
    where id=v_run.id and status in ('queued','running');
    return jsonb_build_object(
      'action_run_id',v_run.id,'status','stale','idempotent',false
    );
  end if;

  if v_run.status not in ('queued','running') then raise exception 'ACTION_RUN_NOT_STARTABLE'; end if;

  v_targets_current:=app_private.idea_g2_research_run_targets_current_v1(v_run.id);

  if v_idea.engine_revision is distinct from v_run.created_engine_revision then
    update public.idea_action_runs
    set status='stale',stale_reason='IDEA_REVISION_CHANGED_BEFORE_RESEARCH_START',
        completed_at=coalesce(completed_at,now()),
        completed_engine_revision=v_idea.engine_revision
    where id=v_run.id;
    return jsonb_build_object(
      'action_run_id',v_run.id,'status','stale','idempotent',false
    );
  end if;

  if v_run.input_fingerprint is distinct from p_current_input_fingerprint then
    update public.idea_action_runs
    set status='stale',stale_reason='INPUT_CHANGED_BEFORE_RESEARCH_START',
        completed_at=coalesce(completed_at,now()),
        completed_engine_revision=v_idea.engine_revision
    where id=v_run.id;
    return jsonb_build_object(
      'action_run_id',v_run.id,'status','stale','idempotent',false
    );
  end if;

  if not v_targets_current then
    update public.idea_action_runs
    set status='stale',stale_reason='TARGET_REQUIREMENT_CHANGED_BEFORE_RESEARCH_START',
        completed_at=coalesce(completed_at,now()),
        completed_engine_revision=v_idea.engine_revision
    where id=v_run.id;
    return jsonb_build_object(
      'action_run_id',v_run.id,'status','stale','idempotent',false
    );
  end if;

  if v_run.status='running' then
    return jsonb_build_object(
      'action_run_id',v_run.id,'status','running','idempotent',true
    );
  end if;

  update public.idea_action_runs
  set status='running',started_at=coalesce(started_at,now())
  where id=v_run.id;

  return jsonb_build_object(
    'action_run_id',v_run.id,'status','running','idempotent',false
  );
end;
$function$;

revoke all on function public.start_research_action_run_candidate_v1(uuid,text)
from public,anon,authenticated;
grant execute on function public.start_research_action_run_candidate_v1(uuid,text)
to service_role;

create or replace function public.retry_research_action_run_candidate_v1(
  p_action_run_id uuid,
  p_current_input_fingerprint text
) returns jsonb
language plpgsql
security definer
set search_path=''
as $function$
declare
  v_run public.idea_action_runs;
  v_idea public.ideas;
  v_targets_current boolean;
  v_attempt integer;
begin
  select * into v_run
  from public.idea_action_runs
  where id=p_action_run_id
  for update;
  if v_run.id is null then raise exception 'ACTION_RUN_NOT_FOUND'; end if;
  if v_run.acquisition_path not in ('WEB','AUDIT','CONN') then
    raise exception 'RESEARCH_ACTION_PATH_REQUIRED';
  end if;

  select * into v_idea
  from public.ideas
  where id=v_run.idea_id
  for update;
  if v_idea.id is null then raise exception 'IDEA_NOT_FOUND'; end if;

  if v_run.status='queued' then
    return jsonb_build_object(
      'action_run_id',v_run.id,'status','queued','attempt',v_run.attempt,'idempotent',true
    );
  end if;
  if v_run.status<>'failed' then raise exception 'ACTION_RUN_NOT_RETRYABLE'; end if;

  if v_idea.blueprint_id<>'SITE_VITRINE'
     or v_idea.blueprint_version<>'0.5'
     or v_idea.blueprint_status<>'active'
  then
    update public.idea_action_runs
    set status='stale',stale_reason='G2_BLUEPRINT_CHANGED_BEFORE_RETRY'
    where id=v_run.id;
    return jsonb_build_object(
      'action_run_id',v_run.id,'status','stale','attempt',v_run.attempt,'idempotent',false
    );
  end if;

  v_targets_current:=app_private.idea_g2_research_run_targets_current_v1(v_run.id);

  if v_idea.engine_revision is distinct from v_run.created_engine_revision then
    update public.idea_action_runs
    set status='stale',stale_reason='IDEA_REVISION_CHANGED_BEFORE_RESEARCH_RETRY'
    where id=v_run.id;
    return jsonb_build_object(
      'action_run_id',v_run.id,'status','stale','attempt',v_run.attempt,'idempotent',false
    );
  end if;

  if v_run.input_fingerprint is distinct from p_current_input_fingerprint then
    update public.idea_action_runs
    set status='stale',stale_reason='INPUT_CHANGED_BEFORE_RESEARCH_RETRY'
    where id=v_run.id;
    return jsonb_build_object(
      'action_run_id',v_run.id,'status','stale','attempt',v_run.attempt,'idempotent',false
    );
  end if;

  if not v_targets_current then
    update public.idea_action_runs
    set status='stale',stale_reason='TARGET_REQUIREMENT_CHANGED_BEFORE_RESEARCH_RETRY'
    where id=v_run.id;
    return jsonb_build_object(
      'action_run_id',v_run.id,'status','stale','attempt',v_run.attempt,'idempotent',false
    );
  end if;

  update public.idea_action_runs
  set status='queued',attempt=attempt+1,error_code=null,
      result='{}'::jsonb,proposed_mutations='[]'::jsonb,
      result_fingerprint=null,latency_ms=null,cost_metadata='{}'::jsonb,
      started_at=null,completed_at=null,completed_engine_revision=null,stale_reason=null
  where id=v_run.id
  returning attempt into v_attempt;

  return jsonb_build_object(
    'action_run_id',v_run.id,'status','queued','attempt',v_attempt,'idempotent',false
  );
end;
$function$;

revoke all on function public.retry_research_action_run_candidate_v1(uuid,text)
from public,anon,authenticated;
grant execute on function public.retry_research_action_run_candidate_v1(uuid,text)
to service_role;

-- Invariants:
-- - research work is not started/retried after Idea revision drift;
-- - current target Requirement basis is revalidated before external work;
-- - generic G1 lifecycle functions remain untouched;
-- - promotion still performs the final authoritative revalidation.
