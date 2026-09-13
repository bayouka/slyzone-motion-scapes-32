# 4b4c — PREFIGURATION + DECISION PACKAGE REQUIREMENT REGISTRY — V0.1

Date : 2026-09-13

Statut : **WORKING CANDIDATE — NON CANONIQUE / À RED-TEAMER**

Périmètre : Z4 `IDEA PREFIGURATION` + Z5 `DECISION PACKAGE & REVIEW` de l’architecture V0.3.

But : rendre une direction stratégique suffisamment tangible et documentée pour qu’un décideur ou une équipe puisse la comprendre, la challenger, l’améliorer puis décider si elle mérite de devenir un Project.

---

# 0. Invariants

1. Préfigurer ≠ définir définitivement le Project.
2. Une maquette haute fidélité peut exister avant GO mais reste `FOR_DECISION`.
3. Un sitemap conceptuel peut être validé comme logique probable sans être Build-Frozen.
4. Toute projection chiffrée expose inputs, hypothèses, méthode, range et confiance.
5. Le feedback de présentation est une nouvelle source d’information/decision ; il ne modifie jamais silencieusement la baseline.
6. Les artifacts validés avant GO sont hérités par le Project et approfondis ; ils ne sont pas reconstruits par défaut.
7. La profondeur de préfiguration dépend de la Decision Question : ne pas construire un mini-Project complet pour convaincre d’un site simple.

---

# 1. Fondation stable avant préfiguration

## PF.I01 — Business objective baseline
Type : INFO/DECISION

Doit être au moins `LOCKED_FOR_DEPENDENTS`.

Résolution : RAW/SRC/HUM ; IA peut reformuler mais pas inventer l’intention.

## PF.I02 — Problem/opportunity baseline
Type : INFO/ANALYSIS

Doit distinguer problème déclaré, observations et hypothèses causales.

## PF.I03 — Primary audience baseline
Type : INFO/DECISION

Peut avoir commencé comme hypothèse ; avant préfiguration importante, la cible doit être suffisamment fiable pour ne pas dessiner le mauvais produit.

## PF.I04 — Strategic direction candidate
Type : DECISION/PROVISIONAL

Une ou plusieurs directions sélectionnées à G4.

## PF.I05 — Market/evidence sufficiency
Type : VERIFY

L’evidence doit être suffisante pour cette Decision Question, pas exhaustive.

---

# 2. D08 PREVIEW — Concept Journey

## PF.D08.A01 — Primary journey concept
Type : ANALYSIS

2b2c propose le parcours macro à partir de target + objective + conversion + benchmark.

Exemple :
`arrivée → compréhension → preuve → comparaison/offre → rassurance → prise de contact`.

Résolution : IA/UX-first ; utilisateur corrige seulement si le vrai service/offline flow diffère.

## PF.D08.S01 — Concept journey artifact
Type : SPEC `FOR_DECISION`

Inclut :
- entry points principaux ;
- étapes macro ;
- preuve/rassurance ;
- primary CTA ;
- fallback ;
- dépendances offline si significatives.

Validation humaine : recommandée uniquement si le parcours implique un processus interne non observable.

---

# 3. D09 PREVIEW — Concept Sitemap / Page Model

## PF.D09.A01 — Common market structure synthesis
Type : ANALYSIS

À partir de concurrents/références, 2b2c peut repérer :
- pages communes ;
- patterns de navigation ;
- profondeur ;
- pages de preuve ;
- pages de conversion ;
- contenus récurrents ;
- patterns à éviter.

Important : fréquence ≠ recommandation automatique.

## PF.D09.A02 — Project-specific structure synthesis
Type : ANALYSIS

Combine :
- marché ;
- objectif ;
- audience ;
- offer hierarchy ;
- journey ;
- SEO opportunity ;
- contraintes ;
- challenge de simplification.

## PF.D09.S01 — Concept sitemap
Type : SPEC `FOR_DECISION`

Niveau attendu :
- surfaces/pages principales ;
- rôle ;
- audience dominante ;
- CTA principal ;
- relations/navigation macro.

Ce sitemap peut être `VALIDATED_CURRENT` ou `LOCKED_FOR_DECISION`, mais pas `FROZEN_FOR_BUILD`.

## PF.D09.V01 — Structural plausibility check
Type : VERIFY

