-- 4b4c / 2b2c — G2 Evidence Planner V0.11 — recoverable Action Runs
-- Date: 2026-09-15
-- STATUS: COMPILE/ROLLBACK CANDIDATE ONLY — DO NOT APPLY AS A MIGRATION.
-- Wraps validated planner V0.10 and adds interruption recovery semantics.
-- Requires G2_ACTION_LIFECYCLE_V0_3_ATTEMPT_FENCED.sql.

create or replace function public.plan_idea_evidence_context_candidate_v11(
  p_idea_id uuid,
  p_expected_engine_revision bigint,
  p_available_paths text[],
  p_raw_context_available boolean default true
) returns jsonb
language plpgsql
security definer
set search_path=''
as $function$
declare
  v_plan jsonb;
  v_run public.idea_action_runs;
  v_target text;
  v_recoverable jsonb:='[]'::jsonb;
  v_inflight jsonb:='[]'::jsonb;
  v_recovery_blocked jsonb:='[]'::jsonb;
  v_path_still_resolving boolean;
  v_mode text;
  v_lease_seconds constant integer:=300;
  v_started_at timestamptz;
  v_base_fp text;
begin
  if p_available_paths is null then p_available_paths:=array[]::text[]; end if;

  v_plan:=public.plan_idea_evidence_context_candidate_v10(
    p_idea_id,p_expected_engine_revision,p_available_paths,p_raw_context_available
  );

  -- Scan only current-basis, current-revision, unpromoted work. The base planner already
  -- suppresses duplicate eligible actions for these runs; V0.11 decides whether the
  -- existing run is truly inflight or safely recoverable.
  for v_run in
    select ar.*
    from public.idea_action_runs ar
    where ar.idea_id=p_idea_id
      and ar.created_engine_revision=p_expected_engine_revision
      and (
        ar.status in ('queued','running')
        or (ar.status='succeeded' and ar.promoted_at is null)
      )
      and app_private.idea_g2_run_targets_current_v2(ar.id)
    order by ar.created_at asc,ar.id
  loop
    v_path_still_resolving:=true;
    foreach v_target in array coalesce(v_run.target_requirement_ids,array[]::text[]) loop
      if v_target='SV.D04.CREATION_OR_REDESIGN' then
        if v_run.acquisition_path<>'RAW' then v_path_still_resolving:=false; exit; end if;
      elsif not app_private.idea_g2_path_can_resolve_v1(v_target,v_run.acquisition_path) then
        v_path_still_resolving:=false; exit;
      end if;
    end loop;

    -- A succeeded run can still be promoted even if provider capability disappeared;
    -- no external work is required at this point. A path that no longer satisfies policy
    -- is deliberately not resurrected.
    if not v_path_still_resolving then
      v_recovery_blocked:=v_recovery_blocked||jsonb_build_array(jsonb_build_object(
        'action_run_id',v_run.id,'acquisition_path',v_run.acquisition_path,
        'target_requirement_ids',to_jsonb(v_run.target_requirement_ids),
        'attempt',v_run.attempt,'reason','PATH_NO_LONGER_RESOLVING'
      ));
      continue;
    end if;

    if v_run.status='succeeded' and v_run.promoted_at is null then
      v_mode:='PROMOTE';
      v_recoverable:=v_recoverable||jsonb_build_array(jsonb_build_object(
        'action_run_id',v_run.id,'mode',v_mode,'acquisition_path',v_run.acquisition_path,
        'input_fingerprint',v_run.input_fingerprint,'attempt',v_run.attempt,
        'target_requirement_ids',to_jsonb(v_run.target_requirement_ids),
        'target_requirement_fingerprints',v_run.target_requirement_fingerprints
      ));
      continue;
    end if;

    if v_run.status='queued' then
      if v_run.acquisition_path=any(p_available_paths) then
        v_mode:='START';
        v_recoverable:=v_recoverable||jsonb_build_array(jsonb_build_object(
          'action_run_id',v_run.id,'mode',v_mode,'acquisition_path',v_run.acquisition_path,
          'input_fingerprint',v_run.input_fingerprint,'attempt',v_run.attempt,
          'target_requirement_ids',to_jsonb(v_run.target_requirement_ids),
          'target_requirement_fingerprints',v_run.target_requirement_fingerprints
        ));
      else
        v_recovery_blocked:=v_recovery_blocked||jsonb_build_array(jsonb_build_object(
          'action_run_id',v_run.id,'acquisition_path',v_run.acquisition_path,
          'target_requirement_ids',to_jsonb(v_run.target_requirement_ids),
          'attempt',v_run.attempt,'reason','EXECUTOR_CAPABILITY_UNAVAILABLE'
        ));
      end if;
      continue;
    end if;

    if v_run.status='running' then
      v_started_at:=coalesce(v_run.started_at,v_run.updated_at,v_run.created_at);
      if v_started_at + make_interval(secs=>v_lease_seconds) <= now() then
        if v_run.acquisition_path=any(p_available_paths) then
          v_mode:='RECOVER_EXPIRED';
          v_recoverable:=v_recoverable||jsonb_build_array(jsonb_build_object(
            'action_run_id',v_run.id,'mode',v_mode,'acquisition_path',v_run.acquisition_path,
            'input_fingerprint',v_run.input_fingerprint,'attempt',v_run.attempt,
            'started_at',v_started_at,'lease_seconds',v_lease_seconds,
            'target_requirement_ids',to_jsonb(v_run.target_requirement_ids),
            'target_requirement_fingerprints',v_run.target_requirement_fingerprints
          ));
        else
          v_recovery_blocked:=v_recovery_blocked||jsonb_build_array(jsonb_build_object(
            'action_run_id',v_run.id,'acquisition_path',v_run.acquisition_path,
            'target_requirement_ids',to_jsonb(v_run.target_requirement_ids),
            'attempt',v_run.attempt,'reason','EXECUTOR_CAPABILITY_UNAVAILABLE_AFTER_LEASE'
          ));
        end if;
      else
        foreach v_target in array coalesce(v_run.target_requirement_ids,array[]::text[]) loop
          v_inflight:=v_inflight||jsonb_build_array(jsonb_build_object(
            'requirement_id',v_target,
            'basis_fingerprint',v_run.target_requirement_fingerprints->>v_target,
            'action_run_id',v_run.id,'acquisition_path',v_run.acquisition_path,
            'attempt',v_run.attempt,'started_at',v_started_at,
            'lease_expires_at',v_started_at+make_interval(secs=>v_lease_seconds)
          ));
        end loop;
      end if;
    end if;
  end loop;

  v_base_fp:=coalesce(v_plan->>'projection_fingerprint','');
  v_plan:=jsonb_set(v_plan,'{inflight_requirements}',v_inflight,true);
  v_plan:=jsonb_set(v_plan,'{recoverable_action_runs}',v_recoverable,true);
  v_plan:=jsonb_set(v_plan,'{recovery_blocked_action_runs}',v_recovery_blocked,true);
  v_plan:=jsonb_set(v_plan,'{action_run_lease_seconds}',to_jsonb(v_lease_seconds),true);
  v_plan:=jsonb_set(
    v_plan,'{projection_fingerprint}',
    to_jsonb(md5(jsonb_build_object(
      'base_projection_fingerprint',v_base_fp,
      'inflight',v_inflight,
      'recoverable',v_recoverable,
      'recovery_blocked',v_recovery_blocked,
      'lease_seconds',v_lease_seconds
    )::text)),true
  );

  return v_plan;
end;
$function$;

revoke all on function public.plan_idea_evidence_context_candidate_v11(uuid,bigint,text[],boolean)
from public,anon,authenticated;
grant execute on function public.plan_idea_evidence_context_candidate_v11(uuid,bigint,text[],boolean)
to service_role;

-- V0.11 invariants:
-- - queued current work is resumed, not duplicated;
-- - recent running current work stays inflight;
-- - running work older than 5 minutes becomes recoverable, never silently duplicated;
-- - succeeded/unpromoted work becomes PROMOTE-recoverable;
-- - unavailable executor capability is explicit, not converted to a generic human question;
-- - recovery never bypasses current Requirement basis or resolution-path policy;
-- - recovery state participates in the planner projection fingerprint.
