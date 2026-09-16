# 4b4c — Project Definition Runtime Architecture

Date de mise à jour : **2026-09-16**

Ce dossier indexe les contrats runtime de 4b4c. Il ne remplace ni le `README.md` racine — autorité dynamique de production — ni les spécifications propriétaires.

## 1. État réel actuel

### Worker production certifié

Dernier runtime Worker indépendamment certifié :

`v4.5.15-project-definition-rfd-p2` — **build 555**.

Surface Project Definition certifiée :
- adapter `project_definition_adapter_v1.code = 0.1.1` ;
- 11 predicates RFD Master Blueprint ;
- 9 predicates pré-baseline ;
- bridge readiness legacy `G8→G11` ;
- `G4_RFD_LOT` ;
- `G5_RFD_PROJECT` ;
- user-RLS precheck ;
- actor d’approbation injecté depuis le JWT ;
- service role non exposé au navigateur ;
- legacy `G12_READY_FOR_DEVELOPMENT` non muté/relabelled.

Surface G2 active : **`CALC + RAW` uniquement**. AI_H/SRC restent dormant/non annoncés comme capacités actives.

### Supabase canonical pre-project — déjà appliqué

Le backend est en avance sur le Worker live pour la tranche canonique suivante :

- `G0_BLUEPRINT_FIT` ;
- `G1_IDEA_DECISION_READY` ;
- `G2_GO_PROJECT` ;
- `G3_PROJECT_BASELINE` ;
- `FOUNDATION_READY` ;
- `EVIDENCE_READY` ;
- `STRATEGY_READY` ;
- `PREFIGURATION_READY` ;
- `DECISION_PACKAGE_READY`.

Ces predicates sont dérivés et ne constituent pas une seconde base d’état.

Le RPC de promotion G3 renforcé reste **service-side only** et n’est volontairement pas exposé au navigateur.

### Worker candidat pré-projet

Runtime repo candidat :

`v4.5.16-project-definition-preproject-p3`.

Route candidate :

`POST /api/ideas/canonical`

Commandes browser prévues :
- `canonical.read` ;
- `decision.record`.

La promotion G3 n’est pas dans l’allowlist browser.

**p3 n’est pas production-certifié tant que le miroir transport + Cloudflare Workers Builds + live smoke ne l’ont pas prouvé.**

---

## 2. Autorité Blueprint Idea

Le live Blueprint Fit resolver est l’autorité, pas le nom historique des fichiers machine.

État vérifié :
- une nouvelle Idea acceptée `SITE_VITRINE` reçoit actuellement **`SITE_VITRINE@0.5`** ;
- les anciennes Ideas légitimes `SITE_VITRINE@0.4` restent compatibility-supported ;
- le bridge canonique G0 exige que `BlueprintFitDecision.blueprint_version` corresponde exactement à `Idea.blueprint_version` ;
- le bridge P3/P5 n’a pas lui-même activé 0.5.

Invariant : ne jamais confondre « fichier encore nommé candidate » et « version effectivement assignée par le runtime live ».

---

## 3. Master Blueprint canonique

Autorité humaine :

`../canonical/PROJECT_MASTER_BLUEPRINT_V1.md`

Projection machine :

`../machine/MASTER_BLUEPRINT_V1.json`

Bridge runtime :

`../machine/CANONICAL_RUNTIME_BRIDGE_V1.json`

Executable checks :
- `scripts/master-blueprint-v1-check.mjs` ;
- `scripts/canonical-runtime-bridge-v1-check.mjs` ;
- `scripts/project-definition-adapter-v1-check.mjs` ;
- `scripts/idea-canonical-adapter-v1-check.mjs`.

Formal Gates canoniques :

`G0 → G1 → G2 → G3 → G4 → G5`.

Readiness diagnostics ≠ Formal Gates.

---

## 4. Baselines historiques R0→R7

Les validations R1→R7 restent des compatibility baselines pour les objets runtime existants :

- R1 — persistence ;
- R2 — ingestion ;
- R3 — action lifecycle ;
- R4 — prefiguration artifacts ;
- R5 — Decision Package / review / immutable Decision Record ;
- R6 — Approved Idea → Project Definition baseline ;
- R7 — legacy Project Build Ready semantics.

Elles ne remplacent pas la nouvelle ontologie canonique et leurs anciens Gate IDs ne doivent pas être renommés en place.

Legacy `G12_READY_FOR_DEVELOPMENT` reste compatibility evidence uniquement ; il n’est ni G4 ni G5 canonique.

---

## 5. Migrations Master Blueprint / RFD

