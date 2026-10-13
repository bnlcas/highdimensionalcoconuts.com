import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Physics, loadAmmo } from './physics.js';
import { buildMuseum } from './museum.js';
import { ARTWORKS } from './artworks.js';
import { loadSculptureModels } from './models.js';
import { Effects } from './effects.js';
import { Sfx } from './audio.js';
import { Input, Player } from './player.js';
import { Game } from './game.js';
import { Destruction } from './destruction.js';
import { WeaponSystem } from './weapons.js';
import { Pickups } from './pickups.js';

const $ = (id) => document.getElementById(id);
const canvas = $('c');
const isTouch = matchMedia('(pointer: coarse)').matches;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, isTouch ? 1.5 : 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.9;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xd9d6cf);
const pmrem = new THREE.PMREMGenerator(renderer);
const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environment = envTex;
scene.environmentIntensity = 0.35;

scene.add(new THREE.HemisphereLight(0xfff6e8, 0x6e6252, 0.8));
const sun = new THREE.DirectionalLight(0xfff2dc, 1.1);
sun.position.set(6, 30, 0);
sun.target.position.set(0, 0, -10);
sun.castShadow = true;
sun.shadow.mapSize.set(isTouch ? 1024 : 4096, isTouch ? 1024 : 4096);
Object.assign(sun.shadow.camera, { left: -34, right: 34, top: 22, bottom: -22, near: 1, far: 60 });
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.04;
scene.add(sun, sun.target);

const camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, 0.08, 150);
const vmScene = new THREE.Scene();
vmScene.environment = envTex;
vmScene.add(new THREE.HemisphereLight(0xffffff, 0x665544, 1.6));
const vmSun = new THREE.DirectionalLight(0xffffff, 1.8);
vmSun.position.set(1, 2, 1);
vmScene.add(vmSun);
const vmCamera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.01, 5);

let physics, museum, effects, sfx, input, player, game, destruction, weapons, pickups;

async function boot() {
  let A;
  try { A = await loadAmmo(); }
  catch (e) { $('loading').textContent = 'Could not load the physics engine (Ammo.js). Check your connection and reload.'; throw e; }
  physics = new Physics(A, scene);
  const models = await loadSculptureModels(ARTWORKS, (done, total) => {
    $('loading').textContent = `Unpacking sculptures… ${done} / ${total}`;
  });
  museum = buildMuseum(scene, physics, renderer, models);
  effects = new Effects(scene);
  sfx = new Sfx();
  input = new Input(canvas);
  player = new Player();
  player.reset(museum.spawn);
  game = new Game({ museum, sfx, effects, isTouch });
  destruction = new Destruction({ scene, physics, effects, sfx, game, targets: museum.targets, arts: museum.arts });
  weapons = new WeaponSystem({ scene, camera, vmScene, effects, physics, sfx, destruction, targets: museum.targets });
  game.setWeapons(weapons);
  pickups = new Pickups({ scene, effects, sfx, game, colliders: museum.colliders });
  game.refreshWeaponBar();
  window.artBlaster = { game, museum, physics, player, weapons, destruction, input, pickups }; // for poking at in the console
  wireUI();
  onResize();
  $('loading').remove();
  renderSculptureThumbs();
  // let sculptures settle onto their plinths before anyone arrives
  for (let i = 0; i < 30; i++) physics.step(1 / 60);
  window.artBlaster.tick = (n = 1) => { for (let i = 0; i < n; i++) tick(1 / 60); };
  requestAnimationFrame(frame);
}

