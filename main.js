import * as THREE from 'three';

import Charge from './sim/Charge';
import ChargeManager from './sim/ChargeManager.js';
import { drawPointCharge } from './render/draw.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 1000 );
const renderer = new THREE.WebGLRenderer({ antialias: true});

scene.background = new THREE.Color(0x181818);
camera.position.z = 10;
renderer.setSize( window.innerWidth - 1, window.innerHeight - 1 );
renderer.setPixelRatio(Math.min(window.devicePixelRatio * 10,   2));

const simField = document.querySelector( ".sim-field" );
simField.appendChild( renderer.domElement );

const chargeManager = new ChargeManager();
const clickableMeshes = [];



// Raycaster for mouse click detection
const slider = document.querySelector('.slider');
slider.style.display = 'none';
let toggle = false;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

renderer.domElement.addEventListener('click', (event) => {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  // Handles when the charge is clicked
  const intersects = raycaster.intersectObjects(clickableMeshes,);
  if (intersects.length > 0) {
    let mesh = intersects[0].object;

    while (mesh && !clickableMeshes.includes(mesh)) {
      mesh = mesh.parent;
    }

    if (!mesh) return;

    const index = clickableMeshes.indexOf(mesh);
    const charge = chargeManager.charges[index];
    mesh.userData.index = index;
    mesh.userData.charge = charge.charge;
    mesh.userData.position = charge.position;

    showSlider(mesh);
    return;
  }
  
  // Add charge when no existing charge at this point
  const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const point = new THREE.Vector3();
  raycaster.ray.intersectPlane(planeZ, point);
  
  const charge = 5;
  const newCharge = chargeManager.addCharge(point.x, point.y, charge);

  const chargeMesh = drawPointCharge(newCharge);
  chargeMesh.userData.index = chargeManager.charges.length - 1;
  scene.add(chargeMesh);
  clickableMeshes.push(chargeMesh);
  slider.style.display = 'none';
});

function dynamicSliderThumbColor() {
  const val = parseFloat(slider.value);
  let color = '#888';

  if (val > 0) {
    color = '#ff3366';
  } 
  else if (val < 0) {
    color = '#3366ff'; 
  }

  slider.style.setProperty('--thumb-color', color);
}


// Show slider
function showSlider(clickedMesh) {
  const vector = new THREE.Vector3(clickedMesh.userData.position.x, clickedMesh.userData.position.y, 0);
  vector.project(camera);

  const rect = renderer.domElement.getBoundingClientRect();

  const x = (vector.x * 0.5 + 0.5) * rect.width - 72;
  const y = (-vector.y * 0.5 + 0.5) * rect.height - 50;

  dynamicSliderThumbColor();
  slider.value = clickedMesh.userData.charge;
  slider.style.position = "absolute";
  slider.style.left = `${x - slider.offsetWidth * 0.5}px`;
  slider.style.top = `${y - slider.offsetHeight * 0.5}px`;
  slider.style.display = toggle ? 'none' : 'block';
  toggle = !toggle;

  slider.addEventListener('change', () => {
    console.log(clickedMesh.userData.index);
    console.log(clickableMeshes);
  })
}

slider.addEventListener('input', dynamicSliderThumbColor);

function animate() {
  renderer.render( scene, camera );
}
renderer.setAnimationLoop( animate );