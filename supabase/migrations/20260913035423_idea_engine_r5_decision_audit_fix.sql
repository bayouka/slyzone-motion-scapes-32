-- 4b4c Idea Engine R5 corrective migration
-- Forward-only fix: keep canonical migration history additive and align record_idea_decision_v2 with the live audit_events contract.

create or replace function public.record_idea_decision_v2(
  p_package_id uuid,
  p_decided_by uuid,
  p_outcome text,
  p_rationale text,
  p_conditions jsonb,
  p_conditions_resolved boolean,
  p_gate_g7_ready boolean,
  p_gate_evaluation_fingerprint text,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_pkg public.idea_decision_packages;
  v_idea public.ideas;
  v_existing public.idea_decision_records_v2;
  v_record_id uuid;
  v_authorized boolean;
  v_promotable boolean := false;
  v_fp text;
  v_hash text;
  v_outputs_fresh boolean;
begin
  if p_outcome not in ('APPROVE_TO_PROJECT','APPROVE_WITH_CHANGES','REVISE','DEEPEN_RESEARCH','PAUSE','STOP','INSUFFICIENT_INFORMATION') then raise exception 'INVALID_DECISION_OUTCOME'; end if;
  if p_conditions is null or jsonb_typeof(p_conditions)<>'array' then raise exception 'DECISION_CONDITIONS_MUST_BE_ARRAY'; end if;
  if nullif(btrim(p_gate_evaluation_fingerprint),'') is null then raise exception 'GATE_EVALUATION_FINGERPRINT_REQUIRED'; end if;
  if nullif(btrim(p_idempotency_key),'') is null then raise exception 'IDEMPOTENCY_KEY_REQUIRED'; end if;

  select * into v_pkg from public.idea_decision_packages where id=p_package_id for update;
  if v_pkg.id is null then raise exception 'DECISION_PACKAGE_NOT_FOUND'; end if;
  select * into v_idea from public.ideas where id=v_pkg.idea_id for update;
  if v_pkg.state<>'current' then raise exception 'DECISION_PACKAGE_NOT_CURRENT'; end if;
  if v_pkg.snapshot_engine_revision<>v_idea.engine_revision then raise exception 'DECISION_PACKAGE_STALE'; end if;
  select coalesce(bool_and(a.freshness_status='fresh' and a.input_fingerprint=v_pkg.snapshot_content_hash),false) into v_outputs_fresh from public.idea_artifacts a where a.id=any(v_pkg.output_artifact_ids);
  if not v_outputs_fresh then raise exception 'DECISION_PACKAGE_OUTPUT_STALE'; end if;

  select (
    v_idea.created_by=p_decided_by
    or exists(select 1 from public.workspace_members wm where wm.workspace_id=v_idea.workspace_id and wm.user_id=p_decided_by and wm.status='active' and wm.role in ('owner','admin'))
  ) into v_authorized;
  if not coalesce(v_authorized,false) then raise exception 'DECISION_OWNER_NOT_AUTHORIZED'; end if;

  if p_outcome='APPROVE_TO_PROJECT' then
    if not p_gate_g7_ready or not p_conditions_resolved then raise exception 'APPROVAL_NOT_PROMOTABLE'; end if;
    v_promotable := true;
  elsif p_outcome='APPROVE_WITH_CHANGES' then
    v_promotable := p_gate_g7_ready and p_conditions_resolved;
  else
    v_promotable := false;
  end if;

  v_fp := md5(jsonb_build_object('package_id',p_package_id,'decided_by',p_decided_by,'outcome',p_outcome,'rationale',coalesce(p_rationale,''),'conditions',p_conditions,'conditions_resolved',p_conditions_resolved,'gate_g7_ready',p_gate_g7_ready,'gate_evaluation_fingerprint',p_gate_evaluation_fingerprint)::text);
  select * into v_existing from public.idea_decision_records_v2 where idea_id=v_idea.id and idempotency_key=p_idempotency_key;
  if v_existing.id is not null then
    if v_existing.request_fingerprint is distinct from v_fp then raise exception 'IDEMPOTENCY_KEY_REUSE'; end if;
    return jsonb_build_object('decision_record_id',v_existing.id,'outcome',v_existing.outcome,'promotable',v_existing.promotable,'idempotent',true);
  end if;

  v_hash := md5(jsonb_build_object('snapshot_id',v_pkg.decision_snapshot_id,'package_hash',v_pkg.package_hash,'outcome',p_outcome,'rationale',coalesce(p_rationale,''),'conditions',p_conditions,'conditions_resolved',p_conditions_resolved,'gate_g7_ready',p_gate_g7_ready,'gate_fp',p_gate_evaluation_fingerprint,'decided_by',p_decided_by)::text);
  insert into public.idea_decision_records_v2(
    idea_id,package_id,decision_snapshot_id,outcome,rationale,conditions,conditions_resolved,gate_g7_ready,gate_evaluation_fingerprint,promotable,decided_by,decided_engine_revision,decision_hash,idempotency_key,request_fingerprint
  ) values (
    v_idea.id,v_pkg.id,v_pkg.decision_snapshot_id,p_outcome,coalesce(p_rationale,''),p_conditions,p_conditions_resolved,p_gate_g7_ready,p_gate_evaluation_fingerprint,v_promotable,p_decided_by,v_idea.engine_revision,v_hash,p_idempotency_key,v_fp
  ) returning id into v_record_id;

  update public.idea_decision_packages set state='frozen',frozen_at=now() where id=v_pkg.id;
  update public.idea_artifacts set state='frozen',frozen_at=coalesce(frozen_at,now()) where id=any(v_pkg.output_artifact_ids) and state='current';

  insert into public.audit_events(workspace_id,actor_id,event_type,entity_type,entity_id,payload)
  values(v_idea.workspace_id,p_decided_by,'idea.decision_recorded_v2','idea_decision_record_v2',v_record_id,jsonb_build_object('idea_id',v_idea.id,'package_id',v_pkg.id,'outcome',p_outcome,'promotable',v_promotable,'engine_revision',v_idea.engine_revision));

  return jsonb_build_object('decision_record_id',v_record_id,'outcome',p_outcome,'promotable',v_promotable,'engine_revision',v_idea.engine_revision,'idempotent',false);
end;
$$;

revoke all on function public.record_idea_decision_v2(uuid,uuid,text,text,jsonb,boolean,boolean,text,text) from public,anon,authenticated;
grant execute on function public.record_idea_decision_v2(uuid,uuid,text,text,jsonb,boolean,boolean,text,text) to service_role;
