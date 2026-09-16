revoke execute on function public.decide_idea_v1(uuid, text, text) from public, anon, authenticated;
revoke execute on function public.convert_idea_to_project_v1(uuid, date, text[]) from public, anon, authenticated;

grant execute on function public.decide_idea_v1(uuid, text, text) to service_role;
grant execute on function public.convert_idea_to_project_v1(uuid, date, text[]) to service_role;
