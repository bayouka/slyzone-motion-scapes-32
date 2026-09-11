import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const assert = (condition, message) => {
  if (!condition) {
    console.error('REPO HYGIENE FAILED:', message);
    process.exitCode = 1;
  }
};

const RELEASE = 'v4.5.12-v6-polish-p2';
const BUILD = '522';
const boot = read('site/assets/boot.js');
const index = read('site/index.html');
const worker = read('src/worker.js');
const live = read('site/assets/live.js');
const liveCss = read('site/assets/live.css');
const pkg = JSON.parse(read('package.json'));
const lock = JSON.parse(read('package-lock.json'));

const requiredBootModules = [
  'live.js',
  'call-incoming-v2.js',
  'shell-polish-v6.js',
  'home-v6.js',
  'projects-v6.js',
  'work-v6.js',
  'project-access-v1.js',
  'project-messages-route-v1.js',
  'delivery-workflow-v1.js',
  'meeting-workflow-v1.js',
  'work-workflow-v1.js',
  'workflow-backend-safe-v1.js',
  'communication-workspace-v1.js',
  'resources-workspace-v2.js',
  'approval-route-v1.js',
  'library-workspace-v1.js',
];
for (const module of requiredBootModules) assert(boot.includes(module), `missing active boot module: ${module}`);

for (const obsolete of ['home-polish.js','workflow-backend-v2.js','project-progress-v2.js','call-native-v1.js']) {
  assert(!boot.includes(obsolete), `obsolete runtime module reintroduced: ${obsolete}`);
}
assert(!boot.includes('communication workspace unavailable; native messages view kept'), 'Communication V3 must not silently fall back to native global messages');
assert(!boot.includes('resources v2 unavailable; native resources view kept'), 'Resources V2 must not silently fall back to native resources/delivery');
assert(!/MutationObserver\s*\(/.test(boot), 'MutationObserver reintroduced in boot runtime');

const cssRefs = [...index.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g)].map(m => m[1]);
assert(cssRefs.length > 0, 'no stylesheets found in index');
assert(cssRefs.at(-1)?.startsWith('assets/design-v5.css?'), 'design-v5.css must remain the final linked baseline stylesheet');
assert(cssRefs.filter(x => x.startsWith('assets/design-v5.css?')).length === 1, 'design-v5.css must be loaded exactly once');
assert(cssRefs.includes('assets/core-legacy-v455.css?v=4.5.12-roadmap-p2'), 'consolidated legacy core CSS bundle missing');
assert(index.includes('assets/design-v6.css?v=6.0.0-shell-p1'), 'V6 shell layer missing');
assert(index.includes('assets/home-v6.css?v=6.0.1-home-polish'), 'V6 Home polish layer missing');
assert(index.includes('assets/projects-v6.css?v=6.0.1-project-polish'), 'V6 Projects polish layer missing');
assert(index.includes('assets/work-v6.css?v=6.0.1-work-polish'), 'V6 Work polish layer missing');
for (const obsoleteCss of ['assets/styles.css','assets/live.css','assets/home-polish.css','assets/v434-polish.css','assets/v435-final.css','assets/home-mobile-layout-v1.css']) {
  assert(!cssRefs.includes(obsoleteCss), `legacy CSS must not be loaded directly: ${obsoleteCss}`);
}
assert(pkg.version === lock.version && pkg.version === lock.packages?.['']?.version, 'package.json and package-lock.json versions must match');
assert(pkg.scripts?.check?.includes('site/assets/work-workflow-v1.js'), 'npm check must syntax-check work workflow owner');
assert(pkg.scripts?.check?.includes('site/assets/home-v6.js'), 'npm check must syntax-check Home V6 owner');
assert(pkg.scripts?.check?.includes('site/assets/projects-v6.js'), 'npm check must syntax-check Projects V6 owner');
assert(pkg.scripts?.check?.includes('site/assets/work-v6.js'), 'npm check must syntax-check Work V6 presentation owner');
assert(pkg.scripts?.check?.includes('site/assets/call-incoming-v2.js'), 'npm check must syntax-check incoming call receiver');
assert(pkg.scripts?.check?.includes('site/assets/shell-polish-v6.js'), 'npm check must syntax-check shell polish owner');
assert(pkg.scripts?.check?.includes('shell-polish-v6-check.mjs'), 'npm check must include shell polish contract');
assert(pkg.scripts?.check?.includes('call-incoming-v2-check.mjs'), 'npm check must include incoming call contract');
assert(pkg.scripts?.check?.includes('communication-v3-check.mjs'), 'npm check must include communication contract');

