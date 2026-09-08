// v4.4.4 OOM emergency hotfix
// This module is intentionally disabled. The previous implementation observed
// #app and rewrote descendants from the observer callback, creating a
// self-triggering MutationObserver loop and unbounded browser memory growth.
// Project progress remains available server-side through get_project_summaries_v1
// and will be reintroduced with an idempotent renderer after stability testing.
window.__2B2C_PROJECT_PROGRESS_V2_DISABLED__ = true;
console.info('[2b2c] project-progress-v2 disabled by v4.4.4 OOM hotfix');
