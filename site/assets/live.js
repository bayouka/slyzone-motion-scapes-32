import { SupabaseBrowserClient, ApiError } from './supabase-client.js';

const config = window.__4B4C_CONFIG__;
const api = new SupabaseBrowserClient({ url: config.supabaseUrl, publishableKey: config.supabasePublishableKey });
const app = document.getElementById('app');
const WORKSPACE_KEY = config.workspaceStorageKey || '4b4c.live.workspace.v1';

const state = {
  authMode: 'signin', user: null, profile: null, memberships: [], workspace: null, workspaceRole: null,
  projects: [], archivedProjects: [], members: [], profiles: [], notifications: [], requests: [], approvals: [], meetings: [], meetingAttendees: [], milestones: [],
  actions: [], assignees: [], decisions: [], deliverables: [], deliverableVersions: [], conversations: [], conversationMembers: [], projectMembers: [], projectSummaries: new Map(), projectCache: new Map(), messages: new Map(),
  unreadMessages: 0, unreadMentions: 0, unreadConversations: new Map(), replyTo: null, messageLoads: new Set(),
  modal: null, toast: [], notificationOpen: false, userMenuOpen: false, mobileMenuOpen: false, invitePreview: null, welcome: null, searchQuery: '', libraryQuery: '', libraryProject: 'all', loading: true, busy: false, lastSync: null, syncError: null, syncDigest: null, syncProbeAt: 0, previousSeenAt: null, seenMarkedAt: null
};

let workspaceRefreshPromise = null;
let smartSyncPromise = null;
let lastFullRefreshAt = 0;

const BRAND_NAME = '2b2c';
const BRAND_TAGLINE = 'Projets qui avancent ensemble';

function lineIcon(body) {
  return `<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}
function brandMarkHtml(extraClass='') {
  return `<span class="brand-logo-icon ${extraClass}" aria-hidden="true"><img src="./assets/brand-icon.svg" alt=""></span>`;
}
function brandHtml({tagline=true}={}) {
  return `<div class="live-brand">${brandMarkHtml()}<div><span class="brand-wordmark">${BRAND_NAME}</span>${tagline?`<small>${BRAND_TAGLINE}</small>`:''}</div></div>`;
}

const ICONS = {
  dashboard:lineIcon('<path d="M3.5 10.5 12 3.8l8.5 6.7"/><path d="M5.8 9.2v10h12.4v-10"/><path d="M9.5 19.2v-5.5h5v5.5"/>'),
  projects:lineIcon('<rect x="3.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="14" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="3.5" y="14" width="6.5" height="6.5" rx="1.5"/><rect x="14" y="14" width="6.5" height="6.5" rx="1.5"/>'),
  work:lineIcon('<circle cx="12" cy="12" r="8.5"/><path d="m8.2 12.2 2.4 2.4 5.2-5.4"/>'),
  messages:lineIcon('<path d="M5 5.5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-8l-4.7 3v-3H5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2Z"/>'),
  calendar:lineIcon('<rect x="3.5" y="5.5" width="17" height="15" rx="2.5"/><path d="M7.5 3.5v4M16.5 3.5v4M3.5 10h17"/>'),
  library:lineIcon('<path d="M4 5.2c3.2-.8 5.8-.1 8 1.7v13c-2.2-1.8-4.8-2.5-8-1.7v-13Z"/><path d="M20 5.2c-3.2-.8-5.8-.1-8 1.7v13c2.2-1.8 4.8-2.5 8-1.7v-13Z"/>'),
  team:lineIcon('<path d="M8.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM15.8 10a3 3 0 1 0 0-6"/><path d="M2.8 20c.4-4 2.4-6 5.7-6s5.3 2 5.7 6M15 14c3.4 0 5.5 2 5.8 6"/>'),
  archives:lineIcon('<path d="M4.5 8.5h15v11h-15z"/><path d="M3.5 4.5h17v4h-17zM9.5 12h5"/>'),
  settings:lineIcon('<circle cx="12" cy="12" r="3"/><path d="M19.2 13.4a7.7 7.7 0 0 0 .1-2.8l2-1.5-2-3.4-2.4 1a8.1 8.1 0 0 0-2.4-1.4L14.2 3h-4.4l-.3 2.3a8.1 8.1 0 0 0-2.4 1.4l-2.4-1-2 3.4 2 1.5a7.7 7.7 0 0 0 .1 2.8l-2 1.5 2 3.4 2.4-1a8.1 8.1 0 0 0 2.4 1.4l.3 2.3h4.4l.3-2.3a8.1 8.1 0 0 0 2.4-1.4l2.4 1 2-3.4-2.2-1.5Z"/>'),
  search:lineIcon('<circle cx="10.7" cy="10.7" r="6.2"/><path d="m15.4 15.4 4.1 4.1"/>'),
  bell:lineIcon('<path d="M6.3 9.8a5.7 5.7 0 0 1 11.4 0v4.4l1.7 2.3H4.6l1.7-2.3V9.8Z"/><path d="M9.8 19.2a2.4 2.4 0 0 0 4.4 0"/>')
};

boot();

async function boot() {
  window.addEventListener('hashchange', () => { if(state.modal?.type==='activity') state.modal=null; state.mobileMenuOpen=false; state.userMenuOpen=false; state.notificationOpen=false; render(); });
  window.addEventListener('resize', () => { if (window.innerWidth > 767 && state.mobileMenuOpen) { state.mobileMenuOpen=false; document.documentElement.classList.remove('mobile-menu-open'); document.body.classList.remove('mobile-menu-open'); render(); } });
  document.addEventListener('click', handleClick);
  document.addEventListener('submit', handleSubmit);
  document.addEventListener('change', handleChange);
  document.addEventListener('input', handleInput);
  document.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase()==='k') {
      event.preventDefault();
      if (state.user && state.workspace) { state.modal={type:'search'}; state.searchQuery=''; render(); setTimeout(()=>document.getElementById('global-search-input')?.focus(),0); }
    }
    if (event.key==='Escape') {
      if (state.modal) { state.modal=null; state.searchQuery=''; render(); }
      else if (state.mobileMenuOpen || state.userMenuOpen || state.notificationOpen) { state.mobileMenuOpen=false; state.userMenuOpen=false; state.notificationOpen=false; render(); }
    }
  });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && state.user && !state.modal) smartSync({ force: true }); });
  window.addEventListener('focus', () => { if (state.user && state.workspace && !state.modal && !document.hidden) smartSync(); });

  const inviteToken = new URLSearchParams(location.search).get('invite');
  if (inviteToken) {
    try { state.invitePreview = first(await api.rpc('workspace_invite_public_preview', { p_token: inviteToken })); }
    catch (error) { state.invitePreview={error:humanError(error)}; }
  }

  const session = api.getSession();
  if (session) {
    try {
      state.user = normalizeUser(await api.getUser());
      await afterAuthenticated();
    } catch (error) {
      await api.signOut();
      state.user = null;
      showToast(humanError(error), true);
    }
  }
  state.loading = false;
  render();

  setInterval(() => {
    if (state.user && state.workspace && !state.modal && !document.hidden) smartSync();
  }, Math.max(15000, Number(config.syncProbeIntervalMs || 20000)));
}

async function afterAuthenticated() {
  state.profile = first(await api.select('profiles', `select=id,display_name,avatar_url&id=eq.${state.user.id}`));
  state.memberships = await api.select('workspace_members', `select=workspace_id,role,status,joined_at,access_mode,last_seen_at&user_id=eq.${state.user.id}&status=eq.active&order=joined_at.asc`);

  const inviteToken = new URLSearchParams(location.search).get('invite');
  if (inviteToken) {
    const preview = state.invitePreview?.workspace_name ? state.invitePreview : first(await api.rpc('workspace_invite_public_preview', { p_token: inviteToken }));
    state.invitePreview = preview || state.invitePreview;
    if (preview?.invite_status === 'pending') {
      if (String(preview.invited_email||'').toLowerCase() !== String(state.user.email||'').toLowerCase()) {
        state.modal={type:'invite-email-mismatch',preview,token:inviteToken};
      } else {
        const workspaceId=await api.rpc('accept_workspace_invite',{p_token:inviteToken});
        state.memberships=await api.select('workspace_members',`select=workspace_id,role,status,joined_at,access_mode,last_seen_at&user_id=eq.${state.user.id}&status=eq.active&order=joined_at.asc`);
        await selectWorkspace(workspaceId,{preserveModal:true});
        state.welcome={workspaceName:preview.workspace_name,role:preview.invite_role,projectNames:preview.project_names||[],accessMode:preview.access_mode};
        state.modal=null;
        history.replaceState({},'',location.pathname+'#/welcome');
        return;
      }
    }
  }

  if (state.memberships.length) {
    let workspaceId = localStorage.getItem(WORKSPACE_KEY);
    if (!state.memberships.some(m => m.workspace_id === workspaceId)) workspaceId = state.memberships[0].workspace_id;
    await selectWorkspace(workspaceId, { preserveModal: true });
  }
}

async function selectWorkspace(workspaceId, { preserveModal = false } = {}) {
  const membership = state.memberships.find(m => m.workspace_id === workspaceId);
  if (!membership) throw new Error('Espace inaccessible');
  localStorage.setItem(WORKSPACE_KEY, workspaceId);
  state.workspaceRole = membership.role;
  state.previousSeenAt = membership.last_seen_at || membership.joined_at || null;
  state.workspace = first(await api.select('workspaces', `select=*&id=eq.${workspaceId}`));
  if (!preserveModal) state.modal = null;
  state.projectCache.clear(); state.projectSummaries.clear(); state.messages.clear(); state.syncDigest=null; state.syncProbeAt=0; lastFullRefreshAt=0;
  await refreshWorkspace({ quiet: true });
  try {
    const marked = await api.rpc('mark_workspace_seen', { p_workspace_id: workspaceId });
    state.seenMarkedAt = Array.isArray(marked) ? marked[0] : marked;
    membership.last_seen_at = state.seenMarkedAt || new Date().toISOString();
  } catch (error) {
    console.warn('mark_workspace_seen failed', error);
  }
}

function syncDigestFromRows(rows){
  if(Array.isArray(rows)) return String(rows[0]?.digest||'');
  if(rows&&typeof rows==='object') return String(rows.digest||'');
  return typeof rows==='string'?rows:'';
}

async function smartSync({force=false}={}){
  if(!state.user||!state.workspace||state.modal||document.hidden)return;
  const now=Date.now();
  const minGap=Math.max(8000,Math.floor(Number(config.syncProbeIntervalMs||20000)/2));
  if(!force&&state.syncProbeAt&&now-state.syncProbeAt<minGap)return;
  if(smartSyncPromise)return smartSyncPromise;
  smartSyncPromise=(async()=>{
    state.syncProbeAt=Date.now();
    try{
      const rows=await api.rpc('get_workspace_sync_digest_v1',{p_workspace_id:state.workspace.id});
      const nextDigest=syncDigestFromRows(rows);
      if(!nextDigest)return;
      const changed=!state.syncDigest||nextDigest!==state.syncDigest;
      const fallbackMs=Math.max(300000,Number(config.fullRefreshFallbackMs||300000));
      const fallbackDue=!lastFullRefreshAt||Date.now()-lastFullRefreshAt>=fallbackMs;
      if(changed||fallbackDue){
        await refreshWorkspace({quiet:true});
      }else if(state.syncError){
        state.syncError=null;
        render();
      }
    }catch(error){
      const message=humanError(error);
      if(state.syncError!==message){state.syncError=message;render();}
    }
  })();
  try{return await smartSyncPromise;}finally{smartSyncPromise=null;}
}

async function refreshWorkspace(options={}){
  if(workspaceRefreshPromise)return workspaceRefreshPromise;
  workspaceRefreshPromise=refreshWorkspaceImpl(options);
  try{return await workspaceRefreshPromise;}finally{workspaceRefreshPromise=null;}
}

async function refreshWorkspaceImpl({ quiet = false } = {}) {
  if (!state.workspace) return;
  const wid = state.workspace.id;
  if (!quiet) state.loading = true;
  try {
    const [projects, archivedProjects, members, profiles, notifications, requests, approvals, meetings, meetingAttendees, actions, assignees, decisions, deliverables, deliverableVersions, conversations, conversationMembers, projectMembers, summaryRows, unreadRows, badgeRows, digestRows] = await Promise.all([
      api.select('projects', `select=*&workspace_id=eq.${wid}&status=neq.archived&order=updated_at.desc`),
      api.select('projects', `select=*&workspace_id=eq.${wid}&status=eq.archived&order=updated_at.desc`),
      api.select('workspace_members', `select=*&workspace_id=eq.${wid}&status=eq.active&order=joined_at.asc`),
      api.select('profiles', 'select=id,display_name,avatar_url&order=display_name.asc'),
      api.select('notifications', `select=*&workspace_id=eq.${wid}&user_id=eq.${state.user.id}&order=created_at.desc&limit=50`),
      api.select('requests', `select=*&workspace_id=eq.${wid}&order=created_at.desc&limit=100`),
      api.select('approvals', `select=*&workspace_id=eq.${wid}&order=created_at.desc&limit=100`),
      api.select('meetings', `select=*&workspace_id=eq.${wid}&order=starts_at.asc.nullslast&limit=100`),
      api.select('meeting_attendees', 'select=*'),
      api.select('actions', `select=*&workspace_id=eq.${wid}&order=created_at.desc&limit=250`),
      api.select('action_assignees', 'select=*'),
      api.select('decisions', `select=*&workspace_id=eq.${wid}&order=created_at.desc&limit=100`).catch(()=>[]),
      api.select('deliverables', `select=*&workspace_id=eq.${wid}&order=created_at.desc&limit=100`).catch(()=>[]),
      api.select('deliverable_versions', `select=*&workspace_id=eq.${wid}&order=created_at.desc&limit=100`).catch(()=>[]),
      api.select('conversations', `select=*&workspace_id=eq.${wid}&status=neq.archived&order=last_message_at.desc.nullslast,created_at.desc&limit=150`),
      api.select('conversation_members', 'select=*'),
      api.select('project_members', 'select=*'),
      api.rpc('get_project_summaries_v1', { p_workspace_id: wid }).catch(()=>[]),
      api.rpc('get_unread_conversations_v2', { p_workspace_id: wid }).catch(()=>[]),
      api.rpc('get_message_badges_v2', { p_workspace_id: wid }).catch(()=>[]),
      api.rpc('get_workspace_sync_digest_v1', { p_workspace_id: wid }).catch(()=>[])
    ]);
    Object.assign(state, { projects, archivedProjects, members, profiles, notifications, requests, approvals, meetings, meetingAttendees, actions, assignees, decisions, deliverables, deliverableVersions, conversations, conversationMembers, projectMembers });
    state.projectSummaries = new Map((Array.isArray(summaryRows)?summaryRows:[]).map(row=>[row.project_id,row]));
    state.syncDigest = syncDigestFromRows(digestRows) || state.syncDigest;
    state.unreadConversations = new Map((Array.isArray(unreadRows)?unreadRows:[]).map(row=>[row.conversation_id,Number(row.unread_count)||0]));
    const badges = first(Array.isArray(badgeRows)?badgeRows:[]) || {};
    state.unreadMessages = Number(badges.unread_messages)||0;
    state.unreadMentions = Number(badges.unread_mentions)||0;
    state.milestones = projects.length
      ? await api.select('milestones', `select=*&project_id=in.(${projects.map(p=>p.id).join(',')})&order=position.asc`)
      : [];
    state.projectCache = new Map(projects.map(project=>{
      const projectDeliverables=deliverables.filter(d=>d.project_id===project.id);
      const deliverableIds=new Set(projectDeliverables.map(d=>d.id));
      return [project.id,{
        milestones:state.milestones.filter(m=>m.project_id===project.id),
        decisions:decisions.filter(d=>d.project_id===project.id),
        deliverables:projectDeliverables,
        versions:deliverableVersions.filter(v=>deliverableIds.has(v.deliverable_id))
      }];
    }));
    state.lastSync = new Date();
    lastFullRefreshAt = Date.now();
    state.syncError = null;
  } catch (error) {
    state.syncError=humanError(error);
    if (!quiet) showToast(state.syncError, true);
  } finally {
    state.loading = false;
    if (!state.modal || quiet) render();
  }
}

function render() {
  document.documentElement.classList.toggle('mobile-menu-open', Boolean(state.mobileMenuOpen));
  document.body.classList.toggle('mobile-menu-open', Boolean(state.mobileMenuOpen));
  if (state.loading && !state.user) { app.innerHTML = loadingScreen(); return; }
  if (!state.user) { renderAuth(); return; }
  if (!state.memberships.length || !state.workspace) { renderOnboarding(); return; }

  const route = parseRoute();
  const content = route.name === 'welcome' ? renderWelcome()
    : route.name === 'dashboard' ? renderDashboard()
    : route.name === 'projects' ? renderProjects()
    : route.name === 'project' ? renderProject(route.id, route.tab, route.view)
    : route.name === 'work' ? renderMyWork()
    : route.name === 'messages' ? renderMessages(route.id)
    : route.name === 'calendar' ? renderCalendar()
    : route.name === 'library' ? renderLibrary()
    : route.name === 'team' ? renderTeam()
    : route.name === 'archives' ? renderArchives()
    : route.name === 'profile' ? renderProfile()
    : route.name === 'settings' ? renderSettings()
    : renderDashboard();

  app.innerHTML = shell(content, route);
  if (state.modal) app.insertAdjacentHTML('beforeend', renderModal(state.modal));
  renderToasts();
}

function shell(content, route) {
  const unread = state.notifications.filter(n => !n.read_at).length;
  const external=isExternalUser();
  const primaryNav = external
    ? [
        ['dashboard','Accueil',ICONS.dashboard,'#/dashboard'],
        ['projects','Projets',ICONS.projects,'#/projects'],
        ['calendar','Calendrier',ICONS.calendar,'#/calendar'],
        ['library','Fichiers',ICONS.library,'#/library']
      ]
    : [
        ['dashboard','Accueil',ICONS.dashboard,'#/dashboard'],
        ['projects','Projets',ICONS.projects,'#/projects'],
        ['work','Mon travail',ICONS.work,'#/work'],
        ['messages','Messages',ICONS.messages,'#/messages'],
        ['calendar','Calendrier',ICONS.calendar,'#/calendar'],
        ['library','Fichiers',ICONS.library,'#/library']
      ];
  const secondaryNav = external
    ? [['team','Équipe projet',ICONS.team,'#/team']]
    : [['team','Équipe',ICONS.team,'#/team'],['settings','Paramètres',ICONS.settings,'#/settings']];
  const active = key => route.name===key || (route.name==='project'&&key==='projects');
  const navHtml = primaryNav.map(([key,label,icon,href]) => `<a href="${href}" class="${active(key)?'active':''}"><span class="nav-icon">${icon}</span><span class="nav-label">${esc(label)}</span>${key==='work'&&attentionCount()?`<span class="nav-count">${attentionCount()}</span>`:''}</a>`).join('');
  const secondaryHtml = secondaryNav.map(([key,label,icon,href]) => `<a href="${href}" class="${active(key)?'active':''}"><span class="nav-icon">${icon}</span><span class="nav-label">${esc(label)}</span></a>`).join('');
  const recentProjects=state.projects.slice(0,3);
  const recentHtml=recentProjects.length?`<div class="sidebar-context"><div class="sidebar-section-label">PROJETS ACTIFS</div><div class="sidebar-projects">${recentProjects.map(p=>{const h=projectHealthInfo(p);return `<a href="#/projects/${p.id}/overview"><span class="project-dot ${h.tone}"></span><span>${esc(p.name)}</span></a>`}).join('')}${state.projects.length>3?`<a class="sidebar-all-projects" href="#/projects">Tous les projets <span>→</span></a>`:''}</div></div>`:'';
  const userMenu=state.userMenuOpen?`<div class="user-menu-panel"><div class="user-menu-head">${avatarHtml(state.user.id)}<div><strong>${esc(displayName(state.user.id))}</strong><small>${esc(state.user.email||'')}</small></div></div><a href="#/profile">Mon profil</a>${external?'':`<a href="#/settings">Paramètres de l’espace</a>`}<button data-action="signout">Se déconnecter</button></div>`:'';
  const mobilePrimary=primaryNav.map(([key,label,icon,href])=>`<a href="${href}" data-nav="${href}" class="${active(key)?'active':''}"><span class="nav-icon">${icon}</span><span class="mobile-nav-label">${esc(label)}</span>${key==='work'&&attentionCount()?`<b>${attentionCount()}</b>`:''}</a>`).join('');
  const mobileSecondary=secondaryNav.map(([key,label,icon,href])=>`<a href="${href}" data-nav="${href}" class="${active(key)?'active':''}"><span class="nav-icon">${icon}</span><span class="mobile-nav-label">${esc(label)}</span></a>`).join('');
  const mobileDrawer=state.mobileMenuOpen?`<div class="mobile-menu-backdrop" data-action="toggle-mobile-menu" aria-hidden="true"></div><aside class="mobile-drawer" id="mobile-navigation" role="dialog" aria-modal="true" aria-label="Navigation 2b2c"><div class="mobile-drawer-head">${brandHtml()}<button class="mobile-drawer-close" data-action="toggle-mobile-menu" aria-label="Fermer le menu"><span aria-hidden="true">×</span></button></div><div class="mobile-drawer-scroll"><div class="mobile-drawer-workspace"><small>${external?'Espace partagé':'Espace actif'}</small><strong>${esc(state.workspace.name)}</strong></div><button class="mobile-drawer-search" data-action="open-search"><span>${ICONS.search}</span><span>Rechercher dans ${BRAND_NAME}</span><kbd>Ctrl K</kbd></button><nav class="mobile-drawer-nav">${mobilePrimary}</nav>${recentProjects.length?`<div class="mobile-drawer-projects"><span class="sidebar-section-label">PROJETS ACTIFS</span>${recentProjects.map(p=>`<a href="#/projects/${p.id}/overview" data-nav="#/projects/${p.id}/overview"><span class="project-dot ${projectHealthInfo(p).tone}"></span>${esc(p.name)}</a>`).join('')}</div>`:''}<div class="mobile-drawer-secondary"><span class="sidebar-section-label">${external?'PARTAGE':'ESPACE'}</span><nav class="mobile-drawer-nav">${mobileSecondary}</nav></div></div><div class="mobile-drawer-foot"><a href="#/profile" data-nav="#/profile">${avatarHtml(state.user.id)}<div><strong>${esc(displayName(state.user.id))}</strong><small>${external?'Accès externe':'Mon profil'}</small></div></a><button data-action="signout"><span aria-hidden="true">↪</span> Se déconnecter</button></div></aside>`:'';
  const mobileTabs = external
    ? [['dashboard','Accueil',ICONS.dashboard,'#/dashboard'],['projects','Projets',ICONS.projects,'#/projects'],['calendar','Calendrier',ICONS.calendar,'#/calendar'],['library','Fichiers',ICONS.library,'#/library']]
    : [['dashboard','Accueil',ICONS.dashboard,'#/dashboard'],['projects','Projets',ICONS.projects,'#/projects'],['work','Mon travail',ICONS.work,'#/work'],['messages','Messages',ICONS.messages,'#/messages']];
  const mobileTabbar=`<nav class="v43-mobile-tabbar" aria-label="Navigation principale mobile">${mobileTabs.map(([key,label,icon,href])=>`<a href="${href}" class="${active(key)?'active':''}"><span>${icon}</span><small>${esc(label)}</small>${key==='work'&&attentionCount()?`<b>${attentionCount()}</b>`:''}${key==='messages'&&state.unreadMessages?`<b>${state.unreadMessages>99?'99+':state.unreadMessages}</b>`:''}</a>`).join('')}<button data-action="toggle-mobile-menu" aria-label="Plus"><span class="more-glyph">•••</span><small>Plus</small></button></nav>`;
  return `<div class="live-app live-shell v3-shell v41-shell v42-shell v421-shell v422-shell ${external?'external-shell':''}">
    <aside class="live-sidebar v41-sidebar v42-sidebar v421-sidebar">
      ${brandHtml()}
      <div class="live-workspace"><small>${external?'Espace partagé':'Espace actif'}</small><strong>${esc(state.workspace.name)}</strong>${external?'<span class="external-badge">Vue partenaire</span>':''}</div>
      <div class="sidebar-scroll-area"><nav class="live-nav primary-nav">${navHtml}</nav>${recentHtml}<div class="sidebar-space-section"><div class="sidebar-section-label">${external?'PARTAGE':'ESPACE'}</div><nav class="live-nav secondary">${secondaryHtml}</nav></div></div>
      <div class="live-sidebar-foot"><a class="live-user" href="#/profile">${avatarHtml(state.user.id,true)}<div class="live-user-meta"><strong>${esc(displayName(state.user.id))}</strong><small>${external?'Accès externe':'Mon profil'}</small></div></a><button class="sidebar-user-more" data-action="toggle-user-menu" aria-label="Menu utilisateur">•••</button></div>
    </aside>
    <main class="live-main">
      <header class="live-topbar v3-topbar v41-topbar v42-topbar">
        <div class="mobile-topbar-start"><button class="mobile-menu-button" data-action="toggle-mobile-menu" aria-label="Ouvrir le menu" aria-controls="mobile-navigation" aria-expanded="${state.mobileMenuOpen?'true':'false'}"><span></span><span></span><span></span></button><a class="mobile-top-brand" href="#/dashboard">${brandMarkHtml('compact')}<strong>${BRAND_NAME}</strong></a></div>
        <button class="compact-search" data-action="open-search"><span>${ICONS.search}</span><strong>Rechercher</strong><kbd>Ctrl K</kbd></button>
        ${state.syncError?`<button class="sync-alert-v432" data-action="retry-sync" title="${escAttr(state.syncError)}">Synchronisation interrompue · Réessayer</button>`:''}
        <div class="live-actions">
          ${external?'':`<button class="top-action-label call-button-v1" data-action="open-call-picker-v1" aria-label="Appeler"><span class="top-action-icon">${lineIcon('<rect x="4" y="6" width="12" height="12" rx="2"/><path d="m16 10 4-2v8l-4-2z"/>')}</span><span class="top-action-text">Appeler</span></button>`}
          <button class="top-action-label notification-button" data-action="toggle-notifications" aria-label="Notifications"><span class="top-action-icon">${ICONS.bell}</span><span class="top-action-text">Notifications</span>${unread?`<span class="badge inline-badge">${unread>99?'99+':unread}</span>`:''}</button>
          ${external?'':`<button class="btn primary quick-create-label" data-action="quick-add" aria-label="Créer">＋ Créer</button>`}
          <button class="top-profile top-profile-button" data-action="toggle-user-menu">${avatarHtml(state.user.id)}<span>${esc(firstName(displayName(state.user.id)))}</span><span class="chevron">⌄</span></button>
        </div>
        ${state.notificationOpen ? renderNotificationPanel() : ''}
        ${userMenu}
      </header>
      <div class="live-content v3-content">${content}</div>
    </main>
    ${mobileTabbar}
    ${mobileDrawer}
  </div>`;
}

function isExternalUser(){return state.workspaceRole==='guest'}
function projectMembership(projectId,userId=state.user?.id){return state.projectMembers.find(pm=>pm.project_id===projectId&&pm.user_id===userId)||null}
function canWriteProject(projectId){const project=state.projects.find(p=>p.id===projectId)||state.archivedProjects.find(p=>p.id===projectId);if(project&&project.status!=='active')return false;if(['owner','admin'].includes(state.workspaceRole))return true;if(state.workspaceRole!=='member')return false;const pm=projectMembership(projectId);return !!pm&&['lead','member'].includes(pm.role)}
function projectResponsibilityCount(userId){return state.projectMembers.filter(pm=>pm.user_id===userId&&['lead','member'].includes(pm.role)).length}
function deliverableStatusLabel(s){return({draft:'Brouillon',review:'En validation',approved:'Approuvé',archived:'Archivé'})[s]||s||'Brouillon'}
function meetingStatusLabel(s){return({planned:'Prévue',live:'En cours',completed:'Terminée',cancelled:'Annulée'})[s]||s||'Prévue'}
function approvalStatusLabel(s){return({pending:'En attente',approved:'Approuvée',changes_requested:'Modifications demandées',cancelled:'Annulée'})[s]||s}
function toLocalInput(v){if(!v)return'';const d=new Date(v);if(Number.isNaN(d.getTime()))return'';const pad=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`}
function projectMilestones(projectId){
  const cached=state.projectCache.get(projectId)?.milestones;
  return cached || state.milestones.filter(m=>m.project_id===projectId);
}
function assignedOpenActions(userId=state.user?.id){
  const ids=new Set(state.assignees.filter(a=>a.user_id===userId).map(a=>a.action_id));
  return state.actions.filter(a=>ids.has(a.id)&&!['done','cancelled'].includes(a.status));
}
function projectSummary(projectId){return state.projectSummaries.get(projectId)||null}
function projectStateReasonText(summary){
  if(!summary)return '';
  const blocked=Number(summary.action_blocked||0), overdue=Number(summary.action_overdue||0), milestoneOverdue=Number(summary.milestone_overdue||0);
  if(summary.state_code==='completed')return 'Projet terminé';
  if(summary.state_code==='on_hold')return 'Projet en pause';
  if(milestoneOverdue)return `${milestoneOverdue} phase${milestoneOverdue>1?'s':''} en retard`;
  if(blocked&&overdue)return `${blocked} action${blocked>1?'s':''} bloquée${blocked>1?'s':''} · ${overdue} en retard`;
  if(blocked)return `${blocked} action${blocked>1?'s':''} bloquée${blocked>1?'s':''}`;
  if(overdue)return `${overdue} action${overdue>1?'s':''} en retard`;
  if(summary.state_code==='off_track')return 'Date cible dépassée';
  return 'Aucun signal critique détecté';
}
function projectProgressInfo(project){
  const summary=projectSummary(project.id);
  if(summary){
    const progress=Math.max(0,Math.min(100,Number(summary.progress_pct||0)));
    const basis=summary.progress_basis;
    const label=basis==='roadmap'
      ? `${Number(summary.milestone_done||0)}/${Number(summary.milestone_count||0)} phase${Number(summary.milestone_count||0)>1?'s':''} terminée${Number(summary.milestone_done||0)>1?'s':''}`
      : basis==='actions'
        ? `${Number(summary.action_done||0)}/${Number(summary.action_count||0)} action${Number(summary.action_count||0)>1?'s':''} terminée${Number(summary.action_done||0)>1?'s':''}`
        : 'Projet à structurer';
    return {progress,label,source:basis||'server',summary};
  }
  const phases=projectMilestones(project.id);
  if(phases.length){const done=phases.filter(m=>m.status==='done').length;return{progress:Math.round(done/phases.length*100),label:`${done}/${phases.length} phase${phases.length>1?'s':''} terminée${done>1?'s':''}`,source:'phases'}};
  const actions=state.actions.filter(a=>a.project_id===project.id&&!['cancelled'].includes(a.status));
  if(actions.length){const done=actions.filter(a=>a.status==='done').length;return{progress:Math.round(done/actions.length*100),label:`${done}/${actions.length} action${actions.length>1?'s':''} terminée${done>1?'s':''}`,source:'actions'}};
  return {progress:null,label:'Progression non calculable',source:'none'};
}
function projectHealthInfo(project){
  const summary=projectSummary(project.id);
  if(summary){
    const reason=projectStateReasonText(summary);
    if(summary.state_code==='completed')return{tone:'good',label:'Terminé',reason};
    if(summary.state_code==='on_hold')return{tone:'blue',label:'En pause',reason};
    if(summary.state_code==='off_track')return{tone:'danger',label:'En difficulté',reason};
    if(summary.state_code==='at_risk')return{tone:'warn',label:'À surveiller',reason};
    return{tone:'good',label:'En bonne voie',reason};
  }
  const open=state.actions.filter(a=>a.project_id===project.id&&!['done','cancelled'].includes(a.status));
  const progress=projectProgressInfo(project).progress;
  const now=Date.now();
  const overdue=open.filter(a=>a.due_at&&new Date(a.due_at).getTime()<now);
  const blocked=open.filter(a=>a.status==='blocked');
  if(blocked.length)return{tone:'danger',label:'En difficulté',reason:`${blocked.length} blocage${blocked.length>1?'s':''} empêche${blocked.length>1?'nt':''} la progression`};
  const targetLate=project.target_date&&new Date(`${project.target_date}T23:59:59`).getTime()<now&&(progress??0)<100;
  if(targetLate||overdue.length||['at_risk','off_track'].includes(project.health))return{tone:'warn',label:'À surveiller',reason:overdue.length?`${overdue.length} échéance${overdue.length>1?'s':''} dépassée${overdue.length>1?'s':''}`:targetLate?'Date cible dépassée':'Risque signalé, progression encore possible'};
  if(projectMilestones(project.id).length||open.length||project.health==='on_track')return{tone:'good',label:'En bonne voie',reason:'Aucun problème significatif'};
  return{tone:'neutral',label:'À structurer',reason:'Pas encore assez de données'};
}
function attentionDueLabel(value){if(!value)return'';const d=new Date(value);if(Number.isNaN(d.getTime()))return'';const now=new Date();const same=d.toDateString()===now.toDateString();const tomorrow=new Date(now);tomorrow.setDate(now.getDate()+1);if(same)return`aujourd’hui ${new Intl.DateTimeFormat('fr-FR',{hour:'2-digit',minute:'2-digit'}).format(d)}`;if(d.toDateString()===tomorrow.toDateString())return`demain ${new Intl.DateTimeFormat('fr-FR',{hour:'2-digit',minute:'2-digit'}).format(d)}`;return formatDateTime(value)}
function attentionIcon(kind){return({Blocage:'!',Validation:'✓',Demande:'?',Action:'○',Préparation:'◷'})[kind]||'•'}
function homeActionKind(a){
  if(a.status==='blocked')return 'Blocage';
  const t=String(a.title||'').trim().toLowerCase();
  if(/^(valider|approuver|relire|vérifier|verifier)\b/.test(t))return 'Validation';
  if(/^(préparer|preparer|organiser|planifier)\b/.test(t))return 'Préparation';
  if(/^(répondre|repondre|donner un retour|faire un retour)\b/.test(t))return 'Demande';
  if(/^(décider|decider|choisir|confirmer|arbitrer)\b/.test(t))return 'Décision';
  return 'Action';
}
function personalAttentionItems(){
  const items=[];
  state.approvals.filter(a=>a.validator_id===state.user.id&&a.status==='pending').forEach(a=>items.push({key:`approval:${a.id}`,entityType:'approval',entityId:a.id,kind:'Validation',title:approvalTitle(a),projectId:a.project_id,tone:'blue',rank:0,byLabel:a.requested_by&&a.requested_by!==state.user.id?`demandé par ${displayName(a.requested_by)}`:'votre décision est attendue',byUserId:a.requested_by||null,dueAt:null}));
  state.requests.filter(r=>r.recipient_id===state.user.id&&r.status==='open').forEach(r=>items.push({key:`request:${r.id}`,entityType:'request',entityId:r.id,kind:'Demande',title:r.title,projectId:r.project_id,tone:'warn',rank:1,byLabel:r.requester_id&&r.requester_id!==state.user.id?`demandé par ${displayName(r.requester_id)}`:'une réponse est attendue',byUserId:r.requester_id||null,dueAt:r.due_at||null,preview:r.body||''}));
  assignedOpenActions().forEach(a=>{const overdue=a.due_at&&new Date(a.due_at)<new Date();const blocked=a.status==='blocked';items.push({key:`action:${a.id}`,entityType:'action',entityId:a.id,kind:homeActionKind(a),title:a.title,projectId:a.project_id,tone:blocked?'danger':overdue?'warn':a.priority==='urgent'?'blue':'',rank:blocked?2:overdue?3:4+priorityRank(a.priority),byLabel:a.created_by&&a.created_by!==state.user.id?`créé par ${displayName(a.created_by)}`:'',byUserId:a.created_by||null,dueAt:a.due_at||null,preview:blocked?(a.blocked_reason||'La progression est empêchée'):a.description||''})});
  return items.sort((a,b)=>a.rank-b.rank||new Date(a.dueAt||'2999')-new Date(b.dueAt||'2999')).slice(0,20);
}
function attentionOpenAttrs(x){if(x.entityType==='approval')return`data-action="open-approval" data-approval="${x.entityId}"`;if(x.entityType==='request')return`data-action="open-request" data-request="${x.entityId}"`;if(x.entityType==='meeting')return`data-action="open-meeting" data-meeting="${x.entityId}"`;if(x.entityType==='action'&&canWriteProject(x.projectId))return`data-action="edit-action" data-id="${x.entityId}"`;return`data-nav="#/projects/${x.projectId}/work/list"`}