// Studio portraits of each sculpture for the placard card and the final report: render each one
// alone onto the main canvas and copy the center square out before the first real frame.
function renderSculptureThumbs() {
  const ts = new THREE.Scene();
  ts.background = new THREE.Color(0x3a342e);
  ts.environment = envTex;
  ts.add(new THREE.HemisphereLight(0xfff6e8, 0x5a5048, 1.3));
  const key = new THREE.DirectionalLight(0xffffff, 2.0);
  key.position.set(2, 4, 3);
  ts.add(key);
  const cam = new THREE.PerspectiveCamera(30, 1, 0.01, 100);
  // render at a fixed square size so this works even if the window is tiny or not laid out yet
  const prevRatio = renderer.getPixelRatio();
  renderer.setPixelRatio(1);
  renderer.setSize(320, 320, false);
  const out = document.createElement('canvas');
  out.width = out.height = 320;
  const g = out.getContext('2d');
  for (const art of museum.arts) {
    if (art.def.kind !== 'sculpture') continue;
    // (Object3D.clone would deep-copy userData, which holds circular physics references)
    const clone = new THREE.Group();
    for (const c of art.group.children) clone.add(new THREE.Mesh(c.geometry, c.material));
    ts.add(clone);
    const sphere = new THREE.Box3().setFromObject(clone).getBoundingSphere(new THREE.Sphere());
    const dist = sphere.radius / Math.sin(THREE.MathUtils.degToRad(cam.fov / 2)) * 1.02;
    const view = new THREE.Vector3(0.5, 0.22, 1).normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), art.facing || 0);
    cam.position.copy(sphere.center).addScaledVector(view, dist);
    cam.lookAt(sphere.center);
    cam.aspect = 1;
    cam.updateProjectionMatrix();
    renderer.render(ts, cam);
    g.drawImage(renderer.domElement, 0, 0, 320, 320);
    art.thumb = out.toDataURL('image/jpeg', 0.85);
    ts.remove(clone);
  }
  renderer.setPixelRatio(prevRatio);
  onResize();
}

function setState(s) {
  game.state = s;
  document.body.classList.toggle('playing', s === 'play');
  $('pause').classList.toggle('open', s === 'paused');
}

function startGame(mode) {
  sfx.unlock();
  $('menu').classList.remove('open');
  game.start(mode);
  if (mode === 'free') { pickups.takeAll(); weapons.select(1); game.refreshWeaponBar(); }
  setState('play');
  input.lock();
}

function resume() {
  setState('play');
  input.lock();
}

function closeInspect() {
  $('inspect').classList.remove('open');
  resume();
}

function wireUI() {
  $('play-timed').addEventListener('click', () => startGame('timed'));
  $('play-free').addEventListener('click', () => startGame('free'));
  $('resume').addEventListener('click', resume);
  $('end-run').addEventListener('click', () => { $('pause').classList.remove('open'); game.finish(); setState('over'); });
  $('restart').addEventListener('click', () => location.reload());
  $('again').addEventListener('click', () => location.reload());
  $('inspect-close').addEventListener('click', closeInspect);
  $('mute').addEventListener('click', () => { sfx.setMuted(!sfx.muted); $('mute').textContent = sfx.muted ? 'Sound: off' : 'Sound: on'; });
  canvas.addEventListener('click', () => { if (game.state === 'play' && !input.locked) input.lock(); });

  input.on('weapon', (i) => game.trySelect(i));
  input.on('cycle', (d) => game.cycle(d));
  input.on('mute', () => sfx.setMuted(!sfx.muted));
  input.on('inspect', () => {
    if (game.state === 'inspect') { closeInspect(); return; }
    if (game.state === 'play' && game.lookArt) {
      setState('inspect');
      input.unlock();
      game.openInspect(game.lookArt);
    }
  });
  input.on('unlock', () => { if (game.state === 'play' && !isTouch) setState('paused'); });
  input.on('pause', () => { if (game.state === 'play') setState('paused'); });
  addEventListener('keydown', (e) => {
    if (e.code === 'Escape' && game.state === 'inspect') closeInspect();
  });
  if (isTouch) input.setupTouch($('touch'));
  addEventListener('resize', onResize);
}

function onResize() {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = vmCamera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix(); vmCamera.updateProjectionMatrix();
  if (effects) effects.setScale(renderer.getDrawingBufferSize(new THREE.Vector2()).y / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))));
}

let last = performance.now(), t = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  tick(dt);
}

function tick(dt) {
  t += dt;
  const playing = game.state === 'play';
  if (playing) {
    player.update(dt, input, museum.colliders);
    weapons.update(dt, input.firing, player.vel, t);
    pickups.update(dt, t, player.pos, game.bill);
  }
  if (playing || game.state === 'over') {
    physics.step(dt, sfx);
    destruction.update(dt);
  }
  effects.update(dt);
  if (game.state === 'menu') {
    player.yaw = Math.sin(t * 0.12) * 0.55;
    player.pitch = 0.08;
  }
  player.applyCamera(camera, playing ? effects.shakeAmt : 0);
  const look = playing ? weapons.lookAt() : null;
  game.update(dt, look);
  if (game.state === 'over' && document.body.classList.contains('playing')) {
    setState('over');
    input.unlock();
    sfx.flame(false);
  }

  renderer.autoClear = true;
  renderer.render(scene, camera);
  if (playing) {
    renderer.autoClear = false;
    renderer.clearDepth();
    renderer.render(vmScene, vmCamera);
  }
}

boot();
