import { SupabaseBrowserClient } from './supabase-client.js';

const VERSION = '4b4c resource model v1.0.0';
const config = window.__4B4C_CONFIG__ || {};
const app = document.getElementById('app');
if (!app || !config.supabaseUrl || !config.supabasePublishableKey) {
  console.warn(`${VERSION}: configuration unavailable`);
} else {
  const api = new SupabaseBrowserClient({ url: config.supabaseUrl, publishableKey: config.supabasePublishableKey });
  const workspaceKey = config.workspaceStorageKey || '4b4c.live.workspace.v1';
  const projectCache = new Map();
  let libraryCache = { at: 0, wid: '', rows: [], projects: [] };
  let scheduled = false;
  let running = false;

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
  const escAttr = esc;
  const wid = () => localStorage.getItem(workspaceKey) || '';
  const routeProjectId = () => location.hash.match(/^#\/projects\/([^/]+)\/resources(?:\/|$)/)?.[1] || '';
  const isLibraryRoute = () => /^#\/library(?:\/|$)/.test(location.hash);
  const bytes = (value) => {
    const n = Number(value || 0);
    if (!n) return '0 o';
    if (n < 1024) return `${n} o`;
    if (n < 1024 ** 2) return `${Math.round(n / 1024)} Ko`;
    return `${(n / (1024 ** 2)).toFixed(n >= 10 * 1024 ** 2 ? 0 : 1)} Mo`;
  };
  const hostLabel = (url) => {
    try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return 'Lien'; }
  };
  const iconFor = (resource) => resource.kind === 'link' ? '↗' : '▧';

  function ensureStyles() {
    if (document.getElementById('resource-model-v1-styles')) return;
    const style = document.createElement('style');
    style.id = 'resource-model-v1-styles';
    style.textContent = `
      .resource-model-v1{display:grid;gap:14px;margin:0 0 18px}.resource-model-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}.resource-model-head h2{margin:2px 0 4px;font-size:1.12rem}.resource-model-head p{margin:0;color:var(--live-muted);max-width:760px}.resource-model-actions{display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end}
      .resource-kind-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.resource-kind-card{padding:0;overflow:hidden}.resource-kind-title{display:flex;justify-content:space-between;align-items:center;padding:14px 15px 10px}.resource-kind-title h3{margin:0;font-size:.98rem}.resource-kind-title small{color:var(--live-muted)}
      .resource-row-v1{display:grid;grid-template-columns:38px minmax(0,1fr) auto;gap:11px;align-items:center;padding:11px 14px;border-top:1px solid var(--live-line,#e5e7eb)}.resource-glyph-v1{width:34px;height:34px;display:grid;place-items:center;border-radius:11px;background:rgba(56,103,244,.08);font-weight:800}.resource-copy-v1{min-width:0}.resource-copy-v1 strong,.resource-copy-v1 small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.resource-copy-v1 small{margin-top:3px;color:var(--live-muted)}.resource-row-actions{display:flex;align-items:center;gap:6px}.resource-visibility-v1{font-size:11px;font-weight:700;padding:4px 7px;border-radius:999px;background:rgba(100,116,139,.1)}.resource-visibility-v1.shared{background:rgba(56,103,244,.09);color:#3158ca}
      .resource-empty-v1{padding:18px 14px;color:var(--live-muted);border-top:1px solid var(--live-line,#e5e7eb);font-size:13px}.resource-model-explainer{padding:11px 13px;border:1px solid rgba(56,103,244,.14);background:rgba(56,103,244,.045);border-radius:13px;color:var(--live-muted);font-size:13px}.resource-model-explainer strong{color:inherit}
      .resource-library-v1{margin:0 0 18px}.resource-library-v1 .resource-library-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.resource-library-item{display:grid;grid-template-columns:36px minmax(0,1fr);gap:10px;padding:12px;border:1px solid var(--live-line,#e5e7eb);border-radius:14px;background:var(--live-card,#fff);text-align:left}.resource-library-item strong,.resource-library-item small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.resource-library-item small{color:var(--live-muted);margin-top:3px}
      .resource-modal-v1 .modal{max-width:620px}.resource-modal-v1 .resource-modal-copy{margin:-4px 0 14px;color:var(--live-muted)}
      .resource-toast-v1{position:fixed;right:20px;bottom:20px;z-index:12000;max-width:min(390px,calc(100vw - 40px));padding:11px 14px;border-radius:12px;background:#172033;color:#fff;box-shadow:0 14px 34px rgba(23,32,51,.22);font:600 13px/1.4 Inter,system-ui,sans-serif}.resource-toast-v1.error{background:#8f2525}
      @media(max-width:820px){.resource-kind-grid{grid-template-columns:1fr}.resource-library-v1 .resource-library-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:640px){.resource-model-head{display:grid}.resource-model-actions{justify-content:stretch}.resource-model-actions .btn{flex:1 1 auto}.resource-row-v1{grid-template-columns:34px minmax(0,1fr)}.resource-row-actions{grid-column:2;justify-content:flex-start;flex-wrap:wrap}.resource-library-v1 .resource-library-grid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function toast(message, error = false) {
    document.querySelector('.resource-toast-v1')?.remove();
    const node = document.createElement('div');
    node.className = `resource-toast-v1${error ? ' error' : ''}`;
    node.textContent = message;
    document.body.appendChild(node);
    setTimeout(() => node.remove(), 3200);
  }

  async function projectSnapshot(projectId, force = false) {
    const workspaceId = wid();
    if (!workspaceId || !api.getSession()) return null;
    const cached = projectCache.get(projectId);
    if (!force && cached && Date.now() - cached.at < 2500) return cached.data;
    const user = await api.getUser();
    const [projects, memberships, projectMembers, resources] = await Promise.all([
      api.select('projects', `select=id,workspace_id,name,visibility,status&workspace_id=eq.${workspaceId}&id=eq.${projectId}&limit=1`),
      api.select('workspace_members', `select=user_id,role,status,access_mode&workspace_id=eq.${workspaceId}&user_id=eq.${user.id}&status=eq.active&limit=1`),
      api.select('project_members', `select=project_id,user_id,role&project_id=eq.${projectId}&user_id=eq.${user.id}`),
      api.select('project_resources', `select=*&workspace_id=eq.${workspaceId}&project_id=eq.${projectId}&order=updated_at.desc`),
    ]);
    const data = { workspaceId, user, project: projects[0] || null, membership: memberships[0] || null, projectMember: projectMembers[0] || null, resources };
    projectCache.set(projectId, { at: Date.now(), data });
    return data;
  }

  async function librarySnapshot(force = false) {
    const workspaceId = wid();
    if (!workspaceId || !api.getSession()) return null;
    if (!force && libraryCache.wid === workspaceId && Date.now() - libraryCache.at < 2500) return libraryCache;
    const [rows, projects] = await Promise.all([
      api.select('project_resources', `select=*&workspace_id=eq.${workspaceId}&order=updated_at.desc&limit=100`),
      api.select('projects', `select=id,name&workspace_id=eq.${workspaceId}&status=neq.archived`),
    ]);
    libraryCache = { at: Date.now(), wid: workspaceId, rows, projects };
    return libraryCache;
  }

  function canWrite(data) {
    const role = data?.membership?.role;
    if (role === 'owner' || role === 'admin') return true;
    if (role !== 'member') return false;
    if (data?.project?.visibility === 'team') return true;
    return ['lead','member'].includes(data?.projectMember?.role);
  }

  function resourceSignature(rows) {
    return rows.map((r) => `${r.id}:${r.updated_at}:${r.visibility}`).join('|');
  }

  function rowHtml(resource, writable) {
    const shared = resource.visibility === 'shared';
    const meta = resource.kind === 'link'
      ? hostLabel(resource.url)
      : `${esc(resource.file_name || resource.title)} · ${bytes(resource.size_bytes)}`;
    return `<div class="resource-row-v1" data-resource-id="${escAttr(resource.id)}">
      <span class="resource-glyph-v1">${iconFor(resource)}</span>
      <div class="resource-copy-v1"><strong>${esc(resource.title)}</strong><small>${meta}${resource.description ? ` · ${esc(resource.description)}` : ''}</small></div>
      <div class="resource-row-actions">
        <span class="resource-visibility-v1 ${shared ? 'shared' : ''}">${shared ? 'Partagé' : 'Interne'}</span>
        <button class="btn small" type="button" data-resource-action="open" data-resource-id="${escAttr(resource.id)}">Ouvrir</button>
        ${writable ? `<button class="btn small" type="button" data-resource-action="toggle" data-resource-id="${escAttr(resource.id)}">${shared ? 'Rendre interne' : 'Partager'}</button><button class="btn small" type="button" data-resource-action="delete" data-resource-id="${escAttr(resource.id)}">Supprimer</button>` : ''}
      </div>
    </div>`;
  }

  async function patchProjectPage(projectId, force = false) {
    const headerTitle = [...document.querySelectorAll('.page-head-v3 h2')].find((node) => ['Ressources','Livrables'].includes(node.textContent.trim()));
    if (!headerTitle) return;
    const header = headerTitle.closest('.page-head-v3');
    if (!header || !header.parentElement) return;
    const data = await projectSnapshot(projectId, force);
    if (!data?.project) return;
    const writable = canWrite(data);
    const files = data.resources.filter((r) => r.kind === 'file');
    const links = data.resources.filter((r) => r.kind === 'link');

    const eyebrow = header.querySelector('.eyebrow');
    if (eyebrow) eyebrow.textContent = 'Sorties versionnées';
    headerTitle.textContent = 'Livrables';
    const p = header.querySelector('p');
    if (p) p.textContent = 'Les livrables sont les éléments à remettre, réviser ou valider. Ils gardent leurs versions et leur historique.';
    const oldButton = header.querySelector('[data-action="upload-file"]');
    if (oldButton) oldButton.textContent = '＋ Nouveau livrable';

    let section = document.querySelector(`[data-resource-model-project="${CSS.escape(projectId)}"]`);
    if (!section) {
      section = document.createElement('section');
      section.className = 'resource-model-v1';
      section.dataset.resourceModelProject = projectId;
      header.parentElement.insertBefore(section, header);
    }
    const signature = `${resourceSignature(data.resources)}:${writable}`;
    if (section.dataset.signature === signature) return;
    section.dataset.signature = signature;
    section.innerHTML = `
      <div class="resource-model-head">
        <div><span class="eyebrow">Travail & références</span><h2>Ressources de travail</h2><p>Un fichier ou un lien sert au travail quotidien. Il ne devient pas automatiquement un livrable.</p></div>
        ${writable ? `<div class="resource-model-actions"><button class="btn" type="button" data-resource-action="add-file" data-project="${escAttr(projectId)}">＋ Fichier</button><button class="btn" type="button" data-resource-action="add-link" data-project="${escAttr(projectId)}">＋ Lien</button></div>` : ''}
      </div>
      <div class="resource-model-explainer"><strong>Règle simple :</strong> ressource = support de travail ; livrable = sortie officielle versionnée et éventuellement soumise à validation.</div>
      <div class="resource-kind-grid">
        <div class="card resource-kind-card"><div class="resource-kind-title"><h3>Fichiers de travail</h3><small>${files.length}</small></div>${files.length ? files.map((r) => rowHtml(r, writable)).join('') : `<div class="resource-empty-v1">${writable ? 'Ajoutez ici les documents, images ou fichiers utiles au travail, sans créer de faux livrable.' : 'Aucun fichier de travail partagé.'}</div>`}</div>
        <div class="card resource-kind-card"><div class="resource-kind-title"><h3>Liens utiles</h3><small>${links.length}</small></div>${links.length ? links.map((r) => rowHtml(r, writable)).join('') : `<div class="resource-empty-v1">${writable ? 'Ajoutez les maquettes, dépôts, documents en ligne ou références externes.' : 'Aucun lien partagé.'}</div>`}</div>
      </div>`;
  }

  async function patchLibraryPage(force = false) {
    const h1 = [...document.querySelectorAll('.page-head-v3 h1')].find((node) => ['Fichiers','Bibliothèque'].includes(node.textContent.trim()));
    if (!h1) return;
    const header = h1.closest('.page-head-v3');
    if (!header || !header.parentElement) return;
    const data = await librarySnapshot(force);
    if (!data) return;
    h1.textContent = 'Bibliothèque';
    const eyebrow = header.querySelector('.eyebrow');
    if (eyebrow) eyebrow.textContent = 'Ressources & livrables';
    const p = header.querySelector('p');
    if (p) p.textContent = 'Retrouvez les ressources de travail séparément des livrables versionnés.';
    const input = document.getElementById('library-search');
    if (input) input.placeholder = 'Rechercher un livrable…';
    const existingHeading = document.querySelector('.library-recent h2');
    if (existingHeading && !/Livrables/.test(existingHeading.textContent)) existingHeading.textContent = `Livrables · ${existingHeading.textContent}`;

    let section = document.querySelector('[data-resource-library-v1]');
    if (!section) {
      section = document.createElement('section');
      section.className = 'card resource-library-v1';
      section.dataset.resourceLibraryV1 = '1';
      header.insertAdjacentElement('afterend', section);
    }
    const signature = resourceSignature(data.rows);
    if (section.dataset.signature === signature) return;
    section.dataset.signature = signature;
    const names = new Map(data.projects.map((p) => [p.id, p.name]));
    section.innerHTML = `<div class="section-head compact"><div><span class="eyebrow">Ressources de travail</span><h2>Fichiers & liens</h2></div><span class="metric-label">${data.rows.length} élément${data.rows.length > 1 ? 's' : ''}</span></div>${data.rows.length ? `<div class="resource-library-grid">${data.rows.slice(0,18).map((r) => `<button type="button" class="resource-library-item" data-resource-action="open" data-resource-id="${escAttr(r.id)}"><span class="resource-glyph-v1">${iconFor(r)}</span><span><strong>${esc(r.title)}</strong><small>${esc(names.get(r.project_id) || 'Projet')} · ${r.kind === 'link' ? esc(hostLabel(r.url)) : bytes(r.size_bytes)}</small></span></button>`).join('')}</div>` : '<div class="resource-empty-v1">Aucune ressource de travail pour le moment. Les livrables restent listés séparément ci-dessous.</div>'}`;
  }

  function modalFrame(title, description, body) {
    document.querySelector('.resource-modal-v1')?.remove();
    const wrap = document.createElement('div');
    wrap.className = 'modal-backdrop resource-modal-v1';
    wrap.innerHTML = `<div class="modal" role="dialog" aria-modal="true"><div class="card-head"><div><h2>${esc(title)}</h2><p class="resource-modal-copy">${esc(description)}</p></div><button class="icon-button" type="button" data-resource-action="close" aria-label="Fermer">✕</button></div>${body}</div>`;
    wrap.addEventListener('click', (event) => { if (event.target === wrap) wrap.remove(); });
    document.body.appendChild(wrap);
    return wrap;
  }

  function openAddFile(projectId) {
    const wrap = modalFrame('Ajouter un fichier de travail','Ce fichier sert de référence ou de support. Utilisez « Nouveau livrable » pour un élément versionné à remettre ou valider.',`
      <form data-resource-form="file" data-project="${escAttr(projectId)}"><div class="stack"><div class="field"><label>Fichier</label><input type="file" name="file" required><small>50 Mo maximum.</small></div><div class="field"><label>Nom affiché</label><input name="title" maxlength="240" placeholder="Ex. Brief graphique"></div><div class="field"><label>Description <span class="metric-label">facultatif</span></label><textarea name="description"></textarea></div><div class="field"><label>Visibilité</label><select name="visibility"><option value="internal">Interne</option><option value="shared">Partagé aux invités du projet</option></select></div></div><div class="modal-actions"><button class="btn" type="button" data-resource-action="close">Annuler</button><button class="btn primary" type="submit">Ajouter le fichier</button></div></form>`);
    const fileInput = wrap.querySelector('input[type=file]');
    const title = wrap.querySelector('input[name=title]');
    fileInput?.addEventListener('change', () => { if (title && !title.value.trim() && fileInput.files?.[0]) title.value = fileInput.files[0].name.replace(/\.[^.]+$/, ''); });
  }

  function openAddLink(projectId) {
    modalFrame('Ajouter un lien','Pour une maquette, un dépôt, un document en ligne ou une référence externe.',`
      <form data-resource-form="link" data-project="${escAttr(projectId)}"><div class="stack"><div class="field"><label>Nom</label><input name="title" required maxlength="240" autofocus placeholder="Ex. Maquette Figma"></div><div class="field"><label>Adresse</label><input name="url" type="url" required placeholder="https://…"></div><div class="field"><label>Description <span class="metric-label">facultatif</span></label><textarea name="description"></textarea></div><div class="field"><label>Visibilité</label><select name="visibility"><option value="internal">Interne</option><option value="shared">Partagé aux invités du projet</option></select></div></div><div class="modal-actions"><button class="btn" type="button" data-resource-action="close">Annuler</button><button class="btn primary" type="submit">Ajouter le lien</button></div></form>`);
  }

  function knownResource(id) {
    for (const cached of projectCache.values()) {
      const row = cached.data?.resources?.find((r) => r.id === id);
      if (row) return row;
    }
    return libraryCache.rows.find((r) => r.id === id) || null;
  }

  async function getResource(id) {
    const known = knownResource(id);
    if (known) return known;
    const rows = await api.select('project_resources', `select=*&id=eq.${id}&limit=1`);
    return rows[0] || null;
  }

  async function openResource(id) {
    const resource = await getResource(id);
    if (!resource) throw new Error('Ressource introuvable ou inaccessible.');
    if (resource.kind === 'link') {
      const url = new URL(resource.url);
      if (!['http:','https:'].includes(url.protocol)) throw new Error('Ce lien utilise un protocole non autorisé.');
      window.open(url.toString(), '_blank', 'noopener,noreferrer');
      return;
    }
    const signed = await api.signedUrl('workspace-files', resource.storage_path, 900);
    const anchor = document.createElement('a');
    anchor.href = signed;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  async function invalidate(projectId) {
    if (projectId) projectCache.delete(projectId);
    libraryCache.at = 0;
    await scan(true);
  }

  async function toggleResource(id) {
    const resource = await getResource(id);
    if (!resource) throw new Error('Ressource introuvable.');
    const visibility = resource.visibility === 'shared' ? 'internal' : 'shared';
    await api.update('project_resources', `id=eq.${id}`, { visibility }, { returnRepresentation: false });
    toast(visibility === 'shared' ? 'Ressource partagée avec les invités du projet.' : 'Ressource repassée en interne.');
    await invalidate(resource.project_id);
  }

  async function deleteResource(id) {
    const resource = await getResource(id);
    if (!resource) throw new Error('Ressource introuvable.');
    if (!window.confirm(`Supprimer « ${resource.title} » ?`)) return;
    await api.remove('project_resources', `id=eq.${id}`);
    if (resource.kind === 'file' && resource.storage_path) {
      try { await api.removeObject('workspace-files', resource.storage_path); } catch (error) { console.warn('resource storage cleanup failed', error); }
    }
    toast('Ressource supprimée.');
    await invalidate(resource.project_id);
  }

  function setFormBusy(form, busy) {
    form.querySelectorAll('button,input,select,textarea').forEach((el) => { el.disabled = busy; });
  }

  async function submitFile(form) {
    const projectId = form.dataset.project;
    const data = await projectSnapshot(projectId, true);
    if (!data || !canWrite(data)) throw new Error('Vous ne pouvez pas ajouter de ressource à ce projet.');
    const file = form.querySelector('input[name=file]')?.files?.[0];
    if (!file) throw new Error('Choisissez un fichier.');
    if (file.size > 50 * 1024 * 1024) throw new Error('Ce fichier dépasse la limite de 50 Mo.');
    const fd = new FormData(form);
    const title = String(fd.get('title') || '').trim() || file.name.replace(/\.[^.]+$/, '') || file.name;
    const description = String(fd.get('description') || '').trim();
    const visibility = fd.get('visibility') === 'shared' ? 'shared' : 'internal';
    const safeName = file.name.replace(/[\\/]+/g, '-');
    const path = `${data.workspaceId}/${projectId}/resources/${crypto.randomUUID()}/${safeName}`;
    setFormBusy(form, true);
    try {
      await api.upload('workspace-files', path, file);
      try {
        await api.insert('project_resources', [{
          workspace_id: data.workspaceId,
          project_id: projectId,
          kind: 'file',
          title,
          description,
          visibility,
          storage_path: path,
          file_name: file.name,
          mime_type: file.type || null,
          size_bytes: file.size,
          created_by: data.user.id,
        }], { returnRepresentation: false });
      } catch (error) {
        try { await api.removeObject('workspace-files', path); } catch {}
        throw error;
      }
      form.closest('.resource-modal-v1')?.remove();
      toast('Fichier de travail ajouté.');
      await invalidate(projectId);
    } finally { setFormBusy(form, false); }
  }

  async function submitLink(form) {
    const projectId = form.dataset.project;
    const data = await projectSnapshot(projectId, true);
    if (!data || !canWrite(data)) throw new Error('Vous ne pouvez pas ajouter de ressource à ce projet.');
    const fd = new FormData(form);
    const title = String(fd.get('title') || '').trim();
    const rawUrl = String(fd.get('url') || '').trim();
    const parsed = new URL(rawUrl);
    if (!['http:','https:'].includes(parsed.protocol)) throw new Error('Utilisez une adresse http:// ou https://.');
    setFormBusy(form, true);
    try {
      await api.insert('project_resources', [{
        workspace_id: data.workspaceId,
        project_id: projectId,
        kind: 'link',
        title,
        description: String(fd.get('description') || '').trim(),
        visibility: fd.get('visibility') === 'shared' ? 'shared' : 'internal',
        url: parsed.toString(),
        created_by: data.user.id,
      }], { returnRepresentation: false });
      form.closest('.resource-modal-v1')?.remove();
      toast('Lien ajouté aux ressources.');
      await invalidate(projectId);
    } finally { setFormBusy(form, false); }
  }

  async function handleClick(event) {
    const target = event.target.closest('[data-resource-action]');
    if (!target) return;
    event.preventDefault();
    const action = target.dataset.resourceAction;
    try {
      if (action === 'close') target.closest('.resource-modal-v1')?.remove();
      else if (action === 'add-file') openAddFile(target.dataset.project);
      else if (action === 'add-link') openAddLink(target.dataset.project);
      else if (action === 'open') await openResource(target.dataset.resourceId);
      else if (action === 'toggle') await toggleResource(target.dataset.resourceId);
      else if (action === 'delete') await deleteResource(target.dataset.resourceId);
    } catch (error) { toast(error?.message || String(error), true); }
  }

  async function handleSubmit(event) {
    const form = event.target.closest('form[data-resource-form]');
    if (!form) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    try {
      if (form.dataset.resourceForm === 'file') await submitFile(form);
      else if (form.dataset.resourceForm === 'link') await submitLink(form);
    } catch (error) {
      setFormBusy(form, false);
      toast(error?.message || String(error), true);
    }
  }

  async function scan(force = false) {
    if (running) return;
    running = true;
    try {
      ensureStyles();
      const projectId = routeProjectId();
      if (projectId) await patchProjectPage(projectId, force);
      else document.querySelectorAll('[data-resource-model-project]').forEach((node) => node.remove());
      if (isLibraryRoute()) await patchLibraryPage(force);
      else document.querySelector('[data-resource-library-v1]')?.remove();
    } catch (error) { console.warn(`${VERSION}: scan failed`, error); }
    finally { running = false; }
  }

  function scheduleScan(force = false) {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(async () => { scheduled = false; await scan(force); });
  }

  document.addEventListener('click', handleClick, true);
  document.addEventListener('submit', handleSubmit, true);
  window.addEventListener('hashchange', () => scheduleScan(true));
  const observer = new MutationObserver(() => scheduleScan(false));
  observer.observe(app, { childList: true, subtree: true });
  scheduleScan(true);
}
