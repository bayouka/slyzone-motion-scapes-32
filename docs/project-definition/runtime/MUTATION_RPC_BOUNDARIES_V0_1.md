# 4b4c — MUTATION / RPC BOUNDARIES — V0.1

Date : 2026-09-13

Statut : **ARCHITECTURE CANDIDATE — NON CANONIQUE / AUCUNE MIGRATION AUTORISEE**

Objet : définir les seules familles de mutations autorisées dans le futur moteur afin qu'aucun client, LLM ou runner async ne puisse contourner provenance, autorité, stale-safety ou Change Impact.

---

# 1. Principe

Le runtime ne doit pas exposer des `INSERT/UPDATE` génériques sur les nouvelles tables système.

Pattern cible :

`request/action result → validator déterministe → RPC étroit transactionnel → revision/change event → targeted recompute`.

---

# 2. Mutations humaines

## `apply_human_information_v1`

Usage : intention, contrainte privée, correction, préférence, réponse à question.

Doit recevoir :
- idea_id ;
- semantic target / requirement target ;
- typed value ;
- expected engine_revision ;
- provenance HUMAN_DECLARED / HUMAN_GUIDED_ANSWER ;
- sensitivity ;
- optional source/note.

Doit : écrire Information Item, versionner/supersede proprement, créer Change Event, incrémenter revision.

## `record_formal_decision_v1`

Usage : direction, Idea approval, accepted risk, Build Ready approval.

Doit vérifier :
- role/authority ;
- exact snapshot/fingerprint ;
- decision type/outcomes autorisés ;
- rationale/conditions ;
- absence de stale blocker.

## `record_review_feedback_v1`

Usage : présentation/review.

Enregistre feedback brut + type/materiality candidate/target. La classification IA peut être proposée mais les conflits importants restent arbitrables.

---

# 3. Source / ingestion mutations

## `register_idea_source_v1`

Crée metadata source avant analyse.

RAW FIRST : aucun résultat AI requis.

## `commit_source_ingestion_v1`

Après extraction/validation technique : content hash/version/status, jamais interprétation métier silencieuse.

## `supersede_source_v1`

Conserve historique et déclenche targeted stale impact.

---

# 4. System Action lifecycle

## `create_action_run_v1`

Créé seulement par orchestrateur autorisé après eligibility check.

Fige : targets, input fingerprint, permission scope, provider capability demand.

## `start_action_run_v1`

Idempotent ; empêche double execution non voulue.

## `complete_action_run_v1`

Stocke résultat/proposed mutations mais **ne les promeut pas automatiquement**.

Vérifie action ownership/status et final fingerprint context.

## `fail_action_run_v1`

Erreur classifiée, retryability, attempt.

## `mark_action_run_stale_v1`

Conserve résultat historique sans application.

---

# 5. Proposed mutation promotion

## `promote_action_result_v1`

Le RPC le plus sensible.

Préconditions :
- run succeeded ;
- fingerprint toujours admissible ;
- proposed payload validé par schema ;
- mutation types autorisés pour action_type ;
- aucune autorité humaine/expert contournée ;
- provenance AI_INFERRED / AI_RECOMMENDED / WEB_RESEARCH / SYSTEM_CALCULATED correcte.

Peut créer/update :
- Information Items ;
- Requirement resolution refs ;
- Ledger entries ;
- Artifact draft/current ;
- observations/evidence.

Ne peut jamais créer seul :
- HUMAN_DECISION ;
- EXPERT_SIGNOFF ;
- Idea approval ;
- Build Ready approval.

---

# 6. Requirement materialization

## `materialize_requirement_states_v1`

Entrée : deterministic engine projection + expected revision + Blueprint/version.

Doit vérifier que la projection est calculée depuis la revision courante.

Écrit seulement les états actifs/évalués qui méritent persistance/cache.

Ne prend jamais un état arbitraire envoyé par le browser.

---

# 7. Artifact mutations

