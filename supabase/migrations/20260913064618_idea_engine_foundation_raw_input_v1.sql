create or replace function public.get_idea_foundation_raw_input_v1(p_idea_id uuid,p_expected_engine_revision bigint)
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $function$
declare
  v_idea public.ideas;
  v_source public.idea_sources;
begin
  select * into v_idea from public.ideas where id=p_idea_id;
  if v_idea.id is null then raise exception 'IDEA_NOT_FOUND'; end if;
  if v_idea.engine_revision<>p_expected_engine_revision then raise exception 'STALE_ENGINE'; end if;
  if v_idea.blueprint_id<>'SITE_VITRINE' or v_idea.blueprint_version<>'0.4' or v_idea.blueprint_status<>'active' then raise exception 'FOUNDATION_BLUEPRINT_NOT_ACTIVE'; end if;

  select * into v_source from public.idea_sources
  where idea_id=p_idea_id and source_kind='human_raw' and status in ('registered','ingested')
  order by case when idempotency_key='system:initial-original-text' then 0 else 1 end, created_at asc
  limit 1;
  if v_source.id is null then raise exception 'RAW_SOURCE_NOT_FOUND'; end if;

  return jsonb_build_object(
    'idea_id',v_idea.id,
    'engine_revision',v_idea.engine_revision,
    'raw_source_id',v_source.id,
    'raw_source_hash',coalesce(v_source.content_hash,md5(v_idea.original_text)),
    'original_text',v_idea.original_text
  );
end;
$function$;

revoke all on function public.get_idea_foundation_raw_input_v1(uuid,bigint) from public, anon, authenticated;
grant execute on function public.get_idea_foundation_raw_input_v1(uuid,bigint) to service_role;