# 4b4c — IDEA DETAILED CATALOG — V0.1

Date : 2026-09-13

Statut : **WORKING CANDIDATE — NON CANONIQUE**

Périmètre : D01→D07, Z0→Z3 jusqu’à sélection d’une direction à préfigurer.

---

# D01 — Governance, Stakeholders & Decision Context

## D01.1 — Decision topology

**Mission** : savoir qui contribue, qui tranche et quel niveau de preuve est attendu.

**Questions internes**
- décision solo, équipe, client, comité ?
- qui peut engager la décision ?
- qui conseille sans décider ?
- existe-t-il un sponsor, un veto ou une validation externe ?
- consensus requis ou owner final ?
- quel type de décision est réellement préparé maintenant ?

**Résolution** : R1/R6 pour structure connue ; R8 pour autorité/méthode.

**Humain** : `NONE` si solo évident ; sinon `LIGHT_REVIEW` puis `FORMAL_APPROVAL` seulement pour owner/method.

**Prérequis** : identité du porteur.

**Sorties** : Decision Owner, Decision Question, governance mode.

**Unlocks** : profondeur de recherche, mode de présentation, autorité des approvals.

**Lock** : `LOCKED_FOR_DEPENDENTS` dès que l’autorité est fiable.

## D01.2 — Stakeholder interests & conflicts

**Questions internes**
- quelles parties prenantes ont des objectifs différents ?
- quels désaccords sont déjà connus ?
- lesquels changent réellement la direction ?
- quels intérêts ne doivent pas être confondus avec les besoins utilisateur ?
- existe-t-il des engagements politiques/commerciaux préexistants ?

**Résolution** : R1/R4 pour signaux ; R6 pour intérêts internes non observables ; R8 si arbitrage.

**Humain** : seulement si conflit matériel.

**Sorties** : conflict groups, stakeholder constraints.

**Change impact** : réouvre décisions affectées, pas les facts indépendants.

## D01.3 — Decision timing & evidence expectations

**Questions internes**
- quand la décision doit-elle être prise ?
- quelles contraintes de réunion/budget/calendrier existent ?
- quel niveau de preuve le décideur attend-il ?
- faut-il démontrer marché, faisabilité, ROI, prototype ou seulement direction ?

**Résolution** : R6/R8.

**Unlocks** : Prefiguration Budget, D21, D22.

## D01.4 — Source authority

**Questions internes**
- quelles sources sont officielles ?
- que faire si site, brief et dirigeant se contredisent ?
- quelle fraîcheur est acceptable ?
- une donnée historique est-elle encore normative ?

**Résolution** : R1/R3 ; R8 seulement si conflit non résolvable.

**Sorties** : source precedence + freshness rules.

---

# D02 — Business Context, Problem & Outcomes

## D02.1 — Organisation & business model context

**Questions internes**
- quelle organisation porte l’idée ?
- secteur, activité, zone, maturité ?
- entreprise existante ou création ?
- comment génère-t-elle de la valeur/revenu si pertinent ?
- offre/service principal aujourd’hui ?
- existe-t-il un changement stratégique en cours ?

**Résolution** : R1 depuis sources ; R4 si contexte partiel ; R6 uniquement pour stratégie future non publique.

**Humain** : `OPTIONAL_CORRECTION` par défaut.

**Unlocks** : D03, D04, D05.

## D02.2 — Problem / opportunity framing

**Questions internes**
- quel problème est déclaré ?
- qui le subit ?
- comment se manifeste-t-il ?
- problème business, utilisateur, opérationnel, image ou acquisition ?
- quelle opportunité est recherchée ?
- quelle part est observée vs supposée ?
- quelles causes racines sont plausibles ?

**Résolution** : déclaration via R1/R6 ; audit R2 ; causes R4.

**Humain** : ne jamais demander de “cause racine” si l’IA peut seulement hypothétiser ; préserver distinction declared/observed/hypothesis.

**Lock** : problème déclaré peut être locké tôt ; causalité jamais sans preuve suffisante.

## D02.3 — Outcomes hierarchy

