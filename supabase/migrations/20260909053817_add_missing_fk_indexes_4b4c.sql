
create index if not exists call_invites_invited_by_idx on public.call_invites(invited_by);
create index if not exists call_invites_workspace_id_idx on public.call_invites(workspace_id);
create index if not exists call_participants_user_id_idx on public.call_participants(user_id);
create index if not exists call_sessions_direct_user_id_idx on public.call_sessions(direct_user_id);
create index if not exists call_sessions_ended_by_idx on public.call_sessions(ended_by);
create index if not exists call_sessions_started_by_idx on public.call_sessions(started_by);
create index if not exists call_signals_from_user_idx on public.call_signals(from_user);
create index if not exists call_signals_to_user_idx on public.call_signals(to_user);
create index if not exists comments_author_id_idx on public.comments(author_id);
create index if not exists comments_reply_to_id_idx on public.comments(reply_to_id);
create index if not exists comments_workspace_id_idx on public.comments(workspace_id);
