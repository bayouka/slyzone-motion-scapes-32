# 4b4c — PROJECT DEFINITION REQUIREMENT REGISTRY — TECH / NFR / BUILD READY — V0.1

Date : 2026-09-13

Statut : **WORKING CANDIDATE — NON CANONIQUE / À RED-TEAMER**

Périmètre : D16→D20.

Objectif : transformer la définition produit en contraintes techniques, non-fonctionnelles et critères de vérification suffisamment précis pour rendre le dossier `READY_FOR_DEVELOPMENT` sans sur-spécifier les choix internes laissés aux développeurs.

---

# D16 — Technical Architecture, Platform, Environments & Operations

| ID | Type | Atom | Utilité | Acquisition/production | Criticité |
|---|---|---|---|---|---|
| D16.I01 | INFO | Existing technical environment | Réutilisation/contraintes | AUDIT/SRC | CONDITIONAL |
| D16.I02 | INFO | Forced platform/vendor | Constraint réelle | HUM/SRC | CONDITIONAL |
| D16.I03 | INFO | Hosting/domain ownership | Ops/handoff | HUM/SRC | REQUIRED web public avant build/release selon scope |
| D16.I04 | INFO | Maintenance capability | Évite architecture impossible à maintenir | HUM | CONDITIONAL |
| D16.A01 | ANALYSIS | Platform suitability | Vérifier fit produit/contraintes | architect | G7 REQUIRED |
| D16.A02 | ANALYSIS | Architecture complexity proportionality | Évite sur-engineering | architect/AI-H | G7 REQUIRED |
| D16.A03 | ANALYSIS | Operational risk | Détecte fragilité | architect | CONDITIONAL |
| D16.D01 | DECISION | Delivery approach | custom/no-code/CMS/hybrid | owner/architect | G7 REQUIRED |
| D16.D02 | DECISION | Core architecture decision | frontend/backend/rendering/data | architect | G7 REQUIRED selon projet |
| D16.D03 | DECISION | Hosting/deployment target | Conditionne env/release | owner/architect | G7 REQUIRED web |
| D16.D04 | DECISION | Delivery Profile selection | Charge règles Lovable/React/etc. | owner/architect | REQUIRED avant exécution |
| D16.S01 | SPEC | Frontend architecture constraints | Contrat, pas implémentation détaillée | architect | CONDITIONAL |
| D16.S02 | SPEC | Backend/service boundaries | Délimite responsabilités | architect | CONDITIONAL |
| D16.S03 | SPEC | Rendering/routing strategy | SPA/SSR/SSG/etc. si pertinent | architect | CONDITIONAL |
| D16.S04 | SPEC | Storage/database requirement | Données persistantes | D13/architect | CONDITIONAL |
| D16.S05 | SPEC | Environment model | dev/preview/staging/prod selon besoin | architect | REQUIRED projet non trivial |
| D16.S06 | SPEC | Configuration/env variable classes | Évite secrets implicites | architect/security | REQUIRED si config externe |
| D16.S07 | SPEC | Background/async processing need | Travaux longs | architect | CONDITIONAL |
| D16.S08 | SPEC | Caching/CDN requirement | Performance/availability | architect | CONDITIONAL |
| D16.S09 | SPEC | Backup/recovery requirement | Résilience data | architect/owner | CONDITIONAL |
| D16.S10 | SPEC | Maintenance/update responsibility | Exploitation | owner | REQUIRED si système maintenu |
| D16.S11 | SPEC | Implementation discretion boundaries | Ce que les développeurs peuvent choisir | architect/PM | G8 REQUIRED |
| D16.V01 | VERIFY | Architecture satisfies functional/data/NFR constraints | Fit global | architect/QA | G7 |
| D16.V02 | VERIFY | No product decision is hidden inside implementation discretion | Handoff quality | PM/architect | G8 |

---

# D17 — Security, Privacy, Legal & Compliance

