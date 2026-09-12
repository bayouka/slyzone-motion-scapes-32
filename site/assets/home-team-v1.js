import { SupabaseBrowserClient } from './supabase-client.js';

(() => {
  if (window.__4B4C_HOME_TEAM_V1__) return;
  window.__4B4C_HOME_TEAM_V1__ = true;

  const config = window.__4B4C_CONFIG__ || {};
  const api = new SupabaseBrowserClient({ url: config.supabaseUrl, publishableKey: config.supabasePublishableKey });
  const WORKSPACE_KEY = config.workspaceStorageKey || '4b4c.live.workspace.v1';
  const HOME_ROUTES = new Set(['', '#', '#/', '#/dashboard']);
  const ONLINE_MS = 120000;
  const RECENT_MS = 15 * 60 * 1000;
  let timer = null;
  let running = false;

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[char]));
  const initials = (name) => String(name || 'M').split(/\s+/).filter(Boolean).slice(0,2).map((part)=>part[0]).join('').toUpperCase() || 'M';
  const homeActive = () => HOME_ROUTES.has(location.hash || '');
  const workspaceId = () => localStorage.getItem(WORKSPACE_KEY) || '';

  function presence(member, ownId) {
    if (member.user_id === ownId) return { tone:'online', label:'En ligne' };
    const seen = member.last_seen_at ? new Date(member.last_seen_at).getTime() : 0;
    const age = seen ? Date.now() - seen : Infinity;
    if (age <= ONLINE_MS) return { tone:'online', label:'En ligne' };
    if (age <= RECENT_MS) return { tone:'recent', label:'Actif récemment' };
    return { tone:'away', label: seen ? 'Hors ligne' : 'Jamais connecté' };
  }

  function personHtml(member, profile, ownId) {
    const p = presence(member, ownId);
    const name = profile?.display_name || (member.user_id === ownId ? 'Vous' : 'Membre');
    const avatar = profile?.avatar_url
      ? `<span class="home-team-v1-avatar"><img src="${esc(profile.avatar_url)}" alt=""><i class="home-team-v1-dot ${p.tone}"></i></span>`
      : `<span class="home-team-v1-avatar">${esc(initials(name))}<i class="home-team-v1-dot ${p.tone}"></i></span>`;
    const own = member.user_id === ownId;
    return `<article class="home-team-v1-person" data-user="${esc(member.user_id)}">${avatar}<div class="home-team-v1-meta"><strong>${esc(name)}${own?' · vous':''}</strong><small>${esc(p.label)}</small></div><div class="home-team-v1-actions">${own?'':`<a href="#/messages" aria-label="Écrire à ${esc(name)}" title="Messages">✉</a><button type="button" data-home-team-call="${esc(member.user_id)}" aria-label="Appeler ${esc(name)}" title="Appeler">◉</button>`}</div></article>`;
  }

  async function load() {
    if (running || document.hidden || !homeActive()) return;
    const wid = workspaceId();
    const session = api.getSession();
    if (!wid || !session?.access_token) return;
    running = true;
    try {
      const user = await api.getUser();
      if (!user?.id) return;
      await api.rpc('mark_workspace_seen', { p_workspace_id: wid }).catch(() => null);
      const [members, profiles] = await Promise.all([
        api.select('workspace_members', `select=user_id,role,status,last_seen_at&workspace_id=eq.${wid}&status=eq.active&order=joined_at.asc`),
        api.select('profiles', 'select=id,display_name,avatar_url').catch(() => []),
      ]);
      const profileMap = new Map((profiles || []).map((profile) => [profile.id, profile]));
      const team = (members || []).filter((member) => member.role !== 'guest');
      render(team, profileMap, user.id);
    } catch (error) {
      console.warn('[2b2c] dashboard team presence unavailable', error);
    } finally {
      running = false;
    }
  }

  function render(team, profileMap, ownId) {
    if (!homeActive()) return;
    const grid = document.querySelector('.v43-home-grid');
    if (!grid) return;
    let section = document.querySelector('.home-team-v1');
    if (!section) {
      section = document.createElement('section');
      section.className = 'home-team-v1';
      section.setAttribute('aria-label', 'Équipe et disponibilité');
      grid.parentNode.insertBefore(section, grid);
    }
    const online = team.filter((member) => presence(member, ownId).tone === 'online').length;
    section.innerHTML = `<div class="home-team-v1-head"><div><span>Équipe</span><strong>${online} en ligne sur ${team.length}</strong><small>Disponibilité de vos collaborateurs dans cet espace.</small></div><a href="#/team">Voir l’équipe →</a></div><div class="home-team-v1-list">${team.map((member)=>personHtml(member,profileMap.get(member.user_id),ownId)).join('')}</div>`;
  }

  function schedule(delay = 0) {
    clearTimeout(timer);
    timer = setTimeout(() => void load(), delay);
  }

  document.addEventListener('click', (event) => {
    const button = event.target.closest?.('[data-home-team-call]');
    if (!button) return;
    const userId = button.dataset.homeTeamCall;
    if (!userId) return;
    event.preventDefault();
    window.dispatchEvent(new CustomEvent('2b2c:start-call', { detail: { userIds:[userId] } }));
  }, true);

  const observer = new MutationObserver(() => {
    if (homeActive() && document.querySelector('.v43-home-grid') && !document.querySelector('.home-team-v1')) schedule(50);
  });
  observer.observe(document.documentElement, { childList:true, subtree:true });
  window.addEventListener('hashchange', () => schedule(80));
  window.addEventListener('focus', () => schedule(80));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) schedule(80); });
  setInterval(() => { if (homeActive() && !document.hidden) void load(); }, 45000);
  schedule(1400);

  window.__4B4C_HOME_TEAM_V1__ = Object.freeze({ version:'1.0.0', refresh:load });
})();
