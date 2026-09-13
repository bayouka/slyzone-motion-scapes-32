# 4b4c — PERSISTENCE MODEL — V0.1

Date : 2026-09-13

Statut : **ARCHITECTURE CANDIDATE — NON CANONIQUE / AUCUNE MIGRATION AUTORISEE**

Objet : définir le minimum persistant nécessaire au moteur `Idea → Prefiguration → Decision → Project Definition → Build Ready` sans matérialiser inutilement tout le Blueprint en base.

---

# 1. Principe

Le Blueprint YAML définit **ce qui peut exister**.

Supabase persiste **ce qui est réellement arrivé pour une Idea**.

On ne crée pas une table `requirements_catalog` contenant les 77 Requirements comme vérité métier si ceux-ci sont déjà versionnés dans GitHub et chargés par le moteur.

En base, il faut stocker : état concret, provenance, evidence, décisions, résultats coûteux, artifacts, snapshots et lineage.

---

# 2. Extensions minimales de `ideas`

Ajouter conceptuellement, pas encore migrer :

- `blueprint_id` text ;
- `blueprint_version` text ;
- `blueprint_status` text (`active`, `mismatch`, `migration_required`) ;
- `active_project_definition_id` uuid nullable ;
- éventuellement `engine_revision` bigint pour invalidation déterministe indépendante du vieux `version` UI.

Conserver `version` actuel pour optimistic concurrency legacy tant que les anciens clients existent.

---

# 3. Table candidate — `idea_sources`

But : représenter les sources réelles indépendamment de leurs interprétations.

Champs candidats :

- `id uuid`
- `idea_id uuid`
- `source_kind` (`human_raw`, `url`, `document`, `image`, `connector`, `system_observation`)
- `locator` / storage reference
- `title`
- `human_note`
- `content_hash`
- `source_version`
- `fetched_at`
- `freshness_at`
- `status`
- `sensitivity`
- `created_by`
- timestamps

Ne pas mettre l'analyse sémantique principale dans cette table.

---

# 4. Table candidate — `idea_information_items`

But : mémoire atomique active et versionnée.

Un item représente un FACT / PREFERENCE / CONSTRAINT / ASSUMPTION / OPTION / EVIDENCE / RISK / QUESTION / DECISION-INPUT.

Champs candidats :

- `id uuid`
- `idea_id uuid`
- `semantic_key` nullable (`audience.primary`, `business.objective`, etc.)
- `item_type`
- `value_jsonb`
- `provenance_type`
- `source_id` nullable
- `source_locator` nullable
- `confidence_class`
- `state`
- `sensitivity`
- `valid_from`
- `supersedes_id` nullable
- `created_by`
- timestamps

Important : plusieurs items contradictoires peuvent coexister ; le moteur ne doit pas écraser silencieusement une déclaration humaine par une inférence IA.

---

# 5. Table candidate — `idea_requirement_states`

But : cache/persistance de l'état concret de Requirements activés pour une Idea.

Ce n'est **pas** le catalogue du Blueprint.

Champs candidats :

- `idea_id`
- `requirement_id`
- `blueprint_version`
- `applicability_state`
- `resolution_state`
- `criticality_current`
- `lock_state`
- `resolution_refs jsonb`
- `input_fingerprint`
- `last_evaluated_at`
- `stale_reason`
- `version`

PK logique : `(idea_id, requirement_id)`.

Le moteur peut reconstruire cette table depuis les items/sources/decisions si nécessaire ; elle sert à performance, audit et orchestration.

---

# 6. Table candidate — `idea_action_runs`

Remplace à terme le rôle limité de `idea_ai_runs` pour le nouveau moteur.

Champs :

- `id uuid`
- `idea_id`
- `action_type`
- `target_requirement_ids text[]`
- `target_artifact_keys text[]`
- `input_fingerprint`
- `input_refs jsonb`
- `provider`
- `model`
- `prompt_version`
- `schema_version`
- `tool_version`
- `permission_scope jsonb`
- `status` (`queued/running/succeeded/failed/cancelled/stale`)
- `attempt`
- `result jsonb`
- `proposed_mutations jsonb`
- `error_code`
- `latency_ms`
- `cost_metadata jsonb`
- `started_at/completed_at`
- `created_by_actor`

Idempotency unique candidat : `(idea_id, action_type, input_fingerprint, target_signature)` pour les actions déterministes/rejouables.

---

# 7. Table candidate — `idea_artifacts`

But : Candidate, sitemap conceptuel, Decision Memo, deck, Project Definition spec, Build Ready package, etc.

Champs :

- `id uuid`
- `idea_id`
- `artifact_key`
- `artifact_type`
- `purpose_stage` (`FOR_DECISION`, `FOR_PROJECT`, `FOR_BUILD`)
- `version`
- `state` (`draft/current/frozen/stale/superseded/rejected`)
- `payload jsonb`
- `file_refs jsonb`
- `source_snapshot_id` nullable
- `input_fingerprint`
- `created_by_action_run_id` nullable
- `created_by`
- timestamps

Unique candidat : `(idea_id, artifact_key, version)`.

---

# 8. Table candidate — `idea_snapshots`

But : rendre immuables les dossiers utilisés pour décision/promotion/handoff.

Types :

