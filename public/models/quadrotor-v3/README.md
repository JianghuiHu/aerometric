# Quadrotor V3

Official AEROMETRIC default and full-feature drone model.

Asset License: CC0 1.0 Universal (`CC0-1.0`). The accompanying [LICENSE](LICENSE) covers `model.glb`, `preview.webp`, and this model's DroneProfile/metadata. Attribution is not required. Repository code, Skill, Schema, Validator, and Blender scripts remain MIT licensed.

The model is the previously authored Quadrotor V3, not a regenerated substitute. `scripts/build-v3-official.mjs` takes the authorized original GLB, verifies its SHA-256, preserves its geometry binary chunk byte-for-byte, and adds semantic glTF extras to the JSON chunk. The original contains no embedded image textures; its materials and geometry were authored for this project. The preview was rendered from the resulting model in Studio.

The sidecar DroneProfile supplies body, top cover, four arms/motors/rotors, landing gear, gimbal yaw/pitch, camera, six status lights, color groups, visibility groups, rotor axes/directions, and gimbal limits. The GLB also validates as Native Level 2 through glTF extras. Studio's status field, sky, rain, camera, and lighting remain runtime scene systems rather than part of the model GLB.

Asset metrics: 177 Mesh objects, 79,708 source triangles, 11 source materials, and no embedded images. The model is not a dimensional engineering drawing.
