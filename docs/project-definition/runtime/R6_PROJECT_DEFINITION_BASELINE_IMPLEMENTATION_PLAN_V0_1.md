# 4b4c — R6 PROJECT DEFINITION BASELINE — IMPLEMENTATION PLAN V0.1

Date : 2026-09-13

Statut : **IMPLEMENTED / VALIDATED BASELINE**

## 1. Objet

R6 exécute la transition contrôlée `Approved Idea → Project Definition baseline`.

Il ne crée pas un Project d'exécution. Il transforme uniquement une décision R5 réellement promotable en baseline Project Definition traçable, versionnée et héritant les bons artefacts Idea/Prefiguration sans repartir de zéro.

## 2. Entrée obligatoire

R6 exige :

- un `idea_decision_records_v2` existant ;
- `promotable = true` ;
- outcome `APPROVE_TO_PROJECT` ou `APPROVE_WITH_CHANGES` ;
- Decision Record le plus récent de l'Idea ;
- révision moteur exacte et inchangée ;
- Decision Package gelé et frais ;
- Decision Snapshot exact ;
- aucun feedback de review encore `open` ;
- aucune condition `STRUCTURAL_BLOCKING` non résolue ;
- Project-resolvable conditions reliées à un Requirement + owner_ref ;
- accepted unknowns avec tracking key ;
- un baseline manifest complet ;
- un Promotion Diff ne demandant pas de nouvelle approbation.

## 3. Feedback closure

Une frontière R5 complémentaire `resolve_decision_feedback_v1` clôt explicitement les retours en `resolved` ou `rejected` avec resolver, résolution et audit.

R6 refuse toute promotion tant qu'un feedback du package approuvé reste ouvert.

## 4. Approved Idea Snapshot

R6 crée un `APPROVED_IDEA_SNAPSHOT` immuable contenant notamment :

- Decision Record / decision hash ;
- Decision Package / package hash ;
- Decision Snapshot / snapshot hash ;
- conditions ;
- baseline manifest ;
- promotion diff ;
- classification des artefacts ;
- révision moteur approuvée.

Cette chaîne rend la provenance explicite :
`Idea → Decision Snapshot → Decision Package → Decision Record → Approved Idea Snapshot → Project Definition`.

## 5. Project Definition baseline

`project_definitions` est étendu avec :

- `approved_decision_record_id`
- `decision_package_id`
- `baseline_manifest`
- `promotion_diff`
- `baseline_hash`
- `created_engine_revision`
- `idempotency_key`
- `request_fingerprint`

Une seule Project Definition non superseded peut exister pour une Idea à la fois.

Les champs de baseline/provenance sont immuables après création ; seuls les champs de lifecycle prévus pour les étapes ultérieures peuvent évoluer.

## 6. Baseline manifest

Le manifest doit au minimum contenir :

- vision ;
- decision rationale ;
- business outcomes ;
- approved targets ;
- positioning ;
- macro scope ;
- non-goals ;
- critical constraints ;
- risks ;
- accepted unknowns ;
- source/evidence refs ;
- decision authority.

R6 interdit explicitement les clés d'exécution `milestones`, `tasks`, `actions`, `roadmap`, `execution_owners`.

## 7. Artifact promotion

Table : `project_definition_artifact_promotions`.

Classifications :

- `PROMOTE_DIRECTLY`
- `PROMOTE_AND_DEEPEN`
- `REWORK_TARGETED`
- `DO_NOT_PROMOTE`
- `SUPERSEDE`

Un artefact réellement promu doit :

- provenir du Decision Snapshot exact ;
- être `FOR_DECISION` ;
- être `CONCEPT_NOT_FINAL_SPEC` ;
- être `frozen + fresh` ;
- recevoir un `target_domain` Project.

La promotion crée une nouvelle version d'artefact :

- `purpose_stage = FOR_PROJECT`
- `spec_status = PROJECT_DEFINITION`
- `source_snapshot_id = APPROVED_IDEA_SNAPSHOT`
- `supersedes_artifact_id = source Idea artifact`
- version current/fresh avec hash propre.

Les Decision Deck / Memo ou autres outputs `DECISION_PACKAGE_OUTPUT` ne peuvent donc pas être silencieusement transformés en specs Project.

## 8. RPC

`promote_approved_idea_to_project_definition_v1`

La promotion est atomique, idempotente et stale-safe. Elle crée l'Approved Idea Snapshot, la Project Definition baseline, les promotions d'artefacts et l'audit associé.

RPC `service_role` only.

## 9. Interdiction d'exécution prématurée

R6 vérifie qu'aucun `projects` d'exécution n'est créé par l'opération. Aucun milestone, task, roadmap delivery ou owner d'exécution n'est produit.

R7 pourra approfondir D08–D20 et déterminer Build Ready ; la création d'un vrai Project de delivery reste une décision ultérieure distincte.
