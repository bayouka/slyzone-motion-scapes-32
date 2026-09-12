# 4b4c — WORKFLOW V7.1 CONSOLIDÉ
## Blueprint « Site vitrine »
### De l’idée brute à une décision éclairée, puis éventuellement au Project Draft

## 0. Mission

4b4c ne doit pas transformer une idée en questionnaire rempli, ni demander à une IA de trouver « le meilleur projet ».

Sa mission avant création du Project est de prendre une idée souvent vague, comprendre ce qu’elle signifie réellement, exploiter les informations existantes, compléter seulement ce qui est nécessaire, rechercher ce qui peut éclairer la réflexion, proposer des solutions argumentées, les rendre suffisamment concrètes, puis préparer la bonne personne ou la bonne équipe à prendre une décision éclairée.

Une bonne sortie peut être : lancer, approfondir, modifier, mettre en pause, arrêter.

## 1. Fixe vs adaptatif

### Fixe
- mémoire persistante ;
- provenance ;
- registre des informations/questions ;
- moteur de dépendances ;
- recommandations encadrées ;
- gestion des changements ;
- préparation de décision ;
- sauvegarde/versionnement.

### Adaptatif
- nombre et ordre des questions ;
- profondeur de recherche ;
- alternatives ;
- wireframe / maquette ;
- présentation ;
- atelier ;
- budget / planning avant décision.

## 2. Parcours utilisateur visible

```text
UNE IDÉE
↓
2b2c M’AIDE À LA COMPRENDRE
↓
2b2c TRAVAILLE ET ME POSE QUELQUES QUESTIONS
↓
UNE PROPOSITION COMMENCE À PRENDRE FORME
↓
JE PEUX VOIR À QUOI ELLE POURRAIT RESSEMBLER
↓
NOUS AVONS ASSEZ D’ÉLÉMENTS POUR JUGER
↓
JE DÉCIDE SEUL OU NOUS LA JUGEONS EN ÉQUIPE
↓
LANCER / APPROFONDIR / PAUSE / ARRÊTER
```

## 3. États internes

`CAPTURED → UNDERSTOOD → DISCOVERING → EVIDENCE_BUILDING → PROPOSAL_FORMING → PROPOSAL_SUFFICIENT → DECISION_PREPARATION → READY_FOR_DECISION → DECIDING → GO / REVISE / PAUSE / STOP`

## 4. Project Memory de l’idée

Types : `FACT / PREFERENCE / CONSTRAINT / ASSUMPTION / OPTION / EVIDENCE / RISK / QUESTION / DECISION`.

## 5. Provenance

`HUMAN_DECLARED / SOURCE_EXTRACTED / WEB_RESEARCH / SYSTEM_CALCULATED / AI_INFERRED / AI_RECOMMENDED`.

## 6. États des informations

`PROPOSED / CURRENT / ACCEPTED_AS_CURRENT / CONFIRMED / FROZEN_IN_SNAPSHOT / SUPERSEDED / REJECTED / REVIEW_REQUIRED / ACCEPTED_UNKNOWN`.

`ACCEPTED_AS_CURRENT` n’est jamais une décision définitive.

## 7. Sauvegarde — invariant RAW FIRST

La persistance ne dépend jamais du succès d’un appel IA. Dès l’ouverture de la capture, créer une `IDEA` en état brouillon. Autosauvegarder progressivement le nom, le brief brut, les liens et les références de pièces jointes. Un fichier sélectionné doit être réellement stocké avant qu’une navigation puisse faire perdre sa copie locale.

Avant tout appel IA : confirmer que la version brute concernée et ses sources sont persistées. L’analyse IA traite toujours une version identifiable de la capture ; elle ne constitue jamais l’unique copie de l’information utilisateur.

## 8. Autosave, versions et reprise

Tout changement significatif est persisté. Le brief original et ses versions restent conservés. Au retour : « On en était ici… » avec ce qui a été retenu, ce qui a changé et le NBA actuel. Une analyse tardive d’une ancienne version ne doit jamais écraser silencieusement une version plus récente.

