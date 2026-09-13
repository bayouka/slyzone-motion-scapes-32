# 4b4c / 2b2c — G2 Blueprint Site vitrine 0.5 Candidate — Validation

Date : 2026-09-13

Statut : **TARGETED PASS — NON ACTIVE — FULL R0 REPLAY PENDING**

## Objet

Valider sans modifier le Blueprint actif `SITE_VITRINE@0.4` une évolution candidate destinée à G2 Evidence / Market.

Le candidat corrige trois problèmes :

1. `SV.D05.COMPETITOR_SET` était déclaré conditionnel au Gate G2 mais restait `ACTIVE` par défaut, donc effectivement requis dans tous les dossiers par le moteur R0 ;
2. `requires_all` / `requires_any` influençaient les fingerprints et le Change Impact, mais n'étaient pas encore utilisés comme préconditions d'action ni comme garde-fous supplémentaires de Gate ;
3. la matérialité d'une recherche concurrentielle ne doit pas être fournie librement par un caller ni décidée par un LLM : elle doit être calculée déterministement.

Aucun fichier runtime production, aucune migration Supabase et aucun Worker n'est modifié par ce candidat.

---

## 1. Fichiers candidats

- `docs/project-definition/machine/site-vitrine/CONTEXT_OVERLAYS_V0_3.yaml`
- `docs/project-definition/machine/site-vitrine/OVERRIDES_V0_2_G2_CANDIDATE.yaml`
- `docs/project-definition/machine/site-vitrine/BLUEPRINT_SITE_VITRINE_V0_5_CANDIDATE.yaml`
- `scripts/r0_engine_v0_4_candidate.py`
- `scripts/test_r0_engine_v0_4_candidate.py`

Le Blueprint actif `BLUEPRINT_SITE_VITRINE_V0_4.yaml` reste inchangé et reste le contrat par défaut chargé par `r0_engine_v0_3.py`.

---

## 2. Règle candidate COMPETITOR_SET

Nouveau Context déterministe :

`NEEDS_COMPETITIVE_EVIDENCE`

Predicate :

`research.competitive_evidence_material == true`

`SV.D05.COMPETITOR_SET` devient :
- `INACTIVE` par défaut ;
- `ACTIVE` seulement lorsque `NEEDS_COMPETITIVE_EVIDENCE` est actif.

Cette règle ne signifie pas « les concurrents sont facultatifs ». Elle signifie :

> la recherche concurrentielle est obligatoire lorsqu'elle possède encore une valeur décisionnelle matérielle et ne doit pas être exécutée mécaniquement lorsqu'un autre socle de preuve suffisant permet déjà G2.

---

## 3. Matérialité concurrentielle déterministe

Le moteur candidat calcule lui-même `research.competitive_evidence_material`. Une valeur fournie dans l'état d'entrée est écrasée par ce calcul candidat.

Règle conservatrice actuelle :

### TRUE par défaut

Pour une création / greenfield, le benchmark reste matériel tant qu'aucun socle équivalent n'est démontré.

### TRUE forcé lorsque

- `decision.market_comparison_required == true` ;
- un `COMPETITOR_SET` current existe déjà en `SOURCE_BACKED` ou `OBSERVED` afin de conserver ce Requirement actif ;
- l'audit alternatif est stale, conflicted ou insuffisant.

### FALSE seulement si

- la situation est une refonte ;
- `SV.D04.EXISTING_AUDIT` est current en `OBSERVED` ;
- `SV.D04.EVIDENCE_QUALITY` est current en `CALCULATED` ;
- aucune comparaison marché n'est explicitement requise.

Cette policy est volontairement conservatrice. Une future extension pourra reconnaître d'autres baselines équivalentes, mais uniquement avec une règle déterministe versionnée et testée.

---

## 4. Dépendances désormais préconditions candidates

Le moteur candidat ajoute une vérification déterministe des `requires_all` et `requires_any` avant :
- l'exécution d'une System Action sur le Requirement dépendant ;
- la reconnaissance d'un Requirement déjà résolu comme satisfaisant effectivement une Gate.

La vérification est transitive.

Exemple G2 :

`COMPETITOR_SET ou EXISTING_AUDIT → PATTERN_GAP_SYNTHESIS → RESEARCH_SUFFICIENCY`

Une valeur déjà présente pour `PATTERN_GAP_SYNTHESIS` ne suffit plus si son socle de preuve requis est absent.

`ACCEPTED_UNKNOWN` n'est pas traité comme une preuve utilisable automatiquement pour alimenter une analyse dépendante.

---

## 5. Validations ciblées exécutées

### A. Chaîne de dépendances

#### Création sans baseline externe — red-team synthétique

