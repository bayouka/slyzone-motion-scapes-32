-- 4b4c Idea Engine R5 Decision Package / Snapshot / Review / Decision

alter table public.idea_artifacts drop constraint if exists idea_artifacts_spec_status_check;
alter table public.idea_artifacts
  add constraint idea_artifacts_spec_status_check
  check (spec_status in ('CONCEPT_NOT_FINAL_SPEC','DECISION_PACKAGE_OUTPUT','PROJECT_DEFINITION','BUILD_SPEC'));

create table public.idea_decision_packages (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.ideas(id) on delete cascade,
  decision_snapshot_id uuid not null references public.idea_snapshots(id) on delete restrict,
  version integer not null check (version > 0),
  mode text not null check (mode in ('SOLO_DECISION_BRIEF','TEAM_DECISION_PACKAGE','COMMITTEE_INVESTMENT_PACKAGE')),
  decision_sought text not null check (nullif(btrim(decision_sought),'') is not null),
  state text not null default 'draft' check (state in ('draft','current','frozen','stale','superseded')),
  snapshot_engine_revision bigint not null check (snapshot_engine_revision >= 0),
  snapshot_content_hash text not null,
  input_manifest jsonb not null default '{}'::jsonb check (jsonb_typeof(input_manifest)='object'),
  output_artifact_ids uuid[] not null default array[]::uuid[],
  package_hash text not null,
  idempotency_key text null,
  request_fingerprint text null,
  stale_reason text null,
  promoted_at timestamptz null,
  frozen_at timestamptz null,
  created_by uuid null references auth.users(id) on delete set null,
  created_by_actor text not null default 'system',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (idea_id,version)
);

create unique index idea_decision_packages_current_uidx on public.idea_decision_packages(idea_id) where state='current';
create unique index idea_decision_packages_idempotency_uidx on public.idea_decision_packages(idea_id,idempotency_key) where idempotency_key is not null;
create index idea_decision_packages_snapshot_idx on public.idea_decision_packages(decision_snapshot_id);
create index idea_decision_packages_created_by_idx on public.idea_decision_packages(created_by) where created_by is not null;
create trigger idea_decision_packages_set_updated_at before update on public.idea_decision_packages for each row execute function app_private.set_updated_at();

