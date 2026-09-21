# AEROMETRIC

Open Drone 3D Configurator & Model Standard. This workspace is a **local Release 0.1 candidate**, not a public deployment.

- [Release 0.1 package](release/aerometric-0.1/README.md)
- [AI Model Skill](release/aerometric-0.1/skills/aerometric-model/SKILL.md)
- [AI Model Kit ZIP](release/aerometric-0.1/artifacts/AEROMETRIC_AI_Model_Kit_0.1.zip)
- [Model Standard 0.1](release/aerometric-0.1/docs/model-standard.md)
- [Release audit and blockers](release/aerometric-0.1/RELEASE_AUDIT_0.1.md)

Run `npm ci`, `npm run test:source`, `npm run build`, and `npm run validate:release` from a source-only clone. Run the full `npm test` locally when the Quadrotor V3 asset is present. The Studio currently expects a local `public/models/drone_v3.glb`; that model is excluded from Git until its redistribution rights are confirmed. A repository clone without it can build the code but cannot display the built-in drone. Do not deploy the current Studio as a public site until a licensed model is supplied and the release checklist is cleared.

The root MIT license covers code and documentation only. Model files, Blender sources, textures, screenshots, and renders require separate permission; see [Model asset licensing](release/aerometric-0.1/MODEL_ASSET_LICENSE.md).

`npm run check:publish` is an intentionally failing public-deployment gate until the built-in model has a non-empty `public/models/LICENSE` and verified `public/models/asset-rights.json` (`author`, `source`, `license`, `redistributable: true`). Source checks and the deployment gate are separate; a successful build does not authorize distribution.
