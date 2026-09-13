# 4b4c — R6 PROJECT DEFINITION BASELINE — VALIDATION REPORT

Date : 2026-09-13

Statut : **PASS_PROJECT_DEFINITION_BASELINE**

Migrations validées :
- `20260913035644_idea_engine_r5_feedback_resolution`
- `20260913035836_idea_engine_r6_project_definition_baseline`

## 1. Résultat

R6 est validé comme baseline de promotion `Approved Idea → Project Definition`.

Le moteur peut désormais prendre une décision R5 réellement promotable et produire une Project Definition baseline versionnée, reliée à un `APPROVED_IDEA_SNAPSHOT`, tout en héritant uniquement les artefacts Idea explicitement classés et valides.

R6 ne crée aucun Project d'exécution.

## 2. Validation transactionnelle nominale

Le scénario complet suivant a été exécuté sur le schéma live dans une transaction `ROLLBACK` :

1. création d'une Idea de test ;
2. création/promotion d'un artefact R4 ;
3. création d'un Decision Snapshot R5 ;
4. création/promotion d'un Decision Package ;
5. Decision Record `APPROVE_TO_PROJECT`, G7 ready et promotable ;
6. promotion R6 ;
7. création d'un `APPROVED_IDEA_SNAPSHOT` ;
8. création d'une Project Definition `version=1`, `status=defining` ;
9. création d'un artefact héritier `FOR_PROJECT / PROJECT_DEFINITION` ;
10. vérification de `supersedes_artifact_id` et `source_snapshot_id` ;
11. retry exact de la promotion → même Project Definition ;
12. tentative de modifier la baseline → rejet `PROJECT_DEFINITION_BASELINE_IMMUTABLE` ;
13. vérification qu'aucun `public.projects` d'exécution n'a été créé ;
14. rollback final propre.

Résultat : `R6_TRANSACTIONAL_TEST_PASS` / `rollback_clean = true`.

## 3. Red-team R6

Un second scénario transactionnel a validé :

- Decision Record valide mais feedback de review encore ouvert → rejet `OPEN_REVIEW_FEEDBACK_BLOCKS_PROMOTION` ;
- clôture explicite via `resolve_decision_feedback_v1` → feedback `resolved` ;
- baseline manifest contenant `tasks` → rejet `EXECUTION_PLANNING_NOT_ALLOWED_IN_R6_BASELINE` ;
- promotion après résolution et sans planification d'exécution → succès ;
- rollback propre.

Résultat : `R6_REDTEAM_PASS` / `rollback_clean = true`.

## 4. Artifact promotion

Validé :

- la source doit appartenir à l'Idea ;
- la source doit être présente dans le Decision Snapshot exact ;
- une source promue doit être `frozen + fresh` ;
- elle doit être `FOR_DECISION / CONCEPT_NOT_FINAL_SPEC` ;
- le target domain est obligatoire pour une vraie promotion ;
- l'artefact Project est une nouvelle version `FOR_PROJECT / PROJECT_DEFINITION` ;
- les outputs du Decision Package ne deviennent jamais silencieusement des specs Project.

## 5. Conditions d'approbation

R6 distingue :

- `STRUCTURAL_BLOCKING` : doit être résolue avant baseline ;
- `PROJECT_RESOLVABLE` : doit porter `requirement_id + owner_ref` ;
- `NON_BLOCKING_ACCEPTED_UNKNOWN` : doit porter `tracking_key`.

Cela évite qu'un `APPROVE_WITH_CHANGES` masque un blocage structurel non résolu.

## 6. Sécurité / ACL

Vérifications live :

- `promote_approved_idea_to_project_definition_v1` : EXECUTE seulement `service_role`/`postgres` ;
- `resolve_decision_feedback_v1` : EXECUTE seulement `service_role`/`postgres` ;
- la table de promotions d'artefacts est RLS et `authenticated` n'a que SELECT ;
- aucun nouveau write navigateur n'est ajouté.

Le security advisor Supabase n'a signalé aucun nouveau RPC R5/R6 exposé à `authenticated` ou `anon`. Les warnings affichés restent ceux de la dette historique existante, notamment anciens SECURITY DEFINER accessibles, invite preview et configuration Auth.

Références Supabase :
- SECURITY DEFINER : https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable
- RLS without policy : https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy
- password leaked protection : https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## 7. Invariants validés

- Idea approval historique jamais réécrite ;
- lineage complète préservée ;
- latest decision only ;
- stale-safety sur engine revision / package / snapshot / artefacts ;
- feedback ouvert bloque Z6 ;
- Project Definition baseline immutable ;
- classification explicite de chaque artefact hérité ;
- Project hérite au lieu de recommencer ;
- `FOR_PROJECT` n'est pas `FOR_BUILD` ;
- aucune création de milestone/task/execution Project.

## 8. Limites volontaires

R6 ne fait pas encore :

- approfondissement complet D08–D20 ;
- Requirements Project product/experience/tech stabilisés ;
- Gates G8→G12 ;
- NFR/architecture finale ;
- acceptance matrix Build Ready ;
- `BUILD_READY_SNAPSHOT` ;
- Project d'exécution.

## 9. Décision

**R6 = PASS_PROJECT_DEFINITION_BASELINE**.

Prochaine étape autorisée : **R7 — Project Definition completion → Build Ready**.
