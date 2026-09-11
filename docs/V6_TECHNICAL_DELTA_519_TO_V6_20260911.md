# 2b2c — Delta technique build 519 → V6 validée — 2026-09-11

## Statut

**Préparation technique autorisée. Aucun runtime V6 déployé.**

Baseline production à préserver : `v4.5.12-work-p1 / build 519`.

La Gate du prototype V6 a été validée sur la branche `v6-prototype`. Ce document traduit cette validation en changements techniques précis, sans changer les contrats métier fiables tant qu’un manque réel n’est pas démontré.

---

# 1. Doctrine

1. La V6 est une évolution du runtime 519, pas une réécriture.
2. Le backend Supabase, les RPC et les RLS restent inchangés dans la première tranche.
3. Les owners métier existants restent propriétaires des mutations.
4. `live.js` peut rester temporairement propriétaire du shell et des renderers pendant la migration.
5. Aucun handler historique n’est supprimé pour la seule propreté technique.
6. La causalité V6 commence par exploiter les liens existants ; aucune table de graphe universelle n’est créée par anticipation.
7. Chaque tranche doit pouvoir être retirée ou désactivée sans reconstruire le backend.
8. Pas de GitHub Actions ; pas de déploiement direct depuis la source canonique ; le transport Cloudflare actuel reste inchangé.

---

# 2. Contrats runtime build 519 à préserver

Load order actuel :

1. `live.js`
2. `project-access-v1.js`
3. `project-messages-route-v1.js`
4. `delivery-workflow-v1.js`
5. `meeting-workflow-v1.js`
6. `work-workflow-v1.js`
7. `workflow-backend-safe-v1.js`
8. `communication-workspace-v1.js`
9. `resources-workspace-v2.js`
10. `approval-route-v1.js`
11. `library-workspace-v1.js`

Owners à ne pas remplacer dans la première V6 :

- création projet / accès : `project-access-v1.js` ;
- actions / jalons / statuts : `work-workflow-v1.js` ;
- messages global/projet : `project-messages-route-v1.js` + `communication-workspace-v1.js` ;
- réunions : `meeting-workflow-v1.js` ;
- ressources / livrables / versions / validations : `resources-workspace-v2.js` + `approval-route-v1.js` ;
- clôture / réouverture : `delivery-workflow-v1.js` ;
- bibliothèque globale : `library-workspace-v1.js`.

---

# 3. Delta par domaine

## A. Shell + Design System

### Build 519
- shell, sidebar, topbar, navigation et état global dans `live.js` ;
- base historique dans `core-legacy-v455.css` ;
- DA courante dans `design-v5.css`.

### V6 validée
- même architecture générale desktop : sidebar persistante + topbar ;
- mobile : dock `Home / Projets / Travail / Messages / Plus` ;
- `Plus` expose Agenda, Fichiers, Équipe, Paramètres ;
- surfaces plus calmes, moins de glass/clay systématique ;
- hiérarchie de focus plus forte ;
- tokens V6 issus du Design System validé.

### Changement autorisé
- ajouter une couche CSS V6 dédiée, chargée après V5 pendant la transition ;
- modifier le shell uniquement pour le dock `Plus` et les libellés/nav nécessaires ;
- conserver tous les IDs/data attributes utilisés par les workflows actuels ;
- ajouter focus visible, reduced motion, tailles tactiles.

### Backend
**Aucun changement.**

---

## B. Home V6

### Build 519
- renderer Home dans `live.js` ;
- logique déjà orientée `À traiter`, reprise et activité récente.

### V6 validée
- `Maintenant → Pourquoi → Ensuite` ;
- `Mets-moi à jour` avec synthèse causale ;
- activité brute réduite aux changements qui modifient la trajectoire ;
- même priorité entre Home et Vue projet.

### Changement autorisé
- créer une couche de dérivation front `attention/catch-up` à partir des objets déjà chargés ;
- synthèse déterministe d’abord : validations attendues, actions bloquées/retard, réunions, jalons, décisions existantes ;
- afficher source/conséquence uniquement lorsqu’elles sont prouvées par les données.

### Interdit dans la première tranche
- LLM obligatoire pour rendre Home utile ;
- création automatique d’actions/décisions ;
- score opaque de priorité.

### Backend
**Aucun changement initial.** Audit ciblé uniquement si une relation nécessaire n’est pas disponible.

---

