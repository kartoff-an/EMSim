import * as THREE from 'three';

import Charge from './sim/Charge';
import ChargeManager from './sim/ChargeManager.js';
import { drawPointCharge } from './render/draw.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 1000 );
const renderer = new THREE.WebGLRenderer();

scene.background = new THREE.Color(0x181818);
camera.position.z = 10;
renderer.setSize( window.innerWidth - 1, window.innerHeight - 1 );
renderer.setPixelRatio(Math.min(window.devicePixelRatio,   2));

const simField = document.querySelector( ".sim-field" );
simField.appendChild( renderer.domElement );

const chargeManager = new ChargeManager();
const clickableMeshes = [];



// Raycaster for mouse click detection
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

renderer.domElement.addEventListener('click', (event) => {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  
  const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const point = new THREE.Vector3();
  raycaster.ray.intersectPlane(planeZ, point);
  
  const charge = -1;
  const newCharge = chargeManager.addCharge(point.x, point.y, charge);

  const chargeMesh = drawPointCharge(newCharge);
  scene.add(chargeMesh);
  clickableMeshes.push(chargeMesh);

  console.log("Clicked at", point);
  console.log("drawPointCharge returned", chargeMesh);
})

//renderer.domElement.addEventListener('click', )

function animate() {
  renderer.render( scene, camera );
}
renderer.setAnimationLoop( animate );