# 2b2c — V6 Phase 4 — Spécification complète des écrans & Design System — 2026-09-11

## Statut

Document de conception. **Aucun changement runtime ni production.**

Baseline de production conservée : **v4.5.12-work-p1 / build 519**.

Ce document clôt la conception fonctionnelle/UX de la V6 avant implémentation. Il complète :

- `UX_PRODUCT_DA_GATE_20260911.md` ;
- `V6_REFERENCE_SCREENS_20260911.md` ;
- `V6_IA_SIMPLIFICATION_PHASE2_20260911.md` ;
- `V6_WIREFLOWS_PHASE3_20260911.md` ;
- la convergence sélective myprojects → 4b4c / 2b2c.

La V6 repose sur la chaîne mentale :

**Contexte → Relations → Mémoire → Conséquences → Prochaine action.**

Le produit doit rendre visible, sans jargon :

1. ce qui compte maintenant ;
2. pourquoi cela compte ;
3. ce qui se passera ensuite ;
4. où agir ;
5. d’où vient l’information ;
6. quel objet / personne / décision est lié.

---

# 1. Home V6 — référence figée

## Mission

Permettre à l’utilisateur de reprendre en moins de 10 secondes.

## Ordre final

1. **Maintenant** — interventions réellement attendues ;
2. **Reprendre** — un projet recommandé avec raison ;
3. **Bientôt** — réunions, échéances et validations ;
4. **Depuis votre dernière visite** — timeline intelligente ;
5. accès contextuel à **Mets-moi à jour**.

## Règle causale

Une priorité doit être formulée comme :

`Valider Maquette V2 — Orbit est bloqué avant Tests.`

et non :

`1 validation en attente`.

## États

- vide / première connexion ;
- utilisateur à jour ;
- blocage nécessitant son intervention ;
- plusieurs priorités ;
- données indisponibles ;
- projet récemment terminé.

---

# 2. Projets V6 — référence figée

## Mission

Choisir le bon projet sans ouvrir chaque espace.

## Desktop

### En-tête

- titre Projets ;
- recherche ;
- filtre Actifs / En pause / Terminés ;
- Nouveau projet ;
- tri secondaire simple.

### Ordre par défaut

1. nécessite attention ;
2. en cours normal ;
3. à structurer ;
4. en pause ;
5. terminé selon filtre.

### Carte / ligne projet

Afficher seulement :

- nom ;
- résultat attendu court ;
- étape active ;
- santé ;
- **Maintenant** ;
- **Ensuite** ;
- date cible utile ;
- équipe clé ;
- mini trajectoire.

Éviter les compteurs décoratifs.

## Mobile

Une bande compacte par projet :

- nom + santé ;
- étape ;
- prochaine action / blocage ;
- date utile ;
- trajectoire courte.

## États

- aucun projet ;
- projet sain ;
- projet bloqué ;
- projet en pause ;
- projet terminé ;
- chargement impossible / accès retiré.

---

# 3. Vue d’ensemble projet V6 — référence figée

## Mission

Comprendre le projet avant d’ouvrir le détail.

## En-tête

- nom ;
- résultat attendu ;
- santé ;
- personnes clés ;
- partager / gérer en secondaires.

## Bloc signature — trajectoire

3 à 7 jalons.

Chaque jalon :

- état ;
- cible ;
- responsable si utile ;
- nombre d’actions ouvertes si pertinent.

Le jalon actif est dominant.

## Sous le jalon actif

### Maintenant

- action prioritaire ;
- blocage ;
- validation / demande conditionnante.

### Pourquoi

Afficher la cause / provenance lorsque utile :

- décision ;
- version ;
- demande ;
- réunion ;
- action dépendante.

### Ensuite

- prochain jalon ou condition de passage.

## Mémoire utile

Maximum trois zones :

- dernière décision importante ;
- prochain rendez-vous ;
- livrable actuel.

Pas de grille de KPI.

## Projet terminé

La Vue d’ensemble devient une mémoire :

- résultat final ;
- trajectoire achevée ;
- versions finales ;
- décisions clés ;
- date de clôture ;
- réouverture explicite.

---

# 4. Travail / Roadmap V6 — écran final

## Mission

Relier exécution et structure sans imposer plusieurs paradigmes concurrents.

## Deux modes seulement

### Travail

Question : **Que faisons-nous maintenant ?**

### Roadmap

Question : **Quel est le chemin et où en sommes-nous ?**

Board et Calendar ne sont plus des destinations principales. Ils peuvent exister dans `Affichage` si un besoin réel le justifie.

## Travail — desktop

### Barre supérieure

