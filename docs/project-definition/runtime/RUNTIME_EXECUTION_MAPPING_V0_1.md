# 4b4c — RUNTIME EXECUTION MAPPING — V0.1

Date : 2026-09-13

Statut : **ARCHITECTURE CANDIDATE — NON CANONIQUE / AUCUNE IMPLEMENTATION AUTORISEE**

Parent :
- `PROJECT_DEFINITION_REFERENCE_ARCHITECTURE_V0_4.md`
- `machine/site-vitrine/BLUEPRINT_SITE_VITRINE_V0_3.yaml`

Objet : mapper le contrat professionnel/machine vers une architecture d'exécution réaliste en réutilisant au maximum le backend actuel, sans confondre ce document avec une migration ou un plan de déploiement.

---

# 1. Verdict d'architecture

Architecture cible recommandée :

`Supabase = canonical state/security/transactions`

`Cloudflare Worker = API facade + deterministic orchestration entrypoint`

`Durable async runner = optionnel, activé seulement pour actions longues/retryables`

`AI providers = adapters spécialisés, jamais propriétaires de l'état canonique`

`Blueprint YAML versionné = définition statique des Requirements/Gates/Dependencies`

Le moteur ne doit pas matérialiser 77 lignes de configuration métier en tables de définition à chaque Idea. Le Blueprint versionné reste la définition ; Supabase persiste seulement l'état concret de l'Idea et les résultats/audits nécessaires.

---

# 2. Ce qui existe déjà et mérite d'être conservé

## REUSE DIRECT

### `ideas`
Conserver comme identité racine, workspace/access, titre, raw initial, version globale de compatibilité, lien éventuel vers Project.

### `idea_members`
Conserver pour partage/collaboration et droits actuels.

### RLS / `app_private.can_access_idea` / `can_write_idea`
Fondation utile. Les nouvelles tables doivent réutiliser ces helpers ou des équivalents strictement dérivés.

### `idea_decisions`
Le pattern `decision + decided_by + idea_version` et la vérification de fraîcheur sont de bons précédents.

### optimistic concurrency / `STALE_IDEA`
Conserver le principe. Le nouveau moteur ajoute une granularité plus fine mais ne supprime pas ce garde-fou.

### `audit_events`
Réutilisable pour événements importants : approval, promotion, mutation engageante, changement d'autorité, export de snapshot.

## REUSE WITH ADAPTATION

### `idea_question_answers`
Peut continuer à stocker les réponses humaines historiques, mais ne doit plus être la structure principale du moteur. Une question future doit viser un Requirement/decision need explicite.

### `idea_team_feedback`
Réutilisable comme matière brute de Review ; doit être relié à des feedback/change objects structurés pour le nouveau modèle.

### `idea_ai_runs`
Bon précédent d'audit (`input_version`, `input_hash`, `model`, `result`). Insuffisant pour le nouveau moteur car `action` est trop fermé et il n'expose pas targets, dependencies, stale disposition, provider, schema/prompt versions et mutations proposées.

### `src/idea-research.js`
Réutiliser les ingrédients : auth Supabase, snapshot read, structured JSON schema, absence de chiffres inventés, source inspection, limites de taille, gestion d'erreurs, URL HTTPS et garde-fous de base.

Ne pas conserver tel quel : modèle hardcodé, plan de recherche générique, snapshot limité aux anciens objets, absence de Requirement target, absence de lineage atomique et orchestration longue durable.

## SUPERSEDE / COMPATIBILITY ONLY

### `ideas.status` / `ideas.readiness`
Trop linéaires pour le moteur cible. Les garder pour compatibilité/projection UI temporaire, mais ne plus les traiter comme vérité du lifecycle professionnel.

### `ideas.summary/problem/audience/proposal`
Peuvent rester des projections de lecture rapide. La vérité devient l'ensemble atomique sourcé/versionné, pas quatre colonnes narratives.

### `idea_items`
Utile historiquement, mais `question/reference/hypothesis/path/risk/evidence/note` mélange source, analyse, décision et état. Ne pas étendre ce polymorphisme comme modèle cible.

