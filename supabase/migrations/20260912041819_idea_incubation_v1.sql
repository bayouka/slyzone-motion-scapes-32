-- 4b4c Idea Incubation V1
-- Additive upstream object: Idea -> exploration/review/decision -> Project.
-- Does not alter the existing project model.

create table if not exists public.ideas (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid not null,
  title text not null,
  original_text text not null,
  summary text not null default '',
  problem text not null default '',
  audience text not null default '',
  proposal text not null default '',
  status text not null default 'draft' check (status in ('draft','exploring','ready_for_review','in_review','approved','needs_work','parked','rejected','converted')),
  visibility text not null default 'private' check (visibility in ('private','shared','team')),
  readiness text not null default 'clarify' check (readiness in ('clarify','share','decision','converted')),
  conversation_id uuid null references public.conversations(id) on delete set null,
  converted_project_id uuid null unique references public.projects(id) on delete set null,
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ideas_title_nonempty check (nullif(btrim(title),'') is not null),
  constraint ideas_original_nonempty check (nullif(btrim(original_text),'') is not null)
);

create table if not exists public.idea_members (
  idea_id uuid not null references public.ideas(id) on delete cascade,
  user_id uuid not null,
  role text not null default 'reviewer' check (role in ('editor','reviewer')),
  joined_at timestamptz not null default now(),
  primary key (idea_id,user_id)
);

create table if not exists public.idea_items (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.ideas(id) on delete cascade,
  kind text not null check (kind in ('question','reference','hypothesis','path','risk','evidence','note')),
  title text not null,
  body text not null default '',
  url text null,
  state text not null default 'open' check (state in ('open','keep','explore','drop','resolved')),
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint idea_items_title_nonempty check (nullif(btrim(title),'') is not null)
);

