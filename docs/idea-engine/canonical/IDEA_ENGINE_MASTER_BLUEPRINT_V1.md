# 4b4c — IDEA ENGINE MASTER BLUEPRINT — V1.0

## 0. Statut, autorité et portée

Ce document est **canonique et normatif** pour l’architecture produit du moteur Idea de 4b4c.

Il définit **ce que nous construisons avant de continuer à dessiner les écrans** : le modèle informationnel, les sorties attendues, les dépendances, les règles de readiness, les capacités de 2b2c et la sélection de la Next Best Action.

Il s’applique au périmètre :

> Idea → compréhension / enrichissement → proposition candidate → décision → éventuellement Project Draft.

Le Blueprint de validation actuel reste le **site vitrine / marketing website**. Les mécanismes généraux du moteur peuvent être réutilisables, mais la couverture informationnelle n’est pas encore déclarée universelle pour tous les types de projet.

### Autorité relative

- ce Master Blueprint est l’autorité principale pour **l’orchestration du moteur, les Output Contracts, la readiness et la Next Best Action** ;
- `INFORMATION_MATRIX_V4_1.md` reste le registre de référence des informations du Blueprint Site vitrine ;
- `WORKFLOW_V7_1_CONSOLIDATED.md` reste une source riche pour les mécanismes produit détaillés, mais toute lecture impliquant une séquence rigide d’états doit être interprétée à la lumière du présent document ;
- `CAPTURE_INGESTION_MEMORY_CONTRACT_*` reste l’autorité spécifique pour la capture, la persistance, l’ingestion et la mémoire initiale ;
- les UX snapshots validés décrivent une forme fonctionnelle approuvée, pas la logique globale du moteur.

En cas de contradiction explicite sur l’ordre du travail, la readiness ou la nécessité d’une étape, **ce Master Blueprint prévaut**.

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

L’objet canonique avant GO est appelé dans ce document :

> **Idea Decision Dossier — IDD**

Il s’agit d’un dossier vivant, structuré, versionné et sourcé. L’utilisateur ne le remplit jamais comme un formulaire géant.

Après une décision explicite `Lancer`, le système peut créer un **Project Draft** séparé.

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

On peut alors engager :

- architecture technique finale ;
- responsables d’exécution ;
- backlog / tâches opérationnelles ;
- planning de delivery ;
- jalons contractuels ;
- affectations ;
- plan de déploiement ;
- suivi d’exécution.

Une information d’exécution peut être estimée avant GO **uniquement si une Decision Requirement l’exige pour décider honnêtement**. Elle reste alors une estimation/scénario, pas un plan d’exécution engagé.

---

## 3. Les six couches canoniques du moteur

### Couche 1 — Information Blueprint

Définit tout ce que 4b4c peut avoir besoin de connaître pour produire une sortie ou éclairer une décision.

La Matrice Site vitrine V4.1 est le premier registre de ce Blueprint.

### Couche 2 — Sources, mémoire et provenance

Conserve ce qui a été dit, extrait, recherché, calculé, inféré, recommandé, accepté, rejeté ou supersédé.

La mémoire structurée ne remplace jamais les sources originales.

### Couche 3 — Output Contracts

Définit ce que 4b4c doit être capable de produire, et les exigences réelles de chaque sortie.

### Couche 4 — Dependency & Readiness Graph

Relie :

`information → requirement → output → décision`.

Il détermine ce qui est suffisant, partiel, bloquant, conflictuel, périmé ou acceptable comme inconnu.

### Couche 5 — Acquisition & Action Engine

Détermine comment résoudre un manque : exploiter la mémoire, extraire une source, rechercher, calculer, inférer, challenger, proposer, ou demander à l’humain.

### Couche 6 — UX Projection

Ne montre que ce qui est utile maintenant : état lisible du dossier, résultat du travail de 2b2c et éventuelle action humaine pertinente.

**L’UX ne détermine pas le workflow. Elle projette l’état du moteur.**

---

## 4. Le « formulaire complet » existe en interne, jamais comme formulaire visible

Le besoin d’exhaustivité est réel, mais il doit être porté par le moteur.

L’IDD peut contenir notamment les domaines suivants :