## 9. Nouvelle idée — capture libre et potentiellement riche

Champs : nom provisoire, grande zone libre « Quelle est votre idée ? », action unique et explicable pour ajouter des éléments existants : lien, fichier, image/photo ou autre source utile.

Le texte d’aide ne doit pas inciter artificiellement à faire court. Quelques mots peuvent suffire pour démarrer, mais l’utilisateur peut fournir autant de détails qu’il connaît déjà : objectifs, publics, fonctionnalités imaginées, contraintes, préférences visuelles, couleurs, références, inspirations, budget, gouvernance, etc. Plus une information utile est déjà fournie, moins 2b2c doit la redemander plus tard.

L’interface doit expliquer à quoi servent les liens, fichiers et images et donner des exemples : site existant, concurrent, inspiration, brief, présentation, étude, maquette, capture d’écran, logo, ancienne documentation.

Le bouton `Commencer` ne signifie pas « sauvegarder ». Les données brutes sont déjà sauvegardées. Il signifie : « ma première saisie est suffisamment fournie pour lancer l’analyse et entrer dans le workspace ». Au clic : vérifier la persistance de la capture et la fin des uploads requis, créer une version/snapshot de capture, lancer l’analyse 2b2c, puis permettre l’entrée dans le workspace sans attendre la fin du raisonnement IA.

## 9 bis. Ingestion initiale et préremplissage de la mémoire

Avant toute première question, 2b2c exploite intégralement le brief, les documents, liens, images et sources déjà fournis. Il effectue une extraction atomique et contextualisée : une même phrase peut alimenter plusieurs domaines.

Exemple : « je veux un site rouge et orange avec du claymorphism, une galerie et un formulaire de devis » peut produire des `PREFERENCE` de design (rouge, orange, claymorphism) et des `OPTION` fonctionnelles (galerie, devis), chacune reliée à la phrase source.

L’extraction doit comprendre négation, modalité et temporalité. « Je déteste le rouge » n’est pas une préférence positive ; « le rouge pourrait me plaire » reste une piste ; « mon ancien site était orange » n’est pas automatiquement une préférence actuelle. Les ambiguïtés restent ambiguës.

Préremplir ne signifie jamais figer. Une information extraite reçoit un type, une provenance et un état approprié (`CURRENT`, `PROPOSED`, etc.). Les préférences fournies très tôt peuvent rester invisibles jusqu’au moment où leur domaine devient pertinent, mais elles ne doivent pas être redemandées comme si elles n’avaient jamais été fournies.

Le « document de l’Idée » visible est une vue synthétique construite à partir de la mémoire structurée et des sources ; il ne doit pas être l’unique blob de vérité.

Le contrat détaillé est défini dans `CAPTURE_INGESTION_MEMORY_CONTRACT_V1.md`.

## 10. Première compréhension

Afficher : `Vous avez indiqué / J’ai compris-déduit / Je ne sais pas encore` avec actions C’est correct / Corriger / Modifier. Cette surface présente ce qui mérite réellement contrôle humain ; elle n’a pas à répéter exhaustivement toutes les informations déjà classées.

Condition de sortie : `UNDERSTANDING_SUFFICIENT`.

## 11. Vue permanente « Où en est l’idée ? »

Trois catégories utilisateur : `Acquis pour l’instant / À examiner maintenant / Peut attendre`.

## 12. Next Best Action

Toujours une action dominante, expliquée par sa conséquence. L’utilisateur n’a pas à connaître la méthode.

## 13. Question Registry

Chaque question connaît : `information_key, why_needed, required_for, searchable, extractable, inferable, human_only, priority, skip_conditions, dependencies`.

## 14. Avant toute question

1. Déjà connu ? ne pas demander.
2. Dans source/document/site ? extraire.
3. Objectivement recherchable ? rechercher.
4. Raisonnablement inférable ? proposer hypothèse.
5. Humain seul peut savoir/décider ? demander.
6. Nécessaire maintenant ? sinon différer.

## 15. Answer Resolver

Une réponse riche peut résoudre plusieurs questions et mettre à jour plusieurs memory items.

