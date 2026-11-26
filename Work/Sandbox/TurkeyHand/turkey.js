// Hand Turkey — a web port of the old Snapchat Thanksgiving lens.
//
// MediaPipe's HandLandmarker tracks 21 hand landmarks; rig.js poses a rigged
// hand mesh to match, textured so the fingers read as feathers. The thumb
// carries the head: an eye, a beak and a pilgrim hat. The camera feed, the
// turkey and the title are all drawn into one WebGL canvas, which is also
// what gets recorded.
//
// URL flags: ?debug shows the tuning panel and log; ?video=<file> plays a
// clip instead of the camera (for testing); ?mirror=0 turns mirroring off.

import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import { HandRig, LandmarkSmoother } from "./rig.js";
import { initRecording } from "./recorder.js";

const log = (m, cls) => window.__log(m, cls);
const query = new URLSearchParams(location.search);
const DEBUG = query.has("debug");
const TEST_VIDEO = query.get("video");

const TITLE = "Happy Thanksgiving!";
const MEDIAPIPE_WASM = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm";
const HAND_MODEL = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task";

// Tunables (all in the debug panel). Head part sizes and offsets are in
// millimetres of the hand model, so they scale with the hand on screen.
const params = {
  mirror: query.get("mirror") !== "0",
  stretch: true,
  skeleton: false,
  zScale: 1.0,
  xyMinCutoff: 1.2, xyBeta: 8,
  zMinCutoff: 0.4, zBeta: 2,
  eyeT: 0.6, eyeUp: 2, eyeZ: 12, eyeR: 3.5,
  beakAlong: 12, beakUp: -2, beakZ: 6, beakSize: 13,
  hatUp: 8.5, hatAlong: -6, hatZ: 0, hatSize: 26, hatTilt: 6,
};

const video = document.getElementById("cam");
const canvas = document.getElementById("view");
const statusEl = document.getElementById("status");
const setStatus = (msg) => { statusEl.textContent = msg; };

// ---------------------------------------------------------------------------
// Scene. Orthographic, in video pixels: x right, y up (so y = -row), z toward
// the camera (so z = -MediaPipe depth). Landmarks map straight through.
// ---------------------------------------------------------------------------

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); // canvas pixels = video pixels = recorded pixels

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(0, 1, 0, -1, 1, 6000);
camera.position.z = 3000;
scene.add(new THREE.HemisphereLight(0xffffff, 0x7a5a3a, 2.2));
const sun = new THREE.DirectionalLight(0xffffff, 1.6);
sun.position.set(0.4, 1, 1);
scene.add(sun);

let W = 0, H = 0;

const videoTex = new THREE.VideoTexture(video);
videoTex.colorSpace = THREE.SRGBColorSpace;
const background = new THREE.Mesh(
  new THREE.PlaneGeometry(1, 1),
  new THREE.MeshBasicMaterial({ map: videoTex, depthTest: false, depthWrite: false }),
);
background.renderOrder = -1;
background.position.z = -2500;
scene.add(background);

function applyMirror() {
  videoTex.repeat.x = params.mirror ? -1 : 1;
  videoTex.offset.x = params.mirror ? 1 : 0;
}
applyMirror();

function setFrameSize(w, h) {
  W = w; H = h;
  camera.right = w;
  camera.bottom = -h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
  background.scale.set(w, h, 1);
  background.position.set(w / 2, -h / 2, background.position.z);
  placeTitle();
  layout();
  log(`frame ${w}x${h}`);
}

// Letterbox the canvas into the window, so what you see is what's recorded.
function layout() {
  if (!W) return;
  const scale = Math.min(window.innerWidth / W, window.innerHeight / H);
  canvas.style.width = Math.round(W * scale) + "px";
  canvas.style.height = Math.round(H * scale) + "px";
}
window.addEventListener("resize", layout);

// --- title ---

let title = null;

async function makeTitle() {
  await document.fonts.load("100px Chewy").catch(() => {});
  const c = document.createElement("canvas");
  c.width = 2048; c.height = 300;
  const x = c.getContext("2d");
  let size = 210;
  do { x.font = `${size}px Chewy, cursive`; size -= 10; } while (x.measureText(TITLE).width > 1880);
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.lineJoin = "round";
  x.lineWidth = 30;
  x.strokeStyle = "#4a2a0e";
  x.strokeText(TITLE, 1024, 155);
  x.fillStyle = "#ffe9c2";
  x.fillText(TITLE, 1024, 155);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  title = new THREE.Mesh(new THREE.PlaneGeometry(1, 300 / 2048),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false }));
  title.renderOrder = 100;
  scene.add(title);
  placeTitle();
}

