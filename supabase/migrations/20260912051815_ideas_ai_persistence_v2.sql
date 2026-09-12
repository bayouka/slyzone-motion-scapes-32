create table if not exists public.idea_ai_runs (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.ideas(id) on delete cascade,
  action text not null check(action in ('understand','questions','improve','challenge','synthesize','presentation','presenter')),
  input_version integer not null,
  input_hash text not null,
  model text not null default '',
  result jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idea_ai_runs_idea_action_idx
  on public.idea_ai_runs(idea_id,action,created_at desc);

alter table public.idea_ai_runs enable row level security;

create policy idea_ai_runs_select
  on public.idea_ai_runs for select to authenticated
  using(app_private.can_access_idea(idea_id));

revoke all on public.idea_ai_runs from anon;
grant select on public.idea_ai_runs to authenticated;

create or replace function public.record_idea_ai_run_v2(
  p_idea_id uuid,p_action text,p_input_version integer,p_input_hash text,p_model text,p_result jsonb
) returns uuid
language plpgsql security definer set search_path=''
as $$
declare v_id uuid;
begin
  if not app_private.can_access_idea(p_idea_id) then raise exception 'FORBIDDEN'; end if;
  if p_action not in ('understand','questions','improve','challenge','synthesize','presentation','presenter') then
    raise exception 'INVALID_AI_ACTION';
  end if;
  insert into public.idea_ai_runs(idea_id,action,input_version,input_hash,model,result,created_by)
  values(p_idea_id,p_action,p_input_version,p_input_hash,coalesce(p_model,''),coalesce(p_result,'{}'::jsonb),auth.uid())
  returning id into v_id;
  return v_id;
end $$;

revoke all on function public.record_idea_ai_run_v2(uuid,text,integer,text,text,jsonb) from public,anon;
grant execute on function public.record_idea_ai_run_v2(uuid,text,integer,text,text,jsonb) to authenticated;

create or replace function public.accept_idea_ai_suggestion_v2(
  p_idea_id uuid,p_kind text,p_title text,p_body text,p_state text default 'kept'
) returns uuid
language plpgsql security definer set search_path=''
as $$
declare v_id uuid;
begin
  if not app_private.can_write_idea(p_idea_id) then raise exception 'FORBIDDEN'; end if;
  if p_kind not in ('question','hypothesis','path','risk','evidence','note') then raise exception 'INVALID_IDEA_ITEM_KIND'; end if;
  if p_state not in ('open','kept','explore','rejected','resolved') then raise exception 'INVALID_IDEA_ITEM_STATE'; end if;
  insert into public.idea_items(idea_id,kind,title,body,state,created_by)
  values(p_idea_id,p_kind,btrim(p_title),coalesce(p_body,''),p_state,auth.uid())
  returning id into v_id;
  return v_id;
end $$;

revoke all on function public.accept_idea_ai_suggestion_v2(uuid,text,text,text,text) from public,anon;
grant execute on function public.accept_idea_ai_suggestion_v2(uuid,text,text,text,text) to authenticated;
