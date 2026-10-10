// Thin wrapper around Ammo.js (Bullet): static architecture, dynamic debris, sculptures, cans.
import * as THREE from 'three';

const MAX_ACTIVE = 260;      // simulated debris bodies before the oldest are frozen in place
const MAX_FROZEN = 900;      // frozen debris meshes kept in the scene

export class Physics {
  constructor(A, scene) {
    this.A = A;
    this.scene = scene;
    const cfg = new A.btDefaultCollisionConfiguration();
    const disp = new A.btCollisionDispatcher(cfg);
    const bp = new A.btDbvtBroadphase();
    const solver = new A.btSequentialImpulseConstraintSolver();
    this.world = new A.btDiscreteDynamicsWorld(disp, bp, solver, cfg);
    this.world.setGravity(new A.btVector3(0, -9.81, 0));
    this.tmpT = new A.btTransform();
    this.v1 = new A.btVector3(0, 0, 0);
    this.v2 = new A.btVector3(0, 0, 0);
    this.q1 = new A.btQuaternion(0, 0, 0, 1);
    this.bodies = [];   // {mesh, body, debris, born, sleepT, onImpact, prevSpeed}
    this.frozen = [];
    this.time = 0;
  }

  _transform(pos, quat) {
    const A = this.A, t = new A.btTransform();
    t.setIdentity();
    t.setOrigin(new A.btVector3(pos.x, pos.y, pos.z));
    if (quat) t.setRotation(new A.btQuaternion(quat.x, quat.y, quat.z, quat.w));
    return t;
  }

