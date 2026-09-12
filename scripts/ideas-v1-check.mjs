import fs from 'node:fs';

const read=(p)=>fs.readFileSync(p,'utf8');
const assert=(ok,msg)=>{if(!ok)throw new Error(`IDEAS V1 CHECK FAILED: ${msg}`);};
const index=read('site/index.html');
const js=read('site/assets/ideas-v1.js');
const css=read('site/assets/ideas-v1.css');
const migration=read('supabase/migrations/20260912041819_idea_incubation_v1.sql');
const governance=read('supabase/migrations/20260912044610_idea_incubation_governance_v1.sql');

for(const marker of ['ideas-v1.css?v=1.0.0',"ideas-v1.js?v=1.0.0"]) assert(index.includes(marker),`index missing ${marker}`);

for(const marker of [
  '__4B4C_IDEAS_V1__','create_idea_v1','update_idea_core_v1','set_idea_access_v1','create_idea_item_v1',
  'vote_idea_item_v1','submit_idea_review_v1','decide_idea_v1','convert_idea_to_project_v1','#/ideas/',
  'Idées en réflexion','4b4c vous guide','Mode présentation'
]) assert(js.includes(marker),`runtime missing ${marker}`);

for(const marker of ['.ideas-v1-projects-panel','.ideas-v1-layout','.ideas-v1-tabs','.ideas-v1-presentation','@media(max-width:767px)']) assert(css.includes(marker),`styles missing ${marker}`);

for(const marker of [
  'create table if not exists public.ideas','create table if not exists public.idea_members','create table if not exists public.idea_items',
  'create table if not exists public.idea_reviews','create table if not exists public.idea_decisions','app_private.can_access_idea',
  'app_private.can_write_idea','IDEA_NOT_APPROVED','already_converted','app_private.rpc_create_project_with_access_v1',
  'revoke all on function public.create_idea_v1','grant execute on function public.convert_idea_to_project_v1'
]) assert(migration.includes(marker),`migration missing ${marker}`);

for(const marker of [
  'app_private.can_manage_idea','alter policy idea_members_write','alter policy idea_decisions_write',
  'if not app_private.can_manage_idea(p_idea_id)','v_owner','user_id<>v_owner'
]) assert(governance.includes(marker),`governance migration missing ${marker}`);

assert(!js.includes("api.insert('projects'"),'UI must never create projects directly');
assert(!migration.includes('alter table public.projects add'),'Idea V1 must not mutate project schema');
assert(!governance.includes('alter table public.projects'),'Idea governance must not mutate project schema');
console.log('Ideas V1 gate: OK');
