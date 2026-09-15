create or replace function public.classify_g2_action_promotion_candidate_v1(
  p_action_run_id uuid,
  p_current_input_fingerprint text,
  p_expected_attempt integer
) returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $function$
declare
  v_run public.idea_action_runs;
  v_reason text;
  v_mutation_count integer;
  v_allowed constant text[]:=array[
    'INPUTS_INSUFFICIENT',
    'NO_SUPPORTED_FINDING',
    'NO_SAFE_SOURCE_RESULT',
    'DETERMINISTIC_NOT_DECIDABLE',
    'PROVIDER_RESULT_NOT_USABLE'
  ]::text[];
begin
  if p_expected_attempt is null or p_expected_attempt<1 then raise exception 'EXPECTED_ATTEMPT_REQUIRED'; end if;

  select * into v_run from public.idea_action_runs where id=p_action_run_id;
  if v_run.id is null then raise exception 'ACTION_RUN_NOT_FOUND'; end if;
  if v_run.acquisition_path not in ('MEM','RAW','SRC','AUDIT','CONN','WEB','CALC','AI_H','AI_R') then raise exception 'G2_ACTION_PATH_REQUIRED'; end if;
  if v_run.attempt<>p_expected_attempt then raise exception 'ACTION_RUN_ATTEMPT_STALE'; end if;
  if v_run.input_fingerprint is distinct from p_current_input_fingerprint then raise exception 'ACTION_RUN_INPUT_STALE'; end if;

  if v_run.promoted_at is not null then
    return jsonb_build_object(
      'action_run_id',v_run.id,'attempt',v_run.attempt,'acquisition_path',v_run.acquisition_path,
      'disposition','ALREADY_FINALIZED','status',v_run.status
    );
  end if;

  if v_run.status<>'succeeded' then
    return jsonb_build_object(
      'action_run_id',v_run.id,'attempt',v_run.attempt,'acquisition_path',v_run.acquisition_path,
      'disposition','NOT_PROMOTABLE','status',v_run.status
    );
  end if;

  if not app_private.idea_g2_run_context_current_v3(v_run.id,p_current_input_fingerprint) then
    return jsonb_build_object(
      'action_run_id',v_run.id,'attempt',v_run.attempt,'acquisition_path',v_run.acquisition_path,
      'disposition','STALE_CONTEXT','status',v_run.status
    );
  end if;

  if jsonb_typeof(v_run.proposed_mutations)<>'array' then
    return jsonb_build_object(
      'action_run_id',v_run.id,'attempt',v_run.attempt,'acquisition_path',v_run.acquisition_path,
      'disposition','INVALID_RESULT','reason','MUTATIONS_NOT_ARRAY'
    );
  end if;

  v_mutation_count:=jsonb_array_length(v_run.proposed_mutations);
  if v_mutation_count=0 then
    if v_run.result->>'terminal_outcome'='NO_RESOLUTION' then
      v_reason:=upper(btrim(coalesce(v_run.result->>'terminal_reason','')));
      if v_reason='' or not (v_reason=any(v_allowed)) then
        return jsonb_build_object(
          'action_run_id',v_run.id,'attempt',v_run.attempt,'acquisition_path',v_run.acquisition_path,
          'disposition','INVALID_RESULT','reason','INVALID_NO_RESOLUTION_REASON'
        );
      end if;
      return jsonb_build_object(
        'action_run_id',v_run.id,'attempt',v_run.attempt,'acquisition_path',v_run.acquisition_path,
        'disposition','FINALIZE_NO_RESOLUTION','terminal_reason',v_reason
      );
    end if;
    return jsonb_build_object(
      'action_run_id',v_run.id,'attempt',v_run.attempt,'acquisition_path',v_run.acquisition_path,
      'disposition','INVALID_RESULT','reason','ZERO_MUTATIONS_WITHOUT_NO_RESOLUTION'
    );
  end if;

  if v_run.result->>'terminal_outcome'='NO_RESOLUTION' then
    return jsonb_build_object(
      'action_run_id',v_run.id,'attempt',v_run.attempt,'acquisition_path',v_run.acquisition_path,
      'disposition','INVALID_RESULT','reason','NO_RESOLUTION_WITH_MUTATIONS'
    );
  end if;

  return jsonb_build_object(
    'action_run_id',v_run.id,'attempt',v_run.attempt,'acquisition_path',v_run.acquisition_path,
    'disposition','PROMOTE','mutation_count',v_mutation_count
  );
end;
$function$;

revoke all on function public.classify_g2_action_promotion_candidate_v1(uuid,text,integer)
from public,anon,authenticated;
grant execute on function public.classify_g2_action_promotion_candidate_v1(uuid,text,integer)
to service_role;
