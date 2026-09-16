-- 4b4c Project Master Blueprint V1 — BASELINE_READY + HANDOFF_INTEGRITY.
-- Applied live first via Supabase migration 20260916155544.
-- Service-only candidate generation. Formal G4/G5 remain unimplemented after this migration.

create table if not exists app_private.project_baseline_freezes_v1 (
  id uuid primary key default gen_random_uuid(),
  lot_id uuid not null references app_private.project_delivery_lots_v1(id) on delete cascade,
  project_definition_id uuid not null references public.project_definitions(id) on delete cascade,
  blueprint_id text not null,
  blueprint_version text not null,
  definition_revision bigint not null,
  readiness_fingerprint text not null,
  snapshot jsonb not null,
  baseline_hash text not null,
  status text not null default 'CANDIDATE',
  created_at timestamptz not null default now(),
  frozen_at timestamptz,
  frozen_by uuid references auth.users(id) on delete set null,
  superseded_at timestamptz,
  foreign key (lot_id, blueprint_id, blueprint_version)
    references app_private.project_delivery_lots_v1(id, blueprint_id, blueprint_version),
  constraint project_baseline_freezes_v1_revision_check check (definition_revision >= 0),
  constraint project_baseline_freezes_v1_snapshot_check check (jsonb_typeof(snapshot)='object'),
  constraint project_baseline_freezes_v1_hash_check check (length(btrim(baseline_hash)) > 0 and length(btrim(readiness_fingerprint)) > 0),
  constraint project_baseline_freezes_v1_status_check check (status in ('CANDIDATE','FROZEN','SUPERSEDED')),
  constraint project_baseline_freezes_v1_frozen_check check (
    (status='FROZEN' and frozen_at is not null and frozen_by is not null) or status<>'FROZEN'
  )
);

create unique index if not exists project_baseline_freezes_v1_current_candidate_unique
  on app_private.project_baseline_freezes_v1(lot_id)
  where status='CANDIDATE';

revoke all on table app_private.project_baseline_freezes_v1 from public, anon, authenticated;
grant select,insert,update on table app_private.project_baseline_freezes_v1 to service_role;

create table if not exists app_private.project_handoff_manifests_v1 (
  id uuid primary key default gen_random_uuid(),
  lot_id uuid not null references app_private.project_delivery_lots_v1(id) on delete cascade,
  baseline_id uuid not null references app_private.project_baseline_freezes_v1(id) on delete cascade,
  project_definition_id uuid not null references public.project_definitions(id) on delete cascade,
  manifest_version integer not null default 1,
  manifest jsonb not null,
  integrity_hash text not null,
  status text not null default 'READY',
  created_at timestamptz not null default now(),
  frozen_at timestamptz,
  constraint project_handoff_manifests_v1_version_check check (manifest_version > 0),
  constraint project_handoff_manifests_v1_manifest_check check (jsonb_typeof(manifest)='object'),
  constraint project_handoff_manifests_v1_hash_check check (length(btrim(integrity_hash)) > 0),
  constraint project_handoff_manifests_v1_status_check check (status in ('READY','FROZEN','SUPERSEDED')),
  unique (baseline_id, manifest_version)
);

create unique index if not exists project_handoff_manifests_v1_ready_unique
  on app_private.project_handoff_manifests_v1(baseline_id)
  where status='READY';

revoke all on table app_private.project_handoff_manifests_v1 from public, anon, authenticated;
grant select,insert,update on table app_private.project_handoff_manifests_v1 to service_role;

