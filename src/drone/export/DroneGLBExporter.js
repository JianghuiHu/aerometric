import * as THREE from 'three';

const ROTORS = ['FL', 'FR', 'RL', 'RR'];
const PRESERVE_DETAIL = /Light|LED|Lens|Vent|Camera|Status|Recess/i;

function pruneInvisible(object, isRoot = false) {
  for (const child of [...object.children]) {
    if (!child.visible) object.remove(child);
    else if (!pruneInvisible(child)) object.remove(child);
  }
  object.visible = true;
  return isRoot || object.isMesh || object.isBone || object.children.length > 0;
}

function triangleCount(root) {
  let triangles = 0;
  root.traverse(object => {
    if (object.isMesh) triangles += (object.geometry.index?.count ?? object.geometry.attributes.position.count) / 3;
  });
  return Math.round(triangles);
}

async function simplifyExportGeometry(root, ratio = 0.35) {
  const { SimplifyModifier } = await import('three/addons/modifiers/SimplifyModifier.js');
  const modifier = new SimplifyModifier();
  const cache = new Map();
  root.traverse(object => {
    if (!object.isMesh || object.isSkinnedMesh || Array.isArray(object.material) || PRESERVE_DETAIL.test(object.name)) return;
    const geometry = object.geometry;
    const positions = geometry.attributes.position?.count ?? 0;
    const triangles = (geometry.index?.count ?? positions) / 3;
    if (positions < 700 || triangles < 500 || geometry.morphAttributes.position?.length) return;
    if (!cache.has(geometry)) {
      const simplified = modifier.modify(geometry, Math.max(1, Math.floor(positions * ratio)));
      simplified.name = geometry.name;
      simplified.userData.exportOwned = true;
      cache.set(geometry, simplified);
    }
    object.geometry = cache.get(geometry);
  });
}

function makeFieldMaterial(color, opacity) {
  const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide });
  material.name = 'MAT_PortableStatusField'; material.userData.exportOwned = true;
  return material;
}

function addPortableStatusField(root, status = {}) {
  const field = status.statusField ?? status;
  if (field.visible === false || Number(field.intensity) <= 0) return [];
  const box = new THREE.Box3().setFromObject(root, true);
  const size = box.getSize(new THREE.Vector3());
  const radius = Math.max(size.x, size.z) * (Number(field.range) || 1.8) * 0.5;
  const y = box.min.y - root.getWorldPosition(new THREE.Vector3()).y - 0.012;
  const group = new THREE.Group(); group.name = 'PortableStatusField'; group.position.y = y;
  const color = field.color || '#3ba9ff';
  const disc = new THREE.Mesh(new THREE.CircleGeometry(radius * 0.68, 48), makeFieldMaterial(color, Math.min(0.18, (Number(field.intensity) || 0.4) * 0.22)));
  disc.name = 'PortableStatusDisc'; disc.rotation.x = -Math.PI / 2; group.add(disc);
  for (let index = 0; index < 2; index++) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(radius * 0.95, radius, 64), makeFieldMaterial(color, 0.42));
    ring.name = `PortableRipple_${index + 1}`; ring.rotation.x = -Math.PI / 2; group.add(ring);
  }
  root.add(group);
  return group.children.map(object => object.name);
}

function quaternionValues(base, direction) {
  const values = [];
  const axis = new THREE.Vector3(0, 1, 0);
  for (const angle of [0, Math.PI / 2, Math.PI, Math.PI * 1.5, Math.PI * 2]) {
    const value = base.clone().multiply(new THREE.Quaternion().setFromAxisAngle(axis, angle * direction));
    values.push(value.x, value.y, value.z, value.w);
  }
  return values;
}

