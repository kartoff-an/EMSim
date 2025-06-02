import  Charge from './Charge.js';

class ChargeManager {
    constructor() {
        this.charges = [new Charge(0,0,2)];
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
    }
}

export default ChargeManager;