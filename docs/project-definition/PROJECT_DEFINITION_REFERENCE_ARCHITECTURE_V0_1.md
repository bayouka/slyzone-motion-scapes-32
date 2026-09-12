# 4b4c — PROJECT DEFINITION REFERENCE ARCHITECTURE — V0.1

Date : 2026-09-13

Statut : **CANDIDATE D’ARCHITECTURE DOCUMENTAIRE — NON CANONIQUE / À VALIDER AVANT REMPLISSAGE EXHAUSTIF**

Objet : définir l’architecture du référentiel maître qui permettra à 4b4c de transformer une idée brute en dossier `READY_FOR_DEVELOPMENT` sans exposer un questionnaire géant à l’utilisateur.

Ce document ne remplace pas encore le Master Blueprint Idea Engine, Matrix V5, Capture Contract ou les autres sources canoniques. Il propose l’architecture qui devra, après validation, permettre de les absorber, les étendre ou les scinder proprement.

---

# 1. North Star

Le référentiel doit rendre possible la promesse suivante :

> Lorsqu’un dossier est déclaré `READY_FOR_DEVELOPMENT`, une équipe de développement peut commencer sans devoir inventer elle-même une décision structurante de produit, métier, utilisateur, contenu, UX, design, données, intégration, technique, sécurité, qualité ou validation qui aurait dû être prise en amont.

`READY_FOR_DEVELOPMENT` ne signifie pas que chaque détail d’implémentation est imposé.

Il signifie que :

- les **intentions et contraintes structurantes** sont résolues ;
- les **ambiguïtés produit** qui changeraient ce qui est construit sont levées ou explicitement acceptées ;
- le développeur conserve une **discrétion d’implémentation** sur les choix internes qui n’altèrent pas le contrat produit.

Exemples de discrétion qui peuvent rester côté développement : organisation interne d’un module, nom de fonctions, détail d’implémentation d’un composant, choix mineur entre deux bibliothèques équivalentes si aucune contrainte produit/technique ne l’interdit.

Exemples qui ne doivent pas rester à deviner : cible, objectif, page nécessaire, comportement d’un formulaire, règles de validation, destination d’une donnée, droits d’un utilisateur, migration SEO critique, contrainte de performance, état d’erreur important, niveau d’accessibilité attendu, intégration imposée.

---

# 2. Ce que le référentiel n’est PAS

Le référentiel maître n’est pas :

- un questionnaire utilisateur ;
- un wizard ;
- une succession universelle de phases visibles ;
- un business plan obligatoire ;
- un backlog de développement ;
- une architecture technique finale décidée dès l’Idea ;
- une checklist de production recopiée sans contexte ;
- une collection de documents indépendants qui se contredisent.

Le référentiel est un **système de connaissances, dépendances, décisions, spécifications et vérifications**.

---

# 3. Cinq types d’atomes — correction fondamentale

Une excellente agence ne collecte pas seulement des informations. Elle produit aussi des analyses, prend des décisions, définit des spécifications et prépare des vérifications.

Le référentiel doit donc modéliser au minimum cinq types atomiques.

## A — `INFO`

Fait, déclaration, préférence, contrainte, source ou donnée nécessaire.

Exemples :

- audience principale ;
- zone géographique ;
- liste des offres ;
- charte existante ;
- deadline réellement impérative.

## B — `ANALYSIS`

Travail qui transforme plusieurs informations en compréhension nouvelle.

Exemples :

- audit du site existant ;
- analyse concurrentielle ;
- analyse des objections ;
- diagnostic SEO ;
- comparaison de scénarios techniques.

## C — `DECISION`

Arbitrage qui sélectionne une direction et crée une source de vérité active.

Exemples :

- cible prioritaire ;
- direction stratégique retenue ;
- offres à pousser ;
- scope V1 ;
- CMS oui/non ;
- niveau de conformité requis.

## D — `SPEC`

Définition de ce qui doit être construit ou respecté.

Exemples :

- sitemap ;
- page specification ;
- user flow ;
- règles métier ;
- schéma de données ;
- contrat d’intégration ;
- design tokens ;
- responsive behavior.

