-- 4b4c Idea Engine R6 Approved Idea -> Project Definition baseline

alter table public.project_definitions
  add column approved_decision_record_id uuid not null references public.idea_decision_records_v2(id) on delete restrict,
  add column decision_package_id uuid not null references public.idea_decision_packages(id) on delete restrict,
  add column baseline_manifest jsonb not null default '{}'::jsonb check (jsonb_typeof(baseline_manifest)='object'),
  add column promotion_diff jsonb not null default '{}'::jsonb check (jsonb_typeof(promotion_diff)='object'),
  add column baseline_hash text not null,
  add column created_engine_revision bigint not null default 0 check (created_engine_revision >= 0),
  add column idempotency_key text null,
  add column request_fingerprint text null;

alter table public.project_definitions
  add constraint project_definitions_approved_decision_record_id_key unique (approved_decision_record_id),
  add constraint project_definitions_idea_version_key unique (idea_id,version);

create unique index project_definitions_active_idea_uidx on public.project_definitions(idea_id) where status<>'superseded';
create unique index project_definitions_idempotency_uidx on public.project_definitions(idea_id,idempotency_key) where idempotency_key is not null;
create index project_definitions_decision_package_idx on public.project_definitions(decision_package_id);

create table public.project_definition_artifact_promotions (
  id uuid primary key default gen_random_uuid(),
  project_definition_id uuid not null references public.project_definitions(id) on delete cascade,
  source_artifact_id uuid not null references public.idea_artifacts(id) on delete restrict,
  promoted_artifact_id uuid null references public.idea_artifacts(id) on delete restrict,
  classification text not null check (classification in ('PROMOTE_DIRECTLY','PROMOTE_AND_DEEPEN','REWORK_TARGETED','DO_NOT_PROMOTE','SUPERSEDE')),
  target_domain text null,
  rationale text not null default '',
  created_at timestamptz not null default now(),
  unique (project_definition_id,source_artifact_id)
);

create index project_definition_artifact_promotions_source_idx on public.project_definition_artifact_promotions(source_artifact_id);
create index project_definition_artifact_promotions_promoted_idx on public.project_definition_artifact_promotions(promoted_artifact_id) where promoted_artifact_id is not null;

alter table public.project_definition_artifact_promotions enable row level security;
create policy project_definition_artifact_promotions_select_v1
on public.project_definition_artifact_promotions
for select to authenticated
using (
  exists (
    select 1 from public.project_definitions pd
    where pd.id=project_definition_id and app_private.can_access_idea(pd.idea_id)
  )
);

revoke all on table public.project_definition_artifact_promotions from anon,authenticated;
grant select on table public.project_definition_artifact_promotions to authenticated;
grant all on table public.project_definition_artifact_promotions to service_role;

create or replace function app_private.protect_project_definition_baseline_v1()
returns trigger
language plpgsql
set search_path=''
as $$
begin
  if new.idea_id is distinct from old.idea_id
     or new.workspace_id is distinct from old.workspace_id
     or new.approved_idea_snapshot_id is distinct from old.approved_idea_snapshot_id
     or new.approved_decision_record_id is distinct from old.approved_decision_record_id
     or new.decision_package_id is distinct from old.decision_package_id
     or new.version is distinct from old.version
     or new.baseline_manifest is distinct from old.baseline_manifest
     or new.promotion_diff is distinct from old.promotion_diff
     or new.baseline_hash is distinct from old.baseline_hash
     or new.created_engine_revision is distinct from old.created_engine_revision
     or new.idempotency_key is distinct from old.idempotency_key
     or new.request_fingerprint is distinct from old.request_fingerprint
     or new.created_at is distinct from old.created_at then
    raise exception 'PROJECT_DEFINITION_BASELINE_IMMUTABLE' using errcode='55000';
  end if;
  return new;
end;
$$;

