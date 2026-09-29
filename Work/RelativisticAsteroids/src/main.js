import { Renderer } from './renderer.js';
import { Game } from './game.js';
import { WORLD, wrapDelta } from './physics.js';

const $ = (id) => document.getElementById(id);
const canvas = $('canvas');

let renderer;
try {
  renderer = new Renderer(canvas);
} catch (err) {
  $('message').innerHTML = 'This toy needs WebGL2.<br><small>' + err.message + '</small>';
  throw err;
}
const game = new Game(renderer.shapes);
window.game = game; // handy for poking at from the console

const view = {
  mode: 0,          // 0 what you see, 1 ship frame, 2 torus frame
  zoom: 1.25,
  flags: { doppler: true, bright: true, lens: true, grid: true, dust: true, pot: false },
};
const MODE_NAMES = ['What you see (past light cone)', 'Ship frame (simultaneity)', 'Torus frame (lab)'];
let paused = false;
let muted = false;

// --- sliders ----------------------------------------------------------------

// Evenly spaced stops, interpolated in log(1 - beta) between them.
const BETA_STOPS = [0.1, 0.5, 0.9, 0.99, 0.999];
function betaFromSlider(s) {
  const i = Math.min(Math.floor(s), BETA_STOPS.length - 2), f = s - i;
  const a = Math.log(1 - BETA_STOPS[i]), b = Math.log(1 - BETA_STOPS[i + 1]);
  return 1 - Math.exp(a + (b - a) * f);
}
function densityFromSlider(s) { return s < 1 ? 0.1 * s : Math.pow(10, (s - 1) / 2 - 1); }
function fmt(x, d = 2) { return x.toFixed(d); }
function fmtBeta(b) { return b >= 0.99 ? b.toFixed(4).replace(/0+$/, '') : b.toFixed(2); }

function bindSlider(id, apply, label) {
  const el = $(id), out = $(id + '-val');
  const update = () => { const v = apply(parseFloat(el.value)); out.textContent = label(v); };
  el.addEventListener('input', update);
  update();
}

bindSlider('beta', (s) => (game.settings.betaMax = betaFromSlider(s)), (b) => fmtBeta(b) + ' c');
bindSlider('density', (s) => (game.settings.density = densityFromSlider(s)),
  (d) => (d === 0 ? 'off' : fmt(d, d < 1 ? 2 : 1)));
bindSlider('zoom', (s) => (view.zoom = Math.pow(2, s)), (z) => fmt(z, 2) + ' tori');
bindSlider('light', (s) => {
  const t = Math.pow(10, s);
  if (Math.abs(t / game.settings.crossTime - 1) > 1e-3) {
    game.settings.crossTime = t;
    game.reset(game.phase === 'attract' ? 'attract' : 'play');
  }
  return t;
}, (t) => fmt(t, 1) + ' s');

$('gmode').addEventListener('change', (e) => (game.settings.gravityMode = e.target.value));
$('clock').addEventListener('change', (e) => (game.settings.clock = e.target.value));
$('res').addEventListener('change', (e) => (renderer.resolutionScale = parseFloat(e.target.value)));
for (const k of Object.keys(view.flags)) {
  const el = $('f-' + k);
  el.checked = view.flags[k];
  el.addEventListener('change', () => (view.flags[k] = el.checked));
}

function setMode(m) {
  view.mode = m;
  document.querySelectorAll('#modes button').forEach((b, i) => b.classList.toggle('on', i === m));
  $('mode-name').textContent = MODE_NAMES[m];
}
document.querySelectorAll('#modes button').forEach((b, i) => b.addEventListener('click', () => setMode(i)));
setMode(0);

$('panel-toggle').addEventListener('click', () => $('panel').classList.toggle('closed'));
$('about-open').addEventListener('click', () => $('about').classList.add('open'));
$('about-close').addEventListener('click', () => $('about').classList.remove('open'));

// --- input ------------------------------------------------------------------

const KEYMAP = {
  ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'up', KeyW: 'up', Space: 'fire',
};

function startGame() {
  if (game.phase === 'attract' || game.phase === 'over') game.reset('play');
}

window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
    if (!(e.code in KEYMAP)) return;
    e.target.blur();
  }
  if (e.code in KEYMAP) {
    e.preventDefault();
    game.keys[KEYMAP[e.code]] = true;
    if (e.code === 'Space' && (game.phase === 'attract' || game.phase === 'over')) startGame();
    return;
  }
  if (e.code === 'Enter') startGame();
  else if (e.code === 'KeyV') setMode((view.mode + 1) % 3);
  else if (e.code === 'KeyP') paused = !paused;
  else if (e.code === 'KeyM') muted = !muted;
  else if (e.code === 'Escape') $('about').classList.remove('open');
});
window.addEventListener('keyup', (e) => {
  if (e.code in KEYMAP) { e.preventDefault(); game.keys[KEYMAP[e.code]] = false; }
});
window.addEventListener('blur', () => { for (const k in game.keys) game.keys[k] = false; });

canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const el = $('zoom');
  el.value = Math.min(parseFloat(el.max), Math.max(parseFloat(el.min), parseFloat(el.value) + e.deltaY * 0.002));
  el.dispatchEvent(new Event('input'));
}, { passive: false });

// touch buttons
document.querySelectorAll('#touch [data-key]').forEach((b) => {
  const k = b.dataset.key;
  const on = (e) => { e.preventDefault(); game.keys[k] = true; if (k === 'fire') startGame(); };
  const off = (e) => { e.preventDefault(); game.keys[k] = false; };
  b.addEventListener('pointerdown', on);
  b.addEventListener('pointerup', off);
  b.addEventListener('pointercancel', off);
  b.addEventListener('pointerleave', off);
});
if (matchMedia('(pointer: coarse)').matches) document.body.classList.add('touch');

// --- sound: explosions are heard when their light arrives -------------------

const laser = new Audio('../Asteroids/39459__THE_bizniss__laser.wav');
const boom = new Audio('../Asteroids/51467__smcameron__missile_explosion.wav');
function play(a, rate, vol) {
  if (muted || !isFinite(rate)) return;
  const s = a.cloneNode();
  s.preservesPitch = false; s.mozPreservesPitch = false; s.webkitPreservesPitch = false;
  s.playbackRate = Math.min(4, Math.max(0.25, rate));
  s.volume = Math.min(1, vol);
  s.play().catch(() => {});
}
game.onFire = () => play(laser, 1, 0.15);

function hearExplosions() {
  const o = game.obs, c = game.c;
  game.events = game.events.filter((ev) => {
    const dx = wrapDelta(ev.x - o.x, WORLD.W), dy = wrapDelta(ev.y - o.y, WORLD.H);
    const r = Math.hypot(dx, dy);
    if (c * (game.t - ev.t) < r) return game.t - ev.t < 20;
    const nx = r > 1e-6 ? dx / r : 0, ny = r > 1e-6 ? dy / r : 0;
    const D = o.gamma * (1 + (nx * o.vx + ny * o.vy) / c) / (ev.gamma * (1 + (nx * ev.vx + ny * ev.vy) / c));
    if (isFinite(D)) play(boom, D, 0.12 + 0.08 * ev.size);
    return false;
  });
}

// --- HUD --------------------------------------------------------------------

let hudTimer = 0;
function hud() {
  const o = game.obs, c = game.c, s = game.ship;
  const beta = Math.hypot(o.vx, o.vy) / c;
  $('score').textContent = String(game.score).padStart(6, '0');
  $('lives').textContent = '▲'.repeat(Math.max(0, game.lives));
  $('level').textContent = 'LEVEL ' + game.level;
  $('tel').innerHTML =
    `v <b>${fmtBeta(Math.min(beta, 0.99999))}c</b> &nbsp; γ <b>${fmt(o.gamma, 3)}</b> &nbsp; Φ/c² <b>${fmt(o.phi, 3)}</b><br>` +
    `dτ/dt <b>${fmt(Math.sqrt(1 + 2 * o.phi) / o.gamma, 3)}</b> &nbsp; ` +
    `τ ship <b>${fmt(game.tauShip, 1)}s</b> &nbsp; t torus <b>${fmt(game.t, 1)}s</b>`;
  const msg = {
    attract: 'RELATIVISTIC ASTEROIDS<br><small>press enter or space to play</small>',
    over: 'GAME OVER<br><small>press enter to play again</small>',
    between: 'LEVEL CLEAR',
  }[game.phase] || (paused ? 'PAUSED' : '');
  $('message').innerHTML = paused && game.phase !== 'attract' ? 'PAUSED' : msg;
}

// --- loop -------------------------------------------------------------------

let last = performance.now();
function frame(now) {
  const dt = (now - last) / 1000;
  last = now;
  if (!paused) {
    game.update(dt);
    hearExplosions();
  }
  renderer.uploadHistory(game.hist);
  renderer.uploadPotential(game.field);
  const f = view.flags;
  const gravityOn = game.settings.density > 0;
  const flags = (f.doppler ? 1 : 0) | (f.bright ? 2 : 0) | (f.lens && gravityOn ? 4 : 0) |
    (f.grid ? 8 : 0) | (f.dust ? 16 : 0) | (f.pot && gravityOn ? 32 : 0);
  const o = game.obs, c = game.c;
  renderer.draw({
    mode: view.mode, zoom: view.zoom, flags, c,
    obsPos: { x: o.x, y: o.y }, obsBeta: { x: o.vx / c, y: o.vy / c }, obsGamma: o.gamma, obsPhi: o.phi,
    now: game.t, start: game.start, head: game.hist.head, numObj: 64,
  });
  hudTimer -= dt;
  if (hudTimer <= 0) { hud(); hudTimer = 0.1; }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
