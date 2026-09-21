import {spawn} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const base=process.env.FLIGHT_AUDIT_URL||'http://127.0.0.1:4173/';
const port=9891,profile=path.join(os.tmpdir(),`aero-flight-${Date.now()}`),out=path.resolve('blender_drone/v3/platform/phase3-review');
fs.mkdirSync(out,{recursive:true});
const chrome=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',[`--remote-debugging-port=${port}`,`--user-data-dir=${profile}`,'--headless=new','--hide-scrollbars','--window-size=1440,900',base],{stdio:'ignore'});
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
try{
  let page;
  for(let i=0;i<100;i++){try{page=(await fetch(`http://127.0.0.1:${port}/json/list`).then(r=>r.json())).find(item=>item.type==='page'&&item.url.startsWith(base));if(page)break;}catch{}await wait(100);}
  if(!page)throw new Error('Viewer page did not open');
  const ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
  let id=0;const pending=new Map();ws.onmessage=event=>{const message=JSON.parse(event.data),done=pending.get(message.id);if(done){pending.delete(message.id);done(message);}};
  const send=(method,params={})=>new Promise(resolve=>{const next=++id;pending.set(next,resolve);ws.send(JSON.stringify({id:next,method,params}));});
  const evaluate=async expression=>{const result=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(result.result.exceptionDetails)throw new Error(result.result.exceptionDetails.text);return result.result.result.value;};
  await send('Runtime.enable');await send('Page.enable');
  for(let i=0;i<120&&!await evaluate('Boolean(window.__DRONE_DEMO__?.session)');i++)await wait(100);
  const camera=await evaluate(`(()=>{const d=window.__DRONE_DEMO__,p=d.cameraRig.perspective,start={position:p.position.toArray(),fov:p.fov};d.cameraRig.setFocalLength(85);const focal={position:p.position.toArray(),fov:p.fov};d.cameraRig.setDistance(2.4);return{start,focal,distance:{position:p.position.toArray(),fov:p.fov}};})()`);
  const hover=await evaluate(`(async()=>{const d=window.__DRONE_DEMO__,root=d.droneScene.hoverRoot,toggle=document.querySelector('#hover-enabled');if(toggle.checked)toggle.click();await new Promise(r=>setTimeout(r,900));const rest=root.position.y;toggle.click();const samples=[];for(let i=0;i<12;i++){await new Promise(r=>setTimeout(r,100));samples.push(root.position.y);}const active=samples.reduce((best,value)=>Math.abs(value-rest)>Math.abs(best-rest)?value:best,rest);toggle.click();await new Promise(r=>setTimeout(r,900));return{rest,active,stopped:root.position.y};})()`);
  await evaluate(`document.querySelector('#flight-route').click()`);await wait(1900);
  const route=await evaluate(`(()=>{const d=window.__DRONE_DEMO__,r=d.flightRoute,points=r.cruisePoints,x=points.map(p=>p.x),z=points.map(p=>p.z),axisAligned=points.slice(1).every((p,i)=>p.x===points[i].x||p.z===points[i].z),landedBottomY=r.targetBottom.y+d.session.sceneRoot.position.y-r.basePosition.y,landingError=Math.abs(landedBottomY-r.padPoint.y),maxObstacleY=d.environmentController.groundWorld.getMaxObstacleY();r.time=27;r.update(.01);return{enabled:r.enabled,cameraFollow:d.config.environment.cameraFollow,fogDisabled:d.scene.fog===null,visible:r.root.visible,routeParent:r.root.parent?.name,duration:r.duration,groundY:r.groundY,landedBottomY,landingError,axisAligned,mapSpan:[Math.max(...x)-Math.min(...x),Math.max(...z)-Math.min(...z)],obstacleClearance:r.cruiseY-maxObstacleY,modelPosition:d.session.sceneRoot.position.toArray(),routeMeshes:r.root.children.map(o=>o.name)}})()`);
  await evaluate(`(()=>{const d=window.__DRONE_DEMO__,p=d.cameraRig.perspective;d.cameraRig.setFocalLength(35);p.position.set(7,6,8);p.far=100;p.updateProjectionMatrix();d.cameraRig.controls.target.set(0,-.8,0);d.cameraRig.controls.update();const environment=[...document.querySelectorAll('details')].find(node=>node.querySelector('#flight-route'));if(environment)environment.open=true;})()`);await wait(200);
  const follow=await evaluate(`(async()=>{const d=window.__DRONE_DEMO__,camera=d.cameraRig.perspective,model=d.session.sceneRoot,before={camera:camera.position.toArray(),model:model.position.toArray(),target:d.cameraRig.controls.target.toArray()};await new Promise(r=>setTimeout(r,600));const after={camera:camera.position.toArray(),model:model.position.toArray(),target:d.cameraRig.controls.target.toArray()},distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));return{before,after,cameraDelta:distance(after.camera,before.camera),modelDelta:distance(after.model,before.model),targetDelta:distance(after.target,before.target)};})()`);
  const screenshot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(out,'flight-route.png'),Buffer.from(screenshot.result.data,'base64'));
  await evaluate(`(()=>{const d=window.__DRONE_DEMO__,r=d.flightRoute,p=d.cameraRig.perspective;r.time=0;r.update(.01);d.cameraRig.setFocalLength(55);p.position.set(-.25,.05,-.1);p.far=40;p.updateProjectionMatrix();d.cameraRig.controls.target.set(-2.5,-1.42,-2.5);d.cameraRig.controls.update();})()`);await wait(150);
  const landingShot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(out,'flight-route-landing.png'),Buffer.from(landingShot.result.data,'base64'));
  const report={camera:{...camera,focalOnlyKeepsPosition:JSON.stringify(camera.start.position)===JSON.stringify(camera.focal.position),distanceOnlyKeepsFov:camera.focal.fov===camera.distance.fov},hover:{...hover,visibleDelta:Math.abs(hover.active-hover.rest),stoppedDelta:Math.abs(hover.stopped-hover.rest)},route,follow};
  fs.writeFileSync(path.join(out,'flight-route-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));ws.close();
}finally{chrome.kill();try{fs.rmSync(profile,{recursive:true,force:true});}catch{}}
