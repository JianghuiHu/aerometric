# Material guide

- Use glTF-compatible metallic-roughness materials.
- Give editable materials stable semantic names.
- Keep dark light recesses separate from emissive diffusers.
- Status diffusers use base color plus emissive color; do not make the whole motor housing emissive.
- Confirm UVs before declaring texture support.
- Clone shared materials only when parts require independent runtime editing, and bind each clone back to its mesh.
- Dispose replaced runtime textures and materials.

Do not repair missing UVs with complex runtime projection code. Report the asset problem and correct it in Blender or the source DCC.