create or replace function app_private.get_project_delivery_lot_prebaseline_readiness_v1(p_lot_id uuid)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with closure as (select public.get_project_delivery_lot_dependency_closure_v1(p_lot_id) as payload),
  qt as (select public.get_project_delivery_lot_quality_testability_v1(p_lot_id) as payload),
  lot as (
    select dl.id,dl.project_definition_id,dl.lot_key,dl.blueprint_id,dl.blueprint_version,pd.definition_revision
    from app_private.project_delivery_lots_v1 dl
    join public.project_definitions pd on pd.id=dl.project_definition_id
    where dl.id=p_lot_id
  ),
  combined as (
    select l.*,c.payload as closure_payload,q.payload as quality_testability_payload,
      c.payload#>>'{diagnostics,dependency_closure_predicate}' as dependency_status,
      c.payload#>>'{diagnostics,critical_tbd_closure_predicate}' as critical_tbd_status,
      c.payload#>>'{diagnostics,ownership_closure_predicate}' as ownership_status,
      q.payload#>>'{quality,status}' as quality_status,
      q.payload#>>'{testability,status}' as testability_status
    from lot l cross join closure c cross join qt q
  )
  select jsonb_build_object(
    'schema_version','1.0','lot_id',id,'project_definition_id',project_definition_id,'definition_revision',definition_revision,
    'predicates',jsonb_build_object(
      'DEPENDENCY_CLOSURE',dependency_status,'CRITICAL_TBD_CLOSURE',critical_tbd_status,'OWNERSHIP_CLOSURE',ownership_status,
      'QUALITY_REQUIREMENTS_DEFINED',quality_status,'TESTABILITY_READY',testability_status
    ),
    'status',case when dependency_status='PASS' and critical_tbd_status='PASS' and ownership_status='PASS' and quality_status='PASS' and testability_status='PASS' then 'PASS' else 'FAIL' end,
    'readiness_fingerprint',md5(jsonb_build_object(
      'lot_id',id,'project_definition_id',project_definition_id,'definition_revision',definition_revision,
      'closure',closure_payload,'quality_testability',quality_testability_payload
    )::text),
    'closure',closure_payload,'quality_testability',quality_testability_payload
  ) from combined;
$$;

revoke all on function app_private.get_project_delivery_lot_prebaseline_readiness_v1(uuid) from public, anon, authenticated;
grant execute on function app_private.get_project_delivery_lot_prebaseline_readiness_v1(uuid) to service_role;

create or replace function public.create_project_delivery_lot_baseline_candidate_v1(p_lot_id uuid,p_expected_definition_revision bigint)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_lot app_private.project_delivery_lots_v1; v_pd public.project_definitions; v_readiness jsonb; v_snapshot jsonb; v_hash text; v_id uuid;
begin
  select * into v_lot from app_private.project_delivery_lots_v1 where id=p_lot_id;
  if v_lot.id is null then raise exception 'DELIVERY_LOT_NOT_FOUND'; end if;
  select * into v_pd from public.project_definitions where id=v_lot.project_definition_id;
  if v_pd.id is null or v_pd.status='superseded' then raise exception 'PROJECT_DEFINITION_NOT_ACTIVE'; end if;
  if v_pd.definition_revision<>p_expected_definition_revision then raise exception 'STALE_PROJECT_DEFINITION'; end if;
  v_readiness:=app_private.get_project_delivery_lot_prebaseline_readiness_v1(p_lot_id);
  if v_readiness is null or v_readiness->>'status'<>'PASS' then raise exception 'RFD_PREBASELINE_NOT_READY'; end if;
  v_snapshot:=jsonb_build_object(
    'schema_version','1.0','object_type','BaselineFreezeCandidate',
    'project_definition',jsonb_build_object(
      'id',v_pd.id,'idea_id',v_pd.idea_id,'workspace_id',v_pd.workspace_id,
      'approved_idea_snapshot_id',v_pd.approved_idea_snapshot_id,'approved_decision_record_id',v_pd.approved_decision_record_id,
      'decision_package_id',v_pd.decision_package_id,'definition_revision',v_pd.definition_revision,
      'project_baseline_hash',v_pd.baseline_hash,'project_baseline_manifest',v_pd.baseline_manifest,'promotion_diff',v_pd.promotion_diff
    ),
    'delivery_lot',jsonb_build_object(
      'id',v_lot.id,'lot_key',v_lot.lot_key,'title',v_lot.title,'purpose',v_lot.purpose,
      'blueprint_id',v_lot.blueprint_id,'blueprint_version',v_lot.blueprint_version
    ),
    'prebaseline_readiness',v_readiness
  );
  v_hash:=md5(v_snapshot::text);
  update app_private.project_baseline_freezes_v1 set status='SUPERSEDED',superseded_at=now() where lot_id=p_lot_id and status='CANDIDATE';
  insert into app_private.project_baseline_freezes_v1(
    lot_id,project_definition_id,blueprint_id,blueprint_version,definition_revision,readiness_fingerprint,snapshot,baseline_hash,status
  ) values (
    v_lot.id,v_lot.project_definition_id,v_lot.blueprint_id,v_lot.blueprint_version,v_pd.definition_revision,
    v_readiness->>'readiness_fingerprint',v_snapshot,v_hash,'CANDIDATE'
  ) returning id into v_id;
  return jsonb_build_object('baseline_id',v_id,'lot_id',v_lot.id,'status','CANDIDATE','definition_revision',v_pd.definition_revision,'readiness_fingerprint',v_readiness->>'readiness_fingerprint','baseline_hash',v_hash);
end;
$$;

