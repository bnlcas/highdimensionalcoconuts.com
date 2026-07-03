import * as THREE from 'three';

const wireMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
const outlineMaterial = new THREE.MeshBasicMaterial({ color: 0xffcc00, side: THREE.BackSide });
const barMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.6, roughness: 0.3 });
const fulcrumMaterial = new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.5, roughness: 0.4 });

// Parabolic bar that peaks at the fulcrum and droops at the endpoints.
// fulcrumT is where along the [0,1] parameter the fulcrum sits.
class ParabolicBarCurve extends THREE.Curve {
  constructor(leftEnd, rightEnd, fulcrumT, sag) {
    super();
    this.leftEnd = leftEnd;
    this.rightEnd = rightEnd;
    this.fulcrumT = fulcrumT;
    this.sag = sag;
  }
  getPoint(t) {
    const p = new THREE.Vector3().lerpVectors(this.leftEnd, this.rightEnd, t);
    // Parabola that is zero at fulcrumT and negative (droops) at endpoints.
    // f(t) = -sag * (t - fulcrumT)^2 / max((fulcrumT)^2, (1-fulcrumT)^2)
    const ft = this.fulcrumT;
    const maxDist = Math.max(ft * ft, (1 - ft) * (1 - ft));
    const droop = -this.sag * ((t - ft) * (t - ft)) / maxDist;
    p.y += droop;
    return p;
  }
}

function createBarCurve(leftEnd, rightEnd, fulcrumT, sag) {
  return new ParabolicBarCurve(leftEnd, rightEnd, fulcrumT, sag);
}

// One material per node id, mutated in place. rebuild() runs every frame, so
// allocating fresh materials there would leak GPU memory and churn shader
// programs; a cache keyed by node id avoids both.
const materialCache = new Map();

function getMaterial(node) {
  let mat = materialCache.get(node.id);
  if (!mat) {
    mat = new THREE.MeshPhysicalMaterial({ clearcoatRoughness: 0.1 });
    materialCache.set(node.id, mat);
  }
  const isTransmissive = node.transmission > 0;
  // Crossing the transmission boundary changes shader defines.
  if (mat.userData.wasTransmissive !== isTransmissive) {
    mat.needsUpdate = true;
    mat.userData.wasTransmissive = isTransmissive;
  }
  mat.color.set(node.color);
  mat.metalness = node.metalness;
  mat.roughness = node.roughness;
  mat.transmission = node.transmission;
  mat.ior = node.ior;
  mat.opacity = node.opacity;
  mat.transparent = isTransmissive || node.opacity < 1.0;
  mat.clearcoat = node.clearcoat;
  mat.envMapIntensity = isTransmissive ? 1.0 : 0.8;
  mat.thickness = node.size * 2;
  return mat;
}

function createShapeGeometry(shape, size) {
  switch (shape) {
    case 'disc':
      return new THREE.CylinderGeometry(size, size, 0.06, 32);
    case 'sphere':
      return new THREE.SphereGeometry(size * 0.7, 24, 16);
    case 'square':
      return new THREE.BoxGeometry(size * 1.4, size * 1.4, 0.06);
    case 'triangle':
      return new THREE.ConeGeometry(size * 0.8, size * 1.3, 3);
    case 'star':
      return new THREE.TorusGeometry(size * 0.55, size * 0.18, 8, 5);
    default:
      return new THREE.SphereGeometry(size * 0.7, 24, 16);
  }
}

function getShapeTopOffset(shape, size) {
  switch (shape) {
    case 'disc':   return 0.03;
    case 'sphere': return size * 0.7;
    case 'square': return size * 0.7;
    case 'triangle': return size * 0.65;
    case 'star':   return size * 0.18;
    default:       return size * 0.7;
  }
}

function applyLeafRotation(mesh, node) {
  const spin = node.spinAngle || 0;
  switch (node.shape) {
    case 'disc':
    case 'star':
      mesh.rotation.set(Math.PI / 2, spin, 0);
      break;
    case 'square':
    case 'triangle':
      mesh.rotation.set(0, spin, 0);
      break;
    default:
      mesh.rotation.set(0, spin, 0);
      break;
  }
}

function createWireMesh(from, to) {
  const dir = new THREE.Vector3().subVectors(to, from);
  const length = dir.length();
  if (length < 0.001) return null;
  const geom = new THREE.CylinderGeometry(0.015, 0.015, length, 4);
  const mesh = new THREE.Mesh(geom, wireMaterial);
  mesh.position.copy(from).add(to).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return mesh;
}

export class MobileRenderer {
  constructor(scene) {
    this.scene = scene;
    this.mobileGroup = new THREE.Group();
    this.outlineGroup = new THREE.Group();
    scene.add(this.mobileGroup);
    scene.add(this.outlineGroup);
    this.clickableMeshes = [];
    this.selectedNodeId = null;
    this.topHangY = 6;
  }

  setSelectedNodeId(id) {
    this.selectedNodeId = id;
  }

  getClickableMeshes() {
    return this.clickableMeshes;
  }

