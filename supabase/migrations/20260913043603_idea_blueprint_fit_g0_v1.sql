-- 4b4c / 2b2c G0 Blueprint Fit integration baseline v1

create table public.idea_blueprint_fit_assessments (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.ideas(id) on delete cascade,
  input_engine_revision bigint not null check (input_engine_revision >= 0),
  input_fingerprint text not null,
  classification text not null check (classification in ('SITE_VITRINE','BLUEPRINT_MISMATCH','AMBIGUOUS')),
  candidate_type text null,
  confidence text not null check (confidence in ('HIGH','MEDIUM','LOW')),
  rationale text not null default '',
  evidence jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence)='array'),
  auto_applicable boolean not null default false,
  assessor_actor text not null check (assessor_actor in ('SYSTEM','AI')),
  method text not null default 'rule_or_model',
  model_ref text null,
  state text not null default 'current' check (state in ('current','superseded','resolved')),
  idempotency_key text not null,
  request_fingerprint text not null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz null,
  unique (idea_id,idempotency_key)
);
create unique index idea_blueprint_fit_assessments_current_uidx on public.idea_blueprint_fit_assessments(idea_id) where state='current';
create index idea_blueprint_fit_assessments_idea_created_idx on public.idea_blueprint_fit_assessments(idea_id,created_at desc);

create table public.idea_blueprint_fit_decisions (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.ideas(id) on delete cascade,
  assessment_id uuid null references public.idea_blueprint_fit_assessments(id) on delete set null,
  decision text not null check (decision in ('SITE_VITRINE','BLUEPRINT_MISMATCH')),
  blueprint_id text null,
  blueprint_version text null,
  candidate_type text null,
  decided_by_actor text not null check (decided_by_actor in ('HUMAN','SYSTEM')),
  decided_by uuid null references auth.users(id) on delete set null,
  rationale text not null default '',
  input_engine_revision bigint not null check (input_engine_revision >= 0),
  output_engine_revision bigint not null check (output_engine_revision > input_engine_revision),
  raw_source_id uuid not null references public.idea_sources(id) on delete restrict,
  idempotency_key text not null,
  request_fingerprint text not null,
  created_at timestamptz not null default now(),
  unique (idea_id,idempotency_key)
);
create index idea_blueprint_fit_decisions_idea_created_idx on public.idea_blueprint_fit_decisions(idea_id,created_at desc);
create index idea_blueprint_fit_decisions_assessment_idx on public.idea_blueprint_fit_decisions(assessment_id) where assessment_id is not null;
create index idea_blueprint_fit_decisions_decided_by_idx on public.idea_blueprint_fit_decisions(decided_by) where decided_by is not null;

alter table public.idea_blueprint_fit_assessments enable row level security;
alter table public.idea_blueprint_fit_decisions enable row level security;
create policy idea_blueprint_fit_assessments_select_v1 on public.idea_blueprint_fit_assessments for select to authenticated using (app_private.can_access_idea(idea_id));
create policy idea_blueprint_fit_decisions_select_v1 on public.idea_blueprint_fit_decisions for select to authenticated using (app_private.can_access_idea(idea_id));
revoke all on table public.idea_blueprint_fit_assessments from anon,authenticated;
revoke all on table public.idea_blueprint_fit_decisions from anon,authenticated;
grant select on table public.idea_blueprint_fit_assessments to authenticated;
grant select on table public.idea_blueprint_fit_decisions to authenticated;
grant all on table public.idea_blueprint_fit_assessments to service_role;
grant all on table public.idea_blueprint_fit_decisions to service_role;

create or replace function app_private.protect_blueprint_fit_decision_v1()
returns trigger language plpgsql set search_path='' as $$ begin raise exception 'BLUEPRINT_FIT_DECISION_IMMUTABLE' using errcode='55000'; end; $$;
create trigger idea_blueprint_fit_decisions_immutable_v1 before update on public.idea_blueprint_fit_decisions for each row execute function app_private.protect_blueprint_fit_decision_v1();

create or replace function app_private.blueprint_fit_input_fingerprint_v1(p_idea_id uuid)
returns text language sql stable set search_path='' as $$
  select md5(jsonb_build_object('idea_id',i.id,'engine_revision',i.engine_revision,'title',i.title,'current_description',i.current_description,'original_text_hash',md5(i.original_text))::text)
  from public.ideas i where i.id=p_idea_id;
$$;

