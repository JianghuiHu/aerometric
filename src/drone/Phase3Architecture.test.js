import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {DroneEnvironmentController} from './scene/DroneEnvironmentController.js';
import {DroneCameraRig,CAMERA_PRESETS} from './camera/DroneCameraRig.js';
import {createExportCamera,resolveImageSize} from './export/DroneImageExporter.js';
import {DEFAULT_DRONE_CONFIG} from './DroneAppearanceConfig.js';

test('environment and lighting own separate roots and switch without touching model state',async()=>{
  const scene=new THREE.Scene(),model=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshStandardMaterial({color:'#123456'}));model.name='DRONE_ROOT';scene.add(model);
  const environment=new DroneEnvironmentController(scene),before=model.material.color.getHexString();
  assert.equal(environment.environmentRoot.name,'EnvironmentRoot');assert.equal(environment.lightingRoot.name,'LightingRoot');
  for(const mode of ['solid','sky','rain','night']){await environment.applyConfig({mode});assert.equal(model.material.color.getHexString(),before);assert.equal(model.parent,scene);}
  assert.equal(environment.sky.visible,true);assert.equal(environment.rainLayer,null);assert.equal(scene.fog,null);await environment.applyConfig({mode:'sky',fog:.5});assert.ok(scene.fog);
  await environment.applyConfig({mode:'rain'});const restore=environment.prepareExport({transparent:true,includeRain:false});assert.equal(scene.background,null);assert.equal(environment.sky.visible,false);assert.equal(environment.rainLayer.points.visible,false);assert.equal(environment.groundWorld.root.visible,false);assert.equal(environment.floor.material.isShadowMaterial,true);restore();
  assert.equal(environment.sky.visible,true);assert.equal(environment.rainLayer.points.visible,true);environment.dispose();model.geometry.dispose();model.material.dispose();
});

test('camera rig supplies seven presets and manual Orbit becomes custom',()=>{
  const camera=new THREE.PerspectiveCamera(34,1,.005,50),controls=new THREE.EventDispatcher();controls.target=new THREE.Vector3();controls.update=()=>{};controls.enabled=true;controls.minDistance=.4;
  const rig=new DroneCameraRig(camera,controls);for(const preset of Object.keys(CAMERA_PRESETS))assert.ok(rig.setPreset(preset).isCamera);
  rig.setPreset('product45');controls.dispatchEvent({type:'start'});assert.equal(rig.preset,'custom');
  const beforePosition=camera.position.clone(),beforeFov=camera.fov;rig.setFocalLength(70);assert.equal(camera.position.distanceTo(beforePosition),0);assert.notEqual(camera.fov,beforeFov);
  const focalFov=camera.fov;rig.setDistance(2);assert.equal(rig.getConfig().distance,2);assert.equal(camera.fov,focalFov);assert.notEqual(camera.position.distanceTo(beforePosition),0);rig.setHeight(.8);const config=rig.getConfig();assert.equal(config.preset,'custom');assert.equal(config.focalLength,70);assert.equal(config.height,.8);
  rig.resize(1920,1080);assert.equal(camera.aspect,1920/1080);
});

test('image export helpers support required sizes and preserve source cameras',()=>{
  assert.deepEqual(resolveImageSize('hd'),{width:1920,height:1080});assert.deepEqual(resolveImageSize('qhd'),{width:2560,height:1440});assert.deepEqual(resolveImageSize('uhd'),{width:3840,height:2160});assert.deepEqual(resolveImageSize('custom',1200,900),{width:1200,height:900});assert.throws(()=>resolveImageSize('custom',10,900));
  const source=new THREE.PerspectiveCamera(42,1,.01,100),copy=createExportCamera(source,3840,2160);assert.notEqual(copy,source);assert.equal(copy.aspect,3840/2160);assert.equal(source.aspect,1);
  const ortho=new THREE.OrthographicCamera(-1,1,1,-1),orthoCopy=createExportCamera(ortho,1920,1080);assert.equal(orthoCopy.top-orthoCopy.bottom,2);assert.ok(Math.abs((orthoCopy.right-orthoCopy.left)/(orthoCopy.top-orthoCopy.bottom)-1920/1080)<1e-9);
});

test('Phase 3 config and UI use one scene architecture and offscreen image export',()=>{
  assert.equal(DEFAULT_DRONE_CONFIG.environment.mode,'solid');assert.equal(DEFAULT_DRONE_CONFIG.environment.flightRoute,false);assert.equal(DEFAULT_DRONE_CONFIG.environment.cameraFollow,false);assert.equal(DEFAULT_DRONE_CONFIG.environment.fog,0);assert.equal(DEFAULT_DRONE_CONFIG.camera.preset,'perspective');
  const source=fs.readFileSync('src/viewer.js','utf8'),locale=fs.readFileSync('src/i18n/locales/zh-CN.js','utf8');assert.equal((source.match(/name="control"/g)||[]).length,5);
  for(const label of ['运动','外观','状态与特效','环境','导出'])assert.equal(locale.includes(label),true);for(const label of ['camera-dock','camera-tuning','1920×1080','3840×2160'])assert.equal(source.includes(label),true);assert.equal(source.includes('<summary>镜头</summary>'),false);for(const label of ['左视','后视','产品 45°'])assert.equal(Object.values(CAMERA_PRESETS).includes(label),true);
  for(const id of ['status-field-visible','hover-enabled','light-visible','ground-visible','flight-route','flight-follow','image-transparent','image-rain'])assert.equal(source.includes(`id="${id}" type="checkbox"`),true);
  for(const removed of ['body-texture','texture-status','clear-texture','机身图片贴图'])assert.equal(source.includes(removed),false);
  assert.equal(source.includes('html2canvas'),false);assert.equal(source.includes('getDisplayMedia'),false);assert.equal(source.includes('renderSceneImage({scene'),true);
});
