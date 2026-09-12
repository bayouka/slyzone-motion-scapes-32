# 4b4c — AUDIT QUESTIONS / ENRICHISSEMENT / CONCURRENCE — 2026-09-13

Statut : **VALIDATION SUPPORT — NON CANONIQUE**

Objet : corriger un défaut découvert dans le prototype Workspace V0.1 : trop de texte de compréhension, une question qui occupait quasiment toute la page, puis un état sans action ni valeur nouvelle visible.

Ce document audite la Matrix V5, la logique de passage compréhension → amélioration, la part réellement humaine, et les patterns intéressants de produits concurrents.

---

## 1. Diagnostic du défaut UX

Le prototype V0.1 était conceptuellement non linéaire mais restait trop proche d'un questionnaire conversationnel :

- une User NBA devenait presque une page entière ;
- après la réponse, le produit reformulait ce qui venait d'être dit ;
- `Travail utile courant / Compréhension actuelle` exposait un état moteur plutôt qu'une valeur nouvelle ;
- lorsque 2b2c travaillait seul, l'utilisateur voyait surtout du texte expliquant qu'il travaillait ;
- l'amélioration, la recherche et la confrontation au marché arrivaient trop tard dans la projection.

Décision candidate : **supprimer toute surface dont la fonction principale est de relire ce que l'utilisateur sait déjà.**

---

## 2. La Matrix V5 couvre-t-elle les vraies informations nécessaires ?

Oui pour le Blueprint Site vitrine. Elle couvre notamment :

- contexte / création ou refonte ;
- problème, objectif et résultat attendu ;
- audience ;
- offre, priorités et preuves ;
- site existant, contenus, assets et SEO ;
- concurrence, alternatives, positionnements, offres, fonctionnalités, patterns de contenu, opportunités et faiblesses ;
- diagnostic et evidence ;
- positionnement ;
- parcours / conversion ;
- sitemap / contenu ;
- fonctionnalités / scope ;
- design / marque ;
- faisabilité et contraintes ;
- économie si décisionnelle ;
- risques, inconnues et conflits ;
- gouvernance et Decision Requirements ;
- présentation / atelier ;
- handoff après GO.

Le problème n'est donc pas un manque de champs internes. Le problème est **quand et comment ces informations sont résolues et comment la valeur produite est projetée à l'utilisateur.**

---

## 3. Une information interne n'est pas une question utilisateur

La Matrix contient des dizaines de clés, mais elles ne doivent jamais devenir des dizaines de questions.

La majorité peut être obtenue par :

- description déjà fournie ;
- site existant ;
- documents / images / liens ;
- crawl public ;
- recherche web ;
- calcul ;
- hypothèse IA réversible ;
- recommandation IA.

Les questions humaines sont regroupées en cinq familles seulement.

### H1 — Intention / priorité réelle

Exemples : objectif business principal, offre que l'organisation veut réellement développer, priorité stratégique entre deux directions.

Ces éléments sont humains lorsque les sources ne peuvent pas révéler l'intention interne.

### H2 — Arbitrage ambigu

Exemples : particuliers ou entreprises, conserver ou abandonner un service, accepter une hypothèse critique.

Question uniquement si l'ambiguïté change réellement la Candidate.

### H3 — Contraintes internes non observables

Budget plafond réel, deadline impérative, fournisseur imposé, contrainte politique/interne.

Question uniquement si la décision actuelle en dépend.

### H4 — Validation d'une donnée conflictuelle ou stale

Question uniquement si les sources fiables ne permettent pas de résoudre le conflit et que le conflit est actif.

### H5 — Gouvernance / décision

Qui tranche, qui doit être convaincu, quel accord est nécessaire.

Activé uniquement lorsqu'un signal d'équipe ou de décision l'exige.

Tout le reste doit être considéré **autonomous-first**.

---

## 4. Budget de sollicitation novice

Il n'existe pas de nombre fixe de questions. En revanche :

- une seule décision cognitive dominante à la fois ;
- aucune question si 2b2c peut produire une valeur utile sans elle ;
- une question résolue disparaît immédiatement de la surface dominante ;
- ne jamais créer une nouvelle page uniquement pour la question suivante ;
- `Je ne sais pas` déclenche une autre stratégie, pas une reformulation infinie ;
- si plusieurs questions futures existent, elles restent invisibles tant qu'elles ne sont pas nécessaires.

Pour un site vitrine simple, l'expérience normale devrait souvent nécessiter **0 à 3 arbitrages humains avant une première vraie amélioration visible**, et non une série de 10 à 20 questions.

Ce chiffre est un objectif UX empirique, pas une règle de readiness.

---

## 5. Nouveau seuil : MINIMUM_WORKABLE_CONTEXT

2b2c n'attend pas que tout soit compris pour améliorer.

Il peut lancer l'enrichissement dès que les éléments suivants sont suffisamment exploitables, même sous hypothèses réversibles :

- nature de l'Idea / Blueprint ;
- activité/offre suffisamment identifiable ;
- problème ou objectif suffisamment compris ;
- audience suffisamment comprise ;
- aucun conflit critique rendant l'analyse trompeuse.

Ce seuil ne correspond pas à une nouvelle phase visible. Il sert uniquement à autoriser des actions système à fort gain.

---

## 6. AUTONOMOUS ENRICHMENT LOOP — candidat

Dès `MINIMUM_WORKABLE_CONTEXT`, 2b2c peut lancer en parallèle les actions pertinentes suivantes.

### A — Exploiter l'existant

- crawler/analyser le site actuel si disponible ;
- identifier pages, offres, CTA, messages, preuves, frictions ;
- extraire documents / références / assets ;
- distinguer observations et interprétations.

