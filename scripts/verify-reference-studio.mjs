import {spawn} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const chrome=process.env.CHROME_BIN;
const base=process.env.REFERENCE_STUDIO_URL??'http://127.0.0.1:4176/';
const model=path.resolve('release/aerometric-0.1/models/aerometric-reference-drone-01/model.glb');
const mode=process.env.REFERENCE_STUDIO_MODE??'empty-upload';
const libraryIndex=Number(process.env.REFERENCE_STUDIO_LIBRARY_INDEX??0);
const expectBuiltIn=mode==='built-in';
if(!chrome||!fs.existsSync(chrome)||!fs.existsSync(model))throw new Error('Set CHROME_BIN to a local Chrome executable and ensure the reference model exists');
const port=9400+Math.floor(Math.random()*300),profile=path.join(os.tmpdir(),`aerometric-reference-${Date.now()}`);
const child=spawn(chrome,[`--remote-debugging-port=${port}`,`--user-data-dir=${profile}`,'--headless=new','--no-first-run','--window-size=1440,900',base],{stdio:'ignore'});
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function endpoint(){for(let i=0;i<100;i++){try{const pages=await fetch(`http://127.0.0.1:${port}/json/list`).then(r=>r.json()),page=pages.find(item=>item.type==='page'&&item.url.startsWith(base));if(page?.webSocketDebuggerUrl)return page.webSocketDebuggerUrl;}catch{}await wait(100);}throw new Error('Chrome DevTools endpoint unavailable');}
let socket,id=0;const pageErrors=[];
const pending=new Map();
try{
  socket=new WebSocket(await endpoint());
  await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
  socket.onmessage=event=>{const message=JSON.parse(event.data),entry=pending.get(message.id);if(message.method==='Runtime.consoleAPICalled'&&message.params.type==='error')pageErrors.push(message.params.args.map(arg=>arg.description??arg.value).join(' '));if(entry){pending.delete(message.id);message.error?entry.reject(new Error(message.error.message)):entry.resolve(message.result);}};
  const send=(method,params={})=>new Promise((resolve,reject)=>{const callId=++id;pending.set(callId,{resolve,reject});socket.send(JSON.stringify({id:callId,method,params}));});
  async function evaluate(expression){const reply=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(reply.exceptionDetails)throw new Error(reply.exceptionDetails.exception?.description??reply.exceptionDetails.text);return reply.result.value;}
  if(process.env.REFERENCE_STUDIO_COOKIE){
    const cookie=process.env.REFERENCE_STUDIO_COOKIE,index=cookie.indexOf('=');
    if(index<1)throw new Error('Invalid Preview bypass cookie');
    await send('Network.enable');
    await send('Network.setCookie',{name:cookie.slice(0,index),value:cookie.slice(index+1),url:base,secure:true,httpOnly:true});
    await send('Page.reload',{ignoreCache:true});
  }
  for(let i=0;i<120;i++){if(await evaluate('Boolean(window.__DRONE_DEMO__?.renderImage)'))break;if(i===119)throw new Error('Studio did not initialize');await wait(100);}
  const empty=await evaluate('({shown:!document.querySelector("#empty-state").hidden,controlsDisabled:document.querySelector("#controls").disabled,libraryEmpty:document.querySelector("#community-models").textContent})');
  if(mode==='empty-upload'){
    if(!empty.shown||!empty.controlsDisabled)throw new Error(`Empty-state failure: ${JSON.stringify(empty)}`);
    await evaluate('document.querySelector("#empty-browse").click()');
    for(let i=0;i<80;i++){if(await evaluate('document.querySelector("#community-models > p")?.dataset.i18n==="model.libraryEmpty"'))break;if(i===79)throw new Error('Empty Community Library unavailable');await wait(100);}
    const zh=await evaluate('document.querySelector("#empty-state h2").textContent');
    await evaluate('document.querySelector("#locale-toggle").click()');
    const en=await evaluate('document.querySelector("#empty-state h2").textContent');
    if(zh===en)throw new Error('Empty-state i18n did not change');
    await evaluate('document.querySelector("#locale-toggle").click()');
    const documentNode=await send('DOM.getDocument');
    const inputNode=await send('DOM.querySelector',{nodeId:documentNode.root.nodeId,selector:'#model-file'});
    await send('DOM.setFileInputFiles',{files:[model],nodeId:inputNode.nodeId});
  }else if(mode==='upload'){
    const documentNode=await send('DOM.getDocument');
    const inputNode=await send('DOM.querySelector',{nodeId:documentNode.root.nodeId,selector:'#model-file'});
    await send('DOM.setFileInputFiles',{files:[model],nodeId:inputNode.nodeId});
  }else if(mode==='library'){
    await evaluate('document.querySelector("#model-menu-toggle").click()');
    for(let i=0;i<80;i++){if(await evaluate('Boolean(document.querySelector(".community-choice"))'))break;if(i===79)throw new Error('Community model was not listed');await wait(100);}
    await evaluate(`document.querySelectorAll(".community-choice")[${libraryIndex}].click()`);
  }
  const expectedSource=expectBuiltIn?'built-in':'compatible-imported';
  for(let i=0;i<150;i++){if(await evaluate(`Boolean(window.__DRONE_DEMO__.session?.sourceType==="${expectedSource}"&&document.querySelector("#model-metrics").textContent)`))break;if(i===149)throw new Error('Reference GLB did not load');await wait(100);}
  const loaded=await evaluate('({source:window.__DRONE_DEMO__.session.sourceType,meshes:window.__DRONE_DEMO__.session.metrics.meshes,triangles:window.__DRONE_DEMO__.session.metrics.triangles,parts:["body","topCover","arms","rotors","motors","landingGear","gimbal","camera"].map(key=>[key,window.__DRONE_DEMO__.adapter.hasPart(key)]),lights:window.__DRONE_DEMO__.adapter.lights.meshes.length,emptyHidden:document.querySelector("#empty-state").hidden})');
  if(!loaded.emptyHidden||loaded.parts.some(([,found])=>!found)||loaded.lights!==6)throw new Error(`Loaded model capability failure: ${JSON.stringify(loaded)}`);
  const localization=await evaluate('(()=>{const label=document.querySelector(\'[data-i18n="part.body"]\'),before=label.textContent;document.querySelector("#locale-toggle").click();const after=label.textContent;document.querySelector("#locale-toggle").click();return{before,after};})()');
  if(localization.before===localization.after)throw new Error(`Locale toggle did not translate part label: ${JSON.stringify(localization)}`);
  if(process.env.REFERENCE_STUDIO_SCREENSHOT){const screenshot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(process.env.REFERENCE_STUDIO_SCREENSHOT,Buffer.from(screenshot.data,'base64'));}
  const controls=await evaluate(`(async()=>{
    const demo=window.__DRONE_DEMO__,color=document.querySelector('[data-part-color="body"]'),camera=document.querySelector('[data-part-visible="camera"]');
    color.value='#3366aa';color.dispatchEvent(new Event('input',{bubbles:true}));
    camera.checked=false;camera.dispatchEvent(new Event('change',{bubbles:true}));
    document.querySelector('#spin').click();
    const gimbal=document.querySelector('#gimbal-pitch');gimbal.value='15';gimbal.dispatchEvent(new Event('input',{bubbles:true}));
    document.querySelector('[data-state="mission"]').click();
    await new Promise(resolve=>setTimeout(resolve,400));
    const result={color:demo.adapter.getPartColor('body'),cameraVisible:demo.adapter.isPartVisible('camera'),rotorRunning:demo.controller.running,gimbalPitch:demo.config.motion.gimbalPitch,status:demo.config.status.type,lightEmissive:demo.adapter.lights.meshes.map(mesh=>mesh.material.emissive.getHexString())};
    for(const mode of ['sky','rain','night']){document.querySelector('[data-environment="'+mode+'"]').click();await new Promise(resolve=>setTimeout(resolve,150));result[mode]=demo.environmentController.getConfig().mode;}
    const image=[];for(const format of ['png','jpg']){const blob=await demo.renderImage({width:640,height:360,format,transparent:false,includeRain:true});image.push({format:blob.type,bytes:blob.size});}result.images=image;
    const beforeBody=demo.model.getObjectByName('Body_Main');beforeBody.geometry.computeBoundingBox();const originalSize=beforeBody.geometry.boundingBox.getSize({x:0,y:0,z:0,subVectors(a,b){this.x=a.x-b.x;this.y=a.y-b.y;this.z=a.z-b.z;return this;}});
    const glb=await demo.exportCurrentGLB();result.exportBytes=glb.byteLength;
    if(${JSON.stringify(mode)}==='library'){
      const beforeSession=demo.session;
      await demo.loadFile(new File([glb],'Roundtrip.glb',{type:'model/gltf-binary'}));
      const body=demo.model.getObjectByName('Body_Main');body.geometry.computeBoundingBox();const box=body.geometry.boundingBox;
      result.roundtrip={sessionChanged:demo.session!==beforeSession,source:demo.session.sourceType,fileName:demo.session.fileName,message:document.querySelector('#model-message').textContent,color:demo.adapter.getPartColor('body'),cameraVisible:demo.adapter.isPartVisible('camera'),size:[box.max.x-box.min.x,box.max.y-box.min.y,box.max.z-box.min.z],originalSize:[originalSize.x,originalSize.y,originalSize.z]};
    }
    return result;
  })()`);
  if(controls.color.toLowerCase()!=='#3366aa'||controls.cameraVisible||!controls.rotorRunning||controls.gimbalPitch!==15||controls.status!=='mission'||controls.lightEmissive.length!==6||controls.lightEmissive.some(color=>color!=='2bbe6d')||controls.images.some(image=>image.bytes<3000)||controls.exportBytes<10000)throw new Error(`Controls/export failure: ${JSON.stringify(controls)}`);
  if(mode==='library'&&(!controls.roundtrip?.sessionChanged||controls.roundtrip.fileName!=='Roundtrip.glb'||controls.roundtrip.color!=='#3366aa'||controls.roundtrip.cameraVisible||controls.roundtrip.size.some((size,index)=>Math.abs(size-controls.roundtrip.originalSize[index])>1e-3)))throw new Error(`Library roundtrip failure: ${JSON.stringify({roundtrip:controls.roundtrip,pageErrors})}`);
  if(process.env.REFERENCE_STUDIO_ROUNDTRIP_SCREENSHOT){const screenshot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(process.env.REFERENCE_STUDIO_ROUNDTRIP_SCREENSHOT,Buffer.from(screenshot.data,'base64'));}
  console.log(JSON.stringify({empty,loaded,localization,controls},null,2));
}finally{socket?.close();child.kill();try{fs.rmSync(profile,{recursive:true,force:true,maxRetries:3,retryDelay:100});}catch{}}
