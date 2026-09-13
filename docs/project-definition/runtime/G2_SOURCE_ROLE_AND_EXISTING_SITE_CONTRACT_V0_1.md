# 4b4c / 2b2c — G2 Source Role & Existing Site Contract V0.1

Date : 2026-09-13

Statut : **CANDIDATE — NON ACTIVE**

## 1. Problème

`idea_sources.source_kind='url'` décrit un support technique, pas son rôle métier.

Une URL peut être :
- le site actuel de l'organisation ;
- un concurrent direct ;
- une alternative ;
- une référence de catégorie ;
- une documentation ;
- une autre source utile.

Il est interdit de déduire silencieusement `URL = EXISTING_SITE`.

## 2. Décision de modèle

Le rôle métier d'une Source est porté par un **Information Item traçable lié à la Source**, pas par une mutation implicite de `idea_sources`.

La Source reste un objet neutre : identité, locator, hash/version, freshness, sensitivity.

L'interprétation devient un Information Item avec :
- `source_id` canonique ;
- provenance explicite ;
- semantic key ;
- Requirement ref ;
- confidence/state ;
- possibilité de correction/supersession.

## 3. Semantic keys candidates

Pour G2 :
- `existing_site` ;
- `source_role.current_site` ;
- `source_role.competitor_direct` ;
- `source_role.alternative` ;
- `source_role.category_reference` ;
- `source_role.other_reference`.

Pour `EXISTING_SITE`, préférer un Information Item canonique :

- semantic key : `existing_site` ;
- item type : `FACT` ;
- source_id : URL correspondante si disponible ;
- provenance : `SOURCE_EXTRACTED` ou `HUMAN_DECLARED/HUMAN_GUIDED_ANSWER` selon origine ;
- Requirement ref : `SV.D04.EXISTING_SITE`.

## 4. Détection refonte

Le runtime G2 peut considérer `IS_REDESIGN/HAS_EXISTING_SITE` seulement si au moins un signal canonique current existe :

1. Information Item `creation_or_redesign` explicitement égal à `redesign` ; ou
2. Information Item `existing_site` current ; ou
3. Requirement `SV.D04.EXISTING_SITE` déjà RESOLVED/current.

Une simple Source URL générique ne suffit pas.

## 5. Acquisition

Si la Foundation/RAW indique une refonte ou un site actuel :
- RAW extraction peut produire `creation_or_redesign` / `existing_site` ;
- une Source URL fournie peut être classifiée via `SRC` ;
- si le rôle reste ambigu et matériel, 2b2c peut proposer une correction ciblée ;
- ne jamais demander à l'utilisateur de refaire un inventaire si la Source permet de résoudre automatiquement.

## 6. Planner G2

`SV.D04.EXISTING_SITE` doit faire partie de la policy G2 conditionnelle.

Ordre :

`redesign signal → EXISTING_SITE → EXISTING_AUDIT`

`EXISTING_AUDIT` ne doit pas être planifié tant que `EXISTING_SITE` n'est pas utilisable.

Le planner ne doit pas entrer dans un deadlock où l'audit est dependency-blocked sans action candidate pour résoudre le site existant.

## 7. Competitor Set

Les Sources découvertes par recherche concurrentielle utilisent la promotion research atomique. Leur classification métier est portée par les observations/Information Items, pas par un champ client-chosen sur la Source.

Une source ne devient pas « concurrent direct » uniquement parce qu'un moteur de recherche l'a retournée.

## 8. Invariants

- Source identity ≠ source business role ;
- une classification IA reste corrigeable et sourcée ;
- le rôle n'altère pas le locator/hash original ;
- aucun UUID Source arbitraire venant du navigateur ;
- cross-Idea source linkage interdit ;
- `EXISTING_SITE` doit être résolu avant audit de l'existant ;
- URL générique seule ne déclenche pas automatiquement une refonte.
