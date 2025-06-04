import * as THREE from 'three';
import { generateAllFieldLineTraces } from '../sim/FieldLines.js';

function generateText(text) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 128;
    canvas.height = 128;

    ctx.fillStyle = 'white';
    ctx.font = 'bold 64px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(0.3, 0.3, 1);

    return sprite;
}


const RED = 0xff3366;
const DARK_RED = 0xAF0C15;
const BLUE = 0x1761B0;
const DARK_BLUE = 0x0D3580;
const GREY = 0x282828;

const Draw = {

    // Draw point charges
    pointCharge: (ch) => {
        const group = new THREE.Group(); 
        const radius = 0.2;
        const ringThickness = 0.025;

        let edgeColor, circColor;

        if (ch.charge > 0) {
            circColor = RED;
            edgeColor = DARK_RED;
        } else if (ch.charge < 0) {
            circColor = BLUE;
            edgeColor = DARK_BLUE;
        } else {
            circColor = GREY;
            edgeColor = GREY;
        }

        const geometry = new THREE.CircleGeometry(radius, 64);
        const material = new THREE.MeshBasicMaterial({ color: circColor });
        const circle = new THREE.Mesh(geometry, material);
        circle.position.z = 0;
        group.add(circle);

        const ringGeometry = new THREE.RingGeometry(radius, radius + ringThickness, 64);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: edgeColor,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.z = 0;  
        group.add(ring);

        const chargeLabel = ch.charge > 0 ? '+' + ch.charge : ch.charge;
        const text = generateText(chargeLabel);
        group.add(text);


        group.position.set(ch.position.x, ch.position.y, 0);
        group.renderOrder = 1;
        
        return group;
    },


    //// Draw grid 

    grid: (camera, distance) => {
        const fov = THREE.MathUtils.degToRad(camera.fov);
        const heightAtDistance = 2 * Math.tan(fov / 2) * distance;
        const widthAtDistance = heightAtDistance * camera.aspect;

        const size = Math.max(widthAtDistance, heightAtDistance);

        const gridHelper = new THREE.GridHelper(1, 50, 0x222222, 0x222222);
        gridHelper.scale.set(size, 1, size);
        gridHelper.rotation.x = Math.PI / 2;
        gridHelper.position.z = 0;

        return gridHelper;
    },




    

    drawFields: (chargeConfig, shouldShowArrows) => {
        const fieldGroup = new THREE.Group();
        const positions = generateAllFieldLineTraces(chargeConfig, 12, 2000);

        if (shouldShowArrows) {
            for (let i = 0; i < positions.trace.length; i++) {
                const arrows = createArrows(positions.trace[i], chargeConfig);
                arrows.position.z = 0;
                fieldGroup.add(arrows);
            }
        }
        
        const positionAttr = new Float32Array(positions.buffer);
        const geometry = new THREE.BufferGeometry();
        const colors = getColorMapping(positions.buffer, chargeConfig);

        geometry.setAttribute('position', new THREE.BufferAttribute(positionAttr, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        const lineMaterial = new THREE.LineBasicMaterial({ vertexColors: true });
        const lineSegments = new THREE.LineSegments(geometry, lineMaterial);
        fieldGroup.add(lineSegments);

        fieldGroup.renderOrder = 0;
        return fieldGroup;
    }
};

export default Draw;



















function intensityToColor(intensity, maxIntensity) {
    intensity = intensity / 500e8;
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
        const color = intensityToColor(mag, maxIntensity);
        colors.push(...color);
    }

    return colors;
}

function createArrows(trace, chargeConfig) {
    const arrowCount = Math.min(6, Math.floor(trace.length / 200));
    const maxIntensity = 1;

    const coneGeom = new THREE.ConeGeometry(0.04, 0.08, 6);
    const arrowMaterial = new THREE.MeshBasicMaterial({ depthWrite: true});

    const instancedArrows = new THREE.InstancedMesh(coneGeom, arrowMaterial, arrowCount);
    const dummy = new THREE.Object3D();
    const colorsArray = new Float32Array(arrowCount * 3);

    for (let k = 1; k <= arrowCount; k++) {
        const index = Math.floor((k * trace.length) / (arrowCount + 1));
        if (index >= trace.length - 1) continue;

        const p1 = trace[index];
        const p2 = trace[index + 1];

        const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
        const dir = new THREE.Vector3().subVectors(p2, p1).normalize();

        const E = chargeConfig.getElectricFieldAt(mid.x, mid.y);
        const mag = E.length();
        const colorArr = intensityToColor(mag, maxIntensity);

        colorsArray.set(colorArr, (k - 1) * 3);

        dummy.position.copy(mid);
        dummy.renderOrder = 0;
        dummy.scale.set(0.8, 0.8, 0);
        const axis = new THREE.Vector3(0, 1, 0);
        const quaternion = new THREE.Quaternion().setFromUnitVectors(axis, dir);
        dummy.quaternion.copy(quaternion);
        dummy.updateMatrix();

        instancedArrows.setMatrixAt(k - 1, dummy.matrix);
        
    }

    instancedArrows.instanceColor = new THREE.InstancedBufferAttribute(colorsArray, 3);
    instancedArrows.instanceMatrix.needsUpdate = true;
    return instancedArrows;
}
