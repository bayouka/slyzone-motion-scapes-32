-- 4b4c Project Master Blueprint V1 — DeliveryLot + structural DependencyClosure runtime slice.
-- Applied live first via Supabase migration 20260916154153.
-- Service-only during migration. No manual Ready flag exists.

create table if not exists app_private.project_delivery_lots_v1 (
  id uuid primary key default gen_random_uuid(),
  project_definition_id uuid not null references public.project_definitions(id) on delete cascade,
  blueprint_id text not null,
  blueprint_version text not null,
  lot_key text not null,
  title text not null,
  purpose text not null default '',
  status text not null default 'DRAFT',
  created_definition_revision bigint not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (blueprint_id, blueprint_version)
    references app_private.project_blueprint_packs_v1(blueprint_id, blueprint_version),
  constraint project_delivery_lots_v1_key_check check (lot_key ~ '^[A-Z0-9][A-Z0-9._-]{0,127}$'),
  constraint project_delivery_lots_v1_title_check check (length(btrim(title)) > 0),
  constraint project_delivery_lots_v1_status_check check (status in ('DRAFT','ACTIVE','FROZEN','SUPERSEDED')),
  constraint project_delivery_lots_v1_revision_check check (created_definition_revision >= 0),
  unique (project_definition_id, lot_key),
  unique (id, blueprint_id, blueprint_version)
);

revoke all on table app_private.project_delivery_lots_v1 from public, anon, authenticated;
grant select on table app_private.project_delivery_lots_v1 to service_role;

create table if not exists app_private.project_delivery_lot_nodes_v1 (
  lot_id uuid not null,
  blueprint_id text not null,
  blueprint_version text not null,
  node_id text not null,
  inclusion_role text not null default 'PRIMARY',
  created_at timestamptz not null default now(),
  primary key (lot_id, node_id),
  foreign key (lot_id, blueprint_id, blueprint_version)
    references app_private.project_delivery_lots_v1(id, blueprint_id, blueprint_version) on delete cascade,
  foreign key (blueprint_id, blueprint_version, node_id)
    references app_private.project_node_definitions_v1(blueprint_id, blueprint_version, node_id),
  constraint project_delivery_lot_nodes_v1_role_check check (inclusion_role in ('PRIMARY','EXPLICIT_DEPENDENCY'))
);

revoke all on table app_private.project_delivery_lot_nodes_v1 from public, anon, authenticated;
grant select on table app_private.project_delivery_lot_nodes_v1 to service_role;

create or replace function app_private.get_blueprint_dependency_closure_v1(
  p_blueprint_id text,
  p_blueprint_version text,
  p_root_node_ids text[]
)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with recursive
  requested as (
    select distinct x.node_id from unnest(coalesce(p_root_node_ids, array[]::text[])) as x(node_id)
  ),
  valid_roots as (
    select r.node_id
    from requested r
    join app_private.project_node_definitions_v1 nd
      on nd.blueprint_id = p_blueprint_id and nd.blueprint_version = p_blueprint_version and nd.node_id = r.node_id
  ),
  missing_roots as (
    select r.node_id from requested r left join valid_roots v using(node_id) where v.node_id is null
  ),
  walk(node_id, depth, path) as (
    select v.node_id, 0, array[v.node_id]::text[] from valid_roots v
    union all
    select e.target_node_id, w.depth + 1, w.path || e.target_node_id
    from walk w
    join app_private.project_dependency_edges_v1 e
      on e.blueprint_id = p_blueprint_id
     and e.blueprint_version = p_blueprint_version
     and e.source_node_id = w.node_id
     and e.relation_type = 'REQUIRES'
     and e.strength = 'HARD'
    where not e.target_node_id = any(w.path)
  ),
  closure_nodes as (
    select node_id, min(depth)::int as min_depth from walk group by node_id
  ),
  hard_edges as (
    select e.source_node_id,e.target_node_id,e.relation_type,e.strength
    from app_private.project_dependency_edges_v1 e
    where e.blueprint_id = p_blueprint_id
      and e.blueprint_version = p_blueprint_version
      and e.relation_type = 'REQUIRES'
      and e.strength = 'HARD'
      and exists (select 1 from closure_nodes c where c.node_id=e.source_node_id)
      and exists (select 1 from closure_nodes c where c.node_id=e.target_node_id)
  ),
  soft_edges as (
    select e.source_node_id,e.target_node_id,e.relation_type,e.strength
    from app_private.project_dependency_edges_v1 e
    where e.blueprint_id = p_blueprint_id
      and e.blueprint_version = p_blueprint_version
      and e.strength = 'SOFT'
      and exists (select 1 from closure_nodes c where c.node_id=e.source_node_id)
  )
  select jsonb_build_object(
    'schema_version','1.0',
    'blueprint_id',p_blueprint_id,
    'blueprint_version',p_blueprint_version,
    'root_node_ids',coalesce((select jsonb_agg(node_id order by node_id) from valid_roots),'[]'::jsonb),
    'missing_root_node_ids',coalesce((select jsonb_agg(node_id order by node_id) from missing_roots),'[]'::jsonb),
    'closure_node_ids',coalesce((select jsonb_agg(node_id order by min_depth,node_id) from closure_nodes),'[]'::jsonb),
    'closure_node_count',(select count(*)::int from closure_nodes),
    'hard_dependency_edges',coalesce((select jsonb_agg(jsonb_build_object(
      'source_node_id',source_node_id,'target_node_id',target_node_id,'relation_type',relation_type,'strength',strength
    ) order by source_node_id,target_node_id) from hard_edges),'[]'::jsonb),
    'soft_context_edges',coalesce((select jsonb_agg(jsonb_build_object(
      'source_node_id',source_node_id,'target_node_id',target_node_id,'relation_type',relation_type,'strength',strength
    ) order by source_node_id,target_node_id) from soft_edges),'[]'::jsonb),
    'hard_dependency_cycle',app_private.project_blueprint_has_hard_cycle_v1(p_blueprint_id,p_blueprint_version),
    'structural_status',case
      when exists(select 1 from missing_roots) then 'INVALID_ROOTS'
      when app_private.project_blueprint_has_hard_cycle_v1(p_blueprint_id,p_blueprint_version) then 'BLOCKED_GRAPH_CYCLE'
      else 'CLOSED'
    end
  );
