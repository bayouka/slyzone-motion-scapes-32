export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method Not Allowed', { status: 405 });
    if (url.pathname === '/health') return Response.json({ ok: true, app: '4b4c', backend: 'supabase', version: 'v4.4.12-delivery-cycle' }, { headers: { 'cache-control': 'no-store' } });
    const assetRequest = new Request(new URL(url.pathname === '/' ? '/index.html' : url.pathname, url.origin), request);
    let response = await env.ASSETS.fetch(assetRequest);
    if (response.status === 404 && request.headers.get('sec-fetch-mode') === 'navigate') response = await env.ASSETS.fetch(new Request(new URL('/index.html', url.origin), request));
    return response;
  }
};