**Questions internes**
- objectif business principal ?
- objectifs secondaires ?
- résultat attendu pour l’utilisateur ?
- comportement/action que le produit doit faciliter ?
- quels objectifs entrent en tension ?
- quel objectif doit gagner en cas de trade-off ?

**Résolution** : R6 pour intention ; R5 pour structuration/recommandation ; R8 pour priorité finale.

**Humain** : `EXPLICIT_CHOICE` seulement si plusieurs objectifs changent réellement la solution.

**Output** : Problem & Outcome Frame.

## D02.4 — Success definition

**Questions internes**
- quels critères qualitatifs permettent de dire que la direction est meilleure ?
- quelles données existent déjà ?
- KPI réel ou faux besoin de chiffrage ?
- baseline disponible ?
- cible chiffrée réellement nécessaire ?

**Résolution** : R1/R3 pour données ; R5 pour critères ; R6/R8 pour cible engageante.

**Règle** : pas de KPI inventé.

## D02.5 — Hard/soft constraints

**Questions internes**
- budget plafond réel ?
- deadline réellement impérative ?
- plateforme imposée ?
- ressources internes ?
- langues/juridiction ?
- contraintes contractuelles ?
- qu’est-ce qui est hard vs préférence ?

**Résolution** : R1 si source ; R6 sinon ; R3 pour classification hard/soft ; R8 pour arbitrage.

**Lock** : contraintes hard `LOCKED_FOR_DEPENDENTS` dès validation.

---

# D03 — Users, Audiences, Segments & Jobs

## D03.1 — Audience topology

**Questions internes**
- B2B/B2C/interne/mixte ?
- qui est cible primaire ? secondaire ?
- acheteur, utilisateur, bénéficiaire, influenceur sont-ils différents ?
- quel segment précis importe ?
- quelle géographie ?
- existe-t-il un changement volontaire de cible ?

**Résolution** : R1/R2/R4 pour actuel ; R6/R8 pour cible future voulue.

**Humain** : obligatoire uniquement si intention stratégique non observable.

## D03.2 — Jobs / needs / desired outcomes

**Questions internes**
- que cherche réellement à accomplir la cible ?
- quel besoin fonctionnel ? émotionnel ? de confiance ?
- quel résultat recherche-t-elle ?
- dans quel contexte ce besoin apparaît-il ?

**Résolution** : R1 via études/reviews/data, R4 hypothèse, R5 synthèse.

**Règle** : une IA ne transforme pas une hypothèse JTBD en vérité utilisateur.

## D03.3 — Selection criteria & objections

**Questions internes**
- comment la cible compare-t-elle les solutions ?
- quels freins : prix, confiance, délai, proximité, risque, effort, compréhension ?
- quelles preuves rassurent ?
- quelles objections sont réellement observées ?

**Résolution** : R1/R2/R4 ; R5 pour modèle.

**Unlocks** : D05, D06, D08, D10.

## D03.4 — Acquisition & usage context

**Questions internes**
- comment découvre-t-on l’offre ?
- Google/local/social/referral/direct ?
- mobile dominant ? urgence ? comparaison longue ?
- besoin multilingue ? access context particulier ?
- offline handoff important ?

**Résolution** : R1/R2/R4.

## D03.5 — Audience evidence sufficiency

**Questions internes**
- quelles preuves comportementales existent ?
- analytics, CRM, avis, appels, interviews, Search Console ?
- où avons-nous uniquement des hypothèses ?
- faut-il une validation utilisateur avant décision ?

**Résolution** : R3/R4 ; active Z4b si risque structurant.

**Verify** : D05 ne doit pas benchmarker un mauvais marché faute de cible.

---

# D04 — Existing State, Assets & Evidence

## D04.1 — Existing product/site inventory

**Questions internes**
- création ou refonte ?
- URL(s), pages/routes, navigation, formulaires, CTA ?
- quelles surfaces sont stratégiques ?
- quelles fonctions existent déjà ?
- quels contenus sont réellement actifs ?

**Résolution** : R1/R2 presque toujours.

**Humain** : aucune question si crawl/source suffit.

## D04.2 — Offer/content/brand truth

