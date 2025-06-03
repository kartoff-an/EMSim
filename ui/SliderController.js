import * as THREE from 'three'
import Draw from '../render/draw.js'

class SliderController {
    constructor(slider, camera, scene) {
        this.slider = slider;
        this.camera = camera;
        this.scene = scene;
        this.renderer = null;
        this.activeMesh = null;
        this.activeMeshIndex = -1;
        this.chargesConfig = null;
        this.chargeMeshes = [];
        this.isVisible = false;
        this.fieldLines = [];
    }

    init(chargesConfig, chargeMeshes, renderer) {
        this.chargesConfig = chargesConfig;
        this.chargeMeshes = chargeMeshes;
        this.renderer = renderer;
    }

    toggleSlider(mesh, index) {
        if (this.isVisible || this.activeMesh == mesh) {
            this.slider.style.display = 'none';
            this.activeMesh = null;
            this.activeMeshIndex = -1;
            this.isVisible = false;
        } else {
            this.activeMesh = mesh;
            this.activeMeshIndex = index;
            this.updateSliderPosition();
            this.slider.value = this.activeMesh.userData.charge;
            this.updateThumbColor();
            this.slider.style.display = 'block';
            this.isVisible = true;
        }
    }

    updateSliderPosition() {
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

    onSliderInput() {
        const newCharge = parseFloat(this.slider.value);
        this.chargesConfig.charges[this.activeMeshIndex].charge = newCharge;

        const updatedMesh = Draw.pointCharge(this.chargesConfig.charges[this.activeMeshIndex]);
        updatedMesh.userData.index = this.activeMeshIndex;

        this.scene.remove(this.activeMesh);
        this.chargeMeshes[this.activeMeshIndex] = updatedMesh;
        this.activeMesh = updatedMesh;
        this.scene.add(updatedMesh);

        this.updateThumbColor();

        

        for (const line of this.fieldLines) {
            this.scene.remove(line);
        }
        this.fieldLines = [];

        const N = 2000;
        for (let i = 0; i < 5; i++) {
            const fieldLine = Draw.drawFields(this.chargesConfig, N);
            if (fieldLine) {
                this.scene.add(fieldLine);
                this.fieldLines.push(fieldLine); // Store reference
            }
        }
    }
}

export default SliderController;