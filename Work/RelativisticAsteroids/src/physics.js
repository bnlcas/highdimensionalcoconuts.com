// Relativistic kinematics, blackbody color, and a 2D gravity field on the torus.
//
// Units: world lengths are arbitrary "units" (the torus is W x H), time is in
// seconds of lab (torus-frame) coordinate time. c is set from the UI as
// W / (light crossing time).

export const WORLD = { W: 1600, H: 1000 };
export const PHYS_DT = 1 / 120;       // fixed lab-time physics step
export const PHI_MIN = -0.45;          // floor on Phi/c^2 so sqrt(1 + 2 Phi/c^2) stays real

export function wrapDelta(d, L) { return d - L * Math.floor(d / L + 0.5); }
export function wrapPos(x, L) { return x - L * Math.floor(x / L); }

// We integrate proper velocity w = gamma * v, which can grow without bound
// while v stays below c.
export function velFromW(wx, wy, c) {
  const g = Math.sqrt(1 + (wx * wx + wy * wy) / (c * c));
  return { vx: wx / g, vy: wy / g, gamma: g };
}

// Relativistic velocity addition, done on proper velocities so it stays exact
// at any gamma: wp is measured in a frame whose own proper velocity is ws;
// returns the lab proper velocity (the spatial part of a boosted 4-velocity).
export function boostW(ws, wp, c) {
  const gs = Math.sqrt(1 + (ws.x * ws.x + ws.y * ws.y) / (c * c));
  const gp = Math.sqrt(1 + (wp.x * wp.x + wp.y * wp.y) / (c * c));
  const m = Math.hypot(ws.x, ws.y);
  let k = 0, nx = 0, ny = 0;
  if (m > 1e-9) { nx = ws.x / m; ny = ws.y / m; k = (gs - 1) * (wp.x * nx + wp.y * ny); }
  return { x: wp.x + k * nx + ws.x * gp, y: wp.y + k * ny + ws.y * gp };
}

// Proper velocity for a speed beta*c along unit direction (dx, dy).
export function wFromBeta(beta, dx, dy, c) {
  const gw = beta / Math.sqrt(1 - beta * beta) * c;
  return { x: dx * gw, y: dy * gw };
}

// dw/dt for a body with constant proper acceleration `a` along direction s
// (s is a unit vector measured in the body's own rest frame).
export function thrustDw(s, vx, vy, gamma, a) {
  const sp = Math.hypot(vx, vy);
  let par = 0, ux = 0, uy = 0;
  if (sp > 1e-9) { ux = vx / sp; uy = vy / sp; par = s.x * ux + s.y * uy; }
  const k = (gamma - 1) * par;
  return { x: (a / gamma) * (s.x + k * ux), y: (a / gamma) * (s.y + k * uy) };
}

// dw/dt from a gravitational field g = grad(Phi). The transverse part carries
// the (1 + beta^2) factor so that a particle at beta -> 1 bends exactly like
// light does (twice the Newtonian deflection).
export function gravityDw(gx, gy, vx, vy, gamma, c) {
  const sp = Math.hypot(vx, vy);
  if (sp < 1e-9) return { x: -gamma * gx, y: -gamma * gy };
  const ux = vx / sp, uy = vy / sp;
  const b2 = (sp * sp) / (c * c);
  const gpar = gx * ux + gy * uy;
  const pgx = gx - gpar * ux, pgy = gy - gpar * uy;
  return {
    x: -gamma * ((1 + b2) * pgx + gpar * ux),
    y: -gamma * ((1 + b2) * pgy + gpar * uy),
  };
}

// ---------------------------------------------------------------------------
// Blackbody lookup: chromaticity + log10 visible luminance (relative to 6500 K).
// A Doppler shifted blackbody is exactly a blackbody at D*T (in any number of
// dimensions), so one table covers color shift and beaming together.

export const BB_TMIN = 300, BB_TMAX = 300000, BB_N = 256;

