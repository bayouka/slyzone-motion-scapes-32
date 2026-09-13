# 4b4c — R7 BUILD READY — IMPLEMENTATION PLAN V0.1

Date : 2026-09-13

Statut : **IMPLEMENTED / VALIDATED BASELINE**

## 1. But

R7 transforme une `Project Definition` R6 valide en une définition réellement contrôlable jusqu'à `READY_FOR_DEVELOPMENT`.

Le North Star reste :

> Une équipe de développement peut construire le bon produit sans devoir inventer une décision structurelle produit, UX, data, intégration, NFR ou acceptance qui aurait dû être prise avant le développement.

R7 ne crée pas automatiquement un Project d'exécution, un backlog, des milestones ou des tâches.

## 2. Périmètre

R7 couvre les Requirements Project D08→D20 nécessaires aux Gates :

- G8 — `PROJECT_PRODUCT_DEFINITION_STABLE`
- G9 — `PROJECT_EXPERIENCE_DEFINITION_STABLE`
- G10 — `PROJECT_TECH_NFR_STABLE`
- G11 — `TRACEABILITY_AND_ACCEPTANCE_READY`
- G12 — `READY_FOR_DEVELOPMENT`

Le Blueprint YAML reste la définition métier versionnée. La base matérialise seulement l'état courant et les fingerprints nécessaires au runtime.

## 3. Persistance additive

R7 étend `project_definitions` avec :

- `definition_revision`
- `context_fingerprint`
- `initialized_at`
- `build_ready_hash`

R7 relie les nouveaux artefacts Project/Build à leur Project Definition via `idea_artifacts.project_definition_id`.

Tables runtime :

- `project_definition_requirement_states`
- `project_definition_gate_states`
- `project_definition_mutation_receipts`

La mutation reste server-only et passe par des RPCs versionnés/idempotents.

## 4. Matérialisation des Requirements

`initialize_project_definition_runtime_v1` matérialise 28 Requirements Project du Blueprint Site vitrine sans refaire l'Idea.

`SV.PRJ.APPROVED_BASELINE` démarre au niveau `APPROVED_FOR_PROJECT` et référence la baseline R6.

Les Requirements contextuelles peuvent être actives ou `NOT_RELEVANT`. Le changement d'applicabilité passe par `set_project_requirement_applicability_v1` et incrémente la `definition_revision`.

## 5. Niveaux de résolution et autorité

R7 distingue notamment :

- `UNRESOLVED`
- `WORKING_ASSUMPTION`
- `AI_PROPOSED`
- `ACCEPTED_AS_CURRENT`
- `LOCKED_FOR_DEPENDENTS`
- `APPROVED_FOR_PROJECT`
- `EXPERT_SIGNOFF`
- `VERIFIED_PASS`
- `HUMAN_DECISION`
- `ACCEPTED_UNKNOWN`
- `NOT_RELEVANT`
- `FROZEN_FOR_BUILD`

Un niveau générique ne remplace jamais un minimum Gate-specific.

`ACCEPTED_UNKNOWN` reste une représentation légitime d'une inconnue mais ne satisfait pas une spec structurelle obligatoire de G8→G11.

Décisions qui exigent explicitement une autorité humaine autorisée :

- `SV.D16.DELIVERY_APPROACH`
- `SV.D18.ACCESSIBILITY_TARGET`
- `SV.D20.IMPLEMENTATION_DISCRETION`
- `SV.D20.READY_APPROVAL`

`SV.D17.EXPERT_SIGNOFF`, lorsqu'il est applicable, exige `EXPERT_SIGNOFF`, `authority_type=EXPERT`, un signataire et une evidence d'autorité.

`SV.D20.DEVELOPER_AMBIGUITY_AUDIT` exige `VERIFIED_PASS` avec un résultat explicite `PASS`.

## 6. Gates déterministes

`evaluate_project_definition_gates_v1` calcule G8→G12 à partir de l'état exact des Requirements, des blockers et de la `definition_revision`.

