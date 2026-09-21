import fs from 'node:fs';
import path from 'node:path';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {assessScene,issue,validateProfile} from './rules.mjs';
export {validateProfile} from './rules.mjs';

async function loadGLB(file){const bytes=fs.readFileSync(file),buffer=bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength);return new GLTFLoader().parseAsync(buffer,'');}
function resolveInput(input,profileInput){
  const target=path.resolve(input);if(!fs.existsSync(target))throw new Error(`Input does not exist: ${input}`);
  if(fs.statSync(target).isDirectory())return{directory:target,glb:path.join(target,'model.glb'),profile:profileInput?path.resolve(profileInput):path.join(target,'model.aerometric.json')};
  return{directory:null,glb:target,profile:profileInput?path.resolve(profileInput):null};
}

export async function validateModelPackage(input,profileInput){
  const errors=[],warnings=[];let resolved;
  try{resolved=resolveInput(input,profileInput);}catch(error){return{pass:false,level:null,errors:[issue('INPUT',error.message)],warnings};}
  if(!fs.existsSync(resolved.glb))return{pass:false,level:null,errors:[issue('GLB_MISSING',`GLB not found: ${resolved.glb}`)],warnings};
  let gltf;try{gltf=await loadGLB(resolved.glb);}catch(error){return{pass:false,level:null,errors:[issue('GLB_PARSE',`GLB parse failed: ${error.message}`)],warnings};}
  const bytes=fs.statSync(resolved.glb).size;
  let profile=null;
  if(resolved.profile&&fs.existsSync(resolved.profile)){
    try{profile=JSON.parse(fs.readFileSync(resolved.profile,'utf8'));}catch(error){errors.push(issue('PROFILE_PARSE',`Profile parse failed: ${error.message}`));}
  }else if(resolved.directory)warnings.push(issue('PROFILE_MISSING','model.aerometric.json is missing; validating as Generic GLB'));
  const assessed=assessScene(gltf.scene,bytes,{profile,animations:gltf.animations?.length??0});errors.push(...assessed.errors);warnings.push(...assessed.warnings);const level=assessed.level;
  if(resolved.directory){
    const licensePath=path.join(resolved.directory,'LICENSE'),indexPath=path.join(path.dirname(resolved.directory),'index.json');
    if(!fs.existsSync(path.join(resolved.directory,'preview.webp')))errors.push(issue('PACKAGE_PREVIEW','Community model package requires preview.webp'));
    if(!fs.existsSync(licensePath)||!fs.readFileSync(licensePath,'utf8').trim())errors.push(issue('PACKAGE_LICENSE','Community model package requires a non-empty LICENSE'));
    if(!fs.existsSync(indexPath))errors.push(issue('PACKAGE_INDEX','Community model directory requires a sibling index.json; validate a standalone GLB file directly'));
    else try{const registry=JSON.parse(fs.readFileSync(indexPath,'utf8')),entry=registry.models?.find(model=>model.id===path.basename(resolved.directory));if(!entry||entry.redistributable!==true||typeof entry.license!=='string'||!entry.license.trim()||/^(?:tbd|unknown|none|unlicensed|proprietary)$/i.test(entry.license.trim()))errors.push(issue('PACKAGE_RIGHTS','Community model requires explicit license and redistributable: true in index.json'));}catch(error){errors.push(issue('PACKAGE_INDEX',`Could not read model library index: ${error.message}`));}
  }
  return{pass:errors.length===0,level,compatibility:`AEROMETRIC Level ${level}`,files:{glb:resolved.glb,profile:profile?resolved.profile:null},metrics:assessed.metrics,errors,warnings};
}

export function formatReport(report){const mark=value=>value?'✓':'✗',lines=['AEROMETRIC Validator','',`${mark(report.pass)} ${report.compatibility??'Unable to determine compatibility'}`];if(report.metrics)lines.push(`✓ GLB valid · ${report.metrics.meshes} meshes · ${report.metrics.triangles.toLocaleString()} triangles · ${(report.metrics.bytes/1024/1024).toFixed(2)} MB`);if(report.files?.profile)lines.push(`${mark(!report.errors.some(error=>error.code.startsWith('PROFILE')))} Profile loaded`);if(report.errors.length){lines.push('','Errors:');for(const error of report.errors)lines.push(`✗ [${error.code}] ${error.message}`);}if(report.warnings.length){lines.push('','Warnings:');for(const warning of report.warnings)lines.push(`⚠ [${warning.code}] ${warning.message}`);}lines.push('',report.pass?'PASS':'FAIL');return lines.join('\n');}
