# 4b4c / 2b2c — G2 Evidence / Market Planner — Validation Report

Date : 2026-09-13

Statut : **TARGETED ROLLBACK PASS — NON ACTIVE — AUCUNE MIGRATION / COMMANDE WORKER G2**

## 1. Package candidat

Documents / SQL concernés :
- `G2_EVIDENCE_PLANNER_IMPLEMENTATION_PLAN_V0_1.md` ;
- `sql-candidates/G2_EVIDENCE_PLANNER_V0_1.sql` ;
- `sql-candidates/G2_EVIDENCE_PLANNER_V0_2_HARDENING.sql`.

Le candidat ne remplace pas le planner G1 et n'active ni Blueprint 0.5 ni `evidence.advance`.

## 2. Compilation réelle

`G2_EVIDENCE_PLANNER_V0_1.sql` a été compilé contre le backend Supabase canonique `wexfzhegiewhldkugtow` dans une transaction `BEGIN ... ROLLBACK`.

Résultat :

`G2_EVIDENCE_PLANNER_V0_1_COMPILED`

Contrôle après rollback : aucune des fonctions candidates G2 n'est persistée.

## 3. Materialité concurrentielle — scénarios rollbackés

Fixture synthétique dédiée, supprimée par rollback.

| Scénario | Résultat attendu | Résultat |
|---|---|---|
| Greenfield / aucun audit | benchmark matériel | PASS — `DEFAULT_EXTERNAL_BASELINE_REQUIRED` |
| Refonte / audit `OBSERVED` + evidence quality `CALCULATED` | benchmark non matériel | PASS — `CURRENT_AUDIT_BASELINE_SUFFICIENT_FOR_G2` |
| Comparaison marché explicitement requise | benchmark réactivé | PASS — `EXPLICIT_MARKET_COMPARISON_REQUIRED` |
| Conflit marché `CRITICAL` | benchmark réactivé | PASS — `MATERIAL_MARKET_CONFLICT_REQUIRES_TRIANGULATION` |

Cette validation confirme que la matérialité ne dépend pas d'un booléen libre fourni par un LLM/caller.

## 4. Red-team V0.1 → V0.2

La revue de V0.1 a identifié deux défauts avant activation :

1. `RAW/SRC/AUDIT` pouvaient être sélectionnés uniquement parce que le path était déclaré disponible, même sans Source canonique correspondante ;
2. `ACCEPTED_UNKNOWN` n'était pas encore interprété selon la criticité de la Gate.

V0.2 ajoute :
- `idea_g2_path_has_input_v1(...)` ;
- `RAW` seulement si une Source `human_raw` existe ;
- `SRC` seulement si une Source non-RAW existe ;
- `AUDIT` seulement si une Source auditable existe ;
- WEB/CONN restent capability-gated par `available_paths` dérivé serveur ;
- `ACCEPTED_UNKNOWN` satisfait un Requirement non-BLOCKING ;
- un Requirement BLOCKING, notamment `RESEARCH_SUFFICIENCY`, ne peut jamais passer par unknown.

## 5. V0.2 — scénarios rollbackés

| Scénario | Attendu | Résultat |
|---|---|---|
| `RAW` disponible comme capability mais aucune Source RAW | sauter RAW, choisir WEB | PASS |
| Source RAW présente | RAW reprend la priorité | PASS |
| `PRIMARY_NEED` REQUIRED en `ACCEPTED_UNKNOWN` | unknown admissible, aucune question artificielle | PASS — `READY_WITH_ACCEPTED_UNKNOWNS` dans fixture minimale |
| `RESEARCH_SUFFICIENCY` BLOCKING en `ACCEPTED_UNKNOWN` | refus | PASS — `NOT_READY`, CALC proposé |
| tous les scénarios | `dominant_user_action=null` | PASS |

## 6. Absence de résidu

Après chaque campagne rollbackée :
- fixture Ideas restante : **0** ;
- fonctions candidates G2 persistées : **0**.

Aucune donnée utilisateur existante n'a été modifiée.

## 7. Ce qui est validé

- le SQL candidat compile contre le vrai schéma ;
- la règle de matérialité concurrentielle fonctionne sur des états canoniques synthétiques ;
- les chemins nécessitant une Source ne sont plus planifiés sans input ;
- les unknowns suivent la criticité ;
- `RESEARCH_SUFFICIENCY` reste réellement BLOCKING ;
- absence de fallback humain générique ;
- rollback propre.

## 8. Ce qui n'est PAS encore validé

- full Blueprint 0.5 R0 replay ;
- recompute/materialization G2 complet ;
- planner sur les 8 Requirements G2 dans une fixture exhaustive ;
- grouping de plusieurs Requirements dans un même Action Run ;
- vraie concurrence multi-session de la promotion research ;
- build 544 G1 runtime/E2E ;
- aucun Worker/adaptor `evidence.advance` n'est actif.

## 9. Prochaine tranche recommandée

Avant toute migration G2 :
1. construire `recompute_idea_evidence_context_candidate_v1` aligné Blueprint 0.5 ;
2. matérialiser les Requirement states G2 avec fingerprints de dépendances ;
3. rejouer une fixture exhaustive greenfield + redesign ;
4. seulement ensuite connecter le planner V0.2 aux Action Runs research candidats ;
5. conserver les verrous G1 runtime/E2E + concurrence multi-session + full R0 replay.

## Conclusion

Le planner G2 passe d'un contrat théorique à une logique SQL réellement compilée et testée en rollback, mais reste volontairement **NON ACTIVE**.

> **TARGETED PLANNER PASS — NO PERSISTENT DDL — NO G2 RUNTIME ACTIVATION.**
