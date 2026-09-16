# 4b4c2 — Idea Lab

Status: experimental / isolated laboratory

## Purpose
Build and test a novice-first workflow that turns a rough website/web-app idea into a clear, improved, structured, visualized and presentable concept without modifying the canonical 4b4c Ideas / Project Definition lifecycle.

## Isolation rules
- Branch: `feature/4b4c2-idea-lab`
- Frontend namespace: `site/lab2/`
- API namespace: `/api/lab2/*`
- No Supabase migration through Slice 9.
- No write to existing 4b4c business tables.
- Existing Supabase is reused only for authentication.
- Current Lab state remains in browser `localStorage`.
- No production navigation entry.
- No coupling to canonical `Ideas`, Workspace V3, G0→G5, Project Definition or legacy Ideas business contracts.
- Lab AI endpoints require an explicit server-side `LAB2_ALLOWED_USER_IDS` allowlist and per-slice feature flags.

## Implemented workflow — Slices 1–9
1. Capture: provisional name, free explanation and optional references.
2. Understanding: structured faithful AI reformulation with bounded clarification.
3. Research: bounded public reference/competitor analysis with evidence validation.
4. Improvements: max six independent proposals with human Accept / Reject / Modify decisions.
5. Version 1 brief: only accepted/modified decisions are retained; rejected proposals are removed before the model prompt.
6. Workflows + sitemap: minimal provisional architecture generated only from Version 1; pages are kept/removed locally.
7. Design direction: novice preferences produce three options from a controlled deterministic catalog; human chooses one.
8. Mockups: AI outputs only page/block specifications from a closed component catalog; browser renders actual HTML/CSS with the chosen design tokens.
9. Presentation: Web deck, printable PDF and editable deterministic `.pptx` built from the local project state with zero additional AI call.

## Cost boundaries
- Understanding: bounded clarification and local caching.
- Research: max 2 Web searches, 3 selected competitors, 6 public pages, 2 AI calls.
- Improvements: max 1 AI call / 6 proposals.
- Brief: max 1 AI call.
- Structure: max 1 AI call / 4 workflows / 20 pages.
- Design: max 1 AI call / 3 directions.
- Mockups: max 1 AI call / 6 pages / 7 blocks per page.
- Presentation Web/PDF/PPTX: 0 AI calls.
- No automatic retries on quota/capacity failure.

## Human control and provenance
- User references remain distinct from discovered competitors.
- `OBSERVED_PUBLIC` findings require actual support text in fetched public content.
- Rejected proposals never reach the Version 1 model prompt.
- Modified proposals use the user's wording.
- Sitemap keep/remove actions do not call AI.
- Visual direction selection is explicitly human.
- No automatic idea/project mutation exists.

## Deterministic visuals
The design model chooses only catalog IDs. The server resolves palette, typography, shape, density, imagery and motion to deterministic values. The mockup model may only select from the approved component catalog and may not generate HTML, CSS, JavaScript or UI images. The browser renderer applies the chosen resolved tokens.

The `.pptx` export uses PptxGenJS `4.0.1` in the browser and rebuilds the concept/story and principal mockups as editable PowerPoint text and shapes instead of flattened AI images.

## Live isolated preview
Worker: `4b4c2-idea-lab-preview`

URL: `https://4b4c2-idea-lab-preview.bayoukadesbois.workers.dev`

Dedicated entrypoint: `src/lab2-preview-worker.js`.

Preview hard boundary:
- exposes only `/health`, `/api/lab2/*` and static `/lab2/*`;
- does not import canonical `worker.js`;
- uploads only `site/lab2/` assets;
- smoke test requires `/index.html` to return `404`;
- exposes no canonical 4b4c business API;
- has no database write surface;
- reuses the production Supabase project only through Auth;
- has Workers AI and isolated `4b4c-source-fetch` bindings.

Latest successful smoke state:
- `isolated: true`
- `production_business_api_exposed: false`
- `database_write_surface: false`
- `ai_configured: true`
- `source_fetch_configured: true`
- `competitor_search_configured: false`
- `access_allowlist_configured: false`

The last two `false` values are intentional fail-closed states. Without `LAB2_ALLOWED_USER_IDS`, an authenticated user can inspect/test the capture UI but AI endpoints refuse execution. The login page lets the authenticated user copy their own technical ID locally so it can be placed privately in the GitHub Actions secret without publishing it in chat. Automatic Brave competitor discovery remains optional until `LAB2_BRAVE_SEARCH_API_KEY` is configured.

## Validation
Dedicated zero-credit CI: `.github/workflows/lab2-check.yml`.

Contract tests cover understanding, research, improvements, brief, structure, design, mockups, presentation and the cross-slice isolation boundary. The latest Lab CI run and isolated preview deployment both complete successfully.

The preview deployment workflow also validates Lab contracts before deployment, uploads Lab-only assets, deploys a distinct Cloudflare Worker and smoke-tests the isolation contract.

## Intentionally still not done
- no Lab database persistence;
- no merge into `main`;
- no production navigation entry;
- no connection to canonical 4b4c Ideas/Project Definition;
- no collaboration/project workspace integration;
- no real end-to-end AI consumption measurement until a private test account is allowlisted;
- no automatic competitor discovery until a private Brave API key is configured.

## Source of truth
This folder documents only the 4b4c2 laboratory. It does not redefine or supersede canonical 4b4c documentation.
