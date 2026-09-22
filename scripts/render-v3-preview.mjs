import {spawn} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const chrome=process.env.CHROME_BIN??'C:/Program Files/Google/Chrome/Application/chrome.exe',base=process.env.STUDIO_URL??'http://127.0.0.1:4183/';
const model=path.resolve('public/models/quadrotor-v3/model.glb'),output=path.resolve('public/models/quadrotor-v3/preview.webp');
const port=9900+Math.floor(Math.random()*80),profile=path.join(os.tmpdir(),`aerometric-preview-${Date.now()}`),child=spawn(chrome,[`--remote-debugging-port=${port}`,`--user-data-dir=${profile}`,'--headless=new','--no-first-run','--window-size=1440,900',base],{stdio:'ignore'});
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));let socket;
try{
  let endpoint;for(let i=0;i<100;i++){try{endpoint=(await fetch(`http://127.0.0.1:${port}/json/list`).then(r=>r.json())).find(page=>page.type==='page'&&page.url.startsWith(base))?.webSocketDebuggerUrl;}catch{}if(endpoint)break;await wait(100);}if(!endpoint)throw new Error('Chrome unavailable');
  socket=new WebSocket(endpoint);await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});let id=0;const pending=new Map();socket.onmessage=event=>{const m=JSON.parse(event.data),p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(new Error(m.error.message)):p.resolve(m.result);}};
  const send=(method,params={})=>new Promise((resolve,reject)=>{const callId=++id;pending.set(callId,{resolve,reject});socket.send(JSON.stringify({id:callId,method,params}));});
  const evaluate=async expression=>{const result=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(result.exceptionDetails)throw new Error(result.exceptionDetails.exception?.description??result.exceptionDetails.text);return result.result.value;};
  for(let i=0;i<150;i++){if(await evaluate('Boolean(window.__DRONE_DEMO__?.model)'))break;await wait(100);}
  const doc=await send('DOM.getDocument'),input=await send('DOM.querySelector',{nodeId:doc.root.nodeId,selector:'#model-file'});await send('DOM.setFileInputFiles',{files:[model],nodeId:input.nodeId});
  for(let i=0;i<150;i++){if(await evaluate(`__DRONE_DEMO__.session?.fileName==='model.glb'`))break;if(i===149)throw new Error('V3 did not load');await wait(100);}
  await evaluate(`document.querySelector('[data-view="product45"]').click()`);await wait(400);
  const encoded=await evaluate(`(async()=>{const blob=await __DRONE_DEMO__.renderImage({width:960,height:640,format:'png',transparent:false,includeRain:false}),bitmap=await createImageBitmap(blob),canvas=new OffscreenCanvas(960,640),context=canvas.getContext('2d');context.drawImage(bitmap,0,0);bitmap.close();const webp=await canvas.convertToBlob({type:'image/webp',quality:.88}),bytes=new Uint8Array(await webp.arrayBuffer());let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(binary);})()`);
  fs.writeFileSync(output,Buffer.from(encoded,'base64'));fs.copyFileSync(output,'release/aerometric-0.1/models/quadrotor-v3/preview.webp');console.log(`${output} · ${fs.statSync(output).size} bytes`);
}finally{socket?.close();child.kill();try{fs.rmSync(profile,{recursive:true,force:true,maxRetries:3,retryDelay:100});}catch{}}
