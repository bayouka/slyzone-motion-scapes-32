# 4b4c / 2b2c — WORKSPACE INTEGRATION / CUTOVER PLAN V1

Date : 2026-09-13

Statut : **ACTIVE IMPLEMENTATION PLAN — SLICES 1–4 VALIDATED/ACTIVE — SLICE 5 G0 + SOURCE URL + G1 FOUNDATION IMPLEMENTED — BUILD 544 RELEASE CANDIDATE — G2 DESIGN PREPARED / NON ACTIVE**

Objectif : remplacer progressivement le workspace Idea historique par une projection fidèle au runtime R0→R7 sans big-bang, sans baisse de sécurité et sans rendre l'application inutilisable pendant la transition.

## 0. Autorité et règles de travail

- GitHub `bayouka/slyzone-motion-scapes-32/main` reste la source canonique du produit/runtime.
- Supabase `wexfzhegiewhldkugtow` reste le backend/state canonique.
- `bayouka/2b2c/4b4c/` reste uniquement le miroir de transport Cloudflare.
- Cloudflare Workers reste le chemin normal de build/déploiement/runtime.
- Remote Desktop Commander n'appartient pas au workflow normal ; son indisponibilité ne doit jamais bloquer l'avancement.
- chaque slice est additive, testable et rollbackable ;
- aucun assouplissement des RPCs `service_role only` n'est autorisé pour simplifier le frontend ;
- l'ancien orchestrateur est retiré seulement après équivalence fonctionnelle/UX et tests de cutover ;
- l'historique GitHub des migrations doit correspondre au backend Supabase réel ; aucun faux rattrapage n'est accepté.

## Slice 1 — Canonical read projection — DONE / VALIDATED

Livrable : `get_idea_workspace_projection_v1`.

La projection **1.2** agrège R0→R7 sans exposer les internals et sans reconstruire une progression séquentielle. Elle ne publie pas de `phase`, `step`, `progress` ou pourcentage global artificiel.

## Slice 2 — G0 / Blueprint Fit — DONE / VALIDATED

Livrables principaux :
- `idea_blueprint_fit_assessments` ;
- `idea_blueprint_fit_decisions` ;
- `record_idea_blueprint_fit_assessment_v1` — service-role only ;
- `apply_assessed_blueprint_fit_v1` — service-role only ;
- `confirm_idea_blueprint_fit_v1` — confirmation humaine contrôlée ;
- reclassification après changement matériel.

Garanties :
- Site vitrine n'est jamais forcé par défaut ;
- assessment IA/système ≠ vérité humaine ;
- auto-application seulement `HIGH + non ambiguous + auto_applicable` ;
- stale/supersession après changement matériel ;
- mismatch conserve RAW, sources et historique ;
- `BLUEPRINT_MIGRATION_REQUIRED` bloque la réutilisation silencieuse d'un Blueprint devenu douteux ;
- seules les dépendances réellement affectées sont invalidées/revues.

## Slice 3 — Parallel Workspace V3 — DONE / VALIDATED PREVIEW

Frontend :
- `site/assets/ideas-workspace-v3-preview.js` ;
- `site/assets/ideas-workspace-v3-preview.css` ;
- route `#/ideas/<idea_id>/workspace-v3` ;
- preview par `?workspacev3=1` ou localStorage `2b2c.idea.workspace.v3=1`.

La surface lit uniquement la projection canonique et reste parallèle au legacy. Build 539 a constitué la première preview runtime certifiée.

## Slice 4 — Privileged adapter — ACTIVE / SECURITY BASELINE VALIDATED

Implémentation :
- `src/idea-engine-adapter.js` ;
- `POST /api/ideas/engine` ;
- secret `SUPABASE_SERVICE_ROLE_KEY` Worker-only ;
- appels service-role avec secret dans `apikey` uniquement, jamais comme Bearer ;
- body/commandes allowlistés ;
- projection user-scoped et `can_write` vérifiés avant élévation ;
- stale-safety et idempotence préservées ;
- aucune autorité humaine/expert fabriquée par l'adapter.

Build 540 reste la dernière baseline transport explicitement certifiée tant qu'une release plus récente ne possède pas de preuve runtime indépendante.

Le marqueur `/health` historique `idea_engine_adapter_v0_1.code=0.1.1` est maintenu temporairement pour compatibilité. Il ne doit plus être utilisé comme preuve unique de la surface fonctionnelle G1 : les gates doivent également vérifier les commandes et marqueurs réels du fichier adapter.

