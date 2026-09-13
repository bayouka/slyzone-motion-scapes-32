-- 4b4c Idea Engine R7 — Project Definition completion -> Build Ready
-- Canonical source synchronized from the validated live schema after R7 red-team.

alter table public.project_definitions
  add column definition_revision bigint not null default 0 check (definition_revision >= 0),
  add column context_fingerprint text null,
  add column initialized_at timestamptz null,
  add column build_ready_hash text null;

alter table public.idea_artifacts
  add column project_definition_id uuid null references public.project_definitions(id) on delete cascade;
create index idea_artifacts_project_definition_idx on public.idea_artifacts(project_definition_id) where project_definition_id is not null;

create table public.project_definition_requirement_states (
  id uuid primary key default gen_random_uuid(),
  project_definition_id uuid not null references public.project_definitions(id) on delete cascade,
  requirement_id text not null,
  applicable boolean not null default true,
  resolution_level text not null default 'UNRESOLVED' check (resolution_level in ('UNRESOLVED','WORKING_ASSUMPTION','AI_PROPOSED','ACCEPTED_AS_CURRENT','LOCKED_FOR_DEPENDENTS','APPROVED_FOR_PROJECT','EXPERT_SIGNOFF','VERIFIED_PASS','HUMAN_DECISION','ACCEPTED_UNKNOWN','NOT_RELEVANT','FROZEN_FOR_BUILD')),
  state text not null default 'current' check (state in ('current','review_required','stale','superseded')),
  lock_state text not null default 'WORKING' check (lock_state in ('WORKING','VALIDATED_CURRENT','LOCKED_FOR_DEPENDENTS','APPROVED_FOR_PROJECT','FROZEN_FOR_BUILD')),
  value jsonb not null default '{}'::jsonb,
  input_fingerprint text null,
  context_fingerprint text null,
  authority_type text not null default 'SYSTEM' check (authority_type in ('SYSTEM','HUMAN','EXPERT')),
  authority_evidence jsonb not null default '{}'::jsonb check (jsonb_typeof(authority_evidence)='object'),
  accepted_by uuid null references auth.users(id) on delete set null,
  owner_ref text null,
  blocker_status text not null default 'NONE' check (blocker_status in ('NONE','OPEN','ACCEPTED')),
  blocker_reason text null,
  acceptance_rule jsonb not null default '{}'::jsonb check (jsonb_typeof(acceptance_rule)='object'),
  verify_result jsonb not null default '{}'::jsonb check (jsonb_typeof(verify_result)='object'),
  definition_revision bigint not null default 0 check (definition_revision >= 0),
  updated_at timestamptz not null default now(),
  unique(project_definition_id,requirement_id)
);
create index project_definition_requirement_states_req_idx on public.project_definition_requirement_states(requirement_id,project_definition_id);
create index project_definition_requirement_states_accepted_by_idx on public.project_definition_requirement_states(accepted_by) where accepted_by is not null;

create table public.project_definition_gate_states (
  project_definition_id uuid not null references public.project_definitions(id) on delete cascade,
  gate_id text not null check (gate_id in ('G8_PROJECT_PRODUCT_DEFINITION_STABLE','G9_PROJECT_EXPERIENCE_DEFINITION_STABLE','G10_PROJECT_TECH_NFR_STABLE','G11_TRACEABILITY_AND_ACCEPTANCE_READY','G12_READY_FOR_DEVELOPMENT')),
  status text not null check (status in ('READY','NOT_READY')),
  evaluation_fingerprint text not null,
  details jsonb not null default '{}'::jsonb check (jsonb_typeof(details)='object'),
  definition_revision bigint not null check (definition_revision >= 0),
  evaluated_at timestamptz not null default now(),
  primary key(project_definition_id,gate_id)
);

create table public.project_definition_mutation_receipts (
  id uuid primary key default gen_random_uuid(),
  project_definition_id uuid not null references public.project_definitions(id) on delete cascade,
  idempotency_key text not null,
  request_fingerprint text not null,
  result jsonb not null check (jsonb_typeof(result)='object'),
  created_at timestamptz not null default now(),
  unique(project_definition_id,idempotency_key)
);

alter table public.project_definition_requirement_states enable row level security;
alter table public.project_definition_gate_states enable row level security;
alter table public.project_definition_mutation_receipts enable row level security;

create policy project_definition_requirement_states_select_v1
on public.project_definition_requirement_states for select to authenticated
using (exists(select 1 from public.project_definitions pd where pd.id=project_definition_id and app_private.can_access_idea(pd.idea_id)));
create policy project_definition_gate_states_select_v1
on public.project_definition_gate_states for select to authenticated
using (exists(select 1 from public.project_definitions pd where pd.id=project_definition_id and app_private.can_access_idea(pd.idea_id)));

revoke all on table public.project_definition_requirement_states, public.project_definition_gate_states, public.project_definition_mutation_receipts from anon,authenticated;
grant select on table public.project_definition_requirement_states, public.project_definition_gate_states to authenticated;
grant all on table public.project_definition_requirement_states, public.project_definition_gate_states, public.project_definition_mutation_receipts to service_role;

create or replace function app_private.is_project_requirement_id_v1(p_id text)
returns boolean language sql immutable set search_path=''
as $$
  select p_id = any(array[
    'SV.PRJ.APPROVED_BASELINE','SV.D08.JOURNEY_SPEC','SV.D09.PAGE_MANIFEST','SV.D10.CONTENT_REQUIREMENTS','SV.D11.SEO_PAGE_MAP','SV.D11.REDIRECT_MAP',
    'SV.D12.FUNCTIONAL_REQUIREMENTS','SV.D12.UI_STATES','SV.D12.BUSINESS_RULES','SV.D13.CONTENT_DATA_MODEL','SV.D13.ROLE_PERMISSION_MATRIX','SV.D14.INTEGRATION_CONTRACTS',
    'SV.D15.WIREFRAME_BASELINE','SV.D15.DESIGN_DEFINITION','SV.D15.RESPONSIVE_BEHAVIOR','SV.D16.DELIVERY_APPROACH','SV.D16.ARCHITECTURE','SV.D16.ENV_HOSTING_OPS',
    'SV.D17.PRIVACY_SECURITY','SV.D17.EXPERT_SIGNOFF','SV.D18.ACCESSIBILITY_TARGET','SV.D18.PERFORMANCE_RELIABILITY','SV.D19.MEASUREMENT_PLAN',
    'SV.D20.ACCEPTANCE_CRITERIA','SV.D20.SOURCE_OF_TRUTH_MANIFEST','SV.D20.IMPLEMENTATION_DISCRETION','SV.D20.DEVELOPER_AMBIGUITY_AUDIT','SV.D20.READY_APPROVAL'
  ]::text[]);
