import * as THREE from 'three';

function roundFloat(dec) {
    return parseFloat(dec.toFixed(2));
}

function generateText(text) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 128;
    canvas.height = 128;

    ctx.fillStyle = 'white';
    ctx.font = 'bold 64px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(0.3, 0.3, 1);

    return sprite;
}

const RED = 0xff3366;
const DARK_RED = 0xAF0C15;
const BLUE = 0x1761B0;
const DARK_BLUE = 0x0D3580;
const GREY = 0x282828;


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

        return {x: E * (dx / r), y: E * (dy / r)};
    }

    generateMesh() {
        const group = new THREE.Group(); 
        const radius = 0.2;
        const ringThickness = 0.025;

        let edgeColor, circColor;

        if (this.charge > 0) {
            circColor = RED;
            edgeColor = DARK_RED;
        } else if (this.charge < 0) {
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

        const chargeLabel = this.charge > 0 ? '+' + this.charge : this.charge;
        const text = generateText(chargeLabel);
        group.add(text);


        group.position.set(this.position.x, this.position.y, 0);
        group.renderOrder = 1;
        
        return group;
    }
}

export default Charge;