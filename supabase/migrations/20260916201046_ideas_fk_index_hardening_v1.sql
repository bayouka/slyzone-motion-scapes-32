create index if not exists idea_ai_runs_created_by_idx on public.idea_ai_runs(created_by);
create index if not exists idea_information_requirement_refs_action_run_idx on public.idea_information_requirement_refs(created_by_action_run_id);
create index if not exists idea_information_requirement_refs_created_by_idx on public.idea_information_requirement_refs(created_by);
create index if not exists idea_question_answers_answered_by_idx on public.idea_question_answers(answered_by);
create index if not exists idea_question_answers_idea_idx on public.idea_question_answers(idea_id);
create index if not exists idea_source_snapshots_action_run_idx on public.idea_source_snapshots(created_by_action_run_id);
create index if not exists idea_team_feedback_user_idx on public.idea_team_feedback(user_id);
create index if not exists ideas_conversation_idx on public.ideas(conversation_id);
