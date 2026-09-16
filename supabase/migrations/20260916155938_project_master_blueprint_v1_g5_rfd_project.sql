-- 4b4c Project Master Blueprint V1 — canonical G5_RFD_PROJECT.
-- Applied live first as Supabase migration 20260916155938.
-- Service-only; legacy R7 project status/G12 are deliberately left unchanged.

create table if not exists app_private.project_rfd_manifests_v1 (
  id uuid primary key default gen_random_uuid(),
  project_definition_id uuid not null references public.project_definitions(id) on delete cascade,
  definition_revision bigint not null,
  manifest jsonb not null,
  integrity_hash text not null,
  status text not null default 'CANDIDATE',
  created_at timestamptz not null default now(),
  frozen_at timestamptz,
  frozen_by uuid references auth.users(id) on delete set null,
  superseded_at timestamptz,
  constraint project_rfd_manifests_v1_revision_check check (definition_revision>=0),
  constraint project_rfd_manifests_v1_manifest_check check (jsonb_typeof(manifest)='object'),
  constraint project_rfd_manifests_v1_hash_check check (length(btrim(integrity_hash))>0),
  constraint project_rfd_manifests_v1_status_check check (status in ('CANDIDATE','FROZEN','SUPERSEDED')),
  constraint project_rfd_manifests_v1_frozen_check
    check ((status='FROZEN' and frozen_at is not null and frozen_by is not null) or status<>'FROZEN')
);

create unique index if not exists project_rfd_manifests_v1_candidate_unique
  on app_private.project_rfd_manifests_v1(project_definition_id)
  where status='CANDIDATE';

create unique index if not exists project_canonical_gate_states_v1_g5_unique
  on app_private.project_canonical_gate_states_v1(project_definition_id,gate_id)
  where gate_id='G5_RFD_PROJECT';

revoke all on table app_private.project_rfd_manifests_v1 from public, anon, authenticated;
grant select,insert,update on table app_private.project_rfd_manifests_v1 to service_role;
grant usage on schema app_private to service_role;

create or replace function app_private.get_project_rfd_pre_manifest_readiness_v1(p_project_definition_id uuid)
returns jsonb
language sql
stable
set search_path to ''
as $$
  with pd as (
    select * from public.project_definitions where id=p_project_definition_id and status<>'superseded'
  ),
  required_lots as (
    select dl.*
    from app_private.project_delivery_lots_v1 dl
    join pd on pd.id=dl.project_definition_id
    where dl.required_for_project_rfd=true and dl.status<>'SUPERSEDED'
  ),
  lot_rows as (
    select
      l.id,l.lot_key,l.title,l.status,l.created_definition_revision,
      gs.status as g4_status,gs.definition_revision as g4_definition_revision,
      gs.evaluation_fingerprint as g4_evaluation_fingerprint,
      gs.authorized_by as g4_authorized_by,gs.authorized_at as g4_authorized_at,
      gs.details as g4_details,
      bh.payload as baseline_handoff,
      case
        when l.status='FROZEN'
         and gs.status='APPROVED'
         and gs.definition_revision=pd.definition_revision
         and bh.payload->>'BASELINE_READY'='PASS'
         and bh.payload->>'HANDOFF_INTEGRITY'='PASS'
        then true else false
      end as current_g4_valid
    from required_lots l
    cross join pd
    left join app_private.project_canonical_gate_states_v1 gs
      on gs.lot_id=l.id and gs.gate_id='G4_RFD_LOT'
    cross join lateral (
      select public.get_project_delivery_lot_baseline_handoff_readiness_v1(l.id) as payload
    ) bh
  ),
  diag as (
    select
      count(*)::int as required_lot_count,
      count(*) filter (where current_g4_valid)::int as current_g4_approved_count,
      count(*) filter (where not current_g4_valid)::int as invalid_required_lot_count
    from lot_rows
  ),
  lot_manifest as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'lot_id',id,'lot_key',lot_key,'title',title,'status',status,
      'created_definition_revision',created_definition_revision,
      'g4_status',g4_status,'g4_definition_revision',g4_definition_revision,
      'g4_evaluation_fingerprint',g4_evaluation_fingerprint,
      'g4_authorized_by',g4_authorized_by,'g4_authorized_at',g4_authorized_at,
      'baseline_id',baseline_handoff#>>'{baseline,id}',
      'baseline_hash',baseline_handoff#>>'{baseline,baseline_hash}',
      'handoff_manifest_id',baseline_handoff#>>'{handoff,id}',
      'handoff_integrity_hash',baseline_handoff#>>'{handoff,integrity_hash}',
      'baseline_ready',baseline_handoff->>'BASELINE_READY',
      'handoff_integrity',baseline_handoff->>'HANDOFF_INTEGRITY',
      'current_g4_valid',current_g4_valid
    ) order by lot_key,id),'[]'::jsonb) as payload
    from lot_rows
  )
  select jsonb_build_object(
    'schema_version','1.0',
    'project_definition_id',pd.id,
    'definition_revision',pd.definition_revision,
    'required_lot_count',d.required_lot_count,
    'current_g4_approved_count',d.current_g4_approved_count,
    'invalid_required_lot_count',d.invalid_required_lot_count,
    'required_lots',lm.payload,
    'status',case
      when d.required_lot_count>0 and d.invalid_required_lot_count=0 and d.current_g4_approved_count=d.required_lot_count
      then 'PASS' else 'FAIL' end,
    'readiness_fingerprint',md5(jsonb_build_object(
      'project_definition_id',pd.id,
      'definition_revision',pd.definition_revision,
      'project_baseline_hash',pd.baseline_hash,
      'required_lots',lm.payload
    )::text)
  )
  from pd cross join diag d cross join lot_manifest lm;
