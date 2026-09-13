-- 4b4c / 2b2c — G2 direct-human basis lineage V0.1
-- Date: 2026-09-13
-- STATUS: COMPILE/ROLLBACK CANDIDATE ONLY — DO NOT APPLY AS A MIGRATION.
-- Active G1 apply_human_information_v1 remains untouched.

alter table public.idea_information_requirement_refs
  add column if not exists target_basis_fingerprint text null;

alter table public.idea_information_requirement_refs
  drop constraint if exists idea_information_requirement_refs_target_basis_nonempty;
alter table public.idea_information_requirement_refs
  add constraint idea_information_requirement_refs_target_basis_nonempty
  check (target_basis_fingerprint is null or nullif(btrim(target_basis_fingerprint),'') is not null);

create index if not exists idea_information_requirement_refs_basis_idx
  on public.idea_information_requirement_refs(idea_id,requirement_id,target_basis_fingerprint)
  where target_basis_fingerprint is not null;

create or replace function public.apply_human_g2_information_candidate_v1(
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
) returns jsonb
language plpgsql
security definer
set search_path=''
as $function$
declare
  v_user uuid:=auth.uid();
  v_idea public.ideas;
  v_req public.idea_requirement_states;
  v_existing public.idea_information_items;
  v_old public.idea_information_items;
  v_item_id uuid;
  v_revision bigint;
  v_basis text;
  v_fp text;
  v_target text:=nullif(btrim(p_target_requirement_id),'');
  v_target_refs jsonb;
