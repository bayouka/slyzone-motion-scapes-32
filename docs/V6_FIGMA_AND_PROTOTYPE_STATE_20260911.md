# 2b2c — V6 — État Figma & prototype — 2026-09-11

## Production protégée

La production certifiée reste :

- runtime : `v4.5.12-work-p1`
- build : `519`
- Worker : `4b4c`

Ce document est source-only et ne modifie pas le runtime.

## Figma

Fichier : `2b2c — Prototype V6`

URL : https://www.figma.com/design/X8dRpwjuLdIAuNvxClsLwA

### Phase 0 — Discovery

Décisions :

- fichier initialement vide ;
- bibliothèques génériques Material 3 / Simple Design System disponibles mais non retenues comme squelette ;
- Design System local spécifique 2b2c retenu ;
- typo Figma : Manrope titres + Inter UI/contenus ;
- Segoe UI Variable du runtime n’est pas disponible dans le fichier Figma ; aucune modification de typo production décidée.

### Phase 1 — Foundations — validée

Collections :

- `2b2c / Primitives` — 46 variables — mode `Value`
- `2b2c / Semantic` — 41 variables — mode `Light`

Total : 87 variables.

Règles :

- sémantiques aliasées aux primitives ;
- scopes explicites ;
- WEB code syntax définie ;
- primitives isolées sous namespace `--2b2c-primitive-*` pour éviter les collisions avec les tokens sémantiques.

Styles typographiques :

- Display / XL
- Heading / H1
- Heading / H2
- Heading / H3
- Body / L
- Body / M
- Body / S
- Label / M
- Label / S
- Caption

Styles d’effet :

- Shadow / Surface
- Shadow / Raised
- Shadow / Overlay
- Shadow / Primary Clay

### Limite Figma rencontrée

Après validation de Phase 1, le connecteur Figma a retourné explicitement que la limite MCP du plan Starter était atteinte. La création de la structure Phase 2 n’a donc pas été exécutée. Ne pas prétendre que Cover / Foundations / Components existent déjà dans Figma.

## Prototype code isolé

Branche : `v6-prototype`

Dossier : `prototype-v6/`

Fichiers :

- `index.html`
- `styles.css`
- `app.js`
- `README.md`
- `QA.md`

La branche contient un prototype sans dépendance qui couvre :

- Home ;
- Projets ;
- Vue d’ensemble projet ;
- Travail ;
- Roadmap ;
- Agenda ;
- Messages ;
- Fichiers / livrables ;
- Équipe ;
- Paramètres ;
- responsive mobile ;
- interactions simulées.

Le JavaScript a passé un contrôle syntaxique Node avant publication sur la branche.

## Doctrine V6 matérialisée

- Maintenant → Pourquoi → Ensuite ;
- activité brute réduite à l’attention utile ;
- blocage = cause + conséquence ;
- provenance visible ;
- Travail = exécuter ;
- Roadmap = comprendre le chemin ;
- Agenda transverse ;
- communication contextualisée ;
- mobile = même logique métier, hiérarchie plus stricte.

## Gate avant implémentation runtime

Ne pas commencer un build 520 runtime tant que :

1. le prototype n’a pas été revu visuellement ;
2. les parcours QA de `prototype-v6/QA.md` ne sont pas acceptés ;
3. le delta technique build 519 → V6 n’est pas classé en rendu / workflow existant / provenance / migration réelle ;
4. Home + Projets + Vue projet + Travail/Roadmap forment une expérience cohérente ;
5. la production 519 reste disponible comme rollback.
