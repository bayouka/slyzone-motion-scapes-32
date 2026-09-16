create or replace function app_private.canonical_project_baseline_requirement_bundle_v1(
  p_idea_id uuid,
  p_requirement_ids text[]
)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
with selected as (
  select
    rs.requirement_id,
    rs.blueprint_version,
    rs.applicability_state,
    rs.resolution_state,
    rs.criticality_current,
    rs.lock_state,
    rs.resolution_levels,
    rs.resolution_refs,
    rs.input_fingerprint,
    rs.evaluated_engine_revision,
    rs.authority_ok
  from public.idea_requirement_states rs
  where rs.idea_id = p_idea_id
    and rs.requirement_id = any(coalesce(p_requirement_ids,array[]::text[]))
), item_groups as (
  select
    r.requirement_id,
    jsonb_agg(
      jsonb_build_object(
        'information_item_id',i.id,
        'semantic_key',i.semantic_key,
        'item_type',i.item_type,
        'value',i.value_jsonb,
        'provenance_type',i.provenance_type,
        'confidence_class',i.confidence_class,
        'source_id',i.source_id,
        'source_locator',i.source_locator,
        'sensitivity',i.sensitivity,
        'relation_kind',r.relation_kind,
        'resolution_levels',to_jsonb(r.resolution_levels),
        'target_basis_fingerprint',r.target_basis_fingerprint
      ) order by i.created_at,i.id
    ) as information_items
  from public.idea_information_requirement_refs r
  join selected s on s.requirement_id=r.requirement_id
  join public.idea_information_items i
    on i.id=r.information_item_id
   and i.idea_id=p_idea_id
  where r.idea_id=p_idea_id
    and r.relation_kind in ('SUPPORTS','RESOLVES')
    and i.state='ACTIVE'
    and (r.target_basis_fingerprint is null or r.target_basis_fingerprint=s.input_fingerprint)
  group by r.requirement_id
)
select coalesce(
  jsonb_agg(
    jsonb_build_object(
      'requirement_id',s.requirement_id,
      'blueprint_version',s.blueprint_version,
      'applicability_state',s.applicability_state,
      'resolution_state',s.resolution_state,
      'criticality_current',s.criticality_current,
      'lock_state',s.lock_state,
      'resolution_levels',to_jsonb(s.resolution_levels),
      'resolution_refs',s.resolution_refs,
      'input_fingerprint',s.input_fingerprint,
      'evaluated_engine_revision',s.evaluated_engine_revision,
      'authority_ok',s.authority_ok,
      'information_items',coalesce(g.information_items,'[]'::jsonb)
    ) order by array_position(p_requirement_ids,s.requirement_id)
  ),
  '[]'::jsonb
)
from selected s
left join item_groups g using(requirement_id);
$$;

create or replace function app_private.canonical_project_baseline_artifact_target_domain_v1(
  p_artifact_key text
)
returns text
language sql
immutable
security invoker
set search_path = ''
as $$
  select case p_artifact_key
    when 'PF.CONCEPT_JOURNEY' then 'D10'
    when 'PF.CONCEPT_SITEMAP' then 'D10'
    when 'A08_CONCEPT_PREFIGURATION' then 'D10'
    when 'PF.MESSAGE_HIERARCHY' then 'D08'
    when 'PF.SEO_CONCEPT' then 'D09'
    when 'PF.CAPABILITY_SET' then 'D12'
    when 'PF.VISUAL_TERRITORIES' then 'D11'
    when 'PF.HIFI_CONCEPT' then 'D11'
    when 'PF.FEASIBILITY_ENVELOPE' then 'D14'
    when 'PF.SUCCESS_MODEL' then 'D02'
    when 'CV.CONCEPT_VALIDATION_RECORD' then 'D03'
    when 'D21.DECISION_ECONOMICS' then 'D02'
    else null
  end;
$$;

