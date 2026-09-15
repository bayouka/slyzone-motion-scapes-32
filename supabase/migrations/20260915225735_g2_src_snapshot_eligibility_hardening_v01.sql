-- 4b4c / 2b2c — G2 SRC snapshot eligibility hardening V0.1
-- Fail-closed preparation only: SRC remains inactive at the production Worker endpoint.

create or replace function app_private.idea_g2_src_has_current_snapshot_v1(
  p_idea_id uuid,
  p_requirement_id text
)
returns boolean
language sql
stable
security definer
set search_path=''
as $$
  select p_requirement_id='SV.D03.PRIMARY_NEED'
    and exists(
      select 1
      from public.idea_sources s
      join public.idea_source_snapshots ss
        on ss.source_id=s.id
       and ss.source_version=s.source_version
       and ss.content_hash=s.content_hash
      where s.idea_id=p_idea_id
        and s.source_kind='url'
        and s.status='ingested'
        and s.sensitivity in ('public','internal')
        and ss.sensitivity in ('public','internal')
    )
$$;

revoke all on function app_private.idea_g2_src_has_current_snapshot_v1(uuid,text) from public, anon, authenticated, service_role;

create or replace function app_private.idea_g2_path_has_input_v1(
  p_idea_id uuid,
  p_path text,
  p_requirement_id text
)
returns boolean
language sql
stable
security definer
set search_path=''
as $$
  select case p_path
    when 'MEM' then exists(
      select 1 from public.idea_information_items ii
      where ii.idea_id=p_idea_id and ii.state='ACTIVE'
    )
    when 'RAW' then exists(
      select 1 from public.idea_sources s
      where s.idea_id=p_idea_id and s.source_kind='human_raw'
        and s.status in ('registered','ingested')
    )
    when 'SRC' then app_private.idea_g2_src_has_current_snapshot_v1(p_idea_id,p_requirement_id)
    when 'AUDIT' then exists(
      select 1 from public.idea_sources s
      where s.idea_id=p_idea_id
        and s.source_kind in ('url','document','image','system_observation')
        and s.status in ('registered','ingested')
    )
    when 'CONN' then true
    when 'WEB' then true
    when 'CALC' then true
    when 'AI_H' then true
    when 'AI_R' then true
    else false
  end
$$;
