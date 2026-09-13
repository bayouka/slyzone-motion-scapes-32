# 4b4c — SITE VITRINE MACHINE BLUEPRINT — SIMULATION 2026-09-13

Statut : **VALIDATION SUPPORT — NON CANONIQUE**

Scope testé : `BLUEPRINT_SITE_VITRINE_V0_1.yaml` + contexts + gates + requirement registries + deliverable contracts.

Objet : vérifier que l'exhaustivité interne produit peu d'interventions humaines, déclenche les bons travaux et ne force pas toutes les Gates à tous les projets.

---

## 1. Méthode

Pour chaque scénario, on distingue :

- `AUTO` — source/audit/web/calcul/IA résout sans question ;
- `OPTIONAL_CORRECTION` — affichable/corrigeable mais non bloquant ;
- `HUMAN_INTENT` — intention privée réellement nécessaire ;
- `HUMAN_PREFERENCE` — préférence structurante ;
- `HUMAN_DECISION` — arbitrage/approval ;
- `EXPERT` — uniquement si risque activé.

Une intervention humaine n'est comptée que si elle est matériellement nécessaire à ce moment.

---

# SCÉNARIO A — Nathalie, novice, refonte locale vague

Capture :

> « Je veux refaire le site de mon entreprise de plomberie, il fait vieux. »

Sources : URL du site actuel uniquement.

## Résolution automatique initiale

2b2c peut résoudre sans question :

- secteur = plomberie ;
- création/refonte = refonte ;
- site actuel + pages + offres affichées ;
- zone probable si adresse/service area visibles ;
- CTA/forms existants ;
- baseline contenu/brand/SEO observable ;
- concurrents locaux pertinents ;
- alternatives/références ;
- patterns de marché ;
- besoins probables : urgence, confiance, proximité, disponibilité, devis ;
- objections/trust patterns ;
- opportunités et faiblesses du site ;
- sitemap conceptuel ;
- capabilities candidates ;
- SEO/local concept ;
- premières visual territories ;
- feasibility envelope.

## Intervention humaine 1 — HUMAN_INTENT

Seulement parce que la capture ne permet pas de connaître l'intention future :

> « Pour cette refonte, votre priorité est surtout : obtenir plus de demandes/devis, mieux présenter vos prestations, renforcer la confiance, ou autre ? »

Si Nathalie choisit `plus de demandes/devis`, `SV.D02.PRIMARY_OBJECTIVE` devient `ACCEPTED_AS_CURRENT` et débloque la suite.

## Intervention humaine 2 — LIGHT_REVIEW seulement si nécessaire

Si le site présente 8 prestations mais que rien n'indique lesquelles l'entreprise veut développer :

> « J'ai identifié ces prestations comme centrales. Souhaitez-vous en mettre une davantage en avant ? »

Si aucune priorité commerciale particulière n'existe, 2b2c peut conserver une hiérarchie recommandée sans question supplémentaire.

## Intervention humaine 3 — HUMAN_DECISION

Après benchmark/challenge : choix de la direction à préfigurer uniquement si plusieurs options ont de vrais trade-offs.

Si une direction domine clairement, 2b2c recommande et demande une validation légère plutôt qu'un faux choix A/B.

## Intervention humaine 4 — HUMAN_PREFERENCE conditionnelle

Choix/correction d'un territoire visuel si `NEEDS_VISUAL_PREFIGURATION`.

Pas de questionnaire couleur/typo abstrait.

## Intervention humaine 5 — FORMAL_APPROVAL

Après Decision Package :

`APPROVE_TO_PROJECT / REVISE / PAUSE / STOP`.

## Project Definition

La majorité est produite automatiquement à partir de la baseline : journeys, page manifest, content requirements, SEO mapping, form states, responsive, accessibility baseline, platform recommendation, acceptance criteria.

Question supplémentaire seulement si :

