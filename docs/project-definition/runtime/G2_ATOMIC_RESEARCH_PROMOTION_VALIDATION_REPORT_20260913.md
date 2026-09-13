# 4b4c / 2b2c — G2 Atomic Research Promotion — Validation Report

Date : 2026-09-13

Statut : **ROLLBACKED SQL RED-TEAM PASS — NON ACTIVE — AUCUNE MIGRATION G2 APPLIQUÉE**

## 1. Portée

Ce rapport valide la direction backend candidate pour G2 Evidence / Market sans modifier durablement Supabase ni le runtime production.

Package candidat évalué :
- `sql-candidates/G2_ATOMIC_RESEARCH_PROMOTION_V0_1.sql` — historique de conception, ne pas promouvoir ;
- `sql-candidates/G2_ATOMIC_RESEARCH_PROMOTION_V0_2_HARDENING.sql` — hardening de la promotion atomique ;
- `sql-candidates/G2_RESEARCH_ACTION_V0_3_TARGET_GUARD.sql` — hardening de création de l'Action Run research ;
- `G2_ATOMIC_RESEARCH_PROMOTION_REDTEAM_PLAN_V0_1.md` — plan initial ;
- `G2_RESEARCH_ACTION_ATOMIC_PROMOTION_CONTRACT_V0_1.md` — contrat d'architecture.

Le futur candidat migration devra **consolider** V0.2 + V0.3 dans un seul fichier propre. Les fichiers candidats actuels ne sont pas des migrations.

## 2. Invariant architectural validé

Le flow retenu reste :

`planner → Action Run → recherche externe non canonique → complete(proposals) → promotion transactionnelle → une seule engine_revision`.

Il est interdit de créer/ingérer une Source canonique pendant l'exécution externe puis d'essayer ensuite de promouvoir le même run.

La promotion recherche vérifie avant toute écriture canonique :
- Idea revision ;
- input fingerprint ;
- target Requirement fingerprints ;
- path de recherche ;
- permission scope ;
- source aliases ;
- provenance compatible avec le path ;
- source state/Idea ;
- sensitivity floor.

Stale/mismatch ⇒ zéro Source et zéro Information Item de recherche promues.

## 3. Compilation réelle contre le schéma Supabase

La V0.2 a été créée dans une transaction `BEGIN ... ROLLBACK` sur le backend canonique `wexfzhegiewhldkugtow` avec le bootstrap de lineage Source temporaire.

Résultat : `G2_V0_2_COMPILED`.

Contrôle immédiatement après rollback :
- `idea_sources.created_by_action_run_id` persisté : **false** ;
- `create_action_run_v4` persisté : **false** ;
- `promote_research_action_result_v2` persisté : **false** ;
- helper sensitivity persisté : **false**.

Conclusion : le candidat compile contre le vrai schéma et aucun DDL G2 n'a été conservé.

## 4. Corrections V0.2 issues du red-team

### 4.1 Stale count multi-source

V0.1 écrasait `ROW_COUNT` à chaque Source modifiée.

V0.2 utilise un delta par Source puis :

`v_staled_count := v_staled_count + v_staled_delta`.

Test RT-21 : deux Sources changées avec une observation active chacune → `staled_information_items = 2`.

### 4.2 Sensitivity monotone

Ordre :

`public < internal < personal < sensitive`.

Une Source active ne peut jamais être rétrogradée par un nouveau fetch moins restrictif.

Une Information Item liée à une Source reçoit :

`effective_sensitivity = max(proposed_sensitivity, source_sensitivity)`.

RT-18 : Source `sensitive` + observation proposée `public` → observation canonique `sensitive`.

RT-17 : Source existante `sensitive` + nouveau proposal `public` → Source reste `sensitive`.

### 4.3 Ledger source refs

Les UUID Source directs provenant d'un proposal ne sont pas acceptés.

Format candidat :

`{"source_key":"run-local-alias"}`

Le serveur résout l'alias depuis la Source créée/réutilisée par le run courant puis écrit le `source_id` canonique.

RT-22 : `source_id` direct → `LEDGER_SOURCE_ALIAS_REQUIRED`, rollback complet.

### 4.4 Research path strict

`create_action_run_v4` est réservé à :
- `WEB / RESEARCH_WEB` ;
- `AUDIT / AUDIT` ;
- `CONN / FETCH_CONNECTED`.

Les autres chemins restent sur `create_action_run_v3`.

La promotion research devient evidence-only :
- WEB → `WEB_RESEARCH` ;
- AUDIT → `SOURCE_EXTRACTED` ;
- CONN → `CONNECTOR_EXTRACTED`.

`AI_INFERRED`, `AI_RECOMMENDED`, `SYSTEM_CALCULATED` doivent passer par leurs Action Runs dédiés `AI_H / AI_R / CALC`.

## 5. Hardening V0.3 — target guard avant recherche

La V0.3 ajoute une vérification serveur à la création du run :
- Requirement state doit exister ;
- applicability doit être `ACTIVE` ;
- fingerprint courant doit être exactement celui fourni au run.

La promotion conserve sa seconde vérification du fingerprint.

Résultats rollbackés :
- Requirement absent → `TARGET_REQUIREMENT_STATE_REQUIRED` — PASS ;
- Requirement non actif → `TARGET_REQUIREMENT_NOT_ACTIVE` — PASS ;
- fingerprint déjà périmé → `STALE_TARGET_REQUIREMENT` — PASS ;
- cible valide → run `queued` — PASS ;
- retry même idempotency key → `idempotent=true` — PASS.

## 6. Résultats RT-01 → RT-24

