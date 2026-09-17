import fs from 'node:fs/promises';
const [source,html,pptx]=await Promise.all([
  fs.readFile(new URL('../site/lab2/idea-presentation.js',import.meta.url),'utf8'),
  fs.readFile(new URL('../site/lab2/idea-presentation.html',import.meta.url),'utf8'),
  fs.readFile(new URL('../site/lab2/idea-pptx.js',import.meta.url),'utf8')
]);
function requireMatch(target,pattern,code){if(!pattern.test(target))throw new Error(code)}
function forbid(target,pattern,code){if(pattern.test(target))throw new Error(code)}
for(const pattern of [/idea-research\.slice3\.v1/,/idea-brief\.slice5\.v1/,/idea-structure\.slice6\.v1/,/idea-design\.slice7\.v1/,/idea-mockups\.slice8\.v1/])requireMatch(source,pattern,'LAB2_PRESENTATION_LOCAL_SOURCE_REQUIRED');
requireMatch(source,/fetch_status==='OBSERVED_PUBLIC'/,'LAB2_PRESENTATION_VERIFIED_RESEARCH_FILTER_REQUIRED');
requireMatch(source,/Fait public vérifié/,'LAB2_PRESENTATION_VERIFIED_LABEL_REQUIRED');
requireMatch(source,/Non vérifié/,'LAB2_PRESENTATION_UNVERIFIED_LABEL_REQUIRED');
requireMatch(source,/window\.print\(\)/,'LAB2_PRESENTATION_PDF_PRINT_REQUIRED');
requireMatch(source,/requestFullscreen/,'LAB2_PRESENTATION_FULLSCREEN_REQUIRED');
forbid(source,/fetch\s*\(|\/api\/lab2\//,'LAB2_PRESENTATION_NETWORK_OR_AI_CALL_FORBIDDEN');
forbid(source,/SUPABASE_SERVICE_ROLE_KEY|\/rest\/v1\/|\/rpc\//,'LAB2_PRESENTATION_DATA_WRITE_SURFACE_FORBIDDEN');
requireMatch(html,/pptxgenjs@4\.0\.1\/dist\/pptxgen\.bundle\.js/,'LAB2_PPTX_PINNED_LIBRARY_REQUIRED');
requireMatch(html,/id="pptxButton"/,'LAB2_PPTX_BUTTON_REQUIRED');
requireMatch(html,/idea-pptx\.js/,'LAB2_PPTX_EXPORT_SCRIPT_REQUIRED');
for(const pattern of [/idea-research\.slice3\.v1/,/idea-brief\.slice5\.v1/,/idea-structure\.slice6\.v1/,/idea-design\.slice7\.v1/,/idea-mockups\.slice8\.v1/])requireMatch(pptx,pattern,'LAB2_PPTX_LOCAL_SOURCE_REQUIRED');
requireMatch(pptx,/function addResearchSlide/,'LAB2_PPTX_RESEARCH_SLIDE_REQUIRED');
requireMatch(pptx,/fetch_status==='OBSERVED_PUBLIC'/,'LAB2_PPTX_VERIFIED_RESEARCH_FILTER_REQUIRED');
requireMatch(pptx,/non vérifiée automatiquement/,'LAB2_PPTX_UNVERIFIED_PROVENANCE_REQUIRED');
requireMatch(pptx,/new window\.PptxGenJS\(\)/,'LAB2_PPTX_ENGINE_REQUIRED');
requireMatch(pptx,/LAYOUT_WIDE/,'LAB2_PPTX_WIDE_LAYOUT_REQUIRED');
requireMatch(pptx,/writeFile\(\{fileName:/,'LAB2_PPTX_DOWNLOAD_REQUIRED');
forbid(pptx,/fetch\s*\(|\/api\/lab2\//,'LAB2_PPTX_API_OR_AI_CALL_FORBIDDEN');
forbid(pptx,/SUPABASE_SERVICE_ROLE_KEY|\/rest\/v1\/|\/rpc\//,'LAB2_PPTX_DATA_WRITE_SURFACE_FORBIDDEN');
console.log('lab2-presentation-v1: ok (provenance-safe web/PDF + deterministic PPTX, zero API/AI calls)');
