# 4b4c — RED-TEAM PREFIGURATION / DECISION PACKAGE — 2026-09-13

Statut : **VALIDATION SUPPORT — NON CANONIQUE**

Objet : tenter de casser l’architecture Z4–Z5 avant promotion.

---

# Cas testés

## T01 — Petit site solo, faible enjeu

Risque : imposer étude de marché, 18 slides, ROI et maquettes multiples.

Verdict : PASS avec correction.

Règle : `Decision Package Profile` proportionnel. Un `SOLO_DECISION_BRIEF` peut suffire ; PowerPoint non obligatoire.

---

## T02 — Équipe de 5 décideurs

Risque : feedback perdu et décision floue.

Verdict : PASS.

Nécessite deck + Review Agenda + Feedback Log + Decision Record + Decision Owner.

---

## T03 — Maquette haute fidélité trop séduisante

Risque : les stakeholders jugent couleurs/images et oublient problème/strategy ; illusion de produit final.

Correction :
- label `CONCEPT / NOT FINAL SPEC` ;
- présenter rationale et assumptions ;
- si comparaison stratégique réelle, montrer 2 variantes assez comparables ;
- ne pas utiliser une seule maquette ultra-polished avant qu’une direction visuelle soit choisie ;
- différencier `visual proof of concept` et `design approval`.

---

## T04 — Aucun vrai retour utilisateur

Risque : l’équipe adore le concept mais la cible réelle ne le comprend pas.

Correction majeure : ajouter `CONCEPT_VALIDATION` conditionnel avant approbation quand l’incertitude utilisateur est structurante.

Peut prendre la forme :
- test de compréhension du message ;
- préférence comparative ;
- test de prototype ;
- interview ciblée ;
- test tâche/navigation ;
- landing/smoke test si légitime.

Une simulation IA/persona synthétique peut aider à préparer le test mais **ne compte jamais comme evidence utilisateur réelle**.

---

## T05 — Target change après research

Risque : deck conserve anciens concurrents et sitemap.

Verdict : PASS si Change Impact obligatoire.

D03 change → D05/D06/D07 + prefiguration + D21 + D22 review required/stale selon dépendances.

---

## T06 — Feature concept “espace client” apparaît dans la préfiguration

Risque : jolie idée, mais auth/data/privacy/security explosent scope.

Correction : toute capability structurante peut activer une `FEASIBILITY/RISK PROBE` avant G6.

---

## T07 — Refonte avec SEO important

Risque : sitemap conceptuel recommandé détruit URLs qui performent.

Correction : `SEO_MIGRATION_RISK` doit conditionner PF.D09 avant Decision Snapshot.

---

## T08 — Aucun chiffre interne mais demande de ROI

Risque : faux business case.

Correction : D21 doit répondre `INSUFFICIENT_INPUTS_FOR_ROI` plutôt que générer des hypothèses invisibles.

Possible : scénario illustratif explicitement non décisionnel.

---

## T09 — Pendant présentation, associé propose B2B au lieu de B2C

Risque : traiter comme simple commentaire.

Correction : `CRITICAL` feedback → réouvre D03 ; ancienne presentation reste snapshot historique ; nouvelle version seulement après targeted recompute.

---

## T10 — Deux associés donnent des retours contradictoires

Risque : 2b2c choisit silencieusement.

Correction : créer conflict group + Decision Owner/Method D01 ; conserver les deux positions.

---

## T11 — “On approuve, mais seulement si réservation < 5k€”

Risque : création Project avec condition critique non résolue.

Correction : `APPROVE_WITH_CONDITIONS` doit être distinct. Condition devient requirement/probe. Project baseline n’est créée qu’après résolution ou accepted unknown explicitement autorisé.

---

## T12 — Aucun concurrent direct

Risque : forcer benchmark artificiel.

Verdict : PASS si D05 utilise indirect alternatives + exemplars + NOT_RELEVANT justifié.

---

## T13 — Secteur réglementé

Risque : mockup contient claims illégaux ou workflow non conforme.

Correction : compliance probe/expert review peut devenir prerequisite du Decision Package.

---

## T14 — Préférence visuelle vs charte officielle

Risque : user choisit un concept incompatible avec brand governance.

Correction : `source authority + constraint classification`; preference n’override pas automatiquement une charte obligatoire.

---

## T15 — Hero concept utilise “n°1 de Lyon”

Risque : proposition IA transformée en claim publié/présenté.

Correction : tout factual claim visible en concept doit être `SOURCE_BACKED` ou marqué placeholder/claim-to-verify.

---

## T16 — Deck généré lundi, nouvelle evidence mardi, réunion mercredi

Risque : présentation stale.

Correction : `PRESENTATION_FRESHNESS_CHECK` avant réunion/export ; deck référence Decision Snapshot et affiche stale warning si actif dossier a divergé.

---

## T17 — Deux directions restent crédibles

Risque : préfigurer seulement celle préférée par l’IA crée biais.

Correction : si Decision Question exige comparaison, préfigurer les deux à **fidelity comparable** sur les artifacts réellement discriminants.

---

## T18 — Créateur veut une maquette très tôt

Risque : court-circuiter research.

Verdict : possible comme `EXPLORATORY`, explicitement non probante ; ne débloque aucune Gate de décision à elle seule.

---

## T19 — Retour après plusieurs semaines

Risque : pricing/concurrents/trends obsolètes.

Correction : freshness policy par source + refresh ciblé avant Decision Package si nécessaire.

---

## T20 — Rendering PPTX ne supporte pas Morph complet

Risque : dépendre de l’animation pour la décision.

Correction : `STATIC_PRO` doit rester un output professionnel complet. `MOTION_PRO` est enhancement et possède un spike technique séparé.

---

# Corrections obligatoires issues du red-team

1. Ajouter `CONCEPT_VALIDATION` avant G6 lorsque risque utilisateur significatif.
2. Introduire `APPROVE_WITH_CONDITIONS`.
3. Ajouter `PRESENTATION_FRESHNESS_CHECK`.
4. Interdire de compter une simulation IA comme evidence user réelle.
5. Ajouter `PREFIGURATION_BUDGET` : seulement les artifacts qui réduisent une incertitude ou aident une décision.
6. Exiger fidelity comparable lorsque plusieurs directions sont comparées.
7. Toute capability conceptuelle structurante peut activer feasibility/security/privacy probe.
8. Toute factual claim dans un mockup/deck doit être sourcée ou explicitement non vérifiée.
9. Les artifacts peuvent être hérités/promotionnés vers Project, pas recopiés aveuglément.
10. Motion PowerPoint ne doit jamais être une dépendance fonctionnelle du Decision Package.

---

# `CONCEPT_VALIDATION` candidate

Activation si au moins un signal :
- message/value proposition très incertain ;
- nouveau segment ;
- journey inhabituel ;
- interaction critique nouvelle ;
- décision coûteuse/irréversible ;
- divergence importante entre stakeholders et evidence ;
- risque utilisateur élevé.

Outputs :
- validation question ;
- test protocol ;
- participant/source definition ;
- observations ;
- evidence quality ;
- implications ;
- affected artifacts.

Non activation :
- ne pas imposer research user lourd pour une refonte mineure bien comprise.

---

# Conclusion

L’architecture Z4–Z5 tient sous réserve d’intégrer les 10 corrections ci-dessus.

Le principal invariant nouveau est :

> **une bonne présentation ne doit pas seulement rendre l’idée séduisante ; elle doit rendre la décision plus fiable.**