$$;

create or replace function app_private.is_conditional_project_requirement_v1(p_id text)
returns boolean language sql immutable set search_path=''
as $$
  select p_id = any(array['SV.D11.SEO_PAGE_MAP','SV.D11.REDIRECT_MAP','SV.D12.BUSINESS_RULES','SV.D13.CONTENT_DATA_MODEL','SV.D13.ROLE_PERMISSION_MATRIX','SV.D14.INTEGRATION_CONTRACTS','SV.D17.EXPERT_SIGNOFF','SV.D19.MEASUREMENT_PLAN']::text[]);
$$;

create or replace function app_private.is_default_inactive_project_requirement_v1(p_id text)
returns boolean language sql immutable set search_path=''
as $$
  select p_id = any(array['SV.D11.REDIRECT_MAP','SV.D13.CONTENT_DATA_MODEL','SV.D13.ROLE_PERMISSION_MATRIX','SV.D14.INTEGRATION_CONTRACTS','SV.D17.EXPERT_SIGNOFF']::text[]);
$$;

create or replace function app_private.project_definition_state_fingerprint_v1(p_project_definition_id uuid)
returns text language sql stable set search_path=''
as $$
  select md5(jsonb_build_object(
    'project_definition_id',pd.id,'baseline_hash',pd.baseline_hash,'definition_revision',pd.definition_revision,'context_fingerprint',pd.context_fingerprint,
    'requirements',coalesce((select jsonb_agg(jsonb_build_object('id',s.requirement_id,'applicable',s.applicable,'resolution',s.resolution_level,'state',s.state,'lock',s.lock_state,'value',s.value,'input_fp',s.input_fingerprint,'authority',s.authority_type,'owner',s.owner_ref,'blocker',s.blocker_status,'acceptance',s.acceptance_rule,'verify',s.verify_result) order by s.requirement_id) from public.project_definition_requirement_states s where s.project_definition_id=pd.id),'[]'::jsonb)
  )::text)
  from public.project_definitions pd where pd.id=p_project_definition_id;
$$;

create or replace function app_private.project_requirement_satisfied_v1(p_project_definition_id uuid,p_requirement_id text)
returns boolean language plpgsql stable set search_path=''
as $$
declare v public.project_definition_requirement_states;
begin
  select * into v from public.project_definition_requirement_states where project_definition_id=p_project_definition_id and requirement_id=p_requirement_id;
  if v.id is null then return false; end if;
  if not v.applicable then return app_private.is_conditional_project_requirement_v1(p_requirement_id) and v.resolution_level='NOT_RELEVANT'; end if;
  if v.state<>'current' or v.blocker_status='OPEN' then return false; end if;
  if p_requirement_id='SV.PRJ.APPROVED_BASELINE' then return v.resolution_level in ('APPROVED_FOR_PROJECT','FROZEN_FOR_BUILD'); end if;
  if p_requirement_id='SV.D17.EXPERT_SIGNOFF' then return v.resolution_level in ('EXPERT_SIGNOFF','FROZEN_FOR_BUILD') and v.authority_type='EXPERT' and v.accepted_by is not null; end if;
  if p_requirement_id='SV.D20.DEVELOPER_AMBIGUITY_AUDIT' then return v.resolution_level in ('VERIFIED_PASS','FROZEN_FOR_BUILD') and coalesce(v.verify_result->>'status','')='PASS'; end if;
  if p_requirement_id='SV.D20.READY_APPROVAL' then return v.resolution_level in ('HUMAN_DECISION','FROZEN_FOR_BUILD') and v.authority_type='HUMAN' and v.accepted_by is not null; end if;
  return v.resolution_level in ('ACCEPTED_AS_CURRENT','LOCKED_FOR_DEPENDENTS','APPROVED_FOR_PROJECT','EXPERT_SIGNOFF','VERIFIED_PASS','HUMAN_DECISION','FROZEN_FOR_BUILD');
end;
$$;

create or replace function app_private.project_gate_ready_v1(p_project_definition_id uuid,p_gate_id text)
returns boolean language plpgsql stable set search_path=''
as $$
declare ids text[]; rid text;
begin
  if p_gate_id='G8_PROJECT_PRODUCT_DEFINITION_STABLE' then ids:=array['SV.PRJ.APPROVED_BASELINE','SV.D08.JOURNEY_SPEC','SV.D09.PAGE_MANIFEST','SV.D10.CONTENT_REQUIREMENTS','SV.D12.FUNCTIONAL_REQUIREMENTS','SV.D12.UI_STATES','SV.D11.SEO_PAGE_MAP','SV.D11.REDIRECT_MAP','SV.D12.BUSINESS_RULES','SV.D13.CONTENT_DATA_MODEL','SV.D13.ROLE_PERMISSION_MATRIX','SV.D14.INTEGRATION_CONTRACTS'];
  elsif p_gate_id='G9_PROJECT_EXPERIENCE_DEFINITION_STABLE' then ids:=array['SV.D15.WIREFRAME_BASELINE','SV.D15.DESIGN_DEFINITION','SV.D15.RESPONSIVE_BEHAVIOR'];
  elsif p_gate_id='G10_PROJECT_TECH_NFR_STABLE' then ids:=array['SV.D16.DELIVERY_APPROACH','SV.D16.ARCHITECTURE','SV.D16.ENV_HOSTING_OPS','SV.D17.PRIVACY_SECURITY','SV.D18.ACCESSIBILITY_TARGET','SV.D18.PERFORMANCE_RELIABILITY','SV.D17.EXPERT_SIGNOFF','SV.D19.MEASUREMENT_PLAN','SV.D13.CONTENT_DATA_MODEL','SV.D14.INTEGRATION_CONTRACTS'];
  elsif p_gate_id='G11_TRACEABILITY_AND_ACCEPTANCE_READY' then ids:=array['SV.D20.ACCEPTANCE_CRITERIA','SV.D20.SOURCE_OF_TRUTH_MANIFEST','SV.D20.IMPLEMENTATION_DISCRETION'];
  else return false; end if;
  foreach rid in array ids loop if not app_private.project_requirement_satisfied_v1(p_project_definition_id,rid) then return false; end if; end loop;
  return true;