1. identité / contexte de l’Idée ;
2. problème / opportunité / déclencheur ;
3. objectifs et résultats attendus ;
4. utilisateurs / audiences ;
5. offre / proposition de valeur ;
6. existant / actifs / contenu disponible ;
7. concurrence / alternatives / références ;
8. preuves / evidence ;
9. fonctionnalités / comportements ;
10. expérience / parcours ;
11. structure / information architecture ;
12. contenu ;
13. marque / design / préférences / rejets ;
14. contraintes ;
15. faisabilité ;
16. impact économique lorsqu’il peut être établi honnêtement ;
17. risques / contradictions / inconnues ;
18. scope ;
19. gouvernance / décideurs ;
20. Decision Requirements ;
21. collaboration / présentation / atelier ;
22. candidates, recommandations, décisions et historique.

Un utilisateur peut fournir une information de n’importe quel domaine à n’importe quel moment. Elle est stockée immédiatement au bon endroit sans forcer l’interface à afficher ce domaine maintenant.

---

## 5. Contrat d’un Memory Item / Information Item

Toute information exploitable doit être modélisable avec au minimum :

- `information_key` ;
- `domain` ;
- `value` ;
- `type` : `FACT / PREFERENCE / CONSTRAINT / ASSUMPTION / OPTION / EVIDENCE / RISK / QUESTION / DECISION / ...` ;
- `state` : `PROPOSED / CURRENT / ACCEPTED_AS_CURRENT / CONFIRMED / FROZEN_IN_SNAPSHOT / SUPERSEDED / REJECTED / REVIEW_REQUIRED / ACCEPTED_UNKNOWN / ...` ;
- `provenance` : `HUMAN_DECLARED / HUMAN_GUIDED_ANSWER / SOURCE_EXTRACTED / WEB_RESEARCH / SYSTEM_CALCULATED / AI_INFERRED / AI_RECOMMENDED` ;
- `source_ref` ou relation aux sources originales ;
- `capture/source/version` d’origine ;
- `scope/context` ;
- `confidence_label` lorsque pertinent ;
- `freshness` lorsque l’information peut expirer ;
- `conflict_group` si plusieurs affirmations incompatibles existent ;
- `supersedes / superseded_by` ;
- `created_at / observed_at` selon la nature de l’information.

Une provenance IA ne devient jamais implicitement une vérité humaine.

---

## 6. Source Model

Les sources incluent au minimum :

- texte libre utilisateur ;
- réponse guidée ;
- correction utilisateur ;
- lien fourni ;
- image fournie ;
- document fourni ;
- site existant ;
- recherche publique ;
- donnée structurée connectée ;
- calcul système ;
- observation IA dérivée d’une source.

Une source conserve : identité, type, rôle déclaré ou inféré, note humaine éventuelle, version/fraîcheur, état d’analyse, droits/accès lorsque nécessaire.

Une note explicite de l’utilisateur sur une source a priorité sur une classification IA silencieuse.

---

## 7. Les Output Contracts canoniques

Le moteur ne cherche pas à « compléter le dossier ». Il cherche à rendre **les sorties pertinentes suffisamment prêtes**.

### O1 — Understanding Model

But : comprendre suffisamment l’Idée pour orienter correctement le travail suivant.

Doit généralement couvrir, explicitement ou sous hypothèse de travail :

- ce qui est envisagé ;
- pourquoi / quel problème ou objectif ;
- pour qui ;
- contexte essentiel ;
- contraintes critiques déjà connues.

Ne nécessite pas : design final, contenus finaux, scope complet, recherche exhaustive.

### O2 — Evidence & Diagnostic Pack

But : distinguer faits, observations, interprétations, forces, faiblesses, opportunités, risques et contradictions réellement utiles.

N’existe que dans la profondeur nécessaire au cas courant.

Les recherches supplémentaires s’arrêtent lorsqu’elles ont peu de chances de modifier une décision ou une recommandation structurante.

### O3 — Candidate Directions

But : produire zéro, une ou plusieurs directions justifiées.

Préconditions typiques :

- Understanding suffisamment fiable ;
- objectif / audience / offre ou hypothèses explicites ;
- contraintes critiques connues ;
- evidence suffisante pour éviter une direction arbitraire.

Sorties valides :

- une direction convergente ;
- deux directions si vrai compromis ;
- plusieurs hypothèses si terrain encore ouvert ;
- aucune recommandation si les données sont insuffisantes.

### O4 — Candidate Proposition

But : rendre la direction suffisamment concrète pour être jugée.