$$;

revoke all on function app_private.get_blueprint_dependency_closure_v1(text,text,text[]) from public, anon, authenticated;
grant execute on function app_private.get_blueprint_dependency_closure_v1(text,text,text[]) to service_role;

create or replace function public.get_project_delivery_lot_dependency_closure_v1(p_lot_id uuid)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with lot as (
    select dl.* from app_private.project_delivery_lots_v1 dl where dl.id = p_lot_id
  ),
  roots as (
    select array_agg(n.node_id order by n.node_id)::text[] as node_ids
    from app_private.project_delivery_lot_nodes_v1 n where n.lot_id = p_lot_id
  ),
  structural as (
    select app_private.get_blueprint_dependency_closure_v1(
      l.blueprint_id,l.blueprint_version,coalesce(r.node_ids,array[]::text[])
    ) as payload
    from lot l cross join roots r
  ),
  closure_node_ids as (
    select jsonb_array_elements_text(s.payload->'closure_node_ids') as node_id from structural s
  ),
  state_rows as (
    select
      nd.node_id,nd.legacy_requirement_id,nd.title,nd.applicability_default,
      prs.id is not null as state_present,
      case when prs.id is null then 'UNRESOLVED' when prs.applicable then 'APPLICABLE' else 'NOT_APPLICABLE' end as applicability_state,
      prs.resolution_level,prs.state as legacy_state,prs.lock_state,prs.blocker_status,prs.blocker_reason,
      prs.owner_ref,prs.authority_type,prs.accepted_by
    from lot l
    join closure_node_ids c on true
    join app_private.project_node_definitions_v1 nd
      on nd.blueprint_id=l.blueprint_id and nd.blueprint_version=l.blueprint_version and nd.node_id=c.node_id
    left join public.project_definition_requirement_states prs
      on prs.project_definition_id=l.project_definition_id and prs.requirement_id=nd.legacy_requirement_id
  ),
  diag as (
    select
      count(*) filter (where not state_present)::int as missing_state_count,
      count(*) filter (where state_present and legacy_state <> 'current')::int as stale_state_count,
      count(*) filter (where state_present and blocker_status='OPEN')::int as open_blocker_count,
      count(*) filter (
        where state_present and applicability_state='APPLICABLE' and legacy_state='current' and blocker_status <> 'OPEN'
          and resolution_level in ('UNRESOLVED','WORKING_ASSUMPTION','AI_PROPOSED')
      )::int as unresolved_state_count
    from state_rows
  )
  select jsonb_build_object(
    'schema_version','1.0',
    'object_type','DependencyClosure',
    'lot',jsonb_build_object(
      'id',l.id,'project_definition_id',l.project_definition_id,'lot_key',l.lot_key,'title',l.title,'purpose',l.purpose,
      'status',l.status,'created_definition_revision',l.created_definition_revision,
      'blueprint_id',l.blueprint_id,'blueprint_version',l.blueprint_version
    ),
    'structural',s.payload,
    'node_state_diagnostics',coalesce((select jsonb_agg(jsonb_build_object(
      'node_id',node_id,'legacy_requirement_id',legacy_requirement_id,'title',title,'state_present',state_present,
      'applicability_state',applicability_state,'resolution_level',resolution_level,'legacy_state',legacy_state,
      'lock_state',lock_state,'blocker_status',blocker_status,'blocker_reason',blocker_reason,
      'owner_ref',owner_ref,'authority_type',authority_type,'accepted_by',accepted_by
    ) order by node_id) from state_rows),'[]'::jsonb),
    'diagnostics',jsonb_build_object(
      'missing_state_count',d.missing_state_count,
      'stale_state_count',d.stale_state_count,
      'open_blocker_count',d.open_blocker_count,
      'unresolved_state_count',d.unresolved_state_count,
      'legacy_state_status',case
        when s.payload->>'structural_status' <> 'CLOSED' then s.payload->>'structural_status'
        when d.missing_state_count > 0 then 'MISSING_STATE'
        when d.stale_state_count > 0 then 'STALE_STATE'
        when d.open_blocker_count > 0 then 'OPEN_BLOCKER'
        when d.unresolved_state_count > 0 then 'UNRESOLVED_STATE'
        else 'CLOSED_LEGACY_STATE'
      end,
      'canonical_dependency_closure_predicate','PARTIAL_NOT_EVALUABLE',
      'not_yet_evaluated',jsonb_build_array('CRITICAL_TBD','OWNERSHIP_CLOSURE','CONFLICTS','CANONICAL_FULFILMENT')
    )
  )
  from lot l cross join structural s cross join diag d;
$$;

revoke all on function public.get_project_delivery_lot_dependency_closure_v1(uuid) from public, anon, authenticated;
grant execute on function public.get_project_delivery_lot_dependency_closure_v1(uuid) to service_role;
