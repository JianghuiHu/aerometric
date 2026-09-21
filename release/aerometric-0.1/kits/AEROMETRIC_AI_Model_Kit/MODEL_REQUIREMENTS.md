# Model requirements

## Required for a declared control

- Every rotor is an independent node with its pivot on the physical motor axis.
- Gimbal yaw and pitch are separate nested nodes with correct pivots.
- Attachments declared as independently visible remain independently addressable.
- Parts declared as independently recolorable do not unintentionally share mutable material state.
- Every Profile role resolves to at least one real GLB node.
- The GLB parses and contains visible geometry.

## Recommended

- One glTF unit equals one meter.
- Controllable nodes use unit scale and avoid negative scale.
- Materials use glTF-compatible PBR properties and stable names.
- Delivery triangles remain below 100K unless the model documents why it needs more.
- Delivery GLB remains below 30 MB unless the package documents why it is larger.

Visual style is unrestricted. Gimbals, status lights, four rotors, and a particular naming scheme are optional unless the Profile declares the corresponding capability.

