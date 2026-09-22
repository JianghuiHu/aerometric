import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {validateModelPackage} from '../../release/aerometric-0.1/validator/src/index.mjs';

const folder='public/models/quadrotor-v3';
test('official Quadrotor V3 preserves authored geometry and supplies Level 2 semantics',async()=>{
  const bytes=fs.readFileSync(`${folder}/model.glb`),jsonLength=bytes.readUInt32LE(12),binOffset=20+jsonLength,binLength=bytes.readUInt32LE(binOffset),binHash=crypto.createHash('sha256').update(bytes.subarray(binOffset+8,binOffset+8+binLength)).digest('hex');
  assert.equal(binHash,'f4c8536b5445b82fe2f907faaab0089da198213a46e9a5cf74917a5be9b1c496');
  const report=await validateModelPackage(`${folder}/model.glb`,`${folder}/model.aerometric.json`);
  const native=await validateModelPackage(`${folder}/model.glb`);
  assert.equal(report.pass,true,JSON.stringify(report.errors));assert.equal(report.level,'1');
  assert.equal(native.pass,true,JSON.stringify(native.errors));assert.equal(native.level,'2');
  assert.equal(report.metrics.triangles,79708);
  const profile=JSON.parse(fs.readFileSync(`${folder}/model.aerometric.json`));
  assert.equal(profile.metadata.gimbalLimits.pitch[1],45);
  assert.equal(Object.keys(profile.roles).filter(role=>role.startsWith('light.')).length,6);
  assert.equal(fs.readFileSync(`${folder}/LICENSE`).equals(fs.readFileSync('public/models/aerometric-reference-drone-01/LICENSE')),true);
  const library=JSON.parse(fs.readFileSync('public/models/index.json'));
  assert.equal(library.models.find(item=>item.id==='quadrotor-v3')?.official,true);
  assert.equal(library.models.find(item=>item.id==='quadrotor-v3')?.license,'CC0-1.0');
  assert.equal(library.models.find(item=>item.id==='aerometric-reference-drone-01')?.official,true);
  const studio=fs.readFileSync('src/viewer.js','utf8');
  assert.match(studio,/const BUILT_IN_MODEL=`\$\{import\.meta\.env\.BASE_URL\}models\/quadrotor-v3\/model\.glb`/);
  assert.match(studio,/models\/quadrotor-v3\/model\.aerometric\.json/);
});
