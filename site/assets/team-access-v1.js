import { SupabaseBrowserClient } from './supabase-client.js';

const VERSION = '4b4c team access v1.0.0';
const config = window.__4B4C_CONFIG__ || {};
const api = new SupabaseBrowserClient({ url: config.supabaseUrl, publishableKey: config.supabasePublishableKey });
const workspaceKey = config.workspaceStorageKey || '4b4c.live.workspace.v1';

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[c]));
const roleLabel = (role) => role === 'owner' ? 'Propriétaire' : role === 'admin' ? 'Administrateur' : role === 'guest' ? 'Invité externe' : 'Membre';
const visibilityLabel = (visibility) => visibility === 'restricted' ? 'Restreint' : 'Équipe';
const workspaceId = () => localStorage.getItem(workspaceKey) || '';
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

let cache = { at: 0, workspaceId: '', data: null };
async function snapshot(force = false) {
  const wid = workspaceId();
  if (!wid || !api.getSession()) return null;
  if (!force && cache.data && cache.workspaceId === wid && Date.now() - cache.at < 2500) return cache.data;
  const [projects, members, profiles, projectMembers, user] = await Promise.all([
    api.select('projects', `select=id,name,visibility,status,created_by&workspace_id=eq.${wid}&status=neq.archived&order=updated_at.desc`),
    api.select('workspace_members', `select=workspace_id,user_id,role,status,access_mode,joined_at&workspace_id=eq.${wid}&status=eq.active&order=joined_at.asc`),
    api.select('profiles', 'select=id,display_name,avatar_url'),
    api.select('project_members', 'select=project_id,user_id,role'),
    api.getUser(),
  ]);
  const data = { wid, projects, members, profiles, projectMembers, user };
  cache = { at: Date.now(), workspaceId: wid, data };
  return data;
}

function nameFor(data, userId) {
  return data?.profiles?.find(p => p.id === userId)?.display_name || 'Membre';
}
function canManage(data) {
  const me = data?.members?.find(m => m.user_id === data?.user?.id);
  return Boolean(me && ['owner','admin'].includes(me.role));
}
function roleHelp(role) {
  if (role === 'admin') return 'Peut collaborer et administrer l’espace, l’équipe, les accès et tous les projets.';
  if (role === 'guest') return 'Client, prestataire ou partenaire externe. Il ne voit que les projets explicitement partagés avec lui.';
  return 'Collaborateur interne. Il accède automatiquement aux projets Équipe actuels et futurs et peut créer des projets.';
}
function teamVisibilityHelp() {
  return 'Tous les membres internes actuels et futurs y accèdent automatiquement. Les invités externes restent sur partage explicite.';
}
function restrictedVisibilityHelp() {
  return 'Seules les personnes choisies y accèdent. Les administrateurs conservent leur accès de gestion.';
}

function setBusy(form, busy) {
  form.querySelectorAll('button,select,input,textarea').forEach(el => {
    if (el.dataset.keepEnabled === '1') return;
    el.disabled = busy;
  });
}
function inlineError(form, error) {
  let box = form.querySelector('[data-team-access-error]');
  if (!box) {
    box = document.createElement('div');
    box.dataset.teamAccessError = '1';
    box.className = 'notice';
    box.style.borderColor = '#efb6b6';
    box.style.background = '#fff6f6';
    form.prepend(box);
  }
  box.innerHTML = `<strong>Impossible de terminer l’action.</strong><br>${esc(error?.message || error)}`;
}

function projectChecks(projects, selected = new Set(), name = 'teamProjectIds', suffix = '') {
  if (!projects.length) return '<div class="notice">Aucun projet concerné pour le moment.</div>';
  return `<div class="project-checks">${projects.map(p => `<label><input type="checkbox" name="${name}" value="${esc(p.id)}" ${selected.has(p.id) ? 'checked' : ''}> ${esc(p.name)}${suffix ? ` <small>· ${esc(suffix)}</small>` : ''}</label>`).join('')}</div>`;
}

