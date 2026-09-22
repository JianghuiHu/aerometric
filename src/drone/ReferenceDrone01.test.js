import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {validateModelPackage} from '../../release/aerometric-0.1/validator/src/index.mjs';
import {DroneController} from './DroneController.js';
import {DroneModelAdapter} from './DroneModelAdapter.js';
import {DroneSceneController} from './scene/DroneSceneController.js';
import {DroneStatusField} from './effects/DroneStatusField.js';
import {ModelSession} from '../model/ModelSession.js';
import {createCurrentExportRoot,exportCurrentDroneGLB} from './export/DroneGLBExporter.js';
import {DEFAULT_DRONE_CONFIG} from './DroneAppearanceConfig.js';
import {applyDroneConfig,configFromImportedAppearance} from './DroneRuntimeConfig.js';
import {getModelBounds} from './cameraTools.js';

const packageRoot='release/aerometric-0.1/models/aerometric-reference-drone-01';
const modelPath=`${packageRoot}/model.glb`;
const profilePath=`${packageRoot}/model.aerometric.json`;

class NodeFileReader {
  readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.();});}
  readAsDataURL(blob){blob.arrayBuffer().then(buffer=>{this.result=`data:${blob.type};base64,${Buffer.from(buffer).toString('base64')}`;this.onloadend?.();});}
}
globalThis.FileReader??=NodeFileReader;

async function load(input=modelPath){
  const buffer=input instanceof ArrayBuffer?input:(()=>{const bytes=fs.readFileSync(input);return bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength);})();
  return new GLTFLoader().parseAsync(buffer,'');
}
const near=(a,b,tolerance=1e-5)=>assert.ok(Math.abs(a-b)<tolerance,`${a} differs from ${b}`);

test('reference asset validates as Profile Level 1 and native-extras Level 2',async()=>{
  const withProfile=await validateModelPackage(modelPath,profilePath);
  const native=await validateModelPackage(modelPath);
  assert.equal(withProfile.pass,true,JSON.stringify(withProfile.errors));
  assert.equal(withProfile.level,'1');
  assert.equal(native.pass,true,JSON.stringify(native.errors));
  assert.equal(native.level,'2');
  assert.ok(native.metrics.triangles<10000);
  assert.ok(native.metrics.bytes<1024*1024);
  assert.ok(fs.statSync(`${packageRoot}/preview.webp`).size>1000);
});

test('reference scene exposes independent parts, motor-centred rotor pivots and six LEDs',async()=>{
  const gltf=await load(),root=gltf.scene.getObjectByName('DRONE_ROOT');
  const session=ModelSession.inspectGLTF(gltf,{fileName:'model.glb'});
  assert.equal(session.sourceType,'compatible-imported');
  const size=session.metrics.size;
  assert.ok(size.x>.45&&size.x<.9);
  assert.ok(size.y>.15&&size.y<.45);
  assert.ok(size.z>.35&&size.z<.9);
  const adapter=new DroneModelAdapter(root),controller=new DroneController(root);
  for(const part of ['body','topCover','arms','rotors','motors','landingGear','gimbal','camera'])assert.equal(adapter.hasPart(part),true,part);
  assert.equal(adapter.lights.meshes.length,6);
  for(const suffix of ['FL','FR','RL','RR']){
    const motor=root.getObjectByName(`MOTOR_${suffix}`),rotor=root.getObjectByName(`ROTOR_${suffix}`);
    assert.equal(rotor.parent,motor);
    const motorCenter=motor.getWorldPosition(new THREE.Vector3()),pivot=rotor.getWorldPosition(new THREE.Vector3());
    near(pivot.x,motorCenter.x);near(pivot.z,motorCenter.z);
    assert.ok(pivot.y>motorCenter.y);
    assert.equal(rotor.userData.spin_direction,['FL','RR'].includes(suffix)?1:-1);
    assert.equal(root.getObjectByName(`StatusLight_${suffix}`).parent,motor);
  }
  const topColor=adapter.getPartColor('topCover'),armColor=adapter.getPartColor('arms');
  adapter.setPartColor('body','#3377bb');
  assert.equal(adapter.getPartColor('body'),'#3377bb');
  assert.equal(adapter.getPartColor('topCover'),topColor);
  assert.equal(adapter.getPartColor('arms'),armColor);
  adapter.setPartVisible('camera',false);
  assert.equal(adapter.isPartVisible('camera'),false);
  assert.equal(adapter.isPartVisible('gimbal'),true);
  adapter.setPartVisible('camera',true);
  adapter.lights.setState('mission');
  assert.ok(adapter.lights.meshes.every(mesh=>mesh.material.emissiveIntensity>0));
  const rotorRest=controller.rotors.map(rotor=>rotor.quaternion.clone());
  controller.running=true;controller.update(.02);
  controller.rotors.forEach((rotor,index)=>assert.ok(rotor.quaternion.angleTo(rotorRest[index])>.05));
  const bodyRotation=root.quaternion.clone();
  controller.setGimbal(15,20);
  assert.equal(root.quaternion.equals(bodyRotation),true);
  assert.equal(controller.pitch.parent,controller.yaw);
  const scene=new DroneSceneController(root),field=new DroneStatusField(scene.effectRoot,scene.effectDiameter,DEFAULT_DRONE_CONFIG.status.statusField);
  assert.equal(field.mesh.parent,scene.effectRoot);
  assert.equal(field.mesh.visible,true);
  field.dispose();adapter.dispose();session.dispose();
});

