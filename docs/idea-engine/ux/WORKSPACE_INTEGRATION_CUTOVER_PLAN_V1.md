# 4b4c / 2b2c — WORKSPACE INTEGRATION / CUTOVER PLAN V1

Date : 2026-09-13

Statut : **ACTIVE IMPLEMENTATION PLAN — SLICES 1–3 VALIDATED / SLICE 4 DEPLOYED FAIL-CLOSED**

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

La surface lit exclusivement `get_idea_workspace_projection_v1` et reste volontairement read-only pour les mutations privilégiées. Elle expose :
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

## Slice 4 — Privileged action adapter — DEPLOYED / FAIL-CLOSED

Contrat : `WORKSPACE_PRIVILEGED_ADAPTER_CONTRACT_V0_1.md`.
Validation : `docs/idea-engine/validation/WORKSPACE_PRIVILEGED_ADAPTER_V0_1_VALIDATION_20260913.md`.

Implémentation :
- `src/idea-engine-adapter.js` ;
- `POST /api/ideas/engine` dans `src/worker.js` ;
- commande allowlistée V0.1 unique : `blueprint_fit.assess`.

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
10. autorité humaine/expert exclue de l'adapter générique.

Red-team exact commit canonique : `WORKSPACE_PRIVILEGED_ADAPTER_V0_1_REDTEAM_PASS`.

Production : **build 540 certifié** :
- `/health` expose `idea_engine_adapter_v0_1.code=0.1.0` ;
- commande déclarée : `blueprint_fit.assess` ;
- `service_role_browser_exposed=false` ;
- `POST /api/ideas/engine` sans JWT → `401 UNAUTHORIZED`.

État d'activation réel : **`configured=false`**. Le secret `SUPABASE_SERVICE_ROLE_KEY` n'est pas provisionné dans le Worker. L'adapter est donc déployé mais volontairement incapable d'exécuter une mutation privilégiée. Une tentative automatisée d'accès à la clé secrète a été bloquée par la couche de sécurité ; aucun contournement ne doit être tenté.

### Condition pour fermer complètement Slice 4

- provisionner `SUPABASE_SERVICE_ROLE_KEY` par une voie de secret-management autorisée, hors repo/browser ;
- vérifier `/health` → `configured=true` ;
- réaliser un E2E authentifié `blueprint_fit.assess` sur une Idea de test contrôlée ;
- vérifier cas HIGH auto-apply et cas ambiguous → confirmation humaine ;
- seulement ensuite brancher l'action G0 interactive dans Workspace V3.

## Slice 5 — Idea workspace interactions — BLOCKED ON SLICE 4 ACTIVATION FOR PRIVILEGED G0

Brancher progressivement :
- ajout/correction d'information humaine ;
- sources ;
- réponses last-mile ;
- actions système ;
- artefacts de préfiguration ;
- review/feedback ;
- Decision Package et décision.

Les mutations humaines déjà user-scoped peuvent rester directes via leurs RPCs authentifiées ; ne pas les rerouter inutilement par service-role.

Les anciennes `idea_items` peuvent rester en lecture/compatibilité durant la transition, mais ne doivent plus définir la maturité canonique.

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
- un changement matériel déclenche une reclassification et une invalidation ciblée, jamais une continuité silencieuse sous un Blueprint potentiellement faux ;
- les utilisateurs peuvent toujours comprendre où en est leur idée et ce qui nécessite réellement leur attention.
