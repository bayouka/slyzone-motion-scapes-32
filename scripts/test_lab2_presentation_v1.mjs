import fs from 'node:fs/promises';
const source=await fs.readFile(new URL('../site/lab2/idea-presentation.js',import.meta.url),'utf8');
function requireMatch(pattern,code){if(!pattern.test(source))throw new Error(code)}
function forbid(pattern,code){if(pattern.test(source))throw new Error(code)}
requireMatch(/idea-brief\.slice5\.v1/,'LAB2_PRESENTATION_BRIEF_SOURCE_REQUIRED');
requireMatch(/idea-structure\.slice6\.v1/,'LAB2_PRESENTATION_STRUCTURE_SOURCE_REQUIRED');
requireMatch(/idea-design\.slice7\.v1/,'LAB2_PRESENTATION_DESIGN_SOURCE_REQUIRED');
requireMatch(/idea-mockups\.slice8\.v1/,'LAB2_PRESENTATION_MOCKUPS_SOURCE_REQUIRED');
requireMatch(/window\.print\(\)/,'LAB2_PRESENTATION_PDF_PRINT_REQUIRED');
requireMatch(/requestFullscreen/,'LAB2_PRESENTATION_FULLSCREEN_REQUIRED');
forbid(/fetch\s*\(|\/api\/lab2\//,'LAB2_PRESENTATION_NETWORK_OR_AI_CALL_FORBIDDEN');
forbid(/SUPABASE_SERVICE_ROLE_KEY|\/rest\/v1\/|\/rpc\//,'LAB2_PRESENTATION_DATA_WRITE_SURFACE_FORBIDDEN');
console.log('lab2-presentation-v1: ok (zero API/AI calls, printable web deck)');