create or replace function app_private.build_canonical_project_baseline_payload_v1(
  p_idea_id uuid,
  p_decision_record_id uuid,
  p_expected_engine_revision bigint
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_idea public.ideas;
  v_dec public.idea_decision_records_v2;
  v_pkg public.idea_decision_packages;
  v_snap public.idea_snapshots;
  v_eval jsonb;
  v_g2 jsonb;
  v_vision jsonb;
  v_business_outcomes jsonb;
  v_approved_targets jsonb;
  v_positioning jsonb;
  v_macro_scope jsonb;
  v_non_goals jsonb;
  v_constraints jsonb;
  v_risk_requirements jsonb;
  v_risk_ledger jsonb;
  v_unknown_requirements jsonb;
  v_unknown_ledger jsonb;
  v_unknown_conditions jsonb;
  v_source_refs jsonb;
  v_ledger_source_refs jsonb;
  v_decision_owner jsonb;
  v_artifact_promotions jsonb;
  v_baseline_manifest jsonb;
  v_promotion_diff jsonb;
  v_payload jsonb;
  v_fingerprint text;
  v_required_resolved text[] := array[
    'SV.D02.PRIMARY_OBJECTIVE',
    'SV.D03.PRIMARY_AUDIENCE',
    'SV.D06.RECOMMENDATION',
    'SV.D07.OFFER_PRIORITY',
    'SV.D07.MACRO_SCOPE',
    'SV.D07.NON_GOALS'
  ]::text[];
  v_all_requirement_ids text[] := array[
    'SV.D01.DECISION_OWNER',
    'SV.D02.PRIMARY_OBJECTIVE','SV.D02.USER_OUTCOME','SV.D02.HARD_CONSTRAINTS',
    'SV.D03.PRIMARY_AUDIENCE',
    'SV.D06.POSITIONING_OPTIONS','SV.D06.RISKS_ASSUMPTIONS','SV.D06.RECOMMENDATION','SV.D06.PREFIGURATION_TARGET',
    'SV.D07.OFFER_PRIORITY','SV.D07.MACRO_SCOPE','SV.D07.NON_GOALS',
    'SV.PF.FEASIBILITY_ENVELOPE','SV.PF.RISK_PROBE'
  ]::text[];
begin
  select * into v_dec from public.idea_decision_records_v2 where id=p_decision_record_id;
  if v_dec.id is null then raise exception 'DECISION_RECORD_NOT_FOUND'; end if;
  if v_dec.idea_id is distinct from p_idea_id then raise exception 'DECISION_IDEA_MISMATCH'; end if;

  select * into v_idea from public.ideas where id=p_idea_id;
  if v_idea.id is null then raise exception 'IDEA_NOT_FOUND'; end if;
  if v_idea.engine_revision is distinct from p_expected_engine_revision
     or v_dec.decided_engine_revision is distinct from p_expected_engine_revision then
    raise exception 'STALE_ENGINE';
  end if;

  v_eval := public.get_canonical_idea_preproject_readiness_v1(p_idea_id);
  v_g2 := v_eval->'formal_gates'->'G2_GO_PROJECT';
  if not coalesce((v_g2->>'ready')::boolean,false) then raise exception 'CANONICAL_G2_NOT_READY'; end if;
  if v_g2->>'decision_record_id' is distinct from p_decision_record_id::text then raise exception 'CANONICAL_G2_DECISION_MISMATCH'; end if;

  select * into v_pkg from public.idea_decision_packages where id=v_dec.package_id;
  if v_pkg.id is null or v_pkg.state<>'frozen' then raise exception 'DECISION_PACKAGE_NOT_FROZEN'; end if;
  if v_pkg.snapshot_engine_revision is distinct from p_expected_engine_revision then raise exception 'DECISION_PACKAGE_STALE'; end if;

  select * into v_snap
  from public.idea_snapshots
  where id=v_dec.decision_snapshot_id and idea_id=p_idea_id and snapshot_type='DECISION_SNAPSHOT';
  if v_snap.id is null or v_snap.engine_revision is distinct from p_expected_engine_revision then raise exception 'DECISION_SNAPSHOT_STALE'; end if;

  if exists(
    select 1
    from unnest(v_required_resolved) req(requirement_id)
    left join public.idea_requirement_states rs
      on rs.idea_id=p_idea_id and rs.requirement_id=req.requirement_id
    where rs.requirement_id is null
       or rs.applicability_state<>'ACTIVE'
       or rs.resolution_state<>'RESOLVED'
       or rs.evaluated_engine_revision is distinct from p_expected_engine_revision
       or rs.lock_state in ('REVIEW_REQUIRED','STALE','SUPERSEDED','REJECTED')
       or not rs.authority_ok
  ) then
    raise exception 'PROJECT_BASELINE_REQUIRED_REQUIREMENT_NOT_CURRENT';
  end if;

  if exists(
    select 1 from public.idea_requirement_states rs
    where rs.idea_id=p_idea_id
      and rs.requirement_id=any(v_all_requirement_ids)
      and rs.applicability_state='ACTIVE'
      and (
        rs.resolution_state in ('STALE','CONFLICTED','UNRESOLVED')
        or rs.evaluated_engine_revision is distinct from p_expected_engine_revision
        or rs.lock_state in ('REVIEW_REQUIRED','STALE','SUPERSEDED','REJECTED')
      )
  ) then
    raise exception 'PROJECT_BASELINE_CONTAINS_NONCURRENT_REQUIREMENT';
  end if;

  v_vision := jsonb_build_object(
    'primary_objective',app_private.canonical_project_baseline_requirement_bundle_v1(p_idea_id,array['SV.D02.PRIMARY_OBJECTIVE']),
    'strategic_recommendation',app_private.canonical_project_baseline_requirement_bundle_v1(p_idea_id,array['SV.D06.RECOMMENDATION']),
    'macro_scope',app_private.canonical_project_baseline_requirement_bundle_v1(p_idea_id,array['SV.D07.MACRO_SCOPE'])
  );

  v_business_outcomes := app_private.canonical_project_baseline_requirement_bundle_v1(
    p_idea_id,array['SV.D02.PRIMARY_OBJECTIVE','SV.D02.USER_OUTCOME']
  );
  v_approved_targets := app_private.canonical_project_baseline_requirement_bundle_v1(
    p_idea_id,array['SV.D03.PRIMARY_AUDIENCE','SV.D07.OFFER_PRIORITY','SV.D06.PREFIGURATION_TARGET']
  );
  v_positioning := app_private.canonical_project_baseline_requirement_bundle_v1(
    p_idea_id,array['SV.D06.POSITIONING_OPTIONS','SV.D06.RECOMMENDATION']
  );
  v_macro_scope := app_private.canonical_project_baseline_requirement_bundle_v1(p_idea_id,array['SV.D07.MACRO_SCOPE']);
  v_non_goals := app_private.canonical_project_baseline_requirement_bundle_v1(p_idea_id,array['SV.D07.NON_GOALS']);
  v_constraints := jsonb_build_object(
    'hard_constraints',app_private.canonical_project_baseline_requirement_bundle_v1(p_idea_id,array['SV.D02.HARD_CONSTRAINTS']),
    'feasibility_envelope',app_private.canonical_project_baseline_requirement_bundle_v1(p_idea_id,array['SV.PF.FEASIBILITY_ENVELOPE'])
  );
  v_risk_requirements := app_private.canonical_project_baseline_requirement_bundle_v1(
    p_idea_id,array['SV.D06.RISKS_ASSUMPTIONS','SV.PF.RISK_PROBE']
  );

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'ledger_entry_id',le.id,'entry_type',le.entry_type,'target_refs',le.target_refs,'payload',le.payload,
      'state',le.state,'materiality',le.materiality,'authority_ref',le.authority_ref,'source_refs',le.source_refs
    ) order by le.created_at,le.id
  ),'[]'::jsonb)
  into v_risk_ledger
  from public.idea_ledger_entries le
  where le.idea_id=p_idea_id
    and le.entry_type in ('RISK_UNKNOWN','ASSUMPTION','CONFLICT')
    and le.state in ('open','accepted');

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'requirement_id',rs.requirement_id,'resolution_refs',rs.resolution_refs,'resolution_levels',to_jsonb(rs.resolution_levels),
      'criticality_current',rs.criticality_current,'lock_state',rs.lock_state,'input_fingerprint',rs.input_fingerprint
    ) order by rs.requirement_id
  ),'[]'::jsonb)
  into v_unknown_requirements
  from public.idea_requirement_states rs
  where rs.idea_id=p_idea_id
    and rs.resolution_state='ACCEPTED_UNKNOWN'
    and rs.evaluated_engine_revision=p_expected_engine_revision
    and rs.lock_state not in ('REVIEW_REQUIRED','STALE','SUPERSEDED','REJECTED');

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'ledger_entry_id',le.id,'target_refs',le.target_refs,'payload',le.payload,'state',le.state,
      'materiality',le.materiality,'authority_ref',le.authority_ref,'source_refs',le.source_refs
    ) order by le.created_at,le.id
  ),'[]'::jsonb)
  into v_unknown_ledger
  from public.idea_ledger_entries le
  where le.idea_id=p_idea_id and le.entry_type='ACCEPTED_UNKNOWN' and le.state='accepted';

  select coalesce(jsonb_agg(value order by ord),'[]'::jsonb)
  into v_unknown_conditions
  from jsonb_array_elements(coalesce(v_dec.conditions,'[]'::jsonb)) with ordinality c(value,ord)
  where value->>'class'='NON_BLOCKING_ACCEPTED_UNKNOWN';

  select coalesce(jsonb_agg(source_obj order by source_key),'[]'::jsonb)
  into v_source_refs
  from (
    select distinct on (coalesce(src.id::text,i.source_id::text,''),coalesce(src.locator,i.source_locator,''))
      coalesce(src.id::text,i.source_id::text,'')||'|'||coalesce(src.locator,i.source_locator,'') as source_key,
      jsonb_build_object(
        'source_id',coalesce(src.id,i.source_id),
        'source_kind',src.source_kind,
        'locator',coalesce(src.locator,i.source_locator),
        'title',src.title,
        'content_hash',src.content_hash,
        'source_version',src.source_version,
        'status',src.status,
        'sensitivity',coalesce(src.sensitivity,i.sensitivity)
      ) as source_obj
    from public.idea_information_requirement_refs r
    join public.idea_requirement_states rs
      on rs.idea_id=p_idea_id and rs.requirement_id=r.requirement_id
    join public.idea_information_items i
      on i.id=r.information_item_id and i.idea_id=p_idea_id
    left join public.idea_sources src on src.id=i.source_id and src.idea_id=p_idea_id
    where r.idea_id=p_idea_id
      and r.relation_kind in ('SUPPORTS','RESOLVES')
      and i.state='ACTIVE'
      and (i.source_id is not null or nullif(btrim(i.source_locator),'') is not null)
      and (r.target_basis_fingerprint is null or r.target_basis_fingerprint=rs.input_fingerprint)
      and rs.evaluated_engine_revision=p_expected_engine_revision
    order by coalesce(src.id::text,i.source_id::text,''),coalesce(src.locator,i.source_locator,''),i.created_at desc,i.id desc
  ) s;

  select coalesce(jsonb_agg(
    jsonb_build_object('ledger_entry_id',le.id,'entry_type',le.entry_type,'source_refs',le.source_refs)
    order by le.created_at,le.id
  ),'[]'::jsonb)
  into v_ledger_source_refs
  from public.idea_ledger_entries le
  where le.idea_id=p_idea_id
    and le.state not in ('superseded','stale','rejected')
    and jsonb_array_length(le.source_refs)>0;

  v_decision_owner := jsonb_build_object(
    'decided_by',v_dec.decided_by,
    'decided_at',v_dec.decided_at,
    'outcome',v_dec.outcome,
    'decision_hash',v_dec.decision_hash,
    'gate_evaluation_fingerprint',v_dec.gate_evaluation_fingerprint,
    'decision_owner_requirement',app_private.canonical_project_baseline_requirement_bundle_v1(p_idea_id,array['SV.D01.DECISION_OWNER'])
  );

  if exists(
    select 1
    from jsonb_array_elements(coalesce(v_snap.manifest->'artifact_versions','[]'::jsonb)) av
    join public.idea_artifacts a on a.id=(av->>'artifact_id')::uuid
    where a.idea_id=p_idea_id
      and a.spec_status='CONCEPT_NOT_FINAL_SPEC'
      and app_private.canonical_project_baseline_artifact_target_domain_v1(a.artifact_key) is null
  ) then
    raise exception 'UNMAPPED_PROJECT_PROMOTABLE_ARTIFACT';
  end if;

  if exists(
    select 1
    from jsonb_array_elements(coalesce(v_snap.manifest->'artifact_versions','[]'::jsonb)) av
    join public.idea_artifacts a on a.id=(av->>'artifact_id')::uuid
    where a.idea_id=p_idea_id
      and a.spec_status='CONCEPT_NOT_FINAL_SPEC'
      and (a.state<>'frozen' or a.freshness_status<>'fresh' or a.purpose_stage<>'FOR_DECISION')
  ) then
    raise exception 'PROJECT_PROMOTION_ARTIFACT_NOT_CURRENT';
  end if;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'source_artifact_id',a.id,
      'classification','PROMOTE_AND_DEEPEN',
      'target_domain',app_private.canonical_project_baseline_artifact_target_domain_v1(a.artifact_key),
      'rationale','Server-derived from frozen Decision Snapshot; concept remains non-final and must be deepened in Project Definition.'
    ) order by a.artifact_key,a.version,a.id
  ),'[]'::jsonb)
  into v_artifact_promotions
  from jsonb_array_elements(coalesce(v_snap.manifest->'artifact_versions','[]'::jsonb)) av
  join public.idea_artifacts a on a.id=(av->>'artifact_id')::uuid
  where a.idea_id=p_idea_id and a.spec_status='CONCEPT_NOT_FINAL_SPEC';

  v_baseline_manifest := jsonb_build_object(
    'schema_version','canonical-project-baseline-v1',
    'derivation','SERVER_DERIVED_FROM_FROZEN_IDEA_DECISION',
    'idea_id',p_idea_id,
    'blueprint',jsonb_build_object('id',v_idea.blueprint_id,'version',v_idea.blueprint_version),
    'engine_revision',p_expected_engine_revision,
    'decision_record_id',v_dec.id,
    'decision_package_id',v_pkg.id,
    'decision_snapshot_id',v_snap.id,
    'decision_snapshot_hash',v_snap.content_hash,
    'vision',v_vision,
    'decision_rationale',jsonb_build_object('rationale',v_dec.rationale,'outcome',v_dec.outcome,'conditions',v_dec.conditions),
    'business_outcomes',v_business_outcomes,
    'approved_targets',v_approved_targets,
    'positioning',v_positioning,
    'macro_scope',v_macro_scope,
    'non_goals',v_non_goals,
    'critical_constraints',v_constraints,
    'risks',jsonb_build_object('requirements',v_risk_requirements,'ledger',v_risk_ledger),
    'accepted_unknowns',jsonb_build_object('requirements',v_unknown_requirements,'ledger',v_unknown_ledger,'decision_conditions',v_unknown_conditions),
    'source_evidence_refs',jsonb_build_object('information_sources',v_source_refs,'ledger_source_refs',v_ledger_source_refs),
    'decision_authority',v_decision_owner
  );

  v_promotion_diff := jsonb_build_object(
    'schema_version','canonical-project-promotion-diff-v1',
    'derivation','SERVER_DERIVED',
    'requires_reapproval',false,
    'source_idea_id',p_idea_id,
    'source_engine_revision',p_expected_engine_revision,
    'decision_record_id',v_dec.id,
    'decision_snapshot_id',v_snap.id,
    'artifact_policy','PROMOTE_AND_DEEPEN_CONCEPT_NOT_FINAL_SPEC',
    'artifact_promotion_count',jsonb_array_length(v_artifact_promotions)
  );

  v_payload := jsonb_build_object(
    'baseline_manifest',v_baseline_manifest,
    'promotion_diff',v_promotion_diff,
    'artifact_promotions',v_artifact_promotions
  );
  v_fingerprint := md5(v_payload::text);

  return v_payload || jsonb_build_object('payload_fingerprint',v_fingerprint);