async function patchInviteModal(dialog) {
  if (dialog.dataset.teamAccessInvite === '1') return;
  const title = (dialog.querySelector('h1,h2,h3')?.textContent || '').trim().toLowerCase();
  if (title !== 'inviter une personne') return;
  const form = dialog.querySelector('form');
  if (!form) return;
  const data = await snapshot();
  if (!data || !canManage(data)) return;
  dialog.dataset.teamAccessInvite = '1';
  form.dataset.form = 'team-access-invite-v1';

  const restricted = data.projects.filter(p => p.visibility === 'restricted');
  form.innerHTML = `
    <div class="stack">
      <div class="field"><label>Email</label><input type="email" name="email" required autofocus autocomplete="email" placeholder="prenom@exemple.fr"></div>
      <div class="field"><label>Rôle dans l’équipe</label><select name="role" data-team-role>
        <option value="member">Membre</option>
        <option value="admin">Administrateur</option>
        <option value="guest">Invité externe</option>
      </select></div>
      <div class="notice" data-role-help>${esc(roleHelp('member'))}</div>
      <section data-role-projects>
        <div class="section-head compact"><div><h3>Projets restreints à partager maintenant</h3><div class="metric-label">Les projets Équipe sont automatiques, y compris ceux créés plus tard.</div></div></div>
        ${projectChecks(restricted)}
      </section>
      <div class="notice"><strong>Connexion :</strong> 2b2c crée un lien d’invitation lié à cette adresse. La personne crée ou utilise son propre compte et choisit elle-même son mot de passe. Vous ne le créez pas et vous ne le voyez jamais.</div>
    </div>
    <div class="modal-actions"><button class="btn" type="button" data-action="close-modal">Annuler</button><button class="btn primary" type="submit">Créer l’invitation</button></div>`;

  const renderRole = () => {
    const role = form.elements.role.value;
    form.querySelector('[data-role-help]').textContent = roleHelp(role);
    const section = form.querySelector('[data-role-projects]');
    if (role === 'admin') {
      section.innerHTML = '<div class="notice"><strong>Administrateur :</strong> il peut gérer tout l’espace et accède donc à tous les projets. Aucun projet à sélectionner ici.</div>';
    } else if (role === 'guest') {
      section.innerHTML = `<div class="section-head compact"><div><h3>Projets à partager</h3><div class="metric-label">Un invité externe ne reçoit jamais de projet automatiquement.</div></div></div>${projectChecks(data.projects)}`;
    } else {
      section.innerHTML = `<div class="section-head compact"><div><h3>Projets restreints à partager maintenant</h3><div class="metric-label">Les projets Équipe sont automatiques, y compris ceux créés plus tard.</div></div></div>${projectChecks(restricted)}`;
    }
  };
  form.elements.role.addEventListener('change', renderRole);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    setBusy(form, true);
    try {
      const fd = new FormData(form);
      const role = String(fd.get('role') || 'member');
      const email = String(fd.get('email') || '').trim().toLowerCase();
      const selected = fd.getAll('teamProjectIds').map(String);
      if (!email) throw new Error('Adresse email requise.');
      if (role === 'guest' && selected.length === 0) throw new Error('Choisissez au moins un projet pour un invité externe.');
      const rows = await api.insert('workspace_invites', [{
        workspace_id: data.wid,
        email,
        role,
        status: 'pending',
        access_mode: role === 'guest' ? 'selected' : 'all',
        invited_by: data.user.id,
      }]);
      const invite = rows?.[0];
      if (!invite?.id || !invite?.token) throw new Error('Invitation créée sans lien exploitable.');
      if (selected.length && role !== 'admin') {
        await api.insert('workspace_invite_projects', selected.map(projectId => ({
          invite_id: invite.id,
          project_id: projectId,
          project_role: role === 'guest' ? 'viewer' : 'member',
        })), { returnRepresentation: false });
      }
      const url = new URL(location.href);
      url.search = '';
      url.hash = '';
      url.searchParams.set('invite', invite.token);
      form.innerHTML = `
        <div class="stack">
          <div class="notice"><strong>Invitation prête.</strong><br>La personne ouvre ce lien, se connecte si elle possède déjà un compte 2b2c ou crée son compte avec cette adresse. Elle choisit elle-même son mot de passe.</div>
          <div class="field"><label>Lien personnel d’invitation</label><input data-invite-link readonly value="${esc(url.toString())}" onfocus="this.select()"></div>
        </div>
        <div class="modal-actions"><button class="btn" type="button" data-copy-invite data-keep-enabled="1">Copier le lien</button><button class="btn primary" type="button" data-action="close-modal" data-keep-enabled="1">Terminer</button></div>`;
      form.querySelector('[data-copy-invite]').addEventListener('click', async () => {
        const input = form.querySelector('[data-invite-link]');
        try { await navigator.clipboard.writeText(input.value); form.querySelector('[data-copy-invite]').textContent = 'Copié'; }
        catch { input.focus(); input.select(); }
      });
      cache.at = 0;
    } catch (error) {
      inlineError(form, error);
      setBusy(form, false);
    }
  }, true);
}

