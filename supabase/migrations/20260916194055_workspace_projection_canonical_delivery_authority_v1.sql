create or replace function app_private.get_workspace_canonical_delivery_projection_v1(p_project_definition_id uuid)
returns jsonb
language sql
stable
set search_path to ''
as $function$
  with pd as (
    select id,definition_revision
    from public.project_definitions
    where id=p_project_definition_id and status<>'superseded'
  ),
  lot_rows as (
    select
      dl.id,dl.lot_key,dl.title,dl.status,dl.required_for_project_rfd,
      gs.status as g4_status,gs.definition_revision as g4_definition_revision,
      gs.authorized_by as g4_authorized_by,gs.authorized_at as g4_authorized_at,
      bh.payload as baseline_handoff,
      case
        when dl.status='FROZEN'
         and gs.status='APPROVED'
         and gs.definition_revision=pd.definition_revision
         and bh.payload->>'BASELINE_READY'='PASS'
         and bh.payload->>'HANDOFF_INTEGRITY'='PASS'
        then true else false
      end as current_g4_approved
    from app_private.project_delivery_lots_v1 dl
    join pd on pd.id=dl.project_definition_id
    left join app_private.project_canonical_gate_states_v1 gs
      on gs.lot_id=dl.id and gs.gate_id='G4_RFD_LOT'
    cross join lateral (
      select public.get_project_delivery_lot_baseline_handoff_readiness_v1(dl.id) as payload
    ) bh
    where dl.status<>'SUPERSEDED'
  ),
  lot_diag as (
    select
      count(*)::int as lot_count,
      count(*) filter (where required_for_project_rfd)::int as required_lot_count,
      count(*) filter (where required_for_project_rfd and current_g4_approved)::int as current_g4_approved_count,
      count(*) filter (where required_for_project_rfd and not current_g4_approved)::int as blocking_required_lot_count
    from lot_rows
  ),
  lots as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'id',id,
      'lot_key',lot_key,
      'title',title,
      'status',status,
      'required_for_project_rfd',required_for_project_rfd,
      'g4',jsonb_build_object(
        'status',g4_status,
        'definition_revision',g4_definition_revision,
        'current',current_g4_approved,
        'authorized_by',g4_authorized_by,
        'authorized_at',g4_authorized_at
      ),
      'baseline_ready',baseline_handoff->>'BASELINE_READY',
      'handoff_integrity',baseline_handoff->>'HANDOFF_INTEGRITY',
      'baseline',baseline_handoff->'baseline',
      'handoff',baseline_handoff->'handoff'
    ) order by lot_key,id),'[]'::jsonb) as payload
    from lot_rows
  ),
  g5 as (
    select gs.*
    from app_private.project_canonical_gate_states_v1 gs
    join pd on pd.id=gs.project_definition_id
    where gs.gate_id='G5_RFD_PROJECT' and gs.lot_id is null
    limit 1
  ),
  rfd as (
    select public.get_project_rfd_readiness_v1(p_project_definition_id) as payload
  ),
  combined as (
    select pd.id,pd.definition_revision,d.*,l.payload as lots_payload,
      g5.status as g5_status,g5.definition_revision as g5_definition_revision,
      g5.authorized_by as g5_authorized_by,g5.authorized_at as g5_authorized_at,
      r.payload as rfd_payload,
      case
        when g5.status='APPROVED'
         and g5.definition_revision=pd.definition_revision
         and r.payload->>'manifest_integrity'='PASS'
         and coalesce((r.payload->>'ready_for_authorization')::boolean,false)
         and r.payload#>>'{project_rfd_manifest,status}'='FROZEN'
        then true else false
      end as current_g5_approved
    from pd
    cross join lot_diag d
    cross join lots l
    left join g5 on true
    cross join rfd r
  )
  select jsonb_build_object(
    'schema_version','1.0',
    'authority','CANONICAL_G4_G5',
    'project_definition_id',id,
    'definition_revision',definition_revision,
    'status',case
      when current_g5_approved then 'READY_FOR_DEVELOPMENT'
      when required_lot_count>0 and blocking_required_lot_count=0 then 'REQUIRED_LOTS_APPROVED'
      when lot_count>0 then 'IN_PROGRESS'
      else 'NOT_STARTED'
    end,
    'lot_count',lot_count,
    'required_lot_count',required_lot_count,
    'current_g4_approved_count',current_g4_approved_count,
    'blocking_required_lot_count',blocking_required_lot_count,
    'lots',lots_payload,
    'project_rfd_authorized',current_g5_approved,
    'project_rfd',jsonb_build_object(
      'gate_id','G5_RFD_PROJECT',
      'status',g5_status,
      'definition_revision',g5_definition_revision,
      'current',current_g5_approved,
      'authorized_by',g5_authorized_by,
      'authorized_at',g5_authorized_at,
      'manifest_integrity',rfd_payload->>'manifest_integrity',
      'ready_for_authorization',coalesce((rfd_payload->>'ready_for_authorization')::boolean,false),
      'manifest',rfd_payload->'project_rfd_manifest'
    ),
    'compatibility',jsonb_build_object(
      'legacy_project_gate_bridge_used_for_prebaseline_predicates',true,
      'legacy_g12_is_canonical_rfd',false
    )
  )
  from combined;
