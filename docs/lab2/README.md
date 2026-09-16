# 4b4c2 — Idea Lab

Status: experimental / isolated laboratory

## Purpose
Build and test a novice-first workflow that turns a rough website idea into a clear, improved and presentable concept without modifying the canonical 4b4c Ideas / Project Definition lifecycle.

## Isolation rules
- Branch: `feature/4b4c2-idea-lab`
- Frontend namespace: `site/lab2/`
- No edits to canonical `Ideas`, Workspace V3, G0→G5, Project Definition or legacy Ideas modules in the first slices.
- No Supabase migrations in Slice 1.
- No writes to existing 4b4c business tables.
- Slice 1 persists only in browser `localStorage`.
- No production navigation entry yet.
- No AI provider call yet: the first slice validates UX and data shape before adding model cost or provider coupling.

## Slice 1 scope
1. Give an idea a provisional name.
2. Explain the website idea in free text.
3. Add zero to three website references and explain what is interesting about each.
4. Save a local draft.
5. Enter a distinct “understanding” step showing the target structure the AI will eventually produce.
6. Let the user confirm, go back and refine, or reset the draft.

## Explicitly out of scope for Slice 1
- Supabase persistence
- competitor web research
- LLM calls
- sitemap generation
- design direction
- mockup engine
- PowerPoint/PDF generation
- collaboration/comments
- connection to canonical Ideas or Project Definition

## Planned progression
- Slice 2: real AI understanding + one-question-at-a-time clarification, with strict token/cost budget.
- Slice 3: bounded competitor/reference research with observed/inferred/unknown provenance.
- Slice 4: improvement proposals accepted/refused/modified individually.
- Slice 5: versioned living idea brief.
- Slice 6: workflow + sitemap.
- Slice 7: design direction.
- Slice 8: deterministic component-based mockups.
- Slice 9: web presentation + PPTX + PDF.

## Source of truth
This folder documents only the 4b4c2 laboratory. It does not redefine or supersede canonical 4b4c documentation.
