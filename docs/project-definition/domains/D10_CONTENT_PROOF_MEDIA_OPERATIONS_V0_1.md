# D10 — Content, Proof, Media & Content Operations — V0.1

Statut : **WORKING CANDIDATE — NON CANONIQUE**

Mission : définir quels contenus, preuves et médias sont nécessaires pour matérialiser la stratégie, soutenir les parcours et permettre la construction — sans exiger que chaque contenu final soit déjà produit avant développement lorsque cela n’est pas nécessaire.

---

## Atoms

| ID | Type | Atom | Pourquoi | Acquisition | Résolution / Gate | Débloque | Change impact |
|---|---|---|---|---|---|---|---|
| D10.INFO.001 | INFO | Message principal | Traduire positionnement en message compréhensible | D06 + AI-R/HUM | G5 REQUIRED | page/content strategy | STRATEGIC |
| D10.INFO.010 | INFO | Messages secondaires | Structurer bénéfices/preuves/offres sans dilution | D06/D07 + AI-R | G5 CONDITIONAL | page specs | MULTI_DOMAIN |
| D10.INFO.020 | INFO | Ton / voice constraints | Garder cohérence marque/cible | SRC/HUM/AI-R | G6 CONDITIONAL | copy/design | DOMAIN |
| D10.INFO.030 | INFO | Contenus existants réutilisables | Éviter réécriture inutile | D04 | G5 CONDITIONAL | content plan | DOMAIN |
| D10.INFO.040 | INFO | Contenus obsolètes / à supprimer | Éviter migration automatique | D04/HUM/AI-R | G5 CONDITIONAL | migration | DOMAIN |
| D10.INFO.050 | INFO | Contenus manquants | Identifier matière à produire | CALC/AI-R | G5 REQUIRED | content roadmap | MULTI_DOMAIN |
| D10.INFO.060 | INFO | Preuves disponibles | Soutenir promesse et objections | D04 | G5 REQUIRED si confiance critique | page specs | MULTI_DOMAIN |
| D10.INFO.070 | INFO | Preuves manquantes | Éviter faux témoignages/chiffres inventés | CALC/AI-H | G5 REQUIRED | risk/content plan | MULTI_DOMAIN |
| D10.INFO.080 | INFO | Médias disponibles | Photos, vidéos, logos, PDF, illustrations | D04/SRC | G6 CONDITIONAL | wireframes/design | DOMAIN |
| D10.INFO.090 | INFO | Droits/provenance médias | Prévenir usage illégal ou non autorisé | D04/SRC/HUM/EXPERT | G8 CONDITIONAL | publication readiness | MULTI_DOMAIN |
| D10.INFO.100 | INFO | Besoin de contenu structuré/CMS | Déterminer si contenu est répétitif/dynamique | D07/D09/HUM | G5 CONDITIONAL | D13/D16 | MULTI_DOMAIN |
| D10.INFO.110 | INFO | Types de contenu récurrents | Services, cas clients, équipe, FAQ, actualités, zones… | D07/D09 | G5 CONDITIONAL | content model | MULTI_DOMAIN |
| D10.INFO.120 | INFO | Fréquence de mise à jour | Dimensionner CMS/ops sans sur-engineering | HUM/SRC | G7 CONDITIONAL | D13/D16 | DOMAIN |
| D10.INFO.130 | INFO | Owner éditorial | Savoir qui maintient après livraison | HUM | G7 CONDITIONAL | ops/CMS | DOMAIN |
| D10.INFO.140 | INFO | Workflow de validation éditoriale | Éviter publication incohérente si organisation complexe | HUM/SRC | G7 CONDITIONAL | CMS/roles | MULTI_DOMAIN |
| D10.INFO.150 | INFO | Langues de contenu | Activer multilingue réel | HUM/SRC | G5 CONDITIONAL | D09/D11/D13 | STRATEGIC |
| D10.INFO.160 | INFO | Contraintes réglementaires de contenu | Promesses, mentions, titres, disclaimers | D17/SRC/EXPERT | G7 CONDITIONAL | content spec | MULTI_DOMAIN |
| D10.INFO.170 | INFO | Contenus téléchargeables | PDF, brochures, ressources | RAW/SRC/HUM | G5 CONDITIONAL | D12/D14 | DOMAIN |
| D10.INFO.180 | INFO | Microcopy critique | Formulaires, erreurs, consentement, confirmations | D08/D12/D17 | G6 CONDITIONAL | functional UX | MULTI_DOMAIN |
| D10.INFO.190 | INFO | Requirements d’alt text / légendes | Intégrer accessibilité/média dès la définition | D18 | G7 REQUIRED pour médias informatifs | D15/D18 | DOMAIN |
| D10.ANALYSIS.200 | ANALYSIS | Message hierarchy analysis | Vérifier cohérence positionnement → message → preuve → action | AI-R/CALC | G5 REQUIRED | page content model | STRATEGIC |
| D10.ANALYSIS.210 | ANALYSIS | Content gap analysis | Distinguer contenu existant, manquant et non nécessaire | CALC/AI-R | G5 REQUIRED | content requirements | MULTI_DOMAIN |
| D10.ANALYSIS.220 | ANALYSIS | Proof adequacy analysis | Vérifier que les promesses importantes ont des preuves suffisantes | AI-H/CALC | G5 REQUIRED commercial | D17 risk/content plan | STRATEGIC |
| D10.ANALYSIS.230 | ANALYSIS | Content reuse analysis | Décider réemploi, réécriture, suppression, migration | AI-R | G5 CONDITIONAL redesign | migration/content plan | MULTI_DOMAIN |
| D10.ANALYSIS.240 | ANALYSIS | Content-operation complexity | Évaluer besoin CMS/workflow/roles selon volume/fréquence | CALC/AI-R | G7 CONDITIONAL | D13/D16 | MULTI_DOMAIN |
| D10.ANALYSIS.250 | ANALYSIS | Page-content sufficiency | Vérifier que chaque page D09 a assez de matière réelle ou un content requirement explicite | CALC | G6 REQUIRED | wireframes/build | MULTI_DOMAIN |
| D10.DECISION.300 | DECISION | Message hierarchy accepted | Figer message principal et hiérarchie de preuve de travail | HUM/AI-R | G5 REQUIRED | page specs | STRATEGIC |
| D10.DECISION.310 | DECISION | Content reuse decisions | Fixer garder/réécrire/supprimer/migrer | HUM/AI-R | G5 CONDITIONAL redesign | migration | MULTI_DOMAIN |
| D10.DECISION.320 | DECISION | CMS/content-ops direction | Décider si gestion structurée nécessaire | HUM/AI-R | G7 CONDITIONAL | D13/D16 | MULTI_DOMAIN |
| D10.SPEC.400 | SPEC | Content Requirements Matrix | Pour chaque page/type : purpose, audience, message, preuves, blocs, owner, statut | dérivé | G6 REQUIRED | A10 | MULTI_DOMAIN |
| D10.SPEC.410 | SPEC | Proof & Media Inventory | Source, usage, droits, statut, format, fallback | dérivé | G6 CONDITIONAL | A10/A12 | DOMAIN |
| D10.SPEC.420 | SPEC | Content Model | Champs/relations/validation pour contenus structurés | D13 + dérivé | G7 CONDITIONAL | CMS/build | MULTI_DOMAIN |
| D10.SPEC.430 | SPEC | Editorial Operations Specification | Roles, workflow, fréquence, publication, archivage si nécessaire | dérivé | G7 CONDITIONAL | D13/D16 | DOMAIN |
| D10.SPEC.440 | SPEC | Provisional-content policy | Définir quels contenus provisoires peuvent servir au build/test sans être publiables | AI-R/HUM | G8 CONDITIONAL | Build Ready sans faux contenu | DOMAIN |
| D10.VERIFY.500 | VERIFY | Content coverage check | Chaque page stratégique a contenu réel ou requirement explicite | TRACEABILITY_CHECK | G8 REQUIRED | Build Ready | MULTI_DOMAIN |
| D10.VERIFY.510 | VERIFY | Proof provenance check | Aucun chiffre/avis/certification critique sans provenance | TRACEABILITY_CHECK | G8 REQUIRED | Build Ready | MULTI_DOMAIN |
| D10.VERIFY.520 | VERIFY | Rights check | Aucun média final sans droit/statut clair lorsque requis | INSPECTION | G8 CONDITIONAL | Build Ready/release | DOMAIN |
| D10.VERIFY.530 | VERIFY | Placeholder leakage check | Aucun placeholder ne doit être considéré comme contenu publiable | INSPECTION | G8 REQUIRED | Build Ready | DOMAIN |
| D10.VERIFY.540 | VERIFY | Content-operation feasibility check | CMS/workflow prévu correspond aux ressources réelles | TRACEABILITY_CHECK | G8 CONDITIONAL | Build Ready | MULTI_DOMAIN |