| Test | Résultat | Preuve principale |
|---|---|---|
| RT-01 WEB nominal atomique | PASS | 1 Source + 1 Information Item + 1 revision |
| RT-02 WEB observation sans Source | PASS | `RESEARCH_SOURCE_PROPOSAL_REQUIRED`, 0 write |
| RT-03 Source alias inconnu | PASS | `UNKNOWN_SOURCE_KEY`, rollback |
| RT-04 Source key dupliqué | PASS | `DUPLICATE_SOURCE_KEY`, rollback |
| RT-05 Target fingerprint stale | PASS | run stale, 0 Source |
| RT-06 Concurrent Idea revision | PASS | run stale, 0 Source |
| RT-07 Retry promotion après succès | PASS | `idempotent=true`, aucune revision supplémentaire |
| RT-08 Même URL / même hash | PASS | Source réutilisée, version 1, ancienne observation ACTIVE |
| RT-09 Même URL / hash changé | PASS | version 1→2, ancienne observation STALE, stale count 1 |
| RT-10 Source superseded | PASS | ancienne Source reste superseded, nouvelle Source créée |
| RT-11 WEB provenance sur mauvais path | PASS | `PROVENANCE_PATH_MISMATCH` |
| RT-12 AI inference tente SOURCE_BACKED dans research run | PASS | politique renforcée : `PROVENANCE_PATH_MISMATCH` |
| RT-13 AI recommendation tente OBSERVED dans research run | PASS | politique renforcée : `PROVENANCE_PATH_MISMATCH` |
| RT-14 SOURCE permission / path non-research | PASS | V4 : `RESEARCH_ACTION_PATH_REQUIRED` |
| RT-15 Permission non allowlistée | PASS | `UNSUPPORTED_MUTATION_PERMISSION` |
| RT-16 Cross-Idea/direct Source UUID | PASS | `DIRECT_SOURCE_ID_FORBIDDEN`, rollback |
| RT-17 Sensitivity downgrade Source | PASS | Source conserve `sensitive` |
| RT-18 Sensitivity downgrade Information Item | PASS | observation élevée à `sensitive` |
| RT-19 Timestamp/payload Source invalide | PASS | exception PostgreSQL + rollback |
| RT-20 Multi-source rollback | PASS | erreur Source 2 ⇒ Source 1 non persistée |
| RT-21 Multi-source stale count | PASS | 2 anciennes observations ⇒ count 2 |
| RT-22 Ledger source refs | PASS | UUID direct interdit ; alias serveur requis |
| RT-23 Requirement state manquant | PASS | stale à promotion ; V0.3 empêche désormais le run plus tôt |
| RT-24 G1 non-régression | PASS | cycle RAW v3/start/complete/promote v1 avec lineage temporaire |

## 7. Tests additionnels

### Duplicate Source identity intra-run

Deux aliases différents visant la même identité canonique `(source_kind, normalized_locator)` dans le même run :

`DUPLICATE_SOURCE_IDENTITY` — PASS, rollback total.

### Source identity existante dans le backend

Audit agrégé live : groupes actifs dupliqués `(idea_id, source_kind, locator)` : **0** au moment du test.

Cela rend possible plus tard l'étude d'une contrainte/index d'unicité, mais aucune contrainte durable n'est ajoutée dans cette phase.

## 8. Concurrence

La V0.2 utilise un advisory transaction lock dérivé de :

`Idea + source_kind + normalized_locator`.

But : sérialiser deux promotions concurrentes visant la même identité Source sans imposer immédiatement un nouvel index unique production.

**Limite de preuve actuelle :** les tests exécutés via une seule connexion SQL ne démontrent pas encore une vraie course entre deux sessions concurrentes. Ce test multi-session reste requis avant migration réelle.

Ne pas confondre présence de l'advisory lock et preuve de concurrence complète.

## 9. Rollback / absence de résidu

Après les campagnes rollbackées :
- fixtures G2 restantes : **0** ;
- fonction `create_action_run_v4` persistée : **false** ;
- fonction `promote_research_action_result_v2` persistée : **false** ;
- helper sensitivity persisté : **false** ;
- colonne lineage G2 persistée : **false**.

RT-24 a également été rollbacké.

## 10. G1 non-régression

Avec `idea_sources.created_by_action_run_id` temporairement ajouté dans la transaction :
- `create_action_run_v3` : PASS ;
- `start_action_run_v1` : PASS ;
- `complete_action_run_v1` : PASS ;
- `promote_action_result_v1` : PASS ;
- Source RAW existante conservée ;
- 1 Information Item `SOURCE_EXTRACTED` ;
- 1 Requirement ref `RAW_HUMAN` ;
- engine revision : +1 exactement.

Le candidat G2 n'a donc pas besoin de remplacer ou élargir les fonctions G1.

## 11. Statut de décision

### Validé maintenant

- architecture de promotion atomique ;
- hardening V0.2 ;
- target guard V0.3 ;
- 24 cas du plan initial couverts ;
- tests additionnels intra-run ;
- rollback propre ;
- non-régression G1 transactionnelle.

### Toujours bloquant avant migration G2 réelle

1. consolider V0.2 + V0.3 + bootstrap lineage en un seul candidat migration propre ;
2. exécuter un test de concurrence **multi-session** réel sur même Source identity ;
3. full R0 replay + red-team du Blueprint Site vitrine 0.5 ;
4. critères G1 build 544/runtime/E2E du cutover satisfaits ;
5. migration-history/repo checks après seulement une éventuelle promotion en migration ;
6. aucun déploiement G2 avant validation explicite de ces preuves.

## Conclusion

Le backend G2 Evidence/Market n'est plus au stade d'une simple idée de schéma : la promotion Source + observation a été compilée et red-teamée transactionnellement contre le vrai backend, sans résidu.

Statut précis :

> **SQL DESIGN VALIDATED BY ROLLBACK TESTS — NOT MIGRATED — NOT ACTIVE.**
