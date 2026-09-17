(() => {
  'use strict';

  const SESSION_KEY = '4b4c.supabase.session.v2';
  const cfg = window.__4B4C2_PREVIEW_CONFIG__ || {};
  const nativeFetch = window.fetch.bind(window);
  let refreshPromise = null;

  const parse = (value) => {
    try { return JSON.parse(value); }
    catch { return null; }
  };

  const readSession = () => parse(localStorage.getItem(SESSION_KEY));

  const saveSession = (session) => {
    try {
      if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      else localStorage.removeItem(SESSION_KEY);
    } catch {}
  };

  const configured = () => Boolean(cfg.supabaseUrl && cfg.supabasePublishableKey);

  const refreshSession = async () => {
    if (refreshPromise) return refreshPromise;
    const current = readSession();
    if (!configured() || !current?.refresh_token) return null;

    refreshPromise = (async () => {
      try {
        const response = await nativeFetch(
          `${String(cfg.supabaseUrl).replace(/\/$/, '')}/auth/v1/token?grant_type=refresh_token`,
          {
            method: 'POST',
            headers: {
              apikey: cfg.supabasePublishableKey,
              'content-type': 'application/json'
            },
            body: JSON.stringify({ refresh_token: current.refresh_token })
          }
        );
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !payload?.access_token) {
          saveSession(null);
          return null;
        }
        const next = {
          ...current,
          ...payload,
          refresh_token: payload.refresh_token || current.refresh_token
        };
        saveSession(next);
        return next;
      } catch {
        return null;
      } finally {
        refreshPromise = null;
      }
    })();

    return refreshPromise;
  };

  const isLabApiRequest = (input) => {
    const raw = typeof input === 'string' ? input : input?.url || '';
    try {
      const url = new URL(raw, window.location.href);
      return url.origin === window.location.origin && url.pathname.startsWith('/api/lab2/');
    } catch {
      return String(raw).includes('/api/lab2/');
    }
  };

  window.Lab2Auth = Object.freeze({
    getSession: readSession,
    getAccessToken: () => String(readSession()?.access_token || '').trim(),
    refreshSession
  });

  window.fetch = async (input, init = {}) => {
    if (!isLabApiRequest(input)) return nativeFetch(input, init);

    const firstResponse = await nativeFetch(input, init);
    if (firstResponse.status !== 401) return firstResponse;

    const refreshed = await refreshSession();
    if (!refreshed?.access_token) return firstResponse;

    const headers = new Headers(
      init.headers || (typeof Request !== 'undefined' && input instanceof Request ? input.headers : undefined)
    );
    headers.set('authorization', `Bearer ${refreshed.access_token}`);

    return nativeFetch(input, { ...init, headers });
  };
})();
