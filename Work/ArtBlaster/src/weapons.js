// Instruments of destruction: definitions, first-person viewmodels, projectiles and firing.
import * as THREE from 'three';
import { soupLabelTexture } from './textures.js';

export const WEAPONS = [
  {
    id: 'lipstick', name: 'Tube of Lipstick', kind: 'draw', unlock: 0, range: 2.6,
    blurb: 'In 2007 an artist kissed an all-white Cy Twombly painting in France, leaving a red lipstick mark. She was taken to court and fined.',
  },
  {
    id: 'soup', name: 'Can of Soup', kind: 'throw', unlock: 0, cooldown: 0.42, speed: 15,
    blurb: 'Raises awareness! In 2022 climate activists began throwing soup and mashed potatoes at famous paintings. They chose works behind glass, so the art itself was never hurt.',
  },
  {
    id: 'crowbar', name: 'Crowbar', kind: 'melee', unlock: 10e6, cooldown: 0.55, range: 2.7, hitAt: 0.42,
    blurb: 'In 1990 thieves at Boston\'s Isabella Stewart Gardner Museum cut paintings from their frames. 13 works worth around $500M are still missing.',
  },
  {
    id: 'paintball', name: 'Paintball Marker', kind: 'gun', unlock: 50e6, cooldown: 0.11, speed: 60,
    blurb: 'Paintballs are gelatin shells of dye fired at about 90 m/s, roughly 200 mph.',
  },
  {
    id: 'sledge', name: 'Sledgehammer', kind: 'melee', unlock: 150e6, cooldown: 0.95, range: 2.9, hitAt: 0.5,
    blurb: 'In 1972 a man struck Michelangelo\'s Pietà 15 times with a geologist\'s hammer. It has been behind bulletproof glass ever since.',
  },
  {
    id: 'flame', name: 'Flamethrower', kind: 'stream', unlock: 500e6, range: 7.5,
    blurb: 'Fire is a museum\'s worst nightmare. In 2018 a fire at Brazil\'s National Museum destroyed most of its 20-million-object collection.',
  },
];

const PAINT_COLORS = ['#ff2d95', '#26e07f', '#ffd400', '#2fa8ff', '#ff6a00', '#b04dff'];

function std(color, opts = {}) { return new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.1, ...opts }); }

