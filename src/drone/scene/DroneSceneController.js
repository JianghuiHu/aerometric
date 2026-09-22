import * as THREE from 'three';
import {DroneRoleResolver} from '../profile/DroneRoleResolver.js';
import {getModelBounds} from '../cameraTools.js';

export class DroneSceneController {
  constructor(sourceScene, { groundY = -0.045, clearance = 0.1, profile=null, resolver=new DroneRoleResolver(sourceScene,{profile}) } = {}) {
    this.root = new THREE.Group(); this.root.name = 'DRONE_SCENE_ROOT';
    this.positionRoot = new THREE.Group(); this.positionRoot.name = 'DronePositionRoot';
    this.hoverRoot = new THREE.Group(); this.hoverRoot.name = 'DroneHoverRoot';
    this.rotationRoot = new THREE.Group(); this.rotationRoot.name = 'DroneRotationRoot';
    this.effectRoot = new THREE.Group(); this.effectRoot.name = 'DroneEffectRoot';
    this.modelRoot = resolver.one('root',{fallback:['DRONE_ROOT']});
    if (!this.modelRoot) throw new Error('GLB missing mapped root role');
    this.modelRoot.removeFromParent();
    this.rotationRoot.add(this.modelRoot);
    this.hoverRoot.add(this.rotationRoot);
    this.positionRoot.add(this.hoverRoot, this.effectRoot);
    this.root.add(this.positionRoot);

    const box = getModelBounds(this.modelRoot);
    this.modelSize = box.getSize(new THREE.Vector3());
    this.modelCenter = box.getCenter(new THREE.Vector3());
    this.clearance = clearance;
    this.positionRoot.position.y = groundY - box.min.y + clearance;
    this.effectRoot.position.set(this.modelCenter.x, groundY - this.positionRoot.position.y + 0.001, this.modelCenter.z);
    this.effectDiameter = Math.max(this.modelSize.x, this.modelSize.z);
  }
  attach(scene) { scene.add(this.root); return this; }
  getExportRoot() { return this.modelRoot; }
  dispose() { this.root.removeFromParent(); }
}
