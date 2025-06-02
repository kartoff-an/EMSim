import * as THREE from 'three';

class Charge {
    constructor(posX, posY, charge = 0) {
        this.position = new THREE.Vector2( posX, posY );
        this.charge = charge;
    }

    electricFieldAt(x, y) {
        const k = 8.988e9;
        const dx = x - this.position.x;
        const dy = y - this.position.y;
        const RSquared = dx * dx + dy * dy;
        const R = Math.sqrt( RSquared );
        const E = k * this.charge / RSquared;
        
        return new THREE.Vector2( E * ( dx / R ), E * ( dy / R ) );
    }
}

export default Charge;