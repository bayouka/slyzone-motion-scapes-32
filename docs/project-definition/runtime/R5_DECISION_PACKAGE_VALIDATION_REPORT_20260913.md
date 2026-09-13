# 4b4c — R5 DECISION PACKAGE — VALIDATION REPORT

Date : 2026-09-13

Statut : **PASS_DECISION_PACKAGE_BASELINE**

Migrations validées :
- `20260913035101_idea_engine_r5_decision_package`
- `20260913035423_idea_engine_r5_decision_audit_fix`

## 1. Résultat

R5 est validé comme baseline du package de décision, du snapshot de décision, de la fraîcheur du package, du feedback de review et de l'enregistrement d'une décision humaine explicite.

La couche garantit qu'une décision est prise sur des artefacts versionnés et frais, et qu'une approbation n'est pas automatiquement assimilée à la création d'un Project.

## 2. Scénarios transactionnels exécutés

Tous les scénarios ont été exécutés contre le schéma live dans une transaction explicitement `ROLLBACK` :

1. création/promotion d'un artefact R4 de préfiguration ;
2. création d'un `DECISION_SNAPSHOT` exact ;
3. gel automatique de l'artefact utilisé et incrément contrôlé de `engine_revision` ;
4. retry identique du snapshot → même snapshot ;
5. création d'un `TEAM_DECISION_PACKAGE` avec Executive Memo + Decision Deck ;
6. retry identique du package → même package ;
7. package initial détecté `fresh` ;
8. promotion `draft → current` sans mutation sémantique de l'Idea ;
9. feedback `COSMETIC` → pas d'incrément de révision, package non rendu stale ;
10. feedback `SUBSTANTIVE` → incrément de révision et package rendu stale ;
11. freshness check détecte effectivement le package stale ;
12. création d'un nouveau snapshot/package après changement ;
13. tentative `APPROVE_TO_PROJECT` avec G7 non prêt → rejet `APPROVAL_NOT_PROMOTABLE` ;
14. outcome `STOP` accepté et correctement non promotable ;
15. nouveau package frais puis `APPROVE_TO_PROJECT` avec G7 ready + conditions résolues → `promotable = true` ;
16. vérification qu'aucune `project_definitions` n'est créée par R5 ;
17. tentative d'altérer un Decision Record → rejet `DECISION_RECORD_IMMUTABLE` ;
18. rollback final propre.

Résultat : `R5_TRANSACTIONAL_TEST_PASS` / `rollback_clean = true`.

## 3. ACL / sécurité

Vérifications live :

- `idea_decision_packages`, `idea_decision_feedback`, `idea_decision_records_v2` : `authenticated = SELECT` uniquement ;
- aucune écriture directe `anon/authenticated` ;
- RPC R5 : `EXECUTE` uniquement pour `service_role` et `postgres` ;
- RLS de lecture reliée à `can_access_idea` ;
- autorisation auteur de feedback vérifiée dans le RPC ;
- autorité de décision vérifiée dans le RPC ;
- décision enregistrée de manière immuable.

## 4. Neutralité de décision

Validé explicitement :

- `STOP` est un outcome valide ;
- `REVISE`, `DEEPEN_RESEARCH`, `PAUSE`, `INSUFFICIENT_INFORMATION` restent non promotables ;
- `APPROVE_TO_PROJECT` n'est pas privilégié et échoue si G7 n'est pas prêt ;
- `APPROVE_WITH_CHANGES` n'est promotable que lorsque les conditions structurantes sont résolues et G7 ready.

## 5. Freshness / review

Le package est rattaché à un snapshot immuable et à une révision moteur exacte.

Un retour cosmétique ne rouvre pas artificiellement le dossier. Un retour matériel (`LOCAL/SUBSTANTIVE/CRITICAL`) modifie la révision de l'Idea et invalide le package afin qu'une présentation obsolète ne puisse pas être utilisée comme base de décision.

## 6. Correction forward-only

Lors de la synchronisation GitHub, une omission de `entity_type` a été détectée dans la copie initiale de la fonction `record_idea_decision_v2` du fichier de migration canonique, alors que la fonction live contenait le contrat d'audit correct.

Conformément à la discipline de migration, la migration déjà appliquée n'a pas été réécrite. Une migration corrective additive `20260913035423_idea_engine_r5_decision_audit_fix` a été appliquée et ajoutée au dépôt. Le schéma final reconstruit depuis GitHub converge donc vers l'état live attendu.

La fonction live a été vérifiée après correction : le contrat `audit_events.entity_type` est présent.

## 7. Limites volontaires

R5 ne fait pas encore :

- création de `APPROVED_IDEA_SNAPSHOT` ;
- création de Project Definition baseline ;
- promotion/deepening des artefacts vers `FOR_PROJECT` ;
- spécification détaillée D08–D20 ;
- Build Ready ;
- création d'un Project d'exécution/backlog ;
- nouvelle UX post-capture.

## 8. Décision

**R5 = PASS_DECISION_PACKAGE_BASELINE**.

Prochaine étape autorisée : **R6 — Approved Idea → Project Definition baseline / artifact promotion**.