export function createPortableAnimationClip(root, { status } = {}) {
  const rotorTimes = [0, 0.5, 1, 1.5, 2];
  const tracks = [];
  for (const suffix of ROTORS) {
    const rotor = root.getObjectByName(`ROTOR_${suffix}`);
    if (!rotor) continue;
    tracks.push(new THREE.QuaternionKeyframeTrack(`${rotor.name}.quaternion`, rotorTimes, quaternionValues(rotor.quaternion, rotor.userData.spin_direction || 1)));
  }
  const rippleNames = addPortableStatusField(root, status);
  const rippleTimes = [0, .25, .5, .75, 1, 1.25, 1.5, 1.75, 2];
  const phases = [[.08,.16,.36,.68,1,.68,.36,.16,.08],[.58,.82,1,.82,.58,.34,.18,.34,.58]];
  rippleNames.filter(name => name.startsWith('PortableRipple_')).forEach((name, index) => {
    const track = new THREE.VectorKeyframeTrack(`${name}.scale`, rippleTimes, phases[index].flatMap(scale => [scale, scale, scale]));
    track.setInterpolation(THREE.InterpolateSmooth); tracks.push(track);
  });
  return new THREE.AnimationClip('AEROMETRIC_Loop', 2, tracks);
}

export function createCurrentExportRoot(droneRoot) {
  if (!droneRoot || droneRoot.name !== 'DRONE_ROOT') throw new Error('导出必须从 DRONE_ROOT 开始');
  const exportRoot = droneRoot.clone(true);
  pruneInvisible(exportRoot, true);
  const sourceTriangles = triangleCount(exportRoot);
  exportRoot.userData.exportStats = { sourceTriangles, exportedTriangles: sourceTriangles };
  exportRoot.updateMatrixWorld(true);
  return exportRoot;
}

function disposeExportOwned(root) {
  root.traverse(object => {
    if (object.geometry?.userData.exportOwned) object.geometry.dispose();
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) if (material?.userData.exportOwned) material.dispose();
  });
}

export async function exportCurrentDroneGLB(droneRoot, options = {}) {
  const { GLTFExporter } = await import('three/addons/exporters/GLTFExporter.js');
  const exportRoot = createCurrentExportRoot(droneRoot);
  if (options.optimize !== false) await simplifyExportGeometry(exportRoot);
  exportRoot.userData.exportStats.exportedTriangles = triangleCount(exportRoot);
  const animation = createPortableAnimationClip(exportRoot, options);
  try {
    return await new GLTFExporter().parseAsync(exportRoot, {
      binary: true,
      onlyVisible: true,
      trs: true,
      animations: animation.tracks.length ? [animation] : [],
      includeCustomExtensions: false,
      maxTextureSize: 2048,
    });
  } finally {
    disposeExportOwned(exportRoot);
  }
}

export async function exportCurrentModelGLB(modelRoot, options = {}) {
  if(modelRoot?.name==='DRONE_ROOT')return exportCurrentDroneGLB(modelRoot,options);
  if(!modelRoot)throw new Error('Missing model root');
  const {GLTFExporter}=await import('three/addons/exporters/GLTFExporter.js');
  const exportRoot=modelRoot.clone(true);pruneInvisible(exportRoot,true);
  return new GLTFExporter().parseAsync(exportRoot,{binary:true,onlyVisible:true,trs:true,includeCustomExtensions:false,maxTextureSize:2048});
}

export function downloadGLB(arrayBuffer, filename = 'aerometric-drone.glb') {
  const url = URL.createObjectURL(new Blob([arrayBuffer], { type: 'model/gltf-binary' }));
  const link = document.createElement('a');
  link.href = url; link.download = filename; document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function createDronePackageConfig(config, { bodyTexture = null } = {}) {
  return {
    schemaVersion: 1,
    files: { model: 'drone.glb', bodyTexture, preview: 'preview.png' },
    appearance: structuredClone(config.appearance),
    motion: structuredClone(config.motion),
    status: structuredClone(config.status),
    environment: structuredClone(config.environment ?? null),
    camera: structuredClone(config.camera ?? config.view),
  };
}
