// Voronoi fracture of triangle meshes.
// Every triangle is clipped into the Voronoi cell(s) it overlaps, keeping normals and UVs, so a
// textured painting or a hollow porcelain shell breaks into shards that still show their surface.
import * as THREE from 'three';

const STRIDE = 8; // x y z nx ny nz u v

function lerpVert(a, b, t) {
  const out = new Array(STRIDE);
  for (let i = 0; i < STRIDE; i++) out[i] = a[i] + (b[i] - a[i]) * t;
  return out;
}

// keep the part of polygon with dot(x, N) <= d
function clip(poly, nx, ny, nz, d) {
  const out = [];
  const m = poly.length;
  for (let i = 0; i < m; i++) {
    const a = poly[i], b = poly[(i + 1) % m];
    const da = a[0] * nx + a[1] * ny + a[2] * nz - d;
    const db = b[0] * nx + b[1] * ny + b[2] * nz - d;
    if (da <= 0) out.push(a);
    if ((da <= 0) !== (db <= 0)) out.push(lerpVert(a, b, da / (da - db)));
  }
  return out;
}

/**
 * @param {THREE.BufferGeometry} geom  geometry in the same space as the seeds
 * @param {THREE.Vector3[]} seeds
 * @returns {{geometry: THREE.BufferGeometry, center: THREE.Vector3, hull: number[]}[]}
 */
