-- Extend canonical workspace projection with G0 Blueprint Fit state.

alter function public.get_idea_workspace_projection_v1(uuid) set schema app_private;
alter function app_private.get_idea_workspace_projection_v1(uuid) rename to workspace_projection_core_v1;
revoke all on function app_private.workspace_projection_core_v1(uuid) from public,anon,authenticated;

create or replace function public.get_idea_workspace_projection_v1(p_idea_id uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare
  v_base jsonb;
  v_a public.idea_blueprint_fit_assessments;
  v_d public.idea_blueprint_fit_decisions;
  v_unresolved boolean;
  v_requires_human boolean;
begin
  v_base:=app_private.workspace_projection_core_v1(p_idea_id);
  select * into v_a from public.idea_blueprint_fit_assessments where idea_id=p_idea_id order by created_at desc,id desc limit 1;
  select * into v_d from public.idea_blueprint_fit_decisions where idea_id=p_idea_id order by created_at desc,id desc limit 1;
  v_unresolved:=coalesce(v_base->'signals'->>'blueprint_fit_needed','false')::boolean;
  v_requires_human:=v_unresolved and v_a.id is not null and v_a.state='current' and (v_a.classification='AMBIGUOUS' or v_a.confidence<>'HIGH' or not v_a.auto_applicable);
  v_base:=jsonb_set(v_base,'{projection_version}',to_jsonb('1.1'::text),true);
  v_base:=jsonb_set(v_base,'{signals,blueprint_fit_assessment_available}',to_jsonb(v_a.id is not null),true);
  v_base:=jsonb_set(v_base,'{signals,blueprint_fit_requires_human}',to_jsonb(v_requires_human),true);
  return v_base || jsonb_build_object(
    'blueprint_fit',jsonb_build_object(
      'assessment',case when v_a.id is null then null else jsonb_build_object(
        'id',v_a.id,'classification',v_a.classification,'candidate_type',v_a.candidate_type,'confidence',v_a.confidence,
        'rationale',v_a.rationale,'auto_applicable',v_a.auto_applicable,'state',v_a.state,'created_at',v_a.created_at
      ) end,
      'decision',case when v_d.id is null then null else jsonb_build_object(
        'id',v_d.id,'decision',v_d.decision,'candidate_type',v_d.candidate_type,'decided_by_actor',v_d.decided_by_actor,
        'decided_by',v_d.decided_by,'rationale',v_d.rationale,'created_at',v_d.created_at
      ) end
    )
  );
end; $$;

revoke all on function public.get_idea_workspace_projection_v1(uuid) from public,anon;
grant execute on function public.get_idea_workspace_projection_v1(uuid) to authenticated,service_role;
