# 4b4c

Canonical source of the 4b4c collaborative workspace.

## Active architecture
- `site/` — complete V4.3 client application.
- `src/worker.js` — Cloudflare Worker / SPA fallback.
- `wrangler.jsonc` — stable Cloudflare Worker configuration (`4b4c`).
- Supabase backend — `wexfzhegiewhldkugtow`.

## Branch policy
- `main` — stable validated source and production branch.
- `develop` — next validated version.
- feature branches — short-lived only.
- `backup/pre-cleanup-v43` — rollback snapshot of the historical experimental structure.

## Quality and deployment
Every push to `main` or `develop` runs the canonical CI checks. Production deployment is triggered from `main` and targets the stable Cloudflare Worker named `4b4c` when the repository Cloudflare credentials are configured.

## Local commands
```bash
npm ci
npm run check
npm run dev
```

Historical Base64 bundles and patch chains are no longer part of the active source tree.
