-- 4b4c / 2b2c — G2 basis-scoped ACCEPTED_UNKNOWN V0.1
-- Date: 2026-09-13
-- STATUS: COMPILE/ROLLBACK CANDIDATE ONLY — DO NOT APPLY AS A MIGRATION.
-- Active G1 accept_idea_requirement_unknown_v1 remains untouched.

create or replace function public.accept_idea_g2_requirement_unknown_candidate_v1(
  p_idea_id uuid,
  p_expected_engine_revision bigint,
  p_requirement_id text,
  p_note text,
  p_idempotency_key text
) returns jsonb
language plpgsql
security definer
set search_path=''
as $function$
declare
  v_user uuid:=auth.uid();
  v_idea public.ideas;
  v_req public.idea_requirement_states;
  v_policy record;
  v_existing public.idea_ledger_entries;
  v_revision bigint;
  v_key text:=nullif(btrim(p_idempotency_key),'');
  v_note text:=nullif(btrim(p_note),'');
  v_basis text;
  v_request_fp text;
  v_existing_req text;
  v_existing_note text;
begin
  if v_user is null or not app_private.can_write_idea(p_idea_id) then
    raise exception 'FORBIDDEN' using errcode='42501';
  end if;
  if v_key is null then raise exception 'IDEMPOTENCY_KEY_REQUIRED'; end if;

  select * into v_idea from public.ideas where id=p_idea_id for update;
  if v_idea.id is null then raise exception 'IDEA_NOT_FOUND'; end if;
  if v_idea.blueprint_id<>'SITE_VITRINE'
     or v_idea.blueprint_version<>'0.5'
     or v_idea.blueprint_status<>'active'
    then raise exception 'G2_BLUEPRINT_0_5_NOT_ACTIVE';
  end if;

  -- Exact idempotent retry is allowed after the original call advanced engine_revision.
  select * into v_existing
  from public.idea_ledger_entries le
  where le.idea_id=p_idea_id
    and le.entry_type='ACCEPTED_UNKNOWN'
    and le.payload->>'idempotency_key'=v_key
  order by le.created_at asc
  limit 1;

  if v_existing.id is not null then
    select tr->>'requirement_id' into v_existing_req
    from jsonb_array_elements(v_existing.target_refs) tr
    limit 1;
    v_existing_note:=nullif(btrim(v_existing.payload->>'note'),'');
    if v_existing_req is distinct from p_requirement_id
       or v_existing_note is distinct from v_note then
      raise exception 'IDEMPOTENCY_KEY_REUSE';
    end if;
    return jsonb_build_object(
      'ledger_entry_id',v_existing.id,
      'engine_revision',v_idea.engine_revision,
      'requirement_id',p_requirement_id,
      'basis_fingerprint',(
        select tr->>'basis_fingerprint'
        from jsonb_array_elements(v_existing.target_refs) tr
        limit 1
      ),
      'idempotent',true
    );
  end if;

  if v_idea.engine_revision<>p_expected_engine_revision then raise exception 'STALE_ENGINE'; end if;

  select * into v_policy
  from app_private.idea_g2_policy_v2() p
  where p.requirement_id=p_requirement_id;
  if v_policy.requirement_id is null then raise exception 'UNSUPPORTED_G2_REQUIREMENT'; end if;

  select * into v_req
  from public.idea_requirement_states rs
  where rs.idea_id=p_idea_id and rs.requirement_id=p_requirement_id
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

  v_request_fp:=md5(jsonb_build_object(
    'requirement_id',p_requirement_id,
    'basis_fingerprint',v_basis,
    'note',v_note
  )::text);

  -- Keep history, but ensure only the latest accepted unknown for this Requirement is current.
  update public.idea_ledger_entries le
  set state='superseded'
  where le.idea_id=p_idea_id
    and le.entry_type='ACCEPTED_UNKNOWN'
    and le.state='accepted'
    and exists(
      select 1 from jsonb_array_elements(le.target_refs) tr
      where tr->>'requirement_id'=p_requirement_id
    );

  insert into public.idea_ledger_entries(
    idea_id,entry_type,target_refs,payload,state,materiality,source_refs,created_by
  ) values(
    p_idea_id,
    'ACCEPTED_UNKNOWN',
    jsonb_build_array(jsonb_build_object(
      'requirement_id',p_requirement_id,
      'basis_fingerprint',v_basis
    )),
    jsonb_strip_nulls(jsonb_build_object(
      'event','g2_requirement_unknown_accepted',
      'requirement_id',p_requirement_id,
      'basis_fingerprint',v_basis,
      'criticality',v_policy.criticality,
      'note',v_note,
      'idempotency_key',v_key,
      'request_fingerprint',v_request_fp
    )),
    'accepted','LOCAL','[]'::jsonb,v_user
  ) returning * into v_existing;

  update public.ideas
  set engine_revision=engine_revision+1
  where id=p_idea_id
  returning engine_revision into v_revision;

  update public.idea_requirement_states
  set resolution_state='ACCEPTED_UNKNOWN',
      resolution_levels=array['ACCEPTED_UNKNOWN']::text[],
      lock_state='VALIDATED_CURRENT',
      stale_reason=null,
      version=version+1,
      evaluated_engine_revision=v_revision,
      last_evaluated_at=now(),
      authority_ok=true
  where idea_id=p_idea_id and requirement_id=p_requirement_id;

  insert into public.audit_events(
    workspace_id,actor_id,event_type,entity_type,entity_id,payload
  ) values(
    v_idea.workspace_id,v_user,'idea.g2_requirement_unknown_accepted','idea',p_idea_id,
    jsonb_build_object(
      'requirement_id',p_requirement_id,
      'basis_fingerprint',v_basis,
      'criticality',v_policy.criticality,
      'revision_before',p_expected_engine_revision,
      'revision_after',v_revision
    )
  );

  return jsonb_build_object(
    'ledger_entry_id',v_existing.id,
    'engine_revision',v_revision,
    'requirement_id',p_requirement_id,
    'basis_fingerprint',v_basis,
    'blocking_requirement',v_policy.criticality='BLOCKING',
    'idempotent',false
  );
end;
$function$;

revoke all on function public.accept_idea_g2_requirement_unknown_candidate_v1(
  uuid,bigint,text,text,text
) from public,anon;
grant execute on function public.accept_idea_g2_requirement_unknown_candidate_v1(
  uuid,bigint,text,text,text
) to authenticated,service_role;

-- Invariants:
-- - acceptance is bound to the exact current Requirement basis;
-- - stale Requirement materialization cannot be accepted;
-- - NOT_RELEVANT Requirements cannot be accepted unknown;
-- - old accepted entries are preserved as superseded history;
-- - RESEARCH_SUFFICIENCY may be recorded unknown but remains blocking in planner semantics;
-- - G1 accept_idea_requirement_unknown_v1 is untouched.