- `DECISION_SNAPSHOT`
- `APPROVED_IDEA_SNAPSHOT`
- `PROJECT_BASELINE_SNAPSHOT`
- `BUILD_READY_SNAPSHOT`

Champs :

- `id uuid`
- `idea_id`
- `snapshot_type`
- `blueprint_id/version`
- `engine_revision`
- `manifest jsonb` : refs vers items, sources, requirement states, artifacts, decisions
- `content_hash`
- `created_by`
- `created_at`

Snapshots immuables. Toute évolution crée un nouveau snapshot.

---

# 9. Table candidate — `idea_ledger_entries`

Plutôt que créer une table pour chaque registre transverse V0.1, utiliser un ledger typé pour les objets qui partagent surtout audit/version/targeting.

`entry_type` :

- `ASSUMPTION`
- `RISK_UNKNOWN`
- `CONFLICT`
- `CHANGE`
- `RECOMMENDATION`
- `ACCEPTED_UNKNOWN`

Champs :

- `id`
- `idea_id`
- `entry_type`
- `target_refs jsonb`
- `payload jsonb`
- `state`
- `materiality`
- `authority_ref`
- `source_refs jsonb`
- `supersedes_id`
- timestamps

Décisions formelles restent préférablement dans `idea_decisions` ou une évolution dédiée, car elles portent une autorité et des conséquences transactionnelles spécifiques.

---

# 10. Project Definition persistence

Créer conceptuellement un objet distinct `project_definitions` au passage Z6.

Champs candidats :

- `id uuid`
- `idea_id`
- `workspace_id`
- `approved_idea_snapshot_id`
- `status` (`defining`, `ready_for_review`, `build_ready`, `superseded`)
- `version`
- `build_ready_snapshot_id` nullable
- timestamps

Ne pas créer encore un `projects` d'exécution ni milestones au simple GO Idea.

Les artifacts D08→D20 peuvent rester liés à `idea_id` pendant la transition ou être rattachés aussi à `project_definition_id`. La décision finale de schéma doit privilégier la simplicité et l'absence de duplication.

---

# 11. Ce qui doit rester dérivé

Ne pas persister comme vérité indépendante si calculable de façon déterministe :

- active Context Overlay set ;
- Gate readiness final ;
- Next Best Action ;
- listes de Requirements actuellement blocking ;
- global progress percentage — interdit ;
- phase séquentielle ;
- simple projections de résumé.

On peut les mettre en cache, mais jamais en faire une seconde vérité.

---

# 12. Stale safety granulaire

Le `idea.version` global reste utile mais trop grossier.

Chaque action/artifact doit utiliser un `input_fingerprint` calculé sur les seules dépendances pertinentes :

`hash(blueprint_version + requirement/input refs + source/item versions + relevant decisions)`.

A la fin d'un run :

- fingerprint toujours courant → résultat admissible ;
- inputs modifiés mais non matériels → compatibilité déterministe possible ;
- inputs matériels modifiés → résultat `stale`, jamais appliqué.

---

# 13. Mutation contract

L'IA ne fait pas :

`LLM → UPDATE requirement_state`.

Elle fait :

`LLM → structured proposed mutations → deterministic validator → narrow transactional RPC → persisted provenance/lineage`.

Pour chaque mutation canonique :
- vérifier accès ;
- vérifier current fingerprint/version ;
- valider schema/type ;
- vérifier autorité ;
- écrire atomiquement ;
- journaliser ;
- incrémenter revision ;
- marquer descendants ciblés stale/review_required.

---

# 14. RLS / permissions

Chaque nouvelle table liée à `idea_id` doit hériter du modèle d'accès Idea.

Lecture : `can_access_idea(idea_id)`.

Ecriture humaine : `can_write_idea(idea_id)` + règles de colonnes système protégées.

Ecriture système : RPC serveur étroit, jamais insert/update direct générique exposé au client.

Les colonnes `created_by_action_run_id`, fingerprints, lock states, snapshot hashes et authority results sont système-owned.

---

# 15. Migration compatibility

Pendant transition :

- anciens `idea_items` continuent de s'afficher ;
- nouvelles réponses peuvent être dual-written vers Information Items si nécessaire ;
- `ideas.summary/problem/audience/proposal` peuvent être recalculés comme projection ;
- ancien Decision Brief reste legacy ;
- nouveau moteur ne dépend pas de l'ancien `readiness`.

Eviter une migration big-bang.

---

# 16. Taille du noyau cible

Nouveau persistent core recommandé :

1. extensions `ideas` ;
2. `idea_sources` ;
3. `idea_information_items` ;
4. `idea_requirement_states` ;
5. `idea_action_runs` ;
6. `idea_artifacts` ;
7. `idea_snapshots` ;
8. `idea_ledger_entries` ;
9. `project_definitions`.

Ne pas ajouter davantage de tables sans besoin transactionnel/requête clair.

---

# 17. Non-décisions

V0.1 ne fige pas encore :

- Cloudflare Workflows vs Supabase Queue pour durable async ;
- moteur de recherche web final ;
- modèle IA/provider final ;
- vector store ;
- stockage exact de chunks documentaires ;
- renderer PPTX ;
- stratégie de cache physique.

Ces sujets doivent être décidés par spikes/charges réelles, pas par anticipation.