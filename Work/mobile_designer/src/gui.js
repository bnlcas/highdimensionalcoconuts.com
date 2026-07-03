import { physicsConfig } from './physics.js';
import {
  getNodeMass, getLeafMass,
  rebalance, rebalanceAll, findNode, MATERIAL_PRESETS
} from './MobileNode.js';

// Globals (physics, balance) plus an Inspector for the currently selected
// node. Tree navigation and structural edits (expand/collapse) live in
// HierarchyPanel — dat.gui only ever shows one node's properties at a time,
// Unity-style.
export class MobileGUI {
  constructor(app) {
    this.app = app;
    this.gui = new dat.GUI({ width: 310 });
    this.inspectorFolder = null;
    this._buildPhysicsFolder();
    this._buildBalanceFolder();
    this._buildInspector();
  }

  _buildPhysicsFolder() {
    const folder = this.gui.addFolder('Physics & Wind');
    folder.add(physicsConfig, 'gravity', 0, 25).name('Gravity');
    folder.add(physicsConfig, 'damping', 0.85, 0.999).step(0.005).name('Damping');
    folder.add(physicsConfig, 'windStrength', 0, 5).name('Wind Strength');
    folder.add(physicsConfig, 'windVariability', 0, 1).name('Wind Variability');
    folder.add(physicsConfig, 'windFrequency', 0.05, 2).name('Wind Frequency');
    folder.add(physicsConfig, 'windHeadingDeg', 0, 360).step(5).name('Wind Heading');
    folder.add(physicsConfig, 'headingWander', 0, 1).step(0.05).name('Heading Wander');
    folder.open();
  }

  _buildBalanceFolder() {
    const folder = this.gui.addFolder('Balance');
    folder.add(physicsConfig, 'autoBalance').name('Auto-Balance').onChange(() => {
      this._buildInspector(); // arm sliders appear/disappear with the toggle
    });
    folder.add({ rebalanceNow: () => {
      rebalanceAll(this.app.mobileRoot);
      this.app.rebuild();
    }}, 'rebalanceNow').name('Rebalance All Now');
    folder.open();
  }

  updateNodePanel() {
    this._buildInspector();
  }

  _buildInspector() {
    if (this.inspectorFolder) {
      this.gui.removeFolder(this.inspectorFolder);
      this.inspectorFolder = null;
    }
    const id = this.app.selectedNodeId;
    const node = id !== null ? findNode(this.app.mobileRoot, id) : null;

    if (!node) {
      this.inspectorFolder = this.gui.addFolder('Inspector');
      this.inspectorFolder.open();
      const hint = this.inspectorFolder.add({ h: () => {} }, 'h')
        .name('— click a node to edit —');
      hint.domElement.parentElement.style.pointerEvents = 'none';
      hint.domElement.parentElement.style.opacity = '0.6';
      return;
    }

    const label = node.type === 'mobile' ? 'Inspector: Bar' : `Inspector: ${node.shape}`;
    this.inspectorFolder = this.gui.addFolder(label);
    this.inspectorFolder.open();

    if (node.type === 'mobile') this._buildBarInspector(this.inspectorFolder, node);
    else this._buildLeafInspector(this.inspectorFolder, node);
  }

