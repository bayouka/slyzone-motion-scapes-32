# 4b4c — IDEA WORKSPACE ADAPTIVE WIREFRAMES — V0.1

Date : 2026-09-13

Statut : **LOW-FIDELITY CANDIDATE — NON VALIDÉ FONCTIONNELLEMENT**

Dépend de :

- `IDEA_ENGINE_MASTER_BLUEPRINT_V1.md` ;
- `WORKSPACE_PROJECTION_CONTRACT_V0_2.md` ;
- `WORKSPACE_PROJECTION_V0_2_RED_TEAM_20260913.md`.

Objectif : prouver qu’une même structure de workspace peut accompagner un novice, un utilisateur très documenté et un conflit critique sans devenir une séquence.

---

# 1. Principe

Le workspace n’est pas une succession d’écrans `Comprendre → Rechercher → Proposer → Décider`.

Il s’agit d’une **surface stable dont le contenu dominant change selon l’état réel de l’IDD**.

L’utilisateur doit pouvoir revenir au même endroit et reconnaître immédiatement :

- ce que 2b2c travaille ;
- ce qui compte maintenant ;
- s’il doit agir ;
- ce qui a avancé ;
- les informations déjà acquises ;
- où parler librement à 2b2c.

---

# 2. Structure commune desktop candidate

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│  ← Idées      NOM DE L’IDÉE                              Partager   •••      │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌───────────────────────────────────────────────┐  ┌─────────────────────┐  │
│  │  ✦ 2b2c maintenant                           │  │ Acquis pour         │  │
│  │                                               │  │ l’instant           │  │
│  │  ORIENTATION / ATTENTION                      │  │                     │  │
│  │                                               │  │ • info utile        │  │
│  │  [éventuelle action humaine dominante]       │  │ • info utile        │  │
│  │                                               │  │ • info utile        │  │
│  │  Pourquoi…                                    │  │                     │  │
│  │  Ensuite…                                     │  │ Corriger / Voir +   │  │
│  └───────────────────────────────────────────────┘  └─────────────────────┘  │
│                                                                              │
│  ┌───────────────────────────────────────────────┐  ┌─────────────────────┐  │
│  │ Ce qui vient d’avancer                       │  │ Sources             │  │
│  │ [uniquement si conséquence utile récente]    │  │ [résumé compact]    │  │
│  └───────────────────────────────────────────────┘  │ Voir les sources    │  │
│                                                     └─────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ SURFACE DE TRAVAIL UTILE                                               │  │
│  │ compréhension / observations / candidate / comparaison / décision      │  │
│  │ seulement lorsque ces objets apportent une valeur maintenant           │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│  Dites à 2b2c ce que vous voulez ajouter, corriger, demander ou explorer…   │
│                                                                  [Envoyer]   │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Règle fondamentale

Les boîtes ci-dessus sont une **hiérarchie**, pas un quota de cartes.

Si `Progress Signal` ou `Sources` n’apportent rien maintenant, ils disparaissent.

Si la zone dominante suffit, l’écran reste très léger.

---

# 3. Structure commune mobile candidate

```text
┌──────────────────────────────┐
│ ←  Nom de l’idée        •••  │
├──────────────────────────────┤
│                              │
│ ✦ 2b2c maintenant            │
│                              │
│ ORIENTATION / ATTENTION      │
│                              │
│ [action dominante éventuelle]│
│                              │
│ Pourquoi…                    │
│ Ensuite…                     │
│                              │
├──────────────────────────────┤
│ Ce qui vient d’avancer       │  ← seulement si utile
├──────────────────────────────┤
│ Acquis pour l’instant   ›    │  ← repliable
├──────────────────────────────┤
│ Travail utile courant        │
│ [candidate / observation /   │
│  comparaison / etc.]         │
│                              │
├──────────────────────────────┤
│ Sources                 ›    │  ← secondaire
├──────────────────────────────┤
│                              │
│ [ Composer permanent       ] │
└──────────────────────────────┘
```

Sur mobile, la zone dominante ne doit pas dépasser environ un écran avant interaction sauf cas de conflit/decision réellement complexe.

`Pourquoi` et `Ensuite` peuvent être compactés ou repliables lorsque leur contenu devient long.

---

# 4. Wireframe A — Nathalie, idée très pauvre

## État moteur résumé

