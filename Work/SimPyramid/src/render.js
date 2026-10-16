// Canvas renderer: a perspective view of the work site, painted back to front.
import { geometry, heightAt, calendar, JOBS } from './sim.js';
import { getLevel } from './levels/index.js';
import { NAMES, THOUGHTS } from './flavor.js';

export const THEMES = {
  egypt: {
    sky: ['#4f86c6', '#f3d9a8'], sun: '#fff3c4', far: '#d9b77e', ground: '#d2ad72', plateau: '#ddbd83',
    water: '#3f7a9a', waterHi: '#7fb3c8', mud: '#6b5434', field: { idle: '#6b5434', grow: '#5f8f3a', harvest: '#c9a646', festival: '#b59a4a', continuous: '#5f8f3a' },
    floods: true, house: 'mudbrick', houseCol: '#b98d5c', roof: '#a57a4a', veg: 'palms', horizon: 'dunes',
    core: '#cfae78', casing: '#f4ecd8', line: '#8a6d43', ramp: '#9d7a4e', quarry: '#b8955f', people: '#6b3f22', cloth: '#f5f0e2', capstone: '#ffd24a',
  },
  olmec: {
    sky: ['#5f9fc9', '#e8e6c8'], sun: '#fff6d0', far: '#3f6b3a', ground: '#6e7f45', plateau: '#8c8152',
    water: '#3d6b5e', waterHi: '#6d9c86', mud: '#5b4a32', field: { idle: '#7a6a3e', grow: '#4f8a35', harvest: '#c7a44a', festival: '#7a6a3e' },
    house: 'thatch', houseCol: '#cdb48a', roof: '#6d5a36', veg: 'jungle', horizon: 'jungle',
    core: '#a8774a', casing: '#c9874c', line: '#6e4b2c', ramp: '#8a6a45', quarry: '#7d5c3c', people: '#6b4026', cloth: '#efe6d0', capstone: '#5fbf8f',
  },
  maya: {
    sky: ['#4c94d0', '#f1ecd2'], sun: '#fff6d0', far: '#2f6233', ground: '#7d8b4c', plateau: '#c9bf9c',
    water: '#2e7d8a', waterHi: '#6fc0c4', mud: '#6b5a3a', field: { idle: '#8a7a48', grow: '#4f8a35', harvest: '#c7a44a', festival: '#8a7a48' },
    house: 'thatch', houseCol: '#e6dcc4', roof: '#7a6338', veg: 'jungle', horizon: 'jungle',
    core: '#cfc3a6', casing: '#ece4d0', line: '#8e8266', ramp: '#a99b78', quarry: '#b9ad8c', people: '#704428', cloth: '#f2ead6', capstone: '#d84a3a',
  },
  aztec: {
    sky: ['#5a9ad8', '#efe5cc'], sun: '#fff3c4', far: '#7a7f68', ground: '#b49a74', plateau: '#c8b28d',
    water: '#4b8a8f', waterHi: '#8cc1bf', mud: '#5d5236', field: { idle: '#5d7a3d', grow: '#4f9a3a', harvest: '#c7a44a', festival: '#5d7a3d' },
    lake: true, house: 'aztec', houseCol: '#ece4d2', roof: '#d9cfb8', veg: 'none', horizon: 'volcano',
    core: '#9c4b3c', casing: '#ebe2cc', line: '#6b3328', ramp: '#8e5a46', quarry: '#7d3c30', people: '#6e4128', cloth: '#f4ecd8', capstone: '#3a7bd5',
  },
  cahokia: {
    sky: ['#6ea4d4', '#efe9d6'], sun: '#fff6d0', far: '#6d8a4a', ground: '#7f9a52', plateau: '#8fa45e',
    water: '#5a7c86', waterHi: '#93b3b8', mud: '#5c4b33', field: { idle: '#8a7d55', grow: '#5f9a3f', harvest: '#c9a64a', festival: '#8a7d55' },
    house: 'wattle', houseCol: '#b89570', roof: '#806a45', veg: 'prairie', horizon: 'bluffs',
    core: '#7a5a38', casing: '#8f6a43', line: '#5a3f25', ramp: '#6e5233', quarry: '#4f3a26', people: '#704428', cloth: '#c8a878', capstone: '#c2a273',
  },
  deseret: {
    sky: ['#3f8fe0', '#e6eef4'], sun: '#ffffff', far: '#9aa29a', ground: '#a9a580', plateau: '#bdb79a',
    water: '#5fa7a8', waterHi: '#c9ecea', mud: '#7b7055', field: { idle: '#e8eef2', grow: '#7aa846', harvest: '#d9b85a', festival: '#e8eef2' },
    saltlake: true, house: 'suburb', houseCol: '#e9e1d3', roof: '#7d6a5a', veg: 'trees', horizon: 'mountains',
    core: '#b8b4ae', casing: '#6fa8d8', line: '#7a7670', ramp: '#8f8a80', quarry: '#9e9a92', people: '#e0b48c', cloth: '#2f4f7f', capstone: '#ffd24a',
  },
  mars: {
    sky: ['#c99b6b', '#e8c49a'], sun: '#f3f1ea', far: '#a45a34', ground: '#b5683c', plateau: '#c27646',
    water: '#d8e4ea', waterHi: '#ffffff', mud: '#8a4a2a', field: { idle: '#5a6c4a', grow: '#79c46a', harvest: '#79c46a', festival: '#5a6c4a', continuous: '#79c46a' },
    house: 'dome', houseCol: '#d9dde0', roof: '#a9b4bc', veg: 'none', horizon: 'mesas', nowater: true,
    core: '#a8583a', casing: '#3a3f46', line: '#6c3420', ramp: '#8f4a2c', quarry: '#7f3e22', people: '#f2f2f2', cloth: '#f2f2f2', capstone: '#9ff0ff',
  },
};

