const SECURITY_HEADERS = {
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'x-frame-options': 'DENY',
  'permissions-policy': 'camera=(self), microphone=(self), display-capture=(self), fullscreen=(self), picture-in-picture=(self)',
};

function withHeaders(response, extra = {}) {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) headers.set(key, value);
  for (const [key, value] of Object.entries(extra)) headers.set(key, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return withHeaders(new Response('Method Not Allowed', { status: 405 }), { allow: 'GET, HEAD' });
    }

    if (url.pathname === '/health') {
      return withHeaders(
        Response.json({ ok: true, app: '4b4c', backend: 'supabase', version: 'v4.5.3-audit-hygiene' }),
        { 'cache-control': 'no-store' },
      );
    }

    const isRoot = url.pathname === '/';
    const assetPath = isRoot ? '/index.html' : url.pathname;
    const assetRequest = new Request(new URL(assetPath, url.origin), request);
    let response = await env.ASSETS.fetch(assetRequest);

    const isNavigation = request.headers.get('sec-fetch-mode') === 'navigate';
    if (response.status === 404 && isNavigation) {
      response = await env.ASSETS.fetch(new Request(new URL('/index.html', url.origin), request));
    }

    // Never let the SPA shell become stale. Versioned JS/CSS assets carry their own cache-busters.
    const servesHtml = isRoot || isNavigation || assetPath === '/index.html';
    return withHeaders(response, servesHtml ? { 'cache-control': 'no-store' } : {});
  },
};
