import { SupabaseBrowserClient } from './supabase-client.js';

const VERSION = '4b4c project flow v1.0.0';
const config = window.__4B4C_CONFIG__ || {};
const app = document.getElementById('app');
const workspaceKey = config.workspaceStorageKey || '4b4c.live.workspace.v1';

if (!app || !config.supabaseUrl || !config.supabasePublishableKey) {
  console.warn(`${VERSION}: configuration unavailable`);
} else {
  const api = new SupabaseBrowserClient({ url: config.supabaseUrl, publishableKey: config.supabasePublishableKey });
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  const wid = () => localStorage.getItem(workspaceKey) || '';
  let cache = { wid:'', at:0, data:null };
  let customModal = null;
  let scheduled = false;

  async function snapshot(force = false) {
    const workspaceId = wid();
    if (!workspaceId || !api.getSession()) return null;
    if (!force && cache.data && cache.wid === workspaceId && Date.now() - cache.at < 2500) return cache.data;
    const user = await api.getUser();
    const [projects, actions, requests, approvals, milestones, members, profiles, projectMembers, deliverables, versions] = await Promise.all([
      api.select('projects', `select=*&workspace_id=eq.${workspaceId}&status=neq.archived&order=updated_at.desc`),
      api.select('actions', `select=*&workspace_id=eq.${workspaceId}&limit=500`),
      api.select('requests', `select=*&workspace_id=eq.${workspaceId}&limit=300`).catch(() => []),
      api.select('approvals', `select=*&workspace_id=eq.${workspaceId}&limit=300`).catch(() => []),
      api.select('milestones', `select=*&workspace_id=eq.${workspaceId}&order=position.asc`).catch(() => []),
      api.select('workspace_members', `select=workspace_id,user_id,role,status,access_mode&workspace_id=eq.${workspaceId}&status=eq.active`),
      api.select('profiles', 'select=id,display_name,avatar_url').catch(() => []),
      api.select('project_members', 'select=project_id,user_id,role').catch(() => []),
      api.select('deliverables', `select=*&workspace_id=eq.${workspaceId}&limit=250`).catch(() => []),
      api.select('deliverable_versions', `select=*&workspace_id=eq.${workspaceId}&limit=400`).catch(() => [])
    ]);
    const data = { workspaceId, user, projects, actions, requests, approvals, milestones, members, profiles, projectMembers, deliverables, versions };
    cache = { wid:workspaceId, at:Date.now(), data };
    return data;
  }

  const projectName = (data, id) => data.projects.find(p => p.id === id)?.name || 'Projet';
  const profileName = (data, id) => data.profiles.find(p => p.id === id)?.display_name || 'Membre';
  function workspaceRole(data) { return data.members.find(m => m.user_id === data.user.id)?.role || 'guest'; }
  function projectRole(data, projectId) { return data.projectMembers.find(pm => pm.project_id === projectId && pm.user_id === data.user.id)?.role || ''; }
  function canManageProject(data, project) {
    const role = workspaceRole(data);
    return ['owner','admin'].includes(role) || projectRole(data, project.id) === 'lead';
  }
  function canParticipateInProject(data, project) {
    const role = workspaceRole(data);
    if (['owner','admin'].includes(role)) return true;
    if (role !== 'member') return false;
    if (project.visibility === 'team') return true;
    return ['lead','member'].includes(projectRole(data, project.id));
  }

  function ensureStyles() {
    if (document.getElementById('project-flow-v1-styles')) return;
    const style = document.createElement('style');
    style.id = 'project-flow-v1-styles';
    style.textContent = `
      .project-flow-context{grid-column:1/-1;padding:10px 12px;border-radius:12px;border:1px solid rgba(56,103,244,.18);background:rgba(56,103,244,.055);font-size:13px;color:#475467;line-height:1.45}.project-flow-context strong{color:#253858}
      .project-close-backdrop{position:fixed;inset:0;z-index:10020;display:grid;place-items:center;padding:18px;background:rgba(11,18,32,.58);backdrop-filter:blur(5px)}.project-close-modal{width:min(640px,100%);max-height:calc(100vh - 36px);overflow:auto;background:#fff;border-radius:22px;border:1px solid rgba(16,24,40,.12);box-shadow:0 30px 90px rgba(16,24,40,.26);padding:22px;color:#172033}.project-close-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin-bottom:18px}.project-close-head h2{margin:3px 0 5px;font-size:22px}.project-close-head p{margin:0;color:#667085;line-height:1.5}.project-close-x{width:40px;height:40px;border:1px solid #e2e8f0;background:#fff;border-radius:12px;font-size:21px;color:#667085;cursor:pointer}
      .project-close-form{display:grid;gap:15px}.project-close-field{display:grid;gap:6px}.project-close-field label{font-size:13px;font-weight:800}.project-close-field input,.project-close-field textarea{width:100%;box-sizing:border-box;border:1px solid #d7dee8;border-radius:12px;padding:11px 12px;font:inherit}.project-close-field textarea{min-height:96px;resize:vertical}.project-close-field input:focus,.project-close-field textarea:focus{outline:3px solid rgba(56,103,244,.14);border-color:#3867f4}.project-close-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}.project-close-summary>div{padding:11px;border:1px solid #e5eaf0;border-radius:13px;background:#f9fafb;display:grid;gap:3px}.project-close-summary strong{font-size:18px}.project-close-summary small{color:#667085}.project-close-warning{padding:12px;border-radius:13px;background:#fff8eb;border:1px solid #fed7aa;color:#8a4b08;font-size:13px;line-height:1.5}.project-close-ok{padding:12px;border-radius:13px;background:#f2fbf7;border:1px solid #ccebdc;color:#166443;font-size:13px}.project-close-resources{display:grid;gap:7px}.project-close-resources label{display:flex;align-items:center;gap:9px;padding:8px 10px;border:1px solid #e5eaf0;border-radius:10px;font-size:13px}.project-close-confirm{display:flex;gap:9px;align-items:flex-start;padding:10px 0;font-size:13px;color:#475467}.project-close-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:2px}.project-close-btn{min-height:44px;border:1px solid #d7dee8;border-radius:12px;background:#fff;padding:9px 14px;font:inherit;font-weight:800;cursor:pointer}.project-close-btn.primary{background:#3867f4;color:#fff;border-color:#3867f4}.project-close-btn[disabled]{opacity:.55;cursor:wait}.project-close-feedback{font-size:13px}.project-close-feedback.error{color:#b42318}.project-flow-manage-note{margin-bottom:12px}.project-flow-completed{padding:12px;border-radius:13px;background:#f2fbf7;border:1px solid #ccebdc;color:#166443;font-size:13px;line-height:1.5}
      @media(max-width:620px){.project-close-backdrop{padding:0;align-items:end}.project-close-modal{border-radius:22px 22px 0 0;max-height:90vh;padding:19px}.project-close-summary{grid-template-columns:1fr}.project-close-actions{flex-direction:column-reverse}.project-close-btn{width:100%}}
    `;
    document.head.appendChild(style);
  }

  function wireLabels(form, prefix) {
    let i = 0;
    form.querySelectorAll('.field,.project-close-field').forEach(field => {
      const label = field.querySelector(':scope > label');
      const control = field.querySelector('input:not([type="hidden"]),select,textarea');
      if (!label || !control) return;
      if (!control.id) control.id = `${prefix}-${++i}`;
      label.htmlFor = control.id;
    });
  }

  function participantIdsForProject(data, project) {
    const ids = new Set();
    data.members.forEach(member => {
      if (['owner','admin'].includes(member.role)) ids.add(member.user_id);
      else if (member.role === 'member' && project.visibility === 'team') ids.add(member.user_id);
    });
    data.projectMembers.filter(pm => pm.project_id === project.id && ['lead','member'].includes(pm.role)).forEach(pm => ids.add(pm.user_id));
    return [...ids];
  }
  function optionsForPeople(data, project, selected = '') {
    return participantIdsForProject(data, project).map(id => `<option value="${esc(id)}" ${id === selected ? 'selected' : ''}>${esc(profileName(data,id))}</option>`).join('');
  }
  function optionsForMilestones(data, projectId, selected = '') {
    return data.milestones.filter(m => m.project_id === projectId && m.status !== 'cancelled').sort((a,b) => (a.position || 0) - (b.position || 0)).map(m => `<option value="${esc(m.id)}" ${m.id === selected ? 'selected' : ''}>${esc(m.title)}</option>`).join('');
  }

  async function patchActionModal(dialog) {
    if (dialog.dataset.projectFlowAction === '1') return;
    const title = (dialog.querySelector('h1,h2,h3')?.textContent || '').trim().toLowerCase();
    if (title !== 'nouvelle action') return;
    const form = dialog.querySelector('form[data-form="action"]');
    if (!form) return;
    const data = await snapshot();
    if (!data) return;
    const projectSelect = form.elements.projectId;
    const assignee = form.elements.assignee;
    if (!projectSelect || !assignee) return;
    dialog.dataset.projectFlowAction = '1';

    const explicitOption = projectSelect.querySelector('option[selected]');
    const explicitProjectId = explicitOption?.value || '';
    if (!explicitProjectId) {
      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = 'Choisir un projet…';
      placeholder.selected = true;
      placeholder.disabled = true;
      projectSelect.prepend(placeholder);
      projectSelect.value = '';
      assignee.innerHTML = '<option value="">Choisissez d’abord un projet</option>';
      assignee.disabled = true;
    }

    let phaseField = [...form.querySelectorAll('.field')].find(field => /Phase roadmap/i.test(field.querySelector('label')?.textContent || ''));
    if (!phaseField) {
      phaseField = document.createElement('div');
      phaseField.className = 'field';
      phaseField.innerHTML = '<label>Phase / étape</label><select name="milestoneId" disabled><option value="">Choisissez d’abord un projet</option></select>';
      const assigneeField = assignee.closest('.field');
      assigneeField?.insertAdjacentElement('afterend', phaseField);
    } else {
      const label = phaseField.querySelector('label');
      if (label) label.textContent = 'Phase / étape';
    }
    const phase = form.elements.milestoneId;

    const context = document.createElement('div');
    context.className = 'project-flow-context';
    const grid = form.querySelector('.form-grid');
    if (grid) grid.prepend(context);

    const refreshContext = () => {
      const project = data.projects.find(p => p.id === projectSelect.value);
      if (!project) {
        context.innerHTML = '<strong>Contexte requis.</strong> Choisissez le projet auquel cette action appartient ; aucun projet n’est sélectionné automatiquement depuis l’espace global.';
        assignee.innerHTML = '<option value="">Choisissez d’abord un projet</option>';
        assignee.disabled = true;
        phase.innerHTML = '<option value="">Choisissez d’abord un projet</option>';
        phase.disabled = true;
        return;
      }
      context.innerHTML = `<strong>${esc(project.name)}</strong> · cette action sera créée dans ce projet${explicitProjectId === project.id ? ' (contexte repris automatiquement)' : ''}.`;
      const previousAssignee = assignee.value;
      assignee.innerHTML = `<option value="">Non assigné</option>${optionsForPeople(data, project, previousAssignee)}`;
      assignee.disabled = false;
      const previousPhase = phase.value;
      phase.innerHTML = `<option value="">Hors étape</option>${optionsForMilestones(data, project.id, previousPhase)}`;
      phase.disabled = false;
    };
    projectSelect.addEventListener('change', refreshContext);
    refreshContext();
    wireLabels(form, 'action-create');
  }

  function closeCustomModal() {
    customModal?.remove();
    customModal = null;
  }
  function makeCustomModal(title, subtitle, body) {
    closeCustomModal();
    const wrap = document.createElement('div');
    wrap.className = 'project-close-backdrop';
    wrap.innerHTML = `<section class="project-close-modal" role="dialog" aria-modal="true" aria-labelledby="project-close-title"><div class="project-close-head"><div><span style="font-size:12px;font-weight:800;letter-spacing:.08em;color:#3867f4">FIN DE PROJET</span><h2 id="project-close-title">${esc(title)}</h2><p>${esc(subtitle)}</p></div><button type="button" class="project-close-x" aria-label="Fermer">×</button></div>${body}</section>`;
    wrap.addEventListener('click', e => { if (e.target === wrap || e.target.closest('.project-close-x')) closeCustomModal(); });
    document.body.appendChild(wrap);
    customModal = wrap;
    return wrap;
  }

  async function openCloseProject(projectId) {
    const data = await snapshot(true);
    if (!data) return;
    const project = data.projects.find(p => p.id === projectId);
    if (!project || !canManageProject(data, project)) return;
    const openActions = data.actions.filter(a => a.project_id === projectId && !['done','cancelled'].includes(a.status));
    const openRequests = data.requests.filter(r => r.project_id === projectId && ['open','answered'].includes(r.status));
    const pendingApprovals = data.approvals.filter(a => a.project_id === projectId && a.status === 'pending');
    const deliverables = data.deliverables.filter(d => d.project_id === projectId);
    const body = `<form class="project-close-form" data-project-close-form><div class="project-close-summary"><div><strong>${openActions.length}</strong><small>action${openActions.length > 1 ? 's' : ''} encore ouverte${openActions.length > 1 ? 's' : ''}</small></div><div><strong>${openRequests.length}</strong><small>demande${openRequests.length > 1 ? 's' : ''} non clôturée${openRequests.length > 1 ? 's' : ''}</small></div><div><strong>${pendingApprovals.length}</strong><small>validation${pendingApprovals.length > 1 ? 's' : ''} en attente</small></div></div>${openActions.length || openRequests.length || pendingApprovals.length ? `<div class="project-close-warning"><strong>Il reste des engagements ouverts.</strong><br>2b2c n’interdit pas la clôture : vous pouvez terminer le projet si ces éléments sont volontairement transférés, abandonnés ou sans impact. Cette exception sera conservée dans le bilan.</div>` : '<div class="project-close-ok">Aucun engagement suivi n’est encore ouvert.</div>'}<div class="project-close-field"><label for="project-close-result">Résultat obtenu</label><textarea id="project-close-result" name="result" required placeholder="Quel résultat concret a été obtenu ?"></textarea></div>${deliverables.length ? `<div class="project-close-field"><label>Livrables de référence</label><div class="project-close-resources">${deliverables.map(d => `<label><input type="checkbox" name="referenceDeliverableIds" value="${esc(d.id)}"> <span>${esc(d.title)}</span></label>`).join('')}</div></div>` : ''}<div class="project-close-field"><label for="project-close-open">Engagements à transmettre ou restant ouverts</label><textarea id="project-close-open" name="remaining" placeholder="Ex. Suivi du test transféré à Marc ; aucune autre action nécessaire."></textarea></div>${openActions.length || openRequests.length || pendingApprovals.length ? '<label class="project-close-confirm"><input type="checkbox" name="confirmOpen" value="1" required> <span>Je confirme que les éléments encore ouverts n’empêchent pas de considérer le résultat du projet comme terminé.</span></label>' : ''}<div class="project-close-feedback" data-project-close-feedback aria-live="polite"></div><div class="project-close-actions"><button type="button" class="project-close-btn" data-project-close-cancel>Annuler</button><button type="submit" class="project-close-btn primary">Terminer le projet</button></div></form>`;
    const wrap = makeCustomModal(`Terminer ${project.name}`, 'Conservez un bilan court avant de passer le projet à Terminé.', body);
    wrap.querySelector('[data-project-close-cancel]').addEventListener('click', closeCustomModal);
    const form = wrap.querySelector('[data-project-close-form]');
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const fd = new FormData(form);
      const result = String(fd.get('result') || '').trim();
      const remaining = String(fd.get('remaining') || '').trim();
      const selectedIds = fd.getAll('referenceDeliverableIds').map(String);
      const selectedNames = deliverables.filter(d => selectedIds.includes(d.id)).map(d => d.title);
      const submit = form.querySelector('button[type="submit"]');
      const feedback = form.querySelector('[data-project-close-feedback]');
      if (!result) return;
      submit.disabled = true;
      feedback.textContent = '';
      try {
        const lines = [
          `Résultat obtenu : ${result}`,
          `Livrables de référence : ${selectedNames.length ? selectedNames.join(', ') : 'aucun sélectionné'}`,
          `Engagements à transmettre ou restant ouverts : ${remaining || 'aucun signalé'}`,
          `État au moment de la clôture : ${openActions.length} action(s) ouverte(s), ${openRequests.length} demande(s) non clôturée(s), ${pendingApprovals.length} validation(s) en attente.`
        ];
        await api.insert('decisions', [{
          workspace_id:data.workspaceId,
          project_id:project.id,
          title:`Clôture du projet — ${project.name}`,
          rationale:lines.join('\n'),
          status:'decided',
          decided_by:data.user.id,
          decided_at:new Date().toISOString(),
          source_type:'project_closure',
          source_id:project.id,
          created_by:data.user.id,
          visibility:'internal'
        }], { returnRepresentation:false });
        await api.update('projects', `id=eq.${project.id}`, { status:'completed' }, { returnRepresentation:false });
        cache.at = 0;
        feedback.className = 'project-close-feedback';
        feedback.textContent = 'Projet terminé · bilan conservé dans les décisions.';
        setTimeout(() => { closeCustomModal(); location.hash = `#/projects/${project.id}/overview`; location.reload(); }, 650);
      } catch (error) {
        feedback.className = 'project-close-feedback error';
        feedback.textContent = error?.message || String(error);
        submit.disabled = false;
      }
    });
    wrap.querySelector('#project-close-result')?.focus();
  }

  async function reopenProject(projectId) {
    const data = await snapshot(true);
    if (!data) return;
    const project = data.projects.find(p => p.id === projectId);
    if (!project || !canManageProject(data, project)) return;
    await api.update('projects', `id=eq.${project.id}`, { status:'active' }, { returnRepresentation:false });
    await api.insert('decisions', [{
      workspace_id:data.workspaceId,
      project_id:project.id,
      title:`Réouverture du projet — ${project.name}`,
      rationale:'Le projet a été réouvert pour poursuivre ou corriger le résultat après sa clôture.',
      status:'decided',
      decided_by:data.user.id,
      decided_at:new Date().toISOString(),
      source_type:'project_reopen',
      source_id:project.id,
      created_by:data.user.id,
      visibility:'internal'
    }], { returnRepresentation:false });
    cache.at = 0;
    location.hash = `#/projects/${project.id}/overview`;
    location.reload();
  }

  async function patchProjectManageModal(dialog) {
    if (dialog.dataset.projectFlowManage === '1') return;
    const title = (dialog.querySelector('h1,h2,h3')?.textContent || '').trim().toLowerCase();
    if (title !== 'gérer le projet') return;
    const data = await snapshot();
    if (!data) return;
    const archiveButton = dialog.querySelector('[data-action="archive-project"]');
    const projectId = archiveButton?.dataset.project || dialog.querySelector('[data-action="delete-project"]')?.dataset.project || '';
    const project = data.projects.find(p => p.id === projectId);
    if (!project) return;
    dialog.dataset.projectFlowManage = '1';
    const actions = dialog.querySelector('.modal-actions');
    const notice = dialog.querySelector('.notice');
    const manager = canManageProject(data, project);

    if (!manager) {
      if (notice) notice.innerHTML = `<strong>${esc(project.name)}</strong><br>Vous pouvez contribuer au projet, mais sa clôture et son archivage sont réservés au responsable du projet ou aux administrateurs.`;
      archiveButton?.remove();
      dialog.querySelector('[data-action="delete-project"]')?.remove();
      return;
    }
    if (project.status === 'completed') {
      if (notice) {
        notice.className = 'project-flow-completed project-flow-manage-note';
        notice.innerHTML = `<strong>Projet terminé.</strong><br>Le bilan de clôture reste dans les décisions. Vous pouvez l’archiver ou le réouvrir si du travail doit reprendre.`;
      }
      const reopen = document.createElement('button');
      reopen.type = 'button';
      reopen.className = 'btn';
      reopen.dataset.projectFlowReopen = project.id;
      reopen.textContent = 'Réouvrir le projet';
      actions?.insertBefore(reopen, archiveButton || actions.lastElementChild);
    } else {
      const close = document.createElement('button');
      close.type = 'button';
      close.className = 'btn primary';
      close.dataset.projectFlowClose = project.id;
      close.textContent = 'Terminer le projet';
      actions?.insertBefore(close, archiveButton || actions.lastElementChild);
    }
  }

  function patchProjectEditModal(dialog) {
    if (dialog.dataset.projectFlowEdit === '1') return;
    const title = (dialog.querySelector('h1,h2,h3')?.textContent || '').trim().toLowerCase();
    if (title !== 'modifier le projet') return;
    const form = dialog.querySelector('form[data-form="project-edit"]');
    if (!form) return;
    dialog.dataset.projectFlowEdit = '1';
    const stateSelect = form.elements.status;
    if (stateSelect) {
      const completed = stateSelect.querySelector('option[value="completed"]');
      const currentCompleted = completed?.selected;
      if (currentCompleted) {
        stateSelect.disabled = true;
        const hidden = document.createElement('input');
        hidden.type = 'hidden'; hidden.name = 'status'; hidden.value = 'completed';
        stateSelect.insertAdjacentElement('afterend', hidden);
        const note = document.createElement('small');
        note.textContent = 'Pour reprendre ce projet, utilisez « Gérer le projet → Réouvrir ». La clôture reste ainsi traçable.';
        stateSelect.insertAdjacentElement('afterend', note);
      } else {
        completed?.remove();
        const note = document.createElement('small');
        note.textContent = 'Pour terminer un projet, utilisez « Gérer le projet → Terminer le projet » afin de conserver le bilan de clôture.';
        stateSelect.insertAdjacentElement('afterend', note);
      }
    }
    wireLabels(form, 'project-edit');
  }

  async function scan() {
    ensureStyles();
    document.querySelectorAll('[role="dialog"],.modal').forEach(dialog => {
      patchActionModal(dialog).catch(console.warn);
      patchProjectManageModal(dialog).catch(console.warn);
      patchProjectEditModal(dialog);
    });
  }
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => { scheduled = false; scan().catch(console.warn); });
  }

  document.addEventListener('click', e => {
    const close = e.target.closest('[data-project-flow-close]');
    if (close) { e.preventDefault(); e.stopImmediatePropagation(); openCloseProject(close.dataset.projectFlowClose).catch(console.warn); return; }
    const reopen = e.target.closest('[data-project-flow-reopen]');
    if (reopen) { e.preventDefault(); e.stopImmediatePropagation(); reopenProject(reopen.dataset.projectFlowReopen).catch(console.warn); }
  }, true);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && customModal) closeCustomModal(); });
  const observer = new MutationObserver(schedule);
  observer.observe(app, { childList:true, subtree:true });
  schedule();
}
