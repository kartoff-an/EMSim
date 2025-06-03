import * as THREE from 'three';
import FieldLines from '../sim/FieldLines.js';

const Draw = {
    pointCharge: (ch) => {
        const group = new THREE.Group(); 
        const radius = 0.2;
        const ringThickness = 0.025;

        const RED = 0xff3366;
        const DARK_RED = 0xAF0C15;
        const BLUE = 0x1761B0;
        const DARK_BLUE = 0x0D3580;
        const GREY = 0x282828;
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
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 128;
        canvas.height = 128;

        ctx.fillStyle = 'white';
        ctx.font = 'bold 64px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(chargeLabel, 64, 64);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(0.3, 0.3, 1);

        group.add(sprite);

        group.position.set(ch.position.x, ch.position.y, 0);
        group.renderOrder = 1;
        
        return group;
    },

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

    drawFields: (chargeConfig, N = 500) => {
        const fieldGroup = new THREE.Group();

        const numLinesPerCharge = 8;
        const radius = 0.1;
        const whiteMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });

        const positions = [];
        const epsilon = 0.05;

        function isNearCharge(point, sourcePos) {
            for (const charge of chargeConfig.charges) {
                const cx = charge.position.x;
                const cy = charge.position.y;

                // Skip source charge
                const dx0 = cx - sourcePos.x;
                const dy0 = cy - sourcePos.y;
                if (dx0 * dx0 + dy0 * dy0 < 1e-6) continue;

                const dx = cx - point.x;
                const dy = cy - point.y;
                if (dx * dx + dy * dy < epsilon * epsilon) {
                    return true;
                }
            }
            return false;
        }

        function extendTrace(trace, direction, sourcePos, maxExtendSteps = 200) {
            if (trace.length === 0) return trace;

            let extendedTrace = trace.slice();
            let lastPoint = extendedTrace[extendedTrace.length - 1];

            let stepsLeft = maxExtendSteps;
            const fieldLine = new FieldLines(chargeConfig);

            while (!isNearCharge(lastPoint, sourcePos) && stepsLeft > 0) {
                const newPoints = fieldLine.generateTracePoints(lastPoint.x, lastPoint.y, 50, direction);
                if (newPoints.length === 0) break;

                // Convert to THREE.Vector3 if needed
                let pts = newPoints;
                if (!(pts[0] instanceof THREE.Vector3)) {
                    pts = newPoints.map(p => new THREE.Vector3(p.x, p.y, 0));
                }

                if (pts[0].distanceTo(lastPoint) < 1e-8) {
                    pts.shift();
                }
                if (pts.length === 0) break;

                extendedTrace = extendedTrace.concat(pts);
                lastPoint = extendedTrace[extendedTrace.length - 1];
                stepsLeft -= 50;
            }

            return extendedTrace;
        }

        for (const charge of chargeConfig.charges) {
            if (charge.charge === 0) continue;
            const { x, y } = charge.position;

            for (let i = 0; i < numLinesPerCharge; i++) {
                const angle = (i / numLinesPerCharge) * 2 * Math.PI;
                const x0 = x + radius * Math.cos(angle);
                const y0 = y + radius * Math.sin(angle);

                const fieldLine = new FieldLines(chargeConfig);

                let forward = fieldLine.generateTracePoints(x0, y0, N, 1);
                let backward = fieldLine.generateTracePoints(x0, y0, N, -1);

                // Convert to Vector3 if necessary
                if (forward.length && !(forward[0] instanceof THREE.Vector3)) {
                    forward = forward.map(p => new THREE.Vector3(p.x, p.y, 0));
                }
                if (backward.length && !(backward[0] instanceof THREE.Vector3)) {
                    backward = backward.map(p => new THREE.Vector3(p.x, p.y, 0));
                }

                forward = extendTrace(forward, 1, { x: x0, y: y0 });
                backward = extendTrace(backward, -1, { x: x0, y: y0 });

                if (forward.length + backward.length < 2) continue;

                const fullTrace = [];

                for (let j = backward.length - 1; j >= 0; j--) {
                    fullTrace.push(backward[j]);
                }

                fullTrace.push(new THREE.Vector3(x0, y0, 0));
                fullTrace.push(...forward);

                if (fullTrace.length < 2) continue;

                for (const p of fullTrace) {
                    positions.push(p.x, p.y, 0);
                }
                positions.push(NaN, NaN, NaN); // separate line segments
            }
        }

        const positionAttr = new Float32Array(positions);
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positionAttr, 3));

        // Use LineSegments to support NaN breaks
        const lineSegments = new THREE.LineSegments(geometry, whiteMaterial);
        fieldGroup.add(lineSegments);

        fieldGroup.renderOrder = 0;
        return fieldGroup;
    }
};

export default Draw;
