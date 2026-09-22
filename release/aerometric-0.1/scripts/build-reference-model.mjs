import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {validateModelPackage} from '../validator/src/index.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const folder=path.join(root,'models','aerometric-reference-drone-01');
const required=['LICENSE','README.md','model.aerometric.json','model.glb','preview.webp'];
const actual=fs.readdirSync(folder).sort();
if(JSON.stringify(actual)!==JSON.stringify(required.sort()))throw new Error('Reference model package contents changed');
const report=await validateModelPackage(folder);
if(!report.pass)throw new Error(`Reference model validation failed: ${JSON.stringify(report.errors)}`);

const artifacts=path.join(root,'artifacts');
fs.mkdirSync(artifacts,{recursive:true});
const archive=path.join(artifacts,'AEROMETRIC_Reference_Drone_01_0.1.zip');
fs.rmSync(archive,{force:true});
const result=process.platform==='win32'
  ?spawnSync('tar.exe',['-a','-c','-f',archive,'-C',path.dirname(folder),path.basename(folder)],{stdio:'inherit'})
  :spawnSync('zip',['-qr',archive,path.basename(folder)],{cwd:path.dirname(folder),stdio:'inherit'});
if(result.status!==0)throw new Error('Unable to create Reference Drone archive');
console.log(`Built ${path.relative(root,archive)} · ${fs.statSync(archive).size} bytes`);
