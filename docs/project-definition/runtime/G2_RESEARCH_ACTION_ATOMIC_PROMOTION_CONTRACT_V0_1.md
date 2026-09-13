# 4b4c / 2b2c — G2 Research Action Atomic Promotion Contract — V0.1

Date : 2026-09-13

Statut : **DESIGN CANDIDATE — NON ACTIVE — AUCUN SQL APPLIQUÉ**

## 1. Problème résolu

Le design initial envisageait :

`Action Run WEB → record_system_research_source → commit_source_ingestion → complete Action Run → promote result`

Ce flow est rejeté.

Le runtime live confirme que `commit_source_ingestion_v1` incrémente `ideas.engine_revision`. Une Action Run créée à la revision R pourrait donc provoquer elle-même R+1/R+2 en enregistrant ses sources avant de promouvoir ses observations.

Cela crée une contradiction avec la stale-safety :
- `create_action_run_v3` fige revision/fingerprints à R ;
- la recherche produit elle-même des mutations canoniques avant sa promotion ;
- `promote_action_result_v1` exige une `p_expected_engine_revision` égale à la revision courante ;
- accepter simplement la nouvelle revision supprimerait la preuve que les target Requirements sont encore ceux pour lesquels l'action a été lancée.

Principe retenu :

> **Une Action Run de recherche ne modifie aucun état canonique pendant son exécution. Sources + observations + interprétations sont promues atomiquement après validation stale/fingerprint.**

---

## 2. Flow cible

### A. Planification

Le planner G2 calcule sur revision R :
- target Requirements ;
- target Requirement fingerprints ;
- input fingerprint ;
- projection fingerprint ;
- acquisition path ;
- permission scope ;
- sensitivity/external-processing policy.

### B. Action Run

Créer/start l'Action Run avec les primitives R3 versionnées.

Pendant l'exécution :
- recherche provider ;
- fetch sécurisé ;
- extraction ;
- calcul de content hash ;
- classification de source ;
- observations candidates ;
- hypothèses/recommandations candidates.

**Aucune écriture dans `idea_sources`, `idea_information_items` ou le Ledger pendant cette phase.**

### C. Completion

`complete_action_run_v1` enregistre uniquement :
- résultat technique ;
- sources proposées ;
- mutations proposées ;
- coûts/latence ;
- diagnostics.

L'Action Run reste historique même si sa promotion devient stale.

### D. Promotion atomique

Une primitive dédiée candidate — nom de travail `promote_research_action_result_v1` — exécute dans une seule transaction :

1. lock Action Run ;
2. lock Idea ;
3. status `succeeded` et non déjà promu ;
4. revision courante = revision attendue de lancement/promotion ;
5. current Requirement fingerprints = `target_requirement_fingerprints` du run ;
6. input fingerprint toujours admissible ;
7. validation permission/path/provenance/sensitivity ;
8. création/réutilisation/versioning des Sources ;
9. résolution des aliases source locaux ;
10. création des Information Items ;
11. création des Requirement refs ;
12. création éventuelle de Ledger entries autorisées ;
13. stale ciblé d'anciennes observations si un contenu source versionné a réellement changé ;
14. une seule augmentation de `engine_revision` ;
15. `promoted_at/promoted_engine_revision` sur le run ;
16. audit event minimal.

Si un contrôle stale/fingerprint échoue : **aucune Source ni observation canonique n'est écrite**.

---

## 3. Nouveau mutation kind candidat : SOURCE

Le result d'une Action Run G2 peut proposer :

- `SOURCE`
- `INFORMATION_ITEM`
- `LEDGER_ENTRY`

`SOURCE` n'est autorisé que pour des acquisition paths explicitement allowlistés, initialement :
- `WEB` ;
- `AUDIT` lorsqu'une source observable doit être matérialisée ;
- `CONN`.

Il n'est pas autorisé pour :
- `RAW` ;
- `CALC` ;
- `AI_H` ;
- `AI_R`.

G1 continue d'utiliser son permission scope actuel sans `SOURCE`.

---

## 4. SOURCE proposal schema candidat

Champs minimum :

- `kind = SOURCE` ;
- `source_key` — alias local unique dans le run, jamais UUID choisi par le modèle ;
- `source_kind` — `url | connector | system_observation` selon path ;
- `locator` normalisé ;
- `title` optionnel ;
- `content_hash` obligatoire pour une source promue comme ingested ;
- `fetched_at` ;
- `freshness_at` optionnel ;
- `sensitivity` ;
- `metadata` strictement bornée et sans contenu page volumineux.

Interdit :
- actor arbitraire ;
- idea_id différent du run ;
- action_run_id choisi dans la mutation ;
- status arbitraire ;
- source_version arbitraire ;
- UUID source choisi par le provider/LLM ;
- baisse silencieuse de sensitivity.

---

## 5. Source alias → Information Item

Une observation candidate WEB ne doit pas connaître à l'avance un UUID Source.

Elle référence le `source_key` local :

- SOURCE `source_key = web:1`
- INFORMATION_ITEM `source_key = web:1`

La promotion :
1. valide/crée/réutilise la Source ;
2. obtient son UUID serveur ;
3. remplace l'alias par ce `source_id` avant l'insert canonique.

Un alias absent, dupliqué ou non déclaré fait échouer toute la transaction.

---

## 6. Réutilisation et versioning des Sources

Pour `source_kind=url`, la Source est identifiée par une locator normalisée dans le scope de l'Idea.