## 16. « Je ne sais pas »

Ordre : reformuler → question concrète connue → sources → recherche → hypothèse → pas maintenant.

## 17. Discovery initiale

Chercher suffisamment à comprendre : contexte, objectif, audience/hypothèse, offre, priorité, conversion, zone si locale, existant. Jamais sous forme de questionnaire imposé.

## 18. Exploiter l’existant avant de demander

Un site/PDF/deck/source est analysé avant questionnement. On demande seulement ce qui reste ambigu ou doit être confirmé.

## 19. Research Planner

La recherche n’existe que si elle peut éclairer une décision. Audit, concurrents, références, SEO, standards, réglementation, tendances selon le cas.

## 20. Contrat de recherche

Toute recherche commence par une question de décision : « quelle décision cette recherche doit-elle éclairer ? »

## 21. Evidence Model

`SOURCE → OBSERVATION → INTERPRETATION → CONSEQUENCE POSSIBLE`.

## 22. Arrêt de recherche

Stop lorsque de nouvelles recherches ont peu de chances de modifier significativement les décisions restantes.

## 23. Evidence Pack utilisateur

Montrer seulement 3–7 conclusions importantes avec accès « Pourquoi 2b2c dit cela ? ».

## 24. Diagnostic

Forces, faiblesses, opportunités, risques, contradictions, informations manquantes.

## 25. Génération de candidats

Une direction si convergence forte ; deux si vrai compromis ; plusieurs hypothèses si terrain ouvert ; aucune recommandation si données insuffisantes.

## 26. Recommendation Contract

Toute recommandation structurante : `recommendation, objective, evidence, assumptions, criteria, alternatives_considered, tradeoffs, risks, confidence_level, what_could_change_this`.

## 27. Confiance

Pas de faux pourcentage. Libellés : `Bien étayé / Raisonnable mais à confirmer / Hypothèse de travail / Informations insuffisantes`.

## 28. Validation d’une direction

UI : « Partir sur cette direction » ou « Utiliser cette hypothèse pour la suite ». Devient `ACCEPTED_AS_CURRENT`.

## 29. Formation de la proposition candidate

Positionnement, message, conversion, parcours, structure, pages, fonctionnalités, contenus, scope V1, plus tard, non recommandé.

## 30. Structure du site

Utilisateur novice voit « Structure proposée du site », pas « sitemap ». Chaque page explique pourquoi elle existe.

## 31. Modification

La modification naturelle ne ramène pas à une ancienne étape. Le moteur analyse l’impact du delta.

## 32. Scope

Toujours : `Pour la première version / Peut attendre / Non recommandé actuellement`.

## 33. Nouvelle fonctionnalité

Analyser `NEED / VALUE / COMPLEXITY / DEPENDENCIES / ALTERNATIVE` puis Intégrer / Étudier / Plus tard / Abandonner.

## 34. Change Intelligence

- COSMETIC : pas de réanalyse.
- CONTEXTUAL : impact limité.
- SUBSTANTIVE : réouvrir domaines affectés.
- CRITICAL : possible reclassification de l’idée.

## 35. Contenus

UI : `Déjà disponible / À vérifier / À préparer si le projet est lancé / Peut attendre`.

## 36. Matérialisation adaptative

`AUCUNE / APERÇU RAPIDE / CONCEPT POUSSÉ` selon nécessité décisionnelle.

## 37. Message novice projection

« Cette projection sert à imaginer le futur site. Les photos, textes et détails pourront encore changer si le projet est lancé. »

## 38. Decision Requirements

Avant décision, déterminer ce dont les décideurs ont réellement besoin : concept, prototype, faisabilité, budget, délai, validation juridique/technique, scénario économique, avis tiers, autre.

## 39. Solo ou équipe

Question : qui prend la décision ?
- Solo : revue personnelle.
- Équipe : identifier Driver/Idea Steward, Decision Owner si applicable, Contributors, méthode de décision.

## 40. Pre-Decision Coverage Map

