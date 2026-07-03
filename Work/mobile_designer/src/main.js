import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  createLeafNode, createMobileNode, getNodeMass,
  rebalanceAll, findNode, findParent
} from './MobileNode.js';
import { simulateMobile, simulateLeafSpin, updateWind, physicsConfig, DT } from './physics.js';
import { createEnvironment, createLighting } from './environment.js';
import { MobileRenderer } from './MobileRenderer.js';
import { MobileGUI } from './gui.js';
import { HierarchyPanel } from './HierarchyPanel.js';

class App {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 500);
    this.camera.position.set(0, 2, 20);

    // preserveDrawingBuffer lets external screenshot tooling read the canvas.
    this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    document.body.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, -1, 0);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.update();

    createLighting(this.scene);

    this.mobileRoot = this._createDefaultMobile();
    this.selectedNodeId = this.mobileRoot.id;

    this.mobileRenderer = new MobileRenderer(this.scene);
    this.mobileRenderer.setSelectedNodeId(this.selectedNodeId);
    this.mobileRenderer.rebuild(this.mobileRoot);

    this.gui = new MobileGUI(this);
    this.hierarchy = new HierarchyPanel(this);

    this._setupSelection();
    this._setupResize();

    this.time = 0;
    this._init();
  }

  async _init() {
    await createEnvironment(this.renderer, this.scene);
    const loading = document.getElementById('loading');
    if (loading) loading.classList.add('hidden');
    this._animate();
  }

  _createDefaultMobile() {
    return createMobileNode(
      createLeafNode('disc', '#8b1a1a', 2.0, 0.8),
      createMobileNode(
        createLeafNode('disc', '#8b1a1a', 2.0, 0.6),
        createLeafNode('disc', '#8b1a1a', 2.0, 0.6),
        3.0
      ),
      5.0
    );
  }

  selectNode(id) {
    this.selectedNodeId = id;
    this.mobileRenderer.setSelectedNodeId(id);
    this.gui.updateNodePanel();
    this.hierarchy?.render();
    this.rebuild();
  }

  rebuild() {
    this.mobileRenderer.rebuild(this.mobileRoot);
  }

  // --- Structure mutations (called from the hierarchy panel) ---

  expandNode(id) {
    const node = findNode(this.mobileRoot, id);
    if (!node || node.type !== 'leaf') return;
    const parent = findParent(this.mobileRoot, id);
    const childSize = node.size * 0.8;
    const makeChild = () => {
      const child = createLeafNode(node.shape, node.color, node.density, childSize);
      child.materialType = node.materialType;
      child.metalness = node.metalness;
      child.roughness = node.roughness;
      child.transmission = node.transmission;
      child.ior = node.ior;
      child.opacity = node.opacity;
      child.clearcoat = node.clearcoat;
      return child;
    };
    const newMobile = createMobileNode(makeChild(), makeChild(), 2.0);
    newMobile.id = node.id;
    if (parent) {
      if (parent.left.id === id) parent.left = newMobile;
      else parent.right = newMobile;
      if (physicsConfig.autoBalance) rebalanceAll(this.mobileRoot);
    } else {
      this.mobileRoot = newMobile;
    }
    this.selectNode(newMobile.id);
  }

  collapseNode(id) {
    const node = findNode(this.mobileRoot, id);
    if (!node || node.type !== 'mobile') return;
    const parent = findParent(this.mobileRoot, id);
    const size = 0.5;
    const density = getNodeMass(node) / (size * size * size);
    const newLeaf = createLeafNode('disc', '#e74c3c', density, size);
    newLeaf.id = node.id;
    if (parent) {
      if (parent.left.id === id) parent.left = newLeaf;
      else parent.right = newLeaf;
      if (physicsConfig.autoBalance) rebalanceAll(this.mobileRoot);
    } else {
      this.mobileRoot = newLeaf;
    }
    this.selectNode(newLeaf.id);
  }

  _setupSelection() {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const mouseDownPos = new THREE.Vector2();

    this.renderer.domElement.addEventListener('mousedown', e => {
      if (e.button === 0) mouseDownPos.set(e.clientX, e.clientY);
    });

    this.renderer.domElement.addEventListener('mouseup', e => {
      if (e.button !== 0) return;
      const dx = e.clientX - mouseDownPos.x;
      const dy = e.clientY - mouseDownPos.y;
      if (Math.sqrt(dx * dx + dy * dy) > 5) return;

      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, this.camera);

      const intersects = raycaster.intersectObjects(this.mobileRenderer.getClickableMeshes(), false);
      if (intersects.length > 0 && intersects[0].object.userData.nodeId !== undefined) {
        this.selectNode(intersects[0].object.userData.nodeId);
      } else {
        this.selectNode(null);
      }
    });
  }

  _setupResize() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  _animate() {
    requestAnimationFrame(() => this._animate());
    this.time += DT;
    updateWind(this.time);
    simulateMobile(this.mobileRoot, this.time);
    simulateLeafSpin(this.mobileRoot, this.time);
    this.rebuild();
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}

window.app = new App(); // console access for debugging
