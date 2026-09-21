import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Box3,Vector3} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DroneController} from './DroneController.js';
const bytes=fs.readFileSync('public/models/drone_v3.glb');
const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
const c=new DroneController(gltf.scene);
const manifest=JSON.parse(fs.readFileSync('blender_drone/v3/platform/export_manifest.json'));
const close=(a,b,tol=1e-6)=>assert.ok(Math.abs(a-b)<tol,`${a} != ${b}`);
const world=o=>{gltf.scene.updateMatrixWorld(true);return o.getWorldPosition(new Vector3());};
test('export preserves evaluated size in meters and excludes studio',()=>{
  new Box3().setFromObject(gltf.scene,true).getSize(new Vector3()).toArray().forEach((v,i)=>close(v,manifest.gltf_expected_xyz_m[i]));
  gltf.scene.traverse(o=>{assert.ok(!o.name.startsWith('STUDIO'));assert.ok(!o.isCamera&&!o.isLight);o.scale.toArray().forEach(v=>close(v,1));});
  assert.equal(c.root.userData.forward,'+Z');assert.equal(c.root.userData.up,'+Y');
});
test('all motor centers and rotor local axes survive export',()=>{
  for(const r of c.rotors){const suffix=r.name.slice(-2),m=c.require('Motor_Bell_'+suffix);close(world(r).x,world(m).x);close(world(r).z,world(m).z);assert.equal(r.userData.spin_axis,'local Y');}
  close(world(c.require('Motor_Bell_FR')).x-world(c.require('Motor_Bell_FL')).x,.428);
  assert.ok(world(c.require('Camera_Main')).z>0);
});
test('rotors move independently while pivot stays fixed',()=>{
  c.reset();const origins=c.rotors.map(world),rest=c.rotors.map(r=>r.quaternion.clone());c.running=true;c.update(.03);
  c.rotors.forEach((r,i)=>{assert.ok(r.quaternion.angleTo(rest[i])>.1);close(world(r).distanceTo(origins[i]),0);});
  assert.ok(c.angles[0]*c.angles[1]<0);const paused=c.rotors[0].quaternion.clone();c.running=false;c.update(.04);close(c.rotors[0].quaternion.angleTo(paused),0);c.reset();
});
test('nested yaw and pitch rotate lens but not body',()=>{
  const cam=c.require('Camera_Main'),body=c.require('Body_Main');const bodyRest=body.matrixWorld.clone(),lens=c.require('Lens_InnerAperture');const rest=world(lens);
  c.setGimbal(25,35);assert.ok(world(lens).distanceTo(rest)>.005);assert.deepEqual(body.matrixWorld.elements,bodyRest.elements);assert.equal(cam.parent,c.pitch);assert.equal(c.pitch.parent,c.yaw);c.reset();
});
test('root pose retains mass-center pivot and propagates to all rotors',()=>{
  const origin=world(c.root);const before=c.rotors.map(world);c.setPose({pitch:15,yaw:32,roll:12});close(world(c.root).distanceTo(origin),0);c.rotors.forEach((r,i)=>assert.ok(world(r).distanceTo(before[i])>.005));c.reset();
});
test('color changes remain isolated and reset exactly',()=>{
  const main=c.materials.get('MAT_Body_Main').color.clone();c.setColor('MAT_Body_Accent','#ff8800');assert.ok(c.materials.get('MAT_Body_Main').color.equals(main));c.setColor('MAT_StatusLight','#ff0000');assert.equal(c.materials.get('MAT_StatusLight').color.getHexString(),'ff0000');c.reset();for(const [n,d] of c.colors)assert.ok(c.materials.get(n).color.equals(d.color));
});
test('default pose and all transforms are restored after a combined interaction',()=>{
  c.running=true;c.update(.04);c.setGimbal(-30,-45);c.setPose({yaw:70,roll:20,pitch:10});c.reset();
  for(const [o,d] of c.defaults){close(o.quaternion.angleTo(d.quaternion),0);close(o.position.distanceTo(d.position),0);}assert.equal(c.running,false);
});
test('invalid pose fails without corrupting transforms',()=>{assert.throws(()=>c.setPose({pitch:NaN}),TypeError);close(c.root.quaternion.angleTo(c.defaults.get(c.root).quaternion),0);});

