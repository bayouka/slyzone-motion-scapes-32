# 4b4c — PROJECT DEFINITION REFERENCE ARCHITECTURE — V0.2

Date : 2026-09-13

Statut : **CANDIDATE D’ARCHITECTURE DOCUMENTAIRE — NON CANONIQUE / À VALIDER AVANT REMPLISSAGE EXHAUSTIF**

Supersède comme candidat : `PROJECT_DEFINITION_REFERENCE_ARCHITECTURE_V0_1.md`.

Intègre le red-team `PROJECT_DEFINITION_REFERENCE_ARCHITECTURE_RED_TEAM_20260913.md`.

---

# 1. North Star

Le référentiel doit permettre à 4b4c de transformer une idée brute en un dossier tel que :

> **Quand le dossier est `READY_FOR_DEVELOPMENT`, l’équipe de développement peut construire le bon produit sans devoir inventer une décision structurante qui aurait dû être prise avant elle.**

Le but n’est pas zéro liberté technique.

Le but est zéro **ambiguïté structurante non assumée**.

Le développeur peut conserver une `IMPLEMENTATION_DISCRETION` sur les choix internes qui ne changent pas :

- la promesse ;
- le comportement utilisateur ;
- le scope ;
- les données ;
- les règles métier ;
- les contrats d’intégration ;
- les contraintes UX/UI ;
- les NFR ;
- les critères d’acceptation.

---

# 2. Architecture mentale

Le référentiel n’est pas un questionnaire.

Il est un **graphe de définition professionnelle**.

```text
RAW IDEA / SOURCES
      ↓
INFO atoms
      ↓
ANALYSIS atoms
      ↓
DECISION atoms
      ↓
SPEC atoms
      ↓
VERIFY atoms
      ↓
DELIVERABLE CONTRACTS
      ↓
DEPENDENCY GATES
      ↓
READY FOR DEVELOPMENT
```

Le graphe peut comporter des boucles de révision et du travail parallèle.

---

# 3. Les 5 types d’atomes

## `INFO`

Fait, déclaration, préférence, contrainte ou donnée.

## `ANALYSIS`

Transformation de plusieurs inputs en observation/interprétation exploitable.

## `DECISION`

Arbitrage qui sélectionne une direction et crée une source de vérité active.

## `SPEC`

Définition de ce qui doit être construit ou respecté.

## `VERIFY`

Condition observable/testable qui prouve qu’une exigence est satisfaite.

### Invariant de traçabilité

Une exigence structurante doit pouvoir être suivie jusqu’à :

`WHY/INFO → ANALYSIS/DECISION → SPEC → VERIFY`.

Tous les atoms n’ont pas besoin des cinq maillons, mais aucune exigence critique ne doit devenir une phrase vague sans moyen de validation.

---

# 4. Relations du graphe

Relations minimales :

- `REQUIRES`
- `BENEFITS_FROM`
- `CONDITIONAL_ON`
- `CONFLICTS_WITH`
- `DERIVED_FROM`
- `EVIDENCES`
- `SATISFIED_BY`
- `SPECIFIED_BY`
- `VERIFIED_BY`
- `INVALIDATES`
- `SUPERSEDES`

Ces relations doivent permettre à terme un calcul de readiness et de Change Impact.

---

# 5. Types d’objets structurants

## `DOMAIN`

Famille professionnelle stable. Jamais une phase UX obligatoire.

## `REQUIREMENT ATOM`

Unité de travail atomique du référentiel.

## `DEPENDENCY GATE`

Seuil logique qui autorise ou fige un travail aval.

## `DELIVERABLE CONTRACT`

Assemblage cohérent de plusieurs atoms servant une décision ou un handoff.

## `BLUEPRINT OVERLAY`

Spécificités d’un type de produit : premier cas `SITE_VITRINE`.

## `CONTEXT OVERLAY`

Conditions transversales : redesign, local, multilingual, CMS, personal data, regulated, etc.

## `DELIVERY PROFILE OVERLAY`

