import * as THREE from 'three';
import {DroneRoleResolver} from './profile/DroneRoleResolver.js';

const AXES = { pitch: new THREE.Vector3(1, 0, 0), yaw: new THREE.Vector3(0, 1, 0), roll: new THREE.Vector3(0, 0, 1) };
export class DroneController {
  constructor(scene, { poseRoot, profile, resolver=new DroneRoleResolver(scene,{profile}) } = {}) {
    this.resolver=resolver;
    this.root = resolver.one('root',{fallback:['DRONE_ROOT']}) || scene;
    this.poseRoot = poseRoot || this.root;
    this.rotors = [['rotor.frontLeft','ROTOR_FL'],['rotor.frontRight','ROTOR_FR'],['rotor.rearLeft','ROTOR_RL'],['rotor.rearRight','ROTOR_RR']].map(([role,name])=>resolver.require(role,{fallback:[name]}));
    this.pitch = resolver.require('gimbal.pitch',{fallback:['Gimbal_Pitch']});
    this.yaw = resolver.require('gimbal.yaw',{fallback:['Gimbal_Yaw']});
    this.rotorAxes=this.rotors.map(object=>this.axis(object.userData?.aerometric?.axis||object.userData?.spin_axis||'+Y'));
    this.rotorDirections=this.rotors.map((object,index)=>Number(object.userData?.aerometric?.direction??object.userData?.spin_direction??([1,-1,-1,1][index])));
    this.pitchAxis=this.axis(this.pitch.userData?.aerometric?.axis||'+X');this.yawAxis=this.axis(this.yaw.userData?.aerometric?.axis||'+Y');
    this.materials = new Map();
    this.root.traverse(o => {
      if (o.isMesh) for (const m of Array.isArray(o.material) ? o.material : [o.material]) this.materials.set(m.name, m);
    });
    this.defaults = new Map();
    for (const o of [...new Set([this.poseRoot, this.root, ...this.rotors, this.pitch, this.yaw])]) {
      o.quaternion.normalize();
      this.defaults.set(o, { quaternion: o.quaternion.clone(), position: o.position.clone() });
    }
    this.colors = new Map([...this.materials].map(([n, m]) => [n, { color: m.color.clone(), emissive: m.emissive.clone() }]));
    this.running = false;
    this.speed = 12;
    this.angles = this.rotors.map(() => 0);
  }
  require(name) { const o = this.root.getObjectByName(name); if (!o) throw new Error(`GLB 缺少 ${name}`); return o; }
  axis(value){const key=String(value).replace(/^local\s*/i,'').toUpperCase(),sign=key.startsWith('-')?-1:1,axis=key.replace(/[+-]/g,'');return new THREE.Vector3(axis==='X'?sign:0,axis==='Y'?sign:0,axis==='Z'?sign:0);}
  rotateFromRest(o, axis, degrees) {
    if (!Number.isFinite(degrees)) throw new TypeError('Angle must be finite');
    o.quaternion.copy(this.defaults.get(o).quaternion).multiply(new THREE.Quaternion().setFromAxisAngle(axis, THREE.MathUtils.degToRad(degrees)));
  }
  setPose({ pitch = 0, yaw = 0, roll = 0 }) {
    if (![pitch, yaw, roll].every(Number.isFinite)) throw new TypeError('Pose must be finite');
    this.poseRoot.quaternion.copy(this.defaults.get(this.poseRoot).quaternion)
      .multiply(new THREE.Quaternion().setFromAxisAngle(AXES.yaw, THREE.MathUtils.degToRad(yaw)))
      .multiply(new THREE.Quaternion().setFromAxisAngle(AXES.pitch, THREE.MathUtils.degToRad(pitch)))
      .multiply(new THREE.Quaternion().setFromAxisAngle(AXES.roll, THREE.MathUtils.degToRad(roll)));
  }
  setGimbal(pitch, yaw) {
    this.rotateFromRest(this.pitch, this.pitchAxis, THREE.MathUtils.clamp(pitch, -45, 45));
    this.rotateFromRest(this.yaw, this.yawAxis, THREE.MathUtils.clamp(yaw, -60, 60));
  }
  setColor(name, color) {
    const m = this.materials.get(name); if (!m) throw new Error(`Missing material ${name}`);
    m.color.set(color); if (name === 'MAT_Emissive_Blue') m.emissive.set(color);
  }
  update(dt) {
    if (!this.running || !Number.isFinite(dt) || dt < 0) return;
    this.rotors.forEach((r, i) => {
      this.angles[i] = (this.angles[i] + Math.min(dt, 0.05) * this.speed * this.rotorDirections[i]) % (2 * Math.PI);
      r.quaternion.copy(this.defaults.get(r).quaternion).multiply(new THREE.Quaternion().setFromAxisAngle(this.rotorAxes[i], this.angles[i]));
    });
  }
  reset() {
    this.running = false; this.speed = 12; this.angles.fill(0);
    for (const [o, d] of this.defaults) { o.quaternion.copy(d.quaternion); o.position.copy(d.position); }
    for (const [n, d] of this.colors) { const m = this.materials.get(n); m.color.copy(d.color); m.emissive.copy(d.emissive); }
  }
}
