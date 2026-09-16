import fs from 'node:fs/promises';

const read=(path)=>fs.readFile(new URL(`../${path}`,import.meta.url),'utf8');

const [understanding,research,improvements,brief,structure,design,mockups,workerEntry,studioJs,studioHtml,researchJs,researchHtml,improvementsJs,improvementsHtml,briefJs,briefHtml,structureJs,structureHtml,designJs,designHtml,mockupsJs,mockupsHtml,presentationJs,presentationHtml,pptxJs]=await Promise.all([
  read('src/lab2-idea-understanding.js'),read('src/lab2-idea-research.js'),read('src/lab2-idea-improvements.js'),read('src/lab2-idea-brief.js'),read('src/lab2-idea-structure.js'),read('src/lab2-idea-design.js'),read('src/lab2-idea-mockups.js'),read('src/worker-entry.js'),
  read('site/lab2/idea-studio.js'),read('site/lab2/idea-studio.html'),read('site/lab2/idea-research.js'),read('site/lab2/idea-research.html'),read('site/lab2/idea-improvements.js'),read('site/lab2/idea-improvements.html'),read('site/lab2/idea-brief.js'),read('site/lab2/idea-brief.html'),read('site/lab2/idea-structure.js'),read('site/lab2/idea-structure.html'),read('site/lab2/idea-design.js'),read('site/lab2/idea-design.html'),read('site/lab2/idea-mockups.js'),read('site/lab2/idea-mockups.html'),read('site/lab2/idea-presentation.js'),read('site/lab2/idea-presentation.html'),read('site/lab2/idea-pptx.js')
]);

function requireMatch(source,pattern,code){if(!pattern.test(source))throw new Error(code)}
function forbid(source,pattern,code){if(pattern.test(source))throw new Error(code)}

