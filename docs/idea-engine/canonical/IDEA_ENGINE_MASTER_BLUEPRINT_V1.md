# 4b4c — IDEA ENGINE MASTER BLUEPRINT — V1.1

## 0. Statut, autorité et portée

Ce document est **canonique et normatif** pour l’architecture produit du moteur Idea de 4b4c.

Il définit ce que nous construisons avant de continuer à dessiner les écrans : modèle informationnel, sorties attendues, Requirements, Readiness, capacités de 2b2c et sélection de la Next Best Action.

Périmètre :

> Idea → compréhension / enrichissement → proposition candidate → décision → éventuellement Project Draft.

Le Blueprint de validation courant est le **site vitrine / marketing website**.

Les mécanismes du moteur peuvent être génériques, mais la couverture informationnelle n’est pas déclarée universelle pour tous les types de projet.

### Autorité relative

- ce Master Blueprint est l’autorité principale pour l’orchestration du moteur, les Output Contracts, les Requirements, la Readiness et la Next Best Action ;
- `INFORMATION_MATRIX_V5_OUTPUT_DRIVEN.md` est le registre informationnel canonique actuel du Blueprint Site vitrine ;
- `INFORMATION_MATRIX_V4_1.md` est historique/supersédée ;
- `WORKFLOW_V7_1_CONSOLIDATED.md` reste une source riche pour les mécanismes détaillés, mais toute lecture linéaire de sa chaîne d’états est supersédée par ce document ;
- `CAPTURE_INGESTION_MEMORY_CONTRACT_V1_2.md` est l’autorité spécifique pour la capture, la persistance, l’ingestion et l’entrée dans le workspace ;
- les UX snapshots validés fixent une forme fonctionnelle approuvée, pas l’orchestration globale.

En cas de contradiction sur l’ordre du travail, la readiness ou la nécessité d’une étape, **Master Blueprint V1.1 + Matrix V5 prévalent**.

---

## 1. Définition du produit

4b4c n’est ni :

- un questionnaire de cadrage ;
- un wizard `Étape 1 → Étape 2 → ...` ;
- un chatbot qui improvise un projet ;
- un générateur automatique de GO ;
- un outil de gestion de projet avant qu’un projet existe réellement.

4b4c est :

> **un espace de travail assisté par 2b2c qui transforme progressivement une idée imparfaite en une proposition comprise, challengée, étayée et suffisamment concrète pour qu’une personne ou une équipe puisse décider intelligemment de la lancer, la modifier, l’approfondir, la mettre en pause ou l’abandonner.**

L’objet canonique avant GO est :

> **Idea Decision Dossier — IDD**

Il s’agit d’un dossier vivant, structuré, versionné et sourcé. L’utilisateur ne le remplit jamais comme un formulaire géant.

Après une décision explicite `Lancer`, 4b4c peut créer un **Project Draft** séparé.

---

## 2. Frontière stricte Idea / Project

### Dans Idea

On peut travailler sur :

- problème / opportunité ;
- contexte ;
- objectifs ;
- utilisateurs ;
- offre / valeur ;
- existant ;
- concurrence et références ;
- diagnostic ;
- alternatives ;
- proposition ;
- fonctionnalités candidates ;
- structure / contenu ;
- scope V1 / plus tard / non recommandé ;
- concept visuel si utile ;
- faisabilité générale ;
- scénarios de coût/délai si une décision les exige ;
- risques ;
- contraintes ;
- critères de décision ;
- présentation / atelier si nécessaire.

### Dans Project Draft, après GO seulement

On peut engager :

- architecture technique finale ;
- responsables d’exécution ;
- backlog / tâches opérationnelles ;
- planning de delivery ;
- jalons contractuels ;
- affectations ;
- plan de déploiement ;
- suivi d’exécution.

Une information d’exécution peut être estimée avant GO uniquement si une Decision Requirement l’exige pour décider honnêtement. Elle reste alors un scénario/estimation, pas un engagement opérationnel.

---

## 3. Blueprint Resolver — ne jamais simuler une couverture que nous n’avons pas

Avant d’appliquer une matrice spécialisée, le moteur doit savoir quel Blueprint il utilise.

Pour la phase actuelle :

- `SITE_VITRINE` = Blueprint de référence couvert par Matrix V5 ;
- une idée qui évolue vers un autre type substantiel (`application complexe`, `marketplace`, `jeu`, etc.) doit être marquée comme `BLUEPRINT_MISMATCH` ou reclassifiée vers un Blueprint réellement disponible ;
- le système ne doit jamais continuer comme si Matrix Site vitrine couvrait correctement un type de projet différent.