function lobe(l, mu, s1, s2) {
  const t = (l - mu) / (l < mu ? s1 : s2);
  return Math.exp(-0.5 * t * t);
}

function cie(l) { // Wyman, Sloan & Shirley 2013 multi-lobe fit to CIE 1931
  return [
    1.056 * lobe(l, 599.8, 37.9, 31.0) + 0.362 * lobe(l, 442.0, 16.0, 26.7) - 0.065 * lobe(l, 501.1, 20.4, 26.2),
    0.821 * lobe(l, 568.8, 46.9, 40.5) + 0.286 * lobe(l, 530.9, 16.3, 31.1),
    1.217 * lobe(l, 437.0, 11.8, 36.0) + 0.681 * lobe(l, 459.0, 26.0, 13.8),
  ];
}

function planckXYZ(T) {
  let X = 0, Y = 0, Z = 0;
  for (let l = 380; l <= 780; l += 5) {
    const b = 1 / (Math.pow(l * 1e-3, 5) * (Math.exp(1.4388e7 / (l * T)) - 1));
    const [x, y, z] = cie(l);
    X += b * x; Y += b * y; Z += b * z;
  }
  return [X, Y, Z];
}

export function blackbodyTable() {
  const data = new Float32Array(BB_N * 4);
  const Yref = planckXYZ(6500)[1];
  for (let i = 0; i < BB_N; i++) {
    const T = BB_TMIN * Math.pow(BB_TMAX / BB_TMIN, i / (BB_N - 1));
    const [X, Y, Z] = planckXYZ(T);
    let r = 3.2406 * X - 1.5372 * Y - 0.4986 * Z;
    let g = -0.9689 * X + 1.8758 * Y + 0.0415 * Z;
    let b = 0.0557 * X - 0.2040 * Y + 1.0570 * Z;
    const mn = Math.min(r, g, b);
    if (mn < 0) { r -= mn; g -= mn; b -= mn; } // desaturate out-of-gamut
    const mx = Math.max(r, g, b, 1e-30);
    data[i * 4] = r / mx; data[i * 4 + 1] = g / mx; data[i * 4 + 2] = b / mx;
    data[i * 4 + 3] = Math.log10(Math.max(Y / Yref, 1e-30)); // log keeps it half-float safe
  }
  return data;
}

// ---------------------------------------------------------------------------
// Gravity on the torus.
//
// In two spatial dimensions Gauss's law gives g = G M / r, i.e. a logarithmic
// potential: laplacian(Phi) = 2 pi G rho. On a closed manifold the total flux
// out of the whole space is zero, so the source must integrate to zero: only
// rho - <rho> can gravitate. The torus forces the "Jeans swindle" on us.
//
// Two solvers share that equation:
//   'poisson' - instantaneous (in the torus frame) FFT solve
//   'wave'    - retarded: Phi_tt = c^2 (lap Phi - 2 pi G rho') - kappa Phi_t,
//               so changes in the field spread outward at c.

function fft(re, im, n, inv) {
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      let t = re[i]; re[i] = re[j]; re[j] = t;
      t = im[i]; im[i] = im[j]; im[j] = t;
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (inv ? 2 : -2) * Math.PI / len;
    const wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k, b = a + len / 2;
        const xr = re[b] * cr - im[b] * ci, xi = re[b] * ci + im[b] * cr;
        re[b] = re[a] - xr; im[b] = im[a] - xi;
        re[a] += xr; im[a] += xi;
        const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t;
      }
    }
  }
  if (inv) for (let i = 0; i < n; i++) { re[i] /= n; im[i] /= n; }
}

export class GravityField {
  constructor(nx = 64, ny = 64) {
    this.nx = nx; this.ny = ny;
    this.dx = WORLD.W / nx; this.dy = WORLD.H / ny;
    const N = nx * ny;
    this.rho = new Float64Array(N);
    this.phi = new Float64Array(N);
    this.phiDot = new Float64Array(N);
    this.gx = new Float64Array(N);
    this.gy = new Float64Array(N);
    this.shift = 0;
    this.tex = new Float32Array(N * 4); // Phi/c^2, dPhi/dx / c^2, dPhi/dy / c^2
    this.active = false;
    // FFT scratch, allocated once: the instant solver can run ~45 times a frame
    this.re = new Float64Array(N); this.im = new Float64Array(N);
    this.rr = new Float64Array(Math.max(nx, ny)); this.ri = new Float64Array(Math.max(nx, ny));
  }

