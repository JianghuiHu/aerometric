# Model structure

Use a single semantic drone root. `DRONE_ROOT` is the recommended name, but a Level 1 Profile may map another stable name.

```text
DRONE_ROOT
├── body and editable appearance parts
├── rotor nodes with independent pivots
├── landing gear or other visibility groups
├── gimbal yaw
│   └── gimbal pitch
│       └── camera
└── optional status-light diffusers
```

The four canonical rotor roles are `rotor.frontLeft`, `rotor.frontRight`, `rotor.rearLeft`, and `rotor.rearRight`. Status lights use `light.*` roles. Candidate arrays in the Profile are ordered exact object names.

Environment, camera, page UI, weather, flight routes, and runtime shader effects do not belong under the exported drone root.

