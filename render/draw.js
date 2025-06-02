import * as THREE from 'three';

export function drawPointCharge(pointCharge) {
    const group = new THREE.Group(); 
    const radius = 0.2;
    const ringThickness = 0.025;

    const RED = 0xD2292D;
    const DARK_RED = 0xAF0C15;
    const BLUE = 0x1761B0;
    const DARK_BLUE = 0x0D3580;
    const GREY = 0x282828;
    let edgeColor, circColor;

    if ( pointCharge.charge > 0 ) {
        circColor = RED;
        edgeColor = DARK_RED;
    }
    else if ( pointCharge.charge < 0 ) {
        circColor = BLUE;
        edgeColor = DARK_BLUE;
    }
    else {
        circColor = GREY;
        edgeColor = GREY;
    }

    const geometry = new THREE.CircleGeometry(radius, 64);
    const material = new THREE.MeshBasicMaterial( { color : circColor } );
    const circle = new THREE.Mesh( geometry, material );
    group.add(circle);

    const ringGeometry = new THREE.RingGeometry(radius, radius + ringThickness, 64);
    const ringMaterial = new THREE.MeshBasicMaterial({
        color: edgeColor,
        side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    group.add(ring);

    group.position.set(pointCharge.position.x, pointCharge.position.y, 0);
    
    return group;
}