Runtime Project Definition canonique :
- `20260916153749_project_master_blueprint_v1_core_graph_runtime` ;
- `20260916154153_project_master_blueprint_v1_delivery_lot_dependency_closure` ;
- `20260916154611_project_master_blueprint_v1_dependency_closure_predicates` ;
- `20260916155201_project_master_blueprint_v1_quality_testability_predicates` ;
- `20260916155544_project_master_blueprint_v1_baseline_handoff_predicates` ;
- `20260916155824_project_master_blueprint_v1_g4_rfd_lot` ;
- `20260916155938_project_master_blueprint_v1_g5_rfd_project` ;
- `20260916162910_project_master_blueprint_v1_g4_g5_idempotent_approval` ;
- `20260916165026_project_master_blueprint_v1_complete_rfd_predicate_set`.

Bridge pré-projet canonique :
- `20260916174121_project_master_blueprint_v1_g0_g3_preproject_bridge_p3` ;
- `20260916174307_project_master_blueprint_v1_g0_g3_preproject_bridge_p3_g0_column_fix` ;
- `20260916174852_project_master_blueprint_v1_g3_promotion_actor_hardening_p4` ;
- `20260916182111_project_master_blueprint_v1_g0_blueprint_05_compat_fix_p5`.

Les corrections P3/P5 sont **forward-only**. Ne jamais réécrire une migration déjà appliquée pour rendre l’historique artificiellement propre.

---

## 6. Documents de statut actuels

- `G2_PRODUCTION_ACTIVATION_STATUS_20260916.md` — état G2 ;
- `PROJECT_DEFINITION_RFD_PRODUCTION_STATUS_20260916.md` — G4/G5 et RFD production ;
- `PROJECT_DEFINITION_PREPROJECT_BRIDGE_STATUS_20260916.md` — G0→G3 service-side + p3 repo candidate.

Les anciens plans/validation reports R1→R7 restent utiles pour provenance et compatibility reasoning, mais ne doivent pas être lus comme l’état live actuel.

---

## 7. Sécurité / autorités

Invariants permanents :
- browser jamais détenteur du service role ;
- JWT user vérifié avant toute élévation serveur ;
- user-scoped RLS access proof avant service RPC ;
- décision humaine canonique liée à un fingerprint G1 exact ;
- decision actor injecté par le serveur depuis le JWT ;
- G3 promotion revalide en PostgreSQL : Idea creator ou workspace owner/admin actif ;
- G4/G5 approval actor injecté depuis JWT ;
- stale revision/fingerprint rejeté ;
- retries identiques G4/G5 idempotents ;
- aucun flag manuel `READY_FOR_DEVELOPMENT` canonique.

---

## 8. Validation / release

Avant toute release :

```bash
npm ci
npm run check
```

Production ne passe pas par GitHub Actions.

Chaîne canonique :

1. source validée dans `bayouka/slyzone-motion-scapes-32` ;
2. miroir des seuls fichiers runtime validés vers `bayouka/2b2c/4b4c/` ;
3. vérification byte-alignment ;
4. mise à jour de `4b4c/TRANSPORT_RELEASE.txt` ;
5. Cloudflare Workers Builds ;
6. `scripts/deploy-4b4c-direct.sh` déploie explicitement Worker `4b4c` ;
7. live smoke obligatoire.

Ne jamais appeler un runtime « production » sur la seule base d’un commit GitHub ou d’une migration Supabase.

---

## 9. E2E encore non prouvés

Production ne contient actuellement aucune Idea réelle exploitable pour certifier le nouveau bridge G0→G3.

Restent donc explicitement non prouvés :
- real Idea G0 0.5 read ;
- legacy Idea 0.4 compatibility read ;
- G1 launch closure ;
- G1 early non-GO path ;
- real R5 Decision Package → canonical decision.record ;
- stale G1 fingerprint rejection via Worker ;
- real G2 GO ;
- real G3 Project Baseline promotion ;
- continuité G3→G4→G5 sur un dossier réel ;
- Project Definition authenticated G4/G5 E2E complet.

Une fixture transactionnelle rollbackée prouve l’exécution de l’évaluateur, pas un E2E utilisateur authentifié.

---

## 10. Invariants métier permanents

- Idea ≠ Project ;
- `FOR_DECISION` ≠ `FOR_PROJECT` ≠ `FOR_BUILD` ;
- Requirement exists ≠ question user ;
- Claim ≠ Evidence ≠ Assumption ≠ Recommendation ≠ Decision ;
- Requirement ≠ Test ≠ execution Evidence ;
- accepted unknown ne devient jamais silently known ;
- stale data ne satisfait jamais une Gate current ;
- décision humaine/expert signoff ne sont pas délégués à une IA générique ;
- GO n’est pas privilégié sur REVISE / DEEPEN / PAUSE / STOP ;
- aucune baseline professionnelle ne crée automatiquement backlog/tasks/milestones/delivery Project.
