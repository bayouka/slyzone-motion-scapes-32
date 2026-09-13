# 4b4c — PROJECT DEFINITION REFERENCE ARCHITECTURE — V0.3

Date : 2026-09-13

Statut : **CANDIDATE D’ARCHITECTURE DOCUMENTAIRE — NON CANONIQUE / À RED-TEAMER**

Supersède comme candidat : `PROJECT_DEFINITION_REFERENCE_ARCHITECTURE_V0_2.md`.

Motif V0.3 : intégrer explicitement la **préfiguration de l’Idée**, le **Decision Package / présentation**, la **boucle de feedback d’équipe**, les **projections/business case conditionnels** et un modèle de **progressive lock/freeze** plus précis.

---

# 1. North Star

Le référentiel doit transformer une idée brute en un dossier tel que :

> **quand le dossier est READY_FOR_DEVELOPMENT, l’équipe de développement peut construire le bon produit sans devoir inventer une décision structurante qui aurait dû être prise avant elle.**

Mais avant de créer un Project, 4b4c doit aussi pouvoir transformer une direction stratégique en **concept suffisamment tangible pour être compris, challengé et approuvé par un décideur ou une équipe**.

Donc la chaîne n’est plus :

`Idea abstraite → GO → Project détaillé`.

Elle devient :

`Idea → Discovery → Evidence → Options → Préfiguration → Decision Package → Review/feedback → Approved Idea → Project Definition → Build Ready`.

---

# 2. Le référentiel reste un graphe, pas un wizard

Le moteur manipule des atoms :

`INFO → ANALYSIS → DECISION → SPEC → VERIFY`.

Les Domains, Gates et Deliverables organisent ces atoms mais ne créent pas automatiquement des écrans ni un questionnaire séquentiel.

Un travail aval peut commencer lorsque ses dépendances ont un niveau de stabilité suffisant ; il n’a pas besoin d’attendre que tout le dossier soit terminé.

---

# 3. Zones de lifecycle V0.3

## Z0 — CAPTURE / BLUEPRINT FIT

But : persister le brut, charger le bon Blueprint et récupérer les sources existantes.

## Z1 — IDEA DISCOVERY FOUNDATION

But : comprendre suffisamment le business, le problème, la cible, l’intention, les contraintes et l’existant pour lancer des analyses fiables.

## Z2 — IDEA EVIDENCE & MARKET

But : auditer l’existant, rechercher marché/concurrence/alternatives/références, synthétiser preuves, besoins, opportunités et contraintes.

## Z3 — IDEA STRATEGY & OPTIONS

But : challenger l’idée initiale, produire des directions distinctes, comparer valeur / différenciation / complexité / risques / faisabilité et identifier une ou plusieurs directions à préfigurer.

## Z4 — IDEA PREFIGURATION / CONCEPT ALPHA

But : rendre la direction tangible **avant approbation Project** avec seulement la profondeur utile à la décision.

Peut produire, selon pertinence :

- parcours utilisateur conceptuel ;
- sitemap / screen map conceptuel ;
- pages/surfaces principales et leur rôle ;
- macro-fonctionnalités ;
- éléments de contenu/message représentatifs ;
- SEO/opportunités de discoverability macro ;
- direction visuelle / moodboard / références / anti-références ;
- maquettes haute fidélité représentatives ;
- prototype conceptuel ;
- feasibility probes ;
- architecture envelope, pas architecture finale ;
- estimation/coût/délai/projection si la décision l’exige.

Ces artifacts sont **PROVISIONAL / FOR_DECISION**, pas Build-Ready.

## Z5 — IDEA DECISION PACKAGE & REVIEW

But : assembler la preuve, la stratégie et la préfiguration dans un dossier compréhensible et professionnel ; le présenter ; capturer objections, corrections, idées et décisions.

Résultats possibles :

- `APPROVE_TO_PROJECT` ;
- `APPROVE_WITH_CHANGES` ;
- `REVISE` ;
- `DEEPEN_RESEARCH` ;
- `PAUSE` ;
- `STOP` ;
- `INSUFFICIENT_INFORMATION`.

## Z6 — APPROVED IDEA → PROJECT BASELINE

Après intégration des changements approuvés, créer un snapshot Idea approuvé et le `Project Definition Draft`.

Le Project **hérite** des artifacts de préfiguration encore valides ; il ne les recrée pas par défaut.

## Z7 — PROJECT DEFINITION

But : transformer les artifacts conceptuels en spécifications complètes et cohérentes.

## Z8 — BUILD READY

But : vérifier traçabilité, acceptance, risques, owners et handoff.

---

# 4. Progressive Lock / Freeze Model

