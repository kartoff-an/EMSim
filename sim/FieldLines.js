import * as THREE from 'three';

function RK4(x0, y0, h, chargeConfig) {
    const f = (x, y) => {
        const E = chargeConfig.getElectricFieldAt(x, y);
        return E.lengthSq() == 0 ? new THREE.Vector2(0, 0) : E.clone().normalize();
    };

    const k1 = f(x0, y0).multiplyScalar(h);
    const k2 = f(x0 + k1.x / 2, y0 + k1.y / 2).multiplyScalar(h);
    const k3 = f(x0 + k2.x / 2, y0 + k2.y / 2).multiplyScalar(h);
    const k4 = f(x0 + k3.x, y0 + k3.y).multiplyScalar(h);

    const dx = ((k1.x + 2 * k2.x + 2 * k3.x + k4.x) / 6);
    const dy = ((k1.y + 2 * k2.y + 2 * k3.y + k4.y) / 6);

    return { x: x0 + dx, y: y0 + dy };
}


function generateFieldLineTrace(chargeConfig, x0, y0, N, direction = 1) {
    const trace = [];

    let x = x0;
    let y = y0;
    const h = 0.01 * direction;

    for (let i = 0; i < N; i++) {
        const next = RK4(x, y, h, chargeConfig);

        if (!isFinite(next.x) || !isFinite(next.y)) break;

        const point = new THREE.Vector3(next.x, next.y, 0);
        trace.push(point);

        x = next.x;
        y = next.y;

    }

    return trace;
}

export function generateAllFieldLineTraces(chargeConfig, numLinesPerCharge, numPoints) {
    const trace = [];
    const buffer = [];
    for (const charge of chargeConfig.charges) {
        if (charge.charge == 0) continue;
        for (let i = 0; i < numLinesPerCharge; i++) {
            const vectors = [];
            const radius = 0.1;
            const { x, y } = charge.position;
            const angle = (i / numLinesPerCharge) * 2 * Math.PI;
            const x0 = x + radius * Math.cos(angle);
            const y0 = y + radius * Math.sin(angle);

            let forward = generateFieldLineTrace(chargeConfig, x0, y0, numPoints, 1);
            let backward = generateFieldLineTrace(chargeConfig, x0, y0, numPoints, -1);

            const line =  [...backward.reverse(), new THREE.Vector3(x0, y0, 0), ...forward];
            vectors.push(...line);

            if (vectors.length < 2) continue;
            
            for (const p of vectors) {
                buffer.push(p.x, p.y, 0);
            }
            buffer.push(NaN, NaN, NaN);
            trace.push(vectors);
        }
    }
    return {trace: trace, buff: buffer};
}