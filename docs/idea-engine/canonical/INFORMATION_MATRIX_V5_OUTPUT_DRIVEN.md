# 4b4c — SITE VITRINE INFORMATION MATRIX — V5.0 OUTPUT-DRIVEN

## 0. Statut

Cette matrice est **canonique et normative** pour le Blueprint de référence `Site vitrine`.

Elle **supersède `INFORMATION_MATRIX_V4_1.md`** sans supprimer son historique.

Elle implémente la logique de `IDEA_ENGINE_MASTER_BLUEPRINT_V1.md` :

> information → Requirement → Output Contract → Readiness → action système / éventuelle action humaine.

Elle constitue le **« formulaire complet interne »** de l’Idea Decision Dossier pour le Blueprint Site vitrine.

**Elle ne doit jamais être transformée en questionnaire visible complet.**

---

## 1. Output Contracts — légende

- `O1 UNDERSTANDING` — compréhension exploitable de l’Idée
- `O2 EVIDENCE` — diagnostic / evidence utile
- `O3 DIRECTIONS` — directions candidates
- `O4 PROPOSITION` — proposition candidate concrète
- `O5 SCOPE` — structure / fonctionnalités / contenu / V1
- `O6 PROJECTION` — matérialisation visuelle éventuelle
- `O7 DECISION` — Decision Brief / décision honnête
- `O8 PRESENTATION` — présentation / atelier si nécessaire
- `O9 HANDOFF` — transfert vers Project Draft après GO

Dans les tableaux :

- `C` = Core : généralement requis pour cette sortie
- `K` = Conditional : requis seulement si le contexte/Decision Requirement l’active
- `E` = Enhancer : améliore la sortie mais ne la bloque généralement pas
- `—` = généralement non pertinent pour cette sortie

Ces symboles ne sont **pas** des étapes.

---

## 2. Activation Contexts — rendre les Requirements conditionnels

Le moteur dérive des contextes qui activent/désactivent des Requirements, par exemple :

- `IS_REDESIGN`
- `HAS_EXISTING_SITE`
- `IS_LOCAL_BUSINESS`
- `IS_MULTILINGUAL`
- `HAS_TEAM_DECISION`
- `NEEDS_PRESENTATION`
- `NEEDS_VISUAL_PROJECTION`
- `NEEDS_FINANCIAL_CASE`
- `HAS_CRITICAL_INTEGRATION`
- `HAS_SENSITIVE_DATA`
- `HAS_REGULATORY_CONSTRAINT`
- `SEO_MIGRATION_RISK`
- `DECISION_REQUIRES_BUDGET`
- `DECISION_REQUIRES_TIMELINE`

Ces contextes peuvent être dérivés progressivement. Ils ne sont pas des « modes utilisateur ».

---

## 3. Acquisition Paths — ordre de préférence

Codes :

- `MEM` — mémoire active
- `RAW` — texte/réponse humaine déjà fournie
- `SRC` — extraction source/document/site/image
- `WEB` — recherche publique sourcée
- `CONN` — donnée privée connectée/autorisée
- `CALC` — calcul/dérivation déterministe
- `AI-H` — hypothèse IA explicitement étiquetée
- `AI-R` — recommandation IA
- `HUM` — question/décision humaine

Ordre canonique : `MEM → RAW/SRC → WEB/CONN → CALC → AI-H → HUM → ACCEPTED_UNKNOWN`, selon ce qui est légitime pour l’information.

---

## 4. Validation / état minimum

Niveaux utilisés selon le Requirement :

- `RAW_HUMAN`
- `SOURCE_BACKED`
- `WORKING_ASSUMPTION`
- `AI_RECOMMENDATION`
- `ACCEPTED_AS_CURRENT`
- `HUMAN_VALIDATED`
- `HUMAN_DECISION`
- `ACCEPTED_UNKNOWN`

Une information n’a pas un niveau minimum unique : le même item peut suffire comme `WORKING_ASSUMPTION` pour O3 mais nécessiter `HUMAN_DECISION` pour O7.

---

# PARTIE A — MATRICE SYNTHÉTIQUE PAR DOMAINE

