import * as THREE from 'three';

import Draw from './render/draw.js';
import ChargeConfig from './sim/ChargeConfig.js';
import SliderController from './ui/SliderController.js';


const darkMode = window.matchMedia("(prefers-color-scheme: dark)");
const themeToggle = document.querySelector('.theme-mode');
let isDarkMode = darkMode.matches;

function toggleDarkMode(isDarkMode) {
  if (isDarkMode) {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }
}

themeToggle.addEventListener('click', () => {
  toggleDarkMode(isDarkMode);
  isDarkMode = !isDarkMode;
})



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

const slider = document.querySelector('.slider');
slider.style.display = 'none';

const sliderController = new SliderController(slider, camera, scene);
sliderController.init(chargeConfig, chargeMeshes, renderer);
slider.addEventListener('input', () => sliderController.onSliderInput());

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

renderer.domElement.addEventListener('click', (event) => {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(chargeMeshes,);
  let activeMesh = null;
  if (intersects.length > 0) {
    let mesh = intersects[0].object;
    while (mesh && !chargeMeshes.includes(mesh)) {
      mesh = mesh.parent;
    } 
    const index = chargeMeshes.indexOf(mesh);
    const charge = chargeConfig.charges[index];
    mesh.userData.index = index;
    mesh.userData.charge = charge.charge;
    mesh.userData.position = charge.position;
    activeMesh = mesh;
    
    sliderController.toggleSlider(mesh, index);
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
    sliderController.toggleSlider(null, -1);
  }
});



function animate() {
  renderer.render( scene, camera );
}
renderer.setAnimationLoop( animate );