# 2b2c — V6 — Prototype cliquable & Gate d’implémentation — 2026-09-11

## Statut

Document de conception et validation. **Non déployé.** Production reste `v4.5.12-work-p1 / build 519` jusqu’à passage explicite de cette gate.

## 1. Objectif

Construire un prototype suffisamment complet pour valider la logique V6 avant de modifier le runtime. Le prototype ne doit pas simuler toutes les fonctions du backend : il doit prouver les parcours, la hiérarchie, les états, les transitions et le modèle mental.

## 2. Écrans obligatoires du prototype

### Structurants

1. Home
2. Projets
3. Vue d’ensemble projet
4. Travail
5. Roadmap

### Secondaires critiques

6. Agenda
7. Messages
8. Ressources / Livrables
9. Validation d’une version
10. Réunions
11. Équipe / Invitations
12. Onboarding invitation
13. Wizard création projet
14. Clôture / archive
15. Recherche globale

### Paramètres

Un écran représentatif suffit pour valider le Design System ; les sous-pages complètes peuvent être implémentées plus tard.

## 3. États à prototyper

Pour chaque zone structurante au minimum :

- état normal ;
- état vide ;
- blocage/attention ;
- erreur/inaccessible ;
- terminé/archivé si pertinent ;
- mobile normal ;
- mobile état critique si différent.

## 4. Six scénarios prototype obligatoires

### P1 — Invitation → première action

Lien invitation → aperçu → connexion/création → bienvenue → Home → élément qui attend l’utilisateur.

Valider : identité, rôle compris, aucune permission technique exposée.

### P2 — Créer un projet

Projets → Nouveau projet → Résultat → Accès → Chemin → Vue projet → Première action.

Valider : projet immédiatement exploitable, Team/Restricted compris.

### P3 — Revenir après absence

Home → Mets-moi à jour / Maintenant → projet recommandé → Vue projet → action réelle → état mis à jour → Ensuite.

Valider : priorité cohérente et formulation causale.

### P4 — Blocage collaboratif

Travail → action → Bloquer + raison → Demander à une personne → destinataire voit la demande → réponse → reprise action.

Valider : Message ≠ Demande, provenance conservée.

### P5 — Livrable et validation

Ressources → Livrable v1 → Demander validation → validateur → Modifications → v2 → nouvelle validation → Approuvée.

Valider : version exacte, historique immuable, externe maîtrisé.

### P6 — Clôture et mémoire

Vue projet → Terminer → pré-vérification → résultat → versions finales → projet terminé → consulter mémoire → réouvrir.

Valider : ancienne livraison inchangée et contexte historique compréhensible.

## 5. Règle « 10 secondes »

Sur Home et Vue projet, un utilisateur non formé doit pouvoir répondre en moins de 10 secondes à :

1. Qu’est-ce qui compte maintenant ?
2. Pourquoi ?
3. Que dois-je faire ?
4. Qu’est-ce que cela débloquera ?

Sur Projets : quel projet mérite l’attention et pourquoi ?

Sur Travail : quelle action exécuter et qu’est-ce qui la bloque ?

## 6. Critères UX mesurables

Pour chaque testeur :

- taux de réussite sans aide ;
- temps jusqu’au premier clic correct ;
- nombre de retours arrière ;
- mauvais onglet choisi ;
- vocabulaire mal compris ;
- capacité à expliquer Maintenant/Ensuite avec ses propres mots ;
- capacité à distinguer Message/Demande/Décision/Action ;
- capacité à distinguer Ressource/Livrable/Version/Validation.

Cible initiale :

- 5 testeurs minimum ;
- 80 % de réussite sans aide sur les actions principales ;
- aucune confusion systémique commune à 2 testeurs ou plus avant implémentation.

## 7. Vérifications responsive

### Desktop référence

1440 × 900.

### Mobile référence

390 × 844.

### À vérifier

- un seul H1 ;
- dock mobile limité ;
- drawer secondaire ;
- CTA principal accessible ;
- roadmap verticale mobile ;
- feuilles/panneaux ne débordent pas ;
- aucune table illisible ;
- formulaires conservés après erreur ;
- focus et fermeture des overlays cohérents.

## 8. Gate d’entrée en développement

Le développement V6 ne commence que si :

1. Design System appliqué aux écrans structurants et secondaires critiques ;
2. les 6 scénarios sont navigables dans le prototype ;
3. aucune destination concurrente majeure n’existe ;
4. Home/Projet/Travail utilisent la même notion de priorité ;
5. Maintenant/Pourquoi/Ensuite est cohérent ;
6. provenance et conséquences sont représentées au moins conceptuellement ;
7. mobile a été conçu spécifiquement ;
8. Ressources/Livrables/Validation restent sans ambiguïté ;
9. Team/Restricted/Guest sont compréhensibles ;
10. les tests utilisateurs n’ont pas de problème P0 ouvert.

## 9. Plan technique après validation du prototype

Avant code, produire une matrice par écran :

| Changement | Type | Backend | Risque |
| --- | --- | --- | --- |
| pure présentation | CSS/render | aucun | faible |
| nouveau renderer | frontend | RPC existants | moyen |
| nouvelle relation/provenance | données | migration possible | moyen/haut |
| nouvel objet métier | backend | migration + RLS + RPC | haut |

Principe : réutiliser le backend build 519 chaque fois que possible.

## 10. Ordre d’implémentation recommandé

### Lot A — fondations V6

- tokens/Design System ;
- shell desktop/mobile ;
- navigation ;
- composants structurants ;
- accessibilité de base.

### Lot B — écrans structurants

1. Home V6
2. Projets V6
3. Vue projet V6
4. Travail/Roadmap V6

### Lot C — contexte temporel et collaboration

5. Agenda V6
6. Messages harmonisés
7. Réunions harmonisées

### Lot D — livraison et accès

8. Ressources/Livrables V6
9. Validation V6
10. Équipe/Invitations V6
11. Onboarding

### Lot E — mémoire et clôture

12. clôture/archive ;
13. timeline significative ;
14. recherche globale harmonisée ;
15. premiers enrichissements de provenance si réellement nécessaires.

## 11. Stratégie de release

Aucun changement prod pendant la phase prototype.

Le premier build runtime V6 sera numéroté seulement lorsqu’un lot cohérent est prêt. `build 520` est réservé à la première modification runtime suivant cette gate, pas aux documents de conception.

Chaîne obligatoire :

1. source canonique `bayouka/slyzone-motion-scapes-32` ;
2. `npm ci` ;
3. `npm run check` ;
4. tests ciblés ;
5. mirror validé vers `bayouka/2b2c/4b4c/` ;
6. mise à jour `TRANSPORT_RELEASE.txt` ;
7. Cloudflare Workers Build via script direct ;
8. déploiement explicite Worker `4b4c` ;
9. `/health` + smoke runtime ;
10. déclaration de succès uniquement après vérification prod.

GitHub Actions restent exclus.

## 12. Rollback

Build 519 reste le rollback certifié tant qu’une nouvelle release n’a pas passé entièrement la chaîne de certification.

## 13. Ce qui reste volontairement hors scope avant V6 stable

- IA conversationnelle générique ;
- Project Intelligence automatisée complète ;
- whiteboard/Atelier ;
- Inbox universelle ;
- clips vidéo avancés ;
- nouveau modèle de facturation ;
- gros refactor de `live.js` sans besoin produit et couverture E2E.

## 14. Décision de sortie

Quand cette gate est validée, le projet passe de **Conception V6** à **Implémentation V6 contrôlée**. Jusqu’à cette validation, la priorité est de corriger le prototype et la logique, pas le runtime de production.
