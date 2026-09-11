# 2b2c — Design System V6 — 2026-09-11

## Statut

Spécification de conception. **Non déployée.** Baseline production conservée : `v4.5.12-work-p1 / build 519`.

Ce document définit la grammaire visuelle et interactive commune de la V6. Toute maquette et toute future implémentation V6 doit s’y conformer sauf décision explicite de réouverture.

## 1. Principes non négociables

1. La clarté prime sur la décoration.
2. Chaque écran met en évidence `Maintenant → Pourquoi → Ensuite`.
3. Maximum trois niveaux de surface visibles : canvas, surface principale, item/action.
4. La progression et les relations sont montrées par trajectoires, nœuds et liens utiles ; jamais par un graphe complexe exposé à l’utilisateur.
5. Même objet = même représentation, quel que soit l’écran.
6. Une action primaire par zone. Les actions secondaires restent visuellement secondaires.
7. Desktop et mobile partagent la même logique métier ; le mobile réordonne, il ne supprime pas arbitrairement.
8. L’interface doit rester excellente sans IA.
9. Toute proposition automatisée ou future IA doit conserver sa provenance et demander validation pour les mutations importantes.
10. Pas de multiplication des cartes, pills, gradients et KPI sans fonction précise.

## 2. Signature visuelle

### Intention

2b2c doit évoquer un espace de travail calme, lumineux, progressif et connecté. La signature n’est pas le glassmorphism : c’est la sensation de **mouvement d’un projet vers son résultat**.

### Langage graphique

- canvas clair légèrement bleuté ;
- navigation sombre bleu nuit ;
- surfaces blanches ou très légèrement teintées ;
- trajectoires fines avec nœud actif renforcé ;
- accents bleu électrique / violet contrôlés ;
- vert pour validation/résolution ;
- rouge atténué pour blocage/risque ;
- ambre pour attente/décision ;
- cyan réservé aux accents secondaires et états informatifs.

### Interdits

- glass sur chaque conteneur ;
- cartes dans cartes dans cartes ;
- rayons surdimensionnés partout ;
- gradients décoratifs non fonctionnels ;
- ombres lourdes ;
- illustrations occupant l’espace utile d’un écran de travail ;
- multiples CTA primaires concurrents.

## 3. Palette fonctionnelle

Les valeurs exactes seront figées à l’implémentation après contraste WCAG, mais la hiérarchie est la suivante :

- `nav-bg` : bleu nuit profond ;
- `canvas-bg` : blanc bleuté très clair ;
- `surface` : blanc ;
- `surface-muted` : bleu/gris très léger ;
- `primary` : bleu électrique ;
- `progress` : violet-bleu ;
- `success` : vert ;
- `warning` : ambre ;
- `danger` : rouge doux mais suffisamment contrasté ;
- `info` : cyan/bleu ;
- `text-primary` : bleu-noir ;
- `text-secondary` : gris-bleu ;
- `border` : gris bleu clair.

Les couleurs d’état doivent être accompagnées de texte/icône : jamais couleur seule.

## 4. Typographie

Objectif : lecture rapide, ton professionnel, non-technique.

- Police UI : sans-serif moderne à forte lisibilité ; conserver la compatibilité avec la stack existante avant décision de changement de police.
- `H1` : un seul visible par route.
- `H2` : sections structurantes uniquement.
- Corps : 15–16 px desktop selon contexte, minimum lisible sur mobile.
- Métadonnées : plus petites mais jamais au détriment du contraste.
- Les libellés métiers priment sur les noms techniques.

Échelle recommandée :

- Display/hero marketing : hors application métier.
- H1 : 28–32 desktop, 24–28 mobile.
- H2 : 20–24.
- H3 : 17–19.
- Body : 15–16.
- Small/meta : 12–14.

## 5. Espacement et densité

Système basé sur multiples cohérents de 4/8.

- respiration entre grandes zones : 24–32 px ;
- cartes/surfaces : 16–24 px de padding ;
- lignes d’action : 12–16 px ;
- mobile : densité légèrement plus forte, jamais tassée.

Priorité : pouvoir scanner une page en quelques secondes sans effet de mosaïque.

## 6. Rayons, bordures, ombres

- petits contrôles : rayon 8–10 ;
- boutons/champs : 10–12 ;
- surfaces principales : 14–18 ;
- éviter un rayon identique sur tout.

Bordures fines, ombres très légères. L’élévation sert uniquement à indiquer superposition, sélection ou panneau temporaire.

## 7. Navigation

### Desktop

Sidebar persistante :

1. Home
2. Projets
3. Mon travail
4. Messages
5. Agenda
6. Fichiers

Secondaire : Équipe, Archives, Paramètres, Profil.

Topbar : recherche, communication/appels, notifications, créer, profil.

### Mobile

Dock fixe : Home / Projets / Mon travail / Messages.

Drawer : Agenda, Fichiers, Équipe, Archives, Paramètres, Profil, Déconnexion + projets récents utiles.

