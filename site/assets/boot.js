(() => {
  const config = window.__4B4C_CONFIG__ || {};
  const app = document.getElementById('app');
  const hasLiveConfig = config.mode === 'live' && config.supabaseUrl && config.supabasePublishableKey;

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]));
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
    renderStartupError(
      'Configuration 2b2c indisponible',
      'L’application ne peut pas se connecter à son espace de données pour le moment. Réessayez dans quelques instants.'
    );
    return;
  }

  window.__4B4C_LIVE_MODE__ = true;
  import('./auth-recovery-v1.js')
    .catch((error) => console.warn('Auth recovery enhancer unavailable', error))
    .then(() => {
      import('./home-polish.js').catch((error) => console.warn('Home polish enhancer unavailable', error));
      return import('./live.js');
    })
    .then(async () => {
      await import('./team-access-v1.js').catch((error) => console.warn('Team access enhancer unavailable', error));
      await import('./product-coherence-v1.js').catch((error) => console.warn('Product coherence enhancer unavailable', error));
      await import('./daily-work-v1.js').catch((error) => console.warn('Daily work enhancer unavailable', error));
      await import('./planning-clarity-v1.js').catch((error) => console.warn('Planning clarity enhancer unavailable', error));
    })
    .catch((error) => {
      console.error(error);
      renderStartupError(
        '2b2c n’a pas pu démarrer',
        'Une erreur locale a empêché le chargement de l’application. Rechargez la page.',
        error?.message || error
      );
    });
})();
