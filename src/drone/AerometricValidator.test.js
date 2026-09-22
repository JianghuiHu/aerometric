import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {validateModelPackage,validateProfile} from '../../release/aerometric-0.1/validator/src/index.mjs';

test('AEROMETRIC CLI validator accepts the current GLB and Level 1 profile',async()=>{const report=await validateModelPackage('public/models/quadrotor-v3/model.glb','release/aerometric-0.1/schema/examples/quadrotor-v3.aerometric.json');assert.equal(report.pass,true,JSON.stringify(report.errors));assert.equal(report.level,'1');assert.ok(report.metrics.meshes>0);assert.ok(report.metrics.triangles>0);});

test('AEROMETRIC Profile validation rejects dishonest control capabilities',()=>{const report=validateProfile({id:'broken.profile',version:'0.1.0',roles:{body:['Body_Main']},capabilities:{rotorControl:true,gimbalControl:true,statusLights:true}});assert.equal(report.valid,false);assert.deepEqual(report.errors.map(error=>error.code),['CAPABILITY_ROTORS','CAPABILITY_GIMBAL','CAPABILITY_LIGHTS']);});

test('CLI community package rejects missing license and redistribution metadata',async()=>{const root=fs.mkdtempSync(path.join(os.tmpdir(),'aerometric-cli-license-')),folder=path.join(root,'demo');try{fs.mkdirSync(folder);fs.copyFileSync('release/aerometric-0.1/artifacts/mapping-smoke/generic-drone.glb',path.join(folder,'model.glb'));fs.writeFileSync(path.join(folder,'preview.webp'),'preview');fs.writeFileSync(path.join(folder,'LICENSE'),'CC BY 4.0');fs.writeFileSync(path.join(root,'index.json'),JSON.stringify({version:'0.1.0',models:[{id:'demo',license:'CC BY 4.0',redistributable:true}]}));assert.equal((await validateModelPackage(folder)).pass,true);fs.rmSync(path.join(folder,'LICENSE'));assert.ok((await validateModelPackage(folder)).errors.some(error=>error.code==='PACKAGE_LICENSE'));fs.writeFileSync(path.join(folder,'LICENSE'),'CC BY 4.0');fs.writeFileSync(path.join(root,'index.json'),JSON.stringify({version:'0.1.0',models:[{id:'demo',license:'TBD',redistributable:false}]}));assert.ok((await validateModelPackage(folder)).errors.some(error=>error.code==='PACKAGE_RIGHTS'));}finally{fs.rmSync(root,{recursive:true,force:true});}});
