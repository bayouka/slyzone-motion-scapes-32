-- 4b4c R7 gate semantics hardening
-- Conditional applicability and Gate-specific satisfaction. ACCEPTED_UNKNOWN never satisfies a structural G8-G11 requirement.

create or replace function app_private.is_conditional_project_requirement_v1(p_id text)
returns boolean language sql immutable set search_path=''
as $$
  select p_id = any(array[
    'SV.D11.SEO_PAGE_MAP','SV.D11.REDIRECT_MAP','SV.D12.BUSINESS_RULES','SV.D13.CONTENT_DATA_MODEL',
    'SV.D13.ROLE_PERMISSION_MATRIX','SV.D14.INTEGRATION_CONTRACTS','SV.D17.EXPERT_SIGNOFF','SV.D19.MEASUREMENT_PLAN'
  ]::text[]);
$$;

create or replace function app_private.is_default_inactive_project_requirement_v1(p_id text)
returns boolean language sql immutable set search_path=''
as $$
  select p_id = any(array[
    'SV.D11.REDIRECT_MAP','SV.D13.CONTENT_DATA_MODEL','SV.D13.ROLE_PERMISSION_MATRIX','SV.D14.INTEGRATION_CONTRACTS','SV.D17.EXPERT_SIGNOFF'
  ]::text[]);
$$;

create or replace function app_private.project_requirement_satisfied_v1(p_project_definition_id uuid,p_requirement_id text)
returns boolean language plpgsql stable set search_path=''
as $$
declare v public.project_definition_requirement_states;
begin
  select * into v from public.project_definition_requirement_states
  where project_definition_id=p_project_definition_id and requirement_id=p_requirement_id;
  if v.id is null then return false; end if;
  if not v.applicable then
    return app_private.is_conditional_project_requirement_v1(p_requirement_id) and v.resolution_level='NOT_RELEVANT';
  end if;
  if v.state<>'current' or v.blocker_status='OPEN' then return false; end if;
  if p_requirement_id='SV.PRJ.APPROVED_BASELINE' then return v.resolution_level in ('APPROVED_FOR_PROJECT','FROZEN_FOR_BUILD'); end if;
  if p_requirement_id='SV.D17.EXPERT_SIGNOFF' then return v.resolution_level in ('EXPERT_SIGNOFF','FROZEN_FOR_BUILD') and v.authority_type='EXPERT' and v.accepted_by is not null; end if;
  if p_requirement_id='SV.D20.DEVELOPER_AMBIGUITY_AUDIT' then return v.resolution_level in ('VERIFIED_PASS','FROZEN_FOR_BUILD') and coalesce(v.verify_result->>'status','')='PASS'; end if;
  if p_requirement_id='SV.D20.READY_APPROVAL' then return v.resolution_level in ('HUMAN_DECISION','FROZEN_FOR_BUILD') and v.authority_type='HUMAN' and v.accepted_by is not null; end if;
  return v.resolution_level in ('ACCEPTED_AS_CURRENT','LOCKED_FOR_DEPENDENTS','APPROVED_FOR_PROJECT','EXPERT_SIGNOFF','VERIFIED_PASS','HUMAN_DECISION','FROZEN_FOR_BUILD');
end;
$$;