  reset() {
    this.phi.fill(0); this.phiDot.fill(0); this.gx.fill(0); this.gy.fill(0);
    this.tex.fill(0); this.shift = 0; this.active = false;
  }

  // bodies: [{x, y, m, r}]. Mass is spread over a small disc of sample points.
  deposit(bodies) {
    const { nx, ny, dx, dy, rho } = this;
    rho.fill(0);
    const cellArea = dx * dy;
    const add = (x, y, m) => {
      const fx = wrapPos(x, WORLD.W) / dx, fy = wrapPos(y, WORLD.H) / dy;
      const i0 = Math.floor(fx), j0 = Math.floor(fy);
      const tx = fx - i0, ty = fy - j0;
      const i1 = (i0 + 1) % nx, j1 = (j0 + 1) % ny;
      const a = i0 % nx, b = j0 % ny;
      const s = m / cellArea;
      rho[b * nx + a] += s * (1 - tx) * (1 - ty);
      rho[b * nx + i1] += s * tx * (1 - ty);
      rho[j1 * nx + a] += s * (1 - tx) * ty;
      rho[j1 * nx + i1] += s * tx * ty;
    };
    let total = 0;
    for (const bd of bodies) {
      total += bd.m;
      const rr = bd.r * 0.55;
      add(bd.x, bd.y, bd.m * 0.25);
      for (let k = 0; k < 6; k++) {
        const t = k * Math.PI / 3;
        add(bd.x + rr * Math.cos(t), bd.y + rr * Math.sin(t), bd.m * 0.125);
      }
    }
    const mean = total / (WORLD.W * WORLD.H);
    for (let i = 0; i < rho.length; i++) rho[i] -= mean;
    return total;
  }

  solvePoisson(G) {
    const { nx, ny, dx, dy, rho, phi, re, im, rr, ri } = this;
    const N = nx * ny;
    re.set(rho); im.fill(0);
    const pass = (inv) => {
      for (let j = 0; j < ny; j++) {
        for (let i = 0; i < nx; i++) { rr[i] = re[j * nx + i]; ri[i] = im[j * nx + i]; }
        fft(rr, ri, nx, inv);
        for (let i = 0; i < nx; i++) { re[j * nx + i] = rr[i]; im[j * nx + i] = ri[i]; }
      }
      for (let i = 0; i < nx; i++) {
        for (let j = 0; j < ny; j++) { rr[j] = re[j * nx + i]; ri[j] = im[j * nx + i]; }
        fft(rr, ri, ny, inv);
        for (let j = 0; j < ny; j++) { re[j * nx + i] = rr[j]; im[j * nx + i] = ri[j]; }
      }
    };
    pass(false);
    for (let j = 0; j < ny; j++) {
      const ky = (2 - 2 * Math.cos(2 * Math.PI * j / ny)) / (dy * dy);
      for (let i = 0; i < nx; i++) {
        const kx = (2 - 2 * Math.cos(2 * Math.PI * i / nx)) / (dx * dx);
        const k2 = kx + ky, idx = j * nx + i;
        // discrete laplacian eigenvalue is -k2, so Phi_k = -2 pi G rho_k / k2
        const f = k2 > 0 ? -2 * Math.PI * G / k2 : 0;
        re[idx] *= f; im[idx] *= f;
      }
    }
    pass(true);
    for (let i = 0; i < N; i++) phi[i] = re[i];
    this.phiDot.fill(0);
  }