Un changement critique de nature de projet peut donc déclencher une reclassification du Blueprint, sans perdre l’historique de l’Idea.

---

## 4. Les six couches canoniques du moteur

### Couche 1 — Information Blueprint

Définit tout ce que 4b4c peut avoir besoin de connaître pour produire une sortie ou éclairer une décision.

Pour le Site vitrine : `INFORMATION_MATRIX_V5_OUTPUT_DRIVEN.md`.

### Couche 2 — Sources, mémoire et provenance

Conserve ce qui a été dit, extrait, recherché, calculé, inféré, recommandé, accepté, rejeté ou supersédé.

La mémoire structurée ne remplace jamais les sources originales.

### Couche 3 — Output Contracts

Définit ce que 4b4c doit être capable de produire et les exigences réelles de chaque sortie.

### Couche 4 — Dependency & Readiness Graph

Relie :

`information → requirement → output → décision`.

Il détermine ce qui est suffisant, partiel, bloquant, conflictuel, périmé ou acceptable comme inconnu.

### Couche 5 — Acquisition & Action Engine

Détermine comment résoudre un manque : mémoire, extraction, recherche, calcul, inférence, challenge, proposition ou question humaine.

### Couche 6 — UX Projection

Ne montre que ce qui est utile maintenant : état lisible du dossier, résultat du travail de 2b2c et éventuelle action humaine pertinente.

**L’UX ne détermine pas le workflow. Elle projette l’état du moteur.**

---

## 5. Le « formulaire complet » existe en interne, jamais comme formulaire visible

Le besoin d’exhaustivité est porté par le moteur.

L’IDD peut contenir notamment :

1. identité / contexte ;
2. problème / opportunité / déclencheur ;
3. objectifs et résultats ;
4. utilisateurs / audiences ;
5. offre / proposition de valeur ;
6. existant / actifs / contenu ;
7. concurrence / alternatives / références ;
8. preuves / evidence ;
9. fonctionnalités ;
10. expérience / parcours ;
11. structure ;
12. contenu ;
13. marque / design / préférences / rejets ;
14. contraintes ;
15. faisabilité ;
16. impact économique lorsque défendable ;
17. risques / contradictions / inconnues ;
18. scope ;
19. gouvernance / décideurs ;
20. Decision Requirements ;
21. collaboration / présentation / atelier ;
22. candidates, recommandations, décisions et historique.

Un utilisateur peut fournir une information de n’importe quel domaine à n’importe quel moment. Elle est classée immédiatement sans forcer l’interface à afficher ce domaine.

---

## 6. Contrat d’un Information Item

Toute information exploitable doit pouvoir conserver au minimum :

- `information_key` ;
- `domain` ;
- `value` ;
- `type` : `FACT / PREFERENCE / CONSTRAINT / ASSUMPTION / OPTION / EVIDENCE / RISK / QUESTION / DECISION / ...` ;
- `state` : `PROPOSED / CURRENT / ACCEPTED_AS_CURRENT / CONFIRMED / FROZEN_IN_SNAPSHOT / SUPERSEDED / REJECTED / REVIEW_REQUIRED / ACCEPTED_UNKNOWN / ...` ;
- `provenance` : `HUMAN_DECLARED / HUMAN_GUIDED_ANSWER / SOURCE_EXTRACTED / WEB_RESEARCH / SYSTEM_CALCULATED / AI_INFERRED / AI_RECOMMENDED` ;
- `source_ref` ;
- version d’origine ;
- scope/contexte ;
- confiance lorsque pertinente ;
- fraîcheur lorsque pertinente ;
- groupe de conflit éventuel ;
- relations de supersession ;
- timestamps utiles.

Une provenance IA ne devient jamais implicitement une vérité humaine.

---

## 7. Source Model

Les sources incluent au minimum :

- texte libre utilisateur ;
- réponse guidée ;
- correction utilisateur ;
- lien ;
- image ;
- document ;
- site existant ;
- recherche publique ;
- donnée connectée ;
- calcul système ;
- observation IA dérivée d’une source.

Une source conserve : identité, type, rôle déclaré ou inféré, note humaine éventuelle, version/fraîcheur, état d’analyse, droits/accès lorsque nécessaire.

Une note explicite de l’utilisateur sur une source prime sur une classification IA silencieuse.

