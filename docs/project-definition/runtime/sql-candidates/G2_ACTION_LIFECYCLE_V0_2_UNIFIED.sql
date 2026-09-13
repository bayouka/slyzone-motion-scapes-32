-- 4b4c / 2b2c — G2 unified Action Run lifecycle V0.2
-- Date: 2026-09-14
-- STATUS: COMPILE/ROLLBACK CANDIDATE ONLY — DO NOT APPLY AS A MIGRATION.
-- Supersedes G2_RESEARCH_ACTION_LIFECYCLE_V0_1_TARGET_GUARDS for future G2 bundle.
-- Applies to both research and non-research G2 Action Runs.
-- Active G1 start/retry/complete RPCs remain untouched.

create or replace function app_private.idea_g2_run_targets_current_v2(p_run_id uuid)
returns boolean
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
  if v_run.acquisition_path not in ('MEM','RAW','SRC','AUDIT','CONN','WEB','CALC','AI_H','AI_R') then return false; end if;
  if coalesce(cardinality(v_run.target_requirement_ids),0)=0 then return false; end if;

  foreach v_target in array v_run.target_requirement_ids loop
    v_fp:=null; v_applicability:=null;
    select rs.input_fingerprint,rs.applicability_state into v_fp,v_applicability
    from public.idea_requirement_states rs
    where rs.idea_id=v_run.idea_id and rs.requirement_id=v_target;
    if nullif(v_fp,'') is null
       or v_applicability<>'ACTIVE'
       or v_fp is distinct from v_run.target_requirement_fingerprints->>v_target then
      return false;
    end if;
  end loop;
  return true;
end;
$function$;

revoke all on function app_private.idea_g2_run_targets_current_v2(uuid)
from public,anon,authenticated;

