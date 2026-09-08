-- Allow message attachments in workspace-files under workspace/messages/conversation/... while preserving project-file rules.
create or replace function app_private.can_write_storage_path(p_name text)
returns boolean language sql stable security definer set search_path='' as $$
  with parsed as (
    select app_private.storage_workspace_id(p_name) as workspace_id,
      split_part(p_name,'/',2) as segment2,
      case when split_part(p_name,'/',2) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then split_part(p_name,'/',2)::uuid else null::uuid end as project_id,
      case when split_part(p_name,'/',2)='messages' and split_part(p_name,'/',3) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then split_part(p_name,'/',3)::uuid else null::uuid end as conversation_id
  )
  select exists(
    select 1 from parsed x
    where (
      x.project_id is not null and exists(
        select 1 from public.projects p where p.id=x.project_id and p.workspace_id=x.workspace_id and app_private.can_write_project(x.project_id)
      )
    ) or (
      x.segment2='messages' and x.conversation_id is not null and exists(
        select 1 from public.conversations c
        where c.id=x.conversation_id and c.workspace_id=x.workspace_id and c.status<>'archived' and app_private.can_access_conversation(c.id)
      )
    )
  );
$$;

create or replace function app_private.can_read_storage_path(p_name text)
returns boolean language sql stable security definer set search_path='' as $$
  with parsed as (
    select app_private.storage_workspace_id(p_name) as workspace_id,
      split_part(p_name,'/',2) as segment2,
      case when split_part(p_name,'/',2) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then split_part(p_name,'/',2)::uuid else null::uuid end as project_id,
      case when split_part(p_name,'/',2)='messages' and split_part(p_name,'/',3) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then split_part(p_name,'/',3)::uuid else null::uuid end as conversation_id
  )
  select exists(
    select 1 from parsed x
    where (
      x.project_id is not null and exists(
        select 1 from public.projects p
        where p.id=x.project_id and p.workspace_id=x.workspace_id and app_private.can_access_project(x.project_id)
          and (
            not app_private.is_external_workspace_member(x.workspace_id)
            or exists(select 1 from public.deliverable_versions dv join public.deliverables d on d.id=dv.deliverable_id join public.deliverable_version_shares dvs on dvs.deliverable_version_id=dv.id where dv.storage_path=p_name and d.project_id=x.project_id and d.workspace_id=x.workspace_id and d.visibility='shared' and dvs.workspace_id=x.workspace_id and dvs.project_id=x.project_id)
            or exists(select 1 from public.project_resources r where r.storage_path=p_name and r.project_id=x.project_id and r.workspace_id=x.workspace_id and r.kind='file' and r.visibility='shared')
          )
      )
    ) or (
      x.segment2='messages' and x.conversation_id is not null and exists(
        select 1 from public.attachments a
        join public.messages m on m.id=a.message_id
        join public.conversations c on c.id=m.conversation_id
        where a.storage_path=p_name and c.id=x.conversation_id and c.workspace_id=x.workspace_id and app_private.can_access_conversation(c.id)
      )
    )
  );
$$;

create or replace function app_private.can_mutate_storage_path_v2(p_name text)
returns boolean language sql stable security definer set search_path='' as $$
  select app_private.can_write_storage_path(p_name)
    and not exists(select 1 from public.deliverable_versions dv where dv.storage_path=p_name)
    and not exists(select 1 from public.attachments a where a.storage_path=p_name);
$$;