function recentActivitySinceSeen(){
  const cutoff=state.previousSeenAt?new Date(state.previousSeenAt).getTime():0;
  const attentionKeys=new Set(personalAttentionItems().map(x=>x.key));
  const rows=[];
  state.notifications.filter(n=>new Date(n.created_at).getTime()>cutoff&&['mention','announcement','meeting'].includes(n.kind)).forEach(n=>rows.push({key:`notification:${n.id}`,audience:n.kind==='mention'?'you':'info',label:n.kind==='mention'?'Mention':'À savoir',title:n.title,sub:notificationKind(n.kind),when:relativeDate(new Date(n.created_at)),ts:new Date(n.created_at).getTime(),route:(n.route||'#/dashboard').startsWith('#')?(n.route||'#/dashboard'):'#'+(n.route||'/dashboard'),tone:n.kind==='mention'?'blue':''}));
  state.actions.filter(a=>new Date(a.updated_at||a.created_at).getTime()>cutoff).forEach(a=>{
    const assigned=state.assignees.some(x=>x.action_id===a.id&&x.user_id===state.user.id);
    const key=`action:${a.id}`;
    if(attentionKeys.has(key)) return;
    if(!['done','blocked'].includes(a.status)&&!assigned)return;
    rows.push({key,audience:assigned?'you':'info',label:a.status==='done'?'Résolu':assigned?'Pour vous':'À savoir',title:a.title,sub:`${projectName(a.project_id)} · ${statusLabel(a.status)}`,when:relativeDate(new Date(a.updated_at||a.created_at)),ts:new Date(a.updated_at||a.created_at).getTime(),route:`#/projects/${a.project_id}/work/list`,tone:a.status==='blocked'?'danger':a.status==='done'?'good':''});
  });
  state.milestones.filter(m=>m.status==='done'&&new Date(m.updated_at||m.created_at).getTime()>cutoff).forEach(m=>rows.push({key:`milestone:${m.id}`,audience:'info',label:'Étape terminée',title:m.title,sub:projectName(m.project_id),when:relativeDate(new Date(m.updated_at||m.created_at)),ts:new Date(m.updated_at||m.created_at).getTime(),route:`#/projects/${m.project_id}/work/roadmap`,tone:'good'}));
  state.decisions.filter(d=>d.status==='decided'&&new Date(d.decided_at||d.created_at).getTime()>cutoff).forEach(d=>rows.push({key:`decision:${d.id}`,audience:'info',label:'Décision',title:d.title,sub:`${projectName(d.project_id)}${d.decided_by?` · ${displayName(d.decided_by)}`:''}`,when:relativeDate(new Date(d.decided_at||d.created_at)),ts:new Date(d.decided_at||d.created_at).getTime(),route:d.project_id?`#/projects/${d.project_id}/overview`:'#/dashboard',tone:'blue'}));
  state.deliverableVersions.filter(v=>new Date(v.created_at).getTime()>cutoff).forEach(v=>{const d=state.deliverables.find(x=>x.id===v.deliverable_id);if(!d)return;rows.push({key:`file:${v.id}`,audience:'info',label:'Fichier',title:v.file_name||d.title,sub:`${projectName(d.project_id)}${v.created_by?` · ajouté par ${displayName(v.created_by)}`:''}`,when:relativeDate(new Date(v.created_at)),ts:new Date(v.created_at).getTime(),route:`#/projects/${d.project_id}/resources`,tone:''})});
  const seen=new Set();
  return rows.sort((a,b)=>b.ts-a.ts).filter(r=>{const sig=`${r.title}|${r.sub}`;if(seen.has(sig))return false;seen.add(sig);return true}).slice(0,20);
}

function renderAuth() {
  const invite=state.invitePreview?.workspace_name ? state.invitePreview : null;
  const signup = Boolean(invite && state.authMode === 'signup');
  const inviteProjects=invite?.project_names||[];
  const title=invite ? (signup?'Créer votre compte et rejoindre l’équipe':'Se connecter et rejoindre l’équipe') : 'Connexion';
  const subtitle=invite ? `${invite.workspace_name} vous attend dans ${BRAND_NAME}.` : 'Accédez à votre espace de travail sécurisé.';
  const fixedEmail=invite?.invited_email||'';
  app.innerHTML = `<div class="live-app auth-page v3-auth v422-auth">
    <section class="auth-visual"><div class="auth-brand-lockup">${brandHtml()}</div><div class="auth-hero-copy"><span class="auth-kicker">COLLABORER · DÉCIDER · AVANCER</span><h1>Comprendre.<br>Agir.<br>Avancer.</h1><p>Le contexte, les décisions, le travail et les échanges restent reliés au projet — sans dispersion.</p></div>
      <div class="auth-bullets"><div class="auth-bullet"><span class="auth-bullet-icon">01</span><div><strong>Situation claire</strong><small>Maintenant, Ensuite, blocages et jalons.</small></div></div><div class="auth-bullet"><span class="auth-bullet-icon">02</span><div><strong>Travail contextualisé</strong><small>Messages, actions et décisions restent liés.</small></div></div><div class="auth-bullet"><span class="auth-bullet-icon">03</span><div><strong>À traiter personnel</strong><small>Chacun voit ce qui exige son intervention.</small></div></div></div>
    </section>
    <section class="auth-panel"><div class="auth-card">${invite?`<div class="invite-banner"><span class="eyebrow">Invitation personnelle</span><strong>${esc(invite.workspace_name)}</strong><small>${inviteProjects.length?`Projets : ${esc(inviteProjects.join(' · '))}`:invite.access_mode==='all'?'Accès aux projets de l’espace':'Les projets seront attribués par votre équipe.'}</small></div>`:''}<span class="eyebrow">${invite?'Accès équipe':'Espace privé'}</span><h2>${esc(title)}</h2><p>${esc(subtitle)}</p>
      ${state.invitePreview?.error?`<div class="notice danger">${esc(state.invitePreview.error)}</div>`:''}
      <form data-form="auth"><div class="stack">${signup?`<div class="field"><label>Nom affiché</label><input name="displayName" autocomplete="name" required placeholder="Marc"></div>`:''}<div class="field"><label>Email</label><input id="auth-email" name="email" type="email" autocomplete="email" required ${invite?'readonly':''} value="${escAttr(fixedEmail)}"></div><div class="field"><div class="field-label-row"><label for="auth-password">Mot de passe</label></div><div class="password-field-wrap"><input id="auth-password" name="password" type="password" autocomplete="${signup?'new-password':'current-password'}" required minlength="8"><button class="password-toggle" type="button" data-action="toggle-password" aria-controls="auth-password" aria-pressed="false">Afficher</button></div></div></div><button class="btn primary wide" type="submit" style="margin-top:16px">${invite?(signup?'Créer mon compte et rejoindre':'Me connecter et rejoindre'):'Se connecter'}</button></form>
      ${invite?`<div class="auth-switch">${signup?'Déjà un compte ?':'Première connexion ?'} <button data-action="auth-switch">${signup?'Se connecter':'Créer mon compte'}</button></div>`:`<div class="private-access-note"><strong>Accès sur invitation</strong><span>Un nouveau membre rejoint 2b2c depuis le lien envoyé par un administrateur de l’espace.</span></div>`}
      ${invite?`<div class="auth-footnote">Cette invitation est réservée à <strong>${esc(invite.invited_email)}</strong>.</div>`:''}
    </div></section></div>`;
  renderToasts();
}
function renderOnboarding() {
  const inviteToken = new URLSearchParams(location.search).get('invite');
  if (inviteToken && state.invitePreview?.workspace_name) {
    app.innerHTML=`<div class="live-app onboarding"><div class="onboarding-card">${brandHtml({tagline:false})}<span class="eyebrow">Invitation</span><h1>Rejoindre ${esc(state.invitePreview.workspace_name)}</h1><p>Votre compte est authentifié, mais l’invitation n’a pas encore pu être appliquée.</p><button class="btn primary" data-action="accept-invite-direct">Réessayer de rejoindre l’espace</button></div></div>`;
  } else {
    app.innerHTML = `<div class="live-app onboarding"><div class="onboarding-card">${brandHtml({tagline:false})}<span class="eyebrow">Nouvel espace</span><h1>Créer votre espace de travail</h1><p>Un espace contient les projets et les personnes qui travaillent ensemble. Vous pourrez ensuite inviter vos associés.</p><form data-form="workspace"><div class="form-grid"><div class="field"><label>Nom de l’espace</label><input name="name" required value="2b2c — Équipe associés"></div><div class="field"><label>Identifiant URL</label><input name="slug" required pattern="[a-z0-9-]{3,64}" value="equipe-associes"></div></div><div class="modal-actions" style="justify-content:flex-start"><button class="btn primary" type="submit">Créer l’espace</button><button class="btn" type="button" data-action="signout">Changer de compte</button></div></form></div></div>`;
  }
  if (state.modal) app.insertAdjacentHTML('beforeend', renderModal(state.modal));
  renderToasts();
}

function upcomingDueItems(){
  const now=Date.now(), horizon=now+45*24*60*60*1000;
  const rows=[];
  state.milestones.filter(m=>m.due_date&&m.status!=='done'&&m.status!=='cancelled').forEach(m=>{
    const ts=new Date(`${m.due_date}T12:00:00`).getTime();
    if(ts>=now&&ts<=horizon) rows.push({title:m.title,project_id:m.project_id,due_at:m.due_date,route:`#/projects/${m.project_id}/work/roadmap`,kind:'Phase'});
  });
  state.projects.filter(p=>p.target_date&&p.status==='active').forEach(p=>{
    const ts=new Date(`${p.target_date}T12:00:00`).getTime();
    if(ts>=now&&ts<=horizon) rows.push({title:`Cible projet · ${p.name}`,project_id:p.id,due_at:p.target_date,route:`#/projects/${p.id}/overview`,kind:'Projet'});
  });
  const seen=new Set();
  return rows.sort((a,b)=>new Date(a.due_at)-new Date(b.due_at)).filter(x=>{const k=`${x.project_id}|${x.title}|${x.due_at}`;if(seen.has(k))return false;seen.add(k);return true}).slice(0,3);
}
function waitingOnTeamItems(){
  const rows=[];
  state.requests.filter(r=>r.requester_id===state.user.id&&r.recipient_id!==state.user.id&&r.status==='open').forEach(r=>rows.push({title:r.title,sub:`${displayName(r.recipient_id)} · réponse attendue`,route:r.project_id?`#/projects/${r.project_id}/overview`:'#/work'}));
  state.approvals.filter(a=>a.requested_by===state.user.id&&a.validator_id!==state.user.id&&a.status==='pending').forEach(a=>rows.push({title:approvalTitle(a),sub:`${displayName(a.validator_id)} · validation attendue`,route:`#/projects/${a.project_id}/resources`}));
  return rows.slice(0,3);
}

function homeUpcomingItems(){
  const rows=[];
  state.meetings.filter(m=>m.starts_at&&m.status!=='cancelled'&&new Date(m.starts_at)>new Date()&&(m.created_by===state.user.id||state.meetingAttendees.some(a=>a.meeting_id===m.id&&a.user_id===state.user.id&&a.response!=='declined'))).forEach(m=>rows.push({type:'meeting',id:m.id,title:m.title,projectId:m.project_id,ts:new Date(m.starts_at).getTime(),when:attentionDueLabel(m.starts_at),route:null}));
  upcomingDueItems().forEach(x=>rows.push({type:'due',title:x.title,projectId:x.project_id,ts:new Date(x.due_at.length===10?`${x.due_at}T12:00:00`:x.due_at).getTime(),when:x.due_at&&x.due_at.length===10?formatDate(x.due_at):attentionDueLabel(x.due_at),route:x.route,kind:x.kind}));
  const seen=new Set();
  return rows.sort((a,b)=>a.ts-b.ts).filter(x=>{const k=`${x.type}|${x.projectId}|${x.title}|${x.ts}`;if(seen.has(k))return false;seen.add(k);return true}).slice(0,5);
}
function homeMeetingPeople(meetingId){return state.meetingAttendees.filter(a=>a.meeting_id===meetingId&&a.response!=='declined').slice(0,4)}
function homeSummary(attention,upcoming){
  const parts=[];
  if(attention.length)parts.push(`${attention.length} élément${attention.length>1?'s':''} demande${attention.length>1?'nt':''} votre attention`);else parts.push('Vous êtes à jour');
  const difficult=state.projects.find(p=>projectHealthInfo(p).tone==='danger');if(difficult)parts.push(`${difficult.name} est en difficulté`);
  const nextMeeting=upcoming.find(x=>x.type==='meeting');if(nextMeeting)parts.push(`prochaine réunion ${nextMeeting.when}`);
  return parts.slice(0,3).join(' · ');
}
function projectResumeScore(p){
  if(state.approvals.some(a=>a.project_id===p.id&&a.validator_id===state.user.id&&a.status==='pending'))return 0;
  if(state.requests.some(r=>r.project_id===p.id&&r.recipient_id===state.user.id&&r.status==='open'))return 1;
  const mine=assignedOpenActions().filter(a=>a.project_id===p.id);if(mine.some(a=>a.status==='blocked'))return 2;
  if(mine.some(a=>a.due_at&&new Date(a.due_at).getTime()<Date.now()+2*86400000))return 3;
  if(projectHealthInfo(p).tone==='danger')return 4;
  if(mine.length)return 5;
  if(p.target_date&&new Date(`${p.target_date}T23:59:59`).getTime()<Date.now()+7*86400000)return 6;
  return 20;
}
function resumeProjects(){return state.projects.slice().sort((a,b)=>projectResumeScore(a)-projectResumeScore(b)||new Date(b.updated_at)-new Date(a.updated_at)).slice(0,3)}
function projectNextForUser(p){
  const approval=state.approvals.find(a=>a.project_id===p.id&&a.validator_id===state.user.id&&a.status==='pending');if(approval)return{label:'Votre prochaine intervention',title:approvalTitle(approval),when:'À valider',tone:'blue'};
  const request=state.requests.find(r=>r.project_id===p.id&&r.recipient_id===state.user.id&&r.status==='open');if(request)return{label:'Votre prochaine intervention',title:request.title,when:request.due_at?attentionDueLabel(request.due_at):'Réponse attendue',tone:'warn'};
  const mine=assignedOpenActions().filter(a=>a.project_id===p.id).sort((a,b)=>(a.status==='blocked'?-1:0)-(b.status==='blocked'?-1:0)||priorityRank(a.priority)-priorityRank(b.priority)||new Date(a.due_at||'2999')-new Date(b.due_at||'2999'))[0];if(mine)return{label:mine.status==='blocked'?'Blocage à résoudre':'Votre prochaine intervention',title:mine.title,when:mine.due_at?attentionDueLabel(mine.due_at):mine.status==='blocked'?'Progression empêchée':'À faire',tone:mine.status==='blocked'?'danger':''};
  const open=state.actions.filter(a=>a.project_id===p.id&&!['done','cancelled'].includes(a.status));for(const a of open){const assignee=state.assignees.find(x=>x.action_id===a.id)?.user_id;if(assignee&&assignee!==state.user.id)return{label:'Rien n’est attendu de vous',title:`${displayName(assignee)} travaille sur ${a.title}`,when:'',tone:'neutral'}}
  return{label:'Rien n’est attendu de vous',title:'Le projet avance sans intervention de votre part pour le moment.',when:'',tone:'neutral'};
}
function projectResumeCardV43(p){
  const health=projectHealthInfo(p),phases=projectMilestones(p.id),current=phases.find(m=>m.status==='active')||phases.find(m=>m.status==='todo'),next=projectNextForUser(p),people=projectPeople(p.id).slice(0,4),progressInfo=projectProgressInfo(p);
  const progress=progressInfo.progress===null?'Progression à structurer':`${progressInfo.progress}% · ${progressInfo.label}`;
  return `<a class="project-resume-card-v43" href="#/projects/${p.id}/overview"><div class="project-resume-top"><div><span class="project-symbol">${esc(p.name.slice(0,1).toUpperCase())}</span><div><h3>${esc(p.name)}</h3><small>${current?esc(current.title):phases.length?'Projet terminé':'À structurer'}</small></div></div><span class="pill ${health.tone}" title="${escAttr(health.reason)}">${health.label}</span></div><div class="project-resume-next ${next.tone}"><span>${esc(next.label)}</span><strong>${esc(next.title)}</strong>${next.when?`<small>${esc(next.when)}</small>`:''}</div>${people.length?`<div class="v435-project-people"><span>Équipe</span><span class="v435-avatar-stack">${people.map(pm=>avatarHtml(pm.user_id)).join('')}</span></div>`:''}<div class="project-resume-meta"><span>${esc(progress)}</span><span>${p.target_date?`cible ${formatDate(p.target_date)}`:'sans date cible'}</span></div></a>`;
}

function renderDashboard() {
  const attention=personalAttentionItems();
  const recent=recentActivitySinceSeen();
  const visibleRecent=recent.slice(0,5);
  const upcoming=homeUpcomingItems();
  const external=isExternalUser();
  const lastSeenLabel=state.previousSeenAt?`Depuis ${formatDateTime(state.previousSeenAt)}`:'Depuis votre arrivée dans l’espace';
  const visibleAttention=attention.slice(0,5);
  const projects=resumeProjects();
  const summary=homeSummary(attention,upcoming);
  return `<div class="home-head v43-home-head"><div><span class="eyebrow">Votre situation</span><h1>Bonjour ${esc(firstName(displayName(state.user.id)))}</h1><p>${esc(external?'Retrouvez ce qui vous a été partagé et ce qui attend votre décision.':summary)}</p></div></div>
    <div class="v43-home-grid">
      <div class="v43-main-flow">
        <section class="card v43-attention-card"><div class="section-head compact"><div><span class="eyebrow">À traiter maintenant</span><h2>${attention.length?`${attention.length} intervention${attention.length>1?'s':''} attendue${attention.length>1?'s':''}`:'Vous êtes à jour'}</h2></div><a class="section-link" href="#/work">Mon travail →</a></div>${visibleAttention.length?`<div class="attention-now-list v43-attention-list">${visibleAttention.map((x,i)=>`<button ${attentionOpenAttrs(x)} class="attention-now-row v43-attention-row ${i===0?'primary-row':''}"><span class="attention-type-icon ${x.tone}">${attentionIcon(x.kind)}</span><span class="attention-kind ${x.tone}">${esc(x.kind)}</span><div><strong>${esc(x.title)}</strong><small>${esc(projectName(x.projectId)||'Espace')}${x.byLabel?` · ${esc(x.byLabel)}`:''}${x.dueAt?` · ${esc(attentionDueLabel(x.dueAt))}`:''}</small></div>${x.byUserId&&x.byUserId!==state.user.id?`<span class="v435-person">${avatarHtml(x.byUserId)}</span>`:''}<span class="row-chevron">›</span></button>`).join('')}</div>${attention.length>5?`<a class="v43-list-more" href="#/work">Voir les ${attention.length-5} autres interventions →</a>`:''}`:`<div class="quiet-state v43-quiet"><strong>Rien ne demande votre intervention.</strong><span>Vous pouvez reprendre un projet sans urgence particulière.</span></div>`}</section>

        <section class="card v43-catchup-card ${recent.length?'':'is-empty'}"><div class="section-head compact"><div><span class="eyebrow">Depuis votre dernière visite</span><h2>${recent.length?'Ce qui change votre contexte':'Vous êtes à jour'}</h2><small class="section-context">${esc(lastSeenLabel)}</small></div>${recent.length>5?`<button class="section-link as-button" data-action="open-activity">Voir toute l’activité →</button>`:''}</div>${recent.length?`<div class="catchup-list-v41 v43-catchup-list">${visibleRecent.map(x=>`<a href="${x.route}" class="catchup-event-v41"><span class="change-tag ${x.audience} ${x.tone||''}">${x.label}</span><div><strong>${esc(x.title)}</strong><small>${esc(x.sub)} · ${x.when}</small></div><span class="row-chevron">›</span></a>`).join('')}</div>`:'<div class="v43-up-to-date"><span class="empty-glow-dot" aria-hidden="true"></span><span>Aucun changement important depuis votre dernière visite.</span></div>'}</section>

        <section class="v43-projects"><div class="section-head compact"><div><span class="eyebrow">Continuité</span><h2>Reprendre un projet</h2></div><a class="section-link" href="#/projects">Tous les projets →</a></div>${projects.length?`<div class="v43-project-grid">${projects.map(projectResumeCardV43).join('')}</div>`:empty('Votre espace est prêt',external?'Aucun projet ne vous a encore été partagé.':'Créez votre premier projet.')}</section>
      </div>

      <aside class="v43-rail-flow" aria-label="Aujourd’hui et à venir">
        <section class="card v43-upcoming-card ${upcoming.length?'':'is-empty'}"><div class="rail-card-head"><div><span class="eyebrow">Temps</span><h2>Aujourd’hui & à venir</h2></div><a class="section-link" href="#/calendar">Calendrier →</a></div>${upcoming.length?`<div class="v43-upcoming-list">${upcoming.map((x,i)=>x.type==='meeting'?`<button class="v43-upcoming-row meeting ${i===0?'next':''}" data-action="open-meeting" data-meeting="${x.id}"><span class="v43-time">${esc(x.when)}</span><div><strong>${esc(x.title)}</strong><small>${esc(projectName(x.projectId)||'Espace')}</small>${homeMeetingPeople(x.id).length?`<span class="v43-attendees">${homeMeetingPeople(x.id).map(a=>avatarHtml(a.user_id)).join('')}</span>`:''}</div><span class="row-chevron">›</span></button>`:`<a class="v43-upcoming-row" href="${x.route}"><span class="v43-time">${esc(x.when)}</span><div><strong>${esc(x.title)}</strong><small>${esc(projectName(x.projectId)||'Espace')}${x.kind?` · ${esc(x.kind)}`:''}</small></div><span class="row-chevron">›</span></a>`).join('')}</div>${upcoming.length>3?`<a class="v435-upcoming-more" href="#/calendar">Voir les ${upcoming.length-3} suivants →</a>`:''}`:`<div class="v43-upcoming-empty"><strong>Rien d’urgent à venir.</strong><span>Le calendrier reste disponible si vous voulez planifier la suite.</span></div>`}</section>
      </aside>
    </div>`;
}
function renderProjects() {
  return `<div class="section-head page-head-v3"><div><span class="eyebrow">Portefeuille</span><h1>Projets</h1><p>Une vue courte des projets actifs. Ouvrez un projet pour comprendre sa situation avant de regarder les tâches.</p></div><div class="page-head-actions-v43"><a class="btn" href="#/archives">Archives</a><button class="btn primary" data-action="new-project">＋ Nouveau projet</button></div></div>${state.projects.length?`<div class="project-grid-v3">${state.projects.map(projectCardV3).join('')}</div>`:empty('Aucun projet actif','Créez votre premier projet.')}`;
}

