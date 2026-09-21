import * as THREE from 'three';

function createSectionProfile(station) {
  const topFlat = station.topFlat ?? 0.54;
  const shoulderCut = station.shoulderCut ?? 0.88;
  const bottomCut = station.bottomCut ?? 0.7;
  const bottomFlat = station.bottomFlat ?? 0.38;
  return [
    [-topFlat, 0.5], [topFlat, 0.5],
    [shoulderCut, 0.34], [1, 0.12], [0.98, -0.14],
    [bottomCut, -0.36], [bottomFlat, -0.48],
    [-bottomFlat, -0.48], [-bottomCut, -0.36],
    [-0.98, -0.14], [-1, 0.12], [-shoulderCut, 0.34],
  ];
}

export function createLoftGeometry(stations) {
  const vertices = [];
  const indices = [];
  const profiles = stations.map(createSectionProfile);
  const ringSize = profiles[0].length;

  // Each longitudinal face owns its vertices. Adjacent faces no longer share
  // normals, preserving the designed crease instead of smoothing into a capsule.
  for (let edgeIndex = 0; edgeIndex < ringSize; edgeIndex += 1) {
    const nextEdge = (edgeIndex + 1) % ringSize;
    const stripStart = vertices.length / 3;
    stations.forEach((station, stationIndex) => {
      const edgeStart = profiles[stationIndex][edgeIndex];
      const edgeEnd = profiles[stationIndex][nextEdge];
      vertices.push(
        edgeStart[0] * station.width * 0.5,
        station.y + edgeStart[1] * station.height,
        station.z,
        edgeEnd[0] * station.width * 0.5,
        station.y + edgeEnd[1] * station.height,
        station.z,
      );
    });

    for (let stationIndex = 0; stationIndex < stations.length - 1; stationIndex += 1) {
      const a = stripStart + stationIndex * 2;
      const b = a + 1;
      const c = a + 2;
      const d = a + 3;
      indices.push(a, c, b, b, c, d);
    }
  }

  function addCap(station, profile, reverse) {
    const center = vertices.length / 3;
    vertices.push(0, station.y, station.z);
    const ringStart = vertices.length / 3;
    profile.forEach(([xFactor, yFactor]) => {
      vertices.push(xFactor * station.width * 0.5, station.y + yFactor * station.height, station.z);
    });
    for (let index = 0; index < ringSize; index += 1) {
      const next = (index + 1) % ringSize;
      if (reverse) indices.push(center, ringStart + next, ringStart + index);
      else indices.push(center, ringStart + index, ringStart + next);
    }
  }

  addCap(stations[0], profiles[0], false);
  addCap(stations.at(-1), profiles.at(-1), true);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

export function cylinderBetween(start, end, radius, material, radialSegments = 18) {
  const direction = new THREE.Vector3().subVectors(end, start);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, direction.length(), radialSegments), material);
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function createRoundedRectShape(width, height, radius) {
  const shape = new THREE.Shape();
  const halfWidth = width * 0.5;
  const halfHeight = height * 0.5;
  shape.moveTo(-halfWidth + radius, -halfHeight);
  shape.lineTo(halfWidth - radius, -halfHeight);
  shape.quadraticCurveTo(halfWidth, -halfHeight, halfWidth, -halfHeight + radius);
  shape.lineTo(halfWidth, halfHeight - radius);
  shape.quadraticCurveTo(halfWidth, halfHeight, halfWidth - radius, halfHeight);
  shape.lineTo(-halfWidth + radius, halfHeight);
  shape.quadraticCurveTo(-halfWidth, halfHeight, -halfWidth, halfHeight - radius);
  shape.lineTo(-halfWidth, -halfHeight + radius);
  shape.quadraticCurveTo(-halfWidth, -halfHeight, -halfWidth + radius, -halfHeight);
  return shape;
}