Règles liées à la méthode d’exécution choisie, qui ne doivent pas polluer le référentiel produit universel.

Exemples :

- Lovable / React ;
- WordPress ;
- Webflow ;
- Wix Studio ;
- custom code ;
- agence externe.

Un Delivery Profile peut apporter : conventions repo, J0, scripts, runbook, standards de code, règles de passes, outils QA.

Il ne redéfinit pas les décisions produit.

## `STANDARD PROFILE`

Subset applicable d’un standard externe.

Exemples :

- WCAG 2.2 target ;
- security baseline / ASVS subset ;
- SEO public-site baseline ;
- privacy/cookie requirements selon juridiction et tracking.

---

# 6. Architecture documentaire cible

```text
project-definition/
  00_MASTER_LIFECYCLE.md
  01_DOMAIN_REGISTRY.md
  02_REQUIREMENT_ATOM_SCHEMA.md
  03_REQUIREMENT_REGISTRY_CORE.md
  04_BLUEPRINT_SITE_VITRINE.md
  05_CONTEXT_OVERLAYS.md
  06_DEPENDENCY_GRAPH.md
  07_DELIVERABLE_CONTRACTS.md
  08_ACQUISITION_RESOLUTION_MODEL.md
  09_VALIDATION_CONFIDENCE_MODEL.md
  10_CHANGE_IMPACT_MODEL.md
  11_READY_FOR_DEVELOPMENT_CONTRACT.md
  12_REFERENCE_STANDARDS.md
  delivery-profiles/
    LOVABLE_REACT.md
    ...
```

Le fichier `KNOWLEDGE.md` reste un index d’autorité.

---

# 7. Lifecycle — trois zones

## A — `IDEA_DECISION`

Question :

> **Quelle direction mérite d’être poursuivie, pour qui, pourquoi et avec quels principaux risques/contraintes ?**

Cette zone couvre Discovery + challenge + evidence + strategic alternatives + feasibility probes.

Elle peut produire : GO / REVISE / DEEPEN / PAUSE / STOP / INSUFFICIENT_INFORMATION.

## B — `PROJECT_DEFINITION`

Question :

> **Exactement quoi allons-nous construire pour matérialiser la direction retenue ?**

Elle transforme la direction en scope, expérience, contenu, fonctions, data, design, technique et NFR.

## C — `BUILD_READY`

Question :

> **Le dossier est-il suffisamment défini, traçable et vérifiable pour être remis au développement ?**

Cette zone valide/assemble ; elle ne réinvente pas la solution.

### Hors périmètre

Coding, QA exécutée, préprod, release, production et monitoring post-launch appartiennent au Delivery/Production lifecycle, même si leurs exigences sont définies en amont.

---

# 8. Domain Registry — 20 domaines candidats

| ID | Domaine | Principalement |
|---|---|---|
| D01 | Governance, Stakeholders & Decision Context | IDEA + PROJECT |
| D02 | Business Context, Problem & Outcomes | IDEA |
| D03 | Users, Audiences, Segments & Jobs | IDEA → PROJECT |
| D04 | Existing State, Assets & Evidence | IDEA + PROJECT |
| D05 | Market, Competition, Alternatives & References | IDEA |
| D06 | Opportunity, Strategy, Value Proposition & Positioning | IDEA |
| D07 | Offer, Product/Service Model & Scope | IDEA macro → PROJECT détaillé |
| D08 | User Journeys, Conversion & Service Flow | PROJECT |
| D09 | Information Architecture, Navigation & Page/Screen Model | PROJECT |
| D10 | Content, Proof, Media & Content Operations | PROJECT |
| D11 | SEO, Discoverability & Migration | PROJECT + IDEA probe |
| D12 | Functional Requirements, Business Rules & UI States | PROJECT |
| D13 | Data, Content Model, CMS, Roles & Permissions | PROJECT conditionnel |
| D14 | Integrations, APIs, Notifications & External Services | PROJECT conditionnel |
| D15 | UX, UI, Brand & Design System Definition | PROJECT |
| D16 | Technical Architecture, Platform, Environments & Operations | PROJECT + IDEA probe |
| D17 | Security, Privacy, Legal & Compliance | PROJECT conditionnel + IDEA risk probe |
| D18 | Accessibility, Performance, Reliability & Compatibility | PROJECT |
| D19 | Measurement, Analytics, Experimentation & Observability | IDEA success → PROJECT instrumentation |
| D20 | QA, Acceptance, Delivery Constraints & Handoff | BUILD READY |