end;
$$;

create or replace function app_private.project_artifact_expected_fingerprint_v1(p_project_definition_id uuid,p_artifact_key text)
returns text language plpgsql stable set search_path=''
as $$
declare ids text[]; v jsonb; pd public.project_definitions;
begin
  select * into pd from public.project_definitions where id=p_project_definition_id; if pd.id is null then return null; end if;
  if p_artifact_key='A19_EXPERIENCE_INFORMATION_ARCHITECTURE_SPEC' then ids:=array['SV.D08.JOURNEY_SPEC','SV.D09.PAGE_MANIFEST','SV.D15.WIREFRAME_BASELINE','SV.D15.RESPONSIVE_BEHAVIOR'];
  elsif p_artifact_key='A20_CONTENT_DISCOVERABILITY_SPEC' then ids:=array['SV.D10.CONTENT_REQUIREMENTS','SV.D11.SEO_PAGE_MAP','SV.D11.REDIRECT_MAP'];
  elsif p_artifact_key='A21_FUNCTIONAL_DATA_INTEGRATION_SPEC' then ids:=array['SV.D12.FUNCTIONAL_REQUIREMENTS','SV.D12.UI_STATES','SV.D12.BUSINESS_RULES','SV.D13.CONTENT_DATA_MODEL','SV.D13.ROLE_PERMISSION_MATRIX','SV.D14.INTEGRATION_CONTRACTS'];
  elsif p_artifact_key='A22_DESIGN_DEFINITION' then ids:=array['SV.D15.DESIGN_DEFINITION','SV.D15.RESPONSIVE_BEHAVIOR'];
  elsif p_artifact_key='A23_TECHNICAL_NFR_DEFINITION' then ids:=array['SV.D16.DELIVERY_APPROACH','SV.D16.ARCHITECTURE','SV.D16.ENV_HOSTING_OPS','SV.D17.PRIVACY_SECURITY','SV.D17.EXPERT_SIGNOFF','SV.D18.ACCESSIBILITY_TARGET','SV.D18.PERFORMANCE_RELIABILITY','SV.D19.MEASUREMENT_PLAN'];
  elsif p_artifact_key='A24_VERIFICATION_ACCEPTANCE_PLAN' then ids:=array['SV.D20.ACCEPTANCE_CRITERIA','SV.D20.SOURCE_OF_TRUTH_MANIFEST','SV.D20.IMPLEMENTATION_DISCRETION','SV.D20.DEVELOPER_AMBIGUITY_AUDIT'];
  elsif p_artifact_key='A25_BUILD_READY_PROJECT_SPECIFICATION' then
    select jsonb_build_object('baseline_hash',pd.baseline_hash,'definition_revision',pd.definition_revision,'requirements_fp',app_private.project_definition_state_fingerprint_v1(pd.id),'sources',coalesce((select jsonb_agg(jsonb_build_object('key',a.artifact_key,'version',a.version,'hash',a.content_hash,'state',a.state,'freshness',a.freshness_status) order by a.artifact_key) from public.idea_artifacts a where a.project_definition_id=pd.id and a.artifact_key=any(array['A19_EXPERIENCE_INFORMATION_ARCHITECTURE_SPEC','A20_CONTENT_DISCOVERABILITY_SPEC','A21_FUNCTIONAL_DATA_INTEGRATION_SPEC','A22_DESIGN_DEFINITION','A23_TECHNICAL_NFR_DEFINITION','A24_VERIFICATION_ACCEPTANCE_PLAN']) and a.state='current'),'[]'::jsonb)) into v;
    return md5(v::text);
  else return null; end if;
  select coalesce(jsonb_agg(jsonb_build_object('id',s.requirement_id,'applicable',s.applicable,'resolution',s.resolution_level,'state',s.state,'value',s.value,'input_fp',s.input_fingerprint,'blocker',s.blocker_status,'acceptance',s.acceptance_rule,'verify',s.verify_result) order by s.requirement_id),'[]'::jsonb) into v from public.project_definition_requirement_states s where s.project_definition_id=p_project_definition_id and s.requirement_id=any(ids);
  return md5(jsonb_build_object('baseline_hash',pd.baseline_hash,'artifact_key',p_artifact_key,'requirements',v)::text);
end;
$$;

