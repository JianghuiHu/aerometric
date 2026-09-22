import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { AnimationMixer } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DroneModelAdapter } from './DroneModelAdapter.js';
import { createDronePackageConfig, exportCurrentDroneGLB } from './export/DroneGLBExporter.js';
import { DEFAULT_DRONE_CONFIG } from './DroneAppearanceConfig.js';

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
function materialColor(mesh) { const material = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material; return material.color.getHexString(); }

test('current GLB round trip preserves runtime appearance and excludes hidden or runtime-only objects', async () => {
  const source = await load('public/models/quadrotor-v3/model.glb');
  const adapter = new DroneModelAdapter(source);
  adapter.setPartColor('body', '#1769d2');
  adapter.setPartColor('arms', '#b04a32');
  adapter.setPartVisible('camera', false);
  adapter.setPartVisible('landingGear', false);
  adapter.lights.set({ visible: true, color: '#d948cf', intensity: 2.6 });

  const sourceBytes = fs.statSync('public/models/quadrotor-v3/model.glb').size;
  const glb = await exportCurrentDroneGLB(adapter.root, { status: DEFAULT_DRONE_CONFIG.status });
  assert.ok(glb instanceof ArrayBuffer && glb.byteLength > 1000);
  assert.ok(glb.byteLength < sourceBytes * 0.85);
  const parsed = await loadGLTF(glb), reloaded = parsed.scene;

  assert.equal(materialColor(reloaded.getObjectByName('Body_Main')), '1769d2');
  assert.equal(materialColor(firstMesh(reloaded.getObjectByName('ARM_FL'))), 'b04a32');
  assert.equal(reloaded.getObjectByName('Camera_Main'), undefined);
  assert.equal(reloaded.getObjectByName('LANDING_GEAR'), undefined);
  for (const suffix of ['FL', 'FR', 'RL', 'RR']) assert.equal(reloaded.getObjectByName(`Landing_Strut_${suffix}`), undefined);
  for (const name of ['FrontLight_Diffuser_L', 'FrontLight_Diffuser_R', 'StatusLight_FL', 'StatusLight_FR', 'StatusLight_RL', 'StatusLight_RR']) {
    assert.equal(reloaded.getObjectByName(name).material.emissive.getHexString(), 'd948cf');
  }
  for (const name of ['DroneStatusField', 'DroneEffectRoot', 'EnvironmentRoot', 'LightingRoot', 'ProceduralSky', 'Rain']) assert.equal(reloaded.getObjectByName(name), undefined);
  for (const name of ['PortableStatusField', 'PortableStatusDisc', 'PortableRipple_1', 'PortableRipple_2']) assert.ok(reloaded.getObjectByName(name));
  assert.equal(parsed.animations.length, 1);
  assert.equal(parsed.animations[0].name, 'AEROMETRIC_Loop');
  assert.equal(parsed.animations[0].tracks.length, 6);
  for (const suffix of ['FL', 'FR', 'RL', 'RR']) assert.ok(parsed.animations[0].tracks.some(track => track.name.includes(`ROTOR_${suffix}`)));
  for (const track of parsed.animations[0].tracks.filter(track => track.name.includes('PortableRipple_'))) {
    const first = Array.from(track.values.slice(0, 3)), last = Array.from(track.values.slice(-3));
    assert.deepEqual(last, first, `${track.name} must close without a scale jump`);
  }
  const rotor = reloaded.getObjectByName('ROTOR_FL'), ripple = reloaded.getObjectByName('PortableRipple_1');
  const beforeRotor = rotor.quaternion.clone(), beforeRipple = ripple.scale.clone();
  const mixer = new AnimationMixer(reloaded); mixer.clipAction(parsed.animations[0]).play(); mixer.update(0.35);
  assert.equal(rotor.quaternion.equals(beforeRotor), false);
  assert.equal(ripple.scale.equals(beforeRipple), false);
  assert.equal(reloaded.children.some(object => object.isCamera), false);
  assert.equal(reloaded.children.some(object => object.isLight), false);
});

test('future package config is serializable beside drone.glb', () => {
  const manifest = createDronePackageConfig(DEFAULT_DRONE_CONFIG);
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.files.model, 'drone.glb');
  assert.equal(manifest.files.preview, 'preview.png');
  assert.equal(manifest.files.bodyTexture, null);
  assert.deepEqual(manifest.camera, DEFAULT_DRONE_CONFIG.camera);
  assert.doesNotThrow(() => JSON.stringify(manifest));
  assert.notEqual(manifest.status, DEFAULT_DRONE_CONFIG.status);
});
