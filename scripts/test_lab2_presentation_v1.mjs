import fs from 'node:fs/promises';
const [source,html,pptx,planner,renderer]=await Promise.all([
  fs.readFile(new URL('../site/lab2/idea-presentation.js',import.meta.url),'utf8'),
  fs.readFile(new URL('../site/lab2/idea-presentation.html',import.meta.url),'utf8'),
  fs.readFile(new URL('../site/lab2/idea-pptx.js',import.meta.url),'utf8'),
  fs.readFile(new URL('../site/lab2/idea-presentation-planner.js',import.meta.url),'utf8'),
  fs.readFile(new URL('../site/lab2/lab2-mockup-renderer.js',import.meta.url),'utf8')
]);
function requireMatch(target,pattern,code){if(!pattern.test(target))throw new Error(code)}
function forbid(target,pattern,code){if(pattern.test(target))throw new Error(code)}

for(const pattern of [/idea-research\.slice3\.v1/,/idea-brief\.slice5\.v1/,/idea-structure\.slice6\.v1/,/idea-design\.slice7\.v1/,/idea-mockups\.slice8\.v1/,/presentation-plan\.slice9\.v1/])requireMatch(source,pattern,'LAB2_PRESENTATION_LOCAL_SOURCE_REQUIRED');
requireMatch(source,/builders=\{COVER:coverSlide,PROBLEM:problemSlide,CONCEPT:conceptSlide/,'LAB2_PRESENTATION_PLAN_RENDERER_REQUIRED');
requireMatch(source,/fetch_status==='OBSERVED_PUBLIC'/,'LAB2_PRESENTATION_VERIFIED_RESEARCH_FILTER_REQUIRED');
requireMatch(source,/Fait public vérifié/,'LAB2_PRESENTATION_VERIFIED_LABEL_REQUIRED');
requireMatch(source,/lab2:presentation-plan-ready/,'LAB2_PRESENTATION_PLAN_EVENT_REQUIRED');
requireMatch(source,/window\.print\(\)/,'LAB2_PRESENTATION_PDF_PRINT_REQUIRED');
requireMatch(source,/requestFullscreen/,'LAB2_PRESENTATION_FULLSCREEN_REQUIRED');
forbid(source,/fetch\s*\(|\/api\/lab2\//,'LAB2_PRESENTATION_RENDERER_NETWORK_FORBIDDEN');

requireMatch(planner,/\/api\/lab2\/presentation-plan/,'LAB2_PRESENTATION_PLANNER_API_REQUIRED');
requireMatch(planner,/audience:audience\.value/,'LAB2_PRESENTATION_AUDIENCE_REQUIRED');
requireMatch(planner,/objective:objective\.value/,'LAB2_PRESENTATION_OBJECTIVE_REQUIRED');
requireMatch(planner,/detail:detail\.value/,'LAB2_PRESENTATION_DETAIL_REQUIRED');
requireMatch(planner,/presentation-plan\.slice9\.v1/,'LAB2_PRESENTATION_PLAN_CACHE_REQUIRED');

requireMatch(html,/html2canvas@1\.4\.1\/dist\/html2canvas\.min\.js/,'LAB2_HTML2CANVAS_PIN_REQUIRED');
requireMatch(html,/pptxgenjs@4\.0\.1\/dist\/pptxgen\.bundle\.js/,'LAB2_PPTX_PINNED_LIBRARY_REQUIRED');
requireMatch(html,/id="mockupCaptureFrame"/,'LAB2_MOCKUP_CAPTURE_FRAME_REQUIRED');
requireMatch(html,/idea-presentation-planner\.js/,'LAB2_PRESENTATION_PLANNER_SCRIPT_REQUIRED');
requireMatch(html,/id="pptxButton"/,'LAB2_PPTX_BUTTON_REQUIRED');

for(const pattern of [/idea-research\.slice3\.v1/,/idea-brief\.slice5\.v1/,/idea-structure\.slice6\.v1/,/idea-design\.slice7\.v1/,/idea-mockups\.slice8\.v1/,/presentation-plan\.slice9\.v1/])requireMatch(pptx,pattern,'LAB2_PPTX_LOCAL_SOURCE_REQUIRED');
requireMatch(pptx,/function captureMockupImages/,'LAB2_PPTX_REAL_CAPTURE_REQUIRED');
requireMatch(pptx,/Lab2MockupRenderer\.renderMockup/,'LAB2_PPTX_SHARED_RENDERER_REQUIRED');
requireMatch(pptx,/window\.html2canvas/,'LAB2_PPTX_HTML_CAPTURE_REQUIRED');
requireMatch(pptx,/addImage\(\{data:capture\.data/,'LAB2_PPTX_REAL_IMAGE_INSERT_REQUIRED');
requireMatch(pptx,/ctx\.plan\.slides/,'LAB2_PPTX_PLAN_ORDER_REQUIRED');
requireMatch(pptx,/fetch_status==='OBSERVED_PUBLIC'/,'LAB2_PPTX_VERIFIED_RESEARCH_FILTER_REQUIRED');
requireMatch(pptx,/new window\.PptxGenJS\(\)/,'LAB2_PPTX_ENGINE_REQUIRED');
requireMatch(pptx,/LAYOUT_WIDE/,'LAB2_PPTX_WIDE_LAYOUT_REQUIRED');
requireMatch(pptx,/writeFile\(\{fileName:/,'LAB2_PPTX_DOWNLOAD_REQUIRED');
forbid(pptx,/\/api\/lab2\//,'LAB2_PPTX_API_OR_AI_CALL_FORBIDDEN');
forbid(pptx,/SUPABASE_SERVICE_ROLE_KEY|\/rest\/v1\/|\/rpc\//,'LAB2_PPTX_DATA_WRITE_SURFACE_FORBIDDEN');

requireMatch(renderer,/window\.Lab2MockupRenderer/,'LAB2_SHARED_MOCKUP_RENDERER_EXPORT_REQUIRED');
requireMatch(renderer,/browser-frame/,'LAB2_SHARED_MOCKUP_BROWSER_REQUIRED');
requireMatch(renderer,/mock-page/,'LAB2_SHARED_MOCKUP_PAGE_REQUIRED');

console.log('lab2-presentation-v1: ok (adaptive plan + provenance-safe Web/PDF + real HTML mockup capture in PPTX)');
