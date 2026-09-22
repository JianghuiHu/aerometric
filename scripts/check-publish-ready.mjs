import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {validateModelLibrary} from '../release/aerometric-0.1/scripts/validate-model-library.mjs';
import {validateModelPackage} from '../release/aerometric-0.1/validator/src/index.mjs';

const models=path.resolve('public/models'),indexPath=path.join(models,'index.json');
const officialIds=['quadrotor-v3','aerometric-reference-drone-01'],errors=[];
// SHA-256 of https://creativecommons.org/publicdomain/zero/1.0/legalcode.txt
const cc0LegalCodeSha256='a2010f343487d3f7618affe54f789f5487602331c0a8d03f49e9a7c547cf0499';
let index;
try{index=JSON.parse(fs.readFileSync(indexPath,'utf8'));}catch{errors.push('public/models/index.json is missing or invalid');}
if(index){
  errors.push(...validateModelLibrary(models,index));
  const entries=Array.isArray(index.models)?index.models:[];
  for(const officialId of officialIds){
    const official=entries.find(entry=>entry?.id===officialId);
    if(!official){errors.push(`The ${officialId} package must be in the public index`);continue;}
    if(official.license!=='CC0-1.0'||official.redistributable!==true||official.official!==true){errors.push(`${officialId} requires official redistributable CC0-1.0 metadata`);continue;}
    const licensePath=path.join(models,path.dirname(official.model),'LICENSE');
    const actual=fs.existsSync(licensePath)?createHash('sha256').update(fs.readFileSync(licensePath)).digest('hex'):null;
    if(actual!==cc0LegalCodeSha256)errors.push(`${officialId} LICENSE must be the unmodified official CC0 1.0 legalcode.txt`);
    const model=path.join(models,official.model),report=await validateModelPackage(model,official.profile?path.join(models,official.profile):undefined);
    if(!report.pass||Number(report.level)<1)errors.push(`${officialId} must pass Level 1 validation: ${report.errors.map(issue=>issue.message).join('; ')}`);
    if(officialId==='quadrotor-v3'){const native=await validateModelPackage(model);if(!native.pass||native.level!=='2')errors.push(`${officialId} must pass native Level 2 validation`);}
  }
  const listed=new Set(entries.map(entry=>entry?.model?.replaceAll('\\','/')));
  function scan(directory){if(!fs.existsSync(directory))return;for(const entry of fs.readdirSync(directory,{withFileTypes:true})){const absolute=path.join(directory,entry.name);if(entry.isDirectory())scan(absolute);else if(entry.name.toLowerCase().endsWith('.glb')&&!listed.has(path.relative(models,absolute).replaceAll('\\','/')))errors.push(`Unindexed public GLB: ${absolute}`);}}
  scan(models);
}
if(fs.existsSync(path.join(models,'drone_v3.glb')))errors.push('Raw root-level Quadrotor V3 is unindexed; only the licensed official package may be published');
if(errors.length){console.error(`AEROMETRIC public deployment BLOCKED:\n${errors.map(value=>`- ${value}`).join('\n')}`);process.exitCode=1;}
else console.log(`AEROMETRIC public asset gate passed: ${index.models.length} indexed model(s), official V3 Level 2 and Reference Level 1 verified.`);
