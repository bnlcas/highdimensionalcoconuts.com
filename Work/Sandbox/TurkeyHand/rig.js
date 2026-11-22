// Poses the WebXR "generic-hand" skinned mesh from MediaPipe's 21 hand
// landmarks, and smooths those landmarks.
//
// MediaPipe gives joint positions only, no orientations, so rotations are
// reconstructed: the wrist gets a full frame from the palm (wrist, index,
// middle and pinky knuckles), and every finger bone takes the smallest
// rotation that swings its parent's frame onto the observed bone direction,
// inheriting roll from the palm. Fingers barely roll, so this holds up; the
// thumb does roll, so it will be the wonky one.

import * as THREE from "three";

// ---------------------------------------------------------------------------
// Smoothing: an independent One Euro filter (Casiez et al. 2012) per axis per
// landmark, so depth (much noisier than x/y) can be smoothed harder.
// ---------------------------------------------------------------------------

class OneEuro {
  constructor() { this.x = null; this.dx = 0; }

  filter(x, dt, minCutoff, beta, dCutoff = 1) {
    if (this.x === null || !(dt > 0)) { this.x = x; this.dx = 0; return x; }
    const alpha = (fc) => 1 / (1 + 1 / (2 * Math.PI * fc * dt));
    this.dx += alpha(dCutoff) * ((x - this.x) / dt - this.dx);
    this.x += alpha(minCutoff + beta * Math.abs(this.dx)) * (x - this.x);
    return this.x;
  }
}

export class LandmarkSmoother {
  constructor(n = 21) {
    this.filters = Array.from({ length: n * 3 }, () => new OneEuro());
    this.t = null;
  }

  reset() {
    for (const f of this.filters) f.x = null;
    this.t = null;
  }

  // Smooths points in place. `unit` normalizes coordinates (e.g. frame width)
  // so cutoffs and betas don't depend on video resolution.
  apply(points, tSec, unit, p) {
    const dt = this.t === null ? 0 : tSec - this.t;
    this.t = tSec;
    points.forEach((v, i) => {
      const f = this.filters;
      v.x = f[i * 3].filter(v.x / unit, dt, p.xyMinCutoff, p.xyBeta) * unit;
      v.y = f[i * 3 + 1].filter(v.y / unit, dt, p.xyMinCutoff, p.xyBeta) * unit;
      v.z = f[i * 3 + 2].filter(v.z / unit, dt, p.zMinCutoff, p.zBeta) * unit;
    });
  }
}

// ---------------------------------------------------------------------------
// Rig
// ---------------------------------------------------------------------------

// MediaPipe landmark index for each WebXR joint. The finger metacarpal joints
// sit inside the palm and have no landmark.
const LANDMARK = {
  "wrist": 0,
  "thumb-metacarpal": 1, "thumb-phalanx-proximal": 2, "thumb-phalanx-distal": 3, "thumb-tip": 4,
};
const FINGERS = ["index", "middle", "ring", "pinky"];
FINGERS.forEach((f, i) => {
  LANDMARK[`${f}-finger-phalanx-proximal`] = 5 + 4 * i;
  LANDMARK[`${f}-finger-phalanx-intermediate`] = 6 + 4 * i;
  LANDMARK[`${f}-finger-phalanx-distal`] = 7 + 4 * i;
  LANDMARK[`${f}-finger-tip`] = 8 + 4 * i;
});

const CHAINS = [
  ["thumb-metacarpal", "thumb-phalanx-proximal", "thumb-phalanx-distal", "thumb-tip"],
  ...FINGERS.map((f) => ["metacarpal", "phalanx-proximal", "phalanx-intermediate", "phalanx-distal", "tip"]
    .map((s) => `${f}-finger-${s}`)),
];

const _x = new THREE.Vector3(), _y = new THREE.Vector3(), _z = new THREE.Vector3();

// Orthonormal palm frame: y along wrist -> middle knuckle, x toward the index
// side, z = x × y (out of the palm or the back, depending on chirality).
function palmBasis(wrist, index, middle, pinky, out) {
  _y.subVectors(middle, wrist).normalize();
  _x.subVectors(index, pinky);
  _x.addScaledVector(_y, -_x.dot(_y)).normalize();
  _z.crossVectors(_x, _y);
  return out.makeBasis(_x, _y, _z);
}

function palmSize(wrist, index, middle, ring, pinky) {
  return wrist.distanceTo(index) + wrist.distanceTo(middle) + wrist.distanceTo(ring) +
    wrist.distanceTo(pinky) + index.distanceTo(pinky);
}

