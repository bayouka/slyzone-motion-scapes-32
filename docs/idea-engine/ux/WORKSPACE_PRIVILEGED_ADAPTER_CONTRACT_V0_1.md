# 4b4c / 2b2c — WORKSPACE PRIVILEGED ADAPTER CONTRACT V0.1

Date : 2026-09-13

Statut : **ACTIVE IMPLEMENTATION CONTRACT — SLICE 4**

## 1. Objet

Cette frontière permet au nouveau workspace d'invoquer certaines capacités moteur server-only sans exposer le rôle Supabase `service_role`, sans transformer le Worker en proxy RPC générique et sans contourner l'autorité humaine/expert.

Architecture :

`browser authenticated request → Cloudflare Worker command adapter → user-access verification → command-specific validation/orchestration → allowlisted service-role RPC(s) → minimal UX response`

Le navigateur ne choisit jamais un nom de RPC, une table, du SQL, un acteur privilégié, un `permission_scope` arbitraire ou une identité d'autorité.

## 2. Principes de sécurité

1. Le JWT utilisateur est obligatoire et validé via Supabase Auth.
2. Avant tout appel service-role, le Worker vérifie que ce JWT peut lire/écrire la cible via une frontière user-scoped existante (`get_idea_workspace_projection_v1` et `capabilities.can_write`).
3. `SUPABASE_SERVICE_ROLE_KEY` est un secret Worker uniquement. Il ne doit jamais apparaître dans GitHub, le transport, le HTML, le JavaScript navigateur, les réponses API ou les logs.
4. Absence du secret = fail closed `503 SERVER_PRIVILEGE_UNAVAILABLE`.
5. Les commandes sont une allowlist codée en dur. Aucune commande `rpc`, `sql`, `table`, `function` ou équivalent fournie par le client n'est interprétée.
6. Les paramètres sensibles sont dérivés côté serveur : actor, provider/model, permission scopes, versions de prompt/schema/tool, provenance système et paramètres d'autorité.
7. Les `engine_revision`, fingerprints et idempotency guards restent obligatoires lorsque le RPC sous-jacent les exige.
8. Une erreur stale reste une erreur stale ; le Worker ne retry pas aveuglément avec une nouvelle revision.
9. Les réponses sont minimales et orientées UX. Les payloads LLM bruts, proposed mutations, scopes internes et secrets ne sont pas retournés sauf contrat explicite ultérieur.
10. Les appels service-role restent étroits : jamais de broad table update ni de PostgREST arbitraire piloté par le browser.

## 3. Séparation des catégories d'opérations

### A. Mutations humaines déjà sûres

Quand un RPC est volontairement `authenticated`, vérifie lui-même l'accès et représente une action humaine explicite, il reste directement appelable avec le JWT utilisateur. Exemples actuels :
- `apply_human_information_v1` ;
- `register_idea_source_v1` ;
- `confirm_idea_blueprint_fit_v1`.

Ne pas les faire transiter par `service_role` sans raison : cela supprimerait une partie utile du modèle d'autorisation natif.

### B. Commandes système via adapter

Ces commandes peuvent utiliser des RPCs `service_role only`, mais le navigateur exprime seulement l'intention métier de haut niveau.

Périmètre V0.1 activable :
- `blueprint_fit.assess`.

Périmètre futur possible après contrat/test dédié :
- orchestration d'Action Run ;
- materialization déterministe ;
- génération/promotion d'artefacts ;
- préparation de Decision Package ;
- initialisation Project Definition ;
- évaluation des Gates.

### C. Autorité humaine / expert — EXCLUE de l'adapter générique

Les opérations capables de créer une décision formelle, signer une expertise ou finaliser Build Ready doivent avoir une frontière dédiée qui dérive l'acteur du JWT et vérifie l'autorité exacte. Elles ne sont jamais exposées comme commandes génériques.

Exemples à ne pas exposer directement :
- `record_idea_decision_v2` ;
- toute signature expert ;
- toute décision Project Definition human-owned ;
- `finalize_build_ready_v1` avec un `authorized_by` choisi par le client.

## 4. Endpoint V0.1

`POST /api/ideas/engine`

Requête autorisée :

- `command = "blueprint_fit.assess"`
- `idea_id = UUID`

Aucun autre paramètre métier n'est nécessaire au navigateur pour cette commande.