- une règle interne non observable change le formulaire/service ;
- un budget/délai privé devient réellement bloquant ;
- un prestataire/outil est imposé ;
- un claim ou droit média ne peut pas être vérifié.

## Intervention finale — FORMAL_APPROVAL

`READY_FOR_DEVELOPMENT`.

### Résultat

Avant passage Project : typiquement **3 à 5 interventions**, dont seulement 1–2 sont de vraies questions d'information.

Cycle complet jusqu'à Build Ready : typiquement **4 à 7 interventions**, selon règles internes/contraintes privées.

Aucune liste de 80 questions n'est exposée.

Verdict : PASS.

---

# SCÉNARIO B — Vincent, brief riche B2B + documents + site + analytics

Entrées :

- brief détaillé ;
- site actuel ;
- présentation commerciale ;
- analytics/Search Console ;
- charte ;
- liste des offres ;
- objectif et cible explicitement formulés.

## Auto-resolution

Presque toute Z1/Z2 est résolue par RAW/SRC/CONN/AUDIT.

2b2c :

- ne redemande pas objectif/cible/offre ;
- audite l'existant ;
- recherche les concurrents ;
- challenge les hypothèses ;
- produit options ;
- préfigure direction recommandée ;
- génère concept sitemap/journey/capabilities ;
- construit le Decision Package.

## Human interventions

1. `LIGHT_REVIEW` si l'IA détecte une contradiction réellement stratégique dans les documents.
2. `HUMAN_DECISION` sur la direction si plusieurs options restent réellement crédibles.
3. `HUMAN_PREFERENCE` visuelle seulement si non déjà déterminée par la charte/brief.
4. `FORMAL_APPROVAL` Idea → Project.
5. `FORMAL_APPROVAL` Ready for Development.

### Résultat

Avec dossier cohérent : **2 à 4 interventions avant Project**, **3 à 5 sur tout le cycle**.

Aucune question artificielle pour « faire avancer une étape ».

Verdict : PASS.

---

# SCÉNARIO C — Comité, refonte SEO complexe, multilingue, CRM/booking critique

Contexts activés :

- `IS_REDESIGN`
- `HAS_EXISTING_SITE`
- `HAS_TEAM_DECISION`
- `NEEDS_PRESENTATION`
- `IS_MULTILINGUAL`
- `SEO_MIGRATION_RISK`
- `HAS_CRITICAL_INTEGRATION`
- `HAS_PERSONAL_DATA`

## Travaux automatiques supplémentaires

- crawl complet ;
- Search Console / analytics ;
- critical URLs ;
- redirect/migration analysis ;
- competitor/reference research par marché ;
- locale model ;
- translation workflow requirements ;
- CRM/booking contract inspection ;
- failure/fallback analysis ;
- privacy/processors ;
- committee-grade Decision Package ;
- presentation freshness ;
- targeted QA plan.

## Interventions humaines réellement légitimes

1. identifier/valider `Decision Owner` et méthode de décision ;
2. confirmer éventuels objectifs internes contradictoires ;
3. trancher priorité de marchés/langues si stratégique ;
4. arbitrer direction/scope/budget si trade-off ;
5. accepter un risque ou condition si nécessaire ;
6. review de présentation + decision formelle ;
7. règles internes CRM/process si non documentées ;
8. Ready-for-Development approval.

Expert signoff peut s'ajouter si données/régulation le déclenchent ; il ne devient pas une question novice.

### Résultat

La complexité augmente le **travail du système et des experts**, pas mécaniquement le nombre de champs utilisateur.

Verdict : PASS.

---

# SCÉNARIO D — Idée faible à arrêter tôt

Capture : site coûteux envisagé mais besoin/business case incohérent ; evidence montre que le problème principal ne nécessite probablement pas une refonte complète.

## Auto work

- objectif/problem ;
- audit existant ;
- market context suffisant ;
- challenge ;
- solution plus simple ;
- risque/coût disproportionné.

