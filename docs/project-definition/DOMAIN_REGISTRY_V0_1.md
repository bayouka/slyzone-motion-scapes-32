# 4b4c — DOMAIN REGISTRY — V0.1

Date : 2026-09-13

Statut : **WORKING CANDIDATE — NON CANONIQUE**

Ce registre décrit les 20 domaines professionnels candidats du référentiel `Idea → Project Definition → Ready for Development`.

Il ne définit pas un workflow UX et ne crée pas 20 phases visibles.

---

## 1. Zones du lifecycle

- `IDEA_DECISION` — comprendre, rechercher, challenger, comparer et décider quelle direction mérite d’être poursuivie ;
- `PROJECT_DEFINITION` — transformer cette direction en définition complète du produit/site à construire ;
- `BUILD_READY` — prouver que le dossier est cohérent, suffisamment détaillé et vérifiable pour le développement.

---

## 2. Registre des domaines

| ID | Domaine | Mission professionnelle | Zone principale | Gates principalement affectées |
|---|---|---|---|---|
| D01 | Governance, Stakeholders & Decision Context | Savoir qui décide, selon quels critères, avec quelles contraintes de gouvernance et quelles sources font autorité | CROSS | G1, G4, G8, G9 |
| D02 | Business Context, Problem & Outcomes | Définir le problème/opportunité, l’objectif business, le résultat utilisateur et les critères de succès | IDEA_DECISION | G1, G3, G4 |
| D03 | Users, Audiences, Segments & Jobs | Comprendre les publics, besoins, jobs, objections, contexte d’usage et evidence utilisateur | IDEA_DECISION → PROJECT_DEFINITION | G1, G2, G5 |
| D04 | Existing State, Assets & Evidence | Auditer ce qui existe : offre, site, contenu, données, SEO, preuves, marque, contraintes héritées | IDEA_DECISION + PROJECT_DEFINITION | G1, G2, G5 |
| D05 | Market, Competition, Alternatives & References | Comprendre l’environnement, les concurrents, substituts, benchmarks et opportunités observables | IDEA_DECISION | G2, G3, G4 |
| D06 | Opportunity, Strategy, Value Proposition & Positioning | Transformer evidence + besoins en opportunités et directions stratégiques distinctes | IDEA_DECISION | G3, G4 |
| D07 | Offer, Product/Service Model & Scope | Définir l’offre retenue, la priorité, la promesse, le périmètre macro puis détaillé | IDEA_DECISION → PROJECT_DEFINITION | G3, G4, G5 |
| D08 | User Journeys, Conversion & Service Flow | Définir les parcours, décisions, conversion, objections et service flow | PROJECT_DEFINITION | G5, G6 |
| D09 | Information Architecture, Navigation & Page/Screen Model | Définir sitemap, routes, navigation, rôle de chaque page/écran et relations | PROJECT_DEFINITION | G5, G6 |
| D10 | Content, Proof, Media & Content Operations | Définir contenu, preuves, médias, ownership éditorial, modèles et contraintes | PROJECT_DEFINITION | G5, G6, G9 |
| D11 | SEO, Discoverability & Migration | Définir visibilité organique, search intent, structure SEO et migration si refonte | PROJECT_DEFINITION + IDEA probe | G2, G5, G7, G9 |
| D12 | Functional Requirements, Business Rules & UI States | Formaliser fonctions, règles métier, comportements, états et cas limites | PROJECT_DEFINITION | G5, G6, G8, G9 |
| D13 | Data, Content Model, CMS, Roles & Permissions | Définir données, modèles, cycle de vie, CMS, rôles et permissions si applicables | PROJECT_DEFINITION | G7, G8, G9 |
| D14 | Integrations, APIs, Notifications & External Services | Définir contrats externes, dépendances tierces, emails/notifications et fallbacks | PROJECT_DEFINITION | G7, G8, G9 |
| D15 | UX, UI, Brand & Design System Definition | Définir expérience, wireframes nécessaires, direction visuelle, composants, responsive et motion | PROJECT_DEFINITION | G6, G8, G9 |
| D16 | Technical Architecture, Platform, Environments & Operations | Définir architecture technique, hosting, environnements, stratégie d’exploitation et contraintes plateforme | PROJECT_DEFINITION | G7, G8, G9 |
| D17 | Security, Privacy, Legal & Compliance | Définir risques et exigences sécurité/privacy/legal/compliance applicables | PROJECT_DEFINITION + IDEA risk probe | G2, G4, G7, G8, G9 |
| D18 | Accessibility, Performance, Reliability & Compatibility | Définir les NFR expérience/qualité et leur niveau cible | PROJECT_DEFINITION | G7, G8, G9 |
| D19 | Measurement, Analytics, Experimentation & Observability | Relier objectifs à instrumentation, mesure de succès et observabilité pertinente | IDEA_DECISION → PROJECT_DEFINITION | G1, G5, G7, G9 |
| D20 | QA, Acceptance, Delivery Constraints & Handoff | Transformer requirements/specs en critères d’acceptation, vérifications et dossier de handoff | BUILD_READY | G8, G9 |

