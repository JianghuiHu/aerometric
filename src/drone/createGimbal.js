import * as THREE from 'three';
import { createRoundedRectShape, cylinderBetween } from './geometryUtils.js';

function createCameraHousing(config, materials) {
  const { cameraWidth, cameraHeight, cameraDepth } = config.dimensions;
  const camera = new THREE.Group();
  camera.name = 'CameraPitchAssembly';
  camera.rotation.x = -0.055;

  const housingGeometry = new THREE.ExtrudeGeometry(createRoundedRectShape(cameraWidth, cameraHeight, 0.11), {
    depth: cameraDepth,
    bevelEnabled: true,
    bevelSegments: 3,
    bevelSize: 0.035,
    bevelThickness: 0.025,
    steps: 1,
  });
  housingGeometry.translate(0, 0, -cameraDepth * 0.5);
  const housing = new THREE.Mesh(housingGeometry, materials.camera);
  housing.name = 'CameraHousing';
  housing.castShadow = true;
  camera.add(housing);

  const lensBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.215, 0.235, 0.17, 36), materials.motorDark);
  lensBarrel.name = 'LensBarrel';
  lensBarrel.rotation.x = Math.PI / 2;
  lensBarrel.position.set(0, 0, cameraDepth * 0.58);
  lensBarrel.castShadow = true;

  const lensRing = new THREE.Mesh(new THREE.TorusGeometry(0.205, 0.026, 12, 36), materials.motorSilver);
  lensRing.name = 'LensRing';
  lensRing.position.set(0, 0, cameraDepth * 0.77);

  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.185, 40), materials.lens);
  lens.name = 'LensGlass';
  lens.position.set(0, 0, cameraDepth * 0.79 + 0.006);
  camera.add(lensBarrel, lensRing, lens);
  return camera;
}

export function createGimbal(config, materials) {
  const gimbal = new THREE.Group();
  gimbal.name = 'ForwardGimbal';
  gimbal.position.set(0, -0.56, 1.48);

  const yawMotor = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.2, 28), materials.motorDark);
  yawMotor.name = 'GimbalYawMotor';
  yawMotor.position.y = 0.3;
  yawMotor.castShadow = true;

  const yawRing = new THREE.Mesh(new THREE.CylinderGeometry(0.222, 0.222, 0.045, 28), materials.motorSilver);
  yawRing.position.y = 0.2;

  const leftArm = cylinderBetween(new THREE.Vector3(-0.4, 0.18, 0), new THREE.Vector3(-0.49, -0.08, 0), 0.052, materials.motorDark, 14);
  const rightArm = leftArm.clone();
  rightArm.position.x *= -1;

  const leftAxis = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.1, 20), materials.motorSilver);
  leftAxis.name = 'PitchAxisLeft';
  leftAxis.rotation.z = Math.PI / 2;
  leftAxis.position.set(-0.49, -0.08, 0);
  const rightAxis = leftAxis.clone();
  rightAxis.name = 'PitchAxisRight';
  rightAxis.position.x *= -1;

  gimbal.add(yawMotor, yawRing, leftArm, rightArm, leftAxis, rightAxis);
  const camera = createCameraHousing(config, materials);
  camera.position.y = -0.08;
  gimbal.add(camera);
  return gimbal;
}