end;
$$;

create or replace function public.promote_canonical_approved_idea_to_project_definition_v3(
  p_idea_id uuid,
  p_decision_record_id uuid,
  p_actor_id uuid,
  p_expected_engine_revision bigint,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_payload jsonb;
  v_result jsonb;
begin
  if p_actor_id is null then raise exception 'PROMOTION_ACTOR_REQUIRED'; end if;
  if p_idea_id is null then raise exception 'IDEA_ID_REQUIRED'; end if;
  if nullif(btrim(p_idempotency_key),'') is null then raise exception 'IDEMPOTENCY_KEY_REQUIRED'; end if;

  v_payload := app_private.build_canonical_project_baseline_payload_v1(
    p_idea_id,p_decision_record_id,p_expected_engine_revision
  );

  v_result := public.promote_canonical_approved_idea_to_project_definition_v2(
    p_decision_record_id,
    p_actor_id,
    p_expected_engine_revision,
    v_payload->'baseline_manifest',
    v_payload->'promotion_diff',
    v_payload->'artifact_promotions',
    p_idempotency_key
  );

  return v_result || jsonb_build_object(
    'canonical_gate_id','G3_PROJECT_BASELINE',
    'baseline_derivation','SERVER_DERIVED_FROM_FROZEN_IDEA_DECISION',
    'baseline_payload_fingerprint',v_payload->>'payload_fingerprint',
    'client_manifest_accepted',false,
    'client_promotion_diff_accepted',false,
    'client_artifact_promotions_accepted',false
  );
end;
$$;

revoke all on function app_private.canonical_project_baseline_requirement_bundle_v1(uuid,text[]) from public,anon,authenticated;
revoke all on function app_private.canonical_project_baseline_artifact_target_domain_v1(text) from public,anon,authenticated;
revoke all on function app_private.build_canonical_project_baseline_payload_v1(uuid,uuid,bigint) from public,anon,authenticated;
revoke all on function public.promote_canonical_approved_idea_to_project_definition_v3(uuid,uuid,uuid,bigint,text) from public,anon,authenticated;
grant execute on function public.promote_canonical_approved_idea_to_project_definition_v3(uuid,uuid,uuid,bigint,text) to service_role;
