# AEROMETRIC 0.1

Open Drone 3D Configurator & Model Standard.

AEROMETRIC 0.1 defines a small, tool-independent contract for controllable drone GLB assets. The current Studio implementation can inspect generic GLB files, recognize compatible models, configure native models, and export the evaluated result.

## Start here

- Studio users: run the application from the repository root with `npm ci` and `npm run dev`. Studio includes the CC0 Reference Drone 01; if it is unavailable, Studio opens an upload / Community Library empty state.
- Model authors: read [Model Standard 0.1](docs/model-standard.md).
- AI-assisted model authors: start with [AI_START_HERE.md](skills/AI_START_HERE.md). To install the Codex skill, copy the entire [`aerometric-model`](skills/aerometric-model/) folder into your Codex skills directory (`$CODEX_HOME/skills`, normally `~/.codex/skills`), then start a new Codex task.
- Integrators: validate a sidecar profile against [the JSON Schema](schema/aerometric-profile.schema.json) or run the [CLI Validator](validator/README.md).
- Browser users: build or host the local-only [Web Validator](web-validator/README.md).
- Third-party model authors: use Studio mapping and review the [mapping guide](docs/model-mapping.md).
- Community maintainers: review the metadata-only [model library contract](docs/model-library.md).
- Release users: download `artifacts/AEROMETRIC_AI_Model_Kit_0.1.zip` or `artifacts/AEROMETRIC_Blender_Helper_0.1.zip` after running the corresponding build command from the Studio repository.
- Blender authors: install [AEROMETRIC Blender Helper](blender/addon/aerometric_helper/README.md) to tag, validate, and export a controllable asset.

## Compatibility levels

| Level | Input | Guaranteed Studio features |
| --- | --- | --- |
| 0 — Generic GLB | Valid `.glb` | View, Orbit, environment, camera, PNG/JPG, basic GLB export |
| 1 — Profile | GLB + `.aerometric.json` | Semantic parts and declared controls |
| 2 — Native | GLB with `aerometric` node extras | Automatic role discovery without a sidecar mapping |

The browser keeps imported geometry, node transforms, scale, and physical dimensions unchanged. Preview centering and camera fitting happen outside the imported model root.

## 0.1 package scope

This package contains the standard, profile schema, a Quadrotor V3 Profile example without its restricted binary, contribution rules, an installable Agent Skill, the CLI Validator, Blender Helper 0.1, and [CC0 Reference Drone 01](models/aerometric-reference-drone-01/README.md).

```text
node validator/src/cli.mjs ./models/my-drone
node validator/src/cli.mjs ./model.glb ./model.aerometric.json --json
```

## Licensing

Source code, Skill, Schema, Validator, and Blender generator are MIT licensed. Reference Drone 01 assets are CC0-1.0; Quadrotor V3 assets remain unlicensed for redistribution. See [MODEL_ASSET_LICENSE.md](MODEL_ASSET_LICENSE.md).
