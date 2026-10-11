// What happens when a weapon meets a thing: surface marks, damage and billing, glass, fire,
// shattering paintings and sculptures into physics debris.
import * as THREE from 'three';
import { DAMAGE, CAPS, PAPER_CAPS, BRONZE_MAX } from './artworks.js';
import { fractureGeometry, panelSeeds, volumeSeeds, withBackColor } from './fracture.js';
import { splatTexture } from './textures.js';

const SOUP = '#c4441c';
const LIPSTICK = '#c0102a';
const GLASS_FEES = { soup: 1500, paintball: 250, lipstick: 120 };

export class Destruction {
  constructor(ctx) {
    this.ctx = ctx;   // { scene, physics, effects, sfx, game, targets, arts }
    this.stroke = null;
    this.time = 0;
    this.scorchT = 0;
    for (const art of ctx.arts) {
      if (art.def.kind !== 'sculpture') continue;
      art.body.onImpact = (rec, drop) => this.sculptureImpact(art, drop);
    }
  }

  endStroke() { this.stroke = null; }

  normalOf(hit, dir) {
    if (hit.face) return hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
    return dir.clone().negate();
  }

  hit(weapon, hit, dir, opts = {}) {
    const info = hit.object.userData.hit || { kind: 'wall' };
    const n = this.normalOf(hit, dir);
    switch (info.kind) {
      case 'canvas': return this.canvasHit(info.art, weapon, hit, dir, n, opts);
      case 'frame': return this.frameHit(info.art, weapon, hit, dir, n, opts);
      case 'glass': return this.glassHit(info.art, weapon, hit, dir, n, opts);
      case 'sculpture': return this.sculptureHit(info.art, weapon, hit, dir, n, opts);
      default: return this.envHit(info.kind, weapon, hit, dir, n, opts);
    }
  }

  // ---------------------------------------------------------------- damage + bill
  addDamage(art, weapon, amount, point) {
    if (art.destroyed || amount <= 0) return 0;
    const mat = art.def.material;
    let cap = 1;
    if (CAPS[weapon] !== undefined && art.def.kind === 'painting') cap = mat === 'paper' ? PAPER_CAPS[weapon] : CAPS[weapon];
    const used = art.byWeapon[weapon] || 0;
    let amt = Math.min(amount, Math.max(0, cap - used));
    if (mat === 'bronze') amt = Math.min(amt, Math.max(0, BRONZE_MAX - art.damage));
    amt = Math.min(amt, 1 - art.damage);
    if (amt <= 0) {
      this.ctx.game.onCapped(art, weapon);
      return 0;
    }
    art.byWeapon[weapon] = used + amt;
    art.damage += amt;
    const cost = amt * art.def.value;
    art.cost += cost;
    this.ctx.game.onDamage(art, weapon, cost, point);
    if (art.damage >= 0.999 && mat !== 'bronze') {
      art.damage = 1;
      if (art.def.kind === 'painting') this.destroyPainting(art, point, null, weapon);
      else if (mat === 'steel') this.dismantle(art, point || art.group.position, null, weapon);
      else this.shatterSculpture(art, point || art.group.position, new THREE.Vector3(0, -1, 0), 1, weapon);
    }
    return cost;
  }

  // big, solid works (David) take more punishment per unit of damage
  dmgFor(weapon, art) { return (DAMAGE[weapon][art.def.material] ?? 0) / (art.def.toughness || 1); }

  // shove a heavy sculpture high up so that a few good blows can tip it off its plinth
  pushTop(art, dir, perKg) {
    if (!art.body) return;
    const top = art.group.position.clone().add(new THREE.Vector3(0, art.size.y * 0.42, 0));
    const d = dir.clone(); d.y = Math.max(0, d.y);
    this.ctx.physics.impulse(art.body, d.normalize().multiplyScalar(art.mass * perKg), top);
  }

