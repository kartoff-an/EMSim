import * as THREE from 'three';
import FieldLines from '../sim/FieldLines.js';

const Draw = {
    pointCharge: (ch) => {
        const group = new THREE.Group(); 
        const radius = 0.2;
        const ringThickness = 0.025;

        // Colors for charge types
        const RED = 0xff3366;
    ;
        const DARK_RED = 0xAF0C15;
        const BLUE = 0x1761B0;
        const DARK_BLUE = 0x0D3580;
        const GREY = 0x282828;
        let edgeColor, circColor;

        if ( ch.charge > 0 ) {
            circColor = RED;
            edgeColor = DARK_RED;
        }
        else if ( ch.charge < 0 ) {
            circColor = BLUE;
            edgeColor = DARK_BLUE;
        }
        else {
            circColor = GREY;
            edgeColor = GREY;
        }

        // Create the filled circle representing the charge
        const geometry = new THREE.CircleGeometry(radius, 64);
        const material = new THREE.MeshBasicMaterial( { color : circColor } );
        const circle = new THREE.Mesh( geometry, material );
        circle.position.z = 0;
        group.add(circle);

        // Create the ring outline
        const ringGeometry = new THREE.RingGeometry(radius, radius + ringThickness, 64);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: edgeColor,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.z = 0;    
        group.add(ring);

        // TEXT as sprite
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

        const numLinesPerCharge = 12;
        const radius = 0.1;

        for (const charge of chargeConfig.charges) {
            const { x, y } = charge.position;

            for (let i = 0; i < numLinesPerCharge; i++) {
                const angle = (i / numLinesPerCharge) * 2 * Math.PI;
                const x0 = x + radius * Math.cos(angle);
                const y0 = y + radius * Math.sin(angle);

                const fieldLine = new FieldLines(chargeConfig);

                const forwardTrace = fieldLine.generateTracePoints(x0, y0, N, 1);
                const backwardTrace = fieldLine.generateTracePoints(x0, y0, N, -1);
                const fullTrace = backwardTrace.reverse().concat([new THREE.Vector2(x0, y0)], forwardTrace);

                if (fullTrace.length < 2) continue;

                const curve = new THREE.CatmullRomCurve3(fullTrace.map(p => new THREE.Vector3(p.x, p.y, 0)));
                const points = curve.getPoints(100);
                const geometry = new THREE.BufferGeometry().setFromPoints(points);
                const material = new THREE.LineBasicMaterial({ color: 0xffffff });
                const splineObject = new THREE.Line(geometry, material);

                fieldGroup.add(splineObject);
            }
        }

        return fieldGroup;
    }
}


export default Draw;