function buildViewmodels() {
  const vm = {};
  // lipstick
  {
    const g = new THREE.Group();
    const gold = std(0xd4a64a, { metalness: 0.9, roughness: 0.25 });
    const caseM = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.1, 24), gold);
    const inner = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.03, 24), gold);
    inner.position.y = 0.065;
    const bullet = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.016, 0.05, 24), std(0xc0102a, { roughness: 0.35 }));
    bullet.position.y = 0.105; bullet.rotation.z = 0.25;
    g.add(caseM, inner, bullet);
    const hold = new THREE.Group(); hold.add(g);
    g.rotation.x = -1.25;
    vm.lipstick = { obj: hold, rest: new THREE.Vector3(0.2, -0.2, -0.45) };
  }
  // soup can
  {
    const label = soupLabelTexture();
    const metal = std(0xc8c8c8, { metalness: 0.9, roughness: 0.3 });
    const geo = new THREE.CylinderGeometry(0.045, 0.045, 0.12, 32);
    const can = new THREE.Mesh(geo, [new THREE.MeshStandardMaterial({ map: label, roughness: 0.4 }), metal, metal]);
    can.rotation.set(0.15, -2.2, -0.15);
    const hold = new THREE.Group(); hold.add(can);
    vm.soup = { obj: hold, rest: new THREE.Vector3(0.27, -0.24, -0.5), can, canGeo: geo, canMats: can.material };
  }
  // crowbar
  {
    const pts = [[0, -0.42, 0], [0, 0.25, 0], [0, 0.32, 0.01], [0.015, 0.36, 0.04], [0.03, 0.37, 0.08], [0.04, 0.34, 0.11]]
      .map(p => new THREE.Vector3(...p));
    const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.012, 10), std(0xb3171d, { roughness: 0.4, metalness: 0.3 }));
    const g = new THREE.Group(); g.add(tube);
    g.rotation.set(-0.3, 0, 0.55);
    g.scale.setScalar(0.8);
    const hold = new THREE.Group(); hold.add(g);
    vm.crowbar = { obj: hold, rest: new THREE.Vector3(0.34, -0.24, -0.62) };
  }
  // paintball marker
  {
    const g = new THREE.Group();
    const dark = std(0x1d1f22, { roughness: 0.6 }), neon = std(0x39ff6a, { roughness: 0.4, emissive: 0x0a3010 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.07, 0.24), dark);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.32, 16), dark);
    barrel.rotation.x = Math.PI / 2; barrel.position.set(0, 0.015, -0.26);
    const hopper = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 12), neon);
    hopper.scale.set(0.8, 1, 1.3); hopper.position.set(0, 0.09, 0.0);
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.1, 0.04), dark);
    grip.position.set(0, -0.07, 0.06); grip.rotation.x = 0.25;
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.16, 16), std(0x9aa3ad, { metalness: 0.8, roughness: 0.3 }));
    tank.rotation.x = Math.PI / 2; tank.position.set(0, -0.03, 0.18);
    g.add(body, barrel, hopper, grip, tank);
    const hold = new THREE.Group(); hold.add(g);
    vm.paintball = { obj: hold, rest: new THREE.Vector3(0.2, -0.2, -0.42) };
  }
  // sledgehammer
  {
    const g = new THREE.Group();
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.9, 12), std(0x9a6b3c, { roughness: 0.7 }));
    handle.position.y = -0.1;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.26), std(0x3a3d42, { metalness: 0.8, roughness: 0.45 }));
    head.position.y = 0.38;
    g.add(handle, head);
    g.rotation.set(-0.35, 0.3, 0.55);
    g.scale.setScalar(0.62);
    const hold = new THREE.Group(); hold.add(g);
    vm.sledge = { obj: hold, rest: new THREE.Vector3(0.4, -0.3, -0.75) };
  }
  // flamethrower
  {
    const g = new THREE.Group();
    const steel = std(0x5d646d, { metalness: 0.8, roughness: 0.35 }), red = std(0x9e1b16, { roughness: 0.4 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.3), steel);
    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.026, 0.26, 16), steel);
    nozzle.rotation.x = Math.PI / 2; nozzle.position.set(0, 0.01, -0.27);
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.26, 20), red);
    tank.rotation.x = Math.PI / 2; tank.position.set(0, -0.07, 0.02);
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.1, 0.04), steel);
    grip.position.set(0, -0.08, 0.13); grip.rotation.x = 0.3;
    const pilot = new THREE.Mesh(new THREE.SphereGeometry(0.014, 10, 8), new THREE.MeshBasicMaterial({ color: 0x66aaff }));
    pilot.position.set(0, -0.005, -0.41);
    g.add(body, nozzle, tank, grip, pilot);
    const hold = new THREE.Group(); hold.add(g);
    vm.flame = { obj: hold, rest: new THREE.Vector3(0.2, -0.22, -0.42), pilot };
  }
  return vm;
}

export class WeaponSystem {
  constructor(ctx) {
    this.ctx = ctx;  // { scene, camera, vmScene, effects, physics, sfx, destruction, targets }
    this.vm = buildViewmodels();
    for (const k in this.vm) { this.vm[k].obj.visible = false; ctx.vmScene.add(this.vm[k].obj); }
    this.current = 1;
    this.cd = 0;
    this.anim = 0;       // generic animation timer (swing/throw/recoil)
    this.animKind = null;
    this.swingHitDone = true;
    this.projectiles = [];
    this.ray = new THREE.Raycaster();
    this.tmp = new THREE.Vector3();
    this.flameOn = false;
    this.equipT = 0;
    this.select(1);
  }

  get def() { return WEAPONS[this.current]; }

  select(i) {
    for (const k in this.vm) this.vm[k].obj.visible = false;
    this.current = i;
    this.vm[WEAPONS[i].id].obj.visible = true;
    this.anim = 0; this.animKind = null; this.equipT = 0.25;
    this.ctx.destruction.endStroke();
    if (this.flameOn) { this.flameOn = false; this.ctx.sfx.flame(false); }
  }

  aimDir() { return new THREE.Vector3(0, 0, -1).applyQuaternion(this.ctx.camera.quaternion); }