create trigger project_definitions_protect_baseline_v1
before update on public.project_definitions
for each row execute function app_private.protect_project_definition_baseline_v1();

create or replace function public.promote_approved_idea_to_project_definition_v1(
  p_decision_record_id uuid,
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
  v_dec public.idea_decision_records_v2;
  v_idea public.ideas;
  v_pkg public.idea_decision_packages;
  v_dec_snap public.idea_snapshots;
  v_existing public.project_definitions;
  v_approved_snap public.idea_snapshots;
  v_approved_snapshot_id uuid;
  v_approved_manifest jsonb;
  v_snapshot_hash text;
  v_request_fp text;
  v_baseline_hash text;
  v_pd_id uuid;
  v_pd_version bigint;
  v_entry jsonb;
  v_source public.idea_artifacts;
  v_target_id uuid;
  v_target_version integer;
  v_target_hash text;
  v_class text;
  v_target_domain text;
  v_rationale text;
  v_condition jsonb;
  v_open_feedback integer;
  v_source_manifest jsonb;
  v_source_in_snapshot boolean;
  v_latest_decision_id uuid;
  v_pre_projects bigint;
  v_post_projects bigint;
begin
  if p_baseline_manifest is null or jsonb_typeof(p_baseline_manifest)<>'object' then raise exception 'BASELINE_MANIFEST_MUST_BE_OBJECT'; end if;
  if p_promotion_diff is null or jsonb_typeof(p_promotion_diff)<>'object' then raise exception 'PROMOTION_DIFF_MUST_BE_OBJECT'; end if;
  if p_artifact_promotions is null or jsonb_typeof(p_artifact_promotions)<>'array' then raise exception 'ARTIFACT_PROMOTIONS_MUST_BE_ARRAY'; end if;
  if nullif(btrim(p_idempotency_key),'') is null then raise exception 'IDEMPOTENCY_KEY_REQUIRED'; end if;

  if not (p_baseline_manifest ? 'vision' and p_baseline_manifest ? 'decision_rationale' and p_baseline_manifest ? 'business_outcomes'
      and p_baseline_manifest ? 'approved_targets' and p_baseline_manifest ? 'positioning' and p_baseline_manifest ? 'macro_scope'
      and p_baseline_manifest ? 'non_goals' and p_baseline_manifest ? 'critical_constraints' and p_baseline_manifest ? 'risks'
      and p_baseline_manifest ? 'accepted_unknowns' and p_baseline_manifest ? 'source_evidence_refs' and p_baseline_manifest ? 'decision_authority') then
    raise exception 'PROJECT_BASELINE_MANIFEST_INCOMPLETE';
  end if;
  if p_baseline_manifest ?| array['milestones','tasks','actions','roadmap','execution_owners'] then raise exception 'EXECUTION_PLANNING_NOT_ALLOWED_IN_R6_BASELINE'; end if;
  if coalesce((p_promotion_diff->>'requires_reapproval')::boolean,false) then raise exception 'PROMOTION_DIFF_REQUIRES_REAPPROVAL'; end if;

  select * into v_dec from public.idea_decision_records_v2 where id=p_decision_record_id for update;
  if v_dec.id is null then raise exception 'DECISION_RECORD_NOT_FOUND'; end if;
  select * into v_idea from public.ideas where id=v_dec.idea_id for update;
  if v_idea.engine_revision<>p_expected_engine_revision or v_dec.decided_engine_revision<>v_idea.engine_revision then raise exception 'STALE_ENGINE'; end if;
  if not v_dec.promotable or v_dec.outcome not in ('APPROVE_TO_PROJECT','APPROVE_WITH_CHANGES') then raise exception 'DECISION_NOT_PROMOTABLE'; end if;

  select id into v_latest_decision_id from public.idea_decision_records_v2 where idea_id=v_idea.id order by decided_at desc,id desc limit 1;
  if v_latest_decision_id is distinct from v_dec.id then raise exception 'DECISION_RECORD_SUPERSEDED'; end if;

  select * into v_pkg from public.idea_decision_packages where id=v_dec.package_id for update;
  if v_pkg.id is null or v_pkg.state<>'frozen' then raise exception 'DECISION_PACKAGE_NOT_FROZEN'; end if;
  if v_pkg.snapshot_engine_revision<>v_idea.engine_revision then raise exception 'DECISION_PACKAGE_STALE'; end if;
  if exists(select 1 from public.idea_artifacts a where a.id=any(v_pkg.output_artifact_ids) and (a.freshness_status<>'fresh' or a.state<>'frozen' or a.input_fingerprint<>v_pkg.snapshot_content_hash)) then raise exception 'DECISION_PACKAGE_OUTPUT_STALE'; end if;

  select * into v_dec_snap from public.idea_snapshots where id=v_dec.decision_snapshot_id and snapshot_type='DECISION_SNAPSHOT';
  if v_dec_snap.id is null or v_dec_snap.idea_id<>v_idea.id or v_dec_snap.engine_revision<>v_idea.engine_revision then raise exception 'DECISION_SNAPSHOT_STALE'; end if;

  select count(*) into v_open_feedback from public.idea_decision_feedback where package_id=v_pkg.id and status='open';
  if v_open_feedback>0 then raise exception 'OPEN_REVIEW_FEEDBACK_BLOCKS_PROMOTION'; end if;

  for v_condition in select value from jsonb_array_elements(v_dec.conditions) loop
    if jsonb_typeof(v_condition)<>'object' then raise exception 'INVALID_APPROVAL_CONDITION'; end if;
    if v_condition->>'class' not in ('STRUCTURAL_BLOCKING','PROJECT_RESOLVABLE','NON_BLOCKING_ACCEPTED_UNKNOWN') then raise exception 'INVALID_APPROVAL_CONDITION_CLASS'; end if;
    if v_condition->>'class'='STRUCTURAL_BLOCKING' and not coalesce((v_condition->>'resolved')::boolean,false) then raise exception 'STRUCTURAL_BLOCKER_UNRESOLVED'; end if;
    if v_condition->>'class'='PROJECT_RESOLVABLE' and (nullif(btrim(v_condition->>'requirement_id'),'') is null or nullif(btrim(v_condition->>'owner_ref'),'') is null) then raise exception 'PROJECT_RESOLVABLE_CONDITION_NEEDS_REQUIREMENT_OWNER'; end if;
    if v_condition->>'class'='NON_BLOCKING_ACCEPTED_UNKNOWN' and nullif(btrim(v_condition->>'tracking_key'),'') is null then raise exception 'ACCEPTED_UNKNOWN_NEEDS_TRACKING_KEY'; end if;
  end loop;

  v_request_fp := md5(jsonb_build_object('decision_record_id',p_decision_record_id,'engine_revision',p_expected_engine_revision,'baseline_manifest',p_baseline_manifest,'promotion_diff',p_promotion_diff,'artifact_promotions',p_artifact_promotions)::text);
  select * into v_existing from public.project_definitions where idea_id=v_idea.id and idempotency_key=p_idempotency_key;
  if v_existing.id is not null then
    if v_existing.request_fingerprint is distinct from v_request_fp then raise exception 'IDEMPOTENCY_KEY_REUSE'; end if;
    return jsonb_build_object('project_definition_id',v_existing.id,'approved_idea_snapshot_id',v_existing.approved_idea_snapshot_id,'version',v_existing.version,'status',v_existing.status,'idempotent',true);
  end if;
  if exists(select 1 from public.project_definitions where idea_id=v_idea.id and status<>'superseded') then raise exception 'ACTIVE_PROJECT_DEFINITION_ALREADY_EXISTS'; end if;

  v_approved_manifest := jsonb_build_object(
    'decision_record_id',v_dec.id,
    'decision_hash',v_dec.decision_hash,
    'outcome',v_dec.outcome,
    'decision_package_id',v_pkg.id,
    'decision_package_hash',v_pkg.package_hash,
    'decision_snapshot_id',v_dec_snap.id,
    'decision_snapshot_hash',v_dec_snap.content_hash,
    'conditions',v_dec.conditions,
    'baseline_manifest',p_baseline_manifest,
    'promotion_diff',p_promotion_diff,
    'artifact_promotions',p_artifact_promotions,
    'approved_engine_revision',v_idea.engine_revision
  );
  v_snapshot_hash := md5(jsonb_build_object('blueprint_id',v_idea.blueprint_id,'blueprint_version',v_idea.blueprint_version,'engine_revision',v_idea.engine_revision,'manifest',v_approved_manifest)::text);

  select * into v_approved_snap from public.idea_snapshots where idea_id=v_idea.id and snapshot_type='APPROVED_IDEA_SNAPSHOT' and content_hash=v_snapshot_hash;
  if v_approved_snap.id is null then
    insert into public.idea_snapshots(idea_id,snapshot_type,blueprint_id,blueprint_version,engine_revision,manifest,content_hash,created_by,created_by_actor)
    values(v_idea.id,'APPROVED_IDEA_SNAPSHOT',v_idea.blueprint_id,v_idea.blueprint_version,v_idea.engine_revision,v_approved_manifest,v_snapshot_hash,v_dec.decided_by,'human_decision')
    returning id into v_approved_snapshot_id;
  else
    v_approved_snapshot_id := v_approved_snap.id;
  end if;

  select coalesce(max(version),0)+1 into v_pd_version from public.project_definitions where idea_id=v_idea.id;
  v_baseline_hash := md5(jsonb_build_object('approved_snapshot_hash',v_snapshot_hash,'baseline_manifest',p_baseline_manifest,'promotion_diff',p_promotion_diff,'artifact_promotions',p_artifact_promotions)::text);

  select count(*) into v_pre_projects from public.projects where workspace_id=v_idea.workspace_id;

  insert into public.project_definitions(
    idea_id,workspace_id,approved_idea_snapshot_id,approved_decision_record_id,decision_package_id,status,version,
    baseline_manifest,promotion_diff,baseline_hash,created_engine_revision,idempotency_key,request_fingerprint
  ) values (
    v_idea.id,v_idea.workspace_id,v_approved_snapshot_id,v_dec.id,v_pkg.id,'defining',v_pd_version,
    p_baseline_manifest,p_promotion_diff,v_baseline_hash,v_idea.engine_revision,p_idempotency_key,v_request_fp
  ) returning id into v_pd_id;

  v_source_manifest := coalesce(v_dec_snap.manifest->'artifact_versions','[]'::jsonb);

  for v_entry in select value from jsonb_array_elements(p_artifact_promotions) loop
    if jsonb_typeof(v_entry)<>'object' then raise exception 'INVALID_ARTIFACT_PROMOTION_ENTRY'; end if;
    v_class := v_entry->>'classification';
    if v_class not in ('PROMOTE_DIRECTLY','PROMOTE_AND_DEEPEN','REWORK_TARGETED','DO_NOT_PROMOTE','SUPERSEDE') then raise exception 'INVALID_ARTIFACT_PROMOTION_CLASS'; end if;
    v_target_domain := nullif(btrim(v_entry->>'target_domain'),'');
    v_rationale := coalesce(v_entry->>'rationale','');

    select * into v_source from public.idea_artifacts where id=(v_entry->>'source_artifact_id')::uuid for update;
    if v_source.id is null or v_source.idea_id<>v_idea.id then raise exception 'PROMOTION_SOURCE_ARTIFACT_NOT_FOUND'; end if;

    select exists(select 1 from jsonb_array_elements(v_source_manifest) s where s->>'artifact_id'=v_source.id::text) into v_source_in_snapshot;
    if not v_source_in_snapshot then raise exception 'PROMOTION_SOURCE_NOT_IN_DECISION_SNAPSHOT'; end if;

    v_target_id := null;
    if v_class in ('PROMOTE_DIRECTLY','PROMOTE_AND_DEEPEN','REWORK_TARGETED') then
      if v_source.freshness_status<>'fresh' or v_source.state<>'frozen' then raise exception 'PROMOTION_SOURCE_NOT_FRESH_FROZEN'; end if;
      if v_source.purpose_stage<>'FOR_DECISION' or v_source.spec_status<>'CONCEPT_NOT_FINAL_SPEC' then raise exception 'PROMOTION_SOURCE_NOT_PROJECT_BASELINE_ELIGIBLE'; end if;
      if v_target_domain is null then raise exception 'PROMOTED_ARTIFACT_TARGET_DOMAIN_REQUIRED'; end if;
      select coalesce(max(version),0)+1 into v_target_version from public.idea_artifacts where idea_id=v_idea.id and artifact_key=v_source.artifact_key;
      v_target_hash := md5(jsonb_build_object('source_content_hash',v_source.content_hash,'approved_snapshot_hash',v_snapshot_hash,'purpose_stage','FOR_PROJECT','spec_status','PROJECT_DEFINITION','classification',v_class,'target_domain',v_target_domain)::text);
      insert into public.idea_artifacts(
        idea_id,artifact_key,artifact_type,purpose_stage,version,state,payload,file_refs,source_snapshot_id,input_fingerprint,
        supersedes_artifact_id,created_engine_revision,content_hash,freshness_status,freshness_checked_at,promoted_at,spec_status,evidence_role,idempotency_key,request_fingerprint
      ) values (
        v_idea.id,v_source.artifact_key,v_source.artifact_type,'FOR_PROJECT',v_target_version,'current',v_source.payload,v_source.file_refs,v_approved_snapshot_id,v_snapshot_hash,
        v_source.id,v_idea.engine_revision,v_target_hash,'fresh',now(),now(),'PROJECT_DEFINITION',v_source.evidence_role,
        'r6:'||v_pd_id::text||':'||v_source.id::text,md5(jsonb_build_object('project_definition_id',v_pd_id,'source_artifact_id',v_source.id,'classification',v_class,'target_domain',v_target_domain)::text)
      ) returning id into v_target_id;
    end if;

    insert into public.project_definition_artifact_promotions(project_definition_id,source_artifact_id,promoted_artifact_id,classification,target_domain,rationale)
    values(v_pd_id,v_source.id,v_target_id,v_class,v_target_domain,v_rationale);
  end loop;

  select count(*) into v_post_projects from public.projects where workspace_id=v_idea.workspace_id;
  if v_post_projects<>v_pre_projects then raise exception 'R6_MUST_NOT_CREATE_EXECUTION_PROJECT'; end if;

  insert into public.audit_events(workspace_id,actor_id,event_type,entity_type,entity_id,payload)
  values(v_idea.workspace_id,v_dec.decided_by,'idea.project_definition_baseline_created','project_definition',v_pd_id,
         jsonb_build_object('idea_id',v_idea.id,'approved_idea_snapshot_id',v_approved_snapshot_id,'decision_record_id',v_dec.id,'version',v_pd_version,'engine_revision',v_idea.engine_revision));

  return jsonb_build_object('project_definition_id',v_pd_id,'approved_idea_snapshot_id',v_approved_snapshot_id,'version',v_pd_version,'status','defining','engine_revision',v_idea.engine_revision,'idempotent',false);
end;
$$;

revoke all on function public.promote_approved_idea_to_project_definition_v1(uuid,bigint,jsonb,jsonb,jsonb,text) from public,anon,authenticated;
grant execute on function public.promote_approved_idea_to_project_definition_v1(uuid,bigint,jsonb,jsonb,jsonb,text) to service_role;
