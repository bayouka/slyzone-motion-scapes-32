-- 4b4c Project Master Blueprint V1 — Core Ontology runtime graph, additive bridge layer.
-- Applied live first via Supabase migration 20260916153749.
-- R7 Requirement States remain the current instance-state source during migration.

create table if not exists app_private.project_blueprint_packs_v1 (
  blueprint_id text not null,
  blueprint_version text not null,
  status text not null,
  canonical_contract_id text not null,
  canonical_contract_version text not null,
  source_runtime text,
  source_blueprint_version text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  primary key (blueprint_id, blueprint_version),
  constraint project_blueprint_packs_v1_status_check
    check (status in ('BRIDGE_ACTIVE','CANDIDATE','ACTIVE','SUPERSEDED')),
  constraint project_blueprint_packs_v1_contract_check
    check (length(btrim(canonical_contract_id)) > 0 and length(btrim(canonical_contract_version)) > 0)
);

revoke all on table app_private.project_blueprint_packs_v1 from public, anon, authenticated;
grant select on table app_private.project_blueprint_packs_v1 to service_role;

create table if not exists app_private.project_node_definitions_v1 (
  blueprint_id text not null,
  blueprint_version text not null,
  node_id text not null,
  node_kind text not null default 'REQUIREMENT',
  canonical_primary_domain_id text not null,
  canonical_domain_ids text[] not null,
  legacy_requirement_id text,
  legacy_semantic_type text,
  title text not null,
  applicability_default text not null,
  fulfilment_stage_required text not null,
  source_contract text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  primary key (blueprint_id, blueprint_version, node_id),
  foreign key (blueprint_id, blueprint_version)
    references app_private.project_blueprint_packs_v1(blueprint_id, blueprint_version)
    on delete cascade,
  constraint project_node_definitions_v1_node_kind_check
    check (node_kind in ('REQUIREMENT','DECISION','ARTIFACT','QUALITY_REQUIREMENT','RISK','COMPLIANCE','DELIVERY_LOT')),
  constraint project_node_definitions_v1_primary_domain_check
    check (canonical_primary_domain_id ~ '^D(0[1-9]|1[0-6])$'),
  constraint project_node_definitions_v1_domains_check
    check (
      cardinality(canonical_domain_ids) > 0
      and canonical_primary_domain_id = any(canonical_domain_ids)
      and canonical_domain_ids <@ array[
        'D01','D02','D03','D04','D05','D06','D07','D08',
        'D09','D10','D11','D12','D13','D14','D15','D16'
      ]::text[]
    ),
  constraint project_node_definitions_v1_legacy_semantic_check
    check (legacy_semantic_type is null or legacy_semantic_type in ('INFO','SPEC','DECISION','VERIFY')),
  constraint project_node_definitions_v1_applicability_check
    check (applicability_default in ('APPLICABLE','NOT_APPLICABLE','CONDITIONAL','UNRESOLVED')),
  constraint project_node_definitions_v1_fulfilment_check
    check (fulfilment_stage_required in ('DEFINITION','RFD','IMPLEMENTATION','PRE_RELEASE','POST_RELEASE')),
  constraint project_node_definitions_v1_title_check
    check (length(btrim(title)) > 0),
  unique (blueprint_id, blueprint_version, legacy_requirement_id)
);

revoke all on table app_private.project_node_definitions_v1 from public, anon, authenticated;
grant select on table app_private.project_node_definitions_v1 to service_role;