create or replace function public.initialize_project_definition_runtime_v1(p_project_definition_id uuid,p_expected_baseline_hash text,p_context_fingerprint text)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare pd public.project_definitions; rid text; default_inactive boolean; rev bigint;
begin
  select * into pd from public.project_definitions where id=p_project_definition_id for update; if pd.id is null then raise exception 'PROJECT_DEFINITION_NOT_FOUND'; end if;
  if pd.baseline_hash<>p_expected_baseline_hash then raise exception 'STALE_PROJECT_BASELINE'; end if;
  if pd.initialized_at is not null then return jsonb_build_object('project_definition_id',pd.id,'definition_revision',pd.definition_revision,'idempotent',true); end if;
  foreach rid in array array['SV.PRJ.APPROVED_BASELINE','SV.D08.JOURNEY_SPEC','SV.D09.PAGE_MANIFEST','SV.D10.CONTENT_REQUIREMENTS','SV.D11.SEO_PAGE_MAP','SV.D11.REDIRECT_MAP','SV.D12.FUNCTIONAL_REQUIREMENTS','SV.D12.UI_STATES','SV.D12.BUSINESS_RULES','SV.D13.CONTENT_DATA_MODEL','SV.D13.ROLE_PERMISSION_MATRIX','SV.D14.INTEGRATION_CONTRACTS','SV.D15.WIREFRAME_BASELINE','SV.D15.DESIGN_DEFINITION','SV.D15.RESPONSIVE_BEHAVIOR','SV.D16.DELIVERY_APPROACH','SV.D16.ARCHITECTURE','SV.D16.ENV_HOSTING_OPS','SV.D17.PRIVACY_SECURITY','SV.D17.EXPERT_SIGNOFF','SV.D18.ACCESSIBILITY_TARGET','SV.D18.PERFORMANCE_RELIABILITY','SV.D19.MEASUREMENT_PLAN','SV.D20.ACCEPTANCE_CRITERIA','SV.D20.SOURCE_OF_TRUTH_MANIFEST','SV.D20.IMPLEMENTATION_DISCRETION','SV.D20.DEVELOPER_AMBIGUITY_AUDIT','SV.D20.READY_APPROVAL'] loop
    default_inactive:=app_private.is_default_inactive_project_requirement_v1(rid);
    insert into public.project_definition_requirement_states(project_definition_id,requirement_id,applicable,resolution_level,state,lock_state,value,input_fingerprint,context_fingerprint,authority_type,blocker_status,definition_revision)
    values(pd.id,rid,not default_inactive,case when rid='SV.PRJ.APPROVED_BASELINE' then 'APPROVED_FOR_PROJECT' when default_inactive then 'NOT_RELEVANT' else 'UNRESOLVED' end,'current',case when rid='SV.PRJ.APPROVED_BASELINE' then 'APPROVED_FOR_PROJECT' else 'WORKING' end,case when rid='SV.PRJ.APPROVED_BASELINE' then jsonb_build_object('approved_idea_snapshot_id',pd.approved_idea_snapshot_id,'baseline_hash',pd.baseline_hash) else '{}'::jsonb end,case when rid='SV.PRJ.APPROVED_BASELINE' then pd.baseline_hash else null end,p_context_fingerprint,'SYSTEM','NONE',1);
  end loop;
  update public.project_definitions set definition_revision=1,context_fingerprint=p_context_fingerprint,initialized_at=now() where id=pd.id returning definition_revision into rev;
  return jsonb_build_object('project_definition_id',pd.id,'definition_revision',rev,'requirement_count',28,'idempotent',false);
end;
$$;

create or replace function public.set_project_requirement_applicability_v1(p_project_definition_id uuid,p_expected_definition_revision bigint,p_context_fingerprint text,p_applicability jsonb,p_idempotency_key text)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare pd public.project_definitions; rec public.project_definition_mutation_receipts; fp text; ent jsonb; rid text; app boolean; rev bigint; result jsonb;
begin
  if p_applicability is null or jsonb_typeof(p_applicability)<>'array' then raise exception 'APPLICABILITY_MUST_BE_ARRAY'; end if;
  fp:=md5(jsonb_build_object('revision',p_expected_definition_revision,'context_fp',p_context_fingerprint,'applicability',p_applicability)::text);
  select * into rec from public.project_definition_mutation_receipts where project_definition_id=p_project_definition_id and idempotency_key=p_idempotency_key;
  if rec.id is not null then if rec.request_fingerprint<>fp then raise exception 'IDEMPOTENCY_KEY_REUSE'; end if; return rec.result||jsonb_build_object('idempotent',true); end if;
  select * into pd from public.project_definitions where id=p_project_definition_id for update; if pd.definition_revision<>p_expected_definition_revision then raise exception 'STALE_PROJECT_DEFINITION'; end if;
  for ent in select value from jsonb_array_elements(p_applicability) loop
    rid:=ent->>'requirement_id'; app:=coalesce((ent->>'applicable')::boolean,false);
    if not app_private.is_conditional_project_requirement_v1(rid) then raise exception 'ONLY_CONDITIONAL_REQUIREMENT_APPLICABILITY_MUTABLE'; end if;
    update public.project_definition_requirement_states set applicable=app,resolution_level=case when app and resolution_level='NOT_RELEVANT' then 'UNRESOLVED' when not app then 'NOT_RELEVANT' else resolution_level end,context_fingerprint=p_context_fingerprint,updated_at=now() where project_definition_id=pd.id and requirement_id=rid;
  end loop;
  rev:=pd.definition_revision+1; update public.project_definitions set definition_revision=rev,context_fingerprint=p_context_fingerprint where id=pd.id; update public.project_definition_requirement_states set definition_revision=rev where project_definition_id=pd.id;
  result:=jsonb_build_object('project_definition_id',pd.id,'definition_revision',rev,'context_fingerprint',p_context_fingerprint,'idempotent',false);
  insert into public.project_definition_mutation_receipts(project_definition_id,idempotency_key,request_fingerprint,result) values(pd.id,p_idempotency_key,fp,result); return result;
end;
$$;