function renderProject(id, tab='overview', view='list') {
  const project = state.projects.find(p => p.id === id);
  if (!project) return empty('Projet introuvable','Vous n’avez peut-être plus accès à ce projet.');
  if (!state.projectCache.has(id)) loadProject(id);
  const actions = state.actions.filter(a=>a.project_id===id);
  const milestones = state.projectCache.get(id)?.milestones || [];
  const done = actions.filter(a=>a.status==='done').length;
  const progress = projectProgressInfo(project).progress ?? 0;
  const external=isExternalUser();
  const tabs = external ? [['overview','Vue partagée'],['resources','Livrables'],['meetings','Réunions']] : [['overview','Vue d’ensemble'],['work','Travail'],['messages','Messages'],['resources','Ressources'],['meetings','Réunions']];
  if(external && !tabs.some(([key])=>key===tab)) tab='overview';
  const people=projectPeople(id);
  const canManageProject = canWriteProject(id);
  const derivedHealth = projectHealthInfo(project);
  const head = `<div class="project-head-v3"><div class="project-breadcrumb"><a href="#/projects">Projets</a><span>›</span><span>${esc(project.name)}</span></div><div class="project-title-row"><div class="project-title-main"><div class="project-icon">${esc(project.name.slice(0,1).toUpperCase())}</div><div><div class="project-title-line"><h1>${esc(project.name)}</h1><span class="pill ${derivedHealth.tone}" title="${escAttr(derivedHealth.reason)}">${derivedHealth.label}</span>${external?'<span class="pill blue">Vue partenaire</span>':''}</div><p>${esc(project.objective || 'Aucun objectif renseigné.')}</p><div class="project-people">${people.length?people.slice(0,5).map(pm=>avatarHtml(pm.user_id)).join(''):''}${people.length>5?`<span class="avatar more">+${people.length-5}</span>`:''}<span>${people.length?`${people.length} participant${people.length>1?'s':''}`:'Aucun participant assigné'}</span></div></div></div><div class="project-head-actions">${!external&&['owner','admin'].includes(state.workspaceRole)?`<button class="btn" data-action="invite-member" data-project="${project.id}">Partager</button>`:''}${canManageProject&&!external?`<button class="btn" data-action="edit-project" data-project="${project.id}">Modifier</button>`:''}${!external&&['owner','admin'].includes(state.workspaceRole)?`<button class="btn icon-only" data-action="manage-project" data-project="${project.id}" aria-label="Gérer le projet">•••</button>`:''}</div></div><div class="tabs project-tabs">${tabs.map(([key,label])=>`<a href="#/projects/${id}/${key}" class="${tab===key?'active':''}">${label}</a>`).join('')}</div></div>`;
  if (tab==='work'&&!external) return head + projectWork(project, actions, milestones, view);
  if (tab==='messages'&&!external) return head + projectMessages(project);
  if (tab==='meetings') return head + projectMeetings(project);
  if (tab==='resources') return head + projectResources(project);
  return head + (external?projectExternalOverview(project,actions,milestones,progress):projectOverview(project, actions, milestones, progress));
}

function projectServerSummaryCard(project){
  const summary=projectSummary(project.id);if(!summary)return '';
  const progress=projectProgressInfo(project),health=projectHealthInfo(project);
  const openActions=Number(summary.action_open||0),openMilestones=Number(summary.milestone_open||0),blocked=Number(summary.action_blocked||0),overdue=Number(summary.action_overdue||0)+Number(summary.milestone_overdue||0);
  const signals=[];if(blocked)signals.push(`${blocked} bloquée${blocked>1?'s':''}`);if(overdue)signals.push(`${overdue} en retard`);if(!signals.length)signals.push('aucun signal critique');
  return `<div class="card situation-card"><div class="section-head compact"><div><span class="eyebrow">État calculé</span><h2>${health.label}</h2></div><strong>${progress.progress??0}%</strong></div><p class="situation-copy">${esc(health.reason)}</p><div class="project-progress-row"><span>${esc(progress.label)}</span><span>${openActions} action${openActions>1?'s':''} ouverte${openActions>1?'s':''} · ${openMilestones} phase${openMilestones>1?'s':''} ouverte${openMilestones>1?'s':''}</span></div><div class="progress"><span style="width:${progress.progress??0}%"></span></div><div class="metric-label" style="margin-top:10px">${esc(signals.join(' · '))}</div></div>`;
}

function projectOverview(project, actions, milestones, progress) {
  const cache=state.projectCache.get(project.id)||{};
  const decisions=(cache.decisions||[]).slice(0,3);
  const deliverables=(cache.deliverables||[]).slice(0,4);
  const blocking=actions.filter(a=>a.status==='blocked');
  const current=milestones.find(m=>m.status==='active') || milestones.find(m=>m.status==='todo') || milestones[milestones.length-1];
  const currentIndex=current?milestones.findIndex(m=>m.id===current.id):-1;
  const nextPhase=currentIndex>=0?milestones.slice(currentIndex+1).find(m=>m.status!=='cancelled'):milestones.find(m=>m.status==='todo');
  const open=actions.filter(a=>!['done','cancelled'].includes(a.status));
  const mine=open.filter(a=>state.assignees.some(x=>x.action_id===a.id&&x.user_id===state.user.id));
  const pendingApproval=state.approvals.find(a=>a.project_id===project.id&&a.validator_id===state.user.id&&a.status==='pending');
  const pendingRequest=state.requests.find(r=>r.project_id===project.id&&r.recipient_id===state.user.id&&r.status==='open');
  const nowAction=mine.slice().sort((a,b)=>priorityRank(a.priority)-priorityRank(b.priority)||new Date(a.due_at||'2999')-new Date(b.due_at||'2999'))[0] || open[0];
  const nextAction=open.filter(a=>!nowAction||a.id!==nowAction.id).sort((a,b)=>new Date(a.due_at||'2999')-new Date(b.due_at||'2999'))[0];
  const meetings=state.meetings.filter(m=>m.project_id===project.id&&m.starts_at&&new Date(m.starts_at)>new Date()).sort((a,b)=>new Date(a.starts_at)-new Date(b.starts_at));
  const situation=projectSituationText(project,current,open,blocking,pendingApproval,pendingRequest);
  return `<div class="project-room-layout"><section class="stack">${projectServerSummaryCard(project)}
      <div class="card situation-card"><div class="section-head compact"><div><span class="eyebrow">Situation actuelle</span><h2>${esc(situation.title)}</h2></div><span class="updated-note">${project.updated_at?`Mis à jour ${relativeDate(new Date(project.updated_at))}`:'À jour'}</span></div><p class="situation-copy">${esc(situation.body)}</p>${milestones.length?progressTrack(milestones):`<div class="empty compact-empty"><strong>Roadmap à structurer</strong><span>Créez 3 à 7 phases pour rendre le parcours du projet lisible.</span></div>`}</div>
      <div class="project-kpi-grid"><a class="mini-status-card ${pendingApproval?'attention':''}" href="#/work"><span>Votre attention</span><strong>${pendingApproval?'1 validation':pendingRequest?'1 demande':mine.length?`${mine.length} action${mine.length>1?'s':''}`:'Rien d’urgent'}</strong><small>${pendingApproval?'Une version attend votre décision':pendingRequest?esc(pendingRequest.title):mine[0]?esc(mine[0].title):'Vous êtes à jour'}</small></a><a class="mini-status-card ${blocking.length?'danger':''}" href="#/projects/${project.id}/work/board"><span>Blocages</span><strong>${blocking.length||'Aucun'}</strong><small>${blocking[0]?esc(blocking[0].title):'Le projet peut avancer'}</small></a><a class="mini-status-card" href="#/projects/${project.id}/work/roadmap"><span>Prochain jalon</span><strong>${esc(nextPhase?.title||current?.title||'À définir')}</strong><small>${nextPhase?.due_date?`Cible : ${formatDate(nextPhase.due_date)}`:current?.due_date?`Cible : ${formatDate(current.due_date)}`:'Sans date cible'}</small></a></div>
      <div class="grid cols-2 v3-lower-grid"><div class="card"><div class="section-head compact"><h3>Dernière décision</h3>${canWriteProject(project.id)?`<button class="section-link" data-action="new-decision" data-project="${project.id}">＋ Décision</button>`:''}</div>${decisions[0]?`<div class="memory-row"><strong>${esc(decisions[0].title)}</strong><p>${esc(decisions[0].rationale||'')}</p><small>${decisions[0].decided_at?formatDate(decisions[0].decided_at):formatDate(decisions[0].created_at)}</small></div>`:empty('Aucune décision','Consignez les choix importants et leur raison.')}</div><div class="card"><div class="section-head compact"><h3>Prochaine réunion</h3><a class="section-link" href="#/projects/${project.id}/meetings">Réunions →</a></div>${meetings[0]?meetingRow(meetings[0]):empty('Aucune réunion','Planifiez un point uniquement si nécessaire.')}</div></div>
      <div class="card"><div class="section-head compact"><h3>Livrables récents</h3><a class="section-link" href="#/projects/${project.id}/resources">Voir tout →</a></div>${deliverables.length?`<div class="deliverable-strip">${deliverables.map(d=>`<div class="deliverable-mini"><div class="file-thumb">${fileGlyph(d.title)}</div><strong>${esc(d.title)}</strong><small>${deliverableStatusLabel(d.status||'draft')}</small></div>`).join('')}</div>`:empty('Aucun livrable','Ajoutez les fichiers qui matérialisent l’avancement du projet.')}</div>
    </section>
    <aside class="project-context-rail stack"><div class="now-card"><div class="context-top"><span class="context-icon primary">↯</span><div><div class="context-label">Maintenant</div><span class="pill ${pendingApproval?'blue':pendingRequest?'warn':nowAction?statusTone(nowAction.status):''}">${pendingApproval?'En validation':pendingRequest?'Demande':nowAction?statusLabel(nowAction.status):'À jour'}</span></div></div><div class="context-title">${esc(pendingApproval?'Examiner la validation':pendingRequest?pendingRequest.title:nowAction?.title||'Aucune action prioritaire')}</div><div class="context-sub">${esc(pendingApproval?'Votre décision débloque la suite du projet.':pendingRequest?pendingRequest.body||'Une réponse est attendue.':nowAction?`${nowAction.description||'Action du projet.'}${nowAction.due_at?` · ${formatDateTime(nowAction.due_at)}`:''}`:'Le projet ne nécessite rien de vous pour le moment.')}</div>${pendingApproval?`<div class="context-actions"><button class="btn primary" data-action="open-approval" data-approval="${pendingApproval.id}">Examiner →</button></div>`:pendingRequest?`<div class="context-actions"><button class="btn primary" data-action="open-request" data-request="${pendingRequest.id}">Répondre →</button></div>`:nowAction?`<div class="context-actions"><a class="btn primary" href="#/projects/${project.id}/work/list">Ouvrir →</a></div>`:''}</div>
      <div class="next-card"><div class="context-top"><span class="context-icon neutral">→</span><div class="context-label neutral">Ensuite</div></div><div class="context-title">${esc(nextAction?.title||nextPhase?.title||'Définir la prochaine étape')}</div><div class="context-sub">${nextAction?.due_at?formatDateTime(nextAction.due_at):nextPhase?.due_date?`Jalon cible : ${formatDate(nextPhase.due_date)}`:'La roadmap déterminera la suite.'}</div></div>
      <div class="card project-summary-card"><div><span>Avancement</span><strong>${progress}%</strong></div><div class="progress"><span style="width:${progress}%"></span></div><div class="project-summary-meta"><span>${open.length} action${open.length>1?'s':''} ouverte${open.length>1?'s':''}</span><span>${project.target_date?`Cible ${formatDate(project.target_date)}`:'Sans date cible'}</span></div></div></aside></div>`;
}

function projectExternalOverview(project, actions, milestones, progress) {
  const cache=state.projectCache.get(project.id)||{};
  const deliverables=(cache.deliverables||[]).filter(d=>d.visibility==='shared');
  const approvals=state.approvals.filter(a=>a.project_id===project.id&&a.validator_id===state.user.id&&a.status==='pending');
  const meetings=state.meetings.filter(m=>m.project_id===project.id).sort((a,b)=>new Date(a.starts_at||'2999')-new Date(b.starts_at||'2999'));
  const nextMeeting=meetings.find(m=>m.starts_at&&new Date(m.starts_at)>new Date());
  const current=milestones.find(m=>m.status==='active')||milestones.find(m=>m.status==='todo');
  return `<div class="external-project-view"><div class="external-intro card"><span class="eyebrow">Vue partagée</span><h2>Ce que l’équipe partage avec vous</h2><p>Les discussions internes, décisions privées et tâches non partagées restent invisibles. Cette vue contient uniquement les éléments utiles à votre collaboration.</p></div>
    <div class="grid cols-3 external-summary"><div class="card"><span class="eyebrow">Avancement partagé</span><div class="metric">${progress}%</div><div class="progress"><span style="width:${progress}%"></span></div></div><div class="card"><span class="eyebrow">Étape actuelle</span><h3>${esc(current?.title||'À définir')}</h3><p class="metric-label">${current?.due_date?`Cible ${formatDate(current.due_date)}`:'Aucune date partagée'}</p></div><div class="card ${approvals.length?'external-attention':''}"><span class="eyebrow">Votre attention</span><h3>${approvals.length?`${approvals.length} validation${approvals.length>1?'s':''}`:'Rien à valider'}</h3>${approvals[0]?`<button class="btn primary small" data-action="open-approval" data-approval="${approvals[0].id}">Examiner</button>`:''}</div></div>
    <div class="grid cols-2"><div class="card"><div class="section-head compact"><h3>Livrables partagés</h3><a class="section-link" href="#/projects/${project.id}/resources">Tout voir →</a></div>${deliverables.length?`<div class="stack">${deliverables.slice(0,5).map(d=>`<div class="list-row"><span class="file-thumb compact-file">${fileGlyph(d.title)}</span><div class="list-main"><strong>${esc(d.title)}</strong><small>${deliverableStatusLabel(d.status)}</small></div></div>`).join('')}</div>`:empty('Aucun livrable partagé','L’équipe n’a encore rien publié dans votre vue.')}</div><div class="card"><div class="section-head compact"><h3>Prochain point</h3></div>${nextMeeting?meetingRow(nextMeeting,true):empty('Aucune réunion partagée','Aucun point n’est planifié pour le moment.')}</div></div></div>`;
}

function projectRoadmap(project, actions, milestones) {
  const orphan = actions.filter(a=>!a.milestone_id);
  const phases = [...milestones].sort((a,b)=>(a.position||0)-(b.position||0));
  const writable=canWriteProject(project.id);
  const phaseHtml = phases.map((m,index)=>{
    const phaseActions=actions.filter(a=>a.milestone_id===m.id);
    const done=phaseActions.filter(a=>a.status==='done').length;
    const blocked=phaseActions.filter(a=>a.status==='blocked').length;
    const progress=phaseActions.length?Math.round(done/phaseActions.length*100):(m.status==='done'?100:0);
    const owner=m.owner_id?displayName(m.owner_id):'Non assigné';
    return `<article class="roadmap-phase"><div class="roadmap-index">${String(index+1).padStart(2,'0')}</div><div class="roadmap-body"><div class="roadmap-head"><div><div class="roadmap-title-line"><span class="pill ${m.status==='done'?'good':m.status==='active'?'blue':''}">${milestoneLabel(m.status)}</span><h3>${esc(m.title)}</h3>${m.visibility==='shared'?'<span class="pill">Partagé</span>':''}</div><p>${esc(m.description||'Résultat attendu à préciser.')}</p></div>${writable?`<button class="btn small" data-action="edit-milestone" data-project="${project.id}" data-milestone="${m.id}">Modifier</button>`:''}</div><div class="roadmap-meta"><span>Responsable · ${esc(owner)}</span><span>${m.start_date?formatDate(m.start_date):'Début à définir'} → ${m.due_date?formatDate(m.due_date):'fin à définir'}</span><span>${phaseActions.length} action${phaseActions.length>1?'s':''}${blocked?` · ${blocked} bloquée${blocked>1?'s':''}`:''}</span></div><div class="progress"><span style="width:${progress}%"></span></div><div class="roadmap-actions">${phaseActions.length?phaseActions.map(a=>actionRow(a,writable,phases)).join(''):empty('Aucune action dans cette phase','Ajoutez les actions concrètes nécessaires pour franchir cette étape.')}</div>${writable?`<div class="roadmap-footer"><button class="btn small primary" data-action="new-action" data-project="${project.id}" data-milestone="${m.id}">＋ Action dans cette phase</button></div>`:''}</div></article>`;
  }).join('');
  return `<div class="roadmap-toolbar"><div><h2>Roadmap opérationnelle</h2><p>Phases, résultats attendus, actions, responsables, dates et blocages dans une seule lecture.</p></div>${writable?`<button class="btn primary" data-action="new-milestone" data-project="${project.id}">＋ Nouvelle phase</button>`:''}</div><div class="roadmap">${phaseHtml || empty('Roadmap vide','Commencez par 3 à 7 phases qui décrivent le parcours du projet jusqu’à sa clôture.')}</div>${orphan.length?`<div class="card" style="margin-top:16px"><div class="card-head"><h2>Actions hors roadmap</h2></div><div class="stack">${orphan.map(a=>actionRow(a,writable,phases)).join('')}</div></div>`:''}`;
}

function roadmapMiniRow(m,actions){
  const phaseActions=actions.filter(a=>a.milestone_id===m.id);
  const done=phaseActions.filter(a=>a.status==='done').length;
  const progress=phaseActions.length?Math.round(done/phaseActions.length*100):(m.status==='done'?100:0);
  return `<div class="list-row"><span class="pill ${m.status==='done'?'good':m.status==='active'?'blue':''}">${milestoneLabel(m.status)}</span><div class="list-main"><strong>${esc(m.title)}</strong><small>${progress}% · ${m.due_date?`cible ${formatDate(m.due_date)}`:'sans date'}</small></div></div>`;
}

function projectWork(project, actions, milestones, view='list') {
  const allowed=['list','roadmap','board','calendar']; if(!allowed.includes(view)) view='list';
  const views=[['list','Liste'],['roadmap','Roadmap'],['board','Tableau'],['calendar','Calendrier']];
  const writable=canWriteProject(project.id);
  const toolbar=`<div class="work-toolbar"><div><h2>Travail</h2><p>Quatre vues du même travail — chaque action conserve sa phase, son responsable et son contexte.</p></div>${writable?`<button class="btn primary" data-action="new-action" data-project="${project.id}">＋ Action</button>`:''}</div><div class="work-view-tabs">${views.map(([k,l])=>`<a class="${view===k?'active':''}" href="#/projects/${project.id}/work/${k}">${l}</a>`).join('')}</div>`;
  if(view==='roadmap') return toolbar+projectRoadmap(project,actions,milestones);
  if(view==='board') { const cols=[['todo','À faire'],['in_progress','En cours'],['blocked','Bloqué'],['done','Terminé']]; return toolbar+`<div class="kanban-v3">${cols.map(([st,label])=>`<section class="kanban-col-v3"><div class="kanban-head-v3"><strong>${label}</strong><span>${actions.filter(a=>a.status===st).length}</span></div>${actions.filter(a=>a.status===st).map(a=>`<button class="kanban-card-v3 ${writable?'clickable-card':''}" ${writable?`data-action="edit-action" data-id="${a.id}"`:'disabled'}><strong>${esc(a.title)}</strong><small>${esc(milestones.find(m=>m.id===a.milestone_id)?.title||'Hors roadmap')}${a.due_at?` · ${formatDate(a.due_at)}`:''}</small><span class="pill ${statusTone(a.status)}">${statusLabel(a.status)}</span></button>`).join('')}</section>`).join('')}</div>`; }
  if(view==='calendar') { const dated=actions.filter(a=>a.due_at).sort((a,b)=>new Date(a.due_at)-new Date(b.due_at)); return toolbar+`<div class="card"><div class="timeline-list">${dated.length?dated.map(a=>`<div class="timeline-row"><div class="timeline-date"><strong>${formatDay(a.due_at)}</strong><small>${formatDate(a.due_at)}</small></div><div class="timeline-line"></div><div class="timeline-content">${actionRow(a,writable,milestones)}</div></div>`).join(''):empty('Aucune échéance','Ajoutez des dates aux actions pour construire le calendrier du projet.')}</div></div>`; }
  const grouped=milestones.map(m=>({m,items:actions.filter(a=>a.milestone_id===m.id)})).filter(g=>g.items.length); const orphan=actions.filter(a=>!a.milestone_id);
  return toolbar+`<div class="stack work-list-v3">${grouped.map(g=>`<section class="card work-group"><div class="section-head compact"><div><span class="eyebrow">${milestoneLabel(g.m.status)}</span><h3>${esc(g.m.title)}</h3></div><a class="section-link" href="#/projects/${project.id}/work/roadmap">Voir la phase →</a></div><div class="stack">${g.items.map(a=>actionRow(a,writable,milestones)).join('')}</div></section>`).join('')}${orphan.length?`<section class="card work-group"><div class="section-head compact"><h3>Hors roadmap</h3></div><div class="stack">${orphan.map(a=>actionRow(a,writable,milestones)).join('')}</div></section>`:''}${!actions.length?empty('Aucune action','Créez la première action du projet.'):''}</div>`;
}

function projectMessages(project) {
  const conversations = state.conversations.filter(c=>c.project_id===project.id);
  const conversation = conversations.find(c=>c.is_general) || conversations[0];
  if (!conversation) return `<div class="card">${empty('Conversation en préparation','Rechargez le projet ou créez une nouvelle conversation.')}</div>`;
  if (!state.messages.has(conversation.id)||state.unreadConversations.get(conversation.id)) loadMessages(conversation.id,true);
  const messages = state.messages.get(conversation.id) || [];
  return `<div class="card chat"><div class="chat-log">${messages.length?messages.map(messageBubble).join(''):empty('Aucun message','Écrivez le premier message lié à ce projet.')}</div><form class="chat-form" data-form="message"><input type="hidden" name="conversationId" value="${conversation.id}"><input type="hidden" name="workspaceId" value="${project.workspace_id}"><textarea name="body" required maxlength="20000" placeholder="Écrire dans ${esc(conversation.title)}…"></textarea><button class="btn primary" type="submit">Envoyer</button></form></div>`;
}

function projectDecisions(project) {
  const decisions = state.projectCache.get(project.id)?.decisions || [];
  return `<div class="card"><div class="card-head"><div><h2>Décisions</h2><div class="metric-label">Une mémoire explicite des choix qui structurent le projet.</div></div><button class="btn primary" data-action="new-decision" data-project="${project.id}">＋ Décision</button></div>${decisions.length?`<div class="stack">${decisions.map(d=>`<div class="list-row"><span class="pill ${d.status==='decided'?'good':'blue'}">${decisionLabel(d.status)}</span><div class="list-main"><strong>${esc(d.title)}</strong><small>${esc(d.rationale||'Sans justification')} · ${formatDateTime(d.decided_at||d.created_at)}</small></div></div>`).join('')}</div>`:empty('Aucune décision enregistrée','Consignez les choix importants au moment où ils sont pris.')}</div>`;
}

function projectMeetings(project) {
  const meetings = state.meetings.filter(m=>m.project_id===project.id).sort((a,b)=>new Date(a.starts_at||'2999')-new Date(b.starts_at||'2999'));
  const writable=canWriteProject(project.id);
  const upcoming=meetings.filter(m=>!['completed','cancelled'].includes(m.status));
  const past=meetings.filter(m=>['completed','cancelled'].includes(m.status));
  return `<div class="section-head page-head-v3"><div><span class="eyebrow">Synchroniser seulement quand c’est utile</span><h2>Réunions</h2><p>Chaque réunion garde son avant, son live et les décisions qui en sortent.</p></div>${writable?`<button class="btn primary" data-action="new-meeting" data-project="${project.id}">＋ Réunion</button>`:''}</div>
    <div class="meeting-stage-mini"><span><b>1</b> Avant · objectif & agenda</span><span><b>2</b> Live · notes & décisions</span><span><b>3</b> Après · synthèse & actions</span></div>
    <div class="grid cols-2 v3-lower-grid"><div class="card"><div class="section-head compact"><h3>À venir / en cours</h3><span class="metric-label">${upcoming.length}</span></div>${upcoming.length?`<div class="meeting-list-v4">${upcoming.map(m=>meetingRow(m,true)).join('')}</div>`:empty('Aucun point planifié','Ne créez une réunion que lorsqu’un échange synchrone apporte de la valeur.')}</div><div class="card"><div class="section-head compact"><h3>Historique</h3><span class="metric-label">${past.length}</span></div>${past.length?`<div class="meeting-list-v4">${past.slice().reverse().map(m=>meetingRow(m,true)).join('')}</div>`:empty('Aucune réunion terminée','Les synthèses resteront ici comme mémoire du projet.')}</div></div>`;
}

function projectResources(project) {
  const cache = state.projectCache.get(project.id) || {};
  const deliverables = cache.deliverables || [];
  const versions = cache.versions || [];
  const writable=canWriteProject(project.id);
  const external=isExternalUser();
  return `<div class="section-head page-head-v3"><div><span class="eyebrow">Preuves & livrables</span><h2>Ressources</h2><p>${external?'Uniquement les éléments explicitement partagés avec vous.':'Chaque ressource garde ses versions, son statut et ses validations.'}</p></div>${writable?`<button class="btn primary" data-action="upload-file" data-project="${project.id}">↑ Ajouter un livrable</button>`:''}</div>
    ${deliverables.length?`<div class="resource-list-v4">${deliverables.map(d=>{const dVersions=versions.filter(v=>v.deliverable_id===d.id).sort((a,b)=>b.version_number-a.version_number);const latest=dVersions[0];const approval=latest?state.approvals.find(a=>a.deliverable_version_id===latest.id):null;return `<article class="card resource-item-v4"><div class="resource-icon-v4">${fileGlyph(latest?.file_name||d.title)}</div><div class="resource-copy-v4"><div class="resource-title-line"><strong>${esc(d.title)}</strong><span class="pill ${d.status==='approved'?'good':d.status==='review'?'blue':''}">${deliverableStatusLabel(d.status)}</span><span class="pill ${d.visibility==='shared'?'blue':''}">${d.visibility==='shared'?'Partagé':'Interne'}</span></div><p>${esc(d.description||'')}</p><small>${latest?`${esc(latest.file_name)} · v${latest.version_number} · ${bytes(latest.size_bytes)}`:'Aucune version'}${approval?` · ${approvalStatusLabel(approval.status)}`:''}</small></div><div class="resource-actions-v4">${latest?`<button class="btn small" data-action="open-file" data-path="${escAttr(latest.storage_path)}">Ouvrir</button>`:''}${writable?`<button class="btn small" data-action="new-version" data-deliverable="${d.id}" data-project="${project.id}">Nouvelle version</button>${latest?`<button class="btn small ${approval?.status==='pending'?'disabled':''}" ${approval?.status==='pending'?'disabled':''} data-action="request-approval" data-version="${latest.id}" data-project="${project.id}">${approval?.status==='pending'?'Validation en attente':'Demander validation'}</button>`:''}`:''}${approval&&approval.validator_id===state.user.id&&approval.status==='pending'?`<button class="btn primary small" data-action="open-approval" data-approval="${approval.id}">Examiner</button>`:''}</div></article>`}).join('')}</div>`:empty('Aucune ressource',external?'Aucun livrable n’a encore été partagé.':'Ajoutez le premier livrable ; les fichiers de travail restent liés au projet.')}`;
}

function renderMyWork() {
  const actions = myActions().filter(a=>!['done','cancelled'].includes(a.status));
  const requests = state.requests.filter(r=>(r.recipient_id===state.user.id&&r.status==='open')||(r.requester_id===state.user.id&&r.status==='answered'));
  const approvals = state.approvals.filter(a=>a.validator_id===state.user.id&&a.status==='pending');
  const overdue=actions.filter(a=>a.due_at&&new Date(a.due_at)<new Date());
  const blocked=actions.filter(a=>a.status==='blocked');
  return `<div class="section-head page-head-v3"><div><span class="eyebrow">Personnel</span><h1>Mon travail</h1><p>Vos validations, demandes et actions. La Home n’en remonte que celles qui exigent réellement votre intervention maintenant.</p></div>${!isExternalUser()?`<button class="btn primary" data-action="new-action">＋ Action</button>`:''}</div>
    <div class="triage-bar"><div><strong>${approvals.length}</strong><span>validations</span></div><div><strong>${requests.length}</strong><span>demandes</span></div><div><strong>${overdue.length}</strong><span>en retard</span></div><div><strong>${blocked.length}</strong><span>bloquées</span></div></div>
    <div class="grid cols-2 triage-grid"><div class="card"><div class="section-head compact"><h2>Décider / répondre</h2></div>${approvals.length||requests.length?`<div class="stack">${approvals.map(a=>`<button class="list-row list-button" data-action="open-approval" data-approval="${a.id}"><span class="pill blue">Validation</span><div class="list-main"><strong>${esc(approvalTitle(a))}</strong><small>${esc(projectName(a.project_id))} · votre décision débloque la suite</small></div><span>›</span></button>`).join('')}${requests.map(requestRow).join('')}</div>`:empty('Rien en attente','Aucune décision ou réponse ne vous bloque.')}</div>
      <div class="card"><div class="section-head compact"><h2>Actions à faire (${actions.length})</h2></div>${actions.length?`<div class="stack">${actions.map(a=>actionRow(a,canWriteProject(a.project_id),state.projectCache.get(a.project_id)?.milestones||[])).join('')}</div>`:empty('Aucune action assignée','Vous êtes à jour.')}</div></div>`;
}