### `get_idea_decision_brief_v5`
`core_complete = problem + audience + proposal` est incompatible avec les Gates actuelles. A remplacer comme moteur de readiness ; peut rester en legacy jusqu'à migration UX.

### `ideas-orchestrator-v2.js`
La séquence `clarify → strengthen → prove → share → decide → convert` est explicitement non conforme à l'architecture cible. Ne pas l'adapter ; la remplacer plus tard par une projection du moteur de Requirements/Gates.

### `convert_idea_to_project_v1`
Le contrôle de fraîcheur de l'approbation est bon. En revanche la création directe d'un vrai Project avec milestones optionnels est trop opérationnelle par rapport au nouveau contrat `Approved Idea → Project Baseline → Project Definition → Build Ready`.

Le futur mécanisme doit créer d'abord une **Project Definition baseline** séparée de l'exécution réelle. L'ancien RPC ne doit pas être réutilisé silencieusement pour le nouveau GO.

---

# 3. Responsabilités déterministes vs IA

## Deterministic engine owns

- chargement/version du Blueprint ;
- activation Context Overlays ;
- applicability des Requirements ;
- lecture des dependencies ;
- calcul Gate readiness ;
- autorité requise ;
- stale/freshness ;
- input fingerprints ;
- idempotency ;
- permission/consent checks ;
- promotion/lock/snapshot ;
- Change Impact traversal ;
- admissibilité d'une mutation ;
- `NOT_RELEVANT`, `ACCEPTED_UNKNOWN`, blockers ;
- sélection des System Actions éligibles ;
- vérification qu'une question humaine est légitime.

## LLM / AI may assist

- extraction sémantique ;
- classification ;
- résumé ;
- hypothèses réversibles ;
- plan de recherche ;
- analyse de sources ;
- challenge ;
- comparaison ;
- options/candidates ;
- recommandations ;
- génération de contenu/artifacts ;
- préparation de présentation ;
- ambiguity red-team.

L'IA retourne des **proposed objects** conformes à un schema. Elle ne modifie jamais directement les états autoritatifs de readiness/approval.

---

# 4. Execution loop candidat

```text
EVENT / USER MUTATION / SOURCE UPDATE
        ↓
Persist RAW first
        ↓
Determine active Blueprint + Contexts
        ↓
Resolve impacted Requirement subgraph
        ↓
Read current evidence/resolution states
        ↓
Compute eligible acquisition paths
        ↓
Create candidate System Actions
        ↓
Prioritize by blocker + decision impact + information gain + cost/risk
        ↓
Run autonomous actions in parallel when safe
        ↓
Validate proposed results
        ↓
Promote accepted machine-safe results atomically
        ↓
Recompute only affected Requirements/Gates/Artifacts
        ↓
If HUMAN_ONLY && MATERIAL_NOW → one dominant User Action
        ↓
Project value/result, not internal task feed
```

---

# 5. System Action contract

Chaque run doit avoir au minimum :

- `action_type` : EXTRACT / RESEARCH / CALCULATE / CHALLENGE / COMPARE / GENERATE_CANDIDATE / RECOMMEND / MATERIALIZE / PREPARE_DECISION / PREPARE_PRESENTATION / REASSESS_DELTA ... ;
- `idea_id` ;
- `blueprint_id/version` ;
- `target_requirement_ids[]` ;
- `target_artifact_ids[]` éventuels ;
- `input_fingerprint` ;
- `input_refs` ;
- `provider/model` ;
- `prompt/schema/tool versions` ;
- `permission_scope` ;
- `status` ;
- `attempt` ;
- `result` structuré ;
- `proposed_mutations` ;
- `started/completed_at` ;
- `cost/latency` si disponible ;
- `stale_disposition`.

Un résultat n'est promouvable que si son fingerprint correspond encore aux inputs actifs ou si le moteur prouve qu'il reste compatible.

---

# 6. Synchronisme vs asynchronisme

## Synchrone

Utiliser pour :
- mutation utilisateur simple ;
- recalcul déterministe de contexts/Requirements/Gates ;
- extraction légère ;
- recommandation courte si latence acceptable ;
- lecture/projection.