create or replace function public.commit_project_requirement_state_v1(p_project_definition_id uuid,p_expected_definition_revision bigint,p_requirement_id text,p_resolution_level text,p_value jsonb,p_input_fingerprint text,p_authority_type text,p_authority_evidence jsonb,p_accepted_by uuid,p_owner_ref text,p_blocker_status text,p_blocker_reason text,p_acceptance_rule jsonb,p_verify_result jsonb,p_idempotency_key text)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare pd public.project_definitions; s public.project_definition_requirement_states; rec public.project_definition_mutation_receipts; fp text; rev bigint; result jsonb; authorized boolean; human_decision_atom boolean;
begin
  if not app_private.is_project_requirement_id_v1(p_requirement_id) then raise exception 'UNKNOWN_PROJECT_REQUIREMENT'; end if;
  if p_resolution_level not in ('UNRESOLVED','WORKING_ASSUMPTION','AI_PROPOSED','ACCEPTED_AS_CURRENT','LOCKED_FOR_DEPENDENTS','APPROVED_FOR_PROJECT','EXPERT_SIGNOFF','VERIFIED_PASS','HUMAN_DECISION','ACCEPTED_UNKNOWN','NOT_RELEVANT') then raise exception 'INVALID_RESOLUTION_LEVEL'; end if;
  if p_authority_type not in ('SYSTEM','HUMAN','EXPERT') or p_blocker_status not in ('NONE','OPEN','ACCEPTED') then raise exception 'INVALID_REQUIREMENT_METADATA'; end if;
  if p_value is null or jsonb_typeof(p_value)<>'object' or p_authority_evidence is null or jsonb_typeof(p_authority_evidence)<>'object' or p_acceptance_rule is null or jsonb_typeof(p_acceptance_rule)<>'object' or p_verify_result is null or jsonb_typeof(p_verify_result)<>'object' then raise exception 'INVALID_REQUIREMENT_JSON'; end if;
  fp:=md5(jsonb_build_object('revision',p_expected_definition_revision,'requirement_id',p_requirement_id,'resolution',p_resolution_level,'value',p_value,'input_fp',p_input_fingerprint,'authority',p_authority_type,'authority_evidence',p_authority_evidence,'accepted_by',p_accepted_by,'owner_ref',p_owner_ref,'blocker_status',p_blocker_status,'blocker_reason',p_blocker_reason,'acceptance_rule',p_acceptance_rule,'verify_result',p_verify_result)::text);
  select * into rec from public.project_definition_mutation_receipts where project_definition_id=p_project_definition_id and idempotency_key=p_idempotency_key;
  if rec.id is not null then if rec.request_fingerprint<>fp then raise exception 'IDEMPOTENCY_KEY_REUSE'; end if; return rec.result||jsonb_build_object('idempotent',true); end if;
  select * into pd from public.project_definitions where id=p_project_definition_id for update; if pd.id is null or pd.status='superseded' then raise exception 'PROJECT_DEFINITION_NOT_ACTIVE'; end if; if pd.definition_revision<>p_expected_definition_revision then raise exception 'STALE_PROJECT_DEFINITION'; end if;
  select * into s from public.project_definition_requirement_states where project_definition_id=pd.id and requirement_id=p_requirement_id for update; if s.id is null then raise exception 'PROJECT_REQUIREMENT_NOT_INITIALIZED'; end if;
  if not s.applicable and p_resolution_level<>'NOT_RELEVANT' then raise exception 'INACTIVE_REQUIREMENT_CANNOT_BE_RESOLVED'; end if; if s.applicable and p_resolution_level='NOT_RELEVANT' then raise exception 'ACTIVE_REQUIREMENT_CANNOT_BE_NOT_RELEVANT'; end if;
  if p_requirement_id='SV.D17.EXPERT_SIGNOFF' and s.applicable and (p_resolution_level<>'EXPERT_SIGNOFF' or p_authority_type<>'EXPERT' or p_accepted_by is null or p_authority_evidence='{}'::jsonb) then raise exception 'EXPERT_SIGNOFF_AUTHORITY_REQUIRED'; end if;
  if p_requirement_id='SV.D20.DEVELOPER_AMBIGUITY_AUDIT' and p_resolution_level='VERIFIED_PASS' and coalesce(p_verify_result->>'status','')<>'PASS' then raise exception 'AMBIGUITY_AUDIT_PASS_EVIDENCE_REQUIRED'; end if;
  human_decision_atom:=p_requirement_id=any(array['SV.D16.DELIVERY_APPROACH','SV.D18.ACCESSIBILITY_TARGET','SV.D20.IMPLEMENTATION_DISCRETION','SV.D20.READY_APPROVAL']::text[]);
  if human_decision_atom and p_resolution_level in ('ACCEPTED_AS_CURRENT','LOCKED_FOR_DEPENDENTS','HUMAN_DECISION') then
    if p_authority_type<>'HUMAN' or p_accepted_by is null then raise exception 'HUMAN_DECISION_AUTHORITY_REQUIRED'; end if;
    select (i.created_by=p_accepted_by or exists(select 1 from public.workspace_members wm where wm.workspace_id=i.workspace_id and wm.user_id=p_accepted_by and wm.status='active' and wm.role in ('owner','admin'))) into authorized from public.project_definitions x join public.ideas i on i.id=x.idea_id where x.id=pd.id;
    if not coalesce(authorized,false) then raise exception 'HUMAN_DECISION_OWNER_NOT_AUTHORIZED'; end if;
  end if;
  if p_requirement_id='SV.D20.READY_APPROVAL' and p_resolution_level<>'HUMAN_DECISION' then raise exception 'READY_APPROVAL_REQUIRES_HUMAN_DECISION_LEVEL'; end if;
  rev:=pd.definition_revision+1;
  update public.project_definition_requirement_states set resolution_level=p_resolution_level,state='current',lock_state=case when p_resolution_level in ('ACCEPTED_AS_CURRENT','VERIFIED_PASS','HUMAN_DECISION','EXPERT_SIGNOFF') then 'VALIDATED_CURRENT' when p_resolution_level='LOCKED_FOR_DEPENDENTS' then 'LOCKED_FOR_DEPENDENTS' when p_resolution_level='APPROVED_FOR_PROJECT' then 'APPROVED_FOR_PROJECT' else 'WORKING' end,value=p_value,input_fingerprint=p_input_fingerprint,authority_type=p_authority_type,authority_evidence=p_authority_evidence,accepted_by=p_accepted_by,owner_ref=p_owner_ref,blocker_status=p_blocker_status,blocker_reason=p_blocker_reason,acceptance_rule=p_acceptance_rule,verify_result=p_verify_result,definition_revision=rev,updated_at=now() where id=s.id;
  update public.project_definitions set definition_revision=rev where id=pd.id;
  result:=jsonb_build_object('project_definition_id',pd.id,'requirement_id',p_requirement_id,'definition_revision',rev,'resolution_level',p_resolution_level,'idempotent',false);
  insert into public.project_definition_mutation_receipts(project_definition_id,idempotency_key,request_fingerprint,result) values(pd.id,p_idempotency_key,fp,result); return result;
end;
$$;

