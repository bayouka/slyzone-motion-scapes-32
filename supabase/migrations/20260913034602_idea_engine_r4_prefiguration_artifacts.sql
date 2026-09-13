-- 4b4c Idea Engine R4 prefiguration / artifact lifecycle

alter table public.idea_artifacts
  add column supersedes_artifact_id uuid null,
  add column created_engine_revision bigint not null default 0 check (created_engine_revision >= 0),
  add column content_hash text null,
  add column freshness_status text not null default 'fresh' check (freshness_status in ('fresh','stale')),
  add column freshness_checked_at timestamptz null,
  add column stale_reason text null,
  add column promoted_at timestamptz null,
  add column frozen_at timestamptz null,
  add column spec_status text not null default 'CONCEPT_NOT_FINAL_SPEC' check (spec_status in ('CONCEPT_NOT_FINAL_SPEC','PROJECT_DEFINITION','BUILD_SPEC')),
  add column evidence_role text not null default 'NOT_EVIDENCE' check (evidence_role in ('NOT_EVIDENCE','SUPPORTING_EVIDENCE','REAL_USER_EVIDENCE')),
  add column idempotency_key text null,
  add column request_fingerprint text null;

alter table public.idea_artifacts
  add constraint idea_artifacts_supersedes_fkey
  foreign key (supersedes_artifact_id) references public.idea_artifacts(id) on delete restrict;

create unique index idea_artifacts_current_key_uidx
  on public.idea_artifacts(idea_id,artifact_key)
  where state='current';

create unique index idea_artifacts_idempotency_uidx
  on public.idea_artifacts(idea_id,idempotency_key)
  where idempotency_key is not null;

create index idea_artifacts_supersedes_idx on public.idea_artifacts(supersedes_artifact_id) where supersedes_artifact_id is not null;
create index idea_artifacts_freshness_idx on public.idea_artifacts(idea_id,freshness_status,state,updated_at desc);

create or replace function app_private.protect_idea_artifact_content_v1()
returns trigger
language plpgsql
set search_path=''
as $$
begin
  if new.idea_id is distinct from old.idea_id
     or new.artifact_key is distinct from old.artifact_key
     or new.artifact_type is distinct from old.artifact_type
     or new.purpose_stage is distinct from old.purpose_stage
     or new.version is distinct from old.version
     or new.payload is distinct from old.payload
     or new.file_refs is distinct from old.file_refs
     or new.input_fingerprint is distinct from old.input_fingerprint
     or new.created_by_action_run_id is distinct from old.created_by_action_run_id
     or new.created_by is distinct from old.created_by
     or new.created_at is distinct from old.created_at
     or new.supersedes_artifact_id is distinct from old.supersedes_artifact_id
     or new.created_engine_revision is distinct from old.created_engine_revision
     or new.content_hash is distinct from old.content_hash
     or new.spec_status is distinct from old.spec_status
     or new.evidence_role is distinct from old.evidence_role
     or new.idempotency_key is distinct from old.idempotency_key
     or new.request_fingerprint is distinct from old.request_fingerprint then
    raise exception 'IDEA_ARTIFACT_VERSION_IMMUTABLE' using errcode='55000';
  end if;
  return new;
end;
$$;

create trigger idea_artifacts_protect_content_v1
before update on public.idea_artifacts
for each row execute function app_private.protect_idea_artifact_content_v1();

