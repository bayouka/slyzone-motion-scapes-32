-- 4b4c / 2b2c canonical workspace read projection v1
-- Read-only authenticated projection over the validated R0->R7 runtime.

create or replace function public.get_idea_workspace_projection_v1(p_idea_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $$
declare
  v_user uuid := auth.uid();
  v_idea public.ideas;
  v_pd public.project_definitions;
  v_pkg public.idea_decision_packages;
  v_dec public.idea_decision_records_v2;
  v_mode text;
  v_can_write boolean := false;
  v_idea_requirements jsonb;
  v_project_requirements jsonb;
  v_actions jsonb;
  v_sources jsonb;
  v_artifacts jsonb;
  v_gates jsonb := '{}'::jsonb;
  v_flags jsonb;
begin
  if v_user is null then
    raise exception 'UNAUTHORIZED' using errcode='42501';
  end if;
  if not app_private.can_access_idea(p_idea_id) then
    raise exception 'FORBIDDEN' using errcode='42501';
  end if;
  select * into v_idea from public.ideas where id=p_idea_id;
  if v_idea.id is null then raise exception 'IDEA_NOT_FOUND'; end if;
  v_can_write := app_private.can_write_idea(p_idea_id);

  select * into v_pd from public.project_definitions where idea_id=p_idea_id and status<>'superseded' order by version desc limit 1;
  select * into v_pkg from public.idea_decision_packages where idea_id=p_idea_id order by version desc,created_at desc limit 1;
  select * into v_dec from public.idea_decision_records_v2 where idea_id=p_idea_id order by decided_at desc,id desc limit 1;

  v_mode := case
    when v_pd.id is not null and v_pd.status='build_ready' then 'BUILD_READY'
    when v_pd.id is not null then 'PROJECT_DEFINITION'
    when v_idea.blueprint_status='mismatch' then 'BLUEPRINT_MISMATCH'
    when v_idea.blueprint_status='migration_required' then 'BLUEPRINT_MIGRATION_REQUIRED'
    when v_idea.blueprint_status='active' then 'IDEA_ENGINE'
    else 'CAPTURED_UNCLASSIFIED'
  end;

  select jsonb_build_object(
    'active_count',count(*) filter (where applicability_state='ACTIVE'),
    'resolved_count',count(*) filter (where applicability_state='ACTIVE' and resolution_state='RESOLVED' and authority_ok),
    'unresolved_count',count(*) filter (where applicability_state='ACTIVE' and resolution_state in ('UNRESOLVED','CONFLICTED','STALE')),
    'blocking_open_count',count(*) filter (where applicability_state='ACTIVE' and criticality_current='BLOCKING' and (resolution_state<>'RESOLVED' or not authority_ok)),
    'accepted_unknown_count',count(*) filter (where applicability_state='ACTIVE' and resolution_state='ACCEPTED_UNKNOWN'),
    'stale_count',count(*) filter (where applicability_state='ACTIVE' and (resolution_state='STALE' or lock_state='STALE')),
    'authority_pending_count',count(*) filter (where applicability_state='ACTIVE' and not authority_ok),
    'materialized',count(*)>0
  ) into v_idea_requirements from public.idea_requirement_states where idea_id=p_idea_id;

  if v_pd.id is not null then
    select jsonb_build_object(
      'applicable_count',count(*) filter (where applicable),
      'validated_count',count(*) filter (where applicable and resolution_level in ('ACCEPTED_AS_CURRENT','LOCKED_FOR_DEPENDENTS','APPROVED_FOR_PROJECT','EXPERT_SIGNOFF','VERIFIED_PASS','HUMAN_DECISION','FROZEN_FOR_BUILD') and state='current' and blocker_status<>'OPEN'),
      'unresolved_count',count(*) filter (where applicable and (resolution_level in ('UNRESOLVED','WORKING_ASSUMPTION','AI_PROPOSED','ACCEPTED_UNKNOWN') or state in ('review_required','stale') or blocker_status='OPEN')),
      'open_blocker_count',count(*) filter (where applicable and blocker_status='OPEN'),
      'accepted_unknown_count',count(*) filter (where applicable and resolution_level='ACCEPTED_UNKNOWN'),
      'frozen_for_build_count',count(*) filter (where applicable and lock_state='FROZEN_FOR_BUILD'),
      'materialized',count(*)>0
    ) into v_project_requirements from public.project_definition_requirement_states where project_definition_id=v_pd.id;
    select coalesce(jsonb_object_agg(gate_id,jsonb_build_object('status',status,'definition_revision',definition_revision,'evaluated_at',evaluated_at) order by gate_id),'{}'::jsonb)
      into v_gates from public.project_definition_gate_states where project_definition_id=v_pd.id;
  else
    v_project_requirements:=jsonb_build_object('applicable_count',0,'validated_count',0,'unresolved_count',0,'open_blocker_count',0,'accepted_unknown_count',0,'frozen_for_build_count',0,'materialized',false);
  end if;

  select jsonb_build_object(
    'queued_count',count(*) filter (where status='queued'),
    'running_count',count(*) filter (where status='running'),
    'failed_count',count(*) filter (where status='failed'),
    'stale_count',count(*) filter (where status='stale'),
    'latest',(select jsonb_build_object('action_type',r.action_type,'status',r.status,'created_at',r.created_at,'updated_at',r.updated_at,'completed_at',r.completed_at) from public.idea_action_runs r where r.idea_id=p_idea_id order by r.updated_at desc,r.created_at desc limit 1)
  ) into v_actions from public.idea_action_runs where idea_id=p_idea_id;

  select jsonb_build_object(
    'total_count',count(*),
    'active_count',count(*) filter (where status in ('registered','ingested')),
    'ingested_count',count(*) filter (where status='ingested'),
    'superseded_count',count(*) filter (where status='superseded'),
    'latest_updated_at',max(updated_at)
  ) into v_sources from public.idea_sources where idea_id=p_idea_id;

  select jsonb_build_object(
    'current_count',count(*) filter (where state='current'),
    'frozen_count',count(*) filter (where state='frozen'),
    'stale_count',count(*) filter (where freshness_status='stale' and state in ('current','frozen')),
    'items',coalesce((select jsonb_agg(jsonb_build_object('id',a.id,'artifact_key',a.artifact_key,'purpose_stage',a.purpose_stage,'spec_status',a.spec_status,'version',a.version,'state',a.state,'freshness_status',a.freshness_status,'stale_reason',a.stale_reason,'project_definition_id',a.project_definition_id,'updated_at',a.updated_at) order by a.updated_at desc,a.artifact_key) from public.idea_artifacts a where a.idea_id=p_idea_id and a.state in ('current','frozen')),'[]'::jsonb)
  ) into v_artifacts from public.idea_artifacts where idea_id=p_idea_id;

  v_flags:=jsonb_build_object(
    'blueprint_fit_needed',v_idea.blueprint_status is null,
    'blueprint_mismatch',v_idea.blueprint_status='mismatch',
    'has_active_system_work',coalesce((v_actions->>'queued_count')::int,0)+coalesce((v_actions->>'running_count')::int,0)>0,
    'has_open_blocker',coalesce((v_idea_requirements->>'blocking_open_count')::int,0)>0 or coalesce((v_project_requirements->>'open_blocker_count')::int,0)>0,
    'has_stale_artifact',coalesce((v_artifacts->>'stale_count')::int,0)>0,
    'has_decision_package',v_pkg.id is not null,
    'has_decision_record',v_dec.id is not null,
    'has_project_definition',v_pd.id is not null,
    'build_ready',v_pd.id is not null and v_pd.status='build_ready' and v_pd.build_ready_snapshot_id is not null
  );

  return jsonb_build_object(
    'projection_version','1.0','generated_at',now(),
    'idea',jsonb_build_object('id',v_idea.id,'workspace_id',v_idea.workspace_id,'created_by',v_idea.created_by,'title',v_idea.title,'current_description',v_idea.current_description,'visibility',v_idea.visibility,'legacy_status',v_idea.status,'blueprint_id',v_idea.blueprint_id,'blueprint_version',v_idea.blueprint_version,'blueprint_status',v_idea.blueprint_status,'engine_revision',v_idea.engine_revision,'updated_at',v_idea.updated_at),
    'lifecycle',jsonb_build_object('mode',v_mode),
    'capabilities',jsonb_build_object('can_write',v_can_write,'can_read',true),
    'signals',v_flags,
    'requirements',jsonb_build_object('idea',v_idea_requirements,'project',v_project_requirements),
    'system_microstatus',v_actions,'sources',v_sources,'artifacts',v_artifacts,
    'decision',jsonb_build_object(
      'package',case when v_pkg.id is null then null else jsonb_build_object('id',v_pkg.id,'version',v_pkg.version,'mode',v_pkg.mode,'decision_sought',v_pkg.decision_sought,'state',v_pkg.state,'stale_reason',v_pkg.stale_reason,'updated_at',v_pkg.updated_at) end,
      'record',case when v_dec.id is null then null else jsonb_build_object('id',v_dec.id,'outcome',v_dec.outcome,'conditions_resolved',v_dec.conditions_resolved,'promotable',v_dec.promotable,'decided_by',v_dec.decided_by,'decided_at',v_dec.decided_at) end
    ),
    'project_definition',case when v_pd.id is null then null else jsonb_build_object('id',v_pd.id,'status',v_pd.status,'version',v_pd.version,'definition_revision',v_pd.definition_revision,'initialized_at',v_pd.initialized_at,'build_ready_snapshot_id',v_pd.build_ready_snapshot_id,'gates',v_gates) end
  );
end;
$$;

revoke all on function public.get_idea_workspace_projection_v1(uuid) from public,anon;
grant execute on function public.get_idea_workspace_projection_v1(uuid) to authenticated,service_role;