| ID | Type | Atom | Utilité | Acquisition/production | Criticité |
|---|---|---|---|---|---|
| D17.I01 | INFO | Jurisdiction | Détermine obligations | D02/SRC/HUM | CONDITIONAL |
| D17.I02 | INFO | Personal data collected | Privacy scope | D12-D14 | REQUIRED si data |
| D17.I03 | INFO | Sensitive/special-category data | Niveau de risque | D13/HUM | CONDITIONAL→BLOCKING high-risk |
| D17.I04 | INFO | Tracking/cookies/third-party scripts | Consent/privacy | D14/D19 | CONDITIONAL |
| D17.I05 | INFO | Regulated claims/professional title | Compliance contenu | D10/HUM/EXPERT | CONDITIONAL |
| D17.I06 | INFO | External processors/providers | Privacy/security | D14 | CONDITIONAL |
| D17.A01 | ANALYSIS | Data/privacy classification | Détermine requirements | security/privacy | REQUIRED si data personnelle |
| D17.A02 | ANALYSIS | Threat/abuse surface assessment | Identifie risques réalistes | security/architect | REQUIRED si actions/data sensibles |
| D17.A03 | ANALYSIS | Compliance applicability | Évite checklist aveugle | EXPERT/WEB/security | CONDITIONAL |
| D17.D01 | DECISION | Authentication requirement | Nécessaire ou non | PM/security | CONDITIONAL |
| D17.D02 | DECISION | Consent/tracking policy | Source active | owner/privacy | CONDITIONAL |
| D17.S01 | SPEC | Access-control requirement | Qui peut accéder à quoi | D13/security | CONDITIONAL |
| D17.S02 | SPEC | Secret handling requirement | Server-side/config policy | security/architect | REQUIRED si secrets |
| D17.S03 | SPEC | Input validation / abuse protection | Spam/injection/unsafe input | security/tech | REQUIRED public forms/actions |
| D17.S04 | SPEC | Data minimization | Ne collecter que nécessaire | privacy/PM | REQUIRED personal data |
| D17.S05 | SPEC | Retention/deletion requirement | Cycle de vie | privacy/owner | CONDITIONAL |
| D17.S06 | SPEC | Cookie/tracker consent requirement | Compliance | privacy | CONDITIONAL |
| D17.S07 | SPEC | Legal/privacy pages requirement | Transparence | legal/privacy | CONDITIONAL→REQUIRED public commercial site selon juridiction |
| D17.S08 | SPEC | Form privacy notice requirement | Transparence collecte | privacy/content | REQUIRED personal-data forms |
| D17.S09 | SPEC | External-link/security header baseline | Web hardening | security/architect | CONDITIONAL |
| D17.S10 | SPEC | Expert review requirement | Cas juridiquement/techniquement sensibles | EXPERT | CONDITIONAL |
| D17.V01 | VERIFY | No sensitive flow lacks explicit security/privacy handling | Safety | security/QA | G8 |
| D17.V02 | VERIFY | Legal/compliance assumptions are labeled, not presented as expert advice | Integrity | CALC/QA | G8 |

---

# D18 — Accessibility, Performance, Reliability & Compatibility

