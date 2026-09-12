(() => {
  if (window.__4B4C_CALL_UI_STABILITY_V1__) return;
  window.__4B4C_CALL_UI_STABILITY_V1__ = true;

  const isCallLayoutHost = (node) => node instanceof Element && (
    node.hasAttribute('data-ce3-main') || node.hasAttribute('data-ce3-grid') || node.hasAttribute('data-ce3-filmstrip')
  );

  /*
   * Safari can visibly blink when a playing <video> is disconnected/reconnected.
   * Call Engine V3 clears its layout hosts before re-appending the same tile nodes.
   * For these three hosts only, convert a synchronous clear/rebuild into a staged
   * reconciliation: nodes remain connected for the current task and only genuinely
   * unused nodes are removed in the following microtask.
   */
  const descriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
  const nativeAppendChild = Node.prototype.appendChild;
  const pendingHosts = new WeakSet();

  if (descriptor?.get && descriptor?.set && descriptor.configurable) {
    Object.defineProperty(Element.prototype, 'innerHTML', {
      configurable: true,
      enumerable: descriptor.enumerable,
      get: descriptor.get,
      set(value) {
        if (value === '' && isCallLayoutHost(this)) {
          for (const child of this.children) child.dataset.ce3Stale = 'true';
          if (!pendingHosts.has(this)) {
            pendingHosts.add(this);
            queueMicrotask(() => {
              pendingHosts.delete(this);
              for (const child of [...this.children]) {
                if (child.dataset.ce3Stale === 'true') nativeAppendChild.call(document.createDocumentFragment(), child);
              }
            });
          }
          return;
        }
        return descriptor.set.call(this, value);
      },
    });

    Node.prototype.appendChild = function appendChildStable(child) {
      if (isCallLayoutHost(this) && child instanceof Element) delete child.dataset.ce3Stale;
      return nativeAppendChild.call(this, child);
    };
  }

  function syncViewport() {
    const height = Math.round(window.visualViewport?.height || window.innerHeight || document.documentElement.clientHeight || 0);
    if (height > 0) document.documentElement.style.setProperty('--ce3-mobile-vh', `${height}px`);
  }

  function keepVideosPlaying(root = document) {
    root.querySelectorAll?.('#call-engine-v3-active video').forEach((video) => {
      video.playsInline = true;
      if (video.srcObject && video.paused) void video.play().catch(() => {});
    });
  }

  let scheduled = false;
  const observer = new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      keepVideosPlaying();
    });
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  window.visualViewport?.addEventListener('resize', syncViewport, { passive: true });
  window.visualViewport?.addEventListener('scroll', syncViewport, { passive: true });
  window.addEventListener('resize', syncViewport, { passive: true });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { syncViewport(); keepVideosPlaying(); } });
  syncViewport();

  window.__4B4C_CALL_UI_STABILITY_V1__ = Object.freeze({ version: '1.0.0', scopedReconciliation: Boolean(descriptor?.configurable) });
})();
