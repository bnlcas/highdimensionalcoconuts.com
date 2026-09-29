import {
  WORLD, PHYS_DT, wrapDelta, wrapPos, velFromW, boostW, wFromBeta,
  thrustDw, gravityDw, GravityField,
} from './physics.js';
import { SHIP_SHAPE, SHIP_SCALE, N_SHAPES, pointInPolygon, polygonArea } from './shapes.js';
import { History, MAX_OBJ } from './renderer.js';

const KIND = { DEAD: 0, SHIP: 1, BULLET: 2, ROCK: 3, RING: 4, SHIP_THRUST: 5 };
const SLOTS = { ship: [0, 1], bullet: [1, 11], ring: [11, 18], rock: [18, MAX_OBJ] };
const ROCK_R = [0, 17, 32, 58];
const ROCK_POINTS = [0, 100, 50, 20];

const TURN_RATE = 4.2;        // rad per second of ship proper time
const THRUST = 0.6;           // proper acceleration, in units of c per second
const BULLET_BETA = 0.8;      // muzzle speed relative to the ship
const BULLET_LIFE = 1.1;      // bullet proper lifetime (s)
const FIRE_COOLDOWN = 0.18;   // ship proper time between shots
const MAX_BULLETS = 6;

export class Game {
  constructor(shapes) {
    this.shapes = shapes;
    this.hist = new History();
    this.field = new GravityField(64, 64);
    this.settings = {
      crossTime: 2.5,    // seconds for light to cross the torus
      betaMax: 0.9,      // engine cut-off speed
      density: 1.0,      // G * sigma (0 = no gravity)
      gravityMode: 'wave',
      clock: 'proper',
    };
    this.keys = { left: false, right: false, up: false, fire: false };
    this.events = [];    // explosions, for delayed sound
    this.reset('attract');
  }

  get c() { return WORLD.W / this.settings.crossTime; }

  reset(phase) {
    this.phase = phase;
    this.t = 0;
    this.start = 0;
    this.acc = 0;
    this.stepCount = 0;
    this.level = phase === 'attract' ? 2 : 1;
    this.score = 0;
    this.lives = 3;
    this.timer = 0;
    this.ents = new Array(MAX_OBJ).fill(null);
    this.hist.clear();
    this.field.reset();
    this.ship = null;
    this.tauShip = 0;
    this.obs = { x: WORLD.W / 2, y: WORLD.H / 2, vx: 0, vy: 0, gamma: 1, phi: 0 };
    if (phase === 'play') this.spawnShip();
    this.spawnLevel();
    this.updateGravity(PHYS_DT, true);
    this.record();
  }

  // --- entities -------------------------------------------------------------

  alloc(cat) {
    const [a, b] = SLOTS[cat];
    for (let i = a; i < b; i++) if (!this.ents[i]) return i;
    return -1;
  }

  add(cat, e) {
    const i = this.alloc(cat);
    if (i < 0) return null;
    const c = this.c;
    e.wx = e.wx || 0; e.wy = e.wy || 0;
    const v = velFromW(e.wx, e.wy, c);
    Object.assign(e, { slot: i, vx: v.vx, vy: v.vy, gamma: v.gamma, angle: e.angle || 0, tau: 0 });
    this.ents[i] = e;
    return e;
  }

  kill(e) { if (e && this.ents[e.slot] === e) this.ents[e.slot] = null; }

  each(cat, fn) {
    const [a, b] = SLOTS[cat];
    for (let i = a; i < b; i++) if (this.ents[i]) fn(this.ents[i]);
  }

  count(cat) { let n = 0; this.each(cat, () => n++); return n; }

  spawnShip() {
    this.ship = this.add('ship', {
      kind: KIND.SHIP, x: WORLD.W / 2, y: WORLD.H / 2, R: SHIP_SCALE, shape: SHIP_SHAPE,
      angle: Math.PI / 2, cooldown: 0, invuln: 2.5, thrusting: false,
    });
  }

  spawnRock(size, x, y, wx, wy) {
    const shape = 1 + Math.floor(Math.random() * (N_SHAPES - 1));
    const R = ROCK_R[size];
    return this.add('rock', {
      kind: KIND.ROCK, size, x, y, wx, wy, R, shape,
      angle: Math.random() * Math.PI * 2, spin: (Math.random() - 0.5) * 1.2,
      area: polygonArea(this.shapes[shape]) * R * R,
    });
  }

