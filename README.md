
# Slyzone - Expérience Numérique Immersive

## Informations du projet

**URL**: https://lovable.dev/projects/04d23009-214a-404b-93e6-7d2f14513a31

## Présentation

Slyzone est une application web immersive avec un arrière-plan animé interactif. L'application présente une expérience utilisateur élégante avec des animations fluides et des effets visuels basés sur la position de la souris.

## Structure du projet

```
slyzone/
├── public/               # Ressources statiques
├── src/                  # Code source
│   ├── components/       # Composants React
│   │   ├── AnimatedBackground.tsx  # Fond animé
│   │   └── ui/           # Composants d'interface utilisateur
│   ├── hooks/            # Hooks React personnalisés
│   ├── lib/              # Utilitaires et fonctions
│   ├── pages/            # Pages de l'application
│   │   ├── Dashboard.tsx # Page dashboard
│   │   ├── Home.tsx      # Page d'accueil
│   │   └── NotFound.tsx  # Page 404
│   ├── App.tsx           # Composant principal
│   ├── index.css         # Styles globaux
│   └── main.tsx          # Point d'entrée
└── ...                   # Fichiers de configuration
```

## Fond d'écran animé (AnimatedBackground)

### Vue d'ensemble

Le fond d'écran animé est implémenté dans le composant `AnimatedBackground.tsx` qui utilise l'élément HTML Canvas pour créer une ambiance futuriste et interactive avec des particules et des hexagones qui réagissent aux mouvements de la souris.

### Caractéristiques techniques

#### Éléments visuels
- **Particules**: Points lumineux qui flottent et réagissent au mouvement de la souris
- **Hexagones**: Formes géométriques plus grandes qui tournent lentement et réagissent également au mouvement de la souris
- **Effets de lueur (glow)**: Effets lumineux qui donnent de la profondeur et de l'atmosphère

#### Interactivité
- Les éléments réagissent à la position du curseur
- Les particules s'éloignent légèrement du curseur lorsqu'il s'approche
- Les hexagones augmentent leur opacité à proximité du curseur
- Un effet de lueur (glow) apparaît autour du curseur

#### Palette de couleurs
- Fonds dégradés bleu foncé à bleu moyen (`hsl(194, 100%, 5%)` à `hsl(194, 100%, 15%)`)
- Particules en teintes de bleu clair (`rgba(0, 210, 255, 0.8)`, `rgba(0, 180, 255, 0.8)`, etc.)
- Hexagones semi-transparents en teintes de bleu
- Variables CSS personnalisées pour les couleurs de thème:
  - `--slyzone-blue-dark`: `hsl(194 100% 10%)`
  - `--slyzone-blue-medium`: `hsl(189 100% 30%)`
  - `--slyzone-blue-bright`: `hsl(184 100% 50%)`

### Implémentation technique

Le composant utilise plusieurs hooks et techniques React:
- `useRef` pour stocker les références au canvas, au contexte, aux particules, et aux hexagones
- `useEffect` pour configurer le canvas et l'animation
- `requestAnimationFrame` pour créer une boucle d'animation fluide

#### Processus d'animation:
1. Configuration initiale du canvas et création des particules et hexagones
2. Suivi du mouvement de la souris avec les event listeners
3. Mise à jour de la position et des propriétés des éléments à chaque frame
4. Rendu des éléments avec des effets visuels (lueur, dégradés)
5. Nettoyage des event listeners lors du démontage du composant

### Personnalisation

Pour modifier le fond animé, voici les principales sections à ajuster:

#### Couleurs
Modifiez les fonctions comme `getRandomBlueColor()` ou les variables dans `drawBackground()`.

#### Densité des éléments
Ajustez `particleCount` et `hexagonCount` dans les fonctions `createParticles()` et `createHexagons()`.

#### Comportement des animations
Modifiez les valeurs comme `maxDistance`, les facteurs de vitesse, ou les calculs de déplacement.

## Technologies utilisées

Ce projet est construit avec:

- Vite - Build tool et serveur de développement
- TypeScript - Typage statique pour JavaScript
- React - Bibliothèque UI
- shadcn-ui - Composants UI
- Tailwind CSS - Framework CSS utilitaire
- React Router - Navigation entre les pages

## Installation et démarrage

```sh
# Étape 1: Cloner le dépôt
git clone <VOTRE_URL_GIT>

# Étape 2: Naviguer vers le répertoire du projet
cd <NOM_DU_PROJET>

# Étape 3: Installer les dépendances
npm i

# Étape 4: Démarrer le serveur de développement
npm run dev
```

## Comment modifier ce code?

### Utiliser Lovable

Visitez simplement le [Projet Lovable](https://lovable.dev/projects/04d23009-214a-404b-93e6-7d2f14513a31) et commencez à interagir avec les prompts.

Les modifications effectuées via Lovable seront automatiquement enregistrées dans ce dépôt.

### Utiliser votre IDE préféré

Si vous préférez travailler localement avec votre propre IDE, vous pouvez cloner ce dépôt et pousser les modifications. Les changements poussés seront également reflétés dans Lovable.

La seule exigence est d'avoir Node.js et npm installés - [installation avec nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

### Modifier un fichier directement dans GitHub

- Naviguez vers le(s) fichier(s) souhaité(s).
- Cliquez sur le bouton "Edit" (icône de crayon) en haut à droite de la vue du fichier.
- Effectuez vos modifications et validez les changements.

### Utiliser GitHub Codespaces

- Naviguez vers la page principale de votre dépôt.
- Cliquez sur le bouton "Code" (bouton vert) en haut à droite.
- Sélectionnez l'onglet "Codespaces".
- Cliquez sur "New codespace" pour lancer un nouvel environnement Codespace.
- Modifiez les fichiers directement dans le Codespace et validez et poussez vos modifications une fois terminé.

## Comment déployer ce projet?

Ouvrez simplement [Lovable](https://lovable.dev/projects/04d23009-214a-404b-93e6-7d2f14513a31) et cliquez sur Partager -> Publier.

## Connexion d'un domaine personnalisé

Oui, c'est possible!

Pour connecter un domaine, naviguez vers Projet > Paramètres > Domaines et cliquez sur Connecter un domaine.

Plus d'informations ici: [Configuration d'un domaine personnalisé](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
