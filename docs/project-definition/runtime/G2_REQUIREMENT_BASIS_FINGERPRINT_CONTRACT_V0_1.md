# 4b4c / 2b2c — G2 Requirement Basis Fingerprint Contract V0.1

Date : 2026-09-13

Statut : **CANDIDATE — REQUIRED BEFORE G2 ACTIVATION**

## 1. Problème

Le premier recompute G2 candidat construisait `idea_requirement_states.input_fingerprint` avec :
- état de résolution ;
- niveaux ;
- refs produites ;
- dépendances.

Cela convient à un snapshot d'état, mais pas idéalement à la stale-safety d'une Action Run : le fingerprint d'entrée peut changer simplement parce que l'action vient de produire sa propre sortie.

## 2. Décision

Pour G2, `input_fingerprint` devient un **basis fingerprint** :

> hash des inputs, du contexte, de l'applicabilité et des dépendances qui déterminent le travail à faire, en excluant le résultat propre de la Requirement.

La résolution reste portée séparément par :
- `resolution_state` ;
- `resolution_levels` ;
- `resolution_refs` ;
- `lock_state` ;
- `authority_ok`.

Le `projection_fingerprint` du planner inclut basis + états/résolutions et change donc bien lorsqu'un résultat apparaît/disparaît.

## 3. Resolution signature des dépendances

Un enfant doit changer de basis lorsqu'une dépendance change de valeur/résolution, même si le basis propre de la dépendance reste stable.

Helper candidat :

`requirement_resolution_signature = hash(input_fingerprint + resolution_state + resolution_levels + resolution_refs + authority_ok + applicability)`.

Le basis d'une Requirement dépendante utilise la **resolution signature** de ses parents.

## 4. Fraîcheur des résultats machine

Pour un Information Item créé par une Action Run :

il ne peut contribuer à une Requirement current que si :
- l'Action Run est promue ;
- son target Requirement basis fingerprint correspond au basis current ;
- l'Information Item est `ACTIVE` ;
- sa Source éventuelle n'est ni stale, failed ni superseded.

Sinon l'item reste historique mais ne satisfait plus la Requirement current.

Pour une Information Item humaine/directe sans Action Run, les règles de source/state et Change Impact continuent de s'appliquer.

## 5. Basis candidates G2

### PRIMARY_NEED / OBJECTIONS_TRUST
- Blueprint/version ;
- applicability ;
- resolution signature de `PRIMARY_AUDIENCE`.

### EXISTING_SITE
- creation/redesign resolution signature ;
- contexte/source-input selection géré aussi par l'Action Run `input_fingerprint` spécifique.

### EXISTING_AUDIT
- resolution signature d'`EXISTING_SITE`.

### EVIDENCE_QUALITY
- fingerprint de l'inventaire Sources current (identity/version/hash/status/freshness/sensitivity).

### MARKET_CONTEXT
- resolution signatures `ORG_CONTEXT + PRIMARY_AUDIENCE + OFFER_BASELINE`.

### COMPETITOR_SET
- resolution signature `MARKET_CONTEXT` ;
- materiality decision/rationale fingerprint.

Les Sources découvertes par la recherche sont **outputs**, donc ne sont pas injectées dans le basis qui a lancé cette même recherche.

### PATTERN_GAP_SYNTHESIS
- resolution signatures `COMPETITOR_SET + EXISTING_AUDIT` ;
- materiality context.

### RESEARCH_SUFFICIENCY
- resolution signatures `PATTERN_GAP + EXISTING_AUDIT + EVIDENCE_QUALITY` ;
- source inventory fingerprint ;
- materiality context.

## 6. Fresh Action Run blocking

Une Action Run déjà **promue** ne doit pas bloquer éternellement une nouvelle action si la Requirement est de nouveau unresolved.

Pour éviter le faux blocage :
- `queued` / `running` fresh → bloque doublon ;
- `succeeded` mais non promue → bloque doublon / attend promotion ;
- `succeeded + promoted_at != null` → ne bloque pas une nouvelle action si la Requirement current n'est plus satisfaite.

Le target basis différent après changement d'inputs empêche déjà la réutilisation stale.

## 7. Pourquoi ne pas ajouter immédiatement une nouvelle colonne

Le schéma possède déjà `input_fingerprint`, dont le nom correspond précisément au concept de basis fingerprint.

Le candidat G2 peut donc corriger sa sémantique sans migration de colonne supplémentaire. G1 actif reste inchangé tant qu'aucune réouverture explicite n'est décidée.

## 8. Invariants

- own output ≠ own input ;
- dependency change → basis change ;
- stale machine result cannot satisfy current Requirement ;
- historical result is preserved ;
- promoted old run cannot suppress future necessary work ;
- action-specific source/query hash reste dans `idea_action_runs.input_fingerprint` ;
- Requirement basis fingerprint reste au niveau Requirement/dependency graph.
