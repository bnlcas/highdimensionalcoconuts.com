// Particles, tumbling chips, surface decals and screen shake.
import * as THREE from 'three';

const VERT = `
attribute float size;
attribute vec4 color4;
varying vec4 vColor;
uniform float scale;
void main() {
  vColor = color4;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = size * scale / max(0.05, -mv.z);
  gl_Position = projectionMatrix * mv;
}`;
const FRAG = `
varying vec4 vColor;
uniform float soft;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  if (d > 0.5) discard;
  float a = vColor.a * mix(1.0, smoothstep(0.5, 0.05, d), soft);
  gl_FragColor = vec4(vColor.rgb, a);
}`;

class ParticleSystem {
  constructor(scene, cap, additive, soft) {
    this.cap = cap;
    this.n = 0;
    this.p = new Float32Array(cap * 3);
    this.v = new Float32Array(cap * 3);
    this.c0 = new Float32Array(cap * 4);
    this.c1 = new Float32Array(cap * 4);
    this.life = new Float32Array(cap);
    this.max = new Float32Array(cap);
    this.s0 = new Float32Array(cap);
    this.s1 = new Float32Array(cap);
    this.grav = new Float32Array(cap);
    this.drag = new Float32Array(cap);
    this.geo = new THREE.BufferGeometry();
    this.posAttr = new THREE.BufferAttribute(new Float32Array(cap * 3), 3).setUsage(THREE.DynamicDrawUsage);
    this.colAttr = new THREE.BufferAttribute(new Float32Array(cap * 4), 4).setUsage(THREE.DynamicDrawUsage);
    this.sizeAttr = new THREE.BufferAttribute(new Float32Array(cap), 1).setUsage(THREE.DynamicDrawUsage);
    this.geo.setAttribute('position', this.posAttr);
    this.geo.setAttribute('color4', this.colAttr);
    this.geo.setAttribute('size', this.sizeAttr);
    this.mat = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: FRAG,
      uniforms: { scale: { value: 600 }, soft: { value: soft ? 1 : 0.15 } },
      transparent: true, depthWrite: false,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    this.points = new THREE.Points(this.geo, this.mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = additive ? 3 : 2;
    scene.add(this.points);
  }

  spawn(o) {
    if (this.n >= this.cap) return;
    const i = this.n++;
    this.p.set([o.x, o.y, o.z], i * 3);
    this.v.set([o.vx || 0, o.vy || 0, o.vz || 0], i * 3);
    const a = o.color, b = o.color1 || o.color;
    this.c0.set([a.r, a.g, a.b, o.alpha ?? 1], i * 4);
    this.c1.set([b.r, b.g, b.b, o.alpha1 ?? 0], i * 4);
    this.life[i] = 0; this.max[i] = o.life || 1;
    this.s0[i] = o.size || 0.05; this.s1[i] = o.size1 ?? this.s0[i];
    this.grav[i] = o.gravity ?? 9.8; this.drag[i] = o.drag ?? 0.5;
  }

  _kill(i) {
    const j = --this.n;
    if (i === j) return;
    const cp3 = (arr) => { arr[i * 3] = arr[j * 3]; arr[i * 3 + 1] = arr[j * 3 + 1]; arr[i * 3 + 2] = arr[j * 3 + 2]; };
    const cp4 = (arr) => { for (let k = 0; k < 4; k++) arr[i * 4 + k] = arr[j * 4 + k]; };
    cp3(this.p); cp3(this.v); cp4(this.c0); cp4(this.c1);
    this.life[i] = this.life[j]; this.max[i] = this.max[j];
    this.s0[i] = this.s0[j]; this.s1[i] = this.s1[j];
    this.grav[i] = this.grav[j]; this.drag[i] = this.drag[j];
  }

  update(dt) {
    const P = this.posAttr.array, C = this.colAttr.array, S = this.sizeAttr.array;
    for (let i = this.n - 1; i >= 0; i--) {
      this.life[i] += dt;
      if (this.life[i] >= this.max[i]) { this._kill(i); continue; }
      const k = Math.exp(-this.drag[i] * dt);
      this.v[i * 3] *= k; this.v[i * 3 + 2] *= k;
      this.v[i * 3 + 1] = this.v[i * 3 + 1] * k - this.grav[i] * dt;
      this.p[i * 3] += this.v[i * 3] * dt;
      this.p[i * 3 + 1] += this.v[i * 3 + 1] * dt;
      this.p[i * 3 + 2] += this.v[i * 3 + 2] * dt;
      if (this.p[i * 3 + 1] < 0.01 && this.grav[i] > 0) {
        this.p[i * 3 + 1] = 0.01; this.v[i * 3 + 1] *= -0.25;
        this.v[i * 3] *= 0.6; this.v[i * 3 + 2] *= 0.6;
      }
    }
    for (let i = 0; i < this.n; i++) {
      const t = this.life[i] / this.max[i];
      P[i * 3] = this.p[i * 3]; P[i * 3 + 1] = this.p[i * 3 + 1]; P[i * 3 + 2] = this.p[i * 3 + 2];
      for (let k = 0; k < 4; k++) C[i * 4 + k] = this.c0[i * 4 + k] + (this.c1[i * 4 + k] - this.c0[i * 4 + k]) * t;
      S[i] = this.s0[i] + (this.s1[i] - this.s0[i]) * t;
    }
    this.geo.setDrawRange(0, this.n);
    this.posAttr.needsUpdate = this.colAttr.needsUpdate = this.sizeAttr.needsUpdate = true;
  }
}

// Little flat chips (glass, porcelain, gilt, splinters) that tumble and settle on the floor.
class Chips {
  constructor(scene, cap) {
    this.cap = cap;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0.5, 0, -0.45, -0.4, 0, 0.5, -0.3, 0], 3));
    g.computeVertexNormals();
    this.mesh = new THREE.InstancedMesh(g, new THREE.MeshStandardMaterial({
      side: THREE.DoubleSide, roughness: 0.3, metalness: 0.2,
    }), cap);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.count = 0;
    this.mesh.frustumCulled = false;
    this.mesh.castShadow = false;
    scene.add(this.mesh);
    this.items = [];
    this.dummy = new THREE.Object3D();
    this.col = new THREE.Color();
    this.mesh.setColorAt(0, this.col);
  }

  spawn(pos, vel, size, color, life = 6) {
    if (this.items.length >= this.cap) this.items.shift();
    this.items.push({
      p: pos.clone(), v: vel.clone(), size, color: color.clone(), life, t: 0,
      q: new THREE.Quaternion().random(), w: new THREE.Vector3().randomDirection().multiplyScalar(8 + Math.random() * 10),
    });
  }

  update(dt) {
    const d = this.dummy, dq = new THREE.Quaternion();
    let n = 0;
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      it.t += dt;
      if (it.t > it.life) { this.items.splice(i, 1); continue; }
    }
    for (const it of this.items) {
      if (it.p.y > 0.005 || it.v.y > 0) {
        it.v.y -= 9.8 * dt;
        it.p.addScaledVector(it.v, dt);
        dq.setFromAxisAngle(it.w.clone().normalize(), it.w.length() * dt);
        it.q.premultiply(dq);
        if (it.p.y < 0.005) {
          it.p.y = 0.005;
          if (Math.abs(it.v.y) > 1) { it.v.y *= -0.3; it.v.x *= 0.5; it.v.z *= 0.5; it.w.multiplyScalar(0.5); }
          else { it.v.set(0, 0, 0); it.q.setFromEuler(new THREE.Euler(-Math.PI / 2, 0, Math.random() * 6)); }
        }
      }
      const fade = Math.min(1, (it.life - it.t) / 0.8);
      d.position.copy(it.p); d.quaternion.copy(it.q); d.scale.setScalar(it.size * fade);
      d.updateMatrix();
      this.mesh.setMatrixAt(n, d.matrix);
      this.mesh.setColorAt(n, it.color);
      n++;
    }
    this.mesh.count = n;
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }
}