Pour un site vitrine, elle peut couvrir :

- positionnement ;
- message ;
- conversion ;
- parcours ;
- structure ;
- pages ;
- fonctionnalités ;
- contenus ;
- scope ;
- éléments à différer ou déconseiller.

Une Candidate est versionnée. Une Candidate V1 n’est jamais réécrite silencieusement en V2.

### O5 — Scope & Structure

But : rendre visible ce qui est réellement envisagé.

Classification minimale :

- `Première version` ;
- `Peut attendre` ;
- `Non recommandé actuellement`.

Chaque fonctionnalité importante doit être reliée à : besoin, utilisateur, valeur, complexité, dépendances, alternative plus simple éventuelle.

### O6 — Concept Projection

But : aider à juger, pas produire le design final.

État possible : `NOT_RELEVANT`.

Profondeur :

- aucune projection ;
- aperçu rapide ;
- concept poussé.

La profondeur dépend de la valeur décisionnelle de la matérialisation.

### O7 — Decision Brief

But : permettre une décision honnête.

Doit rassembler, selon les Decision Requirements :

- Candidate actuelle ;
- raison de la recommandation ;
- preuves ;
- hypothèses ;
- alternatives importantes ;
- scope ;
- risques ;
- contradictions ;
- inconnues acceptées ;
- faisabilité nécessaire ;
- avis / désaccords équipe si applicables ;
- recommandation 2b2c ;
- `Decision Question`.

### O8 — Presentation / Workshop Pack

But : préparer d’autres personnes à juger ou contribuer.

Peut être `NOT_RELEVANT` pour une décision solo.

Réutilise le même IDD et le même Decision Brief ; il ne crée pas un deuxième dossier parallèle.

Informations spécifiques possibles :

- audience de la présentation ;
- décision recherchée ;
- temps disponible ;
- niveau de détail ;
- désaccords connus ;
- sujets déjà alignés vs sujets à discuter.

### O9 — Project Draft Handoff

But : transférer proprement l’Idée après un GO explicite.

Précondition absolue : décision `Lancer` ou équivalent explicitement enregistrée.

Transférer :

- faits actifs ;
- hypothèses actives ;
- contraintes ;
- scope retenu ;
- structure ;
- evidence pertinente ;
- risques ;
- questions ouvertes ;
- assets ;
- décisions ;
- Candidate finale retenue.

Les anciennes Candidates, hypothèses supersédées et recommandations rejetées restent historiques.

---

## 8. Requirement Model — remplacer « obligatoire / facultatif »

Une information n’est jamais obligatoire en absolu.

Elle est :

> **requise pour une sortie, une décision ou une conséquence donnée dans le contexte actuel.**

Chaque `Requirement` doit pouvoir connaître :

- `required_for_output` ;
- `required_for_decision_requirement` ;
- `information_keys` possibles ;
- `minimum_validation_level` ;
- `can_use_working_assumption` ;
- `can_accept_unknown` ;
- `freshness_requirement` ;
- `blocking_if_missing` ;
- `resolution_paths` ;
- `dependencies`.

Exemple : la couleur préférée peut être `NOT_RELEVANT` pour O1, utile pour O6, et non bloquante pour O7.

---

## 9. États de résolution des Requirements

Utiliser au minimum :

- `SATISFIED` — suffisamment résolu pour l’usage visé ;
- `PARTIAL` — exploitable mais insuffisant pour l’usage visé ;
- `BLOCKING` — empêche honnêtement la sortie/décision visée ;
- `UNKNOWN_ACCEPTABLE` — inconnu explicitement acceptable ;
- `CONFLICTED` — sources incompatibles non résolues ;
- `STALE` — information trop ancienne pour l’usage visé ;
- `NOT_RELEVANT` — non nécessaire dans ce contexte.

Ces états sont relatifs au Requirement, pas à la valeur absolue de l’information.

---

## 10. Output Readiness

Chaque sortie possède sa readiness indépendante :

- `NOT_RELEVANT` ;
- `NOT_READY` ;
- `READY_WITH_ACCEPTED_UNKNOWNS` ;
- `READY` ;
- `STALE`.

Il n’existe pas de pourcentage global « projet complété à 63 % ».

Un dossier peut simultanément être :

- Understanding = READY ;
- Evidence = READY ;
- Candidate = PARTIAL/NOT_READY ;
- Projection = NOT_RELEVANT ;
- Decision Brief = NOT_READY ;
- Presentation = NOT_RELEVANT.

