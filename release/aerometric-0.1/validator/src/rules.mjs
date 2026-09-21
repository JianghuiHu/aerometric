const PROFILE_KEYS=new Set(['id','version','label','units','forwardAxis','roles','capabilities','metadata']);
const CAPABILITY_KEYS=new Set(['partColors','partVisibility','rotorControl','gimbalControl','statusLights','statusField']);
export const ROTOR_ROLES=['rotor.frontLeft','rotor.frontRight','rotor.rearLeft','rotor.rearRight'];

export const issue=(code,message,details)=>({code,message,...(details===undefined?{}:{details})});
const roleExists=(roles,name)=>Array.isArray(roles?.[name])&&roles[name].length>0;

export function validateProfile(profile){
  const errors=[],warnings=[];
  if(!profile||typeof profile!=='object'||Array.isArray(profile))return{valid:false,errors:[issue('PROFILE_TYPE','Profile must be a JSON object')],warnings};
  for(const key of Object.keys(profile))if(!PROFILE_KEYS.has(key))errors.push(issue('PROFILE_PROPERTY',`Unknown Profile property: ${key}`));
  if(typeof profile.id!=='string'||!/^[a-z0-9][a-z0-9._-]+$/.test(profile.id))errors.push(issue('PROFILE_ID','id must use lowercase letters, numbers, dots, underscores, or hyphens'));
  if(typeof profile.version!=='string'||!/^0\.1(?:\.[0-9]+)?$/.test(profile.version))errors.push(issue('PROFILE_VERSION','version must match AEROMETRIC 0.1.x'));
  if(profile.units!==undefined&&profile.units!=='meter')errors.push(issue('PROFILE_UNITS','units must be meter'));
  if(profile.forwardAxis!==undefined&&!['+X','-X','+Z','-Z'].includes(profile.forwardAxis))errors.push(issue('PROFILE_AXIS','forwardAxis must be +X, -X, +Z, or -Z'));
  if(!profile.roles||typeof profile.roles!=='object'||Array.isArray(profile.roles)||Object.keys(profile.roles).length===0)errors.push(issue('PROFILE_ROLES','roles must be a non-empty object'));
  else for(const [role,names] of Object.entries(profile.roles)){
    if(!Array.isArray(names)||names.length===0||names.some(name=>typeof name!=='string'||!name))errors.push(issue('ROLE_MAPPING',`${role} must map to a non-empty string array`));
    else if(new Set(names).size!==names.length)errors.push(issue('ROLE_DUPLICATE',`${role} contains duplicate candidates`));
  }
  if(profile.capabilities!==undefined){if(!profile.capabilities||typeof profile.capabilities!=='object'||Array.isArray(profile.capabilities))errors.push(issue('CAPABILITIES_TYPE','capabilities must be an object'));else for(const [name,value] of Object.entries(profile.capabilities)){if(!CAPABILITY_KEYS.has(name))errors.push(issue('CAPABILITY_NAME',`Unknown capability: ${name}`));if(typeof value!=='boolean')errors.push(issue('CAPABILITY_TYPE',`${name} must be boolean`));}}
  const capabilities=profile.capabilities??{};
  if(capabilities.rotorControl&&!ROTOR_ROLES.every(role=>roleExists(profile.roles,role)))errors.push(issue('CAPABILITY_ROTORS','rotorControl requires four directional rotor roles'));
  if(capabilities.gimbalControl&&!['gimbal.yaw','gimbal.pitch'].every(role=>roleExists(profile.roles,role)))errors.push(issue('CAPABILITY_GIMBAL','gimbalControl requires gimbal.yaw and gimbal.pitch'));
  if(capabilities.statusLights&&!Object.keys(profile.roles??{}).some(role=>role.startsWith('light.')))errors.push(issue('CAPABILITY_LIGHTS','statusLights requires at least one light.* role'));
  if(capabilities.partColors&&!roleExists(profile.roles,'body'))warnings.push(issue('CAPABILITY_BODY','partColors is declared without a body role'));
  return{valid:errors.length===0,errors,warnings};
}

export function inspectScene(scene){
  const names=new Map(),materials=new Set();let objects=0,meshes=0,triangles=0,unnamedObjects=0,unnamedMaterials=0,nativeProfile=false,nativeRoles=0;
  scene.traverse(object=>{objects++;const name=object.name?.trim();if(name)names.set(name,(names.get(name)??0)+1);else unnamedObjects++;const extra=object.userData?.aerometric;if(extra?.profile)nativeProfile=true;if(extra?.role)nativeRoles++;if(!object.isMesh)return;meshes++;triangles+=(object.geometry.index?.count??object.geometry.attributes.position?.count??0)/3;for(const material of Array.isArray(object.material)?object.material:[object.material])if(material){materials.add(material);if(!material.name?.trim())unnamedMaterials++;}});
  return{names,objects,meshes,triangles:Math.round(triangles),materials:materials.size,unnamedObjects,unnamedMaterials,nativeProfile,nativeRoles};
}

export function assessScene(scene,bytes,{profile=null,animations=0}={}){
  const errors=[],warnings=[],data=inspectScene(scene);
  if(data.meshes===0)errors.push(issue('GLB_EMPTY','GLB contains no meshes'));
  if(data.triangles>100000)warnings.push(issue('TRIANGLE_BUDGET',`${data.triangles.toLocaleString()} triangles exceeds the 100K recommendation`));
  if(bytes>30*1024*1024)warnings.push(issue('FILE_SIZE',`${(bytes/1024/1024).toFixed(1)} MB exceeds the 30 MB recommendation`));
  const duplicateNames=[...data.names].filter(([,count])=>count>1).map(([name,count])=>({name,count}));
  if(duplicateNames.length)warnings.push(issue('DUPLICATE_NAMES','Duplicate object names reduce mapping reliability',duplicateNames));
  if(data.unnamedMaterials)warnings.push(issue('UNNAMED_MATERIALS',`${data.unnamedMaterials} mesh material bindings are unnamed`));
  let level=data.nativeProfile&&data.nativeRoles?'2':'0';
  if(profile){const validation=validateProfile(profile);errors.push(...validation.errors);warnings.push(...validation.warnings);if(validation.valid){level='1';const resolvedRoles={};for(const [role,candidates] of Object.entries(profile.roles)){const found=candidates.filter(name=>data.names.has(name));resolvedRoles[role]=found;if(found.length===0)errors.push(issue('ROLE_NOT_FOUND',`${role} does not match any GLB object`,candidates));}const rotorNames=ROTOR_ROLES.flatMap(role=>resolvedRoles[role]??[]).slice(0,4);if(profile.capabilities?.rotorControl&&new Set(rotorNames).size!==4)errors.push(issue('ROTOR_UNIQUE','The four rotor roles must resolve to four unique objects'));}}
  return{pass:errors.length===0,level,compatibility:`AEROMETRIC Level ${level}`,metrics:{bytes,objects:data.objects,meshes:data.meshes,triangles:data.triangles,materials:data.materials,animations},errors,warnings};
}