Le mot `freeze` ne doit plus être binaire.

## `WORKING`

Information ou artifact encore exploratoire.

## `VALIDATED_CURRENT`

Accepté comme vérité/direction actuelle ; peut être utilisé pour travailler.

## `LOCKED_FOR_DEPENDENTS`

Assez stable pour que des travaux aval s’appuient dessus. Une modification reste possible mais déclenche `Change Impact` et rend les descendants concernés `REVIEW_REQUIRED/STALE`.

## `FROZEN_IN_DECISION_SNAPSHOT`

Version immuable utilisée dans un Decision Package / présentation précise. Le dossier actif peut ensuite évoluer ; le snapshot reste historiquement exact.

## `APPROVED_FOR_PROJECT`

Élément approuvé après la Review et transmis comme baseline au Project.

## `FROZEN_FOR_BUILD`

Spécification incluse dans la version `READY_FOR_DEVELOPMENT`.

États complémentaires :

- `SUPERSEDED`
- `REVIEW_REQUIRED`
- `STALE`
- `REJECTED`

### Règle importante

Business / problème / cible peuvent devenir `LOCKED_FOR_DEPENDENTS` tôt si suffisamment validés.

Ils ne deviennent jamais **irrévocables** : un audit ou une evidence nouvelle peut justifier leur réouverture. Le système doit alors expliquer l’impact et recalculer uniquement les descendants concernés.

---

# 5. Gates internes V0.3

## G0 — `BLUEPRINT_FIT_SUFFICIENT`

Blueprint/overlay correct ou mismatch déclaré.

## G1 — `FOUNDATION_LOCKABLE`

Business / problème / objective / target / contexte sont assez solides pour être `LOCKED_FOR_DEPENDENTS` et lancer Evidence/Market sans deviner les fondations.

## G2 — `EVIDENCE_CONTEXT_SUFFICIENT`

Existant + evidence + marché/alternatives/concurrence sont assez fiables pour challenger l’idée.

## G3 — `STRATEGIC_OPTIONS_READY`

Directions candidates + trade-offs + risques + feasibility probes pertinents disponibles.

## G4 — `PREFIGURATION_TARGET_SELECTED`

Une ou plusieurs directions méritent d’être rendues tangibles pour décision.

Ce n’est pas un GO Project.

## G5 — `DECISION_CONCEPT_READY`

La profondeur conceptuelle nécessaire à la décision est disponible : scope macro + parcours/sitemap conceptuel + fonction/content/design preview selon pertinence + feasibility + projections si nécessaires.

## G6 — `DECISION_PACKAGE_READY`

Les éléments sont sourcés, cohérents, versionnés et communicables ; le deck/brief peut être présenté.

## G7 — `IDEA_APPROVAL_READY`

Feedback de Review traité ; decision owner peut approuver, réviser, approfondir, pauser ou stopper.

`APPROVE_TO_PROJECT` à G7 crée le Project Definition Draft.

## G8 — `PROJECT_PRODUCT_DEFINITION_STABLE`

Scope détaillé + journeys + IA + content + SEO + functional/data/integrations suffisamment définis.

## G9 — `PROJECT_EXPERIENCE_DEFINITION_STABLE`

UX/UI/brand/responsive/states suffisamment définis.

## G10 — `PROJECT_TECH_NFR_STABLE`

Architecture + security/privacy/legal + accessibility/performance/reliability applicables suffisamment définis.

## G11 — `TRACEABILITY_AND_ACCEPTANCE_READY`

Requirements critiques → specs → verify/acceptance ; risks/unknowns/owners traités.

## G12 — `READY_FOR_DEVELOPMENT`

Handoff versionné ; aucun choix structurant non assumé ne doit être réinventé par le développement.

---

# 6. Domain Registry V0.3 — 22 domaines

