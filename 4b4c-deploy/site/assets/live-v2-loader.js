(async () => {
  try {
    const urls = ['assets/live-v2-part-00.txt','assets/live-v2-part-01.txt','assets/live-v2-part-02.txt','assets/live-v2-part-03.txt','assets/live-v2-part-04.txt','assets/live-v2-part-05.txt','assets/live-v2-part-06.txt','assets/live-v2-part-07.txt','assets/live-v2-part-08.txt','assets/live-v2-part-09.txt','assets/live-v2-part-10.txt','assets/live-v2-part-11.txt'];
    const parts = await Promise.all(urls.map(async (url) => {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Asset ${url}: HTTP ${response.status}`);
      return response.text();
    }));
    let source = parts.join('');
    source = source.replace(
      "import { SupabaseBrowserClient, ApiError } from './supabase-client.js';",
      "const { SupabaseBrowserClient, ApiError } = await import(new URL('assets/supabase-client.js', location.href).href);"
    );
    const moduleUrl = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
    try { await import(moduleUrl); } finally { URL.revokeObjectURL(moduleUrl); }
  } catch (error) {
    console.error(error);
    const detail = String(error?.message || error).replace(/[&<>]/g, (m) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m]));
    document.getElementById('app').innerHTML = `<main style="max-width:720px;margin:64px auto;padding:24px;font:16px/1.5 system-ui;color:#172033"><h1>4b4c n’a pas pu démarrer</h1><p>Une ressource du pilote n’a pas pu être chargée.</p><details><summary>Détail technique</summary><pre style="white-space:pre-wrap">${detail}</pre></details></main>`;
  }
})();
