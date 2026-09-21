import * as THREE from 'three';
import { createLoftGeometry } from './geometryUtils.js';

function createTopCover(material) {
  const shape = new THREE.Shape();
  shape.moveTo(-0.36, -0.95);
  shape.lineTo(0.36, -0.95);
  shape.lineTo(0.48, -0.82);
  shape.lineTo(0.5, 0.72);
  shape.lineTo(0.39, 0.91);
  shape.lineTo(-0.39, 0.91);
  shape.lineTo(-0.5, 0.72);
  shape.lineTo(-0.48, -0.82);
  shape.closePath();

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.032,
    steps: 1,
    bevelEnabled: false,
  });
  geometry.rotateX(Math.PI / 2);
  geometry.translate(0, 0.355, -0.12);

  const cover = new THREE.Mesh(geometry, material);
  cover.name = 'TopCover';
  cover.castShadow = true;
  return cover;
}

function createSideSeam(side, material) {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(side * 0.77, 0.13, -0.72),
    new THREE.Vector3(side * 0.92, 0.1, -0.12),
    new THREE.Vector3(side * 0.78, 0.02, 0.62),
    new THREE.Vector3(side * 0.55, -0.07, 1.12),
  ]);
  const seam = new THREE.Mesh(new THREE.TubeGeometry(curve, 30, 0.012, 6, false), material);
  seam.name = side > 0 ? 'RightBodySeam' : 'LeftBodySeam';
  return seam;
}

function createSidePanel(side, material) {
  const panelStations = [
    { z: -0.92, x: 0.72, top: 0.015, bottom: -0.105 },
    { z: -0.3, x: 0.82, top: 0.005, bottom: -0.125 },
    { z: 0.42, x: 0.835, top: -0.02, bottom: -0.145 },
    { z: 1.06, x: 0.79, top: -0.075, bottom: -0.17 },
  ];
  const vertices = [];
  panelStations.forEach((station) => {
    vertices.push(side * station.x, station.top, station.z, side * station.x, station.bottom, station.z);
  });

  const indices = [];
  for (let index = 0; index < panelStations.length - 1; index += 1) {
    const a = index * 2;
    const b = a + 1;
    const c = a + 2;
    const d = a + 3;
    if (side > 0) indices.push(a, c, b, b, c, d);
    else indices.push(a, b, c, b, d, c);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const panel = new THREE.Mesh(geometry, material);
  panel.name = side > 0 ? 'RightSidePanel' : 'LeftSidePanel';
  panel.castShadow = true;
  return panel;
}

function createBottomPanel(material) {
  const shape = new THREE.Shape();
  shape.moveTo(-0.34, -0.9);
  shape.lineTo(0.34, -0.9);
  shape.lineTo(0.5, -0.64);
  shape.lineTo(0.52, 0.62);
  shape.lineTo(0.4, 1.04);
  shape.lineTo(-0.4, 1.04);
  shape.lineTo(-0.52, 0.62);
  shape.lineTo(-0.5, -0.64);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.025, bevelEnabled: false });
  geometry.rotateX(Math.PI / 2);
  geometry.translate(0, -0.215, 0);
  const panel = new THREE.Mesh(geometry, material);
  panel.name = 'BottomCutPanel';
  panel.castShadow = true;
  return panel;
}

function addVents(group, materials) {
  for (const side of [-1, 1]) {
    for (let index = 0; index < 4; index += 1) {
      const vent = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.095, 0.038), materials.seam);
      vent.name = 'VentSlot';
      vent.position.set(side * 0.842, 0.05, 0.35 + index * 0.075);
      group.add(vent);
    }
  }
}

function addStatusDetails(group, materials) {
  for (const side of [-1, 1]) {
    const noseLight = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.038, 0.026), materials.blueLight);
    noseLight.name = 'NoseStatusLight';
    noseLight.position.set(side * 0.32, -0.205, 1.825);
    noseLight.rotation.z = side * -0.12;
    group.add(noseLight);
  }

  const intake = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.105, 0.028), materials.seam);
  intake.name = 'FrontIntakePanel';
  intake.position.set(0, -0.205, 1.827);
  group.add(intake);

  const topStatus = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.018, 0.045), materials.blueLight);
  topStatus.name = 'TopStatusIndicator';
  topStatus.position.set(0, 0.373, -0.83);
  group.add(topStatus);
}

export function createFuselage(config, materials) {
  const group = new THREE.Group();
  group.name = 'FuselageAssembly';

  const main = new THREE.Mesh(createLoftGeometry(config.fuselage.mainStations), materials.fuselage);
  main.name = 'MainFuselage';
  main.castShadow = true;
  main.receiveShadow = true;

  const nose = new THREE.Mesh(createLoftGeometry(config.fuselage.noseStations), materials.bodyDark);
  nose.name = 'FrontNose';
  nose.castShadow = true;

  const rear = new THREE.Mesh(createLoftGeometry(config.fuselage.rearStations), materials.bodyDark);
  rear.name = 'RearPanel';
  rear.castShadow = true;

  group.add(main, nose, rear, createTopCover(materials.topCover), createBottomPanel(materials.sidePanel));
  group.add(createSidePanel(-1, materials.sidePanel), createSidePanel(1, materials.sidePanel));
  addVents(group, materials);
  addStatusDetails(group, materials);

  const rearInset = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.07, 0.025), materials.seam);
  rearInset.name = 'RearServicePanel';
  rearInset.position.set(0, 0.02, -1.725);
  group.add(rearInset);
  return group;
}