---

## Contenu final vs Build Ready

`READY_FOR_DEVELOPMENT` n’exige pas automatiquement tous les textes/images définitifs.

Un contenu peut rester `TO_PRODUCE` si le dossier définit déjà :

- purpose ;
- audience ;
- emplacement/type ;
- message attendu ;
- contraintes ;
- format ;
- owner ;
- deadline/dépendance si critique ;
- provenance/droits requis ;
- fallback/provisional policy.

En revanche, le contenu devient `BLOCKING` lorsqu’il est indispensable pour concevoir/tester correctement une structure, une interaction ou une obligation légale.

---

## Human-only réel

L’humain est généralement nécessaire pour :

- promesses commerciales engageantes ;
- contenus internes non publics ;
- validation de témoignages/chiffres/droits ;
- choix du ton lorsque préférence de marque structurante ;
- ownership éditorial réel.

L’IA peut proposer copy provisoire, structure et gaps, mais ne doit pas inventer preuves ni publier des promesses non validées.

---

## Exit criteria

### G5

Message principal, preuves nécessaires et besoins de contenu structurants sont connus.

### G6

Chaque page/écran stratégique dispose d’un Content Requirement suffisamment précis pour wireframe/design.

### G7/G8

CMS/ops/rights/regulatory requirements applicables sont définis ; les contenus non finaux ont un statut et une stratégie explicites.

---

## Deliverables affectés

A09, A10, A11, A12, A15.

---

## Red-team questions

- contenu final manquant ne doit pas forcer un faux lorem ipsum publiable ;
- une homepage ne doit pas être structurée avant de savoir quelles preuves réelles existent ;
- un CMS n’est pas justifié simplement parce qu’il existe techniquement ;
- une FAQ n’est utile que si de vraies questions/objections existent ;
- multilingue implique traduction, ownership, SEO et maintenance — pas seulement un sélecteur de langue ;
- les preuves marketing doivent rester séparées des affirmations non vérifiées.
