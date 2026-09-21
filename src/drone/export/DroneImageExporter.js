import * as THREE from 'three';
import {StatusLightBloom} from '../StatusLightBloom.js';

export const IMAGE_SIZES=Object.freeze({hd:[1920,1080],qhd:[2560,1440],uhd:[3840,2160]});

export function resolveImageSize(preset,width,height){
  const size=IMAGE_SIZES[preset]||[Number(width),Number(height)];const [w,h]=size.map(Math.round);
  if(!Number.isFinite(w)||!Number.isFinite(h)||w<64||h<64||w>8192||h>8192)throw new Error('图片尺寸必须在 64–8192 像素之间');return{width:w,height:h};
}
export function createExportCamera(source,width,height){
  const camera=source.clone();const aspect=width/height;
  if(camera.isPerspectiveCamera){camera.aspect=aspect;camera.updateProjectionMatrix();}
  else if(camera.isOrthographicCamera){const center=(camera.left+camera.right)/2,span=camera.top-camera.bottom;camera.left=center-span*aspect/2;camera.right=center+span*aspect/2;camera.updateProjectionMatrix();}
  return camera;
}
function canvasToBlob(canvas,type,quality){return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('图片编码失败')),type,quality));}

export async function renderSceneImage({scene,camera,sourceRenderer,environment,statusLights,width,height,format='png',transparent=false,includeRain=true}){
  if(format==='jpg')transparent=false;
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,preserveDrawingBuffer:true});renderer.setPixelRatio(1);renderer.setSize(width,height,false);
  renderer.shadowMap.enabled=sourceRenderer.shadowMap.enabled;renderer.shadowMap.type=sourceRenderer.shadowMap.type;renderer.toneMapping=sourceRenderer.toneMapping;renderer.toneMappingExposure=sourceRenderer.toneMappingExposure;renderer.outputColorSpace=sourceRenderer.outputColorSpace;renderer.setClearAlpha(transparent?0:1);
  const exportCamera=createExportCamera(camera,width,height),restore=environment.prepareExport({transparent,includeRain});let bloom;
  try{if(transparent)renderer.render(scene,exportCamera);else{bloom=new StatusLightBloom(renderer,scene,exportCamera);bloom.setSize(width,height);bloom.render(exportCamera,statusLights);}return await canvasToBlob(canvas,format==='jpg'?'image/jpeg':'image/png',.94);}
  finally{restore();bloom?.dispose();renderer.dispose();}
}
export function downloadImage(blob,filename){const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=filename;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