| ID | Type | Atom | Utilité | Acquisition/production | Criticité |
|---|---|---|---|---|---|
| D18.I01 | INFO | Target devices/viewports | Responsive scope | analytics/context/PM | REQUIRED web |
| D18.I02 | INFO | Browser support expectations | Compatibility | owner/analytics | CONDITIONAL |
| D18.I03 | INFO | Accessibility context/obligation | Calibrer target | owner/legal/PM | REQUIRED target decision |
| D18.I04 | INFO | Performance sensitivity | Détecter besoin de budget | UX/SEO/business | CONDITIONAL |
| D18.I05 | INFO | Reliability/availability expectation | Criticité service | business/PM | CONDITIONAL |
| D18.D01 | DECISION | Accessibility target profile | Ex. WCAG target/subset applicable | owner/a11y | G7 REQUIRED public product |
| D18.D02 | DECISION | Browser/device support matrix | Source de vérité QA | owner/tech | G7 REQUIRED |
| D18.D03 | DECISION | Performance target/budget | Seulement si utile | owner/tech | CONDITIONAL |
| D18.S01 | SPEC | Keyboard/focus requirements | Accessibilité | a11y/UX | REQUIRED interactive web |
| D18.S02 | SPEC | Semantic/heading/label requirements | Accessibilité/SEO | a11y/content | REQUIRED |
| D18.S03 | SPEC | Contrast/text readability requirement | Lisibilité | design/a11y | REQUIRED |
| D18.S04 | SPEC | Image alt/media accessibility | Contenu accessible | content/a11y | REQUIRED media |
| D18.S05 | SPEC | Reduced-motion behavior | Motion accessible | UX/design | CONDITIONAL motion |
| D18.S06 | SPEC | Responsive behavior constraints | Mobile/tablet/desktop | UX | REQUIRED web |
| D18.S07 | SPEC | Safe-area/touch-target constraints | Mobile réel | UX/a11y | CONDITIONAL→REQUIRED mobile |
| D18.S08 | SPEC | Loading/performance requirements | Expérience | tech/UX | CONDITIONAL |
| D18.S09 | SPEC | Failure/degraded behavior | Robustesse | PM/tech | REQUIRED critic flows |
| D18.S10 | SPEC | Route refresh/back-forward/fallback | Web robustness | tech | REQUIRED SPA/SSR routing applicable |
| D18.S11 | SPEC | Availability/recovery expectations | Service continuity | owner/tech | CONDITIONAL |
| D18.V01 | VERIFY | Accessibility checks are testable | QA readiness | a11y/QA | G8 |
| D18.V02 | VERIFY | Responsive and browser matrix has explicit test coverage | QA | QA | G8 |
| D18.V03 | VERIFY | Performance expectations are observable, not adjectives | Avoid “fast” vagueness | tech/QA | G8 if active |

---

# D19 — Measurement, Analytics, Experimentation & Observability

| ID | Type | Atom | Utilité | Acquisition/production | Criticité |
|---|---|---|---|---|---|
| D19.I01 | INFO | Success measure from Idea | Relie build à outcome | D02 | REQUIRED conceptuellement |
| D19.I02 | INFO | Existing measurement stack | Réutilisation/constraint | D04/SRC | CONDITIONAL |
| D19.A01 | ANALYSIS | Measurement necessity | Évite tracking inutile | PM/data | REQUIRED decision de pertinence |
| D19.D01 | DECISION | Analytics/tracking scope | Source active | owner/PM/privacy | CONDITIONAL |
| D19.D02 | DECISION | Experimentation need | A/B ou non | owner/PM | CONDITIONAL |
| D19.S01 | SPEC | Primary conversion events | Mesure outcome | D08/PM | REQUIRED si analytics actif |
| D19.S02 | SPEC | Supporting events | Diagnostic utile | PM/data | CONDITIONAL |
| D19.S03 | SPEC | Event properties/data minimization | Privacy/qualité | data/privacy | CONDITIONAL |
| D19.S04 | SPEC | SEO measurement | Search Console/KPI | SEO | CONDITIONAL |
| D19.S05 | SPEC | Operational observability | Errors/forms/uptime | tech/owner | CONDITIONAL |
| D19.S06 | SPEC | Reporting ownership/cadence | Qui regarde quoi/quand | owner/PM | CONDITIONAL |
| D19.S07 | SPEC | Tracking consent dependency | Privacy | D17 | CONDITIONAL |
| D19.V01 | VERIFY | Every tracked event has purpose and owner | Évite collecte décorative | QA/privacy | G8 |
| D19.V02 | VERIFY | Success measures map back to Idea outcomes | Product coherence | CALC | G8 |

---

# D20 — QA, Acceptance, Delivery Constraints & Handoff

