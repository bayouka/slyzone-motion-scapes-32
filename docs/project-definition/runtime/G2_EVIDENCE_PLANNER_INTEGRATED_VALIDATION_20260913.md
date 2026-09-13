# 4b4c / 2b2c — G2 Integrated Evidence Planner — Validation

Date : 2026-09-13

Statut : **TARGETED INTEGRATION ROLLBACK PASS — NON ACTIVE**

## Chaîne candidate validée

`Creation/Redesign resolver → G2 recompute → G2 planner`.

Candidats concernés :
- `G0_CREATION_REDESIGN_RESOLVER_V0_1.sql` ;
- `G2_EVIDENCE_RECOMPUTE_V0_1.sql` ;
- `G2_EVIDENCE_PLANNER_V0_4_INTEGRATED.sql` ;
- criticality parity candidate.

## Scénarios ciblés

### A — Conditional applicable manquant

`COMPETITOR_SET` :
- applicability `ACTIVE` ;
- criticality `CONDITIONAL` ;
- unresolved ;
- WEB disponible.

Résultat :
- Gate `NOT_READY` ;
- action WEB proposée pour `COMPETITOR_SET` ;
- aucune action humaine.

**PASS.**

### B — Enhancer seul manquant

`COMPETITOR_SET` résolu ; `OBJECTIONS_TRUST` reste `ENHANCER / UNRESOLVED`.

Résultat : Gate `READY`.

**PASS** : un enhancer améliore la qualité sans créer un faux blocker.

### C — Contexte structurel auto-résolvable

Creation/redesign non encore résolu mais resolver RAW éligible.

Résultat :
- G2 `NOT_READY` ;
- seule action proposée : resolver RAW du contexte ;
- aucune question humaine G2.

**PASS.**

### D — Contexte réellement ambigu

Le resolver a déjà épuisé RAW et retourne une ambiguïté explicite.

Résultat :
- G2 `NOT_READY` ;
- aucune recherche business lancée prématurément ;
- une seule `dominant_user_action` ciblée sur creation vs redesign.

**PASS.**

## Rollback

Après test :
- fixtures restantes : **0** ;
- fonctions candidates persistées : **0** ;
- contrainte live criticality restaurée à son état original.

## Conclusion

La chaîne de contrôle candidate respecte désormais :
- contexte structurel avant applicabilité G2 ;
- recompute avant planning ;
- `CONDITIONAL` bloque seulement lorsqu'applicable ;
- `ENHANCER` ne bloque pas ;
- recherche system-first ;
- humain uniquement pour ambiguïté contextuelle réellement non résolue automatiquement.

Cette validation ne lève pas les verrous de production : full R0 0.5 replay, G1 build 544 E2E, concurrence multi-session research et migration G2 consolidée restent requis.
