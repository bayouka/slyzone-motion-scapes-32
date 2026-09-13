-- 4b4c R7 human/expert authority hardening

create or replace function public.commit_project_requirement_state_v1(
  p_project_definition_id uuid,
  p_expected_definition_revision bigint,
  p_requirement_id text,
  p_resolution_level text,
  p_value jsonb,
  p_input_fingerprint text,
  p_authority_type text,
  p_authority_evidence jsonb,
  p_accepted_by uuid,
  p_owner_ref text,
  p_blocker_status text,
  p_blocker_reason text,
  p_acceptance_rule jsonb,
  p_verify_result jsonb,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  pd public.project_definitions;
  s public.project_definition_requirement_states;
  rec public.project_definition_mutation_receipts;
  fp text;
  rev bigint;
  result jsonb;
  authorized boolean;
  human_decision_atom boolean;
begin
  if not app_private.is_project_requirement_id_v1(p_requirement_id) then raise exception 'UNKNOWN_PROJECT_REQUIREMENT'; end if;
  if p_resolution_level not in ('UNRESOLVED','WORKING_ASSUMPTION','AI_PROPOSED','ACCEPTED_AS_CURRENT','LOCKED_FOR_DEPENDENTS','APPROVED_FOR_PROJECT','EXPERT_SIGNOFF','VERIFIED_PASS','HUMAN_DECISION','ACCEPTED_UNKNOWN','NOT_RELEVANT') then raise exception 'INVALID_RESOLUTION_LEVEL'; end if;
  if p_authority_type not in ('SYSTEM','HUMAN','EXPERT') or p_blocker_status not in ('NONE','OPEN','ACCEPTED') then raise exception 'INVALID_REQUIREMENT_METADATA'; end if;
  if p_value is null or jsonb_typeof(p_value)<>'object' or p_authority_evidence is null or jsonb_typeof(p_authority_evidence)<>'object' or p_acceptance_rule is null or jsonb_typeof(p_acceptance_rule)<>'object' or p_verify_result is null or jsonb_typeof(p_verify_result)<>'object' then raise exception 'INVALID_REQUIREMENT_JSON'; end if;

  fp:=md5(jsonb_build_object('revision',p_expected_definition_revision,'requirement_id',p_requirement_id,'resolution',p_resolution_level,'value',p_value,'input_fp',p_input_fingerprint,'authority',p_authority_type,'authority_evidence',p_authority_evidence,'accepted_by',p_accepted_by,'owner_ref',p_owner_ref,'blocker_status',p_blocker_status,'blocker_reason',p_blocker_reason,'acceptance_rule',p_acceptance_rule,'verify_result',p_verify_result)::text);
  select * into rec from public.project_definition_mutation_receipts where project_definition_id=p_project_definition_id and idempotency_key=p_idempotency_key;
  if rec.id is not null then
    if rec.request_fingerprint<>fp then raise exception 'IDEMPOTENCY_KEY_REUSE'; end if;
    return rec.result||jsonb_build_object('idempotent',true);
  end if;

  select * into pd from public.project_definitions where id=p_project_definition_id for update;
  if pd.id is null or pd.status='superseded' then raise exception 'PROJECT_DEFINITION_NOT_ACTIVE'; end if;
  if pd.definition_revision<>p_expected_definition_revision then raise exception 'STALE_PROJECT_DEFINITION'; end if;
  select * into s from public.project_definition_requirement_states where project_definition_id=pd.id and requirement_id=p_requirement_id for update;
  if s.id is null then raise exception 'PROJECT_REQUIREMENT_NOT_INITIALIZED'; end if;
  if not s.applicable and p_resolution_level<>'NOT_RELEVANT' then raise exception 'INACTIVE_REQUIREMENT_CANNOT_BE_RESOLVED'; end if;
  if s.applicable and p_resolution_level='NOT_RELEVANT' then raise exception 'ACTIVE_REQUIREMENT_CANNOT_BE_NOT_RELEVANT'; end if;

  if p_requirement_id='SV.D17.EXPERT_SIGNOFF' and s.applicable and (p_resolution_level<>'EXPERT_SIGNOFF' or p_authority_type<>'EXPERT' or p_accepted_by is null or p_authority_evidence='{}'::jsonb) then raise exception 'EXPERT_SIGNOFF_AUTHORITY_REQUIRED'; end if;
  if p_requirement_id='SV.D20.DEVELOPER_AMBIGUITY_AUDIT' and p_resolution_level='VERIFIED_PASS' and coalesce(p_verify_result->>'status','')<>'PASS' then raise exception 'AMBIGUITY_AUDIT_PASS_EVIDENCE_REQUIRED'; end if;

  human_decision_atom:=p_requirement_id=any(array['SV.D16.DELIVERY_APPROACH','SV.D18.ACCESSIBILITY_TARGET','SV.D20.IMPLEMENTATION_DISCRETION','SV.D20.READY_APPROVAL']::text[]);
  if human_decision_atom and p_resolution_level in ('ACCEPTED_AS_CURRENT','LOCKED_FOR_DEPENDENTS','HUMAN_DECISION') then
    if p_authority_type<>'HUMAN' or p_accepted_by is null then raise exception 'HUMAN_DECISION_AUTHORITY_REQUIRED'; end if;
    select (i.created_by=p_accepted_by or exists(select 1 from public.workspace_members wm where wm.workspace_id=i.workspace_id and wm.user_id=p_accepted_by and wm.status='active' and wm.role in ('owner','admin'))) into authorized
    from public.project_definitions x join public.ideas i on i.id=x.idea_id where x.id=pd.id;
    if not coalesce(authorized,false) then raise exception 'HUMAN_DECISION_OWNER_NOT_AUTHORIZED'; end if;
  end if;
  if p_requirement_id='SV.D20.READY_APPROVAL' and p_resolution_level<>'HUMAN_DECISION' then raise exception 'READY_APPROVAL_REQUIRES_HUMAN_DECISION_LEVEL'; end if;

  rev:=pd.definition_revision+1;
  update public.project_definition_requirement_states
  set resolution_level=p_resolution_level,
      state='current',
      lock_state=case when p_resolution_level in ('ACCEPTED_AS_CURRENT','VERIFIED_PASS','HUMAN_DECISION','EXPERT_SIGNOFF') then 'VALIDATED_CURRENT' when p_resolution_level='LOCKED_FOR_DEPENDENTS' then 'LOCKED_FOR_DEPENDENTS' when p_resolution_level='APPROVED_FOR_PROJECT' then 'APPROVED_FOR_PROJECT' else 'WORKING' end,
      value=p_value,input_fingerprint=p_input_fingerprint,authority_type=p_authority_type,authority_evidence=p_authority_evidence,accepted_by=p_accepted_by,owner_ref=p_owner_ref,blocker_status=p_blocker_status,blocker_reason=p_blocker_reason,acceptance_rule=p_acceptance_rule,verify_result=p_verify_result,definition_revision=rev,updated_at=now()
  where id=s.id;
  update public.project_definitions set definition_revision=rev where id=pd.id;

  result:=jsonb_build_object('project_definition_id',pd.id,'requirement_id',p_requirement_id,'definition_revision',rev,'resolution_level',p_resolution_level,'idempotent',false);
  insert into public.project_definition_mutation_receipts(project_definition_id,idempotency_key,request_fingerprint,result) values(pd.id,p_idempotency_key,fp,result);
  return result;
end;
$$;

revoke all on function public.commit_project_requirement_state_v1(uuid,bigint,text,text,jsonb,text,text,jsonb,uuid,text,text,text,jsonb,jsonb,text) from public,anon,authenticated;
grant execute on function public.commit_project_requirement_state_v1(uuid,bigint,text,text,jsonb,text,text,jsonb,uuid,text,text,text,jsonb,jsonb,text) to service_role;
