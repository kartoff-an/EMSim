import * as THREE from 'three'
import Draw from '../render/draw.js'

class SliderController {
    constructor(slider, renderer, camera, chargeConfig, chargeMeshes, scene) {
        this.slider = slider;
        this.renderer = renderer;
        this.camera = camera;
        this.chargeConfig = chargeConfig;
        this.chargeMeshes = chargeMeshes;
        this.scene = scene;
        this.isVisible = false;
        this.activeMesh = null;
        this.activeMeshIndex = -1;
    }

    toggleSlider(mesh = null, index = -1) {
        if (this.isVisible || this.activeMesh == mesh) {
            this.slider.style.display = 'none';
            this.activeMesh = null;
            this.activeMeshIndex = -1;
            this.isVisible = false;
            console.log("Yes");
        } else {
            this.activeMesh = mesh;
            this.activeMeshIndex = index;
            this.#updateSliderPosition();
            this.slider.value = this.activeMesh.userData.charge;
            this.updateThumbColor();
            this.slider.style.display = 'block';
            this.isVisible = true;
            console.log("No");
        }
    }

    #updateSliderPosition() {
        const vector = new THREE.Vector3(this.activeMesh.userData.position.x, this.activeMesh.userData.position.y, 0);
        vector.project(this.camera);

        const rect = this.renderer.domElement.getBoundingClientRect();
        const x = (vector.x * 0.5 + 0.5) * rect.width - 72;
        const y = (-vector.y * 0.5 + 0.5) * rect.height - 50;

        this.slider.style.left = `${x - this.slider.offsetWidth * 0.5}px`;
        this.slider.style.top = `${y - this.slider.offsetHeight * 0.5}px`;
        this.slider.value = this.activeMesh.userData.charge;
    }

    updateThumbColor() {
        const val = parseFloat(this.slider.value);
        let color = val > 0 ? '#ff3366' : (val < 0 ? '#3366ff' : '#888');
        this.slider.style.setProperty('--thumb-color', color);
    }
    
    updateCharge(value) {
        if (this.activeMeshIndex < 0) return;
        const newCharge = parseFloat(value);
        this.chargeConfig.charges[this.activeMeshIndex].charge = newCharge;
        const updatedMesh = this.chargeConfig.charges[this.activeMeshIndex].generateMesh();
        updatedMesh.userData.index = this.activeMeshIndex;
        this.scene.remove(this.activeMesh);
        this.chargeMeshes[this.activeMeshIndex] = updatedMesh;
        this.activeMesh = updatedMesh;
        this.scene.add(updatedMesh);
        this.updateThumbColor();
        Draw.drawFields(this.scene, this.chargeConfig, true);
    }
}

export default SliderController;