## `create_artifact_version_v1`

Crée version draft/current à partir d'un action run ou actor autorisé.

## `promote_artifact_state_v1`

Transitions contrôlées : draft→current→frozen ; current→stale/superseded.

Doit vérifier input fingerprint/snapshot.

## `create_snapshot_v1`

Crée manifest immutable depuis état serveur recalculé ; le client ne fournit pas librement le manifest canonique.

---

# 8. Idea → Project Definition

## `promote_idea_to_project_definition_v1`

Remplace conceptuellement l'usage du vieux `convert_idea_to_project_v1` pour le nouveau lifecycle.

Préconditions :
- APPROVED_IDEA_SNAPSHOT fresh ;
- approval outcome autorisé ;
- structural conditions résolues ;
- accepted change set appliqué ;
- authority valide.

Effets :
- crée `project_definition` ;
- référence approved snapshot ;
- promeut artifacts valides ;
- crée Project Baseline Snapshot ;
- aucune milestone/backlog automatique ;
- aucun Project execution automatique.

Idempotent : une même approved snapshot ne peut produire deux baselines actives concurrentes sans action explicite.

---

# 9. Build Ready

## `approve_build_ready_v1`

Préconditions :
- G8/G9/G10/G11 ready ;
- developer ambiguity audit pass ;
- BUILD_READY_OWNER authority ;
- snapshot fresh.

Effets :
- formal decision ;
- immutable BUILD_READY_SNAPSHOT ;
- Project Definition status build_ready.

Ne déclenche pas implicitement le développement/déploiement.

---

# 10. Server-only ownership

Colonnes non modifiables directement par client :
- fingerprints ;
- system provenance ;
- action status internals ;
- lock state ;
- snapshot hashes ;
- engine revision ;
- stale flags/reasons ;
- authority verdicts ;
- created_by_action_run ;
- Blueprint version after instance creation sauf migration explicite.

RLS seule ne suffit pas : grants/privileges/RPC/trigger/checks doivent empêcher la falsification.

---

# 11. Idempotency

Chaque mutation engageante doit avoir une clé ou précondition stable.

Exemples :
- action run by action+fingerprint+targets ;
- source ingestion by source+content_hash ;
- artifact version by artifact_key+input_fingerprint ;
- Project baseline by approved_snapshot_id ;
- formal decision by target_snapshot+decision_kind when appropriate.

Retries réseau ne doivent pas créer de doublons.

---

# 12. Audit

Chaque mutation engageante produit un audit event minimal :
- actor ;
- source action/user ;
- entity ;
- old/new refs ;
- revision before/after ;
- authority ;
- snapshot/fingerprint si pertinent.

Ne pas journaliser inutilement des données sensibles en clair dans `audit_events`.

---

# 13. Legacy bridge

Pendant migration :
- anciens RPC restent actifs pour ancienne UX ;
- nouveau moteur utilise nouveaux RPCs uniquement ;
- aucun nouveau RPC ne doit dual-write silencieusement dans l'ancien modèle sans règle explicite ;
- projections legacy peuvent être mises à jour à partir du nouveau state pour compatibilité.

---

# 14. Security red lines

Interdit :
- browser → direct system-owned Requirement state ;
- LLM → direct SQL mutation ;
- durable workflow → broad service-role arbitrary update ;
- approval sans snapshot/freshness ;
- web source content → instructions système ;
- secret/personal data → public search query sans policy ;
- retry non idempotent d'une mutation engageante.

---

# 15. Definition of Done avant SQL

Avant d'écrire une migration R1, chaque table/colonne candidate doit être associée à :
- owner ;
- read policy ;
- mutation RPC ;
- idempotency strategy ;
- stale strategy ;
- audit strategy ;
- deletion/retention policy ;
- sensitivity handling.

Si une donnée n'a pas besoin d'être persistée pour audit, performance, collaboration ou durabilité, préférer la dériver.