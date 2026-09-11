# 2b2c V6 — QA du prototype isolé

## Statut

- Branche : `v6-prototype`
- Production de référence inchangée : `v4.5.12-work-p1 / build 519`
- Aucun fichier runtime ou transport modifié par cette branche.
- Point d’entrée validé : `prototype-v6/index.html` → `validated.css` + `app-v6.js`.
- Validation navigateur réelle exécutée dans Chromium headless via Chrome DevTools Protocol.
- Verdict de Gate UX/produit : **PASS**. Voir `GATE_VALIDATION.md`.
- Ce PASS ne vaut pas validation backend/auth/RLS ni autorisation de déploiement V6.

## Parcours vérifiés

### Q1 — Home → action conditionnante — PASS
1. Home montre Orbit comme priorité à reprendre.
2. `Mets-moi à jour` ouvre une synthèse causale.
3. La chaîne relie Maquette V2 → validation attendue → Tests + 3 actions débloqués.
4. `Continuer Orbit` conduit à la Vue d’ensemble du même projet.
5. La priorité reste cohérente.

### Q2 — Projets → Orbit — PASS
- Orbit est identifiable comme bloqué sans ouvrir le projet.
- La cause du blocage est lisible.
- Maintenant et Ensuite sont présents sur la ligne projet.

### Q3 — Projet → Travail / Roadmap — PASS
- Le contexte projet est conservé dans les routes `#/project/{id}/work/list` et `#/project/{id}/work/roadmap`.
- Travail explique la priorité et la conséquence.
- Roadmap explique le chemin et la dépendance.
- Dans un Travail projet, `Projets` est le seul univers global actif dans la sidebar.

### Q4 — Agenda transverse — PASS
- Une validation, une réunion et un jalon coexistent dans la même temporalité.
- La chronologie utile reste lisible lorsque la grille semaine disparaît sur mobile.

### Q5 — Messages contextualisés — PASS produit
- La conversation Orbit conserve le fichier/version et son contexte projet dans le prototype.
- L’envoi est simulé ; aucun backend réel n’est validé ici.

### Q6 — Fichiers / livrables — PASS responsive
- `Maquette_v2.fig`, projet, version, statut et date restent visibles.
- Sur mobile, les données passent en cartes avec libellés au lieu d’une table horizontale.

### Q7 — Équipe / Responsive mobile — PASS
À largeur <= 760 px :
- sidebar masquée ;
- topbar compacte ;
- dock Home / Projets / Travail / Messages / Plus ;
- `Plus` donne accès à Agenda / Fichiers / Équipe / Paramètres ;
- Fichiers et Équipe gardent les informations critiques visibles ;
- aucun débordement horizontal détecté sur les écrans testés.

## Écrans réellement rendus et contrôlés

- Home desktop
- Home mobile
- Projet Orbit desktop
- Travail HFConcept desktop
- Agenda desktop
- Fichiers mobile
- Équipe mobile
- Synthèse `Mets-moi à jour` desktop

## Critères de Gate prototype

| Critère | Résultat |
| --- | --- |
| Maintenant → Pourquoi → Ensuite | PASS |
| Home et Vue projet cohérentes | PASS |
| Blocages avec cause et conséquence | PASS |
| Travail / Roadmap distincts | PASS |
| Agenda transverse | PASS |
| Provenance visible | PASS |
| Logique métier conservée sur mobile | PASS |
| Pas de multiplication des vues principales | PASS |

## Ce qui reste hors de cette Gate

- branchement aux données Supabase réelles ;
- rôles Owner/Admin/Member/Guest ;
- Team/Restricted et RLS ;
- réunions/appels réels ;
- upload/version/validation réels ;
- invitations réelles ;
- E2E authentifiés multi-utilisateur ;
- migration runtime build 519 → V6.

Ces points appartiennent à l’implémentation et à sa QA, pas à la validation du prototype statique.