**Questions internes**
- quelles offres sont réellement actuelles ?
- quels contenus/preuves/assets peuvent être réutilisés ?
- quelle charte est officielle ?
- quels éléments doivent être conservés ou supprimés ?
- droits d’usage connus ?

**Résolution** : R1 pour existant ; R6 pour must-keep/must-remove si intention interne.

## D04.3 — Performance & acquisition baseline

**Questions internes**
- trafic, conversions, pages fortes/faibles ?
- requêtes, URLs importantes, indexation ?
- source principale de leads ?
- données fiables et récentes ?

**Résolution** : R1/R2/R3 via connectors/audit.

**Règle** : absence de data ≠ mauvaise performance prouvée.

## D04.4 — Strengths / weaknesses / friction audit

**Questions internes**
- qu’est-ce qui fonctionne objectivement ?
- où la compréhension échoue-t-elle ?
- où la conversion est-elle freinée ?
- quelles preuves manquent ?
- quelles observations sont seulement heuristiques ?

**Résolution** : R2 + R4 ; R5 synthèse.

**Output** : Current State Evidence Pack.

## D04.5 — Migration & preservation risk probe

**Questions internes**
- SEO à préserver ?
- URLs/backlinks/contents critiques ?
- données/CMS à migrer ?
- domaine/hosting/email sensibles ?
- dépendances techniques existantes ?

**Résolution** : R1/R2/R4.

**Unlocks** : D11/D16 Project si GO.

---

# D05 — Market, Competition, Alternatives & References

## D05.1 — Market frame

**Questions internes**
- quel marché/category doit être étudié ?
- zone géographique pertinente ?
- même audience + même besoin + même offre ?
- marché local, national, niche ou substitution ?

**Résolution** : R3 depuis D02/D03/D04 ; R4 si ambigu.

**Gate** : ne pas rechercher avant frame suffisamment fiable.

## D05.2 — Direct competitors

**Questions internes**
- qui cible le même segment avec une offre comparable ?
- quels acteurs sont réellement pertinents et pourquoi ?
- leur positionnement, offre, prix visible, preuve, CTA, navigation, contenu, fonctions ?

**Résolution** : R1/R2/WEB ; aucune question humaine nécessaire par défaut.

## D05.3 — Alternatives / substitutes / non-consumption

**Questions internes**
- quelles alternatives indirectes résolvent le même besoin ?
- bricolage/DIY/offline/réseaux sociaux/marketplaces ?
- pourquoi quelqu’un pourrait ne rien faire ?

**Résolution** : R1/R4/R5.

## D05.4 — Reference benchmark

**Questions internes**
- quels exemples hors concurrence illustrent une excellente pratique ?
- quelles structures, preuves, interactions ou contenus sont transférables ?
- qu’est-ce qui serait du mimétisme sans justification ?

**Résolution** : R1/R2/R5.

## D05.5 — Pattern / gap / opportunity synthesis

**Questions internes**
- quels patterns sont standards de catégorie ?
- quels patterns sont faibles/banalisés ?
- quelles bonnes pratiques sont utiles ?
- quelles erreurs sont récurrentes ?
- où existe un espace de différenciation ?
- avons-nous suffisamment recherché pour décider ?

**Résolution** : R3/R4/R5.

**Stopping rule** : arrêter lorsque nouvelles sources n’ajoutent plus d’insight susceptible de changer la décision.

**Output** : Market & Competitive Landscape.

---

# D06 — Opportunity, Strategy, Value Proposition & Positioning

## D06.1 — Opportunity synthesis

**Questions internes**
- que révèle la combinaison problème + cible + evidence + marché ?
- quelles opportunités sont réellement supportées ?
- quelles hypothèses restent fragiles ?

**Résolution** : R4/R5.

## D06.2 — Original idea challenge

**Questions internes**
- l’idée initiale répond-elle toujours au meilleur problème ?
- est-elle trop large, trop complexe, trop banale ?
- peut-on retirer des éléments sans perdre la valeur ?
- existe-t-il une solution radicalement plus simple ?
- une autre direction sert-elle mieux l’objectif ?