| Domaine | O1 | O2 | O3 | O4 | O5 | O6 | O7 | O8 | O9 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Contexte | C | C | C | C | E | E | C | C | C |
| Problème / opportunité | C | C | C | C | E | — | C | C | C |
| Objectifs / résultats | C | C | C | C | C | E | C | C | C |
| Audience | C | C | C | C | C | C | C | C | C |
| Offre / valeur | C | C | C | C | C | E | C | C | C |
| Existant / assets | K | C | E | C | C | C | C | E | C |
| Concurrence / références | E | K | K | K | E | E | K | E | E |
| Diagnostic / evidence | E | C | C | C | E | E | C | C | C |
| Positionnement | E | E | C | C | C | C | C | C | C |
| Parcours / conversion | E | E | C | C | C | C | C | C | C |
| Structure / contenu | — | E | E | C | C | C | C | C | C |
| Fonctionnalités / scope | — | E | E | C | C | C | C | C | C |
| Design / marque | E | E | E | E | E | C | K | K | C |
| Faisabilité / contraintes | K | E | K | C | C | E | C | C | C |
| Économie / impact | E | E | K | K | E | — | K | K | E |
| Risques / inconnues | E | C | C | C | C | E | C | C | C |
| Gouvernance / décision | E | — | E | E | E | — | C | C | C |
| Présentation / atelier | — | — | — | — | — | — | K | C | E |

La table ci-dessus donne seulement la densité typique. Les Activation Contexts et Decision Requirements décident réellement de ce qui devient requis.

---

# PARTIE B — REGISTRE DÉTAILLÉ DES INFORMATIONS

## 5. Contexte de l’Idée

| Information key | Sens | Acquisition | Outputs | Règle de Requirement |
|---|---|---|---|---|
| `idea.name` | nom provisoire | RAW / AI-R | O1:E O8:E O9:E | jamais bloquant ; générable si vide |
| `idea.raw_description` | formulation originale | RAW | O1:C O9:C | toujours conservée ; source, pas résumé IA |
| `org.identity` | entreprise/organisation | RAW / SRC | O1:C O2:C O7:C O8:C O9:C | hypothèse suffisante si non ambigu ; conflit critique à résoudre si impact |
| `org.sector` | secteur | SRC / WEB / HUM | O1:C O2:C O3:C O7:E | peut être inféré puis corrigé |
| `idea.creation_or_redesign` | création/refonte | RAW / SRC / AI-H | O1:C O2:C O5:K | active `IS_REDESIGN` ; demander seulement si ambigu |
| `existing.site_url` | site actuel | RAW / SRC | O2:K O4:E O5:K O9:E | Core seulement si refonte/audit nécessaire |
| `org.lifecycle` | organisation existante/en création | RAW / SRC / AI-H | O1:K O3:K O7:E | active profondeur de cadrage |
| `geo.primary_area` | zone géographique | RAW / SRC / WEB | O1:K O2:K O3:K O5:K O7:E | Core si business local, sinon enhancer |
| `geo.country` | pays/région juridique | RAW / SRC / WEB | O2:K O7:K | requis si réglementation/marché dépend du pays |
| `language.required` | langues du futur site | RAW / SRC / HUM | O5:K O7:K O9:C | requis si multilingue envisagé |
| `trigger.motive` | motif déclencheur | RAW / HUM / AI-H | O1:E O2:E O8:E | peut rester inconnu |
| `trigger.why_now` | pourquoi maintenant | RAW / HUM / AI-H | O1:E O7:K O8:K | requis seulement si timing/urgence pèse sur décision |

## 6. Problème / opportunité / objectifs

| Information key | Sens | Acquisition | Outputs | Règle de Requirement |
|---|---|---|---|---|
| `objective.primary_business` | objectif business principal | RAW / HUM | O1:C O2:C O3:C O4:C O7:C O8:C O9:C | au minimum HUMAN ou hypothèse explicitement acceptée ; ne pas inventer |
| `objective.secondary` | objectifs secondaires | RAW / HUM / AI-H | O3:E O4:C O5:C O7:E | utiles aux arbitrages ; peuvent attendre |
| `problem.current` | problème actuel | RAW / SRC / HUM / AI-H | O1:C O2:C O3:C O4:C O7:C | causalité humaine à distinguer de l’audit |
| `opportunity.target` | opportunité recherchée | RAW / WEB / AI-H | O2:C O3:C O7:E | peut être hypothèse tant qu’elle est étiquetée |
| `visitor.outcome_primary` | résultat visiteur souhaité | RAW / HUM / AI-R | O1:C O3:C O4:C O5:C O7:C | humain ou ACCEPTED_AS_CURRENT recommandé |
| `conversion.primary` | action/conversion principale | CALC / AI-R / HUM | O3:C O4:C O5:C O6:C O7:C O9:C | dérivable de l’objectif ; humaine légère si ambiguë |
| `conversion.secondary` | conversions secondaires | AI-R / HUM | O4:E O5:E | jamais exigées sans justification |
| `success.qualitative_criteria` | critères qualitatifs | AI-R / HUM | O7:K O8:K | requis si le décideur veut juger selon critères explicites |
| `success.kpi_actual` | KPI réels | CONN / SRC | O2:E O7:K | ne jamais inventer ; requis seulement si décision chiffrée |
| `success.baseline` | situation chiffrée actuelle | CONN / SRC | O2:E O7:K | idem |
| `success.target_numeric` | cible chiffrée | HUM / CALC | O7:K | seulement si Decision Requirement financier/performance |

