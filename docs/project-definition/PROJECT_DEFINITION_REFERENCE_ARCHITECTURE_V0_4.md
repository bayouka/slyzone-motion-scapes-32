# 4b4c — PROJECT DEFINITION REFERENCE ARCHITECTURE — V0.4

Date : 2026-09-13

Statut : **CURRENT ARCHITECTURE CANDIDATE — NON CANONIQUE / À VALIDER**

Supersède comme candidat : V0.3.

Intègre :
- préfiguration avant Project ;
- Decision Package / présentation ;
- Review feedback loop ;
- progressive lock/freeze ;
- AI/Human resolution policy ;
- red-team Z4–Z5 ;
- concept validation conditionnelle ;
- approval with conditions ;
- presentation freshness.

---

# 1. North Star

`READY_FOR_DEVELOPMENT` signifie :

> l’équipe de développement peut construire le bon produit sans devoir inventer une décision structurante qui aurait dû être prise avant elle.

Avant Project, une autre exigence s’ajoute :

> l’équipe/décideur doit pouvoir **comprendre, challenger et décider** sur une Idea devenue suffisamment tangible sans confondre concept de décision et spécification finale.

---

# 2. Lifecycle cible

```text
Z0 CAPTURE / BLUEPRINT FIT
  ↓
Z1 IDEA DISCOVERY FOUNDATION
  ↓
Z2 IDEA EVIDENCE / MARKET
  ↓
Z3 IDEA STRATEGY / OPTIONS
  ↓
Z4 IDEA PREFIGURATION / CONCEPT ALPHA
  ↓
Z4b CONCEPT VALIDATION (conditionnel)
  ↓
Z5 DECISION PACKAGE / PRESENTATION / REVIEW
  ↓
Z6 APPROVED IDEA → PROJECT BASELINE
  ↓
Z7 PROJECT DEFINITION
  ↓
Z8 BUILD READY
```

Le graphe peut exécuter des branches en parallèle ; cet ordre exprime des dépendances de maturité, pas un wizard UX.

---

# 3. Pourquoi Z4 existe

Une équipe décide mal sur une direction purement abstraite.

Après comparaison stratégique, 4b4c peut donc produire **juste assez de solution** pour rendre les conséquences visibles :

- concept journey ;
- sitemap/screen map conceptuel ;
- rôles des pages/surfaces ;
- macro capabilities ;
- messages/contenus représentatifs ;
- discoverability/SEO macro ;
- visual territories ;
- high-fidelity concept mockups ;
- concept prototype ;
- feasibility envelope ;
- scenario/business case si pertinent.

Tous ces outputs sont `FOR_DECISION`, pas `FOR_BUILD`.

---

# 4. Prefiguration Budget

Z4 ne doit pas devenir un Project caché.

Chaque artifact de préfiguration doit répondre à au moins une question :

- réduit-il une incertitude importante ?
- permet-il de comparer deux directions ?
- rend-il une décision compréhensible ?
- teste-t-il une risky assumption ?
- révèle-t-il une contrainte de faisabilité ?

Sinon il est `NOT_NEEDED_FOR_DECISION`.

---

# 5. Concept Validation

`CONCEPT_VALIDATION` devient conditionnel avant Decision Package lorsque l’incertitude utilisateur est structurante.

Triggers :
- nouveau segment ;
- value proposition incertaine ;
- journey inhabituel ;
- interaction critique nouvelle ;
- décision coûteuse/irréversible ;
- divergence stakeholders/evidence ;
- risque de compréhension élevé.

Méthodes possibles :
- test de compréhension ;
- interview ciblée ;
- comparaison de concepts ;
- prototype task test ;
- message test ;
- smoke/landing test si légitime.

Une simulation IA/persona synthétique peut préparer le test mais **ne compte jamais comme evidence utilisateur réelle**.

---

# 6. Progressive lock

États :

`WORKING → AI_PROPOSED → VALIDATED_CURRENT → LOCKED_FOR_DEPENDENTS → FROZEN_IN_DECISION_SNAPSHOT → APPROVED_FOR_PROJECT → FROZEN_FOR_BUILD`.

États de dérive : `REVIEW_REQUIRED / STALE / SUPERSEDED / REJECTED`.

Business/problem/target peuvent être `LOCKED_FOR_DEPENDENTS` avant audit si suffisamment validés, mais jamais irrévocables. Une evidence nouvelle peut provoquer Review sans modifier silencieusement l’intention.

