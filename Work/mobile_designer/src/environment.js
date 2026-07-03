import * as THREE from 'three';
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js';

const HDRI_PATH = './assets/pergola_walkway_4k.exr';

export function createEnvironment(renderer, scene) {
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();

  return new Promise((resolve) => {
    new EXRLoader().load(HDRI_PATH, (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      const envMap = pmremGenerator.fromEquirectangular(texture).texture;
      scene.environment = envMap;
      scene.background = envMap;
      texture.dispose();
      pmremGenerator.dispose();
      resolve();
    });
  });
}

export function createLighting(scene) {
  const ambientLight = new THREE.AmbientLight(0x8899bb, 0.4);
  scene.add(ambientLight);

  const sunLight = new THREE.DirectionalLight(0xfff5e0, 1.5);
  sunLight.position.set(8, 20, 12);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(2048, 2048);
  sunLight.shadow.camera.near = 1;
  sunLight.shadow.camera.far = 60;
  sunLight.shadow.camera.left = -15;
  sunLight.shadow.camera.right = 15;
  sunLight.shadow.camera.top = 15;
  sunLight.shadow.camera.bottom = -15;
  scene.add(sunLight);

  const fillLight = new THREE.DirectionalLight(0x88aaff, 0.4);
  fillLight.position.set(-6, 8, -8);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xffeedd, 0.3);
  rimLight.position.set(0, 5, -15);
  scene.add(rimLight);
}
