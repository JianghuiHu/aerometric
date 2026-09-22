# AEROMETRIC

Open Drone 3D Configurator & Model Standard. The Studio is available at [aerometric.vercel.app](https://aerometric.vercel.app).

- [Release 0.1 package](release/aerometric-0.1/README.md)
- [AI Model Skill](release/aerometric-0.1/skills/aerometric-model/SKILL.md)
- [AI Model Kit ZIP](release/aerometric-0.1/artifacts/AEROMETRIC_AI_Model_Kit_0.1.zip)
- [CC0 Reference Drone 01 ZIP](release/aerometric-0.1/artifacts/AEROMETRIC_Reference_Drone_01_0.1.zip)
- [Model Standard 0.1](release/aerometric-0.1/docs/model-standard.md)
- [Release audit and blockers](release/aerometric-0.1/RELEASE_AUDIT_0.1.md)

Run `npm ci`, `npm run test:source`, `npm run build`, `npm run validate:release`, and `npm run check:publish`. Studio loads the existing [CC0 Quadrotor V3](release/aerometric-0.1/models/quadrotor-v3/README.md) by default; if it is unavailable, Studio opens with an upload / Community Library empty state. [CC0 Reference Drone 01](release/aerometric-0.1/models/aerometric-reference-drone-01/README.md) remains the lightweight validation model in the Library.

The root MIT license covers code, documentation, Skill, Schema, Validator, and the Blender generator. Each official model package, its Profile, and its preview use CC0-1.0; see [Model asset licensing](release/aerometric-0.1/MODEL_ASSET_LICENSE.md).

`npm run check:publish` requires both official models in `public/models/index.json`, package `LICENSE` files, explicit `license` and `redistributable: true` metadata, valid Profile and native extras, and no unindexed public GLB. Source checks and the deployment gate are separate; a successful build alone does not authorize distribution.
