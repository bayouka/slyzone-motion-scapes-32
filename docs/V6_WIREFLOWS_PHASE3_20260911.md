# 2b2c — Gate UX V6 — Phase 3 — Wireflows critiques — 2026-09-11

## Statut

Document de conception, **non déployé**. Baseline de production conservée : **v4.5.12-work-p1 / build 519**.

Objectif : vérifier que l’architecture V6 décidée en Phase 2 fonctionne dans les parcours réels, avant maquettes haute fidélité et avant toute modification du runtime.

## Règles communes

Chaque parcours doit :

- proposer une prochaine action évidente ;
- conserver le contexte déjà connu ;
- éviter les écrans de configuration intermédiaires sans valeur ;
- afficher les conséquences d’un choix avant validation ;
- ne jamais exposer les concepts techniques de permissions ;
- fonctionner en desktop et mobile avec la même logique métier ;
- utiliser des états d’erreur explicites sans perte du formulaire ;
- respecter Owner/Admin/Member/Guest et Team/Restricted.

Le mobile n’est pas une réduction du desktop : il priorise Maintenant → Action → Ensuite.

---

# WF1 — Rejoindre une équipe

## But utilisateur

« J’ai reçu un lien 2b2c. Je veux comprendre ce qu’on m’invite à rejoindre et commencer sans demander d’aide. »

## Entrée

Lien personnel `?invite=...`.

## Écran A — Aperçu d’invitation avant connexion

Afficher :

- logo 2b2c ;
- nom de l’espace ;
- email invité masqué si visiteur anonyme ;
- rôle en langage clair : Membre / Administrateur / Invité externe ;
- explication courte de ce que ce rôle implique ;
- projets seulement si l’identité connectée est autorisée à voir le détail ;
- expiration/statut si pertinent.

CTA principal : **Continuer avec cette invitation**.

CTA secondaire : Se connecter si compte existant.

Ne pas demander de choisir un workspace, un access mode ou des projets.

## Branche A1 — Aucun compte

Invitation → Créer mon compte.

Formulaire minimal :

- nom affiché ;
- mot de passe / mécanisme Auth actuel ;
- email prérempli et non ambigu.

Après authentification : acceptation automatique si l’email correspond exactement à l’invitation.

## Branche A2 — Compte existant, bon email

Connexion → acceptation → arrivée dans l’espace.

## Branche A3 — Mauvais compte connecté

Écran bloquant mais compréhensible :

`Cette invitation est destinée à f***@domaine.fr. Vous êtes connecté avec j***@domaine.fr.`

CTA : **Changer de compte**.

Aucune possibilité de forcer l’acceptation.

## Écran B — Bienvenue contextuelle

Une seule fois après acceptation :

- `Vous avez rejoint [Espace]` ;
- rôle expliqué ;
- projets accessibles ;
- si Guest : « Vous voyez uniquement les projets explicitement partagés avec vous. » ;
- si Member : « Les projets Équipe vous sont accessibles automatiquement. »

CTA principal :

- si une action/demande existe déjà → **Voir ce qui m’attend** ;
- sinon → **Découvrir mes projets**.

## Sortie

Home avec le nouvel espace actif.

## Mobile

Aperçu → auth → bienvenue en cartes simples plein écran ; pas de drawer/sidebar pendant l’onboarding.

## Critères de succès

- l’utilisateur sait qui l’invite et ce qu’il pourra voir ;
- aucun choix de permission ne lui est demandé ;
- mauvais email impossible à contourner ;
- première destination pertinente en un CTA.

---

# WF2 — Créer un projet immédiatement exploitable

## Acteur

Owner/Admin ou Member autorisé selon le modèle actuel. Guest exclu.

## Entrées

- bouton `Nouveau projet` depuis Projets ;
- bouton global Créer → Projet.

## Principe

Éviter le formulaire administratif long. La création doit fournir juste assez de structure pour rendre le projet utilisable immédiatement.

## Écran A — Étape 1 : le résultat

Champs :

- Nom du projet ;
- Résultat attendu / objectif concret ;
- Date cible facultative.