create or replace function public.evaluate_project_definition_gates_v1(p_project_definition_id uuid)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare pd public.project_definitions; fp text; g8 boolean; g9 boolean; g10 boolean; g11 boolean; g12 boolean; details jsonb; gate text; ready boolean;
begin
  select * into pd from public.project_definitions where id=p_project_definition_id; if pd.id is null then raise exception 'PROJECT_DEFINITION_NOT_FOUND'; end if;
  fp:=app_private.project_definition_state_fingerprint_v1(pd.id); g8:=app_private.project_gate_ready_v1(pd.id,'G8_PROJECT_PRODUCT_DEFINITION_STABLE'); g9:=app_private.project_gate_ready_v1(pd.id,'G9_PROJECT_EXPERIENCE_DEFINITION_STABLE'); g10:=app_private.project_gate_ready_v1(pd.id,'G10_PROJECT_TECH_NFR_STABLE'); g11:=app_private.project_gate_ready_v1(pd.id,'G11_TRACEABILITY_AND_ACCEPTANCE_READY');
  g12:=g8 and g9 and g10 and g11 and app_private.project_requirement_satisfied_v1(pd.id,'SV.D20.DEVELOPER_AMBIGUITY_AUDIT') and app_private.project_requirement_satisfied_v1(pd.id,'SV.D20.READY_APPROVAL') and not exists(select 1 from public.project_definition_requirement_states s where s.project_definition_id=pd.id and s.applicable and s.blocker_status='OPEN') and pd.build_ready_snapshot_id is not null and pd.status='build_ready';
  for gate,ready in select * from (values('G8_PROJECT_PRODUCT_DEFINITION_STABLE',g8),('G9_PROJECT_EXPERIENCE_DEFINITION_STABLE',g9),('G10_PROJECT_TECH_NFR_STABLE',g10),('G11_TRACEABILITY_AND_ACCEPTANCE_READY',g11),('G12_READY_FOR_DEVELOPMENT',g12)) v(g,r) loop
    details:=jsonb_build_object('state_fingerprint',fp,'definition_revision',pd.definition_revision,'build_ready_snapshot_id',pd.build_ready_snapshot_id,'preconditions_ready',case when gate='G12_READY_FOR_DEVELOPMENT' then g8 and g9 and g10 and g11 and app_private.project_requirement_satisfied_v1(pd.id,'SV.D20.DEVELOPER_AMBIGUITY_AUDIT') and app_private.project_requirement_satisfied_v1(pd.id,'SV.D20.READY_APPROVAL') and not exists(select 1 from public.project_definition_requirement_states s where s.project_definition_id=pd.id and s.applicable and s.blocker_status='OPEN') else ready end);
    insert into public.project_definition_gate_states(project_definition_id,gate_id,status,evaluation_fingerprint,details,definition_revision,evaluated_at) values(pd.id,gate,case when ready then 'READY' else 'NOT_READY' end,fp,details,pd.definition_revision,now()) on conflict(project_definition_id,gate_id) do update set status=excluded.status,evaluation_fingerprint=excluded.evaluation_fingerprint,details=excluded.details,definition_revision=excluded.definition_revision,evaluated_at=excluded.evaluated_at;
  end loop;
  return jsonb_build_object('project_definition_id',pd.id,'definition_revision',pd.definition_revision,'evaluation_fingerprint',fp,'G8',case when g8 then 'READY' else 'NOT_READY' end,'G9',case when g9 then 'READY' else 'NOT_READY' end,'G10',case when g10 then 'READY' else 'NOT_READY' end,'G11',case when g11 then 'READY' else 'NOT_READY' end,'G12',case when g12 then 'READY' else 'NOT_READY' end,'G12_preconditions_ready',g8 and g9 and g10 and g11 and app_private.project_requirement_satisfied_v1(pd.id,'SV.D20.DEVELOPER_AMBIGUITY_AUDIT') and app_private.project_requirement_satisfied_v1(pd.id,'SV.D20.READY_APPROVAL') and not exists(select 1 from public.project_definition_requirement_states s where s.project_definition_id=pd.id and s.applicable and s.blocker_status='OPEN'));
end;
$$;

create or replace function public.create_project_definition_artifact_v1(p_project_definition_id uuid,p_expected_definition_revision bigint,p_artifact_key text,p_payload jsonb,p_file_refs jsonb,p_idempotency_key text)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_pd public.project_definitions; v_idea public.ideas; v_existing public.idea_artifacts; v_prev public.idea_artifacts; v_expected_fp text; v_request_fp text; v_version integer; v_artifact_id uuid; v_purpose text; v_spec text; v_hash text;
begin
  if p_artifact_key not in ('A19_EXPERIENCE_INFORMATION_ARCHITECTURE_SPEC','A20_CONTENT_DISCOVERABILITY_SPEC','A21_FUNCTIONAL_DATA_INTEGRATION_SPEC','A22_DESIGN_DEFINITION','A23_TECHNICAL_NFR_DEFINITION','A24_VERIFICATION_ACCEPTANCE_PLAN','A25_BUILD_READY_PROJECT_SPECIFICATION') then raise exception 'UNSUPPORTED_PROJECT_ARTIFACT_KEY'; end if;
  if p_payload is null or jsonb_typeof(p_payload)<>'object' or p_file_refs is null or jsonb_typeof(p_file_refs)<>'array' then raise exception 'INVALID_PROJECT_ARTIFACT_PAYLOAD'; end if;
  select pd.* into v_pd from public.project_definitions pd where pd.id=p_project_definition_id for update; if v_pd.id is null then raise exception 'PROJECT_DEFINITION_NOT_FOUND'; end if; if v_pd.definition_revision<>p_expected_definition_revision then raise exception 'STALE_PROJECT_DEFINITION'; end if;
  select i.* into v_idea from public.ideas i where i.id=v_pd.idea_id; v_expected_fp:=app_private.project_artifact_expected_fingerprint_v1(v_pd.id,p_artifact_key); if v_expected_fp is null then raise exception 'PROJECT_ARTIFACT_FINGERPRINT_UNAVAILABLE'; end if;
  v_request_fp:=md5(jsonb_build_object('artifact_key',p_artifact_key,'payload',p_payload,'file_refs',p_file_refs,'input_fingerprint',v_expected_fp,'definition_revision',v_pd.definition_revision)::text);
  select a.* into v_existing from public.idea_artifacts a where a.idea_id=v_idea.id and a.idempotency_key=p_idempotency_key; if v_existing.id is not null then if v_existing.request_fingerprint<>v_request_fp then raise exception 'IDEMPOTENCY_KEY_REUSE'; end if; return jsonb_build_object('artifact_id',v_existing.id,'version',v_existing.version,'state',v_existing.state,'input_fingerprint',v_existing.input_fingerprint,'idempotent',true); end if;
  if p_artifact_key='A25_BUILD_READY_PROJECT_SPECIFICATION' then v_purpose:='FOR_BUILD'; v_spec:='BUILD_SPEC'; else v_purpose:='FOR_PROJECT'; v_spec:='PROJECT_DEFINITION'; end if;
  select a.* into v_prev from public.idea_artifacts a where a.idea_id=v_idea.id and a.artifact_key=p_artifact_key order by a.version desc limit 1; v_version:=coalesce(v_prev.version,0)+1;
  v_hash:=md5(jsonb_build_object('payload',p_payload,'file_refs',p_file_refs,'artifact_key',p_artifact_key,'input_fingerprint',v_expected_fp,'purpose',v_purpose,'spec',v_spec)::text);
  insert into public.idea_artifacts(idea_id,artifact_key,artifact_type,purpose_stage,version,state,payload,file_refs,source_snapshot_id,input_fingerprint,supersedes_artifact_id,created_engine_revision,content_hash,freshness_status,freshness_checked_at,spec_status,evidence_role,idempotency_key,request_fingerprint,project_definition_id)
  values(v_idea.id,p_artifact_key,p_artifact_key,v_purpose,v_version,'draft',p_payload,p_file_refs,v_pd.approved_idea_snapshot_id,v_expected_fp,v_prev.id,v_idea.engine_revision,v_hash,'fresh',now(),v_spec,'NOT_EVIDENCE',p_idempotency_key,v_request_fp,v_pd.id) returning idea_artifacts.id into v_artifact_id;
  return jsonb_build_object('artifact_id',v_artifact_id,'version',v_version,'state','draft','input_fingerprint',v_expected_fp,'idempotent',false);