Vérifier qu’aucune page n’existe uniquement parce que les concurrents l’ont ; chaque surface doit servir au moins un outcome/journey/content/search requirement.

---

# 4. D10 PREVIEW — Concept Content & Message

## PF.D10.A01 — Message hierarchy concept
Type : ANALYSIS

2b2c propose :
- promesse principale ;
- bénéfices ;
- preuves ;
- objections ;
- CTA language ;
- messages différenciants.

## PF.D10.S01 — Representative content blocks
Type : SPEC `FOR_DECISION`

Ce ne sont pas les textes finaux.

Peuvent inclure :
- hero concept ;
- proposition de valeur ;
- 3 bénéfices ;
- preuve type ;
- section offre ;
- CTA ;
- exemple FAQ.

But : rendre la direction tangible et testable.

Utilisateur requis seulement pour factual claims, tone preference critique ou promesse qu’il ne souhaite pas assumer.

---

# 5. D11 PREVIEW — Discoverability / SEO Opportunity

## PF.D11.A01 — Search opportunity probe
Type : ANALYSIS

Si SEO pertinent :
- grandes intentions ;
- thèmes ;
- concurrence SERP indicative ;
- opportunités locales ;
- risque de migration ;
- architecture SEO probable.

## PF.D11.S01 — SEO concept map
Type : SPEC `FOR_DECISION`

Pas de meta finale ; seulement les implications structurantes pour le sitemap/contenu.

---

# 6. D12 PREVIEW — Concept Capabilities / Features

## PF.D12.A01 — Capability extraction
Type : ANALYSIS

Sources :
- objectif ;
- journey ;
- concurrents ;
- user need ;
- contraintes ;
- existing ;
- challenge.

## PF.D12.S01 — Concept capability set
Type : SPEC `FOR_DECISION`

Classer :
- `CORE_CONCEPT`
- `OPTIONAL_VALUE`
- `LATER`
- `NOT_RECOMMENDED`

Exemple site vitrine : formulaire, réservation, carte, portfolio, avis, CMS, simulateur, chat, compte client, etc.

Le fait qu’un concurrent dispose d’une fonction n’est jamais suffisant pour la recommander.

## PF.D12.V01 — Value/complexity check

Chaque capability conceptuelle doit avoir un objectif ou être explicitement exploratoire.

---

# 7. D15 PREVIEW — Visual Intent & High-Fidelity Concept

## PF.D15.I01 — Existing brand constraints
Acquisition : SRC/AUDIT.

## PF.D15.I02 — Visual preference / anti-preference
Acquisition : HUM si réellement utile.

Meilleure stratégie : plutôt que demander une longue liste d’adjectifs, 2b2c peut générer des territoires visuels et faire choisir/corriger.

## PF.D15.A01 — Visual territory generation
Type : ANALYSIS/RECOMMENDATION

2–3 territoires maximum selon besoin :
- rationale stratégique ;
- moodboard ;
- typographie candidate ;
- palette candidate ;
- traitement image ;
- densité/rythme ;
- motion intention ;
- anti-patterns.

## PF.D15.D01 — Preferred visual territory
Type : DECISION

Human preference / decision owner.

## PF.D15.S01 — High-fidelity concept mockups
Type : SPEC `FOR_DECISION`

Créer seulement les surfaces qui aident la décision, souvent :
- home/hero ;
- une section de preuve/offre ;
- un écran/page stratégique ;
- mobile représentatif.

Option : prototype cliquable ou démonstrateur HTML/Figma.

## PF.D15.V01 — Concept labeling
Type : VERIFY

Toute maquette doit indiquer clairement `CONCEPT / NOT FINAL SPEC` tant que le Project n’a pas approfondi D15.

---

# 8. D16–D18 PREVIEW — Feasibility & Constraints Envelope

## PF.D16.A01 — Feasibility envelope

Questions :
- une capability critique est-elle faisable ?
- existe-t-il une dépendance externe risquée ?
- une plateforme imposée crée-t-elle une limite ?
- CMS/data/auth nécessaires ?
- niveau de complexité macro ?

Sortie : `FEASIBILITY_ENVELOPE`, pas architecture finale.

## PF.D17.A01 — Regulatory/security red-flag probe

Seulement si contexte activé.