  rebuild(mobileRoot) {
    this._clear();
    const hangPos = new THREE.Vector3(0, this.topHangY, 0);
    const ceilingPos = new THREE.Vector3(0, this.topHangY + 30, 0);
    const topWire = createWireMesh(ceilingPos, hangPos);
    if (topWire) this.mobileGroup.add(topWire);
    this._buildNode(mobileRoot, hangPos);
  }

  _clear() {
    // Geometries are created fresh each rebuild and must be disposed or GPU
    // memory grows without bound. Materials are shared/cached — leave them.
    for (const group of [this.mobileGroup, this.outlineGroup]) {
      group.traverse(obj => { if (obj.isMesh) obj.geometry.dispose(); });
      group.clear();
    }
    this.clickableMeshes.length = 0;
  }

  _buildNode(node, hangPos) {
    if (node.type === 'leaf') {
      this._buildLeaf(node, hangPos);
    } else {
      this._buildMobileBar(node, hangPos);
    }
  }

  _buildLeaf(node, hangPos) {
    const topOffset = getShapeTopOffset(node.shape, node.size);
    const shapePos = new THREE.Vector3(hangPos.x, hangPos.y - topOffset, hangPos.z);

    const geom = createShapeGeometry(node.shape, node.size);
    const mat = getMaterial(node);
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.copy(shapePos);
    applyLeafRotation(mesh, node);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.nodeId = node.id;
    this.mobileGroup.add(mesh);
    this.clickableMeshes.push(mesh);

    if (this.selectedNodeId === node.id) {
      const outlineGeom = createShapeGeometry(node.shape, node.size * 1.25);
      const outline = new THREE.Mesh(outlineGeom, outlineMaterial);
      outline.position.copy(shapePos);
      applyLeafRotation(outline, node);
      this.outlineGroup.add(outline);
    }
  }

  _buildMobileBar(node, hangPos) {
    const cosA = Math.cos(node.angle);
    const sinA = Math.sin(node.angle);
    const yAngle = node.yAngle || 0;
    const cosY = Math.cos(yAngle);
    const sinY = Math.sin(yAngle);

    // Bar direction rotated by both tilt (angle) and Y-spin (yAngle)
    const leftDx = -node.leftArm * cosA * cosY;
    const leftDy = -node.leftArm * sinA;
    const leftDz = -node.leftArm * cosA * sinY;

    const rightDx = node.rightArm * cosA * cosY;
    const rightDy = node.rightArm * sinA;
    const rightDz = node.rightArm * cosA * sinY;

    const leftFlat = new THREE.Vector3(
      hangPos.x + leftDx,
      hangPos.y + leftDy,
      hangPos.z + leftDz
    );
    const rightFlat = new THREE.Vector3(
      hangPos.x + rightDx,
      hangPos.y + rightDy,
      hangPos.z + rightDz
    );

    // Fulcrum position along the parametric bar (0=left, 1=right)
    const fulcrumT = node.leftArm / node.wireLength;
    const sag = node.barCurvature * node.wireLength;

    // Build curve — the curve passes through hangPos at t=fulcrumT
    // and droops at the endpoints
    const barCurve = createBarCurve(leftFlat, rightFlat, fulcrumT, sag);

    // Actual endpoint positions (with droop applied)
    const leftEnd = barCurve.getPoint(0);
    const rightEnd = barCurve.getPoint(1);

    const barGeom = new THREE.TubeGeometry(barCurve, 24, 0.012, 8, false);
    const barMesh = new THREE.Mesh(barGeom, barMaterial);
    barMesh.userData.nodeId = node.id;
    barMesh.castShadow = true;
    this.mobileGroup.add(barMesh);
    this.clickableMeshes.push(barMesh);

    // Fulcrum
    const fulcrumGeom = new THREE.SphereGeometry(0.04, 8, 6);
    const fulcrumMesh = new THREE.Mesh(fulcrumGeom, fulcrumMaterial);
    fulcrumMesh.position.copy(hangPos);
    this.mobileGroup.add(fulcrumMesh);

    // Selection outline
    if (this.selectedNodeId === node.id) {
      const outlineBarCurve = createBarCurve(leftFlat, rightFlat, fulcrumT, sag);
      const outBarGeom = new THREE.TubeGeometry(outlineBarCurve, 24, 0.04, 8, false);
      const outBar = new THREE.Mesh(outBarGeom, outlineMaterial);
      this.outlineGroup.add(outBar);
    }

    // Strings hang straight down from actual (drooped) endpoints
    const leftChildHang = new THREE.Vector3(leftEnd.x, leftEnd.y - node.dropLength, leftEnd.z);
    const rightChildHang = new THREE.Vector3(rightEnd.x, rightEnd.y - node.dropLength, rightEnd.z);

    const leftWire = createWireMesh(leftEnd, leftChildHang);
    if (leftWire) this.mobileGroup.add(leftWire);
    const rightWire = createWireMesh(rightEnd, rightChildHang);
    if (rightWire) this.mobileGroup.add(rightWire);

    this._buildNode(node.left, leftChildHang);
    this._buildNode(node.right, rightChildHang);
  }
}