### B — Comprendre le marché utile

Pour un site commercial, un scan concurrentiel léger devient **default-on lorsque secteur + zone/marché + offre sont suffisamment identifiables**, sauf raison claire de le déclarer non pertinent.

Le scan vise généralement :

- 3 à 6 concurrents réellement pertinents ;
- alternatives indirectes si elles changent le positionnement ;
- 2 à 3 références exemplaires si utiles.

Il cherche :

- proposition de valeur ;
- offres mises en avant ;
- structure / navigation ;
- CTA / conversion ;
- preuves / rassurance ;
- fonctionnalités ;
- patterns de contenu ;
- forces observables ;
- faiblesses / frictions ;
- éléments différenciants ;
- opportunités non couvertes.

### C — Audience / conversion

- besoins probables ;
- objections ;
- contexte d'usage ;
- parcours recommandé ;
- points de preuve ;
- logique mobile / local / SEO lorsque pertinente.

### D — Challenge / simplification

- fonctions sans objectif ;
- solution disproportionnée ;
- alternative plus simple ;
- conflit objectif / scope ;
- absence de différenciation utile.

### E — Former une amélioration exploitable

Le résultat ne doit pas être un rapport exhaustif par défaut.

Première sortie recommandée : **Improvement Delta** :

1. `Ce que je changerais en premier` — maximum 3 points ;
2. `Pourquoi` — evidence/observation concise ;
3. `Ce que cela change` — positionnement, parcours, structure ou scope ;
4. recherche détaillée accessible à la demande.

L'utilisateur doit voir une nouvelle valeur, pas une synthèse de son propre texte.

---

## 7. Concurrence : deux niveaux distincts

### Niveau produit 4b4c

Benchmarks à surveiller : Buildpad, Productboard Spark, Fibery, Jira Product Discovery, IdeaBuddy, ValidatorAI, Venturekit, Taskade.

Patterns utiles :

- Buildpad : agent qui guide activement, research parallèle, challenge, sources, continuité au-delà d'un rapport ;
- Productboard Spark : contexte persistant, workflows agentiques spécialisés, competitive intelligence, traçabilité, review/accept inline et version history ;
- Fibery : feedback/evidence centralisés et reliés aux décisions, priorisation dynamique, réutilisation du contexte ;
- Jira Product Discovery : distinction Idea / delivery, insights reliés à l'idée, vues adaptées au contexte ;
- IdeaBuddy : simplicité novice, structure guidée, validation et identification des zones à améliorer ;
- ValidatorAI : vitesse de première valeur, client/concurrence/next action ;
- Venturekit : génération/refinement à partir d'une idée minimale, market/competitor monitoring et sorties polies ;
- Taskade : mémoire persistante, agents spécialisés et workflows durables.

Patterns à ne pas copier :

- score arbitraire d'idée ;
- wizard long ;
- business plan exhaustif imposé ;
- champs configurables exposés au novice ;
- roadmap d'exécution avant GO ;
- multi-agent visible comme complexité produit.

### Niveau Idea utilisateur

Chaque Idea peut activer une recherche de ses **propres concurrents**. Cette recherche doit servir directement l'amélioration et non produire une liste décorative.

La bonne sortie est :

> concurrent/référence → ce qu'il fait bien → ce qu'il fait moins bien → ce qui est transférable → ce qu'il ne faut pas copier → opportunité pour notre Candidate.

---

## 8. Nouvelle règle UX — pas de page entre question et valeur

Une User NBA est un **élément inline du workspace**, pas une destination.

Après réponse :

1. persister la réponse ;
2. la question se réduit/disparaît ;
3. recalculer uniquement les dépendances concernées ;
4. lancer ou poursuivre les System Actions ;
5. afficher un état de travail compact si nécessaire ;
6. injecter automatiquement la première nouvelle valeur substantielle dans la même surface.

Interdit :

`réponse → écran de compréhension → écran sans action → nouvelle question`.

Cible :

`réponse → conséquence immédiate → travail autonome → amélioration / comparaison / recommandation`.

---

## 9. Faisabilité réelle

La logique est faisable avec l'architecture actuelle comme base, mais elle n'est pas encore entièrement implémentée.

Déjà présents :

- persistance/version Ideas ;
- runs IA ;
- recherche publique optionnelle ;
- inspection de sources ;
- règles stale-safe partielles ;
- Cloudflare Worker / Workers AI.

À construire pour la cible :

- orchestrateur de jobs parallèles/durables ;
- modèle Requirements/Outputs cible ;
- crawling et parsing multi-source plus robustes ;
- competitive research multi-source ;
- trace fine source → observation → recommandation ;
- invalidation par dépendance ;
- budgets de recherche / quotas / retries ;
- protection contre prompt injection des sources ;
- projection UX de résultats incrémentaux.

Donc : **faisable ≠ déjà présent**. Le prototype doit tester l'expérience cible, pas simuler que le backend actuel possède déjà tout le moteur.

---

## 10. Décision issue de l'audit

Le prototype V0.1 ne doit pas être promu.

À supprimer de la cible :

- `Travail utile courant` comme bloc permanent ;
- `Compréhension actuelle` répétitive ;
- lecture obligatoire de `Pourquoi maintenant / Ensuite` à chaque micro-tour ;
- page de quasi-question unique ;
- écran passif après réponse.

À tester dans V0.2 :

- question compacte inline ;
- travail autonome visible uniquement en micro-feedback ;
- premières améliorations affichées automatiquement ;
- benchmark concurrentiel accessible mais synthétisé ;
- résultats d'abord, dossier/provenance en profondeur secondaire ;
- continuité sans navigation d'étape.
