create table if not exists public.project_resources (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  kind text not null check (kind in ('file','link')),
  title text not null check (char_length(btrim(title)) between 1 and 240),
  description text not null default '',
  visibility text not null default 'internal' check (visibility in ('internal','shared')),
  url text,
  storage_path text,
  file_name text,
  mime_type text,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint project_resources_kind_payload_check check (
    (kind = 'link' and url is not null and btrim(url) <> '' and storage_path is null and file_name is null)
    or
    (kind = 'file' and storage_path is not null and btrim(storage_path) <> '' and file_name is not null and btrim(file_name) <> '' and url is null)
  )
);

create index if not exists project_resources_project_updated_idx
  on public.project_resources(project_id, updated_at desc);
create index if not exists project_resources_workspace_idx
  on public.project_resources(workspace_id);

create or replace function app_private.enforce_project_resource_workspace_v1()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.projects p
    where p.id = new.project_id and p.workspace_id = new.workspace_id
  ) then
    raise exception 'Project does not belong to workspace';
  end if;
  return new;
end;
$$;

drop trigger if exists project_resources_workspace_guard on public.project_resources;
create trigger project_resources_workspace_guard
before insert or update of workspace_id, project_id on public.project_resources
for each row execute function app_private.enforce_project_resource_workspace_v1();

drop trigger if exists project_resources_set_updated_at on public.project_resources;
create trigger project_resources_set_updated_at
before update on public.project_resources
for each row execute function app_private.set_updated_at();

alter table public.project_resources enable row level security;

drop policy if exists project_resources_select on public.project_resources;
create policy project_resources_select on public.project_resources
for select to authenticated
using (
  app_private.can_access_project(project_id)
  and (
    not app_private.is_external_workspace_member(workspace_id)
    or visibility = 'shared'
  )
);

drop policy if exists project_resources_insert on public.project_resources;
create policy project_resources_insert on public.project_resources
for insert to authenticated
with check (
  app_private.can_write_project(project_id)
  and exists (
    select 1 from public.projects p
    where p.id = project_id and p.workspace_id = workspace_id
  )
);

drop policy if exists project_resources_update on public.project_resources;
create policy project_resources_update on public.project_resources
for update to authenticated
using (app_private.can_write_project(project_id))
with check (
  app_private.can_write_project(project_id)
  and exists (
    select 1 from public.projects p
    where p.id = project_id and p.workspace_id = workspace_id
  )
);

drop policy if exists project_resources_delete on public.project_resources;
create policy project_resources_delete on public.project_resources
for delete to authenticated
using (app_private.can_write_project(project_id));

grant select, insert, update, delete on public.project_resources to authenticated;

create or replace function app_private.can_read_storage_path(p_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  with parsed as (
    select app_private.storage_workspace_id(p_name) as workspace_id,
      case when split_part(p_name,'/',2) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
        then split_part(p_name,'/',2)::uuid else null::uuid end as project_id
  )
  select exists (
    select 1 from parsed x
    join public.projects p on p.id=x.project_id and p.workspace_id=x.workspace_id
    where x.workspace_id is not null
      and app_private.can_access_project(x.project_id)
      and (
        not app_private.is_external_workspace_member(x.workspace_id)
        or exists (
          select 1
          from public.deliverable_versions dv
          join public.deliverables d on d.id=dv.deliverable_id
          where dv.storage_path=p_name
            and d.project_id=x.project_id
            and d.visibility='shared'
        )
        or exists (
          select 1
          from public.project_resources r
          where r.storage_path=p_name
            and r.project_id=x.project_id
            and r.kind='file'
            and r.visibility='shared'
        )
      )
  )
$$;
