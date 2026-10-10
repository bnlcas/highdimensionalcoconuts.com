// The NVIDO Museum of Art: architecture, hanging, plinths, and runtime state for every artwork.
import * as THREE from 'three';
import { ARTWORKS } from './artworks.js';
import {
  woodFloor, marbleTexture, concreteTexture, plasterTexture, placardTexture, signTexture, giltTexture,
} from './textures.js';
import { ArtSurface, GlassSurface } from './surface.js';
import { BUILDERS } from './sculptures.js';

export const WALL_H = 7;
const T = 0.4;           // wall thickness
const DOOR_H = 4.2;

export const ROOMS = [
  { id: 'hall', name: 'Grand Hall', x0: -12, x1: 12, z0: -10, z1: 10, wall: 0xeee9df, floor: 'marble' },
  { id: 'west', name: 'Old Masters', x0: -32, x1: -12, z0: -10, z1: 10, wall: 0x7c2a33, floor: 'wood' },
  { id: 'east', name: 'The 19th Century', x0: 12, x1: 32, z0: -10, z1: 10, wall: 0x35554f, floor: 'wood' },
  { id: 'north', name: 'Modern & Contemporary', x0: -10, x1: 10, z0: -30, z1: -10, wall: 0xf5f5f3, floor: 'concrete' },
];

// doorways: along a wall at x = at (axis 'x') or z = at (axis 'z'), spanning [from, to] on the other axis
const DOORS = [
  { axis: 'x', at: -12, from: -2, to: 2 },
  { axis: 'x', at: 12, from: -2, to: 2 },
  { axis: 'z', at: -10, from: -2, to: 2 },
];

// wall center-lines: [axis, at, from, to, height]
const WALLS = [
  ['z', 10, -32, 32], ['z', -10, -32, -2], ['z', -10, 2, 32],
  ['x', -32, -10, 10], ['x', 32, -10, 10],
  ['x', -12, -10, -2], ['x', -12, 2, 10], ['x', 12, -10, -2], ['x', 12, 2, 10],
  ['x', -10, -30, -10], ['x', 10, -30, -10], ['z', -30, -10, 10],
  ['x', -22, -3, 3, 4.2], // the Leonardo wall
];

// Painted wall skins sit a little proud of the structural core (well clear of depth-buffer fighting);
// everything hung on a wall sits on the skin.
const S = T / 2;
const SKIN = 0.015;
const F = S + SKIN;
// where each work hangs: x, z on the wall face, rotY so the art faces into the room
const HANG = {
  'night-watch': [-7, -10 + F, 0], 'washington': [7, -10 + F, 0],
  'meninas': [-32 + F, 0, Math.PI / 2],
  'boy-lizard': [-27.5, -10 + F, 0], 'pearl': [-16.5, -10 + F, 0],
  'mona-lisa': [-22 + S, 0, Math.PI / 2], 'salvator-mundi': [-22 - S, 0, -Math.PI / 2], // unskinned feature wall
  'starry-night': [16.5, -10 + F, 0], 'sunflowers': [22, -10 + F, 0], 'grainstacks': [27.5, -10 + F, 0],
  'scream': [16.5, 10 - F, Math.PI], 'card-players': [22, 10 - F, Math.PI], 'great-wave': [27.5, 10 - F, Math.PI],
  'grande-jatte': [32 - F, -4.2, -Math.PI / 2], 'kiss': [32 - F, 4.4, -Math.PI / 2],
  'rothko': [-10 + F, -15.5, Math.PI / 2], 'black-square': [-10 + F, -24, Math.PI / 2],
  'pollock': [10 - F, -15.5, -Math.PI / 2], 'mondrian': [10 - F, -24, -Math.PI / 2],
  'warhol': [0, -30 + F, 0],
};
// plinths: x, z, plinth height, plinth width, facing (rotY)
const PLINTH = {
  'david': [0, -2, 0.55, 1.7, 0],
  'thinker': [6.5, 3.5, 0.75, 1.25, -0.6],
  'jar': [-6, 3, 1.1, 0.55, 0.3],
  'selene': [-6.5, -5, 1.1, 0.9, 0.9],
  'calder': [0, -17.5, 0.06, 2.8, 0.2],
  'fountain': [-5, -20.5, 1.0, 0.7, 0.4],
  'balloon-dog': [5, -20.5, 1.0, 0.6, -0.5],
  'bird': [0, -24.5, 0.55, 0.6, 0],
  'moore': [5, -26.5, 0.45, 2.6, -0.3],
  'hepworth': [-5, -26.5, 1.05, 0.6, 0.5],
};
const MASS = { david: 5600, thinker: 900, moore: 1000, calder: 300, selene: 300, bird: 60, fountain: 15, hepworth: 15, jar: 3, 'balloon-dog': 2 };
const UNFRAMED = new Set(['rothko', 'pollock', 'warhol', 'black-square', 'mondrian']);

