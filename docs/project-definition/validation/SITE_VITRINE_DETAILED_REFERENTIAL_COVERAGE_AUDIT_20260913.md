# 4b4c — SITE VITRINE DETAILED REFERENTIAL COVERAGE AUDIT — 2026-09-13

Statut : **VALIDATION SUPPORT — NON CANONIQUE**

But : vérifier après remplissage détaillé si le référentiel candidat couvre réellement le passage `Idée brute → Idea approuvée → Project défini → Ready for Development`, sans gonfler inutilement un site vitrine simple.

---

# 1. Couverture professionnelle

| Besoin professionnel | Couverture | Verdict |
|---|---|---|
| Gouvernance / décideurs / conflits | D01 + D22 | couvert |
| Business / problème / objectifs | D02 | couvert |
| Cibles / besoins / objections / usage | D03 | couvert |
| Existant / assets / analytics / baseline | D04 | couvert |
| Marché / concurrence / alternatives / benchmark | D05 | couvert |
| Challenge / amélioration / options / positionnement | D06 | couvert |
| Offre / macro scope / non-goals | D07 | couvert |
| Préfiguration avant décision | Z4 previews D08–D19 | couvert |
| Validation concept utilisateur | Z4b | conditionnel couvert |
| Chiffres / scenarios / business case | D21 | conditionnel couvert |
| Présentation / PPTX / review / approval | D22 | couvert |
| Feedback de réunion / Change Impact | D22 + Change Ledger | couvert |
| Promotion Idea → Project sans restart | Z6 Promotion Contract | couvert |
| Parcours détaillés / conversion | D08 | couvert |
| Sitemap / routes / navigation / rôle pages | D09 | couvert |
| Contenu / preuve / médias / ownership | D10 | couvert |
| SEO / local / migration | D11 + overlays | couvert |
| Fonctionnalités / règles métier / états / edge cases | D12 | couvert |
| Data / CMS / roles / permissions | D13 | conditionnel couvert |
| Integrations / emails / notifications / APIs | D14 | conditionnel couvert |
| UX / wireframes / responsive / design system | D15 | couvert |
| Architecture technique / env / hosting / maintenance | D16 | couvert |
| Security / privacy / legal / compliance | D17 | conditionnel couvert |
| Accessibility / performance / reliability / compatibility | D18 | couvert proportionnellement |
| Analytics / measurement / observability | D19 | conditionnel couvert |
| QA / acceptance / traceability / handoff | D20 | couvert |
| Context-specific activation | Context Overlays | couvert |
| AI vs human question minimization | Resolution Policy + Human Map | couvert |
| Evidence / assumptions / decisions / risks / snapshots | Cross-cutting Ledgers | couvert |
| Progressive validation/freeze/reopening | Lock/Promotion model | couvert |

---

# 2. Ce qui serait trop lourd s’il était obligatoire

Les éléments suivants doivent rester **conditionnels** :

- D21 ROI / market sizing / financial model ;
- Z4b real-user validation ;
- high-fidelity mockups multiples ;
- prototype cliquable ;
- D13 CMS/roles/data model approfondi ;
- D14 APIs/integrations complexes ;
- D19 analytics avancé/A-B testing ;
- formal threat modeling high-depth ;
- committee-grade presentation ;
- multilingual/localization ;
- migration SEO lourde ;
- performance budgets chiffrés avancés.

Un petit site vitrine ne doit pas supporter cette charge sans trigger réel.

---

# 3. Ce qui est essentiel même pour un petit site

Au minimum proportionné :

- objectif/problem/outcome ;
- cible principale ;
- offre prioritaire ;
- contexte/existing si refonte ;
- marché/concurrence suffisamment compris pour ne pas concevoir à l’aveugle ;
- challenge/simplification ;
- direction retenue ;
- macro scope/non-goals ;
- concept journey/sitemap suffisamment tangible pour décision ;
- page roles/CTA/content requirements ;
- responsive/mobile ;
- forms/contact behavior si présent ;
- SEO intent minimal pour pages publiques ;
- privacy/legal applicability ;
- accessibility baseline ;
- platform/hosting fit ;
- acceptance/handoff minimum.

---

# 4. Questions humaines réellement structurelles

Le référentiel détaillé contient beaucoup de questions internes mais le nombre de catégories human-only reste faible :

1. intention business future ;
2. priorité de cible/offre lorsqu’elle est stratégique ;
3. hard constraints privées ;
4. règles métier internes non documentées ;
5. préférences structurantes ;
6. arbitrages entre trade-offs ;
7. validation de claims/droits non sourçables ;
8. acceptation de risques/unknowns ;
9. approvals formels ;
10. expert signoff selon risque.

Le reste est majoritairement extractable, auditable, recherchable, calculable, hypothétisable ou recommandable par 2b2c.

---

# 5. Gaps restants — pas de nouveau domaine requis

Aucun manque ne justifie actuellement D23.

Les travaux encore nécessaires avant canonisation sont surtout de nature **formalisation/machine-contract**, pas couverture métier :

## A — Requirement Atom Schema final

Stabiliser les champs, IDs, applicability, minimum-resolution-by-gate, change edges et serialization.

## B — Blueprint Site vitrine Overlay

Transformer cette couverture en règles d’applicabilité/criticité exactes pour Site vitrine, plutôt qu’en prose.

## C — Deliverable Contracts détaillés

Définir précisément contenu minimum, conditions READY/STALE et sources de chaque livrable.

## D — Dependency Graph formel

Passer des dépendances narratives à un graphe machine-readable/testable.

## E — Standard Profiles

Formaliser les subsets pertinents WCAG/security/SEO/privacy sans imposer toutes les normes à tout projet.

## F — Delivery Profiles

Lovable/React, WordPress, Webflow, etc., seulement après choix de delivery approach.

## G — Runtime feasibility mapping

Plus tard : comparer ces contrats au backend actuel et concevoir migration minimale. Aucun changement runtime maintenant.

---

# 6. Verdict

Du point de vue **couverture professionnelle**, le référentiel candidat D01→D22 + Prefiguration + Decision Package + Context Overlays + Promotion Contract + Human Intervention Map + Ledgers est maintenant suffisamment complet pour servir de base au Blueprint `SITE_VITRINE`.

Le risque principal n’est plus “avons-nous oublié un métier ou une famille de questions majeure ?”.

Le risque principal devient :

> **formaliser correctement applicability, dependencies, readiness et machine contracts sans transformer cette exhaustivité interne en complexité utilisateur.**

Recommandation : ne pas ajouter de nouveaux domaines sauf preuve d’un manque réel. La prochaine passe doit convertir cette architecture en **contrats structurés et testables**, puis red-team ces contrats avant toute reprise de l’UX.