- description : `Je voudrais refaire mon site. Il fait vieux et je veux quelque chose de plus moderne.` ;
- aucune source ;
- plusieurs domaines encore inconnus ;
- une seule information à fort gain humain : résultat prioritaire attendu ;
- aucune raison de demander pages, budget, couleurs ou fonctionnalités maintenant.

## Projection

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Refonte de mon site                                                  │
├──────────────────────────────────────────────────────────────────────┤
│ ✦ 2b2c maintenant                                                   │
│                                                                      │
│ Je vois que vous voulez moderniser votre site. Avant d’aller plus    │
│ loin, j’ai besoin de comprendre ce que ce nouveau site doit surtout  │
│ vous apporter.                                                       │
│                                                                      │
│ Quel résultat compte le plus pour vous ?                             │
│                                                                      │
│ [ Obtenir plus de contacts ]  [ Mieux présenter mon activité ]       │
│ [ Inspirer davantage confiance ] [ Autre ]                           │
│                                                                      │
│ Je ne sais pas encore                                                │
│                                                                      │
│ Pourquoi                                                             │
│ Ce choix change la structure du site et ce que je devrai privilégier.│
│                                                                      │
│ Ensuite                                                              │
│ Je pourrai vous proposer quoi examiner en priorité sans vous faire    │
│ remplir un brief complet.                                            │
├──────────────────────────────────────────────────────────────────────┤
│ Acquis pour l’instant                                                │
│ • vous souhaitez refaire un site existant                            │
│ • l’apparence actuelle vous semble datée                             │
│ • vous recherchez une perception plus moderne                        │
│                                                         Corriger      │
├──────────────────────────────────────────────────────────────────────┤
│ Dites à 2b2c quelque chose d’autre…                                  │
└──────────────────────────────────────────────────────────────────────┘
```

## Après réponse `Obtenir plus de contacts`

Le bouton ne mène pas à un nouvel écran.

Même workspace, delta immédiat :

```text
Ce qui vient d’avancer
Votre priorité est maintenant claire : obtenir davantage de contacts.
Je peux juger les prochains choix selon leur capacité à convertir les visiteurs.
```

Puis la zone `2b2c maintenant` se recalcule. Si 2b2c peut poursuivre seul, aucune nouvelle question n’apparaît immédiatement.

## Pourquoi ce wireframe fonctionne

- une seule question ;
- le novice comprend à quoi elle sert ;
- `Je ne sais pas` existe ;
- l’écran montre ce qui est déjà acquis ;
- aucune promesse de progression linéaire ;
- l’action produit une conséquence visible sans changement de “phase”.

---

# 5. Rescue state — Nathalie clique `Je ne sais pas encore`

```text
✦ 2b2c maintenant

Pas de problème. On peut avancer autrement.

D’après ce que vous m’avez dit, trois objectifs sont plausibles :

○ obtenir davantage de demandes de contact
○ rassurer les visiteurs sur votre sérieux
○ mieux expliquer ce que vous proposez

[ Aidez-moi à choisir ]
[ Partez sur une hypothèse pour l’instant ]
[ On verra plus tard ]
```

Si `Partez sur une hypothèse` :

> Pour avancer, je pars provisoirement sur **obtenir davantage de contacts**. C’est une hypothèse de travail, pas une décision de votre part, et vous pourrez la corriger à tout moment.

Aucun faux statut `confirmé` n’est créé.

---

# 6. Wireframe B — Vincent, brief riche + nombreuses sources

## État moteur résumé

- objectif, cible, offre et contraintes déjà largement présents ;
- plusieurs documents analysables ;
- quelques extractions déjà prêtes ;
- analyses supplémentaires en parallèle ;
- aucune action humaine nécessaire.

## Projection

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Refonte du site Novaris                                              │
├──────────────────────────────────────────────────────────────────────┤
│ ✦ 2b2c maintenant                                                   │
│                                                                      │
│ Vous m’avez déjà donné assez de matière pour que je travaille sans   │
│ vous solliciter pour l’instant.                                      │
│                                                                      │
│ Je relie actuellement vos objectifs commerciaux, vos trois offres et │
│ les données du site existant afin d’identifier ce qui doit réellement│
│ changer — et ce qu’il vaut mieux conserver.                          │
│                                                                      │
│ Vous n’avez rien à faire maintenant.                                 │
│                                                                      │
│ Ensuite                                                              │
│ Cela devrait me permettre de comparer des directions de structure et │
│ de conversion sur des bases plus solides.                            │
├──────────────────────────────────────────────────────────────────────┤
│ Ce qui vient d’avancer                                               │
│                                                                      │
│ J’ai trouvé vos trois offres principales dans la présentation        │
│ commerciale et leur ordre de priorité dans le brief.                 │
│ Je ne vous les redemanderai pas.                                     │
├──────────────────────────────────────────────────────────────────────┤
│ Acquis pour l’instant                                                │
│ • objectif : augmenter les demandes qualifiées                       │
│ • cible principale : PME de services                                 │
│ • trois offres déjà identifiées                                      │
│ • conservation de l’identité de marque                               │
│                                                     Voir / Corriger   │
├──────────────────────────────────────────────────────────────────────┤
│ Sources                                                              │
│ 12 éléments fournis · plusieurs analyses continuent                  │
│                                                     Voir les sources  │
├──────────────────────────────────────────────────────────────────────┤
│ Dites à 2b2c ce que vous voulez ajouter, corriger ou explorer…       │
└──────────────────────────────────────────────────────────────────────┘
```

