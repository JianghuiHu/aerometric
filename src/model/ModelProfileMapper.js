export const MAPPING_ROLES=Object.freeze([
  {key:'root',required:true,multiple:false,patterns:[/^DRONE_ROOT$/i,/drone.*root/i,/root/i]},
  {key:'body',required:true,multiple:true,patterns:[/^BODY$/i,/body.*main/i,/fuselage/i,/chassis/i]},
  {key:'topCover',multiple:true,patterns:[/top.*cover/i,/battery.*cover/i]},
  {key:'arms',multiple:true,patterns:[/^ARM[_-]/i,/arm/i]},
  {key:'motors',multiple:true,patterns:[/^MOTOR[_-]/i,/motor/i]},
  {key:'rotor.frontLeft',required:true,multiple:false,patterns:[/ROTOR[_-]?FL/i,/prop.*front.*left/i,/prop.*fl/i]},
  {key:'rotor.frontRight',required:true,multiple:false,patterns:[/ROTOR[_-]?FR/i,/prop.*front.*right/i,/prop.*fr/i]},
  {key:'rotor.rearLeft',required:true,multiple:false,patterns:[/ROTOR[_-]?RL/i,/prop.*rear.*left/i,/prop.*rl/i]},
  {key:'rotor.rearRight',required:true,multiple:false,patterns:[/ROTOR[_-]?RR/i,/prop.*rear.*right/i,/prop.*rr/i]},
  {key:'landingGear',multiple:true,patterns:[/landing.*gear/i,/landing/i,/strut/i]},
  {key:'gimbal.yaw',required:true,multiple:false,patterns:[/gimbal.*yaw/i,/yaw.*gimbal/i]},
  {key:'gimbal.pitch',required:true,multiple:false,patterns:[/gimbal.*pitch/i,/pitch.*gimbal/i]},
  {key:'camera',required:true,multiple:false,patterns:[/camera.*main/i,/camera/i]},
  {key:'light.frontLeft',multiple:false,patterns:[/front.*light.*(?:left|_L)/i,/light.*front.*(?:left|_L)/i]},
  {key:'light.frontRight',multiple:false,patterns:[/front.*light.*(?:right|_R)/i,/light.*front.*(?:right|_R)/i]},
]);

export function listMappableObjects(root){const rows=[];root?.traverse?.(object=>{if(object.name?.trim())rows.push({name:object.name,type:object.type,uuid:object.uuid});});return rows.sort((a,b)=>a.name.localeCompare(b.name));}
export function suggestMappings(objects){const names=objects.map(item=>item.name),used=new Set(),result={};for(const role of MAPPING_ROLES){const matches=[];for(const pattern of role.patterns)for(const name of names)if(!used.has(name)&&pattern.test(name)&&!matches.includes(name))matches.push(name);const selected=role.multiple?matches:(matches.slice(0,1));if(selected.length){result[role.key]=selected;selected.forEach(name=>used.add(name));}}return result;}
export function validateMappings(mappings){const errors=[];for(const role of MAPPING_ROLES)if(role.required&&!(mappings[role.key]?.length))errors.push({code:'ROLE_REQUIRED',role:role.key,message:`Missing required role: ${role.key}`});const rotors=['rotor.frontLeft','rotor.frontRight','rotor.rearLeft','rotor.rearRight'].flatMap(key=>mappings[key]??[]);if(rotors.length===4&&new Set(rotors).size!==4)errors.push({code:'ROTOR_UNIQUE',message:'Four rotor roles must map to four unique objects'});return{valid:errors.length===0,errors};}
export function createMappedProfile({id,label,forwardAxis='+Z',mappings}){const roles=Object.fromEntries(Object.entries(mappings).filter(([,names])=>names?.length).map(([key,names])=>[key,[...new Set(names)]])),check=validateMappings(roles);if(!check.valid)throw new Error(check.errors.map(item=>item.message).join('\n'));return{id,version:'0.1.0',label,units:'meter',forwardAxis,roles,capabilities:{partColors:Boolean(roles.body),partVisibility:true,rotorControl:['rotor.frontLeft','rotor.frontRight','rotor.rearLeft','rotor.rearRight'].every(key=>roles[key]),gimbalControl:Boolean(roles['gimbal.yaw']&&roles['gimbal.pitch']&&roles.camera),statusLights:Object.keys(roles).some(key=>key.startsWith('light.')),statusField:false},metadata:{generator:'AEROMETRIC Studio Mapping 0.1'}};}
function metadataFor(role){const positions={frontLeft:'front-left',frontRight:'front-right',rearLeft:'rear-left',rearRight:'rear-right',Left:'left',Right:'right'},directions={frontLeft:1,frontRight:-1,rearLeft:-1,rearRight:1};if(role.startsWith('rotor.')){const suffix=role.slice(6);return{role:'rotor',position:positions[suffix],axis:'+Y',direction:directions[suffix]};}if(role.startsWith('light.front'))return{role:'light.front',position:positions[role.slice(11)]};if(role==='gimbal.yaw')return{role,axis:'+Y'};if(role==='gimbal.pitch')return{role,axis:'+X'};return{role};}
export function embedProfileMetadata(root,profile){const byName=new Map();root.traverse(object=>{if(object.name&&!byName.has(object.name))byName.set(object.name,object);});for(const [role,names] of Object.entries(profile.roles))for(const name of names){const object=byName.get(name);if(object)object.userData.aerometric={...(object.userData.aerometric??{}),...metadataFor(role)};}const rootObject=byName.get(profile.roles.root?.[0])??root;rootObject.userData.aerometric={...(rootObject.userData.aerometric??{}),role:'root',profile:profile.id,capabilities:profile.capabilities};return rootObject;}
export function downloadProfile(profile,fileName='model.aerometric.json'){const blob=new Blob([JSON.stringify(profile,null,2)+'\n'],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=fileName;link.click();setTimeout(()=>URL.revokeObjectURL(url),0);}
