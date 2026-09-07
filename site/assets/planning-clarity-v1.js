import { SupabaseBrowserClient } from './supabase-client.js';

const VERSION = '4b4c planning clarity v1.0.0';
const config = window.__4B4C_CONFIG__ || {};
const app = document.getElementById('app');
const workspaceKey = config.workspaceStorageKey || '4b4c.live.workspace.v1';

if (!app || !config.supabaseUrl || !config.supabasePublishableKey) {
  console.warn(`${VERSION}: configuration unavailable`);
} else {
  const api = new SupabaseBrowserClient({ url: config.supabaseUrl, publishableKey: config.supabasePublishableKey });
  const workspaceId = () => localStorage.getItem(workspaceKey) || '';
  let cache = { at:0, wid:'', data:null };
  let scheduled = false;

  function fmtDate(value) {
    if (!value) return '';
    const d = new Date(String(value).length === 10 ? `${value}T12:00:00` : value);
    if (Number.isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('fr-FR', { day:'numeric', month:'short' }).format(d);
  }
  function healthInfo(value) {
    if (value === 'at_risk') return { label:'À surveiller', tone:'warn', help:'Santé déclarée du projet : un risque demande une attention particulière.' };
    if (value === 'off_track') return { label:'En difficulté', tone:'danger', help:'Santé déclarée du projet : la trajectoire ou la cible doit être revue.' };
    return { label:'En bonne voie', tone:'good', help:'Santé déclarée du projet. Les blocages locaux sont affichés séparément.' };
  }
  async function snapshot(force = false) {
    const wid = workspaceId();
    if (!wid || !api.getSession()) return null;
    if (!force && cache.data && cache.wid === wid && Date.now() - cache.at < 3000) return cache.data;
    const [projects, actions, milestones] = await Promise.all([
      api.select('projects', `select=id,name,health,status,target_date&workspace_id=eq.${wid}&status=neq.archived&order=updated_at.desc`),
      api.select('actions', `select=id,project_id,status,blocked_reason&workspace_id=eq.${wid}&limit=500`),
      api.select('milestones', `select=id,project_id,title,status,due_date,position&workspace_id=eq.${wid}&order=position.asc`).catch(() => [])
    ]);
    const data = { projects, actions, milestones };
    cache = { at:Date.now(), wid, data };
    return data;
  }
  function projectForHref(data, href='') {
    const id = href.match(/#\/projects\/([^/]+)/)?.[1];
    return data.projects.find(p => p.id === id) || null;
  }
  function openBlocked(data, projectId) {
    return data.actions.filter(a => a.project_id === projectId && a.status === 'blocked');
  }
  function phases(data, projectId) {
    return data.milestones.filter(m => m.project_id === projectId && m.status !== 'cancelled').sort((a,b) => (a.position || 0) - (b.position || 0));
  }

  function ensureStyles() {
    if (document.getElementById('planning-clarity-v1-styles')) return;
    const style = document.createElement('style');
    style.id = 'planning-clarity-v1-styles';
    style.textContent = `
      .planning-local-block{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:800;color:#b54708;background:#fff7ed;border:1px solid #fed7aa;border-radius:999px;padding:4px 8px;white-space:nowrap}
      .planning-local-block:before{content:'!';display:inline-grid;place-items:center;width:15px;height:15px;border-radius:50%;background:#f79009;color:#fff;font-size:10px}
      .planning-health-pill{position:relative}.planning-health-pill[title]{cursor:help}
      .planning-milestone-card strong{line-height:1.25}.planning-milestone-card small{line-height:1.35}
      .planning-health-note{font-size:11px;color:#667085}
    `;
    document.head.appendChild(style);
  }

  function patchProjectCards(data) {
    app.querySelectorAll('.project-card-v3').forEach(card => {
      const project = projectForHref(data, card.getAttribute('href') || '');
      if (!project) return;
      const info = healthInfo(project.health);
      const pill = card.querySelector('.project-card-top .pill');
      if (pill) {
        pill.classList.remove('good','warn','danger');
        pill.classList.add(info.tone, 'planning-health-pill');
        pill.textContent = info.label;
        pill.title = info.help;
      }
      const blocked = openBlocked(data, project.id);
      const row = card.querySelector('.project-progress-row');
      if (row) {
        row.querySelector('.planning-local-block')?.remove();
        const old = row.querySelector('.blocked-mini');
        if (old) old.style.display = 'none';
        if (blocked.length) {
          const badge = document.createElement('span');
          badge.className = 'planning-local-block';
          badge.textContent = `${blocked.length} blocage${blocked.length > 1 ? 's' : ''} local${blocked.length > 1 ? 'aux' : ''}`;
          badge.title = 'Signal opérationnel distinct de la santé générale du projet.';
          row.appendChild(badge);
        }
      }
    });
  }

  function patchResumeCards(data) {
    app.querySelectorAll('.project-resume-card-v43').forEach(card => {
      const project = projectForHref(data, card.getAttribute('href') || '');
      if (!project) return;
      const info = healthInfo(project.health);
      const pill = card.querySelector('.project-resume-top .pill');
      if (pill) {
        pill.classList.remove('good','warn','danger');
        pill.classList.add(info.tone, 'planning-health-pill');
        pill.textContent = info.label;
        pill.title = info.help;
      }
      const blocked = openBlocked(data, project.id);
      const meta = card.querySelector('.project-resume-meta');
      if (meta) {
        meta.querySelector('.planning-local-block')?.remove();
        if (blocked.length) {
          const badge = document.createElement('span');
          badge.className = 'planning-local-block';
          badge.textContent = `${blocked.length} blocage${blocked.length > 1 ? 's' : ''} local${blocked.length > 1 ? 'aux' : ''}`;
          meta.prepend(badge);
        }
      }
    });
  }

  function patchProjectOverview(data) {
    const match = (location.hash || '').match(/^#\/projects\/([^/]+)\/overview/);
    if (!match) return;
    const project = data.projects.find(p => p.id === match[1]);
    if (!project) return;
    const list = phases(data, project.id);
    const active = list.find(m => m.status === 'active') || list.find(m => m.status === 'todo');
    const activeIndex = active ? list.findIndex(m => m.id === active.id) : -1;
    const next = activeIndex >= 0 ? list.slice(activeIndex + 1).find(m => m.status === 'todo') : null;
    const cards = app.querySelectorAll('.project-kpi-grid .mini-status-card');
    const milestoneCard = cards[2];
    if (milestoneCard) {
      milestoneCard.classList.add('planning-milestone-card');
      const label = milestoneCard.querySelector('span');
      const strong = milestoneCard.querySelector('strong');
      const small = milestoneCard.querySelector('small');
      if (active && active.due_date) {
        if (label) label.textContent = 'Échéance de l’étape actuelle';
        if (strong) strong.textContent = active.title;
        if (small) small.textContent = `Cible : ${fmtDate(active.due_date)}`;
        milestoneCard.setAttribute('href', `#/projects/${project.id}/work/roadmap`);
      } else if (next) {
        if (label) label.textContent = 'Prochaine étape';
        if (strong) strong.textContent = next.title;
        if (small) small.textContent = next.due_date ? `Cible : ${fmtDate(next.due_date)}` : 'Date cible à définir';
        milestoneCard.setAttribute('href', `#/projects/${project.id}/work/roadmap`);
      } else if (active) {
        if (label) label.textContent = 'Étape actuelle';
        if (strong) strong.textContent = active.title;
        if (small) small.textContent = 'Aucune échéance définie';
      } else {
        if (label) label.textContent = 'Roadmap';
        if (strong) strong.textContent = list.length ? 'Toutes les étapes sont terminées' : 'À structurer';
        if (small) small.textContent = list.length ? 'Vérifiez le bilan avant clôture' : 'Définissez les premières étapes';
      }
    }
    const titlePills = app.querySelectorAll('.project-title-line .pill');
    const healthPill = titlePills[1];
    if (healthPill) {
      const info = healthInfo(project.health);
      healthPill.classList.remove('good','warn','danger');
      healthPill.classList.add(info.tone, 'planning-health-pill');
      healthPill.textContent = info.label;
      healthPill.title = info.help;
    }
    const blocked = openBlocked(data, project.id);
    const titleLine = app.querySelector('.project-title-line');
    if (titleLine) {
      titleLine.querySelector('.planning-local-block')?.remove();
      if (blocked.length) {
        const badge = document.createElement('span');
        badge.className = 'planning-local-block';
        badge.textContent = `${blocked.length} blocage${blocked.length > 1 ? 's' : ''} local${blocked.length > 1 ? 'aux' : ''}`;
        badge.title = blocked[0].blocked_reason || 'Une action est bloquée, sans modifier automatiquement la santé générale du projet.';
        titleLine.appendChild(badge);
      }
    }
  }

  async function scan() {
    ensureStyles();
    const data = await snapshot().catch(() => null);
    if (!data) return;
    patchProjectCards(data);
    patchResumeCards(data);
    patchProjectOverview(data);
  }
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; scan().catch(console.warn); });
  }

  const observer = new MutationObserver(schedule);
  observer.observe(app, { childList:true, subtree:true });
  window.addEventListener('hashchange', schedule);
  schedule();
}