assert(index.includes(`assets/boot.js?build=${BUILD}`), `unexpected production boot build; expected ${BUILD}`);
assert(index.includes('assets/design-v5.css?v=5.0.5-roadmap-p1'), 'unexpected V5 design baseline asset version');
assert(boot.includes(`const VERSION = '${RELEASE}'`), `unexpected boot release marker; expected ${RELEASE}`);
assert(worker.includes(`version: '${RELEASE}'`), `unexpected worker release marker; expected ${RELEASE}`);

assert(worker.includes("'cache-control': 'no-store'"), 'SPA shell must explicitly disable caching');
assert(worker.includes("'x-content-type-options': 'nosniff'"), 'missing X-Content-Type-Options');
assert(worker.includes("'referrer-policy': 'strict-origin-when-cross-origin'"), 'missing Referrer-Policy');
assert(worker.includes("'permissions-policy'"), 'missing Permissions-Policy');

const routeRenderers = [
  'renderDashboard','renderProjects','renderProject','renderMyWork','renderMessages',
  'renderCalendar','renderLibrary','renderTeam','renderProfile','renderSettings','renderWelcome','renderArchives',
];
for (const name of routeRenderers) {
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
assert(live.includes("state.mobileMenuOpen?'Fermer le menu':'Ouvrir le menu'"), 'hamburger accessible label must follow open state');

const projectMessagesRoute = read('site/assets/project-messages-route-v1.js');
assert(projectMessagesRoute.includes("#/messages/${conversationId}"), 'project messages route must resolve into Communication workspace');
assert(projectMessagesRoute.includes('kind=eq.project'), 'project messages route must resolve project conversations only');
assert(projectMessagesRoute.includes('routingContextReady()'), 'project message deep link must wait for auth/workspace context');
assert(projectMessagesRoute.includes('pendingTimer'), 'project message deep link pending resolution guard missing');

const resources = read('site/assets/resources-workspace-v2.js');
assert(resources.includes('create_deliverable_with_first_version_v1'), 'Resources V2 must own first deliverable version creation');
assert(resources.includes('register_deliverable_version_v3'), 'Resources V2 must own immutable version registration');
assert(resources.includes('request_deliverable_approval_v1'), 'Resources V2 must own approval requests');
assert(resources.includes('decide_deliverable_approval_v1'), 'Resources V2 must own approval decisions');
assert(resources.includes("window.addEventListener('hashchange'"), 'Resources V2 must own its route lifecycle explicitly');
assert(!resources.includes('new MutationObserver'), 'Resources V2 must not use MutationObserver');

const approvalRoute = read('site/assets/approval-route-v1.js');
assert(approvalRoute.includes('[data-action="open-approval"],[data-action="approval-decision"]'), 'legacy approval entry interception missing');
assert(approvalRoute.includes('/resources?approval='), 'approval entries must route through project Resources V2');
assert(approvalRoute.includes('data-rw-action="decide-approval"'), 'approval route must open the Resources V2 decision action');
assert(approvalRoute.includes('focusAttempts >= 40'), 'approval route bounded readiness retry missing');
assert(!approvalRoute.includes('MutationObserver'), 'approval route must not use MutationObserver');

const meeting = read('site/assets/meeting-workflow-v1.js');
assert(meeting.includes('create_meeting_with_attendees_v2'), 'Meeting owner must use atomic create V2');
assert(meeting.includes('update_meeting_v2'), 'Meeting owner must use update_meeting_v2');
assert(meeting.includes('set_meeting_response_v2'), 'Meeting owner must use RSVP V2');
assert(meeting.includes("['meeting', 'meeting-detail']"), 'Meeting owner must capture create/detail forms');
assert(meeting.includes('[data-action="meeting-response"]'), 'Meeting owner must capture RSVP actions');
assert(!meeting.includes("api.insert('meetings'"), 'Meeting owner must not directly insert meetings');
assert(!meeting.includes("api.update('meetings'"), 'Meeting owner must not directly update meetings');
assert(!meeting.includes("api.update('meeting_attendees'"), 'Meeting owner must not directly update RSVP rows');
assert(!meeting.includes('MutationObserver'), 'Meeting owner must not use MutationObserver');
assert(boot.indexOf('meeting-workflow-v1.js') < boot.indexOf('workflow-backend-safe-v1.js'), 'Meeting owner must load before compatibility bridge');

const work = read('site/assets/work-workflow-v1.js');
assert(work.includes('__4B4C_WORK_WORKFLOW_OWNER__'), 'Work owner marker missing');
assert(work.includes('create_action_v1') && work.includes('update_action_v1') && work.includes('set_action_status_v1'), 'Work owner action RPC contract missing');
assert(work.includes('create_milestone_v1') && work.includes('update_milestone_v1'), 'Work owner milestone RPC contract missing');
assert(work.includes('[data-action="delete-action"]') && work.includes('[data-status-action]'), 'Work owner action interaction coverage missing');
assert(work.includes('stopImmediatePropagation'), 'Work owner must intercept legacy handlers deterministically');
assert(!work.includes("api.insert('actions'"), 'Work owner must not directly insert actions');
assert(!work.includes("api.insert('milestones'"), 'Work owner must not directly insert milestones');
assert(!work.includes("api.update('milestones'"), 'Work owner must not directly update milestones');
assert(!work.includes('MutationObserver'), 'Work owner must not use MutationObserver');
assert(boot.indexOf('work-workflow-v1.js') < boot.indexOf('workflow-backend-safe-v1.js'), 'Work owner must load before compatibility bridge');

const incomingCallV2 = read('site/assets/call-incoming-v2.js');
const shellPolishV6 = read('site/assets/shell-polish-v6.js');
const homeV6 = read('site/assets/home-v6.js');
const projectsV6 = read('site/assets/projects-v6.js');
const workV6 = read('site/assets/work-v6.js');
assert(incomingCallV2.includes("api.rpc('get_pending_call_invite_v2')"), 'Incoming call receiver must use secure pending-call RPC');
assert(!incomingCallV2.includes('RTCPeerConnection'), 'Incoming call receiver must reuse native WebRTC owner');
assert(shellPolishV6.includes('__4B4C_SHELL_POLISH_V6_OWNER__'), 'Shell polish owner marker missing');
assert(shellPolishV6.includes('Agenda'), 'Shell polish Agenda vocabulary missing');
assert(shellPolishV6.includes('.shell-v6-message-count'), 'Shell polish desktop message badge missing');
for (const [name, code] of [['Shell polish V6',shellPolishV6],['Home V6',homeV6],['Projects V6',projectsV6],['Work V6',workV6]]) {
  assert(!code.includes('MutationObserver'), `${name} must not use MutationObserver`);
  assert(!code.includes('SupabaseBrowserClient'), `${name} must remain presentation-only`);
}
assert(boot.indexOf('live.js') < boot.indexOf('call-incoming-v2.js'), 'Incoming call receiver must load after live');
assert(boot.indexOf('call-incoming-v2.js') < boot.indexOf('shell-polish-v6.js'), 'Shell polish must load after incoming call receiver');
assert(boot.indexOf('shell-polish-v6.js') < boot.indexOf('home-v6.js'), 'Shell polish must load before Home V6');
assert(boot.indexOf('home-v6.js') < boot.indexOf('projects-v6.js'), 'Projects V6 must load after Home V6');
assert(boot.indexOf('projects-v6.js') < boot.indexOf('work-v6.js'), 'Work V6 must load after Projects V6');
assert(boot.indexOf('work-v6.js') < boot.indexOf('project-access-v1.js'), 'V6 presentation owners must load before domain owners');

const v5 = read('site/assets/design-v5.css');
assert(v5.includes('/* V5.0.2 — mobile navigation architecture & scroll behavior */'), 'V5.0.2 mobile navigation ownership block missing');
assert(!/\.mobile-nav(?:\s|[>{:+~.#\[])/.test(v5), 'obsolete .mobile-nav selector reintroduced in V5');
const legacyCore = read('site/assets/core-legacy-v455.css');
assert(!/\.mobile-nav(?:\s|[>{:+~.#\[])/.test(legacyCore), 'obsolete .mobile-nav selector reintroduced in legacy bundle');
assert(!/\.mobile-nav-btn(?:\s|[>{:+~.#\[])/.test(legacyCore), 'obsolete .mobile-nav-btn selector reintroduced in legacy bundle');
assert(!/\.modal\{[^}]*height:100dvh!important/.test(legacyCore), 'legacy full-height mobile modal rule reintroduced');
assert(!/\.v422-projects(?:\s|[>{:+~.#\[])/.test(liveCss), 'obsolete .v422-projects selector reintroduced');
assert(!/v41-project-card/.test(liveCss + live), 'obsolete v41 project-card class reintroduced');
assert(!/roadmap-phase-card/.test(liveCss + read('site/assets/design-v5.css') + live), 'obsolete roadmap-phase-card selector reintroduced');
assert(!/\.roadmap-index\{[^}]*font-size:/.test(liveCss), 'roadmap index legacy font-size reintroduced');

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

console.log(`repo hygiene: OK (${RELEASE} / build ${BUILD})`);
if (process.exitCode) process.exit(process.exitCode);
