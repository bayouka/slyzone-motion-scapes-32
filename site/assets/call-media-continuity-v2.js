if (!window.__4B4C_CALL_MEDIA_CONTINUITY_V2__) {
  const descriptor = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'srcObject');

  function trackSignature(stream) {
    if (!(stream instanceof MediaStream)) return '';
    return stream.getTracks()
      .map((track) => `${track.kind}:${track.id}:${track.readyState}`)
      .sort()
      .join('|');
  }

  if (descriptor?.get && descriptor?.set && descriptor.configurable !== false) {
    Object.defineProperty(HTMLMediaElement.prototype, 'srcObject', {
      configurable: descriptor.configurable,
      enumerable: descriptor.enumerable,
      get: descriptor.get,
      set(next) {
        const isCallEngineMedia = typeof this.id === 'string' && this.id.startsWith('ce-v2-');
        if (isCallEngineMedia) {
          const current = descriptor.get.call(this);
          if (current === next) return;
          if (current instanceof MediaStream && next instanceof MediaStream) {
            const currentSignature = trackSignature(current);
            const nextSignature = trackSignature(next);
            if (currentSignature && currentSignature === nextSignature) return;
          }
        }
        descriptor.set.call(this, next);
      },
    });
  }

  window.__4B4C_CALL_MEDIA_CONTINUITY_V2__ = Object.freeze({
    version: '2.0.0',
    trackSignature,
  });
}
