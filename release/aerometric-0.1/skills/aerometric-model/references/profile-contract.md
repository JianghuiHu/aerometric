# Profile contract

A Profile has `id`, `version`, and `roles`. Each role maps to an ordered array of exact object-name candidates. Optional fields include `label`, `units`, `forwardAxis`, `capabilities`, and `metadata`.

Use the package JSON Schema as the source of truth. Do not advertise a capability unless all required objects and pivots exist and the control has been tested.

Native glTF nodes may use `extras.aerometric` with `profile`, `role`, `position`, and `editableColor`. Sidecar mappings take precedence over naming heuristics; explicit native extras take precedence over heuristics when no sidecar mapping exists.

