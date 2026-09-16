# 4b4c2 — Idea Lab

Status: experimental / isolated laboratory

## Purpose
Build and test a novice-first workflow that turns a rough website/web-app idea into a clear, improved and presentable concept without modifying the canonical 4b4c Ideas / Project Definition lifecycle.

## Isolation rules
- Branch: `feature/4b4c2-idea-lab`
- Frontend namespace: `site/lab2/`
- API namespace: `/api/lab2/*`
- No Supabase migration through Slice 5.
- No write to existing 4b4c business tables.
- Existing Supabase session is reused only for authentication.
- Drafts, research cache, improvement decisions and the current brief remain in browser `localStorage`.
- No production navigation entry.
- No coupling to canonical `Ideas`, Workspace V3, G0→G5, Project Definition or legacy Ideas business contracts.
- Lab endpoints require `LAB2_IDEA_STUDIO_ENABLED`, an explicit `LAB2_ALLOWED_USER_IDS` server-side allowlist, and their step-specific flag when applicable.

## Slice 1 — Capture
- provisional name;
- free-form website/web-app explanation;
- zero to three reference sites;
- reason for each reference;
- local draft persistence.

Frontend: `site/lab2/idea-studio.html`.

## Slice 2 — AI understanding
Endpoint: `POST /api/lab2/understand`

Contract: `lab2-understanding-v1`.

The AI only verifies understanding:
- faithful one-line reformulation;
- problem/need;
- target users;
- main flow;
- explicit vs inferred provenance;
- uncertainties;
- at most one clarification question per call, maximum two clarification answers.

No competitor analysis or feature improvement is allowed in this step. Unchanged drafts reuse the local cached result.

## Slice 3 — Bounded references & competitor research
Endpoint: `POST /api/lab2/research`

Contract: `lab2-research-v1`.

Budgets per standard run:
- maximum 2 Web searches;
- maximum 3 selected competitors;
- maximum 6 fetched public pages;
- maximum 2 AI calls.

Rules:
- references provided by the user remain distinct from discovered competitors;
- optional competitor discovery uses a Lab-only server-side Brave Search key;
- public pages are fetched only through isolated `SOURCE_FETCH`;
- source text is untrusted data, never model instruction;
- an `OBSERVED_PUBLIC` finding survives only when its short support text exists in the fetched source;
- visual design is not inferred from text-only pages;
- research does not mutate the idea.

Frontend: `site/lab2/idea-research.html`.

## Slice 4 — Human-controlled improvements
Endpoint: `POST /api/lab2/improvements`

Contract: `lab2-improvements-v1`.

The AI proposes at most 6 independent improvements in one call. Types currently supported:
- functionality;
- workflow;
- navigation;
- trust;
- simplification;
- differentiation.

Every proposal can be `ACCEPTED`, `REJECTED` or `MODIFIED`. Decisions are local. Backend guarantee: `automatic_idea_mutation: false`.

Frontend: `site/lab2/idea-improvements.html`.

## Slice 5 — Versioned living idea brief
Endpoint: `POST /api/lab2/brief`

Contract: `lab2-brief-v1`.

Purpose: produce the clear Version 1 that later slices can consume without replaying the entire conversation.

Hard rules:
- if Slice 4 contains proposals, every proposal must have a human decision before brief generation;
- rejected proposals are filtered server-side before the model prompt is built;
- only accepted proposals and user-modified wording are sent as retained improvements;
- the brief may not invent new features, users, promises or differentiation;
- unresolved uncertainties remain open questions;
- the response includes the deterministic list of retained improvements separately from the AI prose;
- unchanged Version 1 is cached locally to avoid duplicate calls.

Brief sections:
- one-line concept;
- problem;
- target users;
- solution;
- core features;
- main flow;
- established differentiators;
- open questions;
- short presentation pitch.

Frontend: `site/lab2/idea-brief.html`.

## Security and cost boundary
- no service-role key in browser or Lab endpoint;
- no `/rest/v1/` or RPC business access from Lab endpoints;
- no canonical Ideas / Project Definition API calls from Lab frontend;
- no automatic AI retries on quota/capacity failure;
- search and source counts are capped;
- AI calls are structurally bounded by each Slice;
- identical local results are reused where implemented.

## Validation artifacts
The repo contains zero-credit mocked tests:
- `scripts/test_lab2_understanding_v1.mjs`;
- `scripts/test_lab2_research_v1.mjs`;
- `scripts/test_lab2_improvements_v1.mjs`;
- `scripts/test_lab2_brief_v1.mjs`.

`scripts/lab2-isolation-check.mjs` fails if Lab code gains prohibited service-role/direct DB/canonical business coupling. All Lab syntax/contract/isolation checks are placed at the beginning of `npm run check`.

Current limitation: these executable checks have not yet been run in this assistant environment because the local runner cannot resolve GitHub to clone the branch and no GitHub workflow is currently exposed for this PR. The branch is therefore not test-certified yet.

## Planned progression
- Slice 6: derive simple user workflows + provisional sitemap from the Version 1 brief.
- Slice 7: novice-friendly design direction.
- Slice 8: deterministic component-based mockups.
- Slice 9: Web presentation + PPTX + PDF.
- Later: collaboration/project workspace integration only after the Idea Lab proves useful.

## Source of truth
This folder documents only the 4b4c2 laboratory. It does not redefine or supersede canonical 4b4c documentation.
