const DEFAULT_SESSION_KEY = '4b4c.supabase.session.v2';

export class ApiError extends Error {
  constructor(status, payload, context = '') {
    const message = payload?.msg || payload?.message || payload?.error_description || payload?.error || `Erreur HTTP ${status}`;
    super(context ? `${context} : ${message}` : message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

export class SupabaseBrowserClient {
  constructor({ url, publishableKey, sessionKey = DEFAULT_SESSION_KEY, storage = window.localStorage, fetchImpl = window.fetch.bind(window) }) {
    if (!url || !publishableKey) throw new Error('Configuration Supabase incomplète');
    this.url = String(url).replace(/\/$/, '');
    this.publishableKey = publishableKey;
    this.sessionKey = sessionKey;
    this.storage = storage;
    this.fetchImpl = fetchImpl;
    this.session = this.#loadSession();
    this.rowVersions = new Map();
    this.rowVersionLocks = new Map();
  }

  #loadSession() {
    try {
      const raw = this.storage.getItem(this.sessionKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.access_token && parsed?.refresh_token ? parsed : null;
    } catch { return null; }
  }

  #syncSession() {
    const stored = this.#loadSession();
    const currentAccess = this.session?.access_token || null;
    const storedAccess = stored?.access_token || null;
    const currentRefresh = this.session?.refresh_token || null;
    const storedRefresh = stored?.refresh_token || null;
    if (currentAccess !== storedAccess || currentRefresh !== storedRefresh) this.session = stored;
    return this.session;
  }

  #saveSession(session) {
    this.session = session || null;
    try {
      if (session) this.storage.setItem(this.sessionKey, JSON.stringify(session));
      else this.storage.removeItem(this.sessionKey);
    } catch {}
  }

  #rowVersionKey(table, id) { return `${table}:${id}`; }

  #formLocksRow(table, id) {
    if (typeof document === 'undefined' || !id) return false;
    const specs = [
      ['actions', 'action-edit', 'actionId'],
      ['projects', 'project-edit', 'projectId'],
      ['milestones', 'milestone-edit', 'milestoneId'],
      ['requests', 'request-response', 'requestId'],
    ];
    for (const [targetTable, formType, idField] of specs) {
      if (targetTable !== table) continue;
      for (const form of document.querySelectorAll(`form[data-form="${formType}"]`)) {
        const control = form.elements?.namedItem?.(idField) || form.querySelector(`[name="${idField}"]`);
        if (String(control?.value || '') === String(id)) return true;
      }
    }
    if (table === 'profiles' && document.querySelector('form[data-form="profile"]')) {
      const userId = this.#syncSession()?.user?.id || null;
      return Boolean(userId && String(userId) === String(id));
    }
    return false;
  }