L’interface peut traduire cela en langage simple, mais ne doit pas inventer une fausse progression linéaire.

---

## 11. Decision Requirements — ce qui définit réellement « assez »

Avant de conclure qu’une Idée est prête à être décidée, 2b2c détermine ce dont les vrais décideurs ont besoin.

Exemples :

- comprendre le concept ;
- voir une projection ;
- connaître une enveloppe budgétaire ;
- vérifier une faisabilité ;
- obtenir une validation juridique ;
- comparer deux alternatives ;
- obtenir l’avis d’un associé ;
- accepter explicitement une inconnue.

Deux Ideas similaires peuvent donc avoir une readiness de décision différente.

Le produit ne demande pas tous les Decision Requirements possibles : il active seulement ceux qui sont pertinents.

---

## 12. Acquisition Engine — ordre canonique avant de demander à l’humain

Pour tout Requirement non résolu :

1. **Mémoire active** — l’information existe-t-elle déjà ?
2. **Sources déjà fournies** — peut-elle être extraite d’un texte, site, document, image ou réponse existante ?
3. **Recherche publique / source externe autorisée** — est-elle objectivement recherchable et la recherche peut-elle changer une décision ?
4. **Calcul / dérivation déterministe** — peut-elle être obtenue sans opinion ?
5. **Inférence / hypothèse IA** — une hypothèse explicitement étiquetée est-elle suffisante ?
6. **Question humaine** — seul l’humain peut-il savoir, corriger ou décider ?
7. **Acceptation de l’inconnu / différé** — l’absence est-elle acceptable maintenant ?

Une question humaine est interdite si une voie autonome fiable permet de résoudre le Requirement à un coût raisonnable.

Une recherche est interdite si elle n’a aucun lien plausible avec une sortie ou une décision actuelle.

---

## 13. Catalogue des capacités / actions de 2b2c

2b2c peut notamment :

- `EXTRACT` — extraire d’une source ;
- `CLASSIFY` — classer avec provenance ;
- `SUMMARIZE` — synthétiser sans supprimer les sources ;
- `RESEARCH` — rechercher publiquement ;
- `CALCULATE` — calculer/dériver ;
- `INFER_HYPOTHESIS` — proposer une hypothèse visible ;
- `ASK_HUMAN` — demander uniquement l’information humaine nécessaire ;
- `RESCUE_UNKNOWN` — reformuler/aider sans forcer l’utilisateur ;
- `RESOLVE_CONFLICT` — exposer une contradiction et chercher la bonne résolution ;
- `CHALLENGE` — remettre en cause une solution disproportionnée/incohérente ;
- `SIMPLIFY` — proposer une alternative plus simple ;
- `ENRICH` — ajouter une option justifiée ;
- `COMPARE` — comparer de vraies alternatives ;
- `GENERATE_CANDIDATE` — produire une direction/proposition ;
- `RECOMMEND` — recommander via Recommendation Contract ;
- `MATERIALIZE` — produire une projection si utile ;
- `PREPARE_DECISION` — construire le Decision Brief ;
- `PREPARE_PRESENTATION` — générer la vue adaptée au public ;
- `REASSESS_DELTA` — recalculer les seules dépendances affectées.

`Améliorer`, `Challenger`, `Analyser la concurrence`, `Faire une recherche` ne sont donc pas des étapes fixes : ce sont des actions disponibles au moteur lorsqu’elles ont une valeur réelle.

---

## 14. Deux files d’action distinctes : système et humain

Le moteur maintient conceptuellement :

### A. `SYSTEM_NEXT_ACTIONS`

Actions que 2b2c peut effectuer sans intervention humaine : extraction, recherche autorisée, calcul, analyse, génération, comparaison, etc.

Plusieurs actions indépendantes peuvent être exécutées en parallèle.

### B. `USER_NEXT_ACTION`

Une seule action humaine dominante doit être mise en avant lorsque l’utilisateur est réellement nécessaire.

Conséquence UX majeure :

> l’utilisateur ne doit pas avoir à cliquer sur « Faire la recherche » simplement pour autoriser 2b2c à accomplir un travail public, réversible et déjà justifié par le moteur.

Demander une autorisation seulement lorsqu’elle est réellement nécessaire : accès privé, coût externe, action irréversible, conséquence sensible, connexion à un service ou changement engageant.