  // ---------------------------------------------------------------- paintings
  canvasHit(art, weapon, hit, dir, n, opts) {
    const s = art.surface, uv = hit.uv, fx = this.ctx.effects, sfx = this.ctx.sfx;
    if (!uv || art.destroyed) return;
    const base = this.dmgFor(weapon, art);
    const p = hit.point;
    switch (weapon) {
      case 'lipstick': {
        const now = this.time;
        if (this.stroke && this.stroke.art === art && now - this.stroke.t < 0.15) {
          s.stroke(this.stroke.u, this.stroke.v, uv.x, uv.y, LIPSTICK, 0.012);
        } else s.stroke(uv.x, uv.y, uv.x + 0.002, uv.y, LIPSTICK, 0.012);
        this.stroke = { art, u: uv.x, v: uv.y, t: now };
        sfx.play('scribble');
        this.addDamage(art, weapon, base * opts.dt * 10, p);
        break;
      }
      case 'soup':
        s.splat(uv.x, uv.y, 0.2, SOUP, { drips: 4, chunks: 10, chunkColors: ['#e7b04a', '#4f8a2f', '#f0e0b0', '#8a2a10'] });
        fx.burst(p, n, 0xc4441c, 40, 3, 0.03, { life: 1 });
        sfx.play('splat');
        this.addDamage(art, weapon, base, p);
        break;
      case 'paintball':
        s.splat(uv.x, uv.y, 0.045, opts.color, { drips: 2, drops: 8 });
        fx.burst(p, n, opts.color, 12, 2, 0.02, { life: 0.6 });
        sfx.play('paintsplat');
        this.addDamage(art, weapon, base, p);
        break;
      case 'crowbar':
        s.gash(uv.x, uv.y, 0.32 + Math.random() * 0.15, Math.PI * (0.15 + Math.random() * 0.7) * (Math.random() < 0.5 ? 1 : -1));
        fx.chipBurst(p, n, 0xd8c9a8, 10, 0.02, 2);
        fx.dust(p, 4, 0xcbbfa6, 0.12);
        sfx.play('rip');
        art.tilt += (Math.random() - 0.5) * 0.08;
        this.addDamage(art, weapon, base, p);
        break;
      case 'sledge':
        s.crater(uv.x, uv.y, 0.15);
        fx.chipBurst(p, n, 0xd8c9a8, 24, 0.035, 3.5);
        fx.dust(p, 10, 0xcbbfa6, 0.25);
        fx.shake(0.08);
        sfx.play('smash');
        art.tilt += (Math.random() - 0.5) * 0.22;
        this.addDamage(art, weapon, base, p);
        if (!art.destroyed) this.wobble(art, dir, 0.06);
        break;
      case 'flame':
        this.ignite(art, uv.x, uv.y);
        this.addDamage(art, weapon, base * opts.dt, p);
        break;
    }
  }

  frameHit(art, weapon, hit, dir, n, opts) {
    const fx = this.ctx.effects, sfx = this.ctx.sfx, p = hit.point;
    if (art.destroyed) return;
    const base = this.dmgFor(weapon, art) * 0.3;
    if (weapon === 'soup') { fx.burst(p, n, 0xc4441c, 30, 3, 0.03); sfx.play('splat'); }
    else if (weapon === 'paintball') { fx.burst(p, n, opts.color, 10, 2, 0.02); sfx.play('paintsplat'); }
    else if (weapon === 'crowbar' || weapon === 'sledge') {
      fx.chipBurst(p, n, 0xd6ad55, weapon === 'sledge' ? 18 : 8, 0.03, 3);
      fx.sparks(p, n, 6);
      sfx.play('thud', 1);
      art.tilt += (Math.random() - 0.5) * (weapon === 'sledge' ? 0.18 : 0.06);
      if (weapon === 'sledge') fx.shake(0.05);
    } else if (weapon === 'flame') {
      if (Math.random() < 0.2) this.ctx.effects.fire(p, new THREE.Vector3(0, 0.6, 0), 0.4, 0.8);
    } else if (weapon === 'lipstick') { sfx.play('scribble'); return; }
    this.addDamage(art, weapon, base * (weapon === 'flame' ? opts.dt : 1), p);
  }