$$;

revoke all on function app_private.get_project_rfd_pre_manifest_readiness_v1(uuid) from public, anon, authenticated;
grant execute on function app_private.get_project_rfd_pre_manifest_readiness_v1(uuid) to service_role;

create or replace function public.create_project_rfd_manifest_candidate_v1(
  p_project_definition_id uuid,
  p_expected_definition_revision bigint
)
returns jsonb
language plpgsql
set search_path to ''
as $$
declare
  v_pd public.project_definitions;
  v_pre jsonb;
  v_manifest jsonb;
  v_hash text;
  v_id uuid;
begin
  select * into v_pd from public.project_definitions where id=p_project_definition_id;
  if v_pd.id is null or v_pd.status='superseded' then raise exception 'PROJECT_DEFINITION_NOT_ACTIVE'; end if;
  if v_pd.definition_revision<>p_expected_definition_revision then raise exception 'STALE_PROJECT_DEFINITION'; end if;

  v_pre:=app_private.get_project_rfd_pre_manifest_readiness_v1(p_project_definition_id);
  if v_pre is null or v_pre->>'status'<>'PASS' then raise exception 'G5_REQUIRED_LOTS_NOT_READY'; end if;

  v_manifest:=jsonb_build_object(
    'schema_version','1.0',
    'object_type','ProjectRfdManifest',
    'project_definition_id',v_pd.id,
    'idea_id',v_pd.idea_id,
    'workspace_id',v_pd.workspace_id,
    'definition_revision',v_pd.definition_revision,
    'project_baseline_hash',v_pd.baseline_hash,
    'project_baseline_manifest',v_pd.baseline_manifest,
    'promotion_diff',v_pd.promotion_diff,
    'required_delivery_lots',v_pre->'required_lots',
    'required_lot_count',v_pre->'required_lot_count',
    'pre_manifest_readiness_fingerprint',v_pre->>'readiness_fingerprint',
    'compatibility',jsonb_build_object(
      'source_runtime','R7_BUILD_READY_RUNTIME',
      'legacy_g12_is_canonical_rfd',false,
      'canonical_gate','G5_RFD_PROJECT'
    )
  );
  v_hash:=md5(v_manifest::text);

  update app_private.project_rfd_manifests_v1
  set status='SUPERSEDED',superseded_at=now()
  where project_definition_id=v_pd.id and status='CANDIDATE';

  insert into app_private.project_rfd_manifests_v1(
    project_definition_id,definition_revision,manifest,integrity_hash,status
  ) values (
    v_pd.id,v_pd.definition_revision,v_manifest,v_hash,'CANDIDATE'
  ) returning id into v_id;

  return jsonb_build_object(
    'project_rfd_manifest_id',v_id,
    'project_definition_id',v_pd.id,
    'definition_revision',v_pd.definition_revision,
    'integrity_hash',v_hash,
    'status','CANDIDATE'
  );
