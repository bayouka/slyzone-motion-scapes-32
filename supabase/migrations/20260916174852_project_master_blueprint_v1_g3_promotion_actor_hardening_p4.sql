-- 4b4c Project Master Blueprint V1 — canonical G3 promotion actor hardening P4
-- Browser never supplies service credentials. The Worker must inject the authenticated JWT user id.

create or replace function public.promote_canonical_approved_idea_to_project_definition_v2(
  p_decision_record_id uuid,
  p_actor_id uuid,
  p_expected_engine_revision bigint,
  p_baseline_manifest jsonb,
  p_promotion_diff jsonb,
  p_artifact_promotions jsonb,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_decision public.idea_decision_records_v2;
  v_idea public.ideas;
  v_authorized boolean := false;
  v_eval jsonb;
  v_g2 jsonb;
  v_result jsonb;
begin
  if p_actor_id is null then raise exception 'PROMOTION_ACTOR_REQUIRED'; end if;

  select * into v_decision from public.idea_decision_records_v2 where id=p_decision_record_id;
  if v_decision.id is null then raise exception 'DECISION_RECORD_NOT_FOUND'; end if;

  select * into v_idea from public.ideas where id=v_decision.idea_id;
  if v_idea.id is null then raise exception 'IDEA_NOT_FOUND'; end if;

  select (
    v_idea.created_by=p_actor_id
    or exists(
      select 1 from public.workspace_members wm
      where wm.workspace_id=v_idea.workspace_id
        and wm.user_id=p_actor_id
        and wm.status='active'
        and wm.role in ('owner','admin')
    )
  ) into v_authorized;
  if not coalesce(v_authorized,false) then raise exception 'PROJECT_PROMOTION_ACTOR_NOT_AUTHORIZED'; end if;

  v_eval := public.get_canonical_idea_preproject_readiness_v1(v_decision.idea_id);
  v_g2 := v_eval->'formal_gates'->'G2_GO_PROJECT';

  if not coalesce((v_g2->>'ready')::boolean,false) then raise exception 'CANONICAL_G2_NOT_READY'; end if;
  if p_decision_record_id::text is distinct from (v_g2->>'decision_record_id') then raise exception 'CANONICAL_G2_DECISION_MISMATCH'; end if;
  if p_expected_engine_revision is distinct from (v_eval->'idea'->>'engine_revision')::bigint then raise exception 'STALE_ENGINE'; end if;

  v_result := public.promote_approved_idea_to_project_definition_v1(
    p_decision_record_id,p_expected_engine_revision,p_baseline_manifest,p_promotion_diff,p_artifact_promotions,p_idempotency_key
  );

  return v_result || jsonb_build_object(
    'canonical_gate_id','G3_PROJECT_BASELINE',
    'canonical_g2_fingerprint',v_g2->>'evaluation_fingerprint',
    'authorized_by',p_actor_id
  );
end;
$$;

revoke all on function public.promote_canonical_approved_idea_to_project_definition_v2(uuid,uuid,bigint,jsonb,jsonb,jsonb,text) from public,anon,authenticated;
grant execute on function public.promote_canonical_approved_idea_to_project_definition_v2(uuid,uuid,bigint,jsonb,jsonb,jsonb,text) to service_role;
