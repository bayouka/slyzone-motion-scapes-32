import fs from 'node:fs';

const index = fs.readFileSync('site/index.html', 'utf8');
const css = fs.readFileSync('site/assets/design-v6.css', 'utf8');

const fail = (message) => {
  console.error(`V6 SHELL CHECK FAILED: ${message}`);
  process.exit(1);
};

const v5 = index.indexOf('assets/design-v5.css');
const v6 = index.indexOf('assets/design-v6.css');
if (v5 < 0) fail('design-v5.css baseline is missing from index.html');
if (v6 < 0) fail('design-v6.css is missing from index.html');
if (v6 <= v5) fail('design-v6.css must load after design-v5.css for reversible progressive override');

const requiredTokens = [
  '--v6-bg:',
  '--v6-surface:',
  '--v6-ink:',
  '--v6-muted:',
  '--v6-line:',
  '--v6-blue:',
  '--v6-success:',
  '--v6-warning:',
  '--v6-danger:',
  '--v6-r-control:',
  '--v6-r-card:',
];
for (const token of requiredTokens) if (!css.includes(token)) fail(`missing token ${token}`);

const requiredContracts = [
  '.live-sidebar',
  '.live-topbar',
  '.live-content',
  '.v43-mobile-tabbar.v52-mobile-primary',
  '.mobile-drawer',
  ':focus-visible',
  'prefers-reduced-motion:reduce',
];
for (const selector of requiredContracts) if (!css.includes(selector)) fail(`missing shell/accessibility contract ${selector}`);

if (css.includes('supabase') || css.includes('create_action_v1') || css.includes('create_meeting_with_attendees_v2')) {
  fail('design layer must not contain backend/workflow ownership');
}

if (!index.includes('assets/boot.js?build=519')) {
  fail('Tranche A draft must not claim a new certified runtime build before quality certification');
}

console.log('v6 shell: OK');
