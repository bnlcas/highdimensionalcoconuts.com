// Sculptures built from primitives. Each builder returns a Group in "design" coordinates
// (resting on y = 0, roughly centered on x/z); the museum recenters it on its center of mass.
import * as THREE from 'three';
import { jarTexture, signatureTexture, woodGrainTexture, pumpkinTexture } from './textures.js';
import { withBackColor } from './fracture.js';

const UP = new THREE.Vector3(0, 1, 0);

function limb(group, mat, a, b, r) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  const dir = B.clone().sub(A);
  const len = dir.length();
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 6, 14), mat);
  m.position.copy(A).add(B).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(UP, dir.normalize());
  group.add(m);
  return m;
}

// tapered limb (cone frustum) from a (radius r0) to b (radius r1)
function cone(group, mat, a, b, r0, r1) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  const dir = B.clone().sub(A);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, dir.length(), 20, 1), mat);
  m.position.copy(A).add(B).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(UP, dir.normalize());
  group.add(m);
  return m;
}

function box(group, mat, size, p, rotY = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(...size), mat);
  m.position.set(...p); m.rotation.y = rotY;
  group.add(m);
  return m;
}

function plate(group, mat, pts, depth, pos, rot) {
  const shape = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 6 });
  geo.translate(0, 0, -depth / 2);
  const m = new THREE.Mesh(geo, mat);
  m.position.set(...pos); m.rotation.set(...rot);
  group.add(m);
  return m;
}

function blob(group, mat, p, r, s = [1, 1, 1]) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), mat);
  m.position.set(...p);
  m.scale.set(...s);
  group.add(m);
  return m;
}

export const MATERIALS = {
  bronze: () => new THREE.MeshStandardMaterial({ color: 0x5b4630, metalness: 0.85, roughness: 0.42 }),
  marble: () => new THREE.MeshPhysicalMaterial({ color: 0xf3f0ea, roughness: 0.28, clearcoat: 0.4, clearcoatRoughness: 0.3 }),
  limestone: () => new THREE.MeshStandardMaterial({ color: 0xcfc3a8, roughness: 0.9 }),
  porcelain: (map) => new THREE.MeshPhysicalMaterial({
    color: 0xffffff, map: map || null, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.05, side: THREE.DoubleSide,
  }),
  patina: () => new THREE.MeshStandardMaterial({ color: 0x4a4834, metalness: 0.8, roughness: 0.5 }),
  wood: () => withBackColor(new THREE.MeshStandardMaterial({ map: woodGrainTexture(), roughness: 0.55 }), 0xc9dde8),
  calderRed: () => new THREE.MeshStandardMaterial({ color: 0xc8301f, metalness: 0.3, roughness: 0.5, side: THREE.DoubleSide }),
  balloon: () => new THREE.MeshPhysicalMaterial({
    color: 0x2a62d6, metalness: 0.75, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.03,
  }),
};

