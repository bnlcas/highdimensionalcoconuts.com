// Input (mouse + keyboard with pointer lock, or touch joystick + buttons) and first-person movement.
import * as THREE from 'three';

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.lookX = 0; this.lookY = 0;
    this.mouseDown = false;
    this.touchFire = false;
    this.joy = new THREE.Vector2();
    this.locked = false;
    this.handlers = {};
    this.sensitivity = 0.0022;
    this.isTouch = matchMedia('(pointer: coarse)').matches;

    addEventListener('keydown', (e) => {
      if (e.repeat) return;
      this.keys.add(e.code);
      if (/^Digit[1-6]$/.test(e.code)) this.emit('weapon', +e.code.slice(5) - 1);
      if (e.code === 'KeyQ') this.emit('cycle', -1);
      if (e.code === 'KeyE' || e.code === 'KeyF') this.emit('inspect');
      if (e.code === 'KeyM') this.emit('mute');
      if (e.code === 'Space' && this.locked) e.preventDefault();
    });
    addEventListener('keyup', (e) => this.keys.delete(e.code));
    addEventListener('blur', () => { this.keys.clear(); this.mouseDown = false; });
    canvas.addEventListener('mousedown', (e) => {
      if (!this.locked) return;
      if (e.button === 0) this.mouseDown = true;
    });
    addEventListener('mouseup', (e) => { if (e.button === 0) this.mouseDown = false; });
    addEventListener('mousemove', (e) => {
      if (!this.locked) return;
      this.lookX += e.movementX * this.sensitivity;
      this.lookY += e.movementY * this.sensitivity;
    });
    addEventListener('wheel', (e) => { if (this.locked) this.emit('cycle', Math.sign(e.deltaY)); }, { passive: true });
    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === canvas;
      if (!this.locked) { this.mouseDown = false; this.emit('unlock'); }
    });
  }

  on(name, fn) { (this.handlers[name] ||= []).push(fn); }
  emit(name, arg) { (this.handlers[name] || []).forEach(fn => fn(arg)); }

  lock() {
    if (this.isTouch) return;
    const p = this.canvas.requestPointerLock && this.canvas.requestPointerLock();
    if (p && p.catch) p.catch(() => {});
  }
  unlock() { if (document.pointerLockElement) document.exitPointerLock(); }

  get firing() { return this.mouseDown || this.touchFire; }

  moveVector() {
    const v = new THREE.Vector2();
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) v.y += 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) v.y -= 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) v.x -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) v.x += 1;
    v.add(this.joy);
    if (v.lengthSq() > 1) v.normalize();
    return v;
  }

  takeLook() {
    const l = [this.lookX, this.lookY];
    this.lookX = this.lookY = 0;
    return l;
  }

  // ---------- touch controls ----------
  setupTouch(root) {
    document.body.classList.add('touch');
    const joyBase = root.querySelector('#joy'), joyKnob = root.querySelector('#joy-knob');
    let joyId = null, joyStart = new THREE.Vector2(), lookId = null, lookLast = new THREE.Vector2();
    const R = 55;
    root.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.tbtn')) return;
      if (e.clientX < innerWidth * 0.42 && joyId === null) {
        joyId = e.pointerId; joyStart.set(e.clientX, e.clientY);
        joyBase.style.display = 'block';
        joyBase.style.left = (e.clientX - R) + 'px'; joyBase.style.top = (e.clientY - R) + 'px';
        joyKnob.style.transform = 'translate(0px,0px)';
      } else if (lookId === null) {
        lookId = e.pointerId; lookLast.set(e.clientX, e.clientY);
      }
    });
    root.addEventListener('pointermove', (e) => {
      if (e.pointerId === joyId) {
        const d = new THREE.Vector2(e.clientX - joyStart.x, e.clientY - joyStart.y);
        if (d.length() > R) d.setLength(R);
        joyKnob.style.transform = `translate(${d.x}px,${d.y}px)`;
        this.joy.set(d.x / R, -d.y / R);
      } else if (e.pointerId === lookId) {
        this.lookX += (e.clientX - lookLast.x) * 0.006;
        this.lookY += (e.clientY - lookLast.y) * 0.006;
        lookLast.set(e.clientX, e.clientY);
      }
    });
    const end = (e) => {
      if (e.pointerId === joyId) { joyId = null; this.joy.set(0, 0); joyBase.style.display = 'none'; }
      if (e.pointerId === lookId) lookId = null;
    };
    root.addEventListener('pointerup', end);
    root.addEventListener('pointercancel', end);

    const btn = (id, down, up) => {
      const el = root.querySelector(id);
      el.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); down(); });
      if (up) {
        el.addEventListener('pointerup', (e) => { e.preventDefault(); up(); });
        el.addEventListener('pointercancel', up);
        el.addEventListener('pointerleave', up);
      }
    };
    btn('#t-fire', () => { this.touchFire = true; }, () => { this.touchFire = false; });
    btn('#t-next', () => this.emit('cycle', 1));
    btn('#t-jump', () => { this.keys.add('Space'); setTimeout(() => this.keys.delete('Space'), 150); });
    btn('#t-info', () => this.emit('inspect'));
    btn('#t-pause', () => this.emit('pause'));
  }
}