---

## 8. Output Contracts canoniques

Les identifiants `O1…O9` sont **des identifiants de contrats, pas des étapes ni un ordre d’exécution**.

Plusieurs Outputs peuvent progresser en parallèle ; certains peuvent rester `NOT_RELEVANT`.

### O1 — Understanding Model

But : comprendre suffisamment l’Idée pour orienter correctement le travail.

Couvre généralement : ce qui est envisagé, pourquoi, pour qui, contexte essentiel, contraintes critiques connues.

Ne nécessite pas design final, contenu final, scope complet ou recherche exhaustive.

### O2 — Evidence & Diagnostic Pack

But : distinguer faits, observations, interprétations, forces, faiblesses, opportunités, risques et contradictions utiles.

La profondeur dépend du cas. La recherche s’arrête lorsque le gain marginal attendu devient faible.

### O3 — Candidate Directions

But : produire zéro, une ou plusieurs directions justifiées.

Sorties valides : convergence unique, vrai compromis, plusieurs hypothèses ou informations insuffisantes.

### O4 — Candidate Proposition

But : rendre une direction suffisamment concrète pour être jugée.

Pour un site vitrine : positionnement, message, conversion, parcours, structure, pages, fonctionnalités, contenus et scope.

Une Candidate est versionnée ; V1 n’est jamais réécrite silencieusement en V2.

### O5 — Scope & Structure

But : rendre visible ce qui est envisagé.

Buckets : `Première version / Peut attendre / Non recommandé actuellement`.

Chaque fonctionnalité importante relie besoin, utilisateur, valeur, complexité, dépendances et alternative plus simple éventuelle.

### O6 — Concept Projection

But : aider à juger, pas produire le design final.

Peut être `NOT_RELEVANT`.

Profondeur : aucune / aperçu rapide / concept poussé selon valeur décisionnelle.

### O7 — Decision Brief

But : permettre une décision honnête.

Rassemble selon les Decision Requirements : Candidate, evidence, assumptions, alternatives, scope, risques, contradictions, unknowns acceptés, faisabilité nécessaire, positions équipe, recommandation 2b2c et Decision Question.

### O8 — Presentation / Workshop Pack

But : préparer d’autres personnes à juger ou contribuer.

Peut être `NOT_RELEVANT` pour décision solo.

Réutilise l’IDD et le Decision Brief, pas un dossier parallèle.

### O9 — Project Draft Handoff

But : transférer proprement l’Idée après GO explicite.

Transférer faits actifs, assumptions actives, contraintes, scope, structure, evidence pertinente, risques, questions ouvertes, assets, décisions et Candidate finale.

Historique obsolète/rejeté reste historique.

---

## 9. Requirement Model — remplacer « obligatoire / facultatif »

Une information n’est jamais obligatoire en absolu.

Elle est :

> **requise pour une sortie, une décision ou une conséquence donnée dans le contexte actuel.**

Chaque Requirement doit pouvoir connaître :

- output(s) concerné(s) ;
- Decision Requirement concernée ;
- information keys possibles ;
- validation minimum ;
- possibilité d’hypothèse ;
- possibilité d’unknown accepté ;
- fraîcheur ;
- caractère bloquant ;
- voies de résolution ;
- dépendances.

Exemple : la couleur préférée peut être `NOT_RELEVANT` pour O1, utile pour O6 et non bloquante pour O7.

---

## 10. États de résolution des Requirements

Utiliser au minimum :

- `SATISFIED` ;
- `PARTIAL` ;
- `BLOCKING` ;
- `UNKNOWN_ACCEPTABLE` ;
- `CONFLICTED` ;
- `STALE` ;
- `NOT_RELEVANT`.

Ces états sont relatifs au Requirement, pas à la valeur absolue de l’information.

---

## 11. Output Readiness

Chaque sortie possède sa readiness indépendante :

- `NOT_RELEVANT` ;
- `NOT_READY` ;
- `READY_WITH_ACCEPTED_UNKNOWNS` ;
- `READY` ;
- `STALE`.

Il n’existe pas de pourcentage global « projet complété à X % ».

Le moteur peut simultanément avoir O1 READY, O2 READY, O3 NOT_READY, O6 NOT_RELEVANT et O7 NOT_READY.

---

## 12. Decision Requirements — ce qui définit réellement « assez »

Avant de conclure qu’une Idée est prête à être décidée, 2b2c détermine ce dont les vrais décideurs ont besoin.