Voir `PROGRESSIVE_LOCK_PROMOTION_MODEL_V0_1.md`.

---

# 7. Gates V0.4

## G0 `BLUEPRINT_FIT_SUFFICIENT`

## G1 `FOUNDATION_LOCKABLE`
Business, problem, outcomes, target, context suffisamment fiables.

## G2 `EVIDENCE_CONTEXT_SUFFICIENT`
Existing + market/competition/alternatives + evidence suffisamment fiables.

## G3 `STRATEGIC_OPTIONS_READY`
Options + trade-offs + risk/assumptions + probes.

## G4 `PREFIGURATION_TARGET_SELECTED`
Une ou plusieurs directions méritent concept work.

## G5 `DECISION_CONCEPT_READY`
Artifacts conceptuels discriminants + feasibility/projection requis disponibles.

## G5b `CONCEPT_VALIDATION_SUFFICIENT`
Seulement si activé : evidence user/validation suffisante pour la Decision Question.

## G6 `DECISION_PACKAGE_READY`
Deck/brief + appendices + sources + freshness + asks cohérents.

## G7 `IDEA_APPROVAL_READY`
Review feedback résolu au niveau nécessaire.

Outcomes :
- `APPROVE_TO_PROJECT`
- `APPROVE_WITH_CONDITIONS`
- `REVISE`
- `DEEPEN_RESEARCH`
- `PAUSE`
- `STOP`
- `INSUFFICIENT_INFORMATION`

### APPROVE_WITH_CONDITIONS

Ne crée pas automatiquement Project baseline si la condition est structurante non résolue.

La condition devient Requirement/Probe. Après résolution ou accepted unknown autorisé, le système peut produire `APPROVED_FOR_PROJECT`.

## G8 `PROJECT_PRODUCT_DEFINITION_STABLE`

## G9 `PROJECT_EXPERIENCE_DEFINITION_STABLE`

## G10 `PROJECT_TECH_NFR_STABLE`

## G11 `TRACEABILITY_AND_ACCEPTANCE_READY`

## G12 `READY_FOR_DEVELOPMENT`

---

# 8. Domain Registry — 22 domaines

D01 Governance, Stakeholders & Decision Context

D02 Business Context, Problem & Outcomes

D03 Users, Audiences, Segments & Jobs

D04 Existing State, Assets & Evidence

D05 Market, Competition, Alternatives & References

D06 Opportunity, Strategy, Value Proposition & Positioning

D07 Offer, Product/Service Model & Scope

D08 User Journeys, Conversion & Service Flow

D09 Information Architecture, Navigation & Page/Screen Model

D10 Content, Proof, Media & Content Operations

D11 SEO, Discoverability & Migration

D12 Functional Requirements, Business Rules & UI States

D13 Data, Content Model, CMS, Roles & Permissions

D14 Integrations, APIs, Notifications & External Services

D15 UX, UI, Brand & Design System Definition

D16 Technical Architecture, Platform, Environments & Operations

D17 Security, Privacy, Legal & Compliance

D18 Accessibility, Performance, Reliability & Compatibility

D19 Measurement, Analytics, Experimentation & Observability

D20 QA, Acceptance, Delivery Constraints & Handoff

D21 Business Case, Economics, Forecasts & Scenario Models

D22 Decision Package, Presentation, Review & Approval

D08–D19 peuvent avoir un **subset PREVIEW** activé en Z4 sans devenir specs Project finales.

---

# 9. AI/Human Resolution

Référentiel dédié : `AI_HUMAN_RESOLUTION_POLICY_V0_1.md`.

Invariant :

`Requirement exists ≠ question user`.

Résolution :

`MEM → RAW → SRC/AUDIT → CONN/WEB → CALC → AI-H → AI-R → HUM → EXPERT → ACCEPTED_UNKNOWN`.

Questions humaines principalement pour :
- intention interne ;
- information privée indisponible ;
- conflit matériel ;
- préférence structurante ;
- décision/approval ;
- risque expert.

---

# 10. Decision Package Modes

## SOLO_DECISION_BRIEF
Memo + key evidence + concept + decision record. Deck optional.

## TEAM_DECISION_PACKAGE
Deck + memo + evidence appendix + review agenda + feedback log + decision record.

## COMMITTEE_INVESTMENT_PACKAGE
Ajoute business case, scenarios, sensitivity, risk/conditions, appendix plus complète.

Le profil dépend de D01 Governance et de la Decision Question.

---

# 11. Decision Deck Contract

