-- 4b4c / 2b2c — Blueprint Fit reclassification after material Idea change.
-- Allows G0 to reassess BLUEPRINT_MIGRATION_REQUIRED while preserving stale-safety.

create or replace function public.record_idea_blueprint_fit_assessment_v1(
  p_idea_id uuid,
  p_expected_engine_revision bigint,
  p_classification text,
  p_candidate_type text,
  p_confidence text,
  p_rationale text,
  p_evidence jsonb,
  p_auto_applicable boolean,
  p_assessor_actor text,
  p_method text,
  p_model_ref text,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_idea public.ideas;
  v_existing public.idea_blueprint_fit_assessments;
  v_id uuid;
  v_input_fp text;
  v_request_fp text;
begin
  if p_classification not in ('SITE_VITRINE','BLUEPRINT_MISMATCH','AMBIGUOUS') then raise exception 'INVALID_BLUEPRINT_CLASSIFICATION'; end if;
  if p_confidence not in ('HIGH','MEDIUM','LOW') then raise exception 'INVALID_BLUEPRINT_CONFIDENCE'; end if;
  if p_assessor_actor not in ('SYSTEM','AI') then raise exception 'INVALID_BLUEPRINT_ASSESSOR'; end if;
  if p_evidence is null or jsonb_typeof(p_evidence)<>'array' then raise exception 'BLUEPRINT_EVIDENCE_MUST_BE_ARRAY'; end if;
  if nullif(btrim(p_idempotency_key),'') is null then raise exception 'IDEMPOTENCY_KEY_REQUIRED'; end if;
  if p_auto_applicable and (p_confidence<>'HIGH' or p_classification='AMBIGUOUS') then raise exception 'AUTO_APPLY_REQUIRES_HIGH_NON_AMBIGUOUS'; end if;

  select * into v_idea from public.ideas where id=p_idea_id for update;
  if v_idea.id is null then raise exception 'IDEA_NOT_FOUND'; end if;

  v_input_fp:=app_private.blueprint_fit_input_fingerprint_v1(p_idea_id);
  v_request_fp:=md5(jsonb_build_object(
    'idea_id',p_idea_id,'revision',p_expected_engine_revision,'input_fp',v_input_fp,'classification',p_classification,
    'candidate_type',p_candidate_type,'confidence',p_confidence,'rationale',coalesce(p_rationale,''),'evidence',p_evidence,
    'auto_applicable',p_auto_applicable,'assessor_actor',p_assessor_actor,'method',p_method,'model_ref',p_model_ref
  )::text);

  select * into v_existing from public.idea_blueprint_fit_assessments where idea_id=p_idea_id and idempotency_key=p_idempotency_key;
  if v_existing.id is not null then
    if v_existing.request_fingerprint<>v_request_fp then raise exception 'IDEMPOTENCY_KEY_REUSE'; end if;
    return jsonb_build_object('assessment_id',v_existing.id,'classification',v_existing.classification,'confidence',v_existing.confidence,'auto_applicable',v_existing.auto_applicable,'state',v_existing.state,'idempotent',true);
  end if;

  if v_idea.engine_revision<>p_expected_engine_revision then raise exception 'STALE_ENGINE'; end if;
  if v_idea.blueprint_status is not null and v_idea.blueprint_status<>'migration_required' then raise exception 'BLUEPRINT_FIT_ALREADY_RESOLVED'; end if;

  update public.idea_blueprint_fit_assessments set state='superseded' where idea_id=p_idea_id and state='current';

  insert into public.idea_blueprint_fit_assessments(
    idea_id,input_engine_revision,input_fingerprint,classification,candidate_type,confidence,rationale,evidence,
    auto_applicable,assessor_actor,method,model_ref,state,idempotency_key,request_fingerprint
  ) values (
    p_idea_id,p_expected_engine_revision,v_input_fp,p_classification,nullif(btrim(p_candidate_type),''),p_confidence,
    coalesce(p_rationale,''),p_evidence,p_auto_applicable,p_assessor_actor,coalesce(nullif(btrim(p_method),''),'rule_or_model'),
    nullif(btrim(p_model_ref),''),'current',p_idempotency_key,v_request_fp
  ) returning id into v_id;

  return jsonb_build_object('assessment_id',v_id,'classification',p_classification,'confidence',p_confidence,'auto_applicable',p_auto_applicable,'input_fingerprint',v_input_fp,'state','current','idempotent',false);
end;
$$;

create or replace function app_private.resolve_idea_blueprint_fit_v1(
  p_idea_id uuid,
  p_expected_engine_revision bigint,
  p_decision text,
  p_assessment_id uuid,
  p_candidate_type text,
  p_decided_by_actor text,
  p_decided_by uuid,
  p_rationale text,
  p_enforce_assessment_match boolean,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_idea public.ideas;
  v_assessment public.idea_blueprint_fit_assessments;
  v_existing public.idea_blueprint_fit_decisions;
  v_source_id uuid;
  v_revision bigint;
  v_request_fp text;
  v_candidate_type text;
  v_blueprint_id text;
  v_blueprint_version text;
begin
  if p_decision not in ('SITE_VITRINE','BLUEPRINT_MISMATCH') then raise exception 'INVALID_BLUEPRINT_DECISION'; end if;
  if p_decided_by_actor not in ('HUMAN','SYSTEM') then raise exception 'INVALID_BLUEPRINT_DECISION_ACTOR'; end if;
  if p_decided_by_actor='HUMAN' and p_decided_by is null then raise exception 'HUMAN_ACTOR_REQUIRED'; end if;
  if p_decided_by_actor='SYSTEM' and p_decided_by is not null then raise exception 'SYSTEM_ACTOR_MUST_NOT_HAVE_USER'; end if;
  if nullif(btrim(p_idempotency_key),'') is null then raise exception 'IDEMPOTENCY_KEY_REQUIRED'; end if;

  select * into v_idea from public.ideas where id=p_idea_id for update;
  if v_idea.id is null then raise exception 'IDEA_NOT_FOUND'; end if;

  if p_assessment_id is not null then
    select * into v_assessment from public.idea_blueprint_fit_assessments where id=p_assessment_id for update;
    if v_assessment.id is null or v_assessment.idea_id<>p_idea_id then raise exception 'BLUEPRINT_ASSESSMENT_NOT_FOUND'; end if;
  end if;

  v_candidate_type:=coalesce(nullif(btrim(p_candidate_type),''),v_assessment.candidate_type);
  v_request_fp:=md5(jsonb_build_object(
    'idea_id',p_idea_id,'revision',p_expected_engine_revision,'decision',p_decision,'assessment_id',p_assessment_id,
    'candidate_type',v_candidate_type,'actor',p_decided_by_actor,'decided_by',p_decided_by,'rationale',coalesce(p_rationale,'')
  )::text);

  select * into v_existing from public.idea_blueprint_fit_decisions where idea_id=p_idea_id and idempotency_key=p_idempotency_key;
  if v_existing.id is not null then
    if v_existing.request_fingerprint<>v_request_fp then raise exception 'IDEMPOTENCY_KEY_REUSE'; end if;
    return jsonb_build_object('decision_id',v_existing.id,'decision',v_existing.decision,'blueprint_id',v_existing.blueprint_id,'blueprint_version',v_existing.blueprint_version,'engine_revision',v_existing.output_engine_revision,'raw_source_id',v_existing.raw_source_id,'idempotent',true);
  end if;

  if v_idea.engine_revision<>p_expected_engine_revision then raise exception 'STALE_ENGINE'; end if;
  if v_idea.blueprint_status is not null and v_idea.blueprint_status<>'migration_required' then raise exception 'BLUEPRINT_FIT_ALREADY_RESOLVED'; end if;

  if p_assessment_id is not null then
    if v_assessment.input_engine_revision<>v_idea.engine_revision or v_assessment.input_fingerprint<>app_private.blueprint_fit_input_fingerprint_v1(p_idea_id) then raise exception 'STALE_BLUEPRINT_ASSESSMENT'; end if;
    if v_assessment.state<>'current' then raise exception 'BLUEPRINT_ASSESSMENT_NOT_CURRENT'; end if;
    if p_enforce_assessment_match and v_assessment.classification<>p_decision then raise exception 'BLUEPRINT_ASSESSMENT_DECISION_MISMATCH'; end if;
  elsif p_enforce_assessment_match then
    raise exception 'BLUEPRINT_ASSESSMENT_REQUIRED';
  end if;

  insert into public.idea_sources(
    idea_id,source_kind,locator,title,content_hash,source_version,status,sensitivity,created_by,idempotency_key,request_fingerprint
  ) values (
    p_idea_id,'human_raw','ideas.original_text','Description originale',md5(v_idea.original_text),1,'ingested','internal',v_idea.created_by,
    'system:initial-original-text',md5(v_idea.original_text)
  ) on conflict (idea_id,idempotency_key) do nothing returning id into v_source_id;
  if v_source_id is null then select id into v_source_id from public.idea_sources where idea_id=p_idea_id and idempotency_key='system:initial-original-text'; end if;

  if p_decision='SITE_VITRINE' then
    v_blueprint_id:='SITE_VITRINE'; v_blueprint_version:='0.4';
    update public.ideas set blueprint_id=v_blueprint_id,blueprint_version=v_blueprint_version,blueprint_status='active',engine_revision=engine_revision+1 where id=p_idea_id returning engine_revision into v_revision;
  else
    v_blueprint_id:=null; v_blueprint_version:=null;
    update public.ideas set blueprint_id=null,blueprint_version=null,blueprint_status='mismatch',engine_revision=engine_revision+1 where id=p_idea_id returning engine_revision into v_revision;
  end if;

  insert into public.idea_blueprint_fit_decisions(
    idea_id,assessment_id,decision,blueprint_id,blueprint_version,candidate_type,decided_by_actor,decided_by,rationale,
    input_engine_revision,output_engine_revision,raw_source_id,idempotency_key,request_fingerprint
  ) values (
    p_idea_id,p_assessment_id,p_decision,v_blueprint_id,v_blueprint_version,v_candidate_type,p_decided_by_actor,p_decided_by,
    coalesce(p_rationale,''),p_expected_engine_revision,v_revision,v_source_id,p_idempotency_key,v_request_fp
  ) returning id into v_existing.id;

  if p_assessment_id is not null then update public.idea_blueprint_fit_assessments set state='resolved',resolved_at=now() where id=p_assessment_id; end if;

  insert into public.audit_events(workspace_id,actor_id,event_type,entity_type,entity_id,payload)
  values(v_idea.workspace_id,p_decided_by,'idea.blueprint_fit_resolved','idea',p_idea_id,
    jsonb_build_object('decision',p_decision,'assessment_id',p_assessment_id,'candidate_type',v_candidate_type,'actor',p_decided_by_actor,'revision_before',p_expected_engine_revision,'revision_after',v_revision,'raw_source_id',v_source_id,'previous_blueprint_status',v_idea.blueprint_status));

  return jsonb_build_object('decision_id',v_existing.id,'decision',p_decision,'blueprint_id',v_blueprint_id,'blueprint_version',v_blueprint_version,'engine_revision',v_revision,'raw_source_id',v_source_id,'idempotent',false);
end;
$$;

create or replace function public.get_idea_workspace_projection_v1(p_idea_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $$
declare
  v_base jsonb;
  v_a public.idea_blueprint_fit_assessments;
  v_d public.idea_blueprint_fit_decisions;
  v_unresolved boolean;
  v_requires_human boolean;
begin
  v_base:=app_private.workspace_projection_core_v1(p_idea_id);
  select * into v_a from public.idea_blueprint_fit_assessments where idea_id=p_idea_id order by created_at desc,id desc limit 1;
  select * into v_d from public.idea_blueprint_fit_decisions where idea_id=p_idea_id order by created_at desc,id desc limit 1;
  v_unresolved:=coalesce(v_base->'lifecycle'->>'mode','') in ('CAPTURED_UNCLASSIFIED','BLUEPRINT_MIGRATION_REQUIRED');
  v_requires_human:=v_unresolved and v_a.id is not null and v_a.state='current' and (v_a.classification='AMBIGUOUS' or v_a.confidence<>'HIGH' or not v_a.auto_applicable);
  v_base:=jsonb_set(v_base,'{projection_version}',to_jsonb('1.2'::text),true);
  v_base:=jsonb_set(v_base,'{signals,blueprint_fit_needed}',to_jsonb(v_unresolved),true);
  v_base:=jsonb_set(v_base,'{signals,blueprint_fit_assessment_available}',to_jsonb(v_a.id is not null),true);
  v_base:=jsonb_set(v_base,'{signals,blueprint_fit_requires_human}',to_jsonb(v_requires_human),true);
  return v_base || jsonb_build_object(
    'blueprint_fit',jsonb_build_object(
      'assessment',case when v_a.id is null then null else jsonb_build_object('id',v_a.id,'classification',v_a.classification,'candidate_type',v_a.candidate_type,'confidence',v_a.confidence,'rationale',v_a.rationale,'auto_applicable',v_a.auto_applicable,'state',v_a.state,'created_at',v_a.created_at) end,
      'decision',case when v_d.id is null then null else jsonb_build_object('id',v_d.id,'decision',v_d.decision,'candidate_type',v_d.candidate_type,'decided_by_actor',v_d.decided_by_actor,'decided_by',v_d.decided_by,'rationale',v_d.rationale,'created_at',v_d.created_at) end
    )
  );
end;
$$;

revoke all on function public.get_idea_workspace_projection_v1(uuid) from public,anon;
grant execute on function public.get_idea_workspace_projection_v1(uuid) to authenticated,service_role;