$function$;

revoke all on function app_private.get_workspace_canonical_delivery_projection_v1(uuid) from public,anon,authenticated;
grant execute on function app_private.get_workspace_canonical_delivery_projection_v1(uuid) to service_role;

create or replace function public.get_idea_workspace_projection_v1(p_idea_id uuid)
returns jsonb
language plpgsql
stable security definer
set search_path to ''
as $function$
declare
  v_base jsonb;
  v_a public.idea_blueprint_fit_assessments;
  v_d public.idea_blueprint_fit_decisions;
  v_unresolved boolean;
  v_requires_human boolean;
  v_pd_id uuid;
  v_delivery jsonb;
  v_canonical_build_ready boolean := false;
  v_legacy_build_ready boolean := false;
begin
  v_base:=app_private.workspace_projection_core_v1(p_idea_id);
  select * into v_a from public.idea_blueprint_fit_assessments where idea_id=p_idea_id order by created_at desc,id desc limit 1;
  select * into v_d from public.idea_blueprint_fit_decisions where idea_id=p_idea_id order by created_at desc,id desc limit 1;

  v_unresolved:=coalesce(v_base->'lifecycle'->>'mode','') in ('CAPTURED_UNCLASSIFIED','BLUEPRINT_MIGRATION_REQUIRED');
  v_requires_human:=v_unresolved and v_a.id is not null and v_a.state='current' and (v_a.classification='AMBIGUOUS' or v_a.confidence<>'HIGH' or not v_a.auto_applicable);

  v_legacy_build_ready:=coalesce((v_base#>>'{signals,build_ready}')::boolean,false);
  if nullif(v_base#>>'{project_definition,id}','') is not null then
    v_pd_id:=(v_base#>>'{project_definition,id}')::uuid;
    v_delivery:=app_private.get_workspace_canonical_delivery_projection_v1(v_pd_id);
    v_canonical_build_ready:=coalesce((v_delivery->>'project_rfd_authorized')::boolean,false);

    v_base:=jsonb_set(v_base,'{delivery}',coalesce(v_delivery,'null'::jsonb),true);
    v_base:=jsonb_set(v_base,'{project_definition,legacy_gates}',coalesce(v_base#>'{project_definition,gates}','{}'::jsonb),true);
    v_base:=jsonb_set(v_base,'{project_definition,readiness_authority}',to_jsonb('CANONICAL_G4_G5'::text),true);
    v_base:=jsonb_set(v_base,'{lifecycle,mode}',to_jsonb(case when v_canonical_build_ready then 'BUILD_READY' else 'PROJECT_DEFINITION' end),true);
  else
    v_base:=jsonb_set(v_base,'{delivery}','null'::jsonb,true);
  end if;

  v_base:=jsonb_set(v_base,'{projection_version}',to_jsonb('1.3'::text),true);
  v_base:=jsonb_set(v_base,'{signals,blueprint_fit_needed}',to_jsonb(v_unresolved),true);
  v_base:=jsonb_set(v_base,'{signals,blueprint_fit_assessment_available}',to_jsonb(v_a.id is not null),true);
  v_base:=jsonb_set(v_base,'{signals,blueprint_fit_requires_human}',to_jsonb(v_requires_human),true);
  v_base:=jsonb_set(v_base,'{signals,legacy_build_ready}',to_jsonb(v_legacy_build_ready),true);
  v_base:=jsonb_set(v_base,'{signals,build_ready}',to_jsonb(v_canonical_build_ready),true);
  v_base:=jsonb_set(v_base,'{signals,readiness_authority}',to_jsonb('CANONICAL_G4_G5'::text),true);

  return v_base || jsonb_build_object(
    'blueprint_fit',jsonb_build_object(
      'assessment',case when v_a.id is null then null else jsonb_build_object('id',v_a.id,'classification',v_a.classification,'candidate_type',v_a.candidate_type,'confidence',v_a.confidence,'rationale',v_a.rationale,'auto_applicable',v_a.auto_applicable,'state',v_a.state,'created_at',v_a.created_at) end,
      'decision',case when v_d.id is null then null else jsonb_build_object('id',v_d.id,'decision',v_d.decision,'candidate_type',v_d.candidate_type,'decided_by_actor',v_d.decided_by_actor,'decided_by',v_d.decided_by,'rationale',v_d.rationale,'created_at',v_d.created_at) end
    )
  );
end;
$function$;