---

## 3. Dépendances structurantes principales

Le graphe ne doit pas être lu comme une chaîne stricte, mais certaines dépendances sont fortes.

### Foundation

`D01 + D02 + D03 + D04` fournissent la base minimale pour une recherche stratégique fiable.

### Evidence externe

`D03 + D04` alimentent `D05` afin d’éviter un benchmark de concurrents mal ciblés.

### Stratégie

`D02 + D03 + D04 + D05` alimentent `D06`.

`D06` alimente la décision de direction et le macro-scope de `D07`.

### Définition produit/site

`D07` alimente fortement `D08`, `D09`, `D10`, `D11`, `D12`.

`D08 + D09 + D12` déterminent une grande partie des besoins de `D13 + D14`.

`D08 + D09 + D10 + D12` déterminent les besoins de `D15`.

### Technique et NFR

`D12 + D13 + D14 + D15` alimentent `D16`.

`D12 + D13 + D14 + D16` activent/approfondissent `D17`.

`D08 + D09 + D12 + D15 + D16` alimentent `D18`.

### Validation

Tous les domaines significatifs alimentent `D20`, mais seuls les requirements actifs et structurants doivent produire des critères de vérification formels.

---

## 4. Domaines transversaux

Certains domaines ne doivent pas attendre une pseudo-phase dédiée.

### D01 — Governance

Peut s’activer très tôt ou tardivement lorsqu’un associé, client ou décideur apparaît.

### D17 — Security / Privacy / Legal

Peut faire un `risk probe` dès IDEA si un risque réglementaire ou des données sensibles peuvent invalider une direction.

### D19 — Measurement

Commence par clarifier le succès au niveau IDEA, puis devient instrumentation détaillée au niveau PROJECT.

### D20 — Acceptance

Les critères de validation peuvent être préparés au fil du projet ; la Gate BUILD_READY vérifie qu’ils couvrent les éléments critiques.

---

## 5. Context Overlays majeurs

Le Domain Registry est universel ; les overlays déterminent la profondeur réelle.

Overlays candidats :

- `IS_REDESIGN`
- `HAS_EXISTING_SITE`
- `IS_LOCAL_BUSINESS`
- `IS_MULTILINGUAL`
- `HAS_CMS`
- `HAS_FORMS`
- `HAS_PERSONAL_DATA`
- `HAS_CRITICAL_INTEGRATION`
- `HAS_AUTH`
- `HAS_ROLES_PERMISSIONS`
- `HAS_TEAM_DECISION`
- `HAS_REGULATORY_CONSTRAINT`
- `SEO_MIGRATION_RISK`
- `NEEDS_VISUAL_PROJECTION`
- `DECISION_REQUIRES_BUDGET`
- `DECISION_REQUIRES_TIMELINE`
- `HIGH_TRAFFIC_OR_REVENUE_CRITICAL`
- `EXTERNAL_DELIVERY_TEAM`

Un overlay active des atoms ; il ne crée pas une branche UX séparée.

---

## 6. Règle de proportionnalité

Un site vitrine simple ne doit jamais être forcé à satisfaire l’ensemble du registre au niveau maximal.

Exemples :

- site statique sans compte : D13/D14 très légers ;
- refonte SEO : D11 devient critique ;
- cabinet réglementé : D17 approfondi ;
- site local : D03/D05/D11 peuvent activer des besoins géographiques ;
- projet avec CMS : D10/D13 deviennent structurants ;
- projet multilingue : D09/D10/D11/D13/D15 peuvent recevoir des requirements supplémentaires.

---

## 7. Critère de complétude future

Le Domain Registry sera considéré suffisamment stable lorsque :

1. D01→D20 ont chacun un registre atomique ;
2. les overlaps et doublons ont été red-teamés ;
3. chaque requirement critique a un owner/domain unique ;
4. les context overlays activent correctement les cas conditionnels ;
5. la Matrix V5 a été coverage-mappée vers les nouveaux atoms ;
6. les trous de couverture du PDF utilisateur et des standards professionnels ont été explicitement traités ;
7. le `READY_FOR_DEVELOPMENT` peut être calculé sans exiger des détails inutiles.
