# 4b4c / 2b2c — WORKSPACE INTEGRATION / CUTOVER PLAN V1

Date : 2026-09-13

Statut : **ACTIVE IMPLEMENTATION PLAN — SLICES 1–3 VALIDATED / SLICE 4 ACTIVATED IN CODE / SLICE 5 STARTED WITH G0 INTERACTIVE**

Objectif : remplacer progressivement le workspace Idea historique par une projection fidèle au runtime R0→R7 sans big-bang, sans baisse de sécurité et sans rendre l'application inutilisable pendant la transition.

## Principes

- GitHub reste la source canonique ; Supabase reste le state/backend canonique ; Cloudflare reste le chemin runtime/deploy.
- pas de Remote Desktop Commander dans le workflow normal ;
- aucune réouverture de Capture V5 sans problème réel ;
- aucun assouplissement des RPCs `service_role only` pour simplifier le frontend ;
- chaque slice est additive, testable et rollbackable ;
- l'ancien orchestrateur est retiré seulement après équivalence fonctionnelle et UX validée ;
- l'historique des migrations GitHub doit correspondre exactement à `supabase_migrations.schema_migrations` ; aucun faux/no-op de rattrapage n'est accepté.

## Slice 1 — Canonical read projection — DONE / VALIDATED

Livrable : `get_idea_workspace_projection_v1`.

Effet : une seule source UX agrège le runtime R0→R7 sans exposer les internals et sans reconstruire une progression séquentielle.

Validation : accès autorisé, accès transversal refusé, état non classifié, état `IDEA_ENGINE`, aucune clé `phase/step/progress/completion_percentage`.

Projection active après durcissements G0/change intelligence : **1.2**.

## Slice 2 — G0 / Blueprint Fit — DONE / VALIDATED

Livrables :
- `idea_blueprint_fit_assessments` ;
- `idea_blueprint_fit_decisions` ;
- `record_idea_blueprint_fit_assessment_v1` — service-role only ;
- `apply_assessed_blueprint_fit_v1` — service-role only ;
- `confirm_idea_blueprint_fit_v1` — confirmation humaine contrôlée ;
- projection workspace 1.2 avec état G0/reclassification minimal.

Garanties validées :
- Site vitrine n'est jamais assigné par défaut à toute Idea ;
- assessment IA/système ≠ vérité humaine ;
- auto-application uniquement `HIGH + non ambiguous + auto_applicable` ;
- confidence MEDIUM/LOW ou `AMBIGUOUS` ne peut pas être auto-appliquée ;
- l'humain peut corriger l'assessment ;
- une assessment devient stale/superseded si l'entrée matérielle change ;
- mismatch conserve RAW/source et historique au lieu de forcer le Blueprint disponible ;
- après modification matérielle, `BLUEPRINT_MIGRATION_REQUIRED` force une reclassification G0 avant réutilisation du Blueprint ;
- les Action Runs non promus devenus invalides passent stale et les Requirements concernés passent `REVIEW_REQUIRED` sans perdre leur historique ;
- une Idea déjà promue en Project Definition n'est plus structurellement modifiable via l'ancien éditeur ;
- aucune fixture de test résiduelle.

Migrations d'intégration alignées avec l'historique Supabase :
- `20260913043039_idea_workspace_projection_v1` ;
- `20260913043203_idea_workspace_projection_v1_boolean_fix` ;
- `20260913043603_idea_blueprint_fit_g0_v1` ;
- `20260913043734_idea_workspace_projection_g0_v1` ;
- `20260913043819_idea_blueprint_fit_g0_fk_index` ;
- `20260913044946_idea_blueprint_fit_reclassification_v1` ;
- `20260913045028_idea_content_change_runtime_compat_v1`.

## Slice 3 — Parallel workspace shell — DONE / VALIDATED PREVIEW

Livrables frontend :
- `site/assets/ideas-workspace-v3-preview.js` ;
- `site/assets/ideas-workspace-v3-preview.css` ;
- wiring additif dans `site/index.html`.

Route parallèle : `#/ideas/<idea_id>/workspace-v3`.

Activation preview :
- query `?workspacev3=1`, ou
- localStorage `2b2c.idea.workspace.v3=1`.

La surface lit exclusivement `get_idea_workspace_projection_v1`. Elle expose :
- Header Idea + lifecycle badge ;
- HUMAN_INPUT_INLINE si réellement nécessaire ;
- VALUE_NOW central ;
- SYSTEM_MICROSTATUS compact ;
- navigation sémantique non bloquante ;
- agrégats provenance/sources/artefacts ;
- décision neutre ;
- Project Definition / Gates lorsqu'ils existent ;
- retour vers l'éditeur de compatibilité.

Coexistence vérifiée : la route `workspace-v3` ne matche pas la regex historique de `ideas-v1.js`; aucun lien principal n'est basculé.

Production : **build 539 certifié directement** le 2026-09-13 :
- `/health` OK ;
- shell production référence JS/CSS Workspace V3 ;
- `/assets/ideas-workspace-v3-preview.js` servi avec marqueur `__2B2C_IDEA_WORKSPACE_V3_PREVIEW__` ;
- `/assets/ideas-workspace-v3-preview.css` servi avec marqueur `.ideas-workspace-v3-owned`.

## Slice 4 — Privileged action adapter — ADAPTER 0.1.1 / SECRET PROVISIONED / RUNTIME CERTIFICATION PENDING

Contrat : `WORKSPACE_PRIVILEGED_ADAPTER_CONTRACT_V0_1.md`.
Validation : `docs/idea-engine/validation/WORKSPACE_PRIVILEGED_ADAPTER_V0_1_VALIDATION_20260913.md`.