## E — `VERIFY`

Condition testable qui prouve qu’une exigence ou spécification est respectée.

Exemples :

- critère d’acceptation ;
- scénario de test ;
- exigence WCAG ;
- seuil de performance ;
- test d’envoi réel de formulaire ;
- règle de crawl/indexation.

### Conséquence

Le référentiel maître ne sera jamais seulement :

`Question → Réponse`.

Il sera :

`INFO → ANALYSIS → DECISION → SPEC → VERIFY`, avec retours et dépendances selon le contexte.

---

# 4. Concepts structurants

## 4.1 `DOMAIN`

Famille professionnelle stable.

Exemples : Audience, Competition, Content, Technical Architecture.

Un Domain n’est pas une phase.

## 4.2 `REQUIREMENT ATOM`

Objet atomique de type INFO / ANALYSIS / DECISION / SPEC / VERIFY.

Chaque atom possède ses propres règles d’applicabilité, acquisition, confiance, dépendance et impact de changement.

## 4.3 `DEPENDENCY EDGE`

Lien indiquant qu’un atom, une Gate ou un Deliverable dépend d’un autre élément.

Types de dépendances possibles :

- `REQUIRES` — indispensable ;
- `BENEFITS_FROM` — améliore sans bloquer ;
- `CONDITIONAL_ON` — actif seulement dans certains contextes ;
- `CONFLICTS_WITH` — contradiction à arbitrer ;
- `INVALIDATES` — changement qui rend un élément aval stale ;
- `EVIDENCES` — source/preuve soutenant une analyse ou décision.

## 4.4 `DEPENDENCY GATE`

Seuil logique permettant de débloquer ou figer du travail aval.

Une Gate n’est pas un écran ni une étape utilisateur.

## 4.5 `DELIVERABLE CONTRACT`

Assemblage cohérent de plusieurs atoms destiné à servir une décision ou un handoff.

Un Deliverable peut être matérialisé en vue, document, export ou présentation sans devenir une base de vérité parallèle.

## 4.6 `BLUEPRINT OVERLAY`

Extension conditionnelle du Core pour un type de projet.

Premier overlay : `SITE_VITRINE`.

Futurs overlays possibles : SaaS, app mobile, marketplace, e-commerce, jeu, outil interne, etc.

## 4.7 `CONTEXT OVERLAY`

Sous-ensemble conditionnel transversal.

Exemples :

- `IS_REDESIGN` ;
- `IS_LOCAL_BUSINESS` ;
- `IS_MULTILINGUAL` ;
- `HAS_CMS` ;
- `HAS_AUTH` ;
- `HANDLES_PERSONAL_DATA` ;
- `HAS_PAYMENT` ;
- `SEO_MIGRATION_RISK` ;
- `REGULATED_DOMAIN` ;
- `HAS_TEAM_DECISION`.

---

# 5. Architecture documentaire cible

Le référentiel final ne doit pas être un unique fichier monolithique.

Il doit être composé de sources de vérité séparées mais reliées.

## `00_MASTER_LIFECYCLE.md`

Définit :

- zones IDEA / PROJECT DEFINITION / BUILD READY ;
- frontières ;
- Gates majeures ;
- règles globales.

## `01_DOMAIN_REGISTRY.md`

Définit les domaines professionnels, responsabilités et frontières entre domaines.

## `02_REQUIREMENT_ATOM_SCHEMA.md`

Définit le schéma normatif de chaque atom.

## `03_REQUIREMENT_REGISTRY_CORE.md`

Contient les atoms réellement universels.

## `04_BLUEPRINT_SITE_VITRINE.md`

Contient les atoms et règles spécifiques au site vitrine.

## `05_CONTEXT_OVERLAYS.md`

Contient redesign, local, multilingual, CMS, personal data, regulated, etc.

## `06_DEPENDENCY_GRAPH.md`

Définit les dépendances et Gates de manière calculable.

## `07_DELIVERABLE_CONTRACTS.md`

