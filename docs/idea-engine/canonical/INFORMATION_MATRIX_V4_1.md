# 4b4c — SITE VITRINE V4.1
## Matrice exhaustive : Information → Acquisition → IA → Validation → Dépendances → Blocage

## 1. Objet

Cette matrice constitue le contrat interne du Blueprint Site vitrine.

L’utilisateur ne la voit jamais comme un questionnaire.

Elle permet à 2b2c de savoir en permanence :
- ce qu’il connaît ;
- ce qu’il ignore ;
- ce qu’il peut récupérer seul ;
- ce qu’il peut rechercher ;
- ce qu’il peut seulement proposer ;
- ce que l’humain doit décider ;
- ce qui peut attendre ;
- quels livrables dépendent de chaque information ;
- si une inconnue empêche réellement de continuer.

## 2. Niveaux de blocage

- `B0 — NON BLOQUANT` : utile éventuellement, mais le parcours peut continuer.
- `B1 — NÉCESSAIRE POUR COMPRENDRE` : sans cette information, même la recherche serait mal ciblée.
- `B2 — NÉCESSAIRE POUR PROPOSER` : il est possible de comprendre/rechercher, mais pas de proposer sérieusement le futur site.
- `B3 — NÉCESSAIRE POUR PRÉSENTER` : une équipe ne pourrait pas juger correctement la proposition sans cela.
- `B4 — NÉCESSAIRE POUR DÉCIDER` : la présentation peut avoir lieu, mais une décision honnête nécessite ce point ou son acceptation explicite comme inconnue.
- `POST-GO` : à résoudre seulement lorsque l’idée devient Projet.

## 3. Niveau de validation

- `SOURCE_BACKED` — établi par une source identifiable.
- `AI_INFERRED` — déduction IA.
- `WORKING_ASSUMPTION` — hypothèse utilisée temporairement.
- `HUMAN_VALIDATED` — l’humain accepte cette valeur pour la version actuelle.
- `HUMAN_DECISION` — décision explicite engageante.
- `ACCEPTED_UNKNOWN` — inconnue explicitement acceptée pour continuer.

Aucun `AI_INFERRED` ne devient automatiquement `HUMAN_VALIDATED`.

## 4. Contexte de l’idée

| Information | Comment l’obtenir | 2b2c peut répondre ? | Validation humaine | Sert à | Blocage |
|---|---|---|---|---|---|
| Nom provisoire | humain ou génération IA | Oui | facultative | navigation, présentation | B0 |
| Description originale | humain | Non | donnée brute | toute la provenance | B1 |
| Entreprise/organisation | idée, documents, site | Oui par extraction | recommandée si ambiguë | audit, présentation | B1 |
| Secteur | extraction/recherche | Oui | seulement si doute | benchmark, expertise | B1 |
| Création ou refonte | idée/site | Oui | si ambigu | audit, recherche | B1 |
| Site actuel | humain, lien détecté | Non si inconnu | non | audit existant | B0/B1 si refonte |
| Organisation existante ou en création | humain/inférence | Oui comme hypothèse | importante | profondeur du cadrage | B1 |
| Zone géographique | site/doc/humain | Oui par extraction | recommandée | concurrence, SEO local | B1 si local |
| Pays | source/humain | Oui | rarement | règles, marché | B0/B1 |
| Langues | site/humain | Oui | si multilingue envisagé | sitemap, scope | B2 |
| Motif déclencheur | humain | Non fiable automatiquement | recommandée | narration présentation | B0 |
| Pourquoi maintenant | humain | IA peut proposer une interprétation | recommandée | présentation/décision | B3 si stratégique |

## 5. Objectifs

| Information | Acquisition | IA peut répondre ? | Validation | Sert à | Blocage |
|---|---|---|---|---|---|
| Objectif principal business | humain | IA peut reformuler | humaine nécessaire | tout le workflow | B1 |
| Objectifs secondaires | humain/inférence | Oui | recommandée | arbitrages | B0/B2 |
| Problème du site actuel | humain + audit | IA peut générer hypothèses | humain si causalité | diagnostic | B2 |
| Résultat visiteur souhaité | humain | IA peut proposer | humain | parcours/CTA | B1/B2 |
| Conversion principale | dérivée objectif | Oui | recommandée | UX/sitemap | B2 |
| Conversion secondaire | IA/humain | Oui | facultative | parcours | B0 |
| Critères qualitatifs de réussite | IA propose | Oui | recommandée | présentation | B3 |
| KPI réels | analytics/humain | Non à inventer | source | impact | B0 |
| Baseline actuelle | analytics/données | Non à inventer | source | projections | B0 |
| Cible d’amélioration chiffrée | humain/business | Non | humaine | business case | B0/B4 si décision financière |

