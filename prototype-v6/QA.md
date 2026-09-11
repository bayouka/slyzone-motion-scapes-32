# 2b2c V6 — QA du prototype isolé

## Statut

- Branche : `v6-prototype`
- Production de référence inchangée : `v4.5.12-work-p1 / build 519`
- Aucun fichier runtime ou transport modifié par cette branche.
- `prototype-v6/app.js` : contrôle syntaxique Node passé avant publication.
- E2E navigateur automatisé : non exécuté dans l’environnement courant ; ne pas le considérer comme validé.

## Parcours à valider visuellement

### Q1 — Home → action conditionnante
1. Ouvrir Home.
2. Comprendre en moins de 10 secondes pourquoi Orbit demande une intervention.
3. Cliquer `Continuer Orbit`.
4. Retrouver la même priorité dans la Vue d’ensemble projet.

Attendu : Maintenant, cause, conséquence et Ensuite restent cohérents.

### Q2 — Projets → Orbit
1. Ouvrir Projets.
2. Identifier sans ouvrir le projet qu’Orbit est bloqué.
3. Comprendre la cause du blocage.
4. Ouvrir Orbit.

Attendu : la carte projet n’est pas un tableau de KPI ; elle permet de décider où agir.

### Q3 — Projet → Travail / Roadmap
1. Ouvrir Orbit.
2. Passer à Travail.
3. Comprendre pourquoi `Validation maquette V2` est prioritaire.
4. Passer à Roadmap.
5. Retrouver la conséquence sur Tests.

Attendu : Travail = exécuter ; Roadmap = comprendre le chemin.

### Q4 — Agenda transverse
1. Ouvrir Agenda.
2. Vérifier qu’une validation, une réunion et un jalon peuvent apparaître dans la même temporalité.

Attendu : Agenda n’est plus un simple historique de réunions.

### Q5 — Messages contextualisés
1. Ouvrir Messages.
2. Vérifier que la conversation Orbit conserve le fichier/version dans le contexte.
3. Envoyer un message simulé.

Attendu : la communication ne devient pas un silo séparé du projet.

### Q6 — Fichiers / livrables
1. Ouvrir Fichiers.
2. Repérer `Maquette_v2.fig` et son statut `À valider`.
3. Distinguer recherche globale et futur workflow Ressources du projet.

### Q7 — Responsive mobile
Largeur cible <= 760 px :
- sidebar masquée ;
- topbar compacte ;
- dock Home / Projets / Travail / Messages / Plus ;
- Home, Projet, Travail et Roadmap lisibles sans modèle mental différent ;
- aucune table critique ne doit nécessiter une information invisible pour comprendre l’état.

## Critères de Gate prototype

Le prototype ne peut autoriser l’implémentation runtime que si :

- un utilisateur non formé comprend Maintenant → Pourquoi → Ensuite ;
- Home et Vue projet ne donnent jamais deux priorités différentes ;
- les blocages ont une cause et une conséquence ;
- Travail et Roadmap ont des rôles distincts ;
- Agenda est transverse ;
- les objets liés conservent leur provenance visible ;
- le mobile conserve la même logique métier ;
- aucun écran secondaire ne réintroduit une multiplication de vues ou de réglages sans valeur.