Définit les assemblages/livrables et leur readiness.

## `08_ACQUISITION_RESOLUTION_MODEL.md`

Définit comment 2b2c résout chaque atom : mémoire, RAW, sources, audit, web, calcul, IA, humain, expert.

## `09_VALIDATION_CONFIDENCE_MODEL.md`

Définit provenance, confiance, conflit, accepted unknown, human decision, freshness.

## `10_CHANGE_IMPACT_MODEL.md`

Définit propagation ciblée et invalidation après changement.

## `11_READY_FOR_DEVELOPMENT_CONTRACT.md`

Définit la Definition of Ready finale et la marge de discrétion laissée aux développeurs.

## `12_REFERENCE_STANDARDS.md`

Référence les normes et guides externes utilisés : accessibilité, sécurité, SEO, performance, privacy lorsque pertinents.

### Règle

`KNOWLEDGE.md` reste un index d’autorité et ne duplique pas ces spécifications.

---

# 6. Trois zones du lifecycle

## ZONE A — IDEA / DECISION

Question centrale :

> **Quel problème/opportunité mérite d’être adressé, pour qui, et quelle direction est la meilleure à poursuivre ?**

La zone Idea peut utiliser des sondes de faisabilité technique, SEO, sécurité ou contenu lorsque cela influence la décision, mais ne fige pas encore l’architecture finale.

Sortie possible : GO vers Project, REVISE, DEEPEN, PAUSE, STOP, INSUFFICIENT INFORMATION.

## ZONE B — PROJECT DEFINITION

Question centrale :

> **Exactement quoi devons-nous construire pour matérialiser la direction choisie ?**

Cette zone transforme une direction sélectionnée en spécification exécutable.

## ZONE C — BUILD READY

Question centrale :

> **Une équipe peut-elle commencer le développement sans reconstruire le projet dans sa tête ?**

Build Ready est une Gate de vérification et d’assemblage, pas une nouvelle conception du produit.

### Hors périmètre du référentiel pré-développement

L’exécution réelle : coding, intégration, QA exécutée, préproduction, release, monitoring post-launch.

Ces activités peuvent avoir des exigences définies avant développement, mais leur exécution appartient au Delivery/Production System.

---

# 7. Domain Registry candidat — 20 domaines

Ces domaines sont exhaustifs par intention mais leur contenu détaillé n’est pas encore rempli dans V0.1.

## D01 — Governance, Stakeholders & Decision Context

Couvre : porteur, décideurs, contributeurs, budget/deadline quand décisionnels, mode de décision, niveaux d’autorité, sources de vérité, contraintes organisationnelles.

Principalement : IDEA + PROJECT.

## D02 — Business Context, Problem & Outcomes

Couvre : contexte business, problème/opportunité, pourquoi maintenant, objectifs, résultat utilisateur, mesure de succès, priorités métier.

Principalement : IDEA.

## D03 — Users, Audiences, Segments & Jobs

Couvre : cibles, segments, jobs-to-be-done, besoins, objections, acquisition, contexte d’usage, evidence utilisateur.

Principalement : IDEA, puis nourrit PROJECT.

## D04 — Existing State, Assets & Evidence

Couvre : site actuel, système existant, analytics, SEO, contenus, offres, marque, assets, preuves, contraintes historiques, dette observable.

IDEA + PROJECT si redesign.

## D05 — Market, Competition, Alternatives & References

Couvre : concurrents directs/indirects, alternatives, standards du marché, références exemplaires, opportunités, faiblesses observées, differentiation space.

Principalement : IDEA.

## D06 — Opportunity, Strategy, Value Proposition & Positioning

Couvre : synthèse evidence, challenge de l’idée, simplification, opportunités, propositions de valeur, positionnements, directions candidates, comparaison, recommandation.

Principalement : IDEA.

## D07 — Offer, Product/Service Model & Scope

Couvre : offres/services retenus, hiérarchie, V1, Later, Out, fonctionnalités macro, limites du produit, exclusions explicites.

IDEA macro → PROJECT détaillé.

## D08 — User Journeys, Conversion & Service Flow

