// Outline polygons, normalized so every vertex lies within the unit circle.
// Each entity's bounding radius ("scale") multiplies these back up.

export const MAX_VERTS = 16;
export const N_SHAPES = 32;
export const SHIP_SHAPE = 0;
export const SHIP_SCALE = 18; // bounding radius of ship + exhaust flame

const SHIP = [[14, 0], [-10, 9], [-5, 0], [-10, -9]].map(([x, y]) => [x / SHIP_SCALE, y / SHIP_SCALE]);

function rockShape(rand) {
  const n = 9 + Math.floor(rand() * 4);
  const pts = [];
  for (let i = 0; i < n; i++) {
    const t = (i + (rand() - 0.5) * 0.5) / n * Math.PI * 2;
    const r = 0.68 + rand() * 0.32;
    pts.push([r * Math.cos(t), r * Math.sin(t)]);
  }
  return pts;
}

function mulberry(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildShapes(seed = 1905) {
  const rand = mulberry(seed);
  const shapes = [SHIP];
  while (shapes.length < N_SHAPES) shapes.push(rockShape(rand));
  // texel 0 of each row: vertex count; texels 1..MAX_VERTS: vertices
  const W = MAX_VERTS + 1;
  const tex = new Float32Array(W * N_SHAPES * 4);
  shapes.forEach((pts, s) => {
    tex[s * W * 4] = pts.length;
    pts.forEach(([x, y], i) => {
      const o = (s * W + 1 + i) * 4;
      tex[o] = x; tex[o + 1] = y;
    });
  });
  return { shapes, tex, texWidth: W };
}

export function pointInPolygon(px, py, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export function polygonArea(pts) {
  let a = 0;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) a += pts[j][0] * pts[i][1] - pts[i][0] * pts[j][1];
  return Math.abs(a) / 2;
}
