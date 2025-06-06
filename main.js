import * as THREE from 'three';

import Charge from './sim/Charge.js';
import Draw from './render/draw.js';
import ChargeConfig from './sim/ChargeConfig.js';
import SliderController from './controls/SliderController.js';
//import { initDrag, setDraggableMeshes } from './controls/dragControl.js';
//import { FieldVectors } from './sim/FieldVectors.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 1000 );
const renderer = new THREE.WebGLRenderer({ antialias: true });

scene.background = new THREE.Color(0x181818);
scene.add(Draw.grid(camera, 10));
camera.position.z = 10;
renderer.setSize( window.innerWidth - 1, window.innerHeight - 1 );
renderer.setPixelRatio(Math.min(window.devicePixelRatio * 10,   2));

const simField = document.querySelector( ".sim-field" );
simField.appendChild( renderer.domElement );

const chargeConfig = new ChargeConfig();
const chargeMeshes = [];

//initDrag(renderer, camera, chargeConfig.charges);

const slider = document.querySelector('.slider');
slider.style.display = 'none';

let activeMesh = null;
let activeMeshIndex = -1;

const sliderController = new SliderController(slider, renderer, camera, chargeConfig, chargeMeshes, scene);
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

renderer.domElement.addEventListener('click', (event) => {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  let mesh = null;

  const intersects = raycaster.intersectObjects(chargeMeshes,);
  if (intersects.length > 0) {
    mesh = intersects[0].object;
    while (mesh && !chargeMeshes.includes(mesh)) {
      mesh = mesh.parent;
    } 
    activeMeshIndex = chargeMeshes.indexOf(mesh);
    //setDraggableMeshes(chargeMeshes);
    const charge = chargeConfig.charges[activeMeshIndex];
    mesh.userData.index = activeMeshIndex;
    mesh.userData.charge = charge.charge;
    mesh.userData.position = charge.position;
    activeMesh = mesh;
    
    sliderController.toggleSlider(mesh, activeMeshIndex);
    
  }

  if (!mesh) {
    const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const point = new THREE.Vector3();
    raycaster.ray.intersectPlane(planeZ, point);
    
    const newCharge = new Charge(point.x, point.y, 0);
    const chargeMesh = newCharge.generateMesh();
    //setDraggableMeshes(chargeMeshes)
    chargeConfig.addCharge(newCharge);
    chargeMesh.userData.index = chargeConfig.charges.length - 1;
    chargeMeshes.push(chargeMesh);
    scene.add(chargeMesh);
    sliderController.toggleSlider();
  }
});

/**function debounce(func, wait) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}**/

slider.addEventListener('input', () => {
  sliderController.updateCharge(slider.value);
});

//let frameCount = 0;
function animate() {
  /**if (frameCount % 3 == 0) {
      Draw.drawFields(scene, chargeConfig, true);
  }
  frameCount++;**/
  
  //FieldVectors.drawFieldVectors(scene, chargeConfig);
  renderer.render( scene, camera );
}
renderer.setAnimationLoop( animate );