| ID | Domaine | Lifecycle dominant |
|---|---|---|
| D01 | Governance, Stakeholders & Decision Context | IDEA + PROJECT |
| D02 | Business Context, Problem & Outcomes | IDEA |
| D03 | Users, Audiences, Segments & Jobs | IDEA → PROJECT |
| D04 | Existing State, Assets & Evidence | IDEA + PROJECT |
| D05 | Market, Competition, Alternatives & References | IDEA |
| D06 | Opportunity, Strategy, Value Proposition & Positioning | IDEA |
| D07 | Offer, Product/Service Model & Scope | IDEA macro → PROJECT détaillé |
| D08 | User Journeys, Conversion & Service Flow | IDEA prefiguration → PROJECT |
| D09 | Information Architecture, Navigation & Page/Screen Model | IDEA prefiguration → PROJECT |
| D10 | Content, Proof, Media & Content Operations | IDEA prefiguration → PROJECT |
| D11 | SEO, Discoverability & Migration | IDEA probe/prefiguration → PROJECT |
| D12 | Functional Requirements, Business Rules & UI States | IDEA macro → PROJECT |
| D13 | Data, Content Model, CMS, Roles & Permissions | PROJECT, probe IDEA si critique |
| D14 | Integrations, APIs, Notifications & External Services | PROJECT, probe IDEA si critique |
| D15 | UX, UI, Brand & Design System Definition | IDEA visual concept → PROJECT |
| D16 | Technical Architecture, Platform, Environments & Operations | IDEA feasibility envelope → PROJECT |
| D17 | Security, Privacy, Legal & Compliance | IDEA risk probe → PROJECT |
| D18 | Accessibility, Performance, Reliability & Compatibility | IDEA constraints probe → PROJECT |
| D19 | Measurement, Analytics, Experimentation & Observability | IDEA success/projection → PROJECT |
| D20 | QA, Acceptance, Delivery Constraints & Handoff | BUILD READY |
| D21 | Business Case, Economics, Forecasts & Scenario Models | IDEA decision conditionnel |
| D22 | Decision Package, Presentation, Review & Approval | IDEA decision / team governance |

---

# 7. Prefiguration Overlay

Le `PREFIGURATION_OVERLAY` permet d’activer des atoms **préliminaires** de D08–D19 avant la création du Project.

Il ne copie pas les futures specs Project.

Il produit des artifacts `FOR_DECISION` :

- `CONCEPT_JOURNEY`
- `CONCEPT_SITEMAP`
- `CONCEPT_PAGE_MODEL`
- `CONCEPT_CAPABILITY_SET`
- `CONCEPT_CONTENT_MESSAGE`
- `CONCEPT_SEO_OPPORTUNITY`
- `VISUAL_DIRECTION`
- `HI_FI_CONCEPT_MOCKUP`
- `CONCEPT_PROTOTYPE`
- `FEASIBILITY_ENVELOPE`
- `SCENARIO_PROJECTION`

### Promotion après approbation

Après `APPROVE_TO_PROJECT` :

- artifact valide et suffisamment précis → `PROMOTE_TO_PROJECT_BASELINE` ;
- artifact utile mais incomplet → `IMPORT_AS_ACCEPTED_CURRENT` puis approfondir ;
- artifact impacté par feedback → `REVIEW_REQUIRED` ;
- artifact rejeté → `SUPERSEDED/REJECTED`.

Le Project ne recommence jamais automatiquement à zéro.

---

# 8. Visual Intent / Design Preview avant GO

Une visualisation peut être nécessaire pour qu’un décideur comprenne réellement la proposition.

Avant G5, 4b4c peut proposer une capture rapide de l’intention visuelle :

- contraintes de marque existantes ;
- ambiance souhaitée ;
- références appréciées ;
- anti-références ;
- degré de sobriété/expressivité/premium/etc. ;
- contraintes d’accessibilité importantes.

La meilleure UX n’est pas forcément un questionnaire : 2b2c peut générer 2–3 territoires visuels et demander un choix/correction.

Les maquettes haute fidélité produites ici servent à :

- rendre l’idée compréhensible ;
- provoquer des réactions utiles ;
- comparer des directions ;
- détecter des problèmes de structure ;
- enrichir la présentation.

Elles sont `FOR_DECISION`, jamais présentées comme UI finale.

---

# 9. D21 — Business Case / projections — principe

Les chiffres ne sont produits que s’ils servent la Decision Question.

Interdit : fausse précision, TAM/SAM/SOM décoratif, ROI inventé.

Selon le contexte, 2b2c peut produire :

- baseline connue ;
- coût actuel du problème ;
- trafic/leads/conversion observés ;
- scénarios pessimiste / central / haut ;
- hypothèses de conversion ;
- valeur par lead/vente si fournie ;
- cost envelope ;
- timeline envelope ;
- sensitivity analysis ;
- break-even ou ROI uniquement si inputs suffisants ;
- market sizing uniquement si source/méthode crédible et utile.

Toute projection doit conserver :

`INPUTS → ASSUMPTIONS → FORMULA → OUTPUT RANGE → CONFIDENCE → WHAT_COULD_CHANGE_THIS`.

---

# 10. D22 — Decision Package / Presentation / Review

Une présentation n’est pas une décoration finale ; c’est un instrument de décision.

## Modes

### `SOLO_DECISION_BRIEF`

Version courte : memo + visual concept + Decision Record.

### `TEAM_DECISION_PACKAGE`

Default si plusieurs décideurs/reviewers.

