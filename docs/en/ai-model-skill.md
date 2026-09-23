# AI Model Skill Usage

English | [简体中文](../zh-CN/ai-model-skill.md)

The AEROMETRIC Model Skill helps Codex or another compatible AI agent create and review controllable drone assets. It does not replace the Schema or validators.

## Workflow

1. Open or download the complete [`skills` folder](../../release/aerometric-0.1/skills/).
2. Give that folder to the AI agent without removing its references.
3. Ask the agent to read [`AI_START_HERE.md`](../../release/aerometric-0.1/skills/AI_START_HERE.md).
4. Describe the drone and required controls.
5. Require Profile, glTF extras, export, validator, and re-import checks.

Example request:

> Read `AI_START_HERE.md` and create an AEROMETRIC-compatible quadrotor with independent rotor pivots, a controllable gimbal, status lights, editable materials, and visibility groups. Validate and re-import the final GLB.

The authoritative skill entry is [`aerometric-model/SKILL.md`](../../release/aerometric-0.1/skills/aerometric-model/SKILL.md). The downloadable [AI Model Kit](../../release/aerometric-0.1/artifacts/AEROMETRIC_AI_Model_Kit_0.1.zip) packages the supporting references and examples.

Only use geometry, textures, and supporting assets whose origin and redistribution terms are known.
