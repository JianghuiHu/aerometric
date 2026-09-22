# AEROMETRIC

Open Drone 3D Configurator & Model Standard. The Studio is available at [aerometric.vercel.app](https://aerometric.vercel.app).

- [Release 0.1 package](release/aerometric-0.1/README.md)
- [AI Model Skill](release/aerometric-0.1/skills/aerometric-model/SKILL.md)
- [AI Model Kit ZIP](release/aerometric-0.1/artifacts/AEROMETRIC_AI_Model_Kit_0.1.zip)
- [CC0 Reference Drone 01 ZIP](release/aerometric-0.1/artifacts/AEROMETRIC_Reference_Drone_01_0.1.zip)
- [Model Standard 0.1](release/aerometric-0.1/docs/model-standard.md)
- [Release audit and blockers](release/aerometric-0.1/RELEASE_AUDIT_0.1.md)

Run `npm ci`, `npm run test:source`, `npm run build`, `npm run validate:release`, and `npm run check:publish`. Studio includes the [CC0 Reference Drone 01](release/aerometric-0.1/models/aerometric-reference-drone-01/README.md); if a built-in asset is unavailable, Studio opens with an upload / Community Library empty state. Quadrotor V3 remains excluded while its redistribution rights are unconfirmed.

The root MIT license covers code, documentation, Skill, Schema, Validator, and the Blender generator. The Reference Drone 01 model, Profile, and preview use CC0-1.0. Quadrotor V3 and its sources remain outside this authorization; see [Model asset licensing](release/aerometric-0.1/MODEL_ASSET_LICENSE.md).

`npm run check:publish` requires the official reference model in `public/models/index.json`, a package `LICENSE`, explicit `license` and `redistributable: true` metadata, a passing Level 1 validation, and no unindexed public GLB. Source checks and the deployment gate are separate; a successful build does not authorize distribution.
