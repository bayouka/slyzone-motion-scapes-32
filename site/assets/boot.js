(() => {
  const config = window.__4B4C_CONFIG__ || {};
  const app = document.getElementById('app');
  const hasLiveConfig = config.mode === 'live' && config.supabaseUrl && config.supabasePublishableKey;
  const VERSION = 'v4.5.12-work-p1';

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>]/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]));
  const renderStartupError = (title, message, detail = '') => {
    if (!app) return;
    app.innerHTML = `
      <main style="min-height:100vh;display:grid;place-items:center;padding:24px;background:#f4f7fb;font:15px/1.5 Inter,system-ui,sans-serif;color:#172033">
        <section style="width:min(560px,100%);background:#fff;border:1px solid #e1e7f0;border-radius:20px;padding:24px;box-shadow:0 16px 44px rgba(27,39,65,.08)">
          <h1 style="margin:0 0 8px;font-size:22px">${escapeHtml(title)}</h1>
          <p style="margin:0 0 18px;color:#667085">${escapeHtml(message)}</p>
          <button type="button" onclick="location.reload()" style="border:0;border-radius:11px;background:#3867f4;color:#fff;padding:10px 14px;font:inherit;font-weight:700;cursor:pointer">Réessayer</button>
          ${detail ? `<details style="margin-top:16px;color:#667085"><summary>Détail technique</summary><pre style="white-space:pre-wrap;overflow-wrap:anywhere">${escapeHtml(detail)}</pre></details>` : ''}
        </section>
      </main>`;
  };

  if (!hasLiveConfig) {
    renderStartupError('Configuration 2b2c indisponible','L’application ne peut pas se connecter à son espace de données pour le moment. Réessayez dans quelques instants.');
    return;
  }

  window.__4B4C_CONFIG__ = Object.freeze({ ...config, syncProbeIntervalMs: Math.max(15000, Number(config.syncProbeIntervalMs || 20000)), fullRefreshFallbackMs: Math.max(300000, Number(config.fullRefreshFallbackMs || 300000)) });
  window.__4B4C_LIVE_MODE__ = true;
  window.__4B4C_STABILITY_MODE__ = VERSION;

  import(`./live.js?${VERSION}`)
    .then(() => import(`./home-v6.js?${VERSION}`))
    .then(() => import(`./project-access-v1.js?${VERSION}`))
    .then(() => import(`./project-messages-route-v1.js?${VERSION}`))
    .then(() => import(`./delivery-workflow-v1.js?${VERSION}`))
    // Domain workflow owners must register before the compatibility safe bridge.
    .then(() => import(`./meeting-workflow-v1.js?${VERSION}`))
    .then(() => import(`./work-workflow-v1.js?${VERSION}`))
    .then(() => import(`./workflow-backend-safe-v1.js?${VERSION}`))
    .then(() => import(`./communication-workspace-v1.js?${VERSION}`))
    .then(() => import(`./resources-workspace-v2.js?${VERSION}`))
    .then(() => import(`./approval-route-v1.js?${VERSION}`))
    .then(() => import(`./library-workspace-v1.js?${VERSION}`).catch((error) => {
      console.error('[2b2c] library workspace unavailable; native library view kept', error);
    }))
    .catch((error) => {
      console.error(error);
      renderStartupError('2b2c n’a pas pu démarrer','Une erreur locale a empêché le chargement de l’application. Rechargez la page.',error?.message || error);
    });
})();