---

## 15. Algorithme conceptuel de Next Best Action

### Étape A — déterminer l’horizon actuel

Identifier les sorties actuellement utiles : comprendre, explorer, former une Candidate, préparer une décision, préparer une présentation, etc.

L’utilisateur ne choisit pas nécessairement cet horizon dans un menu ; il est dérivé du dossier et de son intention actuelle.

### Étape B — calculer les Requirements non résolus

Pour chaque Output Contract actif :

- requirements satisfaits ;
- partiels ;
- conflictuels ;
- périmés ;
- bloquants ;
- inconnus acceptables.

### Étape C — générer des Action Candidates

Pour chaque requirement : voies d’acquisition possibles, action de challenge, recherche, question, génération ou acceptation d’inconnu.

### Étape D — appliquer les exclusions dures

Éliminer :

- question redondante ;
- recherche sans impact décisionnel ;
- inférence présentée comme fait ;
- sortie dont les blockers critiques ne sont pas traités ;
- action sur une version obsolète ;
- action qui recrée artificiellement une étape déjà résolue.

### Étape E — prioriser

Ordre conceptuel :

1. intégrité / conflit critique / stale-safety ;
2. blocker d’une décision réellement demandée ;
3. blocker de la sortie active ;
4. action autonome à fort gain d’information ;
5. action humaine à fort gain d’information ;
6. amélioration substantielle de Candidate ;
7. enrichissement facultatif.

À priorité égale, préférer :

- moins d’effort humain ;
- plus grand gain d’information ;
- plus fort impact décisionnel ;
- action plus réversible ;
- coût/latence plus faibles ;
- meilleure traçabilité.

### Étape F — exécuter / afficher

- les actions système pertinentes peuvent s’exécuter automatiquement ;
- une seule action humaine dominante est affichée ;
- l’interface explique `Pourquoi maintenant ?` lorsque cela aide la confiance.

---

## 16. Le moteur n’avance pas « à l’étape suivante »

Après toute nouvelle information :

1. enregistrer la source ;
2. résoudre/mettre à jour les memory items concernés ;
3. déterminer les dépendances impactées ;
4. recalculer les Requirements affectés ;
5. recalculer les Output Readiness affectées ;
6. recalculer les System Next Actions ;
7. recalculer l’éventuelle User Next Action.

Le moteur pose donc la question :

> **« Qu’est-ce que cette nouvelle information change ? »**

et non :

> « Quelle est l’étape suivante ? »

---

## 17. Challenge / amélioration de l’Idée

Le challenge n’est jamais un passage obligatoire.

2b2c doit le déclencher lorsque, par exemple :

- la solution est disproportionnée par rapport au besoin ;
- plusieurs fonctionnalités ne servent aucun objectif identifié ;
- une alternative plus simple a une valeur comparable ;
- la proposition contredit une contrainte ;
- l’evidence affaiblit fortement une hypothèse ;
- un risque majeur est ignoré ;
- la différenciation est insuffisante lorsque cela est décisionnel.

Le challenge doit produire :

`observation → conséquence → alternative / question → impact potentiel`.

Il ne doit pas être utilisé pour générer artificiellement de la complexité.

---

## 18. Research Planner

Toute recherche doit répondre à :

> **« Quelle décision, hypothèse ou sortie cette recherche peut-elle modifier ? »**

Sans réponse crédible, ne pas rechercher.

Une recherche peut porter selon le cas sur :

- concurrents ;
- alternatives ;
- patterns ;
- marché ;
- réglementation ;
- SEO ;
- références ;
- faisabilité ;
- tendances ;
- standards.

La recherche produit des observations sourcées, jamais une vérité interne sur l’entreprise sans preuve.

Elle s’arrête lorsque le gain marginal attendu devient faible par rapport aux décisions restantes.

---

## 19. Recommendation Contract

Toute recommandation structurante conserve :

- recommandation ;
- objectif ;
- evidence ;
- assumptions ;
- critères ;
- alternatives considérées ;
- trade-offs ;
- risques ;
- niveau de confiance ;
- ce qui pourrait faire changer la recommandation.

Niveaux de confiance utilisateur :

- `Bien étayé` ;
- `Raisonnable mais à confirmer` ;
- `Hypothèse de travail` ;
- `Informations insuffisantes`.

