# 4b4c / 2b2c — Workspace Privileged Adapter V0.1 — Validation

Date : 2026-09-13

Statut : **ADAPTER 0.1.1 — SECRET PROVISIONED / BUILD 542 RELEASE CANDIDATE ACTIVE**

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
- ne renvoie ni JWT ni secret key.

## 2. Red-team initial V0.1

Commit historique testé après premier wiring Worker : `d6678213975d3359c93d7ac1569d1fd8301054d4`.

Résultat : `WORKSPACE_PRIVILEGED_ADAPTER_V0_1_REDTEAM_PASS`.

Scénarios PASS :
1. JWT absent → `401 UNAUTHORIZED` ;
2. payload contenant un champ `rpc` supplémentaire → `400 INVALID_REQUEST` ;
3. secret absent après auth simulée → `503 SERVER_PRIVILEGE_UNAVAILABLE` ;
4. Idea en lecture seule → `403 IDEA_WRITE_REQUIRED` ;
5. assessment `AMBIGUOUS / MEDIUM` → confirmation humaine requise ;
6. assessment `SITE_VITRINE / HIGH / auto_applicable` → application automatique ;
7. réponse sans secret ni JWT ;
8. `STALE_ENGINE` → `409 STALE_STATE` ;
9. assessment courante réutilisée sans duplication.

## 3. Correction importante — nouvelles clés Supabase

Après provisionnement d'une clé moderne `sb_secret_...`, une incompatibilité a été détectée dans V0.1.0 : le secret était envoyé à la fois dans `apikey` et comme `Authorization: Bearer ...`.

Les clés `sb_secret_...` ne sont pas des JWT. Le correctif V0.1.1 impose :
- service call : `apikey: sb_secret_...` uniquement ;
- user call : `apikey: sb_publishable_...` + `Authorization: Bearer <user-jwt>` ;
- interdiction explicite de transformer la secret key en Bearer token.

Commit canonique portant le correctif + metadata Worker : `abf11adf85586aa47f4de3f9f65f74d6e3b20a44`.

Le contrat de release 542 vérifie statiquement cette règle avant déploiement.

## 4. Déploiements

### Build 540 — historique certifié

- adapter code `0.1.0` ;
- endpoint présent ;
- unauthenticated request → `401 UNAUTHORIZED` ;
- `service_role_browser_exposed=false` ;
- secret encore absent à ce moment-là.

### Build 541 — retiré / non retenu

Le build 541 a introduit l'interaction G0 frontend mais a été retiré comme release candidate après découverte de l'incompatibilité `sb_secret_...` envoyée comme Bearer.

Il ne doit pas être considéré comme baseline certifiée.

### Build 542 — release candidate active

Transport : `v4.5.12-workspace-g0-actions-p2 / build 542`.

Le script Cloudflare 542 exige avant de terminer :
- syntaxe JS valide ;
- manifest/source SHA cohérents ;
- adapter `0.1.1` ;
- secret service envoyé `apikey-only` ;
- `/health.version = v4.5.12-workspace-g0-actions-p2` ;
- `/health ... configured=true` ;
- `service_role_browser_exposed=false` ;
- `/api/ideas/engine` sans JWT → `401 UNAUTHORIZED` ;
- shell + assets G0 interactifs servis en production.

Cloudflare ne publie toujours aucun commit status exploitable dans GitHub. La release est donc **déclenchée mais ne doit être déclarée certifiée que lorsqu'une preuve runtime distante ou un résultat Cloudflare directement observable est disponible**.

## 5. Secret / activation

Le secret runtime `SUPABASE_SERVICE_ROLE_KEY` a été provisionné manuellement dans le Worker `4b4c` via la zone **Runtime variables and secrets**, en type `Secret`.

La valeur n'est pas stockée dans GitHub, le transport ou la documentation.

Le build 542 est conçu pour échouer si le Worker déployé ne voit pas ce secret (`configured!==true`).

## 6. Frontend interactif G0

Ajouts canoniques :
- `site/assets/ideas-workspace-v3-actions.js`
- `site/assets/ideas-workspace-v3-actions.css`
- wiring additif dans `site/index.html`.

Comportement :
- si aucune assessment : action `Analyser le type de projet` → Worker `blueprint_fit.assess` ;
- si assessment ambiguë/moyenne : confirmation humaine inline ;
- confirmation `SITE_VITRINE` ou `BLUEPRINT_MISMATCH` via `confirm_idea_blueprint_fit_v1` user-scoped ;
- `engine_revision` utilisée comme garde stale ;
- idempotency key générée par interaction ;
- aucune secret key dans les assets navigateur.

## 7. ACL / architecture

Aucune ACL moteur n'a été relâchée.

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

Les décisions d'autorité humaine/expert et Build Ready ne sont pas exposées par l'adapter générique.

## 8. Conclusion

### PASS

- contrat sécurité : PASS ;
- source adapter 0.1.1 : PASS structurel ;
- règle `sb_secret_... → apikey only` : intégrée au code + contrat + release gate ;
- frontend G0 : implémenté de façon additive ;
- secret runtime : provisionné hors repo ;
- aucune ACL assouplie ;
- service-role absent du browser.

### Pending

- preuve de réussite Cloudflare build 542 / runtime final ;
- E2E authentifié réel `blueprint_fit.assess` sur une Idea contrôlée ;
- validation desktop/mobile du panneau G0 ;
- puis poursuite Slice 5 (information humaine, sources, actions système, artefacts, review/décision).

Statut courant : **READY_FOR_RUNTIME_CERTIFICATION_BUILD_542**.
