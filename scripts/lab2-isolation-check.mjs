import fs from 'node:fs/promises';

const read=(path)=>fs.readFile(new URL(`../${path}`,import.meta.url),'utf8');

const [
  understanding,research,webProvider,publicFallback,improvements,brief,feasibility,structure,design,mockups,presentationPlan,
  workerEntry,previewWorker,
  studioJs,studioHtml,researchJs,researchHtml,improvementsJs,improvementsHtml,briefJs,briefHtml,feasibilityJs,feasibilityHtml,structureJs,structureHtml,designJs,designHtml,mockupsJs,mockupsHtml,
  presentationPlannerJs,presentationJs,presentationHtml,pptxJs,mockupRenderer
]=await Promise.all([
  read('src/lab2-idea-understanding.js'),read('src/lab2-idea-research.js'),read('src/lab2-web-provider.js'),read('src/lab2-public-fetch-fallback.js'),read('src/lab2-idea-improvements.js'),read('src/lab2-idea-brief.js'),read('src/lab2-idea-feasibility.js'),read('src/lab2-idea-structure.js'),read('src/lab2-idea-design.js'),read('src/lab2-idea-mockups.js'),read('src/lab2-presentation-plan.js'),
  read('src/worker-entry.js'),read('src/lab2-preview-worker.js'),
  read('site/lab2/idea-studio.js'),read('site/lab2/idea-studio.html'),read('site/lab2/idea-research.js'),read('site/lab2/idea-research.html'),read('site/lab2/idea-improvements.js'),read('site/lab2/idea-improvements.html'),read('site/lab2/idea-brief.js'),read('site/lab2/idea-brief.html'),read('site/lab2/idea-feasibility.js'),read('site/lab2/idea-feasibility.html'),read('site/lab2/idea-structure.js'),read('site/lab2/idea-structure.html'),read('site/lab2/idea-design.js'),read('site/lab2/idea-design.html'),read('site/lab2/idea-mockups.js'),read('site/lab2/idea-mockups.html'),
  read('site/lab2/idea-presentation-planner.js'),read('site/lab2/idea-presentation.js'),read('site/lab2/idea-presentation.html'),read('site/lab2/idea-pptx.js'),read('site/lab2/lab2-mockup-renderer.js')
]);

function requireMatch(source,pattern,code){if(!pattern.test(source))throw new Error(code)}
function forbid(source,pattern,code){if(pattern.test(source))throw new Error(code)}

