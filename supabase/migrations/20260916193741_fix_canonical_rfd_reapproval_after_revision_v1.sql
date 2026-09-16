create or replace function public.get_project_delivery_lot_baseline_handoff_readiness_v1(p_lot_id uuid)
returns jsonb
language sql
stable
set search_path to ''
as $function$
  with lot as (
    select dl.*,pd.definition_revision
    from app_private.project_delivery_lots_v1 dl
    join public.project_definitions pd on pd.id=dl.project_definition_id
    where dl.id=p_lot_id
  ),
  current_readiness as (
    select app_private.get_project_delivery_lot_prebaseline_readiness_v1(p_lot_id) as payload
  ),
  baseline as (
    select b.*
    from app_private.project_baseline_freezes_v1 b
    cross join lot l
    cross join current_readiness r
    where b.lot_id=p_lot_id and b.status in ('CANDIDATE','FROZEN')
    order by
      case
        when b.definition_revision=l.definition_revision
         and b.readiness_fingerprint=r.payload->>'readiness_fingerprint'
        then 0 else 1
      end,
      case when b.status='FROZEN' then 0 else 1 end,
      b.created_at desc
    limit 1
  ),
  handoff as (
    select h.*
    from app_private.project_handoff_manifests_v1 h
    join baseline b on b.id=h.baseline_id
    where h.status in ('READY','FROZEN')
    order by case when h.status='FROZEN' then 0 else 1 end,h.manifest_version desc
    limit 1
  )
  select jsonb_build_object(
    'schema_version','1.1',
    'lot_id',l.id,
    'definition_revision',l.definition_revision,
    'BASELINE_READY',case
      when b.id is not null
       and b.definition_revision=l.definition_revision
       and b.readiness_fingerprint=r.payload->>'readiness_fingerprint'
       and b.baseline_hash=md5(b.snapshot::text)
       and r.payload->>'status'='PASS'
      then 'PASS' else 'FAIL' end,
    'baseline',case when b.id is null then null else jsonb_build_object(
      'id',b.id,'status',b.status,'definition_revision',b.definition_revision,
      'readiness_fingerprint',b.readiness_fingerprint,'baseline_hash',b.baseline_hash,
      'hash_valid',b.baseline_hash=md5(b.snapshot::text),
      'current',b.definition_revision=l.definition_revision and b.readiness_fingerprint=r.payload->>'readiness_fingerprint'
    ) end,
    'HANDOFF_INTEGRITY',case
      when b.id is not null
       and h.id is not null
       and b.definition_revision=l.definition_revision
       and b.readiness_fingerprint=r.payload->>'readiness_fingerprint'
       and b.baseline_hash=md5(b.snapshot::text)
       and r.payload->>'status'='PASS'
       and h.integrity_hash=md5(h.manifest::text)
       and h.manifest->>'baseline_hash'=b.baseline_hash
       and h.manifest->>'readiness_fingerprint'=b.readiness_fingerprint
       and h.manifest ? 'project_baseline_manifest'
       and h.manifest ? 'delivery_lot'
       and h.manifest ? 'canonical_nodes'
       and h.manifest ? 'dependency_edges'
       and h.manifest ? 'readiness_predicates'
       and h.manifest ? 'unresolved_noncritical_items'
       and h.manifest ? 'risks'
       and h.manifest ? 'accepted_unknowns'
       and h.manifest ? 'decision_authority'
      then 'PASS' else 'FAIL' end,
    'handoff',case when h.id is null then null else jsonb_build_object(
      'id',h.id,'baseline_id',h.baseline_id,'manifest_version',h.manifest_version,'status',h.status,
      'integrity_hash',h.integrity_hash,'hash_valid',h.integrity_hash=md5(h.manifest::text)
    ) end,
    'prebaseline_readiness',r.payload
  )
  from lot l
  cross join current_readiness r
  left join baseline b on true
  left join handoff h on true;
$function$;