### `COMMITTEE_INVESTMENT_PACKAGE`

Plus complet si budget/finance/approval formel le justifie.

## Artifacts potentiels

- Executive Decision Memo ;
- Problem & Outcome Frame ;
- Audience/Need summary ;
- Current State Audit ;
- Market & Competitive Study ;
- Opportunity / Strategic Options ;
- Recommended Direction ;
- Concept Prefiguration Pack ;
- Visual Direction + mockups/prototype ;
- Feasibility & Risk Note ;
- Business Case / Scenario Model si pertinent ;
- Decision Deck `.pptx` ;
- PDF fallback ;
- Evidence Appendix ;
- Review Agenda ;
- Review Feedback Log ;
- Final Decision Record.

---

# 11. Review Feedback Loop

Pendant ou après la présentation, chaque retour est capturé comme un objet, pas comme une note libre perdue.

Types :

- `NEW_INFO`
- `CORRECTION`
- `IDEA_PROPOSAL`
- `CHANGE_REQUEST`
- `ASSUMPTION_CHALLENGE`
- `RISK`
- `PREFERENCE`
- `QUESTION`
- `DECISION`

Workflow :

`CAPTURE FEEDBACK → classify → map affected atoms/artifacts → assess impact → propose resolution → authorized decision → targeted recomputation → regenerate changed decision artifacts only`.

Un commentaire de présentation ne modifie jamais silencieusement la baseline.

---

# 12. AI vs Human Resolution Classes

## `AUTO_SOURCE_FACT`

2b2c peut remplir automatiquement depuis une source fiable ; l’utilisateur peut corriger sans confirmation systématique.

Ex. pages actuelles, prix affichés, concurrents publics, sitemap actuel.

## `AUTO_DERIVED`

Calcul ou déduction déterministe ; éditable.

## `AI_HYPOTHESIS`

Hypothèse réversible clairement étiquetée ; suffisante pour explorer si risque faible.

## `AI_RECOMMENDATION`

2b2c recommande mais ne transforme pas automatiquement en décision humaine.

## `HUMAN_INTENT`

Seul le décideur connaît l’intention : objectif réel, offre à pousser, budget hard cap, deadline imposée, priorité de cible.

## `HUMAN_PREFERENCE`

Préférence subjective pertinente : direction visuelle, niveau d’audace, certaines contraintes de marque.

## `HUMAN_DECISION`

Arbitrage qui engage la direction, le Project ou une contrainte structurante.

## `EXPERT_REQUIRED`

Sujet à conséquence élevée qui nécessite expert spécialisé : juridique, sécurité avancée, réglementation sectorielle, etc.

### Règle UX future

Ne jamais demander à l’utilisateur de confirmer chaque atom auto-résolu.

Exiger son intervention principalement pour :

- intention interne inconnue ;
- conflit matériel ;
- préférence réellement structurante ;
- décision engageante ;
- information privée non accessible ;
- approbation formelle.

---

# 13. Change Intelligence renforcée

Exemple : `target.primary` est `LOCKED_FOR_DEPENDENTS`.

Une nouvelle evidence suggère un segment différent.

Le système ne change pas la cible automatiquement :

1. créer `REVIEW_REQUIRED` sur le target ;
2. montrer la nouvelle evidence ;
3. proposer conserver / modifier / segmenter ;
4. si modification approuvée : rendre stale uniquement les descendants concernés, notamment market research, positioning, prefiguration, projections et presentation ;
5. recalcul ciblé ;
6. conserver les snapshots historiques.

---

# 14. Ready for Development reste une autre frontière

L’approbation d’une Idea après une belle présentation ne signifie pas Build Ready.

Le Project doit encore approfondir :

- exact scope ;
- user journeys détaillés ;
- IA/routes ;
- page/screen specs ;
- content model et ownership ;
- functional/business rules ;
- data/roles/permissions ;
- integrations/contracts ;
- UI states/edge cases ;
- final design definition ;
- technical architecture ;
- security/privacy/legal ;
- accessibility/performance/reliability ;
- analytics/observability ;
- acceptance/tests/handoff.

Mais il doit réutiliser les artifacts préfigurations validés au lieu de les ignorer.

---

# 15. Prochain travail

Avant promotion canonique :

1. créer le `PREFIGURATION + DECISION PACKAGE ATOM REGISTRY` ;
2. créer D21/D22 détaillés ;
3. red-teamer la boucle Review sur équipe, solo, comité, désaccord tardif et feedback contradictoire ;
4. red-teamer la promotion d’artifacts Idea → Project ;
5. mettre à jour les Project registries pour accepter les baselines promues ;
6. seulement ensuite envisager UX.
