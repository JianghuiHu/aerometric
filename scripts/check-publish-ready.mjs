import fs from 'node:fs';

const asset='public/models/drone_v3.glb',license='public/models/LICENSE',metadata='public/models/asset-rights.json',errors=[],ambiguous=/^(?:tbd|unknown|none|unlicensed|proprietary)$/i;
if(!fs.existsSync(asset))errors.push(`${asset} is missing`);
if(!fs.existsSync(license)||!fs.readFileSync(license,'utf8').trim()||ambiguous.test(fs.readFileSync(license,'utf8').trim()))errors.push(`${license} must grant explicit redistribution rights`);
let rights;try{rights=JSON.parse(fs.readFileSync(metadata,'utf8'));}catch{errors.push(`${metadata} is missing or invalid`);}
if(rights){if(rights.redistributable!==true)errors.push('Asset rights must explicitly set redistributable to true');for(const key of ['author','source','license'])if(typeof rights[key]!=='string'||!rights[key].trim()||ambiguous.test(rights[key].trim()))errors.push(`Asset rights require explicit ${key}`);}
if(errors.length){console.error(`AEROMETRIC public deployment BLOCKED:\n${errors.map(value=>`- ${value}`).join('\n')}`);process.exitCode=1;}else console.log('AEROMETRIC public asset gate passed; confirm owner, repository, CI, and hosting separately.');