Dimensions : `WHY / WHO / WHAT / EVIDENCE / PROPOSAL / ALTERNATIVES / SCOPE / VISUALIZATION / FEASIBILITY / RISKS / IMPACT / DECISION_REQUIREMENTS`.

État de chaque dimension : `READY / PARTIAL / UNKNOWN_ACCEPTABLE / BLOCKING`.

## 41. Q&A Pack

Questions probables avant revue/préentation avec `ANSWERED / PARTIAL / UNKNOWN`. 2b2c n’invente jamais pour paraître prêt.

## 42. Presentation Strategy

Si équipe : `Présentation complète / Présentation courte / Pas de présentation formelle` selon niveau d’implication existant.

## 43. Deck

Deux catégories visibles : `Déjà aligné / À discuter aujourd’hui`.

## 44. Pendant présentation

Deux actions distinctes : `Noter pour plus tard` et `Demander la parole`. Notes privées par défaut pendant le deck.

## 45. Structured Workshop

Contributions comme objets : `QUESTION / IDEA / OBJECTION / RISK / PROPOSAL`, jamais chat global comme source principale.

## 46. Chaque contribution

Auteur, contenu, type, contexte/slide, thème, état, réactions, discussion, impact, résolution.

## 47. Organisation par 2b2c

Dédupliquer, regrouper, résumer, détecter contradictions, classer, proposer ordre. Originales toujours conservées.

## 48. Atelier

Discuter uniquement `NEEDS_DISCUSSION`. Replier `ALREADY_RESOLVED / FYI / DUPLICATE`.

## 49. Intervention IA

Réponse factuelle sourcée, recherche, analyse impacts, comparaison, challenge, alternative. Les humains contribuent avant que 2b2c ne structure les sujets importants.

## 50. Consensus

Unanimité = `TEAM_CONSENSUS`, pas décision officielle. Le mode de décision s’applique ensuite.

## 51. Fin d’atelier

Chaque contribution importante reçoit : `Intégrer / Approfondir / Plus tard / Rejeter / Accepter comme inconnue`.

## 52. Synthèse atelier

Accord, changements à intégrer, plus tard, rejeté, désaccords restants, questions ouvertes, nouveaux risques, avis 2b2c.

## 53. Validation de synthèse

Correct / Corriger. Candidate V1 jamais modifiée silencieusement.

## 54. Candidate V2

Candidate V1 immutable. Candidate V2 créée après intégration des changements. Réévaluation uniquement des domaines affectés.

## 55. Decision Brief

Proposition actuelle, pourquoi, evidence, alternatives, changements, positions équipe, consensus, objections, risques, inconnues, Decision Requirements, recommandation 2b2c, Decision Question.

## 56. Recommandation 2b2c

`Lancer / Lancer avec modifications / Approfondir / Pause / Arrêter / Pas assez d’éléments`. Toujours via Recommendation Contract.

## 57. Décisions utilisateur

`Lancer le projet / Lancer avec modifications / Approfondir-revoir / Mettre en pause / Ne pas poursuivre`.

## 58. GO non favorisé

Arrêter une mauvaise idée et approfondir avant de dépenser sont des réussites du produit.

## 59. Approfondir / Pause / Stop

Approfondir : identifier ce qui bloque et générer le NBA. Pause : raison + condition de reprise facultatives. Stop : historique conservé et possibilité de créer une nouvelle idée depuis une alternative.

## 60. GO → Project Draft

Création uniquement après décision de lancer.

## 61. Handoff sélectif

Contexte actif transféré : objectif, audience, offre, positionnement, contraintes, décisions, Candidate finale, sitemap, parcours, scope, recherche utile, preuves, contenus/assets, risques, questions ouvertes, inconnues acceptées, décisions équipe.

Anciennes hypothèses/candidates/recommandations rejetées restent historique seulement.

## 62. Objets techniques conceptuels

`ideas / idea_memory_items / idea_questions / idea_answers / idea_sources / idea_evidence / idea_recommendations / idea_candidates / idea_snapshots / idea_decision_requirements / idea_collaboration_items / idea_reactions / idea_decisions / idea_ai_runs`.