  spawnLevel() {
    const n = Math.min(3 + this.level, 9);
    const c = this.c;
    const beta = Math.min(0.08 + 0.03 * this.level, 0.4);
    const sx = this.ship ? this.ship.x : WORLD.W / 2, sy = this.ship ? this.ship.y : WORLD.H / 2;
    for (let i = 0; i < n; i++) {
      let x, y;
      do {
        x = Math.random() * WORLD.W; y = Math.random() * WORLD.H;
      } while (Math.hypot(wrapDelta(x - sx, WORLD.W), wrapDelta(y - sy, WORLD.H)) < 320);
      const a = Math.random() * Math.PI * 2;
      const w = wFromBeta(beta * (0.4 + 0.6 * Math.random()), Math.cos(a), Math.sin(a), c);
      this.spawnRock(3, x, y, w.x, w.y);
    }
  }

  ring(x, y, wx, wy, speed, life) {
    this.add('ring', { kind: KIND.RING, x, y, wx, wy, R: 2, speed, life, age: 0 });
  }

  // e: the body that blew up (position, proper velocity, velocity, gamma)
  explode(e, size) {
    this.ring(e.x, e.y, e.wx, e.wy, this.c * 0.35, 0.5 + 0.25 * size);
    this.events.push({ x: e.x, y: e.y, t: this.t, vx: e.vx, vy: e.vy, gamma: e.gamma, size });
  }

  // --- rest-frame hit testing ------------------------------------------------

  // Is lab point (px, py) inside rock e, at the current lab time?
  hitsRock(e, px, py) {
    let dx = wrapDelta(px - e.x, WORLD.W), dy = wrapDelta(py - e.y, WORLD.H);
    if (dx * dx + dy * dy > e.R * e.R) return false;
    const sp = Math.hypot(e.vx, e.vy);
    if (sp > 1e-6) { // stretch back to the rock's rest frame
      const nx = e.vx / sp, ny = e.vy / sp, par = (dx * nx + dy * ny) * (e.gamma - 1);
      dx += nx * par; dy += ny * par;
    }
    const ca = Math.cos(e.angle), sa = Math.sin(e.angle);
    const qx = (ca * dx + sa * dy) / e.R, qy = (-sa * dx + ca * dy) / e.R;
    return pointInPolygon(qx, qy, this.shapes[e.shape]);
  }

  // Ship hull points in the lab frame, Lorentz contracted along its motion.
  shipPoints() {
    const s = this.ship, pts = [[0, 0], ...this.shapes[SHIP_SHAPE]];
    const ca = Math.cos(s.angle), sa = Math.sin(s.angle);
    const sp = Math.hypot(s.vx, s.vy);
    const nx = sp > 1e-6 ? s.vx / sp : 0, ny = sp > 1e-6 ? s.vy / sp : 0;
    return pts.map(([x, y]) => {
      let lx = (ca * x - sa * y) * SHIP_SCALE, ly = (sa * x + ca * y) * SHIP_SCALE;
      const par = (lx * nx + ly * ny) * (1 / s.gamma - 1);
      lx += nx * par; ly += ny * par;
      return [s.x + lx, s.y + ly];
    });
  }

  // --- simulation -----------------------------------------------------------

  updateGravity(h, init) {
    const f = this.field, st = this.settings, c = this.c;
    if (st.density <= 0) {
      if (f.active) f.reset();
      return;
    }
    const bodies = [];
    this.each('rock', (e) => bodies.push({ x: e.x, y: e.y, m: st.density * e.area, r: e.R }));
    f.deposit(bodies);
    if (init || !f.active || st.gravityMode === 'poisson') f.solvePoisson(1);
    else f.stepWave(1, c, h);
    f.finalize(c);
    f.active = true;
  }

  // dt/dtau for the ship: how much lab time passes per tick of the ship's clock
  labPerProper() {
    const s = this.ship;
    if (!s) return 1;
    const phi = this.field.active ? this.field.sample(s.x, s.y).phi : 0;
    return s.gamma / Math.sqrt(1 + 2 * phi);
  }

