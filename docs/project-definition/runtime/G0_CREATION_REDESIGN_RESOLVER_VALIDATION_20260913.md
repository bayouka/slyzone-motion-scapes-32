# 4b4c / 2b2c — Creation / Redesign Resolver — Validation

Date : 2026-09-13

Statut : **TARGETED ROLLBACK PASS — NON ACTIVE**

## Portée

Validation du candidat :
- `G0_CREATION_REDESIGN_RESOLVER_PLAN_V0_1.md` ;
- `sql-candidates/G0_CREATION_REDESIGN_RESOLVER_V0_1.sql`.

Aucune migration n'a été appliquée.

## Scénarios rollbackés

| Scénario | Résultat |
|---|---|
| Requirement non résolu + RAW disponible | PASS — `AUTO_ACTION_AVAILABLE`, RAW proposé, aucun humain |
| Action RAW fresh terminée `AMBIGUOUS` sans mutation | PASS — `HUMAN_REQUIRED`, une clarification ciblée |
| Information Item `creation_or_redesign=redesign` lié au RAW avec `[RAW_HUMAN, ACCEPTED_AS_CURRENT]` | PASS — `RESOLVED`, aucune action |

## Garde-fous validés

- l'humain n'est pas interrogé avant l'analyse RAW ;
- l'ambiguïté humaine est distincte d'une erreur technique ;
- la résolution canonique passe par Information Item + Requirement ref ;
- une valeur current ferme le resolver ;
- le Blueprint Fit n'est pas rouvert ;
- aucune URL générique n'est interprétée comme refonte.

## Rollback

Contrôle après campagne :
- Idea fixture : **0** ;
- fonctions candidates persistées : **0**.

## Limite

Le Worker d'extraction RAW spécifique n'est pas encore implémenté. Lors de l'implémentation future, `support_text` devra être vérifié comme sous-chaîne exacte du RAW persistant, comme pour G1 Foundation.

## Décision

Le resolver est suffisamment défini pour devenir le prérequis du futur recompute G2 candidat, mais reste **NON ACTIVE** tant que les verrous du cutover ne sont pas levés.
