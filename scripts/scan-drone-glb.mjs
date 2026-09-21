import fs from 'node:fs';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const input = process.argv[2] || 'public/models/drone_v3.glb';
const output = process.argv[3] || 'blender_drone/v3/platform/appearance-hierarchy.json';
const bytes = fs.readFileSync(input);
const gltf = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
const materialOwners = new Map();
const rows = [];

function walk(object, depth = 0, parent = null) {
  const materials = object.isMesh ? (Array.isArray(object.material) ? object.material : [object.material]) : [];
  const row = {
    depth,
    name: object.name || '(unnamed)',
    type: object.type,
    parent: parent?.name || null,
    visible: object.visible,
    materials: materials.map(m => m?.name || '(unnamed)'),
    geometry: object.isMesh ? {
      name: object.geometry.name || null,
      vertices: object.geometry.attributes.position?.count || 0,
      triangles: (object.geometry.index?.count || object.geometry.attributes.position?.count || 0) / 3,
      uv: Boolean(object.geometry.attributes.uv),
      uvCount: object.geometry.attributes.uv?.count || 0,
    } : null,
  };
  rows.push(row);
  for (const material of materials) {
    if (!materialOwners.has(material.uuid)) materialOwners.set(material.uuid, { name: material.name, owners: [] });
    materialOwners.get(material.uuid).owners.push(row.name);
  }
  for (const child of object.children) walk(child, depth + 1, object);
}
walk(gltf.scene);

const categories = {
  body: ['BODY', 'Body_Main', 'Body_FrontSection', 'Body_Bottom', 'Body_Side_L', 'Body_Side_R'],
  topCover: ['Body_TopCover'],
  arms: ['ARM_FL', 'ARM_FR', 'ARM_RL', 'ARM_RR'],
  rotors: ['ROTOR_FL', 'ROTOR_FR', 'ROTOR_RL', 'ROTOR_RR'],
  motors: ['MOTOR_FL', 'MOTOR_FR', 'MOTOR_RL', 'MOTOR_RR'],
  landingGear: ['LANDING_GEAR'],
  gimbal: ['GIMBAL_ROOT', 'Gimbal_Yaw', 'Gimbal_Pitch'],
  camera: ['Camera_Main'],
  lights: ['LIGHTS'],
};
const names = new Set(rows.map(row => row.name));
const report = {
  source: input,
  counts: {
    objects: rows.length,
    meshes: rows.filter(r => r.type === 'Mesh').length,
    triangles: rows.reduce((sum, r) => sum + (r.geometry?.triangles || 0), 0),
    uniqueMaterials: materialOwners.size,
    meshesWithUV: rows.filter(r => r.geometry?.uv).length,
  },
  categoryAvailability: Object.fromEntries(Object.entries(categories).map(([category, expected]) => [category, {
    expected,
    found: expected.filter(name => names.has(name)),
    missing: expected.filter(name => !names.has(name)),
    independentlyAddressable: expected.some(name => names.has(name)),
  }])),
  sharedMaterials: [...materialOwners.values()].map(entry => ({ ...entry, ownerCount: entry.owners.length })).sort((a, b) => b.ownerCount - a.ownerCount),
  bodyMainUV: rows.find(r => r.name === 'Body_Main')?.geometry || null,
  hierarchy: rows,
};
fs.mkdirSync(new URL('../', `file:///${output.replaceAll('\\', '/')}`).pathname, { recursive: true });
fs.writeFileSync(output, JSON.stringify(report, null, 2));
const textOutput = output.replace(/\.json$/i, '.txt');
const lines = [
  `SOURCE: ${input}`,
  `OBJECTS: ${report.counts.objects} | MESHES: ${report.counts.meshes} | TRIANGLES: ${report.counts.triangles} | MATERIALS: ${report.counts.uniqueMaterials} | MESHES_WITH_UV: ${report.counts.meshesWithUV}`,
  '',
  'COMPLETE OBJECT3D / MESH / MATERIAL HIERARCHY',
  ...rows.map(row => {
    const material = row.materials.length ? ` material=[${row.materials.join(', ')}]` : '';
    const geometry = row.geometry ? ` vertices=${row.geometry.vertices} triangles=${row.geometry.triangles} uv=${row.geometry.uv}` : '';
    return `${'  '.repeat(row.depth)}${row.name} <${row.type}>${material}${geometry}`;
  }),
  '',
  'SHARED MATERIAL OWNERS',
  ...report.sharedMaterials.map(material => `${material.name} (${material.ownerCount}): ${material.owners.join(', ')}`),
];
fs.writeFileSync(textOutput, `${lines.join('\n')}\n`);
console.log(JSON.stringify(report.counts));
console.log(report.sharedMaterials.map(m => `${m.name}: ${m.ownerCount}`).join('\n'));