Exemples : concept, projection, budget, faisabilité, validation juridique, comparaison, avis associé, inconnue explicitement acceptée.

Deux Ideas similaires peuvent donc avoir une readiness différente.

Le produit n’active que les Decision Requirements pertinentes.

---

## 13. Acquisition Engine — ordre avant question humaine

Pour tout Requirement non résolu :

1. mémoire active ;
2. sources déjà fournies ;
3. recherche publique / source externe autorisée ;
4. calcul/dérivation déterministe ;
5. inférence/hypothèse IA explicitement étiquetée ;
6. question humaine si seul l’humain peut savoir/corriger/décider ;
7. accepted unknown / différé si légitime.

Une question humaine est interdite si une voie autonome fiable résout le Requirement à coût raisonnable.

Une recherche est interdite sans lien plausible avec une sortie ou décision actuelle.

---

## 14. Catalogue des capacités 2b2c

2b2c peut notamment :

`EXTRACT / CLASSIFY / SUMMARIZE / RESEARCH / CALCULATE / INFER_HYPOTHESIS / ASK_HUMAN / RESCUE_UNKNOWN / RESOLVE_CONFLICT / CHALLENGE / SIMPLIFY / ENRICH / COMPARE / GENERATE_CANDIDATE / RECOMMEND / MATERIALIZE / PREPARE_DECISION / PREPARE_PRESENTATION / REASSESS_DELTA`.

`Améliorer`, `Challenger`, `Analyser la concurrence` ou `Faire une recherche` sont des capacités, pas des étapes fixes.

---

## 15. Deux files d’action distinctes : système et humain

### SYSTEM_NEXT_ACTIONS

Actions autonomes : extraction, recherche autorisée, calcul, analyse, génération, comparaison, etc.

Plusieurs actions indépendantes peuvent s’exécuter en parallèle.

### USER_NEXT_ACTION

Une seule action humaine dominante est mise en avant lorsque l’humain est réellement nécessaire.

L’utilisateur n’a pas à cliquer `Faire la recherche` pour autoriser un travail public, réversible et déjà justifié.

Demander une autorisation seulement lorsqu’elle est réellement requise : accès privé, coût externe, conséquence sensible/irréversible, connexion ou décision engageante.

---

## 16. Active Output Targets — quel horizon travaille-t-on maintenant ?

Le moteur dérive un ensemble `ACTIVE_OUTPUT_TARGETS` à partir de :

- l’état du dossier ;
- la demande explicite de l’utilisateur ;
- les Decision Requirements ;
- les outputs déjà prêts ;
- les outputs `NOT_RELEVANT`.

Une demande explicite de l’utilisateur comme `je veux voir une maquette maintenant` peut activer O6, mais ne doit pas contourner un blocker critique qui rendrait la projection trompeuse.

L’utilisateur peut changer d’objectif sans « revenir à une étape ».

---

## 17. Algorithme conceptuel de Next Best Action

### A — déterminer ACTIVE_OUTPUT_TARGETS

Comprendre, explorer, former une Candidate, préparer une décision, présenter, etc.

### B — calculer Requirements non résolus

Satisfaits, partiels, conflictuels, stale, bloquants, unknown acceptables.

### C — générer Action Candidates

Extraction, recherche, calcul, hypothèse, challenge, question, génération, acceptation d’inconnu.

### D — exclusions dures

Éliminer : question redondante, recherche sans impact, inférence présentée comme fait, sortie masquant un blocker critique, action obsolète, pseudo-étape artificielle.

### E — prioriser

1. intégrité / conflit critique / stale-safety ;
2. blocker d’une décision réellement demandée ;
3. blocker d’un output actif ;
4. action autonome à fort gain d’information ;
5. action humaine à fort gain ;
6. amélioration substantielle ;
7. enrichissement facultatif.

À égalité, préférer : moins d’effort humain, plus de gain d’information, plus d’impact décisionnel, plus de réversibilité, moins de coût/latence, meilleure traçabilité.

### F — exécuter / afficher

Les actions système peuvent s’exécuter ; une seule action humaine dominante est mise en avant.

---

## 18. Le moteur n’avance pas « à l’étape suivante »

Après toute nouvelle information :

1. enregistrer la source ;
2. mettre à jour les memory items concernés ;
3. déterminer les dépendances impactées ;
4. recalculer les Requirements affectés ;
5. recalculer les Output Readiness affectées ;
6. recalculer System Next Actions ;
7. recalculer l’éventuelle User Next Action.

