import * as THREE from 'three';

const socket = io();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Environment
scene.add(new THREE.GridHelper(100, 100));
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(0, 20, 10);
scene.add(light);

// Car Setup
const createCarMesh = (color = 0xff0000) => {
    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(1, 0.5, 2), new THREE.MeshPhongMaterial({ color }));
    group.add(body);
    return group;
};

const myCar = createCarMesh(0x00ff00);
scene.add(myCar);
camera.position.set(0, 5, 10);

const otherPlayers = {};
const keys = {};

window.addEventListener('keydown', (e) => keys[e.code] = true);
window.addEventListener('keyup', (e) => keys[e.code] = false);

// Networking
socket.on('currentPlayers', (players) => {
    Object.keys(players).forEach(id => {
        if (id !== socket.id) addOtherPlayer(id);
    });
});

socket.on('newPlayer', (data) => addOtherPlayer(data.id));

socket.on('playerMoved', (data) => {
    if (otherPlayers[data.id]) {
        otherPlayers[data.id].position.set(data.state.x, data.state.y, data.state.z);
        otherPlayers[data.id].rotation.y = data.state.ry;
    }
});

socket.on('playerDisconnected', (id) => {
    scene.remove(otherPlayers[id]);
    delete otherPlayers[id];
});

function addOtherPlayer(id) {
    const car = createCarMesh(0xff0000);
    otherPlayers[id] = car;
    scene.add(car);
}

function update() {
    // Basic Car Physics
    if (keys['ArrowUp']) myCar.translateZ(-0.1);
    if (keys['ArrowDown']) myCar.translateZ(0.1);
    if (keys['ArrowLeft']) myCar.rotation.y += 0.05;
    if (keys['ArrowRight']) myCar.rotation.y -= 0.05;

    // Sync camera to follow car
    camera.lookAt(myCar.position);
    
    // Emit position
    socket.emit('move', { 
        x: myCar.position.x, 
        y: myCar.position.y, 
        z: myCar.position.z, 
        ry: myCar.rotation.y 
    });

    renderer.render(scene, camera);
    requestAnimationFrame(update);
}
update();