  glassHit(art, weapon, hit, dir, n, opts) {
    const gl = art.glass, fx = this.ctx.effects, sfx = this.ctx.sfx, p = hit.point, uv = hit.uv;
    if (!gl || gl.broken) return;
    // the glass box's front face carries the uv we want; side faces are tiny, fine to approximate
    const u = uv ? uv.x : 0.5, v = uv ? uv.y : 0.5;
    switch (weapon) {
      case 'lipstick':
        if (this.stroke && this.stroke.art === art && this.time - this.stroke.t < 0.15) gl.surface.stroke(this.stroke.u, this.stroke.v, u, v, LIPSTICK, 0.012);
        this.stroke = { art, u, v, t: this.time };
        sfx.play('scribble');
        this.ctx.game.onGlass(art, weapon, GLASS_FEES.lipstick * opts.dt * 10, p);
        break;
      case 'soup':
        gl.surface.splat(u, v, 0.13, SOUP);
        fx.burst(p, n, 0xc4441c, 40, 3, 0.03);
        sfx.play('splat');
        this.ctx.game.onGlass(art, weapon, GLASS_FEES.soup, p);
        break;
      case 'paintball':
        gl.surface.splat(u, v, 0.045, opts.color);
        fx.burst(p, n, opts.color, 10, 2, 0.02);
        sfx.play('paintsplat');
        this.ctx.game.onGlass(art, weapon, GLASS_FEES.paintball, p);
        break;
      case 'crowbar': case 'sledge': {
        const dmg = weapon === 'sledge' ? 3 : 1;
        gl.hp -= dmg;
        gl.surface.crack(u, v, dmg);
        sfx.play('crack');
        fx.chipBurst(p, n, 0xdff3ff, 6, 0.015, 2);
        if (gl.hp <= 0) this.breakGlass(art, p, dir, weapon);
        else this.ctx.game.onGlass(art, weapon, 0, p, 'cracked');
        break;
      }
      case 'flame':
        gl.hp -= opts.dt * (gl.bulletproof ? 0.5 : 1.4);
        if (Math.random() < 0.05) gl.surface.crack(u, v, 0);
        if (gl.hp <= 0) this.breakGlass(art, p, dir, weapon);
        break;
    }
  }

  breakGlass(art, point, dir, weapon) {
    const gl = art.glass, { scene, physics, effects, sfx, targets } = this.ctx;
    if (gl.broken) return;
    gl.broken = true;
    const mesh = gl.mesh;
    mesh.updateMatrixWorld(true);
    const local = mesh.worldToLocal(point.clone());
    const def = art.def;
    const count = THREE.MathUtils.clamp(Math.round(10 + def.w * def.h * 8), 10, 26);
    const pieces = fractureGeometry(mesh.geometry, panelSeeds(def.w, def.h, local.x, local.y, count));
    const mat = new THREE.MeshStandardMaterial({
      color: 0xdff5ff, transparent: true, opacity: 0.45, roughness: 0.05, metalness: 0.6, side: THREE.DoubleSide,
    });
    const wq = mesh.getWorldQuaternion(new THREE.Quaternion());
    const out = new THREE.Vector3(0, 0, 1).applyQuaternion(wq);
    for (const pc of pieces) {
      if (pc.tris < 2) continue;
      const m = new THREE.Mesh(pc.geometry, mat);
      m.position.copy(pc.center).applyMatrix4(mesh.matrixWorld);
      m.quaternion.copy(wq);
      scene.add(m);
      const vel = out.clone().multiplyScalar(0.5 + Math.random() * 1.5).addScaledVector(dir || out, 1.5);
      physics.addBody(m, physics.hullShape(pc.hull), 0.15, {
        debris: true, vel, ang: new THREE.Vector3().randomDirection().multiplyScalar(4), restitution: 0.15,
      }).thud = true;
    }
    effects.chipBurst(point, out, 0xe6f7ff, 40, 0.025, 3);
    sfx.play('glass');
    mesh.parent.remove(mesh);
    gl.overlay.parent.remove(gl.overlay);
    const i = targets.indexOf(mesh); if (i >= 0) targets.splice(i, 1);
    const fee = gl.bulletproof ? 250000 : 25000;
    art.extraCost += fee;
    this.ctx.game.onGlass(art, weapon, fee, point, 'broken');
  }

  ignite(art, u, v) {
    if (art.destroyed) return;
    art.burning = Math.min(9, art.burning + 0.5);
    let spot = art.burnSpots.find(s => Math.hypot(s.u - u, s.v - v) < 0.12);
    if (!spot && art.burnSpots.length < 14) { spot = { u, v, r: 0.03 }; art.burnSpots.push(spot); }
    if (spot) spot.r = Math.min(0.6, spot.r + 0.012);
  }

  wobble(art, dir, amount) {
    art.wobble = (art.wobble || 0) + amount;
  }