## Point de preuve UX

Le cas `vous n’avez rien à faire` doit paraître **actif et rassurant** : l’orientation explique le travail en cours et la valeur recherchée.

Ne pas remplacer par un gros loader.

Ne pas montrer douze barres de traitement.

---

# 7. Agrégation des traitements parallèles — Vincent

Si huit documents terminent presque ensemble, ne pas afficher huit notifications.

Mauvais :

```text
✓ Présentation analysée
✓ Analytics analysé
✓ Charte analysée
✓ Brief analysé
...
```

Bon :

```text
Ce qui vient d’avancer

L’analyse de vos documents commerciaux confirme les trois offres principales
et fait apparaître une contrainte que je n’avais pas encore : le site doit
permettre une prise de rendez-vous téléphonique en plus du formulaire.

Cela change la structure de conversion que je vais comparer.
```

Le progrès est agrégé par conséquence, pas par job.

---

# 8. Wireframe C — conflit B2B / particuliers

## État moteur résumé

- deck ancien : activité surtout B2B ;
- déclaration récente : développer les particuliers ;
- conflit directement impactant O1/O3/O4 ;
- seule l’utilisateur peut arbitrer l’intention future ;
- autres analyses peuvent continuer.

## Projection

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Refonte du site Atelier Martin                                       │
├──────────────────────────────────────────────────────────────────────┤
│ ✦ Un point change fortement la direction du site                    │
│                                                                      │
│ Votre présentation commerciale décrit surtout une activité auprès    │
│ d’entreprises. Dans votre description récente, vous dites vouloir    │
│ surtout développer les particuliers.                                │
│                                                                      │
│ Quel public doit être prioritaire pour ce nouveau site ?             │
│                                                                      │
│ [ Particuliers ]   [ Entreprises ]   [ Les deux ]                    │
│ [ Je ne sais pas encore ]                                            │
│                                                                      │
│ Pourquoi                                                             │
│ Ce choix change le message principal, les parcours et plusieurs      │
│ contenus. Je préfère ne pas choisir silencieusement à votre place.   │
│                                                                      │
│ Sources                                                              │
│ “Présentation commerciale 2024” → surtout entreprises                │
│ Votre description actuelle → priorité aux particuliers               │
│                                                   Voir le détail      │
│                                                                      │
│ En attendant                                                         │
│ Je continue les analyses qui ne dépendent pas de ce choix.           │
├──────────────────────────────────────────────────────────────────────┤
│ Acquis pour l’instant                                                │
│ • activité et offres principales connues                             │
│ • identité visuelle à conserver                                      │
│ • prise de contact nécessaire                                        │
├──────────────────────────────────────────────────────────────────────┤
│ Dites à 2b2c ce que vous voulez préciser…                            │
└──────────────────────────────────────────────────────────────────────┘
```

## Après arbitrage `Particuliers`

```text
Ce qui vient d’avancer

C’est clair : le B2B reste votre historique, mais le nouveau site doit
prioritairement développer les particuliers.

Je conserve les informations de votre activité qui restent valables et je
réévalue uniquement le positionnement, le parcours, le contenu et les preuves
qui dépendent de cette cible.
```

Le système ne recommence pas le dossier.

---

# 9. Variante D — capture déjà aidée par 2b2c

## Interdit

```text
J’ai compris votre idée :
• vous voulez refaire votre site
• pour des particuliers
• pour obtenir des contacts
...

