# 4b4c / 2b2c — WORKSPACE PROJECTION CONTRACT V1

Date : 2026-09-13

Statut : **VALIDATED INTEGRATION BASELINE — ACTIVE**

Ce contrat remplace les anciennes projections UX séquentielles comme direction active. Il ne fige pas encore le polish visuel final ; il fige la relation **runtime R0→R7 → état UX**.

## 1. But

Le workspace Idea/Project ne doit plus reconstruire le métier depuis `ideas.status`, `idea_items`, une checklist locale ou une suite de phases frontend.

La source de lecture UX est :

`get_idea_workspace_projection_v1(idea_id)`

Cette projection est read-only, authentifiée, contrôlée par `can_access_idea`, et agrège uniquement les signaux nécessaires depuis le runtime validé R0→R7.

## 2. Invariants UX

- aucune phase imposée `Clarifier → Renforcer → Étayer → Partager → Décider` ;
- aucun `step`, `progress`, score global ou pourcentage de complétion ;
- les Gates restent des dépendances métier internes, pas un wizard utilisateur ;
- `Requirement exists ≠ question user` ;
- une action humaine n'est mise en avant que si elle est réellement nécessaire ;
- lorsque l'humain n'est pas nécessaire, la surface principale montre la **valeur produite maintenant** : compréhension, recommandation, comparaison, challenge, preuve, conflit, artefact ou état de décision ;
- les travaux système asynchrones restent en micro-status compact ;
- les preuves, sources, provenance et détails sont accessibles en profondeur progressive ;
- une zone d'entrée libre reste disponible pour corriger, ajouter, questionner ou changer l'intention ;
- `BLUEPRINT_MISMATCH` est un état légitime, jamais une erreur à masquer ;
- Idea, Approved Idea, Project Definition et Build Ready restent des objets/états distincts.

## 3. Lifecycle modes exposés

La projection expose uniquement un mode de maturité structurelle, pas une étape obligatoire :

- `CAPTURED_UNCLASSIFIED` — capture persistée, Blueprint fit non encore établi ;
- `BLUEPRINT_MISMATCH` — l'idée n'est pas correctement couverte par le Blueprint disponible ;
- `BLUEPRINT_MIGRATION_REQUIRED` — Blueprint existant mais migration/reclassification requise ;
- `IDEA_ENGINE` — Idea Decision Dossier actif ;
- `PROJECT_DEFINITION` — Idea approuvée promue en définition de projet ;
- `BUILD_READY` — snapshot Build Ready formel créé.

Ces modes peuvent modifier la navigation et les capacités disponibles, mais ne créent pas une séquence de pages obligatoire.

## 4. Shape V1

La projection contient :

- `projection_version` et `generated_at` ;
- `idea` : identité, description courante, visibilité, Blueprint et `engine_revision` ;
- `lifecycle.mode` ;
- `capabilities` : droits de lecture/écriture ;
- `signals` : Blueprint fit nécessaire, mismatch, travaux système actifs, blockers, artefacts stale, décision, Project Definition, Build Ready ;
- `requirements.idea` : agrégats de résolution/applicabilité/authority ;
- `requirements.project` : agrégats Project Definition si applicable ;
- `system_microstatus` : compteurs et dernier type/statut d'action, sans résultat interne ;
- `sources` : agrégats de sources uniquement ;
- `artifacts` : métadonnées des versions courantes/gelées, sans payload brut ;
- `decision` : dernier package et dernier Decision Record sous forme minimale ;
- `project_definition` : état, révision, Build Ready snapshot et Gates G8→G12 si applicables.

## 5. Données volontairement NON exposées

La projection V1 ne fournit pas :

- prompts, réponses LLM brutes ou `proposed_mutations` ;
- `permission_scope`, secrets ou métadonnées provider sensibles ;
- payloads complets des artefacts ;
- contenu complet des sources/locators privés ;
- fingerprints internes non nécessaires à l'affichage ;
- un score de complétion ;
- une prochaine étape calculée par heuristique frontend.

Les détails utiles devront être obtenus par des projections/read models dédiés avec la même discipline d'autorisation.

## 6. Projection visuelle recommandée

Le workspace cible doit prioriser :

1. **HUMAN_INPUT_INLINE** — au maximum une décision/entrée cognitive dominante lorsque nécessaire ;
2. **VALUE_NOW** — résultat utile actuel produit par 2b2c ;
3. **SYSTEM_MICROSTATUS** — activité système compacte, non bloquante ;
4. **EVIDENCE_DEPTH** — détail/provenance en disclosure progressive ;
5. **FREE_INPUT** — possibilité permanente d'ajouter/corriger/changer.

Des sections comme Comprendre, Preuves & marché, Options & challenge, Concept, Décision, Définition projet ou Handoff peuvent exister comme vues sémantiques. Elles ne doivent jamais devenir une succession obligatoire.

## 7. Compatibilité

`ideas.status`, `idea_items`, `idea_reviews`, l'orchestrateur `clarify/strengthen/prove/share/decide` et les anciens écrans restent temporairement des surfaces de compatibilité pendant le cutover. Ils ne sont plus l'autorité du nouveau workspace.

## 8. Sécurité

`get_idea_workspace_projection_v1` :

- exige `auth.uid()` ;
- exige `app_private.can_access_idea` ;
- est `SECURITY DEFINER` avec `search_path=''` ;
- n'est pas exécutable par `anon`/`public` ;
- est exécutable par `authenticated` et `service_role` ;
- n'effectue aucune mutation.

## 9. Condition de cutover

Aucun ancien orchestrateur ne doit être retiré avant qu'une surface parallèle basée sur cette projection ait passé :

- tests desktop/mobile ;
- access control ;
- états empty/loading/error ;
- scénarios novice, dossier riche, conflit, mismatch, décision et Project Definition ;
- rollback de feature flag.
