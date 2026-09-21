import { cloneStatusPreset } from './droneStatusPresets.js';

export class DroneStatusController {
  constructor({ statusField, hover, lights, rotor }) {
    this.statusField=statusField; this.hover=hover; this.lights=lights; this.rotor=rotor;
    this.type='online'; this.manualRotorOverride=false; this.statusDrivenRotor=false;
    this.config=cloneStatusPreset('online'); this.applyPreset(this.config,true);
  }
  setStatus(type) {
    const fieldVisible=this.config.statusField?.visible??this.statusField.mesh.visible;
    const lightVisible=this.config.light?.visible??this.lights.state.visible;
    this.type=type; this.config=cloneStatusPreset(type);
    this.config.statusField.visible=fieldVisible; this.config.light.visible=lightVisible;
    this.applyPreset(this.config); return this.getConfig();
  }
  applyConfig(config, immediate=false) {
    const base=cloneStatusPreset(config.type||'online'); this.type=config.type||'online';
    this.config={...base,light:{...base.light,...config.light},statusField:{...base.statusField,...config.statusField},hover:{...base.hover,...config.hover}};
    this.applyPreset(this.config,immediate); return this.getConfig();
  }
  applyPreset(preset, immediate=false) {
    this.statusField.setConfig(preset.statusField,immediate); this.hover.setConfig(preset.hover);
    this.lights.transitionTo(preset.light,immediate?0:.25);
    if(!this.manualRotorOverride){
      if(preset.rotor.autoStart){this.rotor.running=true;this.rotor.speed=preset.rotor.speed??this.rotor.speed;this.statusDrivenRotor=true;}
      else if(this.statusDrivenRotor){this.rotor.running=false;this.statusDrivenRotor=false;}
    }
  }
  setCustomStatus(update) {
    if(this.type!=='custom') this.config={...structuredClone(this.config),id:'custom'};
    this.type='custom';
    if(update.color){this.config.light.color=update.color;this.config.statusField.color=update.color;}
    if(update.light) Object.assign(this.config.light,update.light);
    if(update.statusField) Object.assign(this.config.statusField,update.statusField);
    if(update.hover) Object.assign(this.config.hover,update.hover);
    this.applyPreset(this.config); return this.getConfig();
  }
  setStatusFieldVisible(visible){this.config.statusField.visible=Boolean(visible);this.statusField.setConfig({visible});}
  setHoverEnabled(enabled){this.config.hover.enabled=Boolean(enabled);this.hover.setConfig(this.config.hover);}
  setLightVisible(visible){this.config.light.visible=Boolean(visible);this.lights.transitionTo({visible},0);}
  setManualRotorRunning(running){this.manualRotorOverride=true;this.statusDrivenRotor=false;this.rotor.running=Boolean(running);}
  setManualRotorSpeed(speed){this.manualRotorOverride=true;this.rotor.speed=speed;}
  clearManualRotorOverride(){this.manualRotorOverride=false;}
  update(delta,elapsed,camera){this.statusField.update(delta,elapsed,camera);this.hover.update(delta,elapsed);this.lights.update(delta,elapsed);}
  getConfig(){return{type:this.type,statusField:structuredClone(this.config.statusField),hover:structuredClone(this.config.hover),light:structuredClone(this.config.light)};}
  dispose(){this.statusField.dispose();this.hover.reset();}
}