  destroyPainting(art, point, dir, weapon) {
    if (art.destroyed) return;
    art.destroyed = true;
    art.burning = 0;
    const { scene, physics, effects, sfx, targets } = this.ctx;
    if (art.glass && !art.glass.broken) this.breakGlass(art, point || art.group.position, dir, weapon);
    const canvas = art.canvas;
    canvas.updateMatrixWorld(true);
    const def = art.def;
    const p = point || canvas.getWorldPosition(new THREE.Vector3());
    const local = canvas.worldToLocal(p.clone());
    const count = THREE.MathUtils.clamp(Math.round(8 + def.w * def.h * 2.5), 8, 28);
    art.surface.update(0);
    const pieces = fractureGeometry(canvas.geometry, panelSeeds(def.w, def.h, local.x, local.y, count));
    const burnt = weapon === 'flame';
    const mat = withBackColor(canvas.material, burnt ? 0x2a1d14 : 0xd9cfb8);
    if (burnt) mat.color.setHex(0x6a5a4a);
    const wq = canvas.getWorldQuaternion(new THREE.Quaternion());
    const out = new THREE.Vector3(0, 0, 1).applyQuaternion(wq);
    for (const pc of pieces) {
      if (pc.tris < 2) continue;
      const m = new THREE.Mesh(pc.geometry, mat);
      m.position.copy(pc.center).applyMatrix4(canvas.matrixWorld);
      m.quaternion.copy(wq);
      m.castShadow = true;
      scene.add(m);
      pc.geometry.computeBoundingBox();
      const sz = pc.geometry.boundingBox.getSize(new THREE.Vector3());
      const mass = Math.max(0.05, sz.x * sz.y * 2.5);
      const vel = out.clone().multiplyScalar(1 + Math.random() * 2.5);
      if (dir) vel.addScaledVector(dir, 2);
      vel.y += Math.random() * 1.5;
      physics.addBody(m, physics.hullShape(pc.hull), mass, {
        debris: true, vel, ang: new THREE.Vector3().randomDirection().multiplyScalar(3 + Math.random() * 4),
      });
    }
    canvas.parent.remove(canvas);
    let i = targets.indexOf(canvas); if (i >= 0) targets.splice(i, 1);
    // the frame comes off the wall too
    for (const bar of art.frames) {
      scene.attach(bar);
      const bp = bar.geometry.parameters;
      physics.addBody(bar, physics.boxShape(bp.width / 2, bp.height / 2, bp.depth / 2), Math.max(1, bp.width * bp.height * 30), {
        debris: true, vel: out.clone().multiplyScalar(0.5 + Math.random()), ang: new THREE.Vector3().randomDirection().multiplyScalar(1.5),
      });
      i = targets.indexOf(bar); if (i >= 0) targets.splice(i, 1);
    }
    art.frames = [];
    effects.dust(p, 25, burnt ? 0x2a2522 : 0xd8d0c0, 0.4);
    effects.shake(0.12);
    sfx.play('smash', 1.3);
    this.ctx.game.onDestroyed(art, weapon);
  }