async function patchProjectModal(dialog) {
  if (dialog.dataset.teamAccessProject === '1') return;
  const title = (dialog.querySelector('h1,h2,h3')?.textContent || '').trim().toLowerCase();
  if (title !== 'nouveau projet') return;
  const form = dialog.querySelector('form');
  if (!form) return;
  const data = await snapshot();
  if (!data) return;
  dialog.dataset.teamAccessProject = '1';
  form.dataset.form = 'team-access-project-v1';
  const oldParticipant = [...form.querySelectorAll('.field')].find(x => (x.querySelector('label')?.textContent || '').includes('Participants'));
  if (oldParticipant) oldParticipant.remove();
  const field = document.createElement('div');
  field.className = 'field span-2';
  field.innerHTML = `<label>Visibilité du projet</label><select name="visibility"><option value="team">Équipe — recommandé</option><option value="restricted">Restreint</option></select><small data-project-help>${esc(teamVisibilityHelp())}</small><div data-restricted-participants style="display:none;margin-top:10px"></div>`;
  form.querySelector('.form-grid')?.appendChild(field);

  const renderVisibility = () => {
    const restricted = form.elements.visibility.value === 'restricted';
    form.querySelector('[data-project-help]').textContent = restricted ? restrictedVisibilityHelp() : teamVisibilityHelp();
    const target = form.querySelector('[data-restricted-participants]');
    target.style.display = restricted ? '' : 'none';
    if (restricted) {
      const candidates = data.members.filter(m => m.user_id !== data.user.id && m.role !== 'guest');
      target.innerHTML = `<label style="display:block;margin-bottom:7px;font-weight:700">Personnes autorisées</label>${candidates.length ? `<div class="project-checks">${candidates.map(m => `<label><input type="checkbox" name="restrictedParticipantIds" value="${esc(m.user_id)}"> ${esc(nameFor(data,m.user_id))}</label>`).join('')}</div>` : '<div class="notice">Vous êtes actuellement le seul membre interne.</div>'}`;
    }
  };
  form.elements.visibility.addEventListener('change', renderVisibility);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    setBusy(form, true);
    try {
      const fd = new FormData(form);
      const visibility = String(fd.get('visibility') || 'team');
      const name = String(fd.get('name') || '').trim();
      const objective = String(fd.get('objective') || '').trim();
      if (!name) throw new Error('Nom du projet requis.');
      const participantIds = visibility === 'restricted' ? fd.getAll('restrictedParticipantIds').map(String) : [];
      const result = await api.rpc('create_project_with_access_v1', {
        p_workspace_id: data.wid,
        p_name: name,
        p_objective: objective,
        p_target_date: fd.get('targetDate') || null,
        p_visibility: visibility,
        p_participant_ids: participantIds,
      });
      const phases = String(fd.get('phaseTitles') || '').split(/\r?\n/).map(x => x.trim()).filter(Boolean).slice(0,7);
      if (phases.length) {
        await api.insert('milestones', phases.map((title, index) => ({
          workspace_id: data.wid,
          project_id: result.project_id,
          title,
          position: index + 1,
          status: index === 0 ? 'active' : 'todo',
        })), { returnRepresentation: false });
      }
      cache.at = 0;
      location.hash = `#/projects/${result.project_id}/overview`;
      await delay(40);
      location.reload();
    } catch (error) {
      inlineError(form, error);
      setBusy(form, false);
    }
  }, true);
}

function customModal(title, subtitle, body) {
  const wrap = document.createElement('div');
  wrap.className = 'modal-backdrop';
  wrap.dataset.teamAccessCustomModal = '1';
  wrap.innerHTML = `<div class="modal" role="dialog" aria-modal="true"><div class="card-head"><div><h2>${esc(title)}</h2><p style="margin:4px 0 0;color:var(--live-muted)">${esc(subtitle)}</p></div><button class="icon-button" type="button" data-team-close>✕</button></div>${body}</div>`;
  wrap.addEventListener('click', e => { if (e.target === wrap || e.target.closest('[data-team-close]')) wrap.remove(); });
  document.body.appendChild(wrap);
  return wrap;
}