Couvre : parcours principaux, entry points, conversion, objections, proof points, fallback, cross-channel si pertinent.

PROJECT.

## D09 — Information Architecture, Navigation & Page/Screen Model

Couvre : sitemap, navigation, routes conceptuelles, rôle des pages/écrans, relation entre contenus, navigation secondaire, indexabilité contextuelle.

PROJECT.

## D10 — Content, Proof, Media & Content Operations

Couvre : contenu nécessaire, contenu existant, gaps, preuves, médias, droits, ton, content model, ownership éditorial, cycle de mise à jour.

PROJECT.

## D11 — SEO, Discoverability & Migration

Couvre : demande de recherche, intentions, mapping page/requête, crawl/indexation, URL strategy, metadata requirements, structured data si légitime, SEO migration/redirects, local/multilingual discoverability.

PROJECT, avec sondes en IDEA si stratégique.

## D12 — Functional Requirements, Business Rules & UI States

Couvre : fonctionnalités détaillées, règles métier, validations, formulaires, erreurs, loading/empty/success, edge cases, règles de permission fonctionnelles.

PROJECT.

## D13 — Data, Content Model, CMS, Roles & Permissions

Couvre : entités/données, relations, source of truth, ownership, CMS/admin, rôles, permissions, rétention fonctionnelle, imports/exports si pertinents.

PROJECT conditionnel.

## D14 — Integrations, APIs, Notifications & External Services

Couvre : CRM, email, calendrier, paiement, maps, analytics, webhooks, APIs, third-party constraints, failure/fallback behavior, notifications.

PROJECT conditionnel.

## D15 — UX, UI, Brand & Design System Definition

Couvre : wireframes, interaction patterns, responsive, brand constraints, visual direction, tokens, composants, états, motion rules, design fidelity nécessaire au handoff.

PROJECT.

## D16 — Technical Architecture, Platform, Environments & Operations

Couvre : stack, rendering, hosting, deployment model, repository constraints, CMS/backend, build/runtime requirements, environment strategy, backup/restore expectations, maintenance model.

PROJECT ; seulement feasibility probe en IDEA.

## D17 — Security, Privacy, Legal & Compliance

Couvre : données sensibles, consentement, RGPD/privacy, security requirements, authentication/session si applicable, access control, legal claims, cookies/trackers, expert escalation.

PROJECT conditionnel, avec early risk probe en IDEA.

## D18 — Accessibility, Performance, Reliability & Compatibility

Couvre : cible WCAG, keyboard/focus, assistive technologies, performance budgets, Core Web Vitals si pertinent, browser/device support, resilience/degradation, availability requirements.

PROJECT.

## D19 — Measurement, Analytics, Experimentation & Observability

Couvre : KPIs opérationnalisés, événements à mesurer, analytics consent, conversion measurement, Search Console, error/health monitoring requirements, experimentation si nécessaire.

IDEA pour success metrics ; PROJECT pour instrumentation.

## D20 — QA, Acceptance, Delivery Constraints & Handoff

Couvre : acceptance criteria, test matrix, test data/environment needs, dependency readiness, release constraints, handoff package, developer discretion, unresolved accepted unknowns.

BUILD READY.

---

# 8. Major Dependency Gates — candidat

Les Gates suivantes structurent les dépendances. Elles ne sont pas visibles obligatoirement dans l’UX.

## G0 — `BLUEPRINT_FIT_SUFFICIENT`

Le type de projet est assez compris pour charger le bon Blueprint ou détecter un mismatch.

## G1 — `DISCOVERY_FOUNDATION_SUFFICIENT`

Problème/objectifs + cible + contexte + matière existante sont suffisants pour mener des analyses pertinentes sans sélectionner arbitrairement le terrain.

Débloque notamment : audit ciblé, recherche marché, benchmark, analyse utilisateur.

## G2 — `EVIDENCE_CONTEXT_SUFFICIENT`

Les evidence internes/externes utiles sont assez solides pour challenger l’Idea.

Débloque : Opportunity/Strategy work.

