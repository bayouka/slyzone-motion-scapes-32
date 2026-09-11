# 2b2c — Gate UX V6 — Phase 3.5 — Convergence sélective myprojects → 4b4c — 2026-09-11

## Statut

Document de conception, **non déployé**. Baseline de production inchangée : **v4.5.12-work-p1 / build 519**.

Cette phase complète Phase 2 (architecture d'information), Phase 3 (wireflows) et les écrans de référence V6. Elle ne fusionne pas myprojects avec 4b4c et n'autorise pas l'import automatique de ses modules.

Objectif : récupérer de myprojects uniquement les principes qui rendent 4b4c plus simple, plus contextuel et plus différenciant.

---

# 1. Décision exécutive

La V6 de 4b4c ne doit pas seulement répondre à :

- Où en est le projet ?
- Que dois-je faire maintenant ?
- Quelle est la prochaine étape ?

Elle doit progressivement pouvoir répondre aussi à :

- **Pourquoi sommes-nous dans cette situation ?**
- **Qu'est-ce qui a provoqué ce blocage ou cette décision ?**
- **Qu'est-ce que cette action ou validation débloquera ?**
- **Quelle information est officielle et laquelle n'est qu'un échange ?**

La signature produit devient :

> **Contexte → Relations → Mémoire → Conséquences → Prochaine action.**

Cette logique doit rester invisible dans sa complexité. L'utilisateur voit une interface simple ; 2b2c conserve les relations en arrière-plan.

---

# 2. Principe fondamental importé : tout ce qui compte reste relié

Les objets du projet ne doivent pas fonctionner comme des silos.

Objets concernés :

- objectif / résultat attendu ;
- jalon / phase ;
- action ;
- demande ;
- message ;
- réunion ;
- décision ;
- ressource ;
- livrable ;
- version ;
- validation ;
- personne ;
- échéance / événement.

Relations métier utiles :

- **provient de** ;
- **répond à** ;
- **bloque** ;
- **dépend de** ;
- **débloque** ;
- **affecte** ;
- **remplace** ;
- **valide** ;
- **référence** ;
- **produit lors de** ;
- **partagé avec**.

Le graphe relationnel n'est **pas** une vue utilisateur à dessiner. Il constitue la mémoire structurelle qui permet ensuite d'expliquer le projet.

## Règle UX

Chaque relation affichée doit répondre à une question utile. Ne jamais afficher un graphe ou une chaîne complexe par principe.

Exemples :

- `Bloqué par : validation Maquette V2` ;
- `Cette décision remplace : Option A/B à confirmer` ;
- `Créée depuis : Réunion Sprint 3` ;
- `Débloque : 3 actions de Tests` ;
- `Version de référence : v3 approuvée le 11 septembre`.

---

# 3. Provenance : aucune transformation importante sans origine

Lorsqu'un objet est créé depuis un autre, l'origine doit pouvoir être retrouvée.

Exemples :

- message → action ;
- message → décision ;
- réunion → action ;
- réunion → décision ;
- demande → réponse → reprise d'action ;
- fichier/version → validation ;
- décision → changement de roadmap ;
- décision → actions affectées.

## Contrat produit

Une transformation ne doit pas créer une copie déconnectée.

L'interface pourra proposer :

- `Voir la source` ;
- `Voir pourquoi` ;
- `Voir ce que cela affecte`.

Ces actions restent secondaires. La provenance sert d'abord à la confiance, à la mémoire et à l'explication.

---

# 4. Mémoire causale

L'historique technique n'est pas la mémoire du projet.

## À éviter

- `Fred a modifié l'action #236` ;
- `Julie a ajouté un fichier` ;
- `Marc a changé un statut`.

## Cible V6

Regrouper les événements en changements métier compréhensibles.

Exemple :

### Prototype V3 validé

Julie a livré v3. Fred et Marc l'ont approuvée après la revue.

**Conséquences :**

- v3 devient la version de référence ;
- la phase Tests peut commencer ;
- 3 actions ne sont plus bloquées ;
- la cible de livraison reste inchangée.

Liens secondaires : `Voir la décision · Voir la discussion · Voir v3`.

## Règle

Une décision ou un état ancien ne disparaît pas lorsqu'il est remplacé. Il devient historique et indique ce qui l'a remplacé.

---

# 5. Vérité structurée vs conversation

2b2c doit distinguer :

### Conversation

Ce qui est discuté, proposé, questionné ou hypothétique.

### Vérité structurée du projet

Ce qui est officiellement enregistré comme :

- objectif ;
- responsabilité ;
- statut ;
- décision ;
- version ;
- validation ;
- jalon ;
- engagement.

## Règle

Un vieux message ne doit jamais devenir implicitement plus vrai qu'une décision officielle plus récente.

Cette distinction sera essentielle pour toute future Project Intelligence.

---

# 6. Décision comme objet de premier rang

La décision ne doit pas être un simple titre + commentaire.

Modèle produit cible :

- question / sujet ;
- options étudiées si pertinent ;
- choix retenu ;
- justification ;
- personnes impliquées ;
- date ;
- sources ;
- objets affectés ;
- décision remplacée éventuelle ;
- statut actuel / historique.

## Exemple UX

**Décision — Utiliser Stripe**

Pourquoi : intégration la plus compatible avec le besoin MVP.

Source : Réunion produit — 11 septembre.

Remplace : `Stripe ou Mollie à confirmer`.

Impact : phase Paiement · actions API / Checkout / Tests.

CTA secondaires : `Voir la source · Voir les impacts`.

## Priorité

Ne pas refaire immédiatement le backend. D'abord auditer le modèle actuel des décisions et les liens existants ; ajouter seulement ce qui manque au moment de l'implémentation V6.

---

# 7. Moteur d'attention : activité ≠ intervention

La Home, Mon travail et les notifications doivent partager le même moteur de priorité.

Classes métier :

1. **Intervention requise** — réponse, validation, décision, blocage dont l'utilisateur détient la clé ;
2. **Risque à traiter** — retard, dépendance, incohérence ou dérive probable ;
3. **À connaître** — changement important qui modifie le contexte ;
4. **Information** — activité regroupable dans l'historique.

## Règle

23 événements ne doivent pas générer 23 alertes.

Exemple cible :

`Pendant votre absence : 23 activités. 4 comptent réellement pour vous : 1 décision, 1 blocage, 1 validation et 1 échéance.`

---

# 8. « Mets-moi à jour » devient un comportement produit

Ce n'est pas nécessairement un bouton IA au lancement.

La V6 doit déjà organiser les données pour pouvoir produire un briefing fiable :

- objectif actuel ;
- étape active ;
- changements importants ;
- décisions récentes ;
- blocages ;
- ce qui concerne l'utilisateur ;
- prochaine échéance ;
- prochaine action recommandée ;
- sources consultables.

## Home

La Home devient la version automatique et courte de « Mets-moi à jour ».

## Nouveau membre

Après invitation, la bienvenue pourra progressivement montrer :

- pourquoi le projet existe ;
- où il en est ;
- ce qui a déjà été décidé ;
- rôle de la personne ;
- ce qu'elle doit faire en premier.

---

# 9. Project Intelligence — doctrine future, pas nouvelle page

Project Intelligence repose sur trois couches :

1. **Mémoire** — ce qui s'est passé ;
2. **Compréhension** — pourquoi, relations, dépendances, conséquences ;
3. **Action** — ce qui devrait probablement se produire ensuite.

Flux cible :

`Humains travaillent → 2b2c comprend → 2b2c propose → Humain valide`.

## Interdictions

- aucun onglet `IA` générique ;
- aucune galerie d'agents ;
- aucune modification importante silencieuse ;
- aucune transformation automatique de tous les messages en tâches ;
- aucune réponse historique sans possibilité de retrouver les sources ;
- aucune IA nécessaire au fonctionnement de base du produit.

## Modes futurs possibles

- sur demande par défaut ;
- suggestion discrète lorsqu'un bénéfice est évident ;
- facilitation renforcée uniquement dans un contexte explicitement choisi.

---

# 10. Conséquences sur les écrans V6

## Home

Avant : `Maintenant / Reprendre / Bientôt / Depuis votre dernière visite`.

Après convergence : même architecture, mais les contenus deviennent **causaux**.

Exemple :

`Valider Maquette V2 — votre décision bloque le passage en Tests.`

Et non : `1 validation en attente`.

`Depuis votre dernière visite` devient une timeline métier, pas un audit log.

## Projets

Chaque ligne doit pouvoir expliquer :

- Maintenant ;
- Ensuite ;
- raison d'attention ;
- condition de progression.

Une santé rouge sans explication est insuffisante.

## Vue d'ensemble projet

Le chemin devient la représentation visible d'une partie du modèle causal.

Sous le jalon actif :

- Maintenant ;
- Pourquoi ;
- Blocage/condition ;
- Ensuite ;
- Ce que l'action actuelle débloquera.

Ne pas afficher toutes les relations : seulement celles nécessaires pour décider.

## Travail

Le détail d'une action peut afficher :

- `Créée depuis` ;
- `Bloquée par` ;
- `Dépend de` ;
- `Débloque`.

Ces informations sont secondaires tant qu'elles ne changent pas la prochaine décision.

## Messages

Tout message important peut proposer une transformation volontaire :

- créer une action ;
- consigner une décision ;
- créer une demande ;
- ajouter à l'agenda/réunion.

La source reste liée.

## Réunions

Avant / Pendant / Après restent le contrat.

Après une réunion, la sortie n'est pas seulement un compte rendu :

- décisions ;
- actions ;
- questions ouvertes ;
- risques ;
- impacts proposés.

L'humain valide les transformations importantes.

## Ressources / Livrables

Conserver la chaîne forte actuelle :

`Livrable → Version exacte → Validation → Décision → Version suivante éventuelle → Référence finale`.

La provenance et l'historique de clôture sont déjà proches du modèle cible.

## Agenda

Agenda reste une projection temporelle des objets existants, jamais une deuxième base de données.

---

# 11. Archive : mémoire active, pas grenier

Un projet clôturé doit rester une référence compréhensible.

Conserver :

- résultat obtenu ;
- snapshot de clôture ;
- versions finales ;
- décisions importantes ;
- trajectoire ;
- sources utiles ;
- historique de réouverture.

Un nouveau commentaire sur un ancien projet ne doit pas le réactiver silencieusement.

Choix explicite :

- information de référence ;
- demander réouverture ;
- créer un projet dérivé.

---

# 12. Ce que 4b4c n'importe PAS de myprojects maintenant

Ne pas ajouter avant validation de la V6 :

- Atelier / whiteboard complet ;
- Inbox universelle ;
- Docs collaboratifs complets ;
- clips vidéo / vocal comme grand module ;
- planification IA automatique ;
- IA visible dans tous les écrans ;
- canvas → projet automatique ;
- partage externe objet par objet sans audit sécurité/UX ;
- fonctions client/budget/temps généralisées.

Ces idées restent candidates futures, pas backlog engagé.

---

# 13. Faisabilité avec le socle 4b4c actuel

Le socle actuel possède déjà plusieurs briques utiles :

- actions avec `source_type/source_id` sur certains parcours ;
- demandes liées au projet et utilisées pour résoudre des blocages ;
- décisions projet ;
- réunions contextualisées ;
- livrables + versions immuables + validations exactes ;
- historique de clôture ;
- conversations par projet / réunion / privé ;
- Home orientée attention ;
- Maintenant / Ensuite déjà présent dans les wireflows V6.

Conclusion : le modèle causal peut être construit **incrémentalement**. Il n'est pas nécessaire de remplacer Supabase ni de réécrire l'application.

Avant toute migration future, réaliser un inventaire exact des relations déjà persistées et de celles seulement déduites dans le frontend.

---

# 14. Contrat de conception pour Phase 4

Les maquettes haute fidélité doivent maintenant réussir ces tests supplémentaires :

1. L'utilisateur comprend **pourquoi** un élément apparaît dans Maintenant.
2. Un blocage indique sa cause ou la personne/condition attendue.
3. Une action importante peut montrer ce qu'elle débloque sans surcharger l'écran.
4. Une décision peut être retrouvée avec sa source et ses impacts.
5. La timeline raconte les changements du projet, pas les clics des utilisateurs.
6. Home et Vue projet racontent la même causalité.
7. Un projet clôturé reste compréhensible plusieurs mois après.
8. Aucune nouvelle complexité du modèle relationnel n'est exposée comme jargon utilisateur.

---

# 15. Priorités de convergence

## P0 — doit influencer les maquettes V6 immédiatement

- formulations causales de Maintenant ;
- Maintenant → Ensuite ;
- cause des blocages ;
- provenance visible à la demande ;
- timeline métier ;
- décision avec source/impact ;
- archive comme mémoire.

## P1 — préparer dans le modèle produit, implémenter progressivement

- relations `dépend de / débloque / affecte / remplace` structurées ;
- brief « Mets-moi à jour » ;
- transformation volontaire Message/Réunion → objets projet ;
- onboarding contextuel d'un nouveau membre.

## P2 — différenciation future

- Project Intelligence ;
- recherche causale ;
- détection proactive de risques ;
- analyse d'impact d'une décision ;
- comparaison/réutilisation de projets archivés.

---

# Décision de sortie Phase 3.5

La convergence est considérée suffisamment cadrée lorsque :

- myprojects et 4b4c restent deux projets distincts ;
- seuls les principes utiles à 4b4c sont importés ;
- aucune grosse nouvelle fonctionnalité n'est nécessaire pour concevoir la V6 ;
- les quatre écrans structurants peuvent exprimer cause → action → conséquence ;
- le modèle reste utilisable sans IA ;
- les futures propositions IA restent contrôlées, sourcées et validées par l'humain.

## Suite

**Phase 4 — maquettes V6 haute fidélité**, révisées avec le contrat Phase 3.5 :

1. Home ;
2. Projets ;
3. Vue d'ensemble projet ;
4. Travail / Roadmap ;
5. Agenda ;
6. création projet ;
7. Ressources / validation ;
8. invitation / onboarding.

Avant implémentation du Project Graph complet, faire un audit technique séparé des relations persistées existantes. Phase 4 ne dépend pas de cette migration.