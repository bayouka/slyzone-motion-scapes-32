# D03 — Users, Audiences, Segments & Jobs — V0.1

Statut : **WORKING CANDIDATE — NON CANONIQUE**

Mission : comprendre pour qui l’Idea/Project existe, quels besoins et critères de décision comptent, dans quel contexte la solution sera découverte/utilisée et quelles différences entre segments doivent réellement influencer la stratégie ou l’expérience.

---

## Atoms

| ID | Type | Atom | Pourquoi | Acquisition | Résolution / Gate | Débloque | Change impact |
|---|---|---|---|---|---|---|---|
| D03.INFO.001 | INFO | Modèle d’audience B2B/B2C/B2B2C/interne/mixte | Orienter recherche, contenu, parcours, gouvernance | RAW/SRC/CALC | G1 REQUIRED | segmentation / concurrence | STRATEGIC |
| D03.INFO.010 | INFO | Audience principale | Éviter de concevoir pour tout le monde | RAW/SRC/CONN/AI-H/HUM | G1 REQUIRED | D05/D06/D08 | STRATEGIC |
| D03.INFO.020 | INFO | Audience secondaire | Gérer besoins secondaires sans diluer la primaire | RAW/SRC/AI-H | G3 CONDITIONAL | scope/content | MULTI_DOMAIN |
| D03.INFO.030 | INFO | Segment précis | Cibler offre, concurrence et messages | RAW/CONN/AI-H/HUM | G2 REQUIRED si marché large | D05/D06 | STRATEGIC |
| D03.INFO.040 | INFO | Zone géographique / marché | Sélectionner concurrence, SEO/local, contraintes | RAW/SRC/WEB | G1 CONDITIONAL | D05/D11 | MULTI_DOMAIN |
| D03.INFO.050 | INFO | Profil organisationnel B2B | Taille, secteur, maturité, rôle d’achat | RAW/WEB/AI-H | G2 CONDITIONAL | benchmark/parcours | DOMAIN |
| D03.INFO.060 | INFO | Profil particulier B2C pertinent | Critères utiles sans persona décoratif | RAW/WEB/AI-H | G2 CONDITIONAL | parcours/content | DOMAIN |
| D03.INFO.070 | INFO | Job-to-be-done / tâche recherchée | Comprendre ce que l’utilisateur essaie d’accomplir | RAW/WEB/SRC/AI-H | G2 REQUIRED | value proposition | STRATEGIC |
| D03.INFO.080 | INFO | Besoin principal | Relier cible à résultat utilisateur | RAW/WEB/AI-H | G1 REQUIRED | D06/D08 | STRATEGIC |
| D03.INFO.090 | INFO | Bénéfices recherchés | Comprendre critères positifs de choix | WEB/RAW/AI-H | G2 REQUIRED | positioning/content | MULTI_DOMAIN |
| D03.INFO.100 | INFO | Freins / objections | Construire réassurance et parcours | WEB/SRC/AI-H | G2 REQUIRED | D08/D10 | MULTI_DOMAIN |
| D03.INFO.110 | INFO | Critères de décision | Comparaison prix, confiance, expertise, proximité, délai… | WEB/RAW/SRC/AI-H | G2 REQUIRED | D05/D06 | STRATEGIC |
| D03.INFO.120 | INFO | Niveau de connaissance / maturité | Ajuster contenu, vocabulaire et profondeur | WEB/AI-H/SRC | G5 ENHANCER | content/UX | DOMAIN |
| D03.INFO.130 | INFO | Contexte d’usage | Mobile, urgence, recherche comparative, environnement | WEB/SRC/CONN/AI-H | G5 CONDITIONAL | D08/D15/D18 | MULTI_DOMAIN |
| D03.INFO.140 | INFO | Canal de découverte | Google, recommandation, social, direct, campagne… | CONN/SRC/WEB/AI-H | G2 ENHANCER, G5 CONDITIONAL | D11/D19 | DOMAIN |
| D03.INFO.150 | INFO | Processus de décision / buying journey | Savoir qui influence et à quel moment | WEB/RAW/SRC/AI-H | G3 CONDITIONAL | D08/D10 | MULTI_DOMAIN |
| D03.INFO.160 | INFO | Buying committee / rôles d’achat | Éviter de confondre utilisateur, prescripteur, décideur | RAW/WEB/AI-H/HUM | G3 CONDITIONAL B2B | content/journey | MULTI_DOMAIN |
| D03.INFO.170 | INFO | Evidence utilisateur réelle | Analytics, CRM, Search Console, interviews, appels, avis | CONN/SRC | G2 ENHANCER | confidence | DOMAIN |
| D03.INFO.180 | INFO | Besoins d’accessibilité spécifiques connus | Ne pas ignorer une population critique | HUM/SRC/CONN | G5 CONDITIONAL | D18 | MULTI_DOMAIN |
| D03.INFO.190 | INFO | Audiences explicitement hors cible | Prévenir dilution du scope | HUM/RAW | G3 ENHANCER | positioning/scope | STRATEGIC |
| D03.ANALYSIS.200 | ANALYSIS | Segmentation relevance analysis | Déterminer quels segments changent réellement la solution | CALC/AI-H | G2 REQUIRED si multi-segments | primary/secondary choice | STRATEGIC |
| D03.ANALYSIS.210 | ANALYSIS | Need / job synthesis | Synthétiser besoins sans inventer des vérités comportementales | AI-H/AI-R + evidence | G2 REQUIRED | D06 | STRATEGIC |
| D03.ANALYSIS.220 | ANALYSIS | Objection & decision-criteria map | Relier objections, preuves et critères | WEB/SRC/AI-H | G2 REQUIRED | D08/D10 | MULTI_DOMAIN |
| D03.ANALYSIS.230 | ANALYSIS | Audience evidence confidence | Distinguer données réelles, recherche, hypothèses | CALC | G2 REQUIRED | confidence/readiness | DOMAIN |
| D03.DECISION.300 | DECISION | Audience primaire retenue | Arbitrer si plusieurs segments se concurrencent | HUM/AI-R | G3 BLOCKING si conflit | D05/D06/D07 | STRATEGIC |
| D03.DECISION.310 | DECISION | Segments secondaires à servir maintenant | Éviter de surcharger V1 | HUM/AI-R | G5 CONDITIONAL | D07/D09 | MULTI_DOMAIN |
| D03.DECISION.320 | DECISION | Assumptions audience acceptées | Continuer sans fausse certitude | HUM/owner si critique | G3/G4 CONDITIONAL | candidate direction | STRATEGIC |
| D03.SPEC.400 | SPEC | Audience & need model actif | Baseline projet après GO | dérivé | G5 REQUIRED | D08-D12 | STRATEGIC |
| D03.VERIFY.500 | VERIFY | Audience-to-scope traceability | Vérifier que pages/fonctions/contenus ont une cible ou justification | TRACEABILITY_CHECK | G8 REQUIRED | Build Ready | MULTI_DOMAIN |
| D03.VERIFY.510 | VERIFY | Excluded-audience leakage check | Vérifier que le projet ne dérive pas vers des cibles non retenues | TRACEABILITY_CHECK | G8 ENHANCER | coherence | DOMAIN |

