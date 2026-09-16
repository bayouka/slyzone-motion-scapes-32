-- 4b4c Project Master Blueprint V1 — additive R7 -> canonical domain shadow mapping
-- Applied live first via Supabase migration 20260916145814.
-- Compatibility rule: never rewrite persisted R7 Requirement IDs or legacy Gate IDs in place.

create table if not exists app_private.project_definition_requirement_canonical_map_v1 (
  requirement_id text primary key,
  legacy_domain_id text not null,
  canonical_primary_domain_id text not null,
  canonical_domain_ids text[] not null,
  rationale text not null,
  mapping_version text not null default '1.0',
  created_at timestamptz not null default now(),
  constraint project_definition_requirement_canonical_map_v1_legacy_domain_check
    check (legacy_domain_id = 'PRJ' or legacy_domain_id ~ '^D(0[1-9]|1[0-9]|2[0-2])$'),
  constraint project_definition_requirement_canonical_map_v1_primary_domain_check
    check (canonical_primary_domain_id ~ '^D(0[1-9]|1[0-6])$'),
  constraint project_definition_requirement_canonical_map_v1_domain_array_check
    check (
      cardinality(canonical_domain_ids) > 0
      and canonical_primary_domain_id = any(canonical_domain_ids)
      and canonical_domain_ids <@ array[
        'D01','D02','D03','D04','D05','D06','D07','D08',
        'D09','D10','D11','D12','D13','D14','D15','D16'
      ]::text[]
    ),
  constraint project_definition_requirement_canonical_map_v1_rationale_check
    check (length(btrim(rationale)) > 0)
);

revoke all on table app_private.project_definition_requirement_canonical_map_v1 from public, anon, authenticated;
grant select on table app_private.project_definition_requirement_canonical_map_v1 to service_role;
grant usage on schema app_private to service_role;

insert into app_private.project_definition_requirement_canonical_map_v1
(requirement_id, legacy_domain_id, canonical_primary_domain_id, canonical_domain_ids, rationale)
values
('SV.PRJ.APPROVED_BASELINE','PRJ','D06',array['D06','D16'],'Approved baseline is first an authority/governance commitment; its frozen delivery identity also informs D16.'),
('SV.D08.JOURNEY_SPEC','D08','D10',array['D10'],'Journeys and service flow belong to canonical Information Architecture & UX.'),
('SV.D09.PAGE_MANIFEST','D09','D10',array['D10'],'Page/screen structure and navigation belong to canonical Information Architecture & UX.'),
('SV.D10.CONTENT_REQUIREMENTS','D10','D08',array['D08'],'Content requirements and asset needs belong to canonical Content & Assets.'),
('SV.D11.SEO_PAGE_MAP','D11','D09',array['D09'],'SEO page mapping belongs to canonical SEO & Discoverability.'),
('SV.D11.REDIRECT_MAP','D11','D09',array['D09'],'Redirect and migration preservation belong to canonical SEO & Discoverability.'),
('SV.D12.FUNCTIONAL_REQUIREMENTS','D12','D12',array['D12'],'Functional requirements remain canonical Functional Behaviour.'),
('SV.D12.UI_STATES','D12','D12',array['D12','D11'],'Functional UI states are governed by Functional Behaviour; visual expression may be consumed by Brand, UI & Interaction.'),
('SV.D12.BUSINESS_RULES','D12','D12',array['D12'],'Business rules remain canonical Functional Behaviour.'),
('SV.D13.CONTENT_DATA_MODEL','D13','D13',array['D13','D08'],'Persisted content/data structure belongs to Data & Integrations while editorial ownership is consumed by Content & Assets.'),
('SV.D13.ROLE_PERMISSION_MATRIX','D13','D13',array['D13','D06'],'Data/application permissions belong to Data & Integrations; authority semantics may also inform Governance & Decisions.'),
('SV.D14.INTEGRATION_CONTRACTS','D14','D13',array['D13'],'APIs and external service contracts consolidate in Data & Integrations.'),
('SV.D15.WIREFRAME_BASELINE','D15','D10',array['D10','D11'],'Wireframes primarily encode structure, hierarchy and UX; downstream visual treatment is D11.'),
('SV.D15.DESIGN_DEFINITION','D15','D11',array['D11'],'Visual direction, components and design-system definition belong to Brand, UI & Interaction.'),
('SV.D15.RESPONSIVE_BEHAVIOR','D15','D11',array['D11','D10'],'Responsive component/interaction behaviour is D11 while structural responsive UX also informs D10.'),
('SV.D16.DELIVERY_APPROACH','D16','D14',array['D14','D16'],'Legacy technical delivery approach primarily describes platform/operations; handoff implications also feed canonical D16.'),
('SV.D16.ARCHITECTURE','D16','D14',array['D14'],'Technical architecture belongs to canonical Architecture & Operations.'),
('SV.D16.ENV_HOSTING_OPS','D16','D14',array['D14'],'Environment, hosting and operations belong to canonical Architecture & Operations.'),
('SV.D17.PRIVACY_SECURITY','D17','D15',array['D15'],'Privacy and security consolidate in canonical Quality, Risk & Compliance.'),
('SV.D17.EXPERT_SIGNOFF','D17','D15',array['D15','D06'],'Expert signoff verifies a D15 concern while its authority provenance also informs D06.'),
('SV.D18.ACCESSIBILITY_TARGET','D18','D15',array['D15'],'Accessibility quality targets consolidate in canonical Quality, Risk & Compliance.'),
('SV.D18.PERFORMANCE_RELIABILITY','D18','D15',array['D15','D14'],'Performance/reliability targets are quality requirements; operational mechanisms may be implemented in D14.'),
('SV.D19.MEASUREMENT_PLAN','D19','D14',array['D14','D02','D15'],'Instrumentation/observability is operational D14; business success measures D02 and verification telemetry D15 consume it.'),
('SV.D20.ACCEPTANCE_CRITERIA','D20','D15',array['D15','D16'],'Acceptance criteria define verifiable quality conditions and are consumed by Delivery/Handoff readiness.'),
('SV.D20.SOURCE_OF_TRUTH_MANIFEST','D20','D16',array['D16'],'Source-of-truth manifest is part of canonical delivery/handoff integrity.'),
('SV.D20.IMPLEMENTATION_DISCRETION','D20','D16',array['D16','D06'],'Implementation discretion defines the handoff boundary and the authority delegated to build actors.'),
('SV.D20.DEVELOPER_AMBIGUITY_AUDIT','D20','D16',array['D16','D15'],'Developer ambiguity audit validates constructibility/handoff and contributes verification evidence.'),
('SV.D20.READY_APPROVAL','D20','D16',array['D16','D06'],'Build-ready approval is the authorized handoff decision; D16 owns readiness while D06 owns decision authority.')
on conflict (requirement_id) do nothing;

create or replace function public.get_project_requirement_canonical_classification_v1(p_requirement_id text)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'requirement_id', m.requirement_id,
    'legacy_domain_id', m.legacy_domain_id,
    'canonical_primary_domain_id', m.canonical_primary_domain_id,
    'canonical_domain_ids', to_jsonb(m.canonical_domain_ids),
    'mapping_version', m.mapping_version,
    'rationale', m.rationale
  )
  from app_private.project_definition_requirement_canonical_map_v1 m
  where m.requirement_id = p_requirement_id;
$$;

revoke all on function public.get_project_requirement_canonical_classification_v1(text) from public, anon, authenticated;
grant execute on function public.get_project_requirement_canonical_classification_v1(text) to service_role;