function placeTitle() {
  if (!title || !W) return;
  const w = Math.min(0.9 * W, 1.1 * H);
  title.scale.setScalar(w);
  title.position.set(W / 2, -(0.03 * H + w * 300 / 2048 / 2), 1000);
}

// --- turkey head: eye, beak, hat ---

const head = new THREE.Group();
head.visible = false;
scene.add(head);

const eye = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16),
  new THREE.MeshLambertMaterial({ color: 0x050505 }));
head.add(eye);

// Beak: two flat-shaded triangular pyramids, apex along local +x.
function makeBeak() {
  const v = [[1, 0, 0], [0, 0.42, 0], [0, -0.05, 0.3], [0, -0.05, -0.3]];
  const faces = [[0, 1, 2], [0, 2, 3], [0, 3, 1], [1, 3, 2]];
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(faces.flat().flatMap((i) => v[i]), 3));
  geo.computeVertexNormals();
  const mat = (color) => new THREE.MeshLambertMaterial({ color, flatShading: true, side: THREE.DoubleSide });
  const upper = new THREE.Mesh(geo, mat(0xf2a516));
  upper.position.y = 0.05;
  upper.rotation.z = 0.14; // open the bill ~16° in total
  const lower = new THREE.Mesh(geo, mat(0xd9840f));
  lower.scale.set(0.75, -0.6, 0.85);
  lower.position.y = -0.05;
  lower.rotation.z = -0.14;
  const g = new THREE.Group();
  g.add(upper, lower);
  return g;
}
const beak = makeBeak();
head.add(beak);

// Placeholder pilgrim hat, 1 unit tall, brim on y = 0, buckle facing +z.
// Swap for a real model by replacing this group.
function makeHat() {
  const black = new THREE.MeshLambertMaterial({ color: 0x1d1c20 });
  const g = new THREE.Group();
  const add = (geo, mat, y, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(0, y, z); g.add(m); };
  add(new THREE.CylinderGeometry(0.85, 0.85, 0.06, 40), black, 0.03);
  add(new THREE.CylinderGeometry(0.4, 0.48, 0.94, 40), black, 0.53);
  add(new THREE.CylinderGeometry(0.47, 0.485, 0.2, 40), new THREE.MeshLambertMaterial({ color: 0x3b2614 }), 0.17);
  add(new THREE.BoxGeometry(0.3, 0.24, 0.04), new THREE.MeshLambertMaterial({ color: 0xe0b54a }), 0.17, 0.48);
  add(new THREE.BoxGeometry(0.17, 0.12, 0.04), new THREE.MeshLambertMaterial({ color: 0x3b2614 }), 0.17, 0.495);
  return g;
}
const hat = makeHat();
head.add(hat);

const Z = new THREE.Vector3(0, 0, 1);
const _thumb = new THREE.Vector3(), _up = new THREE.Vector3(), _side = new THREE.Vector3();
const _anchor = new THREE.Vector3(), _basis = new THREE.Matrix4(), _tilt = new THREE.Quaternion();

