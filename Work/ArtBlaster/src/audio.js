// Synthesized sound effects (WebAudio, no sample files).

export class Sfx {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.last = {};
  }

  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.55;
      const comp = this.ctx.createDynamicsCompressor();
      this.master.connect(comp).connect(this.ctx.destination);
      const len = this.ctx.sampleRate * 2;
      this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.55;
  }

  // throttle so a pile of debris doesn't become a wall of noise
  ok(name, gap) {
    const t = performance.now();
    if (this.last[name] && t - this.last[name] < gap) return false;
    this.last[name] = t;
    return true;
  }

  _noise(dur, { type = 'lowpass', f0 = 2000, f1 = 400, q = 1, gain = 0.6, attack = 0.002, when = 0 } = {}) {
    const c = this.ctx, t = c.currentTime + when;
    const src = c.createBufferSource();
    src.buffer = this.noise;
    src.playbackRate.value = 0.8 + Math.random() * 0.4;
    const filt = c.createBiquadFilter();
    filt.type = type; filt.Q.value = q;
    filt.frequency.setValueAtTime(f0, t);
    filt.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filt).connect(g).connect(this.master);
    src.start(t, Math.random()); src.stop(t + dur + 0.05);
  }

  _tone(freq, dur, { type = 'sine', gain = 0.3, f1 = null, attack = 0.003, when = 0 } = {}) {
    const c = this.ctx, t = c.currentTime + when;
    const o = c.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.master);
    o.start(t); o.stop(t + dur + 0.05);
  }

  play(name, intensity = 1) {
    if (!this.ctx || this.muted) return;
    const k = Math.min(1.5, intensity);
    switch (name) {
      case 'swish':
        this._noise(0.22, { type: 'bandpass', f0: 600, f1: 2400, q: 1.5, gain: 0.25 }); break;
      case 'throw':
        this._noise(0.15, { type: 'bandpass', f0: 900, f1: 300, q: 2, gain: 0.18 }); break;
      case 'splat':
        this._noise(0.25, { f0: 1400, f1: 120, gain: 0.7 * k });
        this._tone(120, 0.18, { f1: 50, gain: 0.35 * k }); break;
      case 'canclunk':
        this._tone(520, 0.12, { type: 'triangle', gain: 0.15 });
        this._tone(780, 0.1, { type: 'triangle', gain: 0.1 }); break;
      case 'pop':
        this._noise(0.05, { type: 'highpass', f0: 3000, f1: 1500, gain: 0.25 });
        this._tone(260, 0.06, { type: 'square', gain: 0.06, f1: 120 }); break;
      case 'paintsplat':
        this._noise(0.09, { f0: 2400, f1: 300, gain: 0.35 }); break;
      case 'rip':
        this._noise(0.28, { type: 'bandpass', f0: 1800, f1: 700, q: 3, gain: 0.6 * k });
        this._noise(0.1, { f0: 300, f1: 80, gain: 0.5 * k }); break;
      case 'smash':
        this._noise(0.5, { f0: 3000, f1: 80, gain: 0.9 * k });
        this._tone(70, 0.35, { f1: 35, gain: 0.7 * k }); break;
      case 'clang': {
        const base = 180 + Math.random() * 40;
        [1, 2.76, 5.4, 8.93].forEach((m, i) => this._tone(base * m, 1.4 - i * 0.25, { gain: 0.22 / (i + 1) * k }));
        this._noise(0.06, { type: 'highpass', f0: 4000, f1: 2000, gain: 0.4 });
        break;
      }
      case 'glass':
        this._noise(0.7, { type: 'highpass', f0: 5000, f1: 2500, gain: 0.6 * k });
        for (let i = 0; i < 9; i++) this._tone(2500 + Math.random() * 4000, 0.15 + Math.random() * 0.4, { gain: 0.06, when: Math.random() * 0.5 });
        break;
      case 'crack':
        this._noise(0.08, { type: 'highpass', f0: 6000, f1: 3000, gain: 0.5 });
        this._tone(3200 + Math.random() * 800, 0.2, { gain: 0.06 }); break;
      case 'porcelain':
        this._noise(0.4, { type: 'highpass', f0: 4000, f1: 1500, gain: 0.7 });
        for (let i = 0; i < 12; i++) this._tone(1500 + Math.random() * 3500, 0.1 + Math.random() * 0.5, { gain: 0.07, when: Math.random() * 0.6 });
        break;
      case 'thud':
        if (!this.ok('thud', 70)) return;
        this._tone(90 + Math.random() * 40, 0.15, { f1: 45, gain: 0.3 * k });
        this._noise(0.08, { f0: 600, f1: 100, gain: 0.2 * k }); break;
      case 'tink':
        if (!this.ok('tink', 40)) return;
        this._tone(2000 + Math.random() * 3000, 0.12, { gain: 0.05 * k }); break;
      case 'cash':
        if (!this.ok('cash', 120)) return;
        this._tone(1318, 0.12, { type: 'square', gain: 0.05 });
        this._tone(1760, 0.3, { type: 'square', gain: 0.05, when: 0.08 }); break;
      case 'unlock':
        [523, 659, 784, 1046].forEach((f, i) => this._tone(f, 0.25, { type: 'triangle', gain: 0.18, when: i * 0.09 }));
        break;
      case 'destroyed':
        [392, 330, 262, 196].forEach((f, i) => this._tone(f, 0.3, { type: 'sawtooth', gain: 0.07, when: i * 0.08 }));
        break;
      case 'scribble':
        if (!this.ok('scribble', 90)) return;
        this._noise(0.08, { type: 'bandpass', f0: 2500, f1: 1800, q: 4, gain: 0.08 }); break;
      case 'buzzer':
        this._tone(110, 0.8, { type: 'sawtooth', gain: 0.18 }); break;
    }
  }

  // continuous flamethrower roar
  flame(on) {
    if (!this.ctx) return;
    if (on && !this.flameNode && !this.muted) {
      const c = this.ctx;
      const src = c.createBufferSource();
      src.buffer = this.noise; src.loop = true;
      const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900;
      const g = c.createGain(); g.gain.value = 0.0001;
      g.gain.exponentialRampToValueAtTime(0.5, c.currentTime + 0.12);
      src.connect(f).connect(g).connect(this.master);
      src.start();
      this.flameNode = { src, g };
    } else if (!on && this.flameNode) {
      const { src, g } = this.flameNode;
      g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.15);
      src.stop(this.ctx.currentTime + 0.2);
      this.flameNode = null;
    }
  }
}