async function openProjectAccess(projectId) {
  const data = await snapshot(true);
  if (!data || !canManage(data)) return;
  const project = data.projects.find(p => p.id === projectId);
  if (!project) return;
  const assigned = new Map(data.projectMembers.filter(pm => pm.project_id === projectId).map(pm => [pm.user_id,pm.role]));
  const visibility = project.visibility || 'team';
  const rows = data.members.map(m => {
    const implicitAdmin = ['owner','admin'].includes(m.role);
    const teamInternal = visibility === 'team' && m.role !== 'guest';
    const lead = assigned.get(m.user_id) === 'lead' || m.user_id === project.created_by;
    const checked = implicitAdmin || teamInternal || assigned.has(m.user_id);
    const disabled = implicitAdmin || teamInternal || lead;
    const note = implicitAdmin ? `${roleLabel(m.role)} · accès de gestion automatique` : m.role === 'guest' ? 'Invité externe · partage explicite' : `${roleLabel(m.role)}${lead ? ' · responsable du projet' : ''}`;
    return `<label class="list-row" style="cursor:${disabled?'default':'pointer'};align-items:center"><input class="team-person-check" type="checkbox" value="${esc(m.user_id)}" data-role="${esc(m.role)}" ${checked?'checked':''} ${disabled?'disabled':''} style="width:18px;height:18px;accent-color:#5f63eb"><div class="list-main"><strong>${esc(nameFor(data,m.user_id))}</strong><small>${esc(note)}</small></div></label>`;
  }).join('');
  const modal = customModal(`Accès — ${project.name}`, 'La visibilité du projet décide qui y accède. Les responsabilités restent gérées à l’intérieur du projet.', `
    <form data-project-access-form>
      <div class="stack">
        <div class="field"><label>Visibilité</label><select name="visibility"><option value="team" ${visibility==='team'?'selected':''}>Équipe</option><option value="restricted" ${visibility==='restricted'?'selected':''}>Restreint</option></select></div>
        <div class="notice" data-access-help>${esc(visibility==='team'?teamVisibilityHelp():restrictedVisibilityHelp())}</div>
        <div><div class="section-head compact"><div><h3>Personnes ayant accès</h3><div class="metric-label">Les administrateurs et le responsable du projet ne peuvent pas être exclus ici.</div></div></div><div class="stack" data-person-list>${rows}</div></div>
      </div>
      <div class="modal-actions"><button class="btn" type="button" data-team-close>Annuler</button><button class="btn primary" type="submit">Enregistrer les accès</button></div>
    </form>`);
  const form = modal.querySelector('[data-project-access-form]');
  const vis = form.elements.visibility;
  const update = () => {
    const isTeam = vis.value === 'team';
    form.querySelector('[data-access-help]').textContent = isTeam ? teamVisibilityHelp() : restrictedVisibilityHelp();
    form.querySelectorAll('.team-person-check').forEach(input => {
      const role = input.dataset.role;
      const immutableAdmin = role === 'owner' || role === 'admin';
      const lead = assigned.get(input.value) === 'lead' || input.value === project.created_by;
      if (immutableAdmin || lead || (isTeam && role !== 'guest')) {
        input.checked = true;
        input.disabled = true;
      } else input.disabled = false;
    });
  };
  vis.addEventListener('change', update);
  form.addEventListener('submit', async e => {
    e.preventDefault();
    setBusy(form,true);
    try {
      const selected = [...form.querySelectorAll('.team-person-check')].filter(i => i.checked).map(i => i.value);
      await api.rpc('set_project_access_v1', { p_project_id: project.id, p_visibility: vis.value, p_member_ids: selected });
      cache.at = 0;
      modal.remove();
      await patchTeamPage(true);
    } catch(error) {
      inlineError(form,error);
      setBusy(form,false);
    }
  });
}

