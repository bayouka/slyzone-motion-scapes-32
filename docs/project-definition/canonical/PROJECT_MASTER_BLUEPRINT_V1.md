# 4b4c — PROJECT MASTER BLUEPRINT — V1

Date : 2026-09-16  
Statut : **CANONICAL / NORMATIVE**

## 0. Autorité et portée

Ce document est l’autorité canonique pour le référentiel professionnel 4b4c allant de l’Idée jusqu’à `READY_FOR_DEVELOPMENT`.

Il consolide l’audit transversal final D01→D16 et supersède, pour la structure métier cible, `PROJECT_DEFINITION_REFERENCE_ARCHITECTURE_V0_4.md` et `01_DOMAIN_REGISTRY_V0_1.md`, qui restent des sources historiques/migration.

Il ne remplace pas :
- `docs/idea-engine/canonical/IDEA_ENGINE_MASTER_BLUEPRINT_V1.md` pour l’orchestration détaillée pré-GO actuellement implémentée ;
- les contrats runtime validés R0→R7 ;
- les Blueprints machine `SITE_VITRINE@0.4/0.5` tant qu’ils n’ont pas été migrés et revalidés.

Règle de migration : **le nouveau modèle canonique gouverne les évolutions ; le runtime existant reste compatible jusqu’à une migration testée, sans réécriture destructive ni activation implicite.**

---

## 1. North Star

`READY_FOR_DEVELOPMENT` signifie :

> une équipe de développement peut construire le bon produit sans devoir inventer une décision structurante qui aurait dû être prise avant elle.

Le référentiel doit donc rendre explicites et traçables : intention, preuves, hypothèses, recommandations, décisions, scope, exigences, dépendances, applicabilité, responsabilités, qualité, risques, critères d’acceptation, stratégie de vérification, baseline et handoff.

---

## 2. Architecture en trois couches

### 2.1 Core Ontology

Modèle transversal stable, indépendant d’un type de projet : objets, relations, états, provenance, autorités, applicabilité, dépendances, readiness, change impact et handoff.

### 2.2 Blueprint Pack

Spécialise la Core Ontology pour un archétype de projet (`SITE_VITRINE`, puis futurs Blueprints). Il définit les nœuds, règles d’applicabilité, dépendances, profils de readiness, livrables et méthodes de résolution applicables au type de projet.

### 2.3 Project Instance

Instance réelle d’un projet : valeurs courantes, preuves, décisions, exceptions, ownership, états, versions, baselines et Delivery Lots.

Invariant : **les données d’un Project Instance ne modifient jamais silencieusement la définition du Blueprint Pack.**

---

## 3. Domain Registry canonique — D01→D16

| ID | Domaine | Mission |
|---|---|---|
| D01 | Intent & Context | Comprendre l’idée, son contexte, ses déclencheurs et ses contraintes initiales. |
| D02 | Business & Success | Définir la valeur recherchée, les résultats et la manière raisonnable de juger le succès. |
| D03 | Users & Needs | Comprendre les utilisateurs/audiences, besoins, jobs, freins et critères de choix. |
| D04 | Market & Evidence | Confronter les déclarations au réel : existant, marché, alternatives, concurrence, références et preuves. |
| D05 | Offer & Positioning | Définir la direction, la proposition de valeur, l’offre et le positionnement défendables. |
| D06 | Governance & Decisions | Définir qui contribue, qui décide, quelles autorités s’appliquent et comment les décisions sont tracées. |
| D07 | Scope & Priorities | Définir quoi construire, quoi différer, quoi exclure et les engagements de scope. |
| D08 | Content & Assets | Définir contenus, preuves, médias, assets, provenance, ownership et cycle de vie. |
| D09 | SEO & Discoverability | Définir trouvabilité, acquisition organique, indexation, migration et préservation des signaux existants lorsque pertinent. |
| D10 | Information Architecture & UX | Définir structure, navigation, parcours, conversion, surfaces et comportement responsive structurel. |
| D11 | Brand, UI & Interaction | Définir direction visuelle, design system, composants, états visuels, interactions et motion nécessaires au build. |
| D12 | Functional Behaviour | Définir fonctionnalités, règles métier, permissions fonctionnelles, validations, états et cas limites. |
| D13 | Data & Integrations | Définir données, modèles de contenu, rôles/permissions data, APIs, intégrations, notifications et échanges externes. |
| D14 | Architecture & Operations | Définir architecture technique, plateforme, environnements, déploiement, exploitation, observabilité et responsabilités opérationnelles. |
| D15 | Quality, Risk & Compliance | Définir qualité, tests, accessibilité, sécurité, privacy, conformité, performance, compatibilité, résilience, risques et exceptions. |
| D16 | Delivery & Handoff | Définir constructibilité, Dependency Closure, Delivery Lots, DoR/DoD, baseline, backlog traçable, change control et handoff. |

