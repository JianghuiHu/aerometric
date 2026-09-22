import {spawn} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const base=process.env.BENCHMARK_URL??'http://127.0.0.1:4183/';
const chrome=process.env.CHROME_BIN??'C:/Program Files/Google/Chrome/Application/chrome.exe';
const seconds=Number(process.env.BENCHMARK_SECONDS??2.5);
const files={reference:path.resolve('release/aerometric-0.1/models/aerometric-reference-drone-01/model.glb'),v3:path.resolve(process.env.BENCHMARK_V3??'public/models/quadrotor-v3/model.glb')};
if(!fs.existsSync(chrome)||Object.values(files).some(file=>!fs.existsSync(file)))throw new Error('Chrome and both model GLBs must exist');
const port=9700+Math.floor(Math.random()*200),profile=path.join(os.tmpdir(),`aerometric-bench-${Date.now()}`);
const child=spawn(chrome,[`--remote-debugging-port=${port}`,`--user-data-dir=${profile}`,'--headless=new','--no-first-run','--window-size=1440,900',`--force-device-scale-factor=${process.env.BENCHMARK_DPR??1}`,base],{stdio:'ignore'});
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));let socket;
try{
  let endpoint;
  for(let i=0;i<100;i++){try{endpoint=(await fetch(`http://127.0.0.1:${port}/json/list`).then(r=>r.json())).find(page=>page.type==='page'&&page.url.startsWith(base))?.webSocketDebuggerUrl;}catch{}if(endpoint)break;await wait(100);}
  if(!endpoint)throw new Error('Chrome CDP endpoint unavailable');
  socket=new WebSocket(endpoint);await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
  let id=0;const pending=new Map();socket.onmessage=event=>{const message=JSON.parse(event.data),entry=pending.get(message.id);if(entry){pending.delete(message.id);message.error?entry.reject(new Error(message.error.message)):entry.resolve(message.result);}};
  const send=(method,params={})=>new Promise((resolve,reject)=>{const callId=++id;pending.set(callId,{resolve,reject});socket.send(JSON.stringify({id:callId,method,params}));});
  const evaluate=async expression=>{const reply=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(reply.exceptionDetails)throw new Error(reply.exceptionDetails.exception?.description??reply.exceptionDetails.text);return reply.result.value;};
  await send('Performance.enable');
  for(let i=0;i<150;i++){if(await evaluate('Boolean(window.__DRONE_DEMO__?.model)'))break;if(i===149)throw new Error('Studio did not load');await wait(100);}
  for(let i=0;i<100;i++){if(await evaluate(`performance.getEntriesByType('resource').some(r=>r.name.includes('StatusLightBloom'))`))break;if(i===99)throw new Error('Bloom module did not load');await wait(100);}
  const bloomUrl=await evaluate(`performance.getEntriesByType('resource').find(r=>r.name.includes('StatusLightBloom')).name`);
  await evaluate(`(async()=>{const m=await import(${JSON.stringify(bloomUrl)});window.__bloomPrototype=m.StatusLightBloom.prototype;window.__bloomRender=m.StatusLightBloom.prototype.render;window.__bloomOff=function(camera){__DRONE_DEMO__.renderer.render(__DRONE_DEMO__.scene,camera)};})()`);
  const documentNode=await send('DOM.getDocument'),inputNode=await send('DOM.querySelector',{nodeId:documentNode.root.nodeId,selector:'#model-file'});
  async function load(file){await send('DOM.setFileInputFiles',{files:[file],nodeId:inputNode.nodeId});const expected=path.basename(file);for(let i=0;i<150;i++){if(await evaluate(`__DRONE_DEMO__.session?.fileName===${JSON.stringify(expected)}`))return;await wait(100);}throw new Error(`Model did not load: ${expected}`);}
  const metrics=async()=>Object.fromEntries((await send('Performance.getMetrics')).metrics.map(item=>[item.name,item.value]));
  async function sample(model,scenario,bloom){
    await evaluate(`__bloomPrototype.render=${bloom?'__bloomRender':'__bloomOff'};__DRONE_DEMO__.renderer.info.autoReset=false;__DRONE_DEMO__.renderer.info.reset()`);
    await wait(200);const before=await metrics();
    const frame=await evaluate(`new Promise(resolve=>{const intervals=[];let previous=0,start=0;function tick(now){if(!start)start=now;if(previous)intervals.push(now-previous);previous=now;if(now-start<${seconds*1000})requestAnimationFrame(tick);else{const sorted=intervals.slice().sort((a,b)=>a-b),info=__DRONE_DEMO__.renderer.info.render;resolve({frames:intervals.length,seconds:(now-start)/1000,fps:intervals.length/((now-start)/1000),frameMs:intervals.reduce((a,b)=>a+b,0)/intervals.length,p95Ms:sorted[Math.floor(sorted.length*.95)],drawCallsPerFrame:info.calls/intervals.length,trianglesPerFrame:info.triangles/intervals.length,meshes:__DRONE_DEMO__.session.metrics.meshes,modelTriangles:__DRONE_DEMO__.session.metrics.triangles,pixelRatio:__DRONE_DEMO__.renderer.getPixelRatio()});}}requestAnimationFrame(tick)})`);
    const after=await metrics();return{model,scenario,bloom,...frame,taskSeconds:after.TaskDuration-before.TaskDuration,scriptSeconds:after.ScriptDuration-before.ScriptDuration};
  }
  async function toggle(id,enabled){await evaluate(`(()=>{const x=document.querySelector(${JSON.stringify('#'+id)});x.checked=${enabled};x.dispatchEvent(new Event('change',{bubbles:true}));})()`);}
  const results=[];
  for(const [name,file] of Object.entries(files)){
    await load(file);await evaluate(`__DRONE_DEMO__.setEnvironment({mode:'solid',groundVisible:true,rainAmount:0})`);await toggle('status-field-visible',true);
    results.push(await sample(name,'solid',false),await sample(name,'solid',true));
    await toggle('status-field-visible',false);results.push(await sample(name,'field-off',true));await toggle('status-field-visible',true);
    await evaluate(`__DRONE_DEMO__.setEnvironment({mode:'sky',groundVisible:true})`);await wait(500);results.push(await sample(name,'sky-ground-on',true));
    await toggle('ground-visible',false);await wait(350);results.push(await sample(name,'sky-ground-off',true));await toggle('ground-visible',true);
    await evaluate(`__DRONE_DEMO__.setEnvironment({mode:'rain',rainAmount:0})`);await wait(500);results.push(await sample(name,'rain-off',true));
    await evaluate(`__DRONE_DEMO__.setEnvironment({mode:'rain',rainAmount:.65})`);results.push(await sample(name,'rain-on',true));
  }
  if(process.env.BENCHMARK_SCREENSHOT){await evaluate(`__DRONE_DEMO__.setEnvironment({mode:'solid'})`);await wait(500);const capture=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(process.env.BENCHMARK_SCREENSHOT,Buffer.from(capture.data,'base64'));}
  const environment=await evaluate(`({viewport:[innerWidth,innerHeight],devicePixelRatio,rendererPixelRatio:__DRONE_DEMO__.renderer.getPixelRatio(),userAgent:navigator.userAgent,webgl:__DRONE_DEMO__.renderer.getContext().getParameter(__DRONE_DEMO__.renderer.getContext().RENDERER)})`);
  console.log(JSON.stringify({date:new Date().toISOString(),base,environment,results},null,2));
}finally{socket?.close();child.kill();try{fs.rmSync(profile,{recursive:true,force:true,maxRetries:3,retryDelay:100});}catch{}}
