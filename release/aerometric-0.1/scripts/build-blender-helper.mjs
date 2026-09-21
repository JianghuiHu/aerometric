import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const addon=path.join(root,'blender','addon','aerometric_helper');
const artifacts=path.join(root,'artifacts');
fs.rmSync(path.join(addon,'__pycache__'),{recursive:true,force:true});
fs.mkdirSync(artifacts,{recursive:true});
const archive=path.join(artifacts,'AEROMETRIC_Blender_Helper_0.1.zip');
fs.rmSync(archive,{force:true});
const result=process.platform==='win32'
  ?spawnSync('tar.exe',['-a','-c','-f',archive,'-C',path.dirname(addon),path.basename(addon)],{stdio:'inherit'})
  :spawnSync('zip',['-qr',archive,path.basename(addon)],{cwd:path.dirname(addon),stdio:'inherit'});
if(result.status!==0)throw new Error('Unable to create Blender Helper archive');
console.log(`Built ${path.relative(root,archive)} · ${(fs.statSync(archive).size/1024).toFixed(1)} KB`);