## Slice 5 — Idea workspace interactions — ACTIVE

### 5A — G0 interactif — IMPLEMENTED / VALIDATED

- aucune assessment → `blueprint_fit.assess` ;
- HIGH auto-applicable → résolution système autorisée ;
- ambiguity/confiance insuffisante → confirmation humaine inline ;
- confirmation via `confirm_idea_blueprint_fit_v1` ;
- aucun secret service-role dans le navigateur.

### 5B — Source URL — IMPLEMENTED / VALIDATED BACKEND

- ajout utilisateur via `register_idea_source_v1` ;
- sensibilité `public | internal | personal | sensitive` ;
- idempotence déterministe liée à revision + contenu ;
- stale guard ;
- un lien enregistré n'est jamais présenté comme preuve validée par défaut.

### 5C — G1 Foundation déterministe — IMPLEMENTED / RELEASE CANDIDATE

Le moteur G1 résout la base de compréhension en respectant l'invariant :

> **Requirement unresolved ≠ question utilisateur.**

Migrations présentes dans le backend canonique :
- `20260913063230_idea_engine_acquisition_traceability_v1` ;
- `20260913063548_idea_engine_target_fingerprints_v1` ;
- `20260913063741_idea_engine_requirement_resolution_refs_v1` ;
- `20260913064148_idea_engine_g1_foundation_planner_v1` ;
- `20260913064618_idea_engine_foundation_raw_input_v1` ;
- `20260913065006_idea_engine_action_retry_v1` ;
- `20260913070345_idea_engine_foundation_unknown_rescue_v1`.

Adapter Workspace :
- surface fonctionnelle `workspace-engine-adapter-0.2.0` ;
- commandes allowlistées `blueprint_fit.assess` et `foundation.advance` ;
- planner déterministe `plan_idea_foundation_v1` ;
- extraction RAW uniquement lorsqu'elle est réellement éligible ;
- Action Run traçable, idempotent et stale-safe ;
- `support_text` doit être réellement présent dans le RAW avant promotion ;
- fingerprints par Requirement empêchent une mutation fondée sur un état devenu obsolète ;
- maximum de travail automatique borné par requête ;
- une question humaine n'est exposée que si le planner retourne une `dominant_user_action` ;
- `Je ne sais pas / plus tard` est un chemin explicite via `accept_idea_requirement_unknown_v1`.

Frontend : `site/assets/ideas-workspace-v3-actions.js` **0.3.0**.

États UX G1 :
- analyse automatique utile en cours ;
- erreur récupérable sans perte du RAW ;
- une seule précision humaine utile ;
- report accepté ;
- Foundation suffisamment comprise ;
- travail système continu sans étape utilisateur artificielle.

Le cache-busting du shell doit rester aligné sur `actions 0.3.0`.

### 5D — Release 544 — ACTIVE RELEASE CANDIDATE

Transport : `v4.5.12-workspace-foundation-g1-p1 / build 544`.

Source canonique runtime : `b0754db9f3d6b42fb970514a8c2ad00e6e7b798d`.

Gate de release 544 vérifie notamment :
- manifeste build 544 + source SHA exact ;
- actions 0.3.0 ;
- shell JS/CSS 0.3.0 ;
- adapter allowlist `blueprint_fit.assess + foundation.advance` ;
- tool version G1 `workspace-engine-adapter-0.2.0` ;
- secret service-role `apikey-only` ;
- absence du secret dans les assets navigateur ;
- formulaires Foundation + Source ;
- endpoint sans JWT → `401` pour G0 et G1 ;
- smoke runtime des assets après déploiement.

GitHub ne reçoit toujours aucun statut Cloudflare exploitable. Tant qu'une preuve runtime indépendante n'est pas observable, **build 544 reste release candidate et ne remplace pas artificiellement la baseline certifiée 540**.

### 5E — G2 Evidence / Market — DESIGN PREPARED / NON ACTIVE

Aucun SQL, aucune commande Worker et aucun asset production G2 n'est actif.

