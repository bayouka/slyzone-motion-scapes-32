# 4b4c / 2b2c — G0 BLUEPRINT FIT — RED TEAM

Date : 2026-09-13

Verdict : **PASS_G0_INTEGRATION_BASELINE**

## Contrat validé

G0 sépare désormais :

1. une **assessment** système/IA, versionnée et stale-safe ;
2. une **resolution canonique** appliquée au dossier ;
3. une éventuelle confirmation humaine lorsque la classification n'est pas assez sûre.

Tables :
- `idea_blueprint_fit_assessments` ;
- `idea_blueprint_fit_decisions`.

RPCs :
- `record_idea_blueprint_fit_assessment_v1` — service-role only ;
- `apply_assessed_blueprint_fit_v1` — service-role only ;
- `confirm_idea_blueprint_fit_v1` — authenticated writer + service role.

## Scénarios

### Site vitrine évident
Assessment `SITE_VITRINE`, confiance HIGH, `auto_applicable=true`.

Résultat : auto-application autorisée, RAW source persistée, Blueprint `SITE_VITRINE / 0.4`, `engine_revision +1`, projection `IDEA_ENGINE`.

### Marketplace évidente
Assessment `BLUEPRINT_MISMATCH`, candidat `MARKETPLACE`, confiance HIGH, auto-applicable.

Résultat : RAW source conservée, `blueprint_status=mismatch`, projection `BLUEPRINT_MISMATCH`. Aucun faux Blueprint Site vitrine.

### Ambiguïté
Tentative de créer une assessment `AMBIGUOUS` auto-applicable.

Résultat attendu/obtenu : `AUTO_APPLY_REQUIRES_HIGH_NON_AMBIGUOUS`.

### Confiance moyenne
Assessment Site vitrine MEDIUM, non auto-applicable, puis tentative d'auto-application.

Résultat attendu/obtenu : `BLUEPRINT_ASSESSMENT_NOT_AUTO_APPLICABLE`.

### Correction humaine
Assessment MEDIUM Site vitrine, puis confirmation humaine `BLUEPRINT_MISMATCH / SAAS`.

Résultat : correction autorisée, tracée comme `HUMAN`, projection mismatch.

### Stale assessment
Assessment HIGH Site vitrine créée sur une description, puis description modifiée vers un SaaS avant application.

Résultat attendu/obtenu : `STALE_BLUEPRINT_ASSESSMENT` même si `engine_revision` n'avait pas encore changé, grâce au fingerprint exact de l'entrée.

## ACL

- assessment + auto-application : pas d'EXECUTE `anon/authenticated` ;
- confirmation humaine : `authenticated`, mais contrôle `can_write_idea` obligatoire ;
- tables : lecture RLS pour les personnes ayant accès à l'Idea, aucun write générique client.

## Projection

`get_idea_workspace_projection_v1` est passé en `projection_version=1.1` et expose uniquement :
- classification/candidate type/confiance/rationale minimale ;
- `blueprint_fit_requires_human` ;
- décision appliquée et acteur HUMAN/SYSTEM.

Aucune phase/wizard/progress n'a été réintroduit.

## Advisors

Aucune nouvelle exposition anonyme détectée. Le linter signale les RPCs authentifiées `SECURITY DEFINER` comme catégorie générale ; elles sont intentionnelles et protégées par les helpers d'autorisation.

Une FK G0 `raw_source_id` sans index a été détectée et corrigée par `20260913043801_idea_blueprint_fit_g0_fk_index`.

Toutes les fixtures ont été transactionnelles et rollbackées. Base finale : 0 Idea, 0 assessment G0, 0 décision G0 de test.
