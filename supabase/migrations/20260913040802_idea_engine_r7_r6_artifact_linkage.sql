-- 4b4c R7 — attach R6 inherited FOR_PROJECT artifacts to their Project Definition

create or replace function app_private.attach_project_definition_to_inherited_artifact_v1()
returns trigger
language plpgsql
set search_path=''
as $$
begin
  if new.project_definition_id is null
     and new.purpose_stage='FOR_PROJECT'
     and new.spec_status='PROJECT_DEFINITION'
     and new.source_snapshot_id is not null then
    select pd.id into new.project_definition_id
    from public.project_definitions pd
    where pd.idea_id=new.idea_id
      and pd.approved_idea_snapshot_id=new.source_snapshot_id
      and pd.status<>'superseded'
    order by pd.version desc
    limit 1;
  end if;
  return new;
end;
$$;

create or replace function app_private.protect_artifact_project_definition_link_v1()
returns trigger
language plpgsql
set search_path=''
as $$
begin
  if new.project_definition_id is distinct from old.project_definition_id then
    raise exception 'ARTIFACT_PROJECT_DEFINITION_LINK_IMMUTABLE' using errcode='55000';
  end if;
  return new;
end;
$$;

create trigger idea_artifacts_attach_project_definition_v1
before insert on public.idea_artifacts
for each row execute function app_private.attach_project_definition_to_inherited_artifact_v1();

create trigger idea_artifacts_project_definition_link_immutable_v1
before update on public.idea_artifacts
for each row execute function app_private.protect_artifact_project_definition_link_v1();
