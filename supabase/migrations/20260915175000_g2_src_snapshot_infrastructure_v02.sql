-- 4b4c / 2b2c — dormant G2 SRC snapshot infrastructure V0.2
-- This migration installs only service-side candidate infrastructure.
-- It does NOT alter the active G2 planner predicate and does NOT expose SRC at the Worker endpoint.
-- Production user-facing executor scope remains CALC + RAW.

do $$
declare
  v_content text;
  v_blob_sha text;
  v_prefix bytea;
begin
  select (extensions.http_get(
    'https://raw.githubusercontent.com/bayouka/slyzone-motion-scapes-32/main/docs/project-definition/runtime/G2_SOURCE_SNAPSHOT_PERSISTENCE_CANDIDATE_V0_2.sql'
  )).content into v_content;

  if v_content is null or length(v_content)<1000 then
    raise exception 'G2_SRC_V0_2_CANDIDATE_FETCH_FAILED';
  end if;

  v_prefix := convert_to(
    'blob '||octet_length(convert_to(v_content,'UTF8'))::text,
    'UTF8'
  );
  v_blob_sha := encode(
    extensions.digest(v_prefix || decode('00','hex') || convert_to(v_content,'UTF8'),'sha1'),
    'hex'
  );

  if v_blob_sha <> 'c1fa9f9043d5075415339c4c0e64f6bd2c5897c6' then
    raise exception 'G2_SRC_V0_2_CANDIDATE_BLOB_SHA_MISMATCH: %',v_blob_sha;
  end if;

  execute v_content;
end;
$$;