---

## Human-only réel

L’humain intervient surtout pour :

- choisir quelle audience l’organisation veut réellement prioriser ;
- révéler une stratégie interne non observable ;
- arbitrer entre deux segments tous deux plausibles ;
- confirmer une exclusion de marché structurante.

Les besoins, objections ou critères peuvent souvent être recherchés et proposés comme hypothèses ; ils ne doivent pas être présentés comme des faits sans evidence.

---

## Exit criteria

### G1

Une audience principale suffisamment plausible et un besoin principal existent pour éviter une analyse générique.

### G2

Le terrain de recherche est assez précis : audience/segment + offre + zone lorsque pertinente.

### G3/G4

Les options stratégiques peuvent être comparées par rapport aux besoins/critères de la cible ; aucun conflit majeur de cible n’est caché.

### G5+

Les parcours, pages, contenus et fonctionnalités savent explicitement quels segments ils servent.

---

## Deliverables affectés

A03, A05, A06, A07, A09, A10, A15.

---

## Red-team questions

- éviter les personas fictifs décoratifs ;
- ne pas demander âge/genre si cela ne change rien au produit ;
- un utilisateur réel peut être différent de l’acheteur/décideur ;
- audience « tout le monde » doit être challengée ;
- B2B/B2C mixte peut nécessiter plusieurs parcours sans forcément deux sites ;
- changer de cible après Idea Freeze doit être considéré `STRATEGIC`.