create or replace function public.record_idea_blueprint_fit_assessment_v1(
  p_idea_id uuid,p_expected_engine_revision bigint,p_classification text,p_candidate_type text,p_confidence text,p_rationale text,
  p_evidence jsonb,p_auto_applicable boolean,p_assessor_actor text,p_method text,p_model_ref text,p_idempotency_key text
)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_idea public.ideas; v_existing public.idea_blueprint_fit_assessments; v_id uuid; v_input_fp text; v_request_fp text;
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
  v_request_fp:=md5(jsonb_build_object('idea_id',p_idea_id,'revision',p_expected_engine_revision,'input_fp',v_input_fp,'classification',p_classification,'candidate_type',p_candidate_type,'confidence',p_confidence,'rationale',coalesce(p_rationale,''),'evidence',p_evidence,'auto_applicable',p_auto_applicable,'assessor_actor',p_assessor_actor,'method',p_method,'model_ref',p_model_ref)::text);
  select * into v_existing from public.idea_blueprint_fit_assessments where idea_id=p_idea_id and idempotency_key=p_idempotency_key;
  if v_existing.id is not null then
    if v_existing.request_fingerprint<>v_request_fp then raise exception 'IDEMPOTENCY_KEY_REUSE'; end if;
    return jsonb_build_object('assessment_id',v_existing.id,'classification',v_existing.classification,'confidence',v_existing.confidence,'auto_applicable',v_existing.auto_applicable,'state',v_existing.state,'idempotent',true);
  end if;
  if v_idea.engine_revision<>p_expected_engine_revision then raise exception 'STALE_ENGINE'; end if;
  if v_idea.blueprint_status is not null then raise exception 'BLUEPRINT_FIT_ALREADY_RESOLVED'; end if;
  update public.idea_blueprint_fit_assessments set state='superseded' where idea_id=p_idea_id and state='current';
  insert into public.idea_blueprint_fit_assessments(idea_id,input_engine_revision,input_fingerprint,classification,candidate_type,confidence,rationale,evidence,auto_applicable,assessor_actor,method,model_ref,state,idempotency_key,request_fingerprint)
  values(p_idea_id,p_expected_engine_revision,v_input_fp,p_classification,nullif(btrim(p_candidate_type),''),p_confidence,coalesce(p_rationale,''),p_evidence,p_auto_applicable,p_assessor_actor,coalesce(nullif(btrim(p_method),''),'rule_or_model'),nullif(btrim(p_model_ref),''),'current',p_idempotency_key,v_request_fp)
  returning id into v_id;
  return jsonb_build_object('assessment_id',v_id,'classification',p_classification,'confidence',p_confidence,'auto_applicable',p_auto_applicable,'input_fingerprint',v_input_fp,'state','current','idempotent',false);
end; $$;

create or replace function app_private.resolve_idea_blueprint_fit_v1(
  p_idea_id uuid,p_expected_engine_revision bigint,p_decision text,p_assessment_id uuid,p_candidate_type text,p_decided_by_actor text,
  p_decided_by uuid,p_rationale text,p_enforce_assessment_match boolean,p_idempotency_key text
)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  v_idea public.ideas; v_assessment public.idea_blueprint_fit_assessments; v_existing public.idea_blueprint_fit_decisions;
  v_source_id uuid; v_revision bigint; v_request_fp text; v_candidate_type text; v_blueprint_id text; v_blueprint_version text;
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
  v_request_fp:=md5(jsonb_build_object('idea_id',p_idea_id,'revision',p_expected_engine_revision,'decision',p_decision,'assessment_id',p_assessment_id,'candidate_type',v_candidate_type,'actor',p_decided_by_actor,'decided_by',p_decided_by,'rationale',coalesce(p_rationale,''))::text);
  select * into v_existing from public.idea_blueprint_fit_decisions where idea_id=p_idea_id and idempotency_key=p_idempotency_key;
  if v_existing.id is not null then
    if v_existing.request_fingerprint<>v_request_fp then raise exception 'IDEMPOTENCY_KEY_REUSE'; end if;
    return jsonb_build_object('decision_id',v_existing.id,'decision',v_existing.decision,'blueprint_id',v_existing.blueprint_id,'blueprint_version',v_existing.blueprint_version,'engine_revision',v_existing.output_engine_revision,'raw_source_id',v_existing.raw_source_id,'idempotent',true);
  end if;
  if v_idea.engine_revision<>p_expected_engine_revision then raise exception 'STALE_ENGINE'; end if;
  if v_idea.blueprint_status is not null then raise exception 'BLUEPRINT_FIT_ALREADY_RESOLVED'; end if;
  if p_assessment_id is not null then
    if v_assessment.input_engine_revision<>v_idea.engine_revision or v_assessment.input_fingerprint<>app_private.blueprint_fit_input_fingerprint_v1(p_idea_id) then raise exception 'STALE_BLUEPRINT_ASSESSMENT'; end if;
    if v_assessment.state<>'current' then raise exception 'BLUEPRINT_ASSESSMENT_NOT_CURRENT'; end if;
    if p_enforce_assessment_match and v_assessment.classification<>p_decision then raise exception 'BLUEPRINT_ASSESSMENT_DECISION_MISMATCH'; end if;
  elsif p_enforce_assessment_match then raise exception 'BLUEPRINT_ASSESSMENT_REQUIRED'; end if;
  insert into public.idea_sources(idea_id,source_kind,locator,title,content_hash,source_version,status,sensitivity,created_by,idempotency_key,request_fingerprint)
  values(p_idea_id,'human_raw','ideas.original_text','Description originale',md5(v_idea.original_text),1,'ingested','internal',v_idea.created_by,'system:initial-original-text',md5(v_idea.original_text))
  on conflict (idea_id,idempotency_key) do nothing returning id into v_source_id;
  if v_source_id is null then select id into v_source_id from public.idea_sources where idea_id=p_idea_id and idempotency_key='system:initial-original-text'; end if;
  if p_decision='SITE_VITRINE' then
    v_blueprint_id:='SITE_VITRINE'; v_blueprint_version:='0.4';
    update public.ideas set blueprint_id=v_blueprint_id,blueprint_version=v_blueprint_version,blueprint_status='active',engine_revision=engine_revision+1 where id=p_idea_id returning engine_revision into v_revision;
  else
    v_blueprint_id:=null; v_blueprint_version:=null;
    update public.ideas set blueprint_id=null,blueprint_version=null,blueprint_status='mismatch',engine_revision=engine_revision+1 where id=p_idea_id returning engine_revision into v_revision;
  end if;
  insert into public.idea_blueprint_fit_decisions(idea_id,assessment_id,decision,blueprint_id,blueprint_version,candidate_type,decided_by_actor,decided_by,rationale,input_engine_revision,output_engine_revision,raw_source_id,idempotency_key,request_fingerprint)
  values(p_idea_id,p_assessment_id,p_decision,v_blueprint_id,v_blueprint_version,v_candidate_type,p_decided_by_actor,p_decided_by,coalesce(p_rationale,''),p_expected_engine_revision,v_revision,v_source_id,p_idempotency_key,v_request_fp)
  returning id into v_existing.id;
  if p_assessment_id is not null then update public.idea_blueprint_fit_assessments set state='resolved',resolved_at=now() where id=p_assessment_id; end if;
  insert into public.audit_events(workspace_id,actor_id,event_type,entity_type,entity_id,payload)
  values(v_idea.workspace_id,p_decided_by,'idea.blueprint_fit_resolved','idea',p_idea_id,jsonb_build_object('decision',p_decision,'assessment_id',p_assessment_id,'candidate_type',v_candidate_type,'actor',p_decided_by_actor,'revision_before',p_expected_engine_revision,'revision_after',v_revision,'raw_source_id',v_source_id));
  return jsonb_build_object('decision_id',v_existing.id,'decision',p_decision,'blueprint_id',v_blueprint_id,'blueprint_version',v_blueprint_version,'engine_revision',v_revision,'raw_source_id',v_source_id,'idempotent',false);
