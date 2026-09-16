# 4b4c2 — Idea Lab

Status: experimental / isolated laboratory

## Purpose
Build and test a novice-first workflow that turns a rough website/web-app idea into a clear, improved and presentable concept without modifying the canonical 4b4c Ideas / Project Definition lifecycle.

## Isolation rules
- Branch: `feature/4b4c2-idea-lab`
- Frontend namespace: `site/lab2/`
- API namespace: `/api/lab2/*`
- No Supabase migration through Slice 6.
- No write to existing 4b4c business tables.
- Existing Supabase session is reused only for authentication.
- Drafts and all current Lab decisions/results remain in browser `localStorage`.
- No production navigation entry.
- No coupling to canonical `Ideas`, Workspace V3, G0→G5, Project Definition or legacy Ideas business contracts.
- Lab endpoints require `LAB2_IDEA_STUDIO_ENABLED`, an explicit `LAB2_ALLOWED_USER_IDS` server-side allowlist, and their step-specific flag when applicable.

## Slice 1 — Capture
Frontend: `site/lab2/idea-studio.html`

The novice gives a provisional name, explains the site/web-app idea freely, and may add zero to three reference sites with the reason each reference matters.

## Slice 2 — AI understanding
Endpoint: `POST /api/lab2/understand`
Contract: `lab2-understanding-v1`

The AI only verifies understanding: faithful reformulation, problem, target users, main flow, explicit vs inferred provenance, uncertainties and at most one clarification question per call (maximum two clarification answers). No competitor analysis or feature improvement is allowed here.

## Slice 3 — Bounded references & competitor research
Endpoint: `POST /api/lab2/research`
Contract: `lab2-research-v1`
Frontend: `site/lab2/idea-research.html`

Budget per standard run:
- maximum 2 Web searches;
- maximum 3 selected competitors;
- maximum 6 fetched public pages;
- maximum 2 AI calls.

References supplied by the user remain distinct from discovered competitors. Public pages are fetched only through isolated `SOURCE_FETCH`. Source text is untrusted data. An `OBSERVED_PUBLIC` finding survives only when its support text actually exists in the fetched source. Visual design is not inferred from text-only pages.

## Slice 4 — Human-controlled improvements
Endpoint: `POST /api/lab2/improvements`
Contract: `lab2-improvements-v1`
Frontend: `site/lab2/idea-improvements.html`

The AI proposes at most 6 independent improvements in one call. Every proposal must be explicitly `ACCEPTED`, `REJECTED` or `MODIFIED`. Decisions remain local. Backend guarantee: `automatic_idea_mutation: false`.

## Slice 5 — Versioned living idea brief
Endpoint: `POST /api/lab2/brief`
Contract: `lab2-brief-v1`
Frontend: `site/lab2/idea-brief.html`

Purpose: produce the clear Version 1 that all later slices consume without replaying the whole conversation.

Hard rules:
- all Slice 4 proposals need a human decision before brief generation;
- rejected proposals are filtered server-side before the model prompt;
- only accepted proposals and user-modified wording are retained;
- no new features, targets, promises or differentiation may be invented;
- unresolved uncertainties remain open questions;
- retained improvements are returned separately from AI prose;
- unchanged Version 1 is cached locally.

The brief contains: concept, problem, target users, solution, core features, main flow, established differentiators, open questions and a short presentation pitch.

## Slice 6 — Workflows + provisional sitemap
Endpoint: `POST /api/lab2/structure`
Contract: `lab2-structure-v1`
Frontend: `site/lab2/idea-structure.html`

The model receives only the Version 1 brief. It proposes at most 4 human workflows and 20 pages, favoring the minimum architecture needed. Corporate pages are excluded unless required by the brief. The user can keep or remove every proposed page locally with no additional AI call. The sitemap is explicitly provisional and `human_page_review_required` remains true.

## Security and cost boundary
- no service-role key in browser or Lab endpoint;
- no `/rest/v1/` or business RPC access from Lab endpoints;
- no canonical Ideas / Project Definition API calls from Lab frontend;
- no automatic AI retries on quota/capacity failure;
- search/source/model calls are capped structurally;
- local caches avoid duplicate calls where implemented.

## Validation
Dedicated workflow: `.github/workflows/lab2-check.yml`

It runs only Lab syntax/contract/isolation checks and performs no deployment. Tests use mocked Workers AI, Brave Search and source-fetch responses, so the validation consumes zero real AI/search credits.

Validated artifacts:
- `scripts/test_lab2_understanding_v1.mjs`
- `scripts/test_lab2_research_v1.mjs`
- `scripts/test_lab2_improvements_v1.mjs`
- `scripts/test_lab2_brief_v1.mjs`
- `scripts/test_lab2_structure_v1.mjs`
- `scripts/lab2-isolation-check.mjs`

Latest observed GitHub Actions run `35160858123` completed successfully: syntax checks, zero-credit contract tests and isolation boundary all passed.

## Planned progression
- Slice 7: novice-friendly design direction.
- Slice 8: deterministic component-based mockups.
- Slice 9: Web presentation + PPTX + PDF.
- Later: collaboration/project workspace integration only after the Idea Lab proves useful.

## Source of truth
This folder documents only the 4b4c2 laboratory. It does not redefine or supersede canonical 4b4c documentation.
