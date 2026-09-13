# 4b4c — RUNTIME EXECUTION MAPPING RED TEAM — 2026-09-13

Statut : **VALIDATION SUPPORT — NON CANONIQUE**

Scope : `RUNTIME_EXECUTION_MAPPING_V0_1.md` + `PERSISTENCE_MODEL_V0_1.md`.

---

# 1. Verdict global

Architecture viable **si** elle reste additive, déterministe-first et si les états dérivés ne deviennent pas une seconde vérité.

Aucun motif ne justifie actuellement un rewrite du backend Ideas existant.

---

# 2. Risques testés

## RT01 — Double source de vérité

Risque : `ideas.status/readiness` et `idea_requirement_states/Gates` divergent.

Protection :
- ancien status = projection legacy uniquement ;
- nouveau moteur = Requirements/Gates + snapshots ;
- aucune Gate ne lit `ideas.readiness` comme autorité.

PASS sous cette règle.

## RT02 — Explosion de tables

Risque : une table par ledger/domain/requirement.

Protection : 9 objets persistants maximum dans V0.1, dont un ledger générique pour les registres transverses.

PASS.

## RT03 — 77 Requirements matérialisés inutilement

Risque : insérer 77 rows par Idea dès création.

Protection : matérialiser seulement Requirements actifs/évalués, ou cache reconstructible.

PASS.

## RT04 — Run IA stale après changement utilisateur

Scénario : recherche B2C en cours ; cible devient B2B ; le run termine ensuite.

Protection : fingerprint sur dépendances pertinentes + validation avant promotion + résultat stale conservé mais non appliqué.

PASS.

## RT05 — Change global inutile

Risque : toute mutation incrémente Idea version et invalide tout.

Protection : conserver version globale comme garde-fou, mais utiliser fingerprints/edges pour targeted recompute.

PASS.

## RT06 — Workflow long avec JWT expiré

Protection : action autorisée à l'entrée, runner serveur à scope étroit, RPC idempotent, actor provenance.

PASS conceptuel. Spike sécurité requis avant implémentation.

## RT07 — Service role omnipotent

Risque critique.

Protection obligatoire : aucun runner IA avec mutation SQL générique ; seulement RPCs étroits validant action_run, scope et fingerprint.

PASS si respecté ; sinon FAIL architecture.

## RT08 — Recherche déclenchée pour remplir la checklist

Protection : toute recherche vise un Requirement/Decision Requirement actif et possède stop condition.

PASS.

## RT09 — Snapshot énorme

Risque : dupliquer tout le dossier en JSONB à chaque snapshot.

Correction : snapshot doit être un **manifest immutable de références + hashes**, pas une copie profonde systématique de tous les blobs/documents.

PASS avec correction.

## RT10 — Artifact et source blob dans Postgres

Risque : PPTX/PDF/images/documents volumineux en base.

Protection : Postgres stocke metadata/lineage ; Storage/R2 garde blobs selon architecture finale.

PASS.

## RT11 — Project créé trop tôt

Ancien `convert_idea_to_project_v1` crée Project/milestones.

Protection : nouveau GO crée `project_definition`, pas Project execution.

PASS cible ; migration nécessaire.

## RT12 — Préfiguration réécrite entièrement après GO

Protection : artifact promotion direct/deepen/targeted rework.

PASS.

## RT13 — Frontend recalcule lifecycle

Risque : répéter `clarify→strengthen→prove...` dans JS.

Protection : projection fournie par moteur ; frontend affiche value/action/artifact.

PASS.

## RT14 — Coût IA excessif

Protection : deterministic recompute avant AI, cache par fingerprint, actions groupées, modèle routé par difficulté, pas de LLM pour simple readiness.

PASS.

## RT15 — `idea_requirement_states` devient vérité irréconstructible

Protection : considérer comme materialized state/cache auditable ; sources/items/decisions/artifacts restent lineage primaire.

PASS.

## RT16 — Accepted unknown utilisé pour contourner un blocker

Protection : Blueprint/Gate décide si `ACCEPTED_UNKNOWN` est admissible ; autorité/rationale requises pour risque engageant.

PASS.

## RT17 — Model switch modifie silencieusement une décision

Protection : provider/model/prompt/schema version dans Action Run ; recommandations restent proposées jusqu'à promotion déterministe/humaine requise.

PASS.

## RT18 — Conflit entre deux utilisateurs

Protection : plusieurs items/feedback coexistent ; Conflict Ledger ; aucune résolution silencieuse par latest-write-wins sur décision structurante.

PASS.

## RT19 — Source web malveillante / prompt injection

Protection requise : source comme data seulement, prompt isolation, URL/network hardening, allow/deny policy, aucune instruction issue du contenu source.

PARTIAL : `safeUrl` actuel est une base mais insuffisant pour production durcie (DNS rebinding/private resolution/redirect chain). Gate sécurité requise.

## RT20 — Changement de Blueprint

Protection : `blueprint_id/version`, preserve history, requirement states de l'ancien Blueprint non réinterprétés comme nouveau contrat, migration/remap explicite.

PASS.

---

# 3. Corrections incorporées

1. Snapshot = manifest de références/hashes par défaut, pas deep copy.
2. Requirement state = materialized state reconstructible, pas source primaire autonome.
3. Blob files hors Postgres.
4. Aucun durable runner avec service-role générique.
5. Network/source hardening devient prerequisite d'implémentation research.

---

# 4. Recommandation d'implémentation future par slices

## Slice R0 — Pure deterministic engine

Sans nouvelle IA : loader Blueprint, contexts, applicability, dependency traversal, Gate evaluation, fingerprint helper, tests.

## Slice R1 — Persistence foundation

Sources, Information Items, Requirement States, Action Runs, snapshots minimal + RPCs/RLS.

## Slice R2 — Ingestion/extraction

RAW FIRST, source provenance, structured proposed mutations, deterministic promotion.

## Slice R3 — Autonomous actions

Challenge/research/compare/recommend avec fingerprint/stale safety.

## Slice R4 — Prefiguration/artifacts

Sitemap/journey/capabilities/visual concept versionnés.

## Slice R5 — Decision Package + review

Snapshot, memo/deck specs, feedback/change impact, approval.

## Slice R6 — Project Definition

Promotion baseline + D08→D20.

## Slice R7 — Build Ready

Traceability, ambiguity audit, build snapshot, handoff.

Cette séquence minimise les risques et permet de tester le moteur avant toute refonte UX importante.

---

# 5. Verdict

**PASS CANDIDATE WITH IMPLEMENTATION GATES.**

Le prochain travail n'est pas une migration SQL immédiate. Il faut d'abord produire :

- le contrat précis du deterministic engine ;
- les RPC/mutation boundaries ;
- le mapping de migration legacy → new engine ;
- les tests de slices R0/R1.

Aucun changement runtime/prod n'est autorisé par ce red-team.