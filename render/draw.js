import * as THREE from 'three';
import { generateAllFieldLineTraces } from '../sim/FieldLines.js';

function intensityToColor(intensity, maxIntensity) {
    const t = Math.min(intensity / maxIntensity, 1);

    let r, g, b;

    if (t < 0.33) {
        // Green -> Yellow
        const localT = t / 0.33;
        r = (1 - localT) * 46 + localT * 241;
        g = (1 - localT) * 204 + localT * 196;
        b = (1 - localT) * 113 + localT * 15;
    } else if (t < 0.66) {
        // Yellow -> Orange
        const localT = (t - 0.33) / 0.33;
        r = (1 - localT) * 241 + localT * 230;
        g = (1 - localT) * 196 + localT * 126;
        b = (1 - localT) * 15 + localT * 34;
    } else {
        // Orange -> Red
        const localT = (t - 0.66) / 0.34;
        r = (1 - localT) * 230 + localT * 231;
        g = (1 - localT) * 126 + localT * 76;
        b = (1 - localT) * 34 + localT * 60;
    }

    return [r / 255, g / 255, b / 255];
}

function getColorMapping(positions, chargeConfig) {
    const colors = [];
    const maxIntensity = 1;

    for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const y = positions[i + 1];
        if (isNaN(x) || isNaN(y)) {
            colors.push(0, 0, 0);
            continue;
        }
        const mag = chargeConfig.getElectricFieldAt(x, y).length();
        const color = intensityToColor((mag / 500e8).toFixed(2), maxIntensity);
        colors.push(...color);
    }

    return colors;
}

function addLineToGroup(buffer, chargeConfig, group) {
    const positionAttr = new Float32Array(buffer);
    const geometry = new THREE.BufferGeometry();
    const colors = getColorMapping(positionAttr, chargeConfig);

    geometry.setAttribute('position', new THREE.BufferAttribute(positionAttr, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const lineMaterial = new THREE.LineBasicMaterial({ vertexColors: true });
    const line = new THREE.Line(geometry, lineMaterial);
    group.add(line);
}

function createLineArrows(trace, chargeConfig) {
    const arrowCount = Math.min(6, Math.floor(trace.length / 500));
    const maxIntensity = 1;

    const coneGeom = new THREE.ConeGeometry(0.04, 0.08, 6);
    const arrowMaterial = new THREE.MeshBasicMaterial({vertexColors: true, depthWrite: true });
    const instancedArrows = new THREE.InstancedMesh(coneGeom, arrowMaterial, arrowCount);
    const dummy = new THREE.Object3D();
    const colorsArray = new Float32Array(arrowCount * 3);
    const axis = new THREE.Vector3(0, 1, 0);

    for (let k = 1; k <= arrowCount; k++) {
        const index = Math.floor((k * trace.length) / (arrowCount + 1));

        if (index >= trace.length - 1) continue;

        const p1 = trace[index];
        const p2 = trace[index + 1];
        const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
        const dir = new THREE.Vector3().subVectors(p2, p1).normalize();
        const E = chargeConfig.getElectricFieldAt(mid.x, mid.y);
        const mag = E.length();
        const colorArr = intensityToColor((mag / 500e8).toFixed(2), maxIntensity);
        const quaternion = new THREE.Quaternion().setFromUnitVectors(axis, dir);

        dummy.position.copy(mid);
        dummy.renderOrder = 0;
        dummy.scale.set(0.8, 0.8, 0);
        dummy.quaternion.copy(quaternion);
        dummy.updateMatrix();

        colorsArray.set(colorArr, (k - 1) * 3);
        instancedArrows.setMatrixAt(k - 1, dummy.matrix);
    }

    instancedArrows.instanceColor = new THREE.InstancedBufferAttribute(colorsArray, 3);
    instancedArrows.instanceMatrix.needsUpdate = true;
    return instancedArrows;
}


function createGridVectors(chargeConfig, gridSize, divisions, group) {
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



let fieldLines = [];
let gridSize = 0;

const Draw = {
    grid: (camera, distance) => {
        const fov = THREE.MathUtils.degToRad(camera.fov);
        const heightAtDistance = 2 * Math.tan(fov / 2) * distance;
        const widthAtDistance = heightAtDistance * camera.aspect;

        gridSize = Math.max(widthAtDistance, heightAtDistance);

        const gridHelper = new THREE.GridHelper(1, 50, 0x222222, 0x222222);
        gridHelper.scale.set(gridSize, 1, gridSize);
        gridHelper.rotation.x = Math.PI / 2;
        gridHelper.position.z = 0;

        return gridHelper;
    },

    drawFields: (scene, chargeConfig, shouldShowArrows = true, shouldShowGridVectors = true) => {
        for (const line of fieldLines) {
            line.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
            scene.remove(line);
        }
        fieldLines.length = 0;

        const fieldGroup = new THREE.Group();
        const positions = generateAllFieldLineTraces(chargeConfig);

        if (shouldShowArrows && positions.trace) {
            for (let i = 0; i < positions.trace.length; i++) {
                const arrows = createLineArrows(positions.trace[i], chargeConfig);
                fieldGroup.add(arrows);
            }
        }

        const buff = positions.buff;
        let currentLine = [];

        for (let i = 0; i < buff.length; i += 3) {
            const x = buff[i], y = buff[i + 1], z = buff[i + 2];

            if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
                if (currentLine.length >= 6) {
                    addLineToGroup(currentLine, chargeConfig, fieldGroup);
                }
                currentLine = [];
            } else {
                currentLine.push(x, y, z);
            }
        }
        if (currentLine.length >= 6) {
            addLineToGroup(currentLine, chargeConfig, fieldGroup);
        }

        if (shouldShowGridVectors) {
            createGridVectors(chargeConfig, gridSize, 50, fieldGroup);
        }

        fieldGroup.renderOrder = 0;
        scene.add(fieldGroup);
        fieldLines.push(fieldGroup);
    }
};

export default Draw;