function renderMessages(conversationId) {
  const visible=state.conversations.filter(c=>c.status!=='archived');
  const sortByActivity=(a,b)=>new Date(b.last_message_at||b.updated_at||b.created_at)-new Date(a.last_message_at||a.updated_at||a.created_at);
  const team=visible.filter(c=>c.kind==='team').sort(sortByActivity);
  const project=visible.filter(c=>c.kind==='project').sort(sortByActivity);
  const direct=visible.filter(c=>c.kind==='direct').sort(sortByActivity);
  const mobileMessages=window.matchMedia('(max-width:767px)').matches;
  const conversation=conversationId?visible.find(c=>c.id===conversationId):(mobileMessages?null:(direct.find(c=>state.unreadConversations.get(c.id))||project.find(c=>state.unreadConversations.get(c.id))||team.find(c=>state.unreadConversations.get(c.id))||visible[0]));
  if(conversation&&(!state.messages.has(conversation.id)||state.unreadConversations.get(conversation.id)))loadMessages(conversation.id,true);
  const messages=conversation?(state.messages.get(conversation.id)||[]):[];
  const kindLabel=conversationKindLabel(conversation?.kind);
  const linked=conversation?.linked_project_id?state.projects.find(p=>p.id===conversation.linked_project_id):null;
  return `<div class="communication-v2-hub">
    <div class="section-head page-head-v3 communication-v2-head"><div><span class="eyebrow">Communication</span><h1>Messages</h1><p>Échangez avec la bonne audience, dans le bon contexte. Les non-lus restent ici ; la cloche est réservée aux mentions, annonces et obligations.</p></div><div class="communication-create-actions"><button class="btn primary" data-action="new-direct">＋ Message privé</button><button class="btn" data-action="new-group-direct">＋ Groupe privé</button><button class="btn" data-action="new-topic">＋ Sujet</button></div></div>
    <div class="message-badge-strip"><span><strong>${state.unreadMessages}</strong> message${state.unreadMessages>1?'s':''} non lu${state.unreadMessages>1?'s':''}</span><span><strong>${state.unreadMentions}</strong> mention${state.unreadMentions>1?'s':''}</span></div>
    <div class="communication-layout ${conversation?'has-conversation':'conversation-index'}">
      <aside class="conversation-sidebar card">
        ${conversationGroup('Équipe',team)}
        ${conversationGroup('Projets',project)}
        ${conversationGroup('Privés',direct)}
        ${!visible.length?empty('Aucune conversation','Créez un message privé ou un sujet pour commencer.'):''}
      </aside>
      <section class="conversation-main card chat">
        ${conversation?`<div class="conversation-header"><a class="message-mobile-back" href="#/messages" aria-label="Retour aux conversations">‹</a><div><div class="conversation-title-row"><span class="conversation-kind">${esc(kindLabel)}</span>${conversation.is_general?'<span class="pill">Général</span>':''}${conversation.status==='resolved'?'<span class="pill good">Résolu</span>':''}</div><h2>${esc(conversationDisplayTitle(conversation))}</h2><p>${esc(conversationContextLabel(conversation))}${linked?` · lié à ${esc(linked.name)} sans élargir l’audience`:''}</p></div><div class="conversation-header-actions">${conversation.kind==='direct'?`<button class="btn small" data-action="link-direct" data-conversation="${conversation.id}">Lier à un projet</button>`:''}<button class="btn small" data-action="conversation-settings" data-conversation="${conversation.id}">Notifications</button></div></div>
        <div class="chat-log communication-chat-log">${messages.length?messages.filter(m=>!m.deleted_at).map(messageBubble).join(''):empty('Aucun message','Commencez la conversation.')}</div>
        ${state.replyTo&&state.replyTo.conversationId===conversation.id?`<div class="reply-composer-banner"><span>Réponse à <strong>${esc(displayName(state.replyTo.authorId))}</strong> · ${esc(state.replyTo.body.slice(0,100))}</span><button type="button" data-action="cancel-reply" aria-label="Annuler la réponse">×</button></div>`:''}
        <form class="chat-form communication-composer" data-form="message"><input type="hidden" name="conversationId" value="${conversation.id}"><input type="hidden" name="workspaceId" value="${conversation.workspace_id}"><textarea name="body" required maxlength="20000" placeholder="Écrire dans ${escAttr(conversationDisplayTitle(conversation))}…"></textarea><div class="composer-tools"><details class="mention-picker"><summary>@ Mentionner</summary><div class="mention-menu">${mentionOptions(conversation)}</div></details>${['team','project'].includes(conversation.kind)?`<label class="announcement-toggle"><input type="checkbox" name="isAnnouncement" value="1"> Annonce</label><input class="announcement-subject" name="subject" maxlength="240" placeholder="Titre de l’annonce">`:''}<button class="btn primary" type="submit">Envoyer</button></div></form>`:empty('Sélectionnez une conversation','Choisissez un fil à gauche ou créez-en un nouveau.')}
      </section>
    </div>
  </div>`;
}

function conversationGroup(label,items){return `<div class="conversation-group"><div class="conversation-group-title"><span>${esc(label)}</span><small>${items.length}</small></div>${items.map(conversationListItem).join('')}</div>`}
function conversationListItem(c){const unread=state.unreadConversations.get(c.id)||0;return `<a class="conversation-list-item ${parseRoute().id===c.id?'active':''}" href="#/messages/${c.id}"><span class="conversation-avatar">${c.kind==='direct'?directAvatar(c):c.kind==='project'?'◫':'#'}</span><span class="conversation-list-copy"><strong>${esc(conversationDisplayTitle(c))}</strong><small>${esc(conversationContextLabel(c))}</small></span>${unread?`<b class="conversation-unread">${unread>99?'99+':unread}</b>`:''}</a>`}
function conversationKindLabel(kind){return({team:'Équipe',project:'Projet',direct:'Privé',context:'Contexte'})[kind]||'Conversation'}
function conversationContextLabel(c){if(!c)return'';if(c.kind==='project')return projectName(c.project_id)||'Projet';if(c.kind==='team')return 'Toute l’équipe interne';if(c.kind==='direct'){const names=conversationAudienceMembers(c.id).filter(id=>id!==state.user.id).map(displayName);return names.length?names.join(', '):'Conversation privée'}return 'Conversation contextuelle'}
function conversationDisplayTitle(c){if(!c)return'';if(c.kind==='direct'){const names=conversationAudienceMembers(c.id).filter(id=>id!==state.user.id).map(displayName);if(names.length===1)return names[0];if(names.length>1)return c.title&&c.title!=='Message direct'?c.title:names.join(', ')}return c.title||conversationKindLabel(c.kind)}
function conversationAudienceMembers(conversationId){return state.conversationMembers.filter(cm=>cm.conversation_id===conversationId).map(cm=>cm.user_id)}
function directAvatar(c){const other=conversationAudienceMembers(c.id).find(id=>id!==state.user.id);return other?`<span class="tiny-avatar">${esc(initials(displayName(other)))}</span>`:'↔'}
function mentionOptions(c){const ids=conversationAudienceMembers(c.id).filter(id=>id!==state.user.id);return ids.length?ids.map(id=>`<label><input type="checkbox" name="mentionIds" value="${id}">${avatarHtml(id)}<span>${esc(displayName(id))}</span></label>`).join(''):`<small>Personne d’autre dans ce fil.</small>`}

function renderCalendar() {
  const meetings = [...state.meetings].sort((a,b)=>new Date(a.starts_at||'2999')-new Date(b.starts_at||'2999'));
  const now=new Date();
  const upcoming=meetings.filter(m=>m.starts_at&&new Date(m.starts_at)>=now&&!['completed','cancelled'].includes(m.status));
  const past=meetings.filter(m=>m.starts_at&&new Date(m.starts_at)<now||m.status==='completed');
  const thisWeek=upcoming.filter(m=>new Date(m.starts_at)<new Date(Date.now()+7*86400000));
  return `<div class="section-head page-head-v3"><div><span class="eyebrow">Temps partagé</span><h1>Calendrier</h1><p>Les réunions de vos projets visibles, sans mélanger les tâches avec le temps synchrone.</p></div>${!isExternalUser()?`<button class="btn primary" data-action="new-meeting">＋ Réunion</button>`:''}</div>
    <div class="calendar-summary-v4"><div class="card"><span class="eyebrow">7 prochains jours</span><div class="metric">${thisWeek.length}</div><small>réunion${thisWeek.length>1?'s':''}</small></div><div class="card"><span class="eyebrow">À venir</span><div class="metric">${upcoming.length}</div><small>planifiée${upcoming.length>1?'s':''}</small></div><div class="card"><span class="eyebrow">Mémoire</span><div class="metric">${past.length}</div><small>réunion${past.length>1?'s':''} passée${past.length>1?'s':''}</small></div></div>
    <div class="calendar-columns-v4"><div class="card"><div class="section-head compact"><h2>À venir</h2></div>${upcoming.length?`<div class="meeting-list-v4">${upcoming.map(m=>meetingRow(m,true)).join('')}</div>`:empty('Aucune réunion à venir','Votre calendrier est libre.')}</div><div class="card"><div class="section-head compact"><h2>Passées</h2></div>${past.length?`<div class="meeting-list-v4">${past.slice().reverse().slice(0,10).map(m=>meetingRow(m,true)).join('')}</div>`:empty('Aucun historique','Les synthèses des réunions terminées apparaîtront ici.')}</div></div>`;
}

function renderLibrary() {
  state.projects.forEach(p=>{if(!state.projectCache.has(p.id))loadProject(p.id);});
  const q=String(state.libraryQuery||'').trim().toLowerCase();
  let all=state.projects.flatMap(p=>(state.projectCache.get(p.id)?.deliverables||[]).map(d=>({...d,project:p,versions:state.projectCache.get(p.id)?.versions||[]}))).sort((a,b)=>new Date(b.updated_at||b.created_at)-new Date(a.updated_at||a.created_at));
  if(state.libraryProject!=='all') all=all.filter(x=>x.project.id===state.libraryProject);
  if(q) all=all.filter(x=>(`${x.title} ${x.description||''} ${x.project.name}`).toLowerCase().includes(q));
  return `<div class="section-head page-head-v3"><div><span class="eyebrow">Ressources</span><h1>Fichiers</h1><p>Retrouvez un livrable sans devoir vous souvenir de l’endroit où il a été déposé.</p></div></div>
    <div class="library-filterbar"><label class="library-search"><span>⌕</span><input id="library-search" placeholder="Rechercher un fichier ou un livrable…" value="${escAttr(state.libraryQuery)}"></label><div class="library-project-filters"><button class="library-project-button ${state.libraryProject==='all'?'selected':''}" data-action="library-project" data-project="all">Tous</button>${state.projects.map(p=>`<button class="library-project-button ${state.libraryProject===p.id?'selected':''}" data-action="library-project" data-project="${p.id}">${esc(p.name)}</button>`).join('')}</div></div>
    ${all.length?`<div class="card library-recent"><div class="section-head compact"><h2>${q||state.libraryProject!=='all'?'Résultats':'Récents'}</h2><span class="metric-label">${all.length} ressource${all.length>1?'s':''}</span></div><div class="resource-grid-v3">${all.slice(0,30).map(({project,versions,...d})=>{const latest=versions.filter(v=>v.deliverable_id===d.id).sort((a,b)=>b.version_number-a.version_number)[0];return `<a class="resource-card-v3" href="#/projects/${project.id}/resources"><div class="file-thumb large">${fileGlyph(latest?.file_name||d.title)}</div><strong>${esc(d.title)}</strong><small>${esc(project.name)}${latest?` · v${latest.version_number}`:''} · ${relativeDate(new Date(d.updated_at||d.created_at))}</small><span class="pill ${d.visibility==='shared'?'blue':''}">${d.visibility==='shared'?'Partagé':'Interne'}</span></a>`}).join('')}</div></div>`:empty('Aucune ressource trouvée',q?'Essayez un autre terme ou projet.':'Ajoutez un livrable depuis un projet pour construire sa mémoire.')}`;
}

function renderTeam() {
  const canManage = ['owner','admin'].includes(state.workspaceRole);
  const external = isExternalUser();
  const memberRows = state.members.map(m => {
    const explicitIds = new Set(state.projectMembers.filter(pm => pm.user_id === m.user_id).map(pm => pm.project_id));
    const restrictedCount = state.projects.filter(p => p.visibility === 'restricted' && explicitIds.has(p.id)).length;
    const sharedCount = state.projects.filter(p => explicitIds.has(p.id)).length;
    let accessText = 'Accès selon les projets partagés';
    if (m.role === 'owner') accessText = 'Accès complet · propriétaire de l’espace';
    else if (m.role === 'admin') accessText = 'Accès complet · administration de l’espace';
    else if (m.role === 'member') accessText = `Projets Équipe automatiques${restrictedCount ? ` · ${restrictedCount} projet${restrictedCount > 1 ? 's' : ''} restreint${restrictedCount > 1 ? 's' : ''}` : ''}`;
    else if (m.role === 'guest') accessText = `${sharedCount} projet${sharedCount > 1 ? 's' : ''} explicitement partagé${sharedCount > 1 ? 's' : ''}`;
    return `<div class="list-row team-row">${avatarHtml(m.user_id)}<div class="list-main"><strong>${esc(displayName(m.user_id))}${m.user_id===state.user.id?' (vous)':''}</strong><small>${workspaceRoleLabel(m.role)} · ${accessText}</small></div><span class="pill ${m.role==='owner'?'blue':''}">${workspaceRoleLabel(m.role)}</span>${canManage&&m.role!=='owner'?`<button class="btn small" data-action="manage-member" data-user="${m.user_id}">Gérer</button>`:''}</div>`;
  }).join('');
  return `<div class="section-head page-head-v3"><div><span class="eyebrow">Personnes & accès</span><h1>${external?'Équipe du projet':'Équipe'}</h1><p>${external?'Seulement les personnes qui partagent vos projets.':'Le rôle définit les droits dans l’espace. La visibilité du projet définit qui peut y participer. Les responsabilités se gèrent ensuite dans la roadmap.'}</p></div>${canManage?`<button class="btn primary" data-action="invite-member">＋ Inviter</button>`:''}</div><div class="card"><div class="stack">${memberRows}</div></div>${canManage?`<div class="card" style="margin-top:16px"><div class="section-head compact"><div><h2>Invitations</h2><div class="metric-label">Membre : projets Équipe automatiques. Administrateur : accès global. Invité externe : partage explicite uniquement.</div></div><button class="section-link" data-action="load-invites">Actualiser</button></div><div id="invite-list"><span class="metric-label">Aucune donnée chargée.</span></div></div>`:''}`;
}

function renderProfile(){
  const avatar=avatarHtml(state.user.id);
  const hasAvatar=!!state.profile?.avatar_url;
  return `<div class="section-head page-head-v3 v42-page-head"><div><span class="eyebrow">Votre compte</span><h1>Mon profil</h1><p>Votre nom et votre photo vous identifient dans les projets auxquels vous avez accès.</p></div></div><div class="grid cols-2 profile-page-grid v42-profile-grid"><div class="card profile-main-card v42-profile-card"><div class="profile-identity-v42">${avatar}<div class="profile-identity-copy"><span class="eyebrow">Nom affiché</span><strong>${esc(displayName(state.user.id))}</strong><small>${esc(state.user.email||'')}</small></div></div><div class="profile-actions-v42"><button class="btn primary" data-action="edit-profile">Modifier le nom ou la photo</button>${hasAvatar?`<button class="btn ghost" data-action="remove-avatar">Supprimer la photo</button>`:''}</div><p class="profile-help">Le nom affiché et l’avatar sont visibles uniquement par les personnes qui partagent un projet avec vous.</p></div><div class="card v42-account-card"><div class="section-head compact"><h2>Compte & accès</h2></div><div class="stack"><div class="list-row"><div class="list-main"><small>Espace actuel</small><strong>${esc(state.workspace.name)}</strong></div></div><div class="list-row"><div class="list-main"><small>Rôle</small><strong>${workspaceRoleLabel(state.workspaceRole)}</strong></div></div><div class="list-row"><div class="list-main"><small>Adresse de connexion</small><strong>${esc(state.user.email||'')}</strong></div></div></div><button class="btn danger signout-profile" data-action="signout">Se déconnecter</button></div></div>`;
}

function renderSettings() {
  if(isExternalUser()) return renderProfile();
  const membership=state.memberships.find(m=>m.workspace_id===state.workspace.id);
  const access=['owner','admin'].includes(state.workspaceRole)||membership?.access_mode==='all'?'Tous les projets':'Projets attribués';
  return `<div class="section-head page-head-v3"><div><span class="eyebrow">Espace de travail</span><h1>Paramètres</h1><p>Les informations utiles de votre espace, sans détails techniques.</p></div></div><div class="grid cols-2"><div class="card"><div class="section-head compact"><h2>Espace actuel</h2></div><div class="stack"><div class="list-row"><div class="list-main"><small>Nom</small><strong>${esc(state.workspace.name)}</strong></div></div><div class="list-row"><div class="list-main"><small>Votre rôle</small><strong>${workspaceRoleLabel(state.workspaceRole)}</strong></div></div><div class="list-row"><div class="list-main"><small>Projets visibles</small><strong>${access}</strong></div></div></div></div><div class="card"><div class="section-head compact"><h2>Gestion</h2></div><div class="settings-links"><a class="settings-link" href="#/team"><div><strong>Équipe</strong><span>Invitations, accès et responsabilités.</span></div><span>→</span></a><a class="settings-link" href="#/archives"><div><strong>Archives</strong><span>Retrouver les projets terminés ou archivés.</span></div><span>→</span></a><a class="settings-link" href="#/profile"><div><strong>Mon profil</strong><span>Nom affiché, avatar et compte.</span></div><span>→</span></a></div></div></div>`;
}

function renderNotificationPanel() {
  const items = state.notifications.slice(0,12);
  return `<div class="notification-panel"><div class="card-head"><h3>Notifications</h3>${state.notifications.some(n=>!n.read_at)?`<button class="btn small" data-action="read-all-notifications">Tout lire</button>`:''}</div>${items.length?`<div class="stack">${items.map(n=>`<div class="list-row clickable" data-action="open-notification" data-id="${n.id}" data-route="${escAttr(n.route||'#/dashboard')}"><span class="dot" style="color:${n.read_at?'#c8ced8':'#3867f4'}"></span><div class="list-main"><strong>${esc(n.title)}</strong><small>${notificationKind(n.kind)} · ${relativeDate(new Date(n.created_at))}</small></div></div>`).join('')}</div>`:empty('Aucune notification','Les nouvelles affectations et discussions apparaîtront ici.')}</div>`;
}