create or replace function public.get_project_rfd_readiness_v1(p_project_definition_id uuid)
returns jsonb
language sql
stable
set search_path to ''
as $function$
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
    cross join pre
    where m.status in ('CANDIDATE','FROZEN')
    order by
      case
        when m.definition_revision=pd.definition_revision
         and m.manifest->>'pre_manifest_readiness_fingerprint'=pre.payload->>'readiness_fingerprint'
        then 0 else 1
      end,
      case when m.status='FROZEN' then 0 else 1 end,
      m.created_at desc
    limit 1
  )
  select jsonb_build_object(
    'schema_version','1.1',
    'formal_gate','G5_RFD_PROJECT',
    'project_definition_id',pd.id,
    'definition_revision',pd.definition_revision,
    'required_lot_readiness',pre.payload,
    'project_rfd_manifest',case when c.id is null then null else jsonb_build_object(
      'id',c.id,'status',c.status,'definition_revision',c.definition_revision,
      'integrity_hash',c.integrity_hash,'hash_valid',c.integrity_hash=md5(c.manifest::text),
      'pre_manifest_readiness_fingerprint',c.manifest->>'pre_manifest_readiness_fingerprint',
      'current',c.definition_revision=pd.definition_revision
        and c.manifest->>'pre_manifest_readiness_fingerprint'=pre.payload->>'readiness_fingerprint'
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
$function$;

create or replace function public.approve_project_delivery_lot_rfd_v1(p_lot_id uuid, p_expected_definition_revision bigint, p_expected_evaluation_fingerprint text, p_authorized_by uuid)
returns jsonb
language plpgsql
set search_path to ''
as $function$
declare
  v_lot app_private.project_delivery_lots_v1;
  v_pd public.project_definitions;
  v_readiness jsonb;
  v_baseline app_private.project_baseline_freezes_v1;
  v_handoff app_private.project_handoff_manifests_v1;
  v_existing app_private.project_canonical_gate_states_v1;
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

  select * into v_existing
  from app_private.project_canonical_gate_states_v1
  where lot_id=v_lot.id and gate_id='G4_RFD_LOT'
  for update;
  if v_existing.id is not null and v_existing.status='APPROVED'
     and v_existing.definition_revision=v_pd.definition_revision then
    if v_existing.evaluation_fingerprint<>p_expected_evaluation_fingerprint then raise exception 'STALE_G4_READINESS'; end if;
    return jsonb_build_object(
      'gate_id','G4_RFD_LOT','status','APPROVED','lot_id',v_lot.id,'project_definition_id',v_pd.id,
      'definition_revision',v_pd.definition_revision,
      'baseline_id',v_existing.details->>'baseline_id',
      'handoff_manifest_id',v_existing.details->>'handoff_manifest_id',
      'authorized_by',v_existing.authorized_by,
      'authorized_at',v_existing.authorized_at,
      'evaluation_fingerprint',v_existing.evaluation_fingerprint,
      'idempotent',true
    );
  end if;

  v_readiness:=public.get_project_delivery_lot_rfd_readiness_v1(p_lot_id);
  if v_readiness is null or not coalesce((v_readiness->>'ready_for_authorization')::boolean,false) then raise exception 'G4_RFD_LOT_NOT_READY'; end if;
  if v_readiness->>'evaluation_fingerprint'<>p_expected_evaluation_fingerprint then raise exception 'STALE_G4_READINESS'; end if;

  select * into v_baseline
  from app_private.project_baseline_freezes_v1
  where lot_id=v_lot.id and status='CANDIDATE'
    and definition_revision=v_pd.definition_revision
    and readiness_fingerprint=v_readiness#>>'{diagnostics,prebaseline,readiness_fingerprint}'
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
    'authorized_by',p_authorized_by,'evaluation_fingerprint',p_expected_evaluation_fingerprint,'idempotent',false
  );
end;
$function$;

create or replace function public.approve_project_rfd_v1(p_project_definition_id uuid, p_expected_definition_revision bigint, p_expected_evaluation_fingerprint text, p_authorized_by uuid)
returns jsonb
language plpgsql
set search_path to ''
as $function$
declare
  v_pd public.project_definitions;
  v_readiness jsonb;
  v_manifest app_private.project_rfd_manifests_v1;
  v_existing app_private.project_canonical_gate_states_v1;
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

  select * into v_existing
  from app_private.project_canonical_gate_states_v1
  where project_definition_id=v_pd.id and gate_id='G5_RFD_PROJECT' and lot_id is null
  for update;
  if v_existing.id is not null and v_existing.status='APPROVED'
     and v_existing.definition_revision=v_pd.definition_revision then
    if v_existing.evaluation_fingerprint<>p_expected_evaluation_fingerprint then raise exception 'STALE_G5_READINESS'; end if;
    return jsonb_build_object(
      'gate_id','G5_RFD_PROJECT','status','APPROVED','project_definition_id',v_pd.id,
      'definition_revision',v_pd.definition_revision,
      'project_rfd_manifest_id',v_existing.details->>'project_rfd_manifest_id',
      'authorized_by',v_existing.authorized_by,
      'authorized_at',v_existing.authorized_at,
      'evaluation_fingerprint',v_existing.evaluation_fingerprint,
      'legacy_project_status_unchanged',true,
      'idempotent',true
    );
  end if;

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
    'legacy_project_status_unchanged',true,'idempotent',false
  );
end;
$function$;
