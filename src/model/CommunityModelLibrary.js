const ID=/^[a-z0-9][a-z0-9._-]+$/;
const LOCAL_PATH=/^(?![a-z]+:|\/|\\)(?!.*(?:^|[\\/])\.\.(?:[\\/]|$)).+$/i;
const AMBIGUOUS_LICENSE=/^(?:tbd|unknown|none|unlicensed|proprietary)$/i;

export function validateCommunityRegistry(value){
  const errors=[];
  if(!value||typeof value!=='object'||Array.isArray(value))return{valid:false,errors:['Registry must be an object']};
  if(value.version!=='0.1.0')errors.push('Registry version must be 0.1.0');
  if(!Array.isArray(value.models))return{valid:false,errors:[...errors,'Registry models must be an array']};
  const ids=new Set();
  value.models.forEach((entry,index)=>{
    const at=`Entry ${index+1}`;
    if(!entry||typeof entry!=='object'||Array.isArray(entry)){errors.push(`${at} must be an object`);return;}
    if(typeof entry.id!=='string'||!ID.test(entry.id))errors.push(`${at} has an invalid id`);
    else if(ids.has(entry.id))errors.push(`${at} duplicates id ${entry.id}`);else ids.add(entry.id);
    for(const key of ['name','author','type'])if(typeof entry[key]!=='string'||!entry[key].trim())errors.push(`${at} requires ${key}`);
    if(typeof entry.license!=='string'||!entry.license.trim()||AMBIGUOUS_LICENSE.test(entry.license.trim()))errors.push(`${at} requires an explicit asset license`);
    if(entry.redistributable!==true)errors.push(`${at} must explicitly set redistributable to true`);
    if(![0,1,2].includes(entry.compatibility))errors.push(`${at} compatibility must be 0, 1, or 2`);
    for(const [key,extension] of [['model','.glb'],['preview','.webp']])if(typeof entry[key]!=='string'||!LOCAL_PATH.test(entry[key])||!entry[key].toLowerCase().endsWith(extension))errors.push(`${at} ${key} must be a local ${extension} path`);
    if(entry.profile!==undefined&&(typeof entry.profile!=='string'||!LOCAL_PATH.test(entry.profile)||!entry.profile.toLowerCase().endsWith('.json')))errors.push(`${at} profile must be a local JSON path`);
    if(entry.compatibility===1&&!entry.profile)errors.push(`${at} Level 1 requires profile`);
  });
  return{valid:errors.length===0,errors};
}

export function resolveCommunityRegistry(entries,registryUrl){
  const check=validateCommunityRegistry(entries);if(!check.valid)throw new Error(check.errors.join('\n'));
  const base=new URL('.',registryUrl);
  return entries.models.map(entry=>({...entry,modelUrl:new URL(entry.model,base).href,previewUrl:new URL(entry.preview,base).href,profileUrl:entry.profile?new URL(entry.profile,base).href:null}));
}

export function profileCapabilityKeys(profile){return Object.entries(profile?.capabilities??{}).filter(([,enabled])=>enabled===true).map(([key])=>key);}

export async function loadCommunityRegistry(registryUrl,{fetchImpl=fetch}={}){
  const response=await fetchImpl(registryUrl,{cache:'no-cache'});if(!response.ok)throw new Error(`Model library request failed: ${response.status}`);
  return resolveCommunityRegistry(await response.json(),response.url||registryUrl);
}
