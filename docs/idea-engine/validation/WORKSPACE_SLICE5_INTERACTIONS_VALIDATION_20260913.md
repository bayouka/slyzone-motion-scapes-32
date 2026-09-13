# 4b4c / 2b2c — Workspace Slice 5 Interactions — Validation

Date : 2026-09-13

Statut : **PARTIAL PASS — G0 HUMAN CONFIRMATION + URL SOURCE INTERACTION**

## Scope

Cette validation couvre uniquement les premières mutations humaines du Workspace V3 qui disposent déjà d'un contrat Supabase user-scoped explicite.

Sont inclus :
- confirmation humaine G0 via `confirm_idea_blueprint_fit_v1` ;
- ajout d'une source URL via `register_idea_source_v1` ;
- stale-safety / engine revision ;
- idempotence déterministe côté navigateur ;
- stabilité du renderer interactif V3.

Ne sont pas encore inclus :
- question last-mile générée depuis le planner déterministe ;
- information humaine ciblée sur une Requirement ;
- ingestion/extraction de source ;
- Action Run système ;
- artefacts / review / Decision Package.

## 1. G0 human confirmation — PASS

Test transactionnel exécuté contre Supabase sous le rôle `authenticated` avec `auth.uid()` simulé pour un membre owner du workspace de test.

Scénario :
1. fixture Idea non classifiée ;
2. assessment `AMBIGUOUS / MEDIUM` créée côté système ;
3. appel réel `confirm_idea_blueprint_fit_v1` sous rôle `authenticated` ;
4. vérification :
   - `blueprint_id = SITE_VITRINE` ;
   - `blueprint_version = 0.4` ;
   - `blueprint_status = active` ;
   - `engine_revision` incrémentée ;
   - Decision G0 `decided_by_actor = HUMAN` ;
   - `decided_by = auth.uid()` ;
   - assessment devient `resolved` ;
5. `ROLLBACK` complet.

Résultat : `G0_HUMAN_CONFIRMATION_ROLLBACK_PASS`.

Aucune fixture résiduelle.

## 2. Register source URL — PASS

Test transactionnel sous rôle `authenticated` :
1. fixture Idea `SITE_VITRINE 0.4 / active` ;
2. appel `register_idea_source_v1` avec source kind `url` ;
3. vérification source `registered` ;
4. vérification `engine_revision 0 → 1` ;
5. rollback.

Résultat : `SOURCE_REGISTER_AUTHENTICATED_ROLLBACK_PASS`.

## 3. Source stale guard — PASS

Test séparé : Idea à `engine_revision=1`, appel source avec `p_expected_engine_revision=0`.

Résultat attendu et obtenu : `STALE_ENGINE` capturé ; aucune source créée.

Résultat du harness transactionnel : `SOURCE_REGISTER_STALE_GUARD_ROLLBACK_PASS`.

## 4. Frontend Workspace actions 0.2.0

Fichier : `site/assets/ideas-workspace-v3-actions.js`.

Ajouts :
- G0 assessment via Worker ;
- G0 human confirmation directe via RPC user-scoped ;
- source URL directe via `register_idea_source_v1` ;
- sensibilité source `public | internal | personal | sensitive` ;
- validation navigateur HTTP/HTTPS ;
- idempotency keys déterministes basées sur contenu + revision ;
- aucun secret service-role dans le browser.

Le formulaire source rappelle explicitement qu'un lien enregistré n'est pas automatiquement une preuve validée.

## 5. Renderer stability fix

La version 0.1.0 pouvait rappeler `onRoute()` de façon inutile dans les modes où aucun panneau G0 n'était rendu, car le MutationObserver vérifiait seulement l'existence de `[data-iwv3-g0]`.

Version 0.2.0 :
- ajoute un marqueur `[data-iwv3-actions-marker=<idea_id>]` ;
- ne rerend que si ce marqueur disparaît après un vrai rerender de la surface ;
- retire/reconstruit proprement les panneaux interactifs lors d'un refresh canonique.

## 6. Pourquoi `apply_human_information_v1` n'est pas encore branché automatiquement

La projection 1.2 expose des agrégats de Requirements mais ne persiste pas encore, pour chaque Requirement unresolved, le plan d'acquisition détaillé / `human_required` / question last-mile calculé par le planner déterministe R0.

Invariant : **Requirement unresolved ≠ question utilisateur**.

Il serait incorrect de fabriquer une question depuis `resolution_state=UNRESOLVED` ou depuis un compteur de blockers.

La prochaine extension doit donc projeter un `Next Best Human Action` issu du planner déterministe ou d'un contrat persistant équivalent, avec :
- requirement cible ;
- raison de l'intervention humaine ;
- question/interaction typée ;
- revision/fingerprint ;
- preuve que les voies auto `MEM/RAW/SRC/WEB/CONN/CALC/AI-H/AI-R` sont épuisées/non pertinentes ;
- une seule action humaine dominante à la fois.

## 7. Release

Build 543 candidate :
- Workspace actions `0.2.0` ;
- adapter `0.1.1` inchangé ;
- G0 + source URL ;
- Cloudflare gate vérifie syntaxe, `configured=true`, secret `apikey-only`, endpoint 401 sans JWT, shell/actions 0.2.0 et marqueurs source/render.

Source runtime candidate : `085c9c12cbf45bab396a3a05f58de160311d5d95`.

Tant qu'aucune preuve runtime Cloudflare n'est observable via les outils distants disponibles, build 543 reste **release candidate**, pas baseline certifiée.

## Conclusion

PASS :
- G0 human confirmation ;
- URL source registration ;
- stale guard source ;
- deterministic browser idempotency ;
- no service-role browser exposure ;
- renderer marker fix.

NEXT :
- deterministic Next Best Human Action projection ;
- puis branchement ciblé de `apply_human_information_v1` ;
- ingestion source / system actions ;
- authenticated browser E2E + desktop/mobile.
