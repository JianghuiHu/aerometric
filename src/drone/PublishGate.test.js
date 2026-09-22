import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

test('public deployment gate requires both CC0 official models and excludes unindexed GLBs',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'aerometric-publish-')),models=path.join(root,'public','models');
  const repository=fileURLToPath(new URL('../../',import.meta.url));
  const source=JSON.parse(fs.readFileSync(path.join(repository,'public/models/index.json')));
  const run=()=>spawnSync(process.execPath,[path.join(repository,'scripts/check-publish-ready.mjs')],{cwd:root,encoding:'utf8'});
  const index=entries=>fs.writeFileSync(path.join(models,'index.json'),JSON.stringify({version:'0.1.0',models:entries}));
  try{
    fs.mkdirSync(models,{recursive:true});
    for(const entry of source.models){const from=path.join(repository,'public/models',path.dirname(entry.model)),to=path.join(models,path.dirname(entry.model));fs.mkdirSync(to,{recursive:true});for(const name of ['model.glb','model.aerometric.json','preview.webp','LICENSE'])fs.copyFileSync(path.join(from,name),path.join(to,name));}
    index([]);assert.equal(run().status,1);
    index([source.models[0]]);assert.equal(run().status,1);
    index(source.models);assert.equal(run().status,0);
    const v3License=path.join(models,'quadrotor-v3','LICENSE');fs.writeFileSync(v3License,'CC0-like text');assert.equal(run().status,1);
    fs.copyFileSync(path.join(repository,'public/models/quadrotor-v3/LICENSE'),v3License);
    index(source.models.map(item=>item.id==='quadrotor-v3'?{...item,redistributable:false}:item));assert.equal(run().status,1);
    index(source.models);fs.writeFileSync(path.join(models,'drone_v3.glb'),'duplicate');assert.equal(run().status,1);fs.unlinkSync(path.join(models,'drone_v3.glb'));
    fs.writeFileSync(path.join(models,'unknown.glb'),'fixture');assert.equal(run().status,1);
  }finally{fs.rmSync(root,{recursive:true,force:true});}
});
