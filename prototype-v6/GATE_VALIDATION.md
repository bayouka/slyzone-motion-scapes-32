# 2b2c V6 — Gate de validation du prototype

Date : 11 septembre 2026

## Verdict

**PASS — prototype UX/produit validé pour passer à la préparation technique d’implémentation.**

Ce verdict concerne exclusivement le prototype V6 isolé. Il n’autorise pas à considérer la V6 comme implémentée dans le runtime 4b4c ni à déployer un build 520.

Production de référence inchangée : `v4.5.12-work-p1 / build 519`.

## Corrections bloquantes réalisées avant validation

1. Date corrigée : vendredi 11 septembre 2026.
2. Contexte projet conservé de Projet vers Travail/Roadmap via les routes `#/project/{id}/work/...`.
3. Agenda rendu réellement transverse : réunions, validations, jalons et actions datées partagent la même chronologie.
4. Fichiers et Équipe convertis en cartes responsives sur mobile afin qu’aucune information critique ne disparaisse.
5. Navigation projet corrigée : Travail d’un projet garde `Projets` comme seul univers global actif au lieu d’activer simultanément `Projets` et `Mon travail`.
6. `Mets-moi à jour` transformé d’un toast en synthèse de reprise causale : changement → décision attendue → conséquence → prochaine action.

## Validation navigateur réelle

Le prototype a été rendu et testé dans Chromium headless via Chrome DevTools Protocol, en injectant la version locale isolée du prototype. Aucun backend de production n’a été sollicité.

### Parcours / écrans vérifiés

- Home desktop : date correcte, logique Maintenant / Pourquoi / Ensuite, aucune largeur débordante.
- Home mobile : sidebar masquée, dock visible, hiérarchie conservée, aucun débordement horizontal.
- Projet Orbit : priorité, cause, conséquence et prochaine étape cohérentes.
- Travail HFConcept : contexte HFConcept conservé, une seule entrée globale active, aucune fuite vers Orbit.
- Agenda desktop : validation + réunion + jalon présents dans la même temporalité.
- Fichiers mobile : projet, version, statut et date restent visibles sans table horizontale.
- Équipe mobile : rôle, périmètre projet, statut et type d’accès restent visibles.
- `Mets-moi à jour` : modal de reprise avec chaîne causale et CTA vers Orbit.

### Interactions vérifiées

- Home → `Mets-moi à jour` → synthèse causale → `Continuer Orbit` → même priorité dans la Vue projet.
- Projet → Travail → Roadmap avec conservation du projet.
- Mobile → `Plus` → accès à Agenda / Fichiers / Équipe / Paramètres.

## Critères Gate

| Critère | Résultat |
| --- | --- |
| Maintenant → Pourquoi → Ensuite compréhensible | PASS |
| Home et Vue projet cohérentes | PASS |
| Blocage avec cause + conséquence | PASS |
| Travail et Roadmap ont deux rôles distincts | PASS |
| Agenda transverse | PASS |
| Provenance visible | PASS |
| Mobile conserve la logique métier | PASS |
| Pas de multiplication de vues principales | PASS |
| Aucun changement de production | PASS |

## Limites explicites

- Le prototype utilise des données synthétiques et ne valide pas encore le branchement au backend Supabase réel.
- Les permissions Owner/Admin/Member/Guest ne sont pas validées par ce prototype statique.
- Les workflows métier réels (réunions, appels, validations, ressources, invitations, RLS) restent ceux du build 519 et devront être réutilisés plutôt que réécrits sans nécessité.
- Cette Gate ne remplace pas les E2E authentifiés qui seront requis avant une mise en production V6.

## Décision de suite

La prochaine étape autorisée est la rédaction du **delta technique build 519 → V6**, écran et domaine par écran/domaine, avant tout changement du runtime canonique.
