export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Serve exact static assets first.
    const assetResponse = await env.ASSETS.fetch(request);
    if (assetResponse.status !== 404) return assetResponse;

    // Keep real missing assets as 404; only browser/app navigation falls back to the SPA shell.
    const acceptsHtml = (request.headers.get('accept') || '').includes('text/html');
    const isNavigation = request.headers.get('sec-fetch-mode') === 'navigate';
    const looksLikeRoute = url.pathname === '/' || !url.pathname.split('/').pop()?.includes('.');

    if ((request.method !== 'GET' && request.method !== 'HEAD') || (!acceptsHtml && !isNavigation && !looksLikeRoute)) {
      return assetResponse;
    }

    const indexUrl = new URL('/index.html', url);
    const indexRequest = new Request(indexUrl, {
      method: request.method,
      headers: request.headers,
    });
    return env.ASSETS.fetch(indexRequest);
  },
};
