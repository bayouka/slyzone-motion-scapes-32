-- 2b2c / 4b4c — create deliverable metadata + immutable v1 atomically
-- after the object has been uploaded to Storage.

create or replace function public.create_deliverable_with_first_version_v1(
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
  v_deliverable_id uuid;
  v_version_id uuid;
begin
  if v_actor is null then raise exception 'AUTH_REQUIRED'; end if;
  if nullif(btrim(coalesce(p_title,'')),'') is null then raise exception 'DELIVERABLE_TITLE_REQUIRED'; end if;
  if char_length(btrim(p_title))>240 then raise exception 'DELIVERABLE_TITLE_TOO_LONG'; end if;
  if nullif(btrim(coalesce(p_storage_path,'')),'') is null then raise exception 'STORAGE_PATH_REQUIRED'; end if;
  if nullif(btrim(coalesce(p_file_name,'')),'') is null then raise exception 'FILE_NAME_REQUIRED'; end if;
  if p_size_bytes is not null and p_size_bytes<0 then raise exception 'FILE_SIZE_INVALID'; end if;
  if p_visibility not in ('internal','shared') then raise exception 'DELIVERABLE_VISIBILITY_INVALID'; end if;

  select * into v_project from public.projects where id=p_project_id for share;
  if not found then raise exception 'PROJECT_NOT_FOUND'; end if;
  if not app_private.can_write_project(v_project.id) then raise exception 'PROJECT_WRITE_DENIED'; end if;
  if not app_private.can_write_storage_path(p_storage_path) then raise exception 'STORAGE_PATH_DENIED'; end if;
  if exists(select 1 from public.deliverable_versions dv where dv.storage_path=p_storage_path)
     or exists(select 1 from public.project_resources r where r.storage_path=p_storage_path) then
    raise exception 'STORAGE_PATH_ALREADY_REGISTERED';
  end if;

  insert into public.deliverables(
    workspace_id,project_id,title,description,visibility,status,created_by
  ) values (
    v_project.workspace_id,v_project.id,btrim(p_title),coalesce(p_description,''),p_visibility,'draft',v_actor
  ) returning id into v_deliverable_id;

  insert into public.deliverable_versions(
    workspace_id,deliverable_id,version_number,storage_path,file_name,mime_type,size_bytes,created_by
  ) values (
    v_project.workspace_id,v_deliverable_id,1,p_storage_path,btrim(p_file_name),p_mime_type,p_size_bytes,v_actor
  ) returning id into v_version_id;

  if p_visibility='shared' then
    insert into public.deliverable_version_shares(deliverable_version_id,workspace_id,project_id,shared_by)
    values(v_version_id,v_project.workspace_id,v_project.id,v_actor)
    on conflict (deliverable_version_id) do nothing;
  end if;

  return jsonb_build_object(
    'deliverable_id',v_deliverable_id,
    'version_id',v_version_id,
    'version_number',1,
    'shared_external',p_visibility='shared'
  );
end;
$$;

revoke execute on function public.create_deliverable_with_first_version_v1(uuid,text,text,text,text,bigint,text,text) from public, anon;
grant execute on function public.create_deliverable_with_first_version_v1(uuid,text,text,text,text,bigint,text,text) to authenticated;
