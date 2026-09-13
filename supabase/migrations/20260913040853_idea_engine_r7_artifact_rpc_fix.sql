-- 4b4c R7 — fix PL/pgSQL identifier ambiguity in create_project_definition_artifact_v1

create or replace function public.create_project_definition_artifact_v1(
  p_project_definition_id uuid,
  p_expected_definition_revision bigint,
  p_artifact_key text,
  p_payload jsonb,
  p_file_refs jsonb,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_pd public.project_definitions;
  v_idea public.ideas;
  v_existing public.idea_artifacts;
  v_prev public.idea_artifacts;
  v_expected_fp text;
  v_request_fp text;
  v_version integer;
  v_artifact_id uuid;
  v_purpose text;
  v_spec text;
  v_hash text;
begin
  if p_artifact_key not in ('A19_EXPERIENCE_INFORMATION_ARCHITECTURE_SPEC','A20_CONTENT_DISCOVERABILITY_SPEC','A21_FUNCTIONAL_DATA_INTEGRATION_SPEC','A22_DESIGN_DEFINITION','A23_TECHNICAL_NFR_DEFINITION','A24_VERIFICATION_ACCEPTANCE_PLAN','A25_BUILD_READY_PROJECT_SPECIFICATION') then
    raise exception 'UNSUPPORTED_PROJECT_ARTIFACT_KEY';
  end if;
  if p_payload is null or jsonb_typeof(p_payload)<>'object' or p_file_refs is null or jsonb_typeof(p_file_refs)<>'array' then
    raise exception 'INVALID_PROJECT_ARTIFACT_PAYLOAD';
  end if;

  select pd.* into v_pd
  from public.project_definitions pd
  where pd.id=p_project_definition_id
  for update;
  if v_pd.id is null then raise exception 'PROJECT_DEFINITION_NOT_FOUND'; end if;
  if v_pd.definition_revision<>p_expected_definition_revision then raise exception 'STALE_PROJECT_DEFINITION'; end if;

  select i.* into v_idea from public.ideas i where i.id=v_pd.idea_id;
  v_expected_fp:=app_private.project_artifact_expected_fingerprint_v1(v_pd.id,p_artifact_key);
  if v_expected_fp is null then raise exception 'PROJECT_ARTIFACT_FINGERPRINT_UNAVAILABLE'; end if;

  v_request_fp:=md5(jsonb_build_object('artifact_key',p_artifact_key,'payload',p_payload,'file_refs',p_file_refs,'input_fingerprint',v_expected_fp,'definition_revision',v_pd.definition_revision)::text);
  select a.* into v_existing
  from public.idea_artifacts a
  where a.idea_id=v_idea.id and a.idempotency_key=p_idempotency_key;
  if v_existing.id is not null then
    if v_existing.request_fingerprint<>v_request_fp then raise exception 'IDEMPOTENCY_KEY_REUSE'; end if;
    return jsonb_build_object('artifact_id',v_existing.id,'version',v_existing.version,'state',v_existing.state,'input_fingerprint',v_existing.input_fingerprint,'idempotent',true);
  end if;

  if p_artifact_key='A25_BUILD_READY_PROJECT_SPECIFICATION' then
    v_purpose:='FOR_BUILD'; v_spec:='BUILD_SPEC';
  else
    v_purpose:='FOR_PROJECT'; v_spec:='PROJECT_DEFINITION';
  end if;

  select a.* into v_prev
  from public.idea_artifacts a
  where a.idea_id=v_idea.id and a.artifact_key=p_artifact_key
  order by a.version desc
  limit 1;

  v_version:=coalesce(v_prev.version,0)+1;
  v_hash:=md5(jsonb_build_object('payload',p_payload,'file_refs',p_file_refs,'artifact_key',p_artifact_key,'input_fingerprint',v_expected_fp,'purpose',v_purpose,'spec',v_spec)::text);

  insert into public.idea_artifacts(
    idea_id,artifact_key,artifact_type,purpose_stage,version,state,payload,file_refs,source_snapshot_id,input_fingerprint,
    supersedes_artifact_id,created_engine_revision,content_hash,freshness_status,freshness_checked_at,spec_status,evidence_role,
    idempotency_key,request_fingerprint,project_definition_id
  ) values (
    v_idea.id,p_artifact_key,p_artifact_key,v_purpose,v_version,'draft',p_payload,p_file_refs,v_pd.approved_idea_snapshot_id,v_expected_fp,
    v_prev.id,v_idea.engine_revision,v_hash,'fresh',now(),v_spec,'NOT_EVIDENCE',p_idempotency_key,v_request_fp,v_pd.id
  ) returning idea_artifacts.id into v_artifact_id;

  return jsonb_build_object('artifact_id',v_artifact_id,'version',v_version,'state','draft','input_fingerprint',v_expected_fp,'idempotent',false);
end;
$$;

revoke all on function public.create_project_definition_artifact_v1(uuid,bigint,text,jsonb,jsonb,text) from public,anon,authenticated;
grant execute on function public.create_project_definition_artifact_v1(uuid,bigint,text,jsonb,jsonb,text) to service_role;