create table if not exists app_private.project_dependency_edges_v1 (
  id uuid primary key default gen_random_uuid(),
  blueprint_id text not null,
  blueprint_version text not null,
  source_node_id text not null,
  target_node_id text not null,
  relation_type text not null,
  strength text not null,
  rationale text not null default '',
  source_contract text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  foreign key (blueprint_id, blueprint_version, source_node_id)
    references app_private.project_node_definitions_v1(blueprint_id, blueprint_version, node_id)
    on delete cascade,
  foreign key (blueprint_id, blueprint_version, target_node_id)
    references app_private.project_node_definitions_v1(blueprint_id, blueprint_version, node_id)
    on delete cascade,
  constraint project_dependency_edges_v1_relation_check
    check (relation_type in ('REQUIRES','INFORMS','DERIVED_FROM','SUPPORTS','CHALLENGES','CONTRADICTS','SATISFIES','INVALIDATES','REFERENCES','PRODUCES')),
  constraint project_dependency_edges_v1_strength_check
    check (strength in ('HARD','SOFT')),
  constraint project_dependency_edges_v1_no_self_edge
    check (source_node_id <> target_node_id),
  unique (blueprint_id, blueprint_version, source_node_id, target_node_id, relation_type)
);

revoke all on table app_private.project_dependency_edges_v1 from public, anon, authenticated;
grant select on table app_private.project_dependency_edges_v1 to service_role;

insert into app_private.project_blueprint_packs_v1
(blueprint_id, blueprint_version, status, canonical_contract_id, canonical_contract_version, source_runtime, source_blueprint_version, metadata)
values (
  'SITE_VITRINE','1.0-bridge-r7','BRIDGE_ACTIVE','4B4C_PROJECT_MASTER_BLUEPRINT','1.0',
  'R7_BUILD_READY_RUNTIME','SITE_VITRINE@0.5/R7',
  jsonb_build_object('runtime_activation','compatibility_bridge_only','legacy_ids_rewritten',false,'core_ontology','V1','domain_registry','D01_D16')
)
on conflict (blueprint_id, blueprint_version) do nothing;

insert into app_private.project_node_definitions_v1
(blueprint_id, blueprint_version, node_id, node_kind, canonical_primary_domain_id, canonical_domain_ids,
 legacy_requirement_id, legacy_semantic_type, title, applicability_default, fulfilment_stage_required, source_contract, metadata)