end; $$;

create or replace function public.confirm_idea_blueprint_fit_v1(p_idea_id uuid,p_expected_engine_revision bigint,p_decision text,p_assessment_id uuid,p_candidate_type text,p_human_note text,p_idempotency_key text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid(); begin
  if v_user is null or not app_private.can_write_idea(p_idea_id) then raise exception 'FORBIDDEN' using errcode='42501'; end if;
  return app_private.resolve_idea_blueprint_fit_v1(p_idea_id,p_expected_engine_revision,p_decision,p_assessment_id,p_candidate_type,'HUMAN',v_user,coalesce(p_human_note,''),false,p_idempotency_key);
end; $$;

create or replace function public.apply_assessed_blueprint_fit_v1(p_assessment_id uuid,p_idempotency_key text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_a public.idea_blueprint_fit_assessments; begin
  select * into v_a from public.idea_blueprint_fit_assessments where id=p_assessment_id;
  if v_a.id is null then raise exception 'BLUEPRINT_ASSESSMENT_NOT_FOUND'; end if;
  if v_a.state<>'current' then raise exception 'BLUEPRINT_ASSESSMENT_NOT_CURRENT'; end if;
  if v_a.confidence<>'HIGH' or not v_a.auto_applicable or v_a.classification='AMBIGUOUS' then raise exception 'BLUEPRINT_ASSESSMENT_NOT_AUTO_APPLICABLE'; end if;
  return app_private.resolve_idea_blueprint_fit_v1(v_a.idea_id,v_a.input_engine_revision,v_a.classification,v_a.id,v_a.candidate_type,'SYSTEM',null,v_a.rationale,true,p_idempotency_key);
end; $$;

revoke all on function public.record_idea_blueprint_fit_assessment_v1(uuid,bigint,text,text,text,text,jsonb,boolean,text,text,text,text) from public,anon,authenticated;
grant execute on function public.record_idea_blueprint_fit_assessment_v1(uuid,bigint,text,text,text,text,jsonb,boolean,text,text,text,text) to service_role;
revoke all on function public.apply_assessed_blueprint_fit_v1(uuid,text) from public,anon,authenticated;
grant execute on function public.apply_assessed_blueprint_fit_v1(uuid,text) to service_role;
revoke all on function public.confirm_idea_blueprint_fit_v1(uuid,bigint,text,uuid,text,text,text) from public,anon;
grant execute on function public.confirm_idea_blueprint_fit_v1(uuid,bigint,text,uuid,text,text,text) to authenticated,service_role;