// Tiny WebAudio synth: plucks, drums, gongs. No samples.
let ac = null;
let on = true;
try { on = localStorage.getItem('simpyramid.sound') !== 'off'; } catch (e) { /* storage blocked */ }

function ctx() {
  if (!ac) {
    const A = window.AudioContext || window.webkitAudioContext;
    if (!A) return null;
    ac = new A();
  }
  if (ac.state === 'suspended') ac.resume();
  return ac;
}
function tone(freq, dur, type = 'sine', vol = 0.15, when = 0, slide = 0) {
  const a = ctx();
  if (!a) return;
  const t0 = a.currentTime + when;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(a.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}
function noise(dur, vol = 0.1, when = 0, hp = 3000) {
  const a = ctx();
  if (!a) return;
  const t0 = a.currentTime + when;
  const buf = a.createBuffer(1, Math.floor(a.sampleRate * dur), a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = a.createBufferSource();
  src.buffer = buf;
  const f = a.createBiquadFilter();
  f.type = 'highpass';
  f.frequency.value = hp;
  const g = a.createGain();
  g.gain.value = vol;
  src.connect(f).connect(g).connect(a.destination);
  src.start(t0);
}
// a harp-ish scale (D, E, F, A, Bb: vaguely "ancient")
const SCALE = [293.7, 329.6, 349.2, 440, 466.2, 587.3];
export function sfx(kind) {
  if (!on) return;
  switch (kind) {
    case 'tick': tone(880, 0.05, 'triangle', 0.05); break;
    case 'no': tone(160, 0.12, 'square', 0.04); break;
    case 'offer': SCALE.slice(0, 4).forEach((f, i) => tone(f, 0.5, 'triangle', 0.08, i * 0.07)); noise(0.25, 0.04, 0, 6000); break;
    case 'drum': tone(110, 0.25, 'sine', 0.3, 0, 0.5); tone(110, 0.25, 'sine', 0.2, 0.18, 0.5); break;
    case 'gong': tone(196, 2.2, 'sine', 0.18); tone(392.5, 1.6, 'sine', 0.06); tone(588, 1.2, 'sine', 0.03); break;
    case 'bad': tone(220, 0.4, 'sawtooth', 0.05, 0, 0.7); tone(207, 0.5, 'sawtooth', 0.05, 0.12, 0.7); break;
    case 'good': tone(587.3, 0.3, 'triangle', 0.07); tone(880, 0.4, 'triangle', 0.06, 0.1); break;
    case 'fanfare': [0, 2, 3, 5].forEach((k, i) => tone(SCALE[k], 0.7, 'triangle', 0.1, i * 0.15)); tone(146.8, 1.5, 'sine', 0.15, 0); break;
  }
}
export function setSound(v) {
  on = v;
  try { localStorage.setItem('simpyramid.sound', v ? 'on' : 'off'); } catch (e) { /* ignore */ }
}
export const soundOn = () => on;