export const BUILDERS = {
  thinker() {
    const g = new THREE.Group(), m = MATERIALS.bronze();
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.5, 1), m);
    rock.scale.set(0.95, 0.66, 0.85); rock.position.set(0, 0.33, 0.02); rock.rotation.y = 0.4;
    g.add(rock);
    blob(g, m, [0, 0.72, -0.05], 0.17, [1.25, 0.8, 1]);
    limb(g, m, [0, 0.78, -0.08], [0, 1.15, 0.12], 0.17);
    blob(g, m, [0, 1.1, 0.1], 0.16, [1.4, 1, 0.9]);
    limb(g, m, [0, 1.2, 0.16], [0.02, 1.28, 0.27], 0.065);
    blob(g, m, [0.02, 1.34, 0.31], 0.115, [0.92, 1.05, 1]);
    // legs
    limb(g, m, [-0.12, 0.72, 0], [-0.15, 0.74, 0.42], 0.088);
    limb(g, m, [0.12, 0.72, 0], [0.16, 0.76, 0.42], 0.088);
    limb(g, m, [-0.15, 0.72, 0.44], [-0.2, 0.1, 0.5], 0.066);
    limb(g, m, [0.16, 0.74, 0.44], [0.2, 0.1, 0.48], 0.066);
    for (const x of [-0.2, 0.2]) {
      const f = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.06, 0.22), m);
      f.position.set(x, 0.06, 0.55); g.add(f);
    }
    // left arm resting over the left knee
    limb(g, m, [0.21, 1.12, 0.1], [0.25, 0.87, 0.32], 0.062);
    limb(g, m, [0.25, 0.87, 0.32], [0.19, 0.8, 0.6], 0.052);
    blob(g, m, [0.18, 0.79, 0.64], 0.055);
    // right arm: elbow on the left knee, fist under the chin
    limb(g, m, [-0.21, 1.12, 0.1], [0.1, 0.84, 0.42], 0.062);
    limb(g, m, [0.1, 0.84, 0.42], [0.04, 1.2, 0.37], 0.052);
    blob(g, m, [0.035, 1.23, 0.37], 0.058);
    g.scale.setScalar(1.25);
    return flatten(g);
  },

  bird() {
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, 0.2, 24), MATERIALS.limestone());
    base.position.y = 0.1; g.add(base);
    const prof = [[0, 0], [0.04, 0], [0.028, 0.06], [0.022, 0.14], [0.028, 0.22], [0.042, 0.4], [0.066, 0.7],
      [0.078, 0.9], [0.072, 1.04], [0.054, 1.15], [0.03, 1.24], [0.012, 1.3], [0, 1.32]]
      .map(([r, y]) => new THREE.Vector2(r, y));
    const lathe = new THREE.LatheGeometry(prof, 36);
    const bird = new THREE.Mesh(lathe, MATERIALS.marble());
    bird.position.y = 0.2; bird.scale.set(1, 1, 0.72); bird.rotation.z = -0.05;
    g.add(bird);
    return flatten(g);
  },

  jar() {
    const g = new THREE.Group();
    const prof = [[0, 0.004], [0.085, 0], [0.09, 0.012], [0.11, 0.04], [0.15, 0.09], [0.165, 0.14], [0.16, 0.18],
      [0.135, 0.22], [0.1, 0.245], [0.085, 0.255], [0.088, 0.268], [0.093, 0.275]]
      .map(([r, y]) => new THREE.Vector2(r, y));
    const m = new THREE.Mesh(new THREE.LatheGeometry(prof, 48), MATERIALS.porcelain(jarTexture()));
    g.add(m);
    return flatten(g);
  },

  fountain() {
    const g = new THREE.Group();
    const mat = MATERIALS.porcelain();
    const bowl = new THREE.Mesh(new THREE.SphereGeometry(1, 36, 24, 0, Math.PI * 2, 0, Math.PI * 0.62), mat);
    bowl.scale.set(0.2, 0.3, 0.17);
    bowl.rotation.x = Math.PI + 0.6;
    bowl.position.y = 0.2;
    g.add(bowl);
    const lip = new THREE.Mesh(new THREE.TorusGeometry(1, 0.06, 10, 40), mat);
    lip.scale.set(0.16, 0.13, 0.2);
    lip.rotation.x = -Math.PI / 2 + 0.6 + Math.PI / 2 - 0.05;
    lip.position.set(0, 0.29, 0.13);
    g.add(lip);
    const inlet = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.08, 16), mat);
    inlet.position.set(0, 0.15, -0.21); inlet.rotation.x = 1.1;
    g.add(inlet);
    const sig = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.045), new THREE.MeshBasicMaterial({
      map: signatureTexture(), transparent: true, depthWrite: false,
      polygonOffset: true, polygonOffsetFactor: -2,
    }));
    sig.position.set(-0.11, 0.15, 0.13); sig.rotation.set(-0.3, -0.7, 0);
    sig.userData.decor = true;
    g.add(sig);
    return flatten(g);
  },

  balloonDog() {
    const g = new THREE.Group(), m = MATERIALS.balloon();
    limb(g, m, [-0.1, 0.2, 0], [0.08, 0.2, 0], 0.05);
    for (const z of [-0.045, 0.045]) {
      limb(g, m, [0.08, 0.17, z], [0.1, 0.035, z * 1.3], 0.038);
      limb(g, m, [-0.1, 0.17, z], [-0.12, 0.035, z * 1.3], 0.038);
      limb(g, m, [0.13, 0.37, z * 0.6], [0.1, 0.45, z * 1.1], 0.028);
    }
    limb(g, m, [0.1, 0.22, 0], [0.14, 0.33, 0], 0.038);
    blob(g, m, [0.14, 0.355, 0], 0.045);
    limb(g, m, [0.16, 0.355, 0], [0.245, 0.335, 0], 0.034);
    limb(g, m, [-0.12, 0.22, 0], [-0.17, 0.3, 0], 0.028);
    for (const p of [[0.09, 0.2, 0], [-0.11, 0.2, 0], [0.12, 0.29, 0]]) blob(g, m, p, 0.022);
    g.scale.setScalar(1.15);
    return flatten(g);
  },

  david() {
    const g = new THREE.Group(), m = MATERIALS.marble();
    box(g, m, [0.95, 0.26, 0.75], [0, 0.13, 0]);
    limb(g, m, [-0.17, 0.26, -0.11], [-0.15, 0.68, -0.1], 0.075);          // tree stump support
    // right leg carries the weight, left leg relaxed (contrapposto)
    limb(g, m, [-0.1, 1.0, 0], [-0.115, 0.58, 0.02], 0.088);
    limb(g, m, [-0.115, 0.58, 0.02], [-0.12, 0.32, 0], 0.066);
    box(g, m, [0.1, 0.06, 0.25], [-0.12, 0.29, 0.06]);
    limb(g, m, [0.1, 1.0, 0], [0.17, 0.6, 0.08], 0.088);
    limb(g, m, [0.17, 0.6, 0.08], [0.21, 0.32, -0.05], 0.066);
    box(g, m, [0.1, 0.06, 0.25], [0.22, 0.29, 0.0], 0.3);
    blob(g, m, [0, 1.03, 0], 0.15, [1.25, 0.8, 0.85]);
    limb(g, m, [0, 1.08, 0], [0.01, 1.42, 0], 0.15);
    blob(g, m, [0.01, 1.38, 0.02], 0.16, [1.35, 1, 0.78]);
    limb(g, m, [0.01, 1.52, 0], [0.02, 1.63, 0.01], 0.06);
    blob(g, m, [0.035, 1.74, 0.025], 0.1, [0.95, 1.1, 1.05]);
    blob(g, m, [0.02, 1.79, -0.01], 0.105, [1.02, 0.85, 1]);              // curls
    // right arm hangs with an oversized hand; left hand holds the sling at the shoulder
    limb(g, m, [-0.21, 1.48, 0], [-0.27, 1.2, 0], 0.052);
    limb(g, m, [-0.27, 1.2, 0], [-0.28, 0.96, 0.03], 0.046);
    blob(g, m, [-0.28, 0.9, 0.03], 0.066, [0.8, 1.25, 0.9]);
    limb(g, m, [0.21, 1.48, 0], [0.31, 1.26, 0.05], 0.052);
    limb(g, m, [0.31, 1.26, 0.05], [0.16, 1.5, 0.1], 0.046);
    blob(g, m, [0.14, 1.53, 0.1], 0.056);
    limb(g, m, [0.14, 1.55, 0.06], [-0.2, 1.1, -0.12], 0.012);             // sling over the back
    g.scale.setScalar(2.75);
    return flatten(g);
  },

  selene() {
    const g = new THREE.Group(), m = MATERIALS.marble();
    box(g, m, [0.46, 0.12, 0.3], [-0.14, 0.06, 0]);
    cone(g, m, [-0.24, 0.12, 0], [-0.04, 0.4, 0], 0.16, 0.12);             // neck
    cone(g, m, [-0.02, 0.44, 0], [0.4, 0.21, 0], 0.12, 0.07);              // long head tapering to the muzzle
    blob(g, m, [0.42, 0.2, 0], 0.075, [1.05, 0.95, 0.85]);
    for (const z of [-0.035, 0.035]) blob(g, m, [0.47, 0.22, z], 0.03);   // flared nostrils
    limb(g, m, [0.18, 0.2, 0], [0.4, 0.12, 0], 0.04);                      // open jaw
    for (const z of [-0.085, 0.085]) blob(g, m, [0.1, 0.43, z], 0.036);   // bulging eyes
    for (const z of [-0.05, 0.05]) cone(g, m, [-0.04, 0.53, z], [-0.1, 0.66, z * 1.4], 0.03, 0.006);
    limb(g, m, [-0.26, 0.28, 0], [-0.02, 0.55, 0], 0.035);                 // mane crest
    return flatten(g);
  },

  moore() {
    const g = new THREE.Group(), m = MATERIALS.patina();
    box(g, m, [2.05, 0.06, 0.8], [0.1, 0.03, 0]);
    blob(g, m, [0.62, 0.38, 0], 0.32, [1.55, 0.9, 0.8]);                   // raised knees
    blob(g, m, [0.98, 0.24, 0.04], 0.22, [1.3, 0.8, 0.95]);
    const hip = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.13, 16, 36), m);
    hip.position.set(0.14, 0.38, 0); hip.scale.set(1, 0.85, 1.3);
    g.add(hip);
    blob(g, m, [-0.32, 0.56, 0], 0.3, [0.85, 1.3, 0.7]).rotation.z = 0.35; // torso
    blob(g, m, [-0.52, 0.98, 0.03], 0.1, [1, 1.25, 0.8]);                 // head
    blob(g, m, [-0.66, 0.26, 0], 0.2, [1.3, 0.9, 0.95]);                   // elbow support
    limb(g, m, [-0.5, 0.5, 0.18], [-0.68, 0.22, 0.2], 0.07);
    g.scale.setScalar(1.08);
    return flatten(g);
  },

  hepworth() {
    const g = new THREE.Group(), m = MATERIALS.wood();
    box(g, new THREE.MeshStandardMaterial({ color: 0x3b2a1d, roughness: 0.6 }), [0.36, 0.04, 0.32], [0, 0.02, 0]);
    const outer = new THREE.Mesh(new THREE.SphereGeometry(0.21, 40, 24, 0, Math.PI * 1.5, 0.12, Math.PI - 0.24), m);
    outer.position.y = 0.25; outer.rotation.set(0, Math.PI * 0.75, 0.2);
    g.add(outer);
    const inner = new THREE.Mesh(new THREE.SphereGeometry(0.13, 32, 18, 0, Math.PI * 1.1, 0.2, Math.PI - 0.4), m);
    inner.position.set(0.02, 0.25, -0.02); inner.rotation.set(0, Math.PI * 1.6, -0.15);
    g.add(inner);
    const strMat = new THREE.MeshStandardMaterial({ color: 0xf2efe6, roughness: 0.8 });
    for (let i = 0; i < 7; i++) {
      const t = (i / 6 - 0.5) * 2.2;
      const s = limb(g, strMat, [-0.15, 0.25 + t * 0.07, 0.14], [0.15, 0.25 - t * 0.05, 0.14], 0.0025);
      s.userData.decor = true;
    }
    return flatten(g);
  },

  calder() {
    const g = new THREE.Group(), m = MATERIALS.calderRed(), d = 0.03;
    plate(g, m, [[-1.0, 0], [-0.72, 0], [-0.15, 1.45], [0.35, 2.35], [0.12, 2.5], [-0.45, 1.5]], d, [0, 0, 0], [0, 0.45, 0]);
    plate(g, m, [[0.95, 0], [1.2, 0], [0.45, 1.35], [0.25, 2.15], [0.02, 2.05], [0.55, 1.0]], d, [0, 0, 0], [0, -0.9, 0]);
    plate(g, m, [[-0.35, 1.75], [0.85, 1.95], [1.35, 2.65], [0.15, 2.25]], d, [0, 0, 0], [0, 1.4, 0]);
    plate(g, m, [[-0.45, 0], [0.45, 0], [0.05, 0.85]], d, [0, 0, -0.05], [0, 2.1, 0]);
    const bolt = new THREE.MeshStandardMaterial({ color: 0x8a1f14, metalness: 0.6, roughness: 0.4 });
    for (const [x, y, z] of [[-0.1, 1.5, 0.05], [0.25, 1.9, -0.05], [0.1, 2.2, 0.02]]) {
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.09, 10), bolt);
      b.position.set(x, y, z); b.rotation.x = Math.PI / 2; b.userData.decor = true;
      g.add(b);
    }
    return flatten(g);
  },

  // Cleopatra slumped on her throne, one arm hanging, head fallen back
  cleopatra() {
    const g = new THREE.Group(), m = MATERIALS.marble();
    box(g, m, [0.95, 0.12, 0.85], [0, 0.06, 0]);                       // base
    box(g, m, [0.8, 0.5, 0.65], [0, 0.37, -0.05]);                     // seat block
    box(g, m, [0.8, 0.95, 0.12], [0, 0.95, -0.36]);                    // high throne back
    for (const x of [-0.42, 0.42]) {
      box(g, m, [0.1, 0.25, 0.6], [x, 0.74, -0.05]);                   // armrests
      blob(g, m, [x, 0.92, 0.22], 0.07, [0.8, 1, 1.2]);                // sphinx heads (simplified)
    }
    const robe = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.62, 24, 1, true), m);
    robe.position.set(0, 0.62, 0.12); robe.rotation.x = -0.25;
    g.add(robe);
    limb(g, m, [0, 0.72, -0.12], [0.03, 1.12, -0.2], 0.14);           // torso leaning back
    blob(g, m, [0.03, 1.06, -0.12], 0.13, [1.25, 1, 0.8]);
    limb(g, m, [0.04, 1.2, -0.22], [0.07, 1.3, -0.27], 0.05);         // neck
    blob(g, m, [0.09, 1.38, -0.28], 0.095, [0.95, 1.05, 1]);          // head tipped back
    blob(g, m, [0.09, 1.47, -0.3], 0.09, [1.1, 0.4, 1.1]);            // headdress
    limb(g, m, [-0.17, 1.12, -0.18], [-0.35, 0.82, 0.02], 0.045);      // arm hanging over the side
    limb(g, m, [-0.35, 0.82, 0.02], [-0.42, 0.55, 0.1], 0.04);
    limb(g, m, [0.17, 1.12, -0.18], [0.2, 0.86, 0.12], 0.045);        // arm in the lap
    limb(g, m, [0.2, 0.86, 0.12], [0.02, 0.8, 0.25], 0.04);
    limb(g, m, [0.02, 0.8, 0.25], [0.08, 0.84, 0.32], 0.012);         // the asp
    for (const x of [-0.1, 0.1]) box(g, m, [0.1, 0.07, 0.22], [x, 0.16, 0.42]);  // feet
    return flatten(g);
  },

  pumpkin() {
    const g = new THREE.Group();
    const tex = pumpkinTexture();
    const mat = new THREE.MeshPhysicalMaterial({
      map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.25, roughness: 0.3, clearcoat: 0.8, side: THREE.DoubleSide,
    });
    const geo = new THREE.SphereGeometry(0.6, 64, 32);
    const p = geo.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const a = Math.atan2(v.z, v.x);
      const rib = 1 + 0.07 * Math.abs(Math.cos(a * 4));       // eight lobes
      v.x *= rib; v.z *= rib; v.y *= 0.78;
      if (v.y > 0.38) v.y -= (v.y - 0.38) * 0.6;               // dimple at the top
      p.setXYZ(i, v.x, v.y + 0.47, v.z);
    }
    geo.computeVertexNormals();
    g.add(new THREE.Mesh(geo, mat));
    cone(g, new THREE.MeshPhysicalMaterial({ color: 0x1d1a12, roughness: 0.4, clearcoat: 0.6 }), [0, 0.84, 0], [0.04, 1.08, 0.02], 0.09, 0.055);
    return flatten(g);
  },
};

// Bake child transforms (including the group's scale) into geometry so every child is a plain
// mesh at the group origin. That makes fracturing straightforward later.
function flatten(group) {
  group.updateMatrixWorld(true);
  const out = new THREE.Group();
  group.traverse((o) => {
    if (!o.isMesh) return;
    const geo = o.geometry.clone().applyMatrix4(o.matrixWorld);
    const m = new THREE.Mesh(geo.index ? geo.toNonIndexed() : geo, o.material);
    m.userData = { ...o.userData };
    out.add(m);
  });
  return out;
}
