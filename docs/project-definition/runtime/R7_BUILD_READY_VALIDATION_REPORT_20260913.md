# 4b4c — R7 BUILD READY — VALIDATION REPORT

Date : 2026-09-13

Verdict : **PASS_BUILD_READY_RUNTIME_BASELINE**

## 1. Périmètre validé

R7 couvre la Project Definition après R6 jusqu'à une frontière `READY_FOR_DEVELOPMENT` réellement contrôlée : Requirements Project, applicabilité, autorité, Gates G8→G12, artefacts A19→A25, stale-safety et Build Ready Snapshot.

Migrations live et sources GitHub :

- `20260913040538_idea_engine_r7_build_ready_runtime`
- `20260913040724_idea_engine_r7_gate_semantics_hardening`
- `20260913040751_idea_engine_r7_human_decision_authority`
- `20260913040802_idea_engine_r7_r6_artifact_linkage`
- `20260913040853_idea_engine_r7_artifact_rpc_fix`

## 2. Happy path

Résultat : **R7_HAPPY_PATH_PASS**.

Le scénario transactionnel a validé :

`Idea → R4 artifact → R5 Decision Snapshot/Package → promotable Decision Record → R6 Project Definition baseline → R7 Requirements → G8/G9/G10/G11 → A19→A25 → human READY approval → BUILD_READY_SNAPSHOT`.

Vérifications :

- le Build Ready Snapshot est créé seulement après satisfaction des minima ;
- les artefacts A19→A25 sont présents, courants et frais avant freeze ;
- A25 est `FOR_BUILD / BUILD_SPEC` ;
- les Requirements applicables sont gelées `FROZEN_FOR_BUILD` ;
- G12 devient READY ;
- aucun `public.projects` d'exécution n'est créé.

Toutes les données du test ont été rollbackées.

## 3. Bug trouvé et corrigé pendant validation

Le premier happy path a détecté un bug réel dans `create_project_definition_artifact_v1` : une ambiguïté PL/pgSQL entre un identifiant local et la colonne `id`.

Correction additive :

`20260913040853_idea_engine_r7_artifact_rpc_fix`.

Le happy path a été rejoué après correction et est passé.

## 4. Red-team final

Résultat : **R7_REDTEAM_PASS — 5/5** avec rollback propre.

### 4.1 Premature Build Ready

Tentative : finaliser immédiatement après initialisation Project Definition.

Résultat attendu/obtenu : `BUILD_READY_GATES_NOT_SATISFIED`.

### 4.2 Human authority bypass

Tentative : faire accepter `SV.D16.DELIVERY_APPROACH` par `SYSTEM`.

Résultat attendu/obtenu : `HUMAN_DECISION_AUTHORITY_REQUIRED`.

### 4.3 Expert signoff bypass

Contexte `SV.D17.EXPERT_SIGNOFF` activé, puis tentative de résolution non experte.

Résultat attendu/obtenu : `EXPERT_SIGNOFF_AUTHORITY_REQUIRED`.

### 4.4 ACCEPTED_UNKNOWN comme fausse spec

Tentative : résoudre `SV.D08.JOURNEY_SPEC` avec `ACCEPTED_UNKNOWN`.

Résultat : G8 reste `NOT_READY`.

Conclusion : une inconnue acceptée peut être suivie, mais ne remplace pas une spec structurelle exigée par la Gate.

### 4.5 Artefact stale après changement Requirement

A19 créé/promu sur D08 v1, puis D08 modifié en v2.

Tentative : réutiliser/promouvoir l'ancien A19.

Résultat attendu/obtenu : `PROJECT_ARTIFACT_INPUTS_STALE`.

## 5. ACL / sécurité

Vérification live des fonctions R7 : `EXECUTE` est accordé uniquement à `postgres` et `service_role`.

Aucun RPC R7 critique n'est appelable directement par `authenticated` ou `anon`.

Tables :

- `project_definition_requirement_states` : authenticated SELECT seulement + RLS ;
- `project_definition_gate_states` : authenticated SELECT seulement + RLS ;
- `project_definition_mutation_receipts` : pas de grant authenticated/anon, service-role only.

Le linter Supabase signale `RLS Enabled No Policy` sur `project_definition_mutation_receipts`. C'est intentionnel : cette table est une table interne moteur, sans accès client. Ajouter une policy client serait contraire au contrat de sécurité R7.

Les autres warnings security/performance observés sont antérieurs ou hors périmètre R7 (legacy security-definer surface, leaked-password protection, anciennes RLS/performance notices).

## 6. Validation de continuité R6 → R7

La migration `20260913040802_idea_engine_r7_r6_artifact_linkage` :

- rattache automatiquement les artefacts R6 `FOR_PROJECT / PROJECT_DEFINITION` à la Project Definition issue du même Approved Idea Snapshot ;
- empêche ensuite la modification silencieuse de `project_definition_id`.

La Project Definition approfondit donc l'Idea approuvée plutôt que de redémarrer de zéro.

## 7. Stale-safety / versioning

Validé :

- `definition_revision` sur les mutations Project ;
- idempotency receipts pour les écritures ;
- context fingerprint pour applicability ;
- fingerprints par artefact ;
- A25 dépend des artefacts A19→A24 et du state complet ;
- changement Requirement invalide la réutilisation silencieuse des artefacts descendants ;
- Build Ready exige la version exacte des outputs courants.

## 8. Autorité

Validé :

- delivery approach : humain autorisé ;
- accessibility target : humain autorisé ;
- implementation discretion : humain autorisé ;
- Ready approval : décision humaine formelle ;
- expert signoff : autorité experte explicite quand applicable ;
- IA/système ne peuvent pas s'attribuer ces autorités.

## 9. Données de production

Les fixtures happy-path et red-team ont été exécutées dans des transactions annulées.

Aucune donnée de test R7 n'a été conservée.

Les seules modifications persistantes sont les migrations runtime prévues.

## 10. Advisors

Après R7 :

- pas de nouveau missing-FK-index R7 ;
- pas de nouveau RPC R7 exposé à authenticated/anon ;
- l'INFO RLS/no-policy de `project_definition_mutation_receipts` est volontaire car aucune lecture/écriture client n'est accordée ;
- les avis historiques restent une dette séparée et ne sont pas une justification pour rouvrir R7.

## 11. Hors validation R7

R7 ne valide pas encore :

- un cutover frontend vers ce moteur ;
- l'UX post-capture finale ;
- E2E navigateur multi-utilisateur de la future surface moteur ;
- le passage Project Definition → Project de delivery ;
- une nouvelle release frontend/Worker.

## 12. Verdict

**R7 = PASS_BUILD_READY_RUNTIME_BASELINE.**

Le cycle backend/règles métier `R0 → R7` possède désormais une baseline validée pour le Blueprint Site vitrine.

La prochaine phase logique n'est pas un R8 arbitraire. Elle est : **Integration / UX projection / cutover plan**, avec reprise du workspace post-capture contre les contrats R0→R7, intégration incrémentale et E2E avant bascule production.