create or replace function public.create_prefiguration_artifact_v1(
  p_idea_id uuid,
  p_expected_engine_revision bigint,
  p_artifact_key text,
  p_artifact_type text,
  p_input_fingerprint text,
  p_payload jsonb,
  p_file_refs jsonb,
  p_action_run_id uuid,
  p_evidence_role text,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_idea public.ideas;
  v_run public.idea_action_runs;
  v_existing public.idea_artifacts;
  v_previous public.idea_artifacts;
  v_version integer;
  v_id uuid;
  v_content_hash text;
  v_request_fp text;
begin
  if p_artifact_key not in ('PF.CONCEPT_JOURNEY','PF.CONCEPT_SITEMAP','PF.MESSAGE_HIERARCHY','PF.SEO_CONCEPT','PF.CAPABILITY_SET','PF.VISUAL_TERRITORIES','PF.HIFI_CONCEPT','PF.FEASIBILITY_ENVELOPE','PF.SUCCESS_MODEL','CV.CONCEPT_VALIDATION_RECORD','D21.DECISION_ECONOMICS','A08_CONCEPT_PREFIGURATION') then raise exception 'UNSUPPORTED_R4_ARTIFACT_KEY'; end if;
  if nullif(btrim(p_artifact_type),'') is null then raise exception 'ARTIFACT_TYPE_REQUIRED'; end if;
  if nullif(btrim(p_input_fingerprint),'') is null then raise exception 'INPUT_FINGERPRINT_REQUIRED'; end if;
  if p_payload is null or jsonb_typeof(p_payload)<>'object' then raise exception 'ARTIFACT_PAYLOAD_MUST_BE_OBJECT'; end if;
  if p_file_refs is null or jsonb_typeof(p_file_refs)<>'array' then raise exception 'ARTIFACT_FILE_REFS_MUST_BE_ARRAY'; end if;
  if p_evidence_role not in ('NOT_EVIDENCE','SUPPORTING_EVIDENCE','REAL_USER_EVIDENCE') then raise exception 'INVALID_EVIDENCE_ROLE'; end if;
  if p_artifact_key='PF.HIFI_CONCEPT' and p_evidence_role<>'NOT_EVIDENCE' then raise exception 'HIFI_CONCEPT_IS_NOT_USER_EVIDENCE'; end if;
  if nullif(btrim(p_idempotency_key),'') is null then raise exception 'IDEMPOTENCY_KEY_REQUIRED'; end if;

  select * into v_idea from public.ideas where id=p_idea_id for update;
  if v_idea.id is null then raise exception 'IDEA_NOT_FOUND'; end if;
  if v_idea.blueprint_id is null or v_idea.blueprint_status<>'active' then raise exception 'IDEA_ENGINE_NOT_INITIALIZED'; end if;

  v_request_fp := md5(jsonb_build_object('artifact_key',p_artifact_key,'artifact_type',p_artifact_type,'input_fingerprint',p_input_fingerprint,'payload',p_payload,'file_refs',p_file_refs,'action_run_id',p_action_run_id,'evidence_role',p_evidence_role)::text);
  select * into v_existing from public.idea_artifacts where idea_id=p_idea_id and idempotency_key=p_idempotency_key;
  if v_existing.id is not null then
    if v_existing.request_fingerprint is distinct from v_request_fp then raise exception 'IDEMPOTENCY_KEY_REUSE'; end if;
    return jsonb_build_object('artifact_id',v_existing.id,'version',v_existing.version,'state',v_existing.state,'idempotent',true,'engine_revision',v_idea.engine_revision);
  end if;

  if v_idea.engine_revision<>p_expected_engine_revision then raise exception 'STALE_ENGINE'; end if;

  if p_action_run_id is not null then
    select * into v_run from public.idea_action_runs where id=p_action_run_id;
    if v_run.id is null or v_run.idea_id<>p_idea_id then raise exception 'ACTION_RUN_NOT_FOUND'; end if;
    if v_run.status<>'succeeded' then raise exception 'ACTION_RUN_NOT_SUCCEEDED'; end if;
    if not (p_artifact_key = any(v_run.target_artifact_keys)) then raise exception 'ACTION_RUN_ARTIFACT_TARGET_MISMATCH'; end if;
    if v_run.input_fingerprint is distinct from p_input_fingerprint then raise exception 'ACTION_RUN_INPUT_FINGERPRINT_MISMATCH'; end if;
  end if;

  select * into v_previous from public.idea_artifacts where idea_id=p_idea_id and artifact_key=p_artifact_key order by version desc limit 1;
  v_version := coalesce(v_previous.version,0)+1;
  v_content_hash := md5(jsonb_build_object('payload',p_payload,'file_refs',p_file_refs,'artifact_type',p_artifact_type,'spec_status','CONCEPT_NOT_FINAL_SPEC','evidence_role',p_evidence_role)::text);

  insert into public.idea_artifacts(
    idea_id,artifact_key,artifact_type,purpose_stage,version,state,payload,file_refs,input_fingerprint,created_by_action_run_id,
    supersedes_artifact_id,created_engine_revision,content_hash,freshness_status,freshness_checked_at,spec_status,evidence_role,idempotency_key,request_fingerprint
  ) values (
    p_idea_id,p_artifact_key,p_artifact_type,'FOR_DECISION',v_version,'draft',p_payload,p_file_refs,p_input_fingerprint,p_action_run_id,
    v_previous.id,v_idea.engine_revision,v_content_hash,'fresh',now(),'CONCEPT_NOT_FINAL_SPEC',p_evidence_role,p_idempotency_key,v_request_fp
  ) returning id into v_id;

  insert into public.audit_events(workspace_id,actor_id,event_type,entity_type,entity_id,payload)
  values(v_idea.workspace_id,null,'idea.prefiguration_artifact_created','idea_artifact',v_id,jsonb_build_object('idea_id',p_idea_id,'artifact_key',p_artifact_key,'version',v_version,'engine_revision',v_idea.engine_revision));

  return jsonb_build_object('artifact_id',v_id,'version',v_version,'state','draft','idempotent',false,'engine_revision',v_idea.engine_revision);
end;
$$;

create or replace function public.promote_prefiguration_artifact_v1(
  p_artifact_id uuid,
  p_expected_engine_revision bigint,
  p_current_input_fingerprint text
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_art public.idea_artifacts;
  v_idea public.ideas;
  v_new_revision bigint;
begin
  select * into v_art from public.idea_artifacts where id=p_artifact_id for update;
  if v_art.id is null then raise exception 'ARTIFACT_NOT_FOUND'; end if;
  select * into v_idea from public.ideas where id=v_art.idea_id for update;
  if v_idea.engine_revision<>p_expected_engine_revision then raise exception 'STALE_ENGINE'; end if;
  if v_art.purpose_stage<>'FOR_DECISION' or v_art.spec_status<>'CONCEPT_NOT_FINAL_SPEC' then raise exception 'R4_ARTIFACT_BOUNDARY_VIOLATION'; end if;
  if v_art.input_fingerprint is distinct from p_current_input_fingerprint then raise exception 'ARTIFACT_INPUTS_STALE'; end if;
  if v_art.freshness_status<>'fresh' then raise exception 'ARTIFACT_ALREADY_STALE'; end if;
  if v_art.state='current' then return jsonb_build_object('artifact_id',v_art.id,'state','current','engine_revision',v_idea.engine_revision,'idempotent',true); end if;
  if v_art.state<>'draft' then raise exception 'ARTIFACT_NOT_PROMOTABLE'; end if;

  update public.idea_artifacts set state='superseded' where idea_id=v_art.idea_id and artifact_key=v_art.artifact_key and state='current' and id<>v_art.id;
  update public.idea_artifacts set state='current',promoted_at=now(),freshness_checked_at=now(),stale_reason=null where id=v_art.id;
  update public.ideas set engine_revision=engine_revision+1 where id=v_art.idea_id returning engine_revision into v_new_revision;

  insert into public.audit_events(workspace_id,actor_id,event_type,entity_type,entity_id,payload)
  values(v_idea.workspace_id,null,'idea.prefiguration_artifact_promoted','idea_artifact',v_art.id,jsonb_build_object('idea_id',v_art.idea_id,'artifact_key',v_art.artifact_key,'version',v_art.version,'engine_revision',v_new_revision));

  return jsonb_build_object('artifact_id',v_art.id,'state','current','engine_revision',v_new_revision,'idempotent',false);
end;
$$;

create or replace function public.mark_prefiguration_artifact_stale_v1(
  p_artifact_id uuid,
  p_expected_engine_revision bigint,
  p_current_input_fingerprint text,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_art public.idea_artifacts;
  v_idea public.ideas;
  v_new_revision bigint;
  v_state text;
begin
  if nullif(btrim(p_reason),'') is null then raise exception 'STALE_REASON_REQUIRED'; end if;
  select * into v_art from public.idea_artifacts where id=p_artifact_id for update;
  if v_art.id is null then raise exception 'ARTIFACT_NOT_FOUND'; end if;
  select * into v_idea from public.ideas where id=v_art.idea_id for update;
  if v_idea.engine_revision<>p_expected_engine_revision then raise exception 'STALE_ENGINE'; end if;
  if v_art.input_fingerprint is not distinct from p_current_input_fingerprint then raise exception 'ARTIFACT_FINGERPRINT_UNCHANGED'; end if;
  if v_art.freshness_status='stale' and v_art.stale_reason=p_reason then return jsonb_build_object('artifact_id',v_art.id,'state',v_art.state,'freshness_status','stale','engine_revision',v_idea.engine_revision,'idempotent',true); end if;
  if v_art.state in ('superseded','rejected') then raise exception 'HISTORICAL_ARTIFACT_NOT_STALEABLE'; end if;

  v_state := case when v_art.state='frozen' then 'frozen' else 'stale' end;
  update public.idea_artifacts set freshness_status='stale',freshness_checked_at=now(),stale_reason=p_reason,state=v_state where id=v_art.id;
  update public.ideas set engine_revision=engine_revision+1 where id=v_art.idea_id returning engine_revision into v_new_revision;

  insert into public.audit_events(workspace_id,actor_id,event_type,entity_type,entity_id,payload)
  values(v_idea.workspace_id,null,'idea.prefiguration_artifact_stale','idea_artifact',v_art.id,jsonb_build_object('idea_id',v_art.idea_id,'artifact_key',v_art.artifact_key,'version',v_art.version,'reason',p_reason,'engine_revision',v_new_revision));

  return jsonb_build_object('artifact_id',v_art.id,'state',v_state,'freshness_status','stale','engine_revision',v_new_revision,'idempotent',false);
end;
$$;

create or replace function public.freeze_prefiguration_artifact_v1(
  p_artifact_id uuid,
  p_expected_engine_revision bigint,
  p_current_input_fingerprint text,
  p_decision_snapshot_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_art public.idea_artifacts;
  v_idea public.ideas;
  v_snap public.idea_snapshots;
  v_new_revision bigint;
begin
  select * into v_art from public.idea_artifacts where id=p_artifact_id for update;
  if v_art.id is null then raise exception 'ARTIFACT_NOT_FOUND'; end if;
  select * into v_idea from public.ideas where id=v_art.idea_id for update;
  if v_idea.engine_revision<>p_expected_engine_revision then raise exception 'STALE_ENGINE'; end if;
  if v_art.input_fingerprint is distinct from p_current_input_fingerprint or v_art.freshness_status<>'fresh' then raise exception 'ARTIFACT_INPUTS_STALE'; end if;
  if v_art.state='frozen' then return jsonb_build_object('artifact_id',v_art.id,'state','frozen','engine_revision',v_idea.engine_revision,'idempotent',true); end if;
  if v_art.state<>'current' then raise exception 'ARTIFACT_NOT_CURRENT'; end if;
  if p_decision_snapshot_id is not null then
    select * into v_snap from public.idea_snapshots where id=p_decision_snapshot_id;
    if v_snap.id is null or v_snap.idea_id<>v_art.idea_id or v_snap.snapshot_type<>'DECISION_SNAPSHOT' then raise exception 'INVALID_DECISION_SNAPSHOT'; end if;
  end if;

  update public.idea_artifacts set state='frozen',frozen_at=now(),source_snapshot_id=coalesce(source_snapshot_id,p_decision_snapshot_id),freshness_checked_at=now() where id=v_art.id;
  update public.ideas set engine_revision=engine_revision+1 where id=v_art.idea_id returning engine_revision into v_new_revision;

  insert into public.audit_events(workspace_id,actor_id,event_type,entity_type,entity_id,payload)
  values(v_idea.workspace_id,null,'idea.prefiguration_artifact_frozen','idea_artifact',v_art.id,jsonb_build_object('idea_id',v_art.idea_id,'artifact_key',v_art.artifact_key,'version',v_art.version,'decision_snapshot_id',p_decision_snapshot_id,'engine_revision',v_new_revision));

  return jsonb_build_object('artifact_id',v_art.id,'state','frozen','engine_revision',v_new_revision,'idempotent',false);
end;
$$;

create or replace function public.assess_prefiguration_artifact_freshness_v1(
  p_artifact_id uuid,
  p_current_input_fingerprint text
)
returns jsonb
language sql
stable
security definer
set search_path=''
as $$
  select jsonb_build_object(
    'artifact_id',a.id,
    'idea_id',a.idea_id,
    'artifact_key',a.artifact_key,
    'version',a.version,
    'state',a.state,
    'stored_freshness_status',a.freshness_status,
    'exact_fingerprint_match',(a.input_fingerprint is not distinct from p_current_input_fingerprint),
    'effective_freshness',case when a.input_fingerprint is not distinct from p_current_input_fingerprint and a.freshness_status='fresh' then 'fresh' else 'stale' end,
    'spec_status',a.spec_status,
    'purpose_stage',a.purpose_stage
  )
  from public.idea_artifacts a
  where a.id=p_artifact_id;
$$;

revoke all on function public.create_prefiguration_artifact_v1(uuid,bigint,text,text,text,jsonb,jsonb,uuid,text,text) from public,anon,authenticated;
revoke all on function public.promote_prefiguration_artifact_v1(uuid,bigint,text) from public,anon,authenticated;
revoke all on function public.mark_prefiguration_artifact_stale_v1(uuid,bigint,text,text) from public,anon,authenticated;
revoke all on function public.freeze_prefiguration_artifact_v1(uuid,bigint,text,uuid) from public,anon,authenticated;
revoke all on function public.assess_prefiguration_artifact_freshness_v1(uuid,text) from public,anon,authenticated;

grant execute on function public.create_prefiguration_artifact_v1(uuid,bigint,text,text,text,jsonb,jsonb,uuid,text,text) to service_role;
grant execute on function public.promote_prefiguration_artifact_v1(uuid,bigint,text) to service_role;
grant execute on function public.mark_prefiguration_artifact_stale_v1(uuid,bigint,text,text) to service_role;
grant execute on function public.freeze_prefiguration_artifact_v1(uuid,bigint,text,uuid) to service_role;
grant execute on function public.assess_prefiguration_artifact_freshness_v1(uuid,text) to service_role;