## C. Projets + Vue projet

### Build 519
- renderer et shared state principalement dans `live.js`.

### V6 validée
- Projets permet de décider où agir sans ouvrir chaque projet ;
- chaque projet expose état, Maintenant, Ensuite, échéance et cause d’un blocage si fiable ;
- Vue projet aligne objectif, Maintenant, Pourquoi, Ensuite, provenance et trajectoire.

### Changement autorisé
- nouveau renderer/markup V6 ou extraction légère d’un module de rendu ;
- conserver les données projet et contrats de création/accès actuels ;
- ne pas toucher à `create_project_with_access_setup_v1`.

### Backend
**Aucun changement initial.**

---

## D. Travail / Roadmap

### Build 519
- formulaires visuels dans `live.js` ;
- mutations capturées par `work-workflow-v1.js` ;
- legacy handlers encore physiquement présents.

### V6 validée
- seulement deux modèles mentaux principaux :
  - Travail = exécuter ;
  - Roadmap = comprendre le chemin.
- cause du blocage, provenance et objet débloqué visibles quand fiables ;
- contexte projet conservé dans la navigation.

### Changement autorisé
- remplacer le markup/rendu sans modifier les data attributes/form contracts attendus par `work-workflow-v1.js` ;
- conserver `create_action_v1`, `update_action_v1`, `set_action_status_v1`, `create_milestone_v1`, `update_milestone_v1` ;
- exploiter `source_type/source_id` déjà conservés par l’owner Work.

### Interdit
- remplacer l’owner Work ;
- suppression du bridge/legacy avant E2E authentifié ;
- création d’un nouveau modèle de tâches pour la V6.

### Backend
**Aucun changement initial.**

---

## E. Agenda transverse

### Build 519
- réunions et vues datées existent mais la lecture globale reste principalement orientée meeting/calendrier.

### V6 validée
Une même chronologie peut contenir :
- réunion ;
- action datée ;
- validation attendue ;
- jalon ;
- échéance importante.

### Changement autorisé
- créer un view-model Agenda en front à partir des collections déjà disponibles ;
- chaque objet conserve son type et son lien vers son owner réel ;
- mobile peut privilégier une chronologie/liste au lieu d’une grille semaine.

### Backend
**Pas de nouvelle RPC avant preuve que les données disponibles sont insuffisantes.**

---

## F. Fichiers / Ressources / Livrables / Validation

### Build 519
- bibliothèque globale : `library-workspace-v1.js` ;
- ressources projet, livrables, versions et approbations : `resources-workspace-v2.js` ;
- routing approbation : `approval-route-v1.js`.

### V6 validée
- `Fichiers` global = retrouver ;
- `Ressources` projet = travailler, versionner, faire valider ;
- mobile en cartes lisibles, pas table horizontale critique.

### Changement autorisé
- refonte présentation seulement ;
- conserver les RPC et le modèle de versions immuables ;
- conserver la distinction ressource de travail / livrable officiel.

### Backend
**Aucun changement.**

---

## G. Messages / Communication

### Build 519
- Communication V3 est owner effectif ;
- Project Messages route vers la conversation projet.

### V6 validée
- la conversation reste contextualisée ;
- fichier/version/source peuvent être montrés comme contexte ;
- pas de nouvel univers de messagerie projet séparé.

### Changement autorisé
- présentation/habillage ;
- ajout de cartes contextuelles seulement à partir de liens existants.

### Backend
**Aucun changement initial.**

---

## H. Réunions / Appels

### Build 519
- Meeting V2 owner des créations/updates/RSVP ;
- appels natifs restent dans `live.js` et nécessitent deux sessions pour refactor destructif.

### V6
- harmoniser la présentation avec le Design System ;
- conserver Avant / Pendant / Après ;
- conserver préjoin, sélection participants, ajout en cours d’appel, caméra et partage d’écran.

### Changement autorisé
- présentation uniquement dans les premières tranches.

### Interdit
- extraction destructive des appels avant couverture deux navigateurs.

---

## I. Équipe / Invitations / Accès

### Build 519
- frontend encore majoritairement dans `live.js` ;
- backend RPC/RLS déjà cohérent.

### V6 validée
- rôle et périmètre doivent être compréhensibles ;
- mobile ne doit pas masquer les informations de permission importantes.

