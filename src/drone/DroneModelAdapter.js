import * as THREE from 'three';
import { DroneStatusLights } from './DroneStatusLights.js';
import {DroneRoleResolver,roleDescendants} from './profile/DroneRoleResolver.js';

const ROOT_NAMES = {
  arms: ['ARM_FL', 'ARM_FR', 'ARM_RL', 'ARM_RR'],
  rotors: ['ROTOR_FL', 'ROTOR_FR', 'ROTOR_RL', 'ROTOR_RR'],
  motors: ['MOTOR_FL', 'MOTOR_FR', 'MOTOR_RL', 'MOTOR_RR'],
  landingGear: ['LANDING_GEAR'],
  gimbal: ['GIMBAL_ROOT'],
  camera: ['Camera_Main'],
};
const BODY_NAMES = ['Body_Main', 'Body_FrontSection', 'Body_Bottom', 'Body_Side_L', 'Body_Side_R'];

function unique(items) { return [...new Set(items.filter(Boolean))]; }
function descendants(root) {
  const result = [];
  root.traverse(object => result.push(object));
  return result;
}

export class DroneModelAdapter {
  constructor(scene,{profile,resolver=new DroneRoleResolver(scene,{profile})}={}) {
    this.scene = scene;
    this.resolver=resolver;
    this.root = resolver.one('root',{fallback:['DRONE_ROOT']}) || scene;
    this.parts = new Map();
    this.ownedMaterials = new Set();
    this.bodyTexture = null;
    this.mapModel();
    this.isolatePartMaterials();
    this.lights = new DroneStatusLights(this.root,{resolver});
  }
  require(name) { const object = this.root.getObjectByName(name); if (!object) throw new Error(`GLB 缺少 ${name}`); return object; }
  mapModel() {
    this.parts.set('body',roleDescendants(this.resolver.objects('body',{fallback:BODY_NAMES})));
    this.parts.set('topCover',roleDescendants(this.resolver.objects('topCover',{fallback:['Body_TopCover']})));
    const roles={arms:'arms',motors:'motors',landingGear:'landingGear',gimbal:'gimbal',camera:'camera'};
    for(const [key,role] of Object.entries(roles))this.parts.set(key,roleDescendants(this.resolver.objects(role,{fallback:ROOT_NAMES[key]??[]})));
    this.parts.set('rotors',roleDescendants(['rotor.frontLeft','rotor.frontRight','rotor.rearLeft','rotor.rearRight'].flatMap((role,index)=>this.resolver.objects(role,{fallback:[ROOT_NAMES.rotors[index]]}))));
    const cameraRoot = this.resolver.one('camera',{fallback:['Camera_Main']});
    const cameraTree = new Set(); cameraRoot?.traverse(o => cameraTree.add(o));
    this.parts.set('gimbal', this.parts.get('gimbal').filter(o => !cameraTree.has(o)));
  }
  meshes(key) { return (this.parts.get(key)??[]).filter(object => object.isMesh && !object.userData.light_fixture); }
  hasPart(key){return this.meshes(key).length>0;}
  isolatePartMaterials() {
    for (const [key] of this.parts) {
      const cloned = new Map();
      for (const mesh of this.meshes(key)) {
        const source = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        const materials = source.map(material => {
          const identity = material.userData.sourceMaterialUuid || material.uuid;
          if (!cloned.has(identity)) {
            const clone = material.clone();
            clone.name = `${material.name}__${key}`;
            clone.userData.sourceMaterialName = material.userData.sourceMaterialName || material.name;
            clone.userData.sourceMaterialUuid = identity;
            cloned.set(identity, clone); this.ownedMaterials.add(clone);
          }
          return cloned.get(identity);
        });
        mesh.material = Array.isArray(mesh.material) ? materials : materials[0];
      }
    }
  }
  setPartColor(key, color) {
    const meshes = this.meshes(key); if (!meshes.length) throw new Error(`部件 ${key} 没有 Mesh`);
    for (const mesh of meshes) for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
      if (material.userData.sourceMaterialName === 'MAT_Lens') continue;
      material.color?.set(color); material.needsUpdate = true;
    }
  }
  setPartVisible(key, visible) {
    const items = this.parts.get(key); if (!items?.length) throw new Error(`未知部件 ${key}`);
    for (const object of items) if (object.isMesh && !object.userData.light_fixture) object.visible = Boolean(visible);
  }
  isPartVisible(key) { return this.meshes(key).some(object => object.visible); }
  getPartColor(key) {
    const material = this.meshes(key).flatMap(mesh => Array.isArray(mesh.material) ? mesh.material : [mesh.material]).find(m => m.userData.sourceMaterialName !== 'MAT_Lens');
    return material ? `#${material.color.getHexString()}` : null;
  }
  getBodyTextureCapability() {
    const body = this.meshes('body')[0];if(!body)return{supported:false,mesh:null,uvCount:0,reason:'Mapped body contains no mesh.'};
    return { supported: Boolean(body.geometry.attributes.uv), mesh: body.name, uvCount: body.geometry.attributes.uv?.count || 0,
      reason: body.geometry.attributes.uv ? null : 'Body_Main 缺少 UV，当前资产无法可靠应用图片贴图。' };
  }
  applyBodyTexture(texture) {
    const capability = this.getBodyTextureCapability();
    if (!capability.supported) { texture?.dispose?.(); throw new Error(capability.reason); }
    const body = this.meshes('body')[0];
    const material = (Array.isArray(body.material) ? body.material : [body.material]).find(m => m.userData.sourceMaterialName === 'MAT_Body_Main') || body.material;
    if (this.bodyTexture && this.bodyTexture !== texture) this.bodyTexture.dispose();
    this.bodyTexture = texture; texture.colorSpace = THREE.SRGBColorSpace; texture.flipY = false;
    material.map = texture; material.needsUpdate = true;
  }
  clearBodyTexture() {
    const body = this.meshes('body')[0];if(!body){this.bodyTexture?.dispose();this.bodyTexture=null;return;}
    for (const material of Array.isArray(body.material) ? body.material : [body.material]) { if (material.map === this.bodyTexture) material.map = null; material.needsUpdate = true; }
    this.bodyTexture?.dispose(); this.bodyTexture = null;
  }
  applyAppearance(config) {
    for (const [key, value] of Object.entries(config)) if(this.hasPart(key)){this.setPartColor(key, value.color);this.setPartVisible(key, value.visible);}
  }
  getMappingReport() {
    return Object.fromEntries([...this.parts].map(([key, objects]) => [key, { objects: objects.map(o => o.name), meshes: objects.filter(o => o.isMesh).map(o => o.name), color: this.getPartColor(key), visible: this.isPartVisible(key) }]));
  }
  dispose() { this.clearBodyTexture(); this.lights.dispose(); for (const material of this.ownedMaterials) material.dispose(); }
}