Question canonique :

> **« Qu’est-ce que cette nouvelle information change ? »**

Pas :

> « Quelle est l’étape suivante ? »

---

## 19. Challenge / amélioration

Le challenge se déclenche si, par exemple :

- solution disproportionnée ;
- fonctions sans objectif ;
- alternative plus simple équivalente ;
- contradiction avec contrainte ;
- evidence affaiblissant une hypothèse ;
- risque majeur ignoré ;
- différenciation insuffisante lorsque décisionnelle.

Structure : `observation → conséquence → alternative/question → impact potentiel`.

Ne jamais challenger pour créer artificiellement de la complexité.

---

## 20. Research Planner

Toute recherche répond à :

> **« Quelle décision, hypothèse ou sortie cette recherche peut-elle modifier ? »**

Sinon : ne pas rechercher.

La recherche peut concerner concurrents, alternatives, marché, réglementation, SEO, références, faisabilité, tendances ou standards.

Elle produit des observations sourcées, jamais des vérités internes sans preuve.

Arrêt lorsque le gain marginal attendu devient faible.

---

## 21. Recommendation Contract

Toute recommandation structurante conserve : recommandation, objectif, evidence, assumptions, critères, alternatives, trade-offs, risques, confiance et ce qui pourrait changer la recommandation.

Confiance utilisateur :

- Bien étayé ;
- Raisonnable mais à confirmer ;
- Hypothèse de travail ;
- Informations insuffisantes.

Aucun faux pourcentage.

---

## 22. Capture → workspace

### Pré-analyse opportuniste

Après persistance RAW FIRST, 2b2c peut préparer une première compréhension avant le CTA final.

Déclencheurs : pause stable, fin de réponse guidée, upload terminé, source analysable, etc.

Jamais un appel LLM à chaque frappe.

Toute pré-analyse est versionnée et stale-safe.

### `Commencer avec 2b2c`

Au clic : flush, sécurisation uploads, snapshot, réutilisation des analyses valides, analyse delta si nécessaire, ouverture directe du workspace sur **le premier état utile**.

Pas de page obligatoire `2b2c analyse…`.

Si la compréhension minimale n’est pas encore disponible, rester brièvement sur la capture avec un état léger puis ouvrir automatiquement.

Les analyses lourdes continuent éventuellement en arrière-plan.

### Si 2b2c a aidé à rédiger le brief

Ne pas relire immédiatement ce texte comme une étape.

Apporter une nouvelle valeur : NBA, contradiction, recommandation, travail autonome ou première direction.

La compréhension détaillée reste consultable/corrigeable.

---

## 23. UX Projection — règles, pas écrans figés

L’espace Idée doit pouvoir exprimer :

- `2b2c recommande maintenant` ;
- vraies informations `Acquis pour l’instant` ;
- `À examiner maintenant` ;
- `Peut attendre` ;
- ce que 2b2c sait et ses sources ;
- composer naturel permanent ;
- historique/version si pertinent.

Ne pas créer une page uniquement pour dire que l’analyse est en cours, répéter le texte que 2b2c vient d’écrire, obliger à confirmer l’évident ou matérialiser un état interne sans valeur utilisateur.

---

## 24. Gestion des sources après capture

Le workspace peut montrer lorsque pertinent : ce qui a été exploité, ce qui reste à analyser, rôle compris, note utilisateur, observations, conflits et fraîcheur.

Exemple : `Deck 2023 → 70 % B2B` vs `Utilisateur 2026 → surtout particuliers`.

2b2c ne choisit pas silencieusement ; le Requirement devient `CONFLICTED` si le conflit affecte un output actif.

---

## 25. Change Intelligence

Tout changement est classé selon son impact : cosmétique, contextuel, substantiel, critique.

Conserver ce qui reste valable, superséder ce qui ne l’est plus, recalculer seulement les outputs/recherches/décisions affectés.

Un changement de couleur ne rouvre pas l’audience ; B2C→B2B peut rouvrir positionnement, parcours, contenu, scope et evidence.

---

## 26. Présentation et atelier

La présentation est une vue du même IDD, pas un questionnaire/dossier parallèle.

Elle réutilise compréhension, diagnostic, Candidate, alternatives, scope, projection si utile, risques, inconnues, recommandation et Decision Question.

L’atelier structure les contributions comme objets versionnés.

