import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Vector3} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DroneModelAdapter} from './DroneModelAdapter.js';
import {STATUS_PRESETS} from './DroneAppearanceConfig.js';
async function load(path){const b=fs.readFileSync(path);return (await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.length),'')).scene;}
const scene=await load('public/models/drone_v3.glb');
const adapter=new DroneModelAdapter(scene), lights=adapter.lights;
test('exported native materials contain real emission and dark recesses',async()=>{
  const raw=await load('public/models/drone_v3.glb');
  raw.traverse(o=>{
    if(o.userData.status_light){assert.ok(o.material.emissive.r+o.material.emissive.g+o.material.emissive.b>0);assert.ok(o.material.emissiveIntensity>0);}
    if(o.isMesh&&o.material.name==='MAT_LED_Recess') assert.ok(o.material.color.r<.03&&o.material.color.g<.03&&o.material.color.b<.03);
  });
});
test('six native LED zones have UV and correct motor parenting',()=>{
  assert.equal(lights.meshes.length,6);
  for(const mesh of lights.meshes){
    assert.ok(mesh.geometry.attributes.uv);
    assert.equal(mesh.material.userData.sourceMaterialName,'MAT_StatusLight');
    if(mesh.name.startsWith('StatusLight_')) assert.equal(mesh.parent.name,`MOTOR_${mesh.name.slice(-2)}`);
    else assert.equal(mesh.parent.name,'LIGHTS');
  }
  assert.equal(new Set(lights.meshes.map(m=>m.material.uuid)).size,6);
});
test('online, mission, caution, alert and custom update all six emitters',()=>{
  for(const [key,preset] of Object.entries(STATUS_PRESETS)){
    lights.setState(key);
    for(const mesh of lights.meshes) assert.equal(mesh.material.emissive.getHexString(),preset.color.slice(1));
  }
  lights.setState('custom','#db69ee');
  for(const mesh of lights.meshes) assert.equal(mesh.material.emissive.getHexString(),'db69ee');
});
test('0 through 4 preserve dark diffusers and 75 percent motor hierarchy',()=>{
  for(const intensity of [0,1,2,3,4]){
    lights.set({visible:true,intensity});
    for(const mesh of lights.meshes){
      assert.equal(mesh.visible,true);
      assert.equal(mesh.material.color.getHexString(),'26343c');
      const expected=.6*intensity*(mesh.userData.light_role==='front'?1:.75);
      assert.equal(mesh.material.emissiveIntensity,expected);
      assert.ok(mesh.material.emissiveIntensity<=2.4);
    }
  }
  lights.set({intensity:0}); assert.equal(lights.bloomStrength,0);
  lights.set({visible:false});
  for(const mesh of lights.meshes) assert.equal(mesh.visible,false);
  for(const suffix of ['FL','FR','RL','RR']) assert.equal(adapter.require(`LED_Recess_${suffix}`).visible,true);
});
test('motor appearance does not recolor or hide LED channels',()=>{
  lights.set({visible:true,intensity:2.2}); lights.setState('online');
  adapter.setPartColor('motors','#ff0000'); adapter.setPartVisible('motors',false);
  for(const mesh of lights.meshes){assert.equal(mesh.visible,true);assert.equal(mesh.material.emissive.getHexString(),'3ba9ff');}
  adapter.setPartVisible('motors',true);
});
test('retained GLB primary geometry and transforms match previous asset',async()=>{
  const old=await load('blender_drone/v3/platform/lights-review/before.glb');
  old.updateMatrixWorld(true); scene.updateMatrixWorld(true);
  let checked=0;
  old.traverse(o=>{
    if(!o.isMesh) return;
    let p=o; while(p){if(p.name==='LIGHTS')return;p=p.parent;}
    const current=scene.getObjectByName(o.name);assert.ok(current,o.name);
    assert.deepEqual(current.geometry.attributes.position.array,o.geometry.attributes.position.array,o.name);
    assert.deepEqual(current.matrixWorld.elements,o.matrixWorld.elements,o.name);
    assert.equal(current.parent.name,o.parent.name);checked++;
  });
  assert.ok(checked>150);
});
test('motor LED radial offset is under one millimeter and bands are mirrored',()=>{
  scene.updateMatrixWorld(true);
  for(const suffix of ['FL','FR','RL','RR']){
    const m=adapter.require(`StatusLight_${suffix}`), host=adapter.require(`Motor_Mount_${suffix}`);
    const center=host.getWorldPosition(new Vector3()), p=new Vector3();
    for(let i=0;i<m.geometry.attributes.position.count;i++){
      p.fromBufferAttribute(m.geometry.attributes.position,i).applyMatrix4(m.matrixWorld);
      const radius=Math.hypot(p.x-center.x,p.z-center.z);
      assert.ok(radius>=.02329&&radius<=.02366,`${suffix}: ${radius}`);
    }
  }
});