## PF.D18.A01 — Accessibility/performance constraints probe

Seulement les contraintes capables d’invalider le concept ou de modifier fortement design/tech.

---

# 9. D19 PREVIEW — Success Model

## PF.D19.S01 — Success model

Relie :
`objective → user behavior → conversion → measurement candidate`.

Pas besoin de stack analytics finale.

---

# 10. D21 — Business Case, Economics, Forecasts & Scenario Models

## D21.I01 — Baseline data
Sources : analytics, CRM, comptabilité, Search Console, utilisateur, documents.

## D21.I02 — Value per outcome
Ex. valeur moyenne d’un lead/vente/rendez-vous si connue.

Human/private source si non publique.

## D21.I03 — Current cost/problem impact
Temps perdu, leads perdus, coûts, friction, risque, opportunité manquée.

## D21.I04 — Cost envelope inputs
Scope conceptuel + delivery profile candidate + contraintes.

## D21.I05 — Timeline envelope inputs
Scope/dépendances/availability.

## D21.A01 — Baseline model
Distinguer observed vs estimated.

## D21.A02 — Scenario model
Au minimum si chiffrage réellement décisionnel :
- downside ;
- base ;
- upside.

## D21.A03 — Sensitivity analysis
Quels inputs changent le plus la conclusion ?

## D21.A04 — Market sizing
CONDITIONAL. Ne produire que si pertinent et suffisamment sourçable.

## D21.A05 — Cost/timeline estimate
Range + assumptions + uncertainty.

## D21.A06 — ROI/break-even model
CONDITIONAL. Interdit si inputs insuffisants.

## D21.S01 — Decision economics summary
Inclut :
- facts ;
- assumptions ;
- formulas ;
- ranges ;
- confidence ;
- scenario comparison ;
- what-could-change-this.

## D21.V01 — No fabricated precision
Toute valeur chiffrée doit être SOURCE_BACKED, CALCULATED ou clairement ESTIMATED.

## D21.V02 — Decision usefulness
Aucun chiffre n’est inclus uniquement pour rendre la présentation “plus sérieuse”.

---

# 11. D22 — Decision Package, Presentation, Review & Approval

## D22.I01 — Audience of presentation
Solo / associés / direction / client / comité / investisseurs internes.

## D22.I02 — Decision sought
Ex. approuver la direction, budget, passage Project, choix entre options.

## D22.I03 — Time available
Calibre profondeur du deck.

## D22.I04 — Expected objections
À partir de gouvernance, risques et historique.

## D22.A01 — Narrative architecture
Adapter le récit à la Decision Question.

## D22.S01 — Executive Decision Memo
1–3 pages, lisible sans réunion.

## D22.S02 — Evidence Appendix
Sources, competitor details, calculations, assumptions.

## D22.S03 — Decision Deck
Format principal : `.pptx` éditable + `.pdf` fallback.

## D22.S04 — Speaker Notes
Arguments, nuances, sources et réponses aux objections.

## D22.S05 — Review Agenda
Décision attendue, points à challenger, temps prévu.

## D22.S06 — Feedback Capture Structure
Chaque retour est classé et relié au graphe.

## D22.S07 — Decision Record
Résultat final + conditions + change set + owner.

## D22.V01 — Deck traceability
Toute affirmation stratégique ou chiffrée importante a une source/assumption accessible.

## D22.V02 — Deck consistency
Le deck ne montre pas une version obsolète du sitemap, de la direction ou des chiffres.

## D22.V03 — Decision completeness
La présentation finit par une demande de décision explicite ; elle n’est pas une simple démonstration.

---

# 12. Narrative candidate du Decision Deck

Ordre adaptatif, non obligatoire :

1. Titre + décision demandée
2. Executive summary
3. Pourquoi maintenant / problème
4. Objectifs et critères de réussite
5. Audience / besoins
6. Ce que nous avons appris de l’existant
7. Marché / concurrence / alternatives
8. Opportunités et enseignements
9. Options explorées + trade-offs
10. Direction recommandée
11. Proposition de valeur / positionnement
12. Parcours + sitemap conceptuel
13. Macro-fonctionnalités / contenu
14. Visual direction / mockups / prototype
15. Faisabilité / contraintes
16. Chiffres / scenarios / coût / délai si pertinent
17. Risques / unknowns / what could change this
18. Décision demandée / prochaines actions

