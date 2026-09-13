-- 4b4c Idea Engine R2 RAW-first ingestion RPCs

alter table public.idea_sources
  add column idempotency_key text null,
  add column request_fingerprint text null,
  add constraint idea_sources_idempotency_key_nonempty check (idempotency_key is null or nullif(btrim(idempotency_key),'') is not null),
  add constraint idea_sources_idempotency_unique unique (idea_id,idempotency_key);

alter table public.idea_information_items
  add column idempotency_key text null,
  add column request_fingerprint text null,
  add constraint idea_information_items_idempotency_key_nonempty check (idempotency_key is null or nullif(btrim(idempotency_key),'') is not null),
  add constraint idea_information_items_idempotency_unique unique (idea_id,idempotency_key);

alter table public.idea_requirement_states
  add column evaluated_engine_revision bigint not null default 0 check (evaluated_engine_revision >= 0);

create or replace function public.initialize_idea_engine_v1(
  p_idea_id uuid,
  p_expected_engine_revision bigint,
  p_blueprint_id text,
  p_blueprint_version text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_idea public.ideas;
  v_source_id uuid;
  v_revision bigint;
begin
  if v_user is null or not app_private.can_write_idea(p_idea_id) then
    raise exception 'FORBIDDEN' using errcode='42501';
  end if;

  select * into v_idea from public.ideas where id=p_idea_id for update;
  if v_idea.id is null then raise exception 'IDEA_NOT_FOUND'; end if;

  if v_idea.blueprint_id is not null then
    if v_idea.blueprint_id=p_blueprint_id
       and v_idea.blueprint_version=p_blueprint_version
       and v_idea.blueprint_status='active' then
      select id into v_source_id
      from public.idea_sources
      where idea_id=p_idea_id and idempotency_key='system:initial-original-text'
      limit 1;
      return jsonb_build_object('idea_id',p_idea_id,'blueprint_id',v_idea.blueprint_id,'blueprint_version',v_idea.blueprint_version,'engine_revision',v_idea.engine_revision,'raw_source_id',v_source_id,'idempotent',true);
    end if;
    raise exception 'BLUEPRINT_ALREADY_ASSIGNED';
  end if;

  if v_idea.engine_revision<>p_expected_engine_revision then raise exception 'STALE_ENGINE'; end if;
  if p_blueprint_id<>'SITE_VITRINE' or p_blueprint_version<>'0.4' then raise exception 'UNSUPPORTED_BLUEPRINT'; end if;

  insert into public.idea_sources(
    idea_id,source_kind,locator,title,content_hash,source_version,status,sensitivity,created_by,idempotency_key,request_fingerprint
  ) values (
    p_idea_id,'human_raw','ideas.original_text','Description originale',md5(v_idea.original_text),1,'ingested','internal',v_idea.created_by,
    'system:initial-original-text',md5(v_idea.original_text)
  )
  on conflict (idea_id,idempotency_key) do nothing
  returning id into v_source_id;

  if v_source_id is null then
    select id into v_source_id from public.idea_sources where idea_id=p_idea_id and idempotency_key='system:initial-original-text';
  end if;

  update public.ideas
  set blueprint_id=p_blueprint_id,
      blueprint_version=p_blueprint_version,
      blueprint_status='active',
      engine_revision=engine_revision+1
  where id=p_idea_id
  returning engine_revision into v_revision;

  insert into public.audit_events(workspace_id,actor_id,event_type,entity_type,entity_id,payload)
  values(v_idea.workspace_id,v_user,'idea.engine_initialized','idea',p_idea_id,
         jsonb_build_object('blueprint_id',p_blueprint_id,'blueprint_version',p_blueprint_version,'revision_before',p_expected_engine_revision,'revision_after',v_revision,'raw_source_id',v_source_id));

  return jsonb_build_object('idea_id',p_idea_id,'blueprint_id',p_blueprint_id,'blueprint_version',p_blueprint_version,'engine_revision',v_revision,'raw_source_id',v_source_id,'idempotent',false);
end;
$$;

create or replace function public.register_idea_source_v1(
  p_idea_id uuid,
  p_expected_engine_revision bigint,
  p_source_kind text,
  p_locator text,
  p_title text,
  p_human_note text,
  p_sensitivity text,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_idea public.ideas;
  v_existing public.idea_sources;
  v_source_id uuid;
  v_revision bigint;
  v_fp text;
begin
  if v_user is null or not app_private.can_write_idea(p_idea_id) then raise exception 'FORBIDDEN' using errcode='42501'; end if;
  if p_source_kind not in ('url','document','image') then raise exception 'INVALID_HUMAN_SOURCE_KIND'; end if;
  if p_sensitivity not in ('public','internal','personal','sensitive') then raise exception 'INVALID_SENSITIVITY'; end if;
  if nullif(btrim(p_idempotency_key),'') is null then raise exception 'IDEMPOTENCY_KEY_REQUIRED'; end if;
  if p_source_kind='url' and nullif(btrim(p_locator),'') is null then raise exception 'SOURCE_LOCATOR_REQUIRED'; end if;

  v_fp := md5(jsonb_build_object('source_kind',p_source_kind,'locator',p_locator,'title',p_title,'human_note',p_human_note,'sensitivity',p_sensitivity)::text);
  select * into v_idea from public.ideas where id=p_idea_id for update;
  if v_idea.id is null then raise exception 'IDEA_NOT_FOUND'; end if;

  select * into v_existing from public.idea_sources where idea_id=p_idea_id and idempotency_key=p_idempotency_key;
  if v_existing.id is not null then
    if v_existing.request_fingerprint is distinct from v_fp then raise exception 'IDEMPOTENCY_KEY_REUSE'; end if;
    return jsonb_build_object('source_id',v_existing.id,'engine_revision',v_idea.engine_revision,'idempotent',true);
  end if;

  if v_idea.engine_revision<>p_expected_engine_revision then raise exception 'STALE_ENGINE'; end if;
  if v_idea.blueprint_id is null or v_idea.blueprint_status<>'active' then raise exception 'IDEA_ENGINE_NOT_INITIALIZED'; end if;

  insert into public.idea_sources(idea_id,source_kind,locator,title,human_note,status,sensitivity,created_by,idempotency_key,request_fingerprint)
  values(p_idea_id,p_source_kind,nullif(btrim(p_locator),''),nullif(btrim(p_title),''),p_human_note,'registered',p_sensitivity,v_user,p_idempotency_key,v_fp)
  returning id into v_source_id;

  update public.ideas set engine_revision=engine_revision+1 where id=p_idea_id returning engine_revision into v_revision;

  insert into public.audit_events(workspace_id,actor_id,event_type,entity_type,entity_id,payload)
  values(v_idea.workspace_id,v_user,'idea.source_registered','idea_source',v_source_id,
         jsonb_build_object('idea_id',p_idea_id,'source_kind',p_source_kind,'revision_before',p_expected_engine_revision,'revision_after',v_revision));

  return jsonb_build_object('source_id',v_source_id,'engine_revision',v_revision,'idempotent',false);
end;
$$;

create or replace function public.commit_source_ingestion_v1(
  p_source_id uuid,
  p_expected_source_version integer,
  p_content_hash text,
  p_fetched_at timestamptz default now(),
  p_freshness_at timestamptz default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_source public.idea_sources;
  v_idea public.ideas;
  v_revision bigint;
  v_new_version integer;
  v_changed boolean;
  v_staled_count integer := 0;
begin
  if nullif(btrim(p_content_hash),'') is null then raise exception 'CONTENT_HASH_REQUIRED'; end if;

  select idea_id into v_source.idea_id from public.idea_sources where id=p_source_id;
  if v_source.idea_id is null then raise exception 'SOURCE_NOT_FOUND'; end if;
  select * into v_idea from public.ideas where id=v_source.idea_id for update;
  select * into v_source from public.idea_sources where id=p_source_id for update;

  if v_source.status='superseded' then raise exception 'SOURCE_SUPERSEDED'; end if;
  if v_source.content_hash=p_content_hash and v_source.status='ingested' then
    update public.idea_sources set fetched_at=coalesce(p_fetched_at,fetched_at), freshness_at=coalesce(p_freshness_at,freshness_at) where id=p_source_id;
    return jsonb_build_object('source_id',p_source_id,'source_version',v_source.source_version,'engine_revision',v_idea.engine_revision,'idempotent',true,'content_changed',false);
  end if;
  if v_source.source_version<>p_expected_source_version then raise exception 'STALE_SOURCE'; end if;

  v_changed := v_source.content_hash is distinct from p_content_hash;
  v_new_version := case when v_source.content_hash is null then v_source.source_version else v_source.source_version+1 end;

  update public.idea_sources
  set content_hash=p_content_hash, source_version=v_new_version, fetched_at=coalesce(p_fetched_at,now()), freshness_at=p_freshness_at, status='ingested'
  where id=p_source_id;

  if v_changed then
    update public.idea_information_items
    set state='STALE'
    where source_id=p_source_id and state='ACTIVE';
    get diagnostics v_staled_count = row_count;
  end if;

  update public.ideas set engine_revision=engine_revision+1 where id=v_source.idea_id returning engine_revision into v_revision;

  insert into public.audit_events(workspace_id,actor_id,event_type,entity_type,entity_id,payload)
  values(v_idea.workspace_id,null,'idea.source_ingested','idea_source',p_source_id,
         jsonb_build_object('idea_id',v_source.idea_id,'source_version',v_new_version,'content_changed',v_changed,'staled_information_items',v_staled_count,'revision_after',v_revision));

  return jsonb_build_object('source_id',p_source_id,'source_version',v_new_version,'engine_revision',v_revision,'idempotent',false,'content_changed',v_changed,'staled_information_items',v_staled_count);
end;
$$;

create or replace function public.supersede_source_v1(
  p_source_id uuid,
  p_expected_engine_revision bigint
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_source public.idea_sources;
  v_idea public.ideas;
  v_revision bigint;
  v_staled_count integer := 0;
begin
  select idea_id into v_source.idea_id from public.idea_sources where id=p_source_id;
  if v_source.idea_id is null then raise exception 'SOURCE_NOT_FOUND'; end if;
  if v_user is null or not app_private.can_write_idea(v_source.idea_id) then raise exception 'FORBIDDEN' using errcode='42501'; end if;

  select * into v_idea from public.ideas where id=v_source.idea_id for update;
  select * into v_source from public.idea_sources where id=p_source_id for update;

  if v_source.status='superseded' then
    return jsonb_build_object('source_id',p_source_id,'engine_revision',v_idea.engine_revision,'idempotent',true,'staled_information_items',0);
  end if;
  if v_idea.engine_revision<>p_expected_engine_revision then raise exception 'STALE_ENGINE'; end if;

  update public.idea_sources set status='superseded' where id=p_source_id;
  update public.idea_information_items set state='STALE' where source_id=p_source_id and state='ACTIVE';
  get diagnostics v_staled_count = row_count;
  update public.ideas set engine_revision=engine_revision+1 where id=v_source.idea_id returning engine_revision into v_revision;

  insert into public.idea_ledger_entries(idea_id,entry_type,target_refs,payload,state,materiality,created_by)
  values(v_source.idea_id,'CHANGE',jsonb_build_array(jsonb_build_object('source_id',p_source_id)),
         jsonb_build_object('event','source_superseded','staled_information_items',v_staled_count),'open','LOCAL',v_user);

  insert into public.audit_events(workspace_id,actor_id,event_type,entity_type,entity_id,payload)
  values(v_idea.workspace_id,v_user,'idea.source_superseded','idea_source',p_source_id,
         jsonb_build_object('idea_id',v_source.idea_id,'staled_information_items',v_staled_count,'revision_before',p_expected_engine_revision,'revision_after',v_revision));

  return jsonb_build_object('source_id',p_source_id,'engine_revision',v_revision,'idempotent',false,'staled_information_items',v_staled_count);
end;
$$;

create or replace function public.apply_human_information_v1(
  p_idea_id uuid,
  p_expected_engine_revision bigint,
  p_semantic_key text,
  p_item_type text,
  p_value jsonb,
  p_provenance_type text,
  p_sensitivity text,
  p_idempotency_key text,
  p_source_id uuid default null,
  p_supersedes_id uuid default null,
  p_target_requirement_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_idea public.ideas;
  v_existing public.idea_information_items;
  v_old public.idea_information_items;
  v_item_id uuid;
  v_revision bigint;
  v_fp text;
  v_target_refs jsonb;
begin
  if v_user is null or not app_private.can_write_idea(p_idea_id) then raise exception 'FORBIDDEN' using errcode='42501'; end if;
  if p_provenance_type not in ('HUMAN_DECLARED','HUMAN_GUIDED_ANSWER') then raise exception 'INVALID_HUMAN_PROVENANCE'; end if;
  if p_item_type not in ('FACT','PREFERENCE','CONSTRAINT','ASSUMPTION','OPTION','EVIDENCE','RISK','QUESTION','DECISION_INPUT') then raise exception 'INVALID_INFORMATION_TYPE'; end if;
  if p_sensitivity not in ('public','internal','personal','sensitive') then raise exception 'INVALID_SENSITIVITY'; end if;
  if p_value is null then raise exception 'VALUE_REQUIRED'; end if;
  if nullif(btrim(p_idempotency_key),'') is null then raise exception 'IDEMPOTENCY_KEY_REQUIRED'; end if;

  v_fp := md5(jsonb_build_object('semantic_key',p_semantic_key,'item_type',p_item_type,'value',p_value,'provenance_type',p_provenance_type,'sensitivity',p_sensitivity,'source_id',p_source_id,'supersedes_id',p_supersedes_id,'target_requirement_id',p_target_requirement_id)::text);
  select * into v_idea from public.ideas where id=p_idea_id for update;
  if v_idea.id is null then raise exception 'IDEA_NOT_FOUND'; end if;

  select * into v_existing from public.idea_information_items where idea_id=p_idea_id and idempotency_key=p_idempotency_key;
  if v_existing.id is not null then
    if v_existing.request_fingerprint is distinct from v_fp then raise exception 'IDEMPOTENCY_KEY_REUSE'; end if;
    return jsonb_build_object('information_item_id',v_existing.id,'engine_revision',v_idea.engine_revision,'idempotent',true);
  end if;

  if v_idea.engine_revision<>p_expected_engine_revision then raise exception 'STALE_ENGINE'; end if;
  if v_idea.blueprint_id is null or v_idea.blueprint_status<>'active' then raise exception 'IDEA_ENGINE_NOT_INITIALIZED'; end if;

  if p_source_id is not null and not exists(select 1 from public.idea_sources s where s.id=p_source_id and s.idea_id=p_idea_id and s.status<>'superseded') then
    raise exception 'INVALID_SOURCE';
  end if;

  if p_supersedes_id is not null then
    select * into v_old from public.idea_information_items where id=p_supersedes_id for update;
    if v_old.id is null or v_old.idea_id<>p_idea_id then raise exception 'INVALID_SUPERSEDES'; end if;
    if v_old.state<>'ACTIVE' then raise exception 'SUPERSEDED_ITEM_NOT_ACTIVE'; end if;
    update public.idea_information_items set state='SUPERSEDED' where id=p_supersedes_id;
  end if;

  insert into public.idea_information_items(
    idea_id,semantic_key,item_type,value_jsonb,provenance_type,source_id,confidence_class,state,sensitivity,valid_from,supersedes_id,created_by,idempotency_key,request_fingerprint
  ) values (
    p_idea_id,nullif(btrim(p_semantic_key),''),p_item_type,p_value,p_provenance_type,p_source_id,'DIRECT','ACTIVE',p_sensitivity,now(),p_supersedes_id,v_user,p_idempotency_key,v_fp
  ) returning id into v_item_id;

  if nullif(btrim(p_target_requirement_id),'') is not null then
    update public.idea_requirement_states
    set resolution_state='STALE', stale_reason='HUMAN_INFORMATION_CHANGED'
    where idea_id=p_idea_id and requirement_id=p_target_requirement_id and resolution_state<>'NOT_RELEVANT';
  end if;

  update public.ideas set engine_revision=engine_revision+1 where id=p_idea_id returning engine_revision into v_revision;

  v_target_refs := jsonb_build_array(jsonb_strip_nulls(jsonb_build_object('semantic_key',nullif(btrim(p_semantic_key),''),'requirement_id',nullif(btrim(p_target_requirement_id),''),'information_item_id',v_item_id)));
  insert into public.idea_ledger_entries(idea_id,entry_type,target_refs,payload,state,materiality,source_refs,created_by)
  values(p_idea_id,'CHANGE',v_target_refs,
         jsonb_strip_nulls(jsonb_build_object('event','human_information_applied','information_item_id',v_item_id,'supersedes_id',p_supersedes_id,'provenance_type',p_provenance_type)),
         'open','LOCAL',case when p_source_id is null then '[]'::jsonb else jsonb_build_array(jsonb_build_object('source_id',p_source_id)) end,v_user);

  insert into public.audit_events(workspace_id,actor_id,event_type,entity_type,entity_id,payload)
  values(v_idea.workspace_id,v_user,'idea.human_information_applied','idea_information_item',v_item_id,
         jsonb_strip_nulls(jsonb_build_object('idea_id',p_idea_id,'semantic_key',nullif(btrim(p_semantic_key),''),'item_type',p_item_type,'provenance_type',p_provenance_type,'supersedes_id',p_supersedes_id,'target_requirement_id',nullif(btrim(p_target_requirement_id),''),'revision_before',p_expected_engine_revision,'revision_after',v_revision)));

  return jsonb_build_object('information_item_id',v_item_id,'engine_revision',v_revision,'idempotent',false);
end;
$$;

revoke all on function public.initialize_idea_engine_v1(uuid,bigint,text,text) from public, anon;
grant execute on function public.initialize_idea_engine_v1(uuid,bigint,text,text) to authenticated, service_role;

revoke all on function public.register_idea_source_v1(uuid,bigint,text,text,text,text,text,text) from public, anon;
grant execute on function public.register_idea_source_v1(uuid,bigint,text,text,text,text,text,text) to authenticated, service_role;

revoke all on function public.commit_source_ingestion_v1(uuid,integer,text,timestamptz,timestamptz) from public, anon, authenticated;
grant execute on function public.commit_source_ingestion_v1(uuid,integer,text,timestamptz,timestamptz) to service_role;

revoke all on function public.supersede_source_v1(uuid,bigint) from public, anon;
grant execute on function public.supersede_source_v1(uuid,bigint) to authenticated, service_role;

revoke all on function public.apply_human_information_v1(uuid,bigint,text,text,jsonb,text,text,text,uuid,uuid,text) from public, anon;
grant execute on function public.apply_human_information_v1(uuid,bigint,text,text,jsonb,text,text,text,uuid,uuid,text) to authenticated, service_role;
