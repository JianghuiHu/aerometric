import fs from 'node:fs';import path from 'node:path';import {fileURLToPath,pathToFileURL} from 'node:url';
import {validateModelPackage} from '../validator/src/index.mjs';

const VERSION='0.1.0',AMBIGUOUS=/^(?:tbd|unknown|none|unlicensed|proprietary)$/i;
const local=value=>typeof value==='string'&&!path.isAbsolute(value)&&!value.split(/[\\/]/).includes('..');

export function validateModelLibrary(models,index=JSON.parse(fs.readFileSync(path.join(models,'index.json'),'utf8'))){
  const errors=[],ids=new Set();
  if(!index||typeof index!=='object'||Array.isArray(index))return['models/index.json must be an object'];
  if(index.version!==VERSION)errors.push(`models/index.json version must be ${VERSION}`);
  if(!Array.isArray(index.models))return[...errors,'models/index.json models must be an array'];
  index.models.forEach((entry,indexPosition)=>{
    const at=`Entry ${indexPosition+1}`;
    if(!entry||typeof entry!=='object'||Array.isArray(entry)){errors.push(`${at} must be an object`);return;}
    if(typeof entry.id!=='string'||!/^[a-z0-9][a-z0-9._-]+$/.test(entry.id))errors.push(`${at} has an invalid id`);else if(ids.has(entry.id))errors.push(`${at} duplicates ${entry.id}`);else ids.add(entry.id);
    for(const key of ['name','author','type'])if(typeof entry[key]!=='string'||!entry[key].trim())errors.push(`${at} requires ${key}`);
    if(typeof entry.license!=='string'||!entry.license.trim()||AMBIGUOUS.test(entry.license.trim()))errors.push(`${at} requires an explicit asset license`);
    if(entry.redistributable!==true)errors.push(`${at} must explicitly set redistributable to true`);
    if(entry.official!==undefined&&typeof entry.official!=='boolean')errors.push(`${at} official must be boolean`);
    if(![0,1,2].includes(entry.compatibility))errors.push(`${at} has invalid compatibility`);
    for(const [key,extension] of [['model','.glb'],['preview','.webp']]){const value=entry[key];if(!local(value)||!value.toLowerCase().endsWith(extension))errors.push(`${at} has invalid ${key}`);else if(!fs.existsSync(path.join(models,value)))errors.push(`${at} ${key} does not exist: ${value}`);}
    if(entry.profile!==undefined){if(!local(entry.profile)||!entry.profile.toLowerCase().endsWith('.json'))errors.push(`${at} has invalid profile`);else if(!fs.existsSync(path.join(models,entry.profile)))errors.push(`${at} profile does not exist: ${entry.profile}`);}
    if(entry.compatibility===1&&!entry.profile)errors.push(`${at} Level 1 requires profile`);
    if(local(entry.model)){const licensePath=path.join(models,path.dirname(entry.model),'LICENSE');if(!fs.existsSync(licensePath)||!fs.readFileSync(licensePath,'utf8').trim())errors.push(`${at} model package requires a non-empty LICENSE file`);}
  });
  return errors;
}

const direct=process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href;
if(direct){const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),models=path.join(root,'models'),index=JSON.parse(fs.readFileSync(path.join(models,'index.json'),'utf8')),errors=validateModelLibrary(models,index);if(!errors.length)for(const entry of index.models){const model=path.join(models,entry.model),report=await validateModelPackage(model,entry.profile?path.join(models,entry.profile):undefined);if(!report.pass)errors.push(`${entry.id}: ${report.errors.map(issue=>issue.message).join('; ')}`);else if(Number(report.level)<Math.min(entry.compatibility,1))errors.push(`${entry.id}: Profile level below declared compatibility`);if(entry.compatibility===2){const native=await validateModelPackage(model);if(!native.pass||native.level!=='2')errors.push(`${entry.id}: declared Level 2 requires native glTF extras`);}}if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}else console.log(`AEROMETRIC model library ${index.version} valid: ${index.models.length} entries`);}