end;
$$;

create or replace function public.promote_project_definition_artifact_v1(p_artifact_id uuid,p_expected_definition_revision bigint)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare a public.idea_artifacts; pd public.project_definitions; expected_fp text;
begin
  select * into a from public.idea_artifacts where id=p_artifact_id for update; if a.id is null or a.project_definition_id is null then raise exception 'PROJECT_ARTIFACT_NOT_FOUND'; end if;
  select * into pd from public.project_definitions where id=a.project_definition_id for update; if pd.definition_revision<>p_expected_definition_revision then raise exception 'STALE_PROJECT_DEFINITION'; end if;
  expected_fp:=app_private.project_artifact_expected_fingerprint_v1(pd.id,a.artifact_key); if a.input_fingerprint<>expected_fp or a.freshness_status<>'fresh' then raise exception 'PROJECT_ARTIFACT_INPUTS_STALE'; end if;
  if a.state='current' then return jsonb_build_object('artifact_id',a.id,'state','current','idempotent',true); end if; if a.state<>'draft' then raise exception 'PROJECT_ARTIFACT_NOT_PROMOTABLE'; end if;
  update public.idea_artifacts set state='superseded' where project_definition_id=pd.id and artifact_key=a.artifact_key and state='current' and id<>a.id; update public.idea_artifacts set state='current',promoted_at=now(),freshness_checked_at=now() where id=a.id;
  return jsonb_build_object('artifact_id',a.id,'state','current','input_fingerprint',expected_fp,'idempotent',false);
end;
$$;

