import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const boot = read('site/assets/boot.js');
const index = read('site/index.html');
const js = read('site/assets/work-v6.js');
const css = read('site/assets/work-v6.css');
const live = read('site/assets/live.js');
const workOwner = read('site/assets/work-workflow-v1.js');

const fail = (message) => {
  console.error(`WORK V6 PRESENTATION CHECK FAILED: ${message}`);
  process.exit(1);
};

const livePos = boot.indexOf('./live.js?');
const homePos = boot.indexOf('./home-v6.js?');
const projectsPos = boot.indexOf('./projects-v6.js?');
const presentPos = boot.indexOf('./work-v6.js?');
const accessPos = boot.indexOf('./project-access-v1.js?');
const domainWorkPos = boot.indexOf('./work-workflow-v1.js?');
if ([livePos, homePos, projectsPos, presentPos, accessPos, domainWorkPos].some((pos) => pos < 0)) fail('boot chain incomplete');
if (!(livePos < homePos && homePos < projectsPos && projectsPos < presentPos && presentPos < accessPos && presentPos < domainWorkPos)) fail('Work V6 presentation owner load order is invalid');

const designPos = index.indexOf('assets/design-v6.css');
const homeCssPos = index.indexOf('assets/home-v6.css');
const projectsCssPos = index.indexOf('assets/projects-v6.css');
const workCssPos = index.indexOf('assets/work-v6.css');
if (!(designPos >= 0 && designPos < homeCssPos && homeCssPos < projectsCssPos && projectsCssPos < workCssPos)) fail('Work V6 CSS must load after prior V6 layers');
if (!index.includes('assets/boot.js?build=520')) fail('Tranche D release candidate must expose build 520');

const requiredJs = [
  '__4B4C_WORK_V6_PRESENTATION_OWNER__',
  '.work-view-tabs',
  '.action-row-v4',
  '.roadmap-phase',
  '.roadmap-toolbar',
  'work-v6-primary-view',
  'work-v6-secondary-view',
  'Cause du blocage',
  'roadmap-v6-focus-strip',
  "['board','calendar']",
  'setInterval',
  '2500',
];
for (const marker of requiredJs) if (!js.includes(marker)) fail(`missing Work V6 presentation contract: ${marker}`);

for (const forbidden of ['MutationObserver', 'SupabaseBrowserClient', 'api.rpc', 'api.insert', 'api.update', 'api.remove', 'fetch(']) {
  if (js.includes(forbidden)) fail(`presentation layer contains forbidden backend/observer behavior: ${forbidden}`);
}

const requiredCss = [
  '.work-v6-focus-strip',
  '.roadmap-v6-focus-strip',
  '.work-v6-block-reason',
  '.work-v6-secondary-notice',
  '.roadmap-v6-trajectory',
  '@media(max-width:767px)',
  'prefers-reduced-motion:reduce',
];
for (const marker of requiredCss) if (!css.includes(marker)) fail(`missing Work V6 CSS contract: ${marker}`);

for (const sourceContract of [
  "const views=[['list','Liste'],['roadmap','Roadmap'],['board','Tableau'],['calendar','Calendrier']]",
  'function projectRoadmap',
  'function actionRow',
  'blocked_reason',
  'source_type',
  'source_id',
]) if (!live.includes(sourceContract)) fail(`runtime source contract missing: ${sourceContract}`);

for (const ownerContract of ['__4B4C_WORK_WORKFLOW_OWNER__','create_action_v1','update_action_v1','set_action_status_v1','create_milestone_v1','update_milestone_v1']) {
  if (!workOwner.includes(ownerContract)) fail(`Work mutation owner contract missing: ${ownerContract}`);
}
if (js.includes('source_type') || js.includes('source_id')) fail('presentation layer must not infer provenance not exposed in DOM');

console.log('work v6 presentation: OK (build 520)');