const C = (hex) => new THREE.Color(hex);

export class Effects {
  constructor(scene) {
    this.scene = scene;
    this.add = new ParticleSystem(scene, 2500, true, true);
    this.norm = new ParticleSystem(scene, 3500, false, true);
    this.flat = new ParticleSystem(scene, 2500, false, false);
    this.chips = new Chips(scene, 700);
    this.decals = [];
    this.decalMats = new Map();
    this.decalGeo = new THREE.PlaneGeometry(1, 1);
    this.shakeAmt = 0;
    this.tmp = new THREE.Vector3();
  }

  setScale(px) { for (const s of [this.add, this.norm, this.flat]) s.mat.uniforms.scale.value = px; }

  shake(a) { this.shakeAmt = Math.min(0.25, this.shakeAmt + a); }

  update(dt) {
    this.add.update(dt); this.norm.update(dt); this.flat.update(dt); this.chips.update(dt);
    this.shakeAmt *= Math.exp(-dt * 7);
  }

  // ---- recipes ----
  burst(pos, normal, color, count, speed = 3, size = 0.03, opts = {}) {
    const col = color.isColor ? color : C(color);
    for (let i = 0; i < count; i++) {
      const d = this.tmp.randomDirection();
      if (normal && d.dot(normal) < 0) d.reflect(normal);
      const s = speed * (0.3 + Math.random());
      (opts.sys || this.flat).spawn({
        x: pos.x, y: pos.y, z: pos.z,
        vx: d.x * s, vy: d.y * s + (opts.up || 0), vz: d.z * s,
        color: col, alpha: 1, alpha1: opts.fade ? 0 : 1,
        size: size * (0.5 + Math.random()), size1: size * 0.6,
        life: (opts.life || 1.2) * (0.6 + Math.random() * 0.6), gravity: opts.gravity ?? 9.8, drag: opts.drag ?? 0.8,
      });
    }
  }

