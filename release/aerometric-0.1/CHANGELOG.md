# Changelog

## 0.1.0 — local release candidate

- Defined Generic, Profile, and Native compatibility levels.
- Added AEROMETRIC Model Standard 0.1 and DroneProfile JSON Schema.
- Added a verified Quadrotor V3 Level 1 Profile example.
- Added CLI validation for GLB parsing, role mappings, capability claims, rotor uniqueness, package files, file size, and triangle recommendations.
- Added an installable Agent Skill and standalone AI Model Kit.
- Added a model-validation GitHub Actions workflow template.
- Added Blender Helper 0.1 for semantic tagging, hierarchy validation, Profile export, and model-root GLB export.
- Verified Helper output as Native Level 2 through embedded `extras.aerometric` and as Profile Level 1 with a sidecar file.
- Added a client-side Web Validator sharing its rule implementation with the CLI.
- Added Studio mapping for third-party GLB object roles, Profile download, and Level 2 extras embedding.
- Added Profile-driven runtime controllers so mapped rotor, gimbal, appearance, and visibility controls activate immediately and survive a Level 2 GLB export/import round trip.
- Added the community model contribution checklist and pull request template.
- Added a metadata-first Community Model Library contract, local-path and license validation, CI catalog checks, and on-demand Studio loading.
- Added the original CC0 Reference Drone 01 as the first public Community Model Library entry, with a Level 1 Profile, Level 2 glTF extras, and a reproducible model-package ZIP.
- Added a Studio empty state for installations without a built-in model and verified the Reference Drone's color, visibility, animation, environment, image export, and GLB round trip in a protected Vercel Preview.