values
('SITE_VITRINE','1.0-bridge-r7','SV.D06.APPROVED_BASELINE','REQUIREMENT','D06',array['D06','D16'],'SV.PRJ.APPROVED_BASELINE','INFO','Baseline Idea approuvée','APPLICABLE','DEFINITION','REQUIREMENTS_PROJECT_BUILD_V0_1',jsonb_build_object('bridge_source','R7')),
('SITE_VITRINE','1.0-bridge-r7','SV.D10.JOURNEY_SPEC','REQUIREMENT','D10',array['D10'],'SV.D08.JOURNEY_SPEC','SPEC','Parcours utilisateur détaillé','APPLICABLE','RFD','REQUIREMENTS_PROJECT_BUILD_V0_1','{}'),
('SITE_VITRINE','1.0-bridge-r7','SV.D10.PAGE_MANIFEST','REQUIREMENT','D10',array['D10'],'SV.D09.PAGE_MANIFEST','SPEC','Manifest pages/routes','APPLICABLE','RFD','REQUIREMENTS_PROJECT_BUILD_V0_1','{}'),
('SITE_VITRINE','1.0-bridge-r7','SV.D08.CONTENT_REQUIREMENTS','REQUIREMENT','D08',array['D08'],'SV.D10.CONTENT_REQUIREMENTS','SPEC','Exigences contenu par surface','APPLICABLE','RFD','REQUIREMENTS_PROJECT_BUILD_V0_1','{}'),
('SITE_VITRINE','1.0-bridge-r7','SV.D09.SEO_PAGE_MAP','REQUIREMENT','D09',array['D09'],'SV.D11.SEO_PAGE_MAP','SPEC','Mapping SEO page/intention','APPLICABLE','RFD','REQUIREMENTS_PROJECT_BUILD_V0_1','{}'),
('SITE_VITRINE','1.0-bridge-r7','SV.D09.REDIRECT_MAP','REQUIREMENT','D09',array['D09'],'SV.D11.REDIRECT_MAP','SPEC','Plan de redirections SEO','CONDITIONAL','RFD','REQUIREMENTS_PROJECT_BUILD_V0_1','{}'),
('SITE_VITRINE','1.0-bridge-r7','SV.D12.FUNCTIONAL_REQUIREMENTS','REQUIREMENT','D12',array['D12'],'SV.D12.FUNCTIONAL_REQUIREMENTS','SPEC','Exigences fonctionnelles','APPLICABLE','RFD','REQUIREMENTS_PROJECT_BUILD_V0_1','{}'),
('SITE_VITRINE','1.0-bridge-r7','SV.D12.UI_STATES','REQUIREMENT','D12',array['D12','D11'],'SV.D12.UI_STATES','SPEC','États loading/empty/error/success/disabled','APPLICABLE','RFD','REQUIREMENTS_PROJECT_BUILD_V0_1','{}'),
('SITE_VITRINE','1.0-bridge-r7','SV.D12.BUSINESS_RULES','REQUIREMENT','D12',array['D12'],'SV.D12.BUSINESS_RULES','SPEC','Règles métier et cas limites','APPLICABLE','RFD','REQUIREMENTS_PROJECT_BUILD_V0_1','{}'),
('SITE_VITRINE','1.0-bridge-r7','SV.D13.CONTENT_DATA_MODEL','REQUIREMENT','D13',array['D13','D08'],'SV.D13.CONTENT_DATA_MODEL','SPEC','Modèle contenu/données','CONDITIONAL','RFD','REQUIREMENTS_PROJECT_BUILD_V0_1','{}'),
('SITE_VITRINE','1.0-bridge-r7','SV.D13.ROLE_PERMISSION_MATRIX','REQUIREMENT','D13',array['D13','D06'],'SV.D13.ROLE_PERMISSION_MATRIX','SPEC','Rôles et permissions','CONDITIONAL','RFD','REQUIREMENTS_PROJECT_BUILD_V0_1','{}'),
('SITE_VITRINE','1.0-bridge-r7','SV.D13.INTEGRATION_CONTRACTS','REQUIREMENT','D13',array['D13'],'SV.D14.INTEGRATION_CONTRACTS','SPEC','Contrats d’intégration','CONDITIONAL','RFD','REQUIREMENTS_PROJECT_BUILD_V0_1','{}'),
('SITE_VITRINE','1.0-bridge-r7','SV.D10.WIREFRAME_BASELINE','REQUIREMENT','D10',array['D10','D11'],'SV.D15.WIREFRAME_BASELINE','SPEC','Wireframes structurants','APPLICABLE','RFD','REQUIREMENTS_PROJECT_BUILD_V0_1','{}'),
('SITE_VITRINE','1.0-bridge-r7','SV.D11.DESIGN_DEFINITION','REQUIREMENT','D11',array['D11'],'SV.D15.DESIGN_DEFINITION','SPEC','Direction visuelle et design system nécessaires au build','APPLICABLE','RFD','REQUIREMENTS_PROJECT_BUILD_V0_1','{}'),
('SITE_VITRINE','1.0-bridge-r7','SV.D11.RESPONSIVE_BEHAVIOR','REQUIREMENT','D11',array['D11','D10'],'SV.D15.RESPONSIVE_BEHAVIOR','SPEC','Comportement responsive','APPLICABLE','RFD','REQUIREMENTS_PROJECT_BUILD_V0_1','{}'),
('SITE_VITRINE','1.0-bridge-r7','SV.D14.DELIVERY_APPROACH','REQUIREMENT','D14',array['D14','D16'],'SV.D16.DELIVERY_APPROACH','DECISION','Approche de delivery','APPLICABLE','RFD','REQUIREMENTS_PROJECT_BUILD_V0_1','{}'),
('SITE_VITRINE','1.0-bridge-r7','SV.D14.ARCHITECTURE','REQUIREMENT','D14',array['D14'],'SV.D16.ARCHITECTURE','SPEC','Architecture technique','APPLICABLE','RFD','REQUIREMENTS_PROJECT_BUILD_V0_1','{}'),
('SITE_VITRINE','1.0-bridge-r7','SV.D14.ENV_HOSTING_OPS','REQUIREMENT','D14',array['D14'],'SV.D16.ENV_HOSTING_OPS','SPEC','Environnements, hébergement et maintenance','APPLICABLE','RFD','REQUIREMENTS_PROJECT_BUILD_V0_1','{}'),
('SITE_VITRINE','1.0-bridge-r7','SV.D15.PRIVACY_SECURITY','REQUIREMENT','D15',array['D15'],'SV.D17.PRIVACY_SECURITY','SPEC','Sécurité, privacy et conformité applicables','APPLICABLE','RFD','REQUIREMENTS_PROJECT_BUILD_V0_1','{}'),
('SITE_VITRINE','1.0-bridge-r7','SV.D15.EXPERT_SIGNOFF','REQUIREMENT','D15',array['D15','D06'],'SV.D17.EXPERT_SIGNOFF','VERIFY','Validation experte conditionnelle','CONDITIONAL','RFD','REQUIREMENTS_PROJECT_BUILD_V0_1','{}'),
('SITE_VITRINE','1.0-bridge-r7','SV.D15.ACCESSIBILITY_TARGET','REQUIREMENT','D15',array['D15'],'SV.D18.ACCESSIBILITY_TARGET','DECISION','Cible d’accessibilité','APPLICABLE','RFD','REQUIREMENTS_PROJECT_BUILD_V0_1','{}'),
('SITE_VITRINE','1.0-bridge-r7','SV.D15.PERFORMANCE_RELIABILITY','REQUIREMENT','D15',array['D15','D14'],'SV.D18.PERFORMANCE_RELIABILITY','SPEC','Performance, fiabilité et compatibilité','APPLICABLE','RFD','REQUIREMENTS_PROJECT_BUILD_V0_1','{}'),
('SITE_VITRINE','1.0-bridge-r7','SV.D14.MEASUREMENT_PLAN','REQUIREMENT','D14',array['D14','D02','D15'],'SV.D19.MEASUREMENT_PLAN','SPEC','Plan de mesure','APPLICABLE','RFD','REQUIREMENTS_PROJECT_BUILD_V0_1','{}'),
('SITE_VITRINE','1.0-bridge-r7','SV.D15.ACCEPTANCE_CRITERIA','REQUIREMENT','D15',array['D15','D16'],'SV.D20.ACCEPTANCE_CRITERIA','VERIFY','Critères d’acceptation des exigences critiques','APPLICABLE','RFD','REQUIREMENTS_PROJECT_BUILD_V0_1','{}'),
('SITE_VITRINE','1.0-bridge-r7','SV.D16.SOURCE_OF_TRUTH_MANIFEST','REQUIREMENT','D16',array['D16'],'SV.D20.SOURCE_OF_TRUTH_MANIFEST','SPEC','Manifest des sources de vérité','APPLICABLE','RFD','REQUIREMENTS_PROJECT_BUILD_V0_1','{}'),
('SITE_VITRINE','1.0-bridge-r7','SV.D16.IMPLEMENTATION_DISCRETION','REQUIREMENT','D16',array['D16','D06'],'SV.D20.IMPLEMENTATION_DISCRETION','DECISION','Liberté d’implémentation','APPLICABLE','RFD','REQUIREMENTS_PROJECT_BUILD_V0_1','{}'),
('SITE_VITRINE','1.0-bridge-r7','SV.D16.DEVELOPER_AMBIGUITY_AUDIT','REQUIREMENT','D16',array['D16','D15'],'SV.D20.DEVELOPER_AMBIGUITY_AUDIT','VERIFY','Audit d’ambiguïté développeur','APPLICABLE','RFD','REQUIREMENTS_PROJECT_BUILD_V0_1','{}'),
('SITE_VITRINE','1.0-bridge-r7','SV.D16.READY_APPROVAL','REQUIREMENT','D16',array['D16','D06'],'SV.D20.READY_APPROVAL','DECISION','Approbation Ready for Development','APPLICABLE','RFD','REQUIREMENTS_PROJECT_BUILD_V0_1','{}')
on conflict (blueprint_id, blueprint_version, node_id) do nothing;