// The head lives in the screen plane: "up" for the head is perpendicular to
// the thumb (thumb × z), flipped to the fingers' side of the thumb.
function updateHead(P, s) {
  const mm = s / 1000;
  const ip = P[3], tip = P[4];
  _thumb.set(tip.x - ip.x, tip.y - ip.y, 0).normalize();
  _up.crossVectors(_thumb, Z);
  if (_up.x * (P[9].x - P[0].x) + _up.y * (P[9].y - P[0].y) < 0) _up.negate();

  _anchor.lerpVectors(ip, tip, params.eyeT);

  eye.position.copy(_anchor).addScaledVector(_up, params.eyeUp * mm);
  eye.position.z += params.eyeZ * mm;
  eye.scale.setScalar(params.eyeR * mm);

  // Beak frame: x along the thumb, y = up (so the upper beak stays on top).
  beak.position.copy(tip)
    .addScaledVector(_thumb, params.beakAlong * mm)
    .addScaledVector(_up, params.beakUp * mm);
  beak.position.z += params.beakZ * mm;
  beak.quaternion.setFromRotationMatrix(_basis.makeBasis(_thumb, _up, _side.crossVectors(_thumb, _up)));
  beak.scale.setScalar(params.beakSize * mm);

  // Hat frame: y = up, z = toward camera (buckle always faces us); tilt
  // leans it away from the beak.
  hat.position.copy(_anchor)
    .addScaledVector(_up, params.hatUp * mm)
    .addScaledVector(_thumb, params.hatAlong * mm);
  hat.position.z += params.hatZ * mm;
  _side.crossVectors(_up, Z);
  hat.quaternion.setFromRotationMatrix(_basis.makeBasis(_side, _up, Z));
  const lean = Math.sign(_side.dot(_thumb)) * THREE.MathUtils.degToRad(params.hatTilt);
  hat.quaternion.multiply(_tilt.setFromAxisAngle(Z, lean));
  hat.scale.setScalar(params.hatSize * mm);
}

// --- debug skeleton ---

const BONES = [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 9], [9, 13], [13, 17], [0, 17]];
for (let f = 0; f < 4; f += 1) for (let j = 0; j < 3; j += 1) BONES.push([5 + 4 * f + j, 6 + 4 * f + j]);
const skeleton = new THREE.LineSegments(
  new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(BONES.length * 6, 3)),
  new THREE.LineBasicMaterial({ color: 0x39d0ff, depthTest: false }),
);
skeleton.renderOrder = 50;
skeleton.frustumCulled = false;
skeleton.visible = false;
scene.add(skeleton);

function updateSkeleton(P) {
  const pos = skeleton.geometry.attributes.position;
  BONES.forEach(([a, b], i) => {
    pos.setXYZ(2 * i, P[a].x, P[a].y, P[a].z);
    pos.setXYZ(2 * i + 1, P[b].x, P[b].y, P[b].z);
  });
  pos.needsUpdate = true;
}

// ---------------------------------------------------------------------------
// Assets, tracker, audio
// ---------------------------------------------------------------------------

let rigs = null;

async function loadHands() {
  const loader = new GLTFLoader();
  const [left, right, tex] = await Promise.all([
    loader.loadAsync("assets/hand-left.glb"),
    loader.loadAsync("assets/hand-right.glb"),
    new THREE.TextureLoader().loadAsync("assets/turkey-texture.png"),
  ]);
  tex.flipY = false; // glTF UV convention
  tex.colorSpace = THREE.SRGBColorSpace;
  rigs = { Left: new HandRig(left, tex), Right: new HandRig(right, tex) };
  for (const rig of Object.values(rigs)) {
    rig.root.visible = false;
    scene.add(rig.root);
  }
  log("hands: loaded");
}

let landmarker = null;

async function loadTracker() {
  const fileset = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM);
  const options = (delegate) => ({
    baseOptions: { modelAssetPath: HAND_MODEL, delegate },
    runningMode: "VIDEO",
    numHands: 1,
  });
  try {
    landmarker = await HandLandmarker.createFromOptions(fileset, options("GPU"));
    log("tracker: ready (GPU)");
  } catch (err) {
    log("tracker: GPU failed (" + err.message + "), using CPU", "warn");
    landmarker = await HandLandmarker.createFromOptions(fileset, options("CPU"));
    log("tracker: ready (CPU)");
  }
}

// Everything audible goes through `mix`, which feeds both the speakers and
// the recorder. The mic only feeds the recorder.
let audioCtx = null, mix = null, gobbleBuffer = null, lastGobble = -Infinity;

function initAudio() {
  // Must happen synchronously inside the tap, or iOS keeps audio locked.
  audioCtx = new AudioContext();
  audioCtx.resume();
  mix = audioCtx.createMediaStreamDestination();
  fetch("assets/gobble_mono.mp3")
    .then((r) => r.arrayBuffer())
    .then((b) => audioCtx.decodeAudioData(b))
    .then((buf) => { gobbleBuffer = buf; })
    .catch((err) => log("audio: gobble failed to load: " + err.message, "warn"));
}

function gobble() {
  const now = performance.now();
  if (!gobbleBuffer || now - lastGobble < 2000) return;
  lastGobble = now;
  const src = audioCtx.createBufferSource();
  src.buffer = gobbleBuffer;
  src.connect(audioCtx.destination);
  src.connect(mix);
  src.start();
}

