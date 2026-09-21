import * as THREE from 'three';

function createBladeShape(radius, width) {
  const shape = new THREE.Shape();
  shape.moveTo(0.09, -width * 0.08);
  shape.bezierCurveTo(radius * 0.22, -width * 0.12, radius * 0.4, -width * 0.58, radius * 0.64, -width * 0.66);
  shape.bezierCurveTo(radius * 0.8, -width * 0.6, radius * 0.95, -width * 0.28, radius, -width * 0.055);
  shape.bezierCurveTo(radius, width * 0.025, radius * 0.97, width * 0.13, radius * 0.9, width * 0.14);
  shape.bezierCurveTo(radius * 0.68, width * 0.13, radius * 0.48, width * 0.3, radius * 0.28, width * 0.24);
  shape.bezierCurveTo(radius * 0.17, width * 0.2, radius * 0.11, width * 0.12, 0.09, width * 0.07);
  shape.closePath();
  return shape;
}

function createTipShape(radius, width) {
  const shape = new THREE.Shape();
  shape.moveTo(radius * 0.952, -width * 0.27);
  shape.bezierCurveTo(radius * 0.98, -width * 0.19, radius * 0.995, -width * 0.1, radius, -width * 0.05);
  shape.bezierCurveTo(radius, width * 0.025, radius * 0.98, width * 0.1, radius * 0.947, width * 0.11);
  shape.lineTo(radius * 0.952, -width * 0.27);
  shape.closePath();
  return shape;
}

function extrudeBlade(shape, thickness) {
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    steps: 1,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: thickness * 0.32,
    bevelThickness: thickness * 0.3,
  });
  geometry.rotateX(Math.PI / 2);
  geometry.computeVertexNormals();
  return geometry;
}

function createBlade(config, materials, mirrored) {
  const { rotorRadius, bladeWidth, bladeThickness } = config.dimensions;
  const bladeRoot = new THREE.Group();
  bladeRoot.rotation.y = mirrored ? Math.PI : 0;
  bladeRoot.rotation.x = mirrored ? -0.028 : 0.028;

  const blade = new THREE.Mesh(extrudeBlade(createBladeShape(rotorRadius, bladeWidth), bladeThickness), materials.propeller);
  blade.name = 'SweptPropellerBlade';
  blade.castShadow = true;
  bladeRoot.add(blade);

  const tip = new THREE.Mesh(extrudeBlade(createTipShape(rotorRadius, bladeWidth), bladeThickness * 0.72), materials.bladeTip);
  tip.name = 'BladeTipMarker';
  tip.position.y = 0.008;
  tip.castShadow = true;
  bladeRoot.add(tip);
  return bladeRoot;
}

export function createMotorRotor(config, materials, rotationDirection) {
  const assembly = new THREE.Group();
  const { motorRadius, motorHeight } = config.dimensions;

  const base = new THREE.Mesh(new THREE.CylinderGeometry(motorRadius * 0.96, motorRadius, motorHeight * 0.46, 32), materials.motorDark);
  base.name = 'MotorBase';
  base.position.y = -motorHeight * 0.25;
  base.castShadow = true;

  const ring = new THREE.Mesh(new THREE.CylinderGeometry(motorRadius * 0.98, motorRadius * 0.98, motorHeight * 0.22, 32), materials.motorSilver);
  ring.name = 'MotorMetalRing';
  ring.position.y = motorHeight * 0.09;
  ring.castShadow = true;

  const cap = new THREE.Mesh(new THREE.CylinderGeometry(motorRadius * 0.64, motorRadius * 0.86, motorHeight * 0.25, 32), materials.motorDark);
  cap.name = 'MotorTopCap';
  cap.position.y = motorHeight * 0.34;
  cap.castShadow = true;
  assembly.add(base, ring, cap);

  const rotor = new THREE.Group();
  rotor.name = rotationDirection > 0 ? 'RotorCW' : 'RotorCCW';
  rotor.position.y = motorHeight * 0.56;
  rotor.userData.rotationDirection = rotationDirection;

  const hub = new THREE.Mesh(new THREE.CylinderGeometry(motorRadius * 0.26, motorRadius * 0.39, 0.075, 28), materials.motorDark);
  hub.name = 'RotorHub';
  hub.castShadow = true;
  rotor.add(hub, createBlade(config, materials, false), createBlade(config, materials, true));
  assembly.add(rotor);
  return { assembly, rotor };
}