Règle : `Je veux un site moderne` ne résout pas `objective.primary_business`.

## 7. Audience

| Information key | Sens | Acquisition | Outputs | Règle de Requirement |
|---|---|---|---|---|
| `audience.primary` | audience principale | RAW / SRC / CONN / AI-H / HUM | O1:C O2:C O3:C O4:C O5:C O6:C O7:C O8:C O9:C | WORKING_ASSUMPTION possible pour exploration ; décision peut exiger validation |
| `audience.secondary` | audience secondaire | RAW / SRC / AI-H | O4:E O5:E O7:E | non bloquante si marginale |
| `audience.model` | B2B/B2C/interne/mixte | RAW / SRC / CALC | O1:C O2:C O3:C O4:C | peut être extrait ; conflit à résoudre si structurant |
| `audience.segment` | segment précis | RAW / CONN / AI-H / HUM | O3:C O4:C O5:C O7:C | hypothèse acceptable selon maturité |
| `audience.geo` | zone audience | RAW / SRC / WEB | O2:K O5:K | active SEO/local |
| `audience.need_primary` | besoin principal | WEB / RAW / AI-H | O2:C O3:C O4:C O5:C | AI-H possible ; ne pas présenter comme vérité comportementale |
| `audience.objections` | freins/objections | WEB / SRC / AI-H | O2:C O4:C O8:E | agrégés, sourcés/hypothèses ; pas validation humaine individuelle obligatoire |
| `audience.knowledge_level` | connaissance du sujet | WEB / AI-H | O4:E O5:E | enhancer |
| `audience.usage_context` | mobile, urgence, comparaison… | WEB / SRC / AI-H | O4:E O5:C O6:E | devient Core si contexte modifie fortement UX |
| `audience.behavior_data` | données réelles | CONN / SRC | O2:E O7:K | ne pas inventer ; seulement si disponibles/nécessaires |

## 8. Offre / valeur / preuves internes

| Information key | Sens | Acquisition | Outputs | Règle de Requirement |
|---|---|---|---|---|
| `offer.catalog` | prestations/offres | SRC / RAW | O1:C O3:C O4:C O5:C O9:C | Core pour site vitrine ; ancien contenu doit être vérifié si stale |
| `offer.current_validity` | prestations encore actuelles | HUM / SRC | O4:C O5:C O9:C | humaine si source ancienne/ambiguë |
| `offer.priority` | offres prioritaires | HUM / RAW / AI-R | O3:C O4:C O5:C O7:C | priorité interne = humain ; IA peut recommander mais pas inventer |
| `offer.to_grow` | offre à développer | HUM | O3:K O7:K | human-only si stratégique |
| `offer.to_reduce` | offre à réduire/arrêter | HUM | O4:K O5:K | human-only si stratégique |
| `offer.public_price` | prix public | SRC / RAW | O4:E O5:E O6:E | SOURCE_BACKED si affiché |
| `value.declared_diff` | différenciation déclarée | RAW / HUM | O3:C O4:C O7:E | déclaration interne, pas vérité marché |
| `value.observable_diff` | différenciation observable | WEB / SRC / AI-H | O2:C O3:C O7:E | observation/interpretation sourcée |
| `proof.certifications` | certifications | SRC | O4:E O5:E O8:E | fraîcheur/provenance nécessaires |
| `proof.work_examples` | réalisations | SRC | O2:E O4:C O5:C O6:C O8:E | Core si preuve par réalisation structurante |
| `proof.testimonials` | témoignages | SRC | O2:E O4:E O5:E O8:E | provenance requise |
| `proof.metrics` | chiffres de preuve | SRC / CONN | O2:E O7:E O8:E | jamais inventer |

## 9. Existant et assets

