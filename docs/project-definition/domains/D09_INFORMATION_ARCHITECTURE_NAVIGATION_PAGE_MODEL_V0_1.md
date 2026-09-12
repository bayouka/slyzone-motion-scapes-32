# D09 — Information Architecture, Navigation & Page/Screen Model — V0.1

Statut : **WORKING CANDIDATE — NON CANONIQUE**

Mission : définir la structure logique du futur site/produit — quelles pages/écrans existent, pourquoi, pour qui, avec quel rôle, comment elles se relient et comment l’utilisateur navigue — sans laisser le design visuel décider de l’architecture.

---

## Atoms

| ID | Type | Atom | Pourquoi | Acquisition | Résolution / Gate | Débloque | Change impact |
|---|---|---|---|---|---|---|---|
| D09.INFO.001 | INFO | Objets d’information principaux | Savoir quelles entités/contenus structurent le site | D07/D10 provisoire | G5 REQUIRED | page model | MULTI_DOMAIN |
| D09.INFO.010 | INFO | Pages/écrans candidats | Créer uniquement les surfaces nécessaires | AI-R/D07/D08/D11 | G5 REQUIRED | sitemap | STRATEGIC |
| D09.INFO.020 | INFO | Rôle de chaque page/écran | Éviter les pages « par habitude » | AI-R | G5 REQUIRED | page spec | DOMAIN |
| D09.INFO.030 | INFO | Audience de chaque page/écran | Relier structure et segments | D03 + AI-R | G5 REQUIRED | content/UX | MULTI_DOMAIN |
| D09.INFO.040 | INFO | Objectif de chaque page/écran | Éviter pages sans résultat attendu | D02/D08 + AI-R | G5 REQUIRED | CTA/content | MULTI_DOMAIN |
| D09.INFO.050 | INFO | CTA principal par page/écran | Maintenir cohérence avec parcours | D08/AI-R | G5 REQUIRED | page spec | DOMAIN |
| D09.INFO.060 | INFO | Intention SEO éventuelle | Associer structure et découvrabilité sans créer pages artificielles | D11 | G5 CONDITIONAL | SEO mapping | MULTI_DOMAIN |
| D09.INFO.070 | INFO | Route / URL candidate | Préparer navigation, SEO et technique | AI-R | G5 REQUIRED site web | route manifest | MULTI_DOMAIN |
| D09.INFO.080 | INFO | Statut navigation principale | Savoir ce qui doit être visible dans header | AI-R/HUM | G5 REQUIRED | nav model | DOMAIN |
| D09.INFO.090 | INFO | Statut footer / navigation secondaire | Gérer accès utile sans surcharger header | AI-R | G5 CONDITIONAL | nav model | DOMAIN |
| D09.INFO.100 | INFO | Relations / liens internes | Permettre progression et contextualisation | AI-R/CALC | G5 REQUIRED | internal linking | MULTI_DOMAIN |
| D09.INFO.110 | INFO | Hiérarchie page parent/enfant | Structurer offres, catégories, contenus | AI-R | G5 CONDITIONAL | sitemap | DOMAIN |
| D09.INFO.120 | INFO | Modèles de page récurrents | Éviter incohérence et duplication | AI-R | G6 CONDITIONAL | design system/content model | MULTI_DOMAIN |
| D09.INFO.130 | INFO | Pages utilitaires obligatoires | 404, contact, légales, etc. selon contexte | D17/AI-R | G5 CONDITIONAL | completeness | DOMAIN |
| D09.INFO.140 | INFO | Page d’accueil : rôle spécifique | Définir orchestration plutôt qu’un simple assemblage de sections | D02/D03/D07/D08 | G5 REQUIRED site vitrine | home spec | STRATEGIC |
| D09.INFO.150 | INFO | Structure multilingue | Définir langues/routes/navigation si activé | HUM/D10/D11 | G5 CONDITIONAL `IS_MULTILINGUAL` | routes/content | MULTI_DOMAIN |
| D09.INFO.160 | INFO | Recherche interne / filtres / navigation locale | N’activer que si volume/usage le justifie | D07/D10/AI-R | G5 CONDITIONAL | D12/D13 | MULTI_DOMAIN |
| D09.INFO.170 | INFO | Ancres / navigation intra-page | Prévoir seulement si pages longues ou usage spécifique | AI-R | G6 ENHANCER | UX | DOMAIN |
| D09.INFO.180 | INFO | Pages noindex / non publiques candidates | Éviter exposition/indexation inadaptée | D11/D17 | G5 CONDITIONAL | SEO/tech | MULTI_DOMAIN |
| D09.INFO.190 | INFO | Redirections structurantes nécessaires | Préparer refonte/migration | D04/D11 | G5 CONDITIONAL redesign | migration | MULTI_DOMAIN |
| D09.ANALYSIS.200 | ANALYSIS | Sitemap derivation | Transformer scope/parcours/contenus en structure cohérente | AI-R | G5 REQUIRED | sitemap decision | STRATEGIC |
| D09.ANALYSIS.210 | ANALYSIS | Navigation clarity analysis | Tester charge cognitive, labels, profondeur et accès aux actions | AI-H/AI-R | G5 REQUIRED | nav decision | DOMAIN |
| D09.ANALYSIS.220 | ANALYSIS | Page necessity analysis | Vérifier que chaque page a rôle, audience, objectif et contenu suffisant | CALC/AI-H | G5 REQUIRED | scope discipline | MULTI_DOMAIN |
| D09.ANALYSIS.230 | ANALYSIS | Cross-link / journey alignment | Vérifier que la structure supporte D08 | CALC/AI-H | G5 REQUIRED | page specs | MULTI_DOMAIN |
| D09.ANALYSIS.240 | ANALYSIS | Template rationalization | Détecter pages pouvant partager un modèle | AI-R | G6 CONDITIONAL | D15/D16 | DOMAIN |
| D09.DECISION.300 | DECISION | Sitemap accepted current | Fixer l’arborescence de travail | HUM/AI-R | G5 REQUIRED | content/wireframes | STRATEGIC |
| D09.DECISION.310 | DECISION | Navigation model accepted | Fixer header/footer/secondary navigation | HUM/AI-R | G5 REQUIRED | UX/design | MULTI_DOMAIN |
| D09.DECISION.320 | DECISION | Page model decisions | Accepter pages, templates et exclusions | HUM/AI-R | G5 REQUIRED | specs | MULTI_DOMAIN |
| D09.SPEC.400 | SPEC | Sitemap Specification | Pages, hiérarchie, routes, rôle, audience, CTA, intention, status | dérivé | G5 BLOCKING | A09 | STRATEGIC |
| D09.SPEC.410 | SPEC | Navigation Specification | Header/footer/nav secondaire, labels, destinations, états | dérivé | G6 REQUIRED | D15/D16 | MULTI_DOMAIN |
| D09.SPEC.420 | SPEC | Page/Screen Specification skeleton | Pour chaque surface : rôle, inputs, sections/blocks requis, CTA, dependencies | dérivé | G6 REQUIRED | D10/D12/D15 | MULTI_DOMAIN |
| D09.SPEC.430 | SPEC | Route Manifest | Source de vérité des routes et statuts | dérivé | G7 REQUIRED web | D11/D16 | MULTI_DOMAIN |
| D09.VERIFY.500 | VERIFY | Orphan page check | Aucune page stratégique sans chemin entrant/sortant utile | TRACEABILITY_CHECK | G8 REQUIRED | Build Ready | DOMAIN |
| D09.VERIFY.510 | VERIFY | Page-purpose check | Chaque page doit avoir rôle/audience/objective/CTA ou justification | TRACEABILITY_CHECK | G8 REQUIRED | Build Ready | DOMAIN |
| D09.VERIFY.520 | VERIFY | Journey reachability check | Les parcours D08 doivent être réalisables avec l’architecture D09 | TRACEABILITY_CHECK | G8 REQUIRED | Build Ready | MULTI_DOMAIN |
| D09.VERIFY.530 | VERIFY | Route uniqueness / collision check | Éviter routes ambiguës/dupliquées | INSPECTION | G8 REQUIRED web | Build Ready | DOMAIN |