  #rememberRows(table, payload) {
    const rows = Array.isArray(payload) ? payload : [];
    for (const row of rows) {
      if (!row?.id || !row?.updated_at) continue;
      const id = String(row.id);
      const key = this.#rowVersionKey(table, id);
      const activeEdit = this.#formLocksRow(table, id);
      if (activeEdit && !this.rowVersionLocks.has(key)) {
        const previousVersion = this.rowVersions.get(key);
        if (previousVersion) this.rowVersionLocks.set(key, previousVersion);
      }
      if (!activeEdit) this.rowVersionLocks.delete(key);
      this.rowVersions.set(key, String(row.updated_at));
    }
  }

  #rowIdFromQuery(query = '') {
    const match = String(query).match(/(?:^|&)id=eq\.([^&]+)/);
    if (!match) return null;
    try { return decodeURIComponent(match[1]); }
    catch { return match[1]; }
  }

  getSession() { return this.#syncSession(); }

  async signUp({ email, password, displayName }) {
    const payload = await this.#requestRaw('/auth/v1/signup', {
      method: 'POST',
      body: { email, password, data: { display_name: displayName } },
      auth: false,
      context: 'Création du compte'
    });
    if (payload?.access_token && payload?.refresh_token) this.#saveSession(payload);
    return payload;
  }

  async signIn({ email, password }) {
    const payload = await this.#requestRaw('/auth/v1/token?grant_type=password', {
      method: 'POST', body: { email, password }, auth: false, context: 'Connexion'
    });
    this.#saveSession(payload);
    return payload;
  }

  async refreshSession() {
    this.#syncSession();
    if (!this.session?.refresh_token) throw new Error('Session expirée');
    const payload = await this.#requestRaw('/auth/v1/token?grant_type=refresh_token', {
      method: 'POST', body: { refresh_token: this.session.refresh_token }, auth: false, context: 'Rafraîchissement de session'
    });
    this.#saveSession(payload);
    return payload;
  }

  async signOut() {
    this.#syncSession();
    if (this.session?.access_token) {
      try { await this.#requestRaw('/auth/v1/logout', { method: 'POST', auth: true, retryAuth: false }); } catch {}
    }
    this.#saveSession(null);
  }

  async getUser() { return this.request('/auth/v1/user', { auth: true, context: 'Lecture du compte' }); }

  async select(table, query = '') {
    const result = await this.request(`/rest/v1/${encodeURIComponent(table)}${query ? `?${query}` : ''}`, { context: `Lecture ${table}` });
    this.#rememberRows(table, result);
    return result;
  }

  async insert(table, rows, { returnRepresentation = true } = {}) {
    const result = await this.request(`/rest/v1/${encodeURIComponent(table)}`, {
      method: 'POST', body: rows, prefer: returnRepresentation ? 'return=representation' : 'return=minimal', context: `Création ${table}`
    });
    if (returnRepresentation) this.#rememberRows(table, result);
    return result;
  }

  async update(table, query, patch, { returnRepresentation = true } = {}) {
    const rowId = this.#rowIdFromQuery(query);
    const versionKey = rowId ? this.#rowVersionKey(table, rowId) : null;
    const activeEdit = Boolean(rowId && this.#formLocksRow(table, rowId));
    if (versionKey && !activeEdit) this.rowVersionLocks.delete(versionKey);
    if (versionKey && activeEdit && !this.rowVersionLocks.has(versionKey)) {
      const current = this.rowVersions.get(versionKey);
      if (current) this.rowVersionLocks.set(versionKey, current);
    }
    const expectedVersion = versionKey
      ? (this.rowVersionLocks.get(versionKey) || this.rowVersions.get(versionKey))
      : null;
    const alreadyVersioned = /(?:^|&)updated_at=/.test(String(query));

    if (expectedVersion && !alreadyVersioned) {
      const guardedQuery = `${query}&updated_at=eq.${encodeURIComponent(expectedVersion)}`;
      const result = await this.request(`/rest/v1/${encodeURIComponent(table)}?${guardedQuery}`, {
        method: 'PATCH', body: patch, prefer: 'return=representation', context: `Mise à jour ${table}`
      });
      if (!Array.isArray(result) || result.length === 0) {
        if (versionKey) {
          this.rowVersionLocks.delete(versionKey);
          this.rowVersions.delete(versionKey);
        }
        throw new Error('Cet élément a été modifié ailleurs ou votre accès a changé. Rechargez les données avant d’enregistrer afin de ne pas écraser un changement plus récent.');
      }
      if (versionKey) this.rowVersionLocks.delete(versionKey);
      this.#rememberRows(table, result);
      return returnRepresentation ? result : null;
    }

    const result = await this.request(`/rest/v1/${encodeURIComponent(table)}?${query}`, {
      method: 'PATCH', body: patch, prefer: returnRepresentation ? 'return=representation' : 'return=minimal', context: `Mise à jour ${table}`
    });
    if (versionKey) this.rowVersionLocks.delete(versionKey);
    if (returnRepresentation) this.#rememberRows(table, result);
    else if (versionKey) this.rowVersions.delete(versionKey);
    return result;
  }

  async remove(table, query) {
    return this.request(`/rest/v1/${encodeURIComponent(table)}?${query}`, { method: 'DELETE', prefer: 'return=minimal', context: `Suppression ${table}` });
  }

  async rpc(name, args = {}) {
    return this.request(`/rest/v1/rpc/${encodeURIComponent(name)}`, { method: 'POST', body: args, context: `Action ${name}` });
  }

  async upload(bucket, path, file, { upsert = false } = {}) {
    return this.#requestRaw(`/storage/v1/object/${encodeURIComponent(bucket)}/${encodePath(path)}`, {
      method: 'POST', rawBody: file, auth: true, retryAuth: true,
      extraHeaders: { 'Content-Type': file.type || 'application/octet-stream', 'x-upsert': String(Boolean(upsert)) },
      context: 'Envoi du fichier'
    });
  }

  async removeObject(bucket, path) {
    return this.#requestRaw(`/storage/v1/object/${encodeURIComponent(bucket)}/${encodePath(path)}`, {
      method: 'DELETE', auth: true, retryAuth: true, context: 'Suppression du fichier'
    });
  }

  async signedUrl(bucket, path, expiresIn = 900) {
    const result = await this.request(`/storage/v1/object/sign/${encodeURIComponent(bucket)}/${encodePath(path)}`, {
      method: 'POST', body: { expiresIn }, context: 'Ouverture du fichier'
    });
    const signed = result?.signedURL || result?.signedUrl;
    if (!signed) throw new Error('URL signée absente');
    return signed.startsWith('http') ? signed : `${this.url}/storage/v1${signed}`;
  }

  async request(path, options = {}) {
    return this.#requestRaw(path, { auth: true, retryAuth: true, ...options });
  }

  #headers({ auth, prefer, json = true, extraHeaders = {} }) {
    if (auth) this.#syncSession();
    const headers = { apikey: this.publishableKey, ...extraHeaders };
    if (json) headers['Content-Type'] = 'application/json';
    if (auth && this.session?.access_token) headers.Authorization = `Bearer ${this.session.access_token}`;
    if (prefer) headers.Prefer = prefer;
    return headers;
  }

  async #requestRaw(path, { method = 'GET', body, rawBody, auth = false, retryAuth = false, prefer, extraHeaders = {}, context = '' } = {}) {
    if (auth) this.#syncSession();
    const execute = () => this.fetchImpl(`${this.url}${path}`, {
      method,
      headers: this.#headers({ auth, prefer, json: rawBody === undefined, extraHeaders }),
      body: rawBody !== undefined ? rawBody : body === undefined ? undefined : JSON.stringify(body)
    });

    let response;
    try { response = await execute(); }
    catch (error) { throw new Error(`${context || 'Connexion'} : réseau indisponible (${error.message})`); }

    if (response.status === 401 && auth && retryAuth && this.session?.refresh_token) {
      try { await this.refreshSession(); response = await execute(); }
      catch { this.#saveSession(null); throw new Error('Votre session a expiré. Reconnectez-vous.'); }
    }

    const payload = await parsePayload(response);
    if (!response.ok) throw new ApiError(response.status, payload, context);
    return payload;
  }
}

async function parsePayload(response) {
  if (response.status === 204) return null;
  const text = await response.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return text; }
}

function encodePath(path) {
  return String(path).split('/').filter(Boolean).map(encodeURIComponent).join('/');
}
