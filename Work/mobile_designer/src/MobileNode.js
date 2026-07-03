let nextId = 0;

export function resetIdCounter() {
  nextId = 0;
}

export const MATERIAL_PRESETS = {
  plastic:      { metalness: 0.0,  roughness: 0.4, transmission: 0, ior: 1.5, opacity: 1.0, clearcoat: 0.3 },
  metal:        { metalness: 1.0,  roughness: 0.15, transmission: 0, ior: 1.5, opacity: 1.0, clearcoat: 0.0 },
  brushedMetal: { metalness: 1.0,  roughness: 0.45, transmission: 0, ior: 1.5, opacity: 1.0, clearcoat: 0.0 },
  glass:        { metalness: 0.0,  roughness: 0.05, transmission: 0.9, ior: 1.5, opacity: 0.3, clearcoat: 1.0 },
  ceramic:      { metalness: 0.0,  roughness: 0.2, transmission: 0, ior: 1.5, opacity: 1.0, clearcoat: 0.8 },
  rubber:       { metalness: 0.0,  roughness: 0.9, transmission: 0, ior: 1.5, opacity: 1.0, clearcoat: 0.0 },
  wood:         { metalness: 0.0,  roughness: 0.7, transmission: 0, ior: 1.5, opacity: 1.0, clearcoat: 0.1 },
  gem:          { metalness: 0.0,  roughness: 0.0, transmission: 0.8, ior: 2.4, opacity: 0.4, clearcoat: 1.0 },
};

export function createLeafNode(shape = 'disc', color = '#e74c3c', density = 1.0, size = 0.4) {
  return {
    id: nextId++, type: 'leaf', shape, color, density, size,
    spinSpeed: 0.3, spinAngle: 0,
    materialType: 'plastic',
    metalness: 0.0, roughness: 0.4, transmission: 0, ior: 1.5, opacity: 1.0, clearcoat: 0.3
  };
}

export function getLeafMass(node) {
  return node.density * node.size * node.size * node.size;
}

export function createMobileNode(leftChild, rightChild, wireLength = 2.0) {
  const lMass = getNodeMass(leftChild);
  const rMass = getNodeMass(rightChild);
  const total = lMass + rMass;
  const leftArm = total > 0 ? (rMass / total) * wireLength : wireLength / 2;
  const rightArm = wireLength - leftArm;
  return {
    id: nextId++, type: 'mobile',
    left: leftChild, right: rightChild,
    wireLength, leftArm, rightArm,
    dropLength: 1.5,
    barCurvature: 0.15,
    angle: 0, angularVelocity: 0,
    yAngle: 0, yAngularVelocity: 0
  };
}

export function getNodeMass(node) {
  if (node.type === 'leaf') return getLeafMass(node);
  return getNodeMass(node.left) + getNodeMass(node.right);
}

export function rebalance(node) {
  if (node.type !== 'mobile') return;
  const lMass = getNodeMass(node.left);
  const rMass = getNodeMass(node.right);
  const total = lMass + rMass;
  if (total > 0) {
    node.leftArm = (rMass / total) * node.wireLength;
    node.rightArm = node.wireLength - node.leftArm;
  }
}

export function rebalanceAll(node) {
  if (node.type !== 'mobile') return;
  rebalanceAll(node.left);
  rebalanceAll(node.right);
  rebalance(node);
}

export function findNode(root, id) {
  if (root.id === id) return root;
  if (root.type === 'mobile') {
    return findNode(root.left, id) || findNode(root.right, id);
  }
  return null;
}

export function findParent(root, id) {
  if (root.type !== 'mobile') return null;
  if (root.left.id === id || root.right.id === id) return root;
  return findParent(root.left, id) || findParent(root.right, id);
}
