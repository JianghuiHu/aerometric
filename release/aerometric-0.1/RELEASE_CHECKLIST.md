# AEROMETRIC 0.1 release checklist

## Complete

- [x] Model Standard 0.1
- [x] DroneProfile JSON Schema
- [x] Verified Quadrotor V3 Profile example
- [x] CLI Validator with success and failure tests
- [x] Installable `aerometric-model` Agent Skill
- [x] Standalone AI Model Kit ZIP
- [x] Contribution guide and CI workflow template
- [x] MIT license for software and documentation
- [x] Blender Helper 0.1 with semantic tagging, validation, Profile export, and GLB export
- [x] Blender Helper smoke-tested against the current Quadrotor V3 `.blend`
- [x] Web Validator 0.1 using the same validation rules as the CLI
- [x] Third-party GLB Profile mapping, extras embedding, and contribution checklist
- [x] Community Model Library index contract, validator, CI check, and Studio on-demand loader
- [x] Local Release 0.1 audit completed; see [RELEASE_AUDIT_0.1.md](RELEASE_AUDIT_0.1.md)
- [x] Local Git source boundary and separate public-deployment gate prepared
- [x] Source-only `main` pushed to GitHub with Quadrotor V3 excluded; source CI passed
- [x] Original Reference Drone 01 built from repository Blender script and licensed CC0-1.0
- [x] Reference Drone 01 validates with Level 1 Profile and Level 2 native extras
- [x] Community Library contains one licensed official model; local license and package gates pass
- [x] Reference Drone preparation branch CI and manual public-deployment gate pass on GitHub
- [x] Protected Vercel Preview loads the official model and passes Studio import/export browser dogfood

## Required before a public GitHub release

- [ ] Confirm the project name, repository owner, canonical URL, and copyright holder.
- [x] Add a redistributable preview and official model package after licensing is confirmed.
- [x] Keep `public/models/drone_v3.glb` outside the public package.
- [x] Deploy and verify Vercel Preview.
- [ ] Deploy and verify Production and the official domain.
- [ ] Create and verify the v0.1.0 GitHub Release after deployment checks.
- [x] Run source CI in the GitHub repository and check host-specific assumptions.

Do not publish Quadrotor V3 GLB, Blender source, textures, or renders. Their asset license remains unresolved and does not block the CC0 reference model release.