// ---------------------------------------------------------------------------
// Camera
// ---------------------------------------------------------------------------

async function startSource() {
  if (TEST_VIDEO) {
    video.src = TEST_VIDEO;
    video.loop = true;
    await video.play();
    log("source: test video " + TEST_VIDEO);
    return;
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("camera API unavailable (needs https or localhost)");
  }
  const videoConstraints = { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } };
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints, audio: true });
  } catch (err) {
    log("camera+mic refused (" + err.name + "), retrying camera only", "warn");
    stream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints, audio: false });
  }
  const mic = stream.getAudioTracks();
  if (mic.length) audioCtx.createMediaStreamSource(new MediaStream(mic)).connect(mix);
  video.srcObject = new MediaStream(stream.getVideoTracks());
  await video.play();
  log("source: camera" + (mic.length ? " + mic" : ""));
}

// ---------------------------------------------------------------------------
// Per-frame tracking
// ---------------------------------------------------------------------------

// MediaPipe's label is the hand's chirality as it appears in the frame we
// feed it (verified against palm geometry on a test clip). Mirroring the
// display flips it.
const flip = (side) => (side === "Left" ? "Right" : "Left");
const displayedSide = (label) => (params.mirror ? flip(label) : label);

const P = Array.from({ length: 21 }, () => new THREE.Vector3());
const smoother = new LandmarkSmoother();
let lastVideoTime = -1, lastSeen = -Infinity, handShown = false, activeRig = null;

function track(now) {
  const result = landmarker.detectForVideo(video, now);
  const lm = result.landmarks[0];
  if (!lm) {
    if (handShown && now - lastSeen > 150) hideHand();
    if (!handShown) setStatus("Show your hand ✋");
    return;
  }
  if (now - lastSeen > 300) smoother.reset();
  if (!handShown && now - lastSeen > 1500) gobble();
  lastSeen = now;

  lm.forEach((p, i) => P[i].set((params.mirror ? 1 - p.x : p.x) * W, -p.y * H, -p.z * W * params.zScale));
  smoother.apply(P, now / 1000, W, params);

  const rig = rigs[displayedSide(result.handedness[0][0].categoryName)];
  if (rig !== activeRig) {
    if (activeRig) activeRig.root.visible = false;
    activeRig = rig;
  }
  rig.root.visible = true;
  rig.pose(P, params.stretch);
  head.visible = true;
  updateHead(P, rig.scale);
  skeleton.visible = params.skeleton;
  if (params.skeleton) updateSkeleton(P);
  handShown = true;
  setStatus("");
}

function hideHand() {
  handShown = false;
  head.visible = false;
  skeleton.visible = false;
  if (activeRig) activeRig.root.visible = false;
}

