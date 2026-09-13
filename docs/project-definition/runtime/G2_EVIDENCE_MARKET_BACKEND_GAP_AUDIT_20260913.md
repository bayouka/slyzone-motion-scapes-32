# 4b4c / 2b2c — G2 EVIDENCE & MARKET — BACKEND GAP AUDIT

Date : 2026-09-13

Statut : **AUDIT PASS — IMPLEMENTATION G2 ENCORE BLOQUÉE PAR VALIDATION G1 RUNTIME/E2E**

Objet : vérifier les primitives backend déjà disponibles avant toute implémentation de G2 et identifier seulement les gaps réels.

## Résumé

Le runtime actuel possède déjà l'essentiel de la mécanique générique nécessaire :
- acquisition paths `RAW/SRC/AUDIT/CONN/WEB/CALC/AI_H/AI_R` ;
- Action Runs idempotents et stale-safe ;
- Requirement target fingerprints ;
- machine provenance ;
- Requirement resolution refs ;
- Sources versionnées et ingestion service-side ;
- promotion contrôlée d'Information Items / Ledger entries.

G2 ne nécessite donc pas un nouveau moteur parallèle.

Quatre points doivent cependant être corrigés/formalisés avant SQL G2.

---

## 1. System source registration — GAP CONFIRMÉ

### Existant

`register_idea_source_v1(...)` :
- autorisé à `authenticated` et `service_role` au niveau EXECUTE ;
- mais sa logique exige `auth.uid()` ;
- vérifie `can_write_idea(...)` ;
- n'accepte que les sources humaines `url/document/image` ;
- écrit `created_by=v_user`.

Il est donc correctement conçu comme frontière **humaine**, pas comme primitive système.

### Ingestion système déjà disponible

`commit_source_ingestion_v1(...)` :
- `service_role only` ;
- content hash/version ;
- fetched/freshness ;
- stale des Information Items liés si le contenu change ;
- incrémente engine revision ;
- audit event.

Cette primitive est réutilisable par G2.

### Gap

Une Action Run WEB/AUDIT/CONN ne possède pas de frontière étroite pour créer d'abord l'objet `idea_sources` correspondant.

### Décision de design

Ne jamais appeler `register_idea_source_v1` côté service en simulant un utilisateur.

Primitive candidate :

`record_system_research_source_v1(...)`

Minimum :
- service-role only ;
- `idea_id` + `action_run_id` obligatoires ;
- run doit appartenir à l'Idea et être de path compatible `WEB/AUDIT/CONN/SRC` ;
- source kind allowlisté ;
- locator normalisé ;
- sensitivity conservée/augmentable, jamais abaissée ;
- idempotency `idea + action + normalized_locator + content_hash candidate` ;
- aucune interprétation métier dans la source ;
- audit minimal ;
- compatible ensuite avec `commit_source_ingestion_v1`.

---

## 2. WEB_RESEARCH promotion provenance — HARDENING REQUIS

### Existant live vérifié

`promote_action_result_v1` :
- supporte `WEB_RESEARCH` ;
- exige Requirement target déclaré ;
- exige `resolution_levels` ;
- limite `WEB_RESEARCH` à `SOURCE_BACKED/OBSERVED` ;
- valide un `source_id` s'il est fourni.

Mais :

> **un `source_id` n'est pas actuellement obligatoire pour `WEB_RESEARCH`.**

En revanche, `SOURCE_EXTRACTED` impose déjà explicitement une Source lorsque nécessaire.

### Risque G2

Sans hardening, un executor WEB pourrait techniquement promouvoir :

`WEB_RESEARCH + SOURCE_BACKED`

sans référence persistante vers la source web réelle.

Cela casserait l'invariant G2 :

`SOURCE → OBSERVATION → INTERPRETATION → CONSEQUENCE`.

### Correction candidate

Avant G2, migration additive de `promote_action_result_v1` :
- `WEB_RESEARCH` ⇒ `source_id` obligatoire ;
- `CONNECTOR_EXTRACTED` ⇒ source/ref persistante obligatoire selon le modèle retenu ;
- source doit être active/ingested, appartenir à la même Idea ;
- idéalement `source_kind` compatible avec provenance ;
- source stale/superseded ⇒ promotion rejetée ;
- ne pas dégrader les règles G1 existantes.

