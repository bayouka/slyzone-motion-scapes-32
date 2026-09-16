drop policy if exists idea_decisions_write on public.idea_decisions;
create policy idea_decisions_insert on public.idea_decisions for insert to public with check (app_private.can_manage_idea(idea_id));
create policy idea_decisions_update on public.idea_decisions for update to public using (app_private.can_manage_idea(idea_id)) with check (app_private.can_manage_idea(idea_id));
create policy idea_decisions_delete on public.idea_decisions for delete to public using (app_private.can_manage_idea(idea_id));

drop policy if exists idea_item_votes_write on public.idea_item_votes;
create policy idea_item_votes_insert on public.idea_item_votes for insert to public with check ((user_id = (select auth.uid())) and exists (select 1 from public.idea_items it where it.id=idea_item_votes.idea_item_id and app_private.can_access_idea(it.idea_id)));
create policy idea_item_votes_update on public.idea_item_votes for update to public using ((user_id = (select auth.uid())) and exists (select 1 from public.idea_items it where it.id=idea_item_votes.idea_item_id and app_private.can_access_idea(it.idea_id))) with check ((user_id = (select auth.uid())) and exists (select 1 from public.idea_items it where it.id=idea_item_votes.idea_item_id and app_private.can_access_idea(it.idea_id)));
create policy idea_item_votes_delete on public.idea_item_votes for delete to public using ((user_id = (select auth.uid())) and exists (select 1 from public.idea_items it where it.id=idea_item_votes.idea_item_id and app_private.can_access_idea(it.idea_id)));

drop policy if exists idea_items_write on public.idea_items;
create policy idea_items_insert on public.idea_items for insert to public with check (app_private.can_write_idea(idea_id));
create policy idea_items_update on public.idea_items for update to public using (app_private.can_write_idea(idea_id)) with check (app_private.can_write_idea(idea_id));
create policy idea_items_delete on public.idea_items for delete to public using (app_private.can_write_idea(idea_id));

drop policy if exists idea_members_write on public.idea_members;
create policy idea_members_insert on public.idea_members for insert to public with check (app_private.can_manage_idea(idea_id));
create policy idea_members_update on public.idea_members for update to public using (app_private.can_manage_idea(idea_id)) with check (app_private.can_manage_idea(idea_id));
create policy idea_members_delete on public.idea_members for delete to public using (app_private.can_manage_idea(idea_id));

drop policy if exists idea_reviews_write on public.idea_reviews;
create policy idea_reviews_insert on public.idea_reviews for insert to public with check ((user_id = (select auth.uid())) and app_private.can_access_idea(idea_id));
create policy idea_reviews_update on public.idea_reviews for update to public using ((user_id = (select auth.uid())) and app_private.can_access_idea(idea_id)) with check ((user_id = (select auth.uid())) and app_private.can_access_idea(idea_id));
create policy idea_reviews_delete on public.idea_reviews for delete to public using ((user_id = (select auth.uid())) and app_private.can_access_idea(idea_id));