### Règle de proportionnalité

Aucun Domain n’impose automatiquement tous ses atoms.

Un petit site statique peut avoir D13/D14 presque vides.

Un redesign SEO complexe rend D11 structurant.

Un CMS rend D13 important.

Un secteur réglementé approfondit D17.

---

# 9. Gates majeures

## G0 — `BLUEPRINT_FIT_SUFFICIENT`

Le bon Blueprint/overlay peut être chargé ou un mismatch peut être déclaré.

## G1 — `DISCOVERY_FOUNDATION_SUFFICIENT`

Problème/objectifs + cible + contexte + existing matière sont assez fiables pour lancer des analyses pertinentes.

## G2 — `EVIDENCE_CONTEXT_SUFFICIENT`

Evidence interne/externe assez solide pour challenger l’idée sans se contenter de la reformuler.

## G3 — `STRATEGIC_OPTIONS_READY`

Directions candidates distinctes + trade-offs + risques + probes nécessaires disponibles.

## G4 — `IDEA_DECISION_READY`

Décision honnête possible.

### Frontière officielle

`GO at G4` crée un `Project Definition Draft` à partir d’un snapshot Idea.

`GO != READY_FOR_DEVELOPMENT`.

## G5 — `PRODUCT_DEFINITION_STABLE`

Scope + journeys + IA + content requirements + SEO stratégique + fonctions structurantes cohérents.

## G6 — `EXPERIENCE_DEFINITION_SUFFICIENT`

Fidélité UX/UI suffisante pour ne pas déléguer des décisions produit implicites au développement.

## G7 — `TECHNICAL_NFR_DEFINITION_SUFFICIENT`

Data/integrations/architecture/NFR applicables suffisamment définis.

## G8 — `TRACEABILITY_AND_ACCEPTANCE_READY`

Exigences critiques liées à leurs specs/verify ; risques et unknowns acceptés explicitement.

## G9 — `READY_FOR_DEVELOPMENT`

Le contrat final est satisfait.

### Important

Ces Gates sont des seuils du graphe, pas des pages et pas un workflow utilisateur imposé.

---

# 10. Lifecycle des artifacts

Pour éviter qu’une exploration précoce devienne une fausse décision, chaque artifact/specification matérialisée peut porter un état :

- `EXPLORATORY` — sert à réfléchir/tester ;
- `PROVISIONAL` — direction plausible mais pas source de vérité ;
- `ACCEPTED_CURRENT` — direction active pour continuer ;
- `FROZEN_IN_SNAPSHOT` — décision/spécification officielle d’une version ;
- `SUPERSEDED` ;
- `REVIEW_REQUIRED` ;
- `STALE`.

Exemple : un wireframe produit pendant IDEA peut être `EXPLORATORY`. Il n’autorise pas automatiquement G6.

---

# 11. Deliverable Contracts

## A01 — `IDEA_INTAKE_RECORD`

Raw idea + sources + contexte + Blueprint classification.

## A02 — `PROBLEM_OUTCOME_FRAME`

Problème/opportunité + objectifs + résultat utilisateur + success criteria + contraintes critiques.

## A03 — `AUDIENCE_NEED_MODEL`

Cibles + jobs/besoins + objections + usage/acquisition + evidence.

## A04 — `CURRENT_STATE_EVIDENCE_PACK`

Existing + analytics + SEO + offre + contenu + marque + assets + observations.

