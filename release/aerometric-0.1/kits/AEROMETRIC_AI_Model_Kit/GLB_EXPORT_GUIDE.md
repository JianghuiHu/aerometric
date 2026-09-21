# GLB export guide

Export glTF 2.0 binary and preserve real dimensions, node hierarchy, pivots, PBR materials, normals, required UVs, and stable names.

For current-state export:

- Serialize the evaluated model root, not the originally loaded file.
- Include current material color, emissive values, maps, transforms, and portable animation clips.
- Exclude hidden parts from the exported hierarchy.
- Exclude environment, camera, lighting, rain, flight routes, and UI.
- Treat custom shaders, controller state, and time uniforms as runtime configuration unless converted to portable mesh animation.

Always reload the generated GLB and verify visible parts, materials, pivots, animations, dimensions, and exclusions.