// ---------- small helpers ----------
function hash(n) {
  n = (n ^ 61) ^ (n >>> 16);
  n = n + (n << 3);
  n = n ^ (n >>> 4);
  n = Math.imul(n, 0x27d4eb2d);
  n = n ^ (n >>> 15);
  return (n >>> 0) / 4294967296;
}
function rgb(hex) {
  const v = parseInt(hex.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}
function shade(hex, k, a = 1) {
  const [r, g, b] = rgb(hex);
  const f = (c) => Math.max(0, Math.min(255, Math.round(c * k)));
  return a === 1 ? `rgb(${f(r)},${f(g)},${f(b)})` : `rgba(${f(r)},${f(g)},${f(b)},${a})`;
}
function mix(h1, h2, t) {
  const a = rgb(h1), b = rgb(h2);
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * t));
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, dpr = 1;
  const cam = { x: 0, y: 0, z: 0, f: 1, cx: 0, hz: 0, zoom: 1, panX: 0 };
  let scene = null; // static layout for the current level
  let agents = [];
  let particles = [];
  let t = 0;
  let view = { x: 0, y: 0, w: 1, h: 1 };
  let lastPick = null;

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
  }

  // ---------- scene layout ----------
  function buildScene(s) {
    const L = getLevel(s.levelId);
    const th = THEMES[L.civ.theme];
    const g = geometry(s);
    const a0 = Math.max(...Object.values(L.structure.variants).flatMap((v) => v.tiers.map((t) => t.a0)));
    const top = Math.max(...Object.values(L.structure.variants).map((v) => v.tiers[v.tiers.length - 1].z1));
    const U = Math.max(a0, top * 0.75, 45);
    const PY = 3.4 * U;
    const sc = {
      levelId: s.levelId, L, th, U, PY, a0, top,
      yaw: L.structure.sides === 4 ? (L.structure.kind === 'temple' || L.structure.kind === 'mound' ? -0.12 : -0.42) : L.structure.sides === 5 ? -0.2 : 0,
      waterEdge: 0.9 * U, fieldTop: 1.7 * U,
      quarry: { x: -a0 - 1.25 * U, y: PY + 0.55 * U, r: 0.38 * U },
      harbor: { x: 0.95 * U + a0 * 0.4, y: 0.82 * U },
      temple: { x: a0 + 0.9 * U, y: PY - 0.35 * U },
      village: { x0: -a0 - 1.55 * U, x1: -a0 * 0.35, y0: 1.85 * U, y1: 2.35 * U },
      bakery: { x: -a0 * 0.45, y: 2.05 * U },
      granary: { x: -a0 - 1.15 * U, y: 2.45 * U },
      houses: [], fields: [], veg: [], dunes: [],
      noRamp: ['mound', 'cone', 'temple'].includes(L.structure.kind),
    };
    // fields
    const nf = 26;
    for (let i = 0; i < nf; i++) {
      const x0 = -6 * U + (i * 12 * U) / nf;
      for (let j = 0; j < 3; j++) {
        const y0 = sc.waterEdge + 0.05 * U + (j * (sc.fieldTop - sc.waterEdge - 0.05 * U)) / 3;
        sc.fields.push({ x0, x1: x0 + (12 * U) / nf - 0.03 * U, y0, y1: y0 + (sc.fieldTop - sc.waterEdge - 0.05 * U) / 3 - 0.03 * U, v: hash(i * 7 + j * 131) });
      }
    }
    // houses
    const nh = 34;
    for (let i = 0; i < nh; i++) {
      const r1 = hash(i * 97 + 3), r2 = hash(i * 53 + 11);
      sc.houses.push({ x: sc.village.x0 + r1 * (sc.village.x1 - sc.village.x0), y: sc.village.y0 + r2 * (sc.village.y1 - sc.village.y0), w: U * (0.07 + 0.05 * hash(i * 13)), d: U * (0.06 + 0.04 * hash(i * 17)), h: U * (0.04 + 0.025 * hash(i * 19)), v: hash(i * 23), idx: i });
    }
    // vegetation
    for (let i = 0; i < 60; i++) {
      const x = -6 * U + hash(i * 31 + 7) * 12 * U;
      const y = sc.waterEdge * 0.95 + hash(i * 41 + 9) * (th.veg === 'jungle' ? 3.5 * U : 1.1 * U);
      if (Math.abs(x) < a0 + 0.3 * U && y > PY - a0 - 0.4 * U) continue;
      if (x > sc.village.x0 && x < sc.village.x1 && y > sc.village.y0 - 0.1 * U && y < sc.village.y1) continue;
      sc.veg.push({ x, y, s: 0.6 + hash(i * 3) * 0.7 });
    }
    scene = sc;
    agents = [];
    particles = [];
  }

  // ---------- camera ----------
  function setCamera() {
    const { U, PY, top } = scene;
    const vw = view.w, vh = view.h;
    cam.y = -2.1 * U;
    cam.z = 1.0 * U + top * 0.35;
    const depth = PY - cam.y;
    // the structure fills a bit over half the view
    const fw = (0.58 * vw * depth) / (2.6 * scene.a0);
    const fh = (0.5 * vh * depth) / Math.max(1, top);
    cam.f = Math.min(fw, fh) * cam.zoom;
    cam.x = cam.panX;
    cam.cx = view.x + vw / 2;
    // the base of the structure sits about 70% of the way down the view
    cam.hz = view.y + vh * 0.7 - (cam.z * cam.f) / depth;
    cam.hz = Math.max(view.y + vh * 0.1, cam.hz);
  }
  const P = (x, y, z) => {
    const d = Math.max(1, y - cam.y);
    const k = cam.f / d;
    return [cam.cx + (x - cam.x) * k, cam.hz + (cam.z - z) * k, k];
  };
  function poly(pts, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
  }
  function quad(x0, x1, y0, y1, z, fill) {
    poly([P(x0, y0, z), P(x1, y0, z), P(x1, y1, z), P(x0, y1, z)], fill);
  }
  function box(x, y, w, d, h, col, roofCol) {
    // axis-aligned box centered at x,y
    const x0 = x - w / 2, x1 = x + w / 2, y0 = y - d / 2, y1 = y + d / 2;
    const front = [P(x0, y0, 0), P(x1, y0, 0), P(x1, y0, h), P(x0, y0, h)];
    const top = [P(x0, y0, h), P(x1, y0, h), P(x1, y1, h), P(x0, y1, h)];
    // side facing camera
    const sideX = x > cam.x ? x0 : x1;
    const side = [P(sideX, y0, 0), P(sideX, y1, 0), P(sideX, y1, h), P(sideX, y0, h)];
    poly(side, shade(col, 0.72));
    poly(front, shade(col, 0.92));
    poly(top, roofCol || shade(col, 1.08));
    return { x0, x1, y0, y1, h };
  }
  function prismRoof(x, y, w, d, h, rh, col) {
    const x0 = x - w / 2, x1 = x + w / 2, y0 = y - d / 2, y1 = y + d / 2;
    poly([P(x0, y0, h), P(x1, y0, h), P(x1, (y0 + y1) / 2, h + rh), P(x0, (y0 + y1) / 2, h + rh)], shade(col, 1.0));
    const sideX = x > cam.x ? x0 : x1;
    poly([P(sideX, y0, h), P(sideX, y1, h), P(sideX, (y0 + y1) / 2, h + rh)], shade(col, 0.75));
  }

  // ---------- structure ----------
  function local(lx, ly) {
    const c = Math.cos(scene.yaw), s = Math.sin(scene.yaw);
    return [lx * c - ly * s, scene.PY + lx * s + ly * c];
  }
  function ngon(n, a, z, fluted) {
    const out = [];
    const R = a / Math.cos(Math.PI / n);
    for (let i = 0; i < n; i++) {
      const th = -Math.PI / 2 - Math.PI / n + (i * 2 * Math.PI) / n;
      const r = fluted && i % 2 ? R * 0.93 : R;
      const [x, y] = local(r * Math.cos(th), r * Math.sin(th));
      out.push([x, y, z]);
    }
    return out;
  }
  function sunDir() {
    // low sun from the front-left most of the day
    const v = [-0.55, -0.55, 0.62];
    const m = Math.hypot(...v);
    return v.map((x) => x / m);
  }
  function drawFrustum(n, za, zb, aa, ab, color, opts = {}) {
    if (zb - za < 0.01) return;
    const B = ngon(n, aa, za, opts.fluted);
    const T = ngon(n, Math.max(0, ab), zb, opts.fluted);
    const L = sunDir();
    const faces = [];
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const mid = [(B[i][0] + B[j][0] + T[i][0] + T[j][0]) / 4, (B[i][1] + B[j][1] + T[i][1] + T[j][1]) / 4, (za + zb) / 2];
      // outward normal from the face's two edges
      const e1 = [B[j][0] - B[i][0], B[j][1] - B[i][1], 0];
      const e2 = [T[i][0] - B[i][0], T[i][1] - B[i][1], zb - za];
      let nx = e1[1] * e2[2] - e1[2] * e2[1], ny = e1[2] * e2[0] - e1[0] * e2[2], nz = e1[0] * e2[1] - e1[1] * e2[0];
      const cxw = mid[0] - local(0, 0)[0], cyw = mid[1] - scene.PY;
      if (nx * cxw + ny * cyw < 0) { nx = -nx; ny = -ny; nz = -nz; }
      const m = Math.hypot(nx, ny, nz) || 1;
      nx /= m; ny /= m; nz /= m;
      const vis = nx * (cam.x - mid[0]) + ny * (cam.y - mid[1]) + nz * (cam.z - mid[2]);
      if (vis <= 0) continue;
      const lam = Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]);
      faces.push({ i, j, depth: Math.hypot(mid[0] - cam.x, mid[1] - cam.y), k: 0.62 + 0.5 * lam });
    }
    faces.sort((a, b) => b.depth - a.depth);
    for (const f of faces) {
      const pts = [P(...B[f.i]), P(...B[f.j]), P(...T[f.j]), P(...T[f.i])];
      poly(pts, shade(color, f.k));
      if (opts.lines) {
        ctx.strokeStyle = shade(opts.lines, 1, 0.22);
        ctx.lineWidth = 1;
        const step = opts.lineStep;
        ctx.beginPath();
        for (let z = Math.ceil(za / step) * step; z < zb; z += step) {
          const u = (z - za) / (zb - za);
          const p1 = P(B[f.i][0] + (T[f.i][0] - B[f.i][0]) * u, B[f.i][1] + (T[f.i][1] - B[f.i][1]) * u, z);
          const p2 = P(B[f.j][0] + (T[f.j][0] - B[f.j][0]) * u, B[f.j][1] + (T[f.j][1] - B[f.j][1]) * u, z);
          ctx.moveTo(p1[0], p1[1]);
          ctx.lineTo(p2[0], p2[1]);
        }
        ctx.stroke();
      }
      if (opts.stairs && (opts.stairs === 4 || f.i === 0)) drawStair(B[f.i], B[f.j], T[f.i], T[f.j], za, zb, opts.stairCol, f.k);
    }
    if (ab > 0.3 && cam.z > zb && !opts.noCap) poly(T.map((p) => P(...p)), shade(opts.capColor || color, 1.05));
  }
  function drawStair(b0, b1, t0, t1, za, zb, col, k) {
    const lerp3 = (p, q, u) => [p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u, p[2] + (q[2] - p[2]) * u];
    const w = 0.16;
    const bl = lerp3(b0, b1, 0.5 - w), br = lerp3(b0, b1, 0.5 + w);
    const tl = lerp3(t0, t1, 0.5 - w * 0.9), tr = lerp3(t0, t1, 0.5 + w * 0.9);
    poly([P(...bl), P(...br), P(...tr), P(...tl)], shade(col, k * 0.95));
    ctx.strokeStyle = shade(col, 0.55, 0.5);
    ctx.lineWidth = 1;
    ctx.beginPath();
    const nSteps = Math.max(3, Math.round((zb - za) / 0.8));
    for (let i = 1; i < nSteps; i++) {
      const u = i / nSteps;
      const p1 = P(...lerp3(bl, tl, u)), p2 = P(...lerp3(br, tr, u));
      ctx.moveTo(p1[0], p1[1]);
      ctx.lineTo(p2[0], p2[1]);
    }
    ctx.stroke();
  }

  function apothemAt(g, z) {
    for (const tr of g.tiers) if (z <= tr.z1 + 1e-6) return tr.a0 + ((tr.a1 - tr.a0) * Math.max(0, z - tr.z0)) / (tr.z1 - tr.z0);
    return 0;
  }

  function drawStructure(s) {
    const { L, th } = scene;
    const g = geometry(s);
    const b = s.build;
    const hb = b.height;
    const zc = b.casingTotal ? heightAt(g, Math.min(1, b.casing / b.casingTotal)) : 0;
    const kind = L.structure.kind;
    const opts = { fluted: L.structure.fluted, lines: th.line, lineStep: Math.max(1.2, scene.top / 40), stairs: L.structure.stairs, stairCol: th.casing };
    // footprint shadow / leveled base
    const fp = ngon(g.n, g.tiers[0].a0 + 6, 0.05);
    poly(fp.map((p) => P(...p)), shade(th.plateau, 0.93));
    if (hb < 0.3) {
      // just the foundation outline
      ctx.strokeStyle = shade(th.line, 1, 0.5);
      ctx.setLineDash([4, 4]);
      poly(ngon(g.n, g.tiers[0].a0, 0.1).map((p) => P(...p)), null, shade(th.line, 1, 0.5));
      ctx.setLineDash([]);
    }
    // ghost of the full design
    ctx.globalAlpha = 0.12;
    for (const tr of g.tiers) drawFrustumOutline(g.n, tr.z0, tr.z1, tr.a0, tr.a1);
    ctx.globalAlpha = 1;
    for (const tr of g.tiers) {
      if (tr.z0 >= hb) break;
      const ztop = Math.min(tr.z1, hb);
      const aTop = apothemAt(g, ztop);
      // split each tier at the casing line
      const zSplit = Math.max(tr.z0, Math.min(ztop, zc));
      const aSplit = apothemAt(g, zSplit);
      if (zSplit > tr.z0) drawFrustum(g.n, tr.z0, zSplit, tr.a0, aSplit, th.casing, { ...opts, lines: kind === 'hive' ? th.line : null, lineStep: kind === 'hive' ? 6 : 99, capColor: kind === 'step' || kind === 'temple' || kind === 'mound' ? null : th.core });
      if (ztop > zSplit) drawFrustum(g.n, zSplit, ztop, aSplit, aTop, th.core, opts);
    }
    // the finishing touch
    if (b.capstone) {
      const topA = apothemAt(g, g.top - 0.01);
      if (kind === 'smooth' || kind === 'bent') {
        const z0 = g.top * 0.95;
        drawFrustum(g.n, z0, g.top, apothemAt(g, z0), 0, th.capstone, {});
        glow(local(0, 0), g.top, th.capstone, 30 + 6 * Math.sin(t * 3));
      } else if (kind === 'temple') {
        templeTop(g, topA, L);
      } else if (kind === 'mound') {
        const [x, y] = local(0, 0);
        box(x, y, topA * 1.1, topA * 0.7, L.structure.temple.h, L.structure.temple.color);
        prismRoof(x, y, topA * 1.1, topA * 0.7, g.top + L.structure.temple.h, L.structure.temple.h * 0.8, '#7a6440');
      } else if (kind === 'hive') {
        drawFrustum(24, g.top, g.top + 6, topA, 0, th.capstone, {});
        glow(local(0, 0), g.top + 6, '#ffe58a', 40);
      } else if (kind === 'cone') {
        const [x, y] = local(0, 0);
        const p = P(x, y, g.top + 2);
        ctx.fillStyle = th.capstone;
        ctx.beginPath();
        ctx.arc(p[0], p[1], Math.max(2, 2 * p[2]), 0, 7);
        ctx.fill();
      }
    } else if (kind === 'temple' && hb >= g.top - 0.01) {
      // platform finished, shrine not yet dedicated: draw scaffolding
      const [x, y] = local(0, 0);
      const p0 = P(x, y, g.top), p1 = P(x, y, g.top + 5);
      ctx.strokeStyle = shade('#6b4a2a', 1, 0.7);
      ctx.strokeRect(p0[0] - 6 * p0[2], p1[1], 12 * p0[2], p0[1] - p1[1]);
    }
    return { g, hb };
  }
  function drawFrustumOutline(n, za, zb, aa, ab) {
    const B = ngon(n, aa, za), T = ngon(n, Math.max(0, ab), zb);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    for (let i = 0; i < n; i++) {
      const p = P(...B[i]), q = P(...T[i]);
      ctx.beginPath();
      ctx.moveTo(p[0], p[1]);
      ctx.lineTo(q[0], q[1]);
      ctx.stroke();
    }
    poly(T.map((p) => P(...p)), null, '#ffffff');
  }
  function templeTop(g, topA, L) {
    const [x, y] = local(0, 0);
    const h = L.structure.temple.h;
    const z = g.top;
    if (L.structure.twin) {
      for (const [dx, col] of [[-topA * 0.42, '#3a7bd5'], [topA * 0.42, '#c8352b']]) {
        drawBoxAt(x + dx, y, topA * 0.62, topA * 0.7, z, h, L.structure.temple.color, col);
      }
    } else drawBoxAt(x, y, topA * 1.1, topA * 1.1, z, h, L.structure.temple.color, '#b44a35');
  }
  function drawBoxAt(x, y, w, d, z0, h, col, roofCol) {
    const x0 = x - w / 2, x1 = x + w / 2, y0 = y - d / 2, y1 = y + d / 2;
    const sideX = x > cam.x ? x0 : x1;
    poly([P(sideX, y0, z0), P(sideX, y1, z0), P(sideX, y1, z0 + h), P(sideX, y0, z0 + h)], shade(col, 0.75));
    poly([P(x0, y0, z0), P(x1, y0, z0), P(x1, y0, z0 + h), P(x0, y0, z0 + h)], shade(col, 0.95));
    // doorway
    const dx = w * 0.12;
    poly([P(x - dx, y0 - 0.01, z0), P(x + dx, y0 - 0.01, z0), P(x + dx, y0 - 0.01, z0 + h * 0.6), P(x - dx, y0 - 0.01, z0 + h * 0.6)], '#2b2018');
    poly([P(x0, y0, z0 + h), P(x1, y0, z0 + h), P(x1, y1, z0 + h), P(x0, y1, z0 + h)], roofCol);
    poly([P(x0, y0, z0 + h), P(x1, y0, z0 + h), P(x1, y0, z0 + h * 1.25), P(x0, y0, z0 + h * 1.25)], roofCol);
  }
  function glow([x, y], z, col, r) {
    const p = P(x, y, z);
    const gr = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], r);
    gr.addColorStop(0, shade(col, 1.2, 0.9));
    gr.addColorStop(1, shade(col, 1, 0));
    ctx.fillStyle = gr;
    ctx.fillRect(p[0] - r, p[1] - r, r * 2, r * 2);
  }

  // ---------- ramp ----------
  function rampGeom(g, hb) {
    if (scene.noRamp || hb < 1 || scene.capped) return null;
    const a = apothemAt(g, hb);
    const len = scene.U * 0.35 + hb * 2;
    const w = scene.U * 0.09;
    // a straight ramp coming off the front face, a little left of center
    const top = local(-a * 0.3, -a - 0.5);
    const foot = local(-a * 0.3, -a - 0.5 - len);
    return { top: [...top, hb], foot: [...foot, 0], w, len };
  }
  function drawRamp(r) {
    if (!r) return;
    const th = scene.th;
    const dx = r.top[0] - r.foot[0], dy = r.top[1] - r.foot[1];
    const m = Math.hypot(dx, dy);
    const nx = -dy / m, ny = dx / m; // perpendicular to the ramp
    const hw = r.w / 2;
    const A = [r.foot[0] - nx * hw, r.foot[1] - ny * hw, 0];
    const B = [r.foot[0] + nx * hw, r.foot[1] + ny * hw, 0];
    const Ct = [r.top[0] + nx * hw, r.top[1] + ny * hw, r.top[2]];
    const D = [r.top[0] - nx * hw, r.top[1] - ny * hw, r.top[2]];
    // the side wall that faces the camera
    const midx = (r.top[0] + r.foot[0]) / 2, midy = (r.top[1] + r.foot[1]) / 2;
    const plus = nx * (cam.x - midx) + ny * (cam.y - midy) > 0;
    const sa = plus ? B : A, st = plus ? Ct : D;
    poly([P(...sa), P(...st), P(st[0], st[1], 0)], shade(th.ramp, 0.75));
    // the end wall at the top is hidden against the face; the front end is a sliver at the foot
    poly([P(...A), P(...B), P(...Ct), P(...D)], shade(th.ramp, 1.05));
    ctx.strokeStyle = shade(th.ramp, 0.6, 0.35);
    ctx.beginPath();
    for (let i = 1; i < 10; i++) {
      const u = i / 10;
      const p = P(A[0] + (D[0] - A[0]) * u, A[1] + (D[1] - A[1]) * u, D[2] * u);
      const q = P(B[0] + (Ct[0] - B[0]) * u, B[1] + (Ct[1] - B[1]) * u, D[2] * u);
      ctx.moveTo(p[0], p[1]);
      ctx.lineTo(q[0], q[1]);
    }
    ctx.stroke();
  }

  // ---------- sky & ground ----------
  function drawSky(s, cal) {
    const th = scene.th;
    const L = scene.L;
    let [top, hor] = th.sky;
    const storm = s.effects.some((e) => e.kind === 'storm');
    if (storm) { top = mix(top, '#b06a3a', 0.6); hor = mix(hor, '#d08a4a', 0.6); }
    if (th.house === 'suburb' && cal.season.id === 'winter' && storm) { top = '#9a9a92'; hor = '#c9c4b0'; }
    const gr = ctx.createLinearGradient(0, 0, 0, cam.hz);
    gr.addColorStop(0, top);
    gr.addColorStop(1, hor);
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, W, cam.hz + 2);
    // sun arcs once per season
    const u = cal.dayInSeason / cal.season.days;
    const sx = view.x + view.w * (0.12 + 0.76 * u);
    const sy = cam.hz - Math.sin(Math.PI * u) * Math.min(cam.hz - view.y - 20, view.h * 0.32) - 10;
    const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, 60);
    sg.addColorStop(0, shade(th.sun, 1, 0.95));
    sg.addColorStop(0.25, shade(th.sun, 1, 0.45));
    sg.addColorStop(1, shade(th.sun, 1, 0));
    ctx.fillStyle = sg;
    ctx.fillRect(sx - 60, sy - 60, 120, 120);
    ctx.fillStyle = th.sun;
    ctx.beginPath();
    ctx.arc(sx, sy, L.civ.theme === 'mars' ? 7 : 11, 0, 7);
    ctx.fill();
    // a red star in the east: Horus the Red
    if (L.martians || L.civ.theme === 'deseret') {
      const prog = s.build.total ? s.build.core / s.build.total : 0;
      const mx = view.x + view.w * 0.93, my = view.y + Math.max(26, (cam.hz - view.y) * 0.3);
      const r = 2 + prog * 4 + (L.martians ? prog * 3 : 0);
      const mg = ctx.createRadialGradient(mx, my, 0, mx, my, r * 5);
      mg.addColorStop(0, 'rgba(255,90,60,0.9)');
      mg.addColorStop(1, 'rgba(255,90,60,0)');
      ctx.fillStyle = mg;
      ctx.fillRect(mx - r * 5, my - r * 5, r * 10, r * 10);
      ctx.fillStyle = '#ff6a4a';
      ctx.beginPath();
      ctx.arc(mx, my, r, 0, 7);
      ctx.fill();
    }
    if (L.civ.theme === 'mars') {
      // Earth, a blue evening star
      const ex = view.x + view.w * 0.2, ey = view.y + 40;
      ctx.fillStyle = '#9fd0ff';
      ctx.beginPath();
      ctx.arc(ex, ey, 2.5, 0, 7);
      ctx.fill();
    }
  }
  function drawHorizon() {
    const th = scene.th;
    const U = scene.U;
    // far ground starts right at the horizon
    const g0 = cam.hz;
    void U;
    const gr = ctx.createLinearGradient(0, g0, 0, H);
    gr.addColorStop(0, th.far);
    gr.addColorStop(0.35, th.plateau);
    gr.addColorStop(1, th.ground);
    ctx.fillStyle = gr;
    ctx.fillRect(0, g0, W, H - g0);
    // skyline
    ctx.fillStyle = shade(th.far, 0.92);
    ctx.beginPath();
    ctx.moveTo(0, g0 + 1);
    const kind = th.horizon;
    for (let x = 0; x <= W; x += 6) {
      const u = x / W;
      let hgt = 0;
      if (kind === 'dunes') hgt = 6 + 5 * Math.sin(u * 9 + 1) + 3 * Math.sin(u * 23);
      else if (kind === 'jungle') hgt = 16 + 5 * Math.sin(u * 40) + 4 * Math.sin(u * 97) + 3 * Math.sin(u * 13);
      else if (kind === 'volcano') hgt = 6 + Math.max(0, 70 - Math.abs(u - 0.78) * 600) + Math.max(0, 52 - Math.abs(u - 0.9) * 500) + 4 * Math.sin(u * 17);
      else if (kind === 'bluffs') hgt = 10 + (u > 0.6 ? 14 : 4) + 2 * Math.sin(u * 50);
      else if (kind === 'mountains') hgt = 30 + 38 * Math.abs(Math.sin(u * 5.2 + 0.4)) + 12 * Math.abs(Math.sin(u * 17)) ;
      else if (kind === 'mesas') hgt = 4 + (Math.sin(u * 7) > 0.55 ? 24 : 0) + (u > 0.12 && u < 0.2 ? 30 : 0);
      ctx.lineTo(x, g0 - hgt);
    }
    ctx.lineTo(W, g0 + 1);
    ctx.fill();
    if (kind === 'mountains') {
      // snowcaps on the Wasatch
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      for (let x = 0; x <= W; x += 6) {
        const u = x / W;
        const hgt = 30 + 38 * Math.abs(Math.sin(u * 5.2 + 0.4)) + 12 * Math.abs(Math.sin(u * 17));
        if (hgt > 62) ctx.fillRect(x, g0 - hgt, 6, (hgt - 58) * 0.6);
      }
    }
    if (kind === 'mesas') {
      // the Face on Mars, more or less
      const fx = view.x + view.w * 0.16, fy = g0 - 30;
      ctx.fillStyle = shade(th.far, 0.8);
      ctx.beginPath();
      ctx.ellipse(fx, fy + 6, 22, 14, 0, 0, 7);
      ctx.fill();
      ctx.fillStyle = shade(th.far, 0.6);
      ctx.fillRect(fx - 9, fy + 1, 5, 3);
      ctx.fillRect(fx + 4, fy + 1, 5, 3);
      ctx.fillRect(fx - 4, fy + 11, 8, 2);
    }
  }
  function waterLevel(s, cal) {
    // how far inland the water reaches right now
    const sc = scene;
    if (sc.th.nowater) return 0;
    if (sc.th.floods && cal.season.id === 'akhet') {
      const u = cal.dayInSeason / cal.season.days;
      const amp = Math.min(1.25, s.water.w);
      return sc.waterEdge + Math.sin(Math.PI * Math.min(1, u * 1.15)) * (sc.fieldTop - sc.waterEdge) * amp * 0.95;
    }
    const k = (s.water.w - 1) * 0.25;
    return sc.waterEdge * (1 + k);
  }
  function drawGround(s, cal) {
    const sc = scene, th = sc.th, U = sc.U;
    const wl = waterLevel(s, cal);
    // plateau band
    quad(-12 * U, 12 * U, sc.fieldTop, 14 * U, 0, th.plateau);
    // fields
    const mode = cal.season.farm;
    for (const f of sc.fields) {
      let col = th.field[mode] || th.field.idle;
      if (mode === 'grow') col = mix(th.field.idle, th.field.grow, Math.min(1, 0.35 + cal.dayInSeason / cal.season.days));
      if (mode === 'harvest') col = mix(th.field.harvest, th.field.idle, Math.min(1, cal.dayInSeason / cal.season.days) * 0.8);
      quad(f.x0, f.x1, f.y0, f.y1, 0, shade(col, 0.92 + f.v * 0.16));
      if (th.house === 'dome') {
        // greenhouse tubes
        const p0 = P(f.x0, f.y0, 0), p1 = P(f.x1, f.y0, 0), pt = P(f.x0, f.y0, U * 0.05);
        ctx.fillStyle = 'rgba(200,255,200,0.18)';
        ctx.fillRect(p0[0], pt[1], p1[0] - p0[0], p0[1] - pt[1]);
      }
    }
    // water
    if (!th.nowater) {
      quad(-12 * U, 12 * U, -3 * U, wl, 0, th.saltlake ? th.water : th.water);
      // shimmer
      ctx.strokeStyle = shade(th.waterHi, 1, 0.45);
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < 40; i++) {
        const y = -2 * U + hash(i * 7) * (wl + 2 * U);
        const x = -6 * U + hash(i * 13) * 12 * U + Math.sin(t * 0.7 + i) * U * 0.15;
        const p = P(x, y, 0), q = P(x + U * 0.25, y, 0);
        ctx.moveTo(p[0], p[1]);
        ctx.lineTo(q[0], q[1]);
      }
      ctx.stroke();
      if (th.saltlake) quad(-12 * U, 12 * U, wl, wl + U * 0.06, 0, '#f4f4ee');
      if (th.lake) {
        // chinampa plots in the lake
        for (let i = 0; i < 16; i++) quad(-6 * U + i * 0.75 * U, -6 * U + i * 0.75 * U + 0.55 * U, wl - 0.5 * U, wl - 0.12 * U, 0, shade(th.field.grow, 0.9 + hash(i) * 0.2));
      }
    }
    // quarry pit
    const q = sc.quarry;
    const pit = [];
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      pit.push(P(q.x + Math.cos(a) * q.r * (1 + 0.15 * hash(i)), q.y + Math.sin(a) * q.r * 0.8, 0));
    }
    poly(pit, shade(th.quarry, 0.8));
    const pit2 = pit.map((p, i) => P(q.x + Math.cos((i / 14) * Math.PI * 2) * q.r * 0.7, q.y + Math.sin((i / 14) * Math.PI * 2) * q.r * 0.55, 0));
    poly(pit2, shade(th.quarry, 0.62));
  }

  // ---------- decor, buildings ----------
  function drawVeg(v) {
    const th = scene.th, U = scene.U;
    const p = P(v.x, v.y, 0);
    const k = p[2];
    const s = U * 0.07 * v.s * k;
    if (th.veg === 'palms') {
      ctx.strokeStyle = '#6b4a2a';
      ctx.lineWidth = Math.max(1, s * 0.12);
      ctx.beginPath();
      ctx.moveTo(p[0], p[1]);
      ctx.quadraticCurveTo(p[0] + s * 0.2, p[1] - s, p[0] + s * 0.1, p[1] - s * 1.9);
      ctx.stroke();
      ctx.strokeStyle = '#3f7a35';
      ctx.lineWidth = Math.max(1, s * 0.14);
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + (i - 2) * 0.7;
        ctx.beginPath();
        ctx.moveTo(p[0] + s * 0.1, p[1] - s * 1.9);
        ctx.quadraticCurveTo(p[0] + s * 0.1 + Math.cos(a) * s * 0.7, p[1] - s * 2.2 + Math.sin(a) * s * 0.3, p[0] + s * 0.1 + Math.cos(a) * s, p[1] - s * 1.6);
        ctx.stroke();
      }
    } else if (th.veg === 'jungle' || th.veg === 'trees') {
      ctx.fillStyle = th.veg === 'jungle' ? shade('#2f6a33', 0.85 + v.s * 0.2) : shade('#5f8a45', 0.9 + v.s * 0.15);
      ctx.beginPath();
      ctx.arc(p[0], p[1] - s * 0.9, s * 0.8, 0, 7);
      ctx.fill();
      ctx.fillStyle = '#4a3420';
      ctx.fillRect(p[0] - s * 0.08, p[1] - s * 0.4, s * 0.16, s * 0.4);
    } else if (th.veg === 'prairie') {
      ctx.strokeStyle = '#6a8a3e';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        ctx.moveTo(p[0] + (i - 1.5) * s * 0.15, p[1]);
        ctx.lineTo(p[0] + (i - 1.5) * s * 0.3, p[1] - s * 0.6);
      }
      ctx.stroke();
    }
  }
  function drawHouse(hs, s) {
    const th = scene.th;
    const L = scene.L;
    const built = hs.idx < Math.round((s.buildings.village / 9) * 34) + 6;
    if (!built) return;
    const col = th.house === 'suburb' ? ['#e9e1d3', '#d9c7a8', '#c9d4dc', '#e2d0c4'][Math.floor(hs.v * 4)] : th.houseCol;
    if (th.house === 'dome') {
      const p = P(hs.x, hs.y, 0);
      const r = hs.w * 0.6 * p[2];
      ctx.fillStyle = shade(col, 0.9 + hs.v * 0.15);
      ctx.beginPath();
      ctx.ellipse(p[0], p[1], r, r * 0.8, 0, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath();
      ctx.ellipse(p[0] - r * 0.3, p[1] - r * 0.45, r * 0.25, r * 0.15, -0.4, 0, 7);
      ctx.fill();
      return;
    }
    box(hs.x, hs.y, hs.w, hs.d, hs.h, mix(col, '#ffffff', hs.v * 0.12), null);
    if (th.house === 'thatch' || th.house === 'wattle' || th.house === 'suburb') prismRoof(hs.x, hs.y, hs.w * 1.1, hs.d * 1.1, hs.h, hs.h * 0.7, th.roof);
    void L;
  }
  function drawLandmarks(s, add) {
    const sc = scene, th = sc.th, U = sc.U;
    // granaries
    for (let i = 0; i < Math.min(8, s.buildings.granary + 1); i++) {
      const x = sc.granary.x + (i % 4) * U * 0.14, y = sc.granary.y + Math.floor(i / 4) * U * 0.15;
      add(y, () => {
        const p = P(x, y, 0);
        const r = U * 0.05 * p[2];
        ctx.fillStyle = th.house === 'dome' ? '#c9ced2' : shade(th.houseCol, 1.12);
        ctx.beginPath();
        ctx.ellipse(p[0], p[1], r, r * 1.6, 0, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = shade(th.houseCol, 0.8);
        ctx.fillRect(p[0] - r, p[1] - 1, r * 2, 2);
      });
    }
    // bakery with smoke
    add(sc.bakery.y, () => {
      box(sc.bakery.x, sc.bakery.y, U * 0.22, U * 0.12, U * 0.05, mix(th.houseCol, '#000000', 0.1));
    });
    // temple
    const tp = sc.temple;
    add(tp.y, () => {
      const lvl = s.buildings.temple;
      if (th.house === 'mudbrick') {
        // pylon gate
        const w = U * 0.3, h = U * (0.12 + lvl * 0.012);
        const x0 = tp.x - w / 2, x1 = tp.x + w / 2;
        poly([P(x0, tp.y, 0), P(tp.x - w * 0.08, tp.y, 0), P(tp.x - w * 0.1, tp.y, h), P(x0 + w * 0.06, tp.y, h)], shade('#e2cfa6', 0.95));
        poly([P(tp.x + w * 0.08, tp.y, 0), P(x1, tp.y, 0), P(x1 - w * 0.06, tp.y, h), P(tp.x + w * 0.1, tp.y, h)], shade('#e2cfa6', 0.95));
        poly([P(tp.x - w * 0.08, tp.y, 0), P(tp.x + w * 0.08, tp.y, 0), P(tp.x + w * 0.08, tp.y, h * 0.7), P(tp.x - w * 0.08, tp.y, h * 0.7)], '#3a2c1c');
        // flags
        for (const fx of [x0 + w * 0.12, x1 - w * 0.12]) {
          const a = P(fx, tp.y - 1, 0), b2 = P(fx, tp.y - 1, h * 1.5);
          ctx.strokeStyle = '#6b4a2a';
          ctx.beginPath();
          ctx.moveTo(a[0], a[1]);
          ctx.lineTo(b2[0], b2[1]);
          ctx.stroke();
          ctx.fillStyle = '#c8352b';
          ctx.fillRect(b2[0], b2[1], 6 + Math.sin(t * 4 + fx) * 2, 3);
        }
      } else if (th.house === 'wattle') {
        // woodhenge: a ring of red cedar posts
        for (let i = 0; i < 24; i++) {
          const a = (i / 24) * Math.PI * 2;
          const x = tp.x + Math.cos(a) * U * 0.22, y = tp.y + Math.sin(a) * U * 0.16;
          const p = P(x, y, 0), q = P(x, y, U * 0.06);
          ctx.strokeStyle = '#7a3a24';
          ctx.lineWidth = Math.max(1, p[2] * 0.6);
          ctx.beginPath();
          ctx.moveTo(p[0], p[1]);
          ctx.lineTo(q[0], q[1]);
          ctx.stroke();
        }
      } else if (th.house === 'suburb') {
        box(tp.x, tp.y, U * 0.2, U * 0.12, U * 0.1, '#e8e6e0');
        for (const dx of [-0.07, 0, 0.07]) {
          const p = P(tp.x + dx * U, tp.y - U * 0.06, U * 0.1), q = P(tp.x + dx * U, tp.y - U * 0.06, U * (dx ? 0.2 : 0.26));
          ctx.strokeStyle = '#d9d6cc';
          ctx.lineWidth = Math.max(2, p[2] * 3);
          ctx.beginPath();
          ctx.moveTo(p[0], p[1]);
          ctx.lineTo(q[0], q[1]);
          ctx.stroke();
        }
      } else if (th.house === 'dome') {
        const p = P(tp.x, tp.y, 0);
        const r = U * 0.14 * p[2];
        ctx.fillStyle = '#c3cdd4';
        ctx.beginPath();
        ctx.ellipse(p[0], p[1], r, r * 0.9, 0, Math.PI, 0);
        ctx.fill();
        ctx.strokeStyle = '#7fd7ff';
        ctx.beginPath();
        ctx.arc(p[0], p[1] - r * 0.9 - 6, 4 + Math.sin(t * 2) * 1, 0, 7);
        ctx.stroke();
      } else {
        // small stepped shrine
        const g = { a: U * 0.11 };
        for (let i = 0; i < 3; i++) box(tp.x, tp.y, g.a * 2 * (1 - i * 0.25), g.a * 2 * (1 - i * 0.25), U * 0.035 * (i + 1), mix(th.core, '#000000', i * 0.04));
      }
    });
    // Olmec colossal heads in the plaza
    for (let i = 0; i < (s.flags.heads || 0); i++) {
      const x = -sc.a0 * 0.9 + i * sc.a0 * 0.6, y = sc.PY - sc.a0 - 0.45 * U;
      add(y, () => {
        const p = P(x, y, 0);
        const r = U * 0.045 * p[2];
        ctx.fillStyle = '#5d5a52';
        ctx.beginPath();
        ctx.ellipse(p[0], p[1] - r, r * 0.85, r, 0, 0, 7);
        ctx.fill();
        ctx.fillStyle = '#4a4740';
        ctx.fillRect(p[0] - r * 0.9, p[1] - r * 1.75, r * 1.8, r * 0.5);
        ctx.fillStyle = '#35332d';
        ctx.fillRect(p[0] - r * 0.45, p[1] - r * 1.05, r * 0.25, r * 0.12);
        ctx.fillRect(p[0] + r * 0.2, p[1] - r * 1.05, r * 0.25, r * 0.12);
        ctx.fillRect(p[0] - r * 0.3, p[1] - r * 0.5, r * 0.6, r * 0.14);
      });
    }
    // harbor
    if (!th.nowater) {
      const hb = sc.harbor;
      add(hb.y, () => {
        quad(hb.x - U * 0.25, hb.x + U * 0.25, hb.y - U * 0.12, hb.y + U * 0.02, 0.3, shade(th.ramp, 0.9));
      });
    }
  }

  // ---------- agents ----------
  function ensureAgents(s) {
    const div = Math.max(12, s.pop / 260);
    const cal = calendar(s);
    const drafted = cal.season.farm === 'idle' && s.draft !== 'none';
    const want = {
      farm: drafted ? 0 : Math.round(s.jobs.farm / div),
      brew: Math.round(s.jobs.brew / div),
      quarry: Math.round(s.jobs.quarry / div),
      haul: Math.round((s.jobs.haul + (drafted ? s.jobs.farm * 0.85 : 0) + s.levy.count * 0.85) / (div * 4)),
      mason: Math.round(s.jobs.mason / div),
      boat: Math.round(s.jobs.boat / (div * 6)),
      priest: Math.round(s.jobs.priest / div),
    };
    for (const job of JOBS) {
      const have = agents.filter((a) => a.job === job);
      const n = Math.min(want[job], job === 'haul' ? 70 : 90);
      for (let i = have.length; i < n; i++) agents.push(newAgent(job, s));
      if (have.length > n) {
        const drop = new Set(have.slice(n));
        agents = agents.filter((a) => !drop.has(a));
      }
    }
  }
  let agentSeq = 0;
  function newAgent(job, s) {
    const id = ++agentSeq;
    const sc = scene, U = sc.U;
    const a = { id, job, u: hash(id * 9) , speed: 0.5 + hash(id * 5) * 0.5, phase: hash(id * 3) * 10, seed: id };
    if (job === 'farm') { a.x = -5 * U + hash(id * 11) * 10 * U; a.y = sc.waterEdge + 0.1 * U + hash(id * 17) * (sc.fieldTop - sc.waterEdge - 0.2 * U); }
    if (job === 'brew') { a.x = sc.bakery.x + (hash(id) - 0.5) * U * 0.5; a.y = sc.bakery.y - U * 0.1 - hash(id * 2) * U * 0.15; }
    if (job === 'quarry') { const r = Math.sqrt(hash(id * 7)) * sc.quarry.r * 0.85, an = hash(id * 13) * 7; a.x = sc.quarry.x + Math.cos(an) * r; a.y = sc.quarry.y + Math.sin(an) * r * 0.7; }
    if (job === 'priest') { a.x = sc.temple.x + (hash(id) - 0.5) * U * 0.4; a.y = sc.temple.y - U * 0.1 - hash(id * 2) * U * 0.2; }
    if (job === 'mason') { a.lx = hash(id * 19) - 0.5; a.ly = hash(id * 23) - 0.5; }
    a.name = NAMES[sc.L.civ.id](hash(id * 29), hash(id * 31), id);
    return a;
  }
  function haulPath(s, g, hb) {
    const sc = scene;
    const r = rampGeom(g, hb);
    const q = [sc.quarry.x + sc.quarry.r * 0.6, sc.quarry.y - sc.quarry.r * 0.3, 0];
    const topA = apothemAt(g, hb);
    if (!r) {
      // walk straight up the mound's face
      const face = local(-topA * 0.8 - 1, -topA * 0.4);
      const foot = local(-g.tiers[0].a0 - 2, -g.tiers[0].a0 * 0.3);
      return [q, [...foot, 0], [...face, hb], [...local(0, 0), hb]];
    }
    return [q, r.foot, r.top, [...local(-topA * 0.3, 0), hb]];
  }
  function along(path, u) {
    const segs = [];
    let tot = 0;
    for (let i = 1; i < path.length; i++) {
      const d = Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1], path[i][2] - path[i - 1][2]);
      segs.push(d);
      tot += d;
    }
    let dist = u * tot;
    for (let i = 0; i < segs.length; i++) {
      if (dist <= segs[i] || i === segs.length - 1) {
        const k = segs[i] ? Math.min(1, dist / segs[i]) : 0;
        return [path[i][0] + (path[i + 1][0] - path[i][0]) * k, path[i][1] + (path[i + 1][1] - path[i][1]) * k, path[i][2] + (path[i + 1][2] - path[i][2]) * k];
      }
      dist -= segs[i];
    }
    return path[path.length - 1];
  }
  function person(x, y, z, k, th, opts = {}) {
    const p = P(x, y, z);
    const hgt = Math.max(3, scene.U * 0.028 * p[2]);
    const w = Math.max(1, hgt * 0.32);
    const bob = opts.bob || 0;
    ctx.fillStyle = opts.cloth || th.cloth;
    ctx.fillRect(p[0] - w / 2, p[1] - hgt * 0.55 - bob, w, hgt * 0.4);
    ctx.fillStyle = th.people;
    ctx.fillRect(p[0] - w / 2, p[1] - hgt * 0.2 - bob, w * 0.4, hgt * 0.2);
    ctx.fillRect(p[0] + w * 0.1, p[1] - hgt * 0.2 - bob, w * 0.4, hgt * 0.2);
    ctx.fillRect(p[0] - w / 2, p[1] - hgt * 0.8 - bob, w, hgt * 0.25);
    ctx.beginPath();
    ctx.arc(p[0], p[1] - hgt * 0.92 - bob, w * 0.55, 0, 7);
    ctx.fill();
    return p;
  }
  function updateAgents(s, dt, g, hb, add, cal) {
    const sc = scene, th = sc.th, U = sc.U;
    const striking = s.effects.some((e) => e.kind === 'strike');
    const storm = s.effects.some((e) => e.kind === 'storm');
    const path = haulPath(s, g, hb);
    const pace = (striking || storm ? 0 : 1) * Math.min(3, 0.6 + (s.speedDays || 6) / 10);
    const topA = apothemAt(g, hb);
    for (const a of agents) {
      a.phase += dt * a.speed * 3 * (striking ? 0.1 : 1);
      if (a.job === 'haul') {
        a.u += dt * 0.025 * a.speed * pace;
        if (a.u > 2) a.u -= 2;
        const fwd = a.u < 1;
        const pos = along(path, fwd ? a.u : 2 - a.u);
        a.wx = pos[0]; a.wy = pos[1]; a.wz = pos[2];
        add(pos[1], () => {
          // a sledge, a block and a crew
          const blockCol = th.house === 'dome' ? '#b5683c' : th.core;
          const c = Math.cos(sc.yaw), sn = Math.sin(sc.yaw);
          const dir = fwd ? 1 : -1;
          if (fwd) {
            const p = P(pos[0], pos[1], pos[2]);
            const sz = Math.max(3, U * 0.035 * p[2]);
            ctx.fillStyle = shade(blockCol, 0.95);
            ctx.fillRect(p[0] - sz / 2, p[1] - sz * 0.8, sz, sz * 0.8);
            ctx.fillStyle = shade(blockCol, 0.7);
            ctx.fillRect(p[0] - sz / 2, p[1] - sz * 0.15, sz, sz * 0.15);
          }
          for (let i = 0; i < (fwd ? 4 : 3); i++) {
            const off = (i + 1) * U * 0.03 * dir;
            const px = pos[0] + c * off + (i % 2 ? -1 : 1) * U * 0.01 * -sn;
            const py = pos[1] + sn * off;
            const pp = person(px, py, pos[2] + (path[2][2] ? 0 : 0), 0, th, { bob: Math.abs(Math.sin(a.phase + i)) * 1.2 });
            if (i === 0) { a.sx = pp[0]; a.sy = pp[1]; }
          }
        });
      } else if (a.job === 'boat') {
        a.u += dt * 0.02 * a.speed * ((cal.season.boat ?? 1) > 0.5 ? 1 : 0.3);
        if (a.u > 2) a.u -= 2;
        const u = a.u < 1 ? a.u : 2 - a.u;
        const bx = sc.harbor.x + (1 - u) * 5 * U * (a.seed % 2 ? 1 : -1);
        const by = sc.harbor.y - 0.25 * U - (a.seed % 3) * 0.12 * U;
        a.wx = bx; a.wy = by; a.wz = 0;
        add(by, () => {
          const p = P(bx, by, 0);
          const k = p[2];
          const L = U * 0.16 * k;
          ctx.fillStyle = th.house === 'mudbrick' ? '#7a5a34' : '#5a4630';
          ctx.beginPath();
          ctx.moveTo(p[0] - L, p[1] - L * 0.15);
          ctx.quadraticCurveTo(p[0], p[1] + L * 0.18, p[0] + L, p[1] - L * 0.15);
          ctx.lineTo(p[0] - L, p[1] - L * 0.15);
          ctx.fill();
          if (th.house === 'mudbrick') {
            ctx.fillStyle = '#efe6cf';
            ctx.fillRect(p[0] - L * 0.05, p[1] - L * 0.9, L * 0.35, L * 0.6);
            ctx.fillStyle = '#6b4a2a';
            ctx.fillRect(p[0] - L * 0.05, p[1] - L * 0.95, 1, L * 0.85);
          }
          if (a.u < 1) {
            ctx.fillStyle = th.casing;
            ctx.fillRect(p[0] - L * 0.6, p[1] - L * 0.3, L * 0.4, L * 0.18);
          }
          a.sx = p[0]; a.sy = p[1];
        });
      } else if (a.job === 'mason') {
        if (hb < 0.5) continue;
        const r = topA * 0.85;
        const [x, y] = local(a.lx * 2 * r, a.ly * 2 * r);
        a.wx = x; a.wy = y; a.wz = hb;
        add(y + 0.001, () => {
          const pp = person(x, y, hb, 0, th, { bob: striking ? 0 : Math.max(0, Math.sin(a.phase * 2)) * 1.5 });
          a.sx = pp[0]; a.sy = pp[1];
        });
      } else {
        let { x, y } = a;
        const wob = striking ? 0 : Math.sin(a.phase) * U * 0.02;
        if (a.job === 'farm') x += wob;
        if (a.job === 'priest') x += Math.sin(a.phase * 0.3) * U * 0.08;
        a.wx = x; a.wy = y; a.wz = 0;
        add(y, () => {
          const pp = person(x, y, 0, 0, th, { bob: a.job === 'quarry' && !striking ? Math.max(0, Math.sin(a.phase * 3)) * 1.5 : 0, cloth: a.job === 'priest' ? '#ffffff' : undefined });
          a.sx = pp[0]; a.sy = pp[1];
        });
      }
    }
  }

  // ---------- particles & weather ----------
  function weather(s, dt, cal) {
    const sc = scene, th = sc.th;
    const storm = s.effects.some((e) => e.kind === 'storm');
    const rainy = cal.season.id === 'rains' && th.veg === 'jungle';
    const snowy = th.house === 'suburb' && cal.season.id === 'winter';
    const dusty = th.house === 'dome' && cal.season.farm === 'idle';
    // smoke from the bakery
    if (Math.random() < dt * 6 && s.jobs.brew > 0) {
      const p = P(sc.bakery.x + (Math.random() - 0.5) * sc.U * 0.15, sc.bakery.y, sc.U * 0.06);
      particles.push({ x: p[0], y: p[1], vx: 4 + Math.random() * 4, vy: -12 - Math.random() * 8, life: 3, max: 3, kind: 'smoke' });
    }
    if (s.effects.some((e) => e.kind === 'feast') && Math.random() < dt * 5) {
      const p = P(sc.village.x0 + Math.random() * (sc.village.x1 - sc.village.x0), sc.village.y0, sc.U * 0.1);
      particles.push({ x: p[0], y: p[1], vx: (Math.random() - 0.5) * 10, vy: -20, life: 2, max: 2, kind: 'note' });
    }
    const n = storm ? 14 : rainy ? 10 : snowy ? 3 : dusty ? 4 : 0;
    for (let i = 0; i < n; i++) {
      if (Math.random() < dt * 20) {
        const kind = storm ? (th.house === 'suburb' ? 'smog' : 'sand') : rainy ? 'rain' : snowy ? 'snow' : 'dust';
        particles.push({ x: view.x + Math.random() * view.w, y: view.y + Math.random() * view.h * 0.5, vx: kind === 'sand' || kind === 'dust' ? 300 + Math.random() * 200 : kind === 'rain' ? -40 : 10, vy: kind === 'rain' ? 500 : kind === 'snow' ? 30 : 20, life: 2, max: 2, kind });
      }
    }
    particles = particles.filter((p) => (p.life -= dt) > 0);
    for (const p of particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const a = Math.min(1, p.life / p.max);
      if (p.kind === 'smoke') { ctx.fillStyle = `rgba(230,230,230,${0.35 * a})`; ctx.beginPath(); ctx.arc(p.x, p.y, 3 + (1 - a) * 6, 0, 7); ctx.fill(); }
      else if (p.kind === 'note') { ctx.fillStyle = `rgba(255,240,180,${a})`; ctx.font = '12px serif'; ctx.fillText('♪', p.x, p.y); }
      else if (p.kind === 'sand' || p.kind === 'dust') { ctx.strokeStyle = `rgba(200,120,60,${0.45 * a})`; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - 18, p.y - 1); ctx.stroke(); }
      else if (p.kind === 'rain') { ctx.strokeStyle = `rgba(200,220,255,${0.45 * a})`; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + 2, p.y - 10); ctx.stroke(); }
      else if (p.kind === 'snow') { ctx.fillStyle = `rgba(255,255,255,${0.8 * a})`; ctx.fillRect(p.x, p.y, 2, 2); }
      else if (p.kind === 'smog') { ctx.fillStyle = `rgba(140,140,130,${0.1 * a})`; ctx.fillRect(p.x, p.y, 30, 10); }
    }
    if (storm) {
      ctx.fillStyle = th.house === 'suburb' ? 'rgba(130,130,120,0.35)' : th.house === 'dome' ? 'rgba(120,60,30,0.35)' : 'rgba(190,110,50,0.28)';
      ctx.fillRect(0, 0, W, H);
    }
    if (s.effects.some((e) => e.kind === 'plague')) { ctx.fillStyle = 'rgba(90,140,60,0.08)'; ctx.fillRect(0, 0, W, H); }
    if (s.pending.some((p) => p.id === 'rampage')) { ctx.fillStyle = `rgba(200,20,10,${0.12 + 0.06 * Math.sin(t * 5)})`; ctx.fillRect(0, 0, W, H); }
  }

  // ---------- finale ----------
  function finale(s, dt) {
    const L = scene.L;
    if (s.outcome !== 'win') return;
    s._finaleT = (s._finaleT || 0) + dt;
    const ft = s._finaleT;
    const g = geometry(s);
    const tip = P(...local(0, 0), g.top);
    if (L.martians) {
      // the visitors descend
      const sx = tip[0] + 110 + Math.sin(ft * 0.6) * 14;
      const sy = Math.min(tip[1] - 40, view.y - 30 + ft * 55);
      if (ft > 2.5) {
        ctx.fillStyle = `rgba(160,255,230,${0.15 + 0.08 * Math.sin(ft * 6)})`;
        ctx.beginPath();
        ctx.moveTo(sx - 12, sy + 6);
        ctx.lineTo(sx + 12, sy + 6);
        ctx.lineTo(tip[0] + 18, tip[1] + 30);
        ctx.lineTo(tip[0] - 18, tip[1] + 10);
        ctx.fill();
      }
      ctx.fillStyle = '#c9d2da';
      ctx.beginPath();
      ctx.ellipse(sx, sy, 46, 11, 0, 0, 7);
      ctx.fill();
      ctx.fillStyle = 'rgba(160,230,255,0.85)';
      ctx.beginPath();
      ctx.ellipse(sx, sy - 7, 16, 11, 0, Math.PI, 0);
      ctx.fill();
      // a little beehive on the hull
      ctx.fillStyle = '#e8b830';
      ctx.beginPath();
      for (let i = 0; i < 6; i++) ctx.lineTo(sx + Math.cos((i * Math.PI) / 3) * 5, sy + 2 + Math.sin((i * Math.PI) / 3) * 4);
      ctx.fill();
      for (let i = 0; i < 8; i++) {
        ctx.fillStyle = (Math.floor(ft * 4) + i) % 2 ? '#ff6a4a' : '#9ff0ff';
        ctx.fillRect(sx - 40 + i * 11, sy + 3, 3, 3);
      }
    }
    if (L.timeloop) {
      ctx.fillStyle = `rgba(160,240,255,${Math.min(0.5, ft * 0.1)})`;
      ctx.beginPath();
      ctx.moveTo(tip[0] - 4, tip[1]);
      ctx.lineTo(tip[0] + 4, tip[1]);
      ctx.lineTo(tip[0] + 60, 0);
      ctx.lineTo(tip[0] - 60, 0);
      ctx.fill();
      if (ft > 4) {
        ctx.fillStyle = `rgba(255,255,255,${Math.min(1, (ft - 4) * 0.4)})`;
        ctx.fillRect(0, 0, W, H);
      }
    }
  }

  // ---------- main draw ----------
  function draw(s, dt, v) {
    t += dt;
    view = v;
    if (!scene || scene.levelId !== s.levelId) buildScene(s);
    setCamera();
    const cal = calendar(s);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    drawSky(s, cal);
    drawHorizon();
    drawGround(s, cal);

    const list = [];
    const add = (depth, fn) => list.push({ depth, fn });
    for (const vg of scene.veg) add(vg.y, () => drawVeg(vg));
    for (const hs of scene.houses) add(hs.y, () => drawHouse(hs, s));
    drawLandmarks(s, add);
    const g = geometry(s);
    const hb = s.build.height;
    scene.capped = s.build.capstone; // ramps come down once the structure is finished
    const r = rampGeom(g, hb);
    // the structure and its ramp share a depth slot; the ramp goes first
    add(scene.PY, () => {
      // stockpiles
      const sc = scene;
      const piles = Math.min(18, Math.ceil(s.res.stone / Math.max(1, s.build.total / 400)));
      for (let i = 0; i < piles; i++) {
        const x = sc.quarry.x + sc.quarry.r * (0.9 + (i % 6) * 0.08), y = sc.quarry.y - sc.quarry.r * 0.5 + Math.floor(i / 6) * sc.U * 0.05;
        box(x, y, sc.U * 0.05, sc.U * 0.05, sc.U * 0.04, sc.th.core);
      }
      drawStructure(s);
    });
    if (r) add(Math.max(r.foot[1], r.top[1]) + 0.01, () => drawRamp(r));
    ensureAgents(s);
    updateAgents(s, dt, g, hb, add, cal);
    list.sort((a, b) => b.depth - a.depth);
    for (const it of list) it.fn();
    weather(s, dt, cal);
    finale(s, dt);
  }

  function pick(x, y) {
    let best = null, bd = 14;
    for (const a of agents) {
      if (a.sx == null) continue;
      const d = Math.hypot(a.sx - x, a.sy - 5 - y);
      if (d < bd) { bd = d; best = a; }
    }
    lastPick = best;
    return best;
  }
  function zoomBy(k, mx) {
    cam.zoom = Math.max(0.6, Math.min(3, cam.zoom * k));
    void mx;
  }
  function panBy(dx) {
    if (!scene) return;
    cam.panX = Math.max(-3 * scene.U, Math.min(3 * scene.U, cam.panX - (dx * (scene.PY - cam.y)) / cam.f));
  }
  function reset() { cam.zoom = 1; cam.panX = 0; scene = null; }

  return { resize, draw, pick, zoomBy, panBy, reset, get lastPick() { return lastPick; } };
}

export { THOUGHTS };
