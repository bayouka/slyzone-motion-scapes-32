# 4b4c — CONTRAT CANONIQUE CAPTURE → INGESTION → MÉMOIRE — V1.0

## 0. Statut

Ce document est **canonique et normatif** pour toute conception UX, implémentation frontend/backend et orchestration IA liée à la capture initiale d’une Idée.

Il complète le `Workflow V7.1 consolidé` et la `Matrice V4.1`. En cas d’ambiguïté, il précise les invariants de capture, persistance, ingestion et préremplissage de la mémoire. Il ne remplace pas le workflow général.

## 1. Pourquoi ce contrat existe

4b4c doit pouvoir recevoir aussi bien :

- deux phrases très vagues ;
- un brief de plusieurs pages ;
- des liens ;
- des images d’inspiration ;
- un site existant ;
- un PDF/deck ;
- des contraintes ;
- des fonctionnalités imaginées ;
- des préférences visuelles ;
- des informations de décision.

L’utilisateur ne doit jamais être pénalisé pour avoir donné beaucoup d’informations tôt, ni forcé à remplir à nouveau des éléments qu’il a déjà fournis.

## 2. Invariant n°1 — RAW FIRST

La donnée brute utilisateur est la première vérité persistée.

Dès l’écran de création :

1. créer l’`IDEA` brouillon ;
2. autosauvegarder le nom ;
3. autosauvegarder le brief brut et ses versions ;
4. enregistrer chaque lien ajouté ;
5. stocker chaque fichier/image et créer sa référence source ;
6. seulement ensuite autoriser une analyse IA sur la version concernée.

Aucun appel LLM n’est nécessaire pour garantir la sauvegarde.

## 3. Invariant n°2 — `Commencer` n’est pas `Sauvegarder`

La sauvegarde a déjà eu lieu.

`Commencer` signifie :

> « Ma première saisie est suffisamment fournie pour lancer l’analyse et entrer dans le workspace. »

Au clic :

1. flush des autosaves en attente ;
2. vérification des uploads ;
3. création d’un `capture_version` ou snapshot initial ;
4. déclenchement de l’analyse 2b2c sur cette version ;
5. navigation vers le workspace ;
6. affichage progressif des résultats lorsqu’ils arrivent.

L’utilisateur n’a pas à attendre que le LLM ait fini pour changer de surface.

## 4. Invariant n°3 — les uploads doivent survivre à la navigation

Une image ou un fichier encore uniquement présent dans le navigateur peut être perdu.

Par conséquent, avant que `Commencer` engage la capture :

- chaque fichier requis doit être uploadé ou explicitement signalé en erreur ;
- sa référence doit être persistée ;
- l’analyse du contenu peut, elle, être différée.

**Stockage avant navigation ; analyse après si nécessaire.**

## 5. Invariant n°4 — conservation du brut + mémoire structurée

Ne jamais remplacer la contribution originale par son interprétation IA.

Deux couches minimum :

### A. Source originale

Exemple :

> « Je veux un site rouge et orange, avec du claymorphism, une galerie avant/après et un formulaire de devis. »

### B. Informations structurées

Exemple conceptuel :

- `PREFERENCE / visual_design / colors / red`
- `PREFERENCE / visual_design / colors / orange`
- `PREFERENCE / visual_design / style / claymorphism`
- `OPTION / feature / before_after_gallery`
- `OPTION / feature / quote_request_form`

Chaque item conserve au minimum :

- type ;
- valeur ;
- domaine / information_key ;
- provenance ;
- référence à la source originale ;
- état métier ;
- version de capture d’origine ;
- date/ordre de création ;
- éventuellement contexte/portée et motif de révision.

## 6. Invariant n°5 — extraction atomique multi-domaine

Une réponse n’est pas affectée à « une étape ».

Un seul brief peut renseigner simultanément :

- WHY ;
- WHO ;
- WHAT ;
- CONSTRAINTS ;
- SCOPE ;
- FEATURES ;
- VISUAL PREFERENCES ;
- CONTENT/ASSETS ;
- REFERENCES ;
- DECISION REQUIREMENTS ;
- GOVERNANCE ;
- RISKS ;
- etc.

Le moteur d’extraction doit produire plusieurs memory items si nécessaire.

## 7. Invariant n°6 — comprendre l’intention, pas repérer des mots-clés

La classification doit tenir compte :

- de la négation ;
- de la modalité ;
- de la temporalité ;
- du sujet auquel l’information s’applique ;
- de la différence entre goût personnel, constat, exemple et décision.

Exemples :

- « Je déteste le rouge » → préférence négative / couleur à éviter.
- « Mon ancien site était rouge » → fait historique, pas préférence actuelle.
- « Le rouge pourrait être sympa » → option/piste, pas choix confirmé.
- « Je veux du rouge et orange » → préférence actuelle déclarée.

Une ambiguïté non résolue reste une ambiguïté ; elle n’est pas convertie artificiellement en certitude.

## 8. Invariant n°7 — préremplir ≠ figer

Une information fournie dans le brief peut préremplir un domaine très en aval.

Exemple : l’utilisateur indique dès la capture « rouge + orange + claymorphism ».

Plus tard, lors du travail visuel, 2b2c ne redemande pas naïvement « quelles couleurs voulez-vous ? ». Il part de l’état actuel :