Un Domain est une famille de responsabilités, **jamais une étape UX obligatoire**.

---

## 4. Ontologie canonique minimale

### Définition et état
- `BlueprintDefinition`
- `ProjectInstance`
- `NodeDefinition`
- `ProjectNodeState`

### Faits, preuves et raisonnement
- `ClaimRecord`
- `EvidenceRecord`
- `AssumptionRecord`
- `RecommendationRecord`
- `DecisionRecord`

### Graphe et applicabilité
- `DependencyEdge`
- `ApplicabilityAssessment`
- `ScopeCommitment`
- `ExceptionRecord`

### Gouvernance
- `ActorRole`
- `ResponsibilityAssignment`

### D15
- `QualityRequirement`
- `RiskRecord`
- `ComplianceRequirement`
- `PrivacyProcessingRecord`
- `ThreatScenario`
- `PerformanceBudget`
- `TestCaseDefinition`

`QualityEvidence` est une spécialisation de `EvidenceRecord`, pas une seconde base de vérité.

### D16
- `DeliveryLot`
- `DependencyClosure`
- `OwnershipAssignment`
- `DoRProfile`
- `DoDProfile`
- `BacklogItem`
- `HandoffManifest`
- `BaselineFreeze`
- `ChangeRequest`

---

## 5. Distinctions obligatoires

Les catégories suivantes ne doivent jamais être fusionnées :

- fait/claim ≠ preuve ;
- preuve ≠ hypothèse ;
- hypothèse ≠ recommandation ;
- recommandation ≠ décision ;
- Requirement ≠ Test ;
- Test ≠ Evidence d’exécution ;
- définition d’une exigence ≠ satisfaction après implémentation ;
- état de readiness ≠ progression UX ;
- applicabilité ≠ completion ;
- Project Definition ≠ projet d’exécution.

L’IA peut extraire, analyser, proposer, challenger et recommander ; elle ne s’attribue jamais une autorité humaine requise.

---

## 6. Graphe canonique

Relations normalisées :

`REQUIRES / INFORMS / DERIVED_FROM / SUPPORTS / CHALLENGES / CONTRADICTS / SATISFIES / INVALIDATES / REFERENCES / PRODUCES`.

Chaque `DependencyEdge` possède notamment :
- `relation_type` ;
- `strength: HARD | SOFT` ;
- `source_node` ;
- `target_node` ;
- `applicability` ;
- `rationale` ;
- `provenance`.

Règles :
1. le sous-graphe des dépendances `HARD` doit être acyclique ;
2. les relations informatives/soft peuvent former des cycles ;
3. une modification amont propage `STALE/REVIEW_REQUIRED` uniquement vers les dépendances réellement affectées ;
4. aucun recalcul global n’est requis lorsqu’un impact ciblé est démontrable.

---

## 7. Applicability

`ApplicabilityAssessment.state` utilise :

`APPLICABLE / NOT_APPLICABLE / CONDITIONAL / UNRESOLVED`.

Chaque assessment conserve : cible, contexte, règle/raison, provenance, autorité si nécessaire et version de base.

`NOT_APPLICABLE` n’est jamais un raccourci silencieux pour ignorer une exigence. Il doit être explicable et traçable.

---

## 8. FulfilmentStage

La maturité d’une exigence est séparée de son applicabilité et de son état de décision.

Stages canoniques :

