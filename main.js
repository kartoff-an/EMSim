import * as THREE from 'three';

import Charge from './sim/Charge.js';
import Draw from './render/draw.js';
import ChargeConfig from './sim/ChargeConfig.js';
import SliderController from './controls/SliderController.js';
import { drawFields } from './sim/FieldLines.js';

// --- Graphics Setup ---
const graphics = {
  scene: new THREE.Scene(),
  camera: new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000),
  renderer: new THREE.WebGLRenderer({ antialias: true }),
};
graphics.scene.background = new THREE.Color(0x181818);
graphics.scene.add(Draw.grid(graphics.camera, 10));
graphics.camera.position.z = 10;
graphics.renderer.setSize(window.innerWidth - 1, window.innerHeight - 1);
graphics.renderer.setPixelRatio(Math.min(window.devicePixelRatio * 10, 2));

// --- DOM Setup ---
const simField = document.querySelector(".sim-field");
const slider = document.querySelector('.slider');
const addChargeCheckBox = document.querySelector('.should-add-charge');
let isAddingCharge = addChargeCheckBox.checked;

simField.appendChild(graphics.renderer.domElement);
slider.style.display = 'none';

// --- Simulation Data ---
const config = new ChargeConfig();
const charges = {
  config: config,
  list: config.charges,
  meshes: []
};

// --- Interaction ---
const sliderController = new SliderController(slider, charges, graphics);
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let activeChargeMeshIndex = -1;

graphics.renderer.domElement.addEventListener('click', (event) => {
  const rect = graphics.renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(mouse, graphics.camera);

  let mesh = null;
  const intersects = raycaster.intersectObjects(charges.meshes);

  if (intersects.length > 0) {
    mesh = intersects[0].object;
    while (mesh && !charges.meshes.includes(mesh)) {
      mesh = mesh.parent;
    }

    const index = charges.meshes.indexOf(mesh);
    const charge = charges.list[index];
    mesh.userData.index = index;
    mesh.userData.charge = charge.charge;
    mesh.userData.position = charge.position;
    activeChargeMeshIndex = index;

    sliderController.toggleSlider(mesh, index);
  }

  if (!mesh && isAddingCharge && !sliderController.isVisible) {
    const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const point = new THREE.Vector3();
    raycaster.ray.intersectPlane(planeZ, point);

    const newCharge = new Charge(point.x, point.y, 0);
    const chargeMesh = newCharge.generateMesh();

    charges.config.addCharge(newCharge);
    chargeMesh.userData.index = charges.list.length - 1;

    graphics.scene.add(chargeMesh);
    charges.meshes.push(chargeMesh);
  }

  if (!mesh ) sliderController.toggleSlider(null, -1);
});



slider.addEventListener('input', () => sliderController.updateCharge(slider.value));


document.querySelector('.clear-all-btn').addEventListener('click', () => {
  charges.list.length = 0;
  charges.meshes.forEach(mesh => {
    mesh.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
    });
    graphics.scene.remove(mesh);


  });
  charges.meshes.length = 0;;
  
  sliderController.toggleSlider();
  drawFields(graphics.scene, charges.config, true, true);
});

document.querySelector('.delete-icon').addEventListener('click', () => {
  const mesh = charges.meshes[activeChargeMeshIndex];
  if (mesh) {
    charges.list.splice(activeChargeMeshIndex, 1);

    mesh.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
    });

    charges.meshes.splice(activeChargeMeshIndex, 1);

    graphics.scene.remove(mesh);
    activeChargeMeshIndex = -1;
    sliderController.toggleSlider();
    drawFields(graphics.scene, charges.config, true, true);
  }
});

addChargeCheckBox.addEventListener('change', (event) => {
  isAddingCharge = event.currentTarget.checked;
});

// --- Animation Loop ---
function animate() {
  graphics.renderer.render(graphics.scene, graphics.camera);
}
graphics.renderer.setAnimationLoop(animate);
