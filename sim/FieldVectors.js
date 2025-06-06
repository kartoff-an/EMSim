import * as THREE from 'three';
import { intensityToColor } from '../utils/color';

export function createGridVectors(chargeConfig, gridSize, divisions, group) {
    const maxIntensity = 1;
    const step = gridSize / divisions;
    const halfSize = gridSize / 2;

    // --- First pass: gather field intensities and count valid arrows ---
    const fieldIntensities = [];
    let validArrowCount = 0;

    for (let i = 0; i <= divisions; i++) {
        const x = -halfSize + i * step;
        for (let j = 0; j <= divisions; j++) {
            const y = -halfSize + j * step;
            const E = chargeConfig.getElectricFieldAt(x, y);
            fieldIntensities.push(E);
            if (E.length() > 0) validArrowCount++;
        }
    }

    // --- Geometry and materials ---
    const coneGeom = new THREE.ConeGeometry(0.02, 0.05, 6);
    coneGeom.rotateX(Math.PI / 2);

    const arrowMaterial = new THREE.MeshBasicMaterial({ vertexColors: false, depthWrite: true });
    const instancedArrows = new THREE.InstancedMesh(coneGeom, arrowMaterial, validArrowCount);
    const instanceColorBuffer = new THREE.InstancedBufferAttribute(new Float32Array(validArrowCount * 3), 3);
    instancedArrows.instanceColor = instanceColorBuffer;

    const dummy = new THREE.Object3D();
    const zAxis = new THREE.Vector3(0, 0, 1);

    // --- Second pass: place arrows ---
    let index = 0;
    for (let i = 0; i <= divisions; i++) {
        const x = -halfSize + i * step;
        for (let j = 0; j <= divisions; j++) {
            const y = -halfSize + j * step;
            const E = fieldIntensities[i * (divisions + 1) + j];
            const mag = E.length();
            if (mag === 0) continue;

            const unitVector = E.clone().normalize();
            const intensity = mag / 500e8;
            const colorArr = intensityToColor(intensity, maxIntensity);
            const scale = THREE.MathUtils.clamp(mag / 1e9, 0.4, 1.5);

            // Set base orientation
            dummy.position.set(x, y, 0);
            dummy.scale.set(scale, scale, scale);
            dummy.quaternion.setFromUnitVectors(zAxis, unitVector);
            dummy.updateMatrix();

            instancedArrows.setMatrixAt(index, dummy.matrix);
            instanceColorBuffer.set(colorArr, index * 3);

            // Offset to base of cone
            const perpVector = new THREE.Vector3(-unitVector.y, unitVector.x, 0).normalize();
            dummy.quaternion.setFromUnitVectors(zAxis, perpVector);

            const coneBaseOffset = unitVector.clone().multiplyScalar(-0.05 * scale);
            dummy.position.set(x + coneBaseOffset.x, y + coneBaseOffset.y, 0);
            dummy.scale.set(scale, scale, scale);
            dummy.updateMatrix();

            index++;
        }
    }

    // --- Finalize mesh ---
    instancedArrows.instanceMatrix.needsUpdate = true;
    instanceColorBuffer.needsUpdate = true;
    instancedArrows.renderOrder = 0;

    group.add(instancedArrows);
}