**Résolution** : R5, avec evidence.

**Humain** : pas avant que des options concrètes existent.

## D06.3 — Candidate strategic directions

**Questions internes**
- quelles 1–3 directions sont réellement distinctes ?
- proposition de valeur ?
- positionnement ?
- mécanisme de conversion ?
- différenciation ?
- assumptions / risks / feasibility probes ?

**Résolution** : R5.

**Output** : Opportunity & Options Map.

## D06.4 — Option comparison

**Questions internes**
- quelle option sert le mieux outcomes ?
- fit cible ? evidence ? différenciation ? complexité ? coût ? risque ?
- qu’est-ce qui pourrait inverser la recommandation ?

**Résolution** : R3/R5.

**Humain** : `EXPLICIT_CHOICE` si l’owner doit choisir entre trade-offs irréductibles.

## D06.5 — Strategic direction selection for prefiguration

**Questions internes**
- quelle direction mérite d’être rendue tangible ?
- faut-il préfigurer une seule option ou deux pour comparaison ?
- quelles incertitudes doit Z4 réduire ?

**Résolution** : R5 proposition ; R8 sélection/autorisation si coût de préfiguration significatif.

**Lock** : `LOCKED_FOR_DEPENDENTS`, pas approval Project.

---

# D07 — Offer, Product/Service Model & Macro Scope

## D07.1 — Offer hierarchy

**Questions internes**
- quelles offres sont prioritaires ?
- lesquelles soutenir, développer, réduire ?
- quel lien avec target/outcomes ?
- pricing/model influence-t-il la solution ?

**Résolution** : R1 pour actuel ; R6/R8 pour priorité future ; R5 pour recommandation.

## D07.2 — Macro value delivery model

**Questions internes**
- que doit permettre le futur produit à haut niveau ?
- quelles capabilities servent directement le journey/outcome ?
- quelles parties peuvent rester offline ?

**Résolution** : R5.

## D07.3 — Macro scope boundary

**Questions internes**
- must-have conceptuel ?
- optional value ?
- later ?
- explicitement non recommandé ?
- quels non-goals doivent être visibles ?

**Résolution** : R5 puis R8 pour boundary engageante.

## D07.4 — Feasibility-sensitive scope

**Questions internes**
- quelle capability nécessite un probe technique ?
- quel vendor/integration pourrait invalider le concept ?
- quel élément crée disproportion coût/valeur ?

**Résolution** : R4/R5 ; R9 si risque expert.

## D07.5 — Prefiguration brief

**Questions internes**
- que faut-il matérialiser pour décider sans construire un mini-Project ?
- journey ? sitemap ? functions ? DA ? prototype ? business case ?
- quelle fidelity est réellement utile ?

**Résolution** : R3/R5 à partir de Decision Question.

**Unlocks** : Z4 Prefguration Budget.

---

# Gates IDEA — détail

## G1 FOUNDATION_LOCKABLE
Doit être suffisamment résolu : D01 authority si collectif, D02 objective/problem/constraints, D03 target, création/refonte et sources principales D04.

## G2 EVIDENCE_CONTEXT_SUFFICIENT
D04 evidence + D05 market context + provenance/freshness/conflicts suffisamment maîtrisés pour challenger l’idée.

## G3 STRATEGIC_OPTIONS_READY
D06 opportunities/options + D07 macro implications + risky assumptions/probes disponibles.

## G4 PREFIGURATION_TARGET_SELECTED
Au moins une direction mérite Z4 et les questions que la préfiguration doit réduire sont explicites.

---

# Question minimization rule — IDEA

À ce stade, les questions humaines typiquement légitimes sont surtout :

- objectif futur réellement prioritaire ;
- cible future si différente de l’actuelle ;
- offre à pousser/réduire ;
- hard budget/deadline/constraint si décisionnelle ;
- arbitrage de conflit interne ;
- sélection entre directions à trade-off réel.

Les questions suivantes doivent en général être résolues sans utilisateur : concurrents, sitemap actuel, pages actuelles, patterns du marché, besoins probables, objections probables, audit UX, opportunités, sitemap candidat, feature candidates.