  _buildBarInspector(folder, node) {
    const state = {
      barLength: node.wireLength,
      stringLength: node.dropLength,
      curvature: node.barCurvature,
      get leftMass() { return getNodeMass(node.left).toFixed(2); },
      get rightMass() { return getNodeMass(node.right).toFixed(2); }
    };

    folder.add(state, 'barLength', 0.5, 8).step(0.1).name('Bar Length').onChange(v => {
      node.wireLength = v;
      if (physicsConfig.autoBalance) {
        rebalance(node);
      } else {
        const ratio = node.leftArm / (node.leftArm + node.rightArm);
        node.leftArm = v * ratio;
        node.rightArm = v - node.leftArm;
      }
      this.app.rebuild();
    });

    if (!physicsConfig.autoBalance) {
      const armState = { leftArm: node.leftArm, rightArm: node.rightArm };
      folder.add(armState, 'leftArm', 0.1, 6).step(0.1).name('Left Arm').onChange(v => {
        node.leftArm = v;
        node.rightArm = node.wireLength - v;
        this.app.rebuild();
      });
      folder.add(armState, 'rightArm', 0.1, 6).step(0.1).name('Right Arm').onChange(v => {
        node.rightArm = v;
        node.leftArm = node.wireLength - v;
        this.app.rebuild();
      });
    }

    folder.add(state, 'stringLength', 0.3, 5).step(0.1).name('String Length').onChange(v => {
      node.dropLength = v; this.app.rebuild();
    });

    folder.add(state, 'curvature', 0, 0.5).step(0.01).name('Curvature').onChange(v => {
      node.barCurvature = v; this.app.rebuild();
    });

    this._addReadout(folder, state, 'leftMass', 'Left Mass');
    this._addReadout(folder, state, 'rightMass', 'Right Mass');
  }

  _buildLeafInspector(folder, node) {
    const geo = folder.addFolder('Geometry');
    const state = {
      shape: node.shape,
      size: node.size,
      density: node.density,
      spinSpeed: node.spinSpeed,
      get mass() { return getLeafMass(node).toFixed(3); }
    };

    geo.add(state, 'shape', ['disc', 'sphere', 'square', 'triangle', 'star'])
      .name('Shape').onChange(v => {
        node.shape = v;
        this.app.rebuild();
        this.app.hierarchy?.render();
      });

    geo.add(state, 'size', 0.15, 1.5).step(0.05).name('Size').onChange(v => {
      node.size = v;
      if (physicsConfig.autoBalance) rebalanceAll(this.app.mobileRoot);
      this.app.rebuild();
    });

    geo.add(state, 'density', 0.1, 10).step(0.1).name('Density').onChange(v => {
      node.density = v;
      if (physicsConfig.autoBalance) rebalanceAll(this.app.mobileRoot);
      this.app.rebuild();
    });

    this._addReadout(geo, state, 'mass', 'Mass (derived)');

    geo.add(state, 'spinSpeed', 0, 3).step(0.05).name('Spin Speed').onChange(v => {
      node.spinSpeed = v;
    });
    geo.open();

    const mat = folder.addFolder('Material');
    const matState = {
      color: node.color,
      materialType: node.materialType,
      metalness: node.metalness,
      roughness: node.roughness,
      clearcoat: node.clearcoat,
      opacity: node.opacity,
      transmission: node.transmission,
      ior: node.ior
    };

    mat.addColor(matState, 'color').name('Color').onChange(v => {
      node.color = v;
      this.app.rebuild();
      this.app.hierarchy?.render();
    });

    mat.add(matState, 'materialType', Object.keys(MATERIAL_PRESETS)).name('Preset').onChange(v => {
      node.materialType = v;
      Object.assign(node, MATERIAL_PRESETS[v]);
      this.app.rebuild();
      this._buildInspector(); // sliders must reflect the preset's values
    });

    const bind = (key, label, min, max) => {
      mat.add(matState, key, min, max).step(0.05).name(label).onChange(v => {
        node[key] = v; this.app.rebuild();
      });
    };
    bind('metalness', 'Metalness', 0, 1);
    bind('roughness', 'Roughness', 0, 1);
    bind('clearcoat', 'Clearcoat', 0, 1);
    bind('opacity', 'Opacity', 0, 1);
    bind('transmission', 'Transmission', 0, 1);
    mat.add(matState, 'ior', 1.0, 3.0).step(0.05).name('IOR').onChange(v => {
      node.ior = v; this.app.rebuild();
    });
    mat.open();
  }

  _addReadout(folder, state, key, label) {
    const ctrl = folder.add(state, key).name(label);
    ctrl.domElement.style.pointerEvents = 'none';
    ctrl.domElement.style.opacity = '0.7';
  }
}
