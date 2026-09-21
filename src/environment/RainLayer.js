import * as THREE from 'three';

export class RainLayer{
  constructor(count=1200){this.maxCount=count;const positions=new Float32Array(count*3);let seed=17;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);for(let i=0;i<count;i++){positions[i*3]=(random()-.5)*8;positions[i*3+1]=random()*5+.05;positions[i*3+2]=(random()-.5)*8;}this.geometry=new THREE.BufferGeometry();this.geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));this.material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,vertexShader:'void main(){gl_PointSize=5.;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'void main(){float x=abs(gl_PointCoord.x-.5);float fade=sin(gl_PointCoord.y*3.14159265);if(x>.1)discard;gl_FragColor=vec4(.68,.82,.92,.38*fade);}'});this.points=new THREE.Points(this.geometry,this.material);this.points.name='Rain';this.points.frustumCulled=false;this.setAmount(.65);}
  setAmount(amount){this.amount=THREE.MathUtils.clamp(Number(amount),0,1);this.geometry.setDrawRange(0,Math.max(0,Math.round(this.maxCount*this.amount)));}
  update(delta){const p=this.geometry.attributes.position.array;for(let i=1;i<p.length;i+=3){p[i]-=delta*2.15;if(p[i]<0)p[i]=5;}this.geometry.attributes.position.needsUpdate=true;}
  dispose(){this.points.removeFromParent();this.geometry.dispose();this.material.dispose();}
}