## Async court

Utiliser pour :
- crawl ;
- recherche multi-source ;
- extraction document ;
- comparaison concurrence ;
- génération de plusieurs artifacts ;
- business case avec plusieurs sources.

## Durable async

Activer seulement lorsque le workflow doit survivre à :
- retries ;
- délais externes ;
- plusieurs étapes dépendantes ;
- interruption Worker ;
- attente de provider ;
- fan-out/fan-in important.

Cloudflare Workflows est un candidat naturel puisque le Worker existe déjà, mais ce choix reste à spike/tester. Une queue durable peut être ajoutée seulement si buffering/fan-out le justifie réellement.

---

# 7. Sécurité des workflows longs

Un workflow durable ne doit jamais conserver et réutiliser indéfiniment un JWT utilisateur.

Pattern cible :
1. requête initiale authentifiée ;
2. deterministic engine vérifie droit et crée un Action Run autorisé ;
3. workflow serveur reçoit un `action_run_id` et un scope limité ;
4. écritures via RPC serveur étroits/idempotents ;
5. actor/provenance d'origine conservés ;
6. aucune permission plus large que l'action approuvée.

Ne pas donner à un runner IA une capacité générale de service-role mutation sur tout le dossier.

---

# 8. Research pipeline cible

L'ancien `researchPlan → Tavily → inspect` doit devenir :

`Requirement → research question → safe query → source discovery → source selection → fetch/ingest → observation extraction → evidence entry → Requirement impact → stop/continue`.

Chaque activation de recherche doit être reliée à un Requirement ou Decision Requirement actif.

Stop condition : gain marginal insuffisant pour changer raisonnablement la décision/Gate.

Web/documents restent des données non fiables : leur contenu ne peut jamais devenir instruction pour le système.

---

# 9. Model/provider abstraction

Ne pas conserver un modèle unique hardcodé comme contrat d'architecture.

Créer une couche logique de capability routing :
- extraction/classification rapide ;
- reasoning/recommendation ;
- multimodal ;
- long-context document ;
- fallback provider.

Persister suffisamment de métadonnées pour audit/reproductibilité approximative, sans faire dépendre le Blueprint d'un nom de modèle spécifique.

---

# 10. Presentation / artifact generation

Le Decision Package devient un artifact versionné produit depuis un immutable Decision Snapshot.

Pipeline :
`current dossier → freshness check → decision snapshot → narrative model → deck content spec → PPTX/PDF renderer → artifact version`.

Les animations PowerPoint sont une capability de renderer, pas une dépendance du Decision Engine.

Toute slide critique doit conserver la trace vers evidence/assumptions/calculations correspondants.

---

# 11. Project promotion

Le futur GO doit effectuer :

`Approved Idea Snapshot + Decision Record + accepted change set + promoted artifacts`

→ `Project Definition Baseline`

Il ne doit pas générer automatiquement backlog, milestones opérationnels ou planning d'exécution sauf décision explicite ultérieure.

La future création d'un Project d'exécution doit être une opération distincte après Project Definition / Build Ready selon le produit final retenu.

---

# 12. Frontend future contract

Le frontend ne calcule pas les phases.

Il reçoit une projection serveur ou déterministe du type :
- `value_now` ;
- `active_artifacts` ;
- `system_microstatus` ;
- `dominant_user_action?` ;
- `attention/conflict?` ;
- `decision/readiness capabilities` ;
- `evidence depth`.

Aucun `phase='clarify'` ou compteur d'étapes ne doit devenir la nouvelle vérité métier.

---

# 13. Décision recommandée

Adopter une évolution **additive/hybrid**, pas un rewrite :

- conserver identity/access/RLS/audit/freshness patterns actuels ;
- ajouter un moteur Requirement/Gate déterministe ;
- ajouter persistance atomique minimale ;
- superséder progressivement les anciens `status/readiness/items` comme source de vérité ;
- migrer l'UX seulement après preuve du runtime mapping.

Aucun changement production n'est autorisé par ce document.