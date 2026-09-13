create or replace function public.retry_action_run_v1(p_action_run_id uuid,p_current_input_fingerprint text)
returns jsonb
language plpgsql
security definer
set search_path=''
as $function$
declare
  v_run public.idea_action_runs;
  v_revision bigint;
begin
  select * into v_run from public.idea_action_runs where id=p_action_run_id for update;
  if v_run.id is null then raise exception 'ACTION_RUN_NOT_FOUND'; end if;
  select engine_revision into v_revision from public.ideas where id=v_run.idea_id for update;

  if v_run.status='queued' then
    return jsonb_build_object('action_run_id',v_run.id,'status','queued','attempt',v_run.attempt,'idempotent',true);
  end if;
  if v_run.status<>'failed' then raise exception 'ACTION_RUN_NOT_RETRYABLE'; end if;

  if v_run.input_fingerprint is distinct from p_current_input_fingerprint then
    update public.idea_action_runs
    set status='stale',stale_reason='INPUT_CHANGED_BEFORE_RETRY'
    where id=v_run.id;
    return jsonb_build_object('action_run_id',v_run.id,'status','stale','attempt',v_run.attempt,'idempotent',false);
  end if;

  update public.idea_action_runs
  set status='queued',attempt=attempt+1,error_code=null,result='{}'::jsonb,proposed_mutations='[]'::jsonb,
      result_fingerprint=null,latency_ms=null,cost_metadata='{}'::jsonb,started_at=null,completed_at=null,
      completed_engine_revision=null,stale_reason=null
  where id=v_run.id
  returning attempt into v_run.attempt;

  return jsonb_build_object('action_run_id',v_run.id,'status','queued','attempt',v_run.attempt,'idempotent',false);
end;
$function$;

revoke all on function public.retry_action_run_v1(uuid,text) from public, anon, authenticated;
grant execute on function public.retry_action_run_v1(uuid,text) to service_role;