insert into app_private.project_dependency_edges_v1
(blueprint_id, blueprint_version, source_node_id, target_node_id, relation_type, strength, rationale, source_contract)
values
('SITE_VITRINE','1.0-bridge-r7','SV.D10.JOURNEY_SPEC','SV.D06.APPROVED_BASELINE','REQUIRES','HARD','Legacy requires_all','REQUIREMENTS_PROJECT_BUILD_V0_1'),
('SITE_VITRINE','1.0-bridge-r7','SV.D10.PAGE_MANIFEST','SV.D10.JOURNEY_SPEC','REQUIRES','HARD','Legacy requires_all','REQUIREMENTS_PROJECT_BUILD_V0_1'),
('SITE_VITRINE','1.0-bridge-r7','SV.D08.CONTENT_REQUIREMENTS','SV.D10.PAGE_MANIFEST','REQUIRES','HARD','Legacy requires_all','REQUIREMENTS_PROJECT_BUILD_V0_1'),
('SITE_VITRINE','1.0-bridge-r7','SV.D09.SEO_PAGE_MAP','SV.D10.PAGE_MANIFEST','REQUIRES','HARD','Legacy requires_all','REQUIREMENTS_PROJECT_BUILD_V0_1'),
('SITE_VITRINE','1.0-bridge-r7','SV.D09.REDIRECT_MAP','SV.D10.PAGE_MANIFEST','REQUIRES','HARD','Legacy requires_all','REQUIREMENTS_PROJECT_BUILD_V0_1'),
('SITE_VITRINE','1.0-bridge-r7','SV.D12.FUNCTIONAL_REQUIREMENTS','SV.D10.JOURNEY_SPEC','REQUIRES','HARD','Legacy requires_all','REQUIREMENTS_PROJECT_BUILD_V0_1'),
('SITE_VITRINE','1.0-bridge-r7','SV.D12.FUNCTIONAL_REQUIREMENTS','SV.D10.PAGE_MANIFEST','REQUIRES','HARD','Legacy requires_all','REQUIREMENTS_PROJECT_BUILD_V0_1'),
('SITE_VITRINE','1.0-bridge-r7','SV.D12.UI_STATES','SV.D12.FUNCTIONAL_REQUIREMENTS','REQUIRES','HARD','Legacy requires_all','REQUIREMENTS_PROJECT_BUILD_V0_1'),
('SITE_VITRINE','1.0-bridge-r7','SV.D12.BUSINESS_RULES','SV.D12.FUNCTIONAL_REQUIREMENTS','REQUIRES','HARD','Legacy requires_all','REQUIREMENTS_PROJECT_BUILD_V0_1'),
('SITE_VITRINE','1.0-bridge-r7','SV.D13.CONTENT_DATA_MODEL','SV.D08.CONTENT_REQUIREMENTS','REQUIRES','HARD','Legacy requires_all','REQUIREMENTS_PROJECT_BUILD_V0_1'),
('SITE_VITRINE','1.0-bridge-r7','SV.D13.CONTENT_DATA_MODEL','SV.D12.FUNCTIONAL_REQUIREMENTS','REQUIRES','HARD','Legacy requires_all','REQUIREMENTS_PROJECT_BUILD_V0_1'),
('SITE_VITRINE','1.0-bridge-r7','SV.D13.INTEGRATION_CONTRACTS','SV.D12.FUNCTIONAL_REQUIREMENTS','REQUIRES','HARD','Legacy requires_all','REQUIREMENTS_PROJECT_BUILD_V0_1'),
('SITE_VITRINE','1.0-bridge-r7','SV.D10.WIREFRAME_BASELINE','SV.D10.PAGE_MANIFEST','REQUIRES','HARD','Legacy requires_all','REQUIREMENTS_PROJECT_BUILD_V0_1'),
('SITE_VITRINE','1.0-bridge-r7','SV.D10.WIREFRAME_BASELINE','SV.D08.CONTENT_REQUIREMENTS','REQUIRES','HARD','Legacy requires_all','REQUIREMENTS_PROJECT_BUILD_V0_1'),
('SITE_VITRINE','1.0-bridge-r7','SV.D10.WIREFRAME_BASELINE','SV.D12.FUNCTIONAL_REQUIREMENTS','REQUIRES','HARD','Legacy requires_all','REQUIREMENTS_PROJECT_BUILD_V0_1'),
('SITE_VITRINE','1.0-bridge-r7','SV.D11.DESIGN_DEFINITION','SV.D10.WIREFRAME_BASELINE','REQUIRES','HARD','Legacy requires_all','REQUIREMENTS_PROJECT_BUILD_V0_1'),
('SITE_VITRINE','1.0-bridge-r7','SV.D11.RESPONSIVE_BEHAVIOR','SV.D11.DESIGN_DEFINITION','REQUIRES','HARD','Legacy requires_all','REQUIREMENTS_PROJECT_BUILD_V0_1'),
('SITE_VITRINE','1.0-bridge-r7','SV.D14.DELIVERY_APPROACH','SV.D12.FUNCTIONAL_REQUIREMENTS','REQUIRES','HARD','Legacy requires_all','REQUIREMENTS_PROJECT_BUILD_V0_1'),
('SITE_VITRINE','1.0-bridge-r7','SV.D14.ARCHITECTURE','SV.D14.DELIVERY_APPROACH','REQUIRES','HARD','Legacy requires_all','REQUIREMENTS_PROJECT_BUILD_V0_1'),
('SITE_VITRINE','1.0-bridge-r7','SV.D14.ARCHITECTURE','SV.D13.CONTENT_DATA_MODEL','INFORMS','SOFT','Legacy benefits_from','REQUIREMENTS_PROJECT_BUILD_V0_1'),
('SITE_VITRINE','1.0-bridge-r7','SV.D14.ARCHITECTURE','SV.D13.INTEGRATION_CONTRACTS','INFORMS','SOFT','Legacy benefits_from','REQUIREMENTS_PROJECT_BUILD_V0_1'),
('SITE_VITRINE','1.0-bridge-r7','SV.D14.ENV_HOSTING_OPS','SV.D14.ARCHITECTURE','REQUIRES','HARD','Legacy requires_all','REQUIREMENTS_PROJECT_BUILD_V0_1'),
('SITE_VITRINE','1.0-bridge-r7','SV.D15.PRIVACY_SECURITY','SV.D12.FUNCTIONAL_REQUIREMENTS','REQUIRES','HARD','Legacy requires_all','REQUIREMENTS_PROJECT_BUILD_V0_1'),
('SITE_VITRINE','1.0-bridge-r7','SV.D15.PRIVACY_SECURITY','SV.D14.ARCHITECTURE','REQUIRES','HARD','Legacy requires_all','REQUIREMENTS_PROJECT_BUILD_V0_1'),
('SITE_VITRINE','1.0-bridge-r7','SV.D15.PERFORMANCE_RELIABILITY','SV.D14.ARCHITECTURE','REQUIRES','HARD','Legacy requires_all','REQUIREMENTS_PROJECT_BUILD_V0_1'),
('SITE_VITRINE','1.0-bridge-r7','SV.D14.MEASUREMENT_PLAN','SV.D10.JOURNEY_SPEC','REQUIRES','HARD','Legacy requires_all','REQUIREMENTS_PROJECT_BUILD_V0_1'),
('SITE_VITRINE','1.0-bridge-r7','SV.D15.ACCEPTANCE_CRITERIA','SV.D12.FUNCTIONAL_REQUIREMENTS','REQUIRES','HARD','Legacy requires_all','REQUIREMENTS_PROJECT_BUILD_V0_1'),
('SITE_VITRINE','1.0-bridge-r7','SV.D15.ACCEPTANCE_CRITERIA','SV.D11.DESIGN_DEFINITION','REQUIRES','HARD','Legacy requires_all','REQUIREMENTS_PROJECT_BUILD_V0_1'),
('SITE_VITRINE','1.0-bridge-r7','SV.D15.ACCEPTANCE_CRITERIA','SV.D14.ARCHITECTURE','REQUIRES','HARD','Legacy requires_all','REQUIREMENTS_PROJECT_BUILD_V0_1'),
('SITE_VITRINE','1.0-bridge-r7','SV.D16.DEVELOPER_AMBIGUITY_AUDIT','SV.D15.ACCEPTANCE_CRITERIA','REQUIRES','HARD','Legacy requires_all','REQUIREMENTS_PROJECT_BUILD_V0_1'),
('SITE_VITRINE','1.0-bridge-r7','SV.D16.DEVELOPER_AMBIGUITY_AUDIT','SV.D16.SOURCE_OF_TRUTH_MANIFEST','REQUIRES','HARD','Legacy requires_all','REQUIREMENTS_PROJECT_BUILD_V0_1'),
('SITE_VITRINE','1.0-bridge-r7','SV.D16.DEVELOPER_AMBIGUITY_AUDIT','SV.D16.IMPLEMENTATION_DISCRETION','REQUIRES','HARD','Legacy requires_all','REQUIREMENTS_PROJECT_BUILD_V0_1'),
('SITE_VITRINE','1.0-bridge-r7','SV.D16.READY_APPROVAL','SV.D16.DEVELOPER_AMBIGUITY_AUDIT','REQUIRES','HARD','Legacy requires_all','REQUIREMENTS_PROJECT_BUILD_V0_1')
on conflict (blueprint_id, blueprint_version, source_node_id, target_node_id, relation_type) do nothing;

