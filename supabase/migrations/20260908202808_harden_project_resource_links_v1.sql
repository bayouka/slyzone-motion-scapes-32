alter table public.project_resources
  add constraint project_resources_link_http_check
  check (kind <> 'link' or url ~* '^https?://');
