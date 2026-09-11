import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const boot = read('site/assets/boot.js');
const index = read('site/index.html');
const js = read('site/assets/projects-v6.js');
const css = read('site/assets/projects-v6.css');
const live = read('site/assets/live.js');

const fail = (message) => {
  console.error(`PROJECTS V6 CHECK FAILED: ${message}`);
  process.exit(1);
};

const livePos = boot.indexOf('./live.js?');
const shellPos = boot.indexOf('./shell-polish-v6.js?');
const homePos = boot.indexOf('./home-v6.js?');
const projectsPos = boot.indexOf('./projects-v6.js?');
const accessPos = boot.indexOf('./project-access-v1.js?');
if ([livePos, shellPos, homePos, projectsPos, accessPos].some((pos) => pos < 0)) fail('missing boot module in V6 presentation chain');
if (!(livePos < shellPos && shellPos < homePos && homePos < projectsPos && projectsPos < accessPos)) fail('Projects V6 owner load order is invalid');

const designCssPos = index.indexOf('assets/design-v6.css');
const homeCssPos = index.indexOf('assets/home-v6.css');
const projectsCssPos = index.indexOf('assets/projects-v6.css');
if (!(designCssPos >= 0 && designCssPos < homeCssPos && homeCssPos < projectsCssPos)) fail('Projects V6 CSS must load after Design V6 and Home V6');
if (!index.includes('assets/boot.js?build=522')) fail('Projects V6 release candidate must expose build 522');

const requiredLive = ['function projectCardV3','projectSituationText','project-room-layout','situation-card','now-card','next-card','progress-track-v3'];
for (const marker of requiredLive) if (!live.includes(marker)) fail(`missing live project source contract: ${marker}`);

const requiredJs = [
  '__4B4C_PROJECTS_V6_OWNER__', '.project-grid-v3', '.project-card-v3', '.project-room-layout',
  '.now-card', '.next-card', '.situation-card', 'Maintenant', 'Pourquoi', 'Ensuite', 'projectCardRank',
  'personalBlocked', 'blockedCount', 'Après résolution du blocage', 'Poursuivre', 'setInterval', '2500',
];
for (const marker of requiredJs) if (!js.includes(marker)) fail(`missing Projects V6 contract: ${marker}`);

for (const forbidden of ['MutationObserver', 'SupabaseBrowserClient', 'api.rpc', 'api.insert', 'api.update', 'api.remove', 'fetch(']) {
  if (js.includes(forbidden)) fail(`presentation owner must not contain backend/observer behavior: ${forbidden}`);
}

const requiredCss = [
  '.project-v6-card-flow', '.project-v6-card-step', '.project-v6-focus-strip', '.project-v6-focus-card',
  '.project-v6-trajectory-card', '.project-room-layout.project-v6-overview-ready',
  '>.project-context-rail{display:none!important}', '@media(max-width:767px)',
];
for (const marker of requiredCss) if (!css.includes(marker)) fail(`missing Projects V6 style contract: ${marker}`);

console.log('projects v6: OK (build 522)');
