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
5. Version 1 definition: deterministic consolidation; only accepted/modified human decisions are retained and rejected proposals are excluded from downstream project truth.
6. Feasibility: deterministic capability analysis plus explicit resolution of blocking feasibility decisions before experience architecture.
7. Workflows + sitemap: minimal provisional architecture generated from the canonical definition plus confirmed feasibility; pages are kept/removed locally.
8. Design + mockups: novice preferences produce three catalog-bounded visual directions; the human selects one; AI outputs page/block specifications from a closed component catalog and the browser renders deterministic HTML/CSS.
9. Presentation: one adaptive AI planning call may choose the narrative/order; the Web deck, printable PDF and editable deterministic `.pptx` are then built from validated local project state with zero additional AI call.

## Cost boundaries
- Understanding: bounded clarification, max two clarification turns, with local caching in the UI.
- Research: max 2 Web searches, 3 selected competitors, 6 public pages, 2 AI calls.
- Improvements: max 1 AI call / 6 proposals.
- Version 1 definition: 0 AI calls; deterministic human-decision consolidation.
- Feasibility: 0 AI calls; deterministic capability analysis.
- Structure: max 1 AI call / 4 workflows / 20 pages.
- Design: max 1 AI call / 3 directions.
- Mockups: max 1 AI call / 6 pages / 7 blocks per page.
- Presentation planner: max 1 AI call / 7–15 slide narrative plan.
- Presentation Web/PDF/PPTX rendering/export: 0 additional AI calls.
- No automatic retries on quota/capacity failure.

## Human control and provenance
- User references remain distinct from discovered competitors.
- `OBSERVED_PUBLIC` findings require actual support text in fetched public content.
- Rejected proposals never become project truth.
- Modified proposals use the user's wording.
- Blocking feasibility decisions must be explicitly resolved before structure.
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
- has Workers AI and isolated `4b4c-source-fetch` bindings;
- deployment fails closed if `LAB2_ALLOWED_USER_IDS` is absent;
- competitor discovery uses the bounded provider strategy declared by the preview health contract (`BRAVE_THEN_TAVILY_THEN_TAVILY_KEYLESS`), with private provider keys used when available.

The login page lets an authenticated test user copy their own technical ID locally so it can be placed privately in the GitHub Actions allowlist secret without publishing it in chat or source control.

## Validation
Dedicated zero-credit CI: `.github/workflows/lab2-check.yml`.

Contract tests cover understanding, adaptive research profiles, research, improvements, deterministic definition, deterministic feasibility, feasibility-dependent structure, cross-archetype sparse inputs, design, mockups, presentation planning, presentation rendering and the cross-slice isolation boundary.

Manual live E2E harness: `scripts/lab2-live-e2e.mjs`.

Manual workflow: `.github/workflows/lab2-live-e2e.yml`.

The live workflow is intentionally never triggered on push or pull request. It requires:
- an explicit `workflow_dispatch` run;
- one selected archetype (`service`, `saas` or `marketplace`);
- explicit confirmation that live Workers AI/search calls will occur;
- a private GitHub Actions secret `LAB2_E2E_BEARER_TOKEN` containing the Supabase session token of an already allowlisted test account.

Each live run is bounded to one archetype, performs no automatic retry, never prints the bearer token, and produces a seven-day JSON artifact containing stage status, reported token usage and sanitized project-quality summaries. Human review and design selection inside this automation are labelled synthetic E2E fixtures; they are not presented as real user choices.

The preview deployment workflow validates Lab contracts before deployment, uploads Lab-only assets, deploys a distinct Cloudflare Worker and smoke-tests the isolation contract.

## Intentionally still not done
- no Lab database persistence;
- no merge into `main`;
- no production navigation entry;
- no connection to canonical 4b4c Ideas/Project Definition;
- no collaboration/project workspace integration;
- no claim that live multi-archetype E2E quality is validated until the three manual authenticated runs have actually completed and their reports have been reviewed;
- no automatic live E2E execution or automatic paid/capacity retry.

## Source of truth
This folder documents only the 4b4c2 laboratory. It does not redefine or supersede canonical 4b4c documentation.