Aucun faux pourcentage.

---

## 20. Capture → workspace : comportement cible

### 20.1 Pré-analyse opportuniste

Après persistance RAW FIRST, 2b2c **peut** préparer une première compréhension avant le CTA final de capture.

Déclencheurs possibles :

- pause significative dans la saisie ;
- fin d’une réponse guidée ;
- fin d’un upload ;
- source devenue analysable ;
- autre événement indiquant une version suffisamment stable.

Ne jamais appeler le LLM à chaque frappe.

Toute pré-analyse est versionnée et stale-safe.

### 20.2 `Commencer avec 2b2c`

Au clic :

1. flush des écritures ;
2. sécurisation des uploads ;
3. snapshot de la capture courante ;
4. réutilisation des analyses déjà valides pour cette version ;
5. analyse du delta si nécessaire ;
6. ouverture directe du workspace sur **le premier état utile**.

Il n’existe pas de page produit obligatoire `2b2c analyse…`.

Si une compréhension minimale n’est exceptionnellement pas encore disponible, rester brièvement sur la capture avec un état léger du CTA ou un message de préparation, puis ouvrir automatiquement le workspace.

Les analyses lourdes peuvent continuer en arrière-plan après l’entrée dans le workspace.

### 20.3 Si 2b2c a déjà aidé à rédiger le brief

Ne pas relire à l’utilisateur le texte que 2b2c vient lui-même d’écrire.

La première surface doit apporter une valeur nouvelle : prochaine action utile, contradiction, recommandation, travail autonome en cours ou première direction.

La compréhension détaillée reste consultable/corrigeable à la demande.

---

## 21. UX Projection — règles, pas écrans figés

L’espace Idée doit généralement pouvoir exprimer :

- **2b2c recommande maintenant** — action/résultat dominant ;
- **Acquis pour l’instant** — vraies informations utiles, pas métadonnées vagues ;
- **À examiner maintenant** — uniquement ce qui mérite l’attention ;
- **Peut attendre** — rassurer sur ce qui n’a pas besoin d’être résolu ;
- **Ce que 2b2c sait / sources** — accessible et corrigeable ;
- composer naturel permanent ;
- historique/version lorsque pertinent.

Ne pas créer une page uniquement pour :

- dire que l’analyse est en cours ;
- répéter ce que l’IA vient d’écrire avec l’utilisateur ;
- obliger à confirmer des informations non ambiguës ;
- matérialiser un état interne sans action ou valeur utilisateur.

---

## 22. Gestion des sources après la capture

Les sources ne disparaissent pas après upload.

Le workspace doit pouvoir montrer, lorsque pertinent :

- ce qui a été exploité ;
- ce qui reste à analyser ;
- le rôle compris ;
- la note utilisateur ;
- les observations importantes ;
- les conflits entre source et déclarations ;
- la fraîcheur.

Exemple :

`Ancien deck 2023 → 70 % B2B` en conflit avec `Utilisateur 2026 → surtout particuliers`.

2b2c ne choisit pas silencieusement. Le requirement devient `CONFLICTED` si le conflit affecte une sortie actuelle.

---

## 23. Change Intelligence

Tout changement est classé selon son impact réel : cosmétique, contextuel, substantiel, critique.

Le système conserve :

- ce qui reste valable ;
- ce qui devient supersédé ;
- les outputs à recalculer ;
- les recherches à invalider éventuellement ;
- les décisions à rouvrir si nécessaire.

Une modification tardive de couleur ne doit pas rouvrir l’audience.

Un passage B2C → B2B peut rouvrir positionnement, parcours, contenu, scope et certaines evidence.

---

## 24. Présentation et atelier

La présentation est une **vue du même dossier**, pas un livrable construit depuis zéro avec un questionnaire parallèle.

Elle réutilise :

- compréhension ;
- diagnostic/evidence ;
- Candidate ;
- alternatives ;
- scope ;
- projection si utile ;
- risques ;
- inconnues ;
- recommandation ;
- Decision Question.

L’atelier structure les contributions comme objets versionnés, pas comme simple chat.

La présentation peut être inexistante si la décision solo ne la nécessite pas.

---

## 25. Cas de référence obligatoires pour valider le moteur

### Nathalie — novice, peu d’informations

Attendu : accompagnement simple ; peu de questions ; Rescue Path ; aucune obligation de comprendre le framework ; 2b2c fait le maximum lui-même.