  dust(pos, count = 12, color = 0xd8d2c4, size = 0.25) {
    for (let i = 0; i < count; i++) {
      const d = this.tmp.randomDirection();
      this.norm.spawn({
        x: pos.x + d.x * 0.1, y: pos.y + d.y * 0.1, z: pos.z + d.z * 0.1,
        vx: d.x * 0.8, vy: Math.abs(d.y) * 0.6 + 0.2, vz: d.z * 0.8,
        color: C(color), alpha: 0.35, alpha1: 0, size: size * 0.5, size1: size * 2,
        life: 1.5 + Math.random(), gravity: -0.1, drag: 1.5,
      });
    }
  }

  sparks(pos, normal, count = 20) {
    for (let i = 0; i < count; i++) {
      const d = this.tmp.randomDirection();
      if (normal && d.dot(normal) < 0) d.reflect(normal);
      const s = 3 + Math.random() * 6;
      this.add.spawn({
        x: pos.x, y: pos.y, z: pos.z, vx: d.x * s, vy: d.y * s + 1, vz: d.z * s,
        color: C(0xffe9a8), color1: C(0xff6a00), alpha: 1, alpha1: 0,
        size: 0.025, size1: 0.01, life: 0.3 + Math.random() * 0.5, gravity: 9.8, drag: 1,
      });
    }
  }

  fire(pos, vel, spread = 0.6, big = 1) {
    const r = () => (Math.random() - 0.5) * spread;
    this.add.spawn({
      x: pos.x, y: pos.y, z: pos.z,
      vx: vel.x + r(), vy: vel.y + r() + 0.5, vz: vel.z + r(),
      color: C(0xfff0b0), color1: C(0xff3300), alpha: 0.9, alpha1: 0,
      size: 0.08 * big, size1: 0.5 * big, life: 0.35 + Math.random() * 0.35, gravity: -2.5, drag: 1.2,
    });
    if (Math.random() < 0.35) {
      this.norm.spawn({
        x: pos.x, y: pos.y + 0.1, z: pos.z,
        vx: vel.x * 0.3 + r(), vy: 1 + Math.random(), vz: vel.z * 0.3 + r(),
        color: C(0x2a2522), alpha: 0.45, alpha1: 0, size: 0.2 * big, size1: 1.0 * big,
        life: 1.5 + Math.random(), gravity: -0.6, drag: 0.8,
      });
    }
  }

  money(pos) {
    for (let i = 0; i < 10; i++) {
      const d = this.tmp.randomDirection();
      this.flat.spawn({
        x: pos.x, y: pos.y, z: pos.z, vx: d.x * 2, vy: 2 + Math.random() * 2, vz: d.z * 2,
        color: C(Math.random() < 0.5 ? 0x76b900 : 0x9be36b), alpha: 1, alpha1: 0.6,
        size: 0.04, size1: 0.04, life: 1.6, gravity: 3, drag: 2,
      });
    }
  }

  chipBurst(pos, normal, color, count, size = 0.03, speed = 3) {
    const col = C(color);
    for (let i = 0; i < count; i++) {
      const d = new THREE.Vector3().randomDirection();
      if (normal && d.dot(normal) < 0) d.reflect(normal);
      d.multiplyScalar(speed * (0.3 + Math.random()));
      d.y += 1;
      this.chips.spawn(pos, d, size * (0.5 + Math.random()), col, 5 + Math.random() * 4);
    }
  }

  // flat decal on a wall/floor
  decal(point, normal, texture, size, opacity = 1) {
    let mat = this.decalMats.get(texture);
    if (!mat) {
      mat = new THREE.MeshStandardMaterial({
        map: texture, transparent: true, depthWrite: false, roughness: 0.5,
        polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4,
      });
      this.decalMats.set(texture, mat);
    }
    const m = new THREE.Mesh(this.decalGeo, mat);
    m.position.copy(point).addScaledVector(normal, 0.004 + this.decals.length * 0.000002);
    m.lookAt(this.tmp.copy(m.position).add(normal));
    m.rotateZ(Math.random() * Math.PI * 2);
    m.scale.setScalar(size);
    m.renderOrder = 1;
    this.scene.add(m);
    this.decals.push(m);
    if (this.decals.length > 260) {
      const old = this.decals.shift();
      this.scene.remove(old);
    }
    return m;
  }
}