## A05 — `MARKET_COMPETITIVE_LANDSCAPE`

Market context + competitors/alternatives/references + patterns/gaps/opportunities.

## A06 — `OPPORTUNITY_AND_OPTIONS_MAP`

Challenge + simplification + opportunities + candidate directions + trade-offs.

## A07 — `IDEA_DECISION_RECORD`

Direction sélectionnée ou Stop/Pause/Revise + evidence + assumptions + risks + accepted unknowns.

## A08 — `PROJECT_DEFINITION_BASELINE`

Snapshot Idea selected + constraints + sources of truth + scope macro.

## A09 — `EXPERIENCE_INFORMATION_ARCHITECTURE_SPEC`

Journeys + conversion + IA + sitemap + page/screen definitions + wireframes requis.

## A10 — `CONTENT_DISCOVERABILITY_SPEC`

Content requirements + proof/media + content model + SEO + migration.

## A11 — `FUNCTIONAL_DATA_INTEGRATION_SPEC`

Functions + business rules + UI states + data + roles + CMS + integrations + notifications.

## A12 — `DESIGN_DEFINITION`

Brand constraints + visual direction + design system + responsive + component states + motion.

## A13 — `TECHNICAL_AND_NFR_DEFINITION`

Architecture + environments + security/privacy/legal + accessibility + performance + reliability/compatibility.

## A14 — `VERIFICATION_ACCEPTANCE_PLAN`

Acceptance criteria + tests + validation evidence + unresolved risks/unknowns.

## A15 — `BUILD_READY_PROJECT_SPECIFICATION`

Vue assemblée/versionnée pour handoff.

### Contenu final

A10 n’exige pas nécessairement que chaque texte/photo final existe avant développement.

Pour Build Ready, il peut suffire que soient définis :

- content model / emplacement ;
- purpose ;
- format ;
- contraintes ;
- owner ;
- provenance/droits ;
- dépendance/timing ;
- fallback ou stratégie de contenu provisoire non publiable.

Le contenu final devient blocking seulement lorsqu’il est réellement nécessaire pour construire/tester correctement un élément.

---

# 12. Requirement Atom Schema V0.2

Chaque atom doit pouvoir porter au minimum :

- `id`
- `type`: INFO / ANALYSIS / DECISION / SPEC / VERIFY
- `domain_id`
- `lifecycle_zone`
- `blueprint_scope`
- `context_conditions`
- `title`
- `statement_or_question`
- `purpose`
- `risk_if_missing`
- `criticality_by_gate`
- `dependencies`
- `relations`
- `acquisition_paths`
- `human_only_reason`
- `decision_authority`
- `owner`
- `expert_escalation_rule`
- `evidence_required`
- `confidence_or_validation_required`
- `minimum_resolution_by_gate`
- `freshness_policy`
- `conflict_policy`
- `accepted_unknown_policy`
- `defer_policy`
- `unlocks`
- `deliverables_affected`
- `blocking_for`
- `change_impact_edges`
- `validation_method`
- `implementation_discretion`
- `sensitivity_class`
- `examples`
- `notes`

### `criticality_by_gate`

Valeurs candidates :

- `BLOCKING`
- `REQUIRED`
- `CONDITIONAL`
- `ENHANCER`
- `NOT_RELEVANT`

La criticité dépend de la Gate/contexte, pas uniquement de l’information.

### `decision_authority`

Permet de distinguer :

- utilisateur/décideur humain ;
- équipe/owner désigné ;
- IA autorisée à recommander mais pas trancher ;
- expert requis ;
- règle déterministe.

---

# 13. Acquisition / Resolution

Ordre conceptuel :

`MEM → RAW → SRC/AUDIT → WEB/CONN → CALC → AI-H/AI-R → HUM → EXPERT → ACCEPTED_UNKNOWN`

L’ordre dépend de la nature de l’atom.

Le système doit éviter :

