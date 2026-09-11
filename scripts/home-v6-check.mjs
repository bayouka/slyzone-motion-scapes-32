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
const homePos = boot.indexOf('./home-v6.js?');
const accessPos = boot.indexOf('./project-access-v1.js?');
if (livePos < 0 || homePos < 0) fail('Home V6 module is not loaded by boot');
if (!(livePos < homePos && homePos < accessPos)) fail('Home V6 presentation owner must load after live.js and before domain workflow owners');

const v6CssPos = index.indexOf('assets/design-v6.css');
const homeCssPos = index.indexOf('assets/home-v6.css');
if (v6CssPos < 0 || homeCssPos < 0 || homeCssPos <= v6CssPos) fail('Home V6 CSS must load after Design V6');
if (!index.includes('assets/boot.js?build=519')) fail('Home V6 draft must not claim a certified new build');

const requiredJs = [
  '__4B4C_HOME_V6_OWNER__',
  '.v43-home-head',
  '.v43-home-grid',
  '.v43-attention-row',
  '.v43-catchup-card .catchup-event-v41',
  '.project-resume-card-v43',
  '.v43-upcoming-row',
  'data-home-v6-action="catchup"',
  'role="dialog"',
  'aria-modal="true"',
  "event.key === 'Escape'",
  'trapDialogFocus',
  'setInterval',
  '2500',
];
for (const marker of requiredJs) if (!js.includes(marker)) fail(`missing Home V6 contract: ${marker}`);

for (const forbidden of ['MutationObserver', 'SupabaseBrowserClient', 'api.rpc', 'api.insert', 'api.update', 'api.remove', 'fetch(']) {
  if (js.includes(forbidden)) fail(`presentation owner must not contain backend/observer behavior: ${forbidden}`);
}

const requiredCss = [
  '.home-v6-hero-actions',
  '.home-v6-focus-strip',
  '.home-v6-focus-card',
  '.home-v6-dialog-backdrop',
  '.home-v6-causal-step',
  '@media(max-width:767px)',
  'prefers-reduced-motion:reduce',
];
for (const marker of requiredCss) if (!css.includes(marker)) fail(`missing Home V6 style contract: ${marker}`);

console.log('home v6: OK');
