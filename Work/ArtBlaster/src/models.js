// Optional GLTF/GLB models for sculptures. Give an artwork a `model` entry, e.g.
//   model: { url: 'models/david.glb', look: 'marble', rotY: 0 }
// and it replaces the primitive stand-in. The mesh is baked into plain triangles (position, normal, uv),
// scaled to the work's real height (def.h) and set on the floor, so the same Voronoi fracture, physics
// and thumbnails work on it. If a model fails to load, the primitive version is used instead.
//
// Keep models light: about 5k–20k triangles. Fracturing clips every triangle that crosses a crack,
// so very dense scans make shattering stutter. See models/README.md for how to slim a scan down.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { MATERIALS } from './sculptures.js';

const TRI_WARN = 40000;
const TIMEOUT_MS = 20000;

function makeLoader() {
  const loader = new GLTFLoader();
  const draco = new DRACOLoader();
  draco.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/libs/draco/gltf/');
  loader.setDRACOLoader(draco);
  loader.setMeshoptDecoder(MeshoptDecoder);
  return loader;
}

// Bake a loaded scene into a Group of plain meshes standing on y = 0, def.h tall.
export function prepareModel(root, def) {
  const opts = def.model;
  root.updateMatrixWorld(true);
  const parts = [];
  root.traverse((o) => {
    if (!o.isMesh || !o.geometry) return;
    let geo = o.geometry.clone().applyMatrix4(o.matrixWorld);
    if (geo.index) geo = geo.toNonIndexed();
    const clean = new THREE.BufferGeometry();
    clean.setAttribute('position', geo.attributes.position);
    if (!geo.attributes.normal) geo.computeVertexNormals();
    clean.setAttribute('normal', geo.attributes.normal);
    clean.setAttribute('uv', geo.attributes.uv || new THREE.BufferAttribute(new Float32Array(geo.attributes.position.count * 2), 2));
    const srcMat = Array.isArray(o.material) ? o.material[0] : o.material;
    let mat;
    if (opts.look && MATERIALS[opts.look]) mat = MATERIALS[opts.look]();
    else {
      mat = srcMat.clone();
      mat.vertexColors = false;    // vertex colors are dropped above
      mat.side = THREE.FrontSide;
    }
    parts.push(new THREE.Mesh(clean, mat));
  });
  if (!parts.length) throw new Error('no meshes in model');

  const g = new THREE.Group();
  parts.forEach(p => g.add(p));
  if (opts.rotY) parts.forEach(p => p.geometry.rotateY(opts.rotY));
  const box = new THREE.Box3().setFromObject(g);
  const size = box.getSize(new THREE.Vector3());
  const s = (opts.height || def.h) / size.y;
  const c = box.getCenter(new THREE.Vector3());
  let tris = 0;
  for (const p of parts) {
    p.geometry.translate(-c.x, -box.min.y, -c.z);
    p.geometry.scale(s, s, s);
    p.geometry.computeBoundingSphere();
    tris += p.geometry.attributes.position.count / 3;
  }
  if (tris > TRI_WARN) console.warn(`${def.title}: ${tris} triangles; consider simplifying the model for smoother shattering`);
  return g;
}

// Load every sculpture that has a model; resolves to { id: Group } and never rejects.
export async function loadSculptureModels(defs, onProgress) {
  const todo = defs.filter(d => d.kind === 'sculpture' && d.model);
  const out = {};
  if (!todo.length) return out;
  const loader = makeLoader();
  let done = 0;
  await Promise.all(todo.map(async (def) => {
    try {
      const gltf = await Promise.race([
        loader.loadAsync(def.model.url),
        new Promise((_, rej) => setTimeout(() => rej(new Error('timed out')), TIMEOUT_MS)),
      ]);
      out[def.id] = prepareModel(gltf.scene, def);
    } catch (err) {
      console.warn(`Model for ${def.title} unavailable (${err.message}); using the built-in stand-in.`);
    }
    onProgress && onProgress(++done, todo.length);
  }));
  return out;
}
