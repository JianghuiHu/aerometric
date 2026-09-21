import * as THREE from 'three';

const vertexShader = `
varying vec2 vUv;
void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }
`;
const fragmentShader = `
uniform float uTime;
uniform vec3 uColor;
uniform float uSpeed;
uniform float uIntensity;
uniform float uDiscRadius;
uniform float uRingWidth;
uniform float uGlowStrength;
uniform float uScreenBoost;
varying vec2 vUv;

float ring(float d,float phase){
  float radius=mix(uDiscRadius*0.55,1.0,phase);
  float line=1.0-smoothstep(uRingWidth,uRingWidth*2.4,abs(d-radius));
  return line*sin(phase*3.14159265);
}
void main(){
  float d=length((vUv-0.5)*2.0);
  if(d>1.0) discard;
  float x=clamp(d/uDiscRadius,0.0,1.0);
  float discMask=1.0-smoothstep(0.68,1.0,x);
  float disc=discMask*(0.46+0.24*(1.0-x));
  float t=uTime*uSpeed;
  float ripple=max(ring(d,fract(t)),ring(d,fract(t+0.5)))*0.62;
  float edge=(1.0-smoothstep(uRingWidth*2.0,uRingWidth*6.0,abs(d-uDiscRadius)))*uGlowStrength;
  float alpha=clamp((min(disc*uIntensity,0.30)+(ripple+edge)*uIntensity)*uScreenBoost,0.0,0.65);
  if(alpha<0.002) discard;
  float highlight=clamp((ripple+edge)/(disc+ripple+edge+0.001),0.0,1.0);
  vec3 fieldColor=mix(uColor*0.35,uColor,highlight);
  gl_FragColor=vec4(fieldColor,alpha);
}`;

export class DroneStatusField {
  constructor(parent, modelDiameter, config = {}) {
    this.baseDiameter = modelDiameter;
    this.geometry = new THREE.PlaneGeometry(1, 1, 1, 1);
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 }, uColor: { value: new THREE.Color('#2bbe6d') },
        uSpeed: { value: .85 }, uIntensity: { value: .55 }, uDiscRadius: { value: .68 },
        uRingWidth: { value: .018 }, uGlowStrength: { value: .16 }, uScreenBoost: { value: 1 },
      },
      vertexShader, fragmentShader, transparent: true, depthWrite: false,
      side: THREE.DoubleSide, blending: THREE.NormalBlending, toneMapped: false,
    });
    this.mesh = new THREE.Mesh(this.geometry, this.material); this.mesh.name = 'DroneStatusField';
    this.mesh.rotation.x = -Math.PI / 2; this.mesh.renderOrder = 1; parent.add(this.mesh);
    this.current = { color:new THREE.Color('#2bbe6d'), speed:.85, range:2, intensity:.55 };
    this.target = { ...this.current, color:this.current.color.clone() };
    this.screenBoost = 1; this.worldPosition = new THREE.Vector3(); this.setConfig(config, true);
  }
  setConfig(config = {}, immediate = false) {
    if (config.color) this.target.color.set(config.color);
    for (const key of ['speed','range','intensity']) if (Number.isFinite(config[key])) this.target[key] = Math.max(0, config[key]);
    if ('visible' in config) this.mesh.visible = Boolean(config.visible);
    if (immediate) { this.current={...this.target,color:this.target.color.clone()}; this.apply(); }
  }
  updateCamera(camera, delta) {
    let fraction = 1;
    if (camera?.isPerspectiveCamera) {
      const distance = camera.position.distanceTo(this.mesh.getWorldPosition(this.worldPosition));
      fraction = this.baseDiameter / (2 * distance * Math.tan(THREE.MathUtils.degToRad(camera.fov * .5)));
    } else if (camera?.isOrthographicCamera) fraction = this.baseDiameter / ((camera.top-camera.bottom) / camera.zoom);
    const targetBoost = THREE.MathUtils.clamp(.15 / Math.max(fraction,.001), 1, 1.35);
    this.screenBoost = THREE.MathUtils.lerp(this.screenBoost, targetBoost, 1-Math.exp(-delta/.18));
  }
  apply() {
    this.material.uniforms.uColor.value.copy(this.current.color);
    this.material.uniforms.uSpeed.value = this.current.speed;
    this.material.uniforms.uIntensity.value = this.current.intensity;
    this.material.uniforms.uScreenBoost.value = this.screenBoost;
    this.material.uniforms.uRingWidth.value = .018 * THREE.MathUtils.lerp(1, 1.7, (this.screenBoost-1)/.35);
    const diameter=this.baseDiameter*this.current.range*this.screenBoost; this.mesh.scale.set(diameter,diameter,1);
  }
  update(delta, elapsed, camera) {
    const blend=1-Math.exp(-delta/.12); this.current.color.lerp(this.target.color,blend);
    for(const key of ['speed','range','intensity']) this.current[key]=THREE.MathUtils.lerp(this.current[key],this.target[key],blend);
    this.updateCamera(camera,delta); this.material.uniforms.uTime.value=elapsed; this.apply();
  }
  dispose() { this.mesh.removeFromParent(); this.geometry.dispose(); this.material.dispose(); }
}
