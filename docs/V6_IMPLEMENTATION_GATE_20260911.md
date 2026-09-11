# 2b2c — V6 Implementation Gate — 2026-09-11

## Statut

**Prototype UX/produit validé. Préparation et implémentation source isolée autorisées. Non déployé.**

Baseline de production à préserver pendant la transition : **v4.5.12-work-p1 / build 519**.

La Gate navigateur du prototype V6 est passée le 11 septembre 2026 sur `v6-prototype`. Le delta technique détaillé est désormais documenté dans `V6_TECHNICAL_DELTA_519_TO_V6_20260911.md`.

Objectif : traduire la V6 validée en changements techniques progressifs sans réécriture destructive, sans casser les contrats backend déjà fiables, sans mélanger source canonique et transport, et sans déclarer une version production avant certification complète.

---

# 1. Principes d’implémentation

1. Ne pas réécrire tout le runtime.
2. Conserver le backend/RLS/RPC actuel tant qu’un manque produit réel n’est pas démontré.
3. Remplacer l’interface écran par écran.
4. Préserver un rollback fonctionnel vers build 519 pendant les premières tranches.
5. Ne supprimer aucun handler historique sans couverture navigateur correspondante.
6. Ne pas utiliser GitHub Actions.
7. Développer uniquement dans `bayouka/slyzone-motion-scapes-32`.
8. `bayouka/2b2c/4b4c/` reste transport uniquement.
9. Production Worker reste `4b4c`.
10. Backend reste Supabase `wexfzhegiewhldkugtow`.

---

# 2. Ordre de livraison recommandé

## Tranche A — Shell + Design System V6

But : poser la nouvelle grammaire visuelle sans modifier les workflows métier.

Livrables :

- tokens CSS V6 ;
- typographie ;
- spacing ;
- surfaces ;
- boutons ;
- inputs ;
- états ;
- navigation desktop/mobile ;
- motion ;
- accessibilité focus / reduced motion.

Ne pas changer les données.

## Tranche B — Home V6

But : démontrer immédiatement la nouvelle promesse.

Réutiliser les données actuelles autant que possible.

Priorité :

- Maintenant ;
- Reprendre ;
- Bientôt ;
- timeline utile ;
- causalité affichée lorsque l’information existe déjà.

Pas d’IA nécessaire.

## Tranche C — Projets + Vue projet V6

- liste/hiérarchie Projets ;
- santé ;
- Maintenant / Ensuite ;
- trajectoire ;
- mémoire utile ;
- projet terminé.

## Tranche D — Travail / Roadmap V6

- réduire les destinations principales ;
- Travail et Roadmap ;
- provenance visible ;
- dépendances/blocages ;
- panneau Action.

Le propriétaire `work-workflow-v1.js` reste le workflow d’écriture tant qu’il répond au contrat.

## Tranche E — Agenda V6

Rassembler les objets datés dans un renderer transverse.

Évaluer d’abord si les données déjà chargées suffisent avant toute nouvelle RPC.

## Tranche F — Ressources / Validation V6

Réutiliser `resources-workspace-v2.js`, `approval-route-v1.js` et les workflows serveur actuels ; refonte présentation d’abord.

## Tranche G — Messages / Réunions V6

Harmoniser la présentation, ne pas casser Communication V3 ni Meeting V2.

## Tranche H — Équipe / Invitations / Accès V6

À implémenter après inventaire final du runtime historique. Ne pas extraire pour la seule propreté technique.

---

# 3. Modèle causal minimal à introduire progressivement

La V6 n’a pas besoin d’un graphe générique complexe au premier build.

## Niveau 1 — exploiter les liens existants

- `source_type` / `source_id` des actions ;
- projet / milestone ;
- approbation → version ;
- réunion → projet ;
- livraison → versions ;
- décisions déjà présentes ;
- demandes si présentes.

UI : `Origine`, `Dépend de`, `Débloque` seulement lorsque fiable.

## Niveau 2 — décisions structurées

Si le modèle actuel est insuffisant, ajouter une migration ciblée ultérieure pour stocker :

- question ;
- décision ;
- raison ;
- remplace décision ;
- source ;
- objets affectés.

Ne pas ajouter avant audit du schéma live.

## Niveau 3 — relations génériques

Seulement si les tests produit démontrent un bénéfice : table de relations ou structure dédiée.

Pas de “Project Graph” universel créé par anticipation.

---

# 4. Builds proposés

Ne pas réserver les numéros si aucun runtime n’est créé, mais ordre suggéré :

- build 520 — `v4.5.12-v6-shell-p1` ;
- build 521 — `v4.5.12-v6-home-p1` ;
- build 522 — `v4.5.12-v6-project-p1` ;
- build 523 — `v4.5.12-v6-work-p2` ;
- builds suivants selon résultat.

Chaque build doit être autonome, testable et rollbackable.

---

# 5. Quality Gate par tranche

Avant miroir transport :

- `npm ci` ;
- `npm run check` ;
- syntax checks nouveaux assets ;
- H1 unique ;
- pas de console error connue ;
- responsive 390×844 + desktop 1440×900 ;
- keyboard/focus ;
- `prefers-reduced-motion` ;
- test des états vide/erreur ;
- contrat serveur inchangé ou explicitement migré.

Pour toute mutation métier : conserver tests RLS/RPC existants.

---

# 6. E2E minimum avant suppression de legacy

Ne pas supprimer un ancien path tant que le scénario correspondant n’est pas exécutable.

Priorités :

- auth/Home ;
- Team/Restricted ;
- create project ;
- action create/edit/block ;
- project messages parity ;
- deliverable/version/approval ;
- meeting create/RSVP ;
- native call ;
- closure/reopen.

La matrice `E2E_TEST_MATRIX_20260911.md` reste la référence.

---

# 7. Déploiement certifié

Pour chaque tranche destinée à prod :

1. valider source canonique ;
2. mirrorer bit-identiquement runtime vers `bayouka/2b2c/4b4c/` ;
3. mettre à jour `TRANSPORT_RELEASE.txt` ;
4. laisser Workers Builds du repo transport exécuter `scripts/deploy-4b4c-direct.sh` ;
5. le script doit cibler explicitement `--name 4b4c` ;
6. attendre SUCCESS ;
7. vérifier `/health`, shell, build et assets ;
8. seulement alors déclarer la prod à jour.

Pas de GitHub Actions.

---

# 8. Ce qui n’entre pas dans la première V6

- whiteboard complet ;
- nouvel Atelier ;
- galerie d’agents IA ;
- chatbot global ;
- CRM ;
- documents type Word complets ;
- tableur ;
- automatisations complexes ;
- Project Graph visuel ;
- temps/budget/client exposés à tous les projets ;
- multiplication des vues task manager.

---

# 9. Critère de lancement V6

La V6 peut être considérée prête à remplacer l’expérience 519 lorsque :

- Home, Projets, Vue projet et Travail ont la même logique Maintenant → Pourquoi → Ensuite ;
- navigation mobile/desktop est cohérente ;
- les workflows existants restent sûrs ;
- Agenda est réellement transverse ;
- Ressource/Livrable/Version/Validation restent non ambigus ;
- les tests utilisateurs réussissent sans formation ;
- les écrans ne nécessitent pas d’IA pour être utiles ;
- le rollback est documenté ;
- production smoke passe.

---

# 10. Prochaine action d’ingénierie

La validation visuelle étant désormais passée, la prochaine action est autorisée : **créer Tranche A — Shell + Design System V6 dans une branche source isolée depuis le `main` courant, sans changer le backend et sans miroir transport**.

Le passage en production reste une Gate séparée.