Exemple sous le champ résultat :

`Ex. Version testable validée par 6 utilisateurs.`

CTA : **Continuer**.

## Écran B — Étape 2 : qui doit y avoir accès ?

Deux choix explicites sous forme de cartes radio :

### Projet d’équipe — recommandé

`Tous les membres internes actuels et futurs de l’espace y ont accès.`

Aucun sélecteur de membres présenté comme contrôle d’accès.

### Projet restreint

`Seules les personnes internes choisies y participent, en plus des droits d’administration de l’espace.`

Affiche alors le sélecteur des membres internes concernés.

Les Guests ne sont pas ajoutés dans ce sélecteur. Partage externe après création, depuis le projet.

CTA : **Continuer**.

## Écran C — Étape 3 : le chemin initial

Titre : `Comment arriver au résultat ?`

Proposition par défaut de 3 à 5 étapes éditables, une par ligne.

Exemple :

1. Cadrage
2. Production
3. Vérification
4. Livraison

Possibilités : renommer, supprimer, ajouter jusqu’à une limite raisonnable recommandée 3–7.

Aucun Gantt, aucune dépendance complexe à ce stade.

CTA principal : **Créer le projet**.

## Résultat serveur

Création atomique via workflow existant :

- projet ;
- scope Team/Restricted ;
- lead créateur ;
- participants explicites si Restricted ;
- jalons initiaux ;
- premier jalon actif / suivants à venir selon contrat actuel.

## Écran D — Vue d’ensemble du projet créé

Ne pas afficher un « succès » intermédiaire bloquant.

Arrivée directe sur Vue d’ensemble avec :

- résultat ;
- trajectoire ;
- première étape active ;
- bloc `Maintenant` vide orienté action : `Définissez la première action qui fera avancer Cadrage.`

CTA : **Créer la première action**.

## Erreurs

### Nom/résultat manquant

Inline, pas d’alert générique.

### Participant Restricted invalide

Conserver toutes les saisies et expliquer la personne concernée.

### Conflit serveur

Message contrôlé ; aucune création partielle visible.

## Mobile

Wizard vertical 3 écrans, barre de progression `1 Résultat / 2 Accès / 3 Étapes`, gros CTA bas d’écran.

## Critères de succès

- utilisateur novice comprend Team vs Restricted ;
- aucune confusion participants/responsabilités ;
- projet créé avec un chemin, pas un conteneur vide ;
- première action évidente après création.

---

# WF3 — Reprendre un projet après une absence

## But

« Je reviens après quelques jours : qu’est-ce qui a changé et que dois-je faire ? »

## Entrée principale

Home.

## Écran A — Home

Ordre :

1. Maintenant ;
2. Reprendre ;
3. Bientôt ;
4. Depuis votre dernière visite.

### Maintenant

Le moteur de priorité choisit les interventions réellement attendues :

- blocage dont l’utilisateur peut agir sur la cause ;
- validation ;
- demande ;
- action urgente ;
- préparation imminente.

Le premier élément a une formulation causale :

`Valider Maquette V2 — Orbit est bloqué avant Tests.`

Pas seulement `Validation en attente`.

### Reprendre

Une recommandation forte :

`Reprendre Orbit`

Raison :

`Votre validation est la condition de passage vers Tests.`

CTA : **Continuer Orbit**.

## Écran B — Vue d’ensemble projet

L’utilisateur retrouve immédiatement la même logique :

- trajectoire ;
- nœud actif ;
- Maintenant ;
- Ensuite.

Exemple :

**Maintenant** — `Valider Maquette V2`

**Ensuite** — `Démarrer le jalon Tests`.

CTA concret : **Examiner la version**.

## Écran C — Action métier

Route vers Ressources V2 / validation exacte de la version.

Après décision : retour cohérent, rafraîchissement de la situation du projet.

Si la validation débloque la suite, l’utilisateur voit :

`Validation terminée. Tests peut maintenant démarrer.`

CTA : **Voir la prochaine étape**.

## Cas sans intervention personnelle

