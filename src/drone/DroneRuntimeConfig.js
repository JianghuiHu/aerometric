import { cloneDroneConfig, DEFAULT_DRONE_CONFIG } from './DroneAppearanceConfig.js';

export function configFromImportedAppearance(adapter) {
  const config=cloneDroneConfig();
  for(const key of Object.keys(config.appearance))if(adapter.hasPart(key)){
    config.appearance[key]={color:adapter.getPartColor(key)??config.appearance[key].color,visible:adapter.isPartVisible(key)};
  }
  return config;
}

export function applyDroneConfig({ controller, adapter, statusController }, source = DEFAULT_DRONE_CONFIG) {
  const config = cloneDroneConfig(source);
  controller.reset(); controller.running=config.motion.rotorRunning; controller.speed=config.motion.rotorSpeed;
  controller.setPose(config.motion); controller.setGimbal(config.motion.gimbalPitch,config.motion.gimbalYaw);
  adapter.clearBodyTexture(); adapter.applyAppearance(config.appearance);
  if (statusController) {
    statusController.clearManualRotorOverride(); statusController.applyConfig(config.status,true);
  } else {
    adapter.lights.set(config.status.light);
  }
  return config;
}
