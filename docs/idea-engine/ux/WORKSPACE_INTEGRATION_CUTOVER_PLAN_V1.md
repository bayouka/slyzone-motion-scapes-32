# 4b4c / 2b2c — WORKSPACE INTEGRATION / CUTOVER PLAN V1

Date initiale : 2026-09-13  
Dernière consolidation : 2026-09-16

Statut : **ACTIVE CUTOVER — CANONICAL G0→G5 RUNTIME ACTIVE — LEGACY RETIREMENT PARTIALLY STARTED — FULL AUTHENTICATED E2E STILL REQUIRED**

Objectif : remplacer progressivement le workspace Idea historique par le parcours canonique `Idea → décision → Project Definition → READY_FOR_DEVELOPMENT`, sans big-bang, sans baisse de sécurité et sans rendre l'application inutilisable pendant la transition.

> Le statut dynamique de production, le build certifié courant et la surface runtime active sont définis dans `README.md`. Ce document décrit le cutover et ne doit plus servir de source de vérité pour un numéro de build courant.

## 0. Autorité et règles de travail

- GitHub `bayouka/slyzone-motion-scapes-32/main` reste la source canonique du produit/runtime.
- Supabase `wexfzhegiewhldkugtow` reste le backend/state canonique.
- `bayouka/2b2c/4b4c/` reste uniquement le miroir de transport Cloudflare.
- Cloudflare Workers reste le chemin normal de build/déploiement/runtime.
- Remote Desktop Commander n'appartient pas au workflow normal ; son indisponibilité ne doit jamais bloquer l'avancement.
- chaque tranche reste testable et rollbackable ;
- aucun assouplissement des RPC `service_role only` n'est autorisé pour simplifier le frontend ;
- les RPC privileged browser-callable passent par les adapters Worker authentifiés et allowlistés ;
- l'historique GitHub des migrations doit correspondre exactement au backend Supabase réel ;
- l'ancien orchestrateur n'est retiré qu'après équivalence UX/fonctionnelle et preuve E2E suffisante ;
- les anciennes gates G8→G12 restent de la compatibilité interne et ne déterminent plus `READY_FOR_DEVELOPMENT`.

## Slice 1 — Canonical read projection — DONE / ACTIVE

Livrable principal : `get_idea_workspace_projection_v1`.

La projection canonique agrège l'état Idea/Project Definition sans reconstruire une progression artificiellement séquentielle. Elle ne doit pas publier un pourcentage global de maturité comme autorité produit.

État actuel : la projection inclut désormais la Delivery canonique et expose G4/G5 comme autorité de readiness lorsqu'une Project Definition existe.

## Slice 2 — G0 / Blueprint Fit — DONE / ACTIVE

Livrables principaux :
- `idea_blueprint_fit_assessments` ;
- `idea_blueprint_fit_decisions` ;
- assessment et application contrôlés côté serveur ;
- confirmation humaine lorsque nécessaire ;
- reclassification après changement matériel.

Garanties maintenues :
- Site vitrine n'est jamais forcé par défaut ;
- assessment IA/système ≠ vérité humaine ;
- stale/supersession après changement matériel ;
- mismatch conserve RAW, sources et historique ;
- `BLUEPRINT_MIGRATION_REQUIRED` bloque la réutilisation silencieuse d'un Blueprint douteux.

## Slice 3 — Workspace V3 — ACTIVE TRANSITION SURFACE

Frontend :
- `site/assets/ideas-workspace-v3-preview.js` ;
- `site/assets/ideas-workspace-v3-preview.css` ;
- route `#/ideas/<idea_id>/workspace-v3`.

Workspace V3 est la surface canonique de transition pour l'Idea Decision Dossier et la Project Definition. Il affiche notamment G4/G5 comme readiness authority et indique explicitement que G8→G12 ne sont plus l'autorité de `Prêt à développer`.

Le cutover total de la page Idea historique n'est pas encore déclaré terminé faute de parcours authentifié complet G0→G5 sur une Idea contrôlée.

## Slice 4 — Privileged adapters — DONE / ACTIVE

Surfaces principales :
- `/api/ideas/engine` pour G0/G1 ;
- `/api/ideas/engine` / Evidence endpoint pour G2 selon commandes actives ;
- `/api/ideas/canonical` pour lecture canonique, décision et promotion G3 ;
- `/api/project-definition/engine` pour Delivery Lots et G4/G5.

Invariants :
- secret Supabase service-role Worker-only ;
- JWT utilisateur requis ;
- body/commandes allowlistés ;
- autorisation user-scoped vérifiée avant élévation ;
- stale-safety et idempotence préservées ;
- acteur de décision/promotion injecté côté serveur ;
- G3 baseline/diff/promotions dérivés côté serveur ;
- aucune autorité humaine/expert fabriquée par l'adapter.

## Slice 5 — Idea workspace interactions — ACTIVE

### 5A — G0 interactif — DONE

- assessment Blueprint Fit ;
- auto-application uniquement quand la politique l'autorise ;
- confirmation humaine inline lorsque requise ;
- aucun secret service-role dans le navigateur.

### 5B — Sources utilisateur — DONE / ACTIVE

- ajout de sources persistées ;
- sensibilité et provenance conservées ;
- un lien enregistré n'est jamais présenté comme preuve validée par défaut ;
- les sources/snapshots de recherche suivent les guards de stale/fingerprint appropriés.

