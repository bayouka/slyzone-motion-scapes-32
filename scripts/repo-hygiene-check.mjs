import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const assert = (condition, message) => {
  if (!condition) {
    console.error('REPO HYGIENE FAILED:', message);
    process.exitCode = 1;
  }
};

const boot = read('site/assets/boot.js');
const index = read('site/index.html');
const worker = read('src/worker.js');
const live = read('site/assets/live.js');
const pkg = JSON.parse(read('package.json'));
const lock = JSON.parse(read('package-lock.json'));


const requiredBootModules = [
  'live.js',
  'delivery-workflow-v1.js',
  'workflow-backend-safe-v1.js',
  'communication-workspace-v1.js',
  'resources-workspace-v2.js',
  'library-workspace-v1.js',
];
for (const module of requiredBootModules) assert(boot.includes(module), `missing active boot module: ${module}`);

for (const obsolete of ['home-polish.js','workflow-backend-v2.js','project-progress-v2.js','call-native-v1.js']) {
  assert(!boot.includes(obsolete), `obsolete runtime module reintroduced: ${obsolete}`);
}

assert(!/MutationObserver\s*\(/.test(boot), 'MutationObserver reintroduced in boot runtime');

const cssRefs = [...index.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g)].map(m => m[1]);
assert(cssRefs.length > 0, 'no stylesheets found in index');
assert(cssRefs.at(-1)?.startsWith('assets/design-v5.css?'), 'design-v5.css must be the final stylesheet');
assert(cssRefs.filter(x => x.startsWith('assets/design-v5.css?')).length === 1, 'design-v5.css must be loaded exactly once');
assert(cssRefs.indexOf('assets/v434-polish.css') < cssRefs.indexOf('assets/v435-final.css'), 'legacy CSS must preserve chronological cascade: v434 before v435');
assert(pkg.version === lock.version && pkg.version === lock.packages?.['']?.version, 'package.json and package-lock.json versions must match');


assert(index.includes('assets/boot.js?build=503'), 'unexpected production boot build in SPA shell');
assert(index.includes('assets/design-v5.css?v=5.0.2-navigation-flow'), 'unexpected V5 design asset version');

assert(worker.includes("'cache-control': 'no-store'"), 'SPA shell must explicitly disable caching');
assert(worker.includes("'x-content-type-options': 'nosniff'"), 'missing X-Content-Type-Options');
assert(worker.includes("'referrer-policy': 'strict-origin-when-cross-origin'"), 'missing Referrer-Policy');
assert(worker.includes("'permissions-policy'"), 'missing Permissions-Policy');

const routeRenderers = [
  'renderDashboard','renderProjects','renderProject','renderMyWork','renderMessages',
  'renderCalendar','renderLibrary','renderTeam','renderProfile','renderSettings','renderWelcome','renderArchives',
];
for (let i = 0; i < routeRenderers.length; i++) {
  const name = routeRenderers[i];
  const start = live.indexOf('function ' + name + '(');
  assert(start >= 0, `missing route renderer: ${name}`);
  if (start < 0) continue;
  const next = live.indexOf('\nfunction ', start + 10);
  const block = live.slice(start, next > start ? next : live.length);
  assert(block.includes('<h1'), `route renderer must provide an h1: ${name}`);
}

for (const form of live.matchAll(/<form\b[\s\S]*?<\/form>/g)) {
  for (const button of form[0].matchAll(/<button\b([^>]*)>/g)) {
    assert(/\btype=/.test(button[1]), `button inside form missing explicit type: ${button[0].slice(0,120)}`);
  }
}

assert(live.includes('auditRenderedSemanticsV454'), 'runtime semantic guard missing');
assert(live.includes('aria-current="page"'), 'active navigation must expose aria-current');
assert(live.includes("event.key==='Tab'&&state.mobileMenuOpen"), 'mobile drawer keyboard focus trap missing');


const markerDir = '.github';
if (fs.existsSync(markerDir)) {
  const markers = fs.readdirSync(markerDir).filter(name => name.startsWith('deploy-once-'));
  const markerAllowed = process.env.ALLOW_DEPLOY_ONCE_MARKER === '1';
  assert(markerAllowed || markers.length === 0, `temporary deploy markers left behind: ${markers.join(', ')}`);
  assert(!markerAllowed || markers.length <= 1, `more than one temporary deploy marker present: ${markers.join(', ')}`);
}

const archivedWorkflows = [
  '.github/workflows/native-access-migrate.yml',
  '.github/workflows/native-progress-migrate.yml',
  '.github/workflows/native-progress-migrate-v2.yml',
];
for (const path of archivedWorkflows) {
  const yaml = read(path);
  assert(yaml.includes('workflow_dispatch:'), `${path} must remain manual-only`);
  assert(!/^\s+push:/m.test(yaml), `${path} must not have a push trigger`);
  assert(yaml.includes('if: ${{ false }}'), `${path} must remain archived/non-executable`);
}

console.log('repo hygiene: OK');
if (process.exitCode) process.exit(process.exitCode);
