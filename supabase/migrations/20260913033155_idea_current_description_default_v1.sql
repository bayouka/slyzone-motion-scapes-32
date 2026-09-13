create or replace function app_private.ensure_idea_current_description_v1()
returns trigger
language plpgsql
set search_path=''
as $$
begin
  if nullif(btrim(coalesce(new.current_description,'')),'') is null then
    new.current_description:=new.original_text;
  end if;
  return new;
end $$;

drop trigger if exists ideas_current_description_default_v1 on public.ideas;
create trigger ideas_current_description_default_v1
before insert on public.ideas
for each row execute function app_private.ensure_idea_current_description_v1();
