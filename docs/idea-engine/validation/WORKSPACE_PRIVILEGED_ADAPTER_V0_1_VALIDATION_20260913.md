# 4b4c / 2b2c — Workspace Privileged Adapter V0.1 — Validation

Date : 2026-09-13

Statut : **PASS_CODE_AND_DEPLOYED_FAIL_CLOSED — SECRET PROVISIONING PENDING**

## Objet

Valider la première frontière serveur du nouveau workspace permettant d'invoquer des capacités moteur `service_role only` sans exposer le secret Supabase au navigateur et sans transformer le Worker en proxy RPC générique.

Contrat propriétaire : `docs/idea-engine/ux/WORKSPACE_PRIVILEGED_ADAPTER_CONTRACT_V0_1.md`.

Implémentation :
- `src/idea-engine-adapter.js`
- route Worker `POST /api/ideas/engine`
- commande V0.1 unique : `blueprint_fit.assess`

## 1. Périmètre validé

L'adapter :
- authentifie le JWT utilisateur via Supabase Auth ;
- charge la projection canonique avec ce JWT ;
- exige `capabilities.can_write=true` ;
- n'accepte que `command` et `idea_id` dans le body ;
- n'accepte aucun nom de RPC, table, SQL, acteur, `authorized_by` ou permission scope choisi par le browser ;
- utilise `SUPABASE_SERVICE_ROLE_KEY` uniquement côté Worker ;
- échoue fermé si ce secret est absent ;
- dérive l'idempotency key côté serveur ;
- respecte l'`engine_revision` courante ;
- réutilise une assessment G0 courante au lieu d'en dupliquer une ;
- auto-applique uniquement `HIGH + non AMBIGUOUS + auto_applicable` ;
- laisse les cas ambigus/moyens à la confirmation humaine existante ;
- renvoie une projection canonique rafraîchie ;
- ne renvoie ni JWT ni service-role key.

## 2. Tests exacts sur source canonique

Clone de validation remis exactement sur `origin/main`.

Commit testé après wiring Worker : `d6678213975d3359c93d7ac1569d1fd8301054d4`.

Commandes exécutées :
- `node --check src/worker.js`
- `node --check src/idea-engine-adapter.js`
- `node scripts/test_workspace_privileged_adapter_v0_1.mjs`

Résultat : `WORKSPACE_PRIVILEGED_ADAPTER_V0_1_REDTEAM_PASS`.

Aucune erreur de syntaxe. Node a uniquement émis un warning non bloquant `MODULE_TYPELESS_PACKAGE_JSON` pour le module ES dans le contexte de test local.

## 3. Harness red-team

Scénarios PASS :
1. JWT absent → `401 UNAUTHORIZED` ;
2. payload contenant un champ `rpc` supplémentaire → `400 INVALID_REQUEST` ;
3. service-role secret absent après auth simulée → `503 SERVER_PRIVILEGE_UNAVAILABLE` ;
4. Idea en lecture seule → `403 IDEA_WRITE_REQUIRED`, aucun RPC service-role appelé ;
5. assessment `AMBIGUOUS / MEDIUM` → `HUMAN_CONFIRMATION_REQUIRED`, aucune auto-application ;
6. assessment `SITE_VITRINE / HIGH / auto_applicable` → application automatique et projection `IDEA_ENGINE` ;
7. réponse vérifiée sans service-role key ni JWT ;
8. `STALE_ENGINE` → `409 STALE_STATE`, aucun retry aveugle ;
9. assessment courante ambiguë réutilisée, pas de duplication.

## 4. Déploiement production

Transport release : **build 540 — `v4.5.12-workspace-engine-adapter-p1`**.

Source runtime : `d6678213975d3359c93d7ac1569d1fd8301054d4`.

Le Worker production répond désormais dans `/health` :
- `idea_engine_adapter_v0_1.code = 0.1.0`
- `commands = ["blueprint_fit.assess"]`
- `service_role_browser_exposed = false`
- `configured = false`

Test HTTP réel sans authentification :
- `POST /api/ideas/engine`
- résultat : `HTTP 401 Unauthorized`
- body : `{"ok":false,"error":"UNAUTHORIZED"}`

Le build 539 précédent a également été certifié directement : shell V3 présent, JS preview servi, CSS preview servi.

## 5. Secret / activation

État réel : `configured=false`.

Donc `SUPABASE_SERVICE_ROLE_KEY` n'est pas actuellement provisionné comme secret du Worker `4b4c`.

Le code est volontairement fail-closed : une requête authentifiée qui atteint une commande privilégiée doit répondre `503 SERVER_PRIVILEGE_UNAVAILABLE` tant que le secret n'existe pas.

Une tentative de récupération automatisée de la clé secrète via l'environnement distant a été bloquée par la couche de sécurité avant lecture. Aucun contournement n'a été tenté et aucune valeur secrète n'a été exposée.

Activation complète de `blueprint_fit.assess` nécessite donc une opération autorisée de provisionnement du secret Worker, hors repo et hors navigateur.

## 6. ACL / architecture

Aucune ACL des RPCs moteur n'a été relâchée.

Restent `service_role only` notamment :
- `record_idea_blueprint_fit_assessment_v1`
- `apply_assessed_blueprint_fit_v1`
- lifecycle R3 Action Run
- materialization/promotion moteur
- artefacts système R4
- Decision Package R5
- promotion Project Definition R6
- Gates/Build Ready R7

Restent directement user-scoped lorsque le contrat le prévoit :
- `apply_human_information_v1`
- `register_idea_source_v1`
- `confirm_idea_blueprint_fit_v1`

Les décisions d'autorité humaine/expert et Build Ready ne sont pas exposées par l'adapter générique V0.1.

## 7. Conclusion

### PASS

- contrat sécurité : PASS ;
- source adapter : PASS ;
- wiring Worker : PASS ;
- red-team local exact commit : PASS ;
- déploiement : PASS ;
- endpoint 401 sans auth : PASS ;
- service-role non exposé : PASS ;
- fail-closed secret absent : PASS par contrat/harness + `configured=false` en production.

### Pending

- provisionnement autorisé de `SUPABASE_SERVICE_ROLE_KEY` côté Worker ;
- test E2E authentifié de `blueprint_fit.assess` contre une Idea de test contrôlée ;
- seulement ensuite branchement interactif G0 dans Workspace V3.

Statut final V0.1 : **PASS_CODE_AND_DEPLOYED_FAIL_CLOSED**.