## G3 — `STRATEGIC_OPTIONS_READY`

Une ou plusieurs directions réellement distinctes sont formulées avec evidence, hypothèses, trade-offs et feasibility probes appropriés.

## G4 — `IDEA_DECISION_READY`

La décision `GO / REVISE / DEEPEN / PAUSE / STOP` peut être prise honnêtement.

### Frontière officielle

Un `GO` à G4 crée un `Project Definition Draft` basé sur un snapshot de l’Idea Decision Dossier.

Il ne signifie pas `READY_FOR_DEVELOPMENT`.

## G5 — `PRODUCT_DEFINITION_STABLE`

Scope, parcours, IA, contenu requis, SEO stratégique et exigences fonctionnelles structurantes sont cohérents entre eux.

## G6 — `EXPERIENCE_DEFINITION_SUFFICIENT`

Le niveau de wireframe/UI/design requis est assez précis pour que les comportements structurants ne soient pas inventés en développement.

## G7 — `TECHNICAL_NFR_DEFINITION_SUFFICIENT`

Données, intégrations, architecture, sécurité/privacy, accessibilité, performance et contraintes d’environnement sont suffisamment définies selon l’applicabilité.

## G8 — `TRACEABILITY_AND_ACCEPTANCE_READY`

Les exigences importantes possèdent des critères de validation appropriés ; les risques/inconnues sont explicités et acceptés.

## G9 — `READY_FOR_DEVELOPMENT`

Le Build-Ready Contract est satisfait.

---

# 9. Deliverable Contracts — candidat

Les Deliverables ne sont pas des documents indépendants obligatoires ; ils sont des vues matérialisables du même modèle canonique.

## A01 — `IDEA_INTAKE_RECORD`

Raw idea + sources + contexte initial + Blueprint classification.

## A02 — `PROBLEM_OUTCOME_FRAME`

Problème/opportunité + objectifs + résultats utilisateurs + critères de succès + contraintes critiques.

## A03 — `AUDIENCE_NEED_MODEL`

Cibles + besoins/jobs + objections + contextes d’usage + evidence.

## A04 — `CURRENT_STATE_EVIDENCE_PACK`

Baseline interne : existant, données, offres, contenus, SEO, assets, contraintes et observations.

## A05 — `MARKET_COMPETITIVE_LANDSCAPE`

Concurrents + alternatives + références + patterns + gaps/opportunities avec provenance.

## A06 — `OPPORTUNITY_AND_OPTIONS_MAP`

Opportunités + challenge de l’idée + simplifications + directions candidates + trade-offs.

## A07 — `IDEA_DECISION_RECORD`

Direction retenue ou décision Stop/Pause/Revise + raisons + evidence + risques + unknowns.

### A07 marque la frontière Idea → Project en cas de GO.

## A08 — `PROJECT_DEFINITION_BASELINE`

Vision choisie + scope macro + contraintes + Decision Record + sources de vérité.

## A09 — `EXPERIENCE_INFORMATION_ARCHITECTURE_SPEC`

Journeys + sitemap + navigation + pages/screens + conversion + wireframes selon besoin.

## A10 — `CONTENT_DISCOVERABILITY_SPEC`

Content requirements + preuves/médias + content model + SEO + migration content/SEO si applicable.

## A11 — `FUNCTIONAL_DATA_INTEGRATION_SPEC`

Fonctions + business rules + states + data + roles + CMS + integrations + notifications.

## A12 — `DESIGN_DEFINITION`

Brand constraints + visual direction + design system + responsive + component states + motion rules.

## A13 — `TECHNICAL_AND_NFR_DEFINITION`

Architecture + environments + security/privacy + accessibility + performance + reliability/compatibility.

## A14 — `VERIFICATION_ACCEPTANCE_PLAN`

Acceptance criteria + tests nécessaires + preuves attendues + unresolved/accepted unknowns.

## A15 — `BUILD_READY_PROJECT_SPECIFICATION`

Assemblage versionné des contrats nécessaires au handoff développement.

---

# 10. Requirement Atom Schema — candidat

