import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const boot = read('site/assets/boot.js');
const index = read('site/index.html');
const js = read('site/assets/home-v6.js');
const css = read('site/assets/home-v6.css');

const fail = (message) => {
  console.error(`HOME V6 CHECK FAILED: ${message}`);
  process.exit(1);
};

const livePos = boot.indexOf('./live.js?');
const shellPos = boot.indexOf('./shell-polish-v6.js?');
const homePos = boot.indexOf('./home-v6.js?');
const accessPos = boot.indexOf('./project-access-v1.js?');
if ([livePos,shellPos,homePos,accessPos].some(pos=>pos<0)) fail('Home V6 boot chain is incomplete');
if (!(livePos < shellPos && shellPos < homePos && homePos < accessPos)) fail('Home V6 presentation owner load order is invalid');

const v6CssPos = index.indexOf('assets/design-v6.css');
const homeCssPos = index.indexOf('assets/home-v6.css');
if (v6CssPos < 0 || homeCssPos < 0 || homeCssPos <= v6CssPos) fail('Home V6 CSS must load after Design V6');
if (!index.includes('assets/boot.js?build=522')) fail('Home V6 release candidate must expose build 522');

const requiredJs = [
  '__4B4C_HOME_V6_OWNER__', '.v43-home-head', '.v43-home-grid', '.v43-attention-row',
  '.v43-catchup-card .catchup-event-v41', '.project-resume-card-v43', '.v43-upcoming-row',
  'data-home-v6-action="catchup"', 'role="dialog"', 'aria-modal="true"', "event.key === 'Escape'",
  'trapDialogFocus', 'heroFacts', 'home-v6-hero-fact', 'normalizedTitle',
  'Reprendre la trajectoire du projet', 'setInterval', '2500',
];
for (const marker of requiredJs) if (!js.includes(marker)) fail(`missing Home V6 contract: ${marker}`);
if (js.includes('est en difficulté')) fail('Home V6 must not expose opaque project-health copy');

for (const forbidden of ['MutationObserver', 'SupabaseBrowserClient', 'api.rpc', 'api.insert', 'api.update', 'api.remove', 'fetch(']) {
  if (js.includes(forbidden)) fail(`presentation owner must not contain backend/observer behavior: ${forbidden}`);
}

const requiredCss = [
  '.home-v6-hero-facts', '.home-v6-hero-fact', '.home-v6-hero-actions', '.home-v6-focus-strip',
  '.home-v6-focus-card', '.home-v6-dialog-backdrop', '.home-v6-causal-step',
  '@media(max-width:767px)', 'prefers-reduced-motion:reduce',
];
for (const marker of requiredCss) if (!css.includes(marker)) fail(`missing Home V6 style contract: ${marker}`);

console.log('home v6: OK (build 522)');