export function buildMuseum(scene, physics, renderer) {
  const colliders = [];     // player AABBs in XZ
  const targets = [];       // raycast targets with userData.hit
  const arts = [];
  const byId = {};

  const aniso = renderer.capabilities.getMaxAnisotropy();
  const wood = woodFloor(), marble = marbleTexture(true, 2), concrete = concreteTexture(), plaster = plasterTexture();
  for (const t of [wood, marble, concrete, plaster]) t.anisotropy = aniso;
  const coreMat = new THREE.MeshStandardMaterial({ color: 0x4b3a2c, roughness: 0.6 });
  const featureMat = new THREE.MeshStandardMaterial({ color: 0x3a4a68, roughness: 0.85, map: plaster });
  const baseboardMat = new THREE.MeshStandardMaterial({ color: 0x2b2420, roughness: 0.5 });
  const ceilingMat = new THREE.MeshStandardMaterial({ color: 0xf4f2ee, roughness: 1 });
  const skylightMat = new THREE.MeshBasicMaterial({ color: 0xfffcf2 });
  const plinthMat = new THREE.MeshStandardMaterial({ color: 0xf1efe9, roughness: 0.75 });
  const giltMat = new THREE.MeshStandardMaterial({ color: 0xffdc8a, map: giltTexture(), metalness: 0.9, roughness: 0.28, envMapIntensity: 2.2 });
  const stripMat = new THREE.MeshStandardMaterial({ color: 0x1d1a17, roughness: 0.6 });

  const addCollider = (minX, maxX, minZ, maxZ) => colliders.push({ minX, maxX, minZ, maxZ });

  // ---------- walls (structure, collision, physics) ----------
  for (const [axis, at, from, to, hh] of WALLS) {
    const h = hh || WALL_H;
    const len = to - from + T;
    const mid = (from + to) / 2;
    const geo = axis === 'z' ? new THREE.BoxGeometry(len, h, T) : new THREE.BoxGeometry(T, h, len);
    const m = new THREE.Mesh(geo, hh ? featureMat : coreMat);
    if (axis === 'z') m.position.set(mid, h / 2, at); else m.position.set(at, h / 2, mid);
    m.castShadow = true; m.receiveShadow = true;
    m.userData.hit = { kind: 'wall' };
    scene.add(m); targets.push(m);
    const half = axis === 'z' ? new THREE.Vector3(len / 2, h / 2, T / 2) : new THREE.Vector3(T / 2, h / 2, len / 2);
    physics.addStaticBox(m.position, half);
    if (axis === 'z') addCollider(from - T / 2, to + T / 2, at - T / 2, at + T / 2);
    else addCollider(at - T / 2, at + T / 2, from - T / 2, to + T / 2);
  }
  // lintels over the doors
  for (const d of DOORS) {
    const h = WALL_H - DOOR_H, len = d.to - d.from;
    const geo = d.axis === 'z' ? new THREE.BoxGeometry(len, h, T) : new THREE.BoxGeometry(T, h, len);
    const m = new THREE.Mesh(geo, coreMat);
    const mid = (d.from + d.to) / 2;
    if (d.axis === 'z') m.position.set(mid, DOOR_H + h / 2, d.at); else m.position.set(d.at, DOOR_H + h / 2, mid);
    m.userData.hit = { kind: 'wall' };
    scene.add(m); targets.push(m);
  }
  // floor slab
  physics.addStaticBox(new THREE.Vector3(0, -0.5, -10), new THREE.Vector3(40, 0.5, 30));

  // ---------- per-room skins, floors, ceilings ----------
  for (const room of ROOMS) {
    const wallMat = new THREE.MeshStandardMaterial({ color: room.wall, roughness: 0.92, map: plaster });
    const w = room.x1 - room.x0, d = room.z1 - room.z0;
    const sides = [
      { axis: 'z', at: room.z0, from: room.x0, to: room.x1, n: new THREE.Vector3(0, 0, 1) },
      { axis: 'z', at: room.z1, from: room.x0, to: room.x1, n: new THREE.Vector3(0, 0, -1) },
      { axis: 'x', at: room.x0, from: room.z0, to: room.z1, n: new THREE.Vector3(1, 0, 0) },
      { axis: 'x', at: room.x1, from: room.z0, to: room.z1, n: new THREE.Vector3(-1, 0, 0) },
    ];
    for (const s of sides) {
      const doors = DOORS.filter(dr => dr.axis === s.axis && dr.at === s.at && dr.to > s.from && dr.from < s.to);
      const segs = [];
      let cur = s.from + S;
      for (const dr of doors.sort((a, b) => a.from - b.from)) {
        segs.push([cur, dr.from, 0, WALL_H]);
        segs.push([dr.from, dr.to, DOOR_H, WALL_H]);
        cur = dr.to;
      }
      segs.push([cur, s.to - S, 0, WALL_H]);
      for (const [a, b, y0, y1] of segs) {
        if (b - a < 0.01) continue;
        const plane = new THREE.Mesh(new THREE.PlaneGeometry(b - a, y1 - y0), wallMat);
        const mid = (a + b) / 2, off = s.at + s.n.x * F + s.n.z * F;
        if (s.axis === 'z') plane.position.set(mid, (y0 + y1) / 2, off); else plane.position.set(off, (y0 + y1) / 2, mid);
        plane.lookAt(plane.position.clone().add(s.n));
        plane.userData.hit = { kind: 'wall' };
        scene.add(plane); targets.push(plane);
        if (y0 === 0) {
          const bb = new THREE.Mesh(new THREE.BoxGeometry(b - a, 0.16, 0.025), baseboardMat);
          bb.position.copy(plane.position).addScaledVector(s.n, 0.012); bb.position.y = 0.08;
          bb.quaternion.copy(plane.quaternion);
          scene.add(bb);
        }
      }
    }
    // floor
    let map, rough = 0.6;
    if (room.floor === 'wood') { map = wood.clone(); map.repeat.set(w / 2.6, d / 2.6); rough = 0.55; }
    else if (room.floor === 'marble') { map = marble.clone(); map.repeat.set(w / 4, d / 4); rough = 0.25; }
    else { map = concrete.clone(); map.repeat.set(w / 6, d / 6); rough = 0.7; }
    map.wrapS = map.wrapT = THREE.RepeatWrapping; map.needsUpdate = true;
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ map, roughness: rough }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.set((room.x0 + room.x1) / 2, 0, (room.z0 + room.z1) / 2);
    floor.receiveShadow = true;
    floor.userData.hit = { kind: 'floor' };
    scene.add(floor); targets.push(floor);
    // ceiling with skylights
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(w, d), ceilingMat);
    ceil.rotation.x = Math.PI / 2;
    ceil.position.set(floor.position.x, WALL_H, floor.position.z);
    scene.add(ceil);
    const nx = Math.max(1, Math.round(w / 8)), nz = Math.max(1, Math.round(d / 8));
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
      const sl = new THREE.Mesh(new THREE.PlaneGeometry(w / nx * 0.6, d / nz * 0.6), skylightMat);
      sl.rotation.x = Math.PI / 2;
      sl.position.set(room.x0 + (i + 0.5) * w / nx, WALL_H - 0.04, room.z0 + (j + 0.5) * d / nz);
      scene.add(sl);
    }
  }

  // ---------- signage ----------
  const sign = (lines, w, h, pos, rotY, color) => {
    const tex = signTexture(lines, { w: 2048, h: Math.round(2048 * h / w), color });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.8 }));
    m.position.copy(pos); m.rotation.y = rotY;
    scene.add(m);
  };
  const serif = (px) => `${px}px Georgia, "Times New Roman", serif`;
  const quip = (text, pos, rotY, w = 3.4) => sign([{ text, font: `italic ${serif(84)}` }], w, w * 0.06, pos, rotY, '#6a5d4c');
  sign([{ text: 'THE NVIDO MUSEUM OF ART', font: `bold ${serif(150)}`, spacing: '18px' }], 10.5, 0.77, new THREE.Vector3(0, 6.0, -10 + F + 0.02), 0, '#3b3329');
  sign([{ text: 'MODERN & CONTEMPORARY', font: serif(150), spacing: '14px' }], 3.6, 0.3, new THREE.Vector3(0, 4.75, -10 + F + 0.02), 0, '#5a5045');
  sign([{ text: 'OLD MASTERS', font: serif(170), spacing: '14px' }], 3.6, 0.4, new THREE.Vector3(-12 + F + 0.02, 4.9, 0), Math.PI / 2, '#5a5045');
  quip('Legacy hardware: rendered at about one frame per decade', new THREE.Vector3(-12 + F + 0.02, 4.55, 0), Math.PI / 2);
  sign([{ text: 'THE 19TH CENTURY', font: serif(170), spacing: '14px' }], 3.6, 0.4, new THREE.Vector3(12 - F - 0.02, 4.9, 0), -Math.PI / 2, '#5a5045');
  quip('The pre-CUDA era', new THREE.Vector3(12 - F - 0.02, 4.55, 0), -Math.PI / 2, 1.6);
  sign([
    { text: 'THE JETSON HANG GRAND HALL', font: `bold ${serif(76)}`, spacing: '10px' },
    { text: 'made possible by one afternoon', font: `italic ${serif(64)}` },
    { text: 'of NVIDO stock gains', font: `italic ${serif(64)}` },
  ], 8, 1.4, new THREE.Vector3(0, 4.2, 10 - F - 0.02), Math.PI, '#3b3329');
  sign([{ text: 'GIFT SHOP →  now accepting GPUs', font: `bold 110px Arial, sans-serif` }], 3.6, 0.3, new THREE.Vector3(-7, 2.6, 10 - F - 0.02), Math.PI, '#7a1d1d');
  sign([{ text: 'Please do not touch the art.', font: `italic ${serif(110)}` }], 3.2, 0.35, new THREE.Vector3(7, 1.75, 10 - F - 0.02), Math.PI, '#5a5045');
  quip('or mine crypto in the galleries', new THREE.Vector3(7, 1.47, 10 - F - 0.02), Math.PI, 2.2);
  quip('Leather jackets required beyond this point', new THREE.Vector3(-5.5, 2.2, -10 - F - 0.02), Math.PI);
  quip('This gallery is liquid-cooled. Please do not set it on fire.', new THREE.Vector3(5.5, 2.2, -10 - F - 0.02), Math.PI, 3.8);
  quip('No ray tracing was used in the making of these paintings.', new THREE.Vector3(12 + F + 0.02, 2.4, -6), Math.PI / 2, 3.8);
  quip('Please do not overclock the Old Masters.', new THREE.Vector3(-22, 2.4, 10 - F - 0.02), Math.PI, 3);

  // ---------- benches ----------
  const benchMat = new THREE.MeshStandardMaterial({ color: 0x2a2018, roughness: 0.5 });
  const cushion = new THREE.MeshStandardMaterial({ color: 0x3d3833, roughness: 0.95 });
  for (const [x, z, rot] of [[7, -6.2, 0], [22, 0, 0], [-17, 3.5, 0]]) {
    const b = new THREE.Group();
    const top = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 0.6), cushion);
    top.position.y = 0.46; b.add(top);
    for (const s of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.4, 0.55), benchMat);
      leg.position.set(s * 1.05, 0.2, 0); b.add(leg);
    }
    b.position.set(x, 0, z); b.rotation.y = rot;
    b.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; o.userData.hit = { kind: 'wall' }; targets.push(o); } });
    scene.add(b);
    physics.addStaticBox(new THREE.Vector3(x, 0.26, z), new THREE.Vector3(1.2, 0.26, 0.3), rot);
    addCollider(x - 1.2, x + 1.2, z - 0.3, z + 0.3);
  }

  // ---------- paintings ----------
  for (const def of ARTWORKS) {
    if (def.kind !== 'painting') continue;
    const [x, z, rotY] = HANG[def.id];
    const y = Math.max(1.6, 0.75 + def.h / 2);
    const group = new THREE.Group();
    group.position.set(x, y, z); group.rotation.y = rotY;
    const art = newArtState(def, group);
    const surf = new ArtSurface(def);
    art.surface = surf;
    const depth = UNFRAMED.has(def.id) ? 0.04 : 0.03;
    const canvasMat = new THREE.MeshStandardMaterial({
      map: surf.texture, emissive: 0xffffff, emissiveMap: surf.texture, emissiveIntensity: 0.22,
      roughness: 0.85, alphaTest: 0.5,
    });
    const canvas = new THREE.Mesh(new THREE.BoxGeometry(def.w, def.h, depth), canvasMat);
    canvas.position.z = depth / 2 + 0.02;
    canvas.castShadow = true;
    canvas.userData.hit = { kind: 'canvas', art };
    group.add(canvas); targets.push(canvas);
    art.canvas = canvas; art.depth = depth;
    // frame
    if (!UNFRAMED.has(def.id)) {
      const ft = THREE.MathUtils.clamp(0.05 + 0.035 * Math.max(def.w, def.h), 0.06, 0.24), fd = 0.1;
      const bars = [
        [def.w + 2 * ft, ft, 0, def.h / 2 + ft / 2], [def.w + 2 * ft, ft, 0, -def.h / 2 - ft / 2],
        [ft, def.h, -def.w / 2 - ft / 2, 0], [ft, def.h, def.w / 2 + ft / 2, 0],
      ];
      for (const [bw, bh, bx, by] of bars) {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, fd), giltMat);
        bar.position.set(bx, by, fd / 2);
        bar.castShadow = true;
        bar.userData.hit = { kind: 'frame', art };
        group.add(bar); targets.push(bar);
        art.frames.push(bar);
      }
      art.frameT = ft;
    } else if (def.id === 'mondrian') {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(def.w + 0.03, def.h + 0.03, 0.02), stripMat);
      bar.position.z = 0.01; group.add(bar);
    }
    // protective glass
    if (def.glass) {
      const bp = def.glass === 'bulletproof';
      const gs = new GlassSurface(def.w, def.h);
      const glassMat = new THREE.MeshStandardMaterial({
        color: bp ? 0xd8f0e8 : 0xffffff, transparent: true, opacity: bp ? 0.16 : 0.08,
        roughness: 0.03, metalness: 0.4, depthWrite: false,
      });
      const glass = new THREE.Mesh(new THREE.BoxGeometry(def.w, def.h, bp ? 0.02 : 0.006), glassMat);
      glass.position.z = 0.085;
      glass.userData.hit = { kind: 'glass', art };
      glass.renderOrder = 2;
      const overlay = new THREE.Mesh(new THREE.PlaneGeometry(def.w, def.h), new THREE.MeshStandardMaterial({
        map: gs.texture, transparent: true, depthWrite: false, roughness: 0.4,
      }));
      overlay.position.z = 0.085 + (bp ? 0.018 : 0.01);
      overlay.renderOrder = 3;
      group.add(glass, overlay); targets.push(glass);
      art.glass = { mesh: glass, overlay, surface: gs, hp: bp ? 12 : 2.2, max: bp ? 12 : 2.2, bulletproof: bp, broken: false };
    }
    // placard
    const pw = 0.34, ph = 0.2;
    const plac = new THREE.Mesh(new THREE.BoxGeometry(pw, ph, 0.01), new THREE.MeshStandardMaterial({ map: placardTexture(def), roughness: 0.7 }));
    plac.position.set(def.w / 2 + (art.frameT || 0) + 0.3, 1.35 - y, 0.02);
    plac.userData.hit = { kind: 'placard', art };
    group.add(plac); targets.push(plac);
    scene.add(group);
    arts.push(art); byId[def.id] = art;
  }

  // ---------- sculptures ----------
  for (const def of ARTWORKS) {
    if (def.kind !== 'sculpture') continue;
    const [x, z, ph, pw, rot] = PLINTH[def.id];
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(pw, ph, pw), plinthMat);
    plinth.position.set(x, ph / 2, z);
    plinth.castShadow = plinth.receiveShadow = true;
    plinth.userData.hit = { kind: 'plinth' };
    scene.add(plinth); targets.push(plinth);
    physics.addStaticBox(plinth.position, new THREE.Vector3(pw / 2, ph / 2, pw / 2));
    addCollider(x - pw / 2, x + pw / 2, z - pw / 2, z + pw / 2);

    const design = BUILDERS[def.shape]();
    design.rotation.y = rot;
    design.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(design);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const group = new THREE.Group();
    for (const child of [...design.children]) {
      child.geometry.applyMatrix4(new THREE.Matrix4().makeRotationY(rot));
      child.geometry.translate(-center.x, -center.y, -center.z);
      child.castShadow = true; child.receiveShadow = true;
      group.add(child);
    }
    group.position.set(x, ph + (center.y - box.min.y) + 0.002, z);
    scene.add(group);
    const art = newArtState(def, group);
    art.size = size;
    art.restY = group.position.y;
    art.facing = rot;
    group.children.forEach(c => { c.userData.hit = { kind: 'sculpture', art }; targets.push(c); });
    const mass = MASS[def.id];
    const shape = physics.boxShape(size.x / 2, size.y / 2, size.z / 2);
    art.body = physics.addBody(group, shape, mass, { friction: 0.7, restitution: 0.1, angDamp: 0.3 });
    art.mass = mass;
    arts.push(art); byId[def.id] = art;
  }

  return { colliders, targets, arts, byId, spawn: new THREE.Vector3(0, 0, 8) };
}

function newArtState(def, group) {
  return {
    def, group, damage: 0, byWeapon: {}, cost: 0, extraCost: 0, destroyed: false,
    frames: [], glass: null, burning: 0, burnSpots: [], toppled: false, firstHit: null,
    tilt: 0, lastStroke: null, quipped: {},
  };
}
