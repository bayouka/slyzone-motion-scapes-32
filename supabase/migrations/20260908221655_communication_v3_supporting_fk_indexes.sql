-- Cover Communication V3 foreign keys used for workspace/author filtering and joins.
create index if not exists attachments_workspace_id_idx on public.attachments(workspace_id);
create index if not exists attachments_created_by_idx on public.attachments(created_by);
create index if not exists mentions_workspace_id_idx on public.mentions(workspace_id);
create index if not exists mentions_mentioned_by_idx on public.mentions(mentioned_by);