for(const [name,endpoint] of [['UNDERSTANDING',understanding],['RESEARCH',research],['IMPROVEMENTS',improvements],['BRIEF',brief],['FEASIBILITY',feasibility],['STRUCTURE',structure],['DESIGN',design],['MOCKUPS',mockups],['PRESENTATION_PLAN',presentationPlan]]){
  requireMatch(endpoint,/LAB2_IDEA_STUDIO_ENABLED/,`LAB2_${name}_FEATURE_FLAG_REQUIRED`);
  requireMatch(endpoint,/LAB2_ALLOWED_USER_IDS/,`LAB2_${name}_ALLOWLIST_REQUIRED`);
  requireMatch(endpoint,/\/auth\/v1\/user/,`LAB2_${name}_AUTH_PRECHECK_REQUIRED`);
  forbid(endpoint,/SUPABASE_SERVICE_ROLE_KEY/,`LAB2_${name}_SERVICE_ROLE_FORBIDDEN`);
  forbid(endpoint,/\/rest\/v1\//,`LAB2_${name}_DATABASE_REST_SURFACE_FORBIDDEN`);
  forbid(endpoint,/\/rpc\//,`LAB2_${name}_RPC_SURFACE_FORBIDDEN`);
  forbid(endpoint,/idea_decisions|project_definitions|promote_canonical|record_canonical/i,`LAB2_${name}_CANONICAL_BUSINESS_COUPLING_FORBIDDEN`);
}

// Research orchestration must use a dedicated provider layer and public-source guards.
requireMatch(research,/LAB2_RESEARCH_ENABLED/,'LAB2_RESEARCH_FLAG_REQUIRED');
requireMatch(research,/searchLab2Web/,'LAB2_RESEARCH_PROVIDER_ABSTRACTION_REQUIRED');
requireMatch(research,/extractLab2Web/,'LAB2_RESEARCH_EXTRACT_FALLBACK_REQUIRED');
requireMatch(research,/SOURCE_FETCH/,'LAB2_RESEARCH_PUBLIC_FETCH_SERVICE_REQUIRED');
requireMatch(research,/fetchPublicHtmlFallback/,'LAB2_RESEARCH_SAFE_HTTP_FALLBACK_REQUIRED');
forbid(research,/api\.search\.brave\.com|api\.tavily\.com/,'LAB2_RESEARCH_PROVIDER_ORIGIN_MUST_STAY_IN_PROVIDER_MODULE');
forbid(research,/G2_WEB|G2_SRC|G2_AI_/,'LAB2_RESEARCH_CANONICAL_EXECUTOR_COUPLING_FORBIDDEN');

// Provider is server-only, fixed-origin and bounded. Keys are optional and never browser-visible.
requireMatch(webProvider,/https:\/\/api\.search\.brave\.com\/res\/v1\/web\/search/,'LAB2_PROVIDER_BRAVE_FIXED_ORIGIN_REQUIRED');
requireMatch(webProvider,/https:\/\/api\.tavily\.com\/search/,'LAB2_PROVIDER_TAVILY_SEARCH_FIXED_ORIGIN_REQUIRED');
requireMatch(webProvider,/https:\/\/api\.tavily\.com\/extract/,'LAB2_PROVIDER_TAVILY_EXTRACT_FIXED_ORIGIN_REQUIRED');
requireMatch(webProvider,/LAB2_BRAVE_SEARCH_API_KEY/,'LAB2_PROVIDER_BRAVE_SERVER_KEY_REQUIRED');
requireMatch(webProvider,/LAB2_TAVILY_API_KEY|TAVILY_API_KEY/,'LAB2_PROVIDER_TAVILY_SERVER_KEY_OPTION_REQUIRED');
requireMatch(webProvider,/MAX_RESULTS=6/,'LAB2_PROVIDER_RESULT_BOUND_REQUIRED');
forbid(webProvider,/SUPABASE_SERVICE_ROLE_KEY|\/rest\/v1\/|\/rpc\//,'LAB2_PROVIDER_DATABASE_SURFACE_FORBIDDEN');
forbid(webProvider,/G2_WEB|G2_SRC|G2_AI_/,'LAB2_PROVIDER_CANONICAL_EXECUTOR_COUPLING_FORBIDDEN');

requireMatch(publicFallback,/validatePublicSourceUrl/,'LAB2_PUBLIC_FALLBACK_URL_VALIDATION_REQUIRED');
requireMatch(publicFallback,/resolvePublicAddresses/,'LAB2_PUBLIC_FALLBACK_PUBLIC_DNS_REQUIRED');
requireMatch(publicFallback,/https_only:true/,'LAB2_PUBLIC_FALLBACK_HTTPS_ONLY_GUARANTEE_REQUIRED');
requireMatch(publicFallback,/dns_public_only:true/,'LAB2_PUBLIC_FALLBACK_PUBLIC_DNS_GUARANTEE_REQUIRED');

requireMatch(improvements,/LAB2_IMPROVEMENTS_ENABLED/,'LAB2_IMPROVEMENTS_FLAG_REQUIRED');
requireMatch(improvements,/automatic_idea_mutation:false/,'LAB2_IMPROVEMENTS_NO_AUTOMATIC_MUTATION_GUARANTEE_REQUIRED');
requireMatch(improvements,/empty_output_is_not_success:true/,'LAB2_IMPROVEMENTS_EMPTY_OUTPUT_GUARD_REQUIRED');
requireMatch(brief,/LAB2_BRIEF_ENABLED/,'LAB2_BRIEF_FLAG_REQUIRED');
requireMatch(brief,/rejected_proposals_excluded:true/,'LAB2_BRIEF_REJECTED_EXCLUSION_GUARANTEE_REQUIRED');
requireMatch(brief,/assertDecisions/,'LAB2_BRIEF_DECISION_COMPLETENESS_REQUIRED');
requireMatch(feasibility,/deterministic:true/,'LAB2_FEASIBILITY_DETERMINISTIC_GUARANTEE_REQUIRED');
requireMatch(feasibility,/ai_calls:0/,'LAB2_FEASIBILITY_ZERO_AI_GUARANTEE_REQUIRED');
requireMatch(feasibility,/no_external_service_calls:true/,'LAB2_FEASIBILITY_NO_EXTERNAL_SERVICE_GUARANTEE_REQUIRED');
requireMatch(feasibility,/blocking_questions_preserved:true/,'LAB2_FEASIBILITY_BLOCKING_QUESTION_GUARANTEE_REQUIRED');
requireMatch(structure,/LAB2_STRUCTURE_ENABLED/,'LAB2_STRUCTURE_FLAG_REQUIRED');
requireMatch(structure,/human_page_review_required:true/,'LAB2_STRUCTURE_HUMAN_PAGE_REVIEW_GUARANTEE_REQUIRED');
requireMatch(structure,/no_new_features_allowed:true/,'LAB2_STRUCTURE_NO_NEW_FEATURES_GUARANTEE_REQUIRED');
requireMatch(structure,/feasibility_decisions_respected:true/,'LAB2_STRUCTURE_FEASIBILITY_DECISIONS_REQUIRED');
requireMatch(design,/LAB2_DESIGN_ENABLED/,'LAB2_DESIGN_FLAG_REQUIRED');
requireMatch(design,/catalog_only_tokens:true/,'LAB2_DESIGN_CATALOG_ONLY_GUARANTEE_REQUIRED');
requireMatch(design,/exactly_three_directions:true/,'LAB2_DESIGN_EXACTLY_THREE_GUARANTEE_REQUIRED');
forbid(design,/SOURCE_FETCH|LAB2_BRAVE_SEARCH_API_KEY|api\.search\.brave\.com|api\.tavily\.com/,'LAB2_DESIGN_EXTERNAL_STYLE_FETCH_FORBIDDEN');
requireMatch(mockups,/LAB2_MOCKUPS_ENABLED/,'LAB2_MOCKUPS_FLAG_REQUIRED');
requireMatch(mockups,/no_generated_html_css_or_images:true/,'LAB2_MOCKUPS_NO_GENERATED_CODE_GUARANTEE_REQUIRED');
requireMatch(mockups,/component_catalog_only:true/,'LAB2_MOCKUPS_COMPONENT_CATALOG_GUARANTEE_REQUIRED');
requireMatch(mockups,/complete_selected_page_coverage:true/,'LAB2_MOCKUPS_COMPLETE_COVERAGE_REQUIRED');
forbid(mockups,/<script|<style|dangerouslySetInnerHTML|SOURCE_FETCH|LAB2_BRAVE_SEARCH_API_KEY|api\.tavily\.com/i,'LAB2_MOCKUPS_CODE_OR_FETCH_SURFACE_FORBIDDEN');

requireMatch(presentationPlan,/LAB2_PRESENTATION_PLAN_ENABLED/,'LAB2_PRESENTATION_PLAN_FLAG_REQUIRED');
requireMatch(presentationPlan,/planner_controls_order_not_facts:true/,'LAB2_PRESENTATION_PLAN_NO_FACT_MUTATION_REQUIRED');
requireMatch(presentationPlan,/verified_research_only:true/,'LAB2_PRESENTATION_PLAN_VERIFIED_RESEARCH_REQUIRED');
requireMatch(presentationPlan,/available_mockups_only:true/,'LAB2_PRESENTATION_PLAN_AVAILABLE_MOCKUPS_ONLY_REQUIRED');
requireMatch(presentationPlan,/no_invented_business_metrics:true/,'LAB2_PRESENTATION_PLAN_NO_FAKE_METRICS_REQUIRED');

for(const [path,handler,code] of [['/api/lab2/understand','handleLab2IdeaUnderstanding','UNDERSTANDING'],['/api/lab2/research','handleLab2IdeaResearch','RESEARCH'],['/api/lab2/improvements','handleLab2IdeaImprovements','IMPROVEMENTS'],['/api/lab2/brief','handleLab2IdeaBrief','BRIEF'],['/api/lab2/feasibility','handleLab2IdeaFeasibility','FEASIBILITY'],['/api/lab2/structure','handleLab2IdeaStructure','STRUCTURE'],['/api/lab2/design','handleLab2IdeaDesign','DESIGN'],['/api/lab2/mockups','handleLab2IdeaMockups','MOCKUPS']]){
  requireMatch(workerEntry,new RegExp(path.replaceAll('/','\\/')),`LAB2_${code}_ROUTE_MISSING`);
  requireMatch(workerEntry,new RegExp(handler),`LAB2_${code}_HANDLER_WIRING_MISSING`);
}
requireMatch(previewWorker,/\/api\/lab2\/presentation-plan/,'LAB2_PRESENTATION_PLAN_PREVIEW_ROUTE_MISSING');
requireMatch(previewWorker,/handleLab2PresentationPlan/,'LAB2_PRESENTATION_PLAN_PREVIEW_HANDLER_MISSING');
requireMatch(previewWorker,/production_business_api_exposed:false/,'LAB2_PREVIEW_PRODUCTION_API_ISOLATION_REQUIRED');
requireMatch(previewWorker,/database_write_surface:false/,'LAB2_PREVIEW_DB_WRITE_ISOLATION_REQUIRED');

const browserSource=`${studioJs}\n${studioHtml}\n${researchJs}\n${researchHtml}\n${improvementsJs}\n${improvementsHtml}\n${briefJs}\n${briefHtml}\n${feasibilityJs}\n${feasibilityHtml}\n${structureJs}\n${structureHtml}\n${designJs}\n${designHtml}\n${mockupsJs}\n${mockupsHtml}\n${presentationPlannerJs}\n${presentationJs}\n${presentationHtml}\n${pptxJs}\n${mockupRenderer}`;
forbid(browserSource,/SUPABASE_SERVICE_ROLE_KEY/,'LAB2_BROWSER_SERVICE_ROLE_FORBIDDEN');
forbid(browserSource,/LAB2_BRAVE_SEARCH_API_KEY|LAB2_TAVILY_API_KEY|TAVILY_API_KEY|api\.search\.brave\.com|api\.tavily\.com/,'LAB2_BROWSER_DIRECT_SEARCH_FORBIDDEN');
forbid(browserSource,/SOURCE_FETCH/,'LAB2_BROWSER_SOURCE_FETCH_BINDING_FORBIDDEN');
forbid(browserSource,/\/api\/ideas\/|\/api\/project-definition\//,'LAB2_BROWSER_CANONICAL_API_COUPLING_FORBIDDEN');
forbid(browserSource,/\/rest\/v1\//,'LAB2_BROWSER_DIRECT_DATABASE_ACCESS_FORBIDDEN');

for(const [source,path,code] of [[studioJs,'/api/lab2/understand','UNDERSTANDING'],[researchJs,'/api/lab2/research','RESEARCH'],[improvementsJs,'/api/lab2/improvements','IMPROVEMENTS'],[briefJs,'/api/lab2/brief','BRIEF'],[feasibilityJs,'/api/lab2/feasibility','FEASIBILITY'],[structureJs,'/api/lab2/structure','STRUCTURE'],[designJs,'/api/lab2/design','DESIGN'],[mockupsJs,'/api/lab2/mockups','MOCKUPS'],[presentationPlannerJs,'/api/lab2/presentation-plan','PRESENTATION_PLAN']]){
  requireMatch(source,new RegExp(path.replaceAll('/','\\/')),`LAB2_BROWSER_${code}_ROUTE_MISSING`);
}
for(const [source,code] of [[studioJs,'DRAFT'],[researchJs,'RESEARCH_CACHE'],[improvementsJs,'IMPROVEMENT_DECISIONS'],[briefJs,'BRIEF_CACHE'],[feasibilityJs,'FEASIBILITY_CACHE'],[structureJs,'STRUCTURE_CACHE'],[designJs,'DESIGN_SELECTION'],[mockupsJs,'MOCKUP_CACHE'],[presentationPlannerJs,'PRESENTATION_PLAN_CACHE'],[presentationJs,'PRESENTATION_INPUTS'],[pptxJs,'PPTX_INPUTS']])requireMatch(source,/localStorage/,`LAB2_LOCAL_ONLY_${code}_EXPECTED`);

forbid(mockupsJs,/innerHTML\s*=\s*[^'"`]*block\.|insertAdjacentHTML|eval\(/,'LAB2_MOCKUP_RENDERER_UNTRUSTED_HTML_FORBIDDEN');
forbid(mockupRenderer,/innerHTML\s*=\s*[^'"`]*block\.|insertAdjacentHTML|eval\(/,'LAB2_SHARED_MOCKUP_RENDERER_UNTRUSTED_HTML_FORBIDDEN');
forbid(presentationJs,/fetch\s*\(|\/api\/lab2\//,'LAB2_PRESENTATION_RENDERER_API_OR_AI_CALL_FORBIDDEN');
forbid(pptxJs,/\/api\/lab2\//,'LAB2_PPTX_API_OR_AI_CALL_FORBIDDEN');
requireMatch(presentationJs,/window\.print\(\)/,'LAB2_PRESENTATION_PRINT_PDF_REQUIRED');
requireMatch(pptxJs,/new window\.PptxGenJS\(\)/,'LAB2_PPTX_ENGINE_REQUIRED');
requireMatch(pptxJs,/window\.html2canvas/,'LAB2_PPTX_HTML_CAPTURE_REQUIRED');
requireMatch(pptxJs,/Lab2MockupRenderer\.renderMockup/,'LAB2_PPTX_SHARED_RENDERER_REQUIRED');
requireMatch(presentationHtml,/pptxgenjs@4\.0\.1\/dist\/pptxgen\.bundle\.js/,'LAB2_PPTX_VERSION_PIN_REQUIRED');
requireMatch(presentationHtml,/html2canvas@1\.4\.1\/dist\/html2canvas\.min\.js/,'LAB2_HTML2CANVAS_VERSION_PIN_REQUIRED');

console.log('lab2-isolation-check: ok (research + feasibility + adaptive presentation remain isolated)');