  stepWave(G, c, dt, kappa = 1.5) {
    const { nx, ny, dx, dy, rho, phi, phiDot } = this;
    const lim = 0.8 / Math.sqrt(1 / (dx * dx) + 1 / (dy * dy));
    const n = Math.max(1, Math.ceil((c * dt) / lim));
    const h = dt / n, c2 = c * c, idx2 = 1 / (dx * dx), idy2 = 1 / (dy * dy);
    const src = 2 * Math.PI * G;
    for (let s = 0; s < n; s++) {
      for (let j = 0; j < ny; j++) {
        const jm = ((j - 1 + ny) % ny) * nx, jp = ((j + 1) % ny) * nx, jr = j * nx;
        for (let i = 0; i < nx; i++) {
          const im = (i - 1 + nx) % nx, ip = (i + 1) % nx, k = jr + i;
          const lap = (phi[jr + im] + phi[jr + ip] - 2 * phi[k]) * idx2 +
                      (phi[jm + i] + phi[jp + i] - 2 * phi[k]) * idy2;
          phiDot[k] += h * (c2 * (lap - src * rho[k]) - kappa * phiDot[k]);
        }
      }
      for (let k = 0; k < phi.length; k++) phi[k] += h * phiDot[k];
    }
  }

  // Gradients, zero point, and the texture handed to the shader. The zero of
  // potential is set at the emptiest point of space so that Phi <= 0.
  //
  // Deep wells (|Phi| ~ c^2) are outside anything a weak-field metric can
  // describe; there the potential is smoothly saturated at PHI_MIN and the
  // force scaled by the same derivative, so energy bookkeeping stays honest
  // instead of letting bodies fall forever into a bottomless log well.
  finalize(c) {
    const { nx, ny, dx, dy, phi, gx, gy, tex } = this;
    let mx = -Infinity;
    for (let k = 0; k < phi.length; k++) if (phi[k] > mx) mx = phi[k];
    this.shift = mx;
    const c2 = c * c, A = -PHI_MIN;
    for (let j = 0; j < ny; j++) {
      const jm = ((j - 1 + ny) % ny) * nx, jp = ((j + 1) % ny) * nx, jr = j * nx;
      for (let i = 0; i < nx; i++) {
        const k = jr + i;
        const th = Math.tanh((mx - phi[k]) / c2 / A);
        const sat = 1 - th * th;
        gx[k] = sat * (phi[jr + (i + 1) % nx] - phi[jr + (i - 1 + nx) % nx]) / (2 * dx);
        gy[k] = sat * (phi[jp + i] - phi[jm + i]) / (2 * dy);
        tex[k * 4] = -A * th;
        tex[k * 4 + 1] = gx[k] / c2;
        tex[k * 4 + 2] = gy[k] / c2;
        tex[k * 4 + 3] = 0;
      }
    }
  }

  // Bilinear sample: phi is returned as Phi/c^2 (shifted, clamped),
  // g as grad Phi in units/s^2.
  sample(x, y) {
    const { nx, ny, dx, dy, gx, gy, tex } = this;
    const fx = wrapPos(x, WORLD.W) / dx, fy = wrapPos(y, WORLD.H) / dy;
    const i0 = Math.floor(fx) % nx, j0 = Math.floor(fy) % ny;
    const tx = fx - Math.floor(fx), ty = fy - Math.floor(fy);
    const i1 = (i0 + 1) % nx, j1 = (j0 + 1) % ny;
    const w00 = (1 - tx) * (1 - ty), w10 = tx * (1 - ty), w01 = (1 - tx) * ty, w11 = tx * ty;
    const a = j0 * nx + i0, b = j0 * nx + i1, cc = j1 * nx + i0, d = j1 * nx + i1;
    return {
      phi: tex[a * 4] * w00 + tex[b * 4] * w10 + tex[cc * 4] * w01 + tex[d * 4] * w11,
      gx: gx[a] * w00 + gx[b] * w10 + gx[cc] * w01 + gx[d] * w11,
      gy: gy[a] * w00 + gy[b] * w10 + gy[cc] * w01 + gy[d] * w11,
    };
  }
}
