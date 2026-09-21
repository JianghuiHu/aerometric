import * as THREE from 'three';

export class DroneHoverController {
  constructor(root) { this.root = root; this.currentAmplitude = 0; this.target = { enabled: false, amplitude: 0, speed: .5 }; }
  setConfig(config) { this.target = { ...this.target, ...config }; if (!this.target.enabled) this.target.amplitude = 0; }
  update(delta, elapsed) {
    this.currentAmplitude = THREE.MathUtils.lerp(this.currentAmplitude, this.target.amplitude, 1 - Math.exp(-delta / .16));
    this.root.position.y = Math.sin(elapsed * this.target.speed * Math.PI * 2) * this.currentAmplitude;
    if (this.currentAmplitude < 1e-5 && !this.target.enabled) this.root.position.y = 0;
  }
  reset() { this.currentAmplitude = 0; this.target = { enabled: false, amplitude: 0, speed: .5 }; this.root.position.y = 0; }
}