### 5C — G1 Foundation — DONE / ACTIVE

Invariant conservé :

> **Requirement unresolved ≠ question utilisateur.**

Le moteur doit continuer à exploiter les traitements automatiques disponibles avant de demander une précision humaine.

### 5D — G2 Evidence / Market — BACKEND ACTIVE, CAPABILITY-BOUNDED

G2 n'est plus `DESIGN PREPARED / NON ACTIVE`.

État canonique :
- backend G2 actif ;
- surface utilisateur Evidence/Market active ;
- exécuteurs actifs limités à la surface annoncée par `README.md` et `/health` ;
- `CALC + RAW` constituent la baseline certifiée décrite dans le statut G2 courant ;
- les candidats `SRC`, `AI_H` et autres chemins non annoncés restent inactifs tant que leurs gates d'activation ne sont pas satisfaites.

Autorité détaillée : `docs/project-definition/runtime/G2_PRODUCTION_ACTIVATION_STATUS_20260916.md` et `README.md`.

### Atomic research promotion — invariant conservé

Aucune Source canonique ne doit être écrite à mi-run si cette écriture peut auto-invalider le run courant.

Le flow de recherche doit conserver :

`plan → Action Run → travail externe → proposals → stale/fingerprint guards → promotion atomique`.

## Slice 6 — Canonical decision, G3, Project Definition, G4/G5 — RUNTIME ACTIVE

Le runtime canonique couvre désormais les six Formal Gates :

- G0 `BLUEPRINT_FIT`
- G1 `IDEA_DECISION_READY`
- G2 `GO_PROJECT`
- G3 `PROJECT_BASELINE`
- G4 `RFD_LOT`
- G5 `RFD_PROJECT`

La promotion G3 est server-derived : le navigateur ne fournit pas librement baseline manifest, promotion diff ou artifact promotions.

Après GO :
- Project Definition canonique ;
- Delivery Lots ;
- Dependency Closure ;
- D15 qualité/risque/compliance ;
- D16 delivery/handoff ;
- G4 par lot ;
- G5 projet ;
- `READY_FOR_DEVELOPMENT` dérivé uniquement de la chaîne canonique.

Les anciennes gates G8→G12 restent conservées pour compatibilité/migration, sans pouvoir de décision final.

## Slice 7 — Legacy retirement — IN PROGRESS

### Déjà retiré / neutralisé

- `ideas-final-decision-v1.js` n'est plus bootstrappé par le shell canonique ;
- les RPC legacy `decide_idea_v1` / `convert_idea_to_project_v1` ne sont plus browser-callable ;
- les anciennes actions `Passer en projet` / `Transformer en projet` sont redirigées vers Workspace V3 par `ideas-canonical-bridge-v1.js` ;
- G8→G12 ne sont plus l'autorité UI de `Prêt à développer`.

### Encore présent pour compatibilité

- `ideas-orchestrator-v2.js` ;
- bande `Clarifier / Renforcer / Étayer / Partager / Décider` ;
- `maturity x/5` ;
- certains libellés/statuts legacy (`approved`, `convert`, etc.) ;
- page Idea historique comme surface principale sur certains chemins.

Ces éléments ne doivent plus être considérés comme autorité produit. Leur suppression physique doit attendre la preuve d'équivalence et le test E2E authentifié complet.

## Blockers de clôture du cutover

Avant de déclarer Slice 7 terminée et de supprimer les derniers propriétaires legacy :

1. créer une Idea contrôlée avec un utilisateur authentifié réel ;
2. parcourir G0, G1 et le G2 disponible sous les capacités actives ;
3. produire la décision canonique G2/GO avec autorité humaine ;
4. promouvoir vers Project Definition via G3 ;
5. préparer au moins un Delivery Lot ;
6. autoriser G4 puis G5 lorsque les prédicats sont réellement satisfaits ;
7. vérifier stale-state rejection et retry idempotent ;
8. vérifier desktop + mobile du Workspace V3 ;
9. seulement ensuite retirer physiquement `ideas-orchestrator-v2` et les derniers éléments du modèle cinq étapes.

## Stabilisation en cours

La passe de stabilisation du 2026-09-16 est documentée dans :

`docs/audit/STABILIZATION_AUDIT_20260916.md`

Elle a notamment :
- neutralisé le double chemin legacy décision/conversion ;
- durci les grants et policies RLS Ideas ;
- ajouté les index FK manquants sur Master Blueprint et Ideas ;
- réduit les warnings Supabase correspondants ;
- confirmé que les tables service-only sans policies utilisateur sont intentionnellement fail-closed ;
- identifié la minimisation de l'e-mail de preview d'invitation comme amélioration privacy coordonnée à traiter séparément.

## Critères permanents

- aucune question répétée évitable ;
- aucune page d'attente passive obligatoire ;
- aucun pourcentage global artificiel ;
- aucune décision humaine escamotée ;
- aucun Blueprint forcé ;
- aucun appel navigateur direct à une RPC service-role ;
- aucun secret serveur dans le navigateur ;
- provenance et historique préservés ;
- changements matériels → invalidation/reclassification ciblées ;
- `Requirement ≠ Test ≠ Evidence` ;
- `Applicability ≠ fulfilment` ;
- `READY_FOR_DEVELOPMENT` dérivé, jamais togglé ;
- l'utilisateur comprend ce qui est acquis, ce que 2b2c fait seul et ce qui nécessite réellement son attention.