| Information key | Sens | Acquisition | Outputs | Règle de Requirement |
|---|---|---|---|---|
| `existing.sitemap` | structure actuelle | SRC / crawl | O2:K O4:E O5:K | activé par refonte |
| `existing.pages` | pages actuelles | SRC | O2:K O5:K | activé par refonte |
| `existing.content` | contenus actuels | SRC | O4:E O5:C O9:C | Core pour stratégie de réemploi si refonte |
| `existing.cta` | CTA actuels | SRC / audit | O2:E O3:E | diagnostic seulement |
| `brand.current_identity` | identité actuelle | SRC / HUM | O4:E O6:C O9:C | Core pour projection si marque à conserver |
| `assets.photos` | photos disponibles | SRC | O5:E O6:C O9:C | Core seulement si projection dépend d’assets réels |
| `assets.logo` | logo | SRC | O6:K O9:C | existence ≠ obligation d’usage |
| `assets.brand_guidelines` | charte | SRC | O6:K O9:C | source officielle si imposée |
| `seo.preserve` | SEO à préserver | SRC / CONN / HUM | O5:K O7:K O9:C | activé par SEO migration risk |
| `seo.important_urls` | URLs critiques | CONN / SRC | O9:K | surtout handoff/post-GO ; avant GO si risque migration décisionnel |
| `existing.performance` | performance actuelle | WEB / tooling | O2:E O7:E | observation sourcée |
| `existing.problems` | problèmes du site | SRC / audit / HUM / AI-H | O2:C O3:C | distinguer observation et causalité humaine |
| `existing.must_keep` | éléments à conserver | HUM / RAW | O4:C O5:C O9:C | human-only lorsque préférence/contrainte |
| `existing.must_remove` | éléments à abandonner | HUM / AI-R | O4:C O5:C O9:C | IA peut proposer ; humain arbitre si engageant |

## 10. Recherche / concurrence / références

| Information key | Sens | Acquisition | Outputs | Règle de Requirement |
|---|---|---|---|---|
| `market.direct_competitors` | concurrents directs | WEB / RAW | O2:K O3:K O7:K | activer seulement si peut changer positionnement/décision |
| `market.indirect_alternatives` | alternatives indirectes | WEB | O2:E O3:K | utile lorsque substitution réelle |
| `reference.exemplars` | références exemplaires | WEB / RAW | O3:E O6:E | subjectif + note humaine conservée |
| `market.competitor_positioning` | positionnements observés | WEB / AI-H | O2:K O3:K | interprétation sourcée |
| `market.competitor_offers` | offres observées | WEB | O2:E O3:E | source/fraîcheur |
| `market.common_features` | fonctions récurrentes | WEB | O2:E O5:E | fréquence ≠ recommandation |
| `market.content_patterns` | patterns contenus | WEB / AI-H | O2:E O5:E | interpretation |
| `market.opportunities` | opportunités visibles | WEB / AI-H | O2:K O3:K | hypothèses, pas certitudes |
| `market.competitor_weaknesses` | faiblesses observées | WEB / AI-H | O2:E O3:E | prudence ; sourcer observation |
| `market.trends` | tendances | WEB | O2:E O8:E | seulement si décisionnel |
| `seo.search_intent` | intentions de recherche | WEB / tooling | O3:K O5:K | activé si acquisition SEO importante |
| `market.size` | taille de marché | WEB | O7:K | seulement si business case nécessaire |
| `market.local_potential` | potentiel local | WEB / CONN | O7:K | prudence ; jamais précision artificielle |

Règle : aucune recherche concurrentielle « pour faire complet ». Chaque activation doit pointer vers un Requirement actuel.

## 11. Diagnostic / Evidence

| Information key | Sens | Acquisition | Outputs | Règle de Requirement |
|---|---|---|---|---|
| `diagnostic.strengths` | forces | SRC / WEB / AI-H | O2:C O3:E O7:E | chaque conclusion reliée à evidence |
| `diagnostic.weaknesses` | faiblesses | SRC / WEB / AI-H | O2:C O3:C O7:E | observation vs interprétation séparées |
| `diagnostic.opportunities` | opportunités | WEB / AI-H | O2:C O3:C | hypothèses explicites |
| `diagnostic.risks` | risques | SRC / WEB / CALC / AI-H | O2:C O7:C O8:C O9:C | risque critique non masqué |
| `diagnostic.conflicts` | contradictions | CALC / AI-H / HUM | O2:C O3:C O7:C | `CONFLICTED` si impact actuel ; résoudre ou accepter explicitement |
| `diagnostic.missing` | manques | CALC | tous | moteur, pas champ utilisateur |
| `diagnostic.critical_assumptions` | hypothèses critiques | AI-H / HUM | O3:C O7:C | accepter/valider ou marquer inconnue selon impact |

