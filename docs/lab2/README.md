# 4b4c2 — Idea Lab

Status: experimental / isolated laboratory

## Purpose
Build and test a novice-first workflow that turns a rough website idea into a clear, improved and presentable concept without modifying the canonical 4b4c Ideas / Project Definition lifecycle.

## Isolation rules
- Branch: `feature/4b4c2-idea-lab`
- Frontend namespace: `site/lab2/`
- API namespace: `/api/lab2/*`
- No edits to canonical `Ideas`, Workspace V3, G0→G5, Project Definition or legacy Ideas business contracts.
- No Supabase migrations in Slice 1 or Slice 2.
- No writes to existing 4b4c business tables.
- Draft, clarification history and AI result cache remain in browser `localStorage`.
- The existing Supabase session is reused only to authenticate calls to the Lab API.
- No production navigation entry yet.
- The Lab AI endpoint is disabled unless the server-side flag `LAB2_IDEA_STUDIO_ENABLED` is explicitly enabled.

## Slice 1 — capture
1. Give an idea a provisional name.
2. Explain the website idea in free text.
3. Add zero to three website references and explain what is interesting about each.
4. Save a local draft.
5. Enter a distinct understanding step.
6. Let the user go back, refine or reset the draft.

## Slice 2 — real AI understanding
Endpoint: `POST /api/lab2/understand`

Purpose: verify that the model understood the user's idea before competitor analysis or improvement.

The model must return a structured `lab2-understanding-v1` contract containing:
- one-line faithful reformulation;
- problem/need understood;
- target users, each tagged `EXPLICIT` or `INFERRED`;
- main workflow, each step tagged `EXPLICIT` or `INFERRED`;
- explicit points from the user's explanation;
- remaining uncertainties;
- comprehension confidence (`HIGH`, `MEDIUM`, `LOW`);
- at most one clarification question per call.

Hard rules:
- no feature improvement in Slice 2;
- no competitor analysis in Slice 2;
- no claim that a reference site was visited;
- inferred information must remain visibly inferred;
- maximum two clarification answers per idea before unresolved points remain explicit uncertainties;
- same unchanged draft reuses the browser-local AI result instead of paying for a duplicate call;
- choosing “Je ne sais pas encore” keeps the point open without making another model call.

## AI provider and cost instrumentation
Current Lab model: `@cf/google/gemma-4-26b-a4b-it` through the already-available Cloudflare Workers AI binding.

Pricing snapshot used only to estimate consumption in the Lab UI (2026-08-28):
- 9,091 neurons / million input tokens;
- 27,273 neurons / million output tokens;
- 10,000 free Workers AI neurons per day at the current Free allocation.

The endpoint returns provider token usage when available and computes:
- prompt tokens;
- completion tokens;
- estimated neurons;
- estimated percentage of the daily free allocation;
- indicative paid-equivalent USD value.

These values are instrumentation, not billing authority. The Cloudflare dashboard remains authoritative for actual aggregate neuron consumption.

## Slice 2 security boundary
- endpoint returns `404 LAB_DISABLED` unless `LAB2_IDEA_STUDIO_ENABLED` is explicitly enabled;
- endpoint requires an authenticated existing 4b4c Supabase JWT;
- no service-role key is exposed to the browser;
- no database write is performed;
- request size, idea length, reference count and clarification count are hard-capped;
- AI output is requested through a strict JSON schema and normalized again server-side;
- quota/capacity failures do not trigger automatic retries.

## Tests
`scripts/test_lab2_understanding_v1.mjs` exercises the endpoint with a fake Workers AI response, so CI validation consumes zero AI credits. It verifies:
- successful contract normalization;
- usage/neuron calculation;
- authentication guard;
- feature-flag guard;
- clarification hard cap.

## Explicitly out of scope through Slice 2
- Supabase persistence of Lab ideas
- competitor web research
- sitemap generation
- design direction
- mockup engine
- PowerPoint/PDF generation
- collaboration/comments
- connection to canonical Ideas or Project Definition

## Planned progression
- Slice 3: bounded competitor/reference research with observed/inferred/unknown provenance.
- Slice 4: improvement proposals accepted/refused/modified individually.
- Slice 5: versioned living idea brief.
- Slice 6: workflow + sitemap.
- Slice 7: design direction.
- Slice 8: deterministic component-based mockups.
- Slice 9: web presentation + PPTX + PDF.

## Source of truth
This folder documents only the 4b4c2 laboratory. It does not redefine or supersede canonical 4b4c documentation.