Home recommande le projet ayant la meilleure raison de reprise : étape proche de sa cible, activité importante, projet mené par l’utilisateur, etc.

La recommandation doit expliquer pourquoi.

## Cas utilisateur à jour

Ne pas inventer une urgence. Afficher :

`Rien ne demande votre intervention. Vous pouvez reprendre Orbit : prochaine étape Tests.`

## Mobile

Home réduit chaque item à cause + action. Vue projet place Maintenant/Ensuite avant mémoire et métriques.

## Critères de succès

- moins de 10 secondes pour savoir quoi faire ;
- Home et Vue projet donnent la même priorité ;
- route directe vers l’action réelle ;
- après action, le prochain mouvement devient visible.

---

# WF4 — Travailler, collaborer et résoudre un blocage

## Scénario

Une action `Intégrer le paiement` est assignée à Marc et dépend d’une information détenue par Julie.

## Écran A — Travail projet

Section `Maintenant` :

- actions bloquantes ;
- urgentes ;
- miennes ;
- reste du jalon actif.

Marc ouvre `Intégrer le paiement`.

## Écran B — Détail Action

Affiche :

- titre ;
- jalon ;
- responsable ;
- priorité ;
- échéance ;
- description ;
- état ;
- contexte source éventuel ;
- blocage et cause si présent.

Action simple inline : état.

Actions secondaires : Modifier / Message lié / Créer une demande si une réponse formelle est attendue.

## Blocage

Marc passe l’action à `Bloquée`.

Le système exige une cause.

Exemple :

`Attente des identifiants sandbox de Julie.`

Après validation :

- état bloqué visible dans Travail ;
- Vue projet explique l’impact ;
- Home remonte le blocage seulement aux personnes pour lesquelles une intervention est pertinente.

## Transformer le besoin en Demande

CTA : **Demander à Julie**.

Formulaire prérempli :

- projet = courant ;
- destinataire = Julie ;
- titre = `Identifiants sandbox paiement` ;
- source = action courante ;
- échéance facultative.

L’utilisateur écrit le besoin, envoie.

## Côté Julie

Home / Mon travail :

`Marc attend votre réponse — Identifiants sandbox paiement`.

Julie répond à la Demande.

## Côté Marc

La réponse apparaît dans Mon travail / contexte de la Demande.

CTA : **Reprendre l’action**.

Marc retire le blocage / passe En cours.

## Message vs Demande

Un message reste conversationnel.

Une Demande est utilisée parce qu’une réponse précise conditionne la suite et doit être suivie.

Aucun doublon manuel : source/action reste liée.

## Décision éventuelle

Si l’échange produit un choix durable : transformer le message/réunion en **Décision**.

La décision mémorise choix + justification dans le projet, pas uniquement dans le fil.

## Mobile

Action → bouton état → cause → `Demander à…` dans une feuille d’action. Home de Julie ouvre directement la Demande.

## Critères de succès

- blocage a une cause, pas seulement une couleur rouge ;
- la personne attendue est identifiable ;
- Demande et Message ont des rôles différents ;
- la résolution fait évoluer Maintenant/Ensuite automatiquement ;
- aucune information critique ne doit être ressaisie entre objets liés.

---

# WF5 — Livrer → faire valider → réviser

## Scénario

L’équipe doit faire valider `Maquette application` par une personne interne ou un Guest/client.

## Entrée

Projet > Ressources.

## Écran A — Ressources & Livrables

Deux zones explicitement distinctes :

1. Ressources de travail ;
2. Livrables.

CTA principal de zone Livrables : **Nouveau livrable**.

## Écran B — Créer le livrable

Champs :

- titre ;
- description courte facultative ;
- fichier ;
- visibilité initiale maîtrisée.

Résultat : livrable + v1 atomique/server-side selon workflow actuel.

## Écran C — Carte livrable

Doit rendre immédiatement visibles :

- version actuelle `v1` ;
- fichier actuel ;
- état validation ;
- partage interne/externe ;
- historique versions repliable.

CTA : **Demander validation**.

## Écran D — Demande de validation

Afficher explicitement :

`Vous demandez une validation de Maquette application — v1.`

