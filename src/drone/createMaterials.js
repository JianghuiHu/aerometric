import * as THREE from 'three';

function createCarbonTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 96;
  canvas.height = 96;
  const context = canvas.getContext('2d');

  context.fillStyle = '#101315';
  context.fillRect(0, 0, 96, 96);
  context.lineWidth = 1;

  for (let offset = -96; offset < 192; offset += 6) {
    context.strokeStyle = 'rgba(112, 124, 132, 0.10)';
    context.beginPath();
    context.moveTo(offset, 0);
    context.lineTo(offset + 96, 96);
    context.stroke();

    context.strokeStyle = 'rgba(0, 0, 0, 0.16)';
    context.beginPath();
    context.moveTo(offset + 3, 0);
    context.lineTo(offset + 99, 96);
    context.stroke();
  }

  for (let offset = 0; offset < 192; offset += 12) {
    context.strokeStyle = 'rgba(105, 116, 123, 0.055)';
    context.beginPath();
    context.moveTo(offset, 0);
    context.lineTo(offset - 96, 96);
    context.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(5, 2);
  texture.anisotropy = 4;
  return texture;
}

export function createMaterials(config) {
  const { colors, materials } = config;
  const carbonTexture = createCarbonTexture();

  return {
    fuselage: new THREE.MeshPhysicalMaterial({
      color: colors.body,
      metalness: materials.bodyMetalness,
      roughness: materials.bodyRoughness,
      clearcoat: 0.22,
      clearcoatRoughness: 0.34,
    }),
    topCover: new THREE.MeshStandardMaterial({
      color: colors.topCover,
      metalness: 0.12,
      roughness: 0.56,
    }),
    bodyDark: new THREE.MeshStandardMaterial({ color: colors.bodyDark, metalness: 0.58, roughness: 0.38 }),
    sidePanel: new THREE.MeshStandardMaterial({ color: colors.sidePanel, metalness: 0.52, roughness: 0.4 }),
    seam: new THREE.MeshStandardMaterial({ color: colors.seam, metalness: 0.35, roughness: 0.48 }),
    carbon: new THREE.MeshStandardMaterial({
      color: colors.carbon,
      map: carbonTexture,
      metalness: materials.carbonMetalness,
      roughness: materials.carbonRoughness,
    }),
    motorSilver: new THREE.MeshStandardMaterial({ color: colors.motorSilver, metalness: 0.85, roughness: 0.24 }),
    motorDark: new THREE.MeshStandardMaterial({ color: colors.motorDark, metalness: 0.78, roughness: 0.26 }),
    propeller: new THREE.MeshStandardMaterial({ color: colors.propeller, metalness: 0.14, roughness: 0.36 }),
    bladeTip: new THREE.MeshStandardMaterial({ color: 0x9ba4aa, metalness: 0.86, roughness: 0.24 }),
    camera: new THREE.MeshStandardMaterial({ color: colors.camera, metalness: 0.78, roughness: 0.25 }),
    lens: new THREE.MeshPhysicalMaterial({
      color: colors.lens,
      metalness: 0.08,
      roughness: 0.06,
      transmission: 0.12,
      thickness: 0.16,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
    }),
    blueLight: new THREE.MeshStandardMaterial({
      color: colors.techBlue,
      emissive: colors.techBlue,
      emissiveIntensity: 1.35,
      toneMapped: true,
    }),
    redLight: new THREE.MeshStandardMaterial({
      color: colors.warningRed,
      emissive: colors.warningRed,
      emissiveIntensity: 0.8,
      toneMapped: true,
    }),
  };
}
