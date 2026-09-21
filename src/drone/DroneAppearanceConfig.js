import { DRONE_STATUS_PRESETS } from './status/droneStatusPresets.js';

export const STATUS_PRESETS = Object.freeze(Object.fromEntries(Object.entries(DRONE_STATUS_PRESETS).map(([key,preset]) => [key, Object.freeze({
  label: {online:'在线',mission:'任务',notice:'提示',warning:'告警',custom:'自定义'}[key],
  color: preset.light.color, intensity: preset.light.intensity,
})])));

export const PART_DEFINITIONS = Object.freeze([
  { key:'body', label:'机身', color:'#3c3f42' }, { key:'topCover', label:'顶盖', color:'#4b4e51' },
  { key:'arms', label:'四机臂', color:'#22282d' }, { key:'rotors', label:'四旋翼', color:'#22272c' },
  { key:'motors', label:'四电机', color:'#6c7278' }, { key:'landingGear', label:'支撑杆', color:'#3c3f42' },
  { key:'gimbal', label:'云台', color:'#3e464d' }, { key:'camera', label:'摄像头', color:'#3e464d' },
]);

const online=DRONE_STATUS_PRESETS.online;
export const DEFAULT_DRONE_CONFIG=Object.freeze({
  appearance:Object.freeze(Object.fromEntries(PART_DEFINITIONS.map(part=>[part.key,Object.freeze({color:part.color,visible:true})]))),
  motion:Object.freeze({rotorRunning:false,rotorSpeed:12,pitch:0,roll:0,yaw:0,gimbalPitch:0,gimbalYaw:0}),
  status:Object.freeze({type:'online',light:Object.freeze({...online.light,visible:true}),statusField:Object.freeze({...online.statusField}),hover:Object.freeze({...online.hover})}),
  environment:Object.freeze({mode:'solid',color:'#edf0f2',groundVisible:true,flightRoute:false,cameraFollow:false,brightness:1,groundIntensity:.58,rainAmount:.65,fog:0}),
  camera:Object.freeze({preset:'perspective',focalLength:55,distance:1.157,height:.55,target:Object.freeze([0,.1,0])}),
  export:Object.freeze({format:'png',size:'hd',width:1920,height:1080,transparent:false,includeRain:true}),
});

export function migrateDroneConfig(source) {
  const config=structuredClone(source);
  if(config.status&&!config.status.statusField){
    const ripple=config.status.ripple||{};
    config.status.statusField={visible:config.status.effectsVisible!==false&&ripple.enabled!==false,color:ripple.color||config.status.light?.color||'#3ba9ff',speed:ripple.speed??.55,range:ripple.radius??1.8,intensity:ripple.intensity??.4};
    delete config.status.effectsVisible; delete config.status.ripple;
  }
  config.environment??={mode:'solid',color:'#edf0f2'};
  if(config.environment.mode==='transparent')config.environment.mode='solid';
  config.environment={groundVisible:true,flightRoute:false,cameraFollow:false,brightness:1,groundIntensity:.58,rainAmount:config.environment.rainVisible===false?0:.65,fog:0,...config.environment};delete config.environment.rainVisible;
  config.camera??={preset:config.view?.mode||'perspective',focalLength:55,distance:1.157,height:.55,target:[0,.1,0]};
  config.export??={format:'png',size:'hd',width:1920,height:1080,transparent:false,includeRain:true};
  delete config.view;
  return config;
}
export function cloneDroneConfig(config=DEFAULT_DRONE_CONFIG){return migrateDroneConfig(config);}