  update(dtReal) {
    dtReal = Math.min(dtReal, 1 / 20);
    let dtLab = dtReal;
    if (this.settings.clock === 'proper') dtLab *= this.labPerProper();
    dtLab = Math.min(dtLab, 0.6);
    this.acc += dtLab;
    let steps = 0;
    while (this.acc >= PHYS_DT && steps < 90) {
      this.step(PHYS_DT);
      this.acc -= PHYS_DT;
      steps++;
    }
    if (steps >= 90) this.acc = 0;
    return steps;
  }

  integrate(e, h, thrust) {
    const c = this.c, f = this.field;
    let alpha = 1;
    if (f.active) {
      const g = f.sample(e.x, e.y);
      alpha = Math.sqrt(1 + 2 * g.phi);
      const dw = gravityDw(g.gx, g.gy, e.vx, e.vy, e.gamma, c);
      e.wx += dw.x * h; e.wy += dw.y * h;
    }
    if (thrust) { e.wx += thrust.x * h; e.wy += thrust.y * h; }
    const wm = Math.hypot(e.wx, e.wy), wcap = 1e4 * c; // safety net: gamma <= 10^4
    if (wm > wcap) { e.wx *= wcap / wm; e.wy *= wcap / wm; }
    const v = velFromW(e.wx, e.wy, c);
    e.vx = v.vx; e.vy = v.vy; e.gamma = v.gamma;
    e.x = wrapPos(e.x + e.vx * h, WORLD.W);
    e.y = wrapPos(e.y + e.vy * h, WORLD.H);
    const dtau = h * alpha / e.gamma;
    e.tau += dtau;
    return dtau;
  }

  step(h) {
    const c = this.c, st = this.settings, keys = this.keys;
    this.stepCount++;
    if (this.stepCount % 2 === 0) this.updateGravity(h * 2, false);

    const s = this.ship;
    if (s) {
      // orientation and engine act on ship proper time
      const phi = this.field.active ? this.field.sample(s.x, s.y).phi : 0;
      const dtau = h * Math.sqrt(1 + 2 * phi) / s.gamma;
      s.angle += ((keys.left ? 1 : 0) - (keys.right ? 1 : 0)) * TURN_RATE * dtau;
      s.thrusting = keys.up;
      let thrust = null;
      if (keys.up) {
        const dir = { x: Math.cos(s.angle), y: Math.sin(s.angle) };
        const dw = thrustDw(dir, s.vx, s.vy, s.gamma, THRUST * c);
        // engine governor: no further speed-up beyond betaMax, steering still allowed
        const wmax = st.betaMax / Math.sqrt(1 - st.betaMax * st.betaMax) * c;
        const w0 = Math.hypot(s.wx, s.wy);
        const nwx = s.wx + dw.x * h, nwy = s.wy + dw.y * h, w1 = Math.hypot(nwx, nwy);
        if (w1 > wmax && w1 > w0) {
          const k = Math.max(w0, wmax) / w1;
          thrust = { x: (nwx * k - s.wx) / h, y: (nwy * k - s.wy) / h };
        } else thrust = dw;
      }
      this.integrate(s, h, thrust);
      this.tauShip += dtau;
      s.invuln = Math.max(0, s.invuln - dtau);
      s.cooldown -= dtau;
      if (keys.fire && s.cooldown <= 0 && this.count('bullet') < MAX_BULLETS) {
        s.cooldown = FIRE_COOLDOWN;
        const dir = { x: Math.cos(s.angle), y: Math.sin(s.angle) };
        const w = boostW({ x: s.wx, y: s.wy }, wFromBeta(BULLET_BETA, dir.x, dir.y, c), c);
        const nose = SHIP_SCALE * 0.8 / s.gamma; // roughly; contracted nose position
        const b = this.add('bullet', {
          kind: KIND.BULLET, x: wrapPos(s.x + dir.x * nose, WORLD.W), y: wrapPos(s.y + dir.y * nose, WORLD.H),
          wx: w.x, wy: w.y, R: 2.5,
        });
        if (b && this.onFire) this.onFire();
      }
    }

    this.each('bullet', (b) => { this.integrate(b, h); if (b.tau > BULLET_LIFE) this.kill(b); });
    this.each('rock', (r) => { this.integrate(r, h); r.angle += r.spin * h; });
    this.each('ring', (r) => {
      r.age += h;
      r.x = wrapPos(r.x + r.vx * h, WORLD.W); r.y = wrapPos(r.y + r.vy * h, WORLD.H);
      r.R = 2 + r.speed * r.age;
      if (r.age > r.life) this.kill(r);
    });

    this.collide();
    this.t += h;
    this.advancePhase(h);
    this.record();
  }