Evidence Model : `SOURCE → OBSERVATION → INTERPRETATION → CONSEQUENCE POSSIBLE`.

## 12. Positionnement / direction stratégique

| Information key | Sens | Acquisition | Outputs | Règle de Requirement |
|---|---|---|---|---|
| `positioning.value_proposition_candidate` | proposition de valeur | AI-R | O3:C O4:C O7:C | AI recommendation ; humain peut accepter as current |
| `positioning.main_message` | message principal | AI-R | O4:C O5:C O6:C O8:C | HUMAN_VALIDATED seulement si nécessaire à la décision |
| `positioning.offer_hierarchy` | hiérarchie offres | AI-R / HUM | O4:C O5:C | dépend priorités métier |
| `positioning.diff_candidate` | différenciation candidate | AI-R | O3:C O4:C O7:C | evidence + assumptions obligatoires |
| `positioning.current_candidate` | direction actuelle | AI-R / HUM | O4:C O5:C O7:C O9:C | `ACCEPTED_AS_CURRENT` suffisant pour continuer ; pas final automatiquement |
| `positioning.alternatives` | vraies alternatives | AI-R | O3:K O7:K O8:K | créer seulement si vrai arbitrage |

## 13. Expérience / parcours / conversion

| Information key | Sens | Acquisition | Outputs | Règle de Requirement |
|---|---|---|---|---|
| `journey.primary_action` | action visiteur principale | CALC / AI-R / HUM | O3:C O4:C O5:C O6:C | doit rester cohérente avec objectif |
| `journey.primary` | parcours principal | AI-R | O4:C O5:C O6:C O7:C | revue humaine légère selon impact |
| `journey.secondary` | parcours secondaires | AI-R | O5:E | optionnels |
| `journey.proof_points` | moments/preuves rassurantes | SRC / AI-R | O4:C O5:C O6:E | dépend audience/objections |
| `journey.frictions` | frictions à éviter | SRC / WEB / AI-H | O2:E O4:E | enhancer sauf contrainte critique |
| `journey.mobile_priority` | priorité mobile/contextuelle | SRC / WEB / CALC | O5:E O6:C | système peut dériver ; humain rarement requis |
| `form.depth` | formulaire simple/détaillé | AI-R / HUM | O5:K O7:K | activé si collecte complexe / friction décisionnelle |
| `cta.primary` | CTA principal | AI-R / HUM | O4:C O5:C O6:C | HUMAN_DECISION rarement nécessaire avant GO |

## 14. Structure / sitemap

Chaque page candidate possède :

- `page.name`
- `page.reason`
- `page.audience`
- `page.objective`
- `page.primary_cta`
- `page.required_content`
- `page.status`

Inputs typiques : objectif + audience + offre + conversion + positionnement actuel.

Recherche/SEO/existant deviennent Core seulement si les Activation Contexts les rendent déterminants.

État : `AI_PROPOSED → HUMAN_REVIEWED/ACCEPTED_AS_CURRENT → FROZEN_IN_CANDIDATE` selon besoin.

## 15. Contenu

| Information key | Sens | Acquisition | Outputs | Règle de Requirement |
|---|---|---|---|---|
| `content.available` | contenus existants | SRC | O5:C O6:E O9:C | inventaire ; pas rédaction finale |
| `content.missing` | contenus manquants | CALC | O5:C O7:E O9:C | système détecte |
| `content.provisional_copy` | copy de projection | AI-R | O6:K O8:E | toujours provisoire |
| `content.new_requirements` | nouveaux contenus requis | CALC | O5:C O7:C O9:C | dérivé du scope/structure |
| `content.final_owner` | futur responsable contenu | HUM | O9:K | POST-GO sauf risque décisionnel |
| `content.final_assets` | contenus définitifs | HUM / AI | O9:K | principalement post-GO |

Logo, photos, réalisations, témoignages sont référencés dans Existant/Assets/Preuves et reliés ici par dépendances.

## 16. Fonctionnalités / scope

Chaque fonctionnalité candidate doit posséder :

- `feature.need`
- `feature.user`
- `feature.value`
- `feature.complexity`
- `feature.dependencies`
- `feature.simpler_alternative`
- `feature.recommendation`
- `feature.scope_bucket`

Buckets :

- `V1`
- `LATER`
- `NOT_RECOMMENDED_NOW`

Une fonctionnalité ne devient pas V1 uniquement parce que l’utilisateur l’a mentionnée.

## 17. Design / marque