create or replace function public.finalize_build_ready_v1(p_project_definition_id uuid,p_expected_definition_revision bigint,p_authorized_by uuid,p_idempotency_key text)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare pd public.project_definitions; idea public.ideas; rec public.project_definition_mutation_receipts; fp text; gates jsonb; key text; a public.idea_artifacts; artifacts jsonb:='[]'::jsonb; reqs jsonb; manifest jsonb; snap_hash text; snap_id uuid; result jsonb; authorized boolean;
begin
  select * into rec from public.project_definition_mutation_receipts where project_definition_id=p_project_definition_id and idempotency_key=p_idempotency_key; if rec.id is not null then return rec.result||jsonb_build_object('idempotent',true); end if;
  select * into pd from public.project_definitions where id=p_project_definition_id for update; if pd.id is null then raise exception 'PROJECT_DEFINITION_NOT_FOUND'; end if; if pd.definition_revision<>p_expected_definition_revision then raise exception 'STALE_PROJECT_DEFINITION'; end if;
  select * into idea from public.ideas where id=pd.idea_id; select (idea.created_by=p_authorized_by or exists(select 1 from public.workspace_members wm where wm.workspace_id=idea.workspace_id and wm.user_id=p_authorized_by and wm.status='active' and wm.role in ('owner','admin'))) into authorized; if not coalesce(authorized,false) then raise exception 'BUILD_READY_APPROVER_NOT_AUTHORIZED'; end if;
  gates:=public.evaluate_project_definition_gates_v1(pd.id); if gates->>'G8'<>'READY' or gates->>'G9'<>'READY' or gates->>'G10'<>'READY' or gates->>'G11'<>'READY' or coalesce((gates->>'G12_preconditions_ready')::boolean,false) is not true then raise exception 'BUILD_READY_GATES_NOT_SATISFIED'; end if;
  if not exists(select 1 from public.project_definition_requirement_states s where s.project_definition_id=pd.id and s.requirement_id='SV.D20.READY_APPROVAL' and s.accepted_by=p_authorized_by and app_private.project_requirement_satisfied_v1(pd.id,s.requirement_id)) then raise exception 'BUILD_READY_APPROVAL_MISMATCH'; end if;
  foreach key in array array['A19_EXPERIENCE_INFORMATION_ARCHITECTURE_SPEC','A20_CONTENT_DISCOVERABILITY_SPEC','A21_FUNCTIONAL_DATA_INTEGRATION_SPEC','A22_DESIGN_DEFINITION','A23_TECHNICAL_NFR_DEFINITION','A24_VERIFICATION_ACCEPTANCE_PLAN','A25_BUILD_READY_PROJECT_SPECIFICATION'] loop
    select * into a from public.idea_artifacts where project_definition_id=pd.id and artifact_key=key and state='current' order by version desc limit 1; if a.id is null or a.freshness_status<>'fresh' or a.input_fingerprint<>app_private.project_artifact_expected_fingerprint_v1(pd.id,key) then raise exception 'BUILD_READY_ARTIFACT_MISSING_OR_STALE: %',key; end if;
    artifacts:=artifacts||jsonb_build_array(jsonb_build_object('artifact_id',a.id,'artifact_key',a.artifact_key,'version',a.version,'content_hash',a.content_hash,'input_fingerprint',a.input_fingerprint,'purpose_stage',a.purpose_stage,'spec_status',a.spec_status));
  end loop;
  select jsonb_agg(jsonb_build_object('requirement_id',s.requirement_id,'applicable',s.applicable,'resolution_level',s.resolution_level,'value',s.value,'input_fingerprint',s.input_fingerprint,'authority_type',s.authority_type,'accepted_by',s.accepted_by,'owner_ref',s.owner_ref,'blocker_status',s.blocker_status,'acceptance_rule',s.acceptance_rule,'verify_result',s.verify_result) order by s.requirement_id) into reqs from public.project_definition_requirement_states s where s.project_definition_id=pd.id;
  fp:=app_private.project_definition_state_fingerprint_v1(pd.id); manifest:=jsonb_build_object('project_definition_id',pd.id,'project_definition_version',pd.version,'definition_revision',pd.definition_revision,'baseline_hash',pd.baseline_hash,'approved_idea_snapshot_id',pd.approved_idea_snapshot_id,'gate_evaluation',gates,'requirements',reqs,'artifacts',artifacts,'accepted_unknowns',pd.baseline_manifest->'accepted_unknowns','risks',pd.baseline_manifest->'risks','implementation_discretion',(select value from public.project_definition_requirement_states where project_definition_id=pd.id and requirement_id='SV.D20.IMPLEMENTATION_DISCRETION'),'authorized_by',p_authorized_by);
  snap_hash:=md5(jsonb_build_object('idea_id',pd.idea_id,'project_definition_id',pd.id,'definition_revision',pd.definition_revision,'manifest',manifest)::text);
  insert into public.idea_snapshots(idea_id,snapshot_type,blueprint_id,blueprint_version,engine_revision,manifest,content_hash,created_by,created_by_actor) values(pd.idea_id,'BUILD_READY_SNAPSHOT',idea.blueprint_id,idea.blueprint_version,idea.engine_revision,manifest,snap_hash,p_authorized_by,'human_decision') returning id into snap_id;
  update public.idea_artifacts set state='frozen',frozen_at=coalesce(frozen_at,now()) where project_definition_id=pd.id and state='current' and artifact_key=any(array['A19_EXPERIENCE_INFORMATION_ARCHITECTURE_SPEC','A20_CONTENT_DISCOVERABILITY_SPEC','A21_FUNCTIONAL_DATA_INTEGRATION_SPEC','A22_DESIGN_DEFINITION','A23_TECHNICAL_NFR_DEFINITION','A24_VERIFICATION_ACCEPTANCE_PLAN','A25_BUILD_READY_PROJECT_SPECIFICATION']);
  update public.project_definition_requirement_states set lock_state='FROZEN_FOR_BUILD',definition_revision=pd.definition_revision where project_definition_id=pd.id and applicable and state='current';
  update public.project_definitions set status='build_ready',build_ready_snapshot_id=snap_id,build_ready_hash=snap_hash where id=pd.id;
  insert into public.project_definition_gate_states(project_definition_id,gate_id,status,evaluation_fingerprint,details,definition_revision,evaluated_at) values(pd.id,'G12_READY_FOR_DEVELOPMENT','READY',fp,jsonb_build_object('build_ready_snapshot_id',snap_id,'snapshot_hash',snap_hash,'authorized_by',p_authorized_by),pd.definition_revision,now()) on conflict(project_definition_id,gate_id) do update set status='READY',evaluation_fingerprint=excluded.evaluation_fingerprint,details=excluded.details,definition_revision=excluded.definition_revision,evaluated_at=excluded.evaluated_at;
  result:=jsonb_build_object('project_definition_id',pd.id,'status','build_ready','build_ready_snapshot_id',snap_id,'build_ready_hash',snap_hash,'definition_revision',pd.definition_revision,'idempotent',false);
  insert into public.project_definition_mutation_receipts(project_definition_id,idempotency_key,request_fingerprint,result) values(pd.id,p_idempotency_key,md5(jsonb_build_object('definition_revision',pd.definition_revision,'authorized_by',p_authorized_by,'state_fingerprint',fp)::text),result);
  insert into public.audit_events(workspace_id,actor_id,event_type,entity_type,entity_id,payload) values(pd.workspace_id,p_authorized_by,'project_definition.build_ready','project_definition',pd.id,jsonb_build_object('build_ready_snapshot_id',snap_id,'definition_revision',pd.definition_revision,'snapshot_hash',snap_hash)); return result;
end;
$$;

revoke all on function public.initialize_project_definition_runtime_v1(uuid,text,text) from public,anon,authenticated;
revoke all on function public.set_project_requirement_applicability_v1(uuid,bigint,text,jsonb,text) from public,anon,authenticated;
revoke all on function public.commit_project_requirement_state_v1(uuid,bigint,text,text,jsonb,text,text,jsonb,uuid,text,text,text,jsonb,jsonb,text) from public,anon,authenticated;
revoke all on function public.evaluate_project_definition_gates_v1(uuid) from public,anon,authenticated;
revoke all on function public.create_project_definition_artifact_v1(uuid,bigint,text,jsonb,jsonb,text) from public,anon,authenticated;
revoke all on function public.promote_project_definition_artifact_v1(uuid,bigint) from public,anon,authenticated;
revoke all on function public.finalize_build_ready_v1(uuid,bigint,uuid,text) from public,anon,authenticated;
grant execute on function public.initialize_project_definition_runtime_v1(uuid,text,text) to service_role;
grant execute on function public.set_project_requirement_applicability_v1(uuid,bigint,text,jsonb,text) to service_role;
grant execute on function public.commit_project_requirement_state_v1(uuid,bigint,text,text,jsonb,text,text,jsonb,uuid,text,text,text,jsonb,jsonb,text) to service_role;
grant execute on function public.evaluate_project_definition_gates_v1(uuid) to service_role;
grant execute on function public.create_project_definition_artifact_v1(uuid,bigint,text,jsonb,jsonb,text) to service_role;
grant execute on function public.promote_project_definition_artifact_v1(uuid,bigint) to service_role;
grant execute on function public.finalize_build_ready_v1(uuid,bigint,uuid,text) to service_role;