  collide() {
    const c = this.c;
    this.each('bullet', (b) => {
      this.each('rock', (r) => {
        if (!this.ents[b.slot] || !this.ents[r.slot] || !this.hitsRock(r, b.x, b.y)) return;
        this.kill(b);
        this.breakRock(r);
        if (this.phase === 'play') {
          const g = this.ship ? this.ship.gamma : 1;
          this.score += Math.round(ROCK_POINTS[r.size] * g);
        }
      });
    });
    const s = this.ship;
    if (s && s.invuln <= 0) {
      const pts = this.shipPoints();
      this.each('rock', (r) => {
        if (!this.ship) return;
        if (pts.some(([x, y]) => this.hitsRock(r, x, y))) {
          this.breakRock(r);
          this.explode(s, 3);
          this.kill(s);
          this.ship = null;
          this.lives--;
          this.phase = this.lives > 0 ? 'respawn' : 'over';
          this.timer = 2.0;
          this.obs = { ...this.obs, vx: 0, vy: 0, gamma: 1 };
        }
      });
    }
  }

  breakRock(r) {
    this.kill(r);
    this.explode(r, r.size);
    if (r.size <= 1) return;
    const c = this.c;
    for (let k = 0; k < 2; k++) {
      const a = Math.random() * Math.PI * 2;
      const w = boostW({ x: r.wx, y: r.wy }, wFromBeta(0.06 + 0.12 * Math.random(), Math.cos(a), Math.sin(a), c), c);
      const off = r.R * 0.3;
      this.spawnRock(r.size - 1, wrapPos(r.x + off * Math.cos(a), WORLD.W), wrapPos(r.y + off * Math.sin(a), WORLD.H), w.x, w.y);
    }
  }

  advancePhase(h) {
    if (this.phase === 'respawn') {
      this.timer -= h;
      if (this.timer <= 0) {
        let clear = true;
        this.each('rock', (r) => {
          if (Math.hypot(wrapDelta(r.x - WORLD.W / 2, WORLD.W), wrapDelta(r.y - WORLD.H / 2, WORLD.H)) < r.R + 120) clear = false;
        });
        if (clear) { this.spawnShip(); this.phase = 'play'; }
      }
    }
    if ((this.phase === 'play' || this.phase === 'respawn') && this.count('rock') === 0) {
      this.phase = this.phase === 'play' ? 'between' : this.phase;
      if (this.phase === 'between') this.timer = 2.0;
    }
    if (this.phase === 'between') {
      this.timer -= h;
      if (this.timer <= 0) { this.level++; this.spawnLevel(); this.phase = this.ship ? 'play' : 'respawn'; }
    }
    if (this.phase === 'attract' && this.count('rock') === 0) this.spawnLevel();
  }

  // Snapshot the universe into the history ring buffer.
  record() {
    const row = this.hist.push();
    for (let i = 0; i < MAX_OBJ; i++) {
      const e = this.ents[i];
      if (!e) continue;
      let kind = e.kind;
      if (kind === KIND.SHIP) {
        if (e.thrusting) kind = KIND.SHIP_THRUST;
        if (e.invuln > 0 && Math.floor(e.invuln * 8) % 2 === 0) kind = KIND.DEAD;
      }
      const o = i * 8;
      row[o] = e.x; row[o + 1] = e.y; row[o + 2] = e.vx; row[o + 3] = e.vy;
      row[o + 4] = e.angle; row[o + 5] = e.R;
      row[o + 6] = e.kind === KIND.RING ? Math.max(0, 1 - e.age / e.life) : e.shape;
      row[o + 7] = kind;
    }
    const s = this.ship;
    if (s) {
      const phi = this.field.active ? this.field.sample(s.x, s.y).phi : 0;
      this.obs = { x: s.x, y: s.y, vx: s.vx, vy: s.vy, gamma: s.gamma, phi };
    } else {
      this.obs.phi = this.field.active ? this.field.sample(this.obs.x, this.obs.y).phi : 0;
    }
  }
}