create table public.idea_decision_feedback (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.ideas(id) on delete cascade,
  package_id uuid not null references public.idea_decision_packages(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete restrict,
  feedback_type text not null check (feedback_type in ('NEW_INFO','CORRECTION','IDEA_PROPOSAL','CHANGE_REQUEST','ASSUMPTION_CHALLENGE','RISK','PREFERENCE','QUESTION','DECISION')),
  body text not null check (nullif(btrim(body),'') is not null),
  target_ref jsonb not null default '{}'::jsonb check (jsonb_typeof(target_ref)='object'),
  materiality text not null check (materiality in ('COSMETIC','LOCAL','SUBSTANTIVE','CRITICAL')),
  proposed_resolution jsonb not null default '{}'::jsonb check (jsonb_typeof(proposed_resolution)='object'),
  status text not null default 'open' check (status in ('open','resolved','rejected','superseded')),
  change_impact jsonb not null default '{}'::jsonb check (jsonb_typeof(change_impact)='object'),
  engine_revision_created bigint not null check (engine_revision_created >= 0),
  idempotency_key text null,
  request_fingerprint text null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz null
);

create unique index idea_decision_feedback_idempotency_uidx on public.idea_decision_feedback(package_id,idempotency_key) where idempotency_key is not null;
create index idea_decision_feedback_idea_status_idx on public.idea_decision_feedback(idea_id,status,created_at desc);
create index idea_decision_feedback_author_idx on public.idea_decision_feedback(author_id);

create table public.idea_decision_records_v2 (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.ideas(id) on delete cascade,
  package_id uuid not null references public.idea_decision_packages(id) on delete restrict,
  decision_snapshot_id uuid not null references public.idea_snapshots(id) on delete restrict,
  outcome text not null check (outcome in ('APPROVE_TO_PROJECT','APPROVE_WITH_CHANGES','REVISE','DEEPEN_RESEARCH','PAUSE','STOP','INSUFFICIENT_INFORMATION')),
  rationale text not null default '',
  conditions jsonb not null default '[]'::jsonb check (jsonb_typeof(conditions)='array'),
  conditions_resolved boolean not null default false,
  gate_g7_ready boolean not null default false,
  gate_evaluation_fingerprint text not null,
  promotable boolean not null default false,
  decided_by uuid not null references auth.users(id) on delete restrict,
  decided_engine_revision bigint not null check (decided_engine_revision >= 0),
  decision_hash text not null,
  idempotency_key text null,
  request_fingerprint text null,
  decided_at timestamptz not null default now()
);

create unique index idea_decision_records_v2_idempotency_uidx on public.idea_decision_records_v2(idea_id,idempotency_key) where idempotency_key is not null;
create index idea_decision_records_v2_package_idx on public.idea_decision_records_v2(package_id);
create index idea_decision_records_v2_snapshot_idx on public.idea_decision_records_v2(decision_snapshot_id);
create index idea_decision_records_v2_decided_by_idx on public.idea_decision_records_v2(decided_by);

create or replace function app_private.prevent_decision_record_mutation_v1()
returns trigger
language plpgsql
set search_path=''
as $$
begin
  raise exception 'DECISION_RECORD_IMMUTABLE' using errcode='55000';
end;
$$;

create trigger idea_decision_records_v2_immutable_update before update on public.idea_decision_records_v2 for each row execute function app_private.prevent_decision_record_mutation_v1();
create trigger idea_decision_records_v2_immutable_delete before delete on public.idea_decision_records_v2 for each row execute function app_private.prevent_decision_record_mutation_v1();

alter table public.idea_decision_packages enable row level security;
alter table public.idea_decision_feedback enable row level security;
alter table public.idea_decision_records_v2 enable row level security;

create policy idea_decision_packages_select_v1 on public.idea_decision_packages for select to authenticated using (app_private.can_access_idea(idea_id));
create policy idea_decision_feedback_select_v1 on public.idea_decision_feedback for select to authenticated using (app_private.can_access_idea(idea_id));
create policy idea_decision_records_v2_select_v1 on public.idea_decision_records_v2 for select to authenticated using (app_private.can_access_idea(idea_id));

revoke all on table public.idea_decision_packages, public.idea_decision_feedback, public.idea_decision_records_v2 from anon,authenticated;
grant select on table public.idea_decision_packages, public.idea_decision_feedback, public.idea_decision_records_v2 to authenticated;
grant all on table public.idea_decision_packages, public.idea_decision_feedback, public.idea_decision_records_v2 to service_role;

create or replace function public.create_decision_snapshot_v1(
  p_idea_id uuid,
  p_expected_engine_revision bigint,
  p_artifact_ids uuid[],
  p_manifest jsonb
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_idea public.ideas;
  v_art public.idea_artifacts;
  v_artifacts jsonb := '[]'::jsonb;
  v_manifest jsonb;
  v_hash text;
  v_existing public.idea_snapshots;
  v_snapshot_id uuid;
  v_revision bigint;
  v_changed boolean := false;
  v_id uuid;
begin
  if p_manifest is null or jsonb_typeof(p_manifest)<>'object' then raise exception 'SNAPSHOT_MANIFEST_MUST_BE_OBJECT'; end if;
  select * into v_idea from public.ideas where id=p_idea_id for update;
  if v_idea.id is null then raise exception 'IDEA_NOT_FOUND'; end if;
  if v_idea.blueprint_id is null or v_idea.blueprint_status<>'active' then raise exception 'IDEA_ENGINE_NOT_INITIALIZED'; end if;
  if v_idea.engine_revision<>p_expected_engine_revision then raise exception 'STALE_ENGINE'; end if;

  foreach v_id in array coalesce(p_artifact_ids,array[]::uuid[]) loop
    select * into v_art from public.idea_artifacts where id=v_id for update;
    if v_art.id is null or v_art.idea_id<>p_idea_id then raise exception 'SNAPSHOT_ARTIFACT_NOT_FOUND'; end if;
    if v_art.purpose_stage<>'FOR_DECISION' then raise exception 'SNAPSHOT_ARTIFACT_PURPOSE_INVALID'; end if;
    if v_art.spec_status not in ('CONCEPT_NOT_FINAL_SPEC','DECISION_PACKAGE_OUTPUT') then raise exception 'SNAPSHOT_ARTIFACT_SPEC_BOUNDARY'; end if;
    if v_art.freshness_status<>'fresh' or v_art.state not in ('current','frozen') then raise exception 'SNAPSHOT_ARTIFACT_NOT_FRESH_CURRENT'; end if;
    if v_art.state='current' then
      update public.idea_artifacts set state='frozen',frozen_at=coalesce(frozen_at,now()),freshness_checked_at=now() where id=v_art.id;
      v_changed := true;
    end if;
    v_artifacts := v_artifacts || jsonb_build_array(jsonb_build_object(
      'artifact_id',v_art.id,'artifact_key',v_art.artifact_key,'artifact_type',v_art.artifact_type,'version',v_art.version,
      'content_hash',v_art.content_hash,'input_fingerprint',v_art.input_fingerprint,'spec_status',v_art.spec_status,
      'evidence_role',v_art.evidence_role,'state','frozen'
    ));
  end loop;

  if v_changed then
    update public.ideas set engine_revision=engine_revision+1 where id=p_idea_id returning engine_revision into v_revision;
  else
    v_revision := v_idea.engine_revision;
  end if;

  v_manifest := p_manifest || jsonb_build_object('artifact_versions',v_artifacts,'snapshot_engine_revision',v_revision);
  v_hash := md5(jsonb_build_object('blueprint_id',v_idea.blueprint_id,'blueprint_version',v_idea.blueprint_version,'engine_revision',v_revision,'manifest',v_manifest)::text);

  select * into v_existing from public.idea_snapshots where idea_id=p_idea_id and snapshot_type='DECISION_SNAPSHOT' and content_hash=v_hash;
  if v_existing.id is not null then
    return jsonb_build_object('snapshot_id',v_existing.id,'engine_revision',v_existing.engine_revision,'content_hash',v_existing.content_hash,'idempotent',true);
  end if;

  insert into public.idea_snapshots(idea_id,snapshot_type,blueprint_id,blueprint_version,engine_revision,manifest,content_hash,created_by_actor)
  values(p_idea_id,'DECISION_SNAPSHOT',v_idea.blueprint_id,v_idea.blueprint_version,v_revision,v_manifest,v_hash,'system') returning id into v_snapshot_id;

  insert into public.audit_events(workspace_id,actor_id,event_type,entity_type,entity_id,payload)
  values(v_idea.workspace_id,null,'idea.decision_snapshot_created','idea_snapshot',v_snapshot_id,jsonb_build_object('idea_id',p_idea_id,'engine_revision',v_revision,'artifact_count',coalesce(cardinality(p_artifact_ids),0),'content_hash',v_hash));

  return jsonb_build_object('snapshot_id',v_snapshot_id,'engine_revision',v_revision,'content_hash',v_hash,'idempotent',false);
end;
$$;

create or replace function public.create_decision_package_v1(
  p_idea_id uuid,
  p_decision_snapshot_id uuid,
  p_mode text,
  p_decision_sought text,
  p_input_manifest jsonb,
  p_outputs jsonb,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_idea public.ideas;
  v_snap public.idea_snapshots;
  v_existing public.idea_decision_packages;
  v_version integer;
  v_package_id uuid;
  v_output jsonb;
  v_key text;
  v_type text;
  v_payload jsonb;
  v_files jsonb;
  v_prev public.idea_artifacts;
  v_art_version integer;
  v_art_id uuid;
  v_output_ids uuid[] := array[]::uuid[];
  v_art_hash text;
  v_request_fp text;
  v_package_hash text;
begin
  if p_mode not in ('SOLO_DECISION_BRIEF','TEAM_DECISION_PACKAGE','COMMITTEE_INVESTMENT_PACKAGE') then raise exception 'INVALID_DECISION_PACKAGE_MODE'; end if;
  if nullif(btrim(p_decision_sought),'') is null then raise exception 'DECISION_SOUGHT_REQUIRED'; end if;
  if p_input_manifest is null or jsonb_typeof(p_input_manifest)<>'object' then raise exception 'PACKAGE_INPUT_MANIFEST_MUST_BE_OBJECT'; end if;
  if p_outputs is null or jsonb_typeof(p_outputs)<>'array' then raise exception 'PACKAGE_OUTPUTS_MUST_BE_ARRAY'; end if;
  if jsonb_array_length(p_outputs)=0 or jsonb_array_length(p_outputs)>10 then raise exception 'PACKAGE_OUTPUT_COUNT_INVALID'; end if;
  if nullif(btrim(p_idempotency_key),'') is null then raise exception 'IDEMPOTENCY_KEY_REQUIRED'; end if;

  select * into v_idea from public.ideas where id=p_idea_id for update;
  if v_idea.id is null then raise exception 'IDEA_NOT_FOUND'; end if;
  select * into v_snap from public.idea_snapshots where id=p_decision_snapshot_id and idea_id=p_idea_id and snapshot_type='DECISION_SNAPSHOT';
  if v_snap.id is null then raise exception 'DECISION_SNAPSHOT_NOT_FOUND'; end if;
  if v_snap.engine_revision<>v_idea.engine_revision then raise exception 'DECISION_SNAPSHOT_STALE'; end if;

  v_request_fp := md5(jsonb_build_object('snapshot_id',p_decision_snapshot_id,'mode',p_mode,'decision_sought',p_decision_sought,'input_manifest',p_input_manifest,'outputs',p_outputs)::text);
  select * into v_existing from public.idea_decision_packages where idea_id=p_idea_id and idempotency_key=p_idempotency_key;
  if v_existing.id is not null then
    if v_existing.request_fingerprint is distinct from v_request_fp then raise exception 'IDEMPOTENCY_KEY_REUSE'; end if;
    return jsonb_build_object('package_id',v_existing.id,'version',v_existing.version,'state',v_existing.state,'idempotent',true);
  end if;

  for v_output in select value from jsonb_array_elements(p_outputs) loop
    v_key := v_output->>'artifact_key';
    if v_key not in ('D22.EXECUTIVE_MEMO','D22.DECISION_DECK','D22.PDF_FALLBACK','D22.EVIDENCE_APPENDIX','D22.SPEAKER_NOTES','D22.REVIEW_AGENDA') then raise exception 'UNSUPPORTED_DECISION_PACKAGE_ARTIFACT'; end if;
    v_type := coalesce(nullif(v_output->>'artifact_type',''),v_key);
    v_payload := coalesce(v_output->'payload','{}'::jsonb);
    v_files := coalesce(v_output->'file_refs','[]'::jsonb);
    if jsonb_typeof(v_payload)<>'object' or jsonb_typeof(v_files)<>'array' then raise exception 'INVALID_DECISION_PACKAGE_OUTPUT'; end if;

    select * into v_prev from public.idea_artifacts where idea_id=p_idea_id and artifact_key=v_key order by version desc limit 1;
    v_art_version := coalesce(v_prev.version,0)+1;
    v_art_hash := md5(jsonb_build_object('payload',v_payload,'file_refs',v_files,'artifact_type',v_type,'snapshot_hash',v_snap.content_hash)::text);
    insert into public.idea_artifacts(
      idea_id,artifact_key,artifact_type,purpose_stage,version,state,payload,file_refs,source_snapshot_id,input_fingerprint,
      supersedes_artifact_id,created_engine_revision,content_hash,freshness_status,freshness_checked_at,spec_status,evidence_role
    ) values (
      p_idea_id,v_key,v_type,'FOR_DECISION',v_art_version,'draft',v_payload,v_files,v_snap.id,v_snap.content_hash,
      v_prev.id,v_snap.engine_revision,v_art_hash,'fresh',now(),'DECISION_PACKAGE_OUTPUT','NOT_EVIDENCE'
    ) returning id into v_art_id;
    v_output_ids := array_append(v_output_ids,v_art_id);
  end loop;

  select coalesce(max(version),0)+1 into v_version from public.idea_decision_packages where idea_id=p_idea_id;
  v_package_hash := md5(jsonb_build_object('snapshot_hash',v_snap.content_hash,'mode',p_mode,'decision_sought',p_decision_sought,'input_manifest',p_input_manifest,'output_artifact_ids',to_jsonb(v_output_ids))::text);

  insert into public.idea_decision_packages(
    idea_id,decision_snapshot_id,version,mode,decision_sought,state,snapshot_engine_revision,snapshot_content_hash,input_manifest,output_artifact_ids,package_hash,idempotency_key,request_fingerprint
  ) values (
    p_idea_id,v_snap.id,v_version,p_mode,p_decision_sought,'draft',v_snap.engine_revision,v_snap.content_hash,p_input_manifest,v_output_ids,v_package_hash,p_idempotency_key,v_request_fp
  ) returning id into v_package_id;

  insert into public.audit_events(workspace_id,actor_id,event_type,entity_type,entity_id,payload)
  values(v_idea.workspace_id,null,'idea.decision_package_created','idea_decision_package',v_package_id,jsonb_build_object('idea_id',p_idea_id,'version',v_version,'mode',p_mode,'snapshot_id',v_snap.id,'output_count',cardinality(v_output_ids)));

  return jsonb_build_object('package_id',v_package_id,'version',v_version,'state','draft','output_artifact_ids',to_jsonb(v_output_ids),'idempotent',false);
end;
$$;

create or replace function public.assess_decision_package_freshness_v1(p_package_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $$
declare
  v_pkg public.idea_decision_packages;
  v_revision bigint;
  v_outputs_fresh boolean;
begin
  select * into v_pkg from public.idea_decision_packages where id=p_package_id;
  if v_pkg.id is null then raise exception 'DECISION_PACKAGE_NOT_FOUND'; end if;
  select engine_revision into v_revision from public.ideas where id=v_pkg.idea_id;
  select coalesce(bool_and(a.freshness_status='fresh' and a.input_fingerprint=v_pkg.snapshot_content_hash and a.source_snapshot_id=v_pkg.decision_snapshot_id),false)
    into v_outputs_fresh
  from public.idea_artifacts a where a.id=any(v_pkg.output_artifact_ids);
  return jsonb_build_object(
    'package_id',v_pkg.id,'idea_id',v_pkg.idea_id,'state',v_pkg.state,
    'snapshot_revision_match',v_pkg.snapshot_engine_revision=v_revision,
    'outputs_fresh',v_outputs_fresh,
    'effective_freshness',case when v_pkg.snapshot_engine_revision=v_revision and v_outputs_fresh and v_pkg.state<>'stale' then 'fresh' else 'stale' end,
    'current_engine_revision',v_revision,'snapshot_engine_revision',v_pkg.snapshot_engine_revision
  );
end;
$$;

create or replace function public.promote_decision_package_v1(
  p_package_id uuid,
  p_expected_engine_revision bigint
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_pkg public.idea_decision_packages;
  v_idea public.ideas;
  v_art public.idea_artifacts;
begin
  select * into v_pkg from public.idea_decision_packages where id=p_package_id for update;
  if v_pkg.id is null then raise exception 'DECISION_PACKAGE_NOT_FOUND'; end if;
  select * into v_idea from public.ideas where id=v_pkg.idea_id for update;
  if v_idea.engine_revision<>p_expected_engine_revision then raise exception 'STALE_ENGINE'; end if;
  if v_pkg.snapshot_engine_revision<>v_idea.engine_revision then raise exception 'DECISION_PACKAGE_STALE'; end if;
  if v_pkg.state='current' then return jsonb_build_object('package_id',v_pkg.id,'state','current','engine_revision',v_idea.engine_revision,'idempotent',true); end if;
  if v_pkg.state<>'draft' then raise exception 'DECISION_PACKAGE_NOT_PROMOTABLE'; end if;

  for v_art in select * from public.idea_artifacts where id=any(v_pkg.output_artifact_ids) for update loop
    if v_art.freshness_status<>'fresh' or v_art.input_fingerprint<>v_pkg.snapshot_content_hash or v_art.source_snapshot_id<>v_pkg.decision_snapshot_id then raise exception 'DECISION_PACKAGE_OUTPUT_STALE'; end if;
    if v_art.state<>'draft' then raise exception 'DECISION_PACKAGE_OUTPUT_NOT_DRAFT'; end if;
  end loop;

  update public.idea_decision_packages set state='superseded' where idea_id=v_pkg.idea_id and state='current' and id<>v_pkg.id;
  update public.idea_decision_packages set state='current',promoted_at=now(),stale_reason=null where id=v_pkg.id;

  update public.idea_artifacts olda set state='superseded'
  where olda.idea_id=v_pkg.idea_id and olda.state='current' and olda.id<>all(v_pkg.output_artifact_ids)
    and olda.artifact_key in (select artifact_key from public.idea_artifacts where id=any(v_pkg.output_artifact_ids));
  update public.idea_artifacts set state='current',promoted_at=now(),freshness_checked_at=now() where id=any(v_pkg.output_artifact_ids);

  insert into public.audit_events(workspace_id,actor_id,event_type,entity_type,entity_id,payload)
  values(v_idea.workspace_id,null,'idea.decision_package_promoted','idea_decision_package',v_pkg.id,jsonb_build_object('idea_id',v_pkg.idea_id,'version',v_pkg.version,'engine_revision',v_idea.engine_revision));

  return jsonb_build_object('package_id',v_pkg.id,'state','current','engine_revision',v_idea.engine_revision,'idempotent',false);
end;
$$;

create or replace function public.mark_decision_package_stale_v1(
  p_package_id uuid,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_pkg public.idea_decision_packages;
begin
  if nullif(btrim(p_reason),'') is null then raise exception 'STALE_REASON_REQUIRED'; end if;
  select * into v_pkg from public.idea_decision_packages where id=p_package_id for update;
  if v_pkg.id is null then raise exception 'DECISION_PACKAGE_NOT_FOUND'; end if;
  if v_pkg.state='stale' and v_pkg.stale_reason=p_reason then return jsonb_build_object('package_id',v_pkg.id,'state','stale','idempotent',true); end if;
  if v_pkg.state in ('superseded','frozen') then raise exception 'HISTORICAL_DECISION_PACKAGE_NOT_STALEABLE'; end if;
  update public.idea_decision_packages set state='stale',stale_reason=p_reason where id=v_pkg.id;
  update public.idea_artifacts set freshness_status='stale',stale_reason=p_reason,freshness_checked_at=now(),state=case when state='frozen' then 'frozen' else 'stale' end where id=any(v_pkg.output_artifact_ids);
  return jsonb_build_object('package_id',v_pkg.id,'state','stale','idempotent',false);
end;
$$;

create or replace function public.record_decision_feedback_v1(
  p_package_id uuid,
  p_author_id uuid,
  p_feedback_type text,
  p_body text,
  p_target_ref jsonb,
  p_materiality text,
  p_proposed_resolution jsonb,
  p_change_impact jsonb,
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
  v_existing public.idea_decision_feedback;
  v_feedback_id uuid;
  v_fp text;
  v_revision bigint;
  v_authorized boolean;
begin
  if p_feedback_type not in ('NEW_INFO','CORRECTION','IDEA_PROPOSAL','CHANGE_REQUEST','ASSUMPTION_CHALLENGE','RISK','PREFERENCE','QUESTION','DECISION') then raise exception 'INVALID_FEEDBACK_TYPE'; end if;
  if p_materiality not in ('COSMETIC','LOCAL','SUBSTANTIVE','CRITICAL') then raise exception 'INVALID_MATERIALITY'; end if;
  if nullif(btrim(p_body),'') is null then raise exception 'FEEDBACK_BODY_REQUIRED'; end if;
  if p_target_ref is null or jsonb_typeof(p_target_ref)<>'object' or p_proposed_resolution is null or jsonb_typeof(p_proposed_resolution)<>'object' or p_change_impact is null or jsonb_typeof(p_change_impact)<>'object' then raise exception 'INVALID_FEEDBACK_OBJECT'; end if;
  if nullif(btrim(p_idempotency_key),'') is null then raise exception 'IDEMPOTENCY_KEY_REQUIRED'; end if;

  select * into v_pkg from public.idea_decision_packages where id=p_package_id for update;
  if v_pkg.id is null then raise exception 'DECISION_PACKAGE_NOT_FOUND'; end if;
  select * into v_idea from public.ideas where id=v_pkg.idea_id for update;
  select (
    v_idea.created_by=p_author_id
    or exists(select 1 from public.idea_members im where im.idea_id=v_idea.id and im.user_id=p_author_id)
    or exists(select 1 from public.workspace_members wm where wm.workspace_id=v_idea.workspace_id and wm.user_id=p_author_id and wm.status='active' and wm.role in ('owner','admin'))
  ) into v_authorized;
  if not coalesce(v_authorized,false) then raise exception 'FEEDBACK_AUTHOR_NOT_AUTHORIZED'; end if;

  v_fp := md5(jsonb_build_object('package_id',p_package_id,'author_id',p_author_id,'feedback_type',p_feedback_type,'body',p_body,'target_ref',p_target_ref,'materiality',p_materiality,'proposed_resolution',p_proposed_resolution,'change_impact',p_change_impact)::text);
  select * into v_existing from public.idea_decision_feedback where package_id=p_package_id and idempotency_key=p_idempotency_key;
  if v_existing.id is not null then
    if v_existing.request_fingerprint is distinct from v_fp then raise exception 'IDEMPOTENCY_KEY_REUSE'; end if;
    return jsonb_build_object('feedback_id',v_existing.id,'engine_revision',v_idea.engine_revision,'idempotent',true);
  end if;

  if p_materiality='COSMETIC' then
    v_revision := v_idea.engine_revision;
  else
    update public.ideas set engine_revision=engine_revision+1 where id=v_idea.id returning engine_revision into v_revision;
    update public.idea_decision_packages set state='stale',stale_reason='REVIEW_FEEDBACK_'||p_materiality where id=v_pkg.id and state in ('draft','current');
    update public.idea_artifacts set freshness_status='stale',stale_reason='REVIEW_FEEDBACK_'||p_materiality,freshness_checked_at=now(),state=case when state='frozen' then 'frozen' else 'stale' end where id=any(v_pkg.output_artifact_ids);
  end if;

  insert into public.idea_decision_feedback(
    idea_id,package_id,author_id,feedback_type,body,target_ref,materiality,proposed_resolution,status,change_impact,engine_revision_created,idempotency_key,request_fingerprint
  ) values (
    v_idea.id,v_pkg.id,p_author_id,p_feedback_type,p_body,p_target_ref,p_materiality,p_proposed_resolution,'open',p_change_impact,v_revision,p_idempotency_key,v_fp
  ) returning id into v_feedback_id;

  insert into public.audit_events(workspace_id,actor_id,event_type,entity_type,entity_id,payload)
  values(v_idea.workspace_id,p_author_id,'idea.decision_feedback_recorded','idea_decision_feedback',v_feedback_id,jsonb_build_object('idea_id',v_idea.id,'package_id',v_pkg.id,'materiality',p_materiality,'engine_revision',v_revision));

  return jsonb_build_object('feedback_id',v_feedback_id,'engine_revision',v_revision,'package_stale',p_materiality<>'COSMETIC','idempotent',false);
end;
$$;

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

  insert into public.audit_events(workspace_id,actor_id,event_type,entity_id,payload)
  values(v_idea.workspace_id,p_decided_by,'idea.decision_recorded_v2',v_record_id,jsonb_build_object('idea_id',v_idea.id,'package_id',v_pkg.id,'outcome',p_outcome,'promotable',v_promotable,'engine_revision',v_idea.engine_revision));

  return jsonb_build_object('decision_record_id',v_record_id,'outcome',p_outcome,'promotable',v_promotable,'engine_revision',v_idea.engine_revision,'idempotent',false);
end;
$$;

revoke all on function public.create_decision_snapshot_v1(uuid,bigint,uuid[],jsonb) from public,anon,authenticated;
revoke all on function public.create_decision_package_v1(uuid,uuid,text,text,jsonb,jsonb,text) from public,anon,authenticated;
revoke all on function public.assess_decision_package_freshness_v1(uuid) from public,anon,authenticated;
revoke all on function public.promote_decision_package_v1(uuid,bigint) from public,anon,authenticated;
revoke all on function public.mark_decision_package_stale_v1(uuid,text) from public,anon,authenticated;
revoke all on function public.record_decision_feedback_v1(uuid,uuid,text,text,jsonb,text,jsonb,jsonb,text) from public,anon,authenticated;
revoke all on function public.record_idea_decision_v2(uuid,uuid,text,text,jsonb,boolean,boolean,text,text) from public,anon,authenticated;

grant execute on function public.create_decision_snapshot_v1(uuid,bigint,uuid[],jsonb) to service_role;
grant execute on function public.create_decision_package_v1(uuid,uuid,text,text,jsonb,jsonb,text) to service_role;
grant execute on function public.assess_decision_package_freshness_v1(uuid) to service_role;
grant execute on function public.promote_decision_package_v1(uuid,bigint) to service_role;
grant execute on function public.mark_decision_package_stale_v1(uuid,text) to service_role;
grant execute on function public.record_decision_feedback_v1(uuid,uuid,text,text,jsonb,text,jsonb,jsonb,text) to service_role;
grant execute on function public.record_idea_decision_v2(uuid,uuid,text,text,jsonb,boolean,boolean,text,text) to service_role;