end;
$$;

revoke all on function public.create_project_rfd_manifest_candidate_v1(uuid,bigint) from public, anon, authenticated;
grant execute on function public.create_project_rfd_manifest_candidate_v1(uuid,bigint) to service_role;

create or replace function public.get_project_rfd_readiness_v1(p_project_definition_id uuid)
returns jsonb
language sql
stable
set search_path to ''
as $$
  with pd as (
    select * from public.project_definitions where id=p_project_definition_id and status<>'superseded'
  ),
  pre as (
    select app_private.get_project_rfd_pre_manifest_readiness_v1(p_project_definition_id) as payload
  ),
  candidate as (
    select m.*
    from app_private.project_rfd_manifests_v1 m
    join pd on pd.id=m.project_definition_id
    where m.status in ('CANDIDATE','FROZEN')
    order by case when m.status='FROZEN' then 0 else 1 end,m.created_at desc
    limit 1
  )
  select jsonb_build_object(
    'schema_version','1.0',
    'formal_gate','G5_RFD_PROJECT',
    'project_definition_id',pd.id,
    'definition_revision',pd.definition_revision,
    'required_lot_readiness',pre.payload,
    'project_rfd_manifest',case when c.id is null then null else jsonb_build_object(
      'id',c.id,'status',c.status,'definition_revision',c.definition_revision,
      'integrity_hash',c.integrity_hash,'hash_valid',c.integrity_hash=md5(c.manifest::text),
      'pre_manifest_readiness_fingerprint',c.manifest->>'pre_manifest_readiness_fingerprint'
    ) end,
    'manifest_integrity',case
      when c.id is not null
       and c.definition_revision=pd.definition_revision
       and c.integrity_hash=md5(c.manifest::text)
       and c.manifest->>'project_baseline_hash'=pd.baseline_hash
       and c.manifest->>'pre_manifest_readiness_fingerprint'=pre.payload->>'readiness_fingerprint'
       and c.manifest ? 'required_delivery_lots'
       and c.manifest ? 'project_baseline_manifest'
      then 'PASS' else 'FAIL' end,
    'ready_for_authorization',
      pre.payload->>'status'='PASS'
      and c.id is not null
      and c.definition_revision=pd.definition_revision
      and c.integrity_hash=md5(c.manifest::text)
      and c.manifest->>'project_baseline_hash'=pd.baseline_hash
      and c.manifest->>'pre_manifest_readiness_fingerprint'=pre.payload->>'readiness_fingerprint',
    'evaluation_fingerprint',md5(jsonb_build_object(
      'project_definition_id',pd.id,'definition_revision',pd.definition_revision,
      'pre',pre.payload,'manifest_id',c.id,'manifest_hash',c.integrity_hash
    )::text)
  )
  from pd cross join pre left join candidate c on true;
$$;

revoke all on function public.get_project_rfd_readiness_v1(uuid) from public, anon, authenticated;
grant execute on function public.get_project_rfd_readiness_v1(uuid) to service_role;

create or replace function public.approve_project_rfd_v1(
  p_project_definition_id uuid,
  p_expected_definition_revision bigint,
  p_expected_evaluation_fingerprint text,
  p_authorized_by uuid
)
returns jsonb
language plpgsql
set search_path to ''
as $$
declare
  v_pd public.project_definitions;
  v_readiness jsonb;
  v_manifest app_private.project_rfd_manifests_v1;
  v_authorized boolean;