### Source active + même content hash

- réutiliser le `source_id` ;
- ne pas créer de nouvelle version métier ;
- metadata de fetch/freshness peut être rafraîchie ;
- aucune observation current n'est rendue stale uniquement par un refetch identique.

### Source active + content hash différent

Dans la même transaction de promotion :
- incrémenter `source_version` ;
- mettre à jour content/fetch/freshness ;
- rendre stale les Information Items actifs liés à l'ancienne version/contenu lorsque leur validité dépend de ce contenu ;
- promouvoir les nouvelles observations ;
- une seule revision Idea finale.

### Source superseded

Ne pas la réactiver silencieusement. Créer une nouvelle source ou appliquer une policy explicite versionnée.

---

## 7. Lineage Source ↔ Action Run

Gap de modèle identifié : `idea_sources` n'a actuellement pas de `created_by_action_run_id`.

Candidat minimal :

`idea_sources.created_by_action_run_id uuid null references idea_action_runs(id) on delete set null`

Règles :
- rempli par le serveur uniquement pour la première création système de la Source ;
- `created_by` reste null pour une source système ;
- une Source réutilisée par un autre run conserve son créateur initial ;
- les usages ultérieurs sont traçables via les Action Runs / Information Items / input refs, sans réécrire le créateur.

---

## 8. Fingerprint guard obligatoire

La future promotion research doit comparer côté serveur :

pour chaque `target_requirement_id` du run :

`idea_requirement_states.input_fingerprint == idea_action_runs.target_requirement_fingerprints[requirement_id]`

Un seul mismatch :
- run → `stale` ;
- reason `TARGET_REQUIREMENT_CHANGED_BEFORE_PROMOTION` ;
- aucune mutation canonique.

Le browser/Worker ne fournit jamais une nouvelle target fingerprint pour contourner ce contrôle.

---

## 9. Provenance hardening

### WEB_RESEARCH

Pour une Information Item ciblant un Requirement avec `SOURCE_BACKED` ou `OBSERVED` :
- source alias/source_id obligatoire ;
- Source appartenant à la même Idea ;
- Source current/ingested ;
- source kind compatible `url` ;
- content hash non vide ;
- stale/superseded source rejetée.

### CONNECTOR_EXTRACTED

- source obligatoire ;
- `source_kind=connector` ;
- sensitivity/external policy respectée.

### SOURCE_EXTRACTED

Conserve les règles existantes G1/SRC ; aucune régression.

### SYSTEM_CALCULATED

N'a pas besoin d'une Source unique, mais ses inputs doivent rester traçables dans le run/result/refs.

### AI_INFERRED / AI_RECOMMENDED

Ne peuvent jamais se promouvoir en `SOURCE_BACKED`, `OBSERVED` ou `CALCULATED`.

---

## 10. Sécurité Web

Avant de produire une SOURCE proposal `url`, l'executor doit appliquer :
- HTTPS ;
- normalisation URL ;
- résolution DNS et blocage loopback/private/link-local ;
- revalidation après redirect ;
- protection DNS rebinding ;
- timeout ;
- limites taille/decompression ;
- MIME allowlist ;
- pas d'exécution JS de page ;
- contenu traité comme donnée non fiable ;
- instructions de page jamais exécutées comme prompt/tool policy.

Le SQL ne remplace pas ces protections réseau ; il ajoute des contraintes de cohérence serveur.

---

## 11. Idempotency

L'idempotency canonique reste d'abord celle de l'Action Run.

Une promotion rejouée après succès :
- retourne le même résultat ;
- ne recrée ni Source ni Information Item ;
- n'incrémente pas une seconde fois `engine_revision`.

À l'intérieur du run, `source_key` + locator/content hash doivent être cohérents et uniques.

---

## 12. Tests SQL/red-team requis avant activation

Minimum :

1. WEB source + observation valides → promotion atomique PASS ;
2. WEB observation sans source → reject + rollback total ;
3. alias source inconnu → reject + rollback total ;
4. source d'une autre Idea → reject ;
5. target fingerprint stale → run stale + zéro Source créée ;
6. concurrent human revision → reject/stale + zéro Source créée ;
7. même content hash retry → idempotent ;
8. source content changed → version/stale ciblé + nouvelles observations atomiques ;
9. Source superseded → pas de réactivation silencieuse ;
10. AI_INFERRED tentant SOURCE_BACKED → reject ;
11. WEB path tentant sensitivity downgrade → reject ;
12. G1 RAW extraction continue de PASS sans permission SOURCE.

---

## 13. Décision architecturale

Le candidat `record_system_research_source_v1` séparé décrit dans l'audit initial **ne doit plus être implémenté comme étape pré-promotion normale**.

Il pourrait rester utile un jour pour une ingestion système indépendante d'une Action Run métier, mais ce n'est pas le flow G2 retenu.

Flow G2 retenu :

`plan → Action Run → external work in memory → complete with proposed sources/mutations → atomic promotion → one revision`

Cette architecture évite l'auto-staleness et renforce provenance, idempotency et rollback.

---

## 14. Activation

Aucun SQL correspondant ne doit être appliqué tant que :
- G1 runtime/build 544 n'a pas reçu la preuve E2E exigée par le cutover plan ;
- le Blueprint 0.5 candidat n'a pas obtenu son full R0 replay ;
- les tests/red-team de ce contrat ne sont pas prêts.