- jalon actif ;
- Nouvelle action ;
- filtres légers ;
- Affichage secondaire.

### Section Maintenant

Ordre métier :

1. blocage conditionnant la suite ;
2. validation / demande ;
3. urgente ;
4. assignée à l’utilisateur ;
5. reste du jalon actif.

### Ligne Action

- statut ;
- titre ;
- responsable ;
- date ;
- signal blocage / dépendance ;
- origine si utile.

Un clic ouvre un panneau de détail, pas une nouvelle architecture parallèle.

## Détail Action

Afficher :

- titre ;
- jalon ;
- responsable ;
- statut ;
- priorité ;
- échéance ;
- description ;
- blocage + cause ;
- **Provenance** : créée depuis réunion / message / décision / manuellement ;
- **Dépend de** ;
- **Débloque** lorsque déterminable.

Actions :

- changer statut inline ;
- modifier ;
- demander à quelqu’un ;
- ouvrir la source.

## Roadmap — desktop

Trajectoire claire, sans Gantt par défaut :

- jalon ;
- résultat attendu ;
- cible ;
- responsable ;
- état ;
- progression réelle ;
- condition de passage.

Déplier un jalon : actions importantes seulement.

## Mobile

### Travail

- Maintenant en premier ;
- actions compactes ;
- étapes repliables ;
- modification de statut rapide ;
- feuille plein écran pour détail.

### Roadmap

Trajectoire verticale avec nœuds.

## États

- aucune action ;
- tout à jour ;
- action bloquée ;
- jalon bloqué ;
- jalon terminé ;
- projet terminé ;
- erreur / sync impossible.

---

# 5. Agenda V6 — écran final

## Mission

Répondre : **qu’est-ce qui arrive quand ?**

Agenda est transverse et ne se limite pas aux réunions.

## Objets inclus

- réunions ;
- actions avec échéance ;
- jalons / dates cibles ;
- validations attendues ;
- demandes suivies avec échéance.

## Desktop

### Vue par défaut

Semaine, avec colonne **À venir**.

### Autres vues

Jour / Semaine / Mois dans un contrôle secondaire simple.

### Carte événement

Couleur par type, pas par projet.

Contenu :

- heure / date ;
- titre ;
- projet ;
- type ;
- personne(s) ;
- CTA contextuel.

### Conflits

Un chevauchement doit être visible mais ne doit pas être présenté comme erreur si les deux événements peuvent coexister.

## Mobile

- Jour / Semaine ;
- liste chronologique dominante ;
- calendrier compact ;
- CTA flottant secondaire.

## Due date vs planification personnelle

Ne pas confondre :

- **échéance collective** d’un engagement ;
- **créneau personnel** éventuellement planifié.

Une future intelligence peut replanifier le second, jamais déplacer silencieusement le premier.

## États

- agenda vide ;
- journée chargée ;
- conflit ;
- réunion imminente ;
- validation dépassée ;
- données partielles.

---

# 6. Ressources / Livrables / Validation V6 — écran final

## Mission

Retrouver, produire, versionner et faire valider sans ambiguïté.

## Distinction obligatoire

### Ressource

Élément de travail : document, lien, fichier, source.

### Livrable

Sortie officielle versionnée et potentiellement validée.

## Ressources

Vue simple :

- nom ;
- type ;
- projet ;
- auteur ;
- modification ;
- liens utiles.

Pas de copie des données projet.

## Livrable

Carte / ligne :

- titre ;
- version actuelle ;
- statut validation ;
- visibilité ;
- historique versions ;
- version de référence si clôture.

## Validation

Toujours afficher :

`Vous validez [Livrable] — vN.`

Décisions :

- approuver ;
- demander modifications ;
- rejeter seulement si contrat métier l’exige.

Une demande de modifications fige la décision sur vN et exige vN+1.

## Provenance

Le livrable peut être relié à :

- jalon ;
- décision ;
- réunion ;
- action ;
- demande.

La provenance est visible à la demande, pas exposée partout.

## Guest / client

Partager un objet précis doit devenir une direction future privilégiée :

- version précise ;
- validation précise ;
- accès révocable ;
- pas d’accès implicite aux futures versions.

## États

- aucune ressource ;
- aucun livrable ;
- validation attendue ;
- modifications demandées ;
- version approuvée ;
- fichier indisponible ;
- permission retirée.

---

# 7. Messages V6 — écran final

## Mission

Conserver une communication fluide, mais toujours contextualisée.

## Architecture

Global et projet utilisent le même renderer / même logique.

Filtres :

- Tous ;
- Non lus ;
- Mentions ;
- Projets ;
- Privés ;
- Réunions.

