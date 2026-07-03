import { getNodeMass } from './MobileNode.js';

export const physicsConfig = {
  gravity: 9.8,
  damping: 0.96,
  windStrength: 0.8,
  windVariability: 0.7,
  windFrequency: 0.25,
  windHeadingDeg: 0,    // base compass heading of the wind
  headingWander: 0.6,   // 0 = heading locked, 1 = wanders across the full circle
  autoBalance: true
};

export const DT = 1 / 60;
const DEG2RAD = Math.PI / 180;

// Cheap pseudo-random noise based on a seed value, returns [-1, 1]
function hash(n) {
  const s = Math.sin(n) * 43758.5453;
  return (s - Math.floor(s)) * 2 - 1;
}

// Multi-octave wind turbulence — much less periodic than a single sine
function windTurbulence(time, seed) {
  const t = time * physicsConfig.windFrequency;
  return (
    Math.sin(t * 1.0 + seed * 1.7) * 0.35 +
    Math.sin(t * 2.3 + seed * 0.9) * 0.25 +
    Math.sin(t * 4.7 + seed * 3.1) * 0.15 +
    Math.sin(t * 7.1 + seed * 2.3) * 0.10 +
    hash(Math.floor(t * 3.0) + seed * 100) * 0.15 * (0.5 + 0.5 * Math.sin(t * 0.37 + seed))
  );
}

// --- Global wind state ---------------------------------------------------
// One wind for the whole scene: a heading that wanders slowly plus a shared
// gust envelope. Nodes still get private turbulence for local variation, but
// the coherent part is what makes the sculpture read as sitting in moving air
// rather than each node feeling private weather.
const windState = { heading: 0, gust: 0 };

export function updateWind(time) {
  // Sum of incommensurate slow sines: the heading drifts over ~minutes and
  // covers the full circle when headingWander is 1.
  const drift =
    Math.sin(time * 0.050)       * 1.6 +
    Math.sin(time * 0.023 + 1.7) * 2.2 +
    Math.sin(time * 0.011 + 4.2) * 2.6;
  windState.heading = physicsConfig.windHeadingDeg * DEG2RAD + drift * physicsConfig.headingWander;

  // Intermittent gust bursts, shared by every node.
  const g = Math.sin(time * 0.13) + Math.sin(time * 0.221 + 2.1);
  windState.gust = Math.max(0, g) * 0.5;
}

export function getWind() {
  return windState;
}

export function simulateLeafSpin(node, time) {
  if (node.type === 'leaf') {
    const windPhase = time * physicsConfig.windFrequency * Math.PI * 2;
    const windNudge = Math.sin(windPhase * 0.7 + node.id * 2.3) * 0.3 + 0.7;
    node.spinAngle += node.spinSpeed * DT * windNudge * (1 + windState.gust * 0.8);
    return;
  }
  if (node.type === 'mobile') {
    simulateLeafSpin(node.left, time);
    simulateLeafSpin(node.right, time);
  }
}

export function simulateMobile(node, time, parentAccelX = 0, parentAccelZ = 0) {
  if (node.type !== 'mobile') return;

  // Initialize Y-spin state if missing
  if (node.yAngle === undefined) node.yAngle = 0;
  if (node.yAngularVelocity === undefined) node.yAngularVelocity = 0;

  const lMass = getNodeMass(node.left);
  const rMass = getNodeMass(node.right);
  const totalMass = lMass + rMass;
  const I = lMass * node.leftArm * node.leftArm +
            rMass * node.rightArm * node.rightArm + 0.01;

  // Angle of the wind relative to this bar's current heading.
  // yAngle is world-frame (the renderer doesn't accumulate parent spins),
  // so the projection is a straight difference.
  const phi = windState.heading - node.yAngle;
  const crossSection = Math.abs(Math.sin(phi)); // 1 = broadside to the wind

  // --- Tilt (X-Z plane rotation) ---
  const imbalanceTorque = -physicsConfig.gravity * Math.sin(node.angle) *
    (lMass * node.leftArm - rMass * node.rightArm);

  const pendulumRestore = -physicsConfig.gravity * totalMass * 0.15 * Math.sin(node.angle);

  // Buffeting is strongest when the bar is broadside to the flow, and the
  // whole mobile shares the gust envelope.
  const windNoise = windTurbulence(time, node.id * 1.7);
  const windForce = physicsConfig.windStrength * physicsConfig.windVariability *
    windNoise * (0.4 + 0.6 * crossSection) * (1 + windState.gust);
  const windTorque = windForce * (node.leftArm + node.rightArm) * 0.3;

  // Parent acceleration coupling — parent motion induces pendulum swing
  const parentTorque = parentAccelX * totalMass * 0.4;

  node.angularVelocity += (imbalanceTorque + pendulumRestore + windTorque + parentTorque) / I * DT;
  node.angularVelocity *= physicsConfig.damping;
  node.angle += node.angularVelocity * DT;
  node.angle = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, node.angle));

  // --- Y-axis spin (rotation around the hanging string) ---
  // Weathervane: a rod in a flow is torqued toward alignment with it
  // (stable at phi = 0 mod pi, unstable broadside), tau ~ sin(2*phi).
  // As the global heading wanders, the bars visibly chase it.
  const weathervane = Math.sin(2 * phi) * physicsConfig.windStrength *
    (0.4 + windState.gust) * (node.leftArm + node.rightArm) * 0.12;

  // Turbulent eddies shed differently off the two arms; strongest broadside.
  const leftWind = windTurbulence(time * 1.1, node.id * 7.3 + 137);
  const rightWind = windTurbulence(time * 0.9, node.id * 11.7 + 293);
  const differentialWind = (leftWind - rightWind) * physicsConfig.windStrength *
    physicsConfig.windVariability * (0.3 + 0.7 * crossSection);
  const yTorque = weathervane + differentialWind * (node.leftArm + node.rightArm) * 0.8;

  // Parent Z-acceleration couples into Y-spin
  const parentYTorque = parentAccelZ * totalMass * 0.3;

  // Very weak restoring force — string barely resists twisting
  const yRestore = -node.yAngle * 0.05;

  const yI = I * 0.5;
  node.yAngularVelocity += (yTorque + parentYTorque + yRestore) / yI * DT;
  node.yAngularVelocity *= (physicsConfig.damping + 1.0) * 0.5; // less damping on Y-spin
  node.yAngle += node.yAngularVelocity * DT;

  // --- Propagate acceleration to children ---
  // The tangential acceleration from this node's angular motion
  const angAccel = (node.angularVelocity - (node._prevAngVel || 0)) / DT;
  node._prevAngVel = node.angularVelocity;

  const yAngAccel = (node.yAngularVelocity - (node._prevYAngVel || 0)) / DT;
  node._prevYAngVel = node.yAngularVelocity;

  // Left child feels acceleration from parent tilt + Y-spin
  const leftChildAccelX = parentAccelX + angAccel * node.leftArm * 0.3 + yAngAccel * node.leftArm * 0.1;
  const leftChildAccelZ = parentAccelZ + yAngAccel * node.leftArm * 0.3;

  // Right child
  const rightChildAccelX = parentAccelX - angAccel * node.rightArm * 0.3 + yAngAccel * node.rightArm * 0.1;
  const rightChildAccelZ = parentAccelZ + yAngAccel * node.rightArm * 0.3;

  simulateMobile(node.left, time, leftChildAccelX, leftChildAccelZ);
  simulateMobile(node.right, time, rightChildAccelX, rightChildAccelZ);
}
