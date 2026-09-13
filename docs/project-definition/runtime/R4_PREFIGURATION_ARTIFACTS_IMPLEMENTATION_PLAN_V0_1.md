# 4b4c — R4 PRÉFIGURATION / ARTIFACTS — IMPLEMENTATION PLAN V0.1

Date : 2026-09-13

Statut : **IMPLEMENTED / VALIDATED BASELINE**

## 1. Objet

R4 introduit la couche persistante qui permet au moteur professionnel 2b2c de produire, versionner, promouvoir, figer et invalider des artefacts de préfiguration destinés à la décision, sans les confondre avec des spécifications finales de développement.

R4 ne crée ni Project d'exécution, ni backlog, ni architecture finale, ni spécification Build Ready.

## 2. Invariants

- tout artefact R4 est `purpose_stage = FOR_DECISION` ;
- tout artefact R4 est `spec_status = CONCEPT_NOT_FINAL_SPEC` ;
- le contenu d'une version est immuable après création ;
- une nouvelle version crée une lignée via `supersedes_artifact_id` ;
- une seule version `current` peut exister par `idea_id + artifact_key` ;
- `input_fingerprint` est obligatoire et porte la fraîcheur exacte ;
- un artefact ne peut être promu ou gelé si ses inputs sont stale ;
- un artefact gelé peut devenir stale sans perdre son statut historique de gel ;
- une maquette haute fidélité ne peut jamais être classée comme preuve utilisateur ;
- R4 ne modifie pas directement la résolution des Requirements ni les Gates ;
- aucun write R4 n'est exposé au navigateur ; les mutations sont `service_role` only.

## 3. Artifact keys R4 autorisées

- `PF.CONCEPT_JOURNEY`
- `PF.CONCEPT_SITEMAP`
- `PF.MESSAGE_HIERARCHY`
- `PF.SEO_CONCEPT`
- `PF.CAPABILITY_SET`
- `PF.VISUAL_TERRITORIES`
- `PF.HIFI_CONCEPT`
- `PF.FEASIBILITY_ENVELOPE`
- `PF.SUCCESS_MODEL`
- `CV.CONCEPT_VALIDATION_RECORD`
- `D21.DECISION_ECONOMICS`
- `A08_CONCEPT_PREFIGURATION`

La liste est volontairement bornée à la préfiguration / décision. Elle pourra être étendue explicitement par une migration future lorsque R5–R7 introduiront leurs propres artefacts.

## 4. Extension de `idea_artifacts`

R4 ajoute :

- `supersedes_artifact_id`
- `created_engine_revision`
- `content_hash`
- `freshness_status`
- `freshness_checked_at`
- `stale_reason`
- `promoted_at`
- `frozen_at`
- `spec_status`
- `evidence_role`
- `idempotency_key`
- `request_fingerprint`

`state` reste la projection lifecycle : `draft / current / frozen / stale / superseded / rejected`.

`freshness_status` est séparé pour préserver le cas important d'un artefact `frozen` qui devient ensuite `stale`.

## 5. Frontières RPC R4

### `create_prefiguration_artifact_v1`

Crée une version immuable en `draft` avec version auto-incrémentée, lignée, hash de contenu, fingerprint d'entrée et idempotency key.

Si un `action_run_id` est fourni, le run doit :
- appartenir à la même Idea ;
- être `succeeded` ;
- cibler l'artifact key ;
- porter le même input fingerprint.

### `promote_prefiguration_artifact_v1`

Passe une version `draft` fraîche à `current`, supersède l'ancienne version courante et incrémente `ideas.engine_revision`.

### `assess_prefiguration_artifact_freshness_v1`

Compare exactement le fingerprint courant fourni avec le fingerprint ayant servi à produire l'artefact et retourne `fresh` ou `stale` sans mutation.

### `mark_prefiguration_artifact_stale_v1`

Marque stale uniquement lorsqu'un fingerprint différent est réellement observé. Un artefact gelé reste `frozen` mais reçoit `freshness_status = stale`.

### `freeze_prefiguration_artifact_v1`

Fige une version `current` fraîche pour une décision. Un `DECISION_SNAPSHOT` peut être lié lorsqu'il existe ; cette liaison deviendra centrale en R5.

## 6. Sécurité

- `authenticated` conserve seulement `SELECT` sur `idea_artifacts` selon la RLS Idea existante ;
- aucun `INSERT/UPDATE/DELETE` direct n'est accordé au client ;
- les 5 RPC R4 sont exécutables seulement par `service_role` et `postgres` ;
- le trigger `protect_idea_artifact_content_v1` interdit toute mutation du contenu/version/provenance d'une version existante.

## 7. Séparation concept / preuve

`evidence_role` distingue :
- `NOT_EVIDENCE`
- `SUPPORTING_EVIDENCE`
- `REAL_USER_EVIDENCE`

`PF.HIFI_CONCEPT` est obligatoirement `NOT_EVIDENCE`. Une maquette, même très réaliste, ne peut donc pas être promue comme preuve utilisateur par ce contrat.

## 8. Relation avec R5

R5 pourra utiliser les versions `current`/`frozen` fraîches pour créer un `DECISION_SNAPSHOT`, produire le Decision Package et contrôler la fraîcheur du deck. R5 ne devra jamais utiliser silencieusement une version stale.
