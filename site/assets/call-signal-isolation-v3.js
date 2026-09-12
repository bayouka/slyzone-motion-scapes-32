import { SupabaseBrowserClient } from './supabase-client.js';

if (!window.__4B4C_CALL_SIGNAL_ISOLATION_V3__) {
  const originalRpc = SupabaseBrowserClient.prototype.rpc;

  function engineMode() {
    return document.documentElement.dataset.callEngine === 'v3' ? 'v3-direct' : 'v2';
  }

  function signalMatches(signal, mode) {
    const engine = signal?.payload?.engine || '';
    if (mode === 'v3-direct') return engine === 'v3-direct';
    return !engine || engine === 'v2';
  }

  function filterSnapshotResult(result) {
    const mode = engineMode();
    const rows = Array.isArray(result) ? result : [result];
    const filtered = rows.map((row) => {
      if (!row || typeof row !== 'object' || !Array.isArray(row.signals)) return row;
      return { ...row, signals: row.signals.filter((signal) => signalMatches(signal, mode)) };
    });
    return Array.isArray(result) ? filtered : filtered[0];
  }

  SupabaseBrowserClient.prototype.rpc = async function isolatedCallRpc(name, args = {}) {
    const result = await originalRpc.call(this, name, args);
    if (name !== 'get_call_sync_v2') return result;
    return filterSnapshotResult(result);
  };

  window.__4B4C_CALL_SIGNAL_ISOLATION_V3__ = Object.freeze({
    version: '1.0.0',
    v2: 'legacy-or-v2-only',
    v3: 'v3-direct-only',
  });
}
