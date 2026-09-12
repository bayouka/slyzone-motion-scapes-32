# D04 — Existing State, Assets & Evidence — V0.1

Statut : **WORKING CANDIDATE — NON CANONIQUE**

Mission : établir une baseline factuelle de ce qui existe déjà — offre, site, contenu, données, SEO, marque, preuves, technique et contraintes héritées — sans confondre observation, déclaration et recommandation.

---

## Atoms

| ID | Type | Atom | Pourquoi | Acquisition | Résolution / Gate | Débloque | Change impact |
|---|---|---|---|---|---|---|---|
| D04.INFO.001 | INFO | Existence d’un site / système actuel | Activer audit/refonte/migration | RAW/SRC | G1 CONDITIONAL | overlay redesign | MULTI_DOMAIN |
| D04.INFO.010 | INFO | URL / accès actuel | Permettre crawl/audit | RAW/SRC | G1 CONDITIONAL | audit | DOMAIN |
| D04.INFO.020 | INFO | Sitemap / routes existantes | Comprendre structure et migration | AUDIT/SRC | G2 CONDITIONAL | D09/D11 | MULTI_DOMAIN |
| D04.INFO.030 | INFO | Pages / écrans existants | Baseline informationnelle | AUDIT/SRC | G2 CONDITIONAL | D09 | DOMAIN |
| D04.INFO.040 | INFO | Navigation actuelle | Diagnostiquer orientation/frictions | AUDIT | G2 CONDITIONAL | D09 | DOMAIN |
| D04.INFO.050 | INFO | CTA / conversions actuelles | Comparer intention déclarée et expérience réelle | AUDIT/SRC | G2 CONDITIONAL | D08 | MULTI_DOMAIN |
| D04.INFO.060 | INFO | Formulaires / points de contact | Identifier flux, données et risques | AUDIT/SRC | G2 CONDITIONAL | D12/D13/D17 | MULTI_DOMAIN |
| D04.INFO.070 | INFO | Offre / catalogue actuel | Comprendre ce que l’entreprise vend réellement | SRC/AUDIT/RAW | G1 REQUIRED site commercial | D07 | STRATEGIC |
| D04.INFO.080 | INFO | Validité actuelle de l’offre | Éviter d’utiliser une offre obsolète | HUM/SRC | G3 REQUIRED si source ancienne | D06/D07 | STRATEGIC |
| D04.INFO.090 | INFO | Priorité actuelle des offres | Comprendre l’existant sans l’assimiler à la stratégie future | CONN/SRC/RAW | G2 ENHANCER | D07 | DOMAIN |
| D04.INFO.100 | INFO | Contenus existants | Inventorier matière réutilisable | AUDIT/SRC | G5 CONDITIONAL | D10 | DOMAIN |
| D04.INFO.110 | INFO | Qualité / fraîcheur du contenu | Détecter réemploi dangereux | AUDIT/AI-H/SRC | G5 CONDITIONAL | D10 | DOMAIN |
| D04.INFO.120 | INFO | Preuves actuelles | Avis, cas clients, chiffres, certifications | SRC/AUDIT | G2 REQUIRED si confiance critique | D06/D10 | MULTI_DOMAIN |
| D04.INFO.130 | INFO | Provenance / validité des preuves | Éviter preuves non vérifiables | SRC/HUM | G5 REQUIRED si publiées | D10/D17 | MULTI_DOMAIN |
| D04.INFO.140 | INFO | Brand assets | Logo, charte, photos, vidéos, iconographie | SRC | G5 CONDITIONAL | D15 | DOMAIN |
| D04.INFO.150 | INFO | Droits d’usage des assets | Éviter réutilisation illicite | SRC/HUM/EXPERT | G8 CONDITIONAL | D10/D17 | MULTI_DOMAIN |
| D04.INFO.160 | INFO | Analytics disponibles | Fournir evidence comportementale | CONN/SRC | G2 ENHANCER | D02/D03/D19 | DOMAIN |
| D04.INFO.170 | INFO | Search Console / données SEO | Identifier requêtes/pages/risque migration | CONN/SRC | G2 CONDITIONAL redesign | D11 | MULTI_DOMAIN |
| D04.INFO.180 | INFO | CRM / leads / données commerciales | Relier site et réalité business | CONN/SRC | G2 ENHANCER | D02/D03/D19 | DOMAIN |
| D04.INFO.190 | INFO | Performance actuelle | Baseline technique/UX | AUDIT/WEB | G2 ENHANCER, G7 CONDITIONAL | D18 | DOMAIN |
| D04.INFO.200 | INFO | Stack / hébergement actuels | Identifier contraintes de migration ou maintien | AUDIT/SRC/HUM | G4 CONDITIONAL | D16 | MULTI_DOMAIN |
| D04.INFO.210 | INFO | Intégrations existantes | Ne pas casser des dépendances cachées | AUDIT/SRC/HUM | G4 CONDITIONAL | D14/D16 | MULTI_DOMAIN |
| D04.INFO.220 | INFO | SEO à préserver / URLs critiques | Prévenir perte d’acquisition | CONN/SRC/HUM | G4 CONDITIONAL | D11 | STRATEGIC |
| D04.INFO.230 | INFO | Éléments à conserver | Capturer contrainte/préférence humaine | HUM/RAW | G3 CONDITIONAL | D07/D15 | MULTI_DOMAIN |
| D04.INFO.240 | INFO | Éléments à abandonner | Capturer volonté explicite sans la confondre avec recommandation | HUM/RAW | G3 CONDITIONAL | D07/D15 | MULTI_DOMAIN |
| D04.INFO.250 | INFO | Dette / incidents connus | Éviter de reproduire des problèmes | HUM/SRC | G4 CONDITIONAL | D16/D18 | MULTI_DOMAIN |
| D04.INFO.260 | INFO | Qualité / fraîcheur des sources | Pondérer evidence et conflits | CALC/SRC | G2 REQUIRED | evidence model | DOMAIN |
| D04.ANALYSIS.300 | ANALYSIS | Existing-state audit | Synthétiser structure, contenu, CTA, preuves et frictions | AUDIT/AI-H | G2 REQUIRED si refonte | A04 | STRATEGIC |
| D04.ANALYSIS.310 | ANALYSIS | Strengths-to-preserve analysis | Identifier ce qui fonctionne réellement | AUDIT/CONN/AI-H | G2 REQUIRED refonte | D06 | MULTI_DOMAIN |
| D04.ANALYSIS.320 | ANALYSIS | Weaknesses / friction analysis | Identifier problèmes observables sans fausse causalité | AUDIT/CONN/AI-H | G2 REQUIRED refonte | D06/D08 | MULTI_DOMAIN |
| D04.ANALYSIS.330 | ANALYSIS | Evidence quality assessment | Qualifier fiabilité/fraîcheur/provenance | CALC/AI-H | G2 REQUIRED | decision confidence | DOMAIN |
| D04.ANALYSIS.340 | ANALYSIS | Reuse / migration impact analysis | Déterminer ce qui peut être gardé, migré, réécrit | AI-R/CALC | G5 CONDITIONAL | D09-D11 | MULTI_DOMAIN |
| D04.DECISION.400 | DECISION | Assets / contents accepted for reuse | Éviter le réemploi automatique | HUM/AI-R | G5 CONDITIONAL | D10/D15 | MULTI_DOMAIN |
| D04.DECISION.410 | DECISION | Existing constraints accepted as binding | Distinguer héritage réel et préférence réversible | HUM | G4 CONDITIONAL | D16/D17 | STRATEGIC |
| D04.SPEC.500 | SPEC | Existing-state baseline snapshot | Figer la baseline utilisée par le Project | dérivé | G5 REQUIRED redesign | traceability | MULTI_DOMAIN |
| D04.SPEC.510 | SPEC | Migration inventory baseline | Lister contenus/routes/assets/données à migrer ou supprimer | dérivé | G7 CONDITIONAL | D11/D16 | MULTI_DOMAIN |
| D04.VERIFY.600 | VERIFY | Baseline provenance check | Vérifier que chaque constat critique a une source | TRACEABILITY_CHECK | G2/G8 REQUIRED | confidence | DOMAIN |
| D04.VERIFY.610 | VERIFY | Migration preservation check | Vérifier qu’aucun élément critique à conserver n’a disparu des specs | TRACEABILITY_CHECK | G8 CONDITIONAL | Build Ready | MULTI_DOMAIN |

