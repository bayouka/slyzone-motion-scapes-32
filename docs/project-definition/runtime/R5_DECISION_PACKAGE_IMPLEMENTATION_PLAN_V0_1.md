# 4b4c — R5 DECISION PACKAGE — IMPLEMENTATION PLAN V0.1

Date : 2026-09-13

Statut : **IMPLEMENTED / VALIDATED BASELINE**

## 1. Objet

R5 fournit la couche décisionnelle entre les artefacts de préfiguration R4 et une éventuelle promotion vers Project Definition.

Elle fige un état exact du dossier dans un `DECISION_SNAPSHOT`, versionne les livrables de présentation, contrôle leur fraîcheur, capture les retours de review et enregistre une décision humaine explicite sans biais GO.

R5 ne crée jamais directement un `project_definitions` ni un Project d'exécution.

## 2. Invariants

- un Decision Package s'appuie sur un `DECISION_SNAPSHOT` immuable ;
- le snapshot référence les versions exactes d'artefacts R4 utilisées ;
- seuls des artefacts `FOR_DECISION` frais et `current/frozen` peuvent entrer dans le snapshot ;
- les sorties du package sont elles-mêmes versionnées comme `FOR_DECISION / DECISION_PACKAGE_OUTPUT` ;
- le package ne peut être déclaré courant s'il est stale ;
- un feedback matériel rend le package stale et incrémente la révision sémantique de l'Idea ;
- un feedback purement cosmétique ne rouvre pas artificiellement l'Idea ;
- les outcomes GO et non-GO sont traités symétriquement ;
- `APPROVE_TO_PROJECT` n'est promotable que si G7 est réellement READY et les conditions structurelles sont résolues ;
- un Decision Record est immuable ;
- aucune décision R5 ne crée encore la Project Definition.

## 3. Persistance

R5 ajoute :

### `idea_decision_packages`
Version, mode, décision demandée, snapshot exact, manifeste d'inputs, artefacts de sortie, hash, fraîcheur/lifecycle et idempotence.

Modes :
- `SOLO_DECISION_BRIEF`
- `TEAM_DECISION_PACKAGE`
- `COMMITTEE_INVESTMENT_PACKAGE`

### `idea_decision_feedback`
Feedback structuré avec auteur, type, cible, materiality, résolution proposée, change impact et révision moteur.

Types :
`NEW_INFO / CORRECTION / IDEA_PROPOSAL / CHANGE_REQUEST / ASSUMPTION_CHALLENGE / RISK / PREFERENCE / QUESTION / DECISION`.

Materiality :
`COSMETIC / LOCAL / SUBSTANTIVE / CRITICAL`.

### `idea_decision_records_v2`
Décision humaine immuable, snapshot/package exacts, outcome, conditions, état G7, fingerprint d'évaluation, caractère promotable et décideur.

Outcomes :
- `APPROVE_TO_PROJECT`
- `APPROVE_WITH_CHANGES`
- `REVISE`
- `DEEPEN_RESEARCH`
- `PAUSE`
- `STOP`
- `INSUFFICIENT_INFORMATION`

## 4. Frontières RPC

### `create_decision_snapshot_v1`
Crée un snapshot immuable sur une révision moteur exacte. Les artefacts R4 courants inclus sont atomiquement gelés et la révision moteur est ajustée une seule fois si ce gel modifie l'état.

### `create_decision_package_v1`
Crée une version de package et ses sorties versionnées :
- `D22.EXECUTIVE_MEMO`
- `D22.DECISION_DECK`
- `D22.PDF_FALLBACK`
- `D22.EVIDENCE_APPENDIX`
- `D22.SPEAKER_NOTES`
- `D22.REVIEW_AGENDA`

### `assess_decision_package_freshness_v1`
Compare la révision du snapshot à la révision courante de l'Idea et contrôle que toutes les sorties sont toujours liées au même snapshot et fraîches.

### `promote_decision_package_v1`
Promouvoit un package draft frais en `current` sans incrémenter la révision sémantique : la présentation est une projection dérivée, pas une nouvelle vérité métier.

### `mark_decision_package_stale_v1`
Marque explicitement le package et ses sorties comme stale.

### `record_decision_feedback_v1`
Enregistre un feedback. `COSMETIC` ne modifie pas la révision ; `LOCAL/SUBSTANTIVE/CRITICAL` incrémentent la révision et rendent le package obsolète.

### `record_idea_decision_v2`
Enregistre la décision humaine finale de cette review. Le record est immuable. Le flag `promotable` n'est vrai que pour un outcome d'approbation réellement autorisé par G7 et les conditions.

## 5. Sécurité

- tables R5 : RLS activée ;
- `authenticated` : `SELECT` seulement via `can_access_idea` ;
- aucune écriture directe navigateur ;
- tous les RPC R5 sont `service_role` only ;
- les auteurs de feedback sont contrôlés côté fonction ;
- le decision owner est limité au créateur de l'Idea ou aux owner/admin du workspace dans cette baseline ;
- le Decision Record est protégé contre update/delete.

## 6. Relation avec R6

R6 peut uniquement promouvoir une Idea lorsque le dernier Decision Record pertinent possède `promotable = true` et référence un snapshot/package frais et gelé.

R6 doit alors créer une `APPROVED_IDEA_SNAPSHOT` et une `project_definitions` baseline, en héritant les artefacts valides selon le Promotion Contract. Il ne doit toujours pas créer automatiquement milestones, tâches ou owners d'exécution.
