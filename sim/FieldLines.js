import * as THREE from 'three';

function RK4(x0, y0, h, chargeConfig) {
    const f = (x, y) => {
        const E = chargeConfig.getElectricFieldAt(x, y);
        if (E.lengthSq() === 0) return new THREE.Vector2(0, 0);
        return E.clone().normalize(); // direction only
    };

    const k1 = f(x0, y0).multiplyScalar(h);
    const k2 = f(x0 + k1.x / 2, y0 + k1.y / 2).multiplyScalar(h);
    const k3 = f(x0 + k2.x / 2, y0 + k2.y / 2).multiplyScalar(h);
    const k4 = f(x0 + k3.x, y0 + k3.y).multiplyScalar(h);

    const dx = (k1.x + 2 * k2.x + 2 * k3.x + k4.x) / 6;
    const dy = (k1.y + 2 * k2.y + 2 * k3.y + k4.y) / 6;

    return { x: x0 + dx, y: y0 + dy };
}


class FieldLines {
    constructor(chargeConfig) {
        this.chargeConfig = chargeConfig;
    }

    generateTracePoints(x0, y0, N, direction = 1) {
        const trace = [];

        let x = x0;
        let y = y0;
        const h = 0.01 * direction;

        for (let i = 0; i < N; i++) {
            const next = RK4(x, y, h, this.chargeConfig);

            if (!isFinite(next.x) || !isFinite(next.y)) break;

            trace.push(new THREE.Vector2(next.x, next.y));
            x = next.x;
            y = next.y;
        }

        return trace;
    }
}

export default FieldLines;