## Fil

Un message peut garder des liens contextuels :

- action ;
- décision ;
- réunion ;
- fichier ;
- demande.

## Transformations

Actions contextuelles, non automatiques :

- `Créer une action` ;
- `Consigner une décision` ;
- `Créer une demande` ;
- `Ajouter à une réunion`.

Toujours prévisualiser le résultat avant création.

## IA future

Pas d’onglet IA générique.

Si activée :

- `@2b2c` ou action contextuelle ;
- résumer ;
- extraire décisions / actions proposées ;
- retrouver contexte avec sources ;
- aucune écriture importante silencieuse.

## États

- aucune conversation ;
- conversation vide ;
- message non envoyé ;
- accès retiré ;
- conversation archivée ;
- pièce jointe indisponible.

---

# 8. Réunions V6 — harmonisation

## Mission

La réunion n’est pas une visio isolée : c’est un événement du projet.

## Avant

- objectif ;
- agenda ;
- participants ;
- documents ;
- sujets / décisions à préparer.

## Pendant

- audio / vidéo ;
- partage écran ;
- notes ;
- décisions ;
- actions ;
- questions ouvertes.

## Après

- synthèse ;
- décisions ;
- actions ;
- questions ouvertes ;
- conséquences sur roadmap ;
- sources / enregistrement selon politique future.

## Mobile

Préjoin simple, caméra frontale par défaut, changement caméra, ajout participant, partage écran lorsque plateforme le permet.

---

# 9. Équipe / Invitations / Accès V6 — écran final

## Mission

Comprendre qui peut voir quoi sans exposer la mécanique interne.

## Membres

Colonnes :

- personne ;
- rôle ;
- projets particuliers si Restricted / Guest ;
- statut ;
- action Gérer si autorisée.

## Rôles

### Owner / Propriétaire

Administration totale.

### Admin

Administration workspace selon contrat.

### Member / Membre

Accès automatique aux projets Team ; accès explicite aux Restricted.

### Guest / Invité externe

Uniquement ce qui lui est explicitement partagé.

## Invitation

1. email ;
2. rôle ;
3. projets uniquement si nécessaire ;
4. résumé clair avant envoi.

Ne pas demander `access_mode`, `RLS`, `workspace_membership` ou concepts techniques.

## Gestion d’un membre

Changer rôle / projets avec aperçu des conséquences avant validation.

## États

- équipe minimale ;
- invitation en attente ;
- invitation expirée ;
- mauvais email ;
- guest ;
- accès retiré.

---

# 10. Paramètres V6 — écran final

## Mission

Rester secondaire et sobre.

Sections :

- Mon profil ;
- Notifications ;
- Préférences d’affichage ;
- Intégrations futures ;
- Sécurité ;
- Facturation / limites lorsque commercial ;
- Aide & support.

Pas de réglages de workflow complexes au lancement.

---

# 11. Navigation finale

## Desktop primaire

1. Home
2. Projets
3. Mon travail
4. Messages
5. Agenda
6. Fichiers

Secondaire :

- Équipe
- Archives
- Paramètres
- Profil

## Mobile dock

Seulement :

1. Home
2. Projets
3. Mon travail
4. Messages

Drawer :

- Agenda ;
- Fichiers ;
- Équipe ;
- projets récents ;
- Paramètres ;
- Profil ;
- Déconnexion.

---

# 12. Design System V6

## 12.1 Principes

- lisibilité avant décoration ;
- maximum trois niveaux de surface ;
- un CTA principal dominant par zone ;
- les couleurs d’état ont une signification stable ;
- même objet = même représentation partout ;
- pas de carte dans carte dans carte ;
- pas de dashboard de KPI sans question métier.

## 12.2 Palette fonctionnelle

Conserver l’identité actuelle mais la calmer :

- `Navy / Shell` : sidebar et structure ;
- `Canvas` : blanc bleuté / gris très clair ;
- `Primary` : bleu électrique contrôlé ;
- `Progress` : bleu-violet ;
- `Success` : vert ;
- `Warning` : ambre ;
- `Danger` : rouge atténué ;
- `Info` : cyan léger.

Les gradients sont réservés :

- aux illustrations / hero ;
- aux accents de progression ;
- jamais comme remplissage systématique de tous les composants.

## 12.3 Typographie

- sans-serif moderne, très lisible ;
- H1 rare et unique par page ;
- hiérarchie nette ;
- texte de support plus discret ;
- pas d’ultra-light sur mobile.

## 12.4 Rayon

Limiter à 3 valeurs cohérentes :

