import * as THREE from 'three';

export function getModelBounds(object){
  if(!object.getObjectByName?.('PortableStatusField'))return new THREE.Box3().setFromObject(object,true);
  object.updateWorldMatrix(true,true);
  const box=new THREE.Box3();
  function visit(node){
    if(node.name==='PortableStatusField'||node.userData?.aerometric?.role==='effect.statusField')return;
    if(node.isMesh&&node.geometry){
      if(!node.geometry.boundingBox)node.geometry.computeBoundingBox();
      box.union(node.geometry.boundingBox.clone().applyMatrix4(node.matrixWorld));
    }
    for(const child of node.children)visit(child);
  }
  visit(object);
  return box;
}

export function focusModel(camera, controls, object, padding = 1.3) {
  const box = getModelBounds(object);
  if (box.isEmpty()) throw new Error('无法聚焦空模型');
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const radius = Math.max(size.x, size.y, size.z) / 2;
  const fov = THREE.MathUtils.degToRad(camera.fov);
  const distance = Math.max(radius / Math.tan(fov / 2) * padding, controls.minDistance);
  const direction = camera.position.clone().sub(controls.target).normalize();
  controls.target.copy(center);
  camera.position.copy(center).addScaledVector(direction, distance);
  camera.near = Math.max(distance / 1000, 0.001); camera.far = distance * 100; camera.updateProjectionMatrix();
  controls.update();
  return { box, center, distance };
}