| Information key | Sens | Acquisition | Outputs | Règle de Requirement |
|---|---|---|---|---|
| `brand.constraints` | marque imposée | SRC / HUM | O6:C O7:K O9:C | Core pour projection si existante |
| `visual.required_colors` | couleurs imposées | SRC / HUM | O6:C O9:C | contrainte, pas simple préférence |
| `visual.preferences` | préférences | RAW / HUM | O6:E | jamais demander tôt si non pertinent |
| `visual.inspirations` | références visuelles | RAW / SRC / WEB | O6:E | note humaine sur ce qui plaît/déplaît conservée |
| `visual.rejections` | styles rejetés | RAW / HUM | O6:E | important pour éviter mauvaise projection |
| `brand.tone` | ton | AI-R / HUM | O4:E O6:C | dérivable du positionnement ; validation légère |
| `visual.direction_candidate` | direction candidate | AI-R / design | O6:C O7:K O8:K | uniquement si projection utile |
| `visual.final_design` | design final | POST-GO | O9:— | interdit d’en faire une exigence pré-GO |

## 18. Projection visuelle

Activation seulement si `NEEDS_VISUAL_PROJECTION`.

Inputs typiques : Candidate + structure + contenu disponible + branding + direction visuelle.

Sortie possible : home desktop/mobile candidate + écran stratégique + mini style direction.

État : `PRESENTATION_CONCEPT`, jamais `FINAL_DESIGN`.

`O6 = NOT_RELEVANT` est un résultat normal.

## 19. Contraintes et faisabilité

| Information key | Sens | Acquisition | Outputs | Règle de Requirement |
|---|---|---|---|---|
| `constraint.budget_max` | budget plafond réel | HUM | O4:K O5:K O7:K O9:C | human-only ; requis seulement si décision dépend de l’enveloppe |
| `constraint.deadline_hard` | date réellement impérative | HUM | O7:K O9:C | ne pas inventer une date projet |
| `constraint.internal_resources` | ressources internes | HUM | O7:K O9:C | Decision Requirement éventuel |
| `constraint.forced_vendor` | fournisseur/tech imposé | HUM / SRC | O5:K O7:K O9:C | contrainte si réelle ; sinon post-GO |
| `constraint.brand` | restrictions marque | SRC / HUM | O6:K O7:K O9:C | activé si projection |
| `constraint.security` | sécurité particulière | HUM / SRC / WEB | O7:K O9:C | activé si données/intégrations sensibles |
| `constraint.regulatory` | contrainte légale/réglementaire | WEB / SRC / HUM | O7:K O9:C | source + juridiction ; humain/juriste si besoin |
| `feasibility.general` | faisabilité générale | AI-H / WEB / expert/tool | O7:C O8:C | niveau adapté à la décision, pas architecture finale |
| `feasibility.critical_integrations` | intégrations critiques | RAW / SRC / expert | O5:K O7:K O9:C | activé si fonction dépend d’un tiers |
| `feasibility.admin_content` | besoin d’administration | RAW / AI-R | O5:K O7:E O9:C | scope/faisabilité |

Sortie pré-GO : `Aucun obstacle majeur connu` ou `Point à résoudre avant GO`, avec evidence/hypothèses.

## 20. Impact économique

| Information key | Sens | Acquisition | Outputs | Règle de Requirement |
|---|---|---|---|---|
| `economics.real_data` | données financières réelles | CONN / SRC / HUM | O7:K | requis seulement si business case demandé |
| `economics.assumptions` | hypothèses | AI-H / HUM | O7:K | toujours visibles |
| `economics.scenarios` | scénarios calculés | CALC | O7:K O8:K | pas de pseudo-précision |
| `economics.expected_impact` | impact attendu | CALC / AI-H | O7:K | Niveau A données réelles / B scénarios / C pas de chiffre |

Si données insuffisantes : ne pas produire de ROI inventé.

## 21. Risques / inconnues / conflits

Chaque élément possède : type, impact, probabilité qualitative si défendable, evidence, affected_outputs, resolution_path, owner si humain nécessaire, state.

Un risque/inconnu devient `BLOCKING` uniquement s’il empêche une sortie ou Decision Requirement actif.

`ACCEPTED_UNKNOWN` est une résolution valide si le décideur accepte explicitement l’incertitude.

## 22. Gouvernance / décision

