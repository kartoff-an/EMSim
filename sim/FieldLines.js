import * as THREE from 'three';

const tempVec3 = new THREE.Vector3();

function RK4(x0, y0, h, chargeConfig) {
  const f = (x, y, out) => {
    const E = chargeConfig.getElectricFieldAt(x, y);
    const len = Math.sqrt(E.x * E.x + E.y * E.y);
    if (len === 0) {
      out[0] = 0;
      out[1] = 0;
    } else {
      out[0] = E.x / len;
      out[1] = E.y / len;
    }
  };

  const E = chargeConfig.getElectricFieldAt(x0, y0);
  const fieldStrength = Math.sqrt(E.x * E.x + E.y * E.y);
  const adaptiveH = Math.min(h * (1 + 0.1 / (fieldStrength + 0.01)), 0.05);

  const k1 = [0, 0], k2 = [0, 0], k3 = [0, 0], k4 = [0, 0];
  f(x0, y0, k1);
  k1[0] *= adaptiveH; k1[1] *= adaptiveH;
  f(x0 + k1[0] / 2, y0 + k1[1] / 2, k2);
  k2[0] *= adaptiveH; k2[1] *= adaptiveH;
  f(x0 + k2[0] / 2, y0 + k2[1] / 2, k3);
  k3[0] *= adaptiveH; k3[1] *= adaptiveH;
  f(x0 + k3[0], y0 + k3[1], k4);
  k4[0] *= adaptiveH; k4[1] *= adaptiveH;

  const dx = (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]) / 6;
  const dy = (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]) / 6;

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