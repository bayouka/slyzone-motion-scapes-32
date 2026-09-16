import fs from 'node:fs/promises';

const read=(path)=>fs.readFile(new URL(`../${path}`,import.meta.url),'utf8');

const [understanding,research,improvements,brief,structure,design,workerEntry,studioJs,studioHtml,researchJs,researchHtml,improvementsJs,improvementsHtml,briefJs,briefHtml,structureJs,structureHtml,designJs,designHtml]=await Promise.all([
  read('src/lab2-idea-understanding.js'),
  read('src/lab2-idea-research.js'),
  read('src/lab2-idea-improvements.js'),
  read('src/lab2-idea-brief.js'),
  read('src/lab2-idea-structure.js'),
  read('src/lab2-idea-design.js'),
  read('src/worker-entry.js'),
  read('site/lab2/idea-studio.js'),
  read('site/lab2/idea-studio.html'),
  read('site/lab2/idea-research.js'),
  read('site/lab2/idea-research.html'),
  read('site/lab2/idea-improvements.js'),
  read('site/lab2/idea-improvements.html'),
  read('site/lab2/idea-brief.js'),
  read('site/lab2/idea-brief.html'),
  read('site/lab2/idea-structure.js'),
  read('site/lab2/idea-structure.html'),
  read('site/lab2/idea-design.js'),
  read('site/lab2/idea-design.html')
]);

function requireMatch(source,pattern,code){if(!pattern.test(source))throw new Error(code)}
function forbid(source,pattern,code){if(pattern.test(source))throw new Error(code)}

for(const [name,endpoint] of [['UNDERSTANDING',understanding],['RESEARCH',research],['IMPROVEMENTS',improvements],['BRIEF',brief],['STRUCTURE',structure],['DESIGN',design]]){
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

requireMatch(workerEntry,/\/api\/lab2\/understand/,'LAB2_UNDERSTANDING_ROUTE_MISSING');
requireMatch(workerEntry,/handleLab2IdeaUnderstanding/,'LAB2_UNDERSTANDING_HANDLER_WIRING_MISSING');
requireMatch(workerEntry,/\/api\/lab2\/research/,'LAB2_RESEARCH_ROUTE_MISSING');
requireMatch(workerEntry,/handleLab2IdeaResearch/,'LAB2_RESEARCH_HANDLER_WIRING_MISSING');
requireMatch(workerEntry,/\/api\/lab2\/improvements/,'LAB2_IMPROVEMENTS_ROUTE_MISSING');
requireMatch(workerEntry,/handleLab2IdeaImprovements/,'LAB2_IMPROVEMENTS_HANDLER_WIRING_MISSING');
requireMatch(workerEntry,/\/api\/lab2\/brief/,'LAB2_BRIEF_ROUTE_MISSING');
requireMatch(workerEntry,/handleLab2IdeaBrief/,'LAB2_BRIEF_HANDLER_WIRING_MISSING');
requireMatch(workerEntry,/\/api\/lab2\/structure/,'LAB2_STRUCTURE_ROUTE_MISSING');
requireMatch(workerEntry,/handleLab2IdeaStructure/,'LAB2_STRUCTURE_HANDLER_WIRING_MISSING');
requireMatch(workerEntry,/\/api\/lab2\/design/,'LAB2_DESIGN_ROUTE_MISSING');
requireMatch(workerEntry,/handleLab2IdeaDesign/,'LAB2_DESIGN_HANDLER_WIRING_MISSING');

const browserSource=`${studioJs}\n${studioHtml}\n${researchJs}\n${researchHtml}\n${improvementsJs}\n${improvementsHtml}\n${briefJs}\n${briefHtml}\n${structureJs}\n${structureHtml}\n${designJs}\n${designHtml}`;
forbid(browserSource,/SUPABASE_SERVICE_ROLE_KEY/,'LAB2_BROWSER_SERVICE_ROLE_FORBIDDEN');
forbid(browserSource,/LAB2_BRAVE_SEARCH_API_KEY|api\.search\.brave\.com/,'LAB2_BROWSER_DIRECT_SEARCH_FORBIDDEN');
forbid(browserSource,/SOURCE_FETCH/,'LAB2_BROWSER_SOURCE_FETCH_BINDING_FORBIDDEN');
forbid(browserSource,/\/api\/ideas\/|\/api\/project-definition\//,'LAB2_BROWSER_CANONICAL_API_COUPLING_FORBIDDEN');
forbid(browserSource,/\/rest\/v1\//,'LAB2_BROWSER_DIRECT_DATABASE_ACCESS_FORBIDDEN');
requireMatch(studioJs,/\/api\/lab2\/understand/,'LAB2_BROWSER_UNDERSTANDING_ROUTE_MISSING');
requireMatch(researchJs,/\/api\/lab2\/research/,'LAB2_BROWSER_RESEARCH_ROUTE_MISSING');
requireMatch(improvementsJs,/\/api\/lab2\/improvements/,'LAB2_BROWSER_IMPROVEMENTS_ROUTE_MISSING');
requireMatch(briefJs,/\/api\/lab2\/brief/,'LAB2_BROWSER_BRIEF_ROUTE_MISSING');
requireMatch(structureJs,/\/api\/lab2\/structure/,'LAB2_BROWSER_STRUCTURE_ROUTE_MISSING');
requireMatch(designJs,/\/api\/lab2\/design/,'LAB2_BROWSER_DESIGN_ROUTE_MISSING');
requireMatch(studioJs,/localStorage/,'LAB2_LOCAL_ONLY_DRAFT_EXPECTED');
requireMatch(researchJs,/localStorage/,'LAB2_LOCAL_ONLY_RESEARCH_CACHE_EXPECTED');
requireMatch(improvementsJs,/localStorage/,'LAB2_LOCAL_ONLY_IMPROVEMENT_DECISIONS_EXPECTED');
requireMatch(briefJs,/localStorage/,'LAB2_LOCAL_ONLY_BRIEF_CACHE_EXPECTED');
requireMatch(structureJs,/localStorage/,'LAB2_LOCAL_ONLY_STRUCTURE_CACHE_EXPECTED');
requireMatch(designJs,/localStorage/,'LAB2_LOCAL_ONLY_DESIGN_SELECTION_EXPECTED');

console.log('lab2-isolation-check: ok');
