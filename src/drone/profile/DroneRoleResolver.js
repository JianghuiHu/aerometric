const POSITION_SUFFIX={'front-left':'frontLeft','front-right':'frontRight','rear-left':'rearLeft','rear-right':'rearRight',left:'Left',right:'Right'};
function canonicalRole(data){if(!data?.role)return null;if(data.role==='rotor'&&POSITION_SUFFIX[data.position])return`rotor.${POSITION_SUFFIX[data.position]}`;if(data.role==='light.front'&&POSITION_SUFFIX[data.position])return`light.front${POSITION_SUFFIX[data.position]}`;if(data.role==='light.motor'&&POSITION_SUFFIX[data.position]){const suffix=POSITION_SUFFIX[data.position];return`light.motor${suffix[0].toUpperCase()}${suffix.slice(1)}`;}return data.role;}
export class DroneRoleResolver{
  constructor(root,{profile=null}={}){this.scene=root;this.byName=new Map();this.extras=new Map();root?.traverse?.(object=>{if(object.name&&!this.byName.has(object.name))this.byName.set(object.name,object);const role=canonicalRole(object.userData?.aerometric);if(role)(this.extras.get(role)??this.extras.set(role,[]).get(role)).push(object);});this.profile=profile&&typeof profile==='object'?profile:null;}
  objects(role,{fallback=[]}={}){const names=this.profile?.roles?.[role];if(names?.length)return names.map(name=>this.byName.get(name)).filter(Boolean);const embedded=this.extras.get(role);if(embedded?.length)return[...embedded];return fallback.map(name=>this.byName.get(name)).filter(Boolean);}
  one(role,options={}){return this.objects(role,options)[0]??null;}
  require(role,options={}){const object=this.one(role,options);if(!object)throw new Error(`GLB missing role ${role}`);return object;}
  capabilities(){return this.one('root',{fallback:['DRONE_ROOT']})?.userData?.aerometric?.capabilities??null;}
}
export function roleDescendants(objects){const result=[],seen=new Set();for(const root of objects)root.traverse(object=>{if(!seen.has(object)){seen.add(object);result.push(object);}});return result;}
