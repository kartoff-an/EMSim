import * as THREE from 'three';
import  Charge from './Charge.js';

class ChargeConfig {
    constructor(charges = []) {
        this.charges = charges;
    }

    addCharge( x, y, charge ) {
        const pointCharge = new Charge( x, y, charge );
        this.charges.push( pointCharge );
        return pointCharge;
    }

    removeCharge( index ) {
        this.charges.splice( index, 1 );
    }

    getElectricFieldAt( x, y ) {
        let totalField = new THREE.Vector2( 0, 0 );
        for ( const charge of this.charges ) {
            const E = charge.electricFieldAt( x, y );
            totalField.add( E );
        }
        return totalField;


        /**const k = 8.987551786214e9;
        let partialE = new THREE.Vector2( 0, 0 );
        for ( const charge of this.charges ) {
            const q = charge.charge;
            const dx = x - charge.position.x;
            const dy = y - charge.position.y;
            const rSquared = dx * dx + dy * dy;
            const r = Math.sqrt(rSquared);
            const partialEvec = new THREE.Vector2((q / rSquared) * (dx / r), (q / rSquared) * (dy / r));
            partialE.add(partialEvec);
        }

        return partialE.multiplyScalar( k );**/
    }
}

export default ChargeConfig;