revoke all on function public.create_project_delivery_lot_baseline_candidate_v1(uuid,bigint) from public, anon, authenticated;
grant execute on function public.create_project_delivery_lot_baseline_candidate_v1(uuid,bigint) to service_role;

create or replace function public.get_project_delivery_lot_baseline_handoff_readiness_v1(p_lot_id uuid)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with lot as (
    select dl.*,pd.definition_revision from app_private.project_delivery_lots_v1 dl join public.project_definitions pd on pd.id=dl.project_definition_id where dl.id=p_lot_id
  ),
  current_readiness as (select app_private.get_project_delivery_lot_prebaseline_readiness_v1(p_lot_id) as payload),
  baseline as (
    select b.* from app_private.project_baseline_freezes_v1 b where b.lot_id=p_lot_id and b.status in ('CANDIDATE','FROZEN')
    order by case when b.status='FROZEN' then 0 else 1 end,b.created_at desc limit 1
  ),
  handoff as (
    select h.* from app_private.project_handoff_manifests_v1 h join baseline b on b.id=h.baseline_id
    where h.status in ('READY','FROZEN') order by case when h.status='FROZEN' then 0 else 1 end,h.manifest_version desc limit 1
  )
  select jsonb_build_object(
    'schema_version','1.0','lot_id',l.id,'definition_revision',l.definition_revision,
    'BASELINE_READY',case
      when b.id is not null and b.definition_revision=l.definition_revision and b.readiness_fingerprint=r.payload->>'readiness_fingerprint'
       and b.baseline_hash=md5(b.snapshot::text) and r.payload->>'status'='PASS' then 'PASS' else 'FAIL' end,
    'baseline',case when b.id is null then null else jsonb_build_object(
      'id',b.id,'status',b.status,'definition_revision',b.definition_revision,'readiness_fingerprint',b.readiness_fingerprint,
      'baseline_hash',b.baseline_hash,'hash_valid',b.baseline_hash=md5(b.snapshot::text)
    ) end,
    'HANDOFF_INTEGRITY',case
      when b.id is not null and h.id is not null and b.definition_revision=l.definition_revision
       and b.readiness_fingerprint=r.payload->>'readiness_fingerprint' and b.baseline_hash=md5(b.snapshot::text) and r.payload->>'status'='PASS'
       and h.integrity_hash=md5(h.manifest::text) and h.manifest->>'baseline_hash'=b.baseline_hash
       and h.manifest->>'readiness_fingerprint'=b.readiness_fingerprint and h.manifest ? 'project_baseline_manifest'
       and h.manifest ? 'delivery_lot' and h.manifest ? 'canonical_nodes' and h.manifest ? 'dependency_edges'
       and h.manifest ? 'readiness_predicates' and h.manifest ? 'unresolved_noncritical_items' and h.manifest ? 'risks'
       and h.manifest ? 'accepted_unknowns' and h.manifest ? 'decision_authority'
      then 'PASS' else 'FAIL' end,
    'handoff',case when h.id is null then null else jsonb_build_object(
      'id',h.id,'baseline_id',h.baseline_id,'manifest_version',h.manifest_version,'status',h.status,
      'integrity_hash',h.integrity_hash,'hash_valid',h.integrity_hash=md5(h.manifest::text)
    ) end,
    'prebaseline_readiness',r.payload
  )
  from lot l cross join current_readiness r left join baseline b on true left join handoff h on true;
$$;

revoke all on function public.get_project_delivery_lot_baseline_handoff_readiness_v1(uuid) from public, anon, authenticated;
grant execute on function public.get_project_delivery_lot_baseline_handoff_readiness_v1(uuid) to service_role;

create or replace function public.create_project_delivery_lot_handoff_manifest_v1(p_lot_id uuid,p_expected_definition_revision bigint)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_lot app_private.project_delivery_lots_v1; v_pd public.project_definitions; v_baseline app_private.project_baseline_freezes_v1;
  v_readiness jsonb; v_baseline_status jsonb; v_manifest jsonb; v_hash text; v_id uuid; v_version integer;
  v_unresolved_noncritical jsonb; v_nodes jsonb; v_edges jsonb;