[Continuer]
```

Cela répète le travail de la capture et recrée une étape.

## Attendu

```text
✦ 2b2c maintenant

Votre objectif et votre public sont déjà assez clairs grâce à ce que nous
avons précisé ensemble.

Je peux maintenant examiner votre site actuel pour voir ce qui aide ou freine
les demandes de contact.

Vous n’avez rien à répéter.
```

---

# 10. Variante E — mauvaise idée / solution disproportionnée

```text
✦ 2b2c recommande maintenant

La plateforme complète que vous imaginez semble beaucoup plus complexe que
le besoin décrit : permettre aux visiteurs de comparer trois prestations et
prendre rendez-vous.

Avant de pousser cette solution plus loin, je vous recommande de comparer
une version beaucoup plus simple du site qui pourrait atteindre le même but.

[ Comparer les deux approches ]

Pourquoi
Cela peut changer fortement coût, délai et risque avant que vous investissiez
dans une solution inutilement lourde.
```

Aucun besoin de “finir l’analyse concurrentielle” avant ce challenge si les informations suffisent déjà.

---

# 11. Variante F — associé / décideur mentionné

```text
✦ 2b2c maintenant

Vous avez indiqué que votre associée devra aussi valider la nouvelle direction.
Pour l’instant, je peux continuer à préparer les options sans la solliciter.

Je vous signalerai uniquement les choix sur lesquels son avis devient réellement
nécessaire avant une décision.
```

Si un désaccord concret apparaît plus tard, il devient `ATTENTION_NOW`.

Ne pas ouvrir automatiquement un “mode équipe”.

---

# 12. Variante G — Blueprint mismatch

```text
✦ Votre idée a changé de nature

Les comptes vendeurs, le paiement et la mise en relation que vous venez
d’ajouter font évoluer le projet d’un site vitrine vers une marketplace.

Le cadre actuel “site vitrine” ne couvre pas suffisamment ce type de produit.
Je conserve tout ce que nous avons déjà appris, mais je ne vais pas prétendre
que le dossier est prêt avec les mêmes critères.

[ Comprendre ce que cela change ]
```

Le CTA explique le changement ; il ne force pas un faux workflow continu.

---

# 13. Surface `Acquis pour l’instant`

La zone reste secondaire et courte.

Baseline : 3 à 5 informations utiles maximum avant expansion.

Chaque élément peut afficher au besoin :

- valeur ;
- statut simple `Hypothèse` si nécessaire ;
- `Corriger` ;
- provenance accessible.

Ne pas afficher :

- nom de la clé Matrix ;
- niveau de Readiness ;
- ID de source ;
- confiance en pourcentage ;
- toute la mémoire structurée.

Exemple :

```text
Acquis pour l’instant

Objectif        Obtenir plus de demandes qualifiées
Public          Particuliers autour de Lyon
Contrainte      Garder la prise de rendez-vous téléphonique
Hypothèse       La majorité des visiteurs arrive sur mobile

Voir tout ce que 2b2c utilise
```

`Voir tout` ouvre une vue de mémoire/provenance, pas un formulaire obligatoire.

---

# 14. Surface `Sources`

La surface compacte répond uniquement :

- qu’est-ce qui a été fourni ?
- qu’est-ce qui a été exploité ?
- y a-t-il un problème important ?

Exemple simple :

```text
Sources
Site actuel · Présentation 2025 · 4 captures
3 éléments utiles déjà extraits
[Voir]
```

Exemple conflictuel :

```text
Sources
2 sources ne racontent pas la même chose sur votre public prioritaire
[Comparer]
```

La provenance détaillée devient visible quand elle est décisionnelle ou demandée.

---

# 15. Surface de travail utile

Le workspace peut matérialiser un output lorsqu’il devient réellement utile, sans créer d’onglet/étape obligatoire.

Exemples :

### Une première direction existe

```text
Une direction se dessine

“Site orienté prise de rendez-vous, avec preuve rapide de sérieux et parcours
court vers trois prestations prioritaires.”

Pourquoi cette direction
• objectif conversion
• public mobile
• trois offres principales
• besoin de réassurance

[Voir la proposition]  [La challenger]
```

### Deux directions doivent être comparées

```text
Deux directions valent la peine d’être comparées

A — Conversion directe
B — Expertise / réassurance d’abord