- demander un concurrent trouvable publiquement ;
- inventer une préférence interne ;
- présenter une inférence comme une décision ;
- donner une conclusion juridique/sécurité de haute conséquence sans escalade adaptée.

---

# 14. Validation / provenance / confiance

Réutiliser autant que possible les concepts déjà canoniques de provenance et d’état.

Un atom peut conceptuellement être :

- UNKNOWN ;
- HUMAN_DECLARED ;
- SOURCE_BACKED ;
- WORKING_ASSUMPTION ;
- AI_RECOMMENDATION ;
- ACCEPTED_AS_CURRENT ;
- HUMAN_DECISION ;
- FROZEN_IN_SNAPSHOT ;
- CONFLICTED ;
- STALE ;
- ACCEPTED_UNKNOWN ;
- NOT_RELEVANT.

La même donnée peut être suffisante comme hypothèse à G2 mais insuffisante pour G4/G9.

---

# 15. Traceability Coverage

Pour chaque atom critique, le moteur doit pouvoir répondre :

- pourquoi existe-t-il ?
- sur quoi repose-t-il ?
- quelle décision/specification le satisfait ?
- comment sera-t-il vérifié ?

Coverage candidate :

`critical requirement → at least one active SPEC or explicit resolution → at least one VERIFY when testable`.

Les exceptions doivent être justifiées.

Exemple :

```text
INFO objective.primary = prise de rendez-vous
  ↓
DECISION conversion.primary = réserver
  ↓
SPEC contact_flow = calendar + fallback phone
  ↓
VERIFY booking_success
VERIFY provider_failure_fallback
```

---

# 16. Change Impact / Freeze

Un snapshot frozen est versionné, pas éternellement immuable.

Impact candidates :

- `NONE`
- `RECHECK`
- `RECOMPUTE`
- `REVIEW`
- `REDECIDE`
- `INVALIDATE_DELIVERABLE`
- `REVOKE_READY_FOR_DEVELOPMENT`

Un changement B2C→B2B peut révoquer readiness.

Un changement de couleur locale ne doit pas rouvrir le business model.

---

# 17. READY_FOR_DEVELOPMENT — contrat V0.2

Un projet peut être déclaré `READY_FOR_DEVELOPMENT` lorsque :

1. Blueprint + Context/Delivery overlays applicables sont connus ;
2. A07 contient une direction sélectionnée ou une décision équivalente ;
3. aucun conflit critique caché ne subsiste ;
4. scope In / Later / Out est explicite ;
5. journeys/comportements structurants sont définis ;
6. IA/pages/screens nécessaires sont définis ;
7. content requirements/proofs/media dependencies sont connus ;
8. SEO/migration requirements applicables sont définis ;
9. fonctionnalités/business rules/edge cases structurants sont spécifiés ;
10. states loading/empty/error/success/fallback applicables sont couverts ;
11. data/content model/CMS/roles/permissions applicables sont définis ;
12. integrations/APIs/notifications et failure behavior applicables sont définis ;
13. fidelity UX/UI est suffisante pour éviter des décisions produit implicites au build ;
14. architecture/environments/operations constraints sont définis au niveau nécessaire ;
15. security/privacy/legal applicables sont traités ;
16. accessibility/performance/reliability/compatibility requirements applicables sont explicites ;
17. measurement/instrumentation nécessaires sont définis ou explicitement non pertinents ;
18. chaque requirement critique possède une résolution/specification traçable et un VERIFY lorsque testable ;
19. risks/accepted unknowns restants sont visibles avec owner/policy ;
20. sources of truth et decision authority sont explicites ;
21. package de handoff est versionné ;
22. aucun développeur n’a besoin d’inventer une décision structurante hors `IMPLEMENTATION_DISCRETION`.

### `READY_WITH_ACCEPTED_UNKNOWNS`

Autorisé seulement si les unknowns :

- ne rendent pas le scope trompeur ;
- ne cachent pas un blocker critique ;
- ont un owner/résolution future lorsque nécessaire ;
- n’empêchent pas un développement cohérent.

---

