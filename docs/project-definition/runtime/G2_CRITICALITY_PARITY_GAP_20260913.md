# 4b4c / 2b2c — Requirement Criticality Runtime Parity Gap

Date : 2026-09-13

Statut : **CONFIRMED GAP — CANDIDATE FIX REQUIRED BEFORE G2**

## Constat

Le schema machine des Requirements autorise :

`BLOCKING / REQUIRED / CONDITIONAL / ENHANCER / NOT_RELEVANT`.

La contrainte live `idea_requirement_states_criticality_current_check` accepte actuellement seulement :

`BLOCKING / REQUIRED / CONDITIONAL / INFORMATIONAL`.

## Impact observé

Le premier test rollbacké du recompute G2 a échoué lorsqu'il a tenté de matérialiser :

`SV.D03.OBJECTIONS_TRUST` avec `criticality_current='ENHANCER'`.

PostgreSQL a correctement rejeté la ligne avec violation de contrainte. Toute la transaction a été rollbackée.

## Décision

Ne pas mapper silencieusement `ENHANCER → INFORMATIONAL` : cela perdrait une distinction du Blueprint entre une information purement informative et un élément qui améliore activement la qualité de la sortie sans bloquer la Gate.

La correction candidate doit élargir la contrainte live de façon additive :

- conserver `BLOCKING` ;
- conserver `REQUIRED` ;
- conserver `CONDITIONAL` ;
- conserver `INFORMATIONAL` pour compatibilité runtime/historique ;
- ajouter `ENHANCER` ;
- ajouter `NOT_RELEVANT` si une matérialisation future choisit de conserver la criticité explicite d'un atom inapplicable.

## Compatibilité

Aucune valeur existante n'est renommée ou migrée.

Cette correction est additive et doit être red-teamée en rollback avant migration réelle.

## Garde-fou

`applicability_state='NOT_RELEVANT'` reste l'autorité sur l'applicabilité. Une criticality `NOT_RELEVANT` éventuelle ne doit jamais remplacer l'état d'applicabilité.
