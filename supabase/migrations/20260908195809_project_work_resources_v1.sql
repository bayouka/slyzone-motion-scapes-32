-- 2b2c / 4b4c — explicit workflow for non-versioned working resources.
-- Working resources are references/files used during execution; deliverables remain
-- immutable, versioned outputs handled by the deliverable RPCs.

create or replace function public.create_project_resource_link_v1(
  p_project_id uuid,
  p_title text,
  p_url text,
  p_description text default '',
  p_visibility text default 'internal'
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_actor uuid:=auth.uid();
  v_project public.projects%rowtype;
  v_id uuid;
begin
  if v_actor is null then raise exception 'AUTH_REQUIRED'; end if;
  if nullif(btrim(coalesce(p_title,'')),'') is null then raise exception 'RESOURCE_TITLE_REQUIRED'; end if;
  if char_length(btrim(p_title))>240 then raise exception 'RESOURCE_TITLE_TOO_LONG'; end if;
  if nullif(btrim(coalesce(p_url,'')),'') is null then raise exception 'RESOURCE_URL_REQUIRED'; end if;
  if btrim(p_url) !~* '^https?://' then raise exception 'RESOURCE_URL_INVALID'; end if;
  if p_visibility not in ('internal','shared') then raise exception 'RESOURCE_VISIBILITY_INVALID'; end if;

  select * into v_project from public.projects where id=p_project_id;
  if not found then raise exception 'PROJECT_NOT_FOUND'; end if;
  if not app_private.can_write_project(v_project.id) then raise exception 'PROJECT_WRITE_DENIED'; end if;

  insert into public.project_resources(
    workspace_id,project_id,kind,title,description,visibility,url,created_by
  ) values (
    v_project.workspace_id,v_project.id,'link',btrim(p_title),coalesce(p_description,''),p_visibility,btrim(p_url),v_actor
  ) returning id into v_id;

  return jsonb_build_object('resource_id',v_id,'kind','link','project_id',v_project.id,'visibility',p_visibility);
end;
$$;

create or replace function public.register_project_resource_file_v1(
  p_project_id uuid,
  p_title text,
  p_storage_path text,
  p_file_name text,
  p_mime_type text default null,
  p_size_bytes bigint default null,
  p_description text default '',
  p_visibility text default 'internal'
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_actor uuid:=auth.uid();
  v_project public.projects%rowtype;
  v_id uuid;
begin
  if v_actor is null then raise exception 'AUTH_REQUIRED'; end if;
  if nullif(btrim(coalesce(p_title,'')),'') is null then raise exception 'RESOURCE_TITLE_REQUIRED'; end if;
  if char_length(btrim(p_title))>240 then raise exception 'RESOURCE_TITLE_TOO_LONG'; end if;
  if nullif(btrim(coalesce(p_storage_path,'')),'') is null then raise exception 'STORAGE_PATH_REQUIRED'; end if;
  if nullif(btrim(coalesce(p_file_name,'')),'') is null then raise exception 'FILE_NAME_REQUIRED'; end if;
  if p_size_bytes is not null and p_size_bytes<0 then raise exception 'FILE_SIZE_INVALID'; end if;
  if p_visibility not in ('internal','shared') then raise exception 'RESOURCE_VISIBILITY_INVALID'; end if;

  select * into v_project from public.projects where id=p_project_id;
  if not found then raise exception 'PROJECT_NOT_FOUND'; end if;
  if not app_private.can_write_project(v_project.id) then raise exception 'PROJECT_WRITE_DENIED'; end if;
  if not app_private.can_write_storage_path(p_storage_path) then raise exception 'STORAGE_PATH_DENIED'; end if;
  if exists(select 1 from public.deliverable_versions dv where dv.storage_path=p_storage_path)
     or exists(select 1 from public.project_resources r where r.storage_path=p_storage_path) then
    raise exception 'STORAGE_PATH_ALREADY_REGISTERED';
  end if;

  insert into public.project_resources(
    workspace_id,project_id,kind,title,description,visibility,storage_path,file_name,mime_type,size_bytes,created_by
  ) values (
    v_project.workspace_id,v_project.id,'file',btrim(p_title),coalesce(p_description,''),p_visibility,
    p_storage_path,btrim(p_file_name),p_mime_type,p_size_bytes,v_actor
  ) returning id into v_id;

  return jsonb_build_object('resource_id',v_id,'kind','file','project_id',v_project.id,'visibility',p_visibility);
end;
$$;

create or replace function public.update_project_resource_v1(
  p_resource_id uuid,
  p_title text,
  p_description text default '',
  p_visibility text default 'internal',
  p_url text default null
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_actor uuid:=auth.uid();
  v_resource public.project_resources%rowtype;
begin
  if v_actor is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into v_resource from public.project_resources where id=p_resource_id for update;
  if not found then raise exception 'RESOURCE_NOT_FOUND'; end if;
  if not app_private.can_write_project(v_resource.project_id) then raise exception 'PROJECT_WRITE_DENIED'; end if;
  if nullif(btrim(coalesce(p_title,'')),'') is null then raise exception 'RESOURCE_TITLE_REQUIRED'; end if;
  if char_length(btrim(p_title))>240 then raise exception 'RESOURCE_TITLE_TOO_LONG'; end if;
  if p_visibility not in ('internal','shared') then raise exception 'RESOURCE_VISIBILITY_INVALID'; end if;
  if v_resource.kind='link' then
    if nullif(btrim(coalesce(p_url,'')),'') is null or btrim(p_url) !~* '^https?://' then raise exception 'RESOURCE_URL_INVALID'; end if;
    update public.project_resources
    set title=btrim(p_title),description=coalesce(p_description,''),visibility=p_visibility,url=btrim(p_url),updated_at=now()
    where id=v_resource.id;
  else
    update public.project_resources
    set title=btrim(p_title),description=coalesce(p_description,''),visibility=p_visibility,updated_at=now()
    where id=v_resource.id;
  end if;
  return jsonb_build_object('resource_id',v_resource.id,'kind',v_resource.kind,'project_id',v_resource.project_id,'visibility',p_visibility);
end;
$$;

revoke execute on function public.create_project_resource_link_v1(uuid,text,text,text,text) from public, anon;
revoke execute on function public.register_project_resource_file_v1(uuid,text,text,text,text,bigint,text,text) from public, anon;
revoke execute on function public.update_project_resource_v1(uuid,text,text,text,text) from public, anon;
grant execute on function public.create_project_resource_link_v1(uuid,text,text,text,text) to authenticated;
grant execute on function public.register_project_resource_file_v1(uuid,text,text,text,text,bigint,text,text) to authenticated;
grant execute on function public.update_project_resource_v1(uuid,text,text,text,text) to authenticated;