---

## Human-only réel

L’humain est surtout nécessaire pour :

- dire si une offre/source ancienne est encore valide ;
- révéler les contraintes non observables ;
- décider ce qui doit impérativement être conservé ou abandonné ;
- confirmer les droits/licences lorsque les sources ne suffisent pas.

Le reste doit être fortement `SRC/AUDIT/CONN-first`.

---

## Exit criteria

### G1

Le système sait s’il s’agit d’une création ou refonte et quelles sources sont disponibles.

### G2

Pour une refonte : baseline suffisamment fiable pour comparer le futur à l’existant ; forces/faiblesses et evidence clairement séparées des opinions.

### G4

Les contraintes héritées capables d’invalider une direction sont connues.

### G5+

Le Project sait ce qu’il réutilise, remplace ou migre ; les éléments critiques sont traçables.

---

## Deliverables affectés

A04, A05, A06, A08, A10, A13, A15.

---

## Red-team questions

- un site actuel n’est pas forcément une bonne référence pour le futur ;
- « le client veut garder X » est une contrainte humaine, pas une preuve de qualité ;
- un audit Lighthouse seul ne prouve ni problème business ni UX ;
- une page performante SEO ne doit pas être supprimée sur intuition ;
- une preuve marketing sans provenance ne doit pas devenir contenu final ;
- un document ancien doit pouvoir être `STALE` sans être ignoré silencieusement.