1. `DEFINITION` — l’exigence est définie avec le niveau requis ;
2. `RFD` — elle est suffisamment spécifiée/testable pour autoriser le build ;
3. `IMPLEMENTATION` — elle est implémentée ;
4. `PRE_RELEASE` — elle est vérifiée avant release ;
5. `POST_RELEASE` — elle est vérifiée/monitorée en production lorsque nécessaire.

Un `READY_FOR_DEVELOPMENT` exige principalement les stages `DEFINITION/RFD`; il ne prétend pas que l’implémentation ou les tests d’exécution sont déjà terminés.

---

## 9. Formal Gates — seulement six transitions de phase

Les anciennes micro-gates deviennent des `ReadinessPredicate` sauf lorsqu’elles représentent une vraie transition d’autorité/lifecycle.

### G0 — `BLUEPRINT_FIT`
Le type de projet est suffisamment identifié pour appliquer un Blueprint Pack ou déclarer un mismatch.

### G1 — `IDEA_DECISION_READY`
Le dossier est suffisamment mûr pour permettre une décision honnête, y compris `GO / REVISE / DEEPEN / PAUSE / STOP / INSUFFICIENT_INFORMATION`.

### G2 — `GO_PROJECT`
Une autorité humaine compétente approuve explicitement la création de la Project Baseline. GO n’est jamais inféré par l’IA.

### G3 — `PROJECT_BASELINE`
La Project Baseline versionnée existe, reprend sélectivement les éléments actifs approuvés et exclut les éléments rejetés/superseded comme vérité courante.

### G4 — `RFD_LOT`
Un `DeliveryLot` précis satisfait sa Dependency Closure et sa Definition of Ready.

### G5 — `RFD_PROJECT`
Tous les Delivery Lots requis pour le périmètre RFD du projet sont cohérents et un HandoffManifest/baseline projet peuvent être gelés.

---

## 10. Readiness Predicates

Les predicates sont diagnostiques/composables ; ils ne sont pas des transitions de phase autonomes.

Catalogue minimal V1 :

- `FOUNDATION_READY`
- `EVIDENCE_READY`
- `STRATEGY_READY`
- `PREFIGURATION_READY`
- `DECISION_PACKAGE_READY`
- `PROJECT_PRODUCT_READY`
- `PROJECT_EXPERIENCE_READY`
- `PROJECT_TECH_READY`
- `TRACEABILITY_READY`
- `QUALITY_REQUIREMENTS_DEFINED`
- `TESTABILITY_READY`
- `DEPENDENCY_CLOSURE`
- `CRITICAL_TBD_CLOSURE`
- `OWNERSHIP_CLOSURE`
- `BASELINE_READY`
- `HANDOFF_INTEGRITY`

Une UI peut projeter ces résultats, mais ne doit pas transformer leur nombre en pourcentage global de projet.

---

## 11. ScopeCommitment

`ScopeCommitment` remplace les listes informelles de fonctionnalités lorsqu’un engagement doit être suivi.

États minimaux :

`IN_SCOPE / LATER / OUT_OF_SCOPE / NOT_RECOMMENDED / CONDITIONAL`.

Chaque engagement relie besoin, valeur, dépendances, rationale, décision/source, criticité et version.

---

## 12. Exceptions

Une dérogation à une exigence utilise `ExceptionRecord` et contient au minimum :

- exigence concernée ;
- raison ;
- impact ;
- mesure compensatoire ;
- autorité d’acceptation ;
- conditions ;
- expiration/réévaluation ;
- statut.

Une exception ne signifie jamais « ignoré ».

---

## 13. D15 — Quality / Risk / Compliance

La qualité est définie avant l’implémentation :

`Requirement → critère mesurable → méthode de vérification → implémentation → preuve d’exécution`.

Règles structurantes :
- les exigences critiques ont des critères mesurables ;
- sécurité/privacy/compliance sont évaluées par applicabilité ;
- un risque conserve son risque résiduel et son autorité d’acceptation ;
- les budgets performance sont contextualisés ;
- un `TestCaseDefinition` décrit le test attendu, pas un faux résultat anticipé ;
- les preuves d’exécution sont attachées après build au `EvidenceRecord` correspondant.

---

## 14. D16 — Delivery / Handoff

