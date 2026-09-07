import assert from 'node:assert/strict';
import { SupabaseBrowserClient } from '../site/assets/supabase-client.js';

const session = {
  access_token:'test-access',
  refresh_token:'test-refresh',
  user:{ id:'user-1' }
};
const storage = {
  value: JSON.stringify(session),
  getItem() { return this.value; },
  setItem(_key, value) { this.value = value; },
  removeItem() { this.value = null; }
};

let editOpen = false;
const editForm = {
  elements: {
    namedItem(name) {
      return name === 'actionId' ? { value:'action-1' } : null;
    }
  },
  querySelector() { return null; }
};

globalThis.document = {
  querySelectorAll(selector) {
    return editOpen && selector === 'form[data-form="action-edit"]' ? [editForm] : [];
  },
  querySelector() { return null; }
};

const v1 = '2026-09-08T00:00:00.000Z';
const v2 = '2026-09-08T00:01:00.000Z';
const v3 = '2026-09-08T00:02:00.000Z';
let selectVersion = v1;
let patchMode = 'conflict';
let lastPatchUrl = '';

const jsonResponse = (value, status = 200) => new Response(JSON.stringify(value), {
  status,
  headers:{ 'content-type':'application/json' }
});

const fetchImpl = async (url, options = {}) => {
  const method = options.method || 'GET';
  if (method === 'GET' && url.includes('/rest/v1/actions')) {
    return jsonResponse([{ id:'action-1', updated_at:selectVersion, title:'Action' }]);
  }
  if (method === 'PATCH' && url.includes('/rest/v1/actions')) {
    lastPatchUrl = url;
    if (patchMode === 'conflict') return jsonResponse([]);
    return jsonResponse([{ id:'action-1', updated_at:v3, title:'Action modifiée' }]);
  }
  throw new Error(`Unexpected request: ${method} ${url}`);
};

const api = new SupabaseBrowserClient({
  url:'https://example.supabase.co',
  publishableKey:'test-key',
  storage,
  fetchImpl
});

// Initial render reads version 1.
await api.select('actions', 'select=*&id=eq.action-1');

// User opens the edit form. A background refresh then observes version 2.
// The form must remain pinned to version 1.
editOpen = true;
selectVersion = v2;
await api.select('actions', 'select=*&id=eq.action-1');

let conflictCaught = false;
try {
  await api.update('actions', 'id=eq.action-1', { title:'Édition ancienne' }, { returnRepresentation:false });
} catch (error) {
  conflictCaught = /modifié ailleurs/i.test(String(error?.message || error));
}
assert.equal(conflictCaught, true, 'stale edit must be rejected');
assert.ok(lastPatchUrl.includes(`updated_at=eq.${encodeURIComponent(v1)}`), 'stale form must keep its original row version');
assert.ok(!lastPatchUrl.includes(`updated_at=eq.${encodeURIComponent(v2)}`), 'background refresh must not replace the form version');

// After closing the old form, a fresh read/update should use the current version 2.
editOpen = false;
selectVersion = v2;
await api.select('actions', 'select=*&id=eq.action-1');
patchMode = 'success';
lastPatchUrl = '';
await api.update('actions', 'id=eq.action-1', { title:'Édition fraîche' }, { returnRepresentation:false });
assert.ok(lastPatchUrl.includes(`updated_at=eq.${encodeURIComponent(v2)}`), 'fresh edit must use the current row version');

console.log('client concurrency contract: ok');
