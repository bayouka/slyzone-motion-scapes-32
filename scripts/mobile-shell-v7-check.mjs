import fs from 'node:fs';

const css = fs.readFileSync('site/assets/mobile-shell-v7.css', 'utf8');
const js = fs.readFileSync('site/assets/mobile-shell-v7.js', 'utf8');
const stability = fs.readFileSync('site/assets/home-v6-stability.js', 'utf8');
const index = fs.readFileSync('site/index.html', 'utf8');
const assert = (ok, message) => { if (!ok) throw new Error(`MOBILE SHELL V7 CHECK FAILED: ${message}`); };

for (const marker of [
  '.v43-mobile-tabbar.v52-mobile-primary',
  'display:none!important',
  '.mobile-menu-button span',
  '.mobile-v7-primary-nav',
  '.mobile-drawer-head .brand-logo-icon',
  'html[data-home-v6-booting="true"] .live-content .v43-home-head',
]) assert(css.includes(marker), `CSS missing ${marker}`);

for (const marker of [
  'window.__4B4C_MOBILE_SHELL_V7__',
  "document.querySelectorAll('.v52-mobile-primary a[href]')",
  "block.className = 'mobile-v7-primary'",
  "img.setAttribute('src', './assets/brand-icon.svg')",
  'new MutationObserver(schedule)',
]) assert(js.includes(marker), `JS missing ${marker}`);

for (const marker of [
  'window.__4B4C_HOME_V6_STABILITY__',
  "document.documentElement.dataset.homeV6Booting = 'true'",
  ".v43-home-head.home-v6-ready",
  '2400',
]) assert(stability.includes(marker), `stability guard missing ${marker}`);

assert(index.includes('mobile-shell-v7.css?v=7.0.0'), 'V7 CSS not loaded');
assert(index.includes('mobile-shell-v7.js?v=7.0.0'), 'V7 JS not loaded');
assert(index.includes('home-v6-stability.js?v=1.0.0'), 'home stability module not loaded');
assert(index.indexOf('mobile-shell-v7.css?v=7.0.0') < index.indexOf('</head>'), 'V7 CSS must load before first paint');
assert(index.includes('document.documentElement.dataset.homeV6Booting'), 'dashboard boot guard not armed synchronously');

console.log('Mobile shell V7 + dashboard stability gate: OK');
