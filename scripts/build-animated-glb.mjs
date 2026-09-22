import fs from 'node:fs';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DEFAULT_DRONE_CONFIG } from '../src/drone/DroneAppearanceConfig.js';
import { exportCurrentDroneGLB } from '../src/drone/export/DroneGLBExporter.js';

class NodeFileReader {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then(result => { this.result = result; this.onloadend?.(); }); }
  readAsDataURL(blob) { blob.arrayBuffer().then(buffer => { this.result = `data:${blob.type};base64,${Buffer.from(buffer).toString('base64')}`; this.onloadend?.(); }); }
}
globalThis.FileReader ??= NodeFileReader;

const bytes = fs.readFileSync('public/models/quadrotor-v3/model.glb');
const input = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
const source = (await new GLTFLoader().parseAsync(input, '')).scene.getObjectByName('DRONE_ROOT');
let sourceTriangles = 0; source.traverse(object => { if (object.isMesh) sourceTriangles += (object.geometry.index?.count ?? object.geometry.attributes.position.count) / 3; });
const baseline = await exportCurrentDroneGLB(source, { status: DEFAULT_DRONE_CONFIG.status, optimize: false });
const glb = await exportCurrentDroneGLB(source, { status: DEFAULT_DRONE_CONFIG.status });
const output = 'blender_drone/v3/platform/phase3-review/aerometric-animated-optimized.glb';
fs.mkdirSync('blender_drone/v3/platform/phase3-review', { recursive: true });
fs.writeFileSync(output, Buffer.from(glb));
const parsed = await new GLTFLoader().parseAsync(glb, '');
let exportedTriangles = 0; parsed.scene.traverse(object => { if (object.isMesh) exportedTriangles += (object.geometry.index?.count ?? object.geometry.attributes.position.count) / 3; });
console.log(JSON.stringify({ output, sourceBytes: bytes.byteLength, equivalentUnoptimizedBytes: baseline.byteLength, exportedBytes: glb.byteLength, reductionVsSourcePercent: Number(((1-glb.byteLength/bytes.byteLength)*100).toFixed(1)), reductionVsEquivalentPercent: Number(((1-glb.byteLength/baseline.byteLength)*100).toFixed(1)), sourceTriangles: Math.round(sourceTriangles), exportedTriangles: Math.round(exportedTriangles), animations: parsed.animations.length, animationTracks: parsed.animations[0]?.tracks.length }, null, 2));
