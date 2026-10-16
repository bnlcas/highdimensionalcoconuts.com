// SimPyramid: game loop, input, saves.
import * as S from './sim.js';
import { getLevel } from './levels/index.js';
import { createRenderer } from './render.js';
import { createUI } from './ui.js';
import { sfx, setSound, soundOn } from './audio.js';

const SPEEDS = [0, 2, 6, 18]; // days per second
const SAVE = 'simpyramid.save';
const BEST = 'simpyramid.best';

const canvas = document.getElementById('world');
const renderer = createRenderer(canvas);
let acc = 0;
let endShown = false;
let lastSpeed = 2;

const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } },
};

const game = {
  s: null,
  speed: 0,
  setSpeed(n) {
    if (n > 0) lastSpeed = n;
    game.speed = n;
    ui.update(true);
  },
  startLevel(id) {
    document.body.classList.remove('finale');
    game.s = S.newGame(id);
    endShown = false;
    acc = 0;
    renderer.reset();
    ui.closeModal();
    ui.setupLevel();
    game.setSpeed(0);
    ui.showIntro();
    save();
  },
  continueSave() {
    const s = game.hasSave();
    if (!s) return;
    game.s = s;
    endShown = !!s.outcome;
    renderer.reset();
    ui.setupLevel();
    game.setSpeed(0);
    if (s.outcome) { endShown = false; } else sfx('drum');
  },
  hasSave() {
    const raw = store.get(SAVE);
    if (!raw) return null;
    try {
      const s = JSON.parse(raw);
      return getLevel(s.levelId) && !s.outcome ? s : null;
    } catch (e) { return null; }
  },
  toTitle() {
    document.body.classList.remove('finale');
    save();
    game.s = null;
    game.speed = 0;
    ui.showTitle();
  },
  loadBest() {
    try { return JSON.parse(store.get(BEST) || '{}'); } catch (e) { return {}; }
  },
  saveBest(id, score) {
    const b = game.loadBest();
    if (score > (b[id] || 0)) { b[id] = score; store.set(BEST, JSON.stringify(b)); return true; }
    return false;
  },
  onCapstone() {
    // let the sim notice the finished structure right away, even when paused
    S.step(game.s);
    ui.update(true);
  },
};
const ui = createUI(game);

function save() {
  if (!game.s) return;
  if (game.s.outcome) { store.del(SAVE); return; }
  store.set(SAVE, JSON.stringify(game.s));
}
setInterval(save, 4000);
document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });

function viewRect() {
  const W = canvas.clientWidth, H = canvas.clientHeight;
  const narrow = W <= 900;
  const bottom = document.getElementById('bottom');
  const bh = bottom.classList.contains('hidden') ? 0 : bottom.offsetHeight + 8;
  if (narrow) return { x: 0, y: 44, w: W, h: Math.max(200, H - 44 - bh) };
  return { x: 284, y: 44, w: Math.max(300, W - 568), h: Math.max(200, H - 44 - bh) };
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  tick(dt);
  requestAnimationFrame(frame);
}
function tick(dt, steps) {
  const s = game.s;
  if (!s) return;
  if (!ui.modalOpen() && !s.outcome) {
    if (s.pending.length) ui.showPending(s.pending[0]);
    else {
      acc += steps ?? dt * SPEEDS[game.speed];
      let n = 0;
      while (acc >= 1 && n < 80) {
        S.step(s);
        acc -= 1;
        n++;
        if (s.pending.length || s.outcome) { acc = 0; break; }
      }
    }
  }
  if (s.outcome && !endShown) {
    endShown = true;
    document.body.classList.add('finale');
    const L = getLevel(s.levelId);
    const delay = s.outcome === 'win' && (L.martians || L.timeloop) ? 5000 : 1500;
    store.del(SAVE);
    setTimeout(() => {
      if (game.s !== s) return;
      if (s.outcome === 'win' && L.martians) ui.showMartians(s);
      else if (s.outcome === 'win' && L.timeloop) ui.showTimeLoop(s);
      else ui.showEnd(s);
    }, delay);
  }
  s.speedDays = SPEEDS[game.speed];
  renderer.draw(s, dt, viewRect());
  ui.update();
}

// ---------- input ----------
function resize() {
  renderer.resize();
}
window.addEventListener('resize', resize);
resize();

let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  drag = { x: e.clientX, y: e.clientY, moved: 0 };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const dx = e.clientX - drag.x;
  drag.moved += Math.abs(dx) + Math.abs(e.clientY - drag.y);
  drag.x = e.clientX;
  drag.y = e.clientY;
  renderer.panBy(dx);
});
canvas.addEventListener('pointerup', (e) => {
  if (drag && drag.moved < 6 && game.s) {
    const a = renderer.pick(e.clientX, e.clientY);
    if (a) { ui.showWorker(a, e.clientX, e.clientY); sfx('tick'); }
  }
  drag = null;
});
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  renderer.zoomBy(e.deltaY < 0 ? 1.1 : 1 / 1.1, e.clientX);
}, { passive: false });

document.querySelectorAll('#speed button').forEach((b) => b.addEventListener('click', () => { game.setSpeed(+b.dataset.speed); sfx('tick'); }));
document.getElementById('logo').addEventListener('click', () => game.toTitle());
const soundBtn = document.getElementById('sound');
const paintSound = () => (soundBtn.textContent = soundOn() ? '🔊' : '🔇');
soundBtn.addEventListener('click', () => { setSound(!soundOn()); paintSound(); sfx('tick'); });
paintSound();
window.addEventListener('keydown', (e) => {
  if (!game.s || e.target.closest('input, select, textarea')) return;
  if (e.code === 'Space') { e.preventDefault(); game.setSpeed(game.speed ? 0 : lastSpeed); }
  if (e.key === '1' || e.key === '2' || e.key === '3') game.setSpeed(+e.key);
});

// ---------- debug / test hooks ----------
window.simPyramid = {
  get s() { return game.s; },
  game, S, ui,
  tick(days) { tick(0, days); },
  // render frames without the sim advancing (rAF pauses in hidden tabs)
  frames(seconds) { for (let i = 0; i < seconds * 30; i++) tick(1 / 30, 0); },
};

ui.showTitle();
const q = new URLSearchParams(location.search).get('level');
if (q && getLevel(q)) game.startLevel(q);
requestAnimationFrame(frame);
