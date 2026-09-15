-- 4b4c / 2b2c — G2 Source Snapshot Persistence Candidate V0.1
-- STATUS: NON-ACTIVE CANDIDATE. DO NOT APPLY TO PRODUCTION WITHOUT VALIDATION REPORT.
-- Purpose: provide immutable versioned source bodies and exact SRC Action Run pinning.

create table if not exists public.idea_source_snapshots (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.idea_sources(id) on delete cascade,
  source_version integer not null check (source_version > 0),
  content_hash text not null check (content_hash ~ '^[0-9a-f]{64}$'),
  hash_algorithm text not null default 'sha256' check (hash_algorithm = 'sha256'),
  extracted_text text not null,
  content_type text,
  storage_ref text,
  fetched_at timestamptz not null default now(),
  freshness_at timestamptz,
  sensitivity text not null check (sensitivity in ('public','internal','personal','sensitive')),
  extraction_metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(extraction_metadata)='object'),
  created_by_action_run_id uuid references public.idea_action_runs(id) on delete set null,
  created_by_actor text not null default 'system' check (nullif(btrim(created_by_actor),'') is not null),
  created_at timestamptz not null default now(),
  constraint idea_source_snapshots_source_version_unique unique (source_id,source_version),
  constraint idea_source_snapshots_text_nonempty check (nullif(btrim(extracted_text),'') is not null),
  constraint idea_source_snapshots_text_bound check (octet_length(convert_to(extracted_text,'UTF8')) <= 262144)
);

create index if not exists idea_source_snapshots_source_hash_idx
  on public.idea_source_snapshots(source_id,content_hash);

alter table public.idea_source_snapshots enable row level security;
revoke all on table public.idea_source_snapshots from anon, authenticated;
grant select,insert on table public.idea_source_snapshots to service_role;

-- Immutable snapshot rows. Service flows append versions; they never rewrite/delete a body.
create or replace function app_private.prevent_idea_source_snapshot_mutation_v1()
returns trigger
language plpgsql
set search_path=''
as $$
begin
  raise exception 'SOURCE_SNAPSHOT_IMMUTABLE';
end;
$$;

drop trigger if exists idea_source_snapshots_immutable_update_v1 on public.idea_source_snapshots;
create trigger idea_source_snapshots_immutable_update_v1
before update or delete on public.idea_source_snapshots
for each row execute function app_private.prevent_idea_source_snapshot_mutation_v1();