| Information key | Sens | Acquisition | Outputs | Règle de Requirement |
|---|---|---|---|---|
| `decision.mode` | solo/équipe | RAW / HUM / signal | O7:C O8:C | peut être activé tardivement |
| `decision.owner` | personne qui tranche | HUM | O7:C O8:C O9:C | requis si équipe / pouvoir non évident |
| `decision.contributors` | contributeurs | HUM | O8:K | seulement si collaboration utile |
| `decision.method` | consensus/majorité/owner/etc. | HUM | O7:K O8:K | activé si équipe |
| `decision.question` | décision exacte à prendre | CALC / HUM | O7:C O8:C | doit être explicite avant décision |
| `decision.requirements` | ce qu’il faut pour décider | HUM / AI-R | O7:C O8:C | moteur central de readiness |
| `decision.known_disagreements` | désaccords connus | HUM / collaboration | O7:K O8:K | active atelier si utile |
| `decision.date_real` | date réelle de décision | HUM | O8:E | ne pas inventer |

Une phrase tardive comme `je dois en parler à mon associé` peut activer ce domaine sans redémarrer le dossier.

## 23. Presentation / Workshop specific

| Information key | Sens | Acquisition | Outputs | Règle de Requirement |
|---|---|---|---|---|
| `presentation.needed` | présentation formelle utile ? | CALC / HUM | O8:C | peut valoir false |
| `presentation.audience` | à qui présenter | HUM | O8:C | requis si présentation |
| `presentation.goal` | ce que l’audience doit décider/comprendre | HUM / CALC | O8:C | lié à Decision Question |
| `presentation.timebox` | durée | HUM | O8:K | seulement si format dépend |
| `presentation.detail_level` | niveau détail | AI-R / HUM | O8:E | dérivable de l’audience |
| `presentation.aligned_topics` | déjà aligné | collaboration / CALC | O8:C | éviter de débattre inutilement |
| `presentation.discussion_topics` | à discuter | collaboration / CALC | O8:C | structure le deck/atelier |
| `workshop.contributions` | questions/idées/objections/risques/propositions | HUM | O8:C | objets structurés, pas chat principal |

La présentation réutilise l’IDD ; aucun questionnaire parallèle complet.

## 24. Decision Brief

O7 requiert un assemblage relatif aux vrais Decision Requirements, typiquement :

- Candidate actuelle ;
- pourquoi / objective ;
- Evidence Pack suffisant ;
- assumptions ;
- alternatives importantes ;
- scope ;
- projection si requise ;
- feasibility si requise ;
- risques ;
- conflits ;
- accepted unknowns ;
- positions équipe si applicables ;
- recommandation 2b2c ;
- Decision Question.

Un Decision Brief peut être `READY_WITH_ACCEPTED_UNKNOWNS`.

## 25. Project Draft Handoff

Après GO explicite seulement, O9 transfère :

- faits validés/actifs ;
- assumptions actives ;
- contraintes ;
- scope ;
- sitemap/structure ;
- recherche pertinente ;
- risques ;
- questions ouvertes ;
- décisions ;
- assets ;
- Candidate finale.

Historique seulement : Candidates précédentes, hypothèses supersédées, recommandations rejetées, feedback obsolète.

---

# PARTIE C — RÈGLES DE RÉSOLUTION ET DE QUESTIONNEMENT

## 26. Human-only réel

Typiquement human-only lorsque non présent dans une source fiable :

- intention réelle ;
- objectif interne ;
- priorité métier ;
- contrainte interne ;
- préférence personnelle structurante ;
- décision d’arbitrage ;
- pouvoir de décision ;
- décision finale.

Même alors, demander seulement si le Requirement est actif maintenant.

## 27. Inference-safe

2b2c peut généralement proposer comme `WORKING_ASSUMPTION` :

- secteur ;
- audience plausible ;
- besoins probables ;
- objections ;
- positionnement candidat ;
- parcours ;
- structure ;
- scope recommandé ;
- risques ;
- direction visuelle candidate.

L’étiquette d’hypothèse reste visible dans la provenance.

## 28. Accepted unknown

L’inconnu peut être accepté si :

- aucune Decision Requirement active ne l’exige ;
- son absence n’invalide pas la Candidate ;
- le risque est compris ;
- il peut raisonnablement être résolu post-GO.

Il ne peut pas être utilisé pour masquer un blocker critique.

## 29. Research trigger

Une recherche n’est activée que si :

1. un Requirement actuel reste incomplet ;
2. une donnée externe peut raisonnablement le résoudre/améliorer ;
3. le résultat peut modifier une Candidate, un risque ou une décision.

Sinon : `NOT_RELEVANT`.

## 30. Question trigger

Une question humaine n’est générée que si :

1. Requirement actif ;
2. non satisfait par mémoire/source ;
3. non résoluble de façon fiable par recherche/calcul ;
4. hypothèse insuffisante ou inappropriée ;
5. humain seul peut savoir/corriger/décider ;
6. l’information est nécessaire maintenant.

