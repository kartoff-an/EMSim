import * as THREE from 'three';

function roundFloat(dec) {
    return parseFloat(dec.toFixed(2));
}
class Charge {
    constructor(posX, posY, charge = 0) {
        this.position = new THREE.Vector2( roundFloat(posX), roundFloat(posY) );
        this.charge = charge.toFixed(2);
    }

    electricFieldAt(x, y) {
        const k = 8.98755e9; // Coulomb constant
        const q = this.charge;
        const dx = x - this.position.x;
        const dy = y - this.position.y;
        const rSquared = dx * dx + dy * dy;
        const r = Math.sqrt(rSquared);
        const E = k * (q / rSquared);

        return new THREE.Vector2(E * (dx / r), E * (dy / r));
    }
}

export default Charge;