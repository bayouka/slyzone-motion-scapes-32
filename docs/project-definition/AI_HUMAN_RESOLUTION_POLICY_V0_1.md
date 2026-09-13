# 4b4c — AI / HUMAN RESOLUTION POLICY — V0.1

Date : 2026-09-13

Statut : **CANDIDATE — NON CANONIQUE**

Objet : déterminer ce que 2b2c peut remplir seul de façon fiable, ce qu’il peut proposer comme hypothèse/recommandation, et ce qui exige réellement une intervention humaine ou experte.

---

# 1. Principe

`Requirement exists` ≠ `question must be asked`.

Le référentiel peut contenir des centaines d’atoms ; l’utilisateur ne doit voir que les interventions réellement nécessaires.

Ordre de résolution candidat :

`MEM → RAW → SRC/AUDIT → CONN/WEB → CALC → AI-H → AI-R → HUM → EXPERT → ACCEPTED_UNKNOWN`.

L’ordre précis dépend du type d’information et du risque.

---

# 2. Resolution classes

## R1 — AUTO_SOURCE_FACT

2b2c peut remplir directement depuis une source fiable.

Exemples :
- URL du site ;
- pages actuelles ;
- prestations affichées ;
- prix public ;
- charte fournie ;
- certifications présentes dans une source officielle ;
- concurrent et contenu public observé.

Comportement UX futur : visible/corrigeable en profondeur, pas de confirmation systématique.

## R2 — AUTO_AUDIT_OBSERVATION

Observation produite par audit automatisé.

Exemples :
- absence de CTA visible ;
- profondeur de navigation ;
- formulaire actuel ;
- page lente selon mesure ;
- pages indexables détectées.

Ne jamais convertir automatiquement observation → causalité.

## R3 — AUTO_DERIVED

Calcul/dérivation déterministe.

Exemples :
- conversion = leads / sessions ;
- liste de pages orphelines ;
- delta entre deux versions ;
- impact de dépendance.

## R4 — AI_HYPOTHESIS

Inference plausible mais réversible.

Exemples :
- besoin probable d’un segment ;
- objection possible ;
- problème racine potentiel ;
- importance mobile probable.

Peut suffire pour exploration si risque faible. Toujours étiquetée comme hypothèse.

## R5 — AI_RECOMMENDATION

2b2c est légitime pour proposer une solution, pas pour prétendre qu’elle est une préférence humaine.

Exemples :
- sitemap ;
- parcours ;
- positionnement ;
- fonctionnalités ;
- direction visuelle ;
- option de simplification ;
- architecture candidate.

## R6 — HUMAN_INTENT

Information interne que les sources externes ne peuvent pas déterminer de manière fiable.

Exemples :
- objectif que l’entreprise veut réellement prioriser ;
- offre à pousser ;
- cible future volontairement différente de la clientèle actuelle ;
- deadline réellement imposée ;
- budget plafond ;
- contrainte politique/interne.

Question seulement lorsqu’elle est matériellement nécessaire maintenant.

## R7 — HUMAN_PREFERENCE

Préférence subjective qui influence la solution.

Exemples :
- territoire visuel ;
- niveau d’audace ;
- préférence entre deux options équivalentes ;
- certains choix de tone/brand.

2b2c peut réduire l’effort en proposant des choix concrets plutôt qu’un formulaire abstrait.

## R8 — HUMAN_DECISION

Arbitrage qui engage la baseline.

Exemples :
- direction stratégique ;
- macro scope ;
- acceptation d’un risque ;
- validation du Decision Package ;
- passage Idea → Project ;
- Ready for Development.

## R9 — EXPERT_REQUIRED

Sujet à haute conséquence où l’IA ne doit pas être autorité finale.

Exemples :
- interprétation juridique sensible ;
- sécurité high-risk ;
- réglementation sectorielle complexe ;
- architecture financière/medicale critique.

---

# 3. Question Gate

Avant de créer une User Question, le moteur doit évaluer :

1. l’information existe-t-elle déjà en MEM/RAW ?
2. existe-t-elle dans une source fournie ?
3. peut-elle être observée par audit ?
4. peut-elle être recherchée publiquement de façon fiable ?
5. peut-elle être calculée/dérivée ?
6. une hypothèse réversible suffit-elle pour la Gate actuelle ?
7. 2b2c peut-il produire une recommandation sans demander une préférence ?
8. l’information doit-elle réellement être résolue maintenant ?
9. si elle reste inconnue, quel artifact/gate devient réellement impossible ou dangereux ?
10. est-ce finalement une intention, préférence, décision ou donnée privée human-only ?

Créer une question seulement si :

`HUMAN_ONLY_OR_AUTHORITY_REQUIRED = true`

ET

`MATERIAL_NOW = true`.

---