Test red-team obligatoire : une mutation WEB sans Source doit être refusée transactionnellement.

---

## 3. Legacy research capability — RÉUTILISER LA CAPACITÉ, PAS LE WORKFLOW

`src/idea-research.js` prouve qu'une capacité de recherche existe historiquement :
- Cloudflare Workers AI ;
- Tavily optionnel via `TAVILY_API_KEY` ;
- génération de plan de recherche ;
- auto-search ;
- inspection d'URL ;
- tentative de filtrage URL/host ;
- extraction HTML texte.

Mais ce code :
- lit les anciennes tables/structures Ideas ;
- ne crée pas d'Action Runs canoniques ;
- ne produit pas de Requirement target fingerprints ;
- ne persiste pas la provenance via `idea_sources` du nouveau moteur ;
- retourne des résultats de recherche sans promotion canonique ;
- utilise une politique de source différente du nouveau Evidence Contract ;
- n'est donc pas une autorité produit/runtime G2.

### Décision

Ne pas brancher directement `idea-research.js` sur Workspace V3.

Réutilisable :
- concept de provider Tavily si le secret/runtime est disponible ;
- quelques patterns de timeout/content-type ;
- Workers AI binding.

À remplacer/renforcer :
- état legacy ;
- planification libre LLM ;
- provenance ;
- stale/idempotency ;
- source persistence ;
- policy de requêtes sensibles ;
- sécurité URL/fetch.

### Sécurité URL

Le futur fetch G2 doit notamment protéger contre :
- loopback/private/link-local après résolution DNS, pas seulement IP littérale dans le hostname ;
- redirect vers cible interdite ;
- DNS rebinding ;
- protocoles non HTTPS sauf exception explicite ;
- payload volumineux / decompression abuse ;
- MIME non autorisé ;
- timeout ;
- instructions/prompt injection dans le contenu.

---

## 4. `COMPETITOR_SET` conditionnel — GAP DE CONTRAT MACHINE

Le Blueprint actuel déclare :
- Requirement actif par défaut ;
- criticality G2 `CONDITIONAL` ;
- Gate binding conditional ;
- mais pas de predicate machine explicite indiquant quand il devient bloquant.

Aucune règle ad hoc ne doit être cachée dans le Worker ou l'UI.

Avant implémentation, formaliser soit :
- une condition dans Blueprint/Gate binding ;
- soit une policy G2 versionnée explicitement et validée comme autorité runtime.

Règle candidate documentée dans `G2_EVIDENCE_MARKET_RUNTIME_DESIGN_V0_1.md` : le competitor set ne bloque que lorsque son absence empêche Pattern/Gap + Research Sufficiency d'être défendables.

---

## 5. Ce qui NE manque pas

Ne pas recréer :
- table de jobs ;
- lifecycle async ;
- stale-safety ;
- Action Run idempotency ;
- provenance types ;
- Requirement refs ;
- résolution levels ;
- source ingestion/versioning ;
- audit events génériques ;
- browser service-role boundary.

Ces primitives existent déjà.

---

## 6. Ordre minimal de correction après validation G1

1. formaliser `COMPETITOR_SET` conditionality ;
2. ajouter/valider `record_system_research_source_v1` ;
3. harden `promote_action_result_v1` pour WEB/source linkage ;
4. tests SQL rollbackés source + promotion ;
5. planner G2 ;
6. executors WEB/AUDIT/CALC/AI_H/AI_R ;
7. adapter `evidence.advance` ;
8. artefacts A03/A04/A05 ;
9. UI Workspace ;
10. E2E + Cloudflare certification.

Aucune de ces migrations/extensions runtime ne doit être lancée avant satisfaction des critères G1 définis par le cutover plan, sauf décision explicite de réouverture du risque.

---

## 7. Conclusion

G2 est techniquement faisable par extension additive de l'architecture actuelle.

Le chemin recommandé n'est pas une refonte :

`existing deterministic engine + Sources + Action Runs + controlled promotion`

avec deux petits hardenings backend et une règle machine à expliciter.

Aucun changement Supabase G2 n'a été appliqué pendant cet audit.
