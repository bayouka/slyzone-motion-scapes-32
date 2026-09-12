(() => {
  if (window.__4B4C_CALL_MEDIA_BRIDGE_V1__) return;

  const entries = new Map();
  const listeners = new Set();

  function notify() {
    for (const listener of [...listeners]) {
      try { listener(); } catch {}
    }
  }

  function tileMeta(media) {
    const tile = media?.closest?.('[data-ce3-tile]');
    if (!tile) return null;
    const key = tile.dataset.ce3Tile || '';
    if (!key) return null;
    const role = key.split(':').pop() || (tile.classList.contains('screen') ? 'screen' : 'camera');
    return {
      key,
      role,
      self: tile.classList.contains('self'),
      label: tile.querySelector('.ce3-label')?.textContent?.trim() || '',
      avatar: tile.querySelector('.ce3-avatar')?.textContent?.trim() || '?',
      visible: !media.hidden,
    };
  }

  function capture(media, stream) {
    const meta = tileMeta(media);
    if (!meta) return;
    const previous = entries.get(meta.key);
    const next = { ...meta, stream: stream || null, media, updatedAt: performance.now() };
    entries.set(meta.key, next);
    if (!previous || previous.stream !== next.stream || previous.visible !== next.visible || previous.label !== next.label || previous.self !== next.self || previous.role !== next.role) notify();
  }

  function refreshFromDom() {
    document.querySelectorAll('#call-engine-v3-active [data-ce3-tile] video').forEach((media) => capture(media, media.srcObject || null));
  }

  let proto = HTMLMediaElement.prototype;
  let descriptor = null;
  while (proto && !descriptor) {
    descriptor = Object.getOwnPropertyDescriptor(proto, 'srcObject');
    if (!descriptor) proto = Object.getPrototypeOf(proto);
  }

  if (descriptor?.get && descriptor?.set && descriptor.configurable) {
    Object.defineProperty(proto, 'srcObject', {
      configurable: true,
      enumerable: descriptor.enumerable,
      get() { return descriptor.get.call(this); },
      set(value) {
        descriptor.set.call(this, value);
        queueMicrotask(() => capture(this, value));
      },
    });
  }

  let scheduled = false;
  const scheduleRefresh = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      refreshFromDom();
    });
  };

  new MutationObserver(scheduleRefresh).observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'hidden'],
  });

  document.addEventListener('visibilitychange', () => { if (!document.hidden) scheduleRefresh(); });
  setInterval(() => {
    if (!document.getElementById('call-engine-v3-active')) {
      if (entries.size) { entries.clear(); notify(); }
      return;
    }
    scheduleRefresh();
  }, 1200);

  window.__4B4C_CALL_MEDIA_BRIDGE_V1__ = Object.freeze({
    version: '1.0.0',
    descriptorHook: Boolean(descriptor?.configurable),
    snapshot() {
      return [...entries.values()].map((entry) => ({
        key: entry.key,
        role: entry.role,
        self: entry.self,
        label: entry.label,
        avatar: entry.avatar,
        visible: entry.visible,
        stream: entry.stream,
        updatedAt: entry.updatedAt,
      }));
    },
    subscribe(listener) {
      if (typeof listener !== 'function') return () => {};
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    refresh: scheduleRefresh,
  });
})();