export function fractureGeometry(geom, seeds) {
  const g = geom.index ? geom.toNonIndexed() : geom;
  const P = g.attributes.position.array;
  const N = g.attributes.normal ? g.attributes.normal.array : null;
  const U = g.attributes.uv ? g.attributes.uv.array : null;
  const n = seeds.length;
  const sx = seeds.map(s => s.x), sy = seeds.map(s => s.y), sz = seeds.map(s => s.z);
  const sq = seeds.map(s => s.lengthSq());
  const cells = Array.from({ length: n }, () => []);
  const dist = new Float64Array(n);

  const nearest = (v) => {
    let best = 0, bd = Infinity;
    for (let i = 0; i < n; i++) {
      const dx = v[0] - sx[i], dy = v[1] - sy[i], dz = v[2] - sz[i];
      const dd = dx * dx + dy * dy + dz * dz;
      if (dd < bd) { bd = dd; best = i; }
    }
    return best;
  };

  const vcount = P.length / 3;
  for (let t = 0; t < vcount; t += 3) {
    const tri = [];
    for (let k = 0; k < 3; k++) {
      const i = t + k;
      tri.push([
        P[i * 3], P[i * 3 + 1], P[i * 3 + 2],
        N ? N[i * 3] : 0, N ? N[i * 3 + 1] : 1, N ? N[i * 3 + 2] : 0,
        U ? U[i * 2] : 0, U ? U[i * 2 + 1] : 0,
      ]);
    }
    const a = nearest(tri[0]), b = nearest(tri[1]), c = nearest(tri[2]);
    if (a === b && b === c) { cells[a].push(tri); continue; }
    // Straddles a boundary: clip it into each cell it could touch (cells are convex, so this is exact).
    // A point within R of the centroid g can only belong to a cell whose seed is within dmin + 2R of g,
    // which skips most cells for the small triangles of a scanned model.
    const gx = (tri[0][0] + tri[1][0] + tri[2][0]) / 3, gy = (tri[0][1] + tri[1][1] + tri[2][1]) / 3, gz = (tri[0][2] + tri[1][2] + tri[2][2]) / 3;
    let R = 0;
    for (const v of tri) R = Math.max(R, Math.hypot(v[0] - gx, v[1] - gy, v[2] - gz));
    for (let i = 0; i < n; i++) dist[i] = Math.hypot(sx[i] - gx, sy[i] - gy, sz[i] - gz);
    let dmin = Infinity;
    for (let i = 0; i < n; i++) dmin = Math.min(dmin, dist[i]);
    for (let ci = 0; ci < n; ci++) {
      if (dist[ci] > dmin + 2 * R + 1e-9) continue;
      let poly = tri;
      for (let j = 0; j < n && poly.length >= 3; j++) {
        if (j === ci) continue;
        poly = clip(poly, sx[j] - sx[ci], sy[j] - sy[ci], sz[j] - sz[ci], (sq[j] - sq[ci]) / 2);
      }
      if (poly.length >= 3) for (let k = 1; k < poly.length - 1; k++) cells[ci].push([poly[0], poly[k], poly[k + 1]]);
    }
  }

  const out = [];
  for (const tris of cells) {
    if (tris.length === 0) continue;
    const center = new THREE.Vector3();
    let cnt = 0;
    for (const tri of tris) for (const v of tri) { center.x += v[0]; center.y += v[1]; center.z += v[2]; cnt++; }
    center.divideScalar(cnt);
    const pos = new Float32Array(cnt * 3), nor = new Float32Array(cnt * 3), uv = new Float32Array(cnt * 2);
    let p = 0;
    for (const tri of tris) for (const v of tri) {
      pos[p * 3] = v[0] - center.x; pos[p * 3 + 1] = v[1] - center.y; pos[p * 3 + 2] = v[2] - center.z;
      nor[p * 3] = v[3]; nor[p * 3 + 1] = v[4]; nor[p * 3 + 2] = v[5];
      uv[p * 2] = v[6]; uv[p * 2 + 1] = v[7];
      p++;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    geometry.computeBoundingSphere();
    // hull points for physics: subsample the vertex cloud
    const hull = [];
    const step = Math.max(1, Math.floor(cnt / 28));
    for (let i = 0; i < cnt; i += step) hull.push(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
    out.push({ geometry, center, hull, tris: tris.length });
  }
  return out;
}

function gauss(r) { return (r() + r() + r() - 1.5) / 1.5; }

// Seeds for a flat panel (local space, panel in the XY plane centered at the origin).
export function panelSeeds(w, h, impactX, impactY, count, rand = Math.random) {
  const seeds = [];
  const near = Math.ceil(count * 0.45);
  const rad = Math.min(w, h) * 0.22;
  for (let i = 0; i < count; i++) {
    let x, y;
    if (i < near) { x = impactX + gauss(rand) * rad; y = impactY + gauss(rand) * rad; }
    else { x = (rand() - 0.5) * w; y = (rand() - 0.5) * h; }
    seeds.push(new THREE.Vector3(
      THREE.MathUtils.clamp(x, -w / 2, w / 2), THREE.MathUtils.clamp(y, -h / 2, h / 2), (rand() - 0.5) * 1e-4));
  }
  return seeds;
}

// Seeds for a solid object: clustered around the impact point, the rest spread through the bounding box.
export function volumeSeeds(box, impact, count, rand = Math.random) {
  const seeds = [];
  const size = box.getSize(new THREE.Vector3());
  const rad = Math.max(size.x, size.y, size.z) * 0.18;
  const near = Math.ceil(count * 0.5);
  for (let i = 0; i < count; i++) {
    if (i < near) seeds.push(new THREE.Vector3(impact.x + gauss(rand) * rad, impact.y + gauss(rand) * rad, impact.z + gauss(rand) * rad));
    else seeds.push(new THREE.Vector3(
      box.min.x + rand() * size.x, box.min.y + rand() * size.y, box.min.z + rand() * size.z));
  }
  return seeds;
}

// Back faces of shards show the unglazed body / raw canvas instead of the painted surface.
export function withBackColor(material, hex) {
  const m = material.clone();
  m.side = THREE.DoubleSide;
  const col = new THREE.Color(hex);
  m.onBeforeCompile = (shader) => {
    shader.uniforms.backColor = { value: col };
    shader.fragmentShader = 'uniform vec3 backColor;\n' + shader.fragmentShader.replace(
      '#include <map_fragment>',
      '#include <map_fragment>\n if (!gl_FrontFacing) diffuseColor.rgb = backColor;'
    ).replace(
      '#include <emissivemap_fragment>',
      '#include <emissivemap_fragment>\n if (!gl_FrontFacing) totalEmissiveRadiance = vec3(0.0);');
  };
  m.customProgramCacheKey = () => 'back' + hex;
  return m;
}