  raycast(origin, dir, far, extra) {
    this.ray.set(origin, dir);
    this.ray.near = 0; this.ray.far = far;
    const list = extra ? this.ctx.targets.concat(extra) : this.ctx.targets;
    const hits = this.ray.intersectObjects(list, false);
    return hits.length ? hits[0] : null;
  }

  // what is under the crosshair (for HUD + inspect)
  lookAt(far = 14) {
    return this.raycast(this.ctx.camera.position, this.aimDir(), far);
  }

  update(dt, firing, playerVel, t) {
    const d = this.def;
    this.cd -= dt;
    this.equipT = Math.max(0, this.equipT - dt);
    if (this.animKind) {
      this.anim += dt / (this.animKind === 'swing' ? d.cooldown : this.animKind === 'throw' ? 0.38 : 0.1);
      if (this.animKind === 'swing' && !this.swingHitDone && this.anim >= d.hitAt) { this.swingHitDone = true; this.melee(); }
      if (this.anim >= 1) { this.animKind = null; this.anim = 0; }
    }
    const canFire = firing && this.equipT <= 0;
    switch (d.kind) {
      case 'draw': this.drawing = canFire; if (canFire) this.lipstick(dt); else this.ctx.destruction.endStroke(); break;
      case 'throw': if (canFire && this.cd <= 0) { this.throwCan(playerVel); this.cd = d.cooldown; } break;
      case 'melee':
        if (canFire && this.cd <= 0) {
          this.cd = d.cooldown; this.animKind = 'swing'; this.anim = 0; this.swingHitDone = false;
          this.ctx.sfx.play('swish');
        }
        break;
      case 'gun': if (canFire && this.cd <= 0) { this.fireBall(playerVel); this.cd = d.cooldown; } break;
      case 'stream':
        if (canFire !== this.flameOn) { this.flameOn = canFire; this.ctx.sfx.flame(canFire); }
        if (canFire) this.flame(dt);
        break;
    }
    this.updateProjectiles(dt);
    this.poseViewmodel(dt, t, playerVel);
  }

  // ---------- weapon actions ----------
  lipstick(dt) {
    const dir = this.aimDir();
    const hit = this.raycast(this.ctx.camera.position, dir, this.def.range);
    if (hit) this.ctx.destruction.hit('lipstick', hit, dir, { dt });
    else this.ctx.destruction.endStroke();
  }

  spawnPoint(right = 0.22, down = 0.18, fwd = 0.5) {
    return this.ctx.camera.localToWorld(new THREE.Vector3(right, -down, -fwd));
  }

  aimTarget(far = 60) {
    const dir = this.aimDir();
    const hit = this.raycast(this.ctx.camera.position, dir, far);
    return hit ? hit.point : this.ctx.camera.position.clone().addScaledVector(dir, far);
  }

  throwCan(playerVel) {
    const v = this.vm.soup;
    const start = this.spawnPoint(0.22, 0.15, 0.45);
    const target = this.aimTarget();
    const dist = start.distanceTo(target);
    const dir = target.clone().sub(start).normalize();
    const speed = this.def.speed;
    const vel = dir.multiplyScalar(speed);
    vel.y += 9.8 * (dist / speed) * 0.5; // lob so it lands near the crosshair
    vel.add(playerVel);
    const mesh = new THREE.Mesh(v.canGeo, v.canMats);
    mesh.position.copy(start);
    mesh.castShadow = true;
    this.ctx.scene.add(mesh);
    this.projectiles.push({ kind: 'soup', mesh, vel, g: 9.8, spin: new THREE.Vector3(Math.random() * 10, Math.random() * 6, 8), age: 0 });
    this.animKind = 'throw'; this.anim = 0;
    this.ctx.sfx.play('throw');
  }

  fireBall(playerVel) {
    const start = this.spawnPoint(0.17, 0.14, 0.75);
    const target = this.aimTarget();
    const dir = target.clone().sub(start).normalize();
    dir.x += (Math.random() - 0.5) * 0.012; dir.y += (Math.random() - 0.5) * 0.012;
    const color = PAINT_COLORS[(Math.random() * PAINT_COLORS.length) | 0];
    const mesh = new THREE.Mesh(this.ballGeo ||= new THREE.SphereGeometry(0.017, 8, 6),
      new THREE.MeshBasicMaterial({ color }));
    mesh.position.copy(start);
    this.ctx.scene.add(mesh);
    const vel = dir.normalize().multiplyScalar(this.def.speed).add(playerVel);
    this.projectiles.push({ kind: 'paintball', mesh, vel, g: 2.5, color, age: 0 });
    this.animKind = 'recoil'; this.anim = 0;
    this.ctx.sfx.play('pop');
  }