create or replace function app_private.project_blueprint_has_hard_cycle_v1(p_blueprint_id text, p_blueprint_version text)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  with recursive walk(source_node_id, current_node_id, path, cycle) as (
    select e.source_node_id, e.target_node_id, array[e.source_node_id, e.target_node_id]::text[], e.target_node_id = e.source_node_id
    from app_private.project_dependency_edges_v1 e
    where e.blueprint_id = p_blueprint_id and e.blueprint_version = p_blueprint_version and e.strength = 'HARD' and e.relation_type = 'REQUIRES'
    union all
    select w.source_node_id, e.target_node_id, w.path || e.target_node_id, e.target_node_id = any(w.path)
    from walk w
    join app_private.project_dependency_edges_v1 e
      on e.blueprint_id = p_blueprint_id and e.blueprint_version = p_blueprint_version
     and e.source_node_id = w.current_node_id and e.strength = 'HARD' and e.relation_type = 'REQUIRES'
    where not w.cycle
  )
  select coalesce(bool_or(cycle), false) from walk;
$$;

revoke all on function app_private.project_blueprint_has_hard_cycle_v1(text,text) from public, anon, authenticated;
grant execute on function app_private.project_blueprint_has_hard_cycle_v1(text,text) to service_role;

do $$
begin
  if app_private.project_blueprint_has_hard_cycle_v1('SITE_VITRINE','1.0-bridge-r7') then
    raise exception 'CANONICAL_HARD_DEPENDENCY_CYCLE';
  end if;