- petit ;
- moyen ;
- grand.

Éviter le rayon géant appliqué partout.

## 12.5 Ombres

- très légères ;
- utilisées pour séparation, pas pour effet clay systématique.

## 12.6 Espacement

Échelle cohérente 4 / 8 / 12 / 16 / 24 / 32 / 48.

## 12.7 Icônes

Une seule famille.

Couleur neutre par défaut ; couleur fonctionnelle uniquement pour statut/action.

## 12.8 Composants fondamentaux

- Button Primary / Secondary / Ghost / Danger ;
- Icon button ;
- Input / Search ;
- Select ;
- Filter chip ;
- Status badge ;
- Avatar / group ;
- Action row ;
- Project row/card ;
- Timeline item ;
- Milestone node ;
- Decision item ;
- Approval item ;
- File row ;
- Empty state ;
- Error state ;
- Drawer ;
- Modal ;
- Side panel ;
- Toast / inline feedback.

## 12.9 États d’interaction

Chaque composant interactif doit avoir :

- default ;
- hover ;
- focus visible ;
- active ;
- disabled ;
- loading ;
- error si pertinent.

## 12.10 Motion

- entrée d’écran : 160–220 ms ;
- état : 120–180 ms ;
- drawer : 180–240 ms ;
- progression : animation courte ;
- pas de parallaxe permanente ;
- `prefers-reduced-motion` respecté.

## 12.11 Responsive

Breakpoints à dériver de contenu, mais trois comportements :

- compact mobile ;
- intermédiaire tablette ;
- desktop large.

Mobile ne doit jamais être un desktop compressé.

---

# 13. Signature visuelle V6

La marque 2b2c doit être reconnaissable sans logo par :

1. la trajectoire / nœuds ;
2. Maintenant → Pourquoi → Ensuite ;
3. priorité causale ;
4. surfaces calmes ;
5. contexte et provenance accessibles ;
6. progression spatiale légère.

L’imagerie montagne/espace peut rester dans les zones de marque / accueil, mais ne doit pas envahir les écrans de travail.

---

# 14. Project Intelligence — réserve structurée, pas MVP forcé

## Doctrine

**Mémoire → Compréhension → Action → validation humaine.**

## P0 sans IA

La V6 doit déjà fonctionner avec :

- liens entre objets ;
- provenance ;
- blocage causal ;
- décision structurée ;
- timeline métier ;
- priorité cohérente.

## IA future

Peut :

- proposer un résumé `Mets-moi à jour` ;
- détecter incohérence / risque ;
- proposer action / décision ;
- expliquer pourquoi ;
- rechercher dans la mémoire avec sources.

Ne peut pas par défaut :

- modifier silencieusement une échéance ;
- clore un projet ;
- approuver une version ;
- changer les permissions ;
- transformer automatiquement toute conversation en tâches.

---

# 15. Prototype cliquable — parcours obligatoires

Le prototype doit couvrir :

1. invitation → Home ;
2. création projet Team ;
3. création projet Restricted ;
4. Home → validation conditionnante → prochaine étape ;
5. action bloquée → demande → réponse → reprise ;
6. message → décision / action proposée ;
7. livrable v1 → modifications → v2 → validation ;
8. réunion avant / pendant / après ;
9. clôture → archive → réouverture ;
10. mobile sur les parcours 1, 4, 5 et 7.

---

# 16. Tests utilisateurs avant implémentation globale

## Participants

5 profils minimum non formés.

## Mesures

- réussite sans aide ;
- temps jusqu’au premier clic correct ;
- retour arrière ;
- vocabulaire incompris ;
- erreur de destination ;
- capacité à expliquer Maintenant / Pourquoi / Ensuite ;
- compréhension Team / Restricted / Guest ;
- compréhension Ressource / Livrable / Version / Validation.

## Critères

- identifier l’action principale < 10 s ;
- aucun besoin d’explication pour naviguer ;
- causalité comprise ;
- mobile utilisable sans perte de fonction essentielle.

---

# 17. Définition de fin de Phase 4

Phase 4 est considérée prête lorsque :

- tous les écrans ci-dessus sont maquettés desktop + mobile selon besoin ;
- les états vide / normal / blocage / terminé / erreur sont définis ;
- le Design System V6 est cohérent ;
- les six wireflows initiaux + extensions critiques sont couverts ;
- le prototype peut être testé sans backend ;
- aucune nouvelle fonctionnalité importante n’est nécessaire pour comprendre le produit ;
- les besoins backend supplémentaires sont distingués des simples changements UI.

Après cette Gate, seulement : **plan d’implémentation V6**.