G12 n'est READY qu'après création effective du Build Ready Snapshot. Avant cela, le moteur expose séparément `G12_preconditions_ready`.

Aucun pourcentage global ne peut rendre le dossier Build Ready.

## 7. Artefacts Project / Build

R7 produit et versionne :

- A19 — `EXPERIENCE_INFORMATION_ARCHITECTURE_SPEC`
- A20 — `CONTENT_DISCOVERABILITY_SPEC`
- A21 — `FUNCTIONAL_DATA_INTEGRATION_SPEC`
- A22 — `DESIGN_DEFINITION`
- A23 — `TECHNICAL_NFR_DEFINITION`
- A24 — `VERIFICATION_ACCEPTANCE_PLAN`
- A25 — `BUILD_READY_PROJECT_SPECIFICATION`

A19→A24 sont `FOR_PROJECT / PROJECT_DEFINITION`.

A25 seulement est `FOR_BUILD / BUILD_SPEC`.

Chaque artefact possède un `input_fingerprint` calculé depuis les Requirements exactes qui le fondent. Une mutation d'un Requirement source change le fingerprint attendu et rend l'ancienne projection impropre à promotion/finalisation.

A25 dépend en plus :

- de la baseline R6 ;
- de la `definition_revision` ;
- du fingerprint complet Project Definition ;
- des versions/hashes A19→A24 actuellement courantes.

## 8. Build Ready Snapshot

`finalize_build_ready_v1` exige :

- approver humain autorisé ;
- G8, G9, G10 et G11 READY ;
- ambiguity audit PASS ;
- `SV.D20.READY_APPROVAL = HUMAN_DECISION` par le même approver ;
- aucun blocker ouvert ;
- A19→A25 current, fresh et basés sur leurs fingerprints exacts.

La finalisation :

1. crée un `BUILD_READY_SNAPSHOT` immuable ;
2. capture Requirements, Gates, artefacts, risques, accepted unknowns et implementation discretion ;
3. gèle les artefacts A19→A25 ;
4. passe les Requirements applicables/current en `FROZEN_FOR_BUILD` ;
5. passe la Project Definition à `build_ready` ;
6. écrit G12 READY et un audit event.

Elle ne crée aucun Project d'exécution.

## 9. Continuité R6 → R7

Les artefacts hérités créés par R6 comme `FOR_PROJECT / PROJECT_DEFINITION` sont automatiquement reliés à leur `project_definition_id` lorsque leur `source_snapshot_id` correspond à l'`APPROVED_IDEA_SNAPSHOT` actif.

Ce lien devient immuable.

Ainsi R7 approfondit la baseline approuvée ; il ne redémarre pas le travail.

## 10. Sécurité

Les RPCs R7 de mutation/évaluation/finalisation sont exécutables par `service_role` uniquement :

- `initialize_project_definition_runtime_v1`
- `set_project_requirement_applicability_v1`
- `commit_project_requirement_state_v1`
- `evaluate_project_definition_gates_v1`
- `create_project_definition_artifact_v1`
- `promote_project_definition_artifact_v1`
- `finalize_build_ready_v1`

Les utilisateurs authentifiés peuvent seulement lire les Requirement/Gate states lorsqu'ils ont accès à l'Idea via RLS.

`project_definition_mutation_receipts` reste interne au moteur.

## 11. Migrations

- `20260913040538_idea_engine_r7_build_ready_runtime`
- `20260913040724_idea_engine_r7_gate_semantics_hardening`
- `20260913040751_idea_engine_r7_human_decision_authority`
- `20260913040802_idea_engine_r7_r6_artifact_linkage`
- `20260913040853_idea_engine_r7_artifact_rpc_fix`

## 12. Non-objectifs R7

R7 ne réalise pas :

- le cutover frontend/Worker vers le nouveau moteur ;
- la nouvelle UX post-capture ;
- un Project de delivery ;
- un backlog détaillé ;
- des milestones/tâches d'exécution ;
- le choix automatique d'une stratégie de déploiement de cette nouvelle UX.

Ces sujets appartiennent à la phase d'intégration/cutover après validation R0→R7.