export class Player {
  constructor() {
    this.pos = new THREE.Vector3();
    this.vel = new THREE.Vector3();
    this.yaw = 0; this.pitch = 0;
    this.radius = 0.32;
    this.eyeH = 1.62;
    this.onGround = true;
    this.bob = 0;
    this.speed = 0;
  }

  reset(spawn) {
    this.pos.copy(spawn); this.vel.set(0, 0, 0);
    this.yaw = 0; this.pitch = 0;
  }

  forward() {
    const cp = Math.cos(this.pitch);
    return new THREE.Vector3(-Math.sin(this.yaw) * cp, Math.sin(this.pitch), -Math.cos(this.yaw) * cp);
  }

  update(dt, input, colliders) {
    const [lx, ly] = input.takeLook();
    this.yaw -= lx;
    this.pitch = THREE.MathUtils.clamp(this.pitch - ly, -1.45, 1.45);

    const mv = input.moveVector();
    const sprint = input.keys.has('ShiftLeft') || input.keys.has('ShiftRight');
    const maxSpeed = sprint ? 7.5 : 4.6;
    const fwd = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    const want = fwd.multiplyScalar(mv.y).add(right.multiplyScalar(mv.x)).multiplyScalar(maxSpeed);
    const k = 1 - Math.exp(-dt * (this.onGround ? 12 : 3));
    this.vel.x += (want.x - this.vel.x) * k;
    this.vel.z += (want.z - this.vel.z) * k;

    if (input.keys.has('Space') && this.onGround) { this.vel.y = 4.6; this.onGround = false; }
    this.vel.y -= 14 * dt;
    this.pos.addScaledVector(this.vel, dt);
    if (this.pos.y <= 0) { this.pos.y = 0; this.vel.y = 0; this.onGround = true; }

    // push out of walls, plinths and benches
    for (let iter = 0; iter < 2; iter++) {
      for (const c of colliders) {
        const cx = THREE.MathUtils.clamp(this.pos.x, c.minX, c.maxX);
        const cz = THREE.MathUtils.clamp(this.pos.z, c.minZ, c.maxZ);
        const dx = this.pos.x - cx, dz = this.pos.z - cz;
        const d2 = dx * dx + dz * dz;
        if (d2 < this.radius * this.radius) {
          if (d2 > 1e-8) {
            const d = Math.sqrt(d2), push = this.radius - d;
            this.pos.x += dx / d * push; this.pos.z += dz / d * push;
          } else {
            // center inside the box: push out along the shallowest axis
            const opts = [[c.minX - this.radius - this.pos.x, 0], [c.maxX + this.radius - this.pos.x, 0],
              [0, c.minZ - this.radius - this.pos.z], [0, c.maxZ + this.radius - this.pos.z]];
            opts.sort((a, b) => Math.abs(a[0] + a[1]) - Math.abs(b[0] + b[1]));
            this.pos.x += opts[0][0]; this.pos.z += opts[0][1];
          }
        }
      }
    }
    this.speed = Math.hypot(this.vel.x, this.vel.z);
    if (this.onGround) this.bob += dt * this.speed * 1.9;
  }

  applyCamera(camera, shake) {
    const bobY = Math.sin(this.bob * 2) * 0.035 * Math.min(1, this.speed / 4);
    camera.position.set(this.pos.x, this.pos.y + this.eyeH + bobY, this.pos.z);
    camera.rotation.set(0, 0, 0);
    camera.rotation.order = 'YXZ';
    camera.rotation.y = this.yaw;
    camera.rotation.x = this.pitch;
    if (shake > 0.001) {
      camera.position.x += (Math.random() - 0.5) * shake;
      camera.position.y += (Math.random() - 0.5) * shake;
      camera.rotation.z = (Math.random() - 0.5) * shake * 0.3;
    }
  }
}
