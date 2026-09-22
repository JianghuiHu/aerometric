import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';

const source=process.argv[2];
if(!source)throw new Error('Usage: node scripts/build-v3-official.mjs <authored-v3.glb>');
const original=fs.readFileSync(source),sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const sourceHash='587a8c4fdca194cb3f742d4db4ef037b10df311af1d992fc52d80651ee377939';
if(sha(original)!==sourceHash)throw new Error('The source GLB differs from the authorized Quadrotor V3 asset');
const profile=JSON.parse(fs.readFileSync('release/aerometric-0.1/schema/examples/quadrotor-v3.aerometric.json','utf8'));
profile.metadata={
  source:'AEROMETRIC authored Quadrotor V3',sourceSha256:sourceHash,profileStatus:'official',
  meshes:177,triangles:79708,rotorAxis:'+Y',rotorDirections:{FL:1,FR:-1,RL:-1,RR:1},
  gimbalLimits:{pitch:[-45,45],yaw:[-60,60]},
  editableMaterials:['MAT_Body_Main','MAT_Body_Accent','MAT_Arm_Carbon','MAT_Propeller','MAT_Motor_Metal','MAT_Gimbal'],
  visibilityGroups:['body','topCover','arms','rotors','motors','landingGear','gimbal','camera'],
};
const jsonLength=original.readUInt32LE(12),json=JSON.parse(original.subarray(20,20+jsonLength).toString('utf8'));
const binOffset=20+jsonLength,binLength=original.readUInt32LE(binOffset);
if(original.readUInt32LE(0)!==0x46546c67||original.readUInt32LE(4)!==2||original.readUInt32LE(16)!==0x4e4f534a||original.readUInt32LE(binOffset+4)!==0x004e4942||binOffset+8+binLength!==original.length)throw new Error('Expected a two-chunk glTF 2.0 GLB');
const nodes=new Map(json.nodes.map(node=>[node.name,node]));
const positions={frontLeft:'front-left',frontRight:'front-right',rearLeft:'rear-left',rearRight:'rear-right',Left:'left',Right:'right'};
const directions={frontLeft:1,frontRight:-1,rearLeft:-1,rearRight:1};
function extrasFor(role){
  if(role.startsWith('rotor.')){const suffix=role.slice(6);return{role:'rotor',position:positions[suffix],axis:'+Y',direction:directions[suffix]};}
  if(role.startsWith('light.front'))return{role:'light.front',position:positions[role.slice(11)]};
  if(role.startsWith('light.motor')){const suffix=role.slice(11);return{role:'light.motor',position:positions[suffix[0].toLowerCase()+suffix.slice(1)]};}
  if(role==='gimbal.pitch'||role==='gimbal.yaw')return{role,axis:role.endsWith('pitch')?'+X':'+Y',limitsDegrees:profile.metadata.gimbalLimits[role.split('.')[1]]};
  return{role,editableColor:profile.metadata.visibilityGroups.includes(role)};
}
for(const [role,names] of Object.entries(profile.roles))for(const name of names){const node=nodes.get(name);if(!node)throw new Error(`Profile role ${role} references missing node ${name}`);node.extras={...node.extras,aerometric:{...node.extras?.aerometric,...extrasFor(role)}};}
const root=nodes.get(profile.roles.root[0]);root.extras.aerometric={...root.extras.aerometric,profile:profile.id,forwardAxis:profile.forwardAxis,capabilities:profile.capabilities};
for(const material of json.materials??[])if(profile.metadata.editableMaterials.includes(material.name))material.extras={...material.extras,aerometric:{editableColor:true}};
const text=Buffer.from(JSON.stringify(json),'utf8'),padding=(4-text.length%4)%4,jsonChunk=Buffer.concat([text,Buffer.alloc(padding,0x20)]);
const output=Buffer.alloc(12+8+jsonChunk.length+8+binLength);output.writeUInt32LE(0x46546c67,0);output.writeUInt32LE(2,4);output.writeUInt32LE(output.length,8);output.writeUInt32LE(jsonChunk.length,12);output.writeUInt32LE(0x4e4f534a,16);jsonChunk.copy(output,20);output.writeUInt32LE(binLength,20+jsonChunk.length);output.writeUInt32LE(0x004e4942,24+jsonChunk.length);original.copy(output,28+jsonChunk.length,binOffset+8);
if(sha(output.subarray(28+jsonChunk.length))!==sha(original.subarray(binOffset+8)))throw new Error('Geometry buffer changed');
const license=fs.readFileSync('release/aerometric-0.1/models/aerometric-reference-drone-01/LICENSE');
for(const folder of ['public/models/quadrotor-v3','release/aerometric-0.1/models/quadrotor-v3']){fs.mkdirSync(folder,{recursive:true});fs.writeFileSync(path.join(folder,'model.glb'),output);fs.writeFileSync(path.join(folder,'model.aerometric.json'),JSON.stringify(profile,null,2)+'\n');fs.writeFileSync(path.join(folder,'LICENSE'),license);}
console.log(JSON.stringify({sourceHash,modelBytes:output.length,binaryHash:sha(output.subarray(28+jsonChunk.length)),nodes:json.nodes.length,profile:profile.id}));