Le serveur :
1. authentifie l'utilisateur ;
2. charge la projection canonique avec son JWT ;
3. exige `capabilities.can_write=true` ;
4. n'agit que si lifecycle = `CAPTURED_UNCLASSIFIED` ou `BLUEPRINT_MIGRATION_REQUIRED` ;
5. réutilise une assessment courante déjà disponible au lieu de la recalculer inutilement ;
6. sinon classe le type à partir de l'état persistant de l'Idea ;
7. enregistre l'assessment via `record_idea_blueprint_fit_assessment_v1` avec service-role ;
8. auto-applique uniquement si la sortie est `HIGH`, non `AMBIGUOUS` et explicitement `auto_applicable` ;
9. sinon laisse la confirmation humaine à `confirm_idea_blueprint_fit_v1` ;
10. relit la projection user-scoped et renvoie cet état minimal.

## 5. Contrat de classification G0

Sortie serveur structurée :
- `classification`: `SITE_VITRINE | BLUEPRINT_MISMATCH | AMBIGUOUS` ;
- `candidate_type`: texte court ou null ;
- `confidence`: `HIGH | MEDIUM | LOW` ;
- `rationale`: explication courte ;
- `evidence`: liste courte de signaux issus du contenu fourni ;
- `auto_applicable`: booléen.

Règles :
- aucune preuve externe inventée ;
- aucune donnée non présente dans l'Idea ne devient un fait ;
- `auto_applicable=true` n'est accepté par le serveur que pour `HIGH` et non `AMBIGUOUS` ;
- en cas de doute structurel, préférer `AMBIGUOUS` ou `MEDIUM` plutôt qu'un faux fit ;
- `SITE_VITRINE` signifie que le Blueprint `SITE_VITRINE 0.4` couvre suffisamment la structure du besoin actuel ;
- un portail/app/SaaS/marketplace/e-commerce ou workflow applicatif central doit produire mismatch ou ambiguïté selon les éléments disponibles.

## 6. Idempotency et stale-safety

La clé d'assessment est dérivée côté serveur de l'Idea + `engine_revision` + hash de l'entrée persistante ; le client ne la fournit pas.

Si une assessment courante existe déjà pour la projection actuelle, elle est réutilisée.

Si l'Idea change entre la lecture et l'écriture, le RPC Supabase doit rejeter avec `STALE_ENGINE` / `STALE_BLUEPRINT_ASSESSMENT`. Le Worker renvoie `409 STALE_STATE` et ne réécrit pas silencieusement avec la nouvelle revision.

## 7. Fail-closed / erreurs publiques

Codes publics minimaux :
- `401 UNAUTHORIZED`
- `400 INVALID_REQUEST`
- `403 IDEA_ACCESS_DENIED`
- `409 STALE_STATE`
- `409 BLUEPRINT_FIT_ALREADY_RESOLVED`
- `422 HUMAN_CONFIRMATION_REQUIRED` si une commande ultérieure exige une autorité non satisfaite
- `429 AI_CAPACITY`
- `503 SERVER_PRIVILEGE_UNAVAILABLE`
- `503 AI_BINDING_UNAVAILABLE`
- `502 ENGINE_ERROR`

Ne pas transmettre directement les messages SQL internes au navigateur.

## 8. Logs / audit

Le Worker peut loguer uniquement : command, outcome classifié, status code, latency et identifiants non secrets nécessaires au diagnostic.

Interdits dans les logs :
- service-role key ;
- JWT utilisateur ;
- contenu complet privé de l'Idea ;
- données sensibles inutiles ;
- payload LLM complet.

Les mutations métier elles-mêmes restent auditées par les RPCs canoniques lorsque ceux-ci ont un audit contractuel.

## 9. Red-team obligatoire avant activation interactive

1. JWT absent/invalide ;
2. Idea d'un autre workspace ;
3. accès read-only sans write ;
4. commande inconnue ;
5. tentative de fournir `rpc`, `sql`, `function`, `actor`, `authorized_by`, `permission_scope` ou paramètres supplémentaires ;
6. service-role secret absent ;
7. stale revision entre projection et assessment ;
8. même requête répétée ;
9. assessment ambiguë/non auto-applicable ;
10. tentative d'escalade vers décision humaine/expert/Build Ready ;
11. réponse et logs sans secret ;
12. aucun changement d'ACL des RPCs moteur.

## 10. Definition of Done Slice 4 V0.1

- contrat présent dans le repo ;
- module Worker séparé et testable ;
- endpoint fail-closed ;
- secret non commité ;
- seule commande `blueprint_fit.assess` allowlistée ;
- validation syntaxique ;
- tests unitaires ou harness des cas red-team essentiels ;
- aucune activation frontend dépendante du service-role avant provisionnement du secret ;
- `KNOWLEDGE.md` / plan de cutover mis à jour après validation.