- `COMPETITOR_SET = NOT_RELEVANT`
- `EXISTING_AUDIT = NOT_RELEVANT`
- `PATTERN_GAP_SYNTHESIS` possède pourtant une valeur
- `RESEARCH_SUFFICIENCY` possède pourtant une valeur

Résultat :
- `PATTERN_GAP_SYNTHESIS dependency_ready = false`
- dépendances manquantes : `COMPETITOR_SET`, `EXISTING_AUDIT`
- `RESEARCH_SUFFICIENCY dependency_ready = false` par transitivité

**PASS** : une synthèse artificiellement remplie ne contourne pas l'absence de socle de preuve.

#### Refonte avec audit existant

- `COMPETITOR_SET = NOT_RELEVANT`
- `EXISTING_AUDIT = RESOLVED / OBSERVED`

Résultat :
- `PATTERN_GAP_SYNTHESIS dependency_ready = true`
- `RESEARCH_SUFFICIENCY dependency_ready = true`

**PASS** : l'alternative prévue par `requires_any` fonctionne.

#### Création avec evidence concurrentielle

- `COMPETITOR_SET = RESOLVED / SOURCE_BACKED`
- `EXISTING_AUDIT = NOT_RELEVANT`

Résultat :
- `PATTERN_GAP_SYNTHESIS dependency_ready = true`
- `RESEARCH_SUFFICIENCY dependency_ready = true`

**PASS**.

### B. Calcul de matérialité concurrentielle

Résultats ciblés exécutés :

| Cas | `competitive_evidence_material` |
|---|---:|
| création sans baseline | `true` |
| refonte + audit OBSERVED + evidence quality CALCULATED | `false` |
| refonte + audit stale | `true` |
| refonte + comparaison marché explicitement requise | `true` |
| competitor set déjà SOURCE_BACKED | `true` |

**PASS** : un caller ne peut pas transformer une création en dossier « sans benchmark » par simple booléen arbitraire.

---

## 6. Suite de tests codifiée

`scripts/test_r0_engine_v0_4_candidate.py` contient désormais 8 scénarios :

1. le Blueprint actif reste 0.4 et le candidat est 0.5 ;
2. une création ne peut pas désactiver arbitrairement le Requirement concurrentiel ;
3. un audit frais et suffisant peut désactiver un benchmark redondant ;
4. un besoin explicite de comparaison marché le réactive ;
5. lorsque le benchmark est matériel, WEB est planifié avant toute question humaine ;
6. un `COMPETITOR_SET SOURCE_BACKED` débloque la chaîne transitive G2 ;
7. un audit stale ne peut pas désactiver le benchmark ;
8. `RESEARCH_SUFFICIENCY` ne peut pas reposer sur une chaîne de dépendance orpheline.

Ces tests ne sont pas ajoutés au `npm run check` de production tant que le candidat 0.5 n'est pas promu.

---

## 7. Limite de la preuve actuelle

Le checkout complet du dépôt canonique n'est pas directement disponible dans l'environnement d'exécution local utilisé pendant cette passe. Le connecteur GitHub reste la source canonique accessible ; Remote Desktop Commander n'a pas été utilisé et n'est pas nécessaire.

Conséquence :
- syntaxe du moteur/test candidat : vérifiée ;
- logique de dépendances transitive ciblée : exécutée et PASS ;
- matérialité concurrentielle ciblée : exécutée et PASS ;
- diff GitHub candidat : contrôlé ;
- **replay complet `test_r0_engine_v0_3.py + test_r0_engine_v0_4_candidate.py` sur le checkout canonique : encore PENDING**.

Il est interdit de présenter le candidat 0.5 comme `PASS_REFERENCE` avant ce replay complet.

---

## 8. Aucun impact production

Le candidat :
- n'est référencé par aucun runtime Worker ;
- n'est utilisé par aucune migration Supabase ;
- ne remplace pas le manifest 0.4 par défaut ;
- ne modifie pas G1 Foundation ;
- ne déclenche aucun déploiement G2 ;
- ne modifie aucune donnée utilisateur.

---

## Conclusion

**TARGETED PASS** pour la direction machine G2 :

- recherche concurrentielle adaptative mais conservative ;
- matérialité calculée déterministement ;
- aucune synthèse sans prerequisites ;
- dépendances transitives ;
- system-first ;
- aucune question humaine de substitution ;
- 0.4 production préservé.

Avant promotion du candidat :
1. full R0 replay ;
2. red-team supplémentaire dependencies/applicability ;
3. transposition de la policy `competitive_evidence_material` dans le futur planner G2 backend ;
4. G1 build/runtime 544 + E2E satisfaits selon le cutover plan.
