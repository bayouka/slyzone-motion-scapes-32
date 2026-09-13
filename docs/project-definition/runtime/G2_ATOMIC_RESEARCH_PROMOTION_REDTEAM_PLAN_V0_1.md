# 4b4c / 2b2c — G2 Atomic Research Promotion — Red-Team Plan V0.1

Date : 2026-09-13

Statut : **TEST PLAN CANDIDATE — AUCUN SQL G2 APPLIQUÉ**

## Objectif

Définir les tests qui doivent échouer ou réussir avant que `G2_ATOMIC_RESEARCH_PROMOTION_V0_1.sql` puisse devenir une migration réelle.

Le test doit être exécuté sur une fixture contrôlée et rollbackée ou sur une branche Supabase dédiée. Ne pas faire de DDL durable en production pour valider le candidat.

## Invariants testés

- aucune Source canonique écrite pendant l'exécution externe d'un Action Run ;
- promotion = une transaction ;
- une seule augmentation de `engine_revision` par promotion réussie ;
- target Requirement fingerprints revalidés côté serveur ;
- stale run = zéro Source/Information Item canonique ;
- WEB source-backed = Source canonique obligatoire ;
- aucune source cross-Idea ;
- aucune baisse de sensibilité ;
- idempotence réseau sans doublons ;
- G1 v3 et RAW restent inchangés.

## RT-01 — WEB nominal atomique

Préconditions : Idea active à revision R ; Requirement G2 current avec fingerprint F ; Action Run `WEB/RESEARCH_WEB` créé à R via candidate v4 ; permission scope `SOURCE + INFORMATION_ITEM` ; SOURCE proposal `url` + content hash ; observation `WEB_RESEARCH` ciblant F avec `SOURCE_BACKED`.

Attendus : 1 Source ingested ; 1 Information Item ; 1 Requirement ref ; run promoted ; Idea = R+1 exactement ; `created_by_action_run_id` sur Source et Information Item ; audit minimal ; aucune deuxième hausse de revision.

## RT-02 — WEB observation sans Source

Supprimer la SOURCE proposal ou son `source_key`.

Attendu : rejet transactionnel complet ; 0 Source, 0 Information Item, revision inchangée.

## RT-03 — Source alias inconnu

Information Item référence `source_key=web:missing`.

Attendu : `UNKNOWN_SOURCE_KEY`, rollback total.

## RT-04 — Source key dupliqué

Deux SOURCE proposals avec le même `source_key`.

Attendu : `DUPLICATE_SOURCE_KEY`, rollback total.

## RT-05 — Target fingerprint stale

Après création du run, modifier matériellement le Requirement par un chemin canonique autorisé.

Attendu à la promotion : run → stale ; reason `TARGET_REQUIREMENT_CHANGED_BEFORE_PROMOTION` ou revision-change équivalent ; 0 Source créée ; 0 observation créée.

## RT-06 — Concurrent Idea revision

Après run@R, appliquer une mutation canonique sans rapport direct qui fait passer l'Idea à R+1.

Attendu : run stale par revision guard ; zéro mutation research.

Ce test confirme la policy conservatrice actuelle : toute mutation Idea concurrente invalide le run research, même si un futur moteur pourrait raffiner ce comportement avec des fingerprints plus granulaires.

## RT-07 — Retry promotion après succès

Appeler deux fois la promotion du même run.

Attendus second appel : `idempotent=true` ; même promoted revision ; aucune Source/Information Item supplémentaire ; aucune nouvelle hausse de revision.

## RT-08 — Même URL / même content hash dans un nouveau run

Nouveau run fresh découvrant une Source active déjà ingested avec même locator normalisée + même content hash.

Attendus : Source réutilisée ; `source_version` inchangée ; aucune ancienne observation rendue stale uniquement à cause du refetch ; nouvelles observations du run peuvent être promues si elles ne sont pas duplicatives selon le contrat d'action.

## RT-09 — Même URL / content hash changé

Source active existante, nouveau contenu.

Attendus : même Source réutilisée ; `source_version +1` ; anciens Information Items actifs liés à cette Source → STALE ; nouvelles observations promues atomiquement ; une seule hausse de revision Idea pour l'ensemble ; stale count cumulé correctement si plusieurs Sources changent dans le même run.

## RT-10 — Source superseded

Une ancienne Source de même locator est `superseded`.