async function patchTeamPage(force = false) {
  const h1 = [...document.querySelectorAll('h1')].find(el => el.textContent.trim() === 'Équipe');
  if (!h1) return;
  const head = h1.closest('.section-head');
  if (!head || (!force && head.dataset.teamAccessPage === '1')) return;
  const data = await snapshot(force);
  if (!data) return;
  head.dataset.teamAccessPage = '1';
  const eyebrow = head.querySelector('.eyebrow'); if (eyebrow) eyebrow.textContent = 'Personnes & accès';
  const p = head.querySelector('p'); if (p) p.textContent = 'Le rôle définit les droits dans l’espace ; la visibilité du projet définit qui peut y participer.';
  const invite = head.querySelector('[data-action="invite-member"]'); if (invite) invite.textContent = '＋ Inviter une personne';

  const page = head.parentElement;
  if (!page) return;
  const cards = [...page.children].filter(el => el.classList?.contains('card'));
  const memberCard = cards[0];
  if (memberCard) {
    memberCard.querySelectorAll('.team-row').forEach(row => {
      const pill = row.querySelector('.pill');
      const small = row.querySelector('.list-main small');
      if (small && pill) {
        const role = pill.textContent.trim().replace('Invité / client','Invité externe');
        small.textContent = role === 'Invité externe' ? 'Accès uniquement aux projets explicitement partagés.' : role === 'Administrateur' || role === 'Propriétaire' ? 'Accès de gestion à l’espace et à ses projets.' : 'Accès automatique aux projets Équipe ; projets restreints sur partage.';
      }
    });
  }

  page.querySelector('[data-team-project-visibility-card]')?.remove();
  const visibilityCard = document.createElement('div');
  visibilityCard.className = 'card';
  visibilityCard.style.marginTop = '16px';
  visibilityCard.dataset.teamProjectVisibilityCard = '1';
  visibilityCard.innerHTML = `<div class="section-head compact"><div><h2>Visibilité des projets</h2><div class="metric-label">Équipe = membres internes actuels et futurs. Restreint = personnes choisies. Un externe n’est jamais ajouté automatiquement.</div></div></div><div class="stack">${data.projects.map(project => `<div class="list-row"><div class="list-main"><strong>${esc(project.name)}</strong><small>${esc(project.visibility==='restricted'?restrictedVisibilityHelp():teamVisibilityHelp())}</small></div><span class="pill ${project.visibility==='restricted'?'blue':'good'}">${visibilityLabel(project.visibility)}</span>${canManage(data)?`<button class="btn small" type="button" data-project-access="${esc(project.id)}">Gérer l’accès</button>`:''}</div>`).join('') || '<div class="notice">Aucun projet actif.</div>'}</div>`;
  const invitationCard = cards.find(card => card.querySelector('#invite-list'));
  if (invitationCard) page.insertBefore(visibilityCard, invitationCard);
  else if (memberCard) memberCard.insertAdjacentElement('afterend', visibilityCard);
  else page.appendChild(visibilityCard);
  visibilityCard.querySelectorAll('[data-project-access]').forEach(button => button.addEventListener('click', () => openProjectAccess(button.dataset.projectAccess)));

  const invitationHelp = invitationCard?.querySelector('.metric-label');
  if (invitationHelp) invitationHelp.textContent = 'Une invitation définit le rôle dans l’espace ; les projets Équipe sont automatiques et les projets restreints se partagent explicitement.';
}

async function patchMemberManageModal(dialog) {
  if (dialog.dataset.teamAccessMemberManage === '1') return;
  const title = (dialog.querySelector('h1,h2,h3')?.textContent || '').trim();
  if (!title.startsWith('Gérer ')) return;
  const form = dialog.querySelector('form[data-form="member-manage"]');
  if (!form) return;
  dialog.dataset.teamAccessMemberManage = '1';
  const grid = form.querySelector('.member-project-grid');
  if (grid) grid.style.display = 'none';
  const accessField = [...form.querySelectorAll('.field')].find(x => (x.querySelector('label')?.textContent || '').includes('Visibilité portefeuille'));
  if (accessField) accessField.style.display = 'none';
  const notice = form.querySelector('.notice');
  if (notice) notice.innerHTML = '<strong>Règle 2b2c :</strong> le rôle gère les droits dans l’espace. L’accès aux projets se gère désormais dans « Visibilité des projets » sur la page Équipe.';
}

async function scan() {
  document.querySelectorAll('[role="dialog"],.modal').forEach(dialog => {
    patchInviteModal(dialog).catch(console.warn);
    patchProjectModal(dialog).catch(console.warn);
    patchMemberManageModal(dialog).catch(console.warn);
  });
  patchTeamPage().catch(console.warn);
}

const observer = new MutationObserver(() => { queueMicrotask(scan); });
observer.observe(document.documentElement, { childList: true, subtree: true });
window.addEventListener('hashchange', () => setTimeout(scan, 0));
scan();
console.info(`[2b2c] ${VERSION} active`);