## 63. Moteurs internes

1. Memory Engine
2. Question Engine
3. Evidence Engine
4. Recommendation Engine
5. Change Intelligence
6. Decision Requirements Engine
7. Coverage Engine
8. Collaboration/Decision Engine

## 64. Rôle du LLM

Bon pour comprendre, extraire, reformuler, synthétiser, comparer, proposer, challenger, analyser documents, générer candidats, classifier retours.

Pas responsable seul de permissions, états, provenance, écrasement de données, décision, readiness déterministe, mutation de vérité métier.

## 65. Architecture de principe

```text
USER / TEAM
     ↓
RAW CAPTURE / SOURCE PERSISTENCE
     ↓
VERSION IDENTIFIABLE
     ↓
EVENT
     ↓
NORMALIZE + ATOMIC EXTRACTION
     ↓
PROJECT MEMORY
     ↓
DETERMINISTIC POLICY
     ↓
BLUEPRINT / CAPABILITIES
     ↓
LLM REASONING SI NÉCESSAIRE
     ↓
PROPOSAL / ANALYSIS
     ↓
POLICY CHECK
     ↓
AUTO-APPLY LOW CONSEQUENCE OU HUMAN CONFIRMATION
     ↓
MEMORY UPDATE
     ↓
NEXT BEST ACTION
```

## 66. Dégradation sans IA

Données, historique, décisions, commentaires, fichiers, sauvegarde, navigation, états et permissions continuent. L’intelligence se dégrade, l’application ne casse pas.

## 67. Critères de réussite UX

L’utilisateur doit pouvoir répondre rapidement à : Où en suis-je ? Qu’est-ce qui est acquis ? Qu’est-ce qu’on me demande maintenant ? Pourquoi ? Puis-je changer d’avis ? Puis-je arrêter et revenir ?

## 68. Principes V7

1. Une idée n’est pas un projet.
2. 2b2c exploite l’existant avant de questionner.
2 bis. La capture brute et ses sources sont persistées avant analyse ; l’IA enrichit la mémoire mais n’est jamais le mécanisme de sauvegarde.
2 ter. Une information déjà présente dans le brief, un lien, un fichier ou une image est extraite, classée et réutilisée dans le bon domaine sans être redemandée inutilement.
3. Une question n’existe que parce qu’une information nécessaire manque.
4. « Je ne sais pas » est valide.
5. Une proposition IA n’est jamais une vérité.
6. Les recommandations sont explicables.
7. La profondeur pré-GO dépend de la décision.
8. Présentation et atelier sont facultatifs.
9. Chaque équipe peut décider différemment.
10. Les inconnues ne sont pas masquées.
11. Un changement ne fait pas recommencer tout le travail.
12. Tout le contexte utile survit Idea → Project.

## 69. Workflow canonique V7 final

```text
IDÉE BRUTE
↓
CAPTURE + AUTOSAVE
↓
PREMIÈRE COMPRÉHENSION
↓
EXPLOITER SOURCES / EXISTANT
↓
RÉSOUDRE GAPS D’INFORMATION
↕
QUESTIONS HUMAINES UNIQUEMENT SI UTILES
↓
RECHERCHE CIBLÉE SI ELLE PEUT AIDER
↓
EVIDENCE + DIAGNOSTIC
↓
CANDIDAT(S) / RECOMMANDATION
↓
VALIDATION DE DIRECTION NON DÉFINITIVE
↓
PROPOSITION SITE
STRUCTURE + PARCOURS + SCOPE
↓
MATÉRIALISATION SI UTILE
↓
DECISION REQUIREMENTS
↓
COVERAGE MAP + Q&A
↓
QUI PREND LA DÉCISION ?
├─ SOLO → REVUE DÉCISION
└─ ÉQUIPE → MODE DE DÉCISION → PRÉSENTATION SI UTILE → ATELIER SI NÉCESSAIRE → CANDIDATE RÉVISÉE
↓
DECISION BRIEF
↓
LANCER / APPROFONDIR / PAUSE / ARRÊTER
↓
PROJECT DRAFT si LANCER
```