Attendu : ne jamais la réactiver silencieusement. Une nouvelle Source peut être créée selon la policy, avec lineage propre.

## RT-11 — WEB provenance avec mauvais path

Run `AUDIT` proposant `WEB_RESEARCH`.

Attendu : `PROVENANCE_PATH_MISMATCH` + rollback.

## RT-12 — AI inference tente SOURCE_BACKED

Information Item `AI_INFERRED` + resolution level `SOURCE_BACKED`.

Attendu : `PROVENANCE_LEVEL_MISMATCH`.

## RT-13 — AI recommendation tente OBSERVED

`AI_RECOMMENDED` + `OBSERVED`.

Attendu : rejet.

## RT-14 — Permission SOURCE sur path interdit

Créer candidate Action Run v4 avec path `RAW`, `CALC`, `AI_H` ou `AI_R` et permission `SOURCE`.

Attendu : `SOURCE_PERMISSION_PATH_FORBIDDEN`.

## RT-15 — Permission mutation non allowlistée

Ajouter `ARTIFACT`, `SQL`, `DECISION` ou autre kind.

Attendu : rejet à la création du run.

## RT-16 — Cross-Idea Source

Tenter de faire référencer à une observation une Source appartenant à une autre Idea, directement ou par alias falsifié.

Attendu : impossible ; alias server-owned dans le run courant seulement. Toute variante avec UUID direct doit être rejetée.

## RT-17 — Sensitivity downgrade Source

Source existante `personal` ou `sensitive`, proposal du nouveau run à `public`.

Attendu : la Source conserve le niveau le plus restrictif ; aucune baisse.

## RT-18 — Sensitivity downgrade Information Item

Observation issue d'une Source `sensitive` proposée comme `public`.

Attendu cible : rejet ou élévation automatique au minimum de la Source. Le comportement final doit être explicitement choisi avant promotion du SQL candidat.

**Point ouvert détecté pendant red-team : le SQL V0.1 doit encore durcir ce contrôle au niveau Information Item.**

## RT-19 — Invalid timestamp / malformed SOURCE payload

`fetched_at` invalide, content hash vide, locator WEB vide, source_kind incompatible.

Attendu : rollback total, aucune écriture partielle.

## RT-20 — Multi-source rollback

Run contient 3 Sources ; la troisième est invalide après traitement logique des deux premières.

Attendu : transaction complète rollbackée ; aucune des 3 Sources ne persiste.

## RT-21 — Multi-source stale count

Deux Sources existantes changent et chacune possède des observations actives.

Attendu : `staled_information_items` = somme des lignes staled, pas seulement le dernier `ROW_COUNT`.

**Point ouvert détecté : le SQL V0.1 doit utiliser un compteur delta cumulé.**

## RT-22 — Ledger source refs

Une Ledger entry issue d'un run research ne doit pas pouvoir injecter un `source_id` cross-Idea dans `source_refs`.

Attendu cible : soit source aliases résolus côté serveur, soit `source_refs` directs interdits dans V1. Le SQL candidat actuel doit être durci avant migration.

## RT-23 — Missing current Requirement state

Run cible un Requirement dont le row `idea_requirement_states` a disparu/recalculé.

Attendu : stale, zéro mutation.

## RT-24 — G1 non-régression

Rejouer intégralement : `create_action_run_v3` ; RAW Foundation extraction ; `promote_action_result_v1` ; adapter G1 red-team.

Attendu : comportement strictement inchangé. G1 ne reçoit jamais la permission `SOURCE`.

## Corrections exigées avant premier test SQL

Le review du candidat V0.1 a déjà identifié trois hardenings à apporter avant même une exécution rollbackée :

1. **cumuler** le nombre d'Information Items staled sur plusieurs Sources ;
2. interdire/élever toute **sensitivity d'Information Item inférieure à celle de sa Source** ;
3. empêcher les `Ledger source_refs` arbitraires/cross-Idea — préférer des aliases résolus serveur ou interdire ces refs directs dans la première version.

Le fichier SQL V0.1 est donc un candidat de conception, pas encore un candidat de migration.

## Exit criteria

La promotion atomique ne peut devenir une migration que si :
- ces hardenings sont intégrés ;
- tous les tests RT applicables passent en transaction rollbackée/branche dédiée ;
- migration-history check reste propre ;
- G1 non-régression passe ;
- Blueprint 0.5 full R0 replay passe ;
- G1 runtime/E2E prerequis du cutover est satisfait.