### DeliveryLot
Un lot est l’unité de passage au développement. Le projet peut avancer par lots, à condition que chaque lot ferme ses dépendances transitives.

### DependencyClosure
Doit détecter au minimum : dépendances directes/transitives non résolues, `STALE`, conflits, Critical TBD et ownership gaps.

### RFD dérivé
`READY_FOR_DEVELOPMENT` n’est jamais un statut manuel.

Un lot RFD exige au minimum :
- scope identifié ;
- Dependency Closure complète ;
- décisions critiques compatibles build ;
- aucun conflit/stale/Critical TBD bloquant ;
- acceptance criteria ;
- stratégie de vérification ;
- exigences D15 applicables ;
- ownership critique ;
- exceptions bloquantes résolues ;
- baseline versionnée ;
- `HandoffManifest` générable sans erreur.

### BaselineFreeze et ChangeRequest
Après freeze, une modification structurante passe par `ChangeRequest`, analyse d’impact et nouvelle baseline. Les dépendances impactées deviennent ciblément `STALE/REVIEW_REQUIRED` jusqu’à réconciliation.

### Documents
Specs, backlog, QA plan et handoff sont des **projections du graphe canonique**, jamais des sources de vérité parallèles.

---

## 15. Compatibility / migration depuis V0.4

L’ancienne architecture D01→D22 reste une source historique et un mapping de migration. Elle ne doit plus servir de structure cible pour de nouveaux contrats.

Consolidation principale :
- ancien D01/D02 → nouveaux D01/D02/D06 selon nature ;
- ancien D03 → nouveau D03 ;
- anciens D04/D05 → nouveau D04 ;
- ancien D06 + partie D07 → nouveau D05 ;
- ancien D07 → nouveau D07 ;
- ancien D10 → nouveau D08 ;
- ancien D11 → nouveau D09 ;
- anciens D08/D09 → nouveau D10 ;
- ancien D15 → nouveau D11 ;
- ancien D12 → nouveau D12 ;
- anciens D13/D14 → nouveau D13 ;
- ancien D16 + opérations/observabilité pertinentes → nouveau D14 ;
- anciens D17/D18/D19 + QA/acceptance pertinente → nouveau D15 ;
- ancien D20 + handoff/change control → nouveau D16 ;
- anciens D21/D22 deviennent des responsabilités transversales rattachées aux domaines concernés, sans Domain supplémentaire.

Cette consolidation ne réécrit pas silencieusement les IDs déjà persistés. Toute migration runtime doit fournir un mapping explicite et une preuve de compatibilité.

---

## 16. Invariants normatifs

1. Idea ≠ Project.
2. GO explicite avant Project Definition opérationnelle.
3. Core Ontology ≠ Blueprint Pack ≠ Project Instance.
4. Une seule vérité canonique ; les documents sont des projections.
5. Provenance et historique ne sont jamais écrasés silencieusement.
6. IA inference ≠ human truth.
7. Requirement exists ≠ user question.
8. Human question = last-mile quand l’automatisation fiable est épuisée.
9. Formal Gate ≠ Readiness Predicate.
10. HARD dependency graph acyclique.
11. Applicability séparée de fulfilment/readiness.
12. Stale-safety et recompute ciblé obligatoires.
13. RFD est dérivé, jamais coché manuellement.
14. Requirement ≠ Test ≠ Evidence.
15. Critical TBD = 0 pour le scope d’un lot RFD.
16. Toute décision/exception critique connaît son autorité.
17. Le build ne doit pas inventer une décision structurante produit.
18. Une modification post-freeze structurante passe par ChangeRequest.
19. Aucun Blueprint ne prétend couvrir un archétype qu’il ne sait pas modéliser.
20. Les anciens contrats restent compatibles jusqu’à migration validée ; aucune rupture volontaire sans tests.

---

## 17. Contrat machine

La projection machine normative de ce document est :

`docs/project-definition/machine/MASTER_BLUEPRINT_V1.json`

Le contrôle de cohérence minimal est :

`scripts/master-blueprint-v1-check.mjs`

Toute évolution structurelle de ce Master Blueprint doit mettre à jour les deux ensemble.