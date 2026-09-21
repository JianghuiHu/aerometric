import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import './style.css';
import { createDrone } from './drone/createDrone.js';
import { droneConfig } from './drone/config.js';

const container = document.querySelector('#app');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf1f3f4);
scene.fog = new THREE.Fog(0xf1f3f4, 16, 30);

const camera = new THREE.PerspectiveCamera(34, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(7.7, 4.4, 8.9);

const orthographicSize = 7.2;
function createOrthographicCamera(position, up) {
  const aspect = window.innerWidth / window.innerHeight;
  const orthoCamera = new THREE.OrthographicCamera(
    (-orthographicSize * aspect) / 2,
    (orthographicSize * aspect) / 2,
    orthographicSize / 2,
    -orthographicSize / 2,
    0.1,
    40,
  );
  orthoCamera.position.copy(position);
  orthoCamera.up.copy(up);
  orthoCamera.lookAt(0, -0.08, 0);
  return orthoCamera;
}

const debugCameras = {
  top: createOrthographicCamera(new THREE.Vector3(0, 12, 0), new THREE.Vector3(0, 0, -1)),
  front: createOrthographicCamera(new THREE.Vector3(0, 0, 12), new THREE.Vector3(0, 1, 0)),
  right: createOrthographicCamera(new THREE.Vector3(12, 0, 0), new THREE.Vector3(0, 1, 0)),
};
let activeCamera = camera;

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.02;
container.appendChild(renderer.domElement);

const pmremGenerator = new THREE.PMREMGenerator(renderer);
scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
pmremGenerator.dispose();

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.055;
controls.enablePan = false;
controls.minDistance = 6.2;
controls.maxDistance = 19;
controls.minPolarAngle = Math.PI * 0.12;
controls.maxPolarAngle = Math.PI * 0.49;
controls.target.set(0, -0.08, 0.05);

function setDebugView(view) {
  activeCamera = view === 'perspective' ? camera : debugCameras[view];
  controls.enabled = view === 'perspective';
  drone.rotation.y = view === 'perspective' ? -0.18 : 0;
  if (view !== 'perspective') {
    drone.userData.rotors.forEach((rotor) => { rotor.rotation.y = 0; });
  }
}

function setDebugScale(scale) {
  Object.values(debugCameras).forEach((orthoCamera) => {
    orthoCamera.zoom = scale;
    orthoCamera.updateProjectionMatrix();
  });
}

window.addEventListener('keydown', (event) => {
  const views = { Digit1: 'perspective', Digit2: 'top', Digit3: 'front', Digit4: 'right' };
  const scales = { Digit5: 0.25, Digit6: 0.167, Digit7: 0.1, Digit0: 1 };
  if (views[event.code]) setDebugView(views[event.code]);
  if (scales[event.code]) setDebugScale(scales[event.code]);
});

scene.add(new THREE.HemisphereLight(0xffffff, 0x6d7780, 0.92));

const keyLight = new THREE.DirectionalLight(0xfffdf9, 2.8);
keyLight.position.set(5.5, 8.5, 6.5);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024, 1024);
keyLight.shadow.camera.near = 1;
keyLight.shadow.camera.far = 24;
keyLight.shadow.camera.left = -8;
keyLight.shadow.camera.right = 8;
keyLight.shadow.camera.top = 8;
keyLight.shadow.camera.bottom = -8;
keyLight.shadow.bias = -0.0002;
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight(0x9cc9ef, 1.6);
rimLight.position.set(-6.5, 5, -7.5);
scene.add(rimLight);

const fillLight = new THREE.DirectionalLight(0xdcecff, 0.9);
fillLight.position.set(-4, 3, 5);
scene.add(fillLight);

const blueBounce = new THREE.PointLight(0x168cff, 0.45, 8, 2);
blueBounce.position.set(0, -0.2, 3.5);
scene.add(blueBounce);

const floor = new THREE.Mesh(
  new THREE.CircleGeometry(18, 96),
  new THREE.MeshStandardMaterial({ color: 0xe7eaec, roughness: 0.82, metalness: 0 }),
);
floor.name = 'StudioFloor';
floor.rotation.x = -Math.PI / 2;
floor.position.y = -1.35;
floor.receiveShadow = true;
scene.add(floor);

const drone = createDrone(droneConfig);
drone.rotation.y = -0.18;
drone.position.y = 0.12;
scene.add(drone);

const clock = new THREE.Clock();
let elapsed = 0;

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);
  elapsed += delta;

  if (activeCamera === camera) {
    for (const rotor of drone.userData.rotors) {
      rotor.rotation.y += delta * droneConfig.animation.rotorSpeed * rotor.userData.rotationDirection;
    }
  }

  drone.position.y = 0.12 + Math.sin(elapsed * droneConfig.animation.hoverSpeed * Math.PI * 2) * droneConfig.animation.hoverAmplitude;
  drone.rotation.z = Math.sin(elapsed * 0.72) * 0.004;

  controls.update();
  renderer.render(scene, activeCamera);
}

function handleResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  const aspect = width / height;
  Object.values(debugCameras).forEach((orthoCamera) => {
    orthoCamera.left = (-orthographicSize * aspect) / 2;
    orthoCamera.right = (orthographicSize * aspect) / 2;
    orthoCamera.top = orthographicSize / 2;
    orthoCamera.bottom = -orthographicSize / 2;
    orthoCamera.updateProjectionMatrix();
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.setSize(width, height);
}

window.addEventListener('resize', handleResize);
window.__DRONE_DEMO__ = {
  scene,
  camera,
  debugCameras,
  renderer,
  controls,
  drone,
  handleResize,
  setDebugView,
  setDebugScale,
};

animate();
