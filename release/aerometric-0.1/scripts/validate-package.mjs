import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const readJson=file=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
const fail=message=>{throw new Error(message);};
const profile=readJson('schema/examples/quadrotor-v3.aerometric.json');
readJson('schema/aerometric-profile.schema.json');

if(!/^[a-z0-9][a-z0-9._-]+$/.test(profile.id))fail('Invalid profile id');
if(!/^0\.1(?:\.[0-9]+)?$/.test(profile.version))fail('Invalid 0.1 profile version');
if(profile.units!=='meter')fail('Profile units must be meter');
if(!['+X','-X','+Z','-Z'].includes(profile.forwardAxis))fail('Invalid forward axis');
if(!profile.roles||Object.keys(profile.roles).length===0)fail('Profile roles are required');
for(const [role,names] of Object.entries(profile.roles))if(!Array.isArray(names)||names.length===0||new Set(names).size!==names.length||names.some(name=>typeof name!=='string'||!name))fail(`Invalid role mapping: ${role}`);
for(const [name,value] of Object.entries(profile.capabilities??{}))if(typeof value!=='boolean')fail(`Capability must be boolean: ${name}`);

const required=['README.md','README.zh-CN.md','LICENSE','MODEL_ASSET_LICENSE.md','CONTRIBUTING.md','CODE_OF_CONDUCT.md','CHANGELOG.md','RELEASE_CHECKLIST.md','docs/model-standard.md','skills/AI_START_HERE.md','skills/aerometric-model/SKILL.md','skills/aerometric-model/references/profile-contract.md','skills/aerometric-model/references/acceptance-checklist.md','validator/package.json','validator/package-lock.json','validator/src/cli.mjs','validator/src/index.mjs','validator/src/rules.mjs','web-validator/index.html','web-validator/src/main.js','web-validator/src/style.css','web-validator/README.md','artifacts/web-validator/index.html','kits/AEROMETRIC_AI_Model_Kit/AI_START_HERE.md','kits/AEROMETRIC_AI_Model_Kit/AEROMETRIC_MODEL_SKILL.md','kits/AEROMETRIC_AI_Model_Kit/MODEL_REQUIREMENTS.md','kits/AEROMETRIC_AI_Model_Kit/MODEL_STRUCTURE.md','kits/AEROMETRIC_AI_Model_Kit/MATERIAL_GUIDE.md','kits/AEROMETRIC_AI_Model_Kit/GLB_EXPORT_GUIDE.md','kits/AEROMETRIC_AI_Model_Kit/ACCEPTANCE_CHECKLIST.md','kits/AEROMETRIC_AI_Model_Kit/schema/aerometric-profile.schema.json','kits/AEROMETRIC_AI_Model_Kit/examples/quadrotor/model.aerometric.json','artifacts/AEROMETRIC_AI_Model_Kit_0.1.zip','blender/README.md','blender/addon/aerometric_helper/__init__.py','blender/addon/aerometric_helper/README.md','artifacts/AEROMETRIC_Blender_Helper_0.1.zip','.github/workflows/validate-model.yml','models/index.json','models/_template/README.md'];
required.push('docs/model-mapping.md','docs/model-library.md','models/_template/CONTRIBUTION_CHECKLIST.md','.github/PULL_REQUEST_TEMPLATE/model.md','schema/model-library.schema.json','scripts/validate-model-library.mjs','RELEASE_AUDIT_0.1.md');
for(const file of required)if(!fs.existsSync(path.join(root,file)))fail(`Missing package file: ${file}`);
const skill=fs.readFileSync(path.join(root,'skills/aerometric-model/SKILL.md'),'utf8');
if(!/^---\r?\nname: aerometric-model\r?\ndescription: .+\r?\n---/s.test(skill))fail('Invalid skill frontmatter');
execFileSync(process.execPath,[path.join(root,'scripts/validate-model-library.mjs')],{stdio:'inherit'});
const library=readJson('models/index.json');
if(JSON.stringify(library)!==JSON.stringify(JSON.parse(fs.readFileSync(path.join(root,'../../public/models/index.json'),'utf8'))))fail('Release and Studio model library indexes differ');
for(const entry of library.models){
  for(const file of [entry.model,entry.profile,entry.preview,path.join(path.dirname(entry.model),'README.md'),path.join(path.dirname(entry.model),'LICENSE')].filter(Boolean)){
    const releaseFile=path.join(root,'models',file),studioFile=path.join(root,'../../public/models',file);
    if(!fs.existsSync(studioFile)||!fs.readFileSync(releaseFile).equals(fs.readFileSync(studioFile)))fail(`Release and Studio model files differ: ${file}`);
  }
}
if(fs.existsSync(path.join(root,'artifacts/blender-helper-smoke/quadrotor-v3-helper.glb')))fail('Unlicensed Quadrotor V3 GLB must not be included in release artifacts');
const allowedSmoke=new Set(['artifacts/mapping-smoke/generic-drone.glb','artifacts/mapping-smoke/mapped-drone.glb',...library.models.map(entry=>`models/${entry.model.replaceAll('\\','/')}`)]);
function scanGLB(directory){for(const entry of fs.readdirSync(directory,{withFileTypes:true})){const absolute=path.join(directory,entry.name);if(entry.isDirectory())scanGLB(absolute);else if(entry.name.toLowerCase().endsWith('.glb')){const relative=path.relative(root,absolute).replaceAll('\\','/');if(!allowedSmoke.has(relative))fail(`Unexpected model binary in release package: ${relative}`);}}}
scanGLB(root);
console.log(`AEROMETRIC 0.1 package valid: ${Object.keys(profile.roles).length} roles, ${required.length} required files`);
