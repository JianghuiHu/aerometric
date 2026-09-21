# AEROMETRIC Model Standard 0.1

## Purpose

This standard defines the minimum semantics needed to view and control a drone asset across Blender, glTF/GLB, and AEROMETRIC Studio. It specifies structure and behavior, not visual style.

## Coordinate and scale rules

- Deliver glTF 2.0 binary (`.glb`).
- Treat one glTF unit as one meter.
- Preserve physical dimensions and authored node transforms.
- Avoid negative scale. Prefer unit scale on controllable nodes.
- Declare the authored forward axis in the Profile when it is not evident from the asset.
- A viewer may center an outer preview wrapper and fit a camera. It must not mutate the imported asset scale to make it look convenient.

## Compatibility levels

### Level 0 — Generic GLB

A valid GLB with visible geometry. It can be viewed and exported but makes no control promises.

### Level 1 — Profile

A Level 0 GLB plus a sidecar JSON file conforming to `aerometric-profile.schema.json`. Profile roles map semantic names to ordered object-name candidates.

### Level 2 — Native

A Level 0 GLB whose nodes use glTF `extras.aerometric` metadata. A native root declares a profile id; controllable nodes declare roles and optional positions.

Example node extras:

```json
{
  "aerometric": {
    "profile": "aerometric.quadrotor-v3",
    "role": "rotor",
    "position": "front-left",
    "editableColor": false
  }
}
```

## Canonical roles

Required for a controllable quadrotor:

- `root`
- `body`
- `rotor.frontLeft`, `rotor.frontRight`, `rotor.rearLeft`, `rotor.rearRight`
- `gimbal.yaw`, `gimbal.pitch`
- `camera`

Recommended appearance roles:

- `topCover`, `arms`, `motors`, `landingGear`, `gimbal`
- `light.frontLeft`, `light.frontRight`
- `light.motorFrontLeft`, `light.motorFrontRight`, `light.motorRearLeft`, `light.motorRearRight`

Roles may map to multiple objects. Candidate arrays are ordered from preferred exact name to fallback name.

## Hierarchy and pivots

- Use one semantic drone root, conventionally `DRONE_ROOT`.
- Rotor nodes remain separate and pivot at the corresponding motor axis.
- Gimbal pitch is a descendant of gimbal yaw; the camera is a descendant of pitch.
- Parts that need independent color or visibility remain independently addressable.
- Status-light diffusers remain separate from dark recess or housing geometry.
- Helper, environment, camera, lighting, status-field, and route nodes stay outside the exported model root.

## Materials

- Use glTF-compatible PBR materials.
- Give editable materials stable names.
- Do not rely on names such as `Material.001`.
- A runtime may clone materials for independent editing. The cloned material must be rebound to the mesh before export.
- Status emitters use emissive properties; surrounding housings remain non-emissive.

## Animation

Portable animation clips may include rotor rotation and a mesh-based status-field loop. Custom shader uniforms and controller code are runtime behavior and are not portable glTF animation.

## Export acceptance

- Export only the model root and visible descendants.
- Preserve current material color, emissive color, emissive intensity, maps, dimensions, and node transforms.
- Exclude invisible parts instead of depending on a non-standard visibility property.
- Exclude environment, rain, route, camera, lights, page UI, and runtime-only status-field nodes unless a portable mesh animation was deliberately baked for export.
- Re-import the exported GLB and verify the result; a successful exporter callback alone is insufficient.