begin
  if p_authorized_by is null then raise exception 'G5_HUMAN_AUTHORITY_REQUIRED'; end if;
  if nullif(btrim(p_expected_evaluation_fingerprint),'') is null then raise exception 'G5_EXPECTED_FINGERPRINT_REQUIRED'; end if;

  select * into v_pd from public.project_definitions where id=p_project_definition_id for update;
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
  if not coalesce(v_authorized,false) then raise exception 'G5_PROJECT_RFD_OWNER_NOT_AUTHORIZED'; end if;

  v_readiness:=public.get_project_rfd_readiness_v1(v_pd.id);
  if v_readiness is null or not coalesce((v_readiness->>'ready_for_authorization')::boolean,false) then raise exception 'G5_RFD_PROJECT_NOT_READY'; end if;
  if v_readiness->>'evaluation_fingerprint'<>p_expected_evaluation_fingerprint then raise exception 'STALE_G5_READINESS'; end if;

  select * into v_manifest
  from app_private.project_rfd_manifests_v1
  where id=(v_readiness#>>'{project_rfd_manifest,id}')::uuid
  for update;
  if v_manifest.id is null or v_manifest.status<>'CANDIDATE' then raise exception 'G5_PROJECT_RFD_MANIFEST_CANDIDATE_REQUIRED'; end if;

  update app_private.project_rfd_manifests_v1
  set status='FROZEN',frozen_at=now(),frozen_by=p_authorized_by
  where id=v_manifest.id;

  insert into app_private.project_canonical_gate_states_v1(
    project_definition_id,lot_id,gate_id,status,definition_revision,evaluation_fingerprint,details,authorized_by,authorized_at,evaluated_at
  ) values (
    v_pd.id,null,'G5_RFD_PROJECT','APPROVED',v_pd.definition_revision,p_expected_evaluation_fingerprint,
    jsonb_build_object(
      'project_rfd_manifest_id',v_manifest.id,
      'integrity_hash',v_manifest.integrity_hash,
      'required_lot_count',v_readiness#>'{required_lot_readiness,required_lot_count}',
      'required_delivery_lots',v_readiness#>'{required_lot_readiness,required_lots}',
      'legacy_project_status_unchanged',true
    ),
    p_authorized_by,now(),now()
  )
  on conflict (project_definition_id,gate_id) where gate_id='G5_RFD_PROJECT'
  do update set
    status='APPROVED',definition_revision=excluded.definition_revision,evaluation_fingerprint=excluded.evaluation_fingerprint,
    details=excluded.details,authorized_by=excluded.authorized_by,authorized_at=excluded.authorized_at,evaluated_at=excluded.evaluated_at;

  insert into public.audit_events(workspace_id,actor_id,event_type,entity_type,entity_id,payload)
  values(v_pd.workspace_id,p_authorized_by,'project_definition.g5_rfd_project_approved','project_definition',v_pd.id,
    jsonb_build_object(
      'definition_revision',v_pd.definition_revision,
      'project_rfd_manifest_id',v_manifest.id,
      'integrity_hash',v_manifest.integrity_hash,
      'evaluation_fingerprint',p_expected_evaluation_fingerprint,
      'legacy_project_status_unchanged',true
    ));

  return jsonb_build_object(
    'gate_id','G5_RFD_PROJECT','status','APPROVED','project_definition_id',v_pd.id,
    'definition_revision',v_pd.definition_revision,'project_rfd_manifest_id',v_manifest.id,
    'authorized_by',p_authorized_by,'evaluation_fingerprint',p_expected_evaluation_fingerprint,
    'legacy_project_status_unchanged',true
  );
end;
$$;

revoke all on function public.approve_project_rfd_v1(uuid,bigint,text,uuid) from public, anon, authenticated;
grant execute on function public.approve_project_rfd_v1(uuid,bigint,text,uuid) to service_role;