-- Service-only bounded source ingestion. The canonical hash is SHA-256 of exact extracted_text.
create or replace function public.commit_idea_source_snapshot_candidate_v1(
  p_source_id uuid,
  p_expected_source_version integer,
  p_extracted_text text,
  p_content_hash text,
  p_content_type text default null,
  p_storage_ref text default null,
  p_fetched_at timestamptz default now(),
  p_freshness_at timestamptz default null,
  p_sensitivity text default null,
  p_extraction_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_source public.idea_sources;
  v_idea public.ideas;
  v_snapshot public.idea_source_snapshots;
  v_hash text;
  v_sensitivity text;
  v_old_rank integer;
  v_new_rank integer;
  v_new_version integer;
  v_revision bigint;
  v_changed boolean;
  v_staled_count integer:=0;
begin
  if p_expected_source_version is null or p_expected_source_version<1 then
    raise exception 'EXPECTED_SOURCE_VERSION_REQUIRED';
  end if;
  if nullif(btrim(p_extracted_text),'') is null then raise exception 'SOURCE_TEXT_REQUIRED'; end if;
  if octet_length(convert_to(p_extracted_text,'UTF8'))>262144 then raise exception 'SOURCE_TEXT_TOO_LARGE'; end if;
  if p_extraction_metadata is null or jsonb_typeof(p_extraction_metadata)<>'object' then
    raise exception 'INVALID_EXTRACTION_METADATA';
  end if;

  v_hash:=encode(extensions.digest(convert_to(p_extracted_text,'UTF8'),'sha256'),'hex');
  if nullif(btrim(p_content_hash),'') is null or lower(btrim(p_content_hash))<>v_hash then
    raise exception 'SOURCE_CONTENT_HASH_MISMATCH';
  end if;

  select * into v_source from public.idea_sources where id=p_source_id for update;
  if v_source.id is null then raise exception 'SOURCE_NOT_FOUND'; end if;
  if v_source.source_kind<>'url' then raise exception 'SRC_V0_1_URL_REQUIRED'; end if;
  if v_source.status='superseded' then raise exception 'SOURCE_SUPERSEDED'; end if;
  if v_source.source_version<>p_expected_source_version then raise exception 'STALE_SOURCE'; end if;

  select * into v_idea from public.ideas where id=v_source.idea_id for update;
  if v_idea.id is null then raise exception 'IDEA_NOT_FOUND'; end if;
  if v_idea.blueprint_id<>'SITE_VITRINE' or v_idea.blueprint_version<>'0.5' or v_idea.blueprint_status<>'active' then
    raise exception 'G2_BLUEPRINT_0_5_NOT_ACTIVE';
  end if;

  v_sensitivity:=coalesce(nullif(btrim(p_sensitivity),''),v_source.sensitivity);
  v_old_rank:=app_private.idea_sensitivity_rank_v1(v_source.sensitivity);
  v_new_rank:=app_private.idea_sensitivity_rank_v1(v_sensitivity);
  if v_new_rank is null then raise exception 'INVALID_SENSITIVITY'; end if;
  if v_new_rank<v_old_rank then raise exception 'SOURCE_SENSITIVITY_DOWNGRADE_FORBIDDEN'; end if;

  -- Same body: preserve the immutable version. Backfill a missing legacy snapshot once.
  if v_source.content_hash=v_hash and v_source.status='ingested' then
    select * into v_snapshot
    from public.idea_source_snapshots
    where source_id=v_source.id and source_version=v_source.source_version;

    if v_snapshot.id is not null then
      if v_snapshot.content_hash<>v_hash then raise exception 'SOURCE_SNAPSHOT_HASH_CONFLICT'; end if;
      update public.idea_sources
      set fetched_at=coalesce(p_fetched_at,fetched_at),
          freshness_at=coalesce(p_freshness_at,freshness_at),
          sensitivity=case when v_new_rank>v_old_rank then v_sensitivity else sensitivity end
      where id=v_source.id;
      return jsonb_build_object(
        'source_id',v_source.id,'snapshot_id',v_snapshot.id,
        'source_version',v_source.source_version,'engine_revision',v_idea.engine_revision,
        'content_changed',false,'snapshot_created',false,'idempotent',true
      );
    end if;

    insert into public.idea_source_snapshots(
      source_id,source_version,content_hash,extracted_text,content_type,storage_ref,
      fetched_at,freshness_at,sensitivity,extraction_metadata,created_by_actor
    ) values (
      v_source.id,v_source.source_version,v_hash,p_extracted_text,nullif(btrim(p_content_type),''),
      nullif(btrim(p_storage_ref),''),coalesce(p_fetched_at,now()),p_freshness_at,
      v_sensitivity,p_extraction_metadata,'system'
    ) returning * into v_snapshot;

    update public.idea_sources
    set fetched_at=coalesce(p_fetched_at,now()),freshness_at=p_freshness_at,
        sensitivity=case when v_new_rank>v_old_rank then v_sensitivity else sensitivity end
    where id=v_source.id;

    update public.ideas set engine_revision=engine_revision+1
    where id=v_source.idea_id returning engine_revision into v_revision;

    insert into public.audit_events(workspace_id,actor_id,event_type,entity_type,entity_id,payload)
    values(v_idea.workspace_id,null,'idea.source_snapshot_backfilled','idea_source_snapshot',v_snapshot.id,
      jsonb_build_object('idea_id',v_source.idea_id,'source_id',v_source.id,'source_version',v_source.source_version,'revision_after',v_revision));

    return jsonb_build_object(
      'source_id',v_source.id,'snapshot_id',v_snapshot.id,
      'source_version',v_source.source_version,'engine_revision',v_revision,
      'content_changed',false,'snapshot_created',true,'idempotent',false
    );
  end if;

  v_changed:=v_source.content_hash is distinct from v_hash;
  v_new_version:=case when v_source.content_hash is null then v_source.source_version else v_source.source_version+1 end;

  if exists(select 1 from public.idea_source_snapshots where source_id=v_source.id and source_version=v_new_version) then
    raise exception 'SOURCE_SNAPSHOT_VERSION_CONFLICT';
  end if;

  insert into public.idea_source_snapshots(
    source_id,source_version,content_hash,extracted_text,content_type,storage_ref,
    fetched_at,freshness_at,sensitivity,extraction_metadata,created_by_actor
  ) values (
    v_source.id,v_new_version,v_hash,p_extracted_text,nullif(btrim(p_content_type),''),
    nullif(btrim(p_storage_ref),''),coalesce(p_fetched_at,now()),p_freshness_at,
    v_sensitivity,p_extraction_metadata,'system'
  ) returning * into v_snapshot;

  if v_changed and v_source.content_hash is not null then
    update public.idea_information_items set state='STALE'
    where source_id=v_source.id and state='ACTIVE';
    get diagnostics v_staled_count=row_count;
  end if;

  update public.idea_sources
  set content_hash=v_hash,source_version=v_new_version,
      fetched_at=coalesce(p_fetched_at,now()),freshness_at=p_freshness_at,
      status='ingested',
      sensitivity=case when v_new_rank>v_old_rank then v_sensitivity else sensitivity end
  where id=v_source.id;

  update public.ideas set engine_revision=engine_revision+1
  where id=v_source.idea_id returning engine_revision into v_revision;

  insert into public.audit_events(workspace_id,actor_id,event_type,entity_type,entity_id,payload)
  values(v_idea.workspace_id,null,'idea.source_snapshot_committed','idea_source_snapshot',v_snapshot.id,
    jsonb_build_object(
      'idea_id',v_source.idea_id,'source_id',v_source.id,'source_version',v_new_version,
      'content_changed',v_changed,'staled_information_items',v_staled_count,'revision_after',v_revision
    ));

  return jsonb_build_object(
    'source_id',v_source.id,'snapshot_id',v_snapshot.id,'source_version',v_new_version,
    'engine_revision',v_revision,'content_changed',v_changed,
    'snapshot_created',true,'staled_information_items',v_staled_count,'idempotent',false
  );
end;
$$;

revoke all on function public.commit_idea_source_snapshot_candidate_v1(uuid,integer,text,text,text,text,timestamptz,timestamptz,text,jsonb) from public, anon, authenticated;
grant execute on function public.commit_idea_source_snapshot_candidate_v1(uuid,integer,text,text,text,text,timestamptz,timestamptz,text,jsonb) to service_role;

-- Server-only registrations that still need fetching before SRC can become planner input.
create or replace function public.list_g2_src_ingestion_candidates_candidate_v1(
  p_idea_id uuid,
  p_expected_engine_revision bigint,
  p_limit integer default 1
)
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $$
declare
  v_idea public.ideas;
  v_limit integer:=greatest(1,least(coalesce(p_limit,1),3));
  v_rows jsonb;
begin
  select * into v_idea from public.ideas where id=p_idea_id;
  if v_idea.id is null then raise exception 'IDEA_NOT_FOUND'; end if;
  if v_idea.engine_revision<>p_expected_engine_revision then raise exception 'STALE_ENGINE'; end if;
  if v_idea.blueprint_id<>'SITE_VITRINE' or v_idea.blueprint_version<>'0.5' or v_idea.blueprint_status<>'active' then
    raise exception 'G2_BLUEPRINT_0_5_NOT_ACTIVE';
  end if;

  select coalesce(jsonb_agg(x.payload order by x.created_at,x.id),'[]'::jsonb) into v_rows
  from (
    select s.id,s.created_at,jsonb_build_object(
      'source_id',s.id,'source_version',s.source_version,'source_kind',s.source_kind,
      'locator',s.locator,'title',s.title,'sensitivity',s.sensitivity,'status',s.status
    ) payload
    from public.idea_sources s
    where s.idea_id=p_idea_id
      and s.source_kind='url'
      and s.status in ('registered','stale','failed','ingested')
      and s.sensitivity in ('public','internal')
      and nullif(btrim(s.locator),'') is not null
      and not exists(
        select 1 from public.idea_source_snapshots ss
        where ss.source_id=s.id and ss.source_version=s.source_version
          and ss.content_hash=s.content_hash
      )
    order by s.created_at,s.id
    limit v_limit
  ) x;

  return jsonb_build_object('idea_id',p_idea_id,'engine_revision',v_idea.engine_revision,'sources',v_rows);
end;
$$;

revoke all on function public.list_g2_src_ingestion_candidates_candidate_v1(uuid,bigint,integer) from public, anon, authenticated;
grant execute on function public.list_g2_src_ingestion_candidates_candidate_v1(uuid,bigint,integer) to service_role;

-- A current snapshot, not mere registration metadata, becomes the SRC input predicate.
create or replace function app_private.idea_g2_src_has_current_snapshot_candidate_v1(p_idea_id uuid)
returns boolean
language sql
stable
security definer
set search_path=''
as $$
  select exists(
    select 1
    from public.idea_sources s
    join public.idea_source_snapshots ss
      on ss.source_id=s.id
     and ss.source_version=s.source_version
     and ss.content_hash=s.content_hash
    where s.idea_id=p_idea_id
      and s.source_kind='url'
      and s.status='ingested'
      and s.sensitivity in ('public','internal')
      and ss.sensitivity in ('public','internal')
  )
$$;

revoke all on function app_private.idea_g2_src_has_current_snapshot_candidate_v1(uuid) from public, anon, authenticated;
grant execute on function app_private.idea_g2_src_has_current_snapshot_candidate_v1(uuid) to service_role;

-- Candidate replacement: only snapshot-backed SRC counts as planner input.
create or replace function app_private.idea_g2_path_has_input_candidate_v2(p_idea_id uuid,p_path text,p_requirement_id text)
returns boolean
language sql
stable
security definer
set search_path=''
as $$
  select case p_path
    when 'MEM' then exists(select 1 from public.idea_information_items ii where ii.idea_id=p_idea_id and ii.state='ACTIVE')
    when 'RAW' then exists(select 1 from public.idea_sources s where s.idea_id=p_idea_id and s.source_kind='human_raw' and s.status in ('registered','ingested'))
    when 'SRC' then app_private.idea_g2_src_has_current_snapshot_candidate_v1(p_idea_id)
    when 'AUDIT' then exists(select 1 from public.idea_sources s where s.idea_id=p_idea_id and s.source_kind in ('url','document','image','system_observation') and s.status in ('registered','ingested'))
    when 'CONN' then true
    when 'WEB' then true
    when 'CALC' then true
    when 'AI_H' then true
    when 'AI_R' then true
    else false
  end
$$;

revoke all on function app_private.idea_g2_path_has_input_candidate_v2(uuid,text,text) from public, anon, authenticated;
grant execute on function app_private.idea_g2_path_has_input_candidate_v2(uuid,text,text) to service_role;

-- Resolve up to 3 current URL snapshots. This is metadata selection only; no body leaves this RPC.
create or replace function public.list_g2_src_snapshot_candidates_candidate_v1(
  p_idea_id uuid,
  p_expected_engine_revision bigint,
  p_requirement_id text,
  p_limit integer default 3
)
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $$
declare
  v_idea public.ideas;
  v_limit integer:=greatest(1,least(coalesce(p_limit,3),3));
  v_rows jsonb;
begin
  if p_requirement_id<>'SV.D03.PRIMARY_NEED' then raise exception 'SRC_V0_1_TARGET_UNSUPPORTED'; end if;
  select * into v_idea from public.ideas where id=p_idea_id;
  if v_idea.id is null then raise exception 'IDEA_NOT_FOUND'; end if;
  if v_idea.engine_revision<>p_expected_engine_revision then raise exception 'STALE_ENGINE'; end if;

  select coalesce(jsonb_agg(x.payload order by x.created_at,x.snapshot_id),'[]'::jsonb) into v_rows
  from (
    select ss.id snapshot_id,ss.created_at,jsonb_build_object(
      'snapshot_id',ss.id,'source_id',s.id,'source_version',s.source_version,
      'content_hash',s.content_hash,'source_kind',s.source_kind,'locator',s.locator,
      'title',s.title,'sensitivity',s.sensitivity,'freshness_at',s.freshness_at
    ) payload
    from public.idea_sources s
    join public.idea_source_snapshots ss
      on ss.source_id=s.id and ss.source_version=s.source_version and ss.content_hash=s.content_hash
    where s.idea_id=p_idea_id and s.source_kind='url' and s.status='ingested'
      and s.sensitivity in ('public','internal') and ss.sensitivity in ('public','internal')
    order by s.created_at,s.id
    limit v_limit
  ) x;

  return jsonb_build_object('idea_id',p_idea_id,'engine_revision',v_idea.engine_revision,'requirement_id',p_requirement_id,'snapshots',v_rows);
end;
$$;

revoke all on function public.list_g2_src_snapshot_candidates_candidate_v1(uuid,bigint,text,integer) from public, anon, authenticated;
grant execute on function public.list_g2_src_snapshot_candidates_candidate_v1(uuid,bigint,text,integer) to service_role;

-- Create an SRC Action Run through the existing generic lifecycle, then pin exact immutable refs.
create or replace function public.create_g2_src_action_run_candidate_v1(
  p_idea_id uuid,
  p_expected_engine_revision bigint,
  p_requirement_id text,
  p_target_fingerprint text,
  p_projection_fingerprint text,
  p_snapshot_ids uuid[],
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_refs jsonb;
  v_count integer;
  v_input_fp text;
  v_created jsonb;
  v_run_id uuid;
  v_existing_refs jsonb;
begin
  if p_requirement_id<>'SV.D03.PRIMARY_NEED' then raise exception 'SRC_V0_1_TARGET_UNSUPPORTED'; end if;
  if coalesce(cardinality(p_snapshot_ids),0)<1 or cardinality(p_snapshot_ids)>3 then raise exception 'SRC_SNAPSHOT_COUNT_INVALID'; end if;
  if nullif(btrim(p_target_fingerprint),'') is null then raise exception 'TARGET_REQUIREMENT_FINGERPRINT_REQUIRED'; end if;
  if nullif(btrim(p_projection_fingerprint),'') is null then raise exception 'PROJECTION_FINGERPRINT_REQUIRED'; end if;
  if nullif(btrim(p_idempotency_key),'') is null then raise exception 'IDEMPOTENCY_KEY_REQUIRED'; end if;

  with requested as (
    select snapshot_id,ord from unnest(p_snapshot_ids) with ordinality q(snapshot_id,ord)
  ), valid as (
    select r.ord,ss.id snapshot_id,s.id source_id,s.source_version,s.content_hash
    from requested r
    join public.idea_source_snapshots ss on ss.id=r.snapshot_id
    join public.idea_sources s on s.id=ss.source_id
    where s.idea_id=p_idea_id and s.source_kind='url' and s.status='ingested'
      and s.source_version=ss.source_version and s.content_hash=ss.content_hash
      and s.sensitivity in ('public','internal') and ss.sensitivity in ('public','internal')
  )
  select count(*),coalesce(jsonb_agg(jsonb_build_object(
    'snapshot_id',snapshot_id,'source_id',source_id,'source_version',source_version,'content_hash',content_hash
  ) order by ord),'[]'::jsonb)
  into v_count,v_refs from valid;

  if v_count<>cardinality(p_snapshot_ids) then raise exception 'SRC_SNAPSHOT_NOT_CURRENT_OR_FOREIGN'; end if;

  v_input_fp:=encode(extensions.digest(jsonb_build_object(
    'idea_id',p_idea_id,'engine_revision',p_expected_engine_revision,
    'requirement_id',p_requirement_id,'target_fingerprint',p_target_fingerprint,
    'projection_fingerprint',p_projection_fingerprint,'source_snapshots',v_refs
  )::text,'sha256'),'hex');

  v_created:=public.create_g2_system_action_run_candidate_v1(
    p_idea_id,p_expected_engine_revision,'EXTRACT_SOURCE','SRC',
    array[p_requirement_id],jsonb_build_object(p_requirement_id,p_target_fingerprint),array[]::text[],
    v_input_fp,p_projection_fingerprint,
    jsonb_build_object('allowed_mutation_kinds',jsonb_build_array('INFORMATION_ITEM')),
    'cloudflare-workers-ai','@cf/google/gemma-4-26b-a4b-it','g2-src-v1','g2-src-v1','source-extractor-0.1.0',p_idempotency_key
  );

  v_run_id:=(v_created->>'action_run_id')::uuid;
  select input_refs into v_existing_refs from public.idea_action_runs where id=v_run_id for update;
  if coalesce((v_created->>'idempotent')::boolean,false) then
    if v_existing_refs is distinct from jsonb_build_object('source_snapshots',v_refs) then
      raise exception 'SRC_IDEMPOTENT_INPUT_REFS_MISMATCH';
    end if;
    return v_created||jsonb_build_object('input_fingerprint',v_input_fp,'input_refs',v_existing_refs);
  end if;

  update public.idea_action_runs
  set input_refs=jsonb_build_object('source_snapshots',v_refs)
  where id=v_run_id;

  return v_created||jsonb_build_object(
    'input_fingerprint',v_input_fp,'input_refs',jsonb_build_object('source_snapshots',v_refs)
  );
end;
$$;

revoke all on function public.create_g2_src_action_run_candidate_v1(uuid,bigint,text,text,text,uuid[],text) from public, anon, authenticated;
grant execute on function public.create_g2_src_action_run_candidate_v1(uuid,bigint,text,text,text,uuid[],text) to service_role;

-- Exact pinned SRC body boundary. Generic G2 validation runs first, then snapshot refs are revalidated.
create or replace function public.get_g2_src_action_input_candidate_v1(
  p_action_run_id uuid,
  p_current_input_fingerprint text,
  p_expected_attempt integer
)
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $$
declare
  v_base jsonb;
  v_run public.idea_action_runs;
  v_refs jsonb;
  v_snapshots jsonb;
  v_expected_count integer;
  v_valid_count integer;
begin
  v_base:=public.get_g2_action_input_candidate_v2(
    p_action_run_id,p_current_input_fingerprint,p_expected_attempt
  );

  select * into v_run from public.idea_action_runs where id=p_action_run_id;
  if v_run.id is null then raise exception 'ACTION_RUN_NOT_FOUND'; end if;
  if v_run.acquisition_path<>'SRC' or v_run.action_type<>'EXTRACT_SOURCE' then raise exception 'SRC_ACTION_RUN_REQUIRED'; end if;

  v_refs:=coalesce(v_run.input_refs->'source_snapshots','[]'::jsonb);
  if jsonb_typeof(v_refs)<>'array' then raise exception 'SRC_INPUT_REFS_INVALID'; end if;
  v_expected_count:=jsonb_array_length(v_refs);
  if v_expected_count<1 or v_expected_count>3 then raise exception 'SRC_SNAPSHOT_COUNT_INVALID'; end if;

  with refs as (
    select value ref,ord from jsonb_array_elements(v_refs) with ordinality q(value,ord)
  ), valid as (
    select r.ord,s.id source_id,ss.id snapshot_id,s.source_version,s.content_hash,
           s.locator,s.title,s.sensitivity,s.freshness_at,ss.content_type,
           left(ss.extracted_text,40000) extracted_text,
           char_length(ss.extracted_text)>40000 content_truncated
    from refs r
    join public.idea_source_snapshots ss on ss.id=(r.ref->>'snapshot_id')::uuid
    join public.idea_sources s on s.id=ss.source_id
    where s.idea_id=v_run.idea_id and s.id=(r.ref->>'source_id')::uuid
      and s.source_kind='url' and s.status='ingested'
      and s.source_version=(r.ref->>'source_version')::integer
      and ss.source_version=s.source_version
      and s.content_hash=r.ref->>'content_hash'
      and ss.content_hash=s.content_hash
      and s.sensitivity in ('public','internal') and ss.sensitivity in ('public','internal')
  )
  select count(*),coalesce(jsonb_agg(jsonb_build_object(
    'snapshot_id',snapshot_id,'source_id',source_id,'source_version',source_version,
    'content_hash',content_hash,'locator',locator,'title',title,'sensitivity',sensitivity,
    'freshness_at',freshness_at,'content_type',content_type,
    'extracted_text',extracted_text,'content_truncated',content_truncated
  ) order by ord),'[]'::jsonb)
  into v_valid_count,v_snapshots from valid;

  if v_valid_count<>v_expected_count then raise exception 'STALE_SOURCE_SNAPSHOT'; end if;

  return v_base||jsonb_build_object('source_snapshots',v_snapshots);
end;
$$;

revoke all on function public.get_g2_src_action_input_candidate_v1(uuid,text,integer) from public, anon, authenticated;
grant execute on function public.get_g2_src_action_input_candidate_v1(uuid,text,integer) to service_role;

-- NOTE: this candidate intentionally does NOT replace app_private.idea_g2_path_has_input_v1
-- and does NOT expose SRC at the Worker endpoint. Those are activation operations only after
-- transactional validation + deterministic red-team + authenticated fresh-Idea E2E.