Règle : « Je veux un site moderne » ne suffit jamais comme objectif. 2b2c doit chercher ce que cette modernisation doit améliorer.

## 6. Audience

| Information | Acquisition | IA | Validation | Dépendances | Blocage |
|---|---|---|---|---|---|
| Audience principale | humain/données/site | peut proposer | humaine ou working assumption | positionnement, UX | B1/B2 |
| Audience secondaire | humain/inférence | Oui | facultative | parcours | B0 |
| B2B/B2C/interne | extraction | Oui | recommandée | benchmark, ton | B1 |
| Segment précis | humain/données | propose | recommandée | contenus, CTA | B2 |
| Zone audience | site/humain | extrait | recommandée | SEO/local | B2 si local |
| Besoin principal | recherche/inférence | Oui sous forme hypothèse | recommandée | message | B2 |
| Freins/objections | recherche/feedback | Oui comme hypothèses | pas nécessaire individuellement | contenu/preuves | B3 |
| Niveau de connaissance utilisateur | recherche/inférence | Oui | non | rédaction/UX | B0 |
| Contexte d’utilisation | recherche | Oui | non | mobile/parcours | B0/B2 |
| Données comportementales réelles | analytics | Non | source | optimisation | B0 |

Si l’utilisateur ne connaît pas sa cible, 2b2c peut analyser l’existant, les clients visibles/témoignages, les prestations et le marché, puis proposer une `WORKING_ASSUMPTION`. Il ne doit pas prétendre l’avoir découverte avec certitude.

## 7. Offre

| Information | Acquisition | IA | Validation | Sert à | Blocage |
|---|---|---|---|---|---|
| Liste des prestations | site/doc/humain | extraction | vérifier si ancien | sitemap | B1 |
| Prestations toujours actuelles | humain | Non | humaine | scope | B2 |
| Prestations prioritaires | humain/business | peut recommander | humaine | positionnement | B2 |
| Offre à développer | humain | Non fiable seul | humaine | stratégie | B2/B3 |
| Offre à réduire/arrêter | humain | Non | humaine | sitemap | B2 |
| Prix publics | site/humain | extraction | source | contenu | B0 |
| Différenciation déclarée | humain | Non | humaine | positionnement | B2 |
| Différenciation observable | recherche | Oui | pas comme fait interne | diagnostic | B0/B2 |
| Certifications | source | extraction | vérifier fraîcheur | preuves | B0 |
| Réalisations | fichiers/site | extraction | disponibilité réelle | preuve | B2/B3 |
| Témoignages | source | extraction | provenance | preuve | B0/B3 |
| Chiffres de preuve | sources | Non à inventer | source obligatoire | présentation | B0 |

## 8. Existant

| Information | Acquisition | IA | Validation | Sert à | Blocage |
|---|---|---|---|---|---|
| Sitemap actuel | crawl | Oui | non | audit | B0/B1 refonte |
| Pages principales | crawl | Oui | non | audit | B0 |
| Contenus existants | crawl/fichiers | Oui | non | réemploi | B0 |
| CTA actuels | audit | Oui | non | diagnostic | B0 |
| Identité actuelle | site/assets | Oui | humaine si référence officielle | DA | B0 |
| Photos/assets | fichiers/site | inventaire | disponibilité réelle | projection | B0/B3 |
| SEO à préserver | humain/données | IA peut détecter risque | humaine | migration | B3 |
| URLs importantes | analytics/Search Console si fournis | extraction | source | migration | B0/POST |
| Performances actuelles | outils | Oui | source | diagnostic | B0 |
| Problèmes actuels | audit + humain | hypothèses | humain pour causalité | diagnostic | B2 |
| Ce qu’il faut absolument conserver | humain | Non | humaine | proposition | B2 |
| Ce qu’il faut abandonner | humain | propose | recommandée | proposition | B2 |

## 9. Recherche / concurrence