Sélection du validateur.

Si Guest/client :

`Cette version précise sera partagée avec l’invité. Les futures versions resteront privées jusqu’à nouveau partage/validation.`

Critères/message facultatif.

CTA : **Envoyer v1 pour validation**.

## Côté validateur

Home / Mon travail :

`Maquette application v1 attend votre validation.`

CTA : **Examiner v1**.

Écran décision :

- fichier/version ;
- demande initiale ;
- historique utile ;
- Approuver ;
- Demander modifications.

Si modifications : commentaire obligatoire.

## Retour équipe — modifications demandées

Carte livrable :

- v1 = `Modifications demandées` ;
- décision/commentaire figés ;
- CTA : **Ajouter une nouvelle version**.

Impossible de transformer v1 en nouvelle version.

## Nouvelle version

Upload → v2 serveur.

Historique :

- v2 actuelle, interne par défaut selon règles ;
- v1 conservée + décision précédente.

Nouvelle demande de validation cible explicitement v2.

## Approbation

Après approbation v2 :

- v2 = Approuvée ;
- Vue projet/Livrable actuel reflète cet état ;
- clôture peut proposer v2 comme version de référence finale.

## Mobile

Carte livrable compacte avec `v2 · Approuvée`, historique en accordéon, décision dans une feuille plein écran.

## Critères de succès

- aucune ambiguïté sur la version examinée ;
- historique jamais écrasé ;
- Guest ne reçoit pas une future version automatiquement ;
- demande de modifications impose une nouvelle version ;
- validation remonte au bon utilisateur et au bon projet.

---

# WF6 — Clôturer, retrouver la mémoire, réouvrir

## But

Transformer la fin du travail en résultat traçable, pas seulement en changement de statut.

## Entrée

Vue d’ensemble projet > menu Gérer / Terminer le projet.

## Écran A — Pré-vérification

Le système calcule :

- actions ouvertes ;
- jalons ouverts ;
- demandes ouvertes ;
- validations en attente ;
- livrables et versions candidates finales.

### Validations en attente

Blocage dur de clôture si le contrat serveur le prévoit :

`1 validation attend encore une décision.`

CTA : **Traiter la validation**.

### Engagements ouverts

Si clôture autorisée avec engagements ouverts : expliquer les éléments et demander confirmation + ce qu’il reste à transmettre/traiter.

## Écran B — Résultat obtenu

Champ obligatoire :

`Quel résultat a réellement été obtenu ?`

Exemple :

`Prototype mobile validé par le client et prêt pour développement.`

## Écran C — Versions finales de référence

Liste uniquement les versions réellement candidates.

Chaque ligne :

- livrable ;
- numéro de version ;
- état de validation ;
- fichier.

L’utilisateur sélectionne les versions exactes qui constituent la livraison finale.

Explication :

`2b2c conservera ces versions exactes dans l’historique, même si le projet est réouvert plus tard.`

CTA : **Terminer le projet**.

## Écran D — Projet terminé

Vue d’ensemble se transforme en mémoire :

- résultat ;
- date de clôture ;
- versions finales ;
- décisions importantes ;
- synthèses de réunions ;
- trajectoire achevée ;
- éventuels engagements transmis.

CTA principal selon droit : **Consulter la livraison**.

CTA secondaire : Réouvrir.

## Réouverture

Confirmation :

`Réouvrir crée une nouvelle période de travail. La livraison #1 et ses versions de référence resteront inchangées.`

Après réouverture :

- projet actif ;
- historique de clôture conservé ;
- nouvelles versions/actions possibles ;
- ancienne livraison jamais modifiée.

## Mobile

Wizard de clôture en 3 étapes : Vérifier → Résultat → Références. Éviter une modal trop longue.

## Critères de succès

- aucune clôture accidentelle ;
- résultat final compréhensible hors contexte ;
- versions exactes conservées ;
- réouverture n’efface pas la mémoire ;
- projet terminé reste utile à une personne qui le consulte plusieurs mois après.

---

# Matrice des transitions principales