  addStaticBox(center, half, rotY = 0) {
    const A = this.A;
    const shape = new A.btBoxShape(new A.btVector3(half.x, half.y, half.z));
    const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotY);
    const ms = new A.btDefaultMotionState(this._transform(center, q));
    const info = new A.btRigidBodyConstructionInfo(0, ms, shape, new A.btVector3(0, 0, 0));
    const body = new A.btRigidBody(info);
    body.setFriction(0.8);
    body.setRestitution(0.2);
    this.world.addRigidBody(body);
    return body;
  }

  boxShape(hx, hy, hz) { return new this.A.btBoxShape(new this.A.btVector3(hx, hy, hz)); }
  cylinderShape(r, hh) { return new this.A.btCylinderShape(new this.A.btVector3(r, hh, r)); }
  sphereShape(r) { return new this.A.btSphereShape(r); }
  hullShape(points) {
    const A = this.A, s = new A.btConvexHullShape();
    const v = new A.btVector3(0, 0, 0);
    for (let i = 0; i < points.length; i += 3) {
      v.setValue(points[i], points[i + 1], points[i + 2]);
      s.addPoint(v, i + 3 >= points.length);
    }
    A.destroy(v);
    s.setMargin(0.004);
    return s;
  }

  /**
   * Make `mesh` a dynamic body. The mesh must already be in world space (parented to the scene).
   */
  addBody(mesh, shape, mass, opts = {}) {
    const A = this.A;
    const ms = new A.btDefaultMotionState(this._transform(mesh.position, mesh.quaternion));
    const inertia = new A.btVector3(0, 0, 0);
    shape.calculateLocalInertia(mass, inertia);
    const info = new A.btRigidBodyConstructionInfo(mass, ms, shape, inertia);
    const body = new A.btRigidBody(info);
    A.destroy(info); A.destroy(inertia);
    body.setFriction(opts.friction ?? 0.6);
    body.setRestitution(opts.restitution ?? 0.25);
    body.setDamping(opts.linDamp ?? 0.05, opts.angDamp ?? 0.15);
    if (opts.ccd) { body.setCcdMotionThreshold(opts.ccd); body.setCcdSweptSphereRadius(opts.ccd * 0.6); }
    if (opts.vel) { this.v1.setValue(opts.vel.x, opts.vel.y, opts.vel.z); body.setLinearVelocity(this.v1); }
    if (opts.ang) { this.v1.setValue(opts.ang.x, opts.ang.y, opts.ang.z); body.setAngularVelocity(this.v1); }
    this.world.addRigidBody(body);
    const rec = {
      mesh, body, shape, ms, debris: !!opts.debris, born: this.time, sleepT: 0,
      onImpact: opts.onImpact || null, prevSpeed: 0, thud: opts.thud ?? true, mass,
    };
    mesh.userData.phys = rec;
    this.bodies.push(rec);
    if (rec.debris) this._enforceBudget();
    return rec;
  }

  _enforceBudget() {
    const deb = this.bodies.filter(b => b.debris);
    let excess = deb.length - MAX_ACTIVE;
    // settle the oldest first; give fresh debris a moment to fall unless we're far over budget
    for (let i = 0; i < deb.length && excess > 0; i++) {
      if (this.time - deb[i].born < 2 && deb.length - i < MAX_ACTIVE * 2) break;
      this.freeze(deb[i]);
      excess--;
    }
  }

  // stop simulating a body but leave its mesh where it lies (or drop it if it would hang in mid-air)
  freeze(rec) {
    const airborne = rec.mesh.position.y > 0.6 && rec.body.isActive();
    this._destroy(rec);
    if (rec.debris && airborne) {
      rec.mesh.parent && rec.mesh.parent.remove(rec.mesh);
      rec.mesh.userData.onRemove && rec.mesh.userData.onRemove(rec.mesh);
      return;
    }
    if (rec.debris) {
      this.frozen.push(rec.mesh);
      if (this.frozen.length > MAX_FROZEN) {
        const m = this.frozen.shift();
        m.parent && m.parent.remove(m);
        m.geometry && m.geometry.dispose();
        m.userData.onRemove && m.userData.onRemove(m);
      }
    }
  }

  remove(rec) { this._destroy(rec); }

  _destroy(rec) {
    const i = this.bodies.indexOf(rec);
    if (i < 0) return;
    this.bodies.splice(i, 1);
    this.world.removeRigidBody(rec.body);
    this.A.destroy(rec.body);
    this.A.destroy(rec.ms);
    if (!rec.sharedShape) this.A.destroy(rec.shape);
    rec.mesh.userData.phys = null;
  }

  impulse(rec, imp, worldPoint) {
    const rel = worldPoint ? worldPoint.clone().sub(rec.mesh.position) : new THREE.Vector3();
    this.v1.setValue(imp.x, imp.y, imp.z);
    this.v2.setValue(rel.x, rel.y, rel.z);
    rec.body.activate(true);
    rec.body.applyImpulse(this.v1, this.v2);
  }

  velocity(rec) {
    const v = rec.body.getLinearVelocity();
    return new THREE.Vector3(v.x(), v.y(), v.z());
  }

  step(dt, sfx) {
    this.time += dt;
    if (this.bodies.length > MAX_ACTIVE) this._enforceBudget();
    this.world.stepSimulation(dt, 4, 1 / 90);
    const t = this.tmpT;
    for (let i = this.bodies.length - 1; i >= 0; i--) {
      const rec = this.bodies[i];
      rec.ms.getWorldTransform(t);
      const o = t.getOrigin(), q = t.getRotation();
      rec.mesh.position.set(o.x(), o.y(), o.z());
      rec.mesh.quaternion.set(q.x(), q.y(), q.z(), q.w());
      const lv = rec.body.getLinearVelocity();
      const speed = Math.hypot(lv.x(), lv.y(), lv.z());
      const drop = rec.prevSpeed - speed;
      if (drop > 1.6) {
        if (rec.onImpact) rec.onImpact(rec, drop);
        else if (rec.thud && sfx) sfx.play(rec.mass < 0.3 ? 'tink' : 'thud', Math.min(1, drop / 6));
      }
      rec.prevSpeed = speed;
      if (rec.debris) {
        rec.sleepT = rec.body.isActive() ? 0 : rec.sleepT + dt;
        if (rec.sleepT > 1.5 || this.time - rec.born > 14 || o.y() < -5) this.freeze(rec);
      }
    }
  }
}

export async function loadAmmo() {
  if (typeof window.Ammo !== 'function') throw new Error('Ammo.js failed to load');
  return window.Ammo();
}
