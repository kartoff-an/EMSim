import * as THREE from 'three';

import Draw from './render/draw.js';
import ChargeConfig from './sim/ChargeConfig.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 1000 );
const renderer = new THREE.WebGLRenderer({ antialias: true });

scene.background = new THREE.Color(0x181818);
camera.position.z = 10;
renderer.setSize( window.innerWidth - 1, window.innerHeight - 1 );
renderer.setPixelRatio(Math.min(window.devicePixelRatio * 10,   2));

const simField = document.querySelector( ".sim-field" );
simField.appendChild( renderer.domElement );

const chargeConfig = new ChargeConfig();
const chargeMeshes = [];

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const slider = document.querySelector('.slider');
slider.style.display = 'none';
let isSliderVisible = false;
let activeMesh = null;
let activeMeshIndex = -1;

// ----------- SLIDER BEHAVIOUR -----------
function updateSliderThumbColor() {
  const val = parseFloat(slider.value);
  let color = val > 0 ? '#ff3366' : (val < 0 ? '#3366ff' : '#888');
  slider.style.setProperty('--thumb-color', color);
}

slider.addEventListener('input', () => {
  updateSliderThumbColor();
  if (activeMesh != null) {

    const newCharge = parseFloat(slider.value);
    chargeConfig.charges[activeMeshIndex].charge = newCharge;

    scene.remove(activeMesh);
    const updatedMesh = Draw.pointCharge(chargeConfig.charges[activeMeshIndex]);
    updatedMesh.userData.index = activeMeshIndex;
    chargeMeshes[activeMeshIndex] = updatedMesh;
    activeMesh = updatedMesh;
    scene.add(updatedMesh);

    const charges = chargeConfig.charges;
    for (let i = 0; i < charges.length; i++) {
      charges.EFI = chargeConfig.getElectricFieldAt(2, 2);
      console.log(charges);
    }
  }
});


renderer.domElement.addEventListener('click', (event) => {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(chargeMeshes,);
  if (intersects.length > 0) {
    let mesh = intersects[0].object;

    while (mesh && !chargeMeshes.includes(mesh)) {
      mesh = mesh.parent;
    }

    if (!mesh) return;

    const index = chargeMeshes.indexOf(mesh);
    const charge = chargeConfig.charges[index];
    mesh.userData.index = index;
    mesh.userData.charge = charge.charge;
    mesh.userData.position = charge.position;
  
    activeMesh = mesh;
    activeMeshIndex = index;
    toggleSlider();
    return;
  }
  
  if (!activeMesh) {
    const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const point = new THREE.Vector3();
    raycaster.ray.intersectPlane(planeZ, point);
    
    const newCharge = chargeConfig.addCharge(point.x, point.y, 0);
    const chargeMesh = Draw.pointCharge(newCharge);
    chargeMesh.userData.index = chargeConfig.charges.length - 1;
    chargeMeshes.push(chargeMesh);
    scene.add(chargeMesh);
  }
  slider.style.display = 'none';
  isSliderVisible = false;
  activeMesh = null;
});


// -------- SLIDER POSITIONING -------------
function toggleSlider() {
  const vector = new THREE.Vector3(activeMesh.userData.position.x, activeMesh.userData.position.y, 0);
  vector.project(camera);

  const rect = renderer.domElement.getBoundingClientRect();

  const x = (vector.x * 0.5 + 0.5) * rect.width - 72;
  const y = (-vector.y * 0.5 + 0.5) * rect.height - 50;

  slider.value = activeMesh.userData.charge;
  slider.style.position = "absolute";
  slider.style.left = `${x - slider.offsetWidth * 0.5}px`;
  slider.style.top = `${y - slider.offsetHeight * 0.5}px`;

  isSliderVisible = !isSliderVisible;
  slider.style.display = isSliderVisible ? 'block' : 'none';
  updateSliderThumbColor();
}

scene.add(Draw.grid(camera, 10));

function animate() {
  renderer.render( scene, camera );
}
renderer.setAnimationLoop( animate );