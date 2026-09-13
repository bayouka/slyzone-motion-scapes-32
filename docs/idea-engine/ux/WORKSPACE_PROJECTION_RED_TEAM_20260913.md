# 4b4c / 2b2c — WORKSPACE PROJECTION V1 — RED TEAM

Date : 2026-09-13

Verdict : **PASS — SLICE 1 READ PROJECTION**

## Périmètre

Validation de `get_idea_workspace_projection_v1` comme read-model canonique pour la future UX post-capture.

## Scénarios exécutés

### 1. Idée capturée non classifiée

Fixture authentifiée transactionnelle créée puis rollbackée.

Résultat :
- `lifecycle.mode = CAPTURED_UNCLASSIFIED` ;
- `signals.blueprint_fit_needed = true` ;
- `signals.blueprint_mismatch = false` après correctif ;
- aucune source moteur encore créée ;
- aucun faux état de maturité inventé.

### 2. Initialisation Site vitrine valide

La même logique a été rejouée avec `initialize_idea_engine_v1(..., SITE_VITRINE, 0.4)`.

Résultat :
- `lifecycle.mode = IDEA_ENGINE` ;
- Blueprint `SITE_VITRINE / 0.4` actif ;
- `engine_revision = 1` ;
- RAW source créée et comptée comme ingérée ;
- `blueprint_fit_needed = false`.

Toutes les données ont été rollbackées.

### 3. Access control transversal

Une Idea privée a été créée par un owner puis la projection a été appelée avec un autre UUID authentifié sans accès.

Résultat attendu/obtenu : `FORBIDDEN`.

### 4. Anti-wizard

Le JSON projeté a été testé explicitement pour les clés :
- `phase` ;
- `step` ;
- `progress` ;
- `completion_percentage`.

Résultat : **toutes absentes**.

### 5. Minimisation des internals

`system_microstatus` n'expose que type/statut/dates du dernier Action Run et des compteurs. Les résultats LLM, proposed mutations, permission scopes et métadonnées provider ne sont pas exposés.

Les artefacts n'exposent que métadonnées/version/freshness/purpose/spec status, pas leur payload brut.

Les sources sont projetées sous forme d'agrégats, pas de contenu/locator.

## Bug de contrat trouvé

Dans la première version, `blueprint_mismatch` était sérialisé en JSON `null` lorsqu'aucun Blueprint n'était encore assigné.

Correction additive : `20260913043201_idea_workspace_projection_v1_boolean_fix`.

Après correction, le signal est toujours un booléen.

## Conclusion

La projection V1 peut être utilisée comme source de vérité de lecture pour la nouvelle surface parallèle. Elle ne justifie pas encore le retrait de l'ancien workspace : G0 Blueprint Fit et les frontières d'actions privilégiées doivent être intégrés avant le cutover interactif.