| Information | Acquisition | IA | Validation | Sert à | Blocage |
|---|---|---|---|---|---|
| Concurrents directs | web | Oui | sources | benchmark | B0/B2 |
| Concurrents indirects | web | Oui | sources | alternatives | B0 |
| Références exemplaires | web/humain | Oui | subjectif | UX/DA | B0 |
| Positionnement concurrent | analyse | Oui | interprétation | diagnostic | B0/B2 |
| Offres concurrentes | sources | Oui | source | benchmark | B0 |
| Fonctionnalités récurrentes | sources | Oui | source | scope | B0 |
| Patterns de contenu | analyse | Oui | interprétation | contenu | B0 |
| Opportunités visibles | analyse | Oui | hypothèses | options | B0/B2 |
| Faiblesses concurrentes | analyse | Oui | prudence | positionnement | B0 |
| Tendances secteur | recherche | Oui | sources | présentation | B0 |
| Intentions de recherche | outils/recherche | Oui | sources | SEO/sitemap | B0/B2 |
| Taille de marché | études fiables | Oui si source | source | business case | B0 |
| Potentiel local | sources/données | partiel | prudence | décision | B0 |

Condition de sortie : la recherche est suffisante lorsque les recherches supplémentaires ont peu de chances de modifier une décision importante.

## 10. Diagnostic

Chaque conclusion doit pointer vers ses preuves.

| Sortie | Production | Validation | Sert à |
|---|---|---|---|
| Forces existantes | IA + preuves | revue humaine facultative | proposition |
| Faiblesses | IA + audit | hypothèse | amélioration |
| Opportunités | IA + recherche | hypothèse | candidats |
| Risques | IA/règles | revue | décision |
| Contradictions | système/IA | humain si nécessaire | clarification |
| Informations manquantes | système | non | NBA |
| Hypothèses critiques | IA | humain peut accepter | décision |

## 11. Positionnement / direction stratégique

| Information | Acquisition | IA | Validation | Blocage |
|---|---|---|---|---|
| Proposition de valeur candidate | IA | Oui | humaine recommandée | B2 |
| Message principal | IA | Oui | humaine | B3 |
| Hiérarchie des offres | IA + objectifs | recommande | humaine | B2 |
| Différenciation candidate | IA + preuves | Oui | humaine | B3 |
| Positionnement retenu pour Candidate | synthèse | Oui | humaine | B3 |
| Alternatives importantes | IA | Oui | non | B3 si vraie alternative |

Règle : 2b2c ne cherche pas « la meilleure stratégie ». Il génère seulement des candidats justifiés par le dossier courant.

## 12. Expérience / parcours

| Information | Acquisition | IA | Validation | Sert à | Blocage |
|---|---|---|---|---|---|
| Action principale visiteur | objectif | Oui | humaine | parcours | B2 |
| Parcours principal | IA | Oui | revue | sitemap | B2 |
| Parcours secondaires | IA | Oui | facultative | sitemap | B0 |
| Points de preuve | contenu/recherche | Oui | non | pages | B2 |
| Frictions à éviter | audit/recherche | Oui | hypothèses | UX | B0 |
| Mobile priority | contexte | Oui | généralement système | UX | B0 |
| Formulaire simple/détaillé | objectifs | recommande | humaine | scope | B2 |
| CTA principal | IA | Oui | humaine légère | wireframe | B2 |

## 13. Sitemap

Inputs minimaux : objectif + audience + offre + conversion + positionnement actuel.
Idéalement : contenus + recherche + SEO + site existant.

Pour chaque page : nom, raison d’être, audience, objectif, CTA, contenus nécessaires.

Statut : `AI_PROPOSED → HUMAN_REVIEWED → CANDIDATE_ACCEPTED`.

## 14. Contenu

| Information | Acquisition | IA | Validation | Blocage |
|---|---|---|---|---|
| Logo | source | non | disponibilité | B0 |
| Charte | source | non | source | B0 |
| Photos | fichiers | inventaire | disponibilité | B0/B3 projection |
| Réalisations | fichiers/site | inventaire | validité | B2 |
| Témoignages | source | extraction | provenance | B0 |
| Textes existants | crawl | extraction | non | B0 |
| Textes manquants | système | détecte | non | B0 |
| Copy provisoire | IA | Oui | non définitif | projection |
| Pages nécessitant nouveau contenu | sitemap | système | non | scope |
| Responsable contenu | humain | Non | post-GO | POST |
| Contenus définitifs | humain/IA | partiel | validation | POST |

## 15. Fonctionnalités / scope

Chaque fonctionnalité doit répondre à : quel besoin, pour quel utilisateur, quelle valeur, quelle complexité, quelle alternative plus simple.

Classification : `V1 / Plus tard / Non recommandé actuellement`.

