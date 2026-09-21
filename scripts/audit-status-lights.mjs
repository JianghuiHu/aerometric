import fs from 'node:fs';
import {Vector3} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
const path = process.argv[2] || 'public/models/drone_v3.glb';
const bytes = fs.readFileSync(path);
const {scene} = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
scene.updateMatrixWorld(true);
const lights=[];
scene.traverse(o=>{
  if (!o.isMesh || !/Light|Lamp|Battery_Status|Battery_Rear_Indicator|LED_/.test(o.name)) return;
  const mats=Array.isArray(o.material)?o.material:[o.material];
  lights.push({objectName:o.name,meshName:o.geometry.name,materials:mats.map(m=>({name:m.name,color:m.color.getHexString(),emissive:m.emissive?.getHexString(),intensity:m.emissiveIntensity})),parent:o.parent.name,worldPosition:o.getWorldPosition(new Vector3()).toArray(),scale:o.scale.toArray(),fromGLB:true,uv:!!o.geometry.attributes.uv});
});
fs.writeFileSync(process.argv[3]||'blender_drone/v3/platform/lights-review/after.json',JSON.stringify(lights,null,2));
console.log(lights.map(o=>`${o.objectName} | ${o.meshName} | ${o.materials.map(m=>m.name)} | ${o.parent} | ${o.worldPosition.map(n=>n.toFixed(5))} | ${o.scale} | GLB`).join('\n'));