| Depuis | Action | Vers |
| --- | --- | --- |
| Invitation | Accepter | Bienvenue → Home |
| Home | Traiter validation | Ressources / version exacte |
| Home | Continuer projet | Vue d’ensemble projet |
| Projets | Nouveau projet | Wizard projet |
| Projet créé | Créer première action | Travail |
| Vue projet | Continuer | Action/validation/demande conditionnante |
| Travail | Bloquer | Action bloquée + cause |
| Action bloquée | Demander à quelqu’un | Demande liée |
| Message | Transformer en action | Travail / action liée |
| Message/Réunion | Consigner décision | Mémoire projet |
| Ressources | Demander validation | Validation version exacte |
| Validation changements | Nouvelle version | vN+1 |
| Projet | Terminer | Vérification clôture |
| Projet terminé | Réouvrir | Projet actif + historique conservé |

---

# États vides essentiels à concevoir

## Home sans attention

`Vous êtes à jour.` + projet recommandé ou prochaine échéance réelle.

## Aucun projet

Explication d’une phrase + CTA Nouveau projet.

## Projet sans action

Vue d’ensemble montre la première étape et CTA Créer la première action.

## Mon travail vide

`Rien ne dépend de vous actuellement.` Ne pas pousser à créer artificiellement une tâche.

## Messages vides

Expliquer audiences possibles + CTA conversation.

## Agenda vide

`Rien de prévu dans les 7 prochains jours.`

## Ressources vides

Deux états distincts : aucune ressource / aucun livrable.

## Réunions vides

`Aucun point planifié. Créez une réunion uniquement lorsqu’un échange synchrone est utile.`

---

# Erreurs UX transverses

## Session expirée

Conserver l’intention/route si possible, demander reconnexion, revenir au contexte.

## Permission perdue

`Vous n’avez plus accès à ce projet.` + retour Projets. Ne pas afficher une page cassée.

## Objet supprimé entre-temps

`Cet élément n’existe plus ou n’est plus accessible.` + contexte parent.

## Conflit de statut

Ne pas prétendre succès ; rafraîchir l’objet et expliquer ce qui a changé.

## Hors ligne / sync échouée

État visible + Réessayer ; ne jamais fabriquer un état enregistré.

---

# Tests utilisateurs dérivés des wireflows

Un testeur non formé doit pouvoir :

1. accepter une invitation et expliquer son niveau d’accès ;
2. créer un projet Team avec quatre étapes sans aide ;
3. revenir sur Home et identifier l’action la plus importante en moins de 10 secondes ;
4. bloquer une action, demander l’information à la bonne personne puis reprendre le travail ;
5. créer un livrable, demander validation, comprendre pourquoi une v2 est nécessaire après corrections ;
6. terminer un projet en identifiant les versions finales puis retrouver la livraison dans l’historique.

Mesurer :

- réussite sans aide ;
- temps jusqu’au premier clic correct ;
- hésitations/navigation arrière ;
- vocabulaire mal compris ;
- clics vers des destinations non pertinentes ;
- capacité à expliquer « Maintenant » et « Ensuite » avec ses propres mots.

---

# Décision de sortie de Phase 3

Phase 3 est prête pour revue lorsque :

- les six parcours ne présentent pas de destination concurrente ;
- chaque étape conserve le contexte déjà connu ;
- Team/Restricted/Guest sont compréhensibles sans jargon ;
- les objets Message/Demande/Décision/Action ne se confondent pas ;
- Ressource/Livrable/Version/Validation ont une chaîne claire ;
- clôture/réouverture protège la mémoire ;
- desktop et mobile partagent le même modèle mental.

## Suite

**Phase 4 — maquettes V6 haute fidélité et prototype cliquable**, dans cet ordre :

1. Home ;
2. Projets ;
3. Vue d’ensemble projet ;
4. Travail/Roadmap ;
5. Agenda ;
6. parcours création projet ;
7. Ressources/validation ;
8. onboarding invitation.

Messages, Réunions, Équipe et Paramètres sont ensuite harmonisés avec le design system validé plutôt que réinventés avant les écrans structurants.
