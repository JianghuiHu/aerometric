import fs from 'node:fs';
import { AnimationMixer } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DroneModelAdapter } from '../src/drone/DroneModelAdapter.js';
import { exportCurrentDroneGLB } from '../src/drone/export/DroneGLBExporter.js';
import { DEFAULT_DRONE_CONFIG } from '../src/drone/DroneAppearanceConfig.js';

class NodeFileReader {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then(result => { this.result = result; this.onloadend?.(); }); }
  readAsDataURL(blob) { blob.arrayBuffer().then(buffer => { this.result = `data:${blob.type};base64,${Buffer.from(buffer).toString('base64')}`; this.onloadend?.(); }); }
}
globalThis.FileReader ??= NodeFileReader;

async function loadGLTF(input) {
  const buffer = input instanceof ArrayBuffer ? input : (() => { const bytes = fs.readFileSync(input); return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength); })();
  return new GLTFLoader().parseAsync(buffer, '');
}
async function load(input) { return (await loadGLTF(input)).scene; }
function firstMesh(object) { let result; object?.traverse(child => { if (!result && child.isMesh) result = child; }); return result; }
function hex(mesh, channel = 'color') { return `#${(Array.isArray(mesh.material) ? mesh.material[0] : mesh.material)[channel].getHexString().toUpperCase()}`; }

const source = await load('public/models/drone_v3.glb');
const adapter = new DroneModelAdapter(source);
adapter.setPartColor('body', '#1769d2');
adapter.setPartColor('arms', '#b04a32');
adapter.setPartVisible('camera', false);
adapter.setPartVisible('landingGear', false);
adapter.lights.set({ visible: true, color: '#d948cf', intensity: 2.6 });

const glb = await exportCurrentDroneGLB(adapter.root, { status: DEFAULT_DRONE_CONFIG.status });
const outputDirectory = 'blender_drone/v3/platform/export-review';
fs.mkdirSync(outputDirectory, { recursive: true });
fs.writeFileSync(`${outputDirectory}/aerometric-current-roundtrip.glb`, Buffer.from(glb));
const parsed = await loadGLTF(glb), reloaded = parsed.scene;
let triangles = 0; reloaded.traverse(object => { if (object.isMesh) triangles += (object.geometry.index?.count ?? object.geometry.attributes.position.count) / 3; });
const animatedRotor = reloaded.getObjectByName('ROTOR_FL'), animatedRipple = reloaded.getObjectByName('PortableRipple_1');
const initialRotor = animatedRotor.quaternion.clone(), initialRipple = animatedRipple.scale.clone();
const mixer = new AnimationMixer(reloaded); mixer.clipAction(parsed.animations[0]).play(); mixer.update(.35);
const report = {
  sourceBytes: fs.statSync('public/models/drone_v3.glb').size,
  exportedBytes: glb.byteLength,
  reductionPercent: Number(((1 - glb.byteLength / fs.statSync('public/models/drone_v3.glb').size) * 100).toFixed(1)),
  exportedTriangles: Math.round(triangles),
  bodyColor: hex(reloaded.getObjectByName('Body_Main')),
  armColor: hex(firstMesh(reloaded.getObjectByName('ARM_FL'))),
  cameraExcluded: !reloaded.getObjectByName('Camera_Main'),
  landingGearExcluded: !reloaded.getObjectByName('LANDING_GEAR'),
  statusLightEmissive: hex(reloaded.getObjectByName('FrontLight_Diffuser_L'), 'emissive'),
  runtimeEffectsExcluded: ['DroneStatusField', 'DroneEffectRoot'].every(name => !reloaded.getObjectByName(name)),
  portableStatusFieldIncluded: ['PortableStatusField', 'PortableStatusDisc', 'PortableRipple_1', 'PortableRipple_2'].every(name => reloaded.getObjectByName(name)),
  animationClip: parsed.animations[0]?.name,
  animationTracks: parsed.animations[0]?.tracks.length,
  rotorAnimationTracks: ['FL', 'FR', 'RL', 'RR'].every(suffix => parsed.animations[0]?.tracks.some(track => track.name.includes(`ROTOR_${suffix}`))),
  rotorMovesAfterReload: !animatedRotor.quaternion.equals(initialRotor),
  rippleMovesAfterReload: !animatedRipple.scale.equals(initialRipple),
  sceneSystemsExcluded: ['EnvironmentRoot', 'LightingRoot', 'ProceduralSky', 'Rain'].every(name => !reloaded.getObjectByName(name)),
  camerasExcluded: !reloaded.children.some(object => object.isCamera),
  lightsExcluded: !reloaded.children.some(object => object.isLight),
};
fs.writeFileSync(`${outputDirectory}/roundtrip-report.json`, `${JSON.stringify(report, null, 2)}\n`);
if (!Object.values(report).every(value => typeof value !== 'boolean' || value)) throw new Error('GLB round-trip verification failed');
console.log(JSON.stringify(report, null, 2));
