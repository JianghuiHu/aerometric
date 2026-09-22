import * as THREE from 'three';
import { STATUS_PRESETS } from './DroneAppearanceConfig.js';
export class StatusLightController {
  constructor(root,{resolver}={}) {
    this.root = root; this.meshes = []; this.materials = new Map();
    this.state = { visible: true, color: '#3bafe8', intensity: 2.2, bloomEnabled:true };
    this.current = { color: new THREE.Color('#3bafe8'), intensity: 2.2 };
    this.target = { color: this.current.color.clone(), intensity: 2.2 };
    this.transitionRemaining = 0; this.breathing = false; this.breathingSpeed = 1.2;
    const mapped=[];if(resolver)for(const role of ['light.frontLeft','light.frontRight','light.motorFrontLeft','light.motorFrontRight','light.motorRearLeft','light.motorRearRight'])for(const object of resolver.objects(role)){object.traverse(child=>{if(child.isMesh)mapped.push({object:child,role:role.startsWith('light.front')?'front':'motor'});});}if(!mapped.length)root.traverse(object=>{if(object.isMesh&&object.userData.status_light)mapped.push({object,role:object.userData.light_role||'motor'});});
    for(const entry of mapped){const object=entry.object;
      const material = object.material.clone();
      material.name = `MAT_StatusLight__${object.name}`;
      material.toneMapped = false; material.userData.sourceMaterialName = 'MAT_StatusLight';
      material.metalness = 0; material.roughness = .8; material.envMapIntensity = .05;
      object.material = material; object.layers.enable(1); object.userData.bloom = true;object.userData.light_role=entry.role;
      this.meshes.push(object); this.materials.set(object.name, material);
    }
    this.set(this.state);
  }
  setState(state, customColor) {
    const key = ({caution:'notice',alert:'warning'})[state] || state;
    const preset = STATUS_PRESETS[key];
    if (!preset) throw new Error(`Unknown light state: ${state}`);
    this.set({ color: customColor || preset.color });
  }
  set(update) {
    this.state = { ...this.state, ...update };
    this.state.intensity = Math.max(0, Math.min(4, this.state.intensity));
    if (update.color) this.current.color.set(update.color);
    if (Number.isFinite(update.intensity)) this.current.intensity = this.state.intensity;
    this.target.color.copy(this.current.color); this.target.intensity = this.current.intensity;
    this.transitionRemaining = 0;
    this.render(this.current.intensity);
  }
  transitionTo(update, duration = .25) {
    this.state = { ...this.state, ...update };
    if (update.color) this.target.color.set(update.color);
    if (Number.isFinite(update.intensity)) this.target.intensity = Math.max(0, Math.min(4, update.intensity));
    this.breathing = Boolean(update.breathing); this.breathingSpeed = update.breathingSpeed || 1.2;
    this.transitionRemaining = Math.max(0, duration);
    if (!duration) { this.current.color.copy(this.target.color); this.current.intensity=this.target.intensity; this.render(this.current.intensity); }
  }
  update(delta, elapsed) {
    const blend = this.transitionRemaining > 0 ? Math.min(1, delta / this.transitionRemaining) : 1;
    this.current.color.lerp(this.target.color, blend);
    this.current.intensity = THREE.MathUtils.lerp(this.current.intensity, this.target.intensity, blend);
    this.transitionRemaining = Math.max(0, this.transitionRemaining - delta);
    const pulse = this.breathing ? .95 + .2 * Math.sin(elapsed * this.breathingSpeed * Math.PI * 2) : 1;
    this.render(this.current.intensity * pulse);
  }
  render(intensity) {
    for (const mesh of this.meshes) {
      mesh.visible = this.state.visible;
      const m = mesh.material;
      m.color.set('#26343c'); m.emissive.copy(this.current.color);
      m.emissiveIntensity = .6 * intensity * (mesh.userData.light_role === 'front' ? 1 : .75);
    }
  }
  get bloomStrength() { return this.state.visible&&this.state.bloomEnabled ? .16 * this.current.intensity : 0; }
  setBloomEnabled(enabled){this.state.bloomEnabled=Boolean(enabled);}
  get available(){return this.meshes.length>0;}
  getState() { return { visible: this.state.visible, color: this.state.color, intensity: this.state.intensity, bloomEnabled:this.state.bloomEnabled }; }
  dispose() { for (const material of this.materials.values()) material.dispose(); }
}
