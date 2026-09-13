# 4b4c — CONTEXT OVERLAY CATALOG — V0.1

Date : 2026-09-13

Statut : **WORKING CANDIDATE — NON CANONIQUE**

But : activer seulement les requirements pertinents et augmenter/réduire leur criticité sans transformer D01→D22 en checklist universelle.

---

# 1. Principe

Un Context Overlay :
- est dérivé automatiquement quand possible ;
- peut être confirmé/corrigé ;
- modifie applicability/criticality/dependencies ;
- n’est pas un mode UX ;
- ne remplace pas un Blueprint.

---

# 2. Overlays Site vitrine candidats

## C01 `IS_REDESIGN`

**Détection** : existing URL/site/product exists.

**Active/renforce** : D04 audit, D11 migration, D16 existing runtime, D20 regression/migration checks.

**Questions humaines** : aucune sauf ambiguity sur ce qui doit être conservé.

## C02 `IS_LOCAL_BUSINESS`

**Détection** : zone de service/commerce local.

**Renforce** : D03 geography, D05 local competitors, D11 local SEO, D10 local trust/proof, D08 phone/map/contact journeys.

## C03 `IS_MULTILINGUAL`

**Active** :
- locales/source language ;
- translation ownership/workflow ;
- locale routing ;
- hreflang/canonical/indexation ;
- localized content/claims/legal ;
- localized media ;
- CMS locale model ;
- fallback language ;
- QA par locale.

**Human-only** : langues réellement visées/priorisées si non déductibles ; translation owner.

## C04 `HAS_CMS`

**Active** : D10 content operations, D13 content model, roles/workflow, preview/publish, migration/content QA, D16 platform fit.

## C05 `HAS_PERSONAL_DATA`

**Active** : D13 data lifecycle, D14 processor flows, D17 privacy/minimization/retention/notices, D20 data-flow tests.

## C06 `HAS_SENSITIVE_DATA`

**Renforce fortement** : D17 threat/privacy/expert review, D13 access controls, D16 storage/backups, D20 security acceptance.

## C07 `HAS_AUTH_OR_ROLES`

**Active** : authentication, session model, roles/permissions, account states, password/recovery/SSO if relevant, abuse protection, privacy, test personas.

## C08 `HAS_CRITICAL_INTEGRATION`

**Active** : D14 contracts/fallbacks, D16 resilience/async if needed, D17 security/privacy, D20 integration testing.

## C09 `SEO_MIGRATION_RISK`

**Triggers** : valuable indexed URLs, domain/path change, strong rankings/backlinks.

**Renforce** : URL inventory, redirect map, canonical/sitemap/robots, crawl validation, Search Console, regression evidence.

## C10 `DOMAIN_MIGRATION`

**Active** : DNS/domain ownership, HTTPS, redirects, canonical, email continuity, analytics/Search Console, rollback/recovery considerations.

## C11 `HAS_TEAM_DECISION`

**Active** : D01 owner/method/conflicts, D22 deck/review/decision record, formal approval.

## C12 `NEEDS_PRESENTATION`

**Active** : D22 Decision Package. Mode choisi selon audience/decision.

## C13 `NEEDS_BUSINESS_CASE`

**Active** : D21 baseline/scenarios/sensitivity/cost/ROI only if decision-useful.

## C14 `NEEDS_CONCEPT_VALIDATION`

**Active** : Z4b validation planning/evidence.

## C15 `HAS_REGULATORY_CONSTRAINT`

**Active** : D17 applicability, regulated claims, expert escalation; peut aussi renforcer D10 proof/content et D18 accessibility.

## C16 `BRAND_IN_TRANSITION`

**Active** :
- brand owner/source ;
- current vs future identity distinction ;
- provisional visual territory ;
- dependency between branding decision and D15 ;
- explicit promotion condition.

**Protection** : ne pas geler un design system sur une marque encore non décidée.

## C17 `BUDGET_OR_TIME_CONSTRAINED`

**Renforce** : D06 simplification, D07 scope tiers/non-goals, Z4 Prefiguration Budget, D16 delivery fit, D21 cost/timeline scenarios.

## C18 `HIGH_MEDIA_OR_MOTION`

**Active** : media rights, performance budgets, reduced motion, mobile behavior, hosting/CDN implications.

## C19 `HIGH_TRAFFIC_OR_BUSINESS_CRITICAL`

**Renforce** : performance/reliability, rollback, monitoring, integration failure, regression testing, backup/recovery.

## C20 `EXTERNAL_AGENCY_OR_VENDOR_HANDOFF`

**Renforce** : D20 source-of-truth manifest, handoff package, acceptance criteria, ownership/access inventories, implementation discretion boundaries.

---

# 3. Overlay composition

Plusieurs overlays peuvent coexister.

Exemple :

`IS_REDESIGN + IS_MULTILINGUAL + SEO_MIGRATION_RISK + HAS_CMS`

→ D11 devient fortement structurant ; D10/D13/D16/D20 gagnent des requirements spécifiques.

Le moteur doit fusionner applicability/criticality sans dupliquer les atoms.

---

# 4. Overlay detection policy

Ordre :
1. RAW/MEM ;
2. source/audit ;
3. connector/web ;
4. derivation ;
5. hypothesis ;
6. humain seulement si l’activation change réellement le travail et reste ambiguë.

Exemple : si le site contient plusieurs locales et `hreflang`, ne pas demander “votre site est-il multilingue ?”.

---

# 5. Change impact

Activation/désactivation d’un overlay :
- recalcule applicability ;
- marque descendants impactés `REVIEW_REQUIRED/STALE` ;
- ne supprime jamais silencieusement evidence/decisions historiques ;
- peut ouvrir de nouveaux Requirements sans rouvrir tout le dossier.
