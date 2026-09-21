import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),kit=path.join(root,'kits','AEROMETRIC_AI_Model_Kit'),artifacts=path.join(root,'artifacts');
fs.mkdirSync(path.join(kit,'schema'),{recursive:true});fs.mkdirSync(path.join(kit,'examples','quadrotor'),{recursive:true});fs.mkdirSync(artifacts,{recursive:true});
fs.copyFileSync(path.join(root,'schema','aerometric-profile.schema.json'),path.join(kit,'schema','aerometric-profile.schema.json'));
fs.copyFileSync(path.join(root,'schema','examples','quadrotor-v3.aerometric.json'),path.join(kit,'examples','quadrotor','model.aerometric.json'));
const archive=path.join(artifacts,'AEROMETRIC_AI_Model_Kit_0.1.zip');fs.rmSync(archive,{force:true});
const result=process.platform==='win32'
  ?spawnSync('tar.exe',['-a','-c','-f',archive,'-C',path.dirname(kit),path.basename(kit)],{stdio:'inherit'})
  :spawnSync('zip',['-qr',archive,path.basename(kit)],{cwd:path.dirname(kit),stdio:'inherit'});
if(result.status!==0)throw new Error('Unable to create AI Model Kit archive');
console.log(`Built ${path.relative(root,archive)} · ${(fs.statSync(archive).size/1024).toFixed(1)} KB`);