| ID | Type | Atom | Utilité | Acquisition/production | Criticité |
|---|---|---|---|---|---|
| D20.I01 | INFO | Critical user journeys | Prioriser QA | D08 | REQUIRED |
| D20.I02 | INFO | Critical integrations/data flows | Prioriser QA | D13-D14 | CONDITIONAL |
| D20.I03 | INFO | Delivery constraints | Env/vendor/tool constraints | D16 | REQUIRED selon project |
| D20.A01 | ANALYSIS | Requirement traceability audit | Détecte trous | CALC/QA | G8 REQUIRED |
| D20.A02 | ANALYSIS | Ambiguity audit | Ce que le dev devrait encore deviner | PM/architect/QA | G8 REQUIRED |
| D20.A03 | ANALYSIS | Risk-based test planning | Proportionner QA | QA | REQUIRED |
| D20.D01 | DECISION | Accepted unknowns for build | Assumer explicitement | owner/PM | G8 CONDITIONAL |
| D20.D02 | DECISION | Implementation discretion | Délimiter liberté dev | architect/PM | G8 REQUIRED |
| D20.D03 | DECISION | Ready-for-development approval | Gate finale | authorized owner(s) | G9 BLOCKING |
| D20.S01 | SPEC | Acceptance criteria per critical requirement | Testabilité | PM/QA | REQUIRED |
| D20.S02 | SPEC | Test types required | Unit/integration/e2e/manual/a11y/etc. | QA/tech | CONDITIONAL by risk |
| D20.S03 | SPEC | Test environments/data prerequisites | Exécutabilité | QA/tech | CONDITIONAL |
| D20.S04 | SPEC | Evidence expected | screenshot/log/test/result/etc. | QA | REQUIRED critical items |
| D20.S05 | SPEC | Regression-sensitive areas | Évite casse globale | QA/architect | CONDITIONAL |
| D20.S06 | SPEC | Source-of-truth manifest | Où se trouve chaque définition | PM/architect | G8 REQUIRED |
| D20.S07 | SPEC | Handoff package manifest | Ce qui est remis au dev | PM | G9 REQUIRED |
| D20.S08 | SPEC | Open-risk register | Risques non résolus | PM/QA | G8 REQUIRED si risques |
| D20.S09 | SPEC | Change-after-freeze policy | Gérer modifications | PM/governance | G8 REQUIRED |
| D20.S10 | SPEC | Delivery Profile constraints | Règles méthode de build | D16 overlay | REQUIRED si profile choisi |
| D20.V01 | VERIFY | Critical requirement has WHY→SPEC→VERIFY trace | Traçabilité | CALC/QA | G8 |
| D20.V02 | VERIFY | No blocker remains unowned/unaccepted | Readiness | CALC | G8 |
| D20.V03 | VERIFY | Developer does not need to invent structural product decision | North Star test | PM/architect/QA | G9 |
| D20.V04 | VERIFY | Handoff references current non-stale artifacts only | Version safety | CALC | G9 |

---

# G7 — TECHNICAL_NFR_DEFINITION_SUFFICIENT — candidate

Ready lorsque, selon applicability :
- data/content model/roles D13 défini ;
- integrations D14 définies ;
- architecture/platform D16 décidée au niveau nécessaire ;
- security/privacy/legal D17 traduits en exigences ;
- accessibility/performance/reliability D18 explicités ;
- measurement D19 défini si utile ;
- aucun probe critique de faisabilité ne reste caché.

# G8 — TRACEABILITY_AND_ACCEPTANCE_READY — candidate

Ready lorsque :
- requirements critiques reliés aux specs ;
- acceptance/verify définis ;
- risks et unknowns visibles ;
- owners/authority corrects ;
- source-of-truth manifest disponible ;
- implementation discretion explicitée ;
- artifacts stale/superseded exclus du handoff.

# G9 — READY_FOR_DEVELOPMENT — candidate

Le projet peut être `READY_FOR_DEVELOPMENT` lorsque :
1. G5, G6, G7, G8 applicables sont satisfaites ;
2. aucun blocker critique n'est masqué ;
3. toute inconnue restante est explicitement non bloquante/acceptée ;
4. le handoff est versionné ;
5. l'équipe de développement peut commencer sans reconstruire la stratégie, les règles produit, l'UX structurante, la data, les intégrations ou les critères qualité dans sa tête.

## Non-exigences
READY_FOR_DEVELOPMENT ne signifie pas nécessairement :
- tous les textes définitifs déjà rédigés ;
- toutes les images finales déjà disponibles ;
- chaque détail d'implémentation imposé ;
- backlog d'équipe ultra-détaillé ;
- code scaffold déjà créé ;
- infrastructure déjà provisionnée.

Ces éléments deviennent requis seulement lorsqu'ils conditionnent réellement la construction ou les tests.