## 31. Requirement resolution flow

```text
OUTPUT ACTIF
   ↓
REQUIREMENTS
   ↓
MEMOIRE ?
   ↓ non
SOURCE EXISTANTE ?
   ↓ non
RECHERCHE / DONNEE CONNECTEE ?
   ↓ non
CALCUL ?
   ↓ non
HYPOTHESE SUFFISANTE ?
   ↓ non
HUMAIN NECESSAIRE MAINTENANT ?
   ↓ non
UNKNOWN_ACCEPTABLE / DEFER
```

---

# PARTIE D — READINESS PAR OUTPUT

## 32. O1 UNDERSTANDING_READY

`READY` lorsque :

- nature de l’idée comprise ;
- objectif/problème suffisamment compris ou hypothèse explicitement suffisante ;
- audience suffisamment comprise ou hypothèse de travail ;
- contexte critique connu ;
- aucune contradiction critique masquée.

Ne pas bloquer pour design, contenu final, budget ou concurrence si non nécessaires à la compréhension.

## 33. O2 EVIDENCE_READY

`READY` lorsque l’evidence nécessaire aux décisions/propositions actuelles est suffisante et que le gain marginal de recherche est faible.

Il n’existe pas d’obligation d’audit/concurrence exhaustive.

## 34. O3 DIRECTIONS_READY

`READY` lorsque :

- O1 est exploitable ;
- objectifs/audience/offre/contraintes structurantes sont suffisamment résolus ;
- evidence nécessaire au cas est suffisante ;
- hypothèses critiques sont explicites ;
- conflits structurants sont résolus ou acceptés.

`Informations insuffisantes` est une sortie valide.

## 35. O4 PROPOSITION_READY

`READY` lorsque la direction peut être traduite en proposition cohérente sans inventer des choix métier critiques.

La Candidate peut encore contenir des unknowns non bloquants.

## 36. O5 SCOPE_READY

`READY` lorsque structure/fonctions/contenus candidats peuvent être classés en V1/Later/Not Recommended avec leurs raisons et dépendances principales.

## 37. O6 PROJECTION_READY

Peut être `NOT_RELEVANT`.

Sinon `READY` lorsque le concept peut être matérialisé sans faire croire à un design final et avec assez d’inputs de marque/structure/contenu provisoire.

## 38. O7 DECISION_READY

`READY` ou `READY_WITH_ACCEPTED_UNKNOWNS` lorsque tous les **Decision Requirements actifs** sont satisfaits ou explicitement acceptés comme inconnus, et qu’aucun conflit critique caché ne subsiste.

## 39. O8 PRESENTATION_READY

Peut être `NOT_RELEVANT`.

Sinon : audience, Decision Question, Candidate, points alignés/à discuter et contenu nécessaire suffisamment prêts.

## 40. O9 HANDOFF_READY

Jamais avant GO explicite.

Après GO : Candidate retenue, décisions, contraintes, scope, assets, risks/open questions et provenance transférables sont snapshotés.

---

# PARTIE E — TESTS DE COUVERTURE

## 41. Nathalie — vague

Le registre ne doit pas générer 80 questions.

Attendu : O1 nécessite quelques informations ; les autres Requirements restent dormants jusqu’à leur pertinence.

## 42. Vincent — brief riche + documents

Attendu : de nombreux keys se résolvent via RAW/SRC ; presque aucune question ; O2/O3 peuvent progresser automatiquement.

## 43. Maya — associé/équipe découvert tard

Attendu : activation tardive des Requirements décision/gouvernance sans rouvrir les domaines indépendants.

## 44. Site local simple sans projection

Attendu : `O6 = NOT_RELEVANT`, recherche limitée au strict utile, aucun blocage sur DA finale.

## 45. Décision financière

Attendu : activation budget/scénarios/faisabilité seulement parce que `DECISION_REQUIRES_BUDGET` est actif.

## 46. Source conflictuelle

Attendu : Requirement concerné `CONFLICTED`; conflit visible ; aucune fusion silencieuse.

## 47. Mauvaise idée

Attendu : evidence/diagnostic peut conduire à Challenge/Simplify/Stop ; GO jamais privilégié.

---

## 48. Règle finale

Cette Matrice doit servir à savoir **quoi peut être nécessaire**, pas à imposer **quoi demander**.

Le moteur applique toujours :

> **Output pertinent → Requirement actif → résolution la moins coûteuse pour l’humain → question seulement en dernier recours.**