[Comparer]
```

### Aucune Candidate honnête n’existe encore

Ne rien afficher artificiellement.

---

# 16. Cas Decision Brief prêt

Le workspace ne change pas de nature en “étape décision”.

La zone dominante peut devenir :

```text
✦ Vous avez maintenant suffisamment d’éléments pour décider

La direction recommandée est suffisamment étayée pour répondre à la question :
“Lançons-nous cette refonte avec ce périmètre ?”

Il reste deux inconnues, mais elles ne bloquent pas cette décision et sont
explicitement conservées.

[ Examiner la décision ]

Autres issues possibles : approfondir · mettre en pause · ne pas poursuivre
```

`STOP/PAUSE` restent des sorties normales.

---

# 17. Retour après absence

Même structure, zone dominante recalculée :

```text
✦ Depuis votre dernière visite

J’ai terminé l’analyse de vos deux documents.

Ce qui change vraiment : votre offre “Audit express” représente une entrée
beaucoup plus importante que je ne le pensais et mérite probablement une place
directe dans la navigation.

J’ai ajusté la Candidate en conséquence.

Vous n’avez rien à faire pour le moment.

[Voir ce qui a changé]
```

Ne pas montrer une timeline de tous les traitements.

---

# 18. Règles de densité mobile

Pour éviter de perdre le novice :

1. orientation avant tout ;
2. action humaine visible sans scroller lorsqu’elle existe, sauf contenu critique exceptionnel ;
3. `Pourquoi` limité à une idée principale par défaut ;
4. `Ensuite` une phrase ;
5. `Acquis` replié après 3 éléments ;
6. sources repliées sauf conflit ;
7. composer toujours accessible ;
8. une seule surface de travail détaillée ouverte à la fois ;
9. les progress signals précédemment lus se condensent ;
10. aucune colonne latérale compressée sur mobile.

---

# 19. Règles d’interaction

### Une réponse humaine

`persist → delta moteur → feedback conséquence → recalcul projection`

Pas :

`réponse → écran suivant`.

### Correction d’un acquis

`correction → provenance humaine → supersession ciblée → recalcul dépendances affectées`.

### Nouveau message libre

Le message peut modifier n’importe quel domaine ; il n’est jamais forcé dans le sujet visible courant.

### Nouvelle source

La source apparaît comme disponible immédiatement après persistance ; son analyse peut continuer sans bloquer.

### Action IA facultative demandée par utilisateur

Ex. `La challenger` active une capacité ; elle ne crée pas un nouveau mode permanent.

---

# 20. Navigation interne candidate

À ce stade, ne pas figer de tabs `Compréhension / Recherche / Proposition / Décision` car ils risquent de recréer les Outputs comme étapes visibles.

Navigation minimale candidate :

- workspace principal ;
- mémoire / acquis ;
- sources ;
- historique/version si besoin ;
- partage/collaboration lorsqu’activé.

Les Outputs matérialisés apparaissent comme **objets utiles dans le workspace**, pas comme destinations obligatoires.

Cette décision devra être retestée lorsque O3/O4/O7 auront des surfaces plus riches.

---

# 21. Critères de validation de ces wireframes

Le prochain prototype doit démontrer :

- Nathalie sait quoi répondre sans comprendre le système ;
- `Je ne sais pas` produit une vraie issue ;
- Vincent comprend que le système travaille sans avoir à cliquer ;
- l’absence d’action humaine ne ressemble pas à un écran vide ;
- un conflit rend la provenance visible sans surcharger les cas simples ;
- une réponse produit un changement perceptible dans le même workspace ;
- la surface ne ressemble jamais à un wizard ;
- les traitements parallèles ne deviennent pas un tableau de jobs ;
- la densité mobile reste maîtrisée ;
- la Candidate peut apparaître quand elle devient utile sans “passage d’étape” ;
- Decision Brief peut devenir dominant sans transformer GO en issue privilégiée.

---

# 22. Verdict de conception V0.1

Une **structure de workspace commune** semble viable pour les états testés.

Le principe retenu pour le prototype est :

> **surface stable + projection dominante adaptative + progrès par conséquences + mémoire compacte + composer permanent.**

Les scénarios Nathalie, Vincent et conflit B2B/B2C ne nécessitent pas trois interfaces différentes ; ils nécessitent trois contenus/hiérarchies différents dans le même contrat de surface.

Statut maintenu : **CANDIDATE** jusqu’à test/prototype fonctionnel et validation explicite.