Chaque atom devra au minimum permettre de stocker :

- `id` — identifiant stable ;
- `type` — INFO / ANALYSIS / DECISION / SPEC / VERIFY ;
- `domain_id` ;
- `lifecycle_zone` — IDEA / PROJECT / BUILD_READY ;
- `blueprint_scope` ;
- `context_conditions` ;
- `title` ;
- `statement_or_question` ;
- `purpose` — pourquoi cet atom existe ;
- `risk_if_missing` ;
- `dependencies` ;
- `acquisition_paths` ;
- `human_only_reason` si applicable ;
- `expert_escalation_rule` si applicable ;
- `evidence_required` ;
- `minimum_resolution_by_gate` ;
- `confidence_or_validation_required` ;
- `freshness_policy` ;
- `conflict_policy` ;
- `accepted_unknown_policy` ;
- `defer_policy` ;
- `unlocks` ;
- `deliverables_affected` ;
- `blocking_for` ;
- `change_impact_edges` ;
- `validation_method` ;
- `sensitivity_class` si donnée potentiellement sensible ;
- `examples` ;
- `notes`.

### Pourquoi ces champs

Le moteur doit pouvoir répondre automatiquement :

- Est-ce pertinent maintenant ?
- Est-ce déjà connu ?
- Puis-je l’extraire ?
- Puis-je le rechercher ?
- Puis-je l’inférer temporairement ?
- Dois-je demander à l’utilisateur ?
- À quel niveau de preuve ?
- Qu’est-ce que cela débloque ?
- Que dois-je recalculer si cela change ?
- Est-ce bloquant pour une Gate ou seulement utile ?

---

# 11. Acquisition / Resolution Model

Le référentiel réutilise l’invariant existant : humain en dernier recours.

Ordre de préférence conceptuel :

`MEM → RAW → SRC/AUDIT → WEB/CONN → CALC → AI-H/AI-R → HUM → EXPERT → ACCEPTED_UNKNOWN`

L’ordre exact dépend de l’atom.

Exemples :

- une préférence stratégique interne ne doit pas être recherchée sur le web ;
- un concurrent ne doit pas être demandé à l’utilisateur si une recherche fiable suffit ;
- une obligation juridique complexe peut exiger une escalade expert plutôt qu’une réponse IA définitive.

---

# 12. Validation et maturité

Ne pas créer un pourcentage global.

Chaque atom possède un état de résolution et un niveau minimum dépendant de la Gate/Deliverable.

Le modèle canonique existant de provenance/confiance doit être réutilisé autant que possible plutôt que remplacé.

Conceptuellement, un atom peut être :

- inconnu ;
- déclaré ;
- extrait/observé ;
- hypothèse de travail ;
- evidence-backed ;
- recommandé ;
- accepté comme courant ;
- décidé/frozen dans un snapshot ;
- conflicted ;
- stale ;
- accepted unknown ;
- not relevant.

La même information peut être suffisante comme hypothèse pour explorer et nécessiter une décision humaine pour figer un Project.

---

# 13. Change Impact / Freeze

`Frozen` ne veut pas dire immuable pour toujours.

Cela signifie :

- la version N d’une décision/artifact est la source de vérité du snapshot N ;
- une modification crée une version N+1 ;
- le graphe calcule uniquement les dépendances impactées ;
- les éléments affectés deviennent `REVIEW_REQUIRED` ou `STALE` selon l’impact ;
- la readiness peut être retirée si un blocker réapparaît.

Catégories d’impact proposées :

- `NONE` ;
- `RECHECK` ;
- `RECOMPUTE` ;
- `REVIEW` ;
- `REDECIDE` ;
- `INVALIDATE_DELIVERABLE` ;
- `REVOKE_READY_FOR_DEVELOPMENT`.

Exemple : changer une couleur secondaire ne doit pas invalider l’audience.

Changer B2C → B2B peut invalider positionnement, parcours, IA, contenu, SEO, Candidate et plusieurs critères d’acceptation.

---

# 14. READY_FOR_DEVELOPMENT Contract — première définition

