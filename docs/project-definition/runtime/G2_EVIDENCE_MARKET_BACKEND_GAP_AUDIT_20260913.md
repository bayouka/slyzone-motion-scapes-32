# 4b4c / 2b2c — G2 EVIDENCE & MARKET — BACKEND GAP AUDIT

Date : 2026-09-13

Statut : **AUDIT PASS — DESIGN REFINED — IMPLEMENTATION G2 BLOQUÉE PAR VALIDATION G1 RUNTIME/E2E**

Objet : vérifier les primitives backend déjà disponibles avant toute implémentation de G2 et identifier seulement les gaps réels.

## Résumé

Le runtime actuel possède déjà l'essentiel de la mécanique générique nécessaire :
- acquisition paths `RAW/SRC/AUDIT/CONN/WEB/CALC/AI_H/AI_R` ;
- Action Runs idempotents et stale-safe ;
- Requirement target fingerprints ;
- machine provenance ;
- Requirement resolution refs ;
- Sources versionnées ;
- promotion contrôlée d'Information Items / Ledger entries.

G2 ne nécessite donc pas un nouveau moteur parallèle.

L'audit approfondi a invalidé le premier design de création de Source système séparée avant promotion : il créerait un risque d'auto-staleness de l'Action Run.

Le contrat correct est désormais : `G2_RESEARCH_ACTION_ATOMIC_PROMOTION_CONTRACT_V0_1.md`.

## 1. Source système pré-promotion — DESIGN INITIAL REJETÉ

`register_idea_source_v1(...)` reste une frontière humaine (`auth.uid()`, `can_write_idea`, `created_by=v_user`) et ne doit pas être détourné côté service.

`commit_source_ingestion_v1(...)` est service-role only, mais incrémente `ideas.engine_revision`.

Une Action Run WEB créée à la revision R qui enregistrerait/ingérerait ses propres sources avant promotion modifierait donc elle-même l'état canonique dont dépend sa stale-safety :

`run@R → source write → revision R+1 → promotion du run@R`.

Décision : ne pas implémenter `record_system_research_source_v1` comme étape normale G2.

Flow retenu :

`plan → Action Run → recherche/fetch en mémoire → complete avec SOURCE + observations proposées → promotion atomique → une seule engine_revision`.

## 2. Atomic research promotion — GAP CONFIRMÉ

Il manque une primitive capable de promouvoir en une transaction :
- Sources découvertes ;
- Information Items ;
- Requirement refs ;
- Ledger entries autorisées ;
- version/stale ciblé des Sources existantes si leur contenu change ;
- audit ;
- une seule hausse de revision.

Nom candidat : `promote_research_action_result_v1`.

Avant mutation : run succeeded/non promu, Idea/revision courante, target Requirement fingerprints exacts, input fingerprint, path, permission scope, provenance, sensitivity et source aliases doivent être validés.

Tout stale/fingerprint mismatch doit produire **zéro écriture canonique**.

## 3. WEB_RESEARCH provenance — HARDENING REQUIS

Le live `promote_action_result_v1` supporte `WEB_RESEARCH` et limite ses resolution levels à `SOURCE_BACKED/OBSERVED`, mais n'impose pas actuellement de Source pour WEB.

Il ne compare pas non plus encore les `target_requirement_fingerprints` du run aux fingerprints courants lors de la promotion générique.

Exigence G2 :
- Source persistée obligatoire dans la même transaction ;
- source `url`, même Idea, current/ingested, content hash ;
- stale/superseded rejetée ;
- target fingerprint guard serveur obligatoire.

`WEB_RESEARCH + SOURCE_BACKED` sans Source canonique est interdit.

## 4. Source lineage — PETIT GAP DE MODÈLE

`idea_sources` n'a pas actuellement de `created_by_action_run_id`.

Candidat minimal : colonne nullable FK vers `idea_action_runs`, remplie serveur uniquement pour la première création système. `created_by` reste réservé à la création humaine.

## 5. Legacy research capability — RÉUTILISER LA CAPACITÉ, PAS LE WORKFLOW

`src/idea-research.js` prouve qu'une capacité existe historiquement (Workers AI, Tavily optionnel, recherche, inspection URL), mais elle travaille sur le legacy et ne respecte pas Action Runs/fingerprints/provenance atomique G2.

Réutilisable : provider Tavily, Workers AI, certains patterns fetch/timeout.

À remplacer/renforcer : legacy state, provenance, atomic source promotion, sensitivity, SSRF/DNS rebinding et prompt-injection isolation.

## 6. COMPETITOR_SET conditionnel — CANDIDAT MACHINE 0.5 PRÉPARÉ

Le défaut 0.4 est isolé dans un candidat non actif : `CONTEXT_OVERLAYS_V0_3.yaml`, `OVERRIDES_V0_2_G2_CANDIDATE.yaml`, `BLUEPRINT_SITE_VITRINE_V0_5_CANDIDATE.yaml`, moteur/test candidats.

Direction : benchmark matériel par défaut en greenfield ; peut devenir non matériel pour une refonte avec audit `OBSERVED` + evidence quality `CALCULATED`, sans besoin explicite de comparaison marché. Audit stale/conflicted ne peut pas le désactiver. Les dépendances deviennent des préconditions transitives candidates.

Statut : **TARGETED PASS / full R0 replay pending / non actif**.

## 7. Ce qui NE manque pas

Ne pas recréer : table de jobs, lifecycle async, Action Run idempotency, provenance types, Requirement refs, resolution levels, audit events génériques ou browser service-role boundary.

## 8. Ordre minimal après validation G1

1. full R0 replay du candidat 0.5 ;
2. permission `SOURCE` path-scoped pour Action Runs G2 ;
3. lineage Source↔Action Run minimal ;
4. promotion research atomique + target fingerprint guards ;
5. tests SQL rollbackés/red-team ;
6. planner G2 ;
7. executors WEB/AUDIT/CALC/AI_H/AI_R ;
8. adapter `evidence.advance` ;
9. artefacts A03/A04/A05 ;
10. UI Workspace ;
11. E2E + Cloudflare certification.

Aucune migration/extension runtime G2 avant satisfaction des critères G1 du cutover plan.

## Conclusion

G2 reste techniquement faisable par extension additive de l'architecture actuelle, mais la Source doit appartenir à la **même transaction de promotion que l'observation** pour préserver stale-safety et provenance.

Aucun changement Supabase G2 n'a été appliqué pendant cet audit.