Présentation et atelier peuvent être `NOT_RELEVANT`.

---

## 27. Matrice informationnelle courante

La migration prévue depuis l’ancien modèle `B0→B4` est **réalisée**.

La matrice courante est :

> `INFORMATION_MATRIX_V5_OUTPUT_DRIVEN.md`

Elle définit le « formulaire complet interne » du Blueprint Site vitrine via :

- information keys ;
- Output dependencies O1→O9 ;
- Activation Contexts ;
- acquisition paths ;
- Requirement rules ;
- Human-only / inference-safe ;
- accepted unknown ;
- readiness par output.

`INFORMATION_MATRIX_V4_1.md` reste historique et ne doit plus guider une implémentation nouvelle.

---

## 28. Workflow V7.1 — statut

Ses mécanismes restent valables lorsqu’ils ne contredisent pas ce document : mémoire, provenance, Answer Resolver, Evidence Model, Research Planner, Recommendation Contract, Change Intelligence, Candidate snapshots, collaboration, Decision Brief, GO/REVISE/PAUSE/STOP.

La chaîne :

`CAPTURED → UNDERSTOOD → DISCOVERING → ...`

n’est plus une machine à états linéaire d’orchestration.

L’orchestration canonique repose sur :

> **Output Contracts + Requirements + independent Readiness + Next Best Action.**

---

## 29. Cas de référence obligatoires

### Nathalie — novice

Peu d’informations ; accompagnement simple ; Rescue Path ; minimum de questions ; 2b2c fait le maximum.

### Vincent — brief riche + sources

Extraction massive ; aucune répétition ; actions autonomes parallèles ; Candidate rapide si readiness suffisante.

### Maya — équipe / désaccord

Gouvernance activée seulement lorsqu’elle devient pertinente ; contradictions et positions conservées ; présentation/atelier si utile.

### Mauvaise idée

Challenge, simplification ou Stop ; aucun biais GO.

### Source contradictoire

Conflit explicite ; aucune fusion silencieuse.

### Changement radical tardif

Réévaluation ciblée ; historique conservé ; possible reclassification Blueprint.

### Idée excellente déjà cadrée

Quasiment aucune question ; 2b2c produit directement ce qui est prêt.

---

## 30. QA du moteur

Une implémentation n’est pas acceptable si :

1. elle nécessite un ordre fixe des domaines ;
2. elle repose une information déjà fournie ;
3. elle demande à l’utilisateur d’autoriser chaque recherche routinière ;
4. elle recherche sans question décisionnelle ;
5. elle transforme une hypothèse IA en fait ;
6. elle impose projection/présentation inutile ;
7. elle calcule une readiness globale arbitraire ;
8. elle masque un conflit critique ;
9. elle recommence tout après un changement local ;
10. elle crée du Project avant GO ;
11. elle favorise GO ;
12. elle dépend du LLM pour persistance/règles déterministes critiques ;
13. elle applique Matrix Site vitrine à un projet reclassifié sans Blueprint compatible.

---

## 31. Méthode de conception à partir de maintenant

Avant tout nouveau prototype Idea workspace :

1. choisir la situation à simuler ;
2. identifier ACTIVE_OUTPUT_TARGETS ;
3. dériver Requirements depuis Matrix V5 ;
4. simuler mémoire/sources ;
5. laisser Acquisition Engine + NBA déterminer le travail ;
6. seulement ensuite projeter dans une interface ;
7. red-teamer avec plusieurs profils et changements tardifs.

Il est interdit de décider d’abord quel écran vient après quel écran puis d’inventer la logique pour le justifier.

---

## 32. Résumé canonique

```text
IDEA / SOURCES / REPONSES
        ↓
PERSISTENCE + IDEA DECISION DOSSIER
        ↓
BLUEPRINT RESOLVER
        ↓
INFORMATION MATRIX
        ↓
ACTIVE OUTPUT TARGETS
        ↓
REQUIREMENTS
        ↓
READINESS PAR OUTPUT
        ↓
SYSTEM ACTIONS AUTONOMES
        ↓
EVENTUELLE USER NEXT ACTION
        ↓
NOUVELLE INFORMATION
        ↓
RECALCUL CIBLE DES DEPENDANCES
        ↺
```

L’utilisateur ne remplit pas le moteur.

**2b2c construit le dossier avec ce qu’il peut trouver, comprendre, calculer, rechercher et proposer, puis sollicite l’humain uniquement lorsque l’humain est réellement nécessaire.**
