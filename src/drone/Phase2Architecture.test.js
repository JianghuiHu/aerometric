import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DroneSceneController} from './scene/DroneSceneController.js';
import {DroneController} from './DroneController.js';
import {DroneModelAdapter} from './DroneModelAdapter.js';
import {DroneStatusField} from './effects/DroneStatusField.js';
import {DroneHoverController} from './effects/DroneHoverController.js';
import {DroneStatusController} from './status/DroneStatusController.js';
import {DEFAULT_DRONE_CONFIG,migrateDroneConfig} from './DroneAppearanceConfig.js';

const bytes=fs.readFileSync('public/models/drone_v3.glb');
const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
const hostScene=new THREE.Scene(), hierarchy=new DroneSceneController(gltf.scene).attach(hostScene);
const motion=new DroneController(hierarchy.root,{poseRoot:hierarchy.rotationRoot}), adapter=new DroneModelAdapter(hierarchy.root);
const field=new DroneStatusField(hierarchy.effectRoot,hierarchy.effectDiameter), hover=new DroneHoverController(hierarchy.hoverRoot);
const status=new DroneStatusController({statusField:field,hover,lights:adapter.lights,rotor:motion});

test('scene hierarchy keeps one horizontal status field outside hover and rotation',()=>{
  assert.equal(hierarchy.modelRoot.parent,hierarchy.rotationRoot); assert.equal(hierarchy.rotationRoot.parent,hierarchy.hoverRoot);
  assert.equal(hierarchy.hoverRoot.parent,hierarchy.positionRoot); assert.equal(hierarchy.effectRoot.parent,hierarchy.positionRoot);
  assert.deepEqual(hierarchy.effectRoot.children.map(child=>child.name),['DroneStatusField']);
  motion.setPose({pitch:28,roll:19,yaw:35}); hostScene.updateMatrixWorld(true);
  const normal=new THREE.Vector3(0,0,1).applyQuaternion(field.mesh.getWorldQuaternion(new THREE.Quaternion()));
  assert.ok(normal.distanceTo(new THREE.Vector3(0,1,0))<1e-6);
});

test('status field is one adaptive normal-blended shader with disc, two ripples and edge glow',()=>{
  assert.equal(field.geometry.attributes.position.count,4); assert.equal(field.material.blending,THREE.NormalBlending);
  assert.match(field.material.fragmentShader,/float disc=/); assert.match(field.material.fragmentShader,/fract\(t\+0\.5\)/);
  assert.match(field.material.fragmentShader,/float edge=/); assert.ok(field.material.uniforms.uDiscRadius.value>.6);
  assert.ok(field.mesh.scale.x>=hierarchy.effectDiameter*1.2);
  assert.ok(field.mesh.scale.x<=hierarchy.effectDiameter*2.4*1.35);
});

test('Phase 2 UI exposes one status-field control and no legacy duplicate toggles',()=>{
  const source=fs.readFileSync('src/viewer.js','utf8');
  const locale=fs.readFileSync('src/i18n/locales/zh-CN.js','utf8');
  assert.equal((source.match(/id="status-field-visible"/g)||[]).length,1);
  for(const legacy of ['id="effects-visible"','id="ripple-enabled"','波纹开启','特效开启']) assert.equal(source.includes(legacy),false);
  for(const label of ['状态场','扩散速度','作用范围','状态强度']) assert.equal(locale.includes(label),true);
});

test('camera-distance compensation strengthens small views without unbounded growth',()=>{
  const camera=new THREE.PerspectiveCamera(34,1,.01,50); camera.position.set(0,.5,.8); hostScene.updateMatrixWorld(true);
  for(let i=0;i<80;i++) field.update(.016,i*.016,camera); const near=field.screenBoost;
  camera.position.set(0,2,8); for(let i=0;i<80;i++) field.update(.016,2+i*.016,camera); const far=field.screenBoost;
  assert.ok(near<=1.02); assert.ok(far>near); assert.ok(far<=1.35);
});

test('new config has one statusField visibility flag and migrates legacy values once',()=>{
  assert.equal('effectsVisible' in DEFAULT_DRONE_CONFIG.status,false); assert.equal('ripple' in DEFAULT_DRONE_CONFIG.status,false);
  const migrated=migrateDroneConfig({status:{type:'online',effectsVisible:true,ripple:{enabled:false,color:'#123456',speed:.9,radius:1.7,intensity:.5}}});
  assert.deepEqual(migrated.status.statusField,{visible:false,color:'#123456',speed:.9,range:1.7,intensity:.5});
  assert.equal('effectsVisible' in migrated.status,false); assert.equal('ripple' in migrated.status,false);
});

test('states coordinate field, lights, hover and mission rotor through one controller',()=>{
  status.setStatus('online'); assert.equal(status.getConfig().statusField.color,'#3ba9ff'); assert.equal(hover.target.enabled,true);
  status.setStatus('mission'); assert.equal(motion.running,true); assert.equal(status.getConfig().statusField.intensity,.55);
  status.setManualRotorRunning(true); status.setStatus('notice'); assert.equal(motion.running,true);
  status.setManualRotorRunning(false); status.setStatus('mission'); assert.equal(motion.running,false);
});

test('warning breathes smoothly without hard flashing',()=>{
  status.clearManualRotorOverride(); status.setStatus('warning'); for(let i=0;i<20;i++) status.update(.02,i*.02);
  const values=[]; for(let i=0;i<80;i++){status.update(.02,.4+i*.02);values.push(adapter.lights.meshes[0].material.emissiveIntensity);}
  assert.ok(Math.min(...values)>.8); assert.ok(Math.max(...values)<2.1); assert.ok(Math.max(...values)-Math.min(...values)>.2);
});

test('field, lights and hover have independent visibility controls',()=>{
  status.setStatus('online'); status.setStatusFieldVisible(false); status.setLightVisible(false); status.setHoverEnabled(false);
  assert.equal(field.mesh.visible,false); assert.equal(adapter.lights.meshes.every(mesh=>!mesh.visible),true);
  for(let i=0;i<100;i++)status.update(.02,i*.02); assert.ok(Math.abs(hierarchy.hoverRoot.position.y)<.0001);
  status.setStatusFieldVisible(true); status.setLightVisible(true); status.setHoverEnabled(true);
});

test('export root excludes status field and dispose releases it',()=>{
  assert.equal(hierarchy.getExportRoot().getObjectByName('DroneStatusField'),undefined);
  let disposed=false; field.material.addEventListener('dispose',()=>disposed=true); status.dispose();
  assert.equal(field.mesh.parent,null); assert.equal(disposed,true);
});