test('reference current-state GLB re-import preserves edited color, hidden parts and portable animation',async()=>{
  const gltf=await load(),root=gltf.scene.getObjectByName('DRONE_ROOT'),adapter=new DroneModelAdapter(root);
  adapter.setPartColor('body','#285ec4');
  adapter.setPartColor('arms','#a75432');
  adapter.setPartVisible('camera',false);
  adapter.setPartVisible('landingGear',false);
  adapter.lights.set({color:'#e14b61',intensity:2.2});
  const exported=await exportCurrentDroneGLB(root,{status:DEFAULT_DRONE_CONFIG.status});
  const parsed=await load(exported),again=parsed.scene;
  assert.equal(ModelSession.inspectGLTF(parsed,{fileName:'Roundtrip.glb'}).sourceType,'compatible-imported');
  const originalBounds=getModelBounds(createCurrentExportRoot(root)).getSize(new THREE.Vector3());
  const importedBounds=getModelBounds(again).getSize(new THREE.Vector3());
  near(importedBounds.x,originalBounds.x);near(importedBounds.y,originalBounds.y);near(importedBounds.z,originalBounds.z);
  assert.equal(again.getObjectByName('Body_Main').material.color.getHexString(),'285ec4');
  assert.equal(again.getObjectByName('Arm_Tube_FL').material.color.getHexString(),'a75432');
  assert.equal(again.getObjectByName('Camera_Main'),undefined);
  assert.equal(again.getObjectByName('LANDING_GEAR'),undefined);
  assert.equal(again.getObjectByName('StatusLight_FL').material.emissive.getHexString(),'e14b61');
  assert.ok(again.getObjectByName('Gimbal_Yaw'));
  assert.ok(again.getObjectByName('Gimbal_Pitch'));
  const importedController=new DroneController(again),importedAdapter=new DroneModelAdapter(again);
  const importedConfig=configFromImportedAppearance(importedAdapter);
  applyDroneConfig({controller:importedController,adapter:importedAdapter},importedConfig);
  assert.equal(importedAdapter.getPartColor('body'),'#285ec4');
  assert.equal(importedAdapter.getPartColor('arms'),'#a75432');
  assert.equal(importedAdapter.hasPart('camera'),false);
  importedAdapter.dispose();
  assert.equal(parsed.animations.length,1);
  for(const suffix of ['FL','FR','RL','RR'])assert.ok(parsed.animations[0].tracks.some(track=>track.name.includes(`ROTOR_${suffix}`)));
  for(const name of ['EnvironmentRoot','LightingRoot','Rain','DroneStatusField'])assert.equal(again.getObjectByName(name),undefined);
  adapter.dispose();
});
