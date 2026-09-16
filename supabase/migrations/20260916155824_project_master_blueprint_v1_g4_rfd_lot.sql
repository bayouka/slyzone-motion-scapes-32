-- 4b4c Project Master Blueprint V1 — canonical G4_RFD_LOT.
-- Applied live first as Supabase migration 20260916155824.
-- Service-only compatibility layer: legacy R7 G12 remains unchanged.

create table if not exists app_private.project_canonical_gate_states_v1 (
  id uuid primary key default gen_random_uuid(),
  project_definition_id uuid not null references public.project_definitions(id) on delete cascade,
  lot_id uuid references app_private.project_delivery_lots_v1(id) on delete cascade,
  gate_id text not null,
  status text not null,
  definition_revision bigint not null,
  evaluation_fingerprint text not null,
  details jsonb not null default '{}'::jsonb,
  authorized_by uuid references auth.users(id) on delete set null,
  authorized_at timestamptz,
  evaluated_at timestamptz not null default now(),
  constraint project_canonical_gate_states_v1_gate_check
    check (gate_id in ('G4_RFD_LOT','G5_RFD_PROJECT')),
  constraint project_canonical_gate_states_v1_status_check
    check (status in ('NOT_READY','READY_FOR_AUTHORIZATION','APPROVED','STALE','REVOKED')),
  constraint project_canonical_gate_states_v1_revision_check
    check (definition_revision >= 0),
  constraint project_canonical_gate_states_v1_details_check
    check (jsonb_typeof(details)='object'),
  constraint project_canonical_gate_states_v1_scope_check
    check ((gate_id='G4_RFD_LOT' and lot_id is not null) or (gate_id='G5_RFD_PROJECT' and lot_id is null)),
  constraint project_canonical_gate_states_v1_authorization_check
    check ((status='APPROVED' and authorized_by is not null and authorized_at is not null) or status<>'APPROVED')
);

create unique index if not exists project_canonical_gate_states_v1_g4_unique
  on app_private.project_canonical_gate_states_v1(lot_id,gate_id)
  where gate_id='G4_RFD_LOT';

revoke all on table app_private.project_canonical_gate_states_v1 from public, anon, authenticated;
grant select,insert,update on table app_private.project_canonical_gate_states_v1 to service_role;
grant usage on schema app_private to service_role;

create or replace function public.get_project_delivery_lot_rfd_readiness_v1(p_lot_id uuid)
returns jsonb
language sql
stable
set search_path to ''
as $$
  with lot as (
    select dl.*,pd.definition_revision
    from app_private.project_delivery_lots_v1 dl
    join public.project_definitions pd on pd.id=dl.project_definition_id
    where dl.id=p_lot_id
  ),
  closure as (select public.get_project_delivery_lot_dependency_closure_v1(p_lot_id) as payload),
  qt as (select public.get_project_delivery_lot_quality_testability_v1(p_lot_id) as payload),
  bh as (select public.get_project_delivery_lot_baseline_handoff_readiness_v1(p_lot_id) as payload),
  combined as (
    select l.*,
      c.payload#>>'{diagnostics,dependency_closure_predicate}' as p_dependency,
      c.payload#>>'{diagnostics,critical_tbd_closure_predicate}' as p_tbd,
      c.payload#>>'{diagnostics,ownership_closure_predicate}' as p_ownership,
      q.payload#>>'{quality,status}' as p_quality,
      q.payload#>>'{testability,status}' as p_testability,
      b.payload->>'BASELINE_READY' as p_baseline,
      b.payload->>'HANDOFF_INTEGRITY' as p_handoff,
      c.payload as closure_payload,q.payload as qt_payload,b.payload as bh_payload
    from lot l cross join closure c cross join qt q cross join bh b
  )
  select jsonb_build_object(
    'schema_version','1.0',
    'formal_gate','G4_RFD_LOT',
    'lot_id',id,
    'project_definition_id',project_definition_id,
    'definition_revision',definition_revision,
    'lot_status',status,
    'predicates',jsonb_build_object(
      'DEPENDENCY_CLOSURE',p_dependency,
      'CRITICAL_TBD_CLOSURE',p_tbd,
      'OWNERSHIP_CLOSURE',p_ownership,
      'QUALITY_REQUIREMENTS_DEFINED',p_quality,
      'TESTABILITY_READY',p_testability,
      'BASELINE_READY',p_baseline,
      'HANDOFF_INTEGRITY',p_handoff
    ),
    'ready_for_authorization',
      p_dependency='PASS' and p_tbd='PASS' and p_ownership='PASS' and p_quality='PASS'
      and p_testability='PASS' and p_baseline='PASS' and p_handoff='PASS'
      and status in ('ACTIVE','FROZEN'),
    'evaluation_fingerprint',md5(jsonb_build_object(
      'lot_id',id,'project_definition_id',project_definition_id,'definition_revision',definition_revision,'lot_status',status,
      'closure',closure_payload,'quality_testability',qt_payload,'baseline_handoff',bh_payload
    )::text),
    'diagnostics',jsonb_build_object('closure',closure_payload,'quality_testability',qt_payload,'baseline_handoff',bh_payload)
  ) from combined;
$$;

revoke all on function public.get_project_delivery_lot_rfd_readiness_v1(uuid) from public, anon, authenticated;
grant execute on function public.get_project_delivery_lot_rfd_readiness_v1(uuid) to service_role;

