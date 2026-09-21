/**
 * @typedef {Object} DroneProfile
 * @property {string} id
 * @property {string} version
 * @property {Record<string, string[]>} roles Canonical role to ordered model-name patterns.
 * @property {Record<string, unknown>} [capabilities]
 */

export function validateDroneProfile(profile){
  if(!profile||typeof profile!=='object')throw new TypeError('DroneProfile 必须是对象');
  if(!profile.id||!profile.version||!profile.roles)throw new Error('DroneProfile 缺少 id、version 或 roles');
  for(const [role,names] of Object.entries(profile.roles))if(!Array.isArray(names)||names.some(name=>typeof name!=='string'))throw new Error(`DroneProfile.roles.${role} 必须是字符串数组`);
  return profile;
}

/** Read optional glTF extras without coupling the runtime to one authoring tool. */
export function readAerometricExtras(root){
  const result={profile:null,roles:{}};root?.traverse?.(object=>{const extras=object.userData?.aerometric;if(!extras)return;if(extras.profile&&!result.profile)result.profile=extras.profile;if(extras.role)(result.roles[extras.role]??=[]).push(object);});return result;
}

/** Explicit profile wins, then glTF extras, with adapter heuristics as the final fallback. */
export function resolveRoleCandidates(role,{profile,extras,fallback=[]}={}){return profile?.roles?.[role]??extras?.roles?.[role]?.map(object=>object.name)??fallback;}
