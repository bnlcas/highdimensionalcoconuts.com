// Weapons hidden around the museum: each floats over a display stand under a beam of light.
// The heavy ones sit in time-locked glass cases that open once your bill is big enough.
import * as THREE from 'three';
import { WEAPONS, buildViewmodels } from './weapons.js';
import { makeCanvas, canvasTexture } from './textures.js';
import { fmtMoney } from './game.js';

const PED_H = 0.9;
const REACH = 1.5;

function labelTexture(title, sub) {
  const c = makeCanvas(512, 200), g = c.getContext('2d');
  g.fillStyle = '#1d1a16'; g.fillRect(0, 0, 512, 200);
  g.strokeStyle = '#c9a14a'; g.lineWidth = 6; g.strokeRect(8, 8, 496, 184);
  g.fillStyle = '#f4d58a'; g.textAlign = 'center';
  g.font = 'bold 54px Georgia, serif';
  g.fillText(title, 256, 92, 470);
  g.fillStyle = '#e8dcc4'; g.font = 'italic 34px Georgia, serif';
  g.fillText(sub, 256, 150, 470);
  return canvasTexture(c);
}

export class Pickups {
  constructor(ctx) {
    this.ctx = ctx;   // { scene, effects, sfx, game, colliders }
    this.items = [];
    const models = buildViewmodels();
    const standMat = new THREE.MeshStandardMaterial({ color: 0x2b2622, roughness: 0.5 });
    const trimMat = new THREE.MeshStandardMaterial({ color: 0xd6ad55, metalness: 0.9, roughness: 0.3 });
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xffd27a, transparent: true, opacity: 0.1, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    });
    WEAPONS.forEach((w, i) => {
      if (!w.at) return;
      const root = new THREE.Group();
      root.position.set(w.at[0], 0, w.at[1]);
      const ped = new THREE.Mesh(new THREE.BoxGeometry(0.7, PED_H, 0.7), standMat);
      ped.position.y = PED_H / 2; ped.castShadow = ped.receiveShadow = true;
      const trim = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.05, 0.74), trimMat);
      trim.position.y = PED_H;
      const model = models[w.id].obj.clone(true);
      model.visible = true;
      model.position.y = PED_H + 0.55;
      model.scale.setScalar(1.7);
      model.traverse(o => { if (o.isMesh) o.castShadow = true; });
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 6, 24, 1, true), beamMat);
      beam.position.y = PED_H + 3;
      const label = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.24), new THREE.MeshBasicMaterial({
        map: labelTexture(w.name, w.opensAt ? `Case opens at ${fmtMoney(w.opensAt)}` : 'Walk up to take it'),
      }));
      label.position.set(0, PED_H * 0.62, 0.352);
      root.add(ped, trim, model, beam, label);
      // face the label roughly toward the entrance, where visitors come from
      root.rotation.y = Math.atan2(-w.at[0], 2 - w.at[1]);
      let glass = null;
      if (w.opensAt) {
        glass = new THREE.Mesh(new THREE.BoxGeometry(0.66, 1.0, 0.66), new THREE.MeshStandardMaterial({
          color: 0xdff4ff, transparent: true, opacity: 0.18, roughness: 0.05, metalness: 0.5, depthWrite: false,
        }));
        glass.position.y = PED_H + 0.52;
        root.add(glass);
      }
      ctx.scene.add(root);
      ctx.colliders.push({ minX: w.at[0] - 0.4, maxX: w.at[0] + 0.4, minZ: w.at[1] - 0.4, maxZ: w.at[1] + 0.4 });
      this.items.push({ i, w, root, model, beam, label, glass, locked: !!w.opensAt, taken: false, nagT: 0 });
    });
  }

  // free roam: everything is already in your hands
  takeAll() {
    for (const it of this.items) { it.taken = true; it.model.visible = it.beam.visible = false; if (it.glass) it.glass.visible = false; }
  }

  update(dt, t, playerPos, bill) {
    const { effects, sfx, game } = this.ctx;
    for (const it of this.items) {
      if (it.taken) continue;
      it.model.rotation.y += dt * 1.6;
      it.model.position.y = PED_H + 0.55 + Math.sin(t * 2.2 + it.i) * 0.06;
      it.beam.material.opacity = 0.08 + Math.sin(t * 3 + it.i) * 0.03;
      const dist = Math.hypot(playerPos.x - it.w.at[0], playerPos.z - it.w.at[1]);
      if (it.locked) {
        if (bill >= it.w.opensAt) {
          it.locked = false;
          const p = it.glass.getWorldPosition(new THREE.Vector3());
          it.root.remove(it.glass);
          effects.chipBurst(p, null, 0xe6f7ff, 40, 0.03, 3);
          sfx.play('glass');
          game.onCaseOpened(it.i);
        } else if ((it.nagT -= dt) <= 0 && dist < REACH + 0.6) {
          it.nagT = 12;
          game.onCaseNear(it.i);
        }
        continue;
      }
      if (dist < REACH) {
        it.taken = true;
        it.root.remove(it.model);
        it.root.remove(it.beam);
        effects.sparks(it.root.position.clone().setY(PED_H + 0.5), null, 30);
        game.onPickup(it.i);
      }
    }
  }
}