G2 peut rendre une décision STOP/PAUSE suffisamment étayée avant Z4.

## Human interventions

1. une clarification d'intention uniquement si indispensable ;
2. `HUMAN_DECISION` : accepter simplification / deepen / pause / stop.

Pas de sitemap détaillé, maquettes, PowerPoint de 25 slides, Project Definition ou architecture technique inutile.

### Résultat

**1–2 interventions humaines**.

Verdict : PASS.

---

# 2. Questions que le système ne doit normalement PAS poser

Pour un site vitrine, ne pas demander par défaut :

- « Qui sont vos concurrents ? » si recherche publique possible ;
- « Quelles pages faut-il ? » ;
- « Quel sitemap voulez-vous ? » ;
- « Quelles bonnes pratiques utiliser ? » ;
- « Quelles fonctionnalités faudrait-il ? » ;
- « Quels sont les besoins probables de vos visiteurs ? » ;
- « Quel SEO faut-il ? » ;
- « Quels états loading/error prévoir ? » ;
- « Quelle architecture technique choisir ? » ;
- « Quels tests faut-il ? ».

2b2c doit proposer/résoudre ces sujets et exposer ses hypothèses/raisons.

---

# 3. Questions réellement human-only les plus fréquentes

1. Quel résultat futur l'organisation veut-elle réellement prioriser si cela n'est pas déductible ?
2. Quelle cible/offre veut-elle volontairement privilégier si le futur diffère de l'existant ?
3. Existe-t-il une contrainte privée dure : budget, délai, contrat, politique interne ?
4. Une règle métier interne non documentée modifie-t-elle le comportement ?
5. Quelle préférence visuelle/brand choisir parmi des propositions réellement équivalentes ?
6. Quel trade-off stratégique l'owner accepte-t-il ?
7. Accepte-t-il le risque/unknown restant ?
8. Approuve-t-il le passage Idea → Project ?
9. Approuve-t-il Ready for Development ?

Ces catégories peuvent produire plusieurs événements dans un projet complexe, mais elles constituent un ensemble beaucoup plus petit que le référentiel interne.

---

# 4. Défauts détectés par la simulation

## SIM-GAP-01 — G1 `SOURCE_BACKED` trop strict pour `ORG_CONTEXT`

Une idée de création sans source externe peut être parfaitement exploitable à partir de RAW humain.

Correction recommandée : accepter `RAW_HUMAN` ou `SOURCE_BACKED` à G1.

## SIM-GAP-02 — Visual preference ne doit pas être obligatoire pour créer une maquette

2b2c peut générer une direction visuelle recommandée sans demander une préférence préalable ; l'humain intervient seulement si la préférence devient décisionnelle.

Le requirement actuel respecte globalement cela grâce à l'activation conditionnelle, mais la règle doit être explicitée dans le Blueprint Overlay.

## SIM-GAP-03 — `READY_FOR_DEVELOPMENT` owner peut différer de l'Idea Decision Owner

Dans une agence/client, l'owner produit/tech autorisé peut être différent du sponsor initial.

Le modèle Authority doit autoriser `BUILD_READY_OWNER` distinct de `IDEA_DECISION_OWNER`.

## SIM-GAP-04 — Human-intervention count ne doit jamais devenir un KPI optimisé aveuglément

Le but est de supprimer les questions inutiles, pas de sous-questionner un projet risqué.

Aucun hard cap global ne doit être introduit.

---

# 5. Verdict

Le machine Blueprint V0.1 démontre la logique recherchée :

> **un référentiel très complet peut conduire à très peu de questions utilisateur si le moteur sait extraire, auditer, rechercher, calculer, recommander et différer correctement.**

Les quatre gaps sont locaux et ne remettent pas en cause l'architecture.

Recommandation : corriger SIM-GAP-01 et formaliser les rôles d'approbation Idea/Build, puis effectuer une validation syntaxique/référentielle automatisée des YAML avant toute promotion.