La navigation projet reste contextuelle et secondaire : Vue d’ensemble / Travail / Messages / Ressources / Réunions.

## 8. Composants structurants

### 8.1 Item « Maintenant »

Contient :

- nature ;
- titre ;
- cause/impact en une phrase ;
- projet/personne ;
- échéance si pertinente ;
- action implicite par clic sur toute la ligne.

Exemple : `Valider Maquette V2 — Orbit est bloqué avant Tests.`

### 8.2 Bloc « Ensuite »

Montre ce qui devient possible après l’action ou le jalon courant.

Exemple : `Tests et corrections — prévu après validation.`

### 8.3 Nœud de roadmap

États : à venir / actif / terminé / bloqué / annulé.

Affiche au maximum : titre, état, date cible, responsable utile, compteur d’actions ouvertes.

### 8.4 Carte projet

Contient : nom, résultat attendu court, santé, étape active, Maintenant, Ensuite, cible, équipe utile. Éviter les métadonnées secondaires.

### 8.5 Action

Titre, état, responsable, échéance, phase, blocage/dépendance si pertinent. Le changement de statut simple est inline ; l’édition détaillée ouvre panneau/modal cohérent.

### 8.6 Décision

Objet natif : question/sujet, choix retenu, raison, date, personnes, sources, objets impactés, statut courant, décision remplacée le cas échéant.

### 8.7 Activité significative

Pas un audit technique. Format : événement métier + conséquence + liens vers sources.

### 8.8 Validation

Toujours liée à une version exacte. Affiche validateur, version, état, date, commentaire/raison si modifications demandées.

### 8.9 Ressource / Livrable

Ressource = support de travail. Livrable = sortie officielle versionnée et validable. Les deux ne doivent jamais être confondus visuellement.

## 9. États de composants

Tous les composants interactifs doivent prévoir : default, hover, focus-visible, pressed, selected, disabled, loading, success, warning, error.

Les chargements longs utilisent skeletons cohérents ; éviter spinners plein écran sauf bootstrap/auth.

## 10. Formulaires

- labels persistants ;
- aide courte au bon endroit ;
- validation inline ;
- conservation des saisies en cas d’erreur ;
- erreurs serveur traduites en conséquence utilisateur ;
- CTA principal fixe en bas sur wizard mobile lorsque pertinent ;
- pas d’alert navigateur pour les parcours V6 finalisés.

## 11. Panneaux, modales et drawers

- détail action : panneau latéral desktop / sheet plein écran mobile ;
- confirmations destructives : modal courte ;
- wizard : page ou sheet dédiée si plus de deux étapes ;
- menus : actions secondaires uniquement.

Le contexte parent doit rester perceptible quand cela aide à comprendre l’action.

## 12. Motion

- entrée écran : 160–220 ms ;
- état/selection : 120–180 ms ;
- ouverture panneau : 180–240 ms ;
- progression d’un nœud : courte et informative ;
- aucun mouvement permanent décoratif ;
- `prefers-reduced-motion` obligatoire.

## 13. Accessibilité

- WCAG AA minimum pour texte et contrôles ;
- focus visible ;
- navigation clavier ;
- zones tactiles min. ~44 px ;
- icônes avec label/aria lorsque nécessaire ;
- état jamais communiqué par couleur seule ;
- drawer mobile avec focus trap et retour de focus ;
- un H1 par route ;
- ordre DOM cohérent avec ordre visuel.

## 14. Responsive

Breakpoints techniques seront décidés avec l’implémentation ; principes :

- desktop : plusieurs colonnes uniquement quand elles améliorent la lecture ;
- tablette : réduire la concurrence entre panneaux ;
- mobile : ordre vertical `Maintenant → Action → Ensuite → contexte secondaire` ;
- roadmap mobile verticale ;
- tables deviennent listes structurées, jamais scroll horizontal par défaut si évitable.

## 15. Contenu et ton UI

- verbes concrets ;
- phrases causales courtes ;
- éviter jargon PM/tech ;
- ne pas afficher « succès » si l’opération n’est pas confirmée serveur ;
- états vides utiles mais non culpabilisants ;
- pas de microcopy marketing dans les zones de travail.

## 16. Règle de cohérence causale

Chaque composant prioritaire doit pouvoir répondre, lorsqu’applicable, à quatre questions :

1. Que se passe-t-il ?
2. Pourquoi cela compte ?
3. Quelle source ou décision explique la situation ?
4. Qu’est-ce qui devient possible ensuite ?

Cette règle vient de la convergence sélective avec myprojects et constitue un élément différenciant de la V6.

## 17. Critère de gel du Design System

Le Design System est considéré prêt pour implémentation lorsque les écrans Home, Projets, Vue projet, Travail/Roadmap, Agenda, Ressources/Validation et onboarding utilisent les mêmes composants sans exception ad hoc majeure.
