import * as THREE from 'three';

class Charge {
    constructor(posX, posY, charge = 0) {
        this.position = new THREE.Vector2( posX, posY );
        this.charge = charge;
    }

    electricFieldAt(x, y) {
        const k = 8.987551786214e9; // Coulomb constant
        const q = this.charge * 1.602176634e-19;
        const dx = x - this.position.x;
        const dy = y - this.position.y;
        const rSquared = dx * dx + dy * dy;
        const r = Math.sqrt(rSquared);
        const E = k * (q / rSquared);

        return new THREE.Vector2(E * (dx / r), E * (dy / r));
    }
}

export default Charge;