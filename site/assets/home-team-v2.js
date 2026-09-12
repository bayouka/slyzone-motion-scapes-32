import { SupabaseBrowserClient } from './supabase-client.js';

(() => {
  if (window.__4B4C_HOME_TEAM_V2__) return;
  window.__4B4C_HOME_TEAM_V2__ = true;
  const config = window.__4B4C_CONFIG__ || {};
  const api = new SupabaseBrowserClient({ url: config.supabaseUrl, publishableKey: config.supabasePublishableKey });
  const key = config.workspaceStorageKey || '4b4c.live.workspace.v1';
  const HOME = new Set(['','#','#/','#/dashboard']);
  const ONLINE_MS = 90000;
  const RECENT_MS = 10 * 60 * 1000;
  let running=false;

  const esc=(value)=>String(value??'').replace(/[&<>"']/g,(char)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[char]));
  const initials=(name)=>String(name||'M').split(/\s+/).filter(Boolean).slice(0,2).map((part)=>part[0]).join('').toUpperCase()||'M';
  const isHome=()=>HOME.has(location.hash||'');

  function status(member){
    const seen=member.last_seen_at?new Date(member.last_seen_at).getTime():0;
    const age=seen?Date.now()-seen:Infinity;
    if(age<=ONLINE_MS)return {tone:'online',label:'En ligne'};
    if(age<=RECENT_MS)return {tone:'recent',label:'Vu récemment'};
    return {tone:'away',label:'Hors ligne'};
  }

  function memberCard(member,profile){
    const s=status(member);const name=profile?.display_name||'Membre';
    const avatar=profile?.avatar_url?`<img src="${esc(profile.avatar_url)}" alt="">`:`<span>${esc(initials(name))}</span>`;
    return `<article class="home-team-v2-person"><div class="home-team-v2-avatar">${avatar}<i class="${s.tone}"></i></div><div class="home-team-v2-meta"><strong>${esc(name)}</strong><small>${esc(s.label)}</small></div><div class="home-team-v2-actions"><a href="#/messages" aria-label="Envoyer un message à ${esc(name)}" title="Message">${messageIcon()}</a><button type="button" data-home-team-v2-call="${esc(member.user_id)}" aria-label="Appeler ${esc(name)}" title="Appeler">${callIcon()}</button></div></article>`;
  }
  function messageIcon(){return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5.5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-8l-4.5 3v-3H5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2Z"/></svg>';}
  function callIcon(){return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.2 3.8 10 8.2 8.2 10c1.4 2.8 3 4.4 5.8 5.8l1.8-1.8 4.4 2.8-.8 3.1c-.2.7-.8 1.1-1.5 1.1C10.5 20.4 3.6 13.5 3 6.1c-.1-.7.4-1.3 1.1-1.5l3.1-.8Z"/></svg>';}

  async function load(){
    if(running||document.hidden||!isHome())return;
    const wid=localStorage.getItem(key)||'';if(!wid||!api.getSession()?.access_token)return;
    running=true;
    try{
      const user=await api.getUser();if(!user?.id)return;
      const [members,profiles]=await Promise.all([
        api.select('workspace_members',`select=user_id,role,status,last_seen_at&workspace_id=eq.${wid}&status=eq.active&order=joined_at.asc`),
        api.select('profiles','select=id,display_name,avatar_url').catch(()=>[]),
      ]);
      const map=new Map((profiles||[]).map((p)=>[p.id,p]));
      const collaborators=(members||[]).filter((m)=>m.role!=='guest'&&m.user_id!==user.id);
      render(collaborators,map);
    }catch(error){console.warn('[2b2c] team strip unavailable',error);}finally{running=false;}
  }

  function render(team,map){
    if(!isHome())return;
    const grid=document.querySelector('.v43-home-grid');if(!grid)return;
    document.querySelector('.home-team-v1')?.remove();
    let section=document.querySelector('.home-team-v2');
    if(!section){section=document.createElement('section');section.className='home-team-v2';section.setAttribute('aria-label','Collaborateurs');grid.parentNode.insertBefore(section,grid);}
    const online=team.filter((m)=>status(m).tone==='online').length;
    const summary=team.length?`${online} disponible${online>1?'s':''} sur ${team.length}`:'Aucun autre membre';
    section.innerHTML=`<div class="home-team-v2-head"><div><strong>Collaborateurs</strong><span class="${online?'has-online':''}"><i></i>${summary}</span></div><a href="#/team">Voir l’équipe</a></div><div class="home-team-v2-list">${team.length?team.map((m)=>memberCard(m,map.get(m.user_id))).join(''):'<div class="home-team-v2-empty">Invitez un collaborateur pour échanger, appeler et suivre sa disponibilité ici.</div>'}</div>`;
  }

  document.addEventListener('click',(event)=>{const btn=event.target.closest?.('[data-home-team-v2-call]');if(!btn)return;event.preventDefault();window.dispatchEvent(new CustomEvent('2b2c:start-call',{detail:{userIds:[btn.dataset.homeTeamV2Call]}}));},true);
  const schedule=()=>setTimeout(()=>void load(),80);
  new MutationObserver(()=>{if(isHome()&&document.querySelector('.v43-home-grid')&&!document.querySelector('.home-team-v2'))schedule();}).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('hashchange',schedule);window.addEventListener('focus',schedule);window.addEventListener('2b2c:presence-heartbeat',schedule);
  setInterval(()=>{if(isHome()&&!document.hidden)void load();},30000);
  setTimeout(()=>void load(),500);
  window.__4B4C_HOME_TEAM_V2__=Object.freeze({version:'2.1.0',refresh:load});
})();