function actionEditModal(modal){
  const a=state.actions.find(x=>x.id===modal.id); if(!a)return '';
  const assigned=state.assignees.find(x=>x.action_id===a.id)?.user_id||'';
  const milestones=state.projectCache.get(a.project_id)?.milestones||[];
  return modalFrame('Modifier l’action','Responsable, phase, priorité, échéance, blocage et visibilité restent dans un même objet.',`<form data-form="action-edit" class="attention-action-form-v43"><input type="hidden" name="actionId" value="${a.id}"><input type="hidden" name="projectId" value="${a.project_id}"><div class="form-grid"><div class="field span-2"><label>Titre</label><input name="title" required value="${escAttr(a.title)}"></div><div class="field span-2"><label>Description</label><textarea name="description">${esc(a.description||'')}</textarea></div><div class="field"><label>Responsable</label><select name="assignee"><option value="">Non assigné</option>${projectParticipantOptions(a.project_id,assigned,false)}</select></div><div class="field"><label>Phase roadmap</label><select name="milestoneId"><option value="">Hors roadmap</option>${milestones.map(m=>`<option value="${m.id}" ${m.id===a.milestone_id?'selected':''}>${esc(m.title)}</option>`).join('')}</select></div><div class="field"><label>État</label><select name="status">${['todo','in_progress','blocked','done','cancelled'].map(v=>`<option value="${v}" ${a.status===v?'selected':''}>${statusLabel(v)}</option>`).join('')}</select></div><div class="field"><label>Priorité</label><select name="priority">${['low','normal','high','urgent'].map(v=>`<option value="${v}" ${a.priority===v?'selected':''}>${priorityLabel(v)}</option>`).join('')}</select></div><div class="field"><label>Échéance</label><input type="datetime-local" name="dueAt" value="${escAttr(toLocalInput(a.due_at))}"></div><div class="field"><label>Visibilité</label><select name="visibility"><option value="internal" ${a.visibility!=='shared'?'selected':''}>Interne</option><option value="shared" ${a.visibility==='shared'?'selected':''}>Partagé aux invités</option></select></div><div class="field span-2"><label>Cause du blocage</label><textarea name="blockedReason" placeholder="Obligatoire si l’action est bloquée">${esc(a.blocked_reason||'')}</textarea></div></div><div class="modal-actions split"><button class="btn danger ghost" type="button" data-action="delete-action" data-id="${a.id}" data-project="${a.project_id}">Supprimer</button><div><button class="btn" type="button" data-action="close-modal">Annuler</button> <button class="btn primary" type="submit">Enregistrer</button></div></div></form>`);
}
function requestDetailModal(modal){
  const r=state.requests.find(x=>x.id===modal.id); if(!r)return '';
  const recipient=r.recipient_id===state.user.id, requester=r.requester_id===state.user.id;
  return modalFrame('Demande',projectName(r.project_id)||'Espace',`<div class="request-detail-v4"><div class="detail-meta-grid"><div><small>État</small><strong>${requestStatus(r.status)}</strong></div><div><small>De</small><strong>${esc(displayName(r.requester_id))}</strong></div><div><small>À</small><strong>${esc(displayName(r.recipient_id))}</strong></div><div><small>Échéance</small><strong>${r.due_at?formatDateTime(r.due_at):'Aucune'}</strong></div></div><div class="detail-block"><span class="eyebrow">Demande</span><h3>${esc(r.title)}</h3><p>${nl2br(esc(r.body||''))}</p></div>${r.response?`<div class="detail-block response"><span class="eyebrow">Réponse</span><p>${nl2br(esc(r.response))}</p><small>${r.answered_at?formatDateTime(r.answered_at):''}</small></div>`:''}${recipient&&r.status==='open'?`<form data-form="request-response"><input type="hidden" name="requestId" value="${r.id}"><div class="field"><label>Votre réponse</label><textarea name="response" required autofocus></textarea></div><div class="modal-actions"><button class="btn" type="button" data-action="close-modal">Plus tard</button><button class="btn primary" type="submit">Envoyer la réponse</button></div></form>`:''}${requester&&r.status==='answered'?`<div class="modal-actions"><button class="btn" data-action="reopen-request" data-request="${r.id}">Redemander</button><button class="btn primary" data-action="close-request" data-request="${r.id}">Réponse suffisante · clôturer</button></div>`:''}</div>`);
}
function approvalDetailModal(modal){
  const a=state.approvals.find(x=>x.id===modal.id); if(!a)return '';
  const version=findVersion(a.deliverable_version_id); const d=version?findDeliverable(version.deliverable_id):null;
  return modalFrame('Validation',projectName(a.project_id),`<div class="approval-detail-v4"><div class="detail-meta-grid"><div><small>Livrable</small><strong>${esc(d?.title||'Livrable')}</strong></div><div><small>Version</small><strong>${version?`v${version.version_number}`:'—'}</strong></div><div><small>Demandeur</small><strong>${esc(displayName(a.requested_by))}</strong></div><div><small>État</small><strong>${approvalStatusLabel(a.status)}</strong></div></div>${version?`<button class="btn" data-action="open-file" data-path="${escAttr(version.storage_path)}">Ouvrir la version à examiner</button>`:''}${a.request_note?`<div class="detail-block"><span class="eyebrow">Consigne de validation</span><p>${nl2br(esc(a.request_note))}</p></div>`:''}${a.decision_note?`<div class="detail-block response"><span class="eyebrow">Commentaire de décision</span><p>${nl2br(esc(a.decision_note))}</p></div>`:''}${a.validator_id===state.user.id&&a.status==='pending'?`<div class="field"><label>Commentaire de validation</label><textarea id="approval-comment" placeholder="Précisez ce qui est validé ou ce qui doit changer."></textarea></div><div class="modal-actions"><button class="btn" data-action="approval-decision" data-approval="${a.id}" data-status="changes_requested">Demander des modifications</button><button class="btn primary" data-action="approval-decision" data-approval="${a.id}" data-status="approved">Approuver cette version</button></div>`:''}</div>`);
}
function meetingDetailModal(modal){
  const m=state.meetings.find(x=>x.id===modal.id); if(!m)return '';
  const writable=m.project_id?canWriteProject(m.project_id):['owner','admin','member'].includes(state.workspaceRole);
  return modalFrame(m.title,`${projectName(m.project_id)||'Espace'} · ${m.starts_at?formatDateTime(m.starts_at):'Date à définir'}`,`<form data-form="meeting-detail"><input type="hidden" name="meetingId" value="${m.id}"><input type="hidden" name="projectId" value="${m.project_id||''}"><div class="meeting-workflow-v4"><div class="meeting-stagebar"><span class="${m.status==='planned'?'active':''}">Avant</span><span class="${m.status==='live'?'active':''}">Live</span><span class="${m.status==='completed'?'active':''}">Après</span></div>${meetingAttendeeHtml(m.id)}<section class="meeting-stage-panel"><div><span class="eyebrow">Avant</span><h3>Objectif & agenda</h3></div><textarea name="agenda" ${writable?'':'readonly'} placeholder="But du point, décisions à prendre, sujets à préparer…">${esc(m.agenda||'')}</textarea></section><section class="meeting-stage-panel"><div><span class="eyebrow">Live</span><h3>Notes de réunion</h3></div><textarea name="liveNotes" ${writable?'':'readonly'} placeholder="Notes factuelles, questions, arbitrages…">${esc(m.live_notes||'')}</textarea>${writable&&m.project_id?`<div class="meeting-object-actions"><button class="btn small" type="button" data-action="meeting-to-action" data-meeting="${m.id}" data-project="${m.project_id}">＋ Action</button><button class="btn small" type="button" data-action="meeting-to-decision" data-meeting="${m.id}" data-project="${m.project_id}">＋ Décision</button></div>`:''}</section><section class="meeting-stage-panel"><div><span class="eyebrow">Après</span><h3>Synthèse utile</h3></div><textarea name="summary" ${writable?'':'readonly'} placeholder="Ce qui a changé, décisions, prochaines étapes…">${esc(m.summary||'')}</textarea></section></div>${writable?`<div class="form-grid"><div class="field"><label>État</label><select name="status">${['planned','live','completed','cancelled'].map(v=>`<option value="${v}" ${m.status===v?'selected':''}>${meetingStatusLabel(v)}</option>`).join('')}</select></div><div class="field"><label>Visibilité</label><select name="visibility"><option value="internal" ${m.visibility!=='shared'?'selected':''}>Interne</option><option value="shared" ${m.visibility==='shared'?'selected':''}>Partagée</option></select></div></div><div class="modal-actions"><button class="btn" type="button" data-action="close-modal">Fermer</button><button class="btn primary" type="submit">Enregistrer la réunion</button></div>`:`<div class="modal-actions"><button class="btn primary" type="button" data-action="close-modal">Fermer</button></div>`}</form>`);
}
function memberManageModal(modal){
  const m = state.members.find(x => x.user_id === modal.userId); if(!m)return '';
  const assigned = new Set(state.projectMembers.filter(pm => pm.user_id === m.user_id).map(pm => pm.project_id));
  const role = modal.role || m.role || 'member';
  const defaultSelected = role === 'member'
    ? state.projects.filter(p => p.visibility === 'restricted' && assigned.has(p.id)).map(p => p.id)
    : role === 'guest' ? state.projects.filter(p => assigned.has(p.id)).map(p => p.id) : [];
  const selected = new Set(Array.isArray(modal.projectIds) ? modal.projectIds : defaultSelected);
  const candidates = role === 'member' ? state.projects.filter(p => p.visibility === 'restricted') : role === 'guest' ? state.projects : [];
  const roleHelp = role === 'admin'
    ? '<div class="notice"><strong>Administrateur :</strong> accès à tout l’espace et à tous les projets. Aucun projet à sélectionner ici.</div>'
    : role === 'guest'
      ? '<div class="notice"><strong>Invité externe :</strong> accès uniquement aux projets explicitement sélectionnés. Aucun futur projet ne sera ajouté automatiquement.</div>'
      : '<div class="notice"><strong>Membre :</strong> accès automatique aux projets Équipe actuels et futurs. Sélectionnez seulement les projets restreints à partager.</div>';
  const projectArea = role === 'admin' ? '' : `<div class="field span-2"><label>${role==='guest'?'Projets à partager':'Projets restreints à partager'}</label><div class="project-checks">${candidates.length?candidates.map(p=>`<label><input type="checkbox" name="projectIds" value="${p.id}" ${selected.has(p.id)?'checked':''}> ${esc(p.name)}${p.visibility==='restricted'?' <small>· Restreint</small>':''}</label>`).join(''):'<span class="metric-label">Aucun projet concerné.</span>'}</div></div>`;
  return modalFrame(`Gérer ${displayName(m.user_id)}`,'Modifiez son rôle et son accès aux projets. Les responsabilités d’actions et de jalons se gèrent dans les projets.',`<form data-form="member-manage"><input type="hidden" name="userId" value="${m.user_id}"><div class="form-grid"><div class="field span-2"><label>Rôle dans l’espace</label><select name="role" data-member-role><option value="admin" ${role==='admin'?'selected':''}>Administrateur</option><option value="member" ${role==='member'?'selected':''}>Membre</option><option value="guest" ${role==='guest'?'selected':''}>Invité externe</option></select></div><div class="span-2">${roleHelp}</div>${projectArea}</div><div class="modal-actions"><button class="btn" type="button" data-action="close-modal">Annuler</button><button class="btn primary" type="submit">Enregistrer les accès</button></div></form>`);
}
function renderModal(modal) {
  if (modal.type==='quick-add') return modalFrame('Créer','Uniquement les objets généraux. Les éléments contextuels se créent depuis leur projet.',`<div class="quick-create-grid"><button class="quick-create-card" data-action="new-project"><span>◫</span><strong>Projet</strong><small>Objectif, équipe et roadmap initiale</small></button><button class="quick-create-card" data-action="go-messages"><span>✉</span><strong>Message</strong><small>Direct, groupe privé ou sujet d’équipe</small></button><button class="quick-create-card" data-action="new-action"><span>✓</span><strong>Action</strong><small>Travail assignable et daté</small></button><button class="quick-create-card" data-action="new-meeting"><span>□</span><strong>Réunion</strong><small>Avant, Live, Après</small></button></div>`);
  if (modal.type==='activity') {const rows=recentActivitySinceSeen();return modalFrame('Activité importante','Uniquement les changements qui modifient votre contexte depuis votre dernière visite.',`<div class="activity-detail-v43 catchup-list-v41">${rows.length?rows.map(x=>`<a href="${x.route}" class="catchup-event-v41"><span class="change-tag ${x.audience} ${x.tone||''}">${x.label}</span><div><strong>${esc(x.title)}</strong><small>${esc(x.sub)} · ${x.when}</small></div><span class="row-chevron">›</span></a>`).join(''):'<div class="v43-up-to-date">Vous êtes à jour.</div>'}</div>`);}
  if (modal.type==='project') return modalFrame('Nouveau projet','Créez immédiatement un projet exploitable : objectif, équipe et premières phases.',`<form data-form="project"><div class="form-grid"><div class="field span-2"><label>Nom</label><input name="name" required maxlength="160" autofocus></div><div class="field span-2"><label>Objectif / résultat attendu</label><textarea name="objective" required placeholder="Ex. Valider une version testable avec 6 utilisateurs."></textarea></div><div class="field"><label>Date cible</label><input name="targetDate" type="date"></div><div class="field span-2"><label>Participants dès le départ</label><div class="project-checks">${state.members.filter(m=>m.user_id!==state.user.id&&m.role!=='guest').map(m=>`<label><input type="checkbox" name="participantIds" value="${m.user_id}"> ${esc(displayName(m.user_id))}</label>`).join('')||'<small>Invitez d’abord vos associés si nécessaire.</small>'}</div></div><div class="field span-2"><label>Roadmap initiale · une phase par ligne</label><textarea name="phaseTitles" rows="5">Cadrage\nRéalisation\nValidation\nLivraison</textarea><small>Gardez 3 à 7 phases. Elles restent entièrement modifiables.</small></div></div><div class="modal-actions"><button class="btn" type="button" data-action="close-modal">Annuler</button><button class="btn primary" type="submit">Créer et ouvrir le projet</button></div></form>`);
  if (modal.type==='project-edit') { const p=state.projects.find(x=>x.id===modal.projectId); if(!p)return ''; return modalFrame('Modifier le projet','Modifiez le cadrage. L’état et la santé sont gérés automatiquement par le workflow.',`<form data-form="project-edit"><input type="hidden" name="projectId" value="${p.id}"><div class="form-grid"><div class="field span-2"><label>Nom</label><input name="name" required maxlength="160" value="${escAttr(p.name)}"></div><div class="field span-2"><label>Objectif</label><textarea name="objective">${esc(p.objective||'')}</textarea></div><div class="field"><label>Date cible</label><input name="targetDate" type="date" value="${escAttr(p.target_date||'')}"></div></div><div class="notice">L’état En bonne voie / À surveiller / En difficulté est calculé depuis les jalons, actions, blocages et échéances.</div><div class="modal-actions"><button class="btn" type="button" data-action="close-modal">Annuler</button><button class="btn primary" type="submit">Enregistrer</button></div></form>`); }
  if (modal.type==='project-manage') { const p=state.projects.find(x=>x.id===modal.projectId); if(!p)return ''; const lifecycle=p.status==='active'?`<button class="btn" data-action="pause-project" data-project="${p.id}">Mettre en pause</button><button class="btn primary" data-action="start-complete-project" data-project="${p.id}">Terminer le projet</button>`:p.status==='on_hold'?`<button class="btn" data-action="resume-project" data-project="${p.id}">Reprendre</button><button class="btn primary" data-action="start-complete-project" data-project="${p.id}">Terminer le projet</button>`:p.status==='completed'?`<button class="btn primary" data-action="reopen-project" data-project="${p.id}">Réouvrir le projet</button>`:''; return modalFrame('Gérer le projet',`${projectStatusLabel(p.status)} · ${projectHealthInfo(p).label}`,`<div class="notice"><strong>${esc(p.name)}</strong><br>${esc(projectHealthInfo(p).reason)}</div><div class="modal-actions"><button class="btn" data-action="close-modal">Fermer</button>${lifecycle}<button class="btn" data-action="archive-project" data-project="${p.id}">Archiver</button><button class="btn danger" data-action="delete-project" data-project="${p.id}">Supprimer définitivement</button></div>`); }
  if (modal.type==='project-complete') { const p=state.projects.find(x=>x.id===modal.projectId); if(!p)return ''; const preview=modal.preview||{}; const open=Number(preview.open_commitments||0); const refs=state.deliverables.filter(d=>d.project_id===p.id&&d.status!=='archived'); return modalFrame('Terminer le projet','Conservez une trace claire du résultat obtenu avant de clôturer.',`<form data-form="project-complete"><input type="hidden" name="projectId" value="${p.id}"><div class="stack"><div class="field"><label>Résultat obtenu</label><textarea name="result" required placeholder="Qu’est-ce qui a réellement été livré ou validé ?"></textarea></div>${refs.length?`<div class="field"><label>Livrables de référence (facultatif)</label><div class="project-checks">${refs.map(d=>`<label><input type="checkbox" name="referenceDeliverableIds" value="${d.id}"> ${esc(d.title)}</label>`).join('')}</div></div>`:''}${open?`<div class="notice danger"><strong>${open} engagement${open>1?'s':''} encore ouvert${open>1?'s':''}</strong><br>${Number(preview.open_actions||0)} action(s) · ${Number(preview.open_milestones||0)} phase(s) · ${Number(preview.open_requests||0)} demande(s) · ${Number(preview.pending_approvals||0)} validation(s).</div><div class="field"><label>Ce qu’il reste à transmettre ou traiter</label><textarea name="remaining" required></textarea></div><label><input type="checkbox" name="confirmOpen" value="1" required> Je confirme la clôture malgré ces engagements ouverts.</label>`:'<div class="notice"><strong>Aucun engagement ouvert.</strong> Le projet peut être clôturé proprement.</div>'}</div><div class="modal-actions"><button class="btn" type="button" data-action="close-modal">Annuler</button><button class="btn primary" type="submit">Confirmer la clôture</button></div></form>`); }
  if (modal.type==='profile') return modalFrame('Modifier mon profil','Choisissez le nom et la photo qui vous identifient dans 2b2c.',`<form data-form="profile"><div class="stack"><div class="profile-editor">${avatarHtml(state.user.id)}<div class="field" style="flex:1"><label>Nom affiché dans 2b2c</label><input name="displayName" required maxlength="80" value="${escAttr(displayName(state.user.id))}"></div></div><div class="field"><label>Photo de profil</label><input name="avatar" type="file" accept="image/jpeg,image/png,image/webp,image/gif"><small>JPG, PNG, WebP ou GIF · 5 Mo max. Vous pouvez remplacer votre photo à tout moment.</small></div>${state.profile?.avatar_url?`<button class="text-danger-action" type="button" data-action="remove-avatar">Supprimer la photo actuelle</button>`:''}</div><div class="modal-actions"><button class="btn" type="button" data-action="close-modal">Annuler</button><button class="btn primary" type="submit">Enregistrer</button></div></form>`);
  if (modal.type==='action') return modalFrame('Nouvelle action','Une action doit avoir un résultat clair et, si possible, un responsable et une échéance.',`<form data-form="action"><input type="hidden" name="sourceType" value="${escAttr(modal.sourceType||'')}"><input type="hidden" name="sourceId" value="${escAttr(modal.sourceId||'')}"><div class="form-grid"><div class="field span-2"><label>Titre</label><input name="title" required maxlength="200" autofocus value="${escAttr(modal.prefillTitle||'')}"></div><div class="field"><label>Projet</label><select name="projectId" required>${writableProjectOptions(modal.projectId)}</select></div><div class="field"><label>Responsable</label><select name="assignee"><option value="">Non assigné</option>${modal.projectId?projectParticipantOptions(modal.projectId,'',false):memberOptions()}</select></div>${modal.projectId?`<div class="field"><label>Phase roadmap</label><select name="milestoneId"><option value="">Hors roadmap</option>${milestoneOptions(modal.projectId,modal.milestoneId)}</select></div>`:''}<div class="field"><label>Priorité</label><select name="priority"><option value="normal">Normale</option><option value="high">Haute</option><option value="urgent">Urgente</option><option value="low">Basse</option></select></div><div class="field"><label>Échéance</label><input name="dueAt" type="datetime-local"></div><div class="field"><label>Visibilité</label><select name="visibility"><option value="internal">Interne</option><option value="shared">Partagée aux invités</option></select></div><div class="field span-2"><label>Description</label><textarea name="description"></textarea></div></div>${modal.sourceType?`<div class="notice">La source (${esc(modal.sourceType)}) restera liée à cette action.</div>`:''}<div class="modal-actions"><button class="btn" type="button" data-action="close-modal">Annuler</button><button class="btn primary" type="submit">Créer</button></div></form>`);
  if (modal.type==='action-edit') return actionEditModal(modal);
  if (modal.type==='request') return modalFrame('Nouvelle demande','Une demande est différente d’un message : elle attend explicitement une réponse.',`<form data-form="request"><input type="hidden" name="sourceType" value="${escAttr(modal.sourceType||'')}"><input type="hidden" name="sourceId" value="${escAttr(modal.sourceId||'')}"><div class="form-grid"><div class="field span-2"><label>Titre</label><input name="title" required autofocus value="${escAttr(modal.prefillTitle||'')}"></div><div class="field"><label>Projet</label><select name="projectId"><option value="">Sans projet</option>${projectOptions(modal.projectId,false)}</select></div><div class="field"><label>Destinataire</label><select name="recipient" required>${modal.projectId?projectParticipantOptions(modal.projectId,'',true,state.user.id):memberOptions(state.user.id)}</select></div><div class="field span-2"><label>Demande</label><textarea name="body"></textarea></div><div class="field"><label>Échéance</label><input name="dueAt" type="datetime-local"></div></div><div class="modal-actions"><button class="btn" type="button" data-action="close-modal">Annuler</button><button class="btn primary" type="submit">Envoyer</button></div></form>`);
  if (modal.type==='request-detail') return requestDetailModal(modal);
  if (modal.type==='approval-detail') return approvalDetailModal(modal);
  if (modal.type==='approval-request') {const v=findVersion(modal.versionId);const d=v?findDeliverable(v.deliverable_id):null;if(!v||!d)return '';return modalFrame('Demander une validation',`${d.title} · v${v.version_number}`,`<form data-form="approval-request"><input type="hidden" name="projectId" value="${d.project_id}"><input type="hidden" name="versionId" value="${v.id}"><input type="hidden" name="deliverableId" value="${d.id}"><div class="field"><label>Validateur</label><select name="validatorId" required><option value="">Choisir…</option>${projectParticipantOptions(d.project_id,'',true,state.user.id)}</select></div><div class="field"><label>Message / critères</label><textarea name="comment" placeholder="Ce qui doit être vérifié sur cette version."></textarea></div><div class="notice">Si le validateur est un invité/client, le livrable sera automatiquement marqué comme partagé.</div><div class="modal-actions"><button class="btn" type="button" data-action="close-modal">Annuler</button><button class="btn primary" type="submit">Envoyer pour validation</button></div></form>`);}
  if (modal.type==='decision') return modalFrame('Consigner une décision','Le choix et sa justification restent dans la mémoire du projet.',`<form data-form="decision"><input type="hidden" name="projectId" value="${escAttr(modal.projectId)}"><input type="hidden" name="sourceType" value="${escAttr(modal.sourceType||'')}"><input type="hidden" name="sourceId" value="${escAttr(modal.sourceId||'')}"><div class="stack"><div class="field"><label>Décision</label><input name="title" required autofocus value="${escAttr(modal.prefillTitle||'')}"></div><div class="field"><label>Pourquoi ?</label><textarea name="rationale"></textarea></div><div class="field"><label>Visibilité</label><select name="visibility"><option value="internal">Interne</option><option value="shared">Partagée aux invités</option></select></div></div><div class="modal-actions"><button class="btn" type="button" data-action="close-modal">Annuler</button><button class="btn primary" type="submit">Enregistrer</button></div></form>`);
  if (modal.type==='milestone') return modalFrame('Nouvelle phase','Une phase de roadmap décrit un résultat, pas seulement une période.',`<form data-form="milestone"><input type="hidden" name="projectId" value="${escAttr(modal.projectId)}"><div class="form-grid"><div class="field span-2"><label>Titre</label><input name="title" required autofocus></div><div class="field span-2"><label>Résultat attendu</label><textarea name="description"></textarea></div><div class="field"><label>Responsable</label><select name="ownerId"><option value="">Non assigné</option>${projectParticipantOptions(modal.projectId,'',false)}</select></div><div class="field"><label>État</label><select name="status"><option value="todo">À venir</option><option value="active">En cours</option><option value="done">Terminée</option></select></div><div class="field"><label>Début</label><input name="startDate" type="date"></div><div class="field"><label>Date cible</label><input name="dueDate" type="date"></div><div class="field"><label>Visibilité</label><select name="visibility"><option value="internal">Interne</option><option value="shared">Partagée</option></select></div></div><div class="modal-actions"><button class="btn" type="button" data-action="close-modal">Annuler</button><button class="btn primary" type="submit">Créer la phase</button></div></form>`);
  if (modal.type==='milestone-edit') { const m=(state.projectCache.get(modal.projectId)?.milestones||[]).find(x=>x.id===modal.milestoneId); if(!m)return ''; return modalFrame('Modifier la phase','La roadmap reste courte, lisible et reliée au travail réel.',`<form data-form="milestone-edit"><input type="hidden" name="projectId" value="${escAttr(modal.projectId)}"><input type="hidden" name="milestoneId" value="${escAttr(m.id)}"><div class="form-grid"><div class="field span-2"><label>Titre</label><input name="title" required value="${escAttr(m.title)}"></div><div class="field span-2"><label>Résultat attendu</label><textarea name="description">${esc(m.description||'')}</textarea></div><div class="field"><label>Responsable</label><select name="ownerId"><option value="">Non assigné</option>${projectParticipantOptions(modal.projectId,m.owner_id,false)}</select></div><div class="field"><label>État</label><select name="status">${['todo','active','done','cancelled'].map(v=>`<option value="${v}" ${m.status===v?'selected':''}>${milestoneLabel(v)}</option>`).join('')}</select></div><div class="field"><label>Début</label><input name="startDate" type="date" value="${escAttr(m.start_date||'')}"></div><div class="field"><label>Date cible</label><input name="dueDate" type="date" value="${escAttr(m.due_date||'')}"></div><div class="field"><label>Visibilité</label><select name="visibility"><option value="internal" ${m.visibility!=='shared'?'selected':''}>Interne</option><option value="shared" ${m.visibility==='shared'?'selected':''}>Partagée</option></select></div></div><div class="modal-actions"><button class="btn" type="button" data-action="close-modal">Annuler</button><button class="btn primary" type="submit">Enregistrer</button></div></form>`); }
  if (modal.type==='meeting') return modalFrame('Nouvelle réunion','Planifiez le point et préparez déjà son objectif.',`<form data-form="meeting"><div class="form-grid"><div class="field span-2"><label>Titre</label><input name="title" required autofocus></div><div class="field"><label>Projet</label><select name="projectId"><option value="">Espace entier</option>${writableProjectOptions(modal.projectId,false)}</select></div><div class="field"><label>Visibilité</label><select name="visibility"><option value="internal">Interne</option><option value="shared">Partagée</option></select></div><div class="field"><label>Début</label><input name="startsAt" type="datetime-local"></div><div class="field"><label>Fin</label><input name="endsAt" type="datetime-local"></div><div class="field span-2"><label>Participants</label><div class="project-checks">${meetingParticipantChecks(modal.projectId)}</div></div><div class="field span-2"><label>Objectif / agenda</label><textarea name="agenda" placeholder="Pourquoi cette réunion est-elle nécessaire ?"></textarea></div><div class="field span-2"><label>Lien visio (facultatif)</label><input name="videoRoom" placeholder="https://… ou nom de salle"></div></div><div class="modal-actions"><button class="btn" type="button" data-action="close-modal">Annuler</button><button class="btn primary" type="submit">Planifier</button></div></form>`);
  if (modal.type==='meeting-detail') return meetingDetailModal(modal);
  if (modal.type==='upload') return modalFrame('Ajouter un livrable','Le premier fichier devient la version 1 et reste relié au projet.',`<form data-form="upload"><input type="hidden" name="projectId" value="${escAttr(modal.projectId)}"><div class="stack"><div class="field"><label>Titre du livrable</label><input name="title" required autofocus></div><div class="field"><label>Fichier</label><input type="file" name="file" required></div><div class="field"><label>Visibilité</label><select name="visibility"><option value="internal">Interne</option><option value="shared">Partagé aux invités</option></select></div></div><div class="modal-actions"><button class="btn" type="button" data-action="close-modal">Annuler</button><button class="btn primary" type="submit">Ajouter</button></div></form>`);
  if (modal.type==='version') {const d=findDeliverable(modal.deliverableId);if(!d)return '';return modalFrame('Nouvelle version',d.title,`<form data-form="version"><input type="hidden" name="deliverableId" value="${d.id}"><input type="hidden" name="projectId" value="${d.project_id}"><div class="field"><label>Fichier</label><input type="file" name="file" required></div><div class="modal-actions"><button class="btn" type="button" data-action="close-modal">Annuler</button><button class="btn primary" type="submit">Ajouter la version</button></div></form>`);}
  if (modal.type==='invite') {
    const role = modal.role || 'member';
    const selected = new Set(Array.isArray(modal.projectIds) ? modal.projectIds : (modal.projectId ? [modal.projectId] : []));
    const candidates = role === 'member' ? state.projects.filter(p => p.visibility === 'restricted') : role === 'guest' ? state.projects : [];
    const roleHelp = role === 'admin'
      ? '<div class="notice"><strong>Administrateur :</strong> accès à tout l’espace et à tous les projets. Aucun projet à sélectionner.</div>'
      : role === 'guest'
        ? '<div class="notice"><strong>Invité externe :</strong> accès uniquement aux projets choisis ci-dessous. Il ne recevra jamais automatiquement les futurs projets.</div>'
        : '<div class="notice"><strong>Membre :</strong> accès automatique à tous les projets Équipe actuels et futurs. Sélectionnez seulement les projets restreints à partager immédiatement.</div>';
    const projectArea = role === 'admin' ? '' : `<div class="field span-2"><label>${role==='guest'?'Projets à partager':'Projets restreints à partager'}</label><div class="project-checks">${candidates.length?candidates.map(p=>`<label><input type="checkbox" name="projectIds" value="${p.id}" ${selected.has(p.id)?'checked':''}> ${esc(p.name)}${p.visibility==='restricted'?' <small>· Restreint</small>':''}</label>`).join(''):'<span class="metric-label">Aucun projet concerné.</span>'}</div></div>`;
    return modalFrame('Inviter une personne','Choisissez son rôle et son accès. Les responsabilités se définissent ensuite directement dans les projets.',`<form data-form="invite"><div class="form-grid"><div class="field span-2"><label>Email</label><input type="email" name="email" required autofocus autocomplete="email" value="${escAttr(modal.email||'')}"></div><div class="field span-2"><label>Rôle dans l’espace</label><select name="role" data-invite-role><option value="member" ${role==='member'?'selected':''}>Membre</option><option value="admin" ${role==='admin'?'selected':''}>Administrateur</option><option value="guest" ${role==='guest'?'selected':''}>Invité externe</option></select></div><div class="span-2">${roleHelp}</div>${projectArea}</div><div class="notice"><strong>Connexion :</strong> 2b2c crée un lien personnel lié à cette adresse. La personne se connecte ou crée son propre compte et choisit elle-même son mot de passe.</div><div class="modal-actions"><button class="btn" type="button" data-action="close-modal">Annuler</button><button class="btn primary" type="submit">Créer l’invitation</button></div></form>`);
  }
  if (modal.type==='member-manage') return memberManageModal(modal);
  if (modal.type==='new-direct') return modalFrame('Nouveau message privé','L’audience est figée par les membres du fil. Un lien de projet n’ajoute jamais de lecteur.',`<form data-form="new-direct"><div class="field"><label>Destinataire</label><select name="otherUserId" required><option value="">Choisir…</option>${state.members.filter(m=>m.user_id!==state.user.id&&m.status==='active').map(m=>`<option value="${m.user_id}">${esc(displayName(m.user_id))}</option>`).join('')}</select></div><div class="modal-actions"><button class="btn" type="button" data-action="close-modal">Annuler</button><button class="btn primary" type="submit">Ouvrir le direct</button></div></form>`);
  if (modal.type==='new-group-direct') return modalFrame('Groupe privé','Choisissez au moins une autre personne. Seuls les membres sélectionnés verront ce fil.',`<form data-form="new-group-direct"><div class="field"><label>Nom du groupe</label><input name="title" maxlength="120" placeholder="Ex. Design + Produit"></div><div class="member-check-grid">${state.members.filter(m=>m.user_id!==state.user.id&&m.status==='active').map(m=>`<label><input type="checkbox" name="directMemberIds" value="${m.user_id}">${avatarHtml(m.user_id)}<span>${esc(displayName(m.user_id))}</span></label>`).join('')}</div><div class="modal-actions"><button class="btn" type="button" data-action="close-modal">Annuler</button><button class="btn primary" type="submit">Créer le groupe</button></div></form>`);
  if (modal.type==='new-topic') return modalFrame('Nouveau sujet','Créez un canal d’équipe ou un sujet rattaché à un projet.',`<form data-form="new-topic"><div class="field"><label>Portée</label><select name="topicScope" required><option value="team">Équipe interne</option><option value="project">Projet</option></select></div><div class="field"><label>Projet (si sujet projet)</label><select name="projectId"><option value="">Choisir un projet…</option>${state.projects.filter(p=>canWriteProject(p.id)).map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select></div><div class="field"><label>Nom du sujet</label><input name="title" required maxlength="120" placeholder="Ex. UX mobile, Lancement, Technique"></div><div class="modal-actions"><button class="btn" type="button" data-action="close-modal">Annuler</button><button class="btn primary" type="submit">Créer le sujet</button></div></form>`);
  if (modal.type==='link-direct') {const c=state.conversations.find(x=>x.id===modal.conversationId);return modalFrame('Lier ce direct à un projet','Ce lien ajoute du contexte uniquement : il ne change jamais les personnes qui peuvent lire la conversation.',`<form data-form="link-direct"><input type="hidden" name="conversationId" value="${c?.id||''}"><div class="field"><label>Projet</label><select name="projectId" required><option value="">Choisir…</option>${state.projects.map(p=>`<option value="${p.id}" ${c?.linked_project_id===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}</select></div><div class="modal-actions"><button class="btn" type="button" data-action="close-modal">Annuler</button><button class="btn primary" type="submit">Lier au projet</button></div></form>`)}
  if (modal.type==='conversation-settings') {const cm=state.conversationMembers.find(x=>x.conversation_id===modal.conversationId&&x.user_id===state.user.id);return modalFrame('Notifications du fil','Choisissez ce qui doit remonter dans la cloche.',`<form data-form="conversation-settings"><input type="hidden" name="conversationId" value="${modal.conversationId}"><div class="field"><label>Niveau</label><select name="level"><option value="all" ${cm?.notification_level==='all'?'selected':''}>Toutes les annonces et mentions</option><option value="mentions" ${cm?.notification_level==='mentions'?'selected':''}>Mentions uniquement</option><option value="muted" ${cm?.notification_level==='muted'?'selected':''}>Silencieux</option></select></div><div class="modal-actions"><button class="btn" type="button" data-action="close-modal">Annuler</button><button class="btn primary" type="submit">Enregistrer</button></div></form>`)}
  if (modal.type==='invite-link') return modalFrame('Invitation prête',`Envoyez ce lien uniquement à ${modal.email}.`,`<div class="field"><label>Lien personnel</label><input id="invite-link-value" readonly value="${escAttr(modal.url)}"></div><div class="modal-actions"><button class="btn" data-action="close-modal">Fermer</button><button class="btn primary" data-action="copy-invite">Copier le lien</button></div>`);
  if (modal.type==='invite-accept') return modalFrame('Rejoindre l’espace',`${modal.preview?.workspace_name||''}`,`<div class="notice">Cette invitation vous donne le rôle <strong>${workspaceRoleLabel(modal.preview?.invite_role)}</strong>${modal.preview?.project_names?.length?` sur ${esc(modal.preview.project_names.join(', '))}`:''}.</div><div class="modal-actions"><button class="btn primary" data-action="accept-invite" data-token="${escAttr(modal.token)}">Rejoindre l’espace</button></div>`);
  if (modal.type==='seed') return modalFrame('Préparer l’espace pilote','Crée des projets et objets de travail persistants pour tester 2b2c en situation.',`<div class="notice">HFConcept, Orbit et Orsid Website seront créés avec roadmap, actions, décisions, demandes et réunions. Aucun faux membre n’est créé.</div><div class="modal-actions"><button class="btn" data-action="close-modal">Annuler</button><button class="btn primary" data-action="confirm-seed">Créer les données pilote</button></div>`);
  if (modal.type==='search') return modalFrame(`Rechercher dans ${BRAND_NAME}`,'Projets, actions, demandes, décisions et conversations accessibles.',`<div class="field"><label>Recherche</label><input id="global-search-input" autocomplete="off" placeholder="Ex. Orbit, Prototype V4, validation…" value="${escAttr(state.searchQuery)}"></div><div id="global-search-results" class="search-results">${searchResultsHtml(state.searchQuery)}</div>`);
  if (modal.type==='invite-email-mismatch') return modalFrame('Mauvais compte connecté','Cette invitation appartient à une autre adresse.',`<div class="notice danger">Invitation pour <strong>${esc(modal.preview?.invited_email||'')}</strong><br>Compte connecté : <strong>${esc(state.user?.email||'')}</strong></div><div class="modal-actions"><button class="btn" data-action="signout">Se déconnecter et utiliser le bon compte</button></div>`);
  return '';
}

function modalFrame(title, subtitle, body) { const contextual=/request-detail-v4|approval-detail-v4|meeting-workflow-v4|attention-action-form-v43|activity-detail-v43/.test(body);return `<div class="modal-backdrop ${contextual?'context-drawer-backdrop-v43':''}" data-action="backdrop"><div class="modal ${contextual?'context-drawer-v43':''}" role="dialog" aria-modal="true"><div class="card-head"><div><h2>${esc(title)}</h2><p style="margin:4px 0 0;color:var(--live-muted)">${esc(subtitle||'')}</p></div><button class="icon-button" data-action="close-modal" style="color:#667085">✕</button></div>${body}</div></div>`; }

async function handleClick(event) {
  const target = event.target.closest('[data-action],[data-nav]');
  if (!target) { if(state.userMenuOpen||state.notificationOpen){state.userMenuOpen=false;state.notificationOpen=false;render();} return; }
  if (target.dataset.nav) { state.mobileMenuOpen=false; location.hash = target.dataset.nav.replace(/^#/,''); return; }
  const action = target.dataset.action;
  if (action==='backdrop' && event.target!==target) return;
  try {
    if (action==='auth-switch') { if(!state.invitePreview?.workspace_name) return; state.authMode=state.authMode==='signup'?'signin':'signup'; render(); }
    else if (action==='toggle-password') { event.preventDefault(); const input=document.getElementById(target.getAttribute('aria-controls')||'auth-password'); if(input){const reveal=input.type==='password';input.type=reveal?'text':'password';target.textContent=reveal?'Masquer':'Afficher';target.setAttribute('aria-pressed',reveal?'true':'false');} return; }
    else if (action==='signout') { state.userMenuOpen=false; await api.signOut(); resetState(); history.replaceState({},'',location.pathname); render(); }
    else if (action==='toggle-user-menu') { state.userMenuOpen=!state.userMenuOpen; state.notificationOpen=false; state.mobileMenuOpen=false; render(); }
    else if (action==='toggle-mobile-menu') { event.preventDefault(); state.mobileMenuOpen=!state.mobileMenuOpen; state.userMenuOpen=false; state.notificationOpen=false; render(); if(state.mobileMenuOpen) requestAnimationFrame(()=>document.querySelector('.mobile-drawer-close')?.focus()); }
    else if (action==='open-call-picker-v1') openCallPickerV1();
    else if (action==='call-picker-close-v1') closeCallPickerV1();
    else if (action==='call-person-v1') await startDirectCallV1(target.dataset.user);
    else if (action==='call-team-v1') await startTeamCallV1();
    else if (action==='call-accept-v1') await acceptIncomingCallV1(target.dataset.call);
    else if (action==='call-decline-v1') await declineIncomingCallV1(target.dataset.call);
    else if (action==='call-mic-v1') await toggleMicV1();
    else if (action==='call-camera-v1') await toggleCameraV1();
    else if (action==='call-screen-v1') await toggleScreenV1();
    else if (action==='call-leave-v1') await leaveActiveCallV1();
    else if (action==='call-end-v1') await endActiveCallV1();
    else if (action==='refresh') await refreshWorkspace();
    else if (action==='quick-add') openModal({type:'quick-add'});
    else if (action==='open-activity') openModal({type:'activity'});
    else if (action==='go-messages') { state.modal=null; location.hash='/messages'; }
    else if (action==='open-search') { state.searchQuery=''; openModal({type:'search'}); setTimeout(()=>document.getElementById('global-search-input')?.focus(),0); }
    else if (action==='close-modal'||action==='backdrop') { state.modal=null; state.searchQuery=''; render(); }
    else if (action==='new-project') openModal({type:'project'});
    else if (action==='new-direct') openModal({type:'new-direct'});
    else if (action==='new-group-direct') openModal({type:'new-group-direct'});
    else if (action==='new-topic') openModal({type:'new-topic'});
    else if (action==='link-direct') openModal({type:'link-direct',conversationId:target.dataset.conversation});
    else if (action==='conversation-settings') openModal({type:'conversation-settings',conversationId:target.dataset.conversation});
    else if (action==='message-reply') { const msg=findMessage(target.dataset.message); if(msg){state.replyTo={messageId:msg.id,conversationId:msg.conversation_id,authorId:msg.author_id,body:msg.body};render();setTimeout(()=>document.querySelector('.communication-composer textarea')?.focus(),0);} }
    else if (action==='cancel-reply') { state.replyTo=null; render(); }
    else if (action==='edit-project') openModal({type:'project-edit',projectId:target.dataset.project});
    else if (action==='manage-project') openModal({type:'project-manage',projectId:target.dataset.project});
    else if (action==='pause-project') await setProjectPause(target.dataset.project,true);
    else if (action==='resume-project') await setProjectPause(target.dataset.project,false);
    else if (action==='start-complete-project') await openProjectCompletion(target.dataset.project);
    else if (action==='reopen-project') await reopenProject(target.dataset.project);
    else if (action==='archive-project') await archiveProject(target.dataset.project);
    else if (action==='restore-project') await restoreProject(target.dataset.project);
    else if (action==='delete-project') await deleteProject(target.dataset.project);
    else if (action==='edit-profile') openModal({type:'profile'});
    else if (action==='remove-avatar') await removeAvatar();
    else if (action==='new-action') openModal({type:'action',projectId:target.dataset.project||currentProjectId(),milestoneId:target.dataset.milestone||'',prefillTitle:target.dataset.title||'',sourceType:target.dataset.sourceType||'',sourceId:target.dataset.sourceId||''});
    else if (action==='edit-action') openModal({type:'action-edit',id:target.dataset.id});
    else if (action==='delete-action') await deleteAction(target.dataset.id,target.dataset.project);
    else if (action==='message-to-action') { const msg=findMessage(target.dataset.message); openModal({type:'action',projectId:target.dataset.project||currentProjectId(),prefillTitle:msg?msg.body.slice(0,120):'',sourceType:'message',sourceId:target.dataset.message}); }
    else if (action==='message-to-request') { const msg=findMessage(target.dataset.message); openModal({type:'request',projectId:target.dataset.project||currentProjectId(),prefillTitle:msg?msg.body.slice(0,120):'',sourceType:'message',sourceId:target.dataset.message}); }
    else if (action==='message-to-decision') { const msg=findMessage(target.dataset.message); openModal({type:'decision',projectId:target.dataset.project||currentProjectId(),prefillTitle:msg?msg.body.slice(0,120):'',sourceType:'message',sourceId:target.dataset.message}); }
    else if (action==='new-request') openModal({type:'request',projectId:target.dataset.project||currentProjectId()});
    else if (action==='open-request') openModal({type:'request-detail',id:target.dataset.request});
    else if (action==='close-request') await updateRequestStatus(target.dataset.request,'satisfied');
    else if (action==='reopen-request') await updateRequestStatus(target.dataset.request,'open');
    else if (action==='new-decision') openModal({type:'decision',projectId:target.dataset.project,sourceType:target.dataset.sourceType||'',sourceId:target.dataset.sourceId||''});
    else if (action==='new-milestone') openModal({type:'milestone',projectId:target.dataset.project});
    else if (action==='edit-milestone') openModal({type:'milestone-edit',projectId:target.dataset.project,milestoneId:target.dataset.milestone});
    else if (action==='new-meeting') openModal({type:'meeting',projectId:target.dataset.project||currentProjectId()});
    else if (action==='open-meeting') openModal({type:'meeting-detail',id:target.dataset.meeting});
    else if (action==='meeting-response') await setMeetingResponse(target.dataset.meeting,target.dataset.response);
    else if (action==='meeting-to-action') openModal({type:'action',projectId:target.dataset.project,sourceType:'meeting',sourceId:target.dataset.meeting});
    else if (action==='meeting-to-decision') openModal({type:'decision',projectId:target.dataset.project,sourceType:'meeting',sourceId:target.dataset.meeting});
    else if (action==='upload-file') openModal({type:'upload',projectId:target.dataset.project});
    else if (action==='new-version') openModal({type:'version',deliverableId:target.dataset.deliverable,projectId:target.dataset.project});
    else if (action==='request-approval') openModal({type:'approval-request',versionId:target.dataset.version,projectId:target.dataset.project});
    else if (action==='open-approval') openModal({type:'approval-detail',id:target.dataset.approval});
    else if (action==='approval-decision') await decideApproval(target.dataset.approval,target.dataset.status);
    else if (action==='invite-member') openModal({type:'invite',projectId:target.dataset.project||''});
    else if (action==='manage-member') openModal({type:'member-manage',userId:target.dataset.user});
    else if (action==='library-project') { state.libraryProject=target.dataset.project||'all'; render(); }
    else if (action==='seed-pilot') openModal({type:'seed'});
    else if (action==='confirm-seed') await seedPilot();
    else if (action==='toggle-notifications') { state.notificationOpen=!state.notificationOpen; state.userMenuOpen=false; render(); }
    else if (action==='read-all-notifications') await markAllNotificationsRead();
    else if (action==='retry-sync') await refreshWorkspace({quiet:false});
    else if (action==='open-notification') await openNotification(target.dataset.id,target.dataset.route);
    else if (action==='open-file') await openFile(target.dataset.path);
    else if (action==='copy-invite') await copyText(document.getElementById('invite-link-value')?.value||'');
    else if (action==='accept-invite') await acceptInvite(target.dataset.token);
    else if (action==='accept-invite-direct') await acceptInvite(new URLSearchParams(location.search).get('invite'));
    else if (action==='load-invites') await loadInvites(target);
  } catch (error) { showToast(humanError(error), true); }
}

async function handleSubmit(event) {
  const form = event.target.closest('form[data-form]'); if (!form) return;
  event.preventDefault(); if (state.busy) return;
  state.busy = true; const fd=new FormData(form); const data = Object.fromEntries(fd.entries());
  data.projectIds=fd.getAll('projectIds'); data.responsibilityIds=fd.getAll('responsibilityIds'); data.participantIds=fd.getAll('participantIds'); data.attendeeIds=fd.getAll('attendeeIds'); data.mentionIds=fd.getAll('mentionIds'); data.directMemberIds=fd.getAll('directMemberIds'); data.referenceDeliverableIds=fd.getAll('referenceDeliverableIds');
  try {
    if (form.dataset.form==='auth') await submitAuth(data);
    else if (form.dataset.form==='workspace') await submitWorkspace(data);
    else if (form.dataset.form==='project') await submitProject(data);
    else if (form.dataset.form==='project-edit') await submitProjectEdit(data);
    else if (form.dataset.form==='project-complete') await submitProjectCompletion(data);
    else if (form.dataset.form==='profile') await submitProfile(form,data);
    else if (form.dataset.form==='action') await submitAction(data);
    else if (form.dataset.form==='action-edit') await submitActionEdit(data);
    else if (form.dataset.form==='request') await submitRequest(data);
    else if (form.dataset.form==='request-response') await submitRequestResponse(data);
    else if (form.dataset.form==='decision') await submitDecision(data);
    else if (form.dataset.form==='milestone') await submitMilestone(data);
    else if (form.dataset.form==='milestone-edit') await submitMilestoneEdit(data);
    else if (form.dataset.form==='meeting') await submitMeeting(data);
    else if (form.dataset.form==='meeting-detail') await submitMeetingDetail(data);
    else if (form.dataset.form==='message') await submitMessage(data);
    else if (form.dataset.form==='new-direct') await submitNewDirect(data);
    else if (form.dataset.form==='new-group-direct') await submitNewGroupDirect(data);
    else if (form.dataset.form==='new-topic') await submitNewTopic(data);
    else if (form.dataset.form==='link-direct') await submitLinkDirect(data);
    else if (form.dataset.form==='conversation-settings') await submitConversationSettings(data);
    else if (form.dataset.form==='upload') await submitUpload(form,data);
    else if (form.dataset.form==='version') await submitVersion(form,data);
    else if (form.dataset.form==='approval-request') await submitApprovalRequest(data);
    else if (form.dataset.form==='invite') await submitInvite(data);
    else if (form.dataset.form==='member-manage') await submitMemberManage(data);
  } catch (error) { showToast(humanError(error), true); }
  finally { state.busy=false; render(); }
}

async function handleChange(event) {
  const el = event.target;
  if (el.matches('[data-invite-role]') && state.modal?.type === 'invite') {
    const form = el.closest('form');
    const fd = form ? new FormData(form) : null;
    state.modal = { ...state.modal, role: el.value, email: String(fd?.get('email') || ''), projectIds: fd ? fd.getAll('projectIds') : [] };
    render();
    return;
  }
  if (el.matches('[data-member-role]') && state.modal?.type === 'member-manage') {
    const form = el.closest('form');
    const fd = form ? new FormData(form) : null;
    state.modal = { ...state.modal, role: el.value, projectIds: fd ? fd.getAll('projectIds') : [] };
    render();
    return;
  }
  if (el.matches('[data-status-action]')) {
    try {
      const a=state.actions.find(x=>x.id===el.dataset.statusAction); if(!a||!canWriteProject(a.project_id)) throw new Error('Vous n’avez pas la responsabilité de modifier cette action.');
      await api.update('actions', `id=eq.${a.id}`, { status: el.value, completed_at: el.value==='done'?new Date().toISOString():null },{returnRepresentation:false});
      showToast('Statut mis à jour'); await refreshWorkspace({quiet:true});
    } catch (error) { showToast(humanError(error),true); }
  }
}

function handleInput(event){
  if(event.target?.id==='global-search-input'){state.searchQuery=event.target.value;const zone=document.getElementById('global-search-results');if(zone)zone.innerHTML=searchResultsHtml(state.searchQuery);}
  if(event.target?.id==='library-search'){state.libraryQuery=event.target.value;render();setTimeout(()=>{const x=document.getElementById('library-search');if(x){x.focus();x.setSelectionRange(x.value.length,x.value.length)}},0);}
}

async function submitAuth(data) {
  const invite=state.invitePreview?.workspace_name?state.invitePreview:null;
  const email=String(data.email||'').trim().toLowerCase();
  if(invite && email!==String(invite.invited_email||'').toLowerCase()) throw new Error(`Cette invitation est réservée à ${invite.invited_email}`);
  if (state.authMode === 'signup') {
    const result = await api.signUp({ email, password:String(data.password), displayName:String(data.displayName||'').trim() });
    if (!result?.access_token) { showToast('Compte créé. Confirmez votre adresse email avant de continuer.'); state.authMode='signin'; return; }
    state.user=normalizeUser(result.user); await afterAuthenticated(); showToast(invite?'Compte créé et équipe rejointe':'Compte créé');
  } else {
    const result=await api.signIn({email,password:String(data.password)});
    state.user=normalizeUser(result.user); await afterAuthenticated(); showToast(invite?'Équipe rejointe':'Connexion réussie');
  }
}

async function submitWorkspace(data) {
  const id = await api.rpc('create_workspace',{p_name:String(data.name).trim(),p_slug:String(data.slug).trim().toLowerCase()});
  state.memberships = await api.select('workspace_members',`select=workspace_id,role,status,joined_at,access_mode,last_seen_at&user_id=eq.${state.user.id}&status=eq.active`);
  await selectWorkspace(id); location.hash='#/dashboard'; showToast('Espace créé');
}

async function submitProject(data) {
  const phases=String(data.phaseTitles||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean).slice(0,7);
  const result=await api.rpc('create_project_with_setup',{p_workspace_id:state.workspace.id,p_name:String(data.name).trim(),p_objective:String(data.objective||'').trim(),p_target_date:data.targetDate||null,p_participant_ids:data.participantIds||[],p_phase_titles:phases});
  state.modal=null; await refreshWorkspace({quiet:true}); await loadProject(result.project_id,true); location.hash=`#/projects/${result.project_id}/overview`; showToast('Projet créé avec son équipe et sa roadmap');
}

async function submitProjectEdit(data) {
  const patch={name:String(data.name).trim(),objective:String(data.objective||'').trim(),target_date:data.targetDate||null};
  await api.update('projects',`id=eq.${data.projectId}`,patch,{returnRepresentation:false});
  state.modal=null; await refreshWorkspace({quiet:true}); location.hash=`#/projects/${data.projectId}/overview`; showToast('Projet modifié');
}

async function setProjectPause(projectId,paused){
  await api.rpc('set_project_pause_v1',{p_project_id:projectId,p_paused:!!paused});
  state.modal=null;await refreshWorkspace({quiet:true});location.hash=`#/projects/${projectId}/overview`;showToast(paused?'Projet mis en pause':'Projet repris');
}
async function openProjectCompletion(projectId){
  const preview=await api.rpc('get_project_closure_preview_v1',{p_project_id:projectId});
  state.modal={type:'project-complete',projectId,preview:Array.isArray(preview)?preview[0]:preview};render();
}
async function submitProjectCompletion(data){
  const projectId=data.projectId;const result=String(data.result||'').trim();if(!result)throw new Error('Indiquez le résultat obtenu.');
  await api.rpc('complete_project_v1',{p_project_id:projectId,p_result:result,p_reference_deliverable_ids:data.referenceDeliverableIds||[],p_remaining:String(data.remaining||'').trim(),p_confirm_open:data.confirmOpen==='1'});
  state.modal=null;await refreshWorkspace({quiet:true});location.hash=`#/projects/${projectId}/overview`;showToast('Projet terminé et clôture enregistrée');
}
async function reopenProject(projectId){
  await api.rpc('reopen_project_v1',{p_project_id:projectId});
  state.modal=null;await refreshWorkspace({quiet:true});location.hash=`#/projects/${projectId}/overview`;showToast('Projet réouvert');
}

async function archiveProject(projectId) {
  await api.update('projects',`id=eq.${projectId}`,{status:'archived'},{returnRepresentation:false});
  state.modal=null; await refreshWorkspace({quiet:true}); location.hash='#/projects'; showToast('Projet archivé');
}

async function restoreProject(projectId) {
  await api.update('projects',`id=eq.${projectId}`,{status:'active'},{returnRepresentation:false});
  await refreshWorkspace({quiet:true}); showToast('Projet restauré');
}

async function deleteProject(projectId) {
  if(!['owner','admin'].includes(state.workspaceRole)) throw new Error('Seuls le propriétaire et les administrateurs peuvent supprimer un projet.');
  const files=await api.select('deliverables',`select=id&project_id=eq.${projectId}&limit=1`);
  if(files.length) throw new Error('Ce projet contient des ressources. Archivez-le pour conserver les fichiers ; la suppression complète avec purge Storage sera ajoutée avant production.');
  await api.remove('projects',`id=eq.${projectId}`);
  state.modal=null; await refreshWorkspace({quiet:true}); location.hash='#/projects'; showToast('Projet supprimé');
}

async function removeAvatar(){
  const path=`${state.user.id}/avatar`;
  try { await api.removeObject('profile-avatars',path); } catch (error) { if(!(error instanceof ApiError&&error.status===404)) throw error; }
  await api.update('profiles',`id=eq.${state.user.id}`,{avatar_url:null},{returnRepresentation:false});
  if(state.profile) state.profile.avatar_url=null;
  const own=state.profiles.find(p=>p.id===state.user.id); if(own) own.avatar_url=null;
  state.modal=null; showToast('Photo de profil supprimée'); render();
}

async function submitProfile(form,data) {
  const name=String(data.displayName||'').trim();
  if(!name) throw new Error('Nom affiché requis');
  let avatarUrl=state.profile?.avatar_url||null;
  const file=form.querySelector('input[name=avatar]')?.files?.[0];
  if(file){
    if(file.size>5*1024*1024) throw new Error('L’avatar dépasse 5 Mo');
    if(!['image/jpeg','image/png','image/webp','image/gif'].includes(file.type)) throw new Error('Format avatar non pris en charge');
    const path=`${state.user.id}/avatar`;
    await api.upload('profile-avatars',path,file,{upsert:true});
    avatarUrl=`${config.supabaseUrl.replace(/\/$/,'')}/storage/v1/object/public/profile-avatars/${state.user.id}/avatar?v=${Date.now()}`;
  }
  await api.update('profiles',`id=eq.${state.user.id}`,{display_name:name,avatar_url:avatarUrl},{returnRepresentation:false});
  state.profile={...(state.profile||{}),id:state.user.id,display_name:name,avatar_url:avatarUrl};
  const idx=state.profiles.findIndex(p=>p.id===state.user.id);
  if(idx>=0) state.profiles[idx]={...state.profiles[idx],display_name:name,avatar_url:avatarUrl}; else state.profiles.push(state.profile);
  state.modal=null; render(); showToast('Profil mis à jour');
}

async function submitAction(data) {
  const project=state.projects.find(p=>p.id===data.projectId); if(!project) throw new Error('Projet requis');
  if(!canWriteProject(project.id)) throw new Error('Vous pouvez consulter ce projet, mais vous n’avez pas la responsabilité d’y créer du travail.');
  const rows=await api.insert('actions',[{workspace_id:state.workspace.id,project_id:project.id,title:String(data.title).trim(),description:String(data.description||'').trim(),status:'todo',priority:data.priority||'normal',due_at:localDateTimeToIso(data.dueAt),milestone_id:data.milestoneId||null,visibility:data.visibility||'internal',created_by:state.user.id,source_type:data.sourceType||null,source_id:data.sourceId||null}]);
  if(data.assignee) await api.insert('action_assignees',[{action_id:rows[0].id,user_id:data.assignee}],{returnRepresentation:false});
  state.modal=null; await refreshWorkspace({quiet:true}); showToast(data.sourceType?`${sourceLabel(data.sourceType)} transformé en action`:'Action créée');
}

async function submitActionEdit(data){
  const a=state.actions.find(x=>x.id===data.actionId); if(!a)throw new Error('Action introuvable');
  if(!canWriteProject(a.project_id))throw new Error('Vous n’avez pas la responsabilité de modifier cette action.');
  const status=data.status||'todo'; const blocked=String(data.blockedReason||'').trim();
  if(status==='blocked'&&!blocked)throw new Error('Indiquez la cause du blocage pour que l’équipe puisse agir.');
  await api.update('actions',`id=eq.${a.id}`,{title:String(data.title).trim(),description:String(data.description||'').trim(),status,priority:data.priority||'normal',due_at:localDateTimeToIso(data.dueAt),milestone_id:data.milestoneId||null,blocked_reason:status==='blocked'?blocked:null,visibility:data.visibility||'internal',completed_at:status==='done'?(a.completed_at||new Date().toISOString()):null},{returnRepresentation:false});
  await api.remove('action_assignees',`action_id=eq.${a.id}`);
  if(data.assignee)await api.insert('action_assignees',[{action_id:a.id,user_id:data.assignee}],{returnRepresentation:false});
  state.modal=null;await refreshWorkspace({quiet:true});showToast(status==='blocked'?'Action bloquée · cause enregistrée':'Action mise à jour');
}
async function deleteAction(id,projectId){
  if(!canWriteProject(projectId))throw new Error('Vous ne pouvez pas supprimer cette action.');
  if(!confirm('Supprimer définitivement cette action ?'))return;
  await api.remove('actions',`id=eq.${id}`);state.modal=null;await refreshWorkspace({quiet:true});showToast('Action supprimée');
}
async function submitRequest(data) {
  await api.insert('requests',[{workspace_id:state.workspace.id,project_id:data.projectId||null,title:String(data.title||data.prefillTitle||'').trim(),body:String(data.body||'').trim(),requester_id:state.user.id,recipient_id:data.recipient,status:'open',due_at:localDateTimeToIso(data.dueAt),source_type:data.sourceType||null,source_id:data.sourceId||null}]);
  state.modal=null; await refreshWorkspace({quiet:true}); showToast('Demande envoyée');
}

async function submitRequestResponse(data){
  const r=state.requests.find(x=>x.id===data.requestId);if(!r||r.recipient_id!==state.user.id)throw new Error('Cette demande ne vous est pas adressée.');
  await api.update('requests',`id=eq.${r.id}`,{response:String(data.response||'').trim(),status:'answered',answered_at:new Date().toISOString()},{returnRepresentation:false});
  state.modal=null;await refreshWorkspace({quiet:true});showToast('Réponse envoyée');
}
async function updateRequestStatus(id,status){
  const r=state.requests.find(x=>x.id===id);if(!r)throw new Error('Demande introuvable');
  if(r.requester_id!==state.user.id)throw new Error('Seul le demandeur peut clôturer ou relancer cette demande.');
  await api.update('requests',`id=eq.${id}`,{status},{returnRepresentation:false});state.modal=null;await refreshWorkspace({quiet:true});showToast(status==='satisfied'?'Demande clôturée':'Demande relancée');
}
async function submitDecision(data) {
  if(data.projectId&&!canWriteProject(data.projectId))throw new Error('Vous ne pouvez pas consigner une décision dans ce projet.');
  await api.insert('decisions',[{workspace_id:state.workspace.id,project_id:data.projectId||null,title:String(data.title).trim(),rationale:String(data.rationale||'').trim(),status:'decided',visibility:data.visibility||'internal',decided_by:state.user.id,decided_at:new Date().toISOString(),created_by:state.user.id,source_type:data.sourceType||null,source_id:data.sourceId||null}]);
  state.modal=null; if(data.projectId)await loadProject(data.projectId,true);else await refreshWorkspace({quiet:true}); showToast('Décision enregistrée dans la mémoire du projet');
}

async function submitMilestone(data) {
  if(!canWriteProject(data.projectId))throw new Error('Vous ne pouvez pas modifier la roadmap de ce projet.');
  const current=state.projectCache.get(data.projectId)?.milestones||[];
  await api.insert('milestones',[{workspace_id:state.workspace.id,project_id:data.projectId,title:String(data.title).trim(),description:String(data.description||'').trim(),position:current.length+1,status:data.status||'todo',start_date:data.startDate||null,due_date:data.dueDate||null,owner_id:data.ownerId||null,visibility:data.visibility||'internal'}]);
  state.modal=null; await loadProject(data.projectId,true); showToast('Phase ajoutée à la roadmap');
}

async function submitMilestoneEdit(data) {
  if(!canWriteProject(data.projectId))throw new Error('Vous ne pouvez pas modifier cette roadmap.');
  await api.update('milestones',`id=eq.${data.milestoneId}`,{title:String(data.title).trim(),description:String(data.description||'').trim(),status:data.status,start_date:data.startDate||null,due_date:data.dueDate||null,owner_id:data.ownerId||null,visibility:data.visibility||'internal'},{returnRepresentation:false});
  state.modal=null; await loadProject(data.projectId,true); showToast('Roadmap mise à jour');
}

async function submitMeeting(data) {
  if(data.projectId&&!canWriteProject(data.projectId))throw new Error('Vous ne pouvez pas planifier une réunion dans ce projet.');
  const starts=localDateTimeToIso(data.startsAt); const ends=localDateTimeToIso(data.endsAt);
  if(starts&&ends&&new Date(ends)<new Date(starts))throw new Error('La fin doit être postérieure au début.');
  const attendeeIds=[...new Set([state.user.id,...(data.attendeeIds||[])])];
  const includesGuest=attendeeIds.some(id=>state.members.some(m=>m.user_id===id&&m.role==='guest'));
  const visibility=includesGuest?'shared':(data.visibility||'internal');
  const rows=await api.insert('meetings',[{workspace_id:state.workspace.id,project_id:data.projectId||null,title:String(data.title).trim(),status:'planned',starts_at:starts,ends_at:ends,video_room:String(data.videoRoom||'').trim()||null,agenda:String(data.agenda||'').trim(),visibility,created_by:state.user.id}]);
  await api.insert('meeting_attendees',attendeeIds.map(user_id=>({meeting_id:rows[0].id,user_id,response:user_id===state.user.id?'accepted':'pending'})),{returnRepresentation:false});
  state.modal={type:'meeting-detail',id:rows[0].id}; await refreshWorkspace({quiet:true}); showToast(includesGuest?'Réunion planifiée · partagée avec les invités':'Réunion planifiée · agenda prêt');
}

async function submitMeetingDetail(data){
  const m=state.meetings.find(x=>x.id===data.meetingId);if(!m)throw new Error('Réunion introuvable');
  if(m.project_id&&!canWriteProject(m.project_id))throw new Error('Vous ne pouvez pas modifier cette réunion.');
  await api.update('meetings',`id=eq.${m.id}`,{agenda:String(data.agenda||'').trim(),live_notes:String(data.liveNotes||'').trim(),summary:String(data.summary||'').trim(),status:data.status||m.status,visibility:data.visibility||m.visibility||'internal'},{returnRepresentation:false});
  state.modal=null;await refreshWorkspace({quiet:true});showToast(data.status==='completed'?'Réunion clôturée · synthèse conservée':'Réunion mise à jour');
}


async function decideApproval(id,status){
  const a=state.approvals.find(x=>x.id===id);if(!a||a.validator_id!==state.user.id||a.status!=='pending')throw new Error('Cette validation ne peut pas être traitée.');
  const comment=String(document.getElementById('approval-comment')?.value||'').trim();
  if(status==='changes_requested'&&!comment)throw new Error('Expliquez les modifications attendues.');
  await api.update('approvals',`id=eq.${id}`,{status,decision_note:comment,comment,decided_at:new Date().toISOString()},{returnRepresentation:false});state.modal=null;await refreshWorkspace({quiet:true});await loadProject(a.project_id,true);showToast(status==='approved'?'Version approuvée · le projet peut avancer':'Modifications demandées');
}
async function submitMemberManage(data){
  if(!['owner','admin'].includes(state.workspaceRole))throw new Error('Vous ne pouvez pas modifier les accès.');
  const member=state.members.find(m=>m.user_id===data.userId);if(!member||member.role==='owner')throw new Error('Ce membre ne peut pas être modifié ici.');
  const role=data.role||'member';
  let projectIds=[...new Set(data.projectIds||[])];
  if(role==='admin') projectIds=[];
  if(role==='member') {
    const restricted=new Set(state.projects.filter(p=>p.visibility==='restricted').map(p=>p.id));
    projectIds=projectIds.filter(id=>restricted.has(id));
  }
  if(role==='guest'&&!projectIds.length)throw new Error('Un invité externe doit avoir au moins un projet partagé.');
  await api.rpc('set_workspace_member_access_v1', {
    p_workspace_id: state.workspace.id,
    p_user_id: member.user_id,
    p_role: role,
    p_project_ids: projectIds,
  });
  state.modal=null;await refreshWorkspace({quiet:true});showToast('Accès du membre mis à jour');
}
async function submitMessage(data) {
  const body=String(data.body||'').trim(); if(!body)return;
  const isAnnouncement=data.isAnnouncement==='1';
  const subject=isAnnouncement?String(data.subject||'').trim():null;
  if(isAnnouncement&&!subject)throw new Error('Ajoutez un titre à l’annonce.');
  const replyId=state.replyTo?.conversationId===data.conversationId?state.replyTo.messageId:null;
  await api.rpc('send_message_with_mentions_v2',{
    p_conversation_id:data.conversationId,p_body:body,p_format:isAnnouncement?'structured':'chat',p_subject:subject,
    p_is_announcement:isAnnouncement,p_reply_to_id:replyId,p_mentioned_user_ids:data.mentionIds||[]
  });
  state.replyTo=null;await loadMessages(data.conversationId,true);await refreshMessageBadges();showToast(isAnnouncement?'Annonce publiée':'Message envoyé');
}

async function submitNewDirect(data){
  if(!data.otherUserId)throw new Error('Choisissez un destinataire.');
  const id=await api.rpc('get_or_create_direct_v2',{p_workspace_id:state.workspace.id,p_other_user_id:data.otherUserId});
  state.modal=null;await refreshWorkspace({quiet:true});location.hash=`#/messages/${scalarRpc(id)}`;showToast('Conversation privée ouverte');
}
async function submitNewGroupDirect(data){
  if(!(data.directMemberIds||[]).length)throw new Error('Choisissez au moins une autre personne.');
  const id=await api.rpc('create_group_direct_v2',{p_workspace_id:state.workspace.id,p_user_ids:data.directMemberIds||[],p_title:String(data.title||'').trim()||null});
  state.modal=null;await refreshWorkspace({quiet:true});location.hash=`#/messages/${scalarRpc(id)}`;showToast('Groupe privé créé');
}
async function submitNewTopic(data){
  const title=String(data.title||'').trim();if(!title)throw new Error('Donnez un nom au sujet.');
  let id;if(data.topicScope==='project'){if(!data.projectId)throw new Error('Choisissez le projet du sujet.');id=await api.rpc('create_project_topic_v2',{p_project_id:data.projectId,p_title:title});}
  else id=await api.rpc('create_team_topic_v2',{p_workspace_id:state.workspace.id,p_title:title});
  state.modal=null;await refreshWorkspace({quiet:true});location.hash=`#/messages/${scalarRpc(id)}`;showToast('Sujet créé');
}
async function submitLinkDirect(data){await api.rpc('link_direct_to_project_v2',{p_conversation_id:data.conversationId,p_project_id:data.projectId});state.modal=null;await refreshWorkspace({quiet:true});location.hash=`#/messages/${data.conversationId}`;showToast('Projet lié sans modifier l’audience');}
async function submitConversationSettings(data){await api.rpc('set_conversation_notifications_v2',{p_conversation_id:data.conversationId,p_level:data.level});state.modal=null;await refreshWorkspace({quiet:true});showToast('Préférences enregistrées');}
async function refreshMessageBadges(){
  if(!state.workspace)return;try{const [unread,badges]=await Promise.all([api.rpc('get_unread_conversations_v2',{p_workspace_id:state.workspace.id}),api.rpc('get_message_badges_v2',{p_workspace_id:state.workspace.id})]);state.unreadConversations=new Map((Array.isArray(unread)?unread:[]).map(row=>[row.conversation_id,Number(row.unread_count)||0]));const b=first(Array.isArray(badges)?badges:[])||{};state.unreadMessages=Number(b.unread_messages)||0;state.unreadMentions=Number(b.unread_mentions)||0;}catch(error){console.warn('message badges failed',error)}
}
function scalarRpc(value){return Array.isArray(value)?(value[0]?.id||value[0]?.get_or_create_direct_v2||value[0]?.create_group_direct_v2||value[0]?.create_team_topic_v2||value[0]?.create_project_topic_v2||value[0]):value}


async function registerUploadedVersion(deliverableId,path,file){
  const result=await api.rpc('register_deliverable_version_v2',{p_deliverable_id:deliverableId,p_storage_path:path,p_file_name:file.name,p_mime_type:file.type||null,p_size_bytes:file.size});
  const value=Array.isArray(result)?result[0]:result;
  return Number(value?.register_deliverable_version_v2??value)||0;
}

async function submitUpload(form,data) {
  const file=form.querySelector('input[type=file]')?.files?.[0]; if(!file) throw new Error('Fichier requis');
  if(!canWriteProject(data.projectId))throw new Error('Vous ne pouvez pas ajouter de ressource dans ce projet.');
  if(file.size>50*1024*1024) throw new Error('Le fichier dépasse 50 Mo');
  const safeName=file.name.replace(/[^a-zA-Z0-9._-]+/g,'-').replace(/^-+|-+$/g,'')||'fichier';
  const path=`${state.workspace.id}/${data.projectId}/${crypto.randomUUID()}-${safeName}`;
  const deliverables=await api.insert('deliverables',[{workspace_id:state.workspace.id,project_id:data.projectId,title:String(data.title).trim(),description:'',visibility:data.visibility||'internal',status:'draft',created_by:state.user.id}]);
  let uploaded=false;
  try {
    await api.upload('workspace-files',path,file); uploaded=true;
    await registerUploadedVersion(deliverables[0].id,path,file);
  } catch(error) {
    if(uploaded){try{await api.removeObject('workspace-files',path)}catch{}}
    try{await api.remove('deliverables',`id=eq.${deliverables[0].id}`)}catch{}
    throw error;
  }
  state.modal=null; await loadProject(data.projectId,true); showToast('Livrable ajouté · version 1');
}

async function submitVersion(form,data){
  const d=findDeliverable(data.deliverableId);if(!d)throw new Error('Livrable introuvable');if(!canWriteProject(d.project_id))throw new Error('Vous ne pouvez pas ajouter de version.');
  const file=form.querySelector('input[type=file]')?.files?.[0];if(!file)throw new Error('Fichier requis');if(file.size>50*1024*1024)throw new Error('Le fichier dépasse 50 Mo');
  const safe=file.name.replace(/[^a-zA-Z0-9._-]+/g,'-').replace(/^-+|-+$/g,'')||'fichier';const path=`${state.workspace.id}/${d.project_id}/${crypto.randomUUID()}-${safe}`;
  let uploaded=false;
  try{
    await api.upload('workspace-files',path,file);uploaded=true;
    const number=await registerUploadedVersion(d.id,path,file);
    state.modal=null;await loadProject(d.project_id,true);showToast(number?`Version ${number} ajoutée`:'Nouvelle version ajoutée');
  }catch(error){if(uploaded){try{await api.removeObject('workspace-files',path)}catch{}}throw error;}
}

async function submitApprovalRequest(data){
  const d=findDeliverable(data.deliverableId);if(!d)throw new Error('Livrable introuvable');if(!canWriteProject(d.project_id))throw new Error('Vous ne pouvez pas demander cette validation.');
  const validator=state.members.find(m=>m.user_id===data.validatorId);if(!validator)throw new Error('Validateur introuvable');
  const mapped=state.projectMembers.some(pm=>pm.project_id===d.project_id&&pm.user_id===data.validatorId);
  const broadAccess=['owner','admin'].includes(validator.role)||(validator.role==='member'&&validator.access_mode==='all');
  if(!mapped&&!broadAccess)throw new Error('Ce validateur n’a pas accès à ce projet.');
  if(validator.role==='guest'&&d.visibility!=='shared')await api.update('deliverables',`id=eq.${d.id}`,{visibility:'shared',status:'review',updated_at:new Date().toISOString()},{returnRepresentation:false});else await api.update('deliverables',`id=eq.${d.id}`,{status:'review',updated_at:new Date().toISOString()},{returnRepresentation:false});
  await api.insert('approvals',[{workspace_id:state.workspace.id,project_id:d.project_id,deliverable_version_id:data.versionId,requested_by:state.user.id,validator_id:data.validatorId,status:'pending',request_note:String(data.comment||'').trim(),comment:''}]);
  state.modal=null;await refreshWorkspace({quiet:true});await loadProject(d.project_id,true);showToast('Validation demandée');
}

async function submitInvite(data) {
  if(!['owner','admin'].includes(state.workspaceRole)) throw new Error('Vous ne pouvez pas inviter de membre.');
  const role = data.role || 'member';
  const email = String(data.email || '').trim().toLowerCase();
  if(!email) throw new Error('Adresse email requise.');
  let projectIds = [...new Set(data.projectIds || [])];
  if(role === 'admin') projectIds = [];
  if(role === 'member') {
    const restricted = new Set(state.projects.filter(p => p.visibility === 'restricted').map(p => p.id));
    projectIds = projectIds.filter(id => restricted.has(id));
  }
  if(role === 'guest' && !projectIds.length) throw new Error('Choisissez au moins un projet pour un invité externe.');
  const result = await api.rpc('create_workspace_invite_v2', {
    p_workspace_id: state.workspace.id,
    p_email: email,
    p_role: role,
    p_project_ids: projectIds,
  });
  const invite = Array.isArray(result) ? result[0] : result;
  if(!invite?.token) throw new Error('Invitation créée sans lien exploitable.');
  const url = new URL(location.origin + location.pathname);
  url.searchParams.set('invite', invite.token);
  state.modal = {type:'invite-link',url:url.toString(),email};
  render();
}

async function seedPilot() {
  if(state.projects.length) throw new Error('L’espace contient déjà des projets');
  state.busy=true; render();
  try {
    const defs=[
      ['HFConcept','Finaliser un prototype testable et organiser un test utilisateurs réaliste.','2026-09-30'],
      ['Orbit','Stabiliser le prototype multijoueur et valider la synchronisation réseau.','2026-10-12'],
      ['Orsid Website','Valider le design puis préparer le passage au développement.','2026-10-18']
    ];
    const created=[];
    for(const [name,objective,target] of defs) created.push(await api.rpc('create_project',{p_workspace_id:state.workspace.id,p_name:name,p_objective:objective,p_target_date:target}));
    const [hf,orbit,orsid]=created.map(x=>x.project_id);
    const milestones=await api.insert('milestones',[
      {workspace_id:state.workspace.id,project_id:hf,title:'Concept',position:1,status:'done'},
      {workspace_id:state.workspace.id,project_id:hf,title:'Prototype V4',position:2,status:'active',due_date:'2026-09-10'},
      {workspace_id:state.workspace.id,project_id:hf,title:'Tests utilisateurs',position:3,status:'todo',due_date:'2026-09-20'},
      {workspace_id:state.workspace.id,project_id:orbit,title:'Stabilisation réseau',position:1,status:'active',due_date:'2026-09-18'},
      {workspace_id:state.workspace.id,project_id:orsid,title:'Design approuvé',position:1,status:'active',due_date:'2026-09-15'}
    ]);
    await api.insert('actions',[
      {workspace_id:state.workspace.id,project_id:hf,milestone_id:milestones[1].id,title:'Valider Prototype V4',description:'Vérifier la cohérence du prototype avant la session.',status:'in_progress',priority:'urgent',due_at:'2026-09-08T14:00:00Z',created_by:state.user.id},
      {workspace_id:state.workspace.id,project_id:hf,milestone_id:milestones[2].id,title:'Préparer session 6 joueurs',description:'Protocole, matériel et grille de retours.',status:'todo',priority:'high',due_at:'2026-09-12T13:00:00Z',created_by:state.user.id},
      {workspace_id:state.workspace.id,project_id:orbit,milestone_id:milestones[3].id,title:'Corriger désynchronisation à la reconnexion',description:'Reproduire puis documenter le cas avant correction.',status:'blocked',priority:'high',blocked_reason:'Scénario reproductible incomplet',due_at:'2026-09-11T16:00:00Z',created_by:state.user.id},
      {workspace_id:state.workspace.id,project_id:orsid,milestone_id:milestones[4].id,title:'Valider Homepage V3',description:'Relire desktop et mobile avant développement.',status:'in_progress',priority:'high',due_at:'2026-09-09T15:00:00Z',created_by:state.user.id}
    ]);
    await api.insert('decisions',[
      {workspace_id:state.workspace.id,project_id:hf,title:'Direction B retenue',rationale:'Compréhension plus rapide pendant les essais internes.',status:'decided',decided_by:state.user.id,decided_at:new Date().toISOString(),created_by:state.user.id},
      {workspace_id:state.workspace.id,project_id:orbit,title:'Priorité à la reconnexion',rationale:'Le test multijoueur ne doit pas démarrer avec ce risque ouvert.',status:'decided',decided_by:state.user.id,decided_at:new Date().toISOString(),created_by:state.user.id}
    ]);
    await api.insert('requests',[{workspace_id:state.workspace.id,project_id:hf,title:'Accès sandbox partenaire',body:'Récupérer les identifiants nécessaires pour terminer le test d’intégration.',requester_id:state.user.id,recipient_id:state.user.id,status:'open',due_at:'2026-09-08T10:00:00Z'}]);
    await api.insert('meetings',[
      {workspace_id:state.workspace.id,project_id:hf,title:'Test utilisateurs V4',status:'planned',starts_at:'2026-09-12T13:00:00Z',ends_at:'2026-09-12T14:00:00Z',video_room:'hfconcept-test-v4',created_by:state.user.id},
      {workspace_id:state.workspace.id,project_id:orbit,title:'Point blocage réseau',status:'planned',starts_at:'2026-09-09T09:00:00Z',ends_at:'2026-09-09T09:30:00Z',video_room:'orbit-network',created_by:state.user.id}
    ]);
    state.modal=null; await refreshWorkspace({quiet:true}); showToast('Espace pilote prêt : données réelles créées');
  } finally { state.busy=false; render(); }
}

async function loadProject(projectId, force=false) {
  if(!force && state.projectCache.has(projectId)) return;
  try {
    const [milestones,decisions,deliverables]=await Promise.all([
      api.select('milestones',`select=*&project_id=eq.${projectId}&order=position.asc`),
      api.select('decisions',`select=*&project_id=eq.${projectId}&order=created_at.desc`),
      api.select('deliverables',`select=*&project_id=eq.${projectId}&order=created_at.desc`)
    ]);
    let versions=[];
    if(deliverables.length){const ids=deliverables.map(d=>d.id).join(',');versions=await api.select('deliverable_versions',`select=*&deliverable_id=in.(${ids})&order=version_number.desc`);}
    state.projectCache.set(projectId,{milestones,decisions,deliverables,versions}); render();
  } catch(error){showToast(humanError(error),true);}
}

async function loadMessages(conversationId, force=false) {
  if(state.messageLoads.has(conversationId))return;
  const unread=Number(state.unreadConversations.get(conversationId)||0);
  if(!force&&state.messages.has(conversationId)&&!unread)return;
  state.messageLoads.add(conversationId);
  try {
    state.messages.set(conversationId,await api.select('messages',`select=*&conversation_id=eq.${conversationId}&order=created_at.asc&limit=300`));
    await api.rpc('mark_conversation_read_v2',{p_conversation_id:conversationId,p_seen_at:new Date().toISOString()});
    state.unreadConversations.delete(conversationId);await refreshMessageBadges();render();
  } catch(error){showToast(humanError(error),true);}
  finally{state.messageLoads.delete(conversationId);}
}

async function acceptInvite(token) {
  if(!token) throw new Error('Invitation invalide');
  const preview=state.invitePreview?.workspace_name?state.invitePreview:first(await api.rpc('workspace_invite_public_preview',{p_token:token}));
  if(preview?.invited_email && String(preview.invited_email).toLowerCase()!==String(state.user?.email||'').toLowerCase()) throw new Error(`Cette invitation est réservée à ${preview.invited_email}`);
  const workspaceId=await api.rpc('accept_workspace_invite',{p_token:token});
  state.memberships=await api.select('workspace_members',`select=workspace_id,role,status,joined_at,access_mode,last_seen_at&user_id=eq.${state.user.id}&status=eq.active`);
  history.replaceState({},'',location.pathname+'#/welcome'); state.modal=null; await selectWorkspace(workspaceId);
  state.welcome={workspaceName:preview?.workspace_name||state.workspace.name,role:preview?.invite_role||state.workspaceRole,projectNames:preview?.project_names||[],accessMode:preview?.access_mode};
  location.hash='#/welcome'; showToast('Vous avez rejoint l’espace');
}

async function markAllNotificationsRead() {
  const unread=state.notifications.filter(n=>!n.read_at); if(!unread.length)return;
  await api.update('notifications',`user_id=eq.${state.user.id}&read_at=is.null`,{read_at:new Date().toISOString()},{returnRepresentation:false});
  state.notifications.forEach(n=>n.read_at ||= new Date().toISOString()); state.notificationOpen=false; render();
}

async function openNotification(id,route) {
  const n=state.notifications.find(n=>String(n.id)===String(id));
  if(n&&!n.read_at){await api.update('notifications',`id=eq.${id}`,{read_at:new Date().toISOString()},{returnRepresentation:false});n.read_at=new Date().toISOString();}
  state.notificationOpen=false; location.hash=(route||'#/dashboard').replace(/^#/,''); render();
}

async function setMeetingResponse(meetingId,response){
  if(!['accepted','declined'].includes(response))throw new Error('Réponse de réunion invalide.');
  const attendee=state.meetingAttendees.find(a=>a.meeting_id===meetingId&&a.user_id===state.user.id);
  if(!attendee)throw new Error('Vous ne faites pas partie de cette réunion.');
  await api.update('meeting_attendees',`meeting_id=eq.${meetingId}&user_id=eq.${state.user.id}`,{response},{returnRepresentation:false});
  attendee.response=response;
  await refreshWorkspace({quiet:true});
  showToast(response==='accepted'?'Participation confirmée':'Réunion déclinée');
}

async function openFile(path) { const url=await api.signedUrl('workspace-files',path,900); window.open(url,'_blank','noopener,noreferrer'); }
async function loadInvites(button) {
  const rows=await api.select('workspace_invites',`select=*&workspace_id=eq.${state.workspace.id}&order=created_at.desc&limit=30`);
  const parent=button.closest('#invite-list')||document.getElementById('invite-list'); if(!parent)return;
  const accessLabel=(invite)=>invite.role==='admin'?'Accès global':invite.role==='guest'?'Projets explicitement partagés':'Projets Équipe automatiques';
  parent.innerHTML=rows.length?`<div class="stack">${rows.map(i=>`<div class="list-row"><div class="list-main"><strong>${esc(i.email)}</strong><small>${workspaceRoleLabel(i.role)} · ${accessLabel(i)} · ${inviteStatus(i.status)} · expire ${formatDate(i.expires_at)}</small></div><span class="pill ${i.status==='pending'?'blue':i.status==='accepted'?'good':''}">${inviteStatus(i.status)}</span></div>`).join('')}</div>`:empty('Aucune invitation','Utilisez Inviter pour créer un accès ciblé.');
}

function projectCard(p){return projectCardV3(p)}

function actionRow(a,editable=false,milestones=[]){const assigned=state.assignees.filter(x=>x.action_id===a.id).map(x=>displayName(x.user_id)).join(', ');const milestone=milestones.find(m=>m.id===a.milestone_id);return `<button class="list-row list-button action-row-v4 ${a.status==='blocked'?'blocked':''}" ${editable?`data-action="edit-action" data-id="${a.id}"`:`data-nav="#/projects/${a.project_id}/work/list"`}><span class="pill ${statusTone(a.status)}">${statusLabel(a.status)}</span><div class="list-main"><strong>${esc(a.title)}</strong><small>${esc(projectName(a.project_id))}${milestone?` · ${esc(milestone.title)}`:''}${assigned?` · ${esc(assigned)}`:''}${a.due_at?` · ${formatDateTime(a.due_at)}`:''}${a.blocked_reason?` · Blocage : ${esc(a.blocked_reason)}`:''}</small></div><span class="priority-mark ${a.priority}">${priorityLabel(a.priority)}</span><span>›</span></button>`}

function requestRow(r){return `<button class="list-row list-button" data-action="open-request" data-request="${r.id}"><span class="pill ${r.status==='open'?'warn':r.status==='answered'?'blue':'good'}">${requestStatus(r.status)}</span><div class="list-main"><strong>${esc(r.title)}</strong><small>${esc(projectName(r.project_id)||'Sans projet')} · ${r.recipient_id===state.user.id?'Reçue':'Envoyée'}${r.due_at?` · ${formatDateTime(r.due_at)}`:''}</small></div><span>›</span></button>`}

function meetingRow(m,clickable=true){return `<button class="meeting-card-v4 ${clickable?'clickable-card':''}" ${clickable?`data-action="open-meeting" data-meeting="${m.id}"`:''}><div class="meeting-card-date"><strong>${m.starts_at?new Intl.DateTimeFormat('fr-FR',{day:'2-digit'}).format(new Date(m.starts_at)):'—'}</strong><small>${m.starts_at?new Intl.DateTimeFormat('fr-FR',{month:'short'}).format(new Date(m.starts_at)):'À dater'}</small></div><div class="meeting-card-copy"><strong>${esc(m.title)}</strong><small>${esc(projectName(m.project_id)||'Espace')} · ${m.starts_at?formatDateTime(m.starts_at):'Date à définir'}</small></div><span class="pill ${m.status==='completed'?'good':m.status==='live'?'blue':''}">${meetingStatusLabel(m.status)}</span><span>›</span></button>`}

function messageBubble(m){const mine=m.author_id===state.user.id;const conversation=state.conversations.find(c=>c.id===m.conversation_id);const canTransform=conversation?.project_id&&canWriteProject(conversation.project_id);const parent=m.reply_to_id?findMessage(m.reply_to_id):null;return `<div class="message ${m.is_announcement?'announcement-message':''}" id="message-${m.id}">${avatarHtml(m.author_id)}<div class="message-body ${mine?'mine':''}"><div class="message-meta">${esc(displayName(m.author_id))} · ${relativeDate(new Date(m.created_at))}${m.edited_at?' · modifié':''}${m.is_announcement?' · Annonce':''}</div>${m.subject?`<strong class="message-subject">${esc(m.subject)}</strong>`:''}${parent?`<div class="message-reply-preview">↪ ${esc(displayName(parent.author_id))} · ${esc(parent.body.slice(0,120))}</div>`:''}<div>${m.deleted_at?'<em>Message supprimé</em>':nl2br(esc(m.body))}</div>${!m.deleted_at?`<div class="message-tools"><button class="text-action" data-action="message-reply" data-message="${m.id}">↩ Répondre</button>${canTransform?`<button class="text-action" data-action="message-to-action" data-message="${m.id}" data-project="${conversation.project_id}">→ Action</button><button class="text-action" data-action="message-to-request" data-message="${m.id}" data-project="${conversation.project_id}">→ Demande</button><button class="text-action" data-action="message-to-decision" data-message="${m.id}" data-project="${conversation.project_id}">→ Décision</button>`:''}</div>`:''}</div></div>`}

function myActions(){return assignedOpenActions().sort((a,b)=>new Date(a.due_at||'2999')-new Date(b.due_at||'2999'));}
function projectOptions(selected='',required=true){if(required&&!state.projects.length)return '<option value="">Aucun projet disponible</option>';return state.projects.map(p=>`<option value="${p.id}" ${p.id===selected?'selected':''}>${esc(p.name)}</option>`).join('')}
function memberOptions(exclude=''){return state.members.filter(m=>m.user_id!==exclude&&m.role!=='guest').map(m=>`<option value="${m.user_id}">${esc(displayName(m.user_id))}</option>`).join('')}
function memberOptionsSelected(selected=''){return state.members.filter(m=>m.role!=='guest').map(m=>`<option value="${m.user_id}" ${m.user_id===selected?'selected':''}>${esc(displayName(m.user_id))}</option>`).join('')}
function milestoneOptions(projectId,selected=''){return (state.projectCache.get(projectId)?.milestones||[]).map(m=>`<option value="${m.id}" ${m.id===selected?'selected':''}>${esc(m.title)}</option>`).join('')}
function displayName(id){return state.profiles.find(p=>p.id===id)?.display_name || (id===state.user?.id ? state.profile?.display_name : '') || 'Membre'}
function avatarHtml(id,dark=false){const profile=state.profiles.find(p=>p.id===id)||(id===state.user?.id?state.profile:null);const url=profile?.avatar_url;return url?`<span class="avatar image ${dark?'dark':''}"><img src="${escAttr(url)}" alt=""></span>`:`<span class="avatar ${dark?'dark':''}">${initials(displayName(id))}</span>`}
function projectName(id){return state.projects.find(p=>p.id===id)?.name||''}
function currentProjectId(){const r=parseRoute();return r.name==='project'?r.id:''}
function firstName(name){const n=String(name||'').trim().split(/\s+/)[0]||'';return n?n.charAt(0).toUpperCase()+n.slice(1):'Bonjour'}
function initials(name){return String(name||'?').split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase()||'?'}
function first(arr){return Array.isArray(arr)?arr[0]||null:arr||null}
function normalizeUser(u){return u?{...u,email:u.email||u.user_metadata?.email}:null}
function openModal(modal){state.modal=modal;state.notificationOpen=false;state.userMenuOpen=false;state.mobileMenuOpen=false;render()}
function empty(title,text){return `<div class="empty"><strong>${esc(title)}</strong>${esc(text)}</div>`}
function loadingScreen(){return '<div class="onboarding"><div class="onboarding-card"><div class="skeleton"></div><div class="skeleton" style="margin-top:12px"></div></div></div>'}
function resetState(){Object.assign(state,{authMode:'signin',user:null,profile:null,memberships:[],workspace:null,workspaceRole:null,projects:[],archivedProjects:[],members:[],profiles:[],notifications:[],requests:[],approvals:[],meetings:[],meetingAttendees:[],milestones:[],actions:[],assignees:[],decisions:[],deliverables:[],deliverableVersions:[],conversations:[],conversationMembers:[],projectMembers:[],projectCache:new Map(),messages:new Map(),unreadMessages:0,unreadMentions:0,unreadConversations:new Map(),replyTo:null,messageLoads:new Set(),modal:null,toast:[],notificationOpen:false,userMenuOpen:false,mobileMenuOpen:false,invitePreview:null,welcome:null,searchQuery:'',libraryQuery:'',libraryProject:'all',busy:false,lastSync:null,syncError:null,previousSeenAt:null,seenMarkedAt:null,loading:false})}
function showToast(message,error=false){state.toast.push({id:crypto.randomUUID(),message,error});setTimeout(()=>{state.toast=state.toast.filter(t=>t.message!==message);renderToasts()},4200);renderToasts()}
function renderToasts(){document.querySelector('.toast-wrap')?.remove();if(!state.toast.length)return;const wrap=document.createElement('div');wrap.className='toast-wrap';wrap.innerHTML=state.toast.slice(-3).map(t=>`<div class="toast ${t.error?'error':''}">${esc(t.message)}</div>`).join('');document.body.appendChild(wrap)}
function humanError(error){if(error instanceof ApiError&&error.status===409)return 'Cet élément existe déjà.';const msg=String(error?.message||error||'Erreur inconnue');if(/Invalid login credentials/i.test(msg))return 'Email ou mot de passe incorrect.';if(/Email not confirmed/i.test(msg))return 'L’adresse email doit être confirmée avant connexion.';if(/duplicate key.*workspace_invites/i.test(msg))return 'Une invitation en attente existe déjà pour cet email.';if(/approvals_one_pending_per_validator_version/i.test(msg))return 'Une validation est déjà en attente auprès de cette personne pour cette version.';if(/APPROVAL_ONLY_VALIDATOR_CAN_DECIDE/i.test(msg))return 'Seul le validateur désigné peut prendre cette décision.';if(/APPROVAL_ALREADY_FINAL|APPROVAL_FINAL_DECISION_IMMUTABLE/i.test(msg))return 'Cette validation a déjà été traitée.';if(/MEETING_ATTENDEE_IDENTITY_IMMUTABLE/i.test(msg))return 'Cette invitation de réunion ne peut pas être déplacée vers une autre personne.';if(/row-level security/i.test(msg))return 'Vous n’avez pas les droits nécessaires pour cette action.';return msg.replace(/^\w+\s*:\s*/,'')}
function renderWelcome(){
  const w=state.welcome||{workspaceName:state.workspace.name,role:state.workspaceRole,projectNames:state.projects.map(p=>p.name)};
  const names=w.projectNames?.length?w.projectNames:state.projects.map(p=>p.name);
  return `<div class="welcome-page"><div class="welcome-card"><span class="eyebrow">Bienvenue dans 2b2c</span><h1>Vous avez rejoint ${esc(w.workspaceName||state.workspace.name)}</h1><p>Votre espace est prêt. 2b2c vous montre d’abord ce qui vous concerne, pas tout ce qui existe.</p><div class="welcome-projects"><span class="eyebrow">Projets accessibles</span>${names.length?names.map(n=>`<div class="welcome-project"><span class="project-dot good"></span><strong>${esc(n)}</strong></div>`).join(''):`<div class="notice">Aucun projet n’est encore attribué. Votre administrateur pourra vous en ajouter.</div>`}</div><div class="welcome-actions"><a class="btn primary" href="#/work">Voir ce qui m’attend →</a><a class="btn" href="#/dashboard">Découvrir l’espace</a></div></div></div>`;
}

function renderArchives(){return `<div class="section-head page-head-v3"><div><span class="eyebrow">Mémoire</span><h1>Archives</h1><p>Les projets terminés ou mis de côté restent consultables sans polluer le portefeuille actif.</p></div></div>${state.archivedProjects.length?`<div class="stack">${state.archivedProjects.map(p=>`<div class="card archive-card"><div><strong>${esc(p.name)}</strong><p>${esc(p.objective||'')}</p><small>Archivé ${relativeDate(new Date(p.updated_at||p.created_at))}</small></div><button class="btn" data-action="restore-project" data-project="${p.id}">Restaurer</button></div>`).join('')}</div>`:empty('Aucun projet archivé','Les projets archivés apparaîtront ici.')}`}

function attentionCount(){return state.user?personalAttentionItems().length:0}
function projectPeople(projectId){return state.projectMembers.filter(pm=>pm.project_id===projectId)}
function projectCountForUser(userId){return state.projectMembers.filter(pm=>pm.user_id===userId).length}
function priorityRank(p){return({urgent:0,high:1,normal:2,low:3})[p]??4}
function projectSituationText(project,current,open,blocking,pendingApproval,pendingRequest){if(blocking.length)return{title:'Un blocage ralentit le projet',body:`${blocking[0].title}${blocking[0].blocked_reason?` — ${blocking[0].blocked_reason}`:''}. La prochaine étape dépend de sa résolution.`};if(pendingApproval)return{title:'Une validation conditionne la suite',body:'Une version attend votre décision avant que le projet puisse passer à l’étape suivante.'};if(pendingRequest)return{title:'Une réponse est attendue de vous',body:`${pendingRequest.title}. Votre réponse permettra à l’équipe de continuer sans perdre le contexte.`};if(current)return{title:`${current.title} est ${current.status==='done'?'terminée':'en cours'}`,body:open.length?`${open.length} action${open.length>1?'s':''} reste${open.length>1?'nt':''} ouverte${open.length>1?'s':''}. ${project.target_date?`La cible du projet est le ${formatDate(project.target_date)}.`:''}`:'Aucune action ouverte : définissez la prochaine étape ou clôturez la phase.'};return{title:'Le projet doit être structuré',body:'Ajoutez une roadmap courte pour rendre visible le chemin jusqu’au résultat attendu.'}}
function progressTrack(milestones){return `<div class="progress-track-v3">${milestones.map((m,i)=>`<div class="progress-step-v3 ${m.status==='done'?'done':m.status==='active'?'active':''}"><span class="progress-node-v3">${m.status==='done'?'✓':i+1}</span><small>${esc(m.title)}</small></div>`).join('')}</div>`}
function projectCardV3(p){
  const actions=state.actions.filter(a=>a.project_id===p.id&&!['cancelled'].includes(a.status));
  const phases=projectMilestones(p.id);
  const current=phases.find(m=>m.status==='active')||phases.find(m=>m.status==='todo');
  const currentIndex=current?phases.findIndex(m=>m.id===current.id)+1:(phases.length?phases.length:0);
  const progressInfo=projectProgressInfo(p);
  const health=projectHealthInfo(p);
  const assigned=assignedOpenActions().filter(a=>a.project_id===p.id).sort((a,b)=>priorityRank(a.priority)-priorityRank(b.priority)||new Date(a.due_at||'2999')-new Date(b.due_at||'2999'));
  const personal=assigned[0];
  const blocked=actions.filter(a=>a.status==='blocked').length;
  return `<a class="project-card-v3 v41-project-card v42-project-card" href="#/projects/${p.id}/overview"><div class="project-card-top"><span class="project-symbol">${esc(p.name.slice(0,1).toUpperCase())}</span><span class="pill ${health.tone}" title="${escAttr(health.reason)}">${health.label}</span></div><div class="project-title-line"><h3>${esc(p.name)}</h3>${phases.length?`<span>Phase ${currentIndex}/${phases.length}</span>`:''}</div><div class="project-phase-v42"><span>Phase actuelle</span><strong>${current?esc(current.title):phases.length?'Projet terminé':'Roadmap à structurer'}</strong></div><div class="project-personal ${personal?.status==='blocked'?'blocked':''}"><span>${personal?.status==='blocked'?'Blocage':'Pour vous'}</span><strong>${personal?esc(personal.title):'Aucun élément attendu'}</strong></div><div class="project-progress-row"><span>${esc(progressInfo.label)}</span>${blocked?`<span class="blocked-mini">${blocked} blocage${blocked>1?'s':''}</span>`:''}</div>${progressInfo.progress===null?`<div class="progress progress-empty"><span style="width:0%"></span></div>`:`<div class="progress"><span style="width:${progressInfo.progress}%"></span></div>`}<div class="project-meta"><strong>${progressInfo.progress===null?'—':`${progressInfo.progress}%`}</strong><span>${p.target_date?`Cible ${formatDate(p.target_date)}`:'Sans date cible'}</span></div></a>`;
}
function fileGlyph(title=''){const ext=String(title).split('.').pop().toLowerCase();return ['png','jpg','jpeg','webp','gif'].includes(ext)?'▧':['pdf'].includes(ext)?'PDF':['zip'].includes(ext)?'ZIP':'DOC'}
function findMessage(id){for(const list of state.messages.values()){const m=list.find(x=>String(x.id)===String(id));if(m)return m}return null}
function searchResultsHtml(q){
  q=String(q||'').trim().toLowerCase();if(!q)return `<div class="search-hint">Tapez un projet, une personne, un message, un fichier, une décision ou une action.</div>`;
  const results=[];
  state.projects.filter(p=>(p.name+' '+(p.objective||'')).toLowerCase().includes(q)).slice(0,5).forEach(p=>results.push({type:'Projet',title:p.name,sub:p.objective,route:`#/projects/${p.id}/overview`}));
  state.members.filter(m=>displayName(m.user_id).toLowerCase().includes(q)).slice(0,5).forEach(m=>results.push({type:'Personne',title:displayName(m.user_id),sub:workspaceRoleLabel(m.role),route:'#/team'}));
  state.actions.filter(a=>(a.title+' '+(a.description||'')+' '+(a.blocked_reason||'')).toLowerCase().includes(q)).slice(0,8).forEach(a=>results.push({type:'Action',title:a.title,sub:projectName(a.project_id),route:`#/projects/${a.project_id}/work/list`}));
  state.requests.filter(r=>(r.title+' '+(r.body||'')+' '+(r.response||'')).toLowerCase().includes(q)).slice(0,5).forEach(r=>results.push({type:'Demande',title:r.title,sub:projectName(r.project_id),route:'#/work'}));
  state.decisions.filter(d=>(d.title+' '+(d.rationale||'')).toLowerCase().includes(q)).slice(0,6).forEach(d=>results.push({type:'Décision',title:d.title,sub:projectName(d.project_id),route:d.project_id?`#/projects/${d.project_id}/overview`:'#/dashboard'}));
  state.deliverableVersions.filter(v=>{const d=state.deliverables.find(x=>x.id===v.deliverable_id);return ((v.file_name||'')+' '+(d?.title||'')).toLowerCase().includes(q)}).slice(0,6).forEach(v=>{const d=state.deliverables.find(x=>x.id===v.deliverable_id);if(d)results.push({type:'Fichier',title:v.file_name||d.title,sub:projectName(d.project_id),route:`#/projects/${d.project_id}/resources`})});
  state.conversations.filter(c=>c.title.toLowerCase().includes(q)).slice(0,5).forEach(c=>results.push({type:'Message',title:c.title,sub:projectName(c.project_id),route:`#/messages/${c.id}`}));
  for(const [conversationId,list] of state.messages){list.filter(m=>String(m.body||'').toLowerCase().includes(q)).slice(0,3).forEach(m=>results.push({type:'Message',title:String(m.body||'').slice(0,90),sub:displayName(m.author_id),route:`#/messages/${conversationId}`}))}
  return results.length?results.slice(0,22).map(r=>`<a class="search-result" href="${r.route}"><span class="pill">${r.type}</span><div><strong>${esc(r.title)}</strong><small>${esc(r.sub||'')}</small></div><span>›</span></a>`).join(''):`<div class="search-hint">Aucun résultat dans les données auxquelles vous avez accès.</div>`;
}

function priorityLabel(p){return({low:'Basse',normal:'Normale',high:'Haute',urgent:'Urgente'})[p]||p||'Normale'}
function sourceLabel(s){return({message:'Message',meeting:'Réunion',note:'Note'})[s]||'Élément'}
function writableProjectOptions(selected='',required=true){const list=state.projects.filter(p=>canWriteProject(p.id));if(required&&!list.length)return '<option value="">Aucun projet modifiable</option>';return list.map(p=>`<option value="${p.id}" ${p.id===selected?'selected':''}>${esc(p.name)}</option>`).join('')}
function projectParticipantOptions(projectId,selected='',includeGuests=true,exclude=''){const pms=state.projectMembers.filter(pm=>pm.project_id===projectId);const ids=new Set(pms.filter(pm=>includeGuests||['lead','member'].includes(pm.role)).map(pm=>pm.user_id));state.members.filter(m=>['owner','admin'].includes(m.role)||(includeGuests&&m.role==='member'&&m.access_mode==='all')).forEach(m=>ids.add(m.user_id));return [...ids].filter(id=>id!==exclude).map(id=>{const wm=state.members.find(m=>m.user_id===id);if(!includeGuests&&wm?.role==='guest')return '';return `<option value="${id}" ${id===selected?'selected':''}>${esc(displayName(id))}${wm?.role==='guest'?' · invité':''}</option>`}).join('')}
function findVersion(id){for(const cache of state.projectCache.values()){const v=(cache.versions||[]).find(x=>x.id===id);if(v)return v}return null}
function findDeliverable(id){for(const cache of state.projectCache.values()){const d=(cache.deliverables||[]).find(x=>x.id===id);if(d)return d}return null}
function approvalTitle(a){const v=findVersion(a.deliverable_version_id),d=v?findDeliverable(v.deliverable_id):null;return d?`${d.title} · v${v.version_number}`:'Une version attend votre validation'}
function meetingParticipantChecks(projectId=''){const ids=projectId?new Set(state.projectMembers.filter(pm=>pm.project_id===projectId).map(pm=>pm.user_id)):new Set(state.members.map(m=>m.user_id));if(projectId)state.members.filter(m=>['owner','admin'].includes(m.role)||(m.role==='member'&&m.access_mode==='all')).forEach(m=>ids.add(m.user_id));ids.delete(state.user.id);return [...ids].map(id=>`<label><input type="checkbox" name="attendeeIds" value="${id}"> ${esc(displayName(id))}</label>`).join('')||'<small>Aucun autre participant disponible.</small>'}
function meetingAttendeeHtml(meetingId){const rows=state.meetingAttendees.filter(a=>a.meeting_id===meetingId);const meeting=state.meetings.find(m=>m.id===meetingId);const mine=rows.find(a=>a.user_id===state.user.id);const canRespond=Boolean(mine&&meeting?.created_by!==state.user.id&&meeting?.status==='planned');return rows.length?`<div class="meeting-attendees-v4"><span class="eyebrow">Participants</span><div>${rows.map(a=>`<span class="attendee-chip">${avatarHtml(a.user_id)}<b>${esc(displayName(a.user_id))}</b><small>${a.response==='accepted'?'Accepté':a.response==='declined'?'Décliné':'En attente'}</small></span>`).join('')}</div>${canRespond?`<div class="meeting-rsvp-v432"><span>Votre réponse</span><button type="button" class="btn small ${mine.response==='accepted'?'primary':''}" data-action="meeting-response" data-meeting="${meetingId}" data-response="accepted">✓ Je participe</button><button type="button" class="btn small ${mine.response==='declined'?'danger':''}" data-action="meeting-response" data-meeting="${meetingId}" data-response="declined">Je décline</button></div>`:''}</div>`:''}
function parseRoute(){const raw=(location.hash||'#/dashboard').replace(/^#\/?/,'');const parts=raw.split('/').filter(Boolean);if(parts[0]==='welcome')return{name:'welcome'};if(!parts.length||parts[0]==='dashboard')return{name:'dashboard'};if(parts[0]==='projects'&&parts[1])return{name:'project',id:parts[1],tab:parts[2]||'overview',view:parts[3]||'list'};if(parts[0]==='projects')return{name:'projects'};if(parts[0]==='work')return{name:'work'};if(parts[0]==='messages')return{name:'messages',id:parts[1]||null};if(parts[0]==='calendar')return{name:'calendar'};if(parts[0]==='library')return{name:'library'};if(parts[0]==='team')return{name:'team'};if(parts[0]==='archives')return{name:'archives'};if(parts[0]==='profile')return{name:'profile'};if(parts[0]==='settings')return{name:'settings'};return{name:'dashboard'}}

function routeTitle(r){if(r.name==='project')return state.projects.find(p=>p.id===r.id)?.name||'Projet';return({welcome:'Bienvenue',dashboard:'Accueil',projects:'Projets',work:'Mon travail',messages:'Messages',calendar:'Calendrier',library:'Fichiers',team:'Équipe',archives:'Archives',profile:'Mon profil',settings:'Paramètres'})[r.name]||BRAND_NAME}

function esc(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function escAttr(value){return esc(value)}
function nl2br(value){return String(value).replace(/\n/g,'<br>')}
function formatShortDate(value){const d=new Date(value);return Number.isNaN(d.getTime())?'—':new Intl.DateTimeFormat('fr-FR',{day:'numeric',month:'short'}).format(d)}
function formatDate(v){if(!v)return'—';const d=new Date(v.length===10?`${v}T12:00:00`:v);return new Intl.DateTimeFormat('fr-FR',{day:'numeric',month:'short',year:d.getFullYear()!==new Date().getFullYear()?'numeric':undefined}).format(d)}
function formatDateTime(v){if(!v)return'—';return new Intl.DateTimeFormat('fr-FR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(v))}
function formatDay(v){return new Intl.DateTimeFormat('fr-FR',{weekday:'short',day:'numeric'}).format(new Date(v))}
function relativeDate(d){const diff=Math.round((d-Date.now())/1000);const abs=Math.abs(diff);if(abs<60)return diff<0?'à l’instant':'dans un instant';const rtf=new Intl.RelativeTimeFormat('fr',{numeric:'auto'});if(abs<3600)return rtf.format(Math.round(diff/60),'minute');if(abs<86400)return rtf.format(Math.round(diff/3600),'hour');return rtf.format(Math.round(diff/86400),'day')}
function localDateTimeToIso(v){if(!v)return null;const d=new Date(v);return Number.isNaN(d.getTime())?null:d.toISOString()}
function bytes(n){n=Number(n||0);if(n<1024)return`${n} o`;if(n<1048576)return`${(n/1024).toFixed(1)} Ko`;return`${(n/1048576).toFixed(1)} Mo`}
function statusLabel(s){return({todo:'À faire',in_progress:'En cours',blocked:'Bloqué',done:'Terminé',cancelled:'Annulé'})[s]||s}
function statusTone(s){return s==='done'?'good':s==='blocked'?'danger':s==='in_progress'?'blue':''}
function healthLabel(s){return({on_track:'En bonne voie',at_risk:'À surveiller',off_track:'En difficulté'})[s]||s}
function healthTone(s){return s==='on_track'?'good':s==='at_risk'?'warn':'danger'}
function projectStatusLabel(s){return({active:'Actif',on_hold:'En pause',completed:'Terminé',archived:'Archivé'})[s]||s}
function milestoneLabel(s){return({todo:'À venir',active:'En cours',done:'Terminé',cancelled:'Annulé'})[s]||s}
function decisionLabel(s){return({proposed:'Proposée',decided:'Décidée',superseded:'Remplacée',cancelled:'Annulée'})[s]||s}
function requestStatus(s){return({open:'En attente',answered:'Répondue',satisfied:'Satisfaite',cancelled:'Annulée'})[s]||s}
function workspaceRoleLabel(s){return({owner:'Propriétaire',admin:'Administrateur',member:'Membre',guest:'Invité'})[s]||s||'Membre'}
function notificationKind(s){return({assignment:'Affectation',request:'Demande',approval:'Validation',message:'Message',meeting:'Réunion',mention:'Mention',announcement:'Annonce'})[s]||'Activité'}
function inviteStatus(s){return({pending:'En attente',accepted:'Acceptée',revoked:'Révoquée',expired:'Expirée'})[s]||s}
async function copyText(text){try{await navigator.clipboard.writeText(text);showToast('Lien copié')}catch{prompt('Copiez ce lien :',text)}}

// communication-v2-hub · create_group_direct_v2 · get_message_badges_v2 · send_message_with_mentions_v2


/* 2b2c native calls v1 — in-module */
let activeCallV1=null;
let incomingCallV1=null;
let callPollTimerV1=null;

function callProjectContextV1(){
  return String(document.getElementById('call-project-v1')?.value||'')||null;
}
function closeCallPickerV1(){document.getElementById('call-picker-v1')?.remove();}
function openCallPickerV1(){
  closeCallPickerV1();
  if(activeCallV1){renderActiveCallV1();return;}
  const teammates=state.members.filter(m=>m.user_id!==state.user.id&&m.status==='active'&&m.role!=='guest');
  const root=document.createElement('div');root.id='call-picker-v1';
  root.innerHTML=`<div class="call-modal-backdrop-v1"><section class="call-picker-card-v1" role="dialog" aria-modal="true" aria-label="Appeler">
    <header><div><span class="eyebrow">Communication</span><h2>Appeler</h2><p>Appelez une personne maintenant. Le projet est facultatif.</p></div><button class="icon-button" data-action="call-picker-close-v1" aria-label="Fermer">✕</button></header>
    <label class="field"><span>Contexte facultatif</span><select id="call-project-v1"><option value="">Sans projet</option>${state.projects.filter(p=>p.status==='active').map(p=>`<option value="${escAttr(p.id)}">${esc(p.name)}</option>`).join('')}</select></label>
    <div class="call-people-v1">${teammates.length?teammates.map(m=>`<button data-action="call-person-v1" data-user="${escAttr(m.user_id)}"><span class="avatar">${initials(displayName(m.user_id))}</span><span><strong>${esc(displayName(m.user_id))}</strong><small>Appel privé</small></span><b>Appeler</b></button>`).join(''):'<div class="notice">Aucun autre membre interne actif.</div>'}</div>
    <div class="call-team-row-v1"><div><strong>Appel d’équipe</strong><small>Salle libre accessible aux membres de l’espace.</small></div><button class="btn" data-action="call-team-v1">Ouvrir</button></div>
  </section></div>`;
  document.body.appendChild(root);
}

async function callIceServersV1(){
  try{
    const session=api.getSession();if(!session?.access_token)throw new Error('Session expirée');
    const response=await fetch(`${config.supabaseUrl}/functions/v1/call-ice-v1`,{method:'POST',headers:{apikey:config.supabasePublishableKey,authorization:`Bearer ${session.access_token}`,'content-type':'application/json'},body:'{}'});
    if(response.ok){const payload=await response.json();if(Array.isArray(payload?.iceServers)&&payload.iceServers.length)return payload.iceServers;}
  }catch(error){console.warn('ICE fallback',error);}
  return [{urls:['stun:stun.cloudflare.com:3478','stun:stun.cloudflare.com:53']}];
}
async function localMediaV1(){
  const audio={echoCancellation:true,noiseSuppression:true,autoGainControl:true};
  try{return await navigator.mediaDevices.getUserMedia({audio,video:{width:{ideal:1280},height:{ideal:720},frameRate:{ideal:24,max:30}}});}
  catch(cameraError){try{return await navigator.mediaDevices.getUserMedia({audio,video:false});}catch{throw cameraError;}}
}
async function sendCallSignalV1(ctx,toUser,type,payload){
  await api.rpc('send_call_signal_v1',{p_call_id:ctx.call.id,p_to_user:toUser,p_signal_type:type,p_payload:payload});
}
async function ensureCallPeerV1(ctx,remoteUserId){
  if(ctx.peers.has(remoteUserId))return ctx.peers.get(remoteUserId);
  const pc=new RTCPeerConnection({iceServers:ctx.iceServers,bundlePolicy:'max-bundle'});pc.__pendingIceV1=[];
  ctx.peers.set(remoteUserId,pc);
  ctx.localStream.getTracks().forEach(track=>pc.addTrack(track,ctx.localStream));
  pc.onicecandidate=e=>{if(e.candidate)void sendCallSignalV1(ctx,remoteUserId,'ice',e.candidate.toJSON()).catch(console.warn);};
  pc.ontrack=e=>{ctx.remoteStreams.set(remoteUserId,e.streams?.[0]||new MediaStream([e.track]));renderActiveCallV1();};
  pc.onconnectionstatechange=()=>{if(['failed','closed'].includes(pc.connectionState)){ctx.remoteStreams.delete(remoteUserId);ctx.peers.delete(remoteUserId);renderActiveCallV1();}};
  return pc;
}
async function maybeOfferCallV1(ctx,remoteUserId){
  if(String(state.user.id)>=String(remoteUserId)||ctx.offered.has(remoteUserId))return;
  const pc=await ensureCallPeerV1(ctx,remoteUserId);if(pc.signalingState!=='stable')return;
  ctx.offered.add(remoteUserId);const offer=await pc.createOffer();await pc.setLocalDescription(offer);
  await sendCallSignalV1(ctx,remoteUserId,'offer',{type:offer.type,sdp:offer.sdp});
}
async function processCallSignalV1(ctx,signal){
  if(ctx.signalIds.has(String(signal.id))||signal.from_user===state.user.id)return;
  ctx.signalIds.add(String(signal.id));const pc=await ensureCallPeerV1(ctx,signal.from_user);
  if(signal.signal_type==='offer'){await pc.setRemoteDescription(signal.payload);for(const x of pc.__pendingIceV1.splice(0)){try{await pc.addIceCandidate(x)}catch{}}const answer=await pc.createAnswer();await pc.setLocalDescription(answer);await sendCallSignalV1(ctx,signal.from_user,'answer',{type:answer.type,sdp:answer.sdp});}
  else if(signal.signal_type==='answer'&&pc.signalingState==='have-local-offer'){await pc.setRemoteDescription(signal.payload);for(const x of pc.__pendingIceV1.splice(0)){try{await pc.addIceCandidate(x)}catch{}}}
  else if(signal.signal_type==='ice'){if(!pc.remoteDescription)pc.__pendingIceV1.push(signal.payload);else try{await pc.addIceCandidate(signal.payload)}catch{}}
}
async function syncCallMediaV1(ctx){
  await api.rpc('set_call_media_state_v1',{p_call_id:ctx.call.id,p_mic:Boolean(ctx.micTrack?.enabled),p_camera:Boolean(ctx.cameraTrack?.enabled),p_screen:Boolean(ctx.screenTrack)});
}
async function connectCallV1(call,targetUserId=null){
  closeCallPickerV1();
  const localStream=await localMediaV1();
  await api.rpc('join_call_v1',{p_call_id:call.id});
  activeCallV1={call,targetUserId,projectId:call.project_id||null,localStream,localPreviewStream:localStream,micTrack:localStream.getAudioTracks()[0]||null,cameraTrack:localStream.getVideoTracks()[0]||null,screenTrack:null,iceServers:await callIceServersV1(),peers:new Map(),remoteStreams:new Map(),offered:new Set(),signalIds:new Set(),closed:false};
  incomingCallV1=null;document.getElementById('incoming-call-v1')?.remove();await syncCallMediaV1(activeCallV1);renderActiveCallV1();void pollCallV1(activeCallV1);
}
async function startDirectCallV1(targetUserId){
  const call=first(await api.rpc('start_direct_call_v1',{p_workspace_id:state.workspace.id,p_target_user_id:targetUserId,p_project_id:callProjectContextV1()}));
  await connectCallV1(call,targetUserId);
}
async function startTeamCallV1(){
  const call=first(await api.rpc('start_workspace_call_v1',{p_workspace_id:state.workspace.id}));await connectCallV1(call,null);
}
async function acceptIncomingCallV1(callId){
  const call=first(await api.select('call_sessions',`select=*&id=eq.${callId}&ended_at=is.null&limit=1`));if(!call)throw new Error('Cet appel n’est plus disponible.');await connectCallV1(call,call.started_by);
}
async function declineIncomingCallV1(callId){
  await api.rpc('decline_direct_call_v1',{p_call_id:callId});incomingCallV1=null;document.getElementById('incoming-call-v1')?.remove();
}
async function pollCallV1(ctx){
  if(ctx.closed||activeCallV1!==ctx)return;
  try{
    const [participants,signals,calls]=await Promise.all([
      api.select('call_participants',`select=*&call_session_id=eq.${ctx.call.id}&left_at=is.null&order=joined_at.asc`),
      api.select('call_signals',`select=*&call_session_id=eq.${ctx.call.id}&to_user=eq.${state.user.id}&order=id.asc&limit=200`),
      api.select('call_sessions',`select=*&id=eq.${ctx.call.id}&limit=1`)
    ]);
    const activeIds=new Set(participants.map(p=>p.user_id));for(const p of participants)if(p.user_id!==state.user.id)await maybeOfferCallV1(ctx,p.user_id);
    for(const [id,pc] of [...ctx.peers])if(!activeIds.has(id)){pc.close();ctx.peers.delete(id);ctx.remoteStreams.delete(id);ctx.offered.delete(id);}
    for(const signal of signals)await processCallSignalV1(ctx,signal);
    if(!calls[0]||calls[0].ended_at){cleanupCallV1(ctx);activeCallV1=null;document.getElementById('active-call-v1')?.remove();showToast('L’appel est terminé');return;}
    ctx.call=calls[0];renderActiveCallV1();
  }catch(error){console.warn('call poll',error);}
  callPollTimerV1=setTimeout(()=>void pollCallV1(ctx),900);
}
function videoTileCallV1(id,stream,label,muted=false){
  return `<div class="call-tile-v1"><video id="${id}" autoplay playsinline ${muted?'muted':''}></video><div class="call-avatar-fallback-v1">${initials(label)}</div><span>${esc(label)}</span></div>`;
}
function attachCallVideosV1(ctx){
  const local=document.getElementById('call-local-v1');if(local){local.srcObject=ctx.localPreviewStream;local.muted=true;void local.play().catch(()=>{});}
  for(const [id,stream] of ctx.remoteStreams){const v=document.getElementById(`call-remote-${id}`);if(v){v.srcObject=stream;void v.play().catch(()=>{});}}
}
function renderActiveCallV1(){
  const ctx=activeCallV1;if(!ctx)return;
  let root=document.getElementById('active-call-v1');if(!root){root=document.createElement('div');root.id='active-call-v1';document.body.appendChild(root);}
  const remotes=[...ctx.remoteStreams.entries()];
  root.innerHTML=`<section class="call-shell-v1"><header><div><strong>${esc(ctx.targetUserId?displayName(ctx.targetUserId):'Appel d’équipe')}</strong><small>${remotes.length+1} participant${remotes.length?'s':''}${ctx.projectId?` · ${esc(projectName(ctx.projectId))}`:''}</small></div></header><div class="call-grid-v1">${videoTileCallV1('call-local-v1',ctx.localPreviewStream,ctx.screenTrack?'Votre écran':'Vous',true)}${remotes.map(([id,stream])=>videoTileCallV1(`call-remote-${id}`,stream,displayName(id))).join('')}${remotes.length?'':'<div class="call-wait-v1"><strong>En attente de l’autre participant…</strong></div>'}</div><footer><button class="btn" data-action="call-mic-v1">${ctx.micTrack?.enabled?'🎙 Micro':'🔇 Micro'}</button><button class="btn" data-action="call-camera-v1" ${ctx.cameraTrack?'':'disabled'}>${ctx.cameraTrack?.enabled?'📹 Caméra':'🚫 Caméra'}</button><button class="btn" data-action="call-screen-v1">${ctx.screenTrack?'▣ Arrêter partage':'▣ Partager écran'}</button><button class="btn danger" data-action="call-leave-v1">Quitter</button>${ctx.call.started_by===state.user.id?'<button class="btn danger" data-action="call-end-v1">Terminer pour tous</button>':''}</footer></section>`;
  attachCallVideosV1(ctx);
}
async function toggleMicV1(){if(!activeCallV1?.micTrack)return;activeCallV1.micTrack.enabled=!activeCallV1.micTrack.enabled;await syncCallMediaV1(activeCallV1);renderActiveCallV1();}
async function toggleCameraV1(){if(!activeCallV1?.cameraTrack)return;activeCallV1.cameraTrack.enabled=!activeCallV1.cameraTrack.enabled;await syncCallMediaV1(activeCallV1);renderActiveCallV1();}
async function toggleScreenV1(){
  const ctx=activeCallV1;if(!ctx)return;
  if(ctx.screenTrack){const old=ctx.screenTrack;ctx.screenTrack=null;old.onended=null;old.stop();if(ctx.cameraTrack){for(const pc of ctx.peers.values()){const s=pc.getSenders().find(x=>x.track?.kind==='video');if(s)await s.replaceTrack(ctx.cameraTrack);}}ctx.localPreviewStream=ctx.localStream;await syncCallMediaV1(ctx);renderActiveCallV1();return;}
  const screen=await navigator.mediaDevices.getDisplayMedia({video:true,audio:false});const track=screen.getVideoTracks()[0];if(!track)return;ctx.screenTrack=track;for(const pc of ctx.peers.values()){const s=pc.getSenders().find(x=>x.track?.kind==='video');if(s)await s.replaceTrack(track);}ctx.localPreviewStream=new MediaStream([track,...ctx.localStream.getAudioTracks()]);track.onended=()=>{if(ctx.screenTrack?.id===track.id)void toggleScreenV1()};await syncCallMediaV1(ctx);renderActiveCallV1();
}
function cleanupCallV1(ctx){ctx.closed=true;if(callPollTimerV1)clearTimeout(callPollTimerV1);ctx.screenTrack?.stop();ctx.localStream?.getTracks().forEach(t=>t.stop());for(const pc of ctx.peers.values())pc.close();}
async function leaveActiveCallV1(){const ctx=activeCallV1;if(!ctx)return;cleanupCallV1(ctx);try{await api.rpc('leave_call_v1',{p_call_id:ctx.call.id})}catch{}activeCallV1=null;document.getElementById('active-call-v1')?.remove();}
async function endActiveCallV1(){const ctx=activeCallV1;if(!ctx)return;await api.rpc('end_call_v1',{p_call_id:ctx.call.id,p_expected_version:ctx.call.version});cleanupCallV1(ctx);activeCallV1=null;document.getElementById('active-call-v1')?.remove();}
async function checkIncomingCallV1(){
  if(!state.user||!state.workspace||activeCallV1)return;
  try{
    const since=new Date(Date.now()-90000).toISOString();
    const rows=await api.select('call_sessions',`select=*&workspace_id=eq.${state.workspace.id}&direct_user_id=eq.${state.user.id}&ended_at=is.null&started_at=gte.${encodeURIComponent(since)}&order=started_at.desc&limit=1`);
    const call=rows[0]||null;if(!call){incomingCallV1=null;document.getElementById('incoming-call-v1')?.remove();return;}
    if(incomingCallV1?.id===call.id&&document.getElementById('incoming-call-v1'))return;incomingCallV1=call;
    let root=document.getElementById('incoming-call-v1');if(!root){root=document.createElement('div');root.id='incoming-call-v1';document.body.appendChild(root);}
    root.innerHTML=`<section class="incoming-call-card-v1"><div class="incoming-call-icon-v1">▣</div><div><small>Appel entrant</small><strong>${esc(displayName(call.started_by))}</strong><span>${esc(projectName(call.project_id)||'Sans projet')}</span></div><div class="incoming-call-actions-v1"><button class="btn danger" data-action="call-decline-v1" data-call="${escAttr(call.id)}">Refuser</button><button class="btn primary" data-action="call-accept-v1" data-call="${escAttr(call.id)}">Accepter</button></div></section>`;
  }catch(error){console.warn('incoming call',error);}
}
setInterval(()=>void checkIncomingCallV1(),1800);
