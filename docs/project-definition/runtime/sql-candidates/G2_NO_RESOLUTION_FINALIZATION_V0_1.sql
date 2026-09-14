-- 4b4c / 2b2c — G2 no-resolution Action finalization V0.1
-- Date: 2026-09-15
-- STATUS: COMPILE/ROLLBACK CANDIDATE ONLY — DO NOT APPLY AS A MIGRATION.
--
-- Purpose:
--   Allow a correctly executed G2 Action Run to terminate honestly when current
--   inputs cannot produce a valid resolving mutation. No fake Information Item,
--   no no-op Ledger entry and no Idea revision bump are needed.
--
-- Planner V0.10 already treats a succeeded+promoted run on the same path+basis as
-- exhausted. This RPC uses promoted_at as the canonical finalization marker while
-- recording explicitly that zero mutations were promoted.

create or replace function public.finalize_g2_action_no_resolution_candidate_v1(
  p_action_run_id uuid,
  p_current_input_fingerprint text,
  p_expected_attempt integer,
  p_terminal_reason text
) returns jsonb
language plpgsql
security definer
set search_path=''
as $function$
declare
  v_run public.idea_action_runs;
  v_idea public.ideas;
  v_reason text:=upper(btrim(coalesce(p_terminal_reason,'')));
  v_allowed constant text[]:=array[
    'INPUTS_INSUFFICIENT',
    'NO_SUPPORTED_FINDING',
    'NO_SAFE_SOURCE_RESULT',
    'DETERMINISTIC_NOT_DECIDABLE',
    'PROVIDER_RESULT_NOT_USABLE'
  ]::text[];
begin
  if p_expected_attempt is null or p_expected_attempt<1 then raise exception 'EXPECTED_ATTEMPT_REQUIRED'; end if;
  if v_reason='' or not (v_reason=any(v_allowed)) then raise exception 'INVALID_TERMINAL_REASON'; end if;

  select * into v_run from public.idea_action_runs where id=p_action_run_id for update;
  if v_run.id is null then raise exception 'ACTION_RUN_NOT_FOUND'; end if;
  if v_run.acquisition_path not in ('MEM','RAW','SRC','AUDIT','CONN','WEB','CALC','AI_H','AI_R') then raise exception 'G2_ACTION_PATH_REQUIRED'; end if;
  if v_run.attempt<>p_expected_attempt then raise exception 'ACTION_RUN_ATTEMPT_STALE'; end if;

  select * into v_idea from public.ideas where id=v_run.idea_id for update;
  if v_idea.id is null then raise exception 'IDEA_NOT_FOUND'; end if;

  if v_run.promoted_at is not null then
    if v_run.result->>'terminal_outcome'='NO_RESOLUTION' then
      return jsonb_build_object('action_run_id',v_run.id,'finalized',true,'status','no_resolution','attempt',v_run.attempt,'engine_revision',v_run.promoted_engine_revision,'idempotent',true);
    end if;
    raise exception 'ACTION_RUN_ALREADY_PROMOTED';
  end if;

  if v_run.status<>'succeeded' then raise exception 'ACTION_RUN_NOT_FINALIZABLE'; end if;
  if jsonb_array_length(v_run.proposed_mutations)<>0 then raise exception 'NO_RESOLUTION_REQUIRES_EMPTY_MUTATIONS'; end if;
  if v_run.result->>'terminal_outcome'<>'NO_RESOLUTION' then raise exception 'NO_RESOLUTION_RESULT_REQUIRED'; end if;
  if upper(coalesce(v_run.result->>'terminal_reason',''))<>v_reason then raise exception 'TERMINAL_REASON_MISMATCH'; end if;

  if not app_private.idea_g2_run_context_current_v3(v_run.id,p_current_input_fingerprint) then
    update public.idea_action_runs set status='stale',stale_reason='G2_CONTEXT_CHANGED_BEFORE_NO_RESOLUTION_FINALIZATION',updated_at=now() where id=v_run.id;
    return jsonb_build_object('action_run_id',v_run.id,'finalized',false,'status','stale','attempt',v_run.attempt,'engine_revision',v_idea.engine_revision,'idempotent',false);
  end if;

  update public.idea_action_runs
  set promoted_at=now(),promoted_engine_revision=v_idea.engine_revision,updated_at=now()
  where id=v_run.id;

  insert into public.audit_events(workspace_id,actor_id,event_type,entity_type,entity_id,payload)
  values(
    v_idea.workspace_id,null,'idea.g2_action_no_resolution_finalized','idea_action_run',v_run.id,
    jsonb_build_object(
      'idea_id',v_run.idea_id,'action_type',v_run.action_type,'acquisition_path',v_run.acquisition_path,
      'attempt',v_run.attempt,'terminal_reason',v_reason,'engine_revision',v_idea.engine_revision,
      'information_items_created',0,'ledger_entries_created',0,'source_mutations',0
    )
  );

  return jsonb_build_object(
    'action_run_id',v_run.id,'finalized',true,'status','no_resolution','attempt',v_run.attempt,
    'terminal_reason',v_reason,'engine_revision',v_idea.engine_revision,'idempotent',false
  );
end;
$function$;

revoke all on function public.finalize_g2_action_no_resolution_candidate_v1(uuid,text,integer,text)
from public,anon,authenticated;
grant execute on function public.finalize_g2_action_no_resolution_candidate_v1(uuid,text,integer,text)
to service_role;

-- Invariants:
-- - no fabricated mutation is required to terminate an executor;
-- - only an empty-mutation succeeded run with explicit NO_RESOLUTION result may finalize;
-- - exact attempt/input/Blueprint/revision/target basis remain mandatory;
-- - finalization does not increment Idea engine_revision;
-- - promoted_at records terminal processing, allowing the planner to exhaust that path on the same basis;
-- - a later material basis change naturally allows a new Action Run.