begin
  select * into v_lot from app_private.project_delivery_lots_v1 where id=p_lot_id;
  if v_lot.id is null then raise exception 'DELIVERY_LOT_NOT_FOUND'; end if;
  select * into v_pd from public.project_definitions where id=v_lot.project_definition_id;
  if v_pd.id is null or v_pd.status='superseded' then raise exception 'PROJECT_DEFINITION_NOT_ACTIVE'; end if;
  if v_pd.definition_revision<>p_expected_definition_revision then raise exception 'STALE_PROJECT_DEFINITION'; end if;
  v_baseline_status:=public.get_project_delivery_lot_baseline_handoff_readiness_v1(p_lot_id);
  if v_baseline_status is null or v_baseline_status->>'BASELINE_READY'<>'PASS' then raise exception 'BASELINE_NOT_READY'; end if;
  select * into v_baseline from app_private.project_baseline_freezes_v1 where id=(v_baseline_status#>>'{baseline,id}')::uuid;
  if v_baseline.id is null then raise exception 'BASELINE_NOT_FOUND'; end if;
  v_readiness:=v_baseline.snapshot->'prebaseline_readiness';
  v_nodes:=coalesce(v_readiness#>'{closure,node_state_diagnostics}','[]'::jsonb);
  v_edges:=coalesce(v_readiness#>'{closure,structural,hard_dependency_edges}','[]'::jsonb);
  select coalesce(jsonb_agg(x.item order by x.node_id),'[]'::jsonb) into v_unresolved_noncritical
  from (
    select n->>'node_id' as node_id,jsonb_build_object(
      'node_id',n->>'node_id','legacy_requirement_id',n->>'legacy_requirement_id','title',n->>'title',
      'rfd_criticality',n->>'rfd_criticality','resolution_level',n->>'resolution_level','blocker_status',n->>'blocker_status'
    ) as item
    from jsonb_array_elements(v_nodes) n
    where n->>'rfd_criticality' in ('CONDITIONAL','NON_BLOCKING')
      and coalesce((n->>'legacy_requirement_satisfied')::boolean,false)=false
  ) x;
  select coalesce(max(manifest_version),0)+1 into v_version from app_private.project_handoff_manifests_v1 where baseline_id=v_baseline.id;
  v_manifest:=jsonb_build_object(
    'schema_version','1.0','object_type','HandoffManifest','project_definition_id',v_pd.id,'idea_id',v_pd.idea_id,'workspace_id',v_pd.workspace_id,
    'blueprint_id',v_lot.blueprint_id,'blueprint_version',v_lot.blueprint_version,'definition_revision',v_pd.definition_revision,
    'baseline_id',v_baseline.id,'baseline_hash',v_baseline.baseline_hash,'readiness_fingerprint',v_baseline.readiness_fingerprint,
    'project_baseline_manifest',v_pd.baseline_manifest,'promotion_diff',v_pd.promotion_diff,
    'delivery_lot',jsonb_build_object('id',v_lot.id,'lot_key',v_lot.lot_key,'title',v_lot.title,'purpose',v_lot.purpose,'status',v_lot.status),
    'canonical_nodes',v_nodes,'dependency_edges',v_edges,'readiness_predicates',v_readiness->'predicates',
    'unresolved_noncritical_items',v_unresolved_noncritical,'risks',coalesce(v_pd.baseline_manifest->'risks','[]'::jsonb),
    'accepted_unknowns',coalesce(v_pd.baseline_manifest->'accepted_unknowns','[]'::jsonb),
    'critical_constraints',coalesce(v_pd.baseline_manifest->'critical_constraints','[]'::jsonb),
    'source_evidence_refs',coalesce(v_pd.baseline_manifest->'source_evidence_refs','[]'::jsonb),
    'decision_authority',coalesce(v_pd.baseline_manifest->'decision_authority','{}'::jsonb),
    'compatibility',jsonb_build_object('source_runtime','R7_BUILD_READY_RUNTIME','legacy_g12_is_canonical_rfd',false,'legacy_ids_rewritten',false)
  );
  v_hash:=md5(v_manifest::text);
  update app_private.project_handoff_manifests_v1 set status='SUPERSEDED' where baseline_id=v_baseline.id and status='READY';
  insert into app_private.project_handoff_manifests_v1(lot_id,baseline_id,project_definition_id,manifest_version,manifest,integrity_hash,status)
  values(v_lot.id,v_baseline.id,v_pd.id,v_version,v_manifest,v_hash,'READY') returning id into v_id;
  return jsonb_build_object('handoff_manifest_id',v_id,'baseline_id',v_baseline.id,'lot_id',v_lot.id,'manifest_version',v_version,'integrity_hash',v_hash,'status','READY');
end;
$$;

revoke all on function public.create_project_delivery_lot_handoff_manifest_v1(uuid,bigint) from public, anon, authenticated;
grant execute on function public.create_project_delivery_lot_handoff_manifest_v1(uuid,bigint) to service_role;
