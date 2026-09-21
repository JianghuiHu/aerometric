# Third-party model mapping

Studio accepts an ordinary GLB as Level 0 without changing its authored geometry, dimensions, transforms, or scale. Open the model menu and choose **Configure Model** to create a Level 1 sidecar Profile.

## Required quadrotor roles

- `root`
- `body`
- `rotor.frontLeft`, `rotor.frontRight`, `rotor.rearLeft`, `rotor.rearRight`
- `gimbal.yaw`, `gimbal.pitch`
- `camera`

Automatic suggestions only match object names. They are a starting point, not proof that pivots, axes, parenting, or materials are correct. Review every selected object before saving.

Saving downloads `<model>.aerometric.json` and adds `userData.aerometric` metadata to current runtime objects. **Export Current GLB** serializes those values as glTF extras, allowing a later import to detect Level 2 semantics.

After saving, Studio immediately rebuilds its controller and appearance adapter from the Profile. Supported mapped controls therefore work in the same session. Exported Level 2 extras also restore rotor, gimbal, color, and visibility addressing when the GLB is imported again without its sidecar Profile.

Mapping does not repair authored geometry. Rotor and gimbal motion is only correct when the selected objects already have usable local pivots, axes, and parent-child relationships. Status lights and the status field remain disabled unless the asset truthfully declares and supplies those capabilities.
