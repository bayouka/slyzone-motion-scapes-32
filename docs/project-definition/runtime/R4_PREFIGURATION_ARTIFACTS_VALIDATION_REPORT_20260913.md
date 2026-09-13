# 4b4c — R4 PREFIGURATION / ARTIFACTS — VALIDATION REPORT

Date : 2026-09-13

Statut : **PASS_PREFIGURATION_ARTIFACT_BASELINE**

Migration validée : `20260913034602_idea_engine_r4_prefiguration_artifacts`.

## 1. Résultat

R4 est validé comme baseline persistante de préfiguration/artifacts.

Le moteur peut désormais conserver des versions immuables d'artefacts `FOR_DECISION`, sélectionner une version courante, figer une version pour décision, détecter exactement une obsolescence via fingerprint et préserver une lignée historique sans confondre un concept avec une spécification Build Ready.

## 2. Scénarios transactionnels exécutés

Tous les scénarios ci-dessous ont été exécutés sur le schéma live dans une transaction explicitement `ROLLBACK` :

1. création d'un Concept Journey v1 en `draft` ;
2. retry avec même idempotency key et même requête → même artifact id ;
3. promotion en `current` avec incrément exact de `engine_revision` ;
4. comparaison du fingerprint identique → `fresh` ;
5. tentative de modifier le `payload` d'une version existante → rejet `IDEA_ARTIFACT_VERSION_IMMUTABLE` ;
6. gel d'un artefact `current` frais → `frozen` ;
7. création d'un Concept Sitemap indépendant ;
8. promotion du Sitemap avec nouvelle révision moteur ;
9. comparaison avec fingerprint différent → `stale` ;
10. mutation stale contrôlée → `state=stale`, `freshness_status=stale` et incrément de révision ;
11. vérification qu'un artefact précédemment gelé reste `frozen/fresh` tant que ses propres inputs ne changent pas ;
12. tentative de classer `PF.HIFI_CONCEPT` comme `REAL_USER_EVIDENCE` → rejet `HIFI_CONCEPT_IS_NOT_USER_EVIDENCE` ;
13. rollback final vérifié : aucune fixture R4 conservée.

Résultat transactionnel : `R4_TRANSACTIONAL_TEST_PASS` / `rollback_clean = true`.

## 3. Sécurité

Vérifications live :

- `idea_artifacts` : `authenticated = SELECT` seulement ;
- aucun write direct `anon/authenticated` ;
- les RPC R4 ont `EXECUTE` uniquement pour `service_role` et `postgres` ;
- RLS existante continue de borner la lecture à `can_access_idea(idea_id)` ;
- le contenu et la provenance d'une version sont protégés par trigger d'immutabilité.

Les advisors Supabase n'ont signalé aucun nouveau warning spécifique aux RPC/tables R4. Les warnings restants concernent la dette historique antérieure au jalon R4.

Références générales de remédiation Supabase :
- sécurité SECURITY DEFINER : https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable
- index de clés étrangères : https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys

## 4. Invariants validés

- `FOR_DECISION` est imposé par les RPC R4 ;
- `CONCEPT_NOT_FINAL_SPEC` est imposé par les RPC R4 ;
- version content/provenance immuable ;
- une seule version `current` par artifact key ;
- idempotency key protégée contre réutilisation contradictoire ;
- action-run lineage vérifiée lorsqu'un run produit l'artefact ;
- fingerprint exact requis avant promotion/gel ;
- frozen et stale sont distinguables grâce à `freshness_status` ;
- une maquette HIFI ne compte pas comme preuve utilisateur ;
- aucune Requirement/Gate n'est automatiquement résolue par la simple existence d'un artefact ;
- aucun Project/backlog d'exécution n'est créé.

## 5. Limites volontaires

R4 ne fait pas encore :

- la création du Decision Snapshot complet ;
- le Decision Memo / deck / PDF ;
- la capture/résolution du feedback de review ;
- l'approbation GO/REVISE/PAUSE/STOP ;
- la promotion vers Project Definition ;
- la génération UI du nouveau workspace professionnel.

Ces responsabilités commencent en R5 et au-delà.

## 6. Décision

**R4 = PASS_PREFIGURATION_ARTIFACT_BASELINE**.

Prochaine étape autorisée : **R5 — Decision Package / Decision Snapshot / freshness du package / review**.