Documents de préparation :
- `docs/project-definition/runtime/G2_EVIDENCE_MARKET_RUNTIME_DESIGN_V0_1.md` ;
- `docs/project-definition/runtime/G2_EVIDENCE_MARKET_BACKEND_GAP_AUDIT_20260913.md` ;
- `docs/project-definition/runtime/G2_EVIDENCE_MARKET_ACQUISITION_MATRIX_V0_1.md` ;
- `docs/project-definition/runtime/G2_RESEARCH_ACTION_ATOMIC_PROMOTION_CONTRACT_V0_1.md` ;
- candidat machine `SITE_VITRINE@0.5` non actif.

Décisions structurantes :
- G2 reste system-first ; l'utilisateur ne devient pas le chercheur/benchmarkeur par défaut ;
- `COMPETITOR_SET` est matériel par défaut en greenfield, mais peut devenir non matériel lorsqu'une refonte dispose déjà d'un audit `OBSERVED` + evidence quality `CALCULATED` et qu'aucune comparaison marché n'est explicitement requise ;
- `requires_all/requires_any` deviennent dans le candidat 0.5 des préconditions transitives des actions/Gates ;
- une valeur libre fournie par un caller/LLM ne peut pas désactiver la recherche concurrentielle ;
- une preuve `WEB_RESEARCH` ne peut pas être `SOURCE_BACKED/OBSERVED` sans Source canonique.

### Atomic research promotion — règle obligatoire avant implémentation G2

Le flow initial `Action Run → créer/ingérer Source → promouvoir` est rejeté : `commit_source_ingestion_v1` incrémente `engine_revision` et ferait courir un risque d'auto-staleness au run qui vient de découvrir cette source.

Flow retenu :

`plan → Action Run → travail externe en mémoire → complete avec SOURCE/observation proposals → promotion atomique → une seule engine_revision`.

La future promotion research doit, avant toute écriture canonique :
- vérifier la revision Idea ;
- comparer les target Requirement fingerprints du run avec les fingerprints courants ;
- vérifier input fingerprint, path, permission scope, provenance, sensitivity et aliases Source ;
- en cas de stale/mismatch : **zéro Source et zéro observation canonique créées**.

Les Sources, observations, Requirement refs et Ledger entries autorisées sont ensuite promus dans une seule transaction.

## Verrous obligatoires avant activation G2

1. obtenir/observer le résultat de build/runtime 544 sans dépendre de Remote Desktop ;
2. réaliser un E2E authentifié G1 sur une Idea contrôlée ;
3. vérifier desktop + mobile : pending, human-required, unknown, ready et error/retry ;
4. vérifier qu'aucune question n'apparaît lorsqu'une voie automatique admissible existe encore ;
5. conserver rollback simple vers Workspace V3 read-only / build précédent ;
6. effectuer le full R0 replay + red-team du candidat Blueprint 0.5 ;
7. préparer et faire passer les tests SQL rollbackés/red-team de l'atomic research promotion avant toute migration G2.

Seulement après ces preuves, implémenter progressivement : planner G2 → executors → adapter `evidence.advance` → A03/A04/A05 → UI Workspace → E2E/runtime certification.

## Slice 6 — Project Definition / Build Ready UI

Après GO explicite :
- baseline approuvée ;
- distinction `FOR_PROJECT` / `FOR_BUILD` ;
- projection G8→G12 sans checklist utilisateur brute ;
- décisions humaines/expert seulement lorsqu'elles sont réellement requises ;
- artefacts A19→A25 et Build Ready Snapshot.

## Slice 7 — Legacy retirement

Retirer progressivement seulement après équivalence et E2E :
- `ideas-orchestrator-v2.js` comme autorité ;
- bande `Clarifier / Renforcer / Étayer / Partager / Décider` ;
- `maturity 5/5` ;
- gardes décisionnelles legacy ;
- conversion legacy directe vers un Project d'exécution.

## Critères de réussite permanents

- aucune question répétée évitable ;
- aucune page d'attente passive obligatoire ;
- aucun pourcentage global artificiel ;
- aucune décision humaine escamotée ;
- aucun Blueprint forcé ;
- aucun appel browser à une RPC service-role ;
- aucune secret key dans le navigateur ou comme Bearer côté service ;
- provenance et historique préservés ;
- changements matériels → invalidation/reclassification ciblées ;
- recherche système : aucune Source canonique écrite à mi-run ; Source + observation sont promues atomiquement après stale/fingerprint guards ;
- l'utilisateur comprend toujours ce qui est acquis, ce que 2b2c fait seul et ce qui nécessite réellement son attention.