create or replace function public.approve_project_delivery_lot_rfd_v1(
  p_lot_id uuid,
  p_expected_definition_revision bigint,
  p_expected_evaluation_fingerprint text,
  p_authorized_by uuid
)
returns jsonb
language plpgsql
set search_path to ''
as $$
declare
  v_lot app_private.project_delivery_lots_v1;
  v_pd public.project_definitions;
  v_readiness jsonb;
  v_baseline app_private.project_baseline_freezes_v1;
  v_handoff app_private.project_handoff_manifests_v1;
  v_authorized boolean;
begin
  if p_authorized_by is null then raise exception 'G4_HUMAN_AUTHORITY_REQUIRED'; end if;
  if nullif(btrim(p_expected_evaluation_fingerprint),'') is null then raise exception 'G4_EXPECTED_FINGERPRINT_REQUIRED'; end if;

  select * into v_lot from app_private.project_delivery_lots_v1 where id=p_lot_id for update;
  if v_lot.id is null then raise exception 'DELIVERY_LOT_NOT_FOUND'; end if;
  select * into v_pd from public.project_definitions where id=v_lot.project_definition_id for update;
  if v_pd.id is null or v_pd.status='superseded' then raise exception 'PROJECT_DEFINITION_NOT_ACTIVE'; end if;
  if v_pd.definition_revision<>p_expected_definition_revision then raise exception 'STALE_PROJECT_DEFINITION'; end if;

  select (
    i.created_by=p_authorized_by
    or exists(
      select 1 from public.workspace_members wm
      where wm.workspace_id=i.workspace_id and wm.user_id=p_authorized_by
        and wm.status='active' and wm.role in ('owner','admin')
    )
  ) into v_authorized
  from public.ideas i where i.id=v_pd.idea_id;
  if not coalesce(v_authorized,false) then raise exception 'G4_BUILD_READY_OWNER_NOT_AUTHORIZED'; end if;

  v_readiness:=public.get_project_delivery_lot_rfd_readiness_v1(p_lot_id);
  if v_readiness is null or not coalesce((v_readiness->>'ready_for_authorization')::boolean,false) then raise exception 'G4_RFD_LOT_NOT_READY'; end if;
  if v_readiness->>'evaluation_fingerprint'<>p_expected_evaluation_fingerprint then raise exception 'STALE_G4_READINESS'; end if;

  select * into v_baseline
  from app_private.project_baseline_freezes_v1
  where lot_id=v_lot.id and status='CANDIDATE'
  order by created_at desc limit 1 for update;
  if v_baseline.id is null then raise exception 'G4_BASELINE_CANDIDATE_REQUIRED'; end if;

  select * into v_handoff
  from app_private.project_handoff_manifests_v1
  where lot_id=v_lot.id and baseline_id=v_baseline.id and status='READY'
  order by manifest_version desc limit 1 for update;
  if v_handoff.id is null then raise exception 'G4_HANDOFF_READY_REQUIRED'; end if;

  update app_private.project_baseline_freezes_v1
  set status='FROZEN',frozen_at=now(),frozen_by=p_authorized_by
  where id=v_baseline.id;
  update app_private.project_handoff_manifests_v1
  set status='FROZEN',frozen_at=now()
  where id=v_handoff.id;
  update app_private.project_delivery_lots_v1
  set status='FROZEN',updated_at=now()
  where id=v_lot.id;

  insert into app_private.project_canonical_gate_states_v1(
    project_definition_id,lot_id,gate_id,status,definition_revision,evaluation_fingerprint,details,authorized_by,authorized_at,evaluated_at
  ) values (
    v_pd.id,v_lot.id,'G4_RFD_LOT','APPROVED',v_pd.definition_revision,p_expected_evaluation_fingerprint,
    jsonb_build_object('baseline_id',v_baseline.id,'baseline_hash',v_baseline.baseline_hash,'handoff_manifest_id',v_handoff.id,'handoff_integrity_hash',v_handoff.integrity_hash,'predicates',v_readiness->'predicates'),
    p_authorized_by,now(),now()
  )
  on conflict (lot_id,gate_id) where gate_id='G4_RFD_LOT'
  do update set
    status='APPROVED',definition_revision=excluded.definition_revision,evaluation_fingerprint=excluded.evaluation_fingerprint,
    details=excluded.details,authorized_by=excluded.authorized_by,authorized_at=excluded.authorized_at,evaluated_at=excluded.evaluated_at;

  insert into public.audit_events(workspace_id,actor_id,event_type,entity_type,entity_id,payload)
  values(v_pd.workspace_id,p_authorized_by,'project_definition.g4_rfd_lot_approved','project_delivery_lot',v_lot.id,
    jsonb_build_object('project_definition_id',v_pd.id,'definition_revision',v_pd.definition_revision,'baseline_id',v_baseline.id,'handoff_manifest_id',v_handoff.id,'evaluation_fingerprint',p_expected_evaluation_fingerprint));

  return jsonb_build_object(
    'gate_id','G4_RFD_LOT','status','APPROVED','lot_id',v_lot.id,'project_definition_id',v_pd.id,
    'definition_revision',v_pd.definition_revision,'baseline_id',v_baseline.id,'handoff_manifest_id',v_handoff.id,
    'authorized_by',p_authorized_by,'evaluation_fingerprint',p_expected_evaluation_fingerprint
  );
end;
$$;

revoke all on function public.approve_project_delivery_lot_rfd_v1(uuid,bigint,text,uuid) from public, anon, authenticated;
grant execute on function public.approve_project_delivery_lot_rfd_v1(uuid,bigint,text,uuid) to service_role;
