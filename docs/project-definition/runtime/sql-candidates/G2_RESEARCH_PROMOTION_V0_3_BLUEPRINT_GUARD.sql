-- 4b4c / 2b2c — G2 research promotion V0.3 — Blueprint guard entrypoint
-- Date: 2026-09-13
-- STATUS: COMPILE/ROLLBACK CANDIDATE ONLY — DO NOT APPLY AS A MIGRATION.
-- Requires promote_research_action_result_v2 from atomic promotion V0.2 hardening.

create or replace function public.promote_research_action_result_v3(
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
begin
  select * into v_run
  from public.idea_action_runs
  where id=p_action_run_id
  for update;
  if v_run.id is null then raise exception 'ACTION_RUN_NOT_FOUND'; end if;
  if v_run.acquisition_path not in ('WEB','AUDIT','CONN') then
    raise exception 'RESEARCH_PROMOTION_PATH_FORBIDDEN';
  end if;

  select * into v_idea
  from public.ideas
  where id=v_run.idea_id
  for update;
  if v_idea.id is null then raise exception 'IDEA_NOT_FOUND'; end if;

  -- A previously promoted run stays historically idempotent even after later Blueprint change.
  if v_run.promoted_at is not null then
    return public.promote_research_action_result_v2(
      p_action_run_id,p_current_input_fingerprint
    );
  end if;

  if v_idea.blueprint_id<>'SITE_VITRINE'
     or v_idea.blueprint_version<>'0.5'
     or v_idea.blueprint_status<>'active'
  then
    if v_run.status='succeeded' then
      update public.idea_action_runs
      set status='stale',stale_reason='G2_BLUEPRINT_CHANGED_BEFORE_RESEARCH_PROMOTION'
      where id=v_run.id;
    end if;
    return jsonb_build_object(
      'action_run_id',v_run.id,
      'promoted',false,
      'status','stale',
      'engine_revision',v_idea.engine_revision,
      'idempotent',false
    );
  end if;

  return public.promote_research_action_result_v2(
    p_action_run_id,p_current_input_fingerprint
  );
end;
$function$;

revoke all on function public.promote_research_action_result_v3(uuid,text)
from public,anon,authenticated;
grant execute on function public.promote_research_action_result_v3(uuid,text)
to service_role;

-- Final promotion entrypoint invariants:
-- - unpromoted research can promote only under active SITE_VITRINE@0.5;
-- - later Blueprint changes do not break idempotent reads of already-promoted history;
-- - all atomic Source/observation/lineage validation remains owned by V2 implementation;
-- - G1 promote_action_result_v1 remains untouched.