Implémentation :
- `src/idea-engine-adapter.js` ;
- `POST /api/ideas/engine` dans `src/worker.js` ;
- commande allowlistée unique : `blueprint_fit.assess`.

Garanties :
1. JWT utilisateur obligatoire ;
2. projection user-scoped lue avant toute élévation ;
3. `capabilities.can_write` requis ;
4. body strict : `command + idea_id` uniquement ;
5. aucun nom de RPC/table/SQL/actor/authorized_by/permission_scope fourni par le browser ;
6. revision, stale-safety et idempotency préservées ;
7. `SUPABASE_SERVICE_ROLE_KEY` Worker-only ;
8. secret absent → fail closed ;
9. aucune ACL moteur relâchée ;
10. autorité humaine/expert exclue de l'adapter générique ;
11. clé Supabase moderne `sb_secret_...` envoyée uniquement dans `apikey`, jamais comme Bearer token.

Red-team initial exact commit canonique : `WORKSPACE_PRIVILEGED_ADAPTER_V0_1_REDTEAM_PASS`.

Production historique : **build 540 certifié** avec adapter 0.1.0 fail-closed : endpoint présent, `401 UNAUTHORIZED` sans JWT, `service_role_browser_exposed=false`.

Le secret runtime `SUPABASE_SERVICE_ROLE_KEY` a ensuite été provisionné manuellement dans **Worker 4b4c → Runtime variables and secrets**, type `Secret`. Sa valeur n'est stockée ni dans GitHub ni dans la documentation.

Une incompatibilité a ensuite été détectée avant validation E2E : l'adapter 0.1.0 envoyait la clé `sb_secret_...` comme Bearer. Cette release ne doit pas être utilisée pour une mutation privilégiée. Adapter 0.1.1 corrige ce point avec `apikey-only` pour les appels service-role.

Build 541 : **abandonné / non retenu comme baseline**.

Build 542 : **release candidate active**, runtime `v4.5.12-workspace-g0-actions-p2`, source runtime canonique `abf11adf85586aa47f4de3f9f65f74d6e3b20a44`.

Le gate Cloudflare 542 exige :
- adapter 0.1.1 ;
- secret `apikey-only` ;
- `/health` avec `configured=true` ;
- `service_role_browser_exposed=false` ;
- endpoint sans JWT → `401` ;
- shell + JS/CSS G0 interactifs effectivement servis.

Cloudflare ne publie actuellement aucun statut de commit exploitable dans GitHub et aucun connecteur Cloudflare n'est disponible. **Ne pas déclarer build 542 certifié sans preuve runtime distante ou résultat Cloudflare directement observable.**

## Slice 5 — Idea workspace interactions — STARTED

Première interaction implémentée de manière additive : **G0 interactif**.

Frontend canonique :
- `site/assets/ideas-workspace-v3-actions.js` ;
- `site/assets/ideas-workspace-v3-actions.css` ;
- wiring dans `site/index.html`.

Comportement G0 :
- aucune assessment → bouton `Analyser le type de projet` → Worker `blueprint_fit.assess` ;
- HIGH auto-applicable → résolution système autorisée ;
- ambiguity / confiance insuffisante → confirmation humaine inline ;
- confirmation Site vitrine ou autre type via `confirm_idea_blueprint_fit_v1`, avec JWT utilisateur et `engine_revision` courante ;
- aucun secret dans le navigateur.

La suite Slice 5 se fera incrémentalement :
- ajout/correction d'information humaine via `apply_human_information_v1` ;
- sources via `register_idea_source_v1` ;
- réponses last-mile ;
- actions système ;
- artefacts de préfiguration ;
- review/feedback ;
- Decision Package et décision.

Les mutations humaines déjà user-scoped restent directes via leurs RPCs authentifiées ; ne pas les rerouter inutilement par service-role.

Les anciennes `idea_items` peuvent rester en lecture/compatibilité durant la transition, mais ne doivent plus définir la maturité canonique.

Avant d'élargir les commandes privilégiées de Slice 5 :
- certifier build 542 ;
- réaliser l'E2E authentifié G0 contrôlé ;
- valider desktop/mobile du panneau G0 ;
- préserver un rollback simple vers la preview read-only.

## Slice 6 — Project Definition / Build Ready UI

Après GO explicite :
- montrer la baseline approuvée ;
- distinguer clairement `FOR_PROJECT` et `FOR_BUILD` ;
- projeter G8→G12 sans les transformer en checklist utilisateur ;
- faire apparaître les décisions humaines/expert réellement requises ;
- exposer les artefacts A19→A25 et le Build Ready Snapshot.

## Slice 7 — Legacy retirement

Retirer progressivement :
- `ideas-orchestrator-v2.js` comme autorité ;
- la bande `Clarifier / Renforcer / Étayer / Partager / Décider` ;
- le `maturity 5/5` de `ideas-v1.js` ;
- les gardes décisionnelles fondées sur `hasPath/hasRisk/hasEvidence/reviews` ;
- les conversions legacy qui créent directement un Project d'exécution.

Chaque retrait exige un smoke test de la nouvelle surface et un rollback simple.

## Critères de réussite du cutover

- aucune question répétée évitable ;
- aucune page d'attente passive obligatoire ;
- aucun pourcentage de complétion artificiel ;
- aucune décision humaine escamotée ;
- aucun Blueprint forcé ;
- aucun appel browser à une RPC service-role ;
- aucune secret key envoyée comme Bearer ;
- un changement matériel déclenche une reclassification et une invalidation ciblée, jamais une continuité silencieuse sous un Blueprint potentiellement faux ;
- les utilisateurs peuvent toujours comprendre où en est leur idée et ce qui nécessite réellement leur attention.