> « Vous aviez indiqué rouge/orange et claymorphism et fourni cette référence. Est-ce toujours la direction à explorer ? »

Selon le langage de l’utilisateur, l’item est `CURRENT`, `PROPOSED`, `ACCEPTED_AS_CURRENT`, etc. Il n’est `CONFIRMED` ou `FROZEN_IN_SNAPSHOT` que lorsque les règles métier le justifient.

## 9. Invariant n°8 — une donnée peut être connue sans être affichée maintenant

Le workspace est progressif.

Une préférence de DA extraite dès la première minute peut rester stockée sans apparaître pendant le cadrage métier. Elle réapparaît lorsque son domaine devient décisionnellement pertinent.

La visibilité UX et l’existence en mémoire sont deux notions différentes.

## 10. Invariant n°9 — Answer Resolver avant nouvelle question

Avant de poser une question :

1. vérifier la mémoire ;
2. vérifier le brief brut ;
3. vérifier les sources déjà jointes ;
4. vérifier les extractions existantes ;
5. vérifier si une réponse antérieure résout déjà l’information ;
6. seulement ensuite rechercher, inférer ou demander.

Une réponse riche doit pouvoir résoudre plusieurs `information_key`.

## 11. Invariant n°10 — versions, idempotence et stale safety

Chaque analyse IA doit connaître la version de capture qu’elle traite.

Si `capture_version=3` est en cours d’analyse et que l’utilisateur produit `capture_version=4`, le résultat tardif de V3 :

- peut rester historique ;
- peut fournir des observations encore valables après vérification ;
- ne doit jamais écraser silencieusement des informations plus récentes.

Les mutations importantes doivent être idempotentes et stale-safe.

## 12. Invariant n°11 — changement ultérieur = supersession ciblée

Exemple :

- V1 : rouge + orange ;
- plus tard : vert + beige.

Le système conserve l’historique :

- rouge/orange → `SUPERSEDED` si réellement remplacé ;
- vert/beige → état actif approprié.

Change Intelligence réévalue uniquement les dépendances affectées. Audience, budget, activité ou autres domaines indépendants ne sont pas réanalysés sans raison.

## 13. Invariant n°12 — le « document de l’Idée » est une vue, pas la base de vérité unique

L’interface peut présenter un document/synthèse lisible de l’Idée.

Mais la source canonique est constituée d’objets structurés et versionnés :

- `ideas`
- capture/raw input versions ;
- `idea_sources`
- `idea_memory_items`
- provenance ;
- answers ;
- evidence ;
- recommendations ;
- snapshots ;
- decision requirements ;
- AI analysis runs.

Le document visible est une projection de cet état, pas un gros texte que le LLM réécrit entièrement à chaque tour.

## 14. UX de la capture initiale

Le texte doit autoriser les deux comportements :

> « Expliquez votre idée comme vous le feriez à quelqu’un. Quelques mots suffisent pour commencer, mais vous pouvez aussi partager tous les détails que vous connaissez déjà : objectifs, fonctionnalités imaginées, contraintes, préférences, inspirations… 2b2c s’appuiera dessus pour éviter de vous redemander ce que vous avez déjà précisé. »

L’action d’ajout doit être compréhensible, par exemple :

> `+ Ajouter des éléments existants`

avec explication :

- lien vers site existant / concurrent / inspiration ;
- document : brief, deck, étude, notes ;
- image : capture, maquette, référence visuelle, logo ;
- autre fichier utile.

Un « Pourquoi ajouter des éléments ? » explique :

> « 2b2c les analyse pour récupérer les informations que vous possédez déjà et éviter de vous les redemander. »

## 15. Échec IA

Si l’analyse échoue :

- l’Idée et ses sources restent intactes ;
- l’utilisateur peut continuer à consulter/modifier sa capture ;
- l’analyse peut être relancée ;
- aucun item structuré incomplet ne doit être promu silencieusement en vérité active.

La persistance et la continuité du produit ne dépendent jamais de la disponibilité du LLM.

## 16. Critères de QA obligatoires

Avant validation d’une implémentation, tester au minimum :

1. brief de 2 phrases ;
2. brief long mélangeant business, fonctionnalités et DA ;
3. négations (« je ne veux pas de rouge ») ;
4. préférences incertaines (« peut-être du rouge ») ;
5. image de référence jointe ;
6. fichier encore en upload au clic `Commencer` ;
7. fermeture du navigateur avant `Commencer` ;
8. analyse IA en erreur ;
9. modification du brief pendant une analyse ;
10. résultat IA ancien arrivant après une version plus récente ;
11. changement ultérieur d’une préférence ;
12. vérification qu’aucune question déjà résolue n’est reposée inutilement.

## 17. Règle de reprise pour toute nouvelle IA

Toute IA reprenant 4b4c doit considérer comme interdit de :

- utiliser le LLM comme mécanisme de sauvegarde ;
- analyser avant de persister la source brute concernée ;
- perdre les réponses originales après structuration ;
- convertir une préférence en décision figée sans justification ;
- reposer une question déjà résolue dans le brief ou une source ;
- écraser une version récente avec le résultat tardif d’une ancienne analyse ;
- traiter le document synthétique visible comme l’unique base de vérité.