function frame() {
  requestAnimationFrame(frame);
  if (video.readyState < 2) return;
  if (video.videoWidth !== W || video.videoHeight !== H) setFrameSize(video.videoWidth, video.videoHeight);
  if (landmarker && rigs && video.currentTime !== lastVideoTime) {
    lastVideoTime = video.currentTime;
    track(performance.now());
  }
  renderer.render(scene, camera);
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

// Loading progress: a step list on the start card, and once Start is tapped,
// the status pill names whatever is still loading.
const stepList = document.getElementById("loadSteps");
let waitingOnLoad = false;

function showPending() {
  const pending = [...stepList.querySelectorAll("li.loading")].map((li) => li.textContent.toLowerCase());
  if (waitingOnLoad && pending.length) setStatus(`Warming up the oven… loading ${pending.join(" & ")}`);
}

function step(key, promise) {
  const li = stepList.querySelector(`[data-step="${key}"]`);
  return promise.then(
    (v) => { li.className = "done"; showPending(); return v; },
    (err) => { li.className = "error"; throw err; },
  );
}

const ready = Promise.all([
  step("hands", loadHands()),
  step("tracker", loadTracker()),
  makeTitle(),
]);
ready.catch((err) => {
  log("load failed: " + err.message, "err");
  setStatus("Couldn't load the turkey — try reloading");
});

document.getElementById("startBtn").addEventListener("click", async () => {
  initAudio();
  document.getElementById("start").hidden = true;
  setStatus("Starting camera…");
  try {
    await startSource();
  } catch (err) {
    log("camera failed: " + err.name + " " + err.message, "err");
    setStatus("Camera unavailable — check permissions");
    return;
  }
  initRecording({
    canvas,
    audioStream: mix.stream,
    button: document.getElementById("recordBtn"),
    sheet: document.getElementById("sheet"),
    onHint: (msg) => { setStatus(msg); setTimeout(() => setStatus(""), 2000); },
  });
  frame();
  waitingOnLoad = true;
  showPending();
  await ready;
  waitingOnLoad = false;
  setStatus("Show your hand ✋");
  // Gobble on load (the buffer may still be decoding, so give it a moment).
  setTimeout(gobble, 300);
});

// ---------------------------------------------------------------------------
// Debug panel (?debug)
// ---------------------------------------------------------------------------

const PANEL = [
  ["View"],
  ["mirror", "Mirror"], ["skeleton", "Show landmarks"], ["stretch", "Stretch bones to fit"],
  ["Tracking"],
  ["zScale", "Depth scale", 0, 3, 0.05],
  ["xyMinCutoff", "x/y smoothing cutoff (Hz)", 0.05, 5, 0.05], ["xyBeta", "x/y speed response", 0, 40, 0.5],
  ["zMinCutoff", "z smoothing cutoff (Hz)", 0.05, 5, 0.05], ["zBeta", "z speed response", 0, 40, 0.5],
  ["Eye (mm)"],
  ["eyeT", "Along thumb (IP→tip)", 0, 1, 0.01], ["eyeUp", "Up", -15, 15, 0.5],
  ["eyeZ", "Toward camera", 0, 30, 0.5], ["eyeR", "Radius", 1, 10, 0.25],
  ["Beak (mm)"],
  ["beakAlong", "Past thumb tip", -15, 30, 0.5], ["beakUp", "Up", -15, 15, 0.5],
  ["beakZ", "Toward camera", -20, 20, 0.5],
  ["beakSize", "Size", 2, 30, 0.5],
  ["Hat (mm)"],
  ["hatUp", "Up", -10, 40, 0.5], ["hatAlong", "Along thumb", -30, 30, 0.5],
  ["hatZ", "Toward camera", -20, 20, 0.5], ["hatSize", "Size", 5, 60, 0.5], ["hatTilt", "Lean back (°)", -45, 45, 1],
];

function buildPanel() {
  document.body.classList.add("debug");
  const panel = document.getElementById("panel");
  for (const [key, label, min, max, step] of PANEL) {
    if (!label) {
      panel.insertAdjacentHTML("beforeend", `<h2>${key}</h2>`);
      continue;
    }
    const row = document.createElement("label");
    if (typeof params[key] === "boolean") {
      row.className = "check";
      row.innerHTML = `<input type="checkbox"> ${label}`;
      const input = row.querySelector("input");
      input.checked = params[key];
      input.addEventListener("change", () => {
        params[key] = input.checked;
        if (key === "mirror") applyMirror();
      });
    } else {
      row.innerHTML = `<span>${label}</span><output></output><input type="range" min="${min}" max="${max}" step="${step}">`;
      const input = row.querySelector("input"), out = row.querySelector("output");
      input.value = params[key];
      out.textContent = params[key];
      input.addEventListener("input", () => { params[key] = +input.value; out.textContent = input.value; });
    }
    panel.appendChild(row);
  }
  const copy = document.createElement("button");
  copy.textContent = "Copy settings";
  copy.addEventListener("click", () => {
    const json = JSON.stringify(params);
    navigator.clipboard.writeText(json).then(() => log("copied: " + json), () => log(json));
  });
  panel.appendChild(copy);
}

if (DEBUG) buildPanel();

// Console hooks. step() tracks + renders the current video frame by hand,
// for testing with ?video=… where requestAnimationFrame can't be relied on.
window.turkey = {
  params, P, scene, camera, renderer, video, ready,
  get rigs() { return rigs; },
  step() {
    if (video.videoWidth !== W || video.videoHeight !== H) setFrameSize(video.videoWidth, video.videoHeight);
    track(performance.now());
    videoTex.needsUpdate = true; // a paused, seeked video doesn't signal new frames
    renderer.render(scene, camera);
  },
};
