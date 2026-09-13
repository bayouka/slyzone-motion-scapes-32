# 4b4c / 2b2c — Workspace Slice 5 Interactions — Validation

Date : 2026-09-13

Statut : **PARTIAL PASS — G0 + URL SOURCE VALIDATED — G1 PLANNER LIVE-ROLLBACK PASS — ADAPTER/FRONTEND IMPLEMENTED — RUNTIME E2E PENDING**

## Scope

Cette validation couvre la montée progressive des interactions du Workspace V3 sans transformer le référentiel interne en questionnaire utilisateur.

Invariant principal :

> **Requirement unresolved ≠ question utilisateur.**

Une question humaine n'est autorisée que lorsqu'un planner déterministe démontre qu'elle est réellement la meilleure action humaine restante pour la Requirement concernée.

## 1. G0 human confirmation — PASS

Chemin validé :
- assessment G0 système/IA ;
- confirmation humaine ciblée via `confirm_idea_blueprint_fit_v1` ;
- acteur humain conservé ;
- revision incrémentée ;
- stale-safety ;
- aucune fixture persistante après harness transactionnel.

Résultat historique : `G0_HUMAN_CONFIRMATION_ROLLBACK_PASS`.

## 2. Register source URL — PASS

Chemin validé sous rôle `authenticated` :
- `register_idea_source_v1` ;
- source URL enregistrée ;
- sensibilité explicite ;
- `engine_revision` mise à jour ;
- stale revision rejetée ;
- rollback transactionnel propre.

Résultats historiques :
- `SOURCE_REGISTER_AUTHENTICATED_ROLLBACK_PASS` ;
- `SOURCE_REGISTER_STALE_GUARD_ROLLBACK_PASS`.

## 3. G1 Foundation — architecture implémentée

Backend canonique contient les migrations :
- `20260913063230_idea_engine_acquisition_traceability_v1` ;
- `20260913063548_idea_engine_target_fingerprints_v1` ;
- `20260913063741_idea_engine_requirement_resolution_refs_v1` ;
- `20260913064148_idea_engine_g1_foundation_planner_v1` ;
- `20260913064618_idea_engine_foundation_raw_input_v1` ;
- `20260913065006_idea_engine_action_retry_v1` ;
- `20260913070345_idea_engine_foundation_unknown_rescue_v1`.

Le planner `plan_idea_foundation_v1` produit :
- état du gate G1 ;
- Requirements manquantes ;
- actions système éligibles ;
- fingerprints ciblés ;
- au maximum une `dominant_user_action`.

Il ne dérive donc pas une question d'un simple compteur `UNRESOLVED`.

## 4. Adapter G1 — 0.2.0

`src/idea-engine-adapter.js` accepte désormais uniquement :
- `blueprint_fit.assess` ;
- `foundation.advance`.

Pour `foundation.advance` :
1. la projection user-scoped vérifie l'accès et `can_write` ;
2. le planner G1 est interrogé côté service ;
3. une voie RAW éligible peut déclencher un Action Run ;
4. l'IA ne peut proposer qu'une extraction explicitement supportée par le RAW ;
5. `support_text` doit être retrouvé dans le texte source avant acceptation ;
6. la mutation proposée est attachée à sa Requirement et à sa provenance ;
7. fingerprints + revision empêchent une promotion stale ;
8. la réponse utilisateur n'est demandée qu'en présence d'une `dominant_user_action` déterministe.

Le secret Supabase service-role reste Worker-only et est envoyé dans `apikey`, jamais en Bearer.

## 5. Red-team adapter G1 — HARNESS PRESENT

Harness : `scripts/test_workspace_privileged_adapter_v0_2.mjs`.

Il couvre notamment :
- endpoint sans authentification → `401` ;
- human-required → aucune exécution IA/action système parasite ;
- extraction RAW explicitement supportée → mutations ciblées et promotion ;
- faux `support_text` absent du RAW → aucune promotion ;
- mauvais lifecycle → refus ;
- stale Requirement fingerprint → `STALE_STATE` ;
- service secret uniquement dans `apikey` ;
- aucun secret/token renvoyé dans le payload.

Le harness est inclus dans `npm run check` du dépôt canonique.

