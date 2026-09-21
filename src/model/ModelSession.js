import * as THREE from 'three';
import {readAerometricExtras} from '../drone/profile/DroneProfile.js';
import {DroneRoleResolver} from '../drone/profile/DroneRoleResolver.js';

export const FULL_CAPABILITIES=Object.freeze({partColors:true,partVisibility:true,rotorControl:true,gimbalControl:true,statusLights:true,statusField:true,environment:true,camera:true,imageExport:true,glbExport:true});
export const GENERIC_CAPABILITIES=Object.freeze({...FULL_CAPABILITIES,partColors:false,partVisibility:false,rotorControl:false,gimbalControl:false,statusLights:false,statusField:false});

function inspect(root){let meshes=0,triangles=0;const materials=new Set();root.traverse(object=>{if(!object.isMesh)return;meshes++;triangles+=(object.geometry.index?.count??object.geometry.attributes.position.count)/3;for(const material of Array.isArray(object.material)?object.material:[object.material])if(material)materials.add(material);});return{meshes,triangles:Math.round(triangles),materials:materials.size};}
function disposeObject(root){const geometries=new Set(),materials=new Set(),textures=new Set();root.traverse(object=>{if(object.geometry)geometries.add(object.geometry);for(const material of Array.isArray(object.material)?object.material:[object.material])if(material){materials.add(material);for(const value of Object.values(material))if(value?.isTexture)textures.add(value);}});textures.forEach(texture=>texture.dispose());materials.forEach(material=>material.dispose());geometries.forEach(geometry=>geometry.dispose());}

export class ModelSession{
  constructor({id=crypto.randomUUID(),sourceType,fileName,objectUrl=null,gltf,modelRoot,sceneRoot=modelRoot,capabilities,profile=null,boundingBox,metrics}){Object.assign(this,{id,sourceType,fileName,objectUrl,gltf,modelRoot,sceneRoot,capabilities,profile,boundingBox,metrics});this.disposed=false;}
  static inspectGLTF(gltf,{sourceType='generic-imported',fileName='model.glb',objectUrl=null,groundY=-.045}={}){
    const source=gltf.scene,box=new THREE.Box3().setFromObject(source,true);if(box.isEmpty())throw new Error('GLB contains no visible geometry');const center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3()),displayRoot=new THREE.Group();displayRoot.name='ImportedModelRoot';source.removeFromParent();displayRoot.add(source);displayRoot.position.set(-center.x,groundY-box.min.y+.04,-center.z);displayRoot.updateMatrixWorld(true);
    const extras=readAerometricExtras(source),resolver=new DroneRoleResolver(source),required=['root','rotor.frontLeft','rotor.frontRight','rotor.rearLeft','rotor.rearRight','gimbal.pitch','gimbal.yaw','camera'].every(role=>resolver.one(role,{fallback:{root:['DRONE_ROOT'],'rotor.frontLeft':['ROTOR_FL'],'rotor.frontRight':['ROTOR_FR'],'rotor.rearLeft':['ROTOR_RL'],'rotor.rearRight':['ROTOR_RR'],'gimbal.pitch':['Gimbal_Pitch'],'gimbal.yaw':['Gimbal_Yaw'],camera:['Camera_Main']}[role]}));const compatible=Boolean(extras.profile&&required),capabilities=compatible?{...FULL_CAPABILITIES,...resolver.capabilities()}:GENERIC_CAPABILITIES;return new ModelSession({sourceType:compatible?'compatible-imported':sourceType,fileName,objectUrl,gltf,modelRoot:source,sceneRoot:displayRoot,capabilities,profile:extras.profile,boundingBox:box.clone(),metrics:{...inspect(source),animations:gltf.animations?.length??0,size,maxDimension:Math.max(size.x,size.y,size.z)}});
  }
  getExportRoot(){return this.modelRoot;}
  dispose(){if(this.disposed)return;this.disposed=true;this.sceneRoot.removeFromParent();disposeObject(this.modelRoot);if(this.objectUrl)URL.revokeObjectURL(this.objectUrl);this.gltf=null;}
}
