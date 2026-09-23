# Model Standard Overview

English | [简体中文](../zh-CN/model-standard-overview.md)

AEROMETRIC separates visual shape from control semantics. Compatible drones may look different, but expose predictable roles such as body, rotors, motors, gimbal axes, camera, landing gear, and status lights.

## Compatibility levels

| Level | Package | Available behavior |
| --- | --- | --- |
| 0 — Generic GLB | Valid `.glb` | View, camera, environment, PNG/JPG |
| 1 — Profile | GLB + `.aerometric.json` | Semantic parts, controls, materials, visibility groups |
| 2 — Native | GLB with AEROMETRIC glTF extras | Automatic semantic discovery without a sidecar mapping step |

## Core requirements

- Stable Object3D names or Profile role mappings.
- Rotor pivots at motor centers and declared rotation axes.
- Separate nodes for independently controlled gimbal axes and visible parts.
- Editable materials isolated where independent color control is required.
- Status lights represented as geometry with emissive-capable materials.
- Model packages with explicit license and redistribution metadata.

Machine-readable definitions remain canonical:

- [Full Model Standard 0.1](../../release/aerometric-0.1/docs/model-standard.md)
- [DroneProfile Schema](../../release/aerometric-0.1/schema/aerometric-profile.schema.json)
- [Model Library Schema](../../release/aerometric-0.1/schema/model-library.schema.json)
- [Validator](../../release/aerometric-0.1/validator/README.md)

Run `npm run validate:model -- <model-package>` for a model package, then use the release and Library gates before publication.