end
$$;

create or replace function public.get_project_definition_canonical_graph_v1(p_project_definition_id uuid)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'schema_version','1.0',
    'blueprint',jsonb_build_object(
      'blueprint_id',bp.blueprint_id,'blueprint_version',bp.blueprint_version,'status',bp.status,
      'canonical_contract_id',bp.canonical_contract_id,'canonical_contract_version',bp.canonical_contract_version,
      'source_runtime',bp.source_runtime,'source_blueprint_version',bp.source_blueprint_version
    ),
    'project_definition',jsonb_build_object(
      'id',pd.id,'idea_id',pd.idea_id,'workspace_id',pd.workspace_id,'status',pd.status,
      'definition_revision',pd.definition_revision,'baseline_hash',pd.baseline_hash,
      'build_ready_snapshot_id',pd.build_ready_snapshot_id,'build_ready_hash',pd.build_ready_hash
    ),
    'nodes',coalesce((
      select jsonb_agg(jsonb_build_object(
        'node_id',nd.node_id,'node_kind',nd.node_kind,'canonical_primary_domain_id',nd.canonical_primary_domain_id,
        'canonical_domain_ids',to_jsonb(nd.canonical_domain_ids),'title',nd.title,
        'applicability_default',nd.applicability_default,'fulfilment_stage_required',nd.fulfilment_stage_required,
        'legacy_requirement_id',nd.legacy_requirement_id,'legacy_semantic_type',nd.legacy_semantic_type,
        'state_present',prs.id is not null,
        'state',case when prs.id is null then null else jsonb_build_object(
          'applicability_state',case when prs.applicable then 'APPLICABLE' else 'NOT_APPLICABLE' end,
          'legacy_resolution_level',prs.resolution_level,'legacy_state',prs.state,'legacy_lock_state',prs.lock_state,
          'authority_type',prs.authority_type,'accepted_by',prs.accepted_by,'owner_ref',prs.owner_ref,
          'blocker_status',prs.blocker_status,'blocker_reason',prs.blocker_reason,'definition_revision',prs.definition_revision,
          'input_fingerprint',prs.input_fingerprint,'context_fingerprint',prs.context_fingerprint,
          'canonical_fulfilment_stage',null,'canonical_fulfilment_mapping_status','NOT_YET_MAPPED'
        ) end
      ) order by nd.node_id)
      from app_private.project_node_definitions_v1 nd
      left join public.project_definition_requirement_states prs
        on prs.project_definition_id = pd.id and prs.requirement_id = nd.legacy_requirement_id
      where nd.blueprint_id = bp.blueprint_id and nd.blueprint_version = bp.blueprint_version
    ),'[]'::jsonb),
    'edges',coalesce((
      select jsonb_agg(jsonb_build_object(
        'source_node_id',e.source_node_id,'target_node_id',e.target_node_id,
        'relation_type',e.relation_type,'strength',e.strength,'rationale',e.rationale
      ) order by e.source_node_id,e.target_node_id,e.relation_type)
      from app_private.project_dependency_edges_v1 e
      where e.blueprint_id = bp.blueprint_id and e.blueprint_version = bp.blueprint_version
    ),'[]'::jsonb),
    'graph_integrity',jsonb_build_object(
      'hard_dependency_cycle',app_private.project_blueprint_has_hard_cycle_v1(bp.blueprint_id,bp.blueprint_version),
      'state_source','R7_PROJECT_DEFINITION_REQUIREMENT_STATES','legacy_ids_rewritten',false,
      'canonical_fulfilment_mapping','NOT_YET_IMPLEMENTED'
    )
  )
  from public.project_definitions pd
  cross join app_private.project_blueprint_packs_v1 bp
  where pd.id = p_project_definition_id and bp.blueprint_id = 'SITE_VITRINE' and bp.blueprint_version = '1.0-bridge-r7';
$$;

revoke all on function public.get_project_definition_canonical_graph_v1(uuid) from public, anon, authenticated;
grant execute on function public.get_project_definition_canonical_graph_v1(uuid) to service_role;
