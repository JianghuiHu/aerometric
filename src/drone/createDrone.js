import * as THREE from 'three';
import { createFuselage } from './createFuselage.js';
import { createGimbal } from './createGimbal.js';
import { createMaterials } from './createMaterials.js';
import { createMotorRotor } from './createRotor.js';
import { cylinderBetween } from './geometryUtils.js';

function createShoulder(start, end, materials, name) {
  const direction = new THREE.Vector3().subVectors(end, start);
  const length = direction.length();
  const geometry = new THREE.BoxGeometry(0.42, 0.28, length);
  const positions = geometry.getAttribute('position');
  for (let index = 0; index < positions.count; index += 1) {
    const isOuterEnd = positions.getZ(index) > 0;
    if (isOuterEnd) {
      positions.setX(index, positions.getX(index) * 0.46);
      positions.setY(index, positions.getY(index) * 0.58);
    }
    positions.setZ(index, positions.getZ(index) + length * 0.5);
  }
  positions.needsUpdate = true;
  geometry.computeVertexNormals();

  const connector = new THREE.Mesh(geometry, materials.fuselage);
  connector.name = name;
  connector.position.copy(start);
  connector.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction.clone().normalize());
  connector.castShadow = true;
  return connector;
}

function createLandingLeg(motorPosition, direction, materials) {
  const group = new THREE.Group();
  group.name = 'LandingLeg';
  const upper = motorPosition.clone().add(direction.clone().multiplyScalar(0.025));
  upper.y = -0.06;
  const lower = motorPosition.clone().add(direction.clone().multiplyScalar(0.14));
  lower.y = -1.01;
  const legDirection = new THREE.Vector3().subVectors(lower, upper);
  const legLength = legDirection.length();

  const legGeometry = new THREE.BoxGeometry(0.105, legLength, 0.12);
  const legPositions = legGeometry.getAttribute('position');
  for (let index = 0; index < legPositions.count; index += 1) {
    if (legPositions.getY(index) < 0) {
      legPositions.setX(index, legPositions.getX(index) * 0.78);
      legPositions.setZ(index, legPositions.getZ(index) * 0.82);
    }
  }
  legPositions.needsUpdate = true;
  legGeometry.computeVertexNormals();
  const strut = new THREE.Mesh(legGeometry, materials.motorDark);
  strut.position.copy(upper).add(lower).multiplyScalar(0.5);
  strut.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), legDirection.normalize());
  strut.castShadow = true;

  const foot = new THREE.Mesh(new THREE.BoxGeometry(0.115, 0.055, 0.13), materials.bodyDark);
  foot.position.copy(lower);
  foot.position.y -= 0.02;
  foot.castShadow = true;
  group.add(strut, foot);
  return group;
}

function createStatusLight(position, direction, material, name) {
  const light = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.035, 0.045), material);
  light.name = name;
  light.position.copy(position);
  light.rotation.y = Math.atan2(direction.x, direction.z);
  return light;
}

export function createDrone(config) {
  const drone = new THREE.Group();
  drone.name = 'ProceduralQuadcopterV2';
  const materials = createMaterials(config);
  const { armRadius, armTubeLength, shoulderLength, motorHeight } = config.dimensions;
  const rotors = [];

  drone.add(createFuselage(config, materials));

  const shoulderRoots = [
    new THREE.Vector3(-0.72, 0.025, 0.5),
    new THREE.Vector3(0.72, 0.025, 0.5),
    new THREE.Vector3(0.72, 0.025, -0.5),
    new THREE.Vector3(-0.72, 0.025, -0.5),
  ];
  const directions = [
    new THREE.Vector3(-1, 0, 0.78).normalize(),
    new THREE.Vector3(1, 0, 0.78).normalize(),
    new THREE.Vector3(1, 0, -0.78).normalize(),
    new THREE.Vector3(-1, 0, -0.78).normalize(),
  ];
  const rotationDirections = [-1, 1, -1, 1];
  const motorPositions = [];

  shoulderRoots.forEach((root, index) => {
    const direction = directions[index];
    const shoulderEnd = root.clone().add(direction.clone().multiplyScalar(shoulderLength));
    shoulderEnd.y += 0.015;
    const shoulderNames = ['Shoulder_FL', 'Shoulder_FR', 'Shoulder_RR', 'Shoulder_RL'];
    drone.add(createShoulder(root, shoulderEnd, materials, shoulderNames[index]));

    const collarEnd = shoulderEnd.clone().add(direction.clone().multiplyScalar(0.14));
    const collar = cylinderBetween(shoulderEnd, collarEnd, 0.125, materials.bodyDark, 20);
    collar.name = 'ShoulderTubeCollar';
    drone.add(collar);

    const tubeStart = shoulderEnd.clone().add(direction.clone().multiplyScalar(0.13));
    const motorPosition = shoulderEnd.clone().add(direction.clone().multiplyScalar(armTubeLength + 0.02));
    const arm = cylinderBetween(tubeStart, motorPosition, armRadius, materials.carbon, 20);
    arm.name = `CarbonArm${index + 1}`;
    drone.add(arm);

    const motorMount = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.26, 0.1, 28), materials.bodyDark);
    motorMount.name = 'MotorMount';
    motorMount.position.copy(motorPosition);
    motorMount.position.y -= 0.02;
    motorMount.castShadow = true;
    drone.add(motorMount);

    const { assembly, rotor } = createMotorRotor(config, materials, rotationDirections[index]);
    assembly.name = `MotorAssembly${index + 1}`;
    assembly.position.copy(motorPosition);
    assembly.position.y += motorHeight * 0.26;
    drone.add(assembly);
    rotors.push(rotor);
    motorPositions.push(motorPosition.clone());

    const lightPosition = motorPosition.clone().add(direction.clone().multiplyScalar(0.06));
    lightPosition.y = -0.125;
    drone.add(createStatusLight(
      lightPosition,
      direction,
      materials.blueLight,
      'MotorStatusLight',
    ));

    drone.add(createLandingLeg(motorPosition, direction, materials));
  });

  drone.add(createGimbal(config, materials));
  drone.userData.rotors = rotors;
  drone.userData.motorPositions = motorPositions;
  return drone;
}
