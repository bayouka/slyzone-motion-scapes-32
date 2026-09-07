# 4b4c

Canonical source of the 4b4c collaborative workspace.

## Active architecture
- `site/` — complete V4.3 client application.
- `src/worker.js` — Cloudflare Worker / SPA fallback.
- `wrangler.jsonc` — stable Cloudflare Worker configuration (`4b4c`).
- Supabase backend — `wexfzhegiewhldkugtow`.

## Branch policy
- `main` — stable validated source.
- `develop` — next validated version.
- feature branches — short-lived only.
- `backup/pre-cleanup-v43` — rollback snapshot of the historical experimental structure.

## Local commands
```bash
npm ci
npm run check
npm run dev
```

Historical Base64 bundles and patch chains are no longer part of the active source tree.