---

## Human-only réel

L’IA peut proposer sitemap, labels et structure.

L’humain est requis surtout lorsque :

- une page reflète une priorité métier/politique ;
- une offre doit volontairement être cachée/mise en avant ;
- une structure multilingue ou locale dépend d’une stratégie réelle ;
- des contraintes de navigation sont imposées par une organisation.

---

## Exit criteria

### G5 — Product Definition Stable

- sitemap cohérent avec scope et parcours ;
- aucune page importante créée uniquement « parce qu’un site vitrine en a une » ;
- rôle/audience/objectif/CTA connus ;
- navigation principale compréhensible ;
- SEO/migration conditionnels pris en compte.

### G6 — Experience Definition Sufficient

- page/screen skeletons suffisamment précis pour wireframes ;
- route/navigation sources de vérité prêtes ;
- templates récurrents identifiés si utiles.

---

## Deliverables affectés

A09, A10, A12, A15.

---

## Red-team questions

- homepage ≠ résumé de tout ;
- FAQ/blog/tarifs ne sont pas obligatoires par convention ;
- SEO ne doit pas créer des pages sans valeur utilisateur ;
- une refonte doit préserver ou rediriger les URLs critiques ;
- une navigation courte n’est pas toujours meilleure si elle masque l’offre ;
- des pages similaires doivent pouvoir partager un template sans supprimer leurs intentions distinctes ;
- la structure doit rester compréhensible sans design final.
