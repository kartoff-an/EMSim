import * as THREE from 'three';
import { intensityToColor } from '../utils/color';


export function createGridVectors(chargeConfig, gridSize, divisions, group) {
    const maxIntensity = 1;
    const step = gridSize / divisions;
    const halfSize = gridSize / 2;

    let validArrowCount = 0;
    for (let i = 0; i <= divisions; i++) {
        const x = -halfSize + i * step;
        for (let j = 0; j <= divisions; j++) {
            const y = -halfSize + j * step;
            const E = chargeConfig.getElectricFieldAt(x, y);
            if (E.length() > 0) validArrowCount++;
        }
    }

    const coneGeom = new THREE.ConeGeometry(0.02, 0.05, 6);
    coneGeom.rotateX(Math.PI / 2); 
    const arrowMaterial = new THREE.MeshBasicMaterial({ vertexColors: false, depthWrite: true });
    const instancedArrows = new THREE.InstancedMesh(coneGeom, arrowMaterial, validArrowCount);
    const instanceColorBuffer = new THREE.InstancedBufferAttribute(new Float32Array(validArrowCount * 3), 3);
    instancedArrows.instanceColor = instanceColorBuffer;

    const dummy = new THREE.Object3D();
    const zAxis = new THREE.Vector3(0, 0, 1);
    let index = 0;

    for (let i = 0; i <= divisions; i++) {
        const x = -halfSize + i * step;
        for (let j = 0; j <= divisions; j++) {
            const y = -halfSize + j * step;
            const E = chargeConfig.getElectricFieldAt(x, y);
            const mag = E.length();
            if (mag === 0) continue;

            const fieldVec = new THREE.Vector3(E.x, E.y, 0).normalize();
            const intensity = mag / 500e8;
            const colorArr = intensityToColor(intensity, maxIntensity);
           
            dummy.position.set(x, y, 0);
            const scale = THREE.MathUtils.clamp(mag / 1e9, 0.4, 1.5);
            dummy.scale.set(scale, scale, scale);
            dummy.quaternion.setFromUnitVectors(zAxis, fieldVec);
            dummy.updateMatrix();

            instancedArrows.setMatrixAt(index, dummy.matrix);
            instanceColorBuffer.set(colorArr, index * 3);

            const perpVec = new THREE.Vector3(-fieldVec.y, fieldVec.x, 0).normalize(); 
            dummy.quaternion.setFromUnitVectors(zAxis, perpVec);

            const coneBaseOffset = fieldVec.clone().multiplyScalar(-0.05 * scale);
            dummy.position.set(x + coneBaseOffset.x, y + coneBaseOffset.y, 0);
            dummy.scale.set(scale, scale, scale);
            dummy.updateMatrix();

            index++;
        }
    }

    instancedArrows.instanceMatrix.needsUpdate = true;
    instanceColorBuffer.needsUpdate = true;
    instancedArrows.renderOrder = 0;

    group.add(instancedArrows);
}