# 18. Mapping du PDF fourni

Le PDF est traité comme source de couverture, pas comme workflow cible.

## IDEA

Conserver : objectif, cible, CTA/résultat attendu, contraintes critiques.

Ajouter avant figer la solution : evidence utilisateur, audit existant, marché, concurrence, alternatives, références, opportunity mapping, challenge, plusieurs directions, feasibility probes, Decision Record.

## PROJECT DEFINITION

Absorber : arborescence, rôle pages, contenus, preuves, médias, parcours, objections, structure pages, wireframes, DA, design system, SEO requirements, NFR, contraintes techniques.

## DELIVERY/PRODUCTION

Déplacer comme exécution : construction pages, passes réelles, QA exécutée, préprod, mise en ligne, suivi.

## DELIVERY PROFILE

Déplacer les règles Lovable/React : J0, scripts, AGENTS, runbook, scaffold cleanup, conventions code, règles de passes, commandes de validation.

---

# 19. Matrix V5 — rôle après architecture V0.2

Matrix V5 reste utile mais devient une **source candidate à migrer** vers le nouveau système.

Elle ne suffit pas seule à couvrir `READY_FOR_DEVELOPMENT`.

Elle devrait alimenter principalement :

- D01→D11 ;
- feasibility/risk probes D16→D18 ;
- Acquisition/Resolution ;
- Idea Deliverables A01→A07.

Les extensions à développer après validation concernent surtout :

- D12 business rules/UI states ;
- D13 data/content/CMS/roles ;
- D14 integrations/notifications/fallbacks ;
- D15 design definition build-ready ;
- D16 architecture/environment/operations ;
- D17 compliance/security depth ;
- D18 explicit NFR contracts ;
- D19 instrumentation ;
- D20 traceability/acceptance/handoff.

---

# 20. Contrôles professionnels externes

Ces références servent de garde-fou, pas de workflow à recopier :

- Design Council Double Diamond — Discover / Define / Develop / Deliver, avec divergence/convergence et itération ;
- GOV.UK Discovery — comprendre problème, utilisateurs, contraintes et contexte avant de construire ;
- GOV.UK Alpha — tester plusieurs solutions et hypothèses risquées ;
- W3C WCAG 2.2 — critères d’accessibilité testables ;
- OWASP ASVS — exigences sécurité vérifiables, à sélectionner proportionnellement ;
- Google Search Central — discoverability/crawl/index/content/site organization ;
- web.dev Core Web Vitals — performance utilisateur mesurable.

---

# 21. Anti-patterns

- 20 Domains ≠ 20 écrans.
- Atom ≠ question humaine.
- Exploratory artifact ≠ décision.
- Source utilisateur ≠ vérité universelle.
- Competitor list ≠ Market Context.
- Filled fields ≠ readiness.
- Design joli ≠ Project Definition.
- Standards complets ≠ requirements universels.
- Content final manquant ≠ automatiquement NO GO si le contrat de contenu est suffisant.
- Technical preference ≠ raison de sauter la Discovery.
- Developer discretion ≠ permission d’inventer le produit.

---

# 22. Gate de validation de l’architecture

Avant de remplir des centaines d’atoms, doivent être explicitement validés :

1. `IDEA_DECISION / PROJECT_DEFINITION / BUILD_READY` ;
2. les types `INFO / ANALYSIS / DECISION / SPEC / VERIFY` ;
3. Domain / Requirement Atom / Gate / Deliverable ;
4. Core + Blueprint + Context + Delivery Profile + Standard Profile ;
5. les 20 Domains ;
6. G0→G9 ;
7. la frontière G4 ;
8. artifact lifecycle Exploratory→Frozen ;
9. Requirement Atom Schema V0.2 ;
10. traceability Requirement→Spec→Verify ;
11. Change Impact ;
12. Ready-for-Development Contract V0.2.

Après validation seulement : construire le Requirement Registry exhaustif `SITE_VITRINE` domaine par domaine et le Dependency Graph calculable.
