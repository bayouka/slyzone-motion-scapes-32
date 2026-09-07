(() => {
  const params = new URLSearchParams(location.search);
  const config = window.__4B4C_CONFIG__ || {};
  const hasLiveConfig = config.mode === 'live' && config.supabaseUrl && config.supabasePublishableKey;

  if (hasLiveConfig) {
    window.__4B4C_LIVE_MODE__ = true;
    import('./home-polish.js').catch((error) => console.warn('Home polish enhancer unavailable', error));
    import('./live.js').catch((error) => {
      console.error(error);
      document.getElementById('app').innerHTML = `
        <main style="max-width:720px;margin:64px auto;padding:24px;font:16px/1.5 system-ui;color:#172033">
          <h1>2b2c n’a pas pu démarrer</h1>
          <p>Le client live a rencontré une erreur locale. Rechargez la page. Si le problème persiste, utilisez le mode diagnostic.</p>
          <details><summary>Détail technique</summary><pre style="white-space:pre-wrap">${String(error?.message || error).replace(/[&<>]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]))}</pre></details>
        </main>`;
    });
    return;
  }

  const script = document.createElement('script');
  script.src = 'assets/app.js';
  document.body.appendChild(script);
})();