Appendices : sources, competitor matrix, calculations, technical probes, research details.

La deck réelle peut avoir 8, 12, 18 ou 25 slides selon le contexte ; ne pas remplir artificiellement.

---

# 13. Motion / PowerPoint Profile

But : présentation professionnelle, lisible, convaincante et editable.

Niveaux :

## `STATIC_PRO`

Mise en page, charts, diagrams, mockups, source notes, transitions discrètes.

## `MOTION_PRO`

Peut utiliser :
- Morph ;
- Fade ;
- Zoom de section/slide ;
- reveals séquentiels ;
- before/after ;
- transitions entre mockups ;
- animation de progression du journey.

Éviter : animations décoratives gratuites, mouvements continus, effets qui ralentissent la décision.

### Faisabilité technique

La génération d’un PPTX éditable est une capability distincte du moteur décisionnel. Le support complet de Morph/animations natives doit être validé dans un spike de rendering ; le Decision Package ne doit pas être bloqué si seulement le profil `STATIC_PRO` est disponible.

---

# 14. Review Feedback Objects

Chaque feedback reçoit :

- `id`
- `author`
- `timestamp`
- `type`
- `text`
- `target_atom/artifact`
- `materiality`
- `decision_owner`
- `proposed_resolution`
- `status`
- `change_impact`

Types : `NEW_INFO / CORRECTION / IDEA_PROPOSAL / CHANGE_REQUEST / ASSUMPTION_CHALLENGE / RISK / PREFERENCE / QUESTION / DECISION`.

Materiality :
- `COSMETIC`
- `LOCAL`
- `SUBSTANTIVE`
- `CRITICAL`

---

# 15. Review Resolution

## Cosmetic

Peut être appliqué sans réouvrir Strategy si aucune implication structurelle.

## Local

Réouvre uniquement artifacts dépendants.

## Substantive

Peut réouvrir prefiguration, scope macro, positionnement, projections ou evidence.

## Critical

Peut réouvrir cible, objectif, direction stratégique ou Blueprint.

### Outcome

- `APPROVE_TO_PROJECT`
- `APPROVE_WITH_CHANGES`
- `REVISE`
- `DEEPEN_RESEARCH`
- `PAUSE`
- `STOP`

`APPROVE_WITH_CHANGES` ne crée le Project qu’après application/acceptation du change set critique requis pour la baseline.

---

# 16. Promotion Idea → Project

Pour chaque artifact `FOR_DECISION` :

1. vérifier freshness ;
2. appliquer Review changes ;
3. classer : promote / deepen / stale / reject ;
4. créer Project baseline links vers la source Idea ;
5. conserver provenance et snapshot décisionnel.

Exemples :

- Concept sitemap très solide → import comme `ACCEPTED_CURRENT`, détailler routes/SEO plus tard.
- Hi-fi mockup apprécié → import visual direction + composants visibles comme evidence, mais ne pas en déduire automatiquement le Design System complet.
- Feature concept validé → import macro capability, puis détailler rules/states/data/integration en Project.

---

# 17. Questions réellement humaines dans Z4–Z5

2b2c doit éviter les questions dont il peut produire une proposition fiable.

Human-only / human-decision typiques :

- choisir entre deux directions stratégiques ;
- confirmer une priorité interne non publique ;
- budget hard cap / deadline imposée ;
- arbitrer un conflit de cible/offre ;
- choisir/corriger une préférence visuelle structurante ;
- accepter une hypothèse de projection sensible ;
- approuver le Decision Package ;
- traiter un désaccord de gouvernance ;
- décider `APPROVE/REVISE/PAUSE/STOP`.

AI-first typiques :

- identifier concurrents ;
- synthétiser leurs patterns ;
- proposer sitemap ;
- proposer parcours ;
- proposer macro features ;
- proposer message hierarchy ;
- proposer visual territories ;
- générer concept mockups ;
- produire feasibility envelope ;
- calculer scenarios à partir d’inputs ;
- assembler le deck ;
- générer graphiques/diagrammes ;
- résumer feedback et calculer impact.

L’utilisateur doit pouvoir corriger tout résultat AI-first, mais il n’a pas à valider atom par atom.