begin
  if v_user is null or not app_private.can_write_idea(p_idea_id) then
    raise exception 'FORBIDDEN' using errcode='42501';
  end if;
  if p_provenance_type not in ('HUMAN_DECLARED','HUMAN_GUIDED_ANSWER') then
    raise exception 'INVALID_HUMAN_PROVENANCE';
  end if;
  if p_item_type not in ('FACT','PREFERENCE','CONSTRAINT','ASSUMPTION','OPTION','EVIDENCE','RISK','QUESTION','DECISION_INPUT') then
    raise exception 'INVALID_INFORMATION_TYPE';
  end if;
  if p_sensitivity not in ('public','internal','personal','sensitive') then
    raise exception 'INVALID_SENSITIVITY';
  end if;
  if p_value is null then raise exception 'VALUE_REQUIRED'; end if;
  if nullif(btrim(p_idempotency_key),'') is null then raise exception 'IDEMPOTENCY_KEY_REQUIRED'; end if;
  if v_target is null then raise exception 'G2_TARGET_REQUIREMENT_REQUIRED'; end if;

  select * into v_idea from public.ideas where id=p_idea_id for update;
  if v_idea.id is null then raise exception 'IDEA_NOT_FOUND'; end if;
  if v_idea.blueprint_id<>'SITE_VITRINE' or v_idea.blueprint_version<>'0.5' or v_idea.blueprint_status<>'active' then
    raise exception 'G2_BLUEPRINT_0_5_NOT_ACTIVE';
  end if;

  if not exists(select 1 from app_private.idea_g2_policy_v2() p where p.requirement_id=v_target) then
    raise exception 'UNSUPPORTED_G2_REQUIREMENT';
  end if;

  select * into v_req
  from public.idea_requirement_states rs
  where rs.idea_id=p_idea_id and rs.requirement_id=v_target
  for update;
  if v_req.idea_id is null then raise exception 'G2_REQUIREMENT_STATE_REQUIRED'; end if;
  if v_req.applicability_state<>'ACTIVE' or v_req.resolution_state='NOT_RELEVANT' then
    raise exception 'G2_REQUIREMENT_NOT_ACTIVE';
  end if;
  if v_req.evaluated_engine_revision is distinct from v_idea.engine_revision then
    raise exception 'G2_REQUIREMENT_STATE_STALE';
  end if;
  v_basis:=nullif(btrim(v_req.input_fingerprint),'');
  if v_basis is null then raise exception 'G2_REQUIREMENT_BASIS_REQUIRED'; end if;

  v_fp:=md5(jsonb_build_object(
    'semantic_key',p_semantic_key,
    'item_type',p_item_type,
    'value',p_value,
    'provenance_type',p_provenance_type,
    'sensitivity',p_sensitivity,
    'source_id',p_source_id,
    'supersedes_id',p_supersedes_id,
    'target_requirement_id',v_target,
    'target_basis_fingerprint',v_basis
  )::text);

  select * into v_existing
  from public.idea_information_items
  where idea_id=p_idea_id and idempotency_key=p_idempotency_key;
  if v_existing.id is not null then
    if v_existing.request_fingerprint is distinct from v_fp then raise exception 'IDEMPOTENCY_KEY_REUSE'; end if;
    if not exists(
      select 1 from public.idea_information_requirement_refs rr
      where rr.information_item_id=v_existing.id
        and rr.requirement_id=v_target
        and rr.relation_kind='SUPPORTS'
        and rr.target_basis_fingerprint=v_basis
    ) then
      raise exception 'IDEMPOTENT_REF_BASIS_MISMATCH';
    end if;
    return jsonb_build_object(
      'information_item_id',v_existing.id,
      'engine_revision',v_idea.engine_revision,
      'target_requirement_id',v_target,
      'target_basis_fingerprint',v_basis,
      'idempotent',true
    );
  end if;

  if v_idea.engine_revision<>p_expected_engine_revision then raise exception 'STALE_ENGINE'; end if;
  if p_source_id is not null and not exists(
    select 1 from public.idea_sources s
    where s.id=p_source_id and s.idea_id=p_idea_id and s.status<>'superseded'
  ) then raise exception 'INVALID_SOURCE'; end if;

  if p_supersedes_id is not null then
    select * into v_old from public.idea_information_items where id=p_supersedes_id for update;
    if v_old.id is null or v_old.idea_id<>p_idea_id then raise exception 'INVALID_SUPERSEDES'; end if;
    if v_old.state<>'ACTIVE' then raise exception 'SUPERSEDED_ITEM_NOT_ACTIVE'; end if;
    update public.idea_information_items set state='SUPERSEDED' where id=p_supersedes_id;
  end if;

  insert into public.idea_information_items(
    idea_id,semantic_key,item_type,value_jsonb,provenance_type,source_id,
    confidence_class,state,sensitivity,valid_from,supersedes_id,created_by,
    idempotency_key,request_fingerprint
  ) values(
    p_idea_id,nullif(btrim(p_semantic_key),''),p_item_type,p_value,p_provenance_type,p_source_id,
    'DIRECT','ACTIVE',p_sensitivity,now(),p_supersedes_id,v_user,
    p_idempotency_key,v_fp
  ) returning id into v_item_id;

  insert into public.idea_information_requirement_refs(
    idea_id,information_item_id,requirement_id,relation_kind,resolution_levels,
    created_by,target_basis_fingerprint
  ) values(
    p_idea_id,v_item_id,v_target,'SUPPORTS',
    array['RAW_HUMAN','ACCEPTED_AS_CURRENT']::text[],v_user,v_basis
  );

  update public.idea_ledger_entries le set state='superseded'
  where le.idea_id=p_idea_id and le.entry_type='ACCEPTED_UNKNOWN' and le.state='accepted'
    and exists(select 1 from jsonb_array_elements(le.target_refs) tr where tr->>'requirement_id'=v_target);

  update public.idea_requirement_states
  set resolution_state='STALE',stale_reason='G2_HUMAN_INFORMATION_CHANGED'
  where idea_id=p_idea_id and requirement_id=v_target and resolution_state<>'NOT_RELEVANT';

  update public.ideas set engine_revision=engine_revision+1
  where id=p_idea_id returning engine_revision into v_revision;

  v_target_refs:=jsonb_build_array(jsonb_strip_nulls(jsonb_build_object(
    'semantic_key',nullif(btrim(p_semantic_key),''),
    'requirement_id',v_target,
    'basis_fingerprint',v_basis,
    'information_item_id',v_item_id
  )));

  insert into public.idea_ledger_entries(
    idea_id,entry_type,target_refs,payload,state,materiality,source_refs,created_by
  ) values(
    p_idea_id,'CHANGE',v_target_refs,
    jsonb_strip_nulls(jsonb_build_object(
      'event','g2_human_information_applied',
      'information_item_id',v_item_id,
      'supersedes_id',p_supersedes_id,
      'provenance_type',p_provenance_type,
      'target_basis_fingerprint',v_basis
    )),
    'open','LOCAL',case when p_source_id is null then '[]'::jsonb else jsonb_build_array(jsonb_build_object('source_id',p_source_id)) end,v_user
  );

  insert into public.audit_events(workspace_id,actor_id,event_type,entity_type,entity_id,payload)
  values(
    v_idea.workspace_id,v_user,'idea.g2_human_information_applied','idea_information_item',v_item_id,
    jsonb_build_object(
      'idea_id',p_idea_id,'target_requirement_id',v_target,
      'target_basis_fingerprint',v_basis,
      'revision_before',p_expected_engine_revision,'revision_after',v_revision
    )
  );

  return jsonb_build_object(
    'information_item_id',v_item_id,
    'engine_revision',v_revision,
    'target_requirement_id',v_target,
    'target_basis_fingerprint',v_basis,
    'idempotent',false
  );
end;
$function$;

revoke all on function public.apply_human_g2_information_candidate_v1(
  uuid,bigint,text,text,jsonb,text,text,text,uuid,uuid,text
) from public,anon;
grant execute on function public.apply_human_g2_information_candidate_v1(
  uuid,bigint,text,text,jsonb,text,text,text,uuid,uuid,text
) to authenticated,service_role;

-- Invariants:
-- - direct G2 human information is bound to the exact Requirement basis current at write time;
-- - G1 human writer remains untouched;
-- - legacy/unscoped direct refs stay historical and are not silently current in G2;
-- - source-backed/calculated/observed evidence remains System Action work, not fabricated human authority.
