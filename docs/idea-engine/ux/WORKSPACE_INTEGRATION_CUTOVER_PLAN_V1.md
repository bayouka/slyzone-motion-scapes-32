# 4b4c / 2b2c — WORKSPACE INTEGRATION / CUTOVER PLAN V1

Date : 2026-09-13

Statut : **ACTIVE IMPLEMENTATION PLAN**

Objectif : remplacer progressivement le workspace Idea historique par une projection fidèle au runtime R0→R7 sans big-bang, sans baisse de sécurité et sans rendre l'application inutilisable pendant la transition.

## Principes

- GitHub reste la source canonique ; Supabase reste le state/backend canonique ; Cloudflare reste le chemin runtime/deploy.
- pas de Remote Desktop Commander dans le workflow normal ;
- aucune réouverture de Capture V5 sans problème réel ;
- aucun assouplissement des RPCs `service_role only` pour simplifier le frontend ;
- chaque slice est additive, testable et rollbackable ;
- l'ancien orchestrateur est retiré seulement après équivalence fonctionnelle et UX validée.

## Slice 1 — Canonical read projection — DONE

Livrable : `get_idea_workspace_projection_v1`.

Effet : une seule source UX agrège le runtime R0→R7 sans exposer les internals et sans reconstruire une progression séquentielle.

Validation : accès autorisé, accès transversal refusé, état non classifié, état `IDEA_ENGINE`, aucune clé `phase/step/progress/completion_percentage`.

## Slice 2 — G0 / Blueprint Fit — NEXT

But : après Capture, déterminer si le Blueprint `SITE_VITRINE 0.4` couvre réellement l'idée.

Règles :

- ne jamais assigner Site vitrine par défaut à toute idée ;
- utiliser les informations déjà fournies avant de demander à l'humain ;
- si le fit est suffisamment certain, proposer/valider une classification traçable ;
- si une ambiguïté matérielle persiste, demander une seule clarification ciblée ;
- si le Blueprint ne convient pas, enregistrer `BLUEPRINT_MISMATCH` sans perdre RAW, sources ni historique ;
- initialiser `initialize_idea_engine_v1` uniquement après fit Site vitrine valide.

## Slice 3 — Parallel workspace shell

Créer une nouvelle surface additive basée exclusivement sur la projection V1, derrière un feature flag / route parallèle.

Première version : lecture + navigation sémantique + states loading/error/empty, sans mutation moteur privilégiée.

Structure cible :

- Header Idea + lifecycle badge ;
- HUMAN_INPUT_INLINE si nécessaire ;
- VALUE_NOW central ;
- SYSTEM_MICROSTATUS compact ;
- navigation sémantique non bloquante ;
- provenance/evidence en profondeur progressive ;
- FREE_INPUT persistant.

## Slice 4 — Privileged action adapter

Les RPCs R3→R7 restent `service_role only`.

Créer une frontière serveur qui :

1. authentifie le JWT utilisateur ;
2. vérifie le droit sur l'Idea/Project Definition ;
3. valide l'action demandée et sa revision/fingerprint ;
4. appelle uniquement une RPC allowlistée avec service role ;
5. renvoie un résultat UX minimal ;
6. journalise l'acte ;
7. n'expose jamais la clé service-role au navigateur.

Le Worker Cloudflare est la cible architecturale préférée si le secret service-role peut être provisionné proprement. Ne pas coder de contournement client.

## Slice 5 — Idea workspace interactions

Brancher progressivement :

- ajout/correction d'information humaine ;
- sources ;
- réponses last-mile ;
- actions système ;
- artefacts de préfiguration ;
- review/feedback ;
- Decision Package et décision.

Les anciennes `idea_items` peuvent rester en lecture/compatibilité durant la transition, mais ne doivent plus définir la maturité canonique.

## Slice 6 — Project Definition / Build Ready UI

Après GO explicite :

- montrer la baseline approuvée ;
- distinguer clairement `FOR_PROJECT` et `FOR_BUILD` ;
- projeter G8→G12 sans les transformer en checklist utilisateur ;
- faire apparaître les décisions humaines/expert réellement requises ;
- exposer les artefacts A19→A25 et le Build Ready Snapshot.

## Slice 7 — Legacy retirement

Retirer progressivement :

- `ideas-orchestrator-v2.js` comme autorité ;
- la bande `Clarifier / Renforcer / Étayer / Partager / Décider` ;
- le `maturity 5/5` de `ideas-v1.js` ;
- les gardes décisionnelles fondées sur `hasPath/hasRisk/hasEvidence/reviews` ;
- les conversions legacy qui créent directement un Project d'exécution.

Chaque retrait exige un smoke test de la nouvelle surface et un rollback simple.

## Critères de réussite du cutover

- aucune question répétée évitable ;
- aucune page d'attente passive obligatoire ;
- aucun pourcentage de complétion artificiel ;
- aucune décision humaine escamotée ;
- aucun Blueprint forcé ;
- aucun appel browser à une RPC service-role ;
- les changements matériels rendent seulement les descendants concernés stale ;
- les utilisateurs peuvent toujours comprendre où en est leur idée et ce qui nécessite réellement leur attention.