create or replace function public.start_g2_action_run_candidate_v1(
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
  select * into v_run from public.idea_action_runs where id=p_action_run_id for update;
  if v_run.id is null then raise exception 'ACTION_RUN_NOT_FOUND'; end if;
  if v_run.acquisition_path not in ('MEM','RAW','SRC','AUDIT','CONN','WEB','CALC','AI_H','AI_R') then
    raise exception 'G2_ACTION_PATH_REQUIRED';
  end if;

  select * into v_idea from public.ideas where id=v_run.idea_id for update;
  if v_idea.id is null then raise exception 'IDEA_NOT_FOUND'; end if;

  if v_run.status not in ('queued','running') then raise exception 'ACTION_RUN_NOT_STARTABLE'; end if;

  v_targets_current:=app_private.idea_g2_run_targets_current_v2(v_run.id);

  if v_idea.blueprint_id<>'SITE_VITRINE'
     or v_idea.blueprint_version<>'0.5'
     or v_idea.blueprint_status<>'active' then
    update public.idea_action_runs set status='stale',stale_reason='G2_BLUEPRINT_CHANGED_BEFORE_START',completed_at=coalesce(completed_at,now()),completed_engine_revision=v_idea.engine_revision where id=v_run.id;
    return jsonb_build_object('action_run_id',v_run.id,'status','stale','idempotent',false);
  end if;
  if v_idea.engine_revision is distinct from v_run.created_engine_revision then
    update public.idea_action_runs set status='stale',stale_reason='IDEA_REVISION_CHANGED_BEFORE_G2_START',completed_at=coalesce(completed_at,now()),completed_engine_revision=v_idea.engine_revision where id=v_run.id;
    return jsonb_build_object('action_run_id',v_run.id,'status','stale','idempotent',false);
  end if;
  if v_run.input_fingerprint is distinct from p_current_input_fingerprint then
    update public.idea_action_runs set status='stale',stale_reason='INPUT_CHANGED_BEFORE_G2_START',completed_at=coalesce(completed_at,now()),completed_engine_revision=v_idea.engine_revision where id=v_run.id;
    return jsonb_build_object('action_run_id',v_run.id,'status','stale','idempotent',false);
  end if;
  if not v_targets_current then
    update public.idea_action_runs set status='stale',stale_reason='TARGET_REQUIREMENT_CHANGED_BEFORE_G2_START',completed_at=coalesce(completed_at,now()),completed_engine_revision=v_idea.engine_revision where id=v_run.id;
    return jsonb_build_object('action_run_id',v_run.id,'status','stale','idempotent',false);
  end if;

  if v_run.status='running' then
    return jsonb_build_object('action_run_id',v_run.id,'status','running','idempotent',true);
  end if;

  update public.idea_action_runs set status='running',started_at=coalesce(started_at,now()) where id=v_run.id;
  return jsonb_build_object('action_run_id',v_run.id,'status','running','idempotent',false);
end;
$function$;

revoke all on function public.start_g2_action_run_candidate_v1(uuid,text)
from public,anon,authenticated;
grant execute on function public.start_g2_action_run_candidate_v1(uuid,text) to service_role;

create or replace function public.retry_g2_action_run_candidate_v1(
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
  select * into v_run from public.idea_action_runs where id=p_action_run_id for update;
  if v_run.id is null then raise exception 'ACTION_RUN_NOT_FOUND'; end if;
  if v_run.acquisition_path not in ('MEM','RAW','SRC','AUDIT','CONN','WEB','CALC','AI_H','AI_R') then
    raise exception 'G2_ACTION_PATH_REQUIRED';
  end if;
  select * into v_idea from public.ideas where id=v_run.idea_id for update;
  if v_idea.id is null then raise exception 'IDEA_NOT_FOUND'; end if;
  if v_run.status not in ('queued','failed') then raise exception 'ACTION_RUN_NOT_RETRYABLE'; end if;

  v_targets_current:=app_private.idea_g2_run_targets_current_v2(v_run.id);

  if v_idea.blueprint_id<>'SITE_VITRINE'
     or v_idea.blueprint_version<>'0.5'
     or v_idea.blueprint_status<>'active' then
    update public.idea_action_runs set status='stale',stale_reason='G2_BLUEPRINT_CHANGED_BEFORE_RETRY' where id=v_run.id;
    return jsonb_build_object('action_run_id',v_run.id,'status','stale','attempt',v_run.attempt,'idempotent',false);
  end if;
  if v_idea.engine_revision is distinct from v_run.created_engine_revision then
    update public.idea_action_runs set status='stale',stale_reason='IDEA_REVISION_CHANGED_BEFORE_G2_RETRY' where id=v_run.id;
    return jsonb_build_object('action_run_id',v_run.id,'status','stale','attempt',v_run.attempt,'idempotent',false);
  end if;
  if v_run.input_fingerprint is distinct from p_current_input_fingerprint then
    update public.idea_action_runs set status='stale',stale_reason='INPUT_CHANGED_BEFORE_G2_RETRY' where id=v_run.id;
    return jsonb_build_object('action_run_id',v_run.id,'status','stale','attempt',v_run.attempt,'idempotent',false);
  end if;
  if not v_targets_current then
    update public.idea_action_runs set status='stale',stale_reason='TARGET_REQUIREMENT_CHANGED_BEFORE_G2_RETRY' where id=v_run.id;
    return jsonb_build_object('action_run_id',v_run.id,'status','stale','attempt',v_run.attempt,'idempotent',false);
  end if;

  if v_run.status='queued' then
    return jsonb_build_object('action_run_id',v_run.id,'status','queued','attempt',v_run.attempt,'idempotent',true);
  end if;

  update public.idea_action_runs
  set status='queued',attempt=attempt+1,error_code=null,result='{}'::jsonb,proposed_mutations='[]'::jsonb,
      result_fingerprint=null,latency_ms=null,cost_metadata='{}'::jsonb,started_at=null,completed_at=null,
      completed_engine_revision=null,stale_reason=null
  where id=v_run.id returning attempt into v_attempt;

  return jsonb_build_object('action_run_id',v_run.id,'status','queued','attempt',v_attempt,'idempotent',false);
end;
$function$;

revoke all on function public.retry_g2_action_run_candidate_v1(uuid,text)
from public,anon,authenticated;
grant execute on function public.retry_g2_action_run_candidate_v1(uuid,text) to service_role;

create or replace function public.complete_g2_action_run_candidate_v1(
  p_action_run_id uuid,
  p_current_input_fingerprint text,
  p_result jsonb,
  p_proposed_mutations jsonb,
  p_latency_ms integer,
  p_cost_metadata jsonb
) returns jsonb
language plpgsql
security definer
set search_path=''
as $function$
declare
  v_run public.idea_action_runs;
  v_idea public.ideas;
  v_targets_current boolean;
  v_result jsonb:=coalesce(p_result,'{}'::jsonb);
  v_result_fp text;
  v_reason text;
begin
  if p_proposed_mutations is null or jsonb_typeof(p_proposed_mutations)<>'array' then raise exception 'PROPOSED_MUTATIONS_MUST_BE_ARRAY'; end if;
  if p_latency_ms is not null and p_latency_ms<0 then raise exception 'INVALID_LATENCY'; end if;
  if p_cost_metadata is null or jsonb_typeof(p_cost_metadata)<>'object' then raise exception 'INVALID_COST_METADATA'; end if;

  v_result_fp:=md5(jsonb_build_object('result',v_result,'proposed_mutations',p_proposed_mutations)::text);
  select * into v_run from public.idea_action_runs where id=p_action_run_id for update;
  if v_run.id is null then raise exception 'ACTION_RUN_NOT_FOUND'; end if;
  if v_run.acquisition_path not in ('MEM','RAW','SRC','AUDIT','CONN','WEB','CALC','AI_H','AI_R') then raise exception 'G2_ACTION_PATH_REQUIRED'; end if;
  select * into v_idea from public.ideas where id=v_run.idea_id for update;
  if v_idea.id is null then raise exception 'IDEA_NOT_FOUND'; end if;

  if v_run.status in ('succeeded','stale') and v_run.result_fingerprint=v_result_fp then
    return jsonb_build_object('action_run_id',v_run.id,'status',v_run.status,'promotable',v_run.status='succeeded' and v_run.promoted_at is null,'idempotent',true);
  end if;
  if v_run.status in ('succeeded','stale','failed','cancelled') then raise exception 'ACTION_RUN_ALREADY_COMPLETED'; end if;
  if v_run.status<>'running' then raise exception 'ACTION_RUN_NOT_RUNNING'; end if;

  v_targets_current:=app_private.idea_g2_run_targets_current_v2(v_run.id);
  v_reason:=null;
  if v_idea.blueprint_id<>'SITE_VITRINE' or v_idea.blueprint_version<>'0.5' or v_idea.blueprint_status<>'active' then
    v_reason:='G2_BLUEPRINT_CHANGED_DURING_RUN';
  elsif v_idea.engine_revision is distinct from v_run.created_engine_revision then
    v_reason:='IDEA_REVISION_CHANGED_DURING_G2_RUN';
  elsif v_run.input_fingerprint is distinct from p_current_input_fingerprint then
    v_reason:='INPUT_CHANGED_DURING_G2_RUN';
  elsif not v_targets_current then
    v_reason:='TARGET_REQUIREMENT_CHANGED_DURING_G2_RUN';
  end if;

  if v_reason is not null then
    update public.idea_action_runs
    set status='stale',result=v_result,proposed_mutations=p_proposed_mutations,result_fingerprint=v_result_fp,
        stale_reason=v_reason,latency_ms=p_latency_ms,cost_metadata=p_cost_metadata,
        completed_at=now(),completed_engine_revision=v_idea.engine_revision
    where id=v_run.id;
    return jsonb_build_object('action_run_id',v_run.id,'status','stale','promotable',false,'stale_reason',v_reason,'idempotent',false);
  end if;

  return public.complete_action_run_v1(
    p_action_run_id,p_current_input_fingerprint,v_result,p_proposed_mutations,p_latency_ms,p_cost_metadata
  );
end;
$function$;

revoke all on function public.complete_g2_action_run_candidate_v1(uuid,text,jsonb,jsonb,integer,jsonb)
from public,anon,authenticated;
grant execute on function public.complete_g2_action_run_candidate_v1(uuid,text,jsonb,jsonb,integer,jsonb)
to service_role;

-- Invariants:
-- - every G2 Action Run path shares the same Blueprint/revision/target-basis guards;
-- - queued retry is idempotent only while the run is still current;
-- - completion stores stale output for audit but marks it non-promotable if context drifted;
-- - research vs non-research divergence exists only at creation/promotion mutation contracts;
-- - G1 lifecycle RPCs remain untouched.