## 16. Direction visuelle

| Information | Acquisition | IA | Validation | Blocage |
|---|---|---|---|---|
| Marque existante | source | extraction | source | B0 |
| Couleurs imposées | charte/humain | extraction | humaine | B0/B3 |
| Préférences | humain | non | aucune forte | B0 |
| Inspirations | humain/recherche | Oui | subjectif | B0 |
| Styles rejetés | humain | Non | non | B0 |
| Ton | positionnement | propose | humaine | B2 |
| Direction candidate | IA/design | Oui | revue humaine | B3 si projection |
| Design final | post-GO | non | post-GO | POST |

## 17. Projection visuelle

Inputs : sitemap candidat + positionnement + contenu disponible + direction visuelle + branding.

Sortie standard : Home desktop candidate, Home mobile candidate, 1 écran/page stratégique si nécessaire, mini style direction.

État : `PRESENTATION_CONCEPT`, jamais `FINAL_DESIGN`.

## 18. Faisabilité

Avant présentation : vérifier faisabilité générale, complexité des fonctions, intégrations critiques, données sensibles, administration des contenus, SEO, contraintes évidentes.

Sortie : `Aucun obstacle majeur connu` ou `Point à résoudre avant GO`.

## 19. Contraintes humaines

Budget maximum réel, date impérative, ressources internes, technologies/fournisseurs imposés, restrictions marque, sécurité particulière. IA ne répond pas à leur place.

Si inconnues mais non décisionnelles : `ACCEPTED_UNKNOWN`.

## 20. Impact économique

- Niveau A : données réelles disponibles → calculs possibles.
- Niveau B : hypothèses visibles → scénarios seulement.
- Niveau C : données insuffisantes → pas de chiffres.

## 21. Équipe / décision

À connaître : personnes invitées, facilitateur, Decision Owner, contributeurs, mode de décision, Decision Question, date éventuelle.

## 22. Présentation : dépendances minimales

Idée originale, contexte, objectif, audience, offre, Evidence Pack suffisant, diagnostic, proposition candidate, sitemap, scope V1, projection si utile, risques/inconnues, faisabilité générale, alternatives importantes, Decision Question.

## 23. Q&A Pack

Avant réunion, préparer les questions probables avec états `ANSWERED / PARTIAL / UNKNOWN`.

## 24. Readiness de présentation

Dimensions : `COMPREHENSION_READY / EVIDENCE_READY / PROPOSAL_READY / SITE_CONCEPT_READY / RISK_READY / DECISION_READY`.

Pas de score visible arbitraire.

## 25. Atelier — données persistantes

Chaque contribution : `QUESTION | IDEA | OBJECTION | RISK | PROPOSAL`, avec auteur, slide/contexte, contenu, état. Réactions séparées.

## 26. 2b2c et l’atelier

Pour chaque contribution : summary, duplicates, impact, affected_domains, research_needed, recommendation, confidence. L’humain décide si intégrer / étudier / reporter / rejeter.

## 27. Consensus

Même unanimité ≠ décision officielle. `TEAM_CONSENSUS` puis mécanisme de décision.

## 28. Candidate V2

Après atelier, seule la mémoire validée est modifiée. Candidate V1 reste immutable.

## 29. Decision Brief

Dépendances : candidate finale + feedbacks + consensus + objections + risques + accepted_unknowns + recommandation 2b2c + Decision Question.

## 30. Handoff Project Draft

Transférer : faits validés, assumptions actives, constraints, scope, sitemap, research pertinent, risks, open questions, decisions, assets, candidate finale.

Conserver uniquement en historique : anciennes hypothèses, candidates précédentes, recommandations rejetées, feedbacks obsolètes.

## 31. Questions réellement Human-only avant présentation

Idée initiale, objectif réel, informations internes introuvables, priorités métier, préférences importantes, contraintes internes, validation d’une direction candidate, corrections, arbitrages entre alternatives, décision finale.

## 32. Principe final du moteur de questions

```text
LIVRABLE À PRÉPARER
        ↓
INFORMATIONS NÉCESSAIRES
        ↓
INFORMATIONS DÉJÀ CONNUES ?
        ↓
SOURCES DISPONIBLES ?
        ↓
RECHERCHE POSSIBLE ?
        ↓
IA PEUT PROPOSER ?
        ↓
HUMAIN DOIT-IL TRANCHER ?
        ↓
QUESTION SEULEMENT SI NÉCESSAIRE
```