Sorties : `.pptx` editable + `.pdf` fallback ; speaker notes si utile.

Narrative adaptative typique :
1. décision demandée ;
2. executive summary ;
3. problème / pourquoi maintenant ;
4. objectifs/success ;
5. audience ;
6. existing evidence ;
7. market/competition ;
8. opportunities ;
9. options/trade-offs ;
10. recommendation ;
11. positioning/value ;
12. journey/sitemap concept ;
13. capabilities/content ;
14. visual concept/mockups ;
15. feasibility ;
16. projections/cost/timeline si pertinent ;
17. risks/unknowns ;
18. ask/next decision.

Appendices : evidence, competitor matrix, calculations, research, probes.

---

# 12. Presentation Freshness

Avant export ou réunion :

`PRESENTATION_FRESHNESS_CHECK` compare active dossier vs Decision Snapshot.

Si divergence matérielle :
- bloquer le statut “current” ;
- indiquer ce qui est stale ;
- régénérer uniquement slides/artifacts impactés ;
- conserver ancienne version historique.

---

# 13. High-fidelity mockup safeguards

Pour éviter design fixation :

- label `CONCEPT / NOT FINAL SPEC` ;
- rationale visible ;
- assumptions visibles ;
- factual claims sourcés ou marqués à vérifier ;
- si plusieurs directions sont réellement comparées, utiliser une fidelity comparable ;
- une belle maquette ne vaut pas evidence user ;
- une maquette demandée très tôt reste `EXPLORATORY` et ne débloque pas G5 à elle seule.

---

# 14. Business case / projections

D21 est conditionnel.

Chaque calcul doit conserver :

`INPUTS → ASSUMPTIONS → FORMULA → RANGE/SCENARIOS → CONFIDENCE → SENSITIVITY → WHAT_COULD_CHANGE_THIS`.

Si inputs insuffisants : `INSUFFICIENT_INPUTS_FOR_ROI`.

Ne pas fabriquer de chiffres pour rendre le deck crédible.

---

# 15. Feedback Loop

Feedback types :

`NEW_INFO / CORRECTION / IDEA_PROPOSAL / CHANGE_REQUEST / ASSUMPTION_CHALLENGE / RISK / PREFERENCE / QUESTION / DECISION`.

Materiality :

`COSMETIC / LOCAL / SUBSTANTIVE / CRITICAL`.

Flow :

`capture → classify → map dependencies → assess impact → resolve authority/conflict → targeted recompute → refresh affected artifacts → decision`.

Commentaires contradictoires créent un conflict group ; l’IA ne choisit pas silencieusement.

---

# 16. Promotion Idea → Project

Artifacts de Z4/Z5 :

- `PROMOTE_DIRECTLY`
- `PROMOTE_AND_DEEPEN`
- `REWORK_TARGETED`
- `REJECT/SUPERSEDE`

Le Project n’est pas un redémarrage ; il est l’approfondissement contrôlé d’une Idea approuvée.

Exemples :
- sitemap concept → baseline Project, puis routes/SEO détaillés ;
- feature concept → functional requirements/rules/states/data ;
- mockup → visual baseline, puis design system/components/responsive ;
- feasibility envelope → architecture detailed definition.

---

# 17. PowerPoint motion capability

Le moteur décisionnel ne dépend pas de l’animation.

Profiles :
- `STATIC_PRO` requis ;
- `MOTION_PRO` enhancement.

Motion possible : Morph, Fade, Zoom, progressive reveals, before/after, journey transitions.

Un spike technique séparé doit valider génération programmatique et compatibilité PPTX native avant de promettre le niveau `MOTION_PRO` comme capability production.

---

# 18. Documents de travail associés

- `03_REQUIREMENT_REGISTRY_IDEA_V0_2.md`
- `04_PREFIGURATION_DECISION_PACKAGE_REGISTRY_V0_1.md`
- `04A_REQUIREMENT_REGISTRY_PROJECT_PRODUCT_V0_1.md`
- `04B_REQUIREMENT_REGISTRY_PROJECT_TECH_BUILDREADY_V0_1.md`
- `PROGRESSIVE_LOCK_PROMOTION_MODEL_V0_1.md`
- `AI_HUMAN_RESOLUTION_POLICY_V0_1.md`
- `PREFIGURATION_DECISION_PACKAGE_RED_TEAM_20260913.md`

Tous restent candidats tant que la Reference Architecture V0.4 n’est pas explicitement validée.
