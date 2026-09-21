# Acceptance checklist

- GLB opens without parser errors and contains visible geometry.
- Physical dimensions match the source asset.
- Controllable objects have stable semantic names or a valid Profile mapping.
- Four rotor pivots lie on their motor axes and rotate independently.
- Gimbal yaw and pitch rotate on the intended axes without rotating the body.
- Editable parts can change color independently; shared materials are isolated when needed.
- Hidden parts are absent after current-state export.
- Status emitters retain base color and emissive properties.
- Exported model excludes environment, camera, lights, rain, route, and page UI.
- Exported GLB is re-imported and the same checks pass.