  melee() {
    const cam = this.ctx.camera, base = this.aimDir();
    const debris = this.ctx.physics.bodies.filter(b => b.debris).map(b => b.mesh);
    let best = null, bestDir = base;
    for (const off of [0, -0.07, 0.07]) {
      const dir = base.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0).applyQuaternion(cam.quaternion), off);
      const hit = this.raycast(cam.position, dir, this.def.range, debris);
      if (hit && (!best || hit.distance < best.distance)) { best = hit; bestDir = dir; }
    }
    if (!best) return;
    const phys = best.object.userData.phys;
    if (phys && phys.debris) {
      const power = this.def.id === 'sledge' ? 6 : 3;
      this.ctx.physics.impulse(phys, bestDir.clone().multiplyScalar(power * Math.min(4, phys.mass + 0.3)), best.point);
      this.ctx.sfx.play('thud', 0.8);
      return;
    }
    this.ctx.destruction.hit(this.def.id, best, bestDir, {});
  }

  flame(dt) {
    const cam = this.ctx.camera, base = this.aimDir();
    const nozzle = this.spawnPoint(0.2, 0.2, 0.85);
    let mainDist = this.def.range;
    for (let i = 0; i < 3; i++) {
      const dir = base.clone();
      if (i) { dir.x += (Math.random() - 0.5) * 0.16; dir.y += (Math.random() - 0.5) * 0.12; dir.z += (Math.random() - 0.5) * 0.16; dir.normalize(); }
      const hit = this.raycast(cam.position, dir, this.def.range);
      if (hit) {
        if (i === 0) mainDist = hit.distance;
        this.ctx.destruction.hit('flame', hit, dir, { dt: dt / 3 });
        if (Math.random() < 0.6) this.ctx.effects.fire(hit.point.clone().addScaledVector(hit.face ? hit.face.normal.clone().transformDirection(hit.object.matrixWorld) : dir, 0.05), new THREE.Vector3(0, 0.5, 0), 1.2, 1.3);
      }
    }
    const speed = 13;
    const life = Math.min(0.6, mainDist / speed);
    for (let i = 0; i < 7; i++) {
      const d = base.clone();
      d.x += (Math.random() - 0.5) * 0.12; d.y += (Math.random() - 0.5) * 0.12; d.z += (Math.random() - 0.5) * 0.12;
      const s = speed * (0.75 + Math.random() * 0.4);
      const p = nozzle.clone().addScaledVector(d, Math.random() * 0.3);
      this.ctx.effects.add.spawn({
        x: p.x, y: p.y, z: p.z, vx: d.x * s, vy: d.y * s + 0.3, vz: d.z * s,
        color: new THREE.Color(0xfff3c0), color1: new THREE.Color(0xff2a00), alpha: 0.95, alpha1: 0,
        size: 0.05, size1: 0.6, life: life * (0.7 + Math.random() * 0.5), gravity: -1.5, drag: 0.6,
      });
    }
    if (Math.random() < 0.3) {
      const p = nozzle.clone().addScaledVector(base, mainDist * 0.8);
      this.ctx.effects.norm.spawn({
        x: p.x, y: p.y, z: p.z, vx: base.x, vy: 1.2, vz: base.z,
        color: new THREE.Color(0x2b2522), alpha: 0.35, alpha1: 0, size: 0.4, size1: 1.6, life: 1.8, gravity: -0.5, drag: 0.5,
      });
    }
  }

  updateProjectiles(dt) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.age += dt;
      const prev = p.mesh.position.clone();
      p.vel.y -= p.g * dt;
      const next = prev.clone().addScaledVector(p.vel, dt);
      const seg = next.clone().sub(prev);
      const len = seg.length();
      const hit = len > 0 ? this.raycast(prev, seg.normalize(), len + (p.kind === 'soup' ? 0.05 : 0.01)) : null;
      if (hit) {
        this.projectiles.splice(i, 1);
        this.impact(p, hit);
        continue;
      }
      p.mesh.position.copy(next);
      if (p.spin) p.mesh.rotation.x += p.spin.x * dt, p.mesh.rotation.z += p.spin.z * dt;
      if (p.age > 6) { this.projectiles.splice(i, 1); this.ctx.scene.remove(p.mesh); }
    }
  }

  impact(p, hit) {
    const dir = p.vel.clone().normalize();
    if (p.kind === 'paintball') {
      this.ctx.scene.remove(p.mesh);
      p.mesh.material.dispose();
      this.ctx.destruction.hit('paintball', hit, dir, { color: p.color, vel: p.vel });
      return;
    }
    // soup: splat, then the dented can bounces away as a physics body
    this.ctx.destruction.hit('soup', hit, dir, { vel: p.vel });
    const n = hit.face ? hit.face.normal.clone().transformDirection(hit.object.matrixWorld) : dir.clone().negate();
    const can = p.mesh;
    can.position.copy(hit.point).addScaledVector(n, 0.07);
    can.scale.set(1.05, 0.82, 0.95);
    const v = p.vel.clone().reflect(n).multiplyScalar(0.25);
    const rec = this.ctx.physics.addBody(can, this.ctx.physics.cylinderShape(0.045, 0.05), 0.4, {
      debris: true, vel: v, ang: new THREE.Vector3(Math.random() * 6, Math.random() * 6, Math.random() * 6),
      ccd: 0.03, restitution: 0.35,
    });
    rec.thud = true;
  }

  // ---------- viewmodel animation ----------
  poseViewmodel(dt, t, playerVel) {
    const d = this.def, v = this.vm[d.id];
    const speed = Math.hypot(playerVel.x, playerVel.z);
    const bob = Math.min(1, speed / 4.6);
    const pos = v.rest.clone();
    pos.x += Math.sin(t * 7) * 0.008 * bob;
    pos.y += Math.abs(Math.cos(t * 7)) * 0.012 * bob + Math.sin(t * 1.6) * 0.003;
    pos.y -= this.equipT * 1.2;
    const rot = new THREE.Euler(0, 0, 0);
    const a = this.anim;
    if (this.animKind === 'swing') {
      const heavy = d.id === 'sledge' ? 1.3 : 1;
      if (a < 0.3) { const k = a / 0.3; rot.x = 0.7 * k * heavy; rot.z = -0.3 * k; pos.y += 0.06 * k; }
      else if (a < 0.55) { const k = (a - 0.3) / 0.25; rot.x = (0.7 - 2.1 * k) * heavy; rot.z = -0.3 + 0.9 * k; pos.x -= 0.18 * k; pos.y -= 0.05 * k; pos.z -= 0.15 * k; }
      else { const k = (a - 0.55) / 0.45; rot.x = -1.4 * heavy * (1 - k); rot.z = 0.6 * (1 - k); pos.x -= 0.18 * (1 - k); pos.y -= 0.05 * (1 - k); pos.z -= 0.15 * (1 - k); }
    } else if (this.animKind === 'throw') {
      if (a < 0.35) { const k = a / 0.35; pos.z -= 0.25 * k; pos.y += 0.12 * k; rot.x = -0.6 * k; v.obj.children[0].visible = k < 0.8; }
      else { const k = (a - 0.35) / 0.65; v.obj.children[0].visible = true; pos.y -= 0.25 * (1 - k); }
    } else if (this.animKind === 'recoil') {
      pos.z += 0.03 * (1 - a); rot.x = 0.08 * (1 - a);
    } else if (d.id === 'soup') v.obj.children[0].visible = true;
    if (d.id === 'lipstick' && this.drawing) { pos.z -= 0.06; pos.x -= 0.05; rot.z = Math.sin(t * 30) * 0.05; }
    if (d.id === 'flame') {
      v.pilot.scale.setScalar(this.flameOn ? 2 + Math.random() : 1 + Math.random() * 0.3);
      if (this.flameOn) { pos.x += (Math.random() - 0.5) * 0.006; pos.y += (Math.random() - 0.5) * 0.006; }
    }
    v.obj.position.lerp(pos, 1 - Math.exp(-dt * 30));
    v.obj.rotation.set(rot.x, rot.y, rot.z);
  }
}