Un dossier peut être `READY_FOR_DEVELOPMENT` si et seulement si :

1. le Blueprint et les Context Overlays applicables sont connus ;
2. une direction Idea a été explicitement sélectionnée ou acceptée ;
3. aucun conflit critique caché ne subsiste ;
4. le scope In / Later / Out est explicite ;
5. les journeys et comportements structurants sont définis ;
6. IA/pages/screens nécessaires sont définis ;
7. les besoins de contenu/preuves/médias sont connus ;
8. les exigences SEO/migration applicables sont définies ;
9. les fonctionnalités et règles métier structurantes sont spécifiées ;
10. les états critiques (loading/empty/error/success/fallback) sont couverts si applicables ;
11. données, ownership, CMS/admin, rôles/permissions sont définis si applicables ;
12. integrations/APIs/notifications et fallbacks sont définis si applicables ;
13. le niveau de définition UX/UI est suffisant pour éviter des décisions produit implicites pendant le code ;
14. l’architecture technique et les contraintes d’environnement sont suffisamment décidées ;
15. sécurité/privacy/legal applicables sont traitées au niveau requis ;
16. accessibilité/performance/compatibility/reliability applicables ont des exigences explicites ;
17. les métriques/instrumentations nécessaires sont spécifiées ;
18. chaque exigence critique possède un mode de validation/acceptance approprié ;
19. les risques et accepted unknowns restants sont visibles, avec owner/résolution future lorsque nécessaire ;
20. la hiérarchie des sources de vérité est explicite ;
21. le package de handoff est versionné ;
22. aucun développeur n’a besoin d’inventer une décision structurante hors de sa discrétion d’implémentation autorisée.

### READY_WITH_ACCEPTED_UNKNOWNS

Un projet peut éventuellement être prêt avec inconnues acceptées si celles-ci :

- ne rendent pas le scope trompeur ;
- ne cachent pas un risque majeur ;
- ont une politique de résolution claire ;
- ne rendent pas impossible un développement cohérent.

---

# 15. Mapping critique du PDF fourni

Le PDF est une source riche, mais sa chronologie ne doit pas être copiée telle quelle.

## À conserver dans IDEA

- objectif ;
- cible ;
- conversion attendue ;
- contraintes structurantes ;
- niveau d’exigence si réellement décisionnel.

## À déplacer/enrichir avant l’arborescence

Le PDF doit être complété par :

- user evidence ;
- audit existant ;
- marché ;
- concurrence ;
- alternatives ;
- références ;
- opportunités ;
- challenge / amélioration de l’idée ;
- directions candidates ;
- comparaison et sélection.

## À conserver dans PROJECT DEFINITION

- arborescence ;
- rôle des pages ;
- contenus/preuves/médias ;
- parcours/objections/conversion ;
- structures des pages ;
- wireframes ;
- direction artistique ;
- composants/design system ;
- SEO requirements ;
- accessibilité/performance/conformité comme exigences ;
- architecture/contraintes techniques.

## À sortir du pré-développement comme exécution

- construction réelle des pages ;
- passes de développement exécutées ;
- QA exécutée ;
- préproduction ;
- mise en ligne ;
- surveillance post-publication.

Leurs exigences peuvent être définies avant dev, mais leurs résultats appartiennent au Delivery/Production lifecycle.

## À traiter comme standards de développement, non comme questions projet universelles

- micro-garde-fous HTML détaillés ;
- conventions spécifiques de repo ;
- commandes build/lint ;
- nettoyage scaffold ;
- règles détaillées de code.

Ils peuvent devenir des policies/standards du profil de delivery, pas des Requirement Atoms utilisateur sauf contexte spécifique.

---

# 16. Audit de Matrix V5 — conclusion architecturale

Matrix V5 reste une base solide pour la zone Idea `SITE_VITRINE` : contexte, objectifs, audience, offre, existing, competition, evidence, positioning, journeys, content, scope, brand, feasibility, risks, governance.

Mais elle ne doit plus être considérée comme le référentiel maître complet `IDEA → READY_FOR_DEVELOPMENT`.

