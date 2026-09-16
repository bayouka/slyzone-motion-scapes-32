alter policy ideas_insert on public.ideas with check ((created_by = (select auth.uid())) and app_private.can_write_workspace(workspace_id));
alter policy ideas_delete on public.ideas using ((created_by = (select auth.uid())) or app_private.can_manage_workspace(workspace_id));

alter policy idea_question_answers_insert on public.idea_question_answers with check ((answered_by = (select auth.uid())) and app_private.can_write_idea(idea_id));
alter policy idea_question_answers_update on public.idea_question_answers using ((answered_by = (select auth.uid())) and app_private.can_write_idea(idea_id)) with check ((answered_by = (select auth.uid())) and app_private.can_write_idea(idea_id));
alter policy idea_question_answers_delete on public.idea_question_answers using ((answered_by = (select auth.uid())) and app_private.can_write_idea(idea_id));

alter policy idea_team_feedback_insert on public.idea_team_feedback with check ((user_id = (select auth.uid())) and app_private.can_access_idea(idea_id));
alter policy idea_team_feedback_update on public.idea_team_feedback using ((user_id = (select auth.uid())) and app_private.can_access_idea(idea_id)) with check ((user_id = (select auth.uid())) and app_private.can_access_idea(idea_id));
alter policy idea_team_feedback_delete on public.idea_team_feedback using (user_id = (select auth.uid()));
