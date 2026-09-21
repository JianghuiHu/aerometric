import * as THREE from 'three';
import {focusModel} from '../cameraTools.js';

export const CAMERA_PRESETS=Object.freeze({perspective:'透视',product45:'产品 45°',top:'顶视',front:'正视',rear:'后视',left:'左视',right:'右视'});
const DEFAULT_POSITION=new THREE.Vector3(.68,.34,.82),DEFAULT_TARGET=new THREE.Vector3(0,.11,0);

export class DroneCameraRig{
  constructor(perspective,controls){
    this.perspective=perspective;this.controls=controls;this.cameras={};this.preset='perspective';this.activeCamera=perspective;
    for(const [name,pos,up] of [['top',[0,2,0],[0,0,-1]],['front',[0,.105,2],[0,1,0]],['rear',[0,.105,-2],[0,1,0]],['left',[-2,.105,0],[0,1,0]],['right',[2,.105,0],[0,1,0]]]){const c=new THREE.OrthographicCamera(-.5,.5,.4,-.4,.001,20);c.position.set(...pos);c.up.set(...up);c.lookAt(0,.105,0);this.cameras[name]=c;}
    controls.addEventListener?.('start',()=>{if(this.preset==='perspective'||this.preset==='product45')this.preset='custom';});this.reset();
  }
  setPreset(name){
    if(!CAMERA_PRESETS[name])throw new Error(`Unknown camera preset: ${name}`);this.preset=name;
    if(name==='perspective'||name==='product45'){this.activeCamera=this.perspective;this.controls.enabled=true;const p=name==='product45'?new THREE.Vector3(.72,.40,.72):DEFAULT_POSITION;this.perspective.position.copy(p);this.controls.target.copy(DEFAULT_TARGET);this.controls.update();}
    else{this.activeCamera=this.cameras[name];this.controls.enabled=false;}
    return this.activeCamera;
  }
  setFocalLength(mm){this.perspective.setFocalLength(THREE.MathUtils.clamp(mm,18,120));this.perspective.updateProjectionMatrix();this.preset='custom';}
  setDistance(distance){const direction=this.perspective.position.clone().sub(this.controls.target).normalize();this.perspective.position.copy(this.controls.target).addScaledVector(direction,THREE.MathUtils.clamp(distance,.4,12));this.controls.update();this.preset='custom';}
  setHeight(height){this.perspective.position.y=THREE.MathUtils.clamp(height,.1,4);this.controls.update();this.preset='custom';}
  focus(object){this.activeCamera=this.perspective;this.controls.enabled=true;focusModel(this.perspective,this.controls,object);this.preset='custom';}
  reset(){this.perspective.position.copy(DEFAULT_POSITION);this.controls.target.copy(DEFAULT_TARGET);this.perspective.setFocalLength(55);this.perspective.near=.005;this.perspective.far=50;this.perspective.updateProjectionMatrix();this.controls.update();return this.setPreset('perspective');}
  resize(width,height){const aspect=width/height;this.perspective.aspect=aspect;this.perspective.updateProjectionMatrix();const span=Math.max(.86,.86/aspect);for(const camera of Object.values(this.cameras)){camera.left=-span*aspect/2;camera.right=span*aspect/2;camera.top=span/2;camera.bottom=-span/2;camera.updateProjectionMatrix();}}
  getConfig(){const offset=this.perspective.position.clone().sub(this.controls.target);return{preset:this.preset,focalLength:Number(this.perspective.getFocalLength().toFixed(1)),distance:Number(offset.length().toFixed(3)),height:Number(this.perspective.position.y.toFixed(3)),target:this.controls.target.toArray()};}
}