# 4. Niveaux d’intervention humaine

## NONE

2b2c résout et continue.

## OPTIONAL_CORRECTION

2b2c remplit/propose ; utilisateur peut corriger à tout moment.

## LIGHT_REVIEW

Regrouper plusieurs éléments en une validation compacte lorsque cela apporte de la confiance.

Exemple : « J’ai retenu comme cible principale les propriétaires dans un rayon de 30 km et comme objectif la demande de devis. Corrigez si nécessaire. »

Ne pas afficher si cela n’ajoute pas de valeur.

## EXPLICIT_CHOICE

Choix humain réellement nécessaire entre options.

## FORMAL_APPROVAL

Decision owner / équipe valide une baseline ou un snapshot.

## EXPERT_SIGNOFF

Seulement si risque/standard l’exige.

---

# 5. Matrice Site vitrine — exemples

| Sujet | Résolution par défaut | Humain obligatoire ? |
|---|---|---|
| Secteur | RAW/SRC/WEB | non si clair |
| Site actuel | RAW/SRC | non |
| Pages actuelles | crawl | non |
| Offre affichée | crawl/SRC | non |
| Offre que l’entreprise veut pousser | HUM/RAW | oui si décisionnelle |
| Audience actuelle observable | SRC/CONN/WEB/AI-H | non pour exploration |
| Audience future prioritaire | HUM si choix stratégique | oui avant lock stratégique |
| Besoins probables audience | WEB/evidence/AI-H | non ; hypothesis possible |
| Objections | WEB/reviews/AI-H | non par défaut |
| Concurrents directs | WEB | non |
| Forces/faiblesses concurrents | AUDIT/AI-H | non, avec sources |
| Opportunity gaps | AI-H/AI-R | non ; recommendation |
| Positionnement candidat | AI-R | non pour proposition ; humain choisit |
| Sitemap conceptuel | AI-R | non pour génération ; humain peut corriger |
| Parcours conceptuel | AI-R | non sauf workflow interne caché |
| Feature candidates | AI-R | non |
| Hard budget | HUM/SRC privé | oui si blocking |
| Hard deadline | HUM/SRC privé | oui si blocking |
| Charte officielle | SRC | non |
| Style visuel préféré | AI options + HUM preference | seulement si choix nécessaire |
| Mockup haute fidélité | AI/design system | non pour génération |
| Claims/chiffres dans mockup | SRC/HUM | oui si factual non sourcé |
| Traffic actuel | analytics connector | non si accès autorisé |
| ROI | CALC à partir d’inputs | humain seulement pour inputs privés/assumptions engageantes |
| Décision GO Project | HUM DECISION | oui |
| Expert legal/security | EXPERT | selon risque |

---

# 6. Fiabilité et confiance

Chaque auto-resolution doit avoir :

- provenance ;
- freshness ;
- confidence class ;
- contradiction status ;
- minimum resolution requis pour la Gate.

Confidence labels humains :
- `Bien étayé`
- `Raisonnable mais à confirmer`
- `Hypothèse de travail`
- `Informations insuffisantes`

Pas de pourcentage de confiance décoratif.

---

# 7. Validation groupée plutôt qu’atomique

L’utilisateur ne doit pas valider 25 facts l’un après l’autre.

Lorsque validation utile : regrouper par **décision cohérente**, par exemple :

### Foundation review
- objectif principal ;
- cible principale ;
- offre prioritaire ;
- contraintes hard.

### Strategy review
- option recommandée ;
- trade-offs ;
- macro scope/non-goals.

### Visual review
- territoire visuel ;
- anti-références.

### Decision review
- approve/revise/pause/stop.

Une review ne devient pas automatiquement un écran dédié : elle peut être inline ou intégrée à un artifact.

---

# 8. Rescue policy

Si HUMAN_REQUIRED mais l’utilisateur ne sait pas :

1. expliquer pourquoi la réponse compte ;
2. chercher indices supplémentaires ;
3. proposer 2–4 options concrètes ;
4. recommander une option si possible ;
5. utiliser working assumption si risque acceptable ;
6. différer ;
7. accepter unknown si non bloquant ;
8. escalader expert si conséquence élevée.

`Je ne sais pas` ne doit jamais provoquer une boucle de reformulation infinie.

---

# 9. Autorité

AI peut :
- extraire ;
- observer ;
- synthétiser ;
- rechercher ;
- calculer ;
- hypothétiser ;
- recommander ;
- générer des candidates/artifacts.

AI ne doit pas silencieusement :
- inventer intention interne ;
- accepter un budget au nom de l’utilisateur ;
- arbitrer un conflit humain structurant ;
- transformer preference en contrainte ;
- valider un claim sensible ;
- approuver un passage Idea → Project ;
- approuver Ready for Development quand un owner explicite est requis.