  // ---------------------------------------------------------------- sculpture
  sculptureHit(art, weapon, hit, dir, n, opts) {
    const fx = this.ctx.effects, sfx = this.ctx.sfx, physics = this.ctx.physics, p = hit.point;
    if (art.destroyed) return;
    const mat = art.def.material;
    const base = this.dmgFor(weapon, art);
    const push = (mag) => { if (art.body) physics.impulse(art.body, dir.clone().multiplyScalar(mag), p); };
    switch (weapon) {
      case 'lipstick':
        sfx.play('scribble');
        if (Math.random() < 0.3) fx.burst(p, n, 0xc0102a, 2, 0.3, 0.01, { life: 0.5 });
        this.addDamage(art, weapon, base * opts.dt * 10, p);
        this.ctx.game.onMaterialNote(art, weapon);
        return;
      case 'soup':
        fx.burst(p, n, 0xc4441c, 40, 3, 0.03);
        sfx.play('splat');
        if (mat === 'bronze') sfx.play('clang', 0.4);
        push(5.5);
        break;
      case 'paintball':
        fx.burst(p, n, opts.color, 12, 2, 0.02);
        sfx.play('paintsplat');
        push(0.6);
        break;
      case 'crowbar': case 'sledge': {
        const heavy = weapon === 'sledge';
        if (mat === 'bronze' || mat === 'steel') {
          sfx.play('clang', (heavy ? 1.3 : 0.8) * (mat === 'steel' ? 0.7 : 1));
          fx.sparks(p, n, heavy ? 40 : 18);
          fx.shake(heavy ? 0.06 : 0.02);
          if (mat === 'steel') fx.chipBurst(p, n, 0xc8301f, heavy ? 10 : 4, 0.02, 2);   // paint flakes
          this.pushTop(art, dir, mat === 'bronze' ? (heavy ? 1.5 : 0.35) : (heavy ? 1.2 : 0.3));
        } else if (mat === 'marble') {
          fx.chipBurst(p, n, 0xf3f0ea, heavy ? 22 : 10, 0.03, 3);
          fx.dust(p, heavy ? 10 : 4, 0xeeeeea, 0.2);
          sfx.play(heavy ? 'smash' : 'crack');
          if (art.mass > 100) this.pushTop(art, dir, heavy ? 0.6 : 0.15);
          else push(heavy ? 60 : 20);
        } else if (mat === 'wood') {
          fx.chipBurst(p, n, 0x8a5a34, heavy ? 16 : 8, 0.025, 2.5);
          fx.dust(p, 3, 0xb89a78, 0.15);
          sfx.play('thud', heavy ? 1.2 : 0.8);
          push(heavy ? 8 : 3);
        } else {
          fx.chipBurst(p, n, 0xffffff, 8, 0.02, 2);
          sfx.play('crack');
          push(heavy ? 10 : 4);
        }
        break;
      }
      case 'flame':
        this.ctx.game.onMaterialNote(art, weapon);
        if (mat === 'wood') art.burning = Math.min(7, (art.burning || 0) + opts.dt * 3);
        if (base > 0) this.addDamage(art, weapon, base * opts.dt, p);
        return;
    }
    this.addDamage(art, weapon, base, p);
    if (!art.destroyed && (weapon === 'crowbar' || weapon === 'sledge' || weapon === 'soup')) this.ctx.game.onMaterialNote(art, weapon);
  }

  sculptureImpact(art, drop) {
    if (art.destroyed) return;
    const fell = art.group.position.y < art.restY - 0.25;
    if (!fell) return;
    const m = art.def.material;
    if (m === 'wood') { this.ctx.sfx.play('thud', 1); return; }
    if (m === 'bronze' || m === 'steel') {
      this.ctx.sfx.play('clang', Math.min(1.4, drop / 4));
      this.ctx.effects.dust(art.group.position, 10, 0xd8d0c0, 0.4);
      this.ctx.effects.shake(0.08);
      return;
    }
    if (drop > 2) {
      const p = art.group.position.clone();
      p.y = Math.max(0.05, p.y - art.size.y / 2);
      this.addDamage(art, 'fall', 1, p);
      if (!art.destroyed) this.shatterSculpture(art, p, new THREE.Vector3(0, -1, 0), 1, 'fall');
    }
  }

  shatterSculpture(art, point, dir, power, weapon) {
    if (art.destroyed) return;
    art.destroyed = true;
    if (art.damage < 1) {
      const rest = 1 - art.damage;
      art.damage = 1;
      const cost = rest * art.def.value;
      art.cost += cost;
      art.byWeapon[weapon] = (art.byWeapon[weapon] || 0) + rest;
      this.ctx.game.onDamage(art, weapon, cost, point);
    }
    const { scene, physics, effects, sfx, targets } = this.ctx;
    const g = art.group;
    g.updateMatrixWorld(true);
    if (art.body) { physics.remove(art.body); art.body = null; }
    const box = new THREE.Box3().setFromObject(g);
    const porcelain = art.def.material === 'porcelain', wood = art.def.material === 'wood';
    const burnt = weapon === 'flame';
    const count = { jar: 22, fountain: 24, 'balloon-dog': 28, bird: 16, david: 30, selene: 18, hepworth: 14 }[art.def.id] || 18;
    const seeds = volumeSeeds(box, point, count);
    const back = wood ? (burnt ? 0x1c120b : 0xb98a5c) : porcelain ? 0xe9e1d2 : 0xe2ddd2;
    const density = porcelain ? 400 : wood ? 700 : 2600;
    for (const child of [...g.children]) {
      const i = targets.indexOf(child); if (i >= 0) targets.splice(i, 1);
      if (child.userData.decor) continue;
      const geo = child.geometry.clone().applyMatrix4(child.matrixWorld);
      const pieces = fractureGeometry(geo, seeds);
      const mat = withBackColor(child.material, back);
      if (burnt && wood) mat.color.setHex(0x3a2a20);
      for (const pc of pieces) {
        if (pc.tris < 2) continue;
        const m = new THREE.Mesh(pc.geometry, mat);
        m.position.copy(pc.center);
        m.castShadow = true;
        scene.add(m);
        pc.geometry.computeBoundingBox();
        const sz = pc.geometry.boundingBox.getSize(new THREE.Vector3());
        const vol = Math.max(1e-5, sz.x * sz.y * sz.z * (porcelain ? 0.15 : 0.5));
        const out = pc.center.clone().sub(point);
        out.y = Math.abs(out.y) * 0.5 + 0.3;
        out.normalize().multiplyScalar((1.5 + Math.random() * 2.5) * power);
        if (dir) out.addScaledVector(dir, 1.5 * power);
        physics.addBody(m, physics.hullShape(pc.hull), Math.max(0.02, vol * density), {
          debris: true, vel: out, ang: new THREE.Vector3().randomDirection().multiplyScalar(6), restitution: 0.3,
        });
      }
    }
    scene.remove(g);
    effects.chipBurst(point, null, wood ? 0x8a5a34 : porcelain ? 0xffffff : 0xf0ede6, 40, 0.025, 3);
    effects.dust(point, art.def.id === 'david' ? 60 : 14, burnt ? 0x2a2522 : 0xf0ede6, art.def.id === 'david' ? 1.2 : 0.3);
    effects.shake(art.def.id === 'david' ? 0.25 : 0.1);
    sfx.play(porcelain ? 'porcelain' : 'smash', 1.2);
    this.ctx.game.onDestroyed(art, weapon);
  }