for(const [name,endpoint] of [['UNDERSTANDING',understanding],['RESEARCH',research],['IMPROVEMENTS',improvements],['BRIEF',brief],['STRUCTURE',structure],['DESIGN',design],['MOCKUPS',mockups]]){
  requireMatch(endpoint,/LAB2_IDEA_STUDIO_ENABLED/,`LAB2_${name}_FEATURE_FLAG_REQUIRED`);
  requireMatch(endpoint,/LAB2_ALLOWED_USER_IDS/,`LAB2_${name}_ALLOWLIST_REQUIRED`);
  requireMatch(endpoint,/\/auth\/v1\/user/,`LAB2_${name}_AUTH_PRECHECK_REQUIRED`);
  forbid(endpoint,/SUPABASE_SERVICE_ROLE_KEY/,`LAB2_${name}_SERVICE_ROLE_FORBIDDEN`);
  forbid(endpoint,/\/rest\/v1\//,`LAB2_${name}_DATABASE_REST_SURFACE_FORBIDDEN`);
  forbid(endpoint,/\/rpc\//,`LAB2_${name}_RPC_SURFACE_FORBIDDEN`);
  forbid(endpoint,/idea_decisions|project_definitions|promote_canonical|record_canonical/i,`LAB2_${name}_CANONICAL_BUSINESS_COUPLING_FORBIDDEN`);
}

requireMatch(research,/LAB2_RESEARCH_ENABLED/,'LAB2_RESEARCH_FLAG_REQUIRED');
requireMatch(research,/LAB2_BRAVE_SEARCH_API_KEY/,'LAB2_RESEARCH_SERVER_SEARCH_KEY_REQUIRED');
requireMatch(research,/SOURCE_FETCH/,'LAB2_RESEARCH_PUBLIC_FETCH_SERVICE_REQUIRED');
requireMatch(research,/api\.search\.brave\.com\/res\/v1\/web\/search/,'LAB2_RESEARCH_FIXED_SEARCH_ORIGIN_REQUIRED');
forbid(research,/TAVILY_API_KEY|G2_WEB|G2_SRC|G2_AI_/,'LAB2_RESEARCH_CANONICAL_EXECUTOR_COUPLING_FORBIDDEN');
requireMatch(improvements,/LAB2_IMPROVEMENTS_ENABLED/,'LAB2_IMPROVEMENTS_FLAG_REQUIRED');
requireMatch(improvements,/automatic_idea_mutation:false/,'LAB2_IMPROVEMENTS_NO_AUTOMATIC_MUTATION_GUARANTEE_REQUIRED');
requireMatch(brief,/LAB2_BRIEF_ENABLED/,'LAB2_BRIEF_FLAG_REQUIRED');
requireMatch(brief,/rejected_proposals_excluded_from_model_prompt:true/,'LAB2_BRIEF_REJECTED_EXCLUSION_GUARANTEE_REQUIRED');
requireMatch(brief,/assertDecisionCompleteness/,'LAB2_BRIEF_DECISION_COMPLETENESS_REQUIRED');
requireMatch(structure,/LAB2_STRUCTURE_ENABLED/,'LAB2_STRUCTURE_FLAG_REQUIRED');
requireMatch(structure,/human_page_review_required:true/,'LAB2_STRUCTURE_HUMAN_PAGE_REVIEW_GUARANTEE_REQUIRED');
requireMatch(structure,/no_new_features_allowed:true/,'LAB2_STRUCTURE_NO_NEW_FEATURES_GUARANTEE_REQUIRED');
requireMatch(design,/LAB2_DESIGN_ENABLED/,'LAB2_DESIGN_FLAG_REQUIRED');
requireMatch(design,/catalog_only_tokens:true/,'LAB2_DESIGN_CATALOG_ONLY_GUARANTEE_REQUIRED');
requireMatch(design,/human_direction_selection_required:true/,'LAB2_DESIGN_HUMAN_SELECTION_GUARANTEE_REQUIRED');
requireMatch(design,/deterministic_tokens_for_mockups:true/,'LAB2_DESIGN_DETERMINISTIC_TOKEN_GUARANTEE_REQUIRED');
forbid(design,/SOURCE_FETCH|LAB2_BRAVE_SEARCH_API_KEY|api\.search\.brave\.com/,'LAB2_DESIGN_EXTERNAL_STYLE_FETCH_FORBIDDEN');
requireMatch(mockups,/LAB2_MOCKUPS_ENABLED/,'LAB2_MOCKUPS_FLAG_REQUIRED');
requireMatch(mockups,/no_generated_html_css_or_images:true/,'LAB2_MOCKUPS_NO_GENERATED_CODE_GUARANTEE_REQUIRED');
requireMatch(mockups,/component_catalog_only:true/,'LAB2_MOCKUPS_COMPONENT_CATALOG_GUARANTEE_REQUIRED');
requireMatch(mockups,/selected_design_tokens_applied_client_side:true/,'LAB2_MOCKUPS_SELECTED_DESIGN_REQUIRED');
forbid(mockups,/<script|<style|dangerouslySetInnerHTML|SOURCE_FETCH|LAB2_BRAVE_SEARCH_API_KEY/i,'LAB2_MOCKUPS_CODE_OR_FETCH_SURFACE_FORBIDDEN');

for(const [path,handler,code] of [['/api/lab2/understand','handleLab2IdeaUnderstanding','UNDERSTANDING'],['/api/lab2/research','handleLab2IdeaResearch','RESEARCH'],['/api/lab2/improvements','handleLab2IdeaImprovements','IMPROVEMENTS'],['/api/lab2/brief','handleLab2IdeaBrief','BRIEF'],['/api/lab2/structure','handleLab2IdeaStructure','STRUCTURE'],['/api/lab2/design','handleLab2IdeaDesign','DESIGN'],['/api/lab2/mockups','handleLab2IdeaMockups','MOCKUPS']]){requireMatch(workerEntry,new RegExp(path.replaceAll('/','\\/')),`LAB2_${code}_ROUTE_MISSING`);requireMatch(workerEntry,new RegExp(handler),`LAB2_${code}_HANDLER_WIRING_MISSING`)}

const browserSource=`${studioJs}\n${studioHtml}\n${researchJs}\n${researchHtml}\n${improvementsJs}\n${improvementsHtml}\n${briefJs}\n${briefHtml}\n${structureJs}\n${structureHtml}\n${designJs}\n${designHtml}\n${mockupsJs}\n${mockupsHtml}\n${presentationJs}\n${presentationHtml}\n${pptxJs}`;
forbid(browserSource,/SUPABASE_SERVICE_ROLE_KEY/,'LAB2_BROWSER_SERVICE_ROLE_FORBIDDEN');
forbid(browserSource,/LAB2_BRAVE_SEARCH_API_KEY|api\.search\.brave\.com/,'LAB2_BROWSER_DIRECT_SEARCH_FORBIDDEN');
forbid(browserSource,/SOURCE_FETCH/,'LAB2_BROWSER_SOURCE_FETCH_BINDING_FORBIDDEN');
forbid(browserSource,/\/api\/ideas\/|\/api\/project-definition\//,'LAB2_BROWSER_CANONICAL_API_COUPLING_FORBIDDEN');
forbid(browserSource,/\/rest\/v1\//,'LAB2_BROWSER_DIRECT_DATABASE_ACCESS_FORBIDDEN');
for(const [source,path,code] of [[studioJs,'/api/lab2/understand','UNDERSTANDING'],[researchJs,'/api/lab2/research','RESEARCH'],[improvementsJs,'/api/lab2/improvements','IMPROVEMENTS'],[briefJs,'/api/lab2/brief','BRIEF'],[structureJs,'/api/lab2/structure','STRUCTURE'],[designJs,'/api/lab2/design','DESIGN'],[mockupsJs,'/api/lab2/mockups','MOCKUPS']])requireMatch(source,new RegExp(path.replaceAll('/','\\/')),`LAB2_BROWSER_${code}_ROUTE_MISSING`);
for(const [source,code] of [[studioJs,'DRAFT'],[researchJs,'RESEARCH_CACHE'],[improvementsJs,'IMPROVEMENT_DECISIONS'],[briefJs,'BRIEF_CACHE'],[structureJs,'STRUCTURE_CACHE'],[designJs,'DESIGN_SELECTION'],[mockupsJs,'MOCKUP_CACHE'],[presentationJs,'PRESENTATION_INPUTS'],[pptxJs,'PPTX_INPUTS']])requireMatch(source,/localStorage/,`LAB2_LOCAL_ONLY_${code}_EXPECTED`);
forbid(mockupsJs,/innerHTML\s*=\s*[^'"`]*block\.|insertAdjacentHTML|eval\(/,'LAB2_MOCKUP_RENDERER_UNTRUSTED_HTML_FORBIDDEN');
forbid(presentationJs,/fetch\s*\(|\/api\/lab2\//,'LAB2_PRESENTATION_API_OR_AI_CALL_FORBIDDEN');
forbid(pptxJs,/fetch\s*\(|\/api\/lab2\//,'LAB2_PPTX_API_OR_AI_CALL_FORBIDDEN');
requireMatch(presentationJs,/window\.print\(\)/,'LAB2_PRESENTATION_PRINT_PDF_REQUIRED');
requireMatch(pptxJs,/new window\.PptxGenJS\(\)/,'LAB2_PPTX_ENGINE_REQUIRED');
requireMatch(presentationHtml,/pptxgenjs@4\.0\.1\/dist\/pptxgen\.bundle\.js/,'LAB2_PPTX_VERSION_PIN_REQUIRED');

console.log('lab2-isolation-check: ok');