L’architecture cible doit l’absorber dans :

- Domain Registry ;
- Requirement Registry ;
- Blueprint Site Vitrine ;
- Acquisition/Resolution Model ;
- Idea Deliverables.

Les domaines à approfondir au-delà de V5 incluent notamment :

- business rules détaillées ;
- data/content model ;
- roles/permissions ;
- notification behavior ;
- third-party contracts/fallbacks ;
- UI states complets ;
- acceptance criteria atomiques ;
- test traceability ;
- technical architecture readiness ;
- operational/content ownership ;
- delivery/handoff definition ;
- distinction précise requirement vs implementation discretion.

---

# 17. Standards professionnels utilisés comme contrôle — pas comme workflow à copier

## Design Council — Double Diamond

Contrôle : comprendre avant d’assumer, redéfinir le problème, explorer plusieurs solutions, tester/sélectionner.

https://www.designcouncil.org.uk/resources/the-double-diamond/

## GOV.UK Service Manual — Discovery / Alpha

Contrôle : comprendre utilisateurs, problème, contraintes et contexte avant de construire ; tester plusieurs solutions et hypothèses risquées avant Beta/build.

https://www.gov.uk/service-manual/agile-delivery/how-the-discovery-phase-works
https://www.gov.uk/service-manual/agile-delivery/how-the-alpha-phase-works

## W3C WCAG 2.2

Contrôle : accessibilité exprimable en critères testables, adaptée au niveau de conformité choisi.

https://www.w3.org/TR/WCAG22/

## OWASP ASVS

Contrôle : sécurité exprimable comme exigences vérifiables avec profondeur proportionnée au risque.

https://owasp.org/projects/asvs

## Google Search Central

Contrôle : discoverability, crawl/indexation, organisation logique et contenu destiné d’abord aux utilisateurs.

https://developers.google.com/search/docs/fundamentals/seo-starter-guide

## web.dev — Core Web Vitals

Contrôle : performance exprimable en mesures réelles quand elle est pertinente au Projet.

https://web.dev/articles/vitals

---

# 18. Anti-patterns du futur référentiel

Interdits :

- transformer 20 Domains en 20 écrans obligatoires ;
- rendre tous les atoms obligatoires ;
- demander à l’humain ce qui est observable/recherchable ;
- confondre information connue et décision prise ;
- figer le sitemap avant la direction stratégique ;
- figer l’architecture technique avant de connaître les exigences qui la contraignent ;
- exiger un design final pour déclarer tout Projet build-ready lorsque le niveau de fidélité nécessaire est inférieur ;
- transformer OWASP/WCAG/SEO en checklist exhaustive sans applicabilité ;
- demander budget/timeline si la décision n’en dépend pas ;
- imposer concurrence directe lorsqu’il n’existe pas de concurrents comparables ;
- produire un “score de complétude” global arbitraire ;
- déclarer READY simplement parce que des champs sont remplis ;
- laisser une décision structurante être prise implicitement par le développeur sans trace.

---

# 19. Ce qui doit être validé avant de remplir le registre exhaustif

Avant d’écrire les centaines d’atoms, il faut valider :

1. la séparation `IDEA / PROJECT DEFINITION / BUILD READY` ;
2. les cinq types `INFO / ANALYSIS / DECISION / SPEC / VERIFY` ;
3. la distinction Domain / Gate / Deliverable ;
4. les 20 Domains candidats ;
5. les Gates G0→G9 comme logique de dépendance, non comme parcours visible ;
6. la frontière exacte G4 entre Idea et Project ;
7. le schéma du Requirement Atom ;
8. le Build-Ready Contract ;
9. le modèle Core + Blueprint Overlay + Context Overlay ;
10. le principe que le PDF et Matrix V5 sont des sources à absorber/challenger, non les formes finales du référentiel.

Une fois ces points validés, le travail suivant sera :

> remplir et red-teamer chaque Domain atom par atom, en commençant par `SITE_VITRINE`, puis produire le Dependency Graph calculable et les Deliverable Contracts détaillés.