Cette preuve reste une **validation déterministe de code/harness**, pas un E2E navigateur authentifié de production.

## 6. Frontend Workspace actions 0.3.0

Fichier : `site/assets/ideas-workspace-v3-actions.js`.

Fonctions actives :
- G0 assessment + confirmation ;
- source URL ;
- déclenchement `foundation.advance` ;
- état pending automatique ;
- question last-mile uniquement depuis `dominant_user_action` ;
- réponse via `apply_human_information_v1` ciblée sur la Requirement ;
- `Je ne sais pas / plus tard` via `accept_idea_requirement_unknown_v1` ;
- erreur récupérable ;
- état Foundation ready ;
- idempotency déterministe ;
- aucun secret service-role dans le browser.

Le shell canonique charge maintenant JS/CSS avec cache-busting `0.3.0`.

## 7. Live backend planner — PASS_ROLLBACK

Un test synthétique a été exécuté directement contre le backend Supabase canonique avec fixture intégralement rollbackée.

Scénario A — voie automatique RAW disponible :
- `gate_status = NOT_READY` ;
- `eligible_system_actions = 1` ;
- `dominant_user_action = null` ;
- `projection_fingerprint` présent.

Scénario B — aucune voie automatique déclarée disponible :
- `gate_status = NOT_READY` ;
- `eligible_system_actions = 0` ;
- une `dominant_user_action` humaine est produite ;
- `projection_fingerprint` présent.

Vérification après test :
- `residual_ideas = 0` ;
- `residual_sources = 0`.

Conclusion : le planner live respecte le principe « automatique d'abord pour une Requirement lorsqu'une voie admissible existe ; humain lorsque cette voie n'existe pas », sans persistance de fixture.

Note méthodologique : un premier indicateur de test avait interprété à tort un `jsonb null` comme un `SQL NULL`. Le test a été corrigé avant toute modification du moteur ; aucun changement de schéma n'a été appliqué sur la base de ce faux positif.

## 8. Release 544

Release candidate transport :
- runtime `v4.5.12-workspace-foundation-g1-p1` ;
- build `544` ;
- source runtime canonique `b0754db9f3d6b42fb970514a8c2ad00e6e7b798d` ;
- transport commit `6e3720a0444b9b1b427c0c26a62485a304592133`.

Gate Cloudflare 544 vérifie :
- manifeste/source SHA ;
- syntaxe runtime ;
- actions/shell 0.3.0 ;
- allowlist G0 + G1 ;
- marqueurs Foundation ;
- secret `apikey-only` ;
- aucun secret dans le browser ;
- endpoints G0/G1 non authentifiés → `401` ;
- smoke des assets sur le runtime déployé.

GitHub n'expose aucun statut Cloudflare exploitable (`statuses=[]`). En conséquence :

> **build 544 ne doit pas être appelé certifié tant qu'une preuve runtime indépendante n'est pas disponible.**

La baseline explicitement certifiée reste build 540.

## 9. Reste à valider avant G2

- résultat observable de build/runtime 544 ;
- E2E authentifié `foundation.advance` sur une Idea contrôlée ;
- réponse humaine ciblée ;
- `Je ne sais pas / plus tard` ;
- extraction RAW réelle à travers le Worker ;
- stale/retry côté runtime ;
- desktop + mobile ;
- rollback vers Workspace V3 read-only / release précédente.

## Conclusion

PASS établi :
- G0 human confirmation ;
- URL source registration ;
- source stale guard ;
- architecture/planner G1 présente dans Supabase ;
- **planner G1 live : PASS_ROLLBACK** ;
- adapter G1 allowlisté et red-team harnessé ;
- UI G1 ciblée, non questionnaire ;
- cache-busting actions 0.3.0 ;
- aucune exposition service-role navigateur ;
- aucune fixture résiduelle après test live.

PENDING :
- certification runtime build 544 ;
- E2E authentifié G1 via Worker ;
- desktop/mobile G1.

NEXT après ces preuves : **G2 Evidence / Market**, en conservant la même discipline d'acquisition automatique d'abord, intervention humaine seulement lorsqu'elle est réellement nécessaire.