create table if not exists public.idea_item_votes (
  idea_item_id uuid not null references public.idea_items(id) on delete cascade,
  user_id uuid not null,
  vote text not null check (vote in ('keep','explore','drop')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (idea_item_id,user_id)
);

create table if not exists public.idea_reviews (
  idea_id uuid not null references public.ideas(id) on delete cascade,
  user_id uuid not null,
  vote text not null check (vote in ('approve','deepen','park','reject')),
  comment text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (idea_id,user_id)
);

create table if not exists public.idea_decisions (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.ideas(id) on delete cascade,
  outcome text not null check (outcome in ('approved','needs_work','parked','rejected')),
  rationale text not null default '',
  decided_by uuid not null,
  decided_at timestamptz not null default now()
);

create index if not exists ideas_workspace_status_idx on public.ideas(workspace_id,status,updated_at desc);
create index if not exists ideas_creator_idx on public.ideas(created_by,updated_at desc);
create index if not exists idea_members_user_idx on public.idea_members(user_id,idea_id);
create index if not exists idea_items_idea_kind_idx on public.idea_items(idea_id,kind,created_at);
create index if not exists idea_decisions_idea_idx on public.idea_decisions(idea_id,decided_at desc);

create trigger ideas_set_updated_at before update on public.ideas for each row execute function app_private.set_updated_at();
create trigger idea_items_set_updated_at before update on public.idea_items for each row execute function app_private.set_updated_at();
create trigger idea_item_votes_set_updated_at before update on public.idea_item_votes for each row execute function app_private.set_updated_at();
create trigger idea_reviews_set_updated_at before update on public.idea_reviews for each row execute function app_private.set_updated_at();

alter table public.ideas enable row level security;
alter table public.idea_members enable row level security;
alter table public.idea_items enable row level security;
alter table public.idea_item_votes enable row level security;
alter table public.idea_reviews enable row level security;
alter table public.idea_decisions enable row level security;

create or replace function app_private.can_access_idea(p_idea_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select exists (
    select 1 from public.ideas i
    where i.id=p_idea_id and (
      i.created_by=auth.uid()
      or (i.visibility='team' and app_private.is_workspace_member(i.workspace_id))
      or (i.visibility='shared' and exists(select 1 from public.idea_members im where im.idea_id=i.id and im.user_id=auth.uid()))
      or app_private.can_manage_workspace(i.workspace_id)
    )
  );
$$;

create or replace function app_private.can_write_idea(p_idea_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select exists (
    select 1 from public.ideas i
    where i.id=p_idea_id and (
      i.created_by=auth.uid()
      or app_private.can_manage_workspace(i.workspace_id)
      or exists(select 1 from public.idea_members im where im.idea_id=i.id and im.user_id=auth.uid() and im.role='editor')
    )
  );
$$;

create policy ideas_select on public.ideas for select using (app_private.can_access_idea(id));
create policy ideas_insert on public.ideas for insert with check (created_by=auth.uid() and app_private.can_write_workspace(workspace_id));
create policy ideas_update on public.ideas for update using (app_private.can_write_idea(id)) with check (app_private.can_write_idea(id));
create policy ideas_delete on public.ideas for delete using (created_by=auth.uid() or app_private.can_manage_workspace(workspace_id));
create policy idea_members_select on public.idea_members for select using (app_private.can_access_idea(idea_id));
create policy idea_members_write on public.idea_members for all using (app_private.can_write_idea(idea_id)) with check (app_private.can_write_idea(idea_id));
create policy idea_items_select on public.idea_items for select using (app_private.can_access_idea(idea_id));
create policy idea_items_write on public.idea_items for all using (app_private.can_write_idea(idea_id)) with check (app_private.can_write_idea(idea_id));
create policy idea_item_votes_select on public.idea_item_votes for select using (exists(select 1 from public.idea_items it where it.id=idea_item_id and app_private.can_access_idea(it.idea_id)));
create policy idea_item_votes_write on public.idea_item_votes for all using (user_id=auth.uid() and exists(select 1 from public.idea_items it where it.id=idea_item_id and app_private.can_access_idea(it.idea_id))) with check (user_id=auth.uid() and exists(select 1 from public.idea_items it where it.id=idea_item_id and app_private.can_access_idea(it.idea_id)));
create policy idea_reviews_select on public.idea_reviews for select using (app_private.can_access_idea(idea_id));
create policy idea_reviews_write on public.idea_reviews for all using (user_id=auth.uid() and app_private.can_access_idea(idea_id)) with check (user_id=auth.uid() and app_private.can_access_idea(idea_id));
create policy idea_decisions_select on public.idea_decisions for select using (app_private.can_access_idea(idea_id));
create policy idea_decisions_write on public.idea_decisions for all using (app_private.can_write_idea(idea_id)) with check (app_private.can_write_idea(idea_id));

create or replace function public.create_idea_v1(p_workspace_id uuid,p_original_text text,p_title text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid(); v_id uuid; v_title text;
begin
  if v_user is null or not app_private.can_write_workspace(p_workspace_id) then raise exception 'FORBIDDEN'; end if;
  if nullif(btrim(p_original_text),'') is null then raise exception 'IDEA_TEXT_REQUIRED'; end if;
  v_title:=coalesce(nullif(btrim(p_title),''),left(regexp_replace(btrim(p_original_text),'\s+',' ','g'),80));
  insert into public.ideas(workspace_id,created_by,title,original_text)
  values(p_workspace_id,v_user,v_title,btrim(p_original_text)) returning id into v_id;
  insert into public.idea_members(idea_id,user_id,role) values(v_id,v_user,'editor') on conflict do nothing;
  insert into public.audit_events(workspace_id,actor_id,event_type,entity_type,entity_id,payload)
  values(p_workspace_id,v_user,'idea.created','idea',v_id,jsonb_build_object('title',v_title));
  return jsonb_build_object('idea_id',v_id,'status','draft','visibility','private');
end $$;

create or replace function public.update_idea_core_v1(p_idea_id uuid,p_expected_version integer,p_title text,p_summary text,p_problem text,p_audience text,p_proposal text,p_readiness text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_row public.ideas;
begin
  if not app_private.can_write_idea(p_idea_id) then raise exception 'FORBIDDEN'; end if;
  update public.ideas set
    title=coalesce(nullif(btrim(p_title),''),title),
    summary=coalesce(p_summary,''), problem=coalesce(p_problem,''), audience=coalesce(p_audience,''), proposal=coalesce(p_proposal,''),
    readiness=coalesce(p_readiness,readiness), version=version+1,
    status=case when status='draft' and (nullif(btrim(coalesce(p_summary,'')),'') is not null or nullif(btrim(coalesce(p_problem,'')),'') is not null) then 'exploring' else status end
  where id=p_idea_id and version=p_expected_version returning * into v_row;
  if v_row.id is null then raise exception 'STALE_IDEA'; end if;
  return jsonb_build_object('idea_id',v_row.id,'version',v_row.version,'status',v_row.status,'readiness',v_row.readiness);
end $$;

create or replace function public.set_idea_access_v1(p_idea_id uuid,p_visibility text,p_member_ids uuid[] default array[]::uuid[])
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid(); v_workspace uuid; v_conversation uuid; v_title text;
begin
  if not app_private.can_write_idea(p_idea_id) then raise exception 'FORBIDDEN'; end if;
  if p_visibility not in ('private','shared','team') then raise exception 'INVALID_IDEA_VISIBILITY'; end if;
  select workspace_id,conversation_id,title into v_workspace,v_conversation,v_title from public.ideas where id=p_idea_id for update;
  delete from public.idea_members where idea_id=p_idea_id and user_id<>v_user;
  insert into public.idea_members(idea_id,user_id,role) values(p_idea_id,v_user,'editor') on conflict(idea_id,user_id) do update set role='editor';
  if p_visibility='shared' then
    insert into public.idea_members(idea_id,user_id,role)
    select p_idea_id,wm.user_id,'reviewer' from public.workspace_members wm
    where wm.workspace_id=v_workspace and wm.status='active' and wm.role in ('owner','admin','member') and wm.user_id=any(coalesce(p_member_ids,array[]::uuid[])) and wm.user_id<>v_user
    on conflict(idea_id,user_id) do nothing;
  elsif p_visibility='team' then
    insert into public.idea_members(idea_id,user_id,role)
    select p_idea_id,wm.user_id,'reviewer' from public.workspace_members wm
    where wm.workspace_id=v_workspace and wm.status='active' and wm.role in ('owner','admin','member') and wm.user_id<>v_user
    on conflict(idea_id,user_id) do nothing;
  end if;
  if p_visibility<>'private' then
    if v_conversation is null then
      insert into public.conversations(workspace_id,kind,title,context_type,context_id,created_by)
      values(v_workspace,'context',v_title,'idea',p_idea_id,v_user) returning id into v_conversation;
      update public.ideas set conversation_id=v_conversation where id=p_idea_id;
    else
      update public.conversations set status='active',title=v_title where id=v_conversation;
    end if;
    delete from public.conversation_members where conversation_id=v_conversation;
    insert into public.conversation_members(conversation_id,user_id,last_read_at)
    select v_conversation,im.user_id,now() from public.idea_members im where im.idea_id=p_idea_id on conflict do nothing;
  elsif v_conversation is not null then
    update public.conversations set status='archived' where id=v_conversation;
    delete from public.conversation_members where conversation_id=v_conversation and user_id<>v_user;
  end if;
  update public.ideas set visibility=p_visibility,version=version+1,status=case when status in ('draft','exploring') and p_visibility<>'private' then 'ready_for_review' else status end,readiness=case when p_visibility='private' then readiness else 'share' end where id=p_idea_id;
  return jsonb_build_object('idea_id',p_idea_id,'visibility',p_visibility,'conversation_id',v_conversation,'members',(select count(*) from public.idea_members where idea_id=p_idea_id));
end $$;

create or replace function public.create_idea_item_v1(p_idea_id uuid,p_kind text,p_title text,p_body text default '',p_url text default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid;
begin
  if not app_private.can_write_idea(p_idea_id) then raise exception 'FORBIDDEN'; end if;
  if p_kind not in ('question','reference','hypothesis','path','risk','evidence','note') then raise exception 'INVALID_IDEA_ITEM_KIND'; end if;
  if nullif(btrim(p_title),'') is null then raise exception 'IDEA_ITEM_TITLE_REQUIRED'; end if;
  insert into public.idea_items(idea_id,kind,title,body,url,created_by) values(p_idea_id,p_kind,btrim(p_title),coalesce(p_body,''),nullif(btrim(p_url),''),auth.uid()) returning id into v_id;
  return v_id;
end $$;

create or replace function public.set_idea_item_state_v1(p_item_id uuid,p_state text)
returns void language plpgsql security definer set search_path='' as $$
declare v_idea uuid;
begin
  select idea_id into v_idea from public.idea_items where id=p_item_id;
  if v_idea is null or not app_private.can_write_idea(v_idea) then raise exception 'FORBIDDEN'; end if;
  if p_state not in ('open','keep','explore','drop','resolved') then raise exception 'INVALID_IDEA_ITEM_STATE'; end if;
  update public.idea_items set state=p_state where id=p_item_id;
end $$;

create or replace function public.vote_idea_item_v1(p_item_id uuid,p_vote text)
returns void language plpgsql security definer set search_path='' as $$
declare v_idea uuid;
begin
  select idea_id into v_idea from public.idea_items where id=p_item_id;
  if v_idea is null or not app_private.can_access_idea(v_idea) then raise exception 'FORBIDDEN'; end if;
  if p_vote not in ('keep','explore','drop') then raise exception 'INVALID_IDEA_VOTE'; end if;
  insert into public.idea_item_votes(idea_item_id,user_id,vote) values(p_item_id,auth.uid(),p_vote)
  on conflict(idea_item_id,user_id) do update set vote=excluded.vote,updated_at=now();
end $$;

create or replace function public.submit_idea_review_v1(p_idea_id uuid,p_vote text,p_comment text default '')
returns void language plpgsql security definer set search_path='' as $$
begin
  if not app_private.can_access_idea(p_idea_id) then raise exception 'FORBIDDEN'; end if;
  if p_vote not in ('approve','deepen','park','reject') then raise exception 'INVALID_IDEA_REVIEW'; end if;
  insert into public.idea_reviews(idea_id,user_id,vote,comment) values(p_idea_id,auth.uid(),p_vote,coalesce(p_comment,''))
  on conflict(idea_id,user_id) do update set vote=excluded.vote,comment=excluded.comment,updated_at=now();
  update public.ideas set status=case when status in ('ready_for_review','exploring') then 'in_review' else status end,readiness='decision' where id=p_idea_id;
end $$;

create or replace function public.decide_idea_v1(p_idea_id uuid,p_outcome text,p_rationale text default '')
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_status text;
begin
  if not app_private.can_write_idea(p_idea_id) then raise exception 'FORBIDDEN'; end if;
  if p_outcome not in ('approved','needs_work','parked','rejected') then raise exception 'INVALID_IDEA_DECISION'; end if;
  v_status:=p_outcome;
  insert into public.idea_decisions(idea_id,outcome,rationale,decided_by) values(p_idea_id,p_outcome,coalesce(p_rationale,''),auth.uid());
  update public.ideas set status=v_status,readiness=case when p_outcome='approved' then 'decision' else readiness end,version=version+1 where id=p_idea_id;
  return jsonb_build_object('idea_id',p_idea_id,'status',v_status);
end $$;

create or replace function public.convert_idea_to_project_v1(p_idea_id uuid,p_target_date date default null,p_phase_titles text[] default array[]::text[])
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_idea public.ideas; v_result jsonb; v_project uuid; v_title text; v_pos integer:=0; v_participants uuid[];
begin
  if not app_private.can_write_idea(p_idea_id) then raise exception 'FORBIDDEN'; end if;
  select * into v_idea from public.ideas where id=p_idea_id for update;
  if v_idea.id is null then raise exception 'IDEA_NOT_FOUND'; end if;
  if v_idea.converted_project_id is not null then return jsonb_build_object('idea_id',p_idea_id,'project_id',v_idea.converted_project_id,'already_converted',true); end if;
  if v_idea.status<>'approved' then raise exception 'IDEA_NOT_APPROVED'; end if;
  select coalesce(array_agg(user_id) filter(where user_id<>v_idea.created_by),array[]::uuid[]) into v_participants from public.idea_members where idea_id=p_idea_id;
  v_result:=app_private.rpc_create_project_with_access_v1(v_idea.workspace_id,v_idea.title,coalesce(nullif(v_idea.proposal,''),nullif(v_idea.summary,''),v_idea.original_text),p_target_date,case when v_idea.visibility='team' then 'team' else 'restricted' end,v_participants);
  v_project:=(v_result->>'project_id')::uuid;
  foreach v_title in array coalesce(p_phase_titles,array[]::text[]) loop
    if nullif(btrim(v_title),'') is not null then
      v_pos:=v_pos+1; if v_pos>5 then exit; end if;
      insert into public.milestones(workspace_id,project_id,title,position,status) values(v_idea.workspace_id,v_project,btrim(v_title),v_pos,case when v_pos=1 then 'active' else 'todo' end);
    end if;
  end loop;
  update public.ideas set converted_project_id=v_project,status='converted',readiness='converted',version=version+1 where id=p_idea_id;
  insert into public.audit_events(workspace_id,actor_id,event_type,entity_type,entity_id,payload)
  values(v_idea.workspace_id,auth.uid(),'idea.converted','idea',p_idea_id,jsonb_build_object('project_id',v_project));
  return v_result || jsonb_build_object('idea_id',p_idea_id,'project_id',v_project,'already_converted',false,'phases',v_pos);
end $$;

revoke all on function public.create_idea_v1(uuid,text,text) from public,anon;
revoke all on function public.update_idea_core_v1(uuid,integer,text,text,text,text,text,text) from public,anon;
revoke all on function public.set_idea_access_v1(uuid,text,uuid[]) from public,anon;
revoke all on function public.create_idea_item_v1(uuid,text,text,text,text) from public,anon;
revoke all on function public.set_idea_item_state_v1(uuid,text) from public,anon;
revoke all on function public.vote_idea_item_v1(uuid,text) from public,anon;
revoke all on function public.submit_idea_review_v1(uuid,text,text) from public,anon;
revoke all on function public.decide_idea_v1(uuid,text,text) from public,anon;
revoke all on function public.convert_idea_to_project_v1(uuid,date,text[]) from public,anon;
grant execute on function public.create_idea_v1(uuid,text,text) to authenticated;
grant execute on function public.update_idea_core_v1(uuid,integer,text,text,text,text,text,text) to authenticated;
grant execute on function public.set_idea_access_v1(uuid,text,uuid[]) to authenticated;
grant execute on function public.create_idea_item_v1(uuid,text,text,text,text) to authenticated;
grant execute on function public.set_idea_item_state_v1(uuid,text) to authenticated;
grant execute on function public.vote_idea_item_v1(uuid,text) to authenticated;
grant execute on function public.submit_idea_review_v1(uuid,text,text) to authenticated;
grant execute on function public.decide_idea_v1(uuid,text,text) to authenticated;
grant execute on function public.convert_idea_to_project_v1(uuid,date,text[]) to authenticated;

grant select on public.ideas,public.idea_members,public.idea_items,public.idea_item_votes,public.idea_reviews,public.idea_decisions to authenticated;
revoke insert,update,delete on public.ideas,public.idea_members,public.idea_items,public.idea_item_votes,public.idea_reviews,public.idea_decisions from anon;
