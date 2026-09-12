# 4b4c — RED TEAM D01→D05 FOUNDATION DOMAINS

Date : 2026-09-13

Statut : **VALIDATION SUPPORT — NON CANONIQUE**

Périmètre :

- D01 Governance, Stakeholders & Decision Context ;
- D02 Business Context, Problem & Outcomes ;
- D03 Users, Audiences, Segments & Jobs ;
- D04 Existing State, Assets & Evidence ;
- D05 Market, Competition, Alternatives & References.

Objectif : vérifier que la fondation nécessaire avant stratégie/amélioration de l’Idea couvre les cas professionnels utiles sans devenir un questionnaire géant.

---

## 1. Cas testés

### T1 — Artisan local, solo, site 5 pages

Attendu : très peu de gouvernance visible ; objectif, cible locale, offre, site actuel et concurrents locaux peuvent suffire à débloquer D06.

Résultat : PASS.

Protection : D01 doit rester presque invisible ; KPI chiffrés, market sizing et gouvernance équipe restent `NOT_RELEVANT`.

### T2 — Vincent, brief riche + site + PDF + analytics

Attendu : RAW/SRC/AUDIT/CONN résolvent la majorité de D02→D04 ; presque aucune question ; D05 peut démarrer automatiquement.

Résultat : PASS.

### T3 — Refonte B2B avec cible disputée entre direction et marketing

Attendu : préserver les positions, identifier Decision Owner, ne pas lancer un benchmark final sur une cible ambiguë.

Résultat : PASS après renforcement D01 avec critères de décision et sign-off.

### T4 — Entreprise commerciale où le site ne vend pas directement

Attendu : ne pas supposer que la conversion = achat ; comprendre cycle commercial et rôle du site.

Résultat initial : GAP.

Correction : ajout dans D02 du modèle économique, du modèle commercial et du rôle business du futur site/produit.

### T5 — Organisation non commerciale / association

Attendu : `business objective` doit rester interprétable comme résultat organisationnel, information, recrutement, adhésion, mobilisation, etc.

Résultat : PASS à condition que le vocabulaire UI futur ne force pas « chiffre d’affaires ».

### T6 — Aucun site actuel

Attendu : D04 devient léger ; absence d’existant ne bloque ni audience ni recherche marché.

Résultat : PASS.

### T7 — Site actuel performant SEO mais jugé visuellement ancien

Attendu : ne pas lancer refonte structurelle qui détruit l’acquisition ; D04 + D11 futur doivent préserver evidence.

Résultat : PASS fondation ; dépendance critique à D11 confirmée.

### T8 — Aucun concurrent direct

Attendu : rechercher alternatives, statu quo, références exemplaires ; ne pas conclure « marché vide ».

Résultat : PASS grâce à D05 alternatives/non-consommation.

### T9 — Marché extrêmement concurrentiel

Attendu : ne pas analyser 100 concurrents ; sélectionner un set pertinent et définir stop condition.

Résultat : PASS.

### T10 — Utilisateur cite un concurrent célèbre mais non comparable

Attendu : ne pas accepter aveuglément ; competitor relevance analysis doit pouvoir le classer comme référence plutôt que direct competitor.

Résultat : PASS.

### T11 — Deux sources internes se contredisent

Attendu : conserver les deux, qualifier fraîcheur/autorité, pas de fusion silencieuse.

Résultat : PASS avec D01 + D04.

### T12 — Document ancien avec offre obsolète

Attendu : extraire l’information mais la rendre `STALE/REVIEW_REQUIRED` ; humain sollicité seulement si elle affecte la direction.

Résultat : PASS.

### T13 — Budget dur très faible

Attendu : pouvoir invalider une solution disproportionnée avant design/architecture détaillés.

Résultat : PASS via D02 + futur D06/D16 probe.

### T14 — Clinique / secteur réglementé

Attendu : D05 peut détecter un signal de contrainte mais ne doit pas produire une pseudo-conclusion juridique ; activer D17/expert.

Résultat : PASS.

### T15 — Utilisateur ne sait pas définir sa cible

Attendu : sources/recherche/hypothèse peuvent produire une working assumption ; pas de boucle de question infinie.

Résultat : PASS.

### T16 — Cible change après benchmark

Attendu : requalifier D05 set, D06 futur et dépendances affectées ; ne pas redémarrer D04 sans raison.

Résultat : PASS, change impact `STRATEGIC` confirmé.

### T17 — Projet critique mais peu de données réelles

Attendu : ne pas fabriquer de certitude ; augmenter niveau de preuve / recherche / accepted unknown selon décision.

Résultat : PASS avec D02 strategic criticality + validation model.

### T18 — Deux directions sont toutes deux plausibles

Attendu : ne pas laisser l’IA choisir au goût ; critères de décision explicites.

Résultat initial : GAP.

Correction : ajout D01 `Decision criteria` + `Decision-criteria completeness`.

---

## 2. Conclusion de couverture

D01→D05 couvrent maintenant correctement la **Foundation / Evidence layer** nécessaire avant D06 Strategy.

Ils répondent aux besoins du brief utilisateur :

- compréhension de l’activité et du problème ;
- objectifs et rôle business ;
- cible et besoins ;
- offre/existant/evidence ;
- concurrence/alternatives/références ;
- gouvernance ;
- provenance ;
- critères de décision ;
- résolution autonomous-first ;
- change impact.

Ils ne doivent pas encore être promus canonique avant :

1. coverage mapping Matrix V5 ;
2. remplissage D06→D20 ;
3. red-team cross-domain complet ;
4. vérification qu’aucun doublon important n’existe dans les domaines aval.

---

## 3. Invariants confirmés

- `Atom != question utilisateur`.
- Une information peut être requise pour une Gate sans être human-only.
- Cible suffisamment stable précède le benchmark **finalisable**, mais recherche exploratoire possible plus tôt.
- La concurrence n’est pas une liste ; elle doit produire conséquences/opportunités.
- Existing State et Market Evidence ne décident pas seuls de la stratégie : ils alimentent D06.
- Gouvernance est proportionnelle au contexte, pas obligatoire en mode équipe fictif.
- Business model / commercial model sont nécessaires pour éviter de concevoir un site « de conversion » sans comprendre ce que conversion signifie réellement.
- Deux options valables nécessitent des critères de décision, pas une préférence IA opaque.

---

## 4. Décision de travail

Foundation domains D01→D05 : **PASS PROVISOIRE**.

Autorisation de travail : poursuivre D06→D10.

Aucune promotion canonique à ce stade.
