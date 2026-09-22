import * as T from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
export class StatusLightBloom {
  constructor(renderer,scene,camera) {
    this.renderer=renderer;this.scene=scene; this.blackBackground=new T.Color(0);
    this.bloom=new EffectComposer(renderer); this.bloom.renderToScreen=false;
    this.source=new RenderPass(scene,camera); this.bloom.addPass(this.source);
    this.glow=new UnrealBloomPass(new T.Vector2(1,1),.35,.25,.15); this.bloom.addPass(this.glow);
    const target=new T.WebGLRenderTarget(1,1,{type:T.HalfFloatType});
    this.final=new EffectComposer(renderer,target); this.base=new RenderPass(scene,camera); this.final.addPass(this.base);
    this.mix=new ShaderPass({uniforms:{tDiffuse:{value:null},bloomTexture:{value:null}},vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform sampler2D tDiffuse; uniform sampler2D bloomTexture; varying vec2 vUv; void main(){gl_FragColor=texture2D(tDiffuse,vUv)+texture2D(bloomTexture,vUv);}'});
    this.final.addPass(this.mix); this.final.addPass(new OutputPass());
  }
  setSize(w,h) { this.bloom.setSize(Math.max(1,Math.ceil(w*.5)),Math.max(1,Math.ceil(h*.5))); this.final.setSize(w,h); }
  render(camera,lights) {
    const strength=lights?.bloomStrength||0;
    if(strength<=0){this.renderer.render(this.scene,camera);return;}
    this.source.camera=camera; this.base.camera=camera; this.glow.strength=strength;
    const background=this.scene.background, layerMask=camera.layers.mask; this.scene.background=this.blackBackground;
    try {
      camera.layers.set(1);
      this.bloom.render();
    } finally { camera.layers.mask=layerMask; this.scene.background=background; }
    this.mix.uniforms.bloomTexture.value=this.glow.renderTargetsHorizontal[0].texture; this.final.render();
  }
  dispose(){this.glow.dispose();this.bloom.dispose();this.final.dispose();}
}