// I + (k - 1) u uᵀ: stretch by k along unit vector u.
function stretchMatrix(u, k, out) {
  const c = k - 1;
  return out.set(
    1 + c * u.x * u.x, c * u.x * u.y, c * u.x * u.z, 0,
    c * u.y * u.x, 1 + c * u.y * u.y, c * u.y * u.z, 0,
    c * u.z * u.x, c * u.z * u.y, 1 + c * u.z * u.z, 0,
    0, 0, 0, 1,
  );
}

const _m = new THREE.Matrix4(), _m2 = new THREE.Matrix4(), _stretch = new THREE.Matrix4();
const _d = new THREE.Vector3(), _d0 = new THREE.Vector3(), _sv = new THREE.Vector3();

export class HandRig {
  constructor(gltf, texture) {
    this.root = gltf.scene;
    this.root.traverse((o) => { if (o.isSkinnedMesh) this.mesh = o; });
    this.mesh.material = new THREE.MeshBasicMaterial({ map: texture });
    this.mesh.frustumCulled = false; // bounds are stale once bones move

    // All bones are direct children of an identity "Armature" node, so a
    // bone's local matrix is its world matrix. Rest (bind) transforms come
    // from the inverse bind matrices; `local` = T(-joint position) · bind
    // world, so pose() only has to apply translate · rotate · scale on top.
    const { bones, boneInverses } = this.mesh.skeleton;
    this.bones = {};
    this.rest = {};
    bones.forEach((bone, i) => {
      bone.matrixAutoUpdate = false;
      const world = boneInverses[i].clone().invert();
      const pos = new THREE.Vector3().setFromMatrixPosition(world);
      this.bones[bone.name] = bone;
      this.rest[bone.name] = {
        pos,
        local: new THREE.Matrix4().makeTranslation(-pos.x, -pos.y, -pos.z).multiply(world),
      };
    });

    const r = (name) => this.rest[name].pos;
    const knuckle = (f) => r(`${f}-finger-phalanx-proximal`);
    this.restBasis = palmBasis(r("wrist"), knuckle("index"), knuckle("middle"), knuckle("pinky"), new THREE.Matrix4());
    this.restSize = palmSize(r("wrist"), ...FINGERS.map(knuckle));
    this.scale = 1; // scene units per rest-model meter; set by pose()
    this.qWrist = new THREE.Quaternion();
  }

  // P: 21 landmarks in scene space. stretch: lengthen/shorten each bone to
  // land exactly on the next landmark (keeps 2D alignment tight).
  pose(P, stretch) {
    const s = palmSize(P[0], P[5], P[9], P[13], P[17]) / this.restSize;
    this.scale = s;

    palmBasis(P[0], P[5], P[9], P[17], _m).multiply(_m2.copy(this.restBasis).transpose());
    this.qWrist.setFromRotationMatrix(_m);
    this.setBone("wrist", P[0], this.qWrist, s, null, 1);

    const wristRest = this.rest.wrist.pos;
    for (const chain of CHAINS) {
      const pts = chain.map((name) => name in LANDMARK
        ? P[LANDMARK[name]]
        // Metacarpal joint: carried rigidly by the palm.
        : _sv.subVectors(this.rest[name].pos, wristRest).multiplyScalar(s)
          .applyQuaternion(this.qWrist).add(P[0]).clone());

      let q = this.qWrist;
      for (let k = 0; k < chain.length; k += 1) {
        const name = chain[k];
        if (k === chain.length - 1) { this.setBone(name, pts[k], q, s, null, 1); break; }
        _d0.subVectors(this.rest[chain[k + 1]].pos, this.rest[name].pos);
        _d.subVectors(pts[k + 1], pts[k]);
        const restLen = _d0.length(), len = _d.length();
        _d0.divideScalar(restLen);
        const swing = new THREE.Quaternion().setFromUnitVectors(
          _x.copy(_d0).applyQuaternion(q), _y.copy(_d).divideScalar(len || 1));
        q = swing.multiply(q);
        const stretchK = stretch ? THREE.MathUtils.clamp(len / (s * restLen), 0.5, 2) : 1;
        this.setBone(name, pts[k], q, s, _d0, stretchK);
      }
    }
  }

  setBone(name, p, q, s, axis, k) {
    const bone = this.bones[name];
    bone.matrix.compose(p, q, _sv.set(s, s, s));
    if (axis && k !== 1) bone.matrix.multiply(stretchMatrix(axis, k, _stretch));
    bone.matrix.multiply(this.rest[name].local);
    bone.matrixWorldNeedsUpdate = true;
  }
}
