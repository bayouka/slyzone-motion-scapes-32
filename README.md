# 4b4c

Canonical source of the 4b4c collaborative workspace.

## Active architecture
- `site/` — complete V4.3 client application.
- `site/assets/live.js` — canonical live product behavior and data-driven screens.
- `site/assets/live.css` — canonical product visual system.
- `site/assets/home-polish.js` + `home-polish.css` — small, isolated Home UX/UI refinement layer. It must enhance the existing V4.3 Home only; it must not recreate the Home architecture or replace live product logic.
- `src/worker.js` — Cloudflare Worker / SPA fallback.
- `wrangler.jsonc` — stable Cloudflare Worker configuration (`4b4c`).
- Supabase backend — `wexfzhegiewhldkugtow`.

## Home product contract
The Home is a personal situation summary, not a generic widget dashboard. In under 10 seconds it should answer:
1. What is expected from me?
2. Who is waiting for me?
3. What changed since my last visit?
4. What is coming soon?
5. Which project should I resume, and why?

Keep the hierarchy: personal summary → `À traiter maintenant` → `Aujourd’hui & à venir` → `Depuis votre dernière visite` → `Reprendre un projet`.
Do not add weather, quotes, productivity scores, decorative charts, large team widgets, or other dashboard gadgets. Human context should come from the real requester, meeting participants, project participants, mentions and changes. Desktop actions such as validations/requests/actions should stay contextual (drawer); project navigation remains a full page. Mobile must reflow intentionally rather than compress desktop.

## Closed-pilot collaboration contract
Before inviting real collaborators, preserve these rules:
- workspace role, project visibility and project responsibility are separate concepts;
- a `selected` member must not see data from unselected projects;
- a guest/client only sees explicitly selected projects and shared content, and cannot write internal project content;
- invitations are bound to the invited email and carry explicit project mappings;
- Home time signals are personal: a meeting appears there only when the user created it or is an attendee;
- `À traiter` contains real intervention obligations, not synthetic notification noise;
- file versions are registered server-side so concurrent collaborators cannot allocate the same version number;
- validation targets must already have access to the project; a guest can validate only a shared deliverable;
- Messages V2 keeps Team / Project / Direct audiences and unread/mention semantics separate.

The current pilot supports structured meeting preparation/live/recap and an **external meeting link**. It does not claim built-in video conferencing or native screen sharing.

See `docs/PRE_COLLAB_AUDIT.md` for the readiness checklist.

## Branch policy
- `main` — stable validated source and production branch.
- `develop` — next validated version.
- feature branches — short-lived only.
- `backup/pre-cleanup-v43` — rollback snapshot of the historical experimental structure.

## Quality and deployment
Every push to `main` or `develop` runs the canonical CI checks. Production deployment is triggered from `main` and targets the stable Cloudflare Worker named `4b4c` when the repository Cloudflare credentials are configured. Production smoke tests verify the stable URL after deployment.

## Local commands
```bash
npm ci
npm run check
npm run dev
```

Historical Base64 bundles and patch chains are no longer part of the active source tree.