### Vincent — expert, brief + nombreuses sources

Attendu : extraction massive ; aucune répétition ; actions autonomes en parallèle ; accès direct à une Candidate si readiness suffisante.

### Maya — équipe / désaccord

Attendu : gouvernance activée lorsqu’elle devient pertinente ; contradictions et positions conservées ; Decision Requirements adaptés ; présentation/atelier seulement si utile.

### Mauvaise idée / solution disproportionnée

Attendu : challenge réel ; simplification ou recommandation de ne pas poursuivre ; aucune préférence systémique pour GO.

### Source contradictoire

Attendu : conflit explicite ; aucune fusion silencieuse ; résolution ou acceptation d’inconnu selon impact.

### Changement radical tardif

Attendu : réévaluation ciblée ; historique conservé ; aucune remise à zéro générale.

### Idée excellente déjà cadrée

Attendu : quasiment aucune question ; 2b2c travaille et produit directement ce qui est prêt.

---

## 26. Règles de QA du moteur

Une implémentation n’est pas acceptable si :

1. elle nécessite un ordre fixe des domaines ;
2. elle repose une information déjà fournie ;
3. elle demande à l’utilisateur d’autoriser chaque recherche routinière ;
4. elle produit une recherche sans question décisionnelle ;
5. elle transforme une hypothèse IA en fait ;
6. elle impose une projection ou une présentation inutile ;
7. elle calcule une readiness globale arbitraire ;
8. elle fait avancer une Candidate malgré un conflit critique masqué ;
9. elle recommence tout après un changement local ;
10. elle crée des tâches/projets avant GO ;
11. elle favorise GO par design ;
12. elle dépend du LLM pour la persistance ou les règles déterministes critiques.

---

## 27. Conséquence pour la Matrice V4.1

La Matrice V4.1 reste utile et ne doit pas être jetée.

Cependant ses niveaux historiques `B0 / B1 / B2 / B3 / B4 / POST-GO` doivent être interprétés comme des **indications de dépendance par grandes familles de sorties**, pas comme une progression obligatoire.

À terme, la Matrice devra être migrée vers une version où chaque information référence explicitement :

- les Output Contracts concernés ;
- les Requirements associés ;
- le niveau de validation minimal ;
- les voies de résolution ;
- les conditions `NOT_RELEVANT` ;
- l’acceptabilité de l’inconnu.

Jusqu’à cette migration, le présent Master Blueprint prévaut sur toute lecture séquentielle des B-levels.

---

## 28. Conséquence pour Workflow V7.1

Les mécanismes détaillés de Workflow V7.1 restent valables lorsqu’ils ne contredisent pas ce document : mémoire, provenance, Answer Resolver, Evidence Model, Research Planner, Recommendation Contract, Change Intelligence, Candidate snapshots, collaboration, Decision Brief, GO/REVISE/PAUSE/STOP.

En revanche, la chaîne d’états :

`CAPTURED → UNDERSTOOD → DISCOVERING → ...`

ne doit plus être interprétée comme une machine à états linéaire imposant l’ordre du travail.

Ces libellés peuvent rester des tags descriptifs ou historiques, mais l’orchestration canonique repose désormais sur :

> **Output Contracts + Requirements + independent Readiness + Next Best Action.**

---

## 29. Méthode de conception à partir de maintenant

Avant tout nouveau prototype de l’Idea workspace :

1. choisir la sortie / situation à simuler ;
2. identifier ses Output Contracts ;
3. calculer les Requirements pertinents ;
4. simuler la mémoire et les sources disponibles ;
5. laisser l’Acquisition Engine et le NBA déterminer ce qui se passe ;
6. seulement ensuite projeter cet état dans une interface ;
7. red-teamer avec plusieurs profils et changements tardifs.

Il est interdit de décider d’abord « quel écran vient après quel écran » puis d’inventer la logique pour le justifier.

---

## 30. Résumé canonique

La logique de 4b4c est désormais :

```text
IDEA / SOURCES / REPONSES
        ↓
PERSISTENCE + PROJECT MEMORY
        ↓
INFORMATION BLUEPRINT
        ↓
OUTPUT CONTRACTS ACTIFS
        ↓
REQUIREMENTS
        ↓
READINESS PAR SORTIE
        ↓
ACQUISITION / SYSTEM ACTIONS
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
