---
name: aerometric-model
description: Create, adapt, or review drone GLB assets for AEROMETRIC compatibility, including semantic hierarchy, pivots, materials, Profile mappings, export, and re-import validation. Use for AEROMETRIC model work; do not use for unrelated Three.js scenes or general mesh artistry.
---

# AEROMETRIC model

Preserve the authored drone's visual design while making its controllable semantics explicit.

The official Quadrotor V3 Profile demonstrates full role coverage. Treat its role mapping as a semantic example; other models do not need to copy its shape or materials. Reference Drone 01 is the lightweight validation fixture.

## Workflow

1. Inspect the real GLB hierarchy, meshes, materials, transforms, dimensions, pivots, and animations. Do not assume names match the standard.
2. Choose the lowest honest compatibility level: Generic GLB, sidecar Profile, or native node extras.
3. Keep rotor, gimbal, camera, editable parts, and light diffusers independently addressable. Fix pivots in the asset when control axes are wrong.
4. Preserve source dimensions and scale. Center only a preview wrapper and fit the camera.
5. Create or update the Profile using `references/profile-contract.md`.
6. Export only the model root and visible descendants. Exclude UI and scene systems.
7. Re-import the produced GLB and complete `references/acceptance-checklist.md`.

Prefer asset-side fixes for hierarchy, UV, pivots, topology, light geometry, and naming. Use runtime adapters for semantic mapping, material isolation, state, and export behavior.

When a requested feature cannot survive standard glTF—such as a custom shader controlled by time—state that limitation and keep the runtime configuration separate.