  // bolted steel comes apart plate by plate instead of shattering
  dismantle(art, point, dir, weapon) {
    if (art.destroyed) return;
    art.destroyed = true;
    const { scene, physics, effects, sfx, targets } = this.ctx;
    const g = art.group;
    g.updateMatrixWorld(true);
    if (art.body) { physics.remove(art.body); art.body = null; }
    for (const child of [...g.children]) {
      const i = targets.indexOf(child); if (i >= 0) targets.splice(i, 1);
      child.geometry.computeBoundingBox();
      const c = child.geometry.boundingBox.getCenter(new THREE.Vector3());
      child.geometry.translate(-c.x, -c.y, -c.z);
      child.position.add(c);
      scene.attach(child);
      const pos = child.geometry.attributes.position.array, hull = [];
      const step = Math.max(1, Math.floor(pos.length / 3 / 40));
      for (let k = 0; k < pos.length / 3; k += step) hull.push(pos[k * 3], pos[k * 3 + 1], pos[k * 3 + 2]);
      const out = child.position.clone().sub(point); out.y = Math.abs(out.y) * 0.3 + 0.5;
      out.normalize().multiplyScalar(1 + Math.random() * 2);
      physics.addBody(child, physics.hullShape(hull), child.userData.decor ? 0.5 : 60, {
        debris: true, vel: out, ang: new THREE.Vector3().randomDirection().multiplyScalar(2), restitution: 0.2,
      });
    }
    scene.remove(g);
    effects.sparks(point, null, 60);
    effects.dust(point, 20, 0xd8d0c0, 0.5);
    effects.shake(0.15);
    sfx.play('clang', 1.5);
    sfx.play('smash', 1);
    this.ctx.game.onDestroyed(art, weapon);
  }

  // ---------------------------------------------------------------- environment
  envHit(kind, weapon, hit, dir, n, opts) {
    const fx = this.ctx.effects, sfx = this.ctx.sfx, p = hit.point;
    switch (weapon) {
      case 'soup':
        fx.decal(p, n, splatTexture(SOUP, 'splat', 1 + (Math.random() * 3 | 0)), 0.5 + Math.random() * 0.3);
        fx.burst(p, n, 0xc4441c, 30, 3, 0.03);
        sfx.play('splat', 0.8);
        break;
      case 'paintball':
        fx.decal(p, n, splatTexture(opts.color, 'splat', 1 + (Math.random() * 3 | 0)), 0.16 + Math.random() * 0.08);
        fx.burst(p, n, opts.color, 8, 2, 0.02);
        sfx.play('paintsplat', 0.6);
        break;
      case 'crowbar': case 'sledge':
        fx.chipBurst(p, n, kind === 'floor' ? 0x9a7a55 : 0xe8e4dc, weapon === 'sledge' ? 14 : 6, 0.025, 2.5);
        fx.dust(p, weapon === 'sledge' ? 8 : 3, 0xe0dcd2, 0.2);
        sfx.play('thud', weapon === 'sledge' ? 1 : 0.6);
        if (weapon === 'sledge') fx.shake(0.04);
        break;
      case 'flame':
        this.scorchT -= opts.dt;
        if (this.scorchT <= 0) { this.scorchT = 0.25; fx.decal(p, n, splatTexture('#000', 'scorch', 1), 0.6 + Math.random() * 0.4, 0.8); }
        break;
      case 'lipstick':
        sfx.play('scribble');
        break;
    }
  }

