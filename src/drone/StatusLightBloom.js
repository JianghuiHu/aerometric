import * as T from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
export class StatusLightBloom {
  constructor(renderer,scene,camera) {
    this.scene=scene; this.black=new T.MeshBasicMaterial({color:0});
    this.bloom=new EffectComposer(renderer); this.bloom.renderToScreen=false;
    this.source=new RenderPass(scene,camera); this.bloom.addPass(this.source);
    this.glow=new UnrealBloomPass(new T.Vector2(1,1),.35,.25,.15); this.bloom.addPass(this.glow);
    const target=new T.WebGLRenderTarget(1,1,{type:T.HalfFloatType,samples:4});
    this.final=new EffectComposer(renderer,target); this.base=new RenderPass(scene,camera); this.final.addPass(this.base);
    this.mix=new ShaderPass({uniforms:{tDiffuse:{value:null},bloomTexture:{value:null}},vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform sampler2D tDiffuse; uniform sampler2D bloomTexture; varying vec2 vUv; void main(){gl_FragColor=texture2D(tDiffuse,vUv)+texture2D(bloomTexture,vUv);}'});
    this.final.addPass(this.mix); this.final.addPass(new OutputPass());
  }
  setSize(w,h) { this.bloom.setSize(w,h); this.final.setSize(w,h); }
  render(camera,lights) {
    this.source.camera=camera; this.base.camera=camera; this.glow.strength=lights?.bloomStrength||0;
    const saved=new Map(), background=this.scene.background; this.scene.background=new T.Color(0);
    try {
      this.scene.traverse(o=>{if(o.isMesh&&!o.userData.status_light){saved.set(o,o.material);o.material=this.black;}});
      this.bloom.render();
    } finally { for(const [o,m] of saved)o.material=m; this.scene.background=background; }
    this.mix.uniforms.bloomTexture.value=this.glow.renderTargetsHorizontal[0].texture; this.final.render();
  }
  dispose(){this.black.dispose();this.glow.dispose();this.bloom.dispose();this.final.dispose();}
}
