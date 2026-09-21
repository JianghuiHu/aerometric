import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DroneController } from './DroneController.js';
import { DroneModelAdapter } from './DroneModelAdapter.js';
import { DEFAULT_DRONE_CONFIG } from './DroneAppearanceConfig.js';
import { applyDroneConfig } from './DroneRuntimeConfig.js';
import { focusModel } from './cameraTools.js';

const modelPath = 'public/models/drone_v3.glb';
const fileHash = () => crypto.createHash('sha256').update(fs.readFileSync(modelPath)).digest('hex');
const originalHash = fileHash();
const bytes = fs.readFileSync(modelPath);
const gltf = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
const controller = new DroneController(gltf.scene);
const adapter = new DroneModelAdapter(gltf.scene);
const partKeys = ['body', 'topCover', 'arms', 'rotors', 'motors', 'landingGear', 'gimbal', 'camera'];

test('真实 GLB 的八类业务部件均可独立寻址', () => {
  const report = adapter.getMappingReport();
  for (const key of partKeys) {
    assert.ok(report[key].objects.length > 0, `${key} should contain Object3D nodes`);
    assert.ok(report[key].meshes.length > 0, `${key} should contain Mesh nodes`);
  }
  assert.equal(adapter.require('Camera_Main').isMesh, true);
  assert.equal(adapter.lights.meshes.length, 6);
});

test('需要独立换色的部件没有共享运行时 Material', () => {
  const owners = new Map();
  for (const key of partKeys) {
    for (const mesh of adapter.meshes(key)) {
      for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
        if (!owners.has(material.uuid)) owners.set(material.uuid, new Set());
        owners.get(material.uuid).add(key);
      }
    }
  }
  for (const keys of owners.values()) assert.equal(keys.size, 1, `material leaked across ${[...keys].join(', ')}`);
});

test('部件颜色和显隐互不串联，显隐只修改 visible', () => {
  const topColor = adapter.getPartColor('topCover');
  const armGeometry = adapter.meshes('arms')[0].geometry;
  adapter.setPartColor('body', '#ff2200');
  assert.equal(adapter.getPartColor('body'), '#ff2200');
  assert.equal(adapter.getPartColor('topCover'), topColor);
  adapter.setPartVisible('arms', false);
  assert.equal(adapter.isPartVisible('arms'), false);
  assert.equal(adapter.isPartVisible('motors'), true);
  assert.equal(adapter.meshes('arms')[0].geometry, armGeometry);
  adapter.setPartVisible('arms', true);
});

test('实际 Body_Main 无 UV 时拒绝贴图并释放传入资源', () => {
  const capability = adapter.getBodyTextureCapability();
  assert.equal(capability.supported, false);
  assert.equal(capability.uvCount, 0);
  const texture = new THREE.Texture();
  let disposed = false;
  texture.addEventListener('dispose', () => { disposed = true; });
  assert.throws(() => adapter.applyBodyTexture(texture), /缺少 UV/);
  assert.equal(disposed, true);
});

test('有合法 UV 时贴图可替换，旧贴图和清除贴图都会释放资源', () => {
  const body = adapter.require('Body_Main');
  const originalUv = body.geometry.attributes.uv;
  const uv = new Float32Array(body.geometry.attributes.position.count * 2);
  body.geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  const first = new THREE.Texture();
  const second = new THREE.Texture();
  let firstDisposed = false;
  let secondDisposed = false;
  first.addEventListener('dispose', () => { firstDisposed = true; });
  second.addEventListener('dispose', () => { secondDisposed = true; });
  adapter.applyBodyTexture(first);
  assert.equal(adapter.bodyTexture, first);
  adapter.applyBodyTexture(second);
  assert.equal(firstDisposed, true);
  assert.equal(adapter.bodyTexture, second);
  adapter.clearBodyTexture();
  assert.equal(secondDisposed, true);
  assert.equal(adapter.bodyTexture, null);
  body.geometry.deleteAttribute('uv');
  if (originalUv) body.geometry.setAttribute('uv', originalUv);
});

test('状态灯支持显隐、颜色、强度和 Bloom 分层标记', () => {
  adapter.lights.set({ visible: false, color: '#f54b55', intensity: 4 });
  const state = adapter.lights.getState();
  assert.deepEqual(state, { visible: false, color: '#f54b55', intensity: 4 });
  for (const mesh of adapter.lights.meshes) {
    assert.equal(mesh.userData.bloom, true);
    assert.equal(mesh.layers.isEnabled(1), true);
  }
});

test('恢复默认覆盖全部运行时配置且不替换模型实例', () => {
  const modelIdentity = gltf.scene;
  controller.running = true;
  controller.speed = 35;
  controller.update(0.04);
  controller.setPose({ pitch: 12, roll: -8, yaw: 30 });
  controller.setGimbal(20, -25);
  adapter.setPartColor('camera', '#00ff00');
  adapter.setPartVisible('landingGear', false);
  const config = applyDroneConfig({ controller, adapter }, DEFAULT_DRONE_CONFIG);
  assert.equal(gltf.scene, modelIdentity);
  assert.equal(controller.running, false);
  assert.equal(controller.speed, 12);
  assert.equal(adapter.isPartVisible('landingGear'), true);
  assert.equal(adapter.getPartColor('camera'), config.appearance.camera.color);
  assert.deepEqual(adapter.lights.getState(), { visible: true, color: '#3ba9ff', intensity: 2 });
  for (const angle of controller.angles) assert.equal(angle, 0);
});

test('聚焦模型按 Box3 更新目标和相机距离', () => {
  const camera = new THREE.PerspectiveCamera(40, 1, 0.01, 100);
  camera.position.set(1, 1, 1);
  const controls = { target: new THREE.Vector3(), minDistance: 0.1, updates: 0, update() { this.updates++; } };
  const result = focusModel(camera, controls, adapter.root);
  assert.ok(result.distance > 0.1);
  assert.ok(controls.target.distanceTo(result.center) < 1e-8);
  assert.equal(controls.updates, 1);
});

test('外观交互与测试不会改写导出的 GLB 文件', () => {
  assert.equal(fileHash(), originalHash);
});