  // ---------------------------------------------------------------- per-frame
  update(dt) {
    this.time += dt;
    const { effects } = this.ctx;
    for (const art of this.ctx.arts) {
      if (art.def.kind === 'painting') {
        // crooked hanging after a beating
        if (!art.destroyed) {
          art.tilt = THREE.MathUtils.clamp(art.tilt, -0.35, 0.35);
          art.wobble = (art.wobble || 0) * Math.exp(-dt * 4);
          art.group.rotation.z += (art.tilt + Math.sin(this.time * 30) * (art.wobble || 0) - art.group.rotation.z) * Math.min(1, dt * 10);
        }
        if (art.burning > 0 && !art.destroyed) {
          art.burning -= dt;
          art.burnTick = (art.burnTick || 0) - dt;
          if (art.burnTick <= 0 && art.burnSpots.length) {
            art.burnTick = 0.12;
            const sp = art.burnSpots[(Math.random() * art.burnSpots.length) | 0];
            sp.r = Math.min(0.8, sp.r + 0.01);
            const jitter = () => (Math.random() - 0.5) * sp.r * 0.6;
            const holeFrac = art.damage > 0.45 ? Math.min(0.75, (art.damage - 0.45) * 1.5) : 0;
            art.surface.burn(sp.u + jitter() / art.def.w, sp.v + jitter() / art.def.h, sp.r, holeFrac);
          }
          // a burning painting keeps burning for a while
          this.addDamage(art, 'flame', 0.03 * dt, null);
          if (art.burnSpots.length && Math.random() < 0.7) {
            const sp = art.burnSpots[(Math.random() * art.burnSpots.length) | 0];
            const lp = new THREE.Vector3((sp.u - 0.5) * art.def.w + (Math.random() - 0.5) * sp.r,
              (sp.v - 0.5) * art.def.h + (Math.random() - 0.5) * sp.r, art.depth / 2 + 0.03);
            effects.fire(art.canvas.localToWorld(lp), new THREE.Vector3(0, 0.4, 0), 0.4, 0.8 + art.damage);
          }
        }
        if (!art.destroyed) art.surface.update(dt);
      } else {
        const m = art.def.material;
        if ((m === 'bronze' || m === 'steel') && art.body && !art.toppled) {
          const up = new THREE.Vector3(0, 1, 0).applyQuaternion(art.group.quaternion);
          if (up.y < 0.55) {
            art.toppled = true;
            const amt = Math.min(0.15, 1 - art.damage);
            art.damage += amt;
            art.byWeapon.topple = amt;
            const cost = amt * art.def.value;
            art.cost += cost;
            this.ctx.game.onDamage(art, 'topple', cost, art.group.position);
            this.ctx.game.onToppled(art);
            if (art.damage >= 0.999 && m === 'steel') this.dismantle(art, art.group.position, null, 'topple');
          }
        }
        // carved wood keeps burning, blackening as it goes
        if (art.burning > 0 && !art.destroyed) {
          art.burning -= dt;
          this.addDamage(art, 'flame', 0.05 * dt, null);
          const char = Math.min(1, art.damage);
          for (const c of art.group.children) if (c.material && c.material.color && !c.userData.decor) {
            c.material.color.setRGB(1 - 0.8 * char, 1 - 0.85 * char, 1 - 0.88 * char);
          }
          if (!art.destroyed && Math.random() < 0.8) {
            const b = new THREE.Box3().setFromObject(art.group);
            const pt = new THREE.Vector3(
              THREE.MathUtils.lerp(b.min.x, b.max.x, Math.random()), THREE.MathUtils.lerp(b.min.y, b.max.y, Math.random()),
              THREE.MathUtils.lerp(b.min.z, b.max.z, Math.random()));
            effects.fire(pt, new THREE.Vector3(0, 0.4, 0), 0.3, 0.7);
          }
        }
      }
    }
  }
}