### Changement autorisé
- refonte du rendu et du vocabulaire après inventaire exact ;
- réutiliser `create_workspace_invite_v2`, `accept_workspace_invite`, `set_workspace_member_access_v1`.

### Interdit
- extraction pour la seule propreté technique ;
- modification des règles Team/Restricted/Guest sans nouvelle Gate produit.

---

# 4. Causalité : ce qui existe déjà vs ce qui manque

## Réutilisable immédiatement

- action → `source_type/source_id` ;
- action → projet / milestone / assignees / statut ;
- approval → version exacte ;
- deliverable → versions ;
- meeting → projet / attendees / agenda ;
- conversation projet → projet ;
- lifecycle projet → closure/reopen ;
- décisions existantes lorsqu’elles sont déjà disponibles dans l’état.

## À calculer en front au début

- `Pourquoi maintenant ?` à partir d’un blocage, d’une validation ou d’une dépendance connue ;
- `Ensuite` à partir du jalon / étape suivante ;
- catch-up `Mets-moi à jour` à partir des événements utiles depuis la dernière visite lorsque l’information fiable existe ;
- classification Agenda par type d’objet.

## Schéma éventuellement manquant — audit avant migration

- relation générique `dépend de / débloque` entre objets hétérogènes ;
- décision structurée avec `remplace`, justification et liste d’objets impactés ;
- causalité persistée lorsqu’elle ne peut pas être reconstruite de façon fiable.

**Aucune migration de ces éléments n’est autorisée avant audit du schéma live et démonstration du besoin par la tranche UI.**

---

# 5. Ordre d’implémentation révisé après Gate prototype

## Build 520 candidat — Tranche A : Shell + Design System V6

Objectif : changer la grammaire visuelle et la navigation, sans mutation métier ni backend.

Fichiers candidats :
- nouveau `site/assets/design-v6.css` ;
- éventuel module shell/navigation V6 minimal seulement si le markup actuel ne suffit pas ;
- `site/index.html` pour charger V6 après V5 pendant transition ;
- quality checks pour marker/version.

Critères :
- aucune mutation métier modifiée ;
- routes actuelles restent valides ;
- desktop 1440×900 + mobile 390×844 ;
- dock mobile cohérent ;
- un H1/page ;
- focus clavier ;
- reduced motion ;
- rollback = retirer la couche V6.

## Build 521 candidat — Home V6

- renderer Home V6 ;
- view-model attention/catch-up ;
- `Mets-moi à jour` déterministe ;
- cohérence Home ↔ Vue projet.

## Build 522 candidat — Projets + Vue projet

- portefeuille V6 ;
- Maintenant/Pourquoi/Ensuite ;
- provenance lisible ;
- aucune modification création/access.

## Build 523 candidat — Travail/Roadmap V6

- nouvelle présentation ;
- mêmes owners backend/frontend de mutation ;
- contexte projet préservé ;
- provenance visible.

Les builds suivants dépendent de la QA des tranches précédentes.

---

# 6. Ce qui doit rester hors du premier cycle d’implémentation

- Project Graph universel ;
- nouvelle IA obligatoire ;
- whiteboard/Atelier ;
- Docs/Sheets internes ;
- CRM ;
- automatisations avancées ;
- extraction des appels natifs ;
- grand nettoyage de `live.js` ;
- refonte du backend Team/access ;
- nouvelle architecture de base de données sans besoin démontré.

---

# 7. Gate avant chaque merge runtime

Pour chaque tranche :

1. source uniquement dans le repo canonique ;
2. `npm ci` ;
3. `npm run check` ;
4. syntax check des nouveaux assets ;
5. vérification desktop/mobile ;
6. absence de console error connue ;
7. contrat des owners inchangé ;
8. test des états vide/erreur ;
9. aucune suppression legacy non couverte ;
10. comparaison des fichiers changés ;
11. seulement après validation : miroir transport ;
12. Workers Builds → script direct → Worker `4b4c` ;
13. SUCCESS + `/health` + smoke avant déclaration production.

---

# 8. Décision

Le prototype V6 est suffisamment cohérent pour **autoriser le démarrage de la Tranche A en source isolée**.

Cette décision n’autorise pas encore :
- le miroir transport ;
- le déploiement Cloudflare ;
- la déclaration d’un build 520 production.

La prochaine action de code est donc : **créer une branche runtime V6 depuis le `main` actuel et implémenter Shell + Design System V6 sans toucher au backend ni aux workflows métier.**
