// Ramen Rush — tiny WebAudio bleeps, synthesised on the spot (no sound files).
// Every effect is one short oscillator blip; the first user gesture unlocks audio.

export function createAudio() {
  let context = null;

  function ensure() {
    if (context) return context;
    try {
      const Ctor = window.AudioContext ?? window.webkitAudioContext;
      if (!Ctor) return null;
      context = new Ctor();
    } catch {
      return null;
    }
    return context;
  }

  function blip(freq, dur, type, gain, slideTo) {
    const ctx = ensure();
    if (!ctx || ctx.state === 'suspended') {
      ctx?.resume().catch(() => {});
      if (!ctx || ctx.state !== 'running') return;
    }
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + dur);
    amp.gain.setValueAtTime(gain, ctx.currentTime);
    amp.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.connect(amp).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur);
  }

  return {
    unlock() {
      ensure();
    },
    pick() {
      blip(520, 0.09, 'sine', 0.12, 760);
    },
    drop() {
      blip(300, 0.12, 'triangle', 0.14, 180);
    },
    reject() {
      blip(160, 0.18, 'square', 0.08, 110);
    },
    ready() {
      blip(660, 0.1, 'sine', 0.12);
      setTimeout(() => blip(880, 0.14, 'sine', 0.12), 90);
    },
    serve() {
      blip(880, 0.1, 'sine', 0.12);
      setTimeout(() => blip(1174, 0.18, 'sine', 0.12), 90);
    },
    expire() {
      blip(220, 0.3, 'sawtooth', 